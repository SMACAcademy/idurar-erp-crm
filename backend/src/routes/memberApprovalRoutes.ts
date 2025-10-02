import  { Router } from "express";  
import { 
  getRegisteredMembers, 
  approveOrRejectMember, 
} from "../controllers/userApprovalController";
import { authenticateAdmin, authorizeAdmin } from "../middlewares/auth";
import { validateQuery, validateBody, validateParams } from "../middlewares/validation";
import { registeredMembersQuerySchema, approveRejectMemberSchema, idParamSchema } from "../validations/adminValidation";

const router = Router();

router.use(authenticateAdmin);
router.use(authorizeAdmin);

// Registered members approvals routes
router.get("/", validateQuery(registeredMembersQuerySchema), getRegisteredMembers);
router.put("/:id", validateParams(idParamSchema), validateBody(approveRejectMemberSchema), approveOrRejectMember);


export default router;