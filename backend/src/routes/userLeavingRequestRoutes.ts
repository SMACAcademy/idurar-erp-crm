import { Router } from "express";
import {
  applyLeavingRequest,
  getLeavingRequestStatus,
} from "../controllers/leavingRequestController";
import { authenticateUser, authenticateAdmin } from "../middlewares/auth";
import { validateBody, validateQuery } from "../middlewares/validation";
import {
  applyLeavingRequestSchema,
  getLeavingRequestStatusSchema,
} from "../validations/leavingRequestValidation";

const router = Router();

// User authenticated routes (members can apply for leaving requests)
router.use(authenticateUser);

router.post(
  "/apply",
  validateBody(applyLeavingRequestSchema),
  applyLeavingRequest
);

router.get(
  "/status",
  validateQuery(getLeavingRequestStatusSchema),
  getLeavingRequestStatus
);

export default router;
