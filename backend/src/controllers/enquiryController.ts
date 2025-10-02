import { Response, Request } from "express";
import prisma from "../config/prisma";
import { ApiResponse } from "../types/response";
import { CreateEnquiryRequest } from "../types/request";
import { AuthenticatedRequest } from "../middlewares/auth";

export const createEnquiry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, phone, message }: CreateEnquiryRequest = req.body;

    // Create new enquiry
    const newEnquiry = await prisma.enquiry.create({
      data: {
        name,
        phone,
        message,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        message: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully. We will get back to you soon.",
      data: newEnquiry,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error creating enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to submit enquiry",
    } as ApiResponse<null>);
  }
};

// GET all enquiries (admin only - both admin types can view)
export const getEnquiries = async (
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

    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      resolvedBy,
      dateRange,
    } = req.query;

    // Parse pagination parameters
    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Build where clause for filtering
    const whereClause: any = {};

    // Filter by status if provided
    if (status && typeof status === "string") {
      whereClause.status = status;
    }

    // Filter by resolved by admin if provided
    if (resolvedBy && typeof resolvedBy === "string") {
      whereClause.resolvedBy = resolvedBy;
    }

    // Filter by date range if provided
    if (dateRange && typeof dateRange === "string" && dateRange !== "all") {
      const days = parseInt(dateRange, 10);
      if (!isNaN(days)) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        
        whereClause.createdAt = {
          gte: startDate,
        };
      }
    }

    // Search in name, phone, or message
    if (search && typeof search === "string") {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    // Get total count for pagination
    const totalCount = await prisma.enquiry.count({
      where: whereClause,
    });

    // Get enquiries with pagination
    const enquiries = await prisma.enquiry.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        phone: true,
        message: true,
        status: true,
        resolvedBy: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        resolver: {
          select: {
            id: true,
            name: true,
            email: true,
            pgType: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      success: true,
      message: "Enquiries retrieved successfully",
      data: {
        enquiries,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total: totalCount,
          totalPages,
        },
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting enquiries:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve enquiries",
    } as ApiResponse<null>);
  }
};

// GET single enquiry by ID (admin only)
export const getEnquiryById = async (
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

    const { enquiryId } = req.params;

    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      select: {
        id: true,
        name: true,
        phone: true,
        message: true,
        status: true,
        resolvedBy: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        resolver: {
          select: {
            id: true,
            name: true,
            email: true,
            pgType: true,
          },
        },
      },
    });

    if (!enquiry) {
      res.status(404).json({
        success: false,
        message: "Enquiry not found",
      } as ApiResponse<null>);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Enquiry retrieved successfully",
      data: enquiry,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve enquiry",
    } as ApiResponse<null>);
  }
};

// UPDATE enquiry status (admin only) - Mark enquiry as resolved
export const updateEnquiryStatus = async (
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

    const { enquiryId } = req.params;

    // Check if enquiry exists
    const existingEnquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      select: { id: true, status: true },
    });

    if (!existingEnquiry) {
      res.status(404).json({
        success: false,
        message: "Enquiry not found",
      } as ApiResponse<null>);
      return;
    }

    // Check if enquiry is already resolved
    if (existingEnquiry.status === "RESOLVED") {
      res.status(400).json({
        success: false,
        message: "Enquiry is already resolved",
      } as ApiResponse<null>);
      return;
    }

    // Update enquiry to resolved status
    const updatedEnquiry = await prisma.enquiry.update({
      where: { id: enquiryId },
      data: {
        status: "RESOLVED",
        resolvedBy: req.admin.id,
        resolvedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        message: true,
        status: true,
        resolvedBy: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        resolver: {
          select: {
            id: true,
            name: true,
            email: true,
            pgType: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Enquiry marked as resolved successfully",
      data: updatedEnquiry,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error updating enquiry status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to update enquiry status",
    } as ApiResponse<null>);
  }
};

// DELETE enquiry (admin only)
export const deleteEnquiry = async (
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

    const { enquiryId } = req.params;

    // Check if enquiry exists
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      select: { id: true },
    });

    if (!enquiry) {
      res.status(404).json({
        success: false,
        message: "Enquiry not found",
      } as ApiResponse<null>);
      return;
    }

    // Delete enquiry
    await prisma.enquiry.delete({
      where: { id: enquiryId },
    });

    res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully",
    } as ApiResponse<null>);
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to delete enquiry",
    } as ApiResponse<null>);
  }
};
