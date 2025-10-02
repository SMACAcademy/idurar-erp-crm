import { Response } from "express";
import prisma from "../config/prisma";
import { ApiResponse } from "../types/response";
import { AuthenticatedRequest } from "../middlewares/auth";
import { 
  getOrComputeReportData, 
  ReportCardsData,
  CompleteReportData 
} from "../utils/pgReportCalculators";
import { PgType, ReportType } from "@prisma/client";

// Helper function to format dashboard cards
const formatDashboardCards = (
  admin: { pgType: any },
  totalMembers: number,
  totalRentCollection: number,
  totalNewMembers: number,
  totalMemberTrend: number,
  totalRentCollectionTrend: number,
  totalNewMemberTrend: number,
  pendingPayments: number,
  pendingRegistrations: number,
  currentMonth: number,
  currentYear: number
) => {
  // Calculate trend percentages
  const calculateTrendPercentage = (current: number, trend: number): number => {
    if (current === 0) return 0;
    const previous = current - trend;
    if (previous === 0) return trend > 0 ? 100 : 0;
    return Math.round((trend / previous) * 100);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString("en-IN")}`;
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-IN");
  };

  // Get month name
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

  return [
    {
      title: "Total Members",
      value: formatNumber(totalMembers),
      trend: totalMemberTrend >= 0 ? "up" : "down",
      percentage: Math.abs(
        calculateTrendPercentage(totalMembers, totalMemberTrend)
      ),
      icon: "users",
      color: "primary",
      subtitle: `Compared to last month in ${admin.pgType.toLowerCase()}'s PG`,
    },
    {
      title: "Rent Collection",
      value: formatCurrency(totalRentCollection),
      trend: totalRentCollectionTrend >= 0 ? "up" : "down",
      percentage: Math.abs(
        calculateTrendPercentage(totalRentCollection, totalRentCollectionTrend)
      ),
      icon: "indianRupee",
      color: "success",
      subtitle: `${monthNames[currentMonth - 1]} ${currentYear}`,
    },
    {
      title: "New Members",
      value: formatNumber(totalNewMembers),
      trend: totalNewMemberTrend >= 0 ? "up" : "down",
      percentage: Math.abs(
        calculateTrendPercentage(totalNewMembers, totalNewMemberTrend)
      ),
      icon: totalNewMemberTrend >= 0 ? "userPlus" : "userMinus",
      color: totalNewMemberTrend >= 0 ? "success" : "error",
      subtitle:
        totalNewMemberTrend >= 0
          ? "More than previous month"
          : "Lesser than previous month",
    },
    {
      title: "Pending Payment Approvals",
      value: formatNumber(pendingPayments),
      icon: "clock",
      color: "warning",
      subtitle: "Awaiting admin action",
      ...(pendingPayments > 0 && {
        badge: {
          text: "Action Required",
          color: "error",
        },
        onClickRoute: "/admin/approvals/payments",
      }),
    },
    {
      title: "Pending Registration Approvals",
      value: formatNumber(pendingRegistrations),
      icon: "file",
      color: "warning",
      subtitle: "Awaiting admin action",
      ...(pendingRegistrations > 0 && {
        badge: {
          text: "Action Required",
          color: "error",
        },
        onClickRoute: "/admin/approvals/members",
      }),
    },
  ];
};

// Get dashboard statistics in card format (calculate dynamically)
export const getDashboardStats = async (
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

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get all PGs of admin's type
    const pgs = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { id: true },
    });

    const pgIds = pgs.map((pg) => pg.id);

    // Calculate current month statistics dynamically
    const [
      totalMembers,
      rentCollection,
      newMembers,
      paymentApprovals,
      registrationApprovals,
    ] = await Promise.all([
      // Total members across all PGs of this type
      prisma.member.count({
        where: { pgId: { in: pgIds } },
      }),

      // Rent collection for current month across all PGs of this type
      prisma.payment.aggregate({
        where: {
          pgId: { in: pgIds },
          month: currentMonth,
          year: currentYear,
          approvalStatus: "APPROVED",
        },
        _sum: { amount: true },
      }),

      // New members this month across all PGs of this type
      prisma.member.count({
        where: {
          pgId: { in: pgIds },
          dateOfJoining: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1),
          },
        },
      }),

      // Payment approvals this month across all PGs of this type
      prisma.payment.count({
        where: {
          pgId: { in: pgIds },
          month: currentMonth,
          year: currentYear,
          approvalStatus: "APPROVED",
        },
      }),

      // Registration approvals this month across all PGs of this type
      prisma.member.count({
        where: {
          pgId: { in: pgIds },
          createdAt: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1),
          },
        },
      }),
    ]);

    // Get previous month stats for trend calculation
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [prevTotalMembers, prevRentCollection, prevNewMembers] =
      await Promise.all([
        // Previous month total members (at the end of previous month)
        prisma.member.count({
          where: {
            pgId: { in: pgIds },
            dateOfJoining: {
              lt: new Date(currentYear, currentMonth - 1, 1),
            },
          },
        }),

        // Previous month rent collection
        prisma.payment.aggregate({
          where: {
            pgId: { in: pgIds },
            month: prevMonth,
            year: prevYear,
            approvalStatus: "APPROVED",
          },
          _sum: { amount: true },
        }),

        // Previous month new members
        prisma.member.count({
          where: {
            pgId: { in: pgIds },
            dateOfJoining: {
              gte: new Date(prevYear, prevMonth - 1, 1),
              lt: new Date(prevYear, prevMonth, 1),
            },
          },
        }),
      ]);

    // Calculate trends
    const totalMemberTrend = totalMembers - prevTotalMembers;
    const totalRentCollection = rentCollection._sum.amount || 0;
    const prevTotalRentCollection = prevRentCollection._sum.amount || 0;
    const totalRentCollectionTrend =
      totalRentCollection - prevTotalRentCollection;
    const totalNewMemberTrend = newMembers - prevNewMembers;

    const lastUpdated = now;

    // Get pending approvals (real-time data with proper overdue detection)
    const [pendingPayments, pendingRegistrations, overduePayments] =
      await Promise.all([
        // Pending payment approvals: Members who paid and waiting for admin approval
        prisma.payment.count({
          where: {
            pgId: { in: pgIds },
            month: currentMonth,
            year: currentYear,
            paymentStatus: "PAID",
            approvalStatus: "PENDING",
          },
        }),
        prisma.registeredMember.count({
          where: { pgType: admin.pgType },
        }),
        // Count overdue payments that need status update
        prisma.payment.count({
          where: {
            pgId: { in: pgIds },
            month: currentMonth,
            year: currentYear,
            approvalStatus: "PENDING",
            paymentStatus: { in: ["PENDING", "OVERDUE"] },
            overdueDate: {
              lt: now, // overdue date has passed
            },
          },
        }),
      ]);

    // Update overdue payment statuses in real-time
    if (overduePayments > 0) {
      await prisma.payment.updateMany({
        where: {
          pgId: { in: pgIds },
          month: currentMonth,
          year: currentYear,
          approvalStatus: "PENDING",
          paymentStatus: "PENDING", // Only update PENDING to OVERDUE
          overdueDate: {
            lt: now,
          },
        },
        data: {
          paymentStatus: "OVERDUE",
        },
      });
    }

    // Format cards using helper function
    const cards = formatDashboardCards(
      admin,
      totalMembers,
      totalRentCollection,
      newMembers,
      totalMemberTrend,
      totalRentCollectionTrend,
      totalNewMemberTrend,
      pendingPayments,
      pendingRegistrations,
      currentMonth,
      currentYear
    );

    res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: { cards, lastUpdated },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve dashboard statistics",
    } as ApiResponse<null>);
  }
};

// Helper function to format approval cards
const formatApprovalCards = (
  admin: { pgType: any },
  registrationStats: any[],
  paymentStats: any[],
  currentMonth: number,
  currentYear: number
) => {
  // Calculate totals from stats
  const totalPendingRequests = registrationStats.reduce(
    (sum, stat) => sum + stat.totalPendingRequests,
    0
  );
  const totalLongTermRequests = registrationStats.reduce(
    (sum, stat) => sum + stat.longTermRequests,
    0
  );
  const totalShortTermRequests = registrationStats.reduce(
    (sum, stat) => sum + stat.shortTermRequests,
    0
  );
  const totalThisMonthRegistrations = registrationStats.reduce(
    (sum, stat) => sum + stat.thisMonthRegistrations,
    0
  );

  const totalPendingPayments = paymentStats.reduce(
    (sum, stat) => sum + stat.totalPendingPayments,
    0
  );
  const totalAmountPending = paymentStats.reduce(
    (sum, stat) => sum + stat.totalAmountPending,
    0
  );
  const totalOverduePayments = paymentStats.reduce(
    (sum, stat) => sum + stat.totalOverduePayments,
    0
  );
  const totalThisMonthPendingPayments = paymentStats.reduce(
    (sum, stat) => sum + stat.thisMonthPendingPaymentCount,
    0
  );

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString("en-IN")}`;
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-IN");
  };

  // Get month name
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

  return {
    registration: [
      {
        title: "Pending Registration Requests",
        value: formatNumber(totalPendingRequests),
        icon: "userCheck",
        color: totalPendingRequests > 0 ? "warning" : "success",
        subtitle: `For ${admin.pgType.toLowerCase()}'s PG`,
        ...(totalPendingRequests > 0 && {
          badge: {
            text: "Action Required",
            color: "error",
          },
          onClickRoute: "/admin/approvals/registrations",
        }),
      },
      {
        title: "Long Term Requests",
        value: formatNumber(totalLongTermRequests),
        icon: "calendar",
        color: "primary",
        subtitle: `${Math.round(
          (totalLongTermRequests / Math.max(totalPendingRequests, 1)) * 100
        )}% of total requests`,
      },
      {
        title: "Short Term Requests",
        value: formatNumber(totalShortTermRequests),
        icon: "clock",
        color: "secondary",
        subtitle: `${Math.round(
          (totalShortTermRequests / Math.max(totalPendingRequests, 1)) * 100
        )}% of total requests`,
      },
      {
        title: "Approved This Month",
        value: formatNumber(totalThisMonthRegistrations),
        icon: "userPlus",
        color: "success",
        subtitle: `${monthNames[currentMonth - 1]} ${currentYear}`,
      },
    ],
    payment: [
      {
        title: "Pending Payment Approvals",
        value: formatNumber(totalPendingPayments),
        icon: "clock",
        color:
          totalPendingPayments > 0
            ? "warning"
            : totalPendingPayments === 0
            ? "neutral"
            : "success",
        subtitle: `Members who paid but awaiting admin approval for ${
          monthNames[currentMonth - 1]
        } ${currentYear}`,
        ...(totalPendingPayments > 0 && {
          badge: {
            text: "Action Required",
            color: "error",
          },
        }),
      },
      {
        title: "Total Amount Due",
        value: formatCurrency(totalAmountPending),
        icon: "indianRupee",
        color: "warning",
        subtitle: `Total amount that needs to be paid for ${
          monthNames[currentMonth - 1]
        } ${currentYear}`,
      },
      {
        title: "Overdue Payments",
        value: formatNumber(totalOverduePayments),
        icon: "alertTriangle",
        color: totalOverduePayments > 0 ? "error" : "success",
        subtitle:
          totalOverduePayments > 0
            ? `Members who didn't pay after due date for ${
                monthNames[currentMonth - 1]
              } ${currentYear}`
            : "No overdue payments",
        ...(totalOverduePayments > 0 && {
          badge: {
            text: "Critical",
            color: "error",
          },
        }),
      },
    ],
  };
};

// Get registration statistics in card format
export const getRegistrationStats = async (
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

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get all PGs of admin's type
    const pgs = await prisma.pG.findMany({
      where: { type: admin.pgType },
      select: { id: true },
    });

    const pgIds = pgs.map((pg) => pg.id);

    // Calculate registration statistics dynamically
    const [
      totalPendingRequests,
      longTermRequests,
      shortTermRequests,
      thisMonthRegistrations,
    ] = await Promise.all([
      // Total pending registration requests for this PG type
      prisma.registeredMember.count({
        where: { pgType: admin.pgType },
      }),

      // Long term requests for this PG type
      prisma.registeredMember.count({
        where: {
          pgType: admin.pgType,
          rentType: "LONG_TERM",
        },
      }),

      // Short term requests for this PG type
      prisma.registeredMember.count({
        where: {
          pgType: admin.pgType,
          rentType: "SHORT_TERM",
        },
      }),

      // This month registrations (approved members created this month) across all PGs of this type
      prisma.member.count({
        where: {
          pgId: { in: pgIds },
          createdAt: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1),
          },
        },
      }),
    ]);

    // Format currency
    const formatNumber = (num: number): string => {
      return num.toLocaleString("en-IN");
    };

    // Get month name
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

    const cards = [
      {
        title: "Pending Registration Requests",
        value: formatNumber(totalPendingRequests),
        icon: "userCheck",
        color: totalPendingRequests > 0 ? "warning" : "success",
        subtitle: `For ${admin.pgType.toLowerCase()}'s PG`,
        ...(totalPendingRequests > 0 && {
          badge: {
            text: "Action Required",
            color: "error",
          },
          onClickRoute: "/admin/approvals/registrations",
        }),
      },
      {
        title: "Long Term Requests",
        value: formatNumber(longTermRequests),
        icon: "calendar",
        color: "primary",
        subtitle: `${Math.round(
          (longTermRequests / Math.max(totalPendingRequests, 1)) * 100
        )}% of total requests`,
      },
      {
        title: "Short Term Requests",
        value: formatNumber(shortTermRequests),
        icon: "clock",
        color: "secondary",
        subtitle: `${Math.round(
          (shortTermRequests / Math.max(totalPendingRequests, 1)) * 100
        )}% of total requests`,
      },
      {
        title: "Approved This Month",
        value: formatNumber(thisMonthRegistrations),
        icon: "userPlus",
        color: "success",
        subtitle: `${monthNames[currentMonth - 1]} ${currentYear}`,
      },
    ];

    res.status(200).json({
      success: true,
      message: "Registration statistics retrieved successfully",
      data: { cards }
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting registration stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve registration statistics",
    } as ApiResponse<null>);
  }
};

// Get payment statistics in card format
export const getPaymentStats = async (
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

    // Get filter parameters from query
    const now = new Date();
    const requestedMonth =
      parseInt(req.query.month as string) || now.getMonth() + 1;
    const requestedYear =
      parseInt(req.query.year as string) || now.getFullYear();
    const pgLocations = req.query.pgLocation
      ? (req.query.pgLocation as string).split(",").map((loc) => loc.trim())
      : [];

    // Get all PGs of admin's type with optional location filter
    const pgFilter: any = { type: admin.pgType };
    if (pgLocations.length > 0) {
      pgFilter.location = { in: pgLocations };
    }

    const pgs = await prisma.pG.findMany({
      where: pgFilter,
      select: { id: true, location: true },
    });

    const pgIds = pgs.map((pg) => pg.id);

    // Update overdue payment statuses in real-time before calculating stats
    const currentTime = new Date();
    await prisma.payment.updateMany({
      where: {
        pgId: { in: pgIds },
        month: requestedMonth,
        year: requestedYear,
        approvalStatus: "PENDING",
        paymentStatus: "PENDING", // Only update PENDING to OVERDUE
        overdueDate: {
          lt: currentTime, // overdue date has passed
        },
      },
      data: {
        paymentStatus: "OVERDUE",
      },
    });

    // Calculate payment statistics dynamically for the requested month/year and filtered PGs
    const [pendingPaymentApprovals, overduePayments, totalAmountDue] =
      await Promise.all([
        // Pending payment approvals: Members who paid but awaiting admin approval
        prisma.payment.count({
          where: {
            pgId: { in: pgIds },
            month: requestedMonth,
            year: requestedYear,
            approvalStatus: "PENDING",
            paymentStatus: "PAID",
          },
        }),

        // Overdue payments: Members who didn't pay after overdue date in requested month
        prisma.payment.count({
          where: {
            pgId: { in: pgIds },
            month: requestedMonth,
            year: requestedYear,
            paymentStatus: "OVERDUE",
          },
        }),

        // Total amount due: Sum of all payments that are not yet approved (including PENDING, OVERDUE payments)
        prisma.payment
          .aggregate({
            where: {
              pgId: { in: pgIds },
              month: requestedMonth,
              year: requestedYear,
              approvalStatus: { in: ["PENDING", "REJECTED"] }, // Only pending or rejected payments
              paymentStatus: { in: ["PENDING", "OVERDUE", "PAID"] }, // All payment statuses except approved
            },
            _sum: { amount: true },
          })
          .then((result) => result._sum?.amount || 0),
      ]);

    // Format currency
    const formatCurrency = (amount: number): string => {
      return `${amount.toLocaleString("en-IN")}`;
    };

    // Format number with commas
    const formatNumber = (num: number): string => {
      return num.toLocaleString("en-IN");
    };

    // Get month name
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

    const cards = [
      {
        title: "Pending Payment Approvals",
        value: formatNumber(pendingPaymentApprovals),
        icon: "clock",
        color:
          pendingPaymentApprovals > 0
            ? "warning"
            : pendingPaymentApprovals === 0
            ? "neutral"
            : "success",
        subtitle: `Members who paid but awaiting admin approval for ${
          monthNames[requestedMonth - 1]
        } ${requestedYear}`,
        ...(pendingPaymentApprovals > 0 && {
          badge: {
            text: "Action Required",
            color: "error",
          },
        }),
      },
      {
        title: "Total Amount Due",
        value: formatCurrency(totalAmountDue),
        icon: "indianRupee",
        color: "warning",
        subtitle: `Total amount that needs to be paid for ${
          monthNames[requestedMonth - 1]
        } ${requestedYear}`,
      },
      {
        title: "Overdue Payments",
        value: formatNumber(overduePayments),
        icon: "alertTriangle",
        color: overduePayments > 0 ? "error" : "success",
        subtitle:
          overduePayments > 0
            ? `Members who didn't pay after due date for ${
                monthNames[requestedMonth - 1]
              } ${requestedYear}`
            : "No overdue payments",
        ...(overduePayments > 0 && {
          badge: {
            text: "Critical",
            color: "error",
          },
        }),
      },
    ];

    res.status(200).json({
      success: true,
      message: "Payment statistics retrieved successfully",
      data: { cards }
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting payment stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve payment statistics",
    } as ApiResponse<null>);
  }
};

// GET room statistics - by default selects first PG in ascending order
export const getRoomStats = async (
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

    let { pgId } = req.params;

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

    let pg;
    
    // If pgId is provided, verify it exists and matches admin's PG type
    if (pgId) {
      pg = await prisma.pG.findUnique({
        where: { id: pgId },
        select: {
          id: true,
          name: true,
          type: true,
          location: true,
        },
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
          message: "You can only access room statistics for your PG type",
        } as ApiResponse<null>);
        return;
      }
    } else {
      // If no pgId provided, select the first PG of admin's type in ascending order
      pg = await prisma.pG.findFirst({
        where: { type: admin.pgType },
        select: {
          id: true,
          name: true,
          type: true,
          location: true,
        },
        orderBy: { location: "asc" },
      });

      if (!pg) {
        res.status(404).json({
          success: false,
          message: "No PG found for your PG type",
        } as ApiResponse<null>);
        return;
      }
      
      pgId = pg.id;
    }

    // Get all rooms for this PG with member count
    const rooms = await prisma.room.findMany({
      where: { pGId: pgId },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Calculate room statistics
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(room => room._count.members >= room.capacity).length;
    const vacantRooms = rooms.filter(room => room._count.members === 0).length;
    const partialOccupiedRooms = rooms.filter(room => 
      room._count.members > 0 && room._count.members < room.capacity
    ).length;

    // Calculate total capacity and occupancy
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const totalOccupancy = rooms.reduce((sum, room) => sum + room._count.members, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

    // Format number with commas
    const formatNumber = (num: number): string => {
      return num.toLocaleString("en-IN");
    };

    // Calculate percentages for subtitles
    const occupiedPercentage = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const vacantPercentage = totalRooms > 0 ? Math.round((vacantRooms / totalRooms) * 100) : 0;
    const partialPercentage = totalRooms > 0 ? Math.round((partialOccupiedRooms / totalRooms) * 100) : 0;

    // Format room statistics cards
    const roomStatsCards = [
      {
        title: "Total Rooms",
        value: formatNumber(totalRooms),
        icon: "home",
        color: "primary",
        subtitle: `${formatNumber(totalCapacity)} total bed capacity in ${pg.name}`,
      },
      {
        title: "Fully Occupied Rooms",
        value: formatNumber(occupiedRooms),
        icon: "users",
        color: occupiedRooms > 0 ? "success" : "neutral",
        subtitle: `${occupiedPercentage}% of total rooms are fully occupied`,
        ...(occupiedRooms === totalRooms && totalRooms > 0 && {
          badge: {
            text: "Full Capacity",
            color: "success",
          },
        }),
      },
      {
        title: "Vacant Rooms",
        value: formatNumber(vacantRooms),
        icon: "home",
        color: vacantRooms > 0 ? "warning" : "success",
        subtitle: `${vacantPercentage}% of total rooms are completely vacant`,
        ...(vacantRooms > 0 && {
          badge: {
            text: "Available",
            color: "info",
          },
        }),
      },
      {
        title: "Partially Occupied Rooms",
        value: formatNumber(partialOccupiedRooms),
        icon: "userCheck",
        color: partialOccupiedRooms > 0 ? "info" : "neutral",
        subtitle: `${partialPercentage}% of total rooms have available beds`,
        ...(partialOccupiedRooms > 0 && {
          badge: {
            text: "Space Available",
            color: "warning",
          },
        }),
      },
    ];

    // Additional statistics for detailed view
    const additionalStats = {
      totalCapacity,
      totalOccupancy,
      occupancyRate,
      availableBeds: totalCapacity - totalOccupancy,
    };

    res.status(200).json({
      success: true,
      message: "Room statistics retrieved successfully",
      data: {
        cards: roomStatsCards,
        pgDetails: pg,
        summary: additionalStats,
        lastUpdated: new Date(),
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting room statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve room statistics",
    } as ApiResponse<null>);
  }
};

// Helper function to get month name
const getMonthName = (monthNum: number): string => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return monthNames[monthNum - 1];
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

// Helper function to format numbers
const formatNumber = (num: number): string => {
  return num.toLocaleString("en-IN");
};

// Function to calculate percentage change
const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

// Function to calculate expense statistics for a given month/year/pgType
const calculateExpenseStats = async (month: number, year: number, pgType: PgType) => {
  // Get start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Get all PGs of the specified type
  const pgs = await prisma.pG.findMany({
    where: { type: pgType },
    select: { id: true }
  });

  const pgIds = pgs.map(pg => pg.id);

  // Get all expenses for the month and PG type
  const expenses = await prisma.expense.findMany({
    where: {
      pgId: { in: pgIds },
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Calculate cash in statistics
  const cashInExpenses = expenses.filter(expense => expense.entryType === 'CASH_IN');
  const totalCashInAmount = cashInExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalCashInCount = cashInExpenses.length;
  const cashInOnline = cashInExpenses
    .filter(expense => expense.paymentType === 'ONLINE')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const cashInCash = cashInExpenses
    .filter(expense => expense.paymentType === 'CASH')
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate cash out statistics
  const cashOutExpenses = expenses.filter(expense => expense.entryType === 'CASH_OUT');
  const totalCashOutAmount = cashOutExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalCashOutCount = cashOutExpenses.length;
  const cashOutOnline = cashOutExpenses
    .filter(expense => expense.paymentType === 'ONLINE')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const cashOutCash = cashOutExpenses
    .filter(expense => expense.paymentType === 'CASH')
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate net amount
  const netAmount = totalCashInAmount - totalCashOutAmount;

  // Get previous month stats for percentage calculations
  let previousMonth = month - 1;
  let previousYear = year;
  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear = year - 1;
  }

  const previousStats = await prisma.expenseStats.findUnique({
    where: {
      pgType_month_year: {
        pgType,
        month: previousMonth,
        year: previousYear
      }
    }
  });

  // Calculate percentage changes
  const cashInPercentChange = calculatePercentageChange(
    totalCashInAmount, 
    previousStats?.totalCashInAmount || 0
  );
  const cashOutPercentChange = calculatePercentageChange(
    totalCashOutAmount, 
    previousStats?.totalCashOutAmount || 0
  );
  const netPercentChange = calculatePercentageChange(
    netAmount, 
    previousStats?.netAmount || 0
  );

  return {
    totalCashInAmount,
    totalCashInCount,
    totalCashOutAmount,
    totalCashOutCount,
    netAmount,
    cashOutOnline,
    cashOutCash,
    cashInOnline,
    cashInCash,
    cashInPercentChange,
    cashOutPercentChange,
    netPercentChange
  };
};

export const getExpenseStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { month, year } = req.query;

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse<null>);
    }

    // Get admin details to know their pgType
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { pgType: true },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      } as ApiResponse<null>);
    }

    // Use current month/year if not provided
    const now = new Date();
    const targetMonth = month ? parseInt(month as string) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : now.getFullYear();

    // Calculate fresh expense statistics
    const calculatedStats = await calculateExpenseStats(targetMonth, targetYear, admin.pgType);

    // Upsert the calculated stats to the ExpenseStats table
    const expenseStats = await prisma.expenseStats.upsert({
      where: {
        pgType_month_year: {
          pgType: admin.pgType,
          month: targetMonth,
          year: targetYear,
        },
      },
      update: {
        ...calculatedStats,
        updatedAt: new Date()
      },
      create: {
        month: targetMonth,
        year: targetYear,
        pgType: admin.pgType,
        ...calculatedStats
      }
    });

    // Format expense stats as cards
    const cards = [
      {
        title: "Total Cash In",
        value: formatCurrency(expenseStats.totalCashInAmount),
        trend: expenseStats.cashInPercentChange >= 0 ? "up" : "down",
        percentage: Math.abs(Math.round(expenseStats.cashInPercentChange)),
        icon: "arrowUp",
        color: "success",
        subtitle: `${formatNumber(expenseStats.totalCashInCount)} transactions`,
        paymentBreakdown: {
          online: formatCurrency(expenseStats.cashInOnline),
          cash: formatCurrency(expenseStats.cashInCash),
        },
      },
      {
        title: "Total Cash Out",
        value: formatCurrency(expenseStats.totalCashOutAmount),
        trend: expenseStats.cashOutPercentChange >= 0 ? "up" : "down",
        percentage: Math.abs(Math.round(expenseStats.cashOutPercentChange)),
        icon: "arrowDown",
        color: "error",
        subtitle: `${formatNumber(expenseStats.totalCashOutCount)} transactions`,
        paymentBreakdown: {
          online: formatCurrency(expenseStats.cashOutOnline),
          cash: formatCurrency(expenseStats.cashOutCash),
        },
      },
      {
        title: "Net Amount",
        value: formatCurrency(expenseStats.netAmount),
        trend: expenseStats.netPercentChange >= 0 ? "up" : "down",
        percentage: Math.abs(Math.round(expenseStats.netPercentChange)),
        icon: "walletIcon",
        color: expenseStats.netAmount >= 0 ? "primary" : "warning",
        subtitle: expenseStats.netAmount >= 0 ? "Profit this month" : "Loss this month",
      },
    ];

    const responseData = {
      cards,
      period: {
        month: targetMonth,
        year: targetYear,
        monthName: getMonthName(targetMonth),
      },
      pgType: admin.pgType,
      lastUpdated: expenseStats.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: 'Expense statistics calculated and retrieved successfully',
      data: responseData
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error getting expense stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>);
  }
};

// Get leaving request statistics in card format
export const getLeavingRequestStats = async (
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

    // Get current month and year for "this month" calculations
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Calculate leaving request statistics dynamically
    const [
      totalPendingRequests,
      totalApprovedRequests,
      totalRejectedRequests,
      thisMonthRequests,
    ] = await Promise.all([
      // Total pending leaving requests
      prisma.leavingRequest.count({
        where: {
          pgId: { in: pgIds },
          status: "PENDING",
        },
      }),

      // Total approved leaving requests
      prisma.leavingRequest.count({
        where: {
          pgId: { in: pgIds },
          status: "APPROVED",
        },
      }),

      // Total rejected leaving requests
      prisma.leavingRequest.count({
        where: {
          pgId: { in: pgIds },
          status: "REJECTED",
        },
      }),

      // This month leaving requests (all statuses)
      prisma.leavingRequest.count({
        where: {
          pgId: { in: pgIds },
          createdAt: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1),
          },
        },
      }),
    ]);

    // Calculate total requests for percentage calculations
    const totalRequests = totalPendingRequests + totalApprovedRequests + totalRejectedRequests;

    // Format number with commas
    const formatNumber = (num: number): string => {
      return num.toLocaleString("en-IN");
    };

    // Get month name
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

    const cards = [
      {
        title: "Pending Leaving Requests",
        value: formatNumber(totalPendingRequests),
        icon: "clock",
        color: totalPendingRequests > 0 ? "warning" : "success",
        subtitle: `For ${admin.pgType.toLowerCase()}'s PG`,
        ...(totalPendingRequests > 0 && {
          badge: {
            text: "Action Required",
            color: "error",
          },
          onClickRoute: "/admin/approvals/leaving-requests",
        }),
      },
      {
        title: "Approved Requests",
        value: formatNumber(totalApprovedRequests),
        icon: "checkCircle2",
        color: totalApprovedRequests > 0 ? "success" : "neutral",
        subtitle: `${Math.round(
          (totalApprovedRequests / Math.max(totalRequests, 1)) * 100
        )}% of total requests`,
      },
      {
        title: "Rejected Requests",
        value: formatNumber(totalRejectedRequests),
        icon: "xCircle",
        color: totalRejectedRequests > 0 ? "error" : "neutral",
        subtitle: `${Math.round(
          (totalRejectedRequests / Math.max(totalRequests, 1)) * 100
        )}% of total requests`,
      },
      {
        title: "This Month Requests",
        value: formatNumber(thisMonthRequests),
        icon: "calendar",
        color: "primary",
        subtitle: `${monthNames[currentMonth - 1]} ${currentYear}`,
      },
    ];

    res.status(200).json({
      success: true,
      message: "Leaving request statistics retrieved successfully",
      data: { cards }
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting leaving request stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve leaving request statistics",
    } as ApiResponse<null>);
  }
};

// GET enquiry statistics (admin only)
export const getEnquiryStats = async (
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

    // Get total enquiries count
    const totalEnquiries = await prisma.enquiry.count();

    // Get resolved enquiries count
    const resolvedEnquiries = await prisma.enquiry.count({
      where: { status: "RESOLVED" },
    });

    // Get pending enquiries count
    const pendingEnquiries = await prisma.enquiry.count({
      where: { status: "NOT_RESOLVED" },
    });

    // Get today's enquiries count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnquiries = await prisma.enquiry.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Calculate resolution rate
    const resolutionRate = totalEnquiries > 0 ? Math.round((resolvedEnquiries / totalEnquiries) * 100) : 0;

    // Format number with commas
    const formatNumber = (num: number): string => {
      return num.toLocaleString("en-IN");
    };

    // Format statistics as cards
    const enquiryStatsCards = [
      {
        title: "Total Enquiries",
        value: formatNumber(totalEnquiries),
        icon: "messageCircle",
        color: "primary",
        subtitle: `${formatNumber(todayEnquiries)} new enquiries today`,
      },
      {
        title: "Resolved Enquiries",
        value: formatNumber(resolvedEnquiries),
        icon: "checkCircle2",
        color: resolvedEnquiries > 0 ? "success" : "neutral",
        subtitle: `${resolutionRate}% resolution rate`,
        ...(resolutionRate === 100 && totalEnquiries > 0 && {
          badge: {
            text: "Perfect!",
            color: "success",
          },
        }),
      },
      {
        title: "Pending Enquiries",
        value: formatNumber(pendingEnquiries),
        icon: "clock",
        color: pendingEnquiries > 0 ? "warning" : "success",
        subtitle: `${Math.round((pendingEnquiries / (totalEnquiries || 1)) * 100)}% of total enquiries`,
        ...(pendingEnquiries > 0 && {
          badge: {
            text: "Action Required",
            color: "warning",
          },
        }),
      },
    ];

    res.status(200).json({
      success: true,
      message: "Enquiry statistics retrieved successfully",
      data: {
        cards: enquiryStatsCards,
        summary: {
          totalEnquiries,
          resolvedEnquiries,
          pendingEnquiries,
          todayEnquiries,
          resolutionRate,
        },
        lastUpdated: new Date(),
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting enquiry statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve enquiry statistics",
    } as ApiResponse<null>);
  }
};

// Helper function to format report stats cards from CompleteReportData
const formatReportStatsCards = (
  reportData: CompleteReportData,
  reportType: 'WEEKLY' | 'MONTHLY',
  period: number,
  year: number,
  pgType: string
): any[] => {
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-IN");
  };

  const formatPercentage = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
  };

  const getDateRange = (): string => {
    if (reportType === 'WEEKLY') {
      return `Week ${period}, ${year}`;
    } else {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return `${monthNames[period - 1]} ${year}`;
    }
  };

  const cards = reportData.cards;

  return [
    {
      title: "New Members",
      value: formatNumber(cards.newMembers),
      trend: cards.newMembersTrendPercent >= 0 ? "up" : "down",
      percentage: Math.abs(cards.newMembersTrendPercent),
      icon: "userPlus",
      color: cards.newMembersTrendPercent >= 0 ? "success" : "warning",
      subtitle: `${formatPercentage(cards.newMembersTrendPercent)} from previous ${reportType.toLowerCase()}`,
      badge: cards.newMembers > 10 ? {
        text: "High Growth",
        color: "success"
      } : undefined
    },
    {
      title: "Rent Collection",
      value: formatCurrency(cards.rentCollected),
      trend: cards.rentCollectedTrendPercent >= 0 ? "up" : "down",
      percentage: Math.abs(cards.rentCollectedTrendPercent),
      icon: "indianRupee",
      color: cards.rentCollectedTrendPercent >= 0 ? "success" : "error",
      subtitle: `${formatPercentage(cards.rentCollectedTrendPercent)} from previous ${reportType.toLowerCase()}`,
      badge: cards.rentCollectedTrendPercent >= 20 ? {
        text: "Excellent",
        color: "success"
      } : cards.rentCollectedTrendPercent < -10 ? {
        text: "Needs Attention",
        color: "error"
      } : undefined
    },
    {
      title: "Member Departures",
      value: formatNumber(cards.memberDepartures),
      trend: cards.memberDeparturesTrendPercent <= 0 ? "up" : "down", // Lower departures is better
      percentage: Math.abs(cards.memberDeparturesTrendPercent),
      icon: "userMinus",
      color: cards.memberDeparturesTrendPercent <= 0 ? "success" : "warning",
      subtitle: `${formatPercentage(cards.memberDeparturesTrendPercent)} from previous ${reportType.toLowerCase()}`,
      badge: cards.memberDepartures > 5 ? {
        text: "High Turnover",
        color: "warning"
      } : undefined
    },
    {
      title: "Total Expenses",
      value: formatCurrency(cards.totalExpenses),
      trend: cards.totalExpensesTrendPercent <= 0 ? "up" : "down", // Lower expenses is better
      percentage: Math.abs(cards.totalExpensesTrendPercent),
      icon: "trending-down",
      color: cards.totalExpensesTrendPercent <= 0 ? "success" : "warning",
      subtitle: `${formatPercentage(cards.totalExpensesTrendPercent)} from previous ${reportType.toLowerCase()}`,
      badge: cards.totalExpensesTrendPercent > 20 ? {
        text: "High Increase",
        color: "error"
      } : undefined
    },
    {
      title: "Net Profit",
      value: formatCurrency(cards.netProfit),
      trend: cards.netProfitTrendPercent >= 0 ? "up" : "down",
      percentage: Math.abs(cards.netProfitTrendPercent),
      icon: cards.netProfit >= 0 ? "trending-up" : "trending-down",
      color: cards.netProfit >= 0 ? 
        (cards.netProfitTrendPercent >= 0 ? "success" : "warning") : "error",
      subtitle: `${formatPercentage(cards.netProfitTrendPercent)} from previous ${reportType.toLowerCase()}`,
      badge: cards.netProfit < 0 ? {
        text: "Loss",
        color: "error"
      } : cards.netProfitTrendPercent >= 15 ? {
        text: "Strong Growth",
        color: "success"
      } : undefined
    },
  ];
};

// Get weekly report statistics in card format
export const getWeeklyReportStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.admin?.pgType) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      } as ApiResponse<null>);
      return;
    }

    const { weekNumber, year } = req.query;
    
    if (!weekNumber || !year) {
      res.status(400).json({
        success: false,
        message: "weekNumber and year parameters are required",
      } as ApiResponse<null>);
      return;
    }

    const week = parseInt(weekNumber as string);
    const yearNum = parseInt(year as string);
    const pgType = req.admin.pgType as PgType;

    // Validate parameters
    if (week < 1 || week > 53) {
      res.status(400).json({
        success: false,
        message: "Week number must be between 1 and 53",
      } as ApiResponse<null>);
      return;
    }

    if (yearNum < 2020 || yearNum > 2030) {
      res.status(400).json({
        success: false,
        message: "Year must be between 2020 and 2030",
      } as ApiResponse<null>);
      return;
    }

    try {
      // Get or compute report data using pgReportCalculators
      const reportData = await getOrComputeReportData(
        pgType,
        'WEEKLY',
        week,
        yearNum
      );

      // Format the data into cards format
      const cards = formatReportStatsCards(
        reportData,
        'WEEKLY',
        week,
        yearNum,
        pgType
      );

      res.status(200).json({
        success: true,
        message: "Weekly report statistics retrieved successfully",
        data: {
          cards,
          lastUpdated: new Date(),
        },
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error getting weekly report data:', error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve weekly report data",
        error: error instanceof Error ? error.message : "Unknown error"
      } as ApiResponse<null>);
    }

  } catch (error) {
    console.error("Error getting weekly report stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve weekly report statistics",
    } as ApiResponse<null>);
  }
};

// Get monthly report statistics in card format
export const getMonthlyReportStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.admin?.pgType) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      } as ApiResponse<null>);
      return;
    }

    const { month, year } = req.query;
    
    if (!month || !year) {
      res.status(400).json({
        success: false,
        message: "month and year parameters are required",
      } as ApiResponse<null>);
      return;
    }

    const monthNum = parseInt(month as string);
    const yearNum = parseInt(year as string);
    const pgType = req.admin.pgType as PgType;

    // Validate parameters
    if (monthNum < 1 || monthNum > 12) {
      res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      } as ApiResponse<null>);
      return;
    }

    if (yearNum < 2020 || yearNum > 2030) {
      res.status(400).json({
        success: false,
        message: "Year must be between 2020 and 2030",
      } as ApiResponse<null>);
      return;
    }

    try {
      // Get or compute report data using pgReportCalculators
      const reportData = await getOrComputeReportData(
        pgType,
        'MONTHLY',
        monthNum,
        yearNum
      );

      // Format the data into cards format
      const cards = formatReportStatsCards(
        reportData,
        'MONTHLY',
        monthNum,
        yearNum,
        pgType
      );

      // Check if this is current month for cache status
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      const isCurrentMonth = monthNum === currentMonth && yearNum === currentYear;
      const dataSource = isCurrentMonth ? 'live' : 'cached';

      res.status(200).json({
        success: true,
        message: "Monthly report statistics retrieved successfully",
        data: {
          cards,
          summary: {
            reportType: 'MONTHLY',
            period: monthNum,
            year: yearNum,
            pgType,
            dataSource,
            isCurrentPeriod: isCurrentMonth,
            totalPGs: reportData.tables.pgPerformanceData.length,
            totalRevenue: reportData.cards.rentCollected,
            totalExpenses: reportData.cards.totalExpenses,
            netProfit: reportData.cards.netProfit
          },
          lastUpdated: new Date(),
        },
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error getting monthly report data:', error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve monthly report data",
        error: error instanceof Error ? error.message : "Unknown error"
      } as ApiResponse<null>);
    }

  } catch (error) {
    console.error("Error getting monthly report stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve monthly report statistics",
    } as ApiResponse<null>);
  }
};