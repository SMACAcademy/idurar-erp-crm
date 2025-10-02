import express from 'express';
import multer from 'multer';
import {
  addExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController';
import { authenticateAdmin } from '../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation';
import {
  addExpenseValidation,
  updateExpenseValidation,
  getExpensesValidation,
  expenseIdValidation,
  expenseStatsValidation
} from '../validations/expenseValidation';

const router = express.Router();

// Configure multer for file uploads (expense bills)
const upload = multer({
  dest: 'uploads/bills/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 3 // Maximum 3 files
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.'));
    }
  }
});

// Apply admin authentication to all expense routes
router.use(authenticateAdmin);

router.post(
  '/',
  upload.array('bills', 3), // Accept up to 3 files with field name 'bills'
  validateBody(addExpenseValidation),
  addExpense
);

router.get(
  '/',
  validateQuery(getExpensesValidation),
  getExpenses
);


router.get(
  '/:id',
  validateParams(expenseIdValidation),
  getExpenseById
);


router.put(
  '/:id',
  upload.array('bills', 3), // Accept up to 3 files for update
  validateParams(expenseIdValidation),
  validateBody(updateExpenseValidation),
  updateExpense
);

router.delete(
  '/:id',
  validateParams(expenseIdValidation),
  deleteExpense
);

export default router;