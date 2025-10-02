import { Router } from "express";
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../controllers/roomController";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation";
import { authenticateAdmin, authorizeAdmin } from "../middlewares/auth";
import {
  createRoomSchema,
  updateRoomSchema,
  pgIdParamSchema,
  roomIdParamSchema,
  pgIdAndRoomIdParamSchema,
  locationParamSchema,
  roomFilterQuerySchema,
} from "../validations/roomValidation";

const router = Router();

// All routes require authentication and authorization
router.use(authenticateAdmin);
router.use(authorizeAdmin);

// GET all rooms - defaults to first PG if no pgId provided
router.get("/", validateQuery(roomFilterQuerySchema), getRooms);

// GET /rooms/:pgId - Get all rooms of a specific PG
router.get("/:pgId", validateParams(pgIdParamSchema), validateQuery(roomFilterQuerySchema), getRooms);

// GET /rooms/:roomId - Get a specific room by ID
router.get("/:roomId", validateParams(roomIdParamSchema), getRoomById);

// POST /rooms/:pgId - Create a new room in a specific PG
router.post("/:pgId", validateParams(pgIdParamSchema), validateBody(createRoomSchema), createRoom);

// PUT /rooms/:roomId - Update a specific room
router.put("/:roomId", validateParams(roomIdParamSchema), validateBody(updateRoomSchema), updateRoom);

// DELETE /rooms/:roomId - Delete a specific room
router.delete("/:roomId", validateParams(roomIdParamSchema), deleteRoom);


export default router;
