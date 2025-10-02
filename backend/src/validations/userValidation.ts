import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/response";
import { Gender, RentType, PgType } from "@prisma/client";

// Personal data validation schema (Step 1)
export const validatePersonalDataSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim(),
  dob: Joi.date().iso().required().max('now').min('1900-01-01'),
  gender: Joi.string().valid(...Object.values(Gender)).required(),
  phone: Joi.string().required().pattern(/^[0-9]{10}$/),
  location: Joi.string().required().min(2).max(200).trim(),
  email: Joi.string().email().required()
});

// Complete registration validation schema
export const completeRegistrationSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim(),
  dob: Joi.date().iso().required().max('now').min('1900-01-01'),
  gender: Joi.string().valid(...Object.values(Gender)).required(),
  phone: Joi.string().required().pattern(/^[0-9]{10}$/),
  location: Joi.string().required().min(2).max(200).trim(),
  work: Joi.string().required().min(2).max(100).trim(),
  email: Joi.string().email().required(),
  pgLocation: Joi.string().required().min(2).max(200).trim(),
  rentType: Joi.string().valid(...Object.values(RentType)).required(),
  pgType: Joi.string().valid(...Object.values(PgType)).required(),
});

// Payment submission validation schema
export const submitPaymentSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim(),
  memberId: Joi.string().required().min(3).max(50).trim(),
  roomId: Joi.string().required().trim(),
  pgId: Joi.string().required().trim(),
});

// Common validation schemas
export const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Member Authentication Validations

// Validation for member login (both OTP and password login)
export const validateMemberLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, otp, password } = req.body;

  // Email is always required
  if (!email) {
    res.status(400).json({
      success: false,
      message: "Email is required",
    } as ApiResponse<null>);
    return;
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    } as ApiResponse<null>);
    return;
  }

  // For OTP login endpoint, OTP is required
  if (req.path.includes('otp-login')) {
    if (!otp) {
      res.status(400).json({
        success: false,
        message: "OTP is required for OTP login",
      } as ApiResponse<null>);
      return;
    }

    // OTP format validation (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      res.status(400).json({
        success: false,
        message: "OTP must be 6 digits",
      } as ApiResponse<null>);
      return;
    }
  }

  // For regular login endpoint, password/OTP is required
  if (req.path === '/login') {
    if (!password) {
      res.status(400).json({
        success: false,
        message: "Password or OTP is required for login",
      } as ApiResponse<null>);
      return;
    }

    // Allow both password (min 6 chars) and OTP (exactly 6 digits)
    const isOTP = /^\d{6}$/.test(password);
    const isPassword = password.length >= 6 && !isOTP;

    if (!isOTP && !isPassword) {
      res.status(400).json({
        success: false,
        message: "Please provide either a valid 6-digit OTP or a password (minimum 6 characters)",
      } as ApiResponse<null>);
      return;
    }
  }

  next();
};

// Validation for password setup
export const validatePasswordSetup = (req: Request, res: Response, next: NextFunction): void => {
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    res.status(400).json({
      success: false,
      message: "Password and confirmation are required",
    } as ApiResponse<null>);
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({
      success: false,
      message: "Passwords do not match",
    } as ApiResponse<null>);
    return;
  }

  if (password.length < 6) {
    res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    } as ApiResponse<null>);
    return;
  }

  // Password strength validation
  if (!/(?=.*[a-zA-Z])/.test(password)) {
    res.status(400).json({
      success: false,
      message: "Password must contain at least one letter",
    } as ApiResponse<null>);
    return;
  }

  next();
};

// Validation for change password
export const validateChangePassword = (req: Request, res: Response, next: NextFunction): void => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400).json({
      success: false,
      message: "All password fields are required",
    } as ApiResponse<null>);
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({
      success: false,
      message: "New passwords do not match",
    } as ApiResponse<null>);
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters long",
    } as ApiResponse<null>);
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({
      success: false,
      message: "New password must be different from current password",
    } as ApiResponse<null>);
    return;
  }

  // Password strength validation
  if (!/(?=.*[a-zA-Z])/.test(newPassword)) {
    res.status(400).json({
      success: false,
      message: "New password must contain at least one letter",
    } as ApiResponse<null>);
    return;
  }

  next();
};

// Validation for password reset (without OTP - OTP verification should be done separately)
export const validateResetPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { email, newPassword, confirmPassword } = req.body;

  // All fields required
  if (!email || !newPassword || !confirmPassword) {
    res.status(400).json({
      success: false,
      message: "Email, new password, and confirm password are required",
    } as ApiResponse<null>);
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    } as ApiResponse<null>);
    return;
  }

  // Password validation
  if (newPassword !== confirmPassword) {
    res.status(400).json({
      success: false,
      message: "Passwords do not match",
    } as ApiResponse<null>);
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    } as ApiResponse<null>);
    return;
  }

  // Password strength validation
  if (!/(?=.*[a-zA-Z])/.test(newPassword)) {
    res.status(400).json({
      success: false,
      message: "Password must contain at least one letter",
    } as ApiResponse<null>);
    return;
  }

  next();
};

// Validation for OTP requests
export const validateOTPRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { email, type } = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      message: "Email is required",
    } as ApiResponse<null>);
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    } as ApiResponse<null>);
    return;
  }

  // Type validation (if provided)
  if (type && !['LOGIN', 'PASSWORD_RESET', 'INITIAL_SETUP'].includes(type)) {
    res.status(400).json({
      success: false,
      message: "Invalid OTP type",
    } as ApiResponse<null>);
    return;
  }

  next();
};

// Validation for updating profile
export const validateUpdateProfile = (req: Request, res: Response, next: NextFunction): void => {
  const { name, dob, phone, location, work } = req.body;

  // At least one field must be provided
  if (!name && !dob && !phone && !location && !work) {
    res.status(400).json({
      success: false,
      message: "At least one field must be provided to update",
    } as ApiResponse<null>);
    return;
  }

  // Name validation (if provided)
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters",
      } as ApiResponse<null>);
      return;
    }
  }

  // Date of birth validation (if provided)
  if (dob !== undefined) {
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid date of birth format",
      } as ApiResponse<null>);
      return;
    }

    if (dobDate > new Date()) {
      res.status(400).json({
        success: false,
        message: "Date of birth cannot be in the future",
      } as ApiResponse<null>);
      return;
    }

    // Check minimum age (16 years)
    const minAge = 16;
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    const isOldEnough = age > minAge || (age === minAge && monthDiff >= 0 && today.getDate() >= dobDate.getDate());

    if (!isOldEnough) {
      res.status(400).json({
        success: false,
        message: `Minimum age requirement is ${minAge} years`,
      } as ApiResponse<null>);
      return;
    }
  }

  // Phone validation (if provided)
  if (phone !== undefined) {
    const phoneRegex = /^[0-9]{10}$/;
    if (typeof phone !== 'string' || !phoneRegex.test(phone)) {
      res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      } as ApiResponse<null>);
      return;
    }
  }

  // Location validation (if provided)
  if (location !== undefined) {
    if (typeof location !== 'string' || location.trim().length < 2 || location.trim().length > 200) {
      res.status(400).json({
        success: false,
        message: "Location must be between 2 and 200 characters",
      } as ApiResponse<null>);
      return;
    }
  }

  // Work validation (if provided)
  if (work !== undefined) {
    if (typeof work !== 'string' || work.trim().length < 2 || work.trim().length > 100) {
      res.status(400).json({
        success: false,
        message: "Work type must be between 2 and 100 characters",
      } as ApiResponse<null>);
      return;
    }
  }

  next();
};

// Leaving Request Validation Schemas

// Validation for applying leaving request
export const applyLeavingRequestSchema = Joi.object({
  requestedLeaveDate: Joi.date().iso().required().min('now'),
  reason: Joi.string().required().min(10).max(1000).trim()
});

// Validation middleware for applying leaving request
export const validateApplyLeavingRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = applyLeavingRequestSchema.validate(req.body);
  
  if (error) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.details[0].message,
    } as ApiResponse<null>);
    return;
  }
  
  next();
};
