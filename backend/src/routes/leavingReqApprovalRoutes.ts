import { Router } from 'express';
import { 
  getAllLeavingRequests,
  approveOrRejectRequest,
  recalculateLeavingRequestDues
} from '../controllers/leavingRequestController';
import { authenticateAdmin, authorizeAdmin } from '../middlewares/auth';
import { validateBody, validateQuery } from '../middlewares/validation';
import { 
  getAllLeavingRequestsSchema,
  approveOrRejectRequestSchema 
} from '../validations/leavingRequestValidation';
import { paymentImageUpload } from '../utils/imageUpload';

const router = Router();

router.use(authenticateAdmin)
router.use(authorizeAdmin)

// Admin authenticated routes
router.get(
  '/',
  validateQuery(getAllLeavingRequestsSchema),
  getAllLeavingRequests
);

router.patch(
  '/:id/ONLINE',
  paymentImageUpload.single('settlementProof'),
  validateBody(approveOrRejectRequestSchema),
  approveOrRejectRequest
);

router.patch(
  '/:id/CASH',
  validateBody(approveOrRejectRequestSchema),
  approveOrRejectRequest
);

router.patch(
  '/:id/recalculate-dues',
  recalculateLeavingRequestDues
);

export default router;