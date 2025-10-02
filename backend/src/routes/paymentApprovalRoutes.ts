import  { Router } from "express";  
import {
  getMembersPaymentData,
  approveOrRejectPayment
} from "../controllers/paymentApprovalController";
import { authenticateAdmin, authorizeAdmin } from "../middlewares/auth";
import { validateQuery, validateBody, validateParams } from "../middlewares/validation";
import { approveRejectPaymentSchema, paymentIdParamSchema, memberPaymentQuerySchema } from "../validations/approvalValidation";

const router = Router();

router.use(authenticateAdmin);
router.use(authorizeAdmin);

// Members payment data routes
router.get("/", validateQuery(memberPaymentQuerySchema), getMembersPaymentData);
router.put("/:paymentId", validateParams(paymentIdParamSchema), validateBody(approveRejectPaymentSchema), approveOrRejectPayment);

export default router;