import { Router } from "express";
import pgRoutes from "./pgRoutes";
import adminRoutes from "./adminRoutes";
import roomRoutes from "./roomRoutes";
import registrationRoutes from "./registrationRoutes";
import statsRoutes from "./statsRoutes";
import filterRoutes from "./filterRoutes";
import memberRoutes from "./memberRoutes";
import enquiryRoutes from "./enquiryRoutes";
import reportRoutes from "./reportRoutes";
import userRoutes from "./userRoutes";
import userPaymentRoutes from "./userPaymentRoutes";
import expenseRoutes from "./expenseRoutes";
import memberApprovalRoutes from "./memberApprovalRoutes"
import paymentApprovalRoutes from "./paymentApprovalRoutes"
import userLeavingRequestRoutes from "./userLeavingRequestRoutes";
import leavingReqApprovalRoutes from "./leavingReqApprovalRoutes";

const router = Router();

// Mount route modules

router.use("/register", registrationRoutes);

router.use("/pg", pgRoutes);
router.use("/admin", adminRoutes);

router.use("/stats", statsRoutes);
router.use("/filters", filterRoutes);

router.use("/approvals/members",memberApprovalRoutes);
router.use("/approvals/payments",paymentApprovalRoutes);
router.use("/approvals/leaving-requests",leavingReqApprovalRoutes );

router.use("/members", memberRoutes);
router.use("/rooms", roomRoutes);
router.use("/enquiry", enquiryRoutes);
router.use("/report", reportRoutes);
router.use("/expenses", expenseRoutes);

router.use("/user", userRoutes);
router.use("/user/payments", userPaymentRoutes);
router.use("/user/leaving-requests", userLeavingRequestRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
