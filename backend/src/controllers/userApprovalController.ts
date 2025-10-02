import { Response } from "express";
import prisma from "../config/prisma";
import { ApiResponse } from "../types/response";
import {
  ApproveRejectMemberRequest,
} from "../types/request";
import { AuthenticatedRequest } from "../middlewares/auth";
import { generateUniqueMemberId } from "../utils/memberIdGenerator";
import { generateSecureOTP, hashOTP } from "../utils/auth";
import {
  sendEmail,
  createApprovalEmailContent,
  createRejectionEmailContent,
} from "../services/emailService";
import { deleteImage, ImageType } from "../utils/imageUpload";

// GET registered members of pgType
export const getRegisteredMembers = async (
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

    // Optional filters
    const search = req.query.search as string;
    const rentType = req.query.rentType as string;

    // Build where clause
    const whereClause: any = {
      pgType: admin.pgType,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (rentType) {
      whereClause.rentType = rentType;
    }

    // Get total count for pagination
    const total = await prisma.registeredMember.count({
      where: whereClause,
    });

    // Get registered members
    const registeredMembers = await prisma.registeredMember.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      message: "Registered members retrieved successfully",
      data: registeredMembers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting registered members:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve registered members",
    } as ApiResponse<null>);
  }
};

// Approve or reject registered member
export const approveOrRejectMember = async (
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

    const { id } = req.params;
    const {
      status,
      pgId,
      roomId,
      advanceAmount,
      dateOfJoining,
      pricePerDay,
      dateOfRelieving,
    }: ApproveRejectMemberRequest = req.body;

    // Validate required fields
    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status. Must be APPROVED or REJECTED",
      } as ApiResponse<null>);
      return;
    }

    // Find the registered member
    const registeredMember = await prisma.registeredMember.findUnique({
      where: { id },
    });

    if (!registeredMember) {
      res.status(404).json({
        success: false,
        message: "Registered member not found",
      } as ApiResponse<null>);
      return;
    }

    // Get admin details to verify pgType
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

    // Verify admin can manage this registered member (same pgType)
    if (registeredMember.pgType !== admin.pgType) {
      res.status(403).json({
        success: false,
        message: "You can only manage members of your PG type",
      } as ApiResponse<null>);
      return;
    }

    if (status === "REJECTED") {
      // Delete the registered member record
      await prisma.registeredMember.delete({
        where: { id },
      });

      // Send rejection email notification
      try {
        const emailContent = createRejectionEmailContent(
          registeredMember.name,
          registeredMember.pgType
        );
        await sendEmail({
          to: registeredMember.email,
          subject: `Application Update - ${registeredMember.name}`,
          body: emailContent,
        });
        console.log(`Rejection email sent to ${registeredMember.email}`);
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }

      // Delete the uploaded images
      await deleteImage(registeredMember.photoUrl || "", ImageType.PROFILE);
      await deleteImage(registeredMember.documentUrl || "", ImageType.DOCUMENT);

      res.status(200).json({
        success: true,
        message: "Member registration rejected and removed successfully",
      } as ApiResponse<null>);
      return;
    }

    // For APPROVED status, validate additional required fields
    if (!pgId) {
      res.status(400).json({
        success: false,
        message: "pgId is required for approval",
      } as ApiResponse<null>);
      return;
    }

    // Validate additional fields for short-term members
    if (registeredMember.rentType === "SHORT_TERM") {
      if (!pricePerDay || pricePerDay <= 0) {
        res.status(400).json({
          success: false,
          message:
            "pricePerDay is required and must be greater than 0 for short-term members",
        } as ApiResponse<null>);
        return;
      }

      if (!dateOfRelieving) {
        res.status(400).json({
          success: false,
          message: "endingDate is required for short-term members",
        } as ApiResponse<null>);
        return;
      }

      // Validate that date of relieving is after joining date
      const joiningDateObj = dateOfJoining
        ? new Date(dateOfJoining)
        : new Date();
      const dateOfRelievingObj = new Date(dateOfRelieving);

      if (dateOfRelievingObj <= joiningDateObj) {
        res.status(400).json({
          success: false,
          message:
            "Date of relieving must be after joining date for short-term members",
        } as ApiResponse<null>);
        return;
      }
    }

    // Validate PG exists and is of the correct type
    const pg = await prisma.pG.findUnique({
      where: { id: pgId },
    });

    if (!pg) {
      res.status(404).json({
        success: false,
        message: "PG not found",
      } as ApiResponse<null>);
      return;
    }

    if (pg.type !== admin.pgType) {
      res.status(403).json({
        success: false,
        message: "PG type does not match your admin type",
      } as ApiResponse<null>);
      return;
    }

    // Validate room if roomId is provided
    if (roomId) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        res.status(404).json({
          success: false,
          message: "Room not found",
        } as ApiResponse<null>);
        return;
      }

      // Verify room belongs to the specified PG
      if (room.pGId !== pgId) {
        res.status(400).json({
          success: false,
          message: "Room does not belong to the specified PG",
        } as ApiResponse<null>);
        return;
      }

      // Check room capacity
      const currentOccupancy = await prisma.member.count({
        where: { roomId: room.id },
      });

      if (currentOccupancy >= room.capacity) {
        res.status(400).json({
          success: false,
          message: "Room is at full capacity",
        } as ApiResponse<null>);
        return;
      }
    }

    // Generate unique member ID
    const uniqueMemberId = await generateUniqueMemberId();

    // Parse dates
    const joiningDate = dateOfJoining ? new Date(dateOfJoining) : new Date();
    const memberDateOfRelieving =
      registeredMember.rentType === "SHORT_TERM" && dateOfRelieving
        ? new Date(dateOfRelieving)
        : registeredMember.dateOfRelieving;

    // Create transaction to move from RegisteredMember to Member
    const result = await prisma.$transaction(async (tx) => {
      // Create member record
      const newMember = await tx.member.create({
        data: {
          memberId: uniqueMemberId,
          name: registeredMember.name,
          dob: registeredMember.dob,
          gender: registeredMember.gender,
          location: registeredMember.location,
          email: registeredMember.email,
          phone: registeredMember.phone,
          work: registeredMember.work,
          photoUrl: registeredMember.photoUrl,
          documentUrl: registeredMember.documentUrl,
          rentType: registeredMember.rentType,
          dateOfRelieving: memberDateOfRelieving,
          advanceAmount: parseFloat(String(advanceAmount || "0")) || 0,
          pricePerDay:
            registeredMember.rentType === "SHORT_TERM"
              ? parseFloat(String(pricePerDay || "0")) || 0
              : null,
          pgType: registeredMember.pgType,
          pgId,
          roomId,
          dateOfJoining: joiningDate,
        },
        include: {
          pg: {
            select: {
              id: true,
              name: true,
              type: true,
              location: true,
            },
          },
          room: {
            select: {
              id: true,
              roomNo: true,
              rent: true,
              capacity: true,
            },
          },
        },
      });

      // Create initial payment record for the member
      if (newMember.room) {
        const joiningDate = new Date(newMember.dateOfJoining);

        if (newMember.rentType === "LONG_TERM") {
          // Long-term members: Payment for current month of service, due next month

          // Payment record is for the current month they joined (service period)
          const currentMonth = joiningDate.getMonth() + 1;
          const currentYear = joiningDate.getFullYear();

          // Due date is next month, same date as joining date
          const dueDate = new Date(joiningDate);
          dueDate.setMonth(dueDate.getMonth() + 1);

          // Handle month-end edge cases for due date
          const joiningDay = joiningDate.getDate();
          if (dueDate.getDate() !== joiningDay) {
            const lastDayOfDueMonth = new Date(
              dueDate.getFullYear(),
              dueDate.getMonth() + 1,
              0
            ).getDate();
            dueDate.setDate(Math.min(joiningDay, lastDayOfDueMonth));
          }

          // Calculate overdue date (7 days after due date)
          const overdueDate = new Date(dueDate);
          overdueDate.setDate(overdueDate.getDate() + 7);

          // Set amount based on room rent
          const paymentAmount = newMember.room.rent;

          await tx.payment.create({
            data: {
              memberId: newMember.id,
              pgId: newMember.pgId,
              month: currentMonth, // Payment for September (current month)
              year: currentYear, // 2025
              amount: paymentAmount,
              dueDate: dueDate, // Due on October 13 (next month)
              overdueDate: overdueDate, // Overdue after October 20
              paymentStatus: "PENDING",
              approvalStatus: "PENDING",
            },
          });
        } else if (
          newMember.rentType === "SHORT_TERM" &&
          newMember.dateOfRelieving &&
          newMember.pricePerDay
        ) {
          // Short-term members: One-time payment based on number of days
          // Since they pay upfront, create payment record as PAID and APPROVED

          // Calculate number of days between joining and ending date
          const endingDate = new Date(newMember.dateOfRelieving);
          const timeDifference = endingDate.getTime() - joiningDate.getTime();
          const numberOfDays = Math.ceil(timeDifference / (1000 * 3600 * 24));

          // Calculate total amount (days * pricePerDay)
          const totalAmount = numberOfDays * newMember.pricePerDay;

          // Set due date as the joining date (immediate payment)
          const dueDate = new Date(joiningDate);

          // Calculate overdue date (7 days after due date)
          const overdueDate = new Date(dueDate);
          overdueDate.setDate(overdueDate.getDate() + 7);

          await tx.payment.create({
            data: {
              memberId: newMember.id,
              pgId: newMember.pgId,
              month: joiningDate.getMonth() + 1,
              year: joiningDate.getFullYear(),
              amount: totalAmount,
              dueDate: dueDate,
              overdueDate: overdueDate,
              paymentStatus: "PAID",
              approvalStatus: "APPROVED",
              paidDate: new Date(), // Set paid date to current time
              approvedAt: new Date(), // Set approved date to current time
              approvedBy: req.admin?.id, // Set approved by admin who approved the member
            },
          });
        }
      }

      // Delete the registered member record
      await tx.registeredMember.delete({
        where: { id },
      });
      return newMember;
    });

    // Generate OTP and send approval email notification
    try {
      let otpCode: string | undefined = undefined;
      
      // For long-term members, generate OTP and include in approval email
      if (result.rentType === "LONG_TERM") {
        // Generate OTP
        otpCode = generateSecureOTP();
        const hashedOTP = await hashOTP(otpCode);

        // Delete existing unused OTPs for this member of INITIAL_SETUP type
        await prisma.oTP.deleteMany({
          where: {
            memberId: result.id,
            type: 'INITIAL_SETUP',
          },
        });


        await prisma.oTP.create({
          data: {
            memberId: result.id,
            email: result.email,
            code: hashedOTP,
            type: 'INITIAL_SETUP',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      }

      const emailContent = createApprovalEmailContent(
        result.name,
        result.memberId,
        result.pg.name,
        result.pg.location,
        result.room?.roomNo,
        result.rentType === "LONG_TERM" ? result.room?.rent : undefined,
        result.advanceAmount,
        result.dateOfJoining,
        result.rentType,
        result.pricePerDay || undefined,
        result.dateOfRelieving || undefined,
        otpCode
      );

      await sendEmail({
        to: result.email,
        subject: `🎉 Application Approved - Welcome to ${result.pg.name}!`,
        body: emailContent,
      });

      console.log(`Approval email sent to ${result.email}${otpCode ? ' with initial setup OTP' : ''}`);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: result.rentType === "LONG_TERM" 
        ? "Member approved and created successfully. Initial setup OTP is included in the approval email (valid for 24 hours)."
        : "Member approved and created successfully.",
      data: result,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error approving/rejecting member:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to process member approval/rejection",
    } as ApiResponse<null>);
  }
};
