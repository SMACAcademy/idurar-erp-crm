import { Response, Request } from "express";
import prisma from "../config/prisma";
import { ApiResponse } from "../types/response";
import { AuthenticatedRequest } from "../middlewares/auth";
import { PgType } from "@prisma/client";


// Get filter options for dashboard member filtering
export const getDashboardFilterOptions = async (
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

    // Get all PGs of admin's type
    const pgs = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { id: true, name: true, location: true },
    });

    const pgIds = pgs.map((pg) => pg.id);

    // Get unique work types from members of admin's PG type
    const workTypes = await prisma.member.findMany({
      where: { pgId: { in: pgIds } },
      select: { work: true },
      distinct: ["work"],
    });

    // Get PG options for admin's PG type
    const pgOptions = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { id: true, name: true, location: true },
      orderBy: { name: "asc" },
    });

    // Build filter options with proper structure for frontend
    const filters = [
      {
        id: "search",
        type: "search" as const,
        placeholder: "Search by name, memberId, email, phone...",
        fullWidth: true,
        gridSpan: 4,
      },
      {
        id: "pgId",
        label: "PG",
        placeholder: "Select PG",
        type: "select",
        options: pgOptions.map((pg) => ({
          value: pg.id,
          label: `${pg.name} - ${pg.location}`,
        })),
        variant: "dropdown" as const,
        searchable: true,
      },
      {
        id: "work",
        label: "Work Type",
        placeholder: "Select work type",
        type: "multiSelect",
        options: workTypes
          .filter((w) => w.work)
          .map((work) => ({
            value: work.work,
            label: work.work,
          })),
        variant: "dropdown" as const,
        searchable: true,
        showSelectAll: true,
      },
      {
        id: "paymentStatus",
        label: "Payment Status",
        placeholder: "Select payment status",
        type: "select",
        options: [
          { value: "PENDING", label: "Pending" },
          { value: "PAID", label: "Paid" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
          { value: "OVERDUE", label: "Overdue" },
        ],
      },
      {
        id: "sortBy",
        label: "Sort By",
        placeholder: "Select sort field",
        type: "select",
        options: [
          { value: "createdAt", label: "Date Joined" },
          { value: "name", label: "Name" },
          { value: "memberId", label: "Member ID" },
          { value: "dateOfJoining", label: "Joining Date" },
          { value: "age", label: "Age" },
          { value: "work", label: "Work Type" },
          { value: "pgName", label: "PG Name" },
          { value: "pgLocation", label: "PG Location" },
          { value: "roomNo", label: "Room Number" },
          { value: "rentAmount", label: "Rent Amount" },
        ],
        defaultValue: "createdAt",
      },
      {
        id: "sortOrder",
        label: "Sort Order",
        placeholder: "Select sort order",
        type: "select",
        options: [
          { value: "desc", label: "Descending" },
          { value: "asc", label: "Ascending" },
        ],
        defaultValue: "desc",
      },
    ];

    res.status(200).json({
      success: true,
      message: "Dashboard filter options retrieved successfully",
      data: {
        filters,
        totalPGs: pgs.length,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting dashboard filter options:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve dashboard filter options",
    } as ApiResponse<null>);
  }
};

// Get filter options for member filtering
export const getMemberFilterOptions = async (
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

    // Get all PGs of admin's type
    const pgs = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { id: true, name: true, location: true },
    });

    const pgIds = pgs.map((pg) => pg.id);

    // Get pgLocation parameter for room filtering (cascading filter)
    const pgLocation = req.query.pgLocation as string;

    // Get unique PG locations for admin's PG type
    const pgLocations = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { location: true },
      distinct: ["location"],
    });

    // Get rooms based on selected pg location (cascading filter)
    let roomsFilter: any = { pGId: { in: pgIds } };
    if (pgLocation) {
      // Parse comma-separated values for multiple PG locations
      const selectedPgLocations = pgLocation
        .split(",")
        .map((loc) => decodeURIComponent(loc.trim()))
        .filter((loc) => loc.length > 0);

      if (selectedPgLocations.length > 0) {
        const pgsInLocation = await prisma.pG.findMany({
          where: {
            type: admin.pgType,
            location: { in: selectedPgLocations },
          },
          select: { id: true },
        });
        const pgIdsInLocation = pgsInLocation.map((pg) => pg.id);
        roomsFilter = { pGId: { in: pgIdsInLocation } };
      }
    }

    const rooms = await prisma.room.findMany({
      where: roomsFilter,
      select: { id: true, roomNo: true },
      orderBy: { roomNo: "asc" },
    });

    // Build filter options with proper structure for frontend
    const filters = [
      {
        id: "search",
        type: "search" as const,
        placeholder: "Search by name, memberId, email, phone...",
        fullWidth: true,
        gridSpan: 4,
      },
      {
        id: "pgLocation",
        label: "PG Location",
        placeholder: "Select PG location",
        type: "multiSelect",
        options: pgLocations
          .filter((pg) => pg.location) // Filter out null/undefined PG location values
          .map((pgLoc) => ({
            value: pgLoc.location,
            label: pgLoc.location,
          })),
        variant: "dropdown" as const,
        searchable: true,
        showSelectAll: true,
      },
      {
        id: "paymentStatus",
        label: "Payment Status",
        placeholder: "Select payment status",
        type: "select",
        options: [
          { value: "PAID", label: "Paid" },
          { value: "PENDING", label: "Pending" },
          { value: "OVERDUE", label: "Overdue" },
        ],
      },
      {
        id: "sortBy",
        label: "Sort By",
        placeholder: "Select sort field",
        type: "select",
        options: [
          { value: "createdAt", label: "Date Joined" },
          { value: "name", label: "Name" },
          { value: "memberId", label: "Member ID" },
          { value: "dateOfJoining", label: "Joining Date" },
          { value: "age", label: "Age" },
          { value: "pgName", label: "PG Name" },
          { value: "pgLocation", label: "PG Location" },
          { value: "roomNo", label: "Room Number" },
          { value: "rentAmount", label: "Rent Amount" },
        ],
        defaultValue: "createdAt",
      },
      {
        id: "sortOrder",
        label: "Sort Order",
        placeholder: "Select sort order",
        type: "select",
        options: [
          { value: "desc", label: "Descending" },
          { value: "asc", label: "Ascending" },
        ],
        defaultValue: "desc",
      },
    ];

    res.status(200).json({
      success: true,
      message: "Member filter options retrieved successfully",
      data: {
        filters,
        totalPGs: pgs.length,
        totalRooms: rooms.length,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting member filter options:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve member filter options",
    } as ApiResponse<null>);
  }
};

// Get filter options for members payment data filtering
export const getMembersPaymentFilterOptions = async (
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

    // Get all PGs of admin's type
    const pgs = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { id: true, name: true, location: true },
    });

    const pgIds = pgs.map((pg) => pg.id);

    // Get unique PG locations for admin's PG type
    const pgLocations = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { location: true },
      distinct: ["location"],
    });

    // Get current date for generating month/year options
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Generate month options - exclude future months for current year
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Create month options based on available months (no future months)
    const monthOptions = monthNames
      .map((name, index) => ({
        value: (index + 1).toString(),
        label: name,
      }))
      .filter((month, index) => {
        // For current year, only show months up to current month
        // For past years, show all months
        const monthNumber = index + 1;
        return monthNumber <= currentMonth;
      });

    // Generate year options - get years that actually have payment data
    // Start from current year and go back, but only include years with data
    const availableYears = await prisma.payment.findMany({
      where: {
        pgId: { in: pgIds },
      },
      select: {
        year: true,
      },
      distinct: ["year"],
      orderBy: {
        year: "desc",
      },
    });

    // Create year options from available data, but don't exceed current year
    const yearOptions = availableYears
      .filter((payment) => payment.year <= currentYear)
      .map((payment) => ({
        value: payment.year.toString(),
        label: payment.year.toString(),
      }));

    // If no payment data exists, at least include current year
    if (yearOptions.length === 0) {
      yearOptions.push({
        value: currentYear.toString(),
        label: currentYear.toString(),
      });
    }

    // Build filter options with proper structure for frontend
    const filters = [
      {
        id: "search",
        type: "search" as const,
        placeholder: "Search by name, memberId, email, phone...",
        fullWidth: true,
        gridSpan: 4,
      },
      {
        id: "year",
        label: "Year",
        placeholder: "Select year",
        type: "select",
        options: yearOptions,
        defaultValue: currentYear.toString(),
      },
      {
        id: "month",
        label: "Month",
        placeholder: "Select month",
        type: "select",
        options: monthOptions,
        defaultValue: currentMonth.toString(),
      },
      {
        id: "pgLocation",
        label: "PG Location",
        placeholder: "Select PG location",
        type: "multiSelect",
        options: pgLocations
          .filter((pg) => pg.location)
          .map((pgLoc) => ({
            value: pgLoc.location,
            label: pgLoc.location,
          })),
        variant: "dropdown" as const,
        searchable: true,
        showSelectAll: true,
      },
      {
        id: "paymentStatus",
        label: "Payment Status",
        placeholder: "Select payment status",
        type: "select",
        options: [
          { value: "PAID", label: "Paid" },
          { value: "PENDING", label: "Pending" },
          { value: "OVERDUE", label: "Overdue" },
        ],
        defaultValue: "PAID",
      },
      {
        id: "approvalStatus",
        label: "Approval Status",
        placeholder: "Select approval status",
        type: "select",
        options: [
          { value: "APPROVED", label: "Approved" },
          { value: "PENDING", label: "Pending" },
          { value: "REJECTED", label: "Rejected" },
        ],
        defaultValue: "PENDING",
      },
      {
        id: "sortBy",
        label: "Sort By",
        placeholder: "Select sort field",
        type: "select",
        options: [
          { value: "createdAt", label: "Date Joined" },
          { value: "name", label: "Name" },
          { value: "memberId", label: "Member ID" },
          { value: "dateOfJoining", label: "Joining Date" },
          { value: "age", label: "Age" },
          { value: "location", label: "Member Location" },
          { value: "work", label: "Work Type" },
          { value: "pgName", label: "PG Name" },
          { value: "pgLocation", label: "PG Location" },
          { value: "roomNo", label: "Room Number" },
          { value: "rentAmount", label: "Rent Amount" },
        ],
        defaultValue: "createdAt",
      },
      {
        id: "sortOrder",
        label: "Sort Order",
        placeholder: "Select sort order",
        type: "select",
        options: [
          { value: "desc", label: "Descending" },
          { value: "asc", label: "Ascending" },
        ],
        defaultValue: "desc",
      },
    ];

    res.status(200).json({
      success: true,
      message: "Members payment filter options retrieved successfully",
      data: {
        filters,
        totalPGs: pgs.length,
        currentDate: {
          month: currentMonth,
          year: currentYear,
        },
        // Helper function for frontend to generate month options based on year
        monthOptionsGenerator: {
          currentYear: currentYear,
          currentMonth: currentMonth,
          allMonths: monthNames.map((name, index) => ({
            value: (index + 1).toString(),
            label: name,
          })),
        },
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting members payment filter options:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve members payment filter options",
    } as ApiResponse<null>);
  }
};

// Helper function to get month options for a specific year
export const getMonthOptionsForYear = async (
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

    const selectedYear = parseInt(req.query.year as string);
    if (!selectedYear) {
      res.status(400).json({
        success: false,
        message: "Year parameter is required",
      } as ApiResponse<null>);
      return;
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    let availableMonths: { value: string; label: string }[];

    if (selectedYear === currentYear) {
      // For current year, only show months up to current month
      availableMonths = monthNames
        .slice(0, currentMonth)
        .map((name, index) => ({
          value: (index + 1).toString(),
          label: name,
        }));
    } else if (selectedYear < currentYear) {
      // For past years, show all months
      availableMonths = monthNames.map((name, index) => ({
        value: (index + 1).toString(),
        label: name,
      }));
    } else {
      // For future years (shouldn't happen with proper year filtering), show empty
      availableMonths = [];
    }

    res.status(200).json({
      success: true,
      message: `Month options retrieved for year ${selectedYear}`,
      data: {
        year: selectedYear,
        months: availableMonths,
        maxMonth: selectedYear === currentYear ? currentMonth : 12,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting month options for year:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve month options",
    } as ApiResponse<null>);
  }
};

// Get filter options for room filtering
export const getRoomFilterOptions = async (
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

    // Get all PGs of admin's type
    const pgs = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { id: true, name: true, location: true },
      orderBy: { location: "asc" },
    });

    // Build filter options with proper structure for frontend
    const filters = [
      {
        id: "search",
        type: "search" as const,
        placeholder: "Search by room number...",
        fullWidth: true,
        gridSpan: 4,
      },
      {
        id: "pgLocation",
        label: "PG Location",
        placeholder: "Select PG location",
        type: "select",
        options: pgs.map((pg) => ({
          value: pg.id,
          label: pg.location,
        })),
        defaultValue: pgs.length > 0 ? pgs[0].id : null,
      },
      {
        id: "occupancyStatus",
        label: "Occupancy Status",
        placeholder: "Select occupancy status",
        type: "select",
        options: [
          { value: "FULLY_VACANT", label: "Fully Vacant" },
          { value: "PARTIALLY_OCCUPIED", label: "Partially Occupied" },
          { value: "FULLY_OCCUPIED", label: "Fully Occupied" },
        ],
      },
    ];

    res.status(200).json({
      success: true,
      message: "Room filter options retrieved successfully",
      data: { 
        filters, 
        totalPGs: pgs.length,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting room filter options:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve room filter options",
    } as ApiResponse<null>);
  }
};

// GET rooms by location
export const getRoomsByLocation = async (
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

    const { location } = req.params;

    if (!location) {
      res.status(400).json({
        success: false,
        message: "Location is required",
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

    // Get the PGs of admin's type that match the location
    const pgs = await prisma.pG.findFirst({
      where: {
        type: admin.pgType,
        location: {
          equals: location,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (!pgs) {
      res.status(200).json({
        success: true,
        message: "No PGs found for the specified location and PG type",
        data: [],
      } as ApiResponse<any>);
      return;
    }

    const rooms = await prisma.room.findMany({
      where: {
        pGId: pgs.id,
      },
      select: {
        roomNo: true,
        rent: true,
      },
      orderBy: {
        roomNo: "asc",
      },
    });

    res.status(200).json({
      success: true,
      message: "Rooms retrieved successfully by location",
      data: {
        pgId: pgs.id,
        rooms,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting rooms by location:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve rooms by location",
    } as ApiResponse<null>);
  }
};

// GET enquiry filter options (admin only)
export const getEnquiryFilterOptions = async (
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

    // Get all admins for "Resolved By" filter options
    const allAdmins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        pgType: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const resolverOptions = allAdmins.map((admin) => ({
      value: admin.id,
      label: `${admin.name} (${admin.pgType})`,
    }));

    // Build filter options with proper structure for frontend
    const filters = [
      {
        id: "search",
        type: "search" as const,
        placeholder: "Search by name, phone, or message...",
        fullWidth: true,
        gridSpan: 4,
      },
      {
        id: "status",
        label: "Status",
        placeholder: "Select status",
        type: "select",
        options: [
          { value: "NOT_RESOLVED", label: "Not Resolved" },
          { value: "RESOLVED", label: "Resolved" },
        ],
        variant: "dropdown" as const,
      },
      {
        id: "resolvedBy",
        label: "Resolved By",
        placeholder: "Select resolver",
        type: "select",
        options: resolverOptions,
        variant: "dropdown" as const,
        searchable: true,
      },
      {
        id: "dateRange",
        label: "Date Range",
        placeholder: "Select date range",
        type: "select",
        options: [
          { value: "7", label: "Last 7 days" },
          { value: "30", label: "Last 30 days" },
          { value: "90", label: "Last 3 months" },
          { value: "180", label: "Last 6 months" },
          { value: "365", label: "Last 1 year" },
          { value: "all", label: "All time" },
        ],
        variant: "dropdown" as const,
      },
    ];

    // Get total enquiries count for additional info
    const totalEnquiries = await prisma.enquiry.count();

    res.status(200).json({
      success: true,
      message: "Enquiry filter options retrieved successfully",
      data: {
        filters,
        totalEnquiries,
        defaultValues: {
          page: 1,
          limit: 10,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting enquiry filter options:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve enquiry filter options",
    } as ApiResponse<null>);
  }
};

// Get PG location filter options for user registration
export const getPgLocationOptions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get pgType from query parameter (optional filter)
    const pgType = req.query.pgType as PgType;

    // Build where clause
    const whereClause: any = {};
    if (pgType && Object.values(PgType).includes(pgType)) {
      whereClause.type = pgType;
    }

    // Get all PGs with their locations
    const pgs = await prisma.pG.findMany({
      where: whereClause,
      select: {
        id: true,
        location: true,
        name: true,
        type: true,
      },
      orderBy: [{ type: "asc" }, { location: "asc" }],
    });

    // Create options array with pgId as value and location as label
    const options = pgs
      .filter((pg) => pg.location) // Filter out null/undefined locations
      .map((pg) => ({
        value: pg.id,
        label: pg.location,
        pgName: pg.name, // Additional info for frontend
        pgType: pg.type, // Additional info for frontend
      }));

    res.status(200).json({
      success: true,
      message: "PG location options retrieved successfully",
      data: {
        options,
      },
    });
  } catch (error) {
    console.error("Error getting PG location options:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve PG location options",
    });
  }
};

// Get rooms based on PG ID
export const getRoomsByPgId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get pgId from query parameter (required)
    const pgId = req.query.pgId as string;

    if (!pgId) {
      res.status(400).json({
        success: false,
        message: "PG ID is required",
        error: "Please provide a valid PG ID to get rooms",
      });
      return;
    }

    // Verify PG exists
    const pg = await prisma.pG.findUnique({
      where: { id: pgId },
      select: {
        id: true,
        name: true,
        location: true,
        type: true,
      },
    });

    if (!pg) {
      res.status(404).json({
        success: false,
        message: "PG not found",
        error: "No PG found with the provided ID",
      });
      return;
    }

    // Get all rooms for the specified PG
    const rooms = await prisma.room.findMany({
      where: { pGId: pgId },
      select: {
        id: true,
        roomNo: true,
        capacity: true,
        rent: true,
        _count: {
          select: {
            members: true, // Count current members
          },
        },
      },
      orderBy: { roomNo: "asc" },
    });

    // Create options array with roomId as value and roomNo as label
    const options = rooms.map((room) => ({
      value: room.id,
      label: room.roomNo,
      capacity: room.capacity,
      currentOccupancy: room._count.members,
      rent: room.rent,
      isAvailable: room._count.members < room.capacity, // Check if room has space
    }));

    res.status(200).json({
      success: true,
      message: "Rooms retrieved successfully",
      data: {
        options,
        pgInfo: {
          id: pg.id,
          name: pg.name,
          location: pg.location,
          type: pg.type,
        },
      },
    });
  } catch (error) {
    console.error("Error getting rooms by PG ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve rooms",
    });
  }
};

// Get available weeks for reports (excluding future weeks)
export const getAvailableWeeks = async (
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

    // Get month parameter from query (optional, defaults to current month)
    const monthParam = req.query.month as string;
    const yearParam = req.query.year as string;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Use provided month/year or default to current month/year
    const month = monthParam ? parseInt(monthParam) : currentMonth;
    const year = yearParam ? parseInt(yearParam) : currentYear;

    if (month < 1 || month > 12) {
      res.status(400).json({
        success: false,
        message: "Invalid month. Month should be between 1-12",
      } as ApiResponse<null>);
      return;
    }

    const weeks = [];
    let currentWeek = null;

    // Get the first and last day of the specified month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // Last day of the month

    // Helper function to get week number within the year (1-53)
    const getWeekNumberInYear = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Calculate weeks within the specified month
    let currentWeekStart = new Date(monthStart);

    while (currentWeekStart <= monthEnd) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      
      // If we're in a future month/year, or future week in current month, break
      if (year > currentYear || 
          (year === currentYear && month > currentMonth) ||
          (year === currentYear && month === currentMonth && currentWeekStart > currentDate)) {
        break;
      }

      // Ensure week end doesn't go beyond the month
      if (weekEnd > monthEnd) {
        weekEnd.setTime(monthEnd.getTime());
      }

      // Only add week if it has started
      if (currentWeekStart <= currentDate) {
        // Get the absolute week number within the year
        const weekNumberInYear = getWeekNumberInYear(currentWeekStart);
        
        const weekData = {
          week: weekNumberInYear, // Week number within the year (1-53)
          month: month,
          year: year,
          startDate: currentWeekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0],
          label: `Week ${weekNumberInYear} (${currentWeekStart.getDate()}-${weekEnd.getDate()})`,
        };
        
        weeks.push(weekData);

        // Check if this is the current week
        if (year === currentYear && month === currentMonth && 
            currentDate >= currentWeekStart && currentDate <= weekEnd) {
          currentWeek = weekData;
        }
      }

      // Move to next week
      currentWeekStart = new Date(weekEnd);
      currentWeekStart.setDate(weekEnd.getDate() + 1);
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    res.status(200).json({
      success: true,
      message: "Available weeks retrieved successfully",
      data: {
        weeks: weeks.reverse(), // Most recent first
        currentWeek: currentWeek, // Current week to select
        monthInfo: {
          month: month,
          year: year,
          name: monthNames[month - 1],
          label: `${monthNames[month - 1]} ${year}`,
        },
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting available weeks:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve available weeks",
    } as ApiResponse<null>);
  }
};

// Get available months for reports (excluding future months)
export const getAvailableMonths = async (
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

    // Get all PGs of admin's type
    const pgs = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { id: true },
    });

    const pgIds = pgs.map((pg) => pg.id);

    // Get year parameter from query (optional, defaults to current year)
    const yearParam = req.query.year as string;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Use provided year or default to current year
    const year = yearParam ? parseInt(yearParam) : currentYear;

    if (year < 1900 || year > currentYear + 10) {
      res.status(400).json({
        success: false,
        message: "Invalid year",
      } as ApiResponse<null>);
      return;
    }

    // If requested year is in the future, return empty array
    if (year > currentYear) {
      res.status(200).json({
        success: true,
        message: "No months available for future years",
        data: {
          months: [],
          currentMonth: null,
          yearInfo: {
            year: year,
            isFuture: true,
          },
        },
      } as ApiResponse<any>);
      return;
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const months = [];
    let currentMonthData = null;

    // For requested year, determine max month
    const maxMonth = year === currentYear ? currentMonth : 12;

    // Check if admin has any payment data for the requested year
    const hasDataInYear = await prisma.payment.count({
      where: {
        pgId: { in: pgIds },
        year: year,
      },
    });

    // Generate months for the requested year up to maxMonth
    for (let month = 1; month <= maxMonth; month++) {
      const monthData = {
        month: month,
        year: year,
        name: monthNames[month - 1],
        label: `${monthNames[month - 1]} ${year}`,
      };
      
      months.push(monthData);

      // Mark current month if we're in the requested year
      if (year === currentYear && month === currentMonth) {
        currentMonthData = monthData;
      }
    }

    res.status(200).json({
      success: true,
      message: "Available months retrieved successfully",
      data: {
        months: months.reverse(), // Most recent first
        currentMonth: currentMonthData, // Current month to select
        yearInfo: {
          year: year,
          isCurrent: year === currentYear,
          isPast: year < currentYear,
          hasData: hasDataInYear > 0,
        },
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting available months:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve available months",
    } as ApiResponse<null>);
  }
};

