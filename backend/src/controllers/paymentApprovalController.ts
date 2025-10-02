import { Response } from "express";
import prisma from "../config/prisma";
import { ApiResponse } from "../types/response";
import {
  ApproveRejectPaymentRequest,
} from "../types/request";
import { AuthenticatedRequest } from "../middlewares/auth";

// Get all PG members current month payment data with filters
export const getMembersPaymentData = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      } as ApiResponse<null>);
      return;
    }

    // Get admin details to know their pgType
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { pgType: true },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      } as ApiResponse<null>);
      return;
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get filter parameters from query
    const search = req.query.search as string;
    const rentType = req.query.rentType as string;
    const paymentStatus = req.query.paymentStatus as string;
    const approvalStatus = req.query.approvalStatus as string;

    // Get sorting parameters
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    // Parse comma-separated values for multi-select filters
    const parseMultipleValues = (param: string | undefined): string[] => {
      if (!param) return [];
      return param
        .split(",")
        .map((val) => decodeURIComponent(val.trim()))
        .filter((val) => val.length > 0);
    };

    const pgLocations = parseMultipleValues(req.query.pgLocation as string);

    // Get month and year filters (default to current month/year)
    const now = new Date();
    const requestedMonth =
      parseInt(req.query.month as string) || now.getMonth() + 1;
    const requestedYear =
      parseInt(req.query.year as string) || now.getFullYear();

    // Get all PGs of admin's type
    const pgs = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { id: true, name: true, location: true },
    });

    const pgIds = pgs.map((pg) => pg.id);

    // Build where clause for payments
    const paymentWhereClause: any = {
      pgId: { in: pgIds },
      month: requestedMonth,
      year: requestedYear,
    };

    // Apply payment status filter
    if (paymentStatus && ["PAID", "PENDING", "OVERDUE"].includes(paymentStatus)) {
      paymentWhereClause.paymentStatus = paymentStatus;
    }

    // Apply approval status filter
    if (approvalStatus && ["APPROVED", "PENDING", "REJECTED"].includes(approvalStatus)) {
      paymentWhereClause.approvalStatus = approvalStatus;
    }

    // Build where clause for members
    const memberWhereClause: any = {
      pgId: { in: pgIds },
      isActive: true,
      payment: {
        some: paymentWhereClause,
      },
    };

    // Apply member filters
    if (rentType) {
      memberWhereClause.rentType = rentType;
    }

    // Filter by multiple PG locations
    if (pgLocations.length > 0) {
      const pgsInLocation = await prisma.pG.findMany({
        where: {
          type: admin.pgType,
          location: { in: pgLocations },
        },
        select: { id: true },
      });
      const pgIdsInLocation = pgsInLocation.map((pg) => pg.id);

      if (pgIdsInLocation.length > 0) {
        memberWhereClause.pgId = { in: pgIdsInLocation };
      } else {
        memberWhereClause.pgId = { in: [] };
      }
    }

    // Apply search filter
    if (search) {
      memberWhereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { memberId: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build order by clause for sorting
    const buildOrderBy = (sortBy: string, sortOrder: string): any => {
      const order = sortOrder === "asc" ? "asc" : "desc";

      switch (sortBy) {
        case "name":
        case "memberId":
        case "dateOfJoining":
        case "createdAt":
        case "work":
          return { [sortBy]: order };
        case "pgName":
          return { pg: { name: order } };
        case "pgLocation":
          return { pg: { location: order } };
        case "roomNo":
          return { room: { roomNo: order } };
        case "rentAmount":
          return { room: { rent: order } };
        default:
          return { createdAt: "desc" };
      }
    };

    // Get total count for pagination
    const total = await prisma.member.count({
      where: memberWhereClause,
    });

    // Get members with related data including requested month payment
    const members = await prisma.member.findMany({
      where: memberWhereClause,
      include: {
        pg: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNo: true,
            rent: true,
          },
        },
        payment: {
          where: {
            month: requestedMonth,
            year: requestedYear,
            ...paymentWhereClause,
          },
          select: {
            id: true,
            paymentStatus: true,
            approvalStatus: true,
            amount: true,
            month: true,
            year: true,
            dueDate: true,
            overdueDate: true,
            paidDate: true,
            rentBillScreenshot: true,
            electricityBillScreenshot: true,
            attemptNumber: true,
            createdAt: true,
          },
          orderBy: {
            attemptNumber: 'desc',
          },
          take: 1, // Get only the latest attempt
        },
      },
      skip: offset,
      take: limit,
      orderBy: buildOrderBy(sortBy, sortOrder),
    });

    // Process members data - just flatten the structure
    const processedMembers = members.map((member) => {
      // Get the payment for requested month (should exist since we filtered for it)
      const requestedMonthPayment = member.payment[0];

      // Flatten the data structure
      const { payment, pg, room, ...memberData } = member;

      return {
        ...memberData,
        pgLocation: pg?.location || "",
        pgName: pg?.name || "",
        roomNo: room?.roomNo || "",
        rentAmount: room?.rent || 0,
        requestedMonthPaymentStatus: requestedMonthPayment?.paymentStatus || "PENDING",
        requestedMonthApprovalStatus: requestedMonthPayment?.approvalStatus || "PENDING",
        requestedMonthPayment: requestedMonthPayment ? {
          id: requestedMonthPayment.id,
          amount: requestedMonthPayment.amount,
          paymentStatus: requestedMonthPayment.paymentStatus,
          approvalStatus: requestedMonthPayment.approvalStatus,
          month: requestedMonthPayment.month,
          year: requestedMonthPayment.year,
          attemptNumber: requestedMonthPayment.attemptNumber,
          dueDate: requestedMonthPayment.dueDate,
          overdueDate: requestedMonthPayment.overdueDate,
          paidDate: requestedMonthPayment.paidDate,
          rentBillScreenshot: requestedMonthPayment.rentBillScreenshot,
          electricityBillScreenshot: requestedMonthPayment.electricityBillScreenshot,
          createdAt: requestedMonthPayment.createdAt,
        } : null,
        hasRequestedMonthPayment: !!requestedMonthPayment,
      };
    });

    const response = {
      tableData: processedMembers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.status(200).json({
      success: true,
      message: `Members payment data retrieved successfully for ${requestedMonth}/${requestedYear}`,
      data: response,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting members payment data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve members payment data",
    } as ApiResponse<null>);
  }
};

// Approve or reject payment for a member
export const approveOrRejectPayment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      } as ApiResponse<null>);
      return;
    }

    const { paymentId } = req.params;
    const { approvalStatus }: ApproveRejectPaymentRequest = req.body;

    // Validate required fields
    if (!approvalStatus || !["APPROVED", "REJECTED"].includes(approvalStatus)) {
      res.status(400).json({
        success: false,
        message: "Invalid approval status. Must be APPROVED or REJECTED",
      } as ApiResponse<null>);
      return;
    }

    // Get admin details to know their pgType
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { id: true, pgType: true },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      } as ApiResponse<null>);
      return;
    }

    // Find the payment with member and PG details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberId: true,
            email: true,
            dateOfJoining: true,
          },
        },
        pg: {
          select: {
            id: true,
            name: true,
            type: true,
            location: true,
          },
        },
      },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment record not found",
      } as ApiResponse<null>);
      return;
    }

    // Verify admin can manage this payment (same pgType)
    if (payment.pg.type !== admin.pgType) {
      res.status(403).json({
        success: false,
        message: "You can only manage payments for your PG type",
      } as ApiResponse<null>);
      return;
    }

    // Check if payment is in a state that can be approved/rejected
    if (
      payment.approvalStatus === "APPROVED" ||
      payment.approvalStatus === "REJECTED"
    ) {
      res.status(400).json({
        success: false,
        message: `Payment has already been ${payment.approvalStatus.toLowerCase()}`,
      } as ApiResponse<null>);
      return;
    }

    // Use transaction to update payment and create next payment record
    const result = await prisma.$transaction(async (tx) => {
      // Update payment approval status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          approvalStatus: approvalStatus as any,
          approvedBy: admin.id,
          approvedAt: new Date(),
          // If approved, also update payment status to PAID
          ...(approvalStatus === "APPROVED" && {
            paymentStatus: "PAID",
            paidDate: new Date(),
          }),
          // If rejected, update payment status to PENDING
          ...(approvalStatus === "REJECTED" && {
            paymentStatus: "REJECTED",
          }),
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              memberId: true,
              email: true,
              dateOfJoining: true,
            },
          },
          pg: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      });

      // If payment is approved, create the next payment record
      if (approvalStatus === "APPROVED") {
        // Get member's room details for rent amount
        const memberWithRoom = await tx.member.findUnique({
          where: { id: payment.memberId },
          include: {
            room: {
              select: {
                rent: true,
              },
            },
          },
        });

        if (memberWithRoom?.room) {
          // Calculate next billing cycle month and year
          const nextMonth = payment.month === 12 ? 1 : payment.month + 1;
          const nextYear =
            payment.month === 12 ? payment.year + 1 : payment.year;

          // Check if next payment record already exists
          const existingNextPayment = await tx.payment.findFirst({
            where: {
              memberId: payment.memberId,
              month: nextMonth,
              year: nextYear,
            },
          });

          if (!existingNextPayment) {
            // Calculate next payment record for the next service month
            const joiningDate = new Date(payment.member.dateOfJoining);
            const joiningDay = joiningDate.getDate();

            // The due date for next payment should be in the month AFTER the next service month
            // If current payment is for September (service), next payment is for October (service)
            // Due date for October payment should be November 13
            const nextServiceMonth = nextMonth;
            const nextServiceYear = nextYear;

            // Calculate due date: same day as joining date but in the month after service month
            const dueMonth = nextServiceMonth === 12 ? 1 : nextServiceMonth + 1;
            const dueYear =
              nextServiceMonth === 12 ? nextServiceYear + 1 : nextServiceYear;
            const nextDueDate = new Date(dueYear, dueMonth - 1, joiningDay);

            // Handle month-end edge cases
            if (nextDueDate.getDate() !== joiningDay) {
              const lastDayOfDueMonth = new Date(
                dueYear,
                dueMonth,
                0
              ).getDate();
              nextDueDate.setDate(Math.min(joiningDay, lastDayOfDueMonth));
            }

            // Calculate overdue date (7 days after due date)
            const nextOverdueDate = new Date(nextDueDate);
            nextOverdueDate.setDate(nextOverdueDate.getDate() + 7);

            // Create next payment record for the service month
            // Payment is for the service month, but due date is in the following month
            await tx.payment.create({
              data: {
                memberId: payment.memberId,
                pgId: payment.pgId,
                month: nextServiceMonth, // Service month (e.g., October service)
                year: nextServiceYear,
                amount: memberWithRoom.room.rent,
                dueDate: nextDueDate, // Due date (e.g., November 13 for October service)
                overdueDate: nextOverdueDate,
                paymentStatus: "PENDING",
                approvalStatus: "PENDING",
              },
            });
          }
        }
      }

      return updatedPayment;
    });

    const statusText = approvalStatus === "APPROVED" ? "approved" : "rejected";

    res.status(200).json({
      success: true,
      message: `Payment ${statusText} successfully`,
      data: {
        paymentId: result.id,
        memberId: result.member.memberId,
        memberName: result.member.name,
        pgName: result.pg.name,
        month: result.month,
        year: result.year,
        amount: result.amount,
        approvalStatus: result.approvalStatus,
        paymentStatus: result.paymentStatus,
        approvedBy: result.approvedBy,
        approvedAt: result.approvedAt,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error approving/rejecting payment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to process payment approval/rejection",
    } as ApiResponse<null>);
  }
};