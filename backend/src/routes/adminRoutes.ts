import { Router } from "express";
import {
  loginAdmin,
  createAdmin,
  getProfile,
  updateProfile,
  getManagedPGs,
  updateOverduePaymentsEndpoint,
  cleanupInactiveMembers,
  updateLeavingRequestDues,
} from "../controllers/adminController";
import { validateBody } from "../middlewares/validation";
import { authenticateAdmin, authorizeAdmin } from "../middlewares/auth";
import {
  adminLoginSchema,
  createAdminSchema,
  updateAdminSchema,
} from "../validations/adminValidation";

const router = Router();

// Public routes
router.post("/login", validateBody(adminLoginSchema), loginAdmin);

// Temporary route for creating admin, remove later
router.post("/", validateBody(createAdminSchema), createAdmin);

// Protected routes (authentication required)
router.use(authenticateAdmin);
router.use(authorizeAdmin);

// Admin management routes
router.get("/profile", getProfile);
router.put("/profile", validateBody(updateAdminSchema), updateProfile);

// PG management routes
router.get("/pgs", getManagedPGs);

// Payment record management routes
router.post("/payment-records/update-overdue", updateOverduePaymentsEndpoint);

// Member data cleanup routes
router.post("/members/cleanup-inactive", cleanupInactiveMembers);

// Leaving request management routes
router.post("/leaving-requests/update-dues", updateLeavingRequestDues);

export default router;
