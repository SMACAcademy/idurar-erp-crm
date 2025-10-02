import { Request, Response } from "express";
import prisma from "../config/prisma";
import { CreatePGRequest, UpdatePGRequest } from "../types/request";
import { ApiResponse } from "../types/response";

// Create a new PG
export const createPG = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, location }: CreatePGRequest = req.body;

    // Check if PG with same name and location already exists
    const existingPG = await prisma.pG.findFirst({
      where: {
        name,
        location,
      },
    });

    if (existingPG) {
      res.status(409).json({
        success: false,
        message: "PG with this name and location already exists",
      } as ApiResponse<null>);
      return;
    }

    // Create new PG
    const newPG = await prisma.pG.create({
      data: {
        name,
        type,
        location,
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
    });

    res.status(201).json({
      success: true,
      message: "PG created successfully",
      data: newPG,
    } as ApiResponse<typeof newPG>);
  } catch (error) {
    console.error("Error creating PG:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to create PG",
    } as ApiResponse<null>);
  }
};

// Get all PGs with pagination
export const getAllPGs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.pG.count();

    // Get PGs with counts
    const pgs = await prisma.pG.findMany({
      skip,
      take: limit,
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

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "PGs retrieved successfully",
      data: pgs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting PGs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve PGs",
    } as ApiResponse<null>);
  }
};

// Get PG by ID
export const getPGById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const pg = await prisma.pG.findUnique({
      where: { id },
      include: {
        rooms: {
          include: {
            members: true,
          },
          orderBy: { roomNo: 'asc' },
        },
        members: {
          include: {
            room: true,
          },
          orderBy: { dateOfJoining: 'desc' },
        },
        _count: {
          select: {
            rooms: true,
            members: true,
            payments: true,
          },
        },
      },
    });

    if (!pg) {
      res.status(404).json({
        success: false,
        message: "PG not found",
      } as ApiResponse<null>);
      return;
    }

    res.status(200).json({
      success: true,
      message: "PG retrieved successfully",
      data: pg,
    } as ApiResponse<typeof pg>);
  } catch (error) {
    console.error("Error getting PG:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve PG",
    } as ApiResponse<null>);
  }
};

// Update PG
export const updatePG = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdatePGRequest = req.body;

    // Check if PG exists
    const existingPG = await prisma.pG.findUnique({
      where: { id },
    });

    if (!existingPG) {
      res.status(404).json({
        success: false,
        message: "PG not found",
      } as ApiResponse<null>);
      return;
    }

    // Check if name and location combination already exists (if being updated)
    if (updateData.name || updateData.location) {
      const checkName = updateData.name || existingPG.name;
      const checkLocation = updateData.location || existingPG.location;

      const duplicatePG = await prisma.pG.findFirst({
        where: {
          AND: [
            { name: checkName },
            { location: checkLocation },
            { id: { not: id } },
          ],
        },
      });

      if (duplicatePG) {
        res.status(409).json({
          success: false,
          message: "PG with this name and location already exists",
        } as ApiResponse<null>);
        return;
      }
    }

    // Update PG
    const updatedPG = await prisma.pG.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            rooms: true,
            members: true,
            
            payments: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "PG updated successfully",
      data: updatedPG,
    } as ApiResponse<typeof updatedPG>);
  } catch (error) {
    console.error("Error updating PG:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to update PG",
    } as ApiResponse<null>);
  }
};

// Delete PG
export const deletePG = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if PG exists
    const existingPG = await prisma.pG.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rooms: true,
            members: true,
            
            payments: true,
          },
        },
      },
    });

    if (!existingPG) {
      res.status(404).json({
        success: false,
        message: "PG not found",
      } as ApiResponse<null>);
      return;
    }

    // Check if PG has related data
    if (
      existingPG._count.rooms > 0 ||
      existingPG._count.members > 0 ||
      existingPG._count.payments > 0
    ) {
      res.status(409).json({
        success: false,
        message: "Cannot delete PG as it has associated rooms, members, or payments",
      } as ApiResponse<null>);
      return;
    }

    // Delete PG
    await prisma.pG.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "PG deleted successfully",
    } as ApiResponse<null>);
  } catch (error) {
    console.error("Error deleting PG:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to delete PG",
    } as ApiResponse<null>);
  }
};
