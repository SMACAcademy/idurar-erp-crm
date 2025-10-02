import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/response";
import { PaymentMethod } from "@prisma/client";

// Payment upload validation schema for Cash payments
export const uploadCashPaymentSchema = Joi.object({
  amount: Joi.alternatives().try(
    Joi.number().positive().min(0.01).max(1000000),
    Joi.string().pattern(/^\d+(\.\d{1,2})?$/).custom((value) => parseFloat(value))
  ).required(),
  paymentMethod: Joi.string().valid('CASH').required(),
  month: Joi.alternatives().try(
    Joi.number().integer().min(1).max(12),
    Joi.string().pattern(/^([1-9]|1[0-2])$/).custom((value) => parseInt(value))
  ).required(),
  year: Joi.alternatives().try(
    Joi.number().integer().min(2020).max(2050),
    Joi.string().pattern(/^(20[2-5][0-9])$/).custom((value) => parseInt(value))
  ).required(),
});

// Payment upload validation schema for Online payments
export const uploadOnlinePaymentSchema = Joi.object({
  amount: Joi.alternatives().try(
    Joi.number().positive().min(0.01).max(1000000),
    Joi.string().pattern(/^\d+(\.\d{1,2})?$/).custom((value) => parseFloat(value))
  ).required(),
  month: Joi.alternatives().try(
    Joi.number().integer().min(1).max(12),
    Joi.string().pattern(/^([1-9]|1[0-2])$/).custom((value) => parseInt(value))
  ).required(),
  year: Joi.alternatives().try(
    Joi.number().integer().min(2020).max(2050),
    Joi.string().pattern(/^(20[2-5][0-9])$/).custom((value) => parseInt(value))
  ).required(),
  paymentMethod: Joi.string().valid('ONLINE').required(),
});

// Legacy schema for backward compatibility
export const uploadPaymentSchema = Joi.object({
  amount: Joi.alternatives().try(
    Joi.number().positive().min(0.01).max(1000000),
    Joi.string().pattern(/^\d+(\.\d{1,2})?$/).custom((value) => parseFloat(value))
  ).required(),
  paymentMethod: Joi.string().valid(...Object.values(PaymentMethod)).required(),
  month: Joi.alternatives().try(
    Joi.number().integer().min(1).max(12),
    Joi.string().pattern(/^([1-9]|1[0-2])$/).custom((value) => parseInt(value))
  ).required(),
  year: Joi.alternatives().try(
    Joi.number().integer().min(2020).max(2050),
    Joi.string().pattern(/^(20[2-5][0-9])$/).custom((value) => parseInt(value))
  ).required(),
  rentBillScreenshot: Joi.when('paymentMethod', {
    is: 'ONLINE',
    then: Joi.string().uri().required(),
    otherwise: Joi.optional()
  }),
  electricityBillScreenshot: Joi.when('paymentMethod', {
    is: 'ONLINE', 
    then: Joi.string().uri().required(),
    otherwise: Joi.optional()
  })
});

// Payment history query validation schema
export const paymentHistoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Payment ID parameter validation schema
export const paymentIdParamSchema = Joi.object({
  paymentId: Joi.string().required(),
});

// Year parameter validation schema
export const yearParamSchema = Joi.object({
  year: Joi.number().integer().min(2020).max(2050).required(),
});

// Month and Year parameter validation schema
export const monthYearParamSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2020).max(2050).required(),
});

// Validation middleware for cash payment upload
export const validateCashPayment = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = uploadCashPaymentSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    res.status(400).json({
      success: false,
      message: `Validation error: ${errorMessage}`,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
    return;
  }

  // Check if payment is for future months
  const { month, year } = req.body;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    res.status(400).json({
      success: false,
      message: 'Cannot make payment for future months',
    });
    return;
  }

  next();
};

// Validation middleware for online payment upload
export const validateOnlinePayment = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = uploadOnlinePaymentSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    res.status(400).json({
      success: false,
      message: `Validation error: ${errorMessage}`,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
    return;
  }

  // Check if payment is for future months
  const { month, year } = req.body;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    res.status(400).json({
      success: false,
      message: 'Cannot make payment for future months',
    });
    return;
  }

  // Check if required files are uploaded
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  
  if (!files || !files.rentBillScreenshot || !files.electricityBillScreenshot) {
    res.status(400).json({
      success: false,
      message: 'Both rent bill and electricity bill screenshots are required for online payments',
    });
    return;
  }

  next();
};

// Legacy validation middleware for upload payment (backward compatibility)
export const validateUploadPayment = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = uploadPaymentSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    res.status(400).json({
      success: false,
      message: `Validation error: ${errorMessage}`,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
    return;
  }

  // Additional custom validation
  const { paymentMethod, rentBillScreenshot, electricityBillScreenshot, month, year } = req.body;

  // Check if current payment is for future months (optional business rule)
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    res.status(400).json({
      success: false,
      message: 'Cannot make payment for future months',
    });
    return;
  }

  // Validate screenshots for online payments
  if (paymentMethod === 'ONLINE') {
    if (!rentBillScreenshot || !electricityBillScreenshot) {
      res.status(400).json({
        success: false,
        message: 'Both rent bill and electricity bill screenshots are required for online payments',
      });
      return;
    }
  }

  // Validate that cash payments don't have screenshots
  if (paymentMethod === 'CASH') {
    if (rentBillScreenshot || electricityBillScreenshot) {
      res.status(400).json({
        success: false,
        message: 'Screenshots should not be provided for cash payments',
      });
      return;
    }
  }

  next();
};

// Validation middleware for payment history query
export const validatePaymentHistoryQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = paymentHistoryQuerySchema.validate(req.query, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    res.status(400).json({
      success: false,
      message: `Query validation error: ${errorMessage}`,
    });
    return;
  }

  next();
};

// Validation middleware for payment ID parameter
export const validatePaymentIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = paymentIdParamSchema.validate(req.params, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    res.status(400).json({
      success: false,
      message: `Parameter validation error: ${errorMessage}`,
    });
    return;
  }

  next();
};

// Validation middleware for year parameter
export const validateYearParam = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = yearParamSchema.validate(req.params, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    res.status(400).json({
      success: false,
      message: `Parameter validation error: ${errorMessage}`,
    });
    return;
  }

  next();
};

// Validation middleware for month and year parameters
export const validateMonthYearParam = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = monthYearParamSchema.validate(req.params, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    res.status(400).json({
      success: false,
      message: `Parameter validation error: ${errorMessage}`,
    });
    return;
  }

  next();
};

// Additional validation for payment amount based on member's rent (optional)
export const validatePaymentAmount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // This middleware can be used to validate payment amount against expected rent
    // For now, we'll just pass through, but business logic can be added here
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating payment amount',
    });
  }
};