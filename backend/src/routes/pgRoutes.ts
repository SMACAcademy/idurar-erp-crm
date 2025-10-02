import { Router } from "express";
import {
  createPG,
  getAllPGs,
  getPGById,
  updatePG,
  deletePG,
} from "../controllers/pgController";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation";
import { createPGSchema, updatePGSchema, idParamSchema, paginationQuerySchema } from "../validations/pgValidation";

const router = Router();

// PG routes with validation
// Temp routes

router.post("/", validateBody(createPGSchema), createPG);
router.get("/", validateQuery(paginationQuerySchema), getAllPGs);
router.get("/:id", validateParams(idParamSchema), getPGById);
router.put("/:id", validateParams(idParamSchema), validateBody(updatePGSchema), updatePG);
router.delete("/:id", validateParams(idParamSchema), deletePG);

export default router;
