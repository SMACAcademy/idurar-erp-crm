import { Router } from "express";
import { authenticateAdmin, authorizeAdmin } from "../middlewares/auth";
import {
  getDashboardStats,
  getEnquiryStats,
  getExpenseStats,
  getLeavingRequestStats,
  getMonthlyReportStats,
  getPaymentStats,
  getRegistrationStats,
  getRoomStats,
  getWeeklyReportStats,
} from "../controllers/statsController";
import { validateParams, validateQuery } from "../middlewares/validation";
import { pgIdParamSchema } from "../validations/roomValidation";
import { expenseStatsValidation } from "../validations/expenseValidation";
import { monthlyReportStatsQuerySchema, weeklyReportStatsQuerySchema } from "../validations/reportValidation";

const router = Router();

// Protected routes
router.use(authenticateAdmin);
router.use(authorizeAdmin);

router.get("/dashboard", getDashboardStats);

router.get("/approvals/pending_registration",getRegistrationStats);
router.get("/approvals/pending_payment", getPaymentStats);
router.get("/approvals/relieving_requests", getLeavingRequestStats);

// GET Room stats - defaults to first PG if no pgId provided
router.get("/rooms", getRoomStats);
router.get("/rooms/:pgId", validateParams(pgIdParamSchema), getRoomStats);

router.get("/expenses", validateQuery(expenseStatsValidation), getExpenseStats);

router.get("/enquiry", authenticateAdmin, getEnquiryStats);

router.get("/reports/weekly", validateQuery(weeklyReportStatsQuerySchema), getWeeklyReportStats);
router.get("/reports/monthly", validateQuery(monthlyReportStatsQuerySchema), getMonthlyReportStats);

export default router;
