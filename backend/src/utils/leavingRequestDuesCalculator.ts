import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const calculatePendingDues = async (
  memberId: string,
  requestedLeaveDate: Date
) => {
  const currentDate = new Date();

  // Calculate which months need to be checked for pending payments
  const monthsToCheck = [];

  const startYear = currentDate.getFullYear();
  const startMonth = currentDate.getMonth() + 1;
  const endYear = requestedLeaveDate.getFullYear();
  const endMonth = requestedLeaveDate.getMonth() + 1;

  let checkYear = startYear;
  let checkMonth = startMonth;

  while (
    checkYear < endYear ||
    (checkYear === endYear && checkMonth <= endMonth)
  ) {
    monthsToCheck.push({ month: checkMonth, year: checkYear });

    checkMonth++;
    if (checkMonth > 12) {
      checkMonth = 1;
      checkYear++;
    }
  }

  // Find all pending/overdue payments for these months
  const pendingPayments = await prisma.payment.findMany({
    where: {
      memberId,
      OR: monthsToCheck.map(({ month, year }) => ({
        month,
        year,
        paymentStatus: {
          in: ["PENDING", "OVERDUE"],
        },
      })),
    },
    select: {
      id: true,
      month: true,
      year: true,
      amount: true,
      paymentStatus: true,
      dueDate: true,
      overdueDate: true,
    },
  });

  const totalPendingDues = pendingPayments.reduce((total, payment) => {
    return total + payment.amount;
  }, 0);

  return {
    totalDues: totalPendingDues,
    pendingPayments,
    monthsChecked: monthsToCheck,
  };
};

export const updateLeavingRequestPendingDues = async () => {
  try {
    // Find all leaving requests with PENDING status
    const pendingLeavingRequests = await prisma.leavingRequest.findMany({
      where: {
        status: 'PENDING'
      },
      select: {
        id: true,
        memberId: true,
        requestedLeaveDate: true,
        pendingDues: true,
        member: {
          select: {
            id: true,
            name: true,
            memberId: true
          }
        }
      }
    });

    if (pendingLeavingRequests.length === 0) {
      return { updatedRequests: 0, details: [] };
    }

    const updateResults = [];

    for (const leavingRequest of pendingLeavingRequests) {
      try {
        // Recalculate pending dues for this leaving request
        const duesCalculation = await calculatePendingDues(
          leavingRequest.memberId,
          leavingRequest.requestedLeaveDate
        );

        const newPendingDues = duesCalculation.totalDues > 0 ? duesCalculation.totalDues : null;
        
        // Only update if the dues have changed
        if (newPendingDues !== leavingRequest.pendingDues) {
          await prisma.leavingRequest.update({
            where: { id: leavingRequest.id },
            data: { pendingDues: newPendingDues }
          });

          updateResults.push({
            leavingRequestId: leavingRequest.id,
            memberName: leavingRequest.member.name,
            memberId: leavingRequest.member.memberId,
            previousDues: leavingRequest.pendingDues,
            updatedDues: newPendingDues,
            changeAmount: (newPendingDues || 0) - (leavingRequest.pendingDues || 0)
          });
        }
      } catch (error) {
        console.error(`Failed to update dues for leaving request ${leavingRequest.id}:`, error);
      }
    }

    console.log(`Updated pending dues for ${updateResults.length} leaving requests out of ${pendingLeavingRequests.length} pending requests`);

    return {
      updatedRequests: updateResults.length,
      totalPendingRequests: pendingLeavingRequests.length,
      details: updateResults
    };

  } catch (error) {
    console.error('Error updating leaving request pending dues:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};