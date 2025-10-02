import express from "express";
import { authenticateAdmin } from "../middlewares/auth";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation";
import {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  deleteEnquiry,
} from "../controllers/enquiryController";
import {
  createEnquirySchema,
  enquiryIdParamSchema,
  enquiryFilterQuerySchema,
} from "../validations/enquiryValidation";

const router = express.Router();

// PUBLIC ROUTES (no authentication required)
router.post(
  "/",
  validateBody(createEnquirySchema),
  createEnquiry
);

// ADMIN ROUTES (authentication required)
router.get(
  "/",
  authenticateAdmin,
  validateQuery(enquiryFilterQuerySchema),
  getEnquiries
);

router.get(
  "/:enquiryId",
  authenticateAdmin,
  validateParams(enquiryIdParamSchema),
  getEnquiryById
);

router.patch(
  "/:enquiryId/resolve",
  authenticateAdmin,
  validateParams(enquiryIdParamSchema),
  updateEnquiryStatus
);

router.delete(
  "/:enquiryId",
  authenticateAdmin,
  validateParams(enquiryIdParamSchema),
  deleteEnquiry
);

export default router;
