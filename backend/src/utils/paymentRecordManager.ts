import prisma from "../config/prisma";

// Update payment status to OVERDUE for payments past their overdue date
export const updateOverduePayments = async (): Promise<{ updatedCount: number }> => {
  const now = new Date();
  
  const result = await prisma.payment.updateMany({
    where: {
      approvalStatus: 'PENDING',
      paymentStatus: 'PENDING',
      overdueDate: {
        lt: now, // overdue date is in the past
      },
    },
    data: {
      paymentStatus: 'OVERDUE',
    },
  });

  return { updatedCount: result.count };
};

// Utility function to calculate next billing cycle month/year
export const getNextBillingCycle = (currentMonth: number, currentYear: number): { month: number; year: number } => {
  let nextMonth = currentMonth + 1;
  let nextYear = currentYear;
  
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }
  
  return { month: nextMonth, year: nextYear };
};
