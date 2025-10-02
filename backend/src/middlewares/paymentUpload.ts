import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure storage for payment images
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    cb(null, 'uploads/payment/');
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const fieldPrefix = file.fieldname === 'rentBillScreenshot' ? 'rent' : 'electricity';
    cb(null, `${fieldPrefix}-${uniqueSuffix}${extension}`);
  }
});

// File filter to only allow image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for payment screenshots'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Middleware for online payment uploads (both rent and electricity bill screenshots)
export const uploadPaymentScreenshots = upload.fields([
  { name: 'rentBillScreenshot', maxCount: 1 },
  { name: 'electricityBillScreenshot', maxCount: 1 }
]);

// Middleware for cash payments (no file uploads)
export const uploadPaymentCash = (req: Request, res: any, next: Function) => {
  // For cash payments, no files should be uploaded
  if (req.files || req.file) {
    return res.status(400).json({
      success: false,
      message: 'File uploads are not allowed for cash payments'
    });
  }
  next();
};