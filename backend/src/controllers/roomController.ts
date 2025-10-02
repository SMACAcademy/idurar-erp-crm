import { Response } from "express";
import prisma from "../config/prisma";
import { ApiResponse } from "../types/response";
import { CreateRoomRequest, UpdateRoomRequest } from "../types/request";
import { AuthenticatedRequest } from "../middlewares/auth";

// GET all rooms - by default selects first PG in ascending order, with optional occupancy filtering
export const getRooms = async (
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
    const { occupancyStatus, page = 1, limit = 10 } = req.query;

    // Parse pagination parameters
    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

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
          message: "You can only manage rooms of your PG type",
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
        members: {
          select: {
            id: true,
            memberId: true,
            name: true,
            gender: true,
            rentType: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        roomNo: "asc",
      },
    });

    // Helper function to determine occupancy status
    const getOccupancyStatus = (currentOccupancy: number, capacity: number): string => {
      if (currentOccupancy === 0) return "FULLY_VACANT";
      if (currentOccupancy >= capacity) return "FULLY_OCCUPIED";
      return "PARTIALLY_OCCUPIED";
    };

    // Helper function to get occupancy status label
    const getOccupancyStatusLabel = (status: string): string => {
      switch (status) {
        case "FULLY_VACANT": return "Fully Vacant";
        case "PARTIALLY_OCCUPIED": return "Partially Occupied";
        case "FULLY_OCCUPIED": return "Fully Occupied";
        default: return "Unknown";
      }
    };

    // Transform data to include occupancy info and format as requested
    let roomsWithOccupancy = rooms.map((room) => {
      const currentOccupancy = room._count.members;
      const capacity = room.capacity;
      const occupancyStatusValue = getOccupancyStatus(currentOccupancy, capacity);
      
      return {
        id: room.id,
        roomNo: room.roomNo,
        occupied: currentOccupancy,
        status: getOccupancyStatusLabel(occupancyStatusValue),
        statusValue: occupancyStatusValue,
        rentAmount: room.rent,
        electricityCharge: room.electricityCharge,
        capacity: capacity,
        currentOccupancy: currentOccupancy,
        availableSlots: capacity - currentOccupancy,
        isFullyOccupied: currentOccupancy >= capacity,
        members: room.members,
      };
    });

    // Filter by occupancy status if provided
    if (occupancyStatus && typeof occupancyStatus === 'string') {
      const filterStatus = occupancyStatus.toUpperCase();
      if (['FULLY_VACANT', 'PARTIALLY_OCCUPIED', 'FULLY_OCCUPIED'].includes(filterStatus)) {
        roomsWithOccupancy = roomsWithOccupancy.filter(room => room.statusValue === filterStatus);
      }
    }

    // Calculate total count after filtering
    const totalCount = roomsWithOccupancy.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Apply pagination
    const paginatedRooms = roomsWithOccupancy.slice(skip, skip + pageSize);

    res.status(200).json({
      success: true,
      message: "Rooms retrieved successfully",
      data: {
        rooms: paginatedRooms,
        pgDetails: pg,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total: totalCount,
          totalPages,
        },
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting rooms:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve rooms",
    } as ApiResponse<null>);
  }
};

// GET single room by ID
export const getRoomById = async (
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

    const { roomId } = req.params;

    if (!roomId) {
      res.status(400).json({
        success: false,
        message: "Room ID is required",
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

    // Get room with detailed member information and verify PG ownership
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        PG: {
          type: admin.pgType,
        },
      },
      include: {
        members: {
          select: {
            id: true,
            memberId: true,
            name: true,
            dob: true,
            gender: true,
            email: true,
            phone: true,
            work: true,
            rentType: true,
            advanceAmount: true,
            dateOfJoining: true,
          },
        },
        PG: {
          select: {
            id: true,
            name: true,
            type: true,
            location: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found or you don't have permission to access it",
      } as ApiResponse<null>);
      return;
    }

    // Add occupancy info
    const roomWithOccupancy = {
      ...room,
      currentOccupancy: room._count.members,
      availableSlots: room.capacity - room._count.members,
      isFullyOccupied: room._count.members >= room.capacity,
    };

    res.status(200).json({
      success: true,
      message: "Room retrieved successfully",
      data: roomWithOccupancy,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting room:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve room",
    } as ApiResponse<null>);
  }
};

// CREATE new room
export const createRoom = async (
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

    const { pgId } = req.params;
    const { roomNo, rent, electricityCharge, capacity }: CreateRoomRequest = req.body;

    if (!pgId) {
      res.status(400).json({
        success: false,
        message: "PG ID is required",
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

    // Verify PG exists and matches admin's PG type
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
        message: "You can only create rooms for your PG type",
      } as ApiResponse<null>);
      return;
    }

    // Check if room number already exists in this PG
    const existingRoom = await prisma.room.findFirst({
      where: {
        roomNo,
        pGId: pgId,
      },
    });

    if (existingRoom) {
      res.status(409).json({
        success: false,
        message: "Room number already exists in this PG",
      } as ApiResponse<null>);
      return;
    }

    // Create new room
    const newRoom = await prisma.room.create({
      data: {
        roomNo,
        rent,
        electricityCharge,
        capacity,
        pGId: pgId,
      },
      include: {
        PG: {
          select: {
            id: true,
            name: true,
            type: true,
            location: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Add occupancy info
    const roomWithOccupancy = {
      ...newRoom,
      currentOccupancy: 0,
      availableSlots: newRoom.capacity,
      isFullyOccupied: false,
    };

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: roomWithOccupancy,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to create room",
    } as ApiResponse<null>);
  }
};

// UPDATE room
export const updateRoom = async (
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

    const { roomId } = req.params;
    const { roomNo, rent, electricityCharge, capacity }: UpdateRoomRequest = req.body;

    if (!roomId) {
      res.status(400).json({
        success: false,
        message: "Room ID is required",
      } as ApiResponse<null>);
      return;
    }

    // Validate at least one field is provided
    if (!roomNo && !rent && electricityCharge === undefined && !capacity) {
      res.status(400).json({
        success: false,
        message: "At least one field must be provided for update",
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

    // Check if room exists and verify PG ownership
    const existingRoom = await prisma.room.findFirst({
      where: {
        id: roomId,
        PG: {
          type: admin.pgType,
        },
      },
      include: {
        PG: {
          select: {
            id: true,
            type: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!existingRoom) {
      res.status(404).json({
        success: false,
        message: "Room not found or you don't have permission to update it",
      } as ApiResponse<null>);
      return;
    }

    // If updating capacity, ensure it's not less than current occupancy
    if (capacity !== undefined && capacity < existingRoom._count.members) {
      res.status(400).json({
        success: false,
        message: `Cannot reduce capacity below current occupancy (${existingRoom._count.members} members)`,
      } as ApiResponse<null>);
      return;
    }

    // If updating room number, check if it already exists in the same PG
    if (roomNo && roomNo !== existingRoom.roomNo) {
      const roomWithSameNumber = await prisma.room.findFirst({
        where: {
          roomNo,
          pGId: existingRoom.pGId,
          id: { not: roomId },
        },
      });

      if (roomWithSameNumber) {
        res.status(409).json({
          success: false,
          message: "Room number already exists in this PG",
        } as ApiResponse<null>);
        return;
      }
    }

    // Update room
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...(roomNo && { roomNo }),
        ...(rent !== undefined && { rent }),
        ...(electricityCharge !== undefined && { electricityCharge }),
        ...(capacity !== undefined && { capacity }),
      },
      include: {
        PG: {
          select: {
            id: true,
            name: true,
            type: true,
            location: true,
          },
        },
        members: {
          select: {
            id: true,
            memberId: true,
            name: true,
            gender: true,
            rentType: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Add occupancy info
    const roomWithOccupancy = {
      ...updatedRoom,
      currentOccupancy: updatedRoom._count.members,
      availableSlots: updatedRoom.capacity - updatedRoom._count.members,
      isFullyOccupied: updatedRoom._count.members >= updatedRoom.capacity,
    };

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: roomWithOccupancy,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to update room",
    } as ApiResponse<null>);
  }
};

// DELETE room
export const deleteRoom = async (
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

    const { roomId } = req.params;

    if (!roomId) {
      res.status(400).json({
        success: false,
        message: "Room ID is required",
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

    // Check if room exists and verify PG ownership
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        PG: {
          type: admin.pgType,
        },
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found or you don't have permission to delete it",
      } as ApiResponse<null>);
      return;
    }

    // Check if room has members
    if (room._count.members > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete room with ${room._count.members} members. Please move members to other rooms first.`,
      } as ApiResponse<null>);
      return;
    }

    // Delete room
    await prisma.room.delete({
      where: { id: roomId },
    });

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    } as ApiResponse<null>);
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to delete room",
    } as ApiResponse<null>);
  }
};
