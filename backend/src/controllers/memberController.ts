import { Response } from "express";
import prisma from "../config/prisma";
import { ApiResponse } from "../types/response";
import { AuthenticatedRequest } from "../middlewares/auth";
import { deleteImage, ImageType } from "../utils/imageUpload";
import { DeleteMultipleMembersRequest } from "../types/request";

// Get all members data with pagination and filters
export const getAllMembers = async (
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

    // Get filter parameters (matching dashboard filter options)
    const pgId = req.query.pgId as string;
    const paymentStatus =
      (req.query.paymentStatus as string) || (req.query.status as string); // Support both field names
    const search = req.query.search as string;

    // Get sorting parameters
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    // Parse comma-separated values for multi-select filters (matching filter options)
    const parseMultiSelectValues = (param: string | undefined): string[] => {
      if (!param) return [];
      return param
        .split(",")
        .map((val) => decodeURIComponent(val.trim()))
        .filter((val) => val.length > 0);
    };

    const works = parseMultiSelectValues(req.query.work as string);

    // Get current month and year for payment status
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get all PGs of admin's type
    const pgs = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { id: true },
    });

    const pgIds = pgs.map((pg) => pg.id);

    // Build where clause for members
    const whereClause: any = {
      pgId: { in: pgIds },
      isActive: true,
    };

    // Apply filters (matching dashboard filter structure)
    if (pgId && pgIds.includes(pgId)) {
      whereClause.pgId = pgId;
    }

    // Handle multiple work types
    if (works.length > 0) {
      whereClause.work = { in: works };
    }

    // Handle search across multiple fields
    if (search) {
      whereClause.OR = [
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
        case "age":
        case "location":
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

    // Get total count for pagination (without payment status filter)
    const total = await prisma.member.count({
      where: whereClause,
    });

    // Process members and flatten data structure
    const processMembers = (members: any[]) => {
      return members.map((member: any) => {
        const currentMonthPayment = member.payment?.find(
          (p: any) => p.month === currentMonth && p.year === currentYear
        );

        // Flatten the data structure - extract pg and room data to top level
        const { payment, pg, room, ...memberData } = member;

        // Calculate rent amount based on member type
        let rentAmount = 0;
        if (memberData.rentType === 'SHORT_TERM') {
          // For short-term members, calculate total amount for entire stay
          if (memberData.pricePerDay && memberData.dateOfJoining && memberData.dateOfRelieving) {
            const joiningDate = new Date(memberData.dateOfJoining);
            const relievingDate = new Date(memberData.dateOfRelieving);
            const timeDifference = relievingDate.getTime() - joiningDate.getTime();
            const numberOfDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
            rentAmount = numberOfDays * memberData.pricePerDay;
          } else {
            rentAmount = memberData.pricePerDay || 0;
          }
        } else {
          // For long-term members, use room rent
          rentAmount = room?.rent || 0;
        }

        return {
          ...memberData,
          pgLocation: pg?.location || "",
          pgName: pg?.name || "",
          roomNo: room?.roomNo || "", 
          paymentStatus: currentMonthPayment?.paymentStatus || "PENDING",
          approvalStatus: currentMonthPayment?.approvalStatus || "PENDING",
          rentAmount: rentAmount,
          currentMonthPayment: currentMonthPayment || null,
          hasCurrentMonthPayment: !!currentMonthPayment,
        };
      });
    };

    let finalMembers: any[] = [];
    let finalTotal = total;

    if (paymentStatus) {
      // Get all members with payment data for filtering
      const allMembers = await prisma.member.findMany({
        where: whereClause,
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
              month: currentMonth,
              year: currentYear,
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
          },
        },
        orderBy: buildOrderBy(sortBy, sortOrder),
      });

      // Process all members and filter by payment status
      const processedMembers = processMembers(allMembers);
      const statusFilteredMembers = processedMembers.filter((member) => {
        return member.paymentStatus === paymentStatus;
      });

      // Apply pagination to filtered results
      finalTotal = statusFilteredMembers.length;
      finalMembers = statusFilteredMembers.slice(offset, offset + limit);
    } else {
      // No payment status filter - use regular pagination
      const members = await prisma.member.findMany({
        where: whereClause,
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
              month: currentMonth,
              year: currentYear,
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
          },
        },
        skip: offset,
        take: limit,
        orderBy: buildOrderBy(sortBy, sortOrder),
      });

      // Process members with consistent logic
      finalMembers = processMembers(members);
      finalTotal = total;
    }

    const response = {
      tableData: finalMembers,
      pagination: {
        page,
        limit,
        total: finalTotal,
        totalPages: Math.ceil(finalTotal / limit),
      },
    };

    res.status(200).json({
      success: true,
      message: "Members data retrieved successfully",
      data: response,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting members data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve members data",
    } as ApiResponse<null>);
  }
};


// Get members by rent type with filters
export const getMembersByRentType = async (
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

    // Get rent type from route params
    const rentTypeParam = req.params.rentType as string;
    let rentType: "LONG_TERM" | "SHORT_TERM";

    // Map route param to enum value
    if (rentTypeParam === "long-term") {
      rentType = "LONG_TERM";
    } else if (rentTypeParam === "short-term") {
      rentType = "SHORT_TERM";
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid rent type. Use 'long-term' or 'short-term'",
      } as ApiResponse<null>);
      return;
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get filter parameters from query - handle multiple values
    const paymentStatus = req.query.paymentStatus as string;
    const search = req.query.search as string;

    // Parse comma-separated values for multi-select filters
    const parseMultipleValues = (param: string | undefined): string[] => {
      if (!param) return [];
      return param
        .split(",")
        .map((val) => decodeURIComponent(val.trim()))
        .filter((val) => val.length > 0);
    };

    const pgLocations = parseMultipleValues(req.query.pgLocation as string);

    // Get sorting parameters
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    // Get current month and year for payment status
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get all PGs of admin's type
    const pgs = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { id: true },
    });

    const pgIds = pgs.map((pg) => pg.id);

    const whereClause: any = {
      pgId: { in: pgIds },
      rentType: rentType,
    };

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
        whereClause.pgId = { in: pgIdsInLocation };
      } else {
        // If no PGs found in locations, return empty result
        whereClause.pgId = { in: [] };
      }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { memberId: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Prepare order by clause for sorting
    const buildOrderBy = (sortBy: string, sortOrder: string): any => {
      const order = sortOrder === "asc" ? "asc" : "desc";

      switch (sortBy) {
        case "name":
        case "memberId":
        case "dateOfJoining":
        case "createdAt":
        case "age":
        case "gender":
        case "email":
        case "phone":
        case "rentType":
        case "advanceAmount":
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
      where: whereClause,
    });

    // Get members with related data
    const members = await prisma.member.findMany({
      where: whereClause,
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
          select: {
            id: true,
            paymentStatus: true,
            approvalStatus: true,
            amount: true,
            month: true,
            year: true,
            dueDate: true,
            overdueDate: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: buildOrderBy(sortBy, sortOrder),
    });

    // Process members data to use payment status from database
    const processedMembers = members.map((member) => {
      // Flatten the data structure - extract pg and room data to top level
      const { payment, pg, room, ...memberData } = member;

      // Find payment for current month
      const currentMonthPayment = payment?.find((p) => {
        return p.month === currentMonth && p.year === currentYear;
      });

      return {
        ...memberData,
        pgLocation: pg?.location || "",
        pgName: pg?.name || "",
        roomNo: room?.roomNo || "",
        rentAmount: room?.rent || 0,
        paymentStatus: currentMonthPayment?.paymentStatus || "PENDING",
        approvalStatus: currentMonthPayment?.approvalStatus || "PENDING",
        nextDueDate: currentMonthPayment?.dueDate
          ? new Date(currentMonthPayment.dueDate)
          : null,
        isOverdue: currentMonthPayment?.paymentStatus === "OVERDUE",
        currentMonthPayment: currentMonthPayment || null,
        hasCurrentMonthPayment: !!currentMonthPayment,
      };
    });

    // Filter by payment status if specified
    let filteredMembers = processedMembers;
    if (
      paymentStatus &&
      ["PAID", "PENDING", "OVERDUE"].includes(paymentStatus)
    ) {
      filteredMembers = processedMembers.filter((member) => {
        // Map payment status for filtering
        if (paymentStatus === "PAID" && member.approvalStatus === "APPROVED") {
          return true;
        }
        if (paymentStatus === "OVERDUE" && 
            (member.paymentStatus === "OVERDUE" || member.approvalStatus === "REJECTED")) {
          return true;
        }
        if (paymentStatus === "PENDING" && 
            member.paymentStatus === "PENDING" && 
            member.approvalStatus !== "APPROVED" && 
            member.approvalStatus !== "REJECTED") {
          return true;
        }
        return false;
      });
    }

    let finalMembers = filteredMembers;
    let finalTotal = total;

    if (
      paymentStatus &&
      ["PAID", "PENDING", "OVERDUE"].includes(paymentStatus)
    ) {
      // For payment status filter, we need to get all members first, then filter and paginate
      const allMembers = await prisma.member.findMany({
        where: whereClause,
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
          },
        },
        orderBy: buildOrderBy(sortBy, sortOrder),
      });

      const allProcessedMembers = allMembers.map((member) => {
        // Flatten the data structure - extract pg and room data to top level
        const { payment, pg, room, ...memberData } = member;

        // Find payment for current month
        const currentMonthPayment = payment?.find((p) => {
          return p.month === currentMonth && p.year === currentYear;
        });

        return {
          ...memberData,
          pgLocation: pg?.location || "",
          pgName: pg?.name || "",
          roomNo: room?.roomNo || "",
          rentAmount: room?.rent || 0,
          paymentStatus: currentMonthPayment?.paymentStatus || "PENDING",
          approvalStatus: currentMonthPayment?.approvalStatus || "PENDING",
          nextDueDate: currentMonthPayment?.dueDate
            ? new Date(currentMonthPayment.dueDate)
            : null,
          isOverdue: currentMonthPayment?.paymentStatus === "OVERDUE",
          currentMonthPayment: currentMonthPayment || null,
          hasCurrentMonthPayment: !!currentMonthPayment,
        };
      });

      // Filter by payment status with correct logic
      const statusFilteredMembers = allProcessedMembers.filter((member) => {
        // Map payment status for filtering
        if (paymentStatus === "PAID" && member.approvalStatus === "APPROVED") {
          return true;
        }
        if (paymentStatus === "OVERDUE" && 
            (member.paymentStatus === "OVERDUE" || member.approvalStatus === "REJECTED")) {
          return true;
        }
        if (paymentStatus === "PENDING" && 
            member.paymentStatus === "PENDING" && 
            member.approvalStatus !== "APPROVED" && 
            member.approvalStatus !== "REJECTED") {
          return true;
        }
        return false;
      });

      // Apply pagination to filtered results
      finalTotal = statusFilteredMembers.length;
      finalMembers = statusFilteredMembers.slice(offset, offset + limit);
    }

    res.status(200).json({
      success: true,
      message: `${rentType
        .toLowerCase()
        .replace("_", "-")} members retrieved successfully`,
      data: {
        tableData: finalMembers,
      },
      pagination: {
        page,
        limit,
        total: finalTotal,
        totalPages: Math.ceil(finalTotal / limit),
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting members by rent type:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve members",
    } as ApiResponse<null>);
  }
};



// Get detailed member information including payment history
export const getMemberDetails = async (
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

    const { memberId } = req.params;

    // Get pagination parameters for payment history
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Find the member with all related data
    const member = await prisma.member.findUnique({
      where: { id: memberId },
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

    if (!member) {
      res.status(404).json({
        success: false,
        message: "Member not found",
      } as ApiResponse<null>);
      return;
    }

    // Verify admin can access this member (same pgType)
    if (member.pg.type !== admin.pgType) {
      res.status(403).json({
        success: false,
        message: "You can only access members of your PG type",
      } as ApiResponse<null>);
      return;
    }

    // Calculate tenure - more accurate calculation
    const now = new Date();
    const joiningDate = new Date(member.dateOfJoining);
    const relievingDate = member.dateOfRelieving
      ? new Date(member.dateOfRelieving)
      : null;

    // Use relieving date for SHORT_TERM members who have left, otherwise use current date
    const endDate =
      member.rentType === "SHORT_TERM" && relievingDate && relievingDate <= now
        ? relievingDate
        : now;

    const diffTime = Math.abs(endDate.getTime() - joiningDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;

    // Get payment history with pagination - directly from Payment model
    const paymentHistory = await prisma.payment.findMany({
      where: { memberId: member.id },
      select: {
        id: true,
        amount: true,
        paymentStatus: true,
        approvalStatus: true,
        dueDate: true,
        overdueDate: true,
        paidDate: true,
        month: true,
        year: true,
        paymentMethod: true,
        attemptNumber: true,
        rentBillScreenshot: true,
        electricityBillScreenshot: true,
        createdAt: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalPayments = await prisma.payment.count({
      where: { memberId: member.id },
    });

    // Calculate simple payment summary
    const paymentSummaryData = await prisma.payment.aggregate({
      where: { memberId: member.id },
      _sum: {
        amount: true,
      },
    });

    const totalAmountPaid = await prisma.payment.aggregate({
      where: { 
        memberId: member.id,
        approvalStatus: "APPROVED"
      },
      _sum: {
        amount: true,
      },
    });

    const totalAmountPending = await prisma.payment.aggregate({
      where: { 
        memberId: member.id,
        approvalStatus: "PENDING"
      },
      _sum: {
        amount: true,
      },
    });

    // Get the most recent due date
    const latestPayment = await prisma.payment.findFirst({
      where: { 
        memberId: member.id,
        approvalStatus: "PENDING"
      },
      select: {
        dueDate: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    // Format member data - remove unwanted calculations
    const { pg, room, ...memberData } = member;
    const formattedMember = {
      ...memberData,
      pgDetails: pg,
      roomDetails: room,
      tenure: {
        days,
        months,
        years,
        totalDays: diffDays,
      },
    };

    // Simplified payment summary - only keep required fields
    const paymentSummary = {
      totalAmountPaid: totalAmountPaid._sum.amount || 0,
      totalAmountPending: totalAmountPending._sum.amount || 0,
      dueDate: latestPayment?.dueDate || null,
    };

    res.status(200).json({
      success: true,
      message: "Member details retrieved successfully",
      data: {
        member: formattedMember,
        paymentHistory: {
          data: paymentHistory,
          pagination: {
            page,
            limit,
            total: totalPayments,
            totalPages: Math.ceil(totalPayments / limit),
          },
        },
        paymentSummary,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting member details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve member details",
    } as ApiResponse<null>);
  }
};

// Helper function to extract image filename from URL or path
const extractImageFilename = (imageUrl: string | null): string | null => {
  if (!imageUrl) return null;

  // Handle both URL format (/uploads/profile/filename.jpg) and direct filename
  const parts = imageUrl.split("/");
  return parts[parts.length - 1] || null;
};

// Helper function to delete member's images
const deleteMemberImages = async (member: any): Promise<void> => {
  const imageDeletionPromises: Promise<boolean>[] = [];

  // Delete profile image
  if (member.photoUrl) {
    const profileFilename = extractImageFilename(member.photoUrl);
    if (profileFilename) {
      imageDeletionPromises.push(
        deleteImage(profileFilename, ImageType.PROFILE)
      );
    }
  }

  // Delete Document image
  if (member.documentUrl) {
    const documentFileName = extractImageFilename(member.documentUrl);
    if (documentFileName) {
      imageDeletionPromises.push(
        deleteImage(documentFileName, ImageType.DOCUMENT)
      );
    }
  }

  // Delete payment-related images from payment records
  if (member.payment && member.payment.length > 0) {
    member.payment.forEach((payment: any) => {
      if (payment.rentBillScreenshot) {
        const rentBillFilename = extractImageFilename(
          payment.rentBillScreenshot
        );
        if (rentBillFilename) {
          imageDeletionPromises.push(
            deleteImage(rentBillFilename, ImageType.PAYMENT)
          );
        }
      }

      if (payment.electricityBillScreenshot) {
        const electricityBillFilename = extractImageFilename(
          payment.electricityBillScreenshot
        );
        if (electricityBillFilename) {
          imageDeletionPromises.push(
            deleteImage(electricityBillFilename, ImageType.PAYMENT)
          );
        }
      }
    });
  }

  // Execute all image deletions
  try {
    await Promise.allSettled(imageDeletionPromises);
    console.log(`Images deleted for member: ${member.memberId}`);
  } catch (error) {
    console.error(
      `Error deleting images for member ${member.memberId}:`,
      error
    );
    // Don't throw error - continue with member deletion even if image deletion fails
  }
};

// Delete a single member
export const deleteMember = async (
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

    const { memberId } = req.params;

    // Find the member with all related data
    const member = await prisma.member.findUnique({
      where: { id: memberId },
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
          },
        },
        payment: {
          select: {
            id: true,
            rentBillScreenshot: true,
            electricityBillScreenshot: true,
          },
        },
      },
    });

    if (!member) {
      res.status(404).json({
        success: false,
        message: "Member not found",
      } as ApiResponse<null>);
      return;
    }

    // Verify admin can delete this member (same pgType)
    if (member.pg.type !== admin.pgType) {
      res.status(403).json({
        success: false,
        message: "You can only delete members of your PG type",
      } as ApiResponse<null>);
      return;
    }

    // Store member info for response
    const memberInfo = {
      memberId: member.memberId,
      name: member.name,
      pgName: member.pg.name,
      roomNo: member.room?.roomNo || null,
    };

    // Delete member's images first (before database deletion)
    await deleteMemberImages(member);

    // Delete member from database (this will cascade delete payments due to schema setup)
    await prisma.member.delete({
      where: { id: memberId },
    });

    res.status(200).json({
      success: true,
      message: "Member deleted successfully",
      data: {
        deletedMember: memberInfo,
        deletionSummary: {
          memberDeleted: true,
          paymentsDeleted: member.payment.length,
          imagesDeleted: [
            member.photoUrl ? "profile image" : null,
            member.documentUrl ? "document image" : null,
            ...member.payment
              .flatMap((p) => [
                p.rentBillScreenshot ? "rent bill screenshot" : null,
                p.electricityBillScreenshot
                  ? "electricity bill screenshot"
                  : null,
              ])
              .filter(Boolean),
          ].filter(Boolean).length,
        },
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error deleting member:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to delete member",
    } as ApiResponse<null>);
  }
};

// Delete multiple members
export const deleteMultipleMembers = async (
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

    const { memberIds }: DeleteMultipleMembersRequest = req.body;

    // Validate request body
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "Invalid request. memberIds must be a non-empty array",
      } as ApiResponse<null>);
      return;
    }

    // Limit the number of members that can be deleted at once
    if (memberIds.length > 50) {
      res.status(400).json({
        success: false,
        message: "Cannot delete more than 50 members at once",
      } as ApiResponse<null>);
      return;
    }

    // Find all members with their related data
    const members = await prisma.member.findMany({
      where: {
        id: { in: memberIds },
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
          },
        },
        payment: {
          select: {
            id: true,
            rentBillScreenshot: true,
            electricityBillScreenshot: true,
          },
        },
      },
    });

    if (members.length === 0) {
      res.status(404).json({
        success: false,
        message: "No members found with the provided IDs",
      } as ApiResponse<null>);
      return;
    }

    // Verify admin can delete all these members (same pgType)
    const invalidMembers = members.filter(
      (member) => member.pg.type !== admin.pgType
    );
    if (invalidMembers.length > 0) {
      res.status(403).json({
        success: false,
        message: "You can only delete members of your PG type",
        error: `Cannot delete members: ${invalidMembers
          .map((m) => m.memberId)
          .join(", ")}`,
      } as ApiResponse<null>);
      return;
    }

    // Check for non-existent member IDs
    const foundMemberIds = members.map((member) => member.id);
    const notFoundMemberIds = memberIds.filter(
      (id) => !foundMemberIds.includes(id)
    );

    // Store member info for response
    const deletedMembersInfo = members.map((member) => ({
      memberId: member.memberId,
      name: member.name,
      pgName: member.pg.name,
      roomNo: member.room?.roomNo || null,
      paymentsCount: member.payment.length,
    }));

    let totalImagesDeleted = 0;
    let totalPaymentsDeleted = 0;

    // Delete images for all members
    const imageDeletionPromises = members.map(async (member) => {
      await deleteMemberImages(member);

      // Count images for reporting
      let memberImagesCount = 0;
      if (member.photoUrl) memberImagesCount++;
      if (member.documentUrl) memberImagesCount++;
      memberImagesCount += member.payment.reduce((count, payment) => {
        if (payment.rentBillScreenshot) count++;
        if (payment.electricityBillScreenshot) count++;
        return count;
      }, 0);

      totalImagesDeleted += memberImagesCount;
      totalPaymentsDeleted += member.payment.length;
    });

    // Execute all image deletions in parallel
    await Promise.allSettled(imageDeletionPromises);

    // Delete all members from database (this will cascade delete payments)
    const deleteResult = await prisma.member.deleteMany({
      where: {
        id: { in: foundMemberIds },
      },
    });

    res.status(200).json({
      success: true,
      message: `${deleteResult.count} members deleted successfully`,
      data: {
        deletedMembers: deletedMembersInfo,
        deletionSummary: {
          totalMembersDeleted: deleteResult.count,
          totalPaymentsDeleted,
          totalImagesDeleted,
          notFoundMemberIds:
            notFoundMemberIds.length > 0 ? notFoundMemberIds : undefined,
        },
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error deleting multiple members:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to delete members",
    } as ApiResponse<null>);
  }
};
