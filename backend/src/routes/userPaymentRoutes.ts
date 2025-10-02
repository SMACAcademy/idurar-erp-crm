import { Router } from "express";
import {
  uploadPayment,
  getMemberPayments,
  getPaymentDetails,
  getMemberPaymentsByYear,
} from "../controllers/userPaymentController";
import { authenticateUser } from "../middlewares/auth";
import {
  uploadPaymentScreenshots,
  uploadPaymentCash,
} from "../middlewares/paymentUpload";
import {
  validateUploadPayment,
  validateCashPayment,
  validateOnlinePayment,
  validatePaymentHistoryQuery,
  validatePaymentIdParam,
  validateYearParam,
  validateMonthYearParam,
} from "../validations/paymentValidation";

const router = Router();

// Upload cash payment (no images)
router.post("/upload/cash", 
  authenticateUser, 
  uploadPaymentCash, 
  validateCashPayment, 
  uploadPayment
);

// Upload online payment (
router.post("/upload/online", 
  authenticateUser, 
  uploadPaymentScreenshots, 
  validateOnlinePayment, 
  uploadPayment
);

// Get payment history for authenticated member
router.get("/history", authenticateUser, validatePaymentHistoryQuery, getMemberPayments);

// Get payment status by year for authenticated member
router.get("/year/:year", authenticateUser, validateYearParam, getMemberPaymentsByYear);

// Get specific payment details by month and year
router.get("/:month/:year", authenticateUser, validateMonthYearParam, getPaymentDetails);

export default router;