import { Router } from "express";

import { 
  getPGPerformance,
  getRoomUtilization,
  getPaymentAnalytics,
  getFinancialSummary
} from "../controllers/reportTableController";
import { downloadReport } from "../controllers/reportDownloadController";
import { authenticateAdmin } from "../middlewares/auth";
import { validateParams, validateQuery } from "../middlewares/validation";
import { 
  unifiedReportQuerySchema,
  reportDownloadParamsSchema,
  reportDownloadQuerySchema,
} from "../validations/reportValidation";

const router = Router();

// All routes require authentication
router.use(authenticateAdmin);

// Unified Report Table Data Routes (support both weekly and monthly)
router.get(
  "/pg-report",
  validateQuery(unifiedReportQuerySchema),
  getPGPerformance
);

router.get(
  "/room-report",
  validateQuery(unifiedReportQuerySchema),
  getRoomUtilization
);

router.get(
  "/payment-report",
  validateQuery(unifiedReportQuerySchema),
  getPaymentAnalytics
);

router.get(
  "/financial-report",
  validateQuery(unifiedReportQuerySchema),
  getFinancialSummary
);

// Excel download route
router.get(
  "/download/:reportType",
  authenticateAdmin,
  validateQuery(reportDownloadQuerySchema),
  validateParams(reportDownloadParamsSchema),
  downloadReport
);

export default router;
