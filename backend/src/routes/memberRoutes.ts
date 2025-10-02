import { Router } from "express";
import {
  getMembersByRentType,
  getMemberDetails,
  getAllMembers,
} from "../controllers/memberController";
import { authenticateAdmin, authorizeAdmin } from "../middlewares/auth";
import { validateQuery } from "../middlewares/validation";
import { memberQuerySchema } from "../validations/memberValidation";
import { getAllMembersQuerySchema } from "../validations/dashboardValidation";
import { getMemberReport } from "../controllers/memberReportController";

const router = Router();

router.use(authenticateAdmin);
router.use(authorizeAdmin);

router.get("/", validateQuery(getAllMembersQuerySchema), getAllMembers);

router.get("/:memberId", getMemberDetails);

router.get(
  "/rent/:rentType",
  validateQuery(memberQuerySchema),
  getMembersByRentType
);

router.get("/report/:memberId", getMemberReport);

export default router;
