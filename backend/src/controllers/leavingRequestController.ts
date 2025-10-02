import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ApiResponse } from "../types/response";
import {
  AuthenticatedRequest,
  AuthenticatedMemberRequest,
} from "../middlewares/auth";
import calculateAge from "../utils/ageCalculator";
import { calculatePendingDues } from "../utils/leavingRequestDuesCalculator";

const prisma = new PrismaClient();

// User Routes

// Apply for a leaving request
export const applyLeavingRequest = async (
  req: AuthenticatedMemberRequest,
  res: Response
) => {
  try {
    const { requestedLeaveDate, reason, feedback } = req.body;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        success: false,
        message: "Member authentication required",
      } as ApiResponse<null>);
    }

    // Get member details to fetch pgId and roomId
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        pgId: true,
        roomId: true,
        isActive: true,
      },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      } as ApiResponse<null>);
    }

    if (!member.isActive) {
      return res.status(400).json({
        success: false,
        message: "Inactive members cannot apply for leaving requests",
      } as ApiResponse<null>);
    }

    // Check if there's already a pending or approved leaving request
    const existingRequest = await prisma.leavingRequest.findFirst({
      where: {
        memberId,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${existingRequest.status.toLowerCase()} leaving request`,
      } as ApiResponse<null>);
    }

    // Calculate pending dues using utility function
    const duesCalculation = await calculatePendingDues(memberId, new Date(requestedLeaveDate));
    const totalPendingDues = duesCalculation.totalDues;

    // Create the leaving request with calculated pending dues
    const leavingRequest = await prisma.leavingRequest.create({
      data: {
        memberId,
        pgId: member.pgId,
        roomId: member.roomId,
        requestedLeaveDate: new Date(requestedLeaveDate),
        reason,
        status: "PENDING",
        pendingDues: totalPendingDues > 0 ? totalPendingDues : null,
        feedback,
      },
      include: {
        member: {
          select: { id: true, name: true, memberId: true, phone: true },
        },
        pg: {
          select: { id: true, name: true, type: true },
        },
        room: {
          select: { id: true, roomNo: true },
        },
      },
    });

    // Flatten the response
    const flattenedResponse = {
      id: leavingRequest.id,
      memberId: leavingRequest.memberId,
      pgId: leavingRequest.pgId,
      roomId: leavingRequest.roomId,
      requestedLeaveDate: leavingRequest.requestedLeaveDate,
      reason: leavingRequest.reason,
      status: leavingRequest.status,
      approvedBy: leavingRequest.approvedBy,
      approvedAt: leavingRequest.approvedAt,
      pendingDues: leavingRequest.pendingDues,
      finalAmount: leavingRequest.finalAmount,
      settledDate: leavingRequest.settledDate,
      settlementProof: leavingRequest.settlementProof,
      paymentMethod: leavingRequest.paymentMethod,
      createdAt: leavingRequest.createdAt,
      updatedAt: leavingRequest.updatedAt,
      // Flattened member fields
      memberName: leavingRequest.member.name,
      memberMemberId: leavingRequest.member.memberId,
      memberPhone: leavingRequest.member.phone,
      // Flattened PG fields
      pgName: leavingRequest.pg.name,
      pgType: leavingRequest.pg.type,
      // Flattened room fields
      roomNo: leavingRequest.room?.roomNo || null,
    };

    res.status(201).json({
      success: true,
      message: "Leaving request submitted successfully",
      data: flattenedResponse,
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error("Error applying leaving request:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    } as ApiResponse<null>);
  }
};

// Get leaving request status for the authenticated member
export const getLeavingRequestStatus = async (
  req: AuthenticatedMemberRequest,
  res: Response
) => {
  try {
    const memberId = req.member?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!memberId) {
      return res.status(401).json({
        success: false,
        message: "Member authentication required",
      } as ApiResponse<null>);
    }

    const pageNumber = parseInt(page as string);
    const pageSize = parseInt(limit as string);
    const skip = (pageNumber - 1) * pageSize;

    // Build where conditions
    const whereConditions: any = { memberId };
    if (status) {
      whereConditions.status = status;
    }

    // Get total count
    const totalRequests = await prisma.leavingRequest.count({
      where: whereConditions,
    });

    // Get leaving requests with pagination
    const leavingRequests = await prisma.leavingRequest.findMany({
      where: whereConditions,
      include: {
        member: {
          select: { id: true, name: true, memberId: true, phone: true },
        },
        pg: {
          select: { id: true, name: true, type: true },
        },
        room: {
          select: { id: true, roomNo: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    // Flatten the response
    const flattenedRequests = leavingRequests.map((request) => ({
      id: request.id,
      memberId: request.memberId,
      pgId: request.pgId,
      roomId: request.roomId,
      requestedLeaveDate: request.requestedLeaveDate,
      reason: request.reason,
      status: request.status,
      approvedBy: request.approvedBy,
      approvedAt: request.approvedAt,
      pendingDues: request.pendingDues,
      finalAmount: request.finalAmount,
      settledDate: request.settledDate,
      settlementProof: request.settlementProof,
      paymentMethod: request.paymentMethod,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      // Flattened member fields
      memberName: request.member.name,
      memberMemberId: request.member.memberId,
      memberPhone: request.member.phone,
      // Flattened PG fields
      pgName: request.pg.name,
      pgType: request.pg.type,
      // Flattened room fields
      roomNo: request.room?.roomNo || null,
    }));

    const totalPages = Math.ceil(totalRequests / pageSize);

    res.status(200).json({
      success: true,
      message: "Leaving request status retrieved successfully",
      data: flattenedRequests,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalRequests,
        totalPages,
      },
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error("Error getting leaving request status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    } as ApiResponse<null>);
  }
};


// Utility function to recalculate pending dues for a leaving request
const recalculatePendingDues = async (
  memberId: string,
  requestedLeaveDate: Date
) => {
  const duesCalculation = await calculatePendingDues(memberId, requestedLeaveDate);
  
  return {
    totalDues: duesCalculation.totalDues,
    pendingPayments: duesCalculation.pendingPayments,
    partialMonthDue: 0, // No longer calculating partial month
    monthsChecked: duesCalculation.monthsChecked,
  };
};

// Get all leaving requests for admin's PG type
export const getAllLeavingRequests = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const adminId = req.admin?.id;
    const adminPgType = req.admin?.pgType;
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = req.query;

    if (!adminId || !adminPgType) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      } as ApiResponse<null>);
    }

    const pageNumber = parseInt(page as string);
    const pageSize = parseInt(limit as string);
    const skip = (pageNumber - 1) * pageSize;

    // Build where conditions
    const whereConditions: any = {
      pg: {
        type: adminPgType,
      },
    };

    if (status) {
      whereConditions.status = status;
    }

    if (search) {
      whereConditions.OR = [
        {
          member: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          member: {
            memberId: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          reason: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Get total count
    const totalRequests = await prisma.leavingRequest.count({
      where: whereConditions,
    });

    // Get leaving requests with pagination and sorting
    const leavingRequests = await prisma.leavingRequest.findMany({
      where: whereConditions,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberId: true,
            phone: true,
            email: true,
            dob: true,
          },
        },
        pg: {
          select: { id: true, name: true, type: true, location: true },
        },
        room: {
          select: { id: true, roomNo: true, rent: true },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder as "asc" | "desc",
      },
      skip,
      take: pageSize,
    });

    // Flatten the response
    const flattenedRequests = leavingRequests.map((request) => ({
      id: request.id,
      memberId: request.memberId,
      pgId: request.pgId,
      roomId: request.roomId,
      requestedLeaveDate: request.requestedLeaveDate,
      reason: request.reason,
      feedback: request.feedback,
      status: request.status,
      approvedBy: request.approvedBy,
      approvedAt: request.approvedAt,
      pendingDues: request.pendingDues,
      finalAmount: request.finalAmount,
      settledDate: request.settledDate,
      settlementProof: request.settlementProof,
      paymentMethod: request.paymentMethod,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      // Flattened member fields
      memberName: request.member.name,
      memberMemberId: request.member.memberId,
      memberPhone: request.member.phone,
      memberEmail: request.member.email,
      memberAge: calculateAge(request.member.dob),
      // Flattened PG fields
      pgName: request.pg.name,
      pgType: request.pg.type,
      pgLocation: request.pg.location,
      // Flattened room fields
      roomNo: request.room?.roomNo || null,
      roomRent: request.room?.rent || null,
    }));

    const totalPages = Math.ceil(totalRequests / pageSize);

    res.status(200).json({
      success: true,
      message: "Leaving requests retrieved successfully",
      data: flattenedRequests,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalRequests,
        totalPages,
      },
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error("Error getting all leaving requests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    } as ApiResponse<null>);
  }
};

// Approve or reject a leaving request
export const approveOrRejectRequest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { approvalStatus, finalAmount, paymentMethod } = req.body;
    const adminId = req.admin?.id;
    const adminPgType = req.admin?.pgType;

    if (!adminId || !adminPgType) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      } as ApiResponse<null>);
    }

    // Handle optional image file upload only for ONLINE payment method
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let settlementProof = null;
    
    // Only process settlement proof image if payment method is ONLINE
    if (paymentMethod === "ONLINE" && files?.settlementProof) {
      settlementProof = `/uploads/payment/${files.settlementProof[0].filename}`;
    }

    // Validate that ONLINE payments should have settlement proof
    if (approvalStatus === "APPROVED" && paymentMethod === "ONLINE" && !settlementProof) {
      return res.status(400).json({
        success: false,
        message: "Settlement proof image is required for online payment approvals",
      } as ApiResponse<null>);
    }

    // Find the leaving request and verify it belongs to admin's PG type
    const leavingRequest = await prisma.leavingRequest.findFirst({
      where: {
        id,
        pg: {
          type: adminPgType,
        },
        status: "PENDING",
      },
      include: {
        member: {
          select: { id: true, name: true, memberId: true, phone: true },
        },
        pg: {
          select: { id: true, name: true, type: true },
        },
        room: {
          select: { id: true, roomNo: true },
        },
      },
    });

    if (!leavingRequest) {
      return res.status(404).json({
        success: false,
        message: "Pending leaving request not found or unauthorized",
      } as ApiResponse<null>);
    }

    // Prepare update data
    const updateData: any = {
      status: approvalStatus,
      approvedBy: adminId,
      approvedAt: new Date(),
    };

    if (approvalStatus === "APPROVED") {
      if (finalAmount !== undefined) updateData.finalAmount = parseFloat(finalAmount);
      if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
      
      // Only add settlement proof for ONLINE payments
      if (paymentMethod === "ONLINE" && settlementProof) {
        updateData.settlementProof = settlementProof;
      }
      
      updateData.settledDate = new Date();
    }

    // Use transaction to update both leaving request and member status
    const result = await prisma.$transaction(async (tx) => {
      // Update the leaving request
      const updatedRequest = await tx.leavingRequest.update({
        where: { id },
        data: updateData,
        include: {
          member: {
            select: { id: true, name: true, memberId: true, phone: true },
          },
          pg: {
            select: { id: true, name: true, type: true },
          },
          room: {
            select: { id: true, roomNo: true },
          },
        },
      });

      // If approved, set member isActive to false
      if (approvalStatus === "APPROVED") {
        await tx.member.update({
          where: { id: leavingRequest.memberId },
          data: { isActive: false },
        });
      }

      return updatedRequest;
    });

    // Flatten the response
    const flattenedResponse = {
      id: result.id,
      memberId: result.memberId,
      pgId: result.pgId,
      roomId: result.roomId,
      requestedLeaveDate: result.requestedLeaveDate,
      reason: result.reason,
      status: result.status,
      approvedBy: result.approvedBy,
      approvedAt: result.approvedAt,
      pendingDues: result.pendingDues,
      finalAmount: result.finalAmount,
      settledDate: result.settledDate,
      settlementProof: result.settlementProof,
      paymentMethod: result.paymentMethod,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      // Flattened member fields
      memberName: result.member.name,
      memberMemberId: result.member.memberId,
      memberPhone: result.member.phone,
      // Flattened PG fields
      pgName: result.pg.name,
      pgType: result.pg.type,
      // Flattened room fields
      roomNo: result.room?.roomNo || null,
    };

    const action = approvalStatus === "APPROVED" ? "approved" : "rejected";
    const message = approvalStatus === "APPROVED" 
      ? "Leaving request approved successfully. Member has been deactivated." 
      : "Leaving request rejected successfully";

    res.status(200).json({
      success: true,
      message,
      data: flattenedResponse,
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error("Error approving/rejecting leaving request:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    } as ApiResponse<null>);
  }
};

// Recalculate pending dues for a leaving request
export const recalculateLeavingRequestDues = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id;
    const adminPgType = req.admin?.pgType;

    if (!adminId || !adminPgType) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      } as ApiResponse<null>);
    }

    // Find the leaving request
    const leavingRequest = await prisma.leavingRequest.findFirst({
      where: {
        id,
        pg: {
          type: adminPgType,
        },
      },
      include: {
        member: {
          select: { id: true, name: true, memberId: true },
        },
      },
    });

    if (!leavingRequest) {
      return res.status(404).json({
        success: false,
        message: "Leaving request not found or unauthorized",
      } as ApiResponse<null>);
    }

    // Recalculate pending dues
    const duesCalculation = await recalculatePendingDues(
      leavingRequest.memberId,
      leavingRequest.requestedLeaveDate
    );

    // Update the leaving request with new calculated dues
    const updatedRequest = await prisma.leavingRequest.update({
      where: { id },
      data: {
        pendingDues:
          duesCalculation.totalDues > 0 ? duesCalculation.totalDues : null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Pending dues recalculated successfully",
      data: {
        leavingRequestId: updatedRequest.id,
        memberName: leavingRequest.member.name,
        previousDues: leavingRequest.pendingDues,
        updatedDues: updatedRequest.pendingDues,
        calculation: {
          totalDues: duesCalculation.totalDues,
          pendingPaymentsAmount: duesCalculation.pendingPayments.reduce(
            (sum, p) => sum + p.amount,
            0
          ),
          partialMonthDue: duesCalculation.partialMonthDue,
          pendingPayments: duesCalculation.pendingPayments.map((p) => ({
            month: p.month,
            year: p.year,
            amount: p.amount,
            status: p.paymentStatus,
          })),
          monthsChecked: duesCalculation.monthsChecked,
        },
      },
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error("Error recalculating leaving request dues:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    } as ApiResponse<null>);
  }
};
