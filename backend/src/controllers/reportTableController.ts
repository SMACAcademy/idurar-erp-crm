import { Response } from "express";
import prisma from "../config/prisma";
import { ApiResponse } from "../types/response";
import { AuthenticatedRequest } from "../middlewares/auth";
import {
  getWeeklyPGPerformanceData,
  getWeeklyRoomUtilizationData,
  getWeeklyPaymentAnalyticsData,
  getWeeklyFinancialSummaryData,
  getMonthlyPGPerformanceData,
  getMonthlyRoomUtilizationData,
  getMonthlyPaymentAnalyticsData,
  getMonthlyFinancialSummaryData,
} from "../utils/pgReportCalculators";

// Get PG performance table data (supports both weekly and monthly)
export const getPGPerformance = async (
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

    const { weekNumber, month, year, page = "1", limit = "10" } = req.query;

    if (!year) {
      res.status(400).json({
        success: false,
        message: "Year is required",
      } as ApiResponse<null>);
      return;
    }

    // Determine if this is a weekly or monthly request
    const isWeekly = weekNumber !== undefined;
    const isMonthly = month !== undefined;

    if (!isWeekly && !isMonthly) {
      res.status(400).json({
        success: false,
        message: "Either weekNumber or month is required",
      } as ApiResponse<null>);
      return;
    }

    if (isWeekly && isMonthly) {
      res.status(400).json({
        success: false,
        message: "Cannot specify both weekNumber and month",
      } as ApiResponse<null>);
      return;
    }

    const yearNum = parseInt(year as string);
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let allPgData;
    let reportType: string;

    if (isWeekly) {
      const weekNum = parseInt(weekNumber as string);
      allPgData = await getWeeklyPGPerformanceData(admin.pgType, weekNum, yearNum);
      reportType = "weekly";
    } else {
      const monthNum = parseInt(month as string);
      allPgData = await getMonthlyPGPerformanceData(admin.pgType, monthNum, yearNum);
      reportType = "monthly";
    }

    // Apply pagination
    const totalRecords = allPgData.length;
    const paginatedData = allPgData.slice(offset, offset + limitNum);

    res.status(200).json({
      success: true,
      message: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} PG performance data retrieved successfully`,
      data: {
        tableData: paginatedData,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
      },
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error getting PG performance data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve PG performance data",
    } as ApiResponse<null>);
  }
};

// Get room utilization table data (supports both weekly and monthly)
export const getRoomUtilization = async (
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

    const { weekNumber, month, year, page = "1", limit = "10" } = req.query;

    if (!year) {
      res.status(400).json({
        success: false,
        message: "Year is required",
      } as ApiResponse<null>);
      return;
    }

    // Determine if this is a weekly or monthly request
    const isWeekly = weekNumber !== undefined;
    const isMonthly = month !== undefined;

    if (!isWeekly && !isMonthly) {
      res.status(400).json({
        success: false,
        message: "Either weekNumber or month is required",
      } as ApiResponse<null>);
      return;
    }

    if (isWeekly && isMonthly) {
      res.status(400).json({
        success: false,
        message: "Cannot specify both weekNumber and month",
      } as ApiResponse<null>);
      return;
    }

    const yearNum = parseInt(year as string);
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let allRoomData;
    let reportType: string;

    if (isWeekly) {
      const weekNum = parseInt(weekNumber as string);
      allRoomData = await getWeeklyRoomUtilizationData(admin.pgType, weekNum, yearNum);
      reportType = "weekly";
    } else {
      const monthNum = parseInt(month as string);
      allRoomData = await getMonthlyRoomUtilizationData(admin.pgType, monthNum, yearNum);
      reportType = "monthly";
    }

    // Apply pagination
    const totalRecords = allRoomData.length;
    const paginatedData = allRoomData.slice(offset, offset + limitNum);

    res.status(200).json({
      success: true,
      message: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} room utilization data retrieved successfully`,
      data: {
        tableData: paginatedData,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
      },
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error getting room utilization data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve room utilization data",
    } as ApiResponse<null>);
  }
};

// Get payment analytics table data (supports both weekly and monthly)
export const getPaymentAnalytics = async (
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

    const { weekNumber, month, year, page = "1", limit = "10" } = req.query;

    if (!year) {
      res.status(400).json({
        success: false,
        message: "Year is required",
      } as ApiResponse<null>);
      return;
    }

    // Determine if this is a weekly or monthly request
    const isWeekly = weekNumber !== undefined;
    const isMonthly = month !== undefined;

    if (!isWeekly && !isMonthly) {
      res.status(400).json({
        success: false,
        message: "Either weekNumber or month is required",
      } as ApiResponse<null>);
      return;
    }

    if (isWeekly && isMonthly) {
      res.status(400).json({
        success: false,
        message: "Cannot specify both weekNumber and month",
      } as ApiResponse<null>);
      return;
    }

    const yearNum = parseInt(year as string);
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let allPaymentData;
    let reportType: string;

    if (isWeekly) {
      const weekNum = parseInt(weekNumber as string);
      allPaymentData = await getWeeklyPaymentAnalyticsData(admin.pgType, weekNum, yearNum);
      reportType = "weekly";
    } else {
      const monthNum = parseInt(month as string);
      allPaymentData = await getMonthlyPaymentAnalyticsData(admin.pgType, monthNum, yearNum);
      reportType = "monthly";
    }

    // Apply pagination
    const totalRecords = allPaymentData.length;
    const paginatedData = allPaymentData.slice(offset, offset + limitNum);

    res.status(200).json({
      success: true,
      message: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} payment analytics data retrieved successfully`,
      data: {
        tableData: paginatedData,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
      },
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error getting payment analytics data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve payment analytics data",
    } as ApiResponse<null>);
  }
};

// Get financial summary table data (supports both weekly and monthly)
export const getFinancialSummary = async (
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

    const { weekNumber, month, year, page = "1", limit = "10" } = req.query;

    if (!year) {
      res.status(400).json({
        success: false,
        message: "Year is required",
      } as ApiResponse<null>);
      return;
    }

    // Determine if this is a weekly or monthly request
    const isWeekly = weekNumber !== undefined;
    const isMonthly = month !== undefined;

    if (!isWeekly && !isMonthly) {
      res.status(400).json({
        success: false,
        message: "Either weekNumber or month is required",
      } as ApiResponse<null>);
      return;
    }

    if (isWeekly && isMonthly) {
      res.status(400).json({
        success: false,
        message: "Cannot specify both weekNumber and month",
      } as ApiResponse<null>);
      return;
    }

    const yearNum = parseInt(year as string);
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let allFinancialData;
    let reportType: string;

    if (isWeekly) {
      const weekNum = parseInt(weekNumber as string);
      allFinancialData = await getWeeklyFinancialSummaryData(admin.pgType, weekNum, yearNum);
      reportType = "weekly";
    } else {
      const monthNum = parseInt(month as string);
      allFinancialData = await getMonthlyFinancialSummaryData(admin.pgType, monthNum, yearNum);
      reportType = "monthly";
    }

    // Apply pagination
    const totalRecords = allFinancialData.length;
    const paginatedData = allFinancialData.slice(offset, offset + limitNum);

    res.status(200).json({
      success: true,
      message: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} financial summary data retrieved successfully`,
      data: {
        tableData: paginatedData,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
      },
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error getting financial summary data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve financial summary data",
    } as ApiResponse<null>);
  }
};
