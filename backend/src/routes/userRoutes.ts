import { Router } from "express";
import {
  verifyMemberOTP,
  setupMemberPassword,
  memberLogin,
  changeMemberPassword,
  resetMemberPassword,
  requestPasswordResetOTP,
  getMemberProfile,
  updateMemberProfile,
  getCurrentMonthOverview,
  updateDigitalSignature,
  getMemberDigitalSignature,
  getMemberDocumentProof,
  updateMemberDocumentProof,
} from "../controllers/userController";
import { authenticateUser } from "../middlewares/auth";;
import { validateMemberLogin, validatePasswordSetup, validateChangePassword, validateResetPassword, validateOTPRequest, validateUpdateProfile } from "../validations/userValidation";
import { documentImageUpload } from "../utils/imageUpload";

const router = Router();

router.post("/otp-verify", validateMemberLogin, verifyMemberOTP);

router.post("/setup-password", authenticateUser, validatePasswordSetup, setupMemberPassword);

router.post("/login", validateMemberLogin, memberLogin);

router.post("/change-password", authenticateUser, validateChangePassword, changeMemberPassword);

router.post("/request-otp", validateOTPRequest, requestPasswordResetOTP);

router.post("/reset-password", validateResetPassword, resetMemberPassword);

router.get("/profile", authenticateUser, getMemberProfile);

router.put("/profile", authenticateUser, validateUpdateProfile, updateMemberProfile);

router.get("/current-month-overview", authenticateUser, getCurrentMonthOverview);

router.get("/digital-signature", authenticateUser, getMemberDigitalSignature);

router.put("/digital-signature", authenticateUser, documentImageUpload.single('digitalSignature'), updateDigitalSignature);

router.get("/document-proof", authenticateUser, getMemberDocumentProof);

router.put("/document-proof", authenticateUser, documentImageUpload.single('documentProof'), updateMemberDocumentProof);

export default router;