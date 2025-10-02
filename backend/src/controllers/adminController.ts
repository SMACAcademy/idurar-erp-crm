import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AdminLoginRequest, CreateAdminRequest, UpdateAdminRequest } from "../types/request";
import { ApiResponse, AdminResponse, AdminLoginResponse } from "../types/response";
import { hashPassword, comparePassword, generateAdminToken } from "../utils/auth";
import { AuthenticatedRequest } from "../middlewares/auth";
import { ENV } from "../config/env";
import { 
  updateOverduePayments,
} from "../utils/paymentRecordManager";
import { cleanupInactiveMemberData } from "../utils/memberCleanup";
import { updateLeavingRequestPendingDues } from "../utils/leavingRequestDuesCalculator";

// Admin login
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: AdminLoginRequest = req.body;

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: "Authentication failed",
        error: "Invalid email or password",
      } as ApiResponse<null>);
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Authentication failed",
        error: "Invalid email or password",
      } as ApiResponse<null>);
      return;
    }

    // Generate JWT token
    const token = generateAdminToken({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        pgType: admin.pgType,
    });

    // Remove password from response
    const { password: _, ...adminResponse } = admin;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        admin: adminResponse,
        token,
        expiresIn: ENV.JWT_EXPIRES_IN,
      },
    } as ApiResponse<AdminLoginResponse>);
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to login",
    } as ApiResponse<null>);
  }
};

// Create a new admin
export const createAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, pgType }: CreateAdminRequest = req.body;

    // Check if admin with email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      res.status(409).json({
        success: false,
        message: "Admin with this email already exists",
      } as ApiResponse<null>);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new admin
    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        pgType,
      },
    });

    // Remove password from response
    const { password: _, ...adminResponse } = newAdmin;

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: adminResponse,
    } as ApiResponse<AdminResponse>);
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to create admin",
    } as ApiResponse<null>);
  }
};

// Get current admin profile
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      select: {
        id: true,
        name: true,
        email: true,
        pgType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      } as ApiResponse<null>);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: admin,
    } as ApiResponse<AdminResponse>);
  } catch (error) {
    console.error("Error getting admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve profile",
    } as ApiResponse<null>);
  }
};

// Update admin profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      } as ApiResponse<null>);
      return;
    }

    const { name, email, password, pgType }: UpdateAdminRequest = req.body;

    // Check if email is being updated and if it already exists
    if (email && email !== req.admin.email) {
      const existingAdmin = await prisma.admin.findUnique({
        where: { email },
      });

      if (existingAdmin) {
        res.status(409).json({
          success: false,
          message: "Email already exists",
        } as ApiResponse<null>);
        return;
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (pgType) updateData.pgType = pgType;
    if (password) updateData.password = await hashPassword(password);

    // Update admin
    const updatedAdmin = await prisma.admin.update({
      where: { id: req.admin.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        pgType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedAdmin,
    } as ApiResponse<AdminResponse>);
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to update profile",
    } as ApiResponse<null>);
  }
};

// Get PGs managed by admin
export const getManagedPGs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Get PGs of the same type as admin's pgType
    const pgs = await prisma.pG.findMany({
      where: {
        type: admin.pgType,
      },
      include: {
        _count: {
          select: {
            rooms: true,
            members: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      message: "Managed PGs retrieved successfully",
      data: pgs,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting managed PGs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve managed PGs",
    } as ApiResponse<null>);
  }
};

// Update overdue payment statuses
export const updateOverduePaymentsEndpoint = async (
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

    const result = await updateOverduePayments();

    res.status(200).json({
      success: true,
      message: "Overdue payments updated successfully",
      data: result,
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error updating overdue payments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error", 
      error: "Failed to update overdue payments",
    } as ApiResponse<null>);
  }
};

// Manual cleanup of inactive member data
export const cleanupInactiveMembers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "Admin authentication required",
      } as ApiResponse<null>);
      return;
    }

    const result = await cleanupInactiveMemberData();

    res.status(200).json({
      success: true,
      message: result.deletedMembers > 0 
        ? `Successfully cleaned up ${result.deletedMembers} inactive members and ${result.deletedFiles} files`
        : "No inactive members found for cleanup",
      data: result,
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error during manual member cleanup:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error", 
      error: "Failed to cleanup inactive members",
    } as ApiResponse<null>);
  }
};

// Update pending dues for all leaving requests
export const updateLeavingRequestDues = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "Admin authentication required",
      } as ApiResponse<null>);
      return;
    }

    const result = await updateLeavingRequestPendingDues();

    res.status(200).json({
      success: true,
      message: result.updatedRequests > 0 
        ? `Successfully updated pending dues for ${result.updatedRequests} leaving requests`
        : "No leaving request dues updates required",
      data: result,
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error during manual leaving request dues update:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error", 
      error: "Failed to update leaving request dues",
    } as ApiResponse<null>);
  }
};

