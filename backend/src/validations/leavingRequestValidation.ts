import { PaymentMethod } from "@prisma/client";
import Joi from "joi";

// Validation schema for applying a leaving request
export const applyLeavingRequestSchema = Joi.object({
  requestedLeaveDate: Joi.date().min("now").required().messages({
    "date.min": "Requested leave date must be in the future",
    "any.required": "Requested leave date is required",
  }),
  reason: Joi.string().min(10).max(1000).required().messages({
    "string.min": "Reason must be at least 10 characters long",
    "string.max": "Reason cannot exceed 1000 characters",
    "any.required": "Reason for leaving is required",
  }),
  feedback: Joi.string().optional(),
});

// Validation schema for getting leaving request status (query params)
export const getLeavingRequestStatusSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string()
    .valid("PENDING", "APPROVED", "REJECTED", "COMPLETED")
    .optional(),
});

// Validation schema for admin getting all leaving requests (query params)
export const getAllLeavingRequestsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string()
    .valid("PENDING", "APPROVED", "REJECTED", "COMPLETED")
    .optional(),
  sortBy: Joi.string()
    .valid("createdAt", "requestedLeaveDate", "approvedAt")
    .default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  search: Joi.string().min(1).max(100).optional(),
});

// Validation schema for approving or rejecting a leaving request
export const approveOrRejectRequestSchema = Joi.object({
  approvalStatus: Joi.string()
    .valid("APPROVED", "REJECTED")
    .required()
    .messages({
      "any.only": "Status must be either APPROVED or REJECTED",
      "any.required": "Status is required",
    }),
  finalAmount: Joi.number()
    .min(0)
    .when("approvalStatus", {
      is: "APPROVED",
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "number.min": "Final amount cannot be negative",
    }),
  paymentMethod: Joi.string().valid("ONLINE", "CASH").required().messages({
    "any.only": "Payment method must be either ONLINE or CASH",
    "any.required": "Payment method is required",
  }),
});

// Validation schema for completing a leaving request (updating settlement details)
export const completeLeavingRequestSchema = Joi.object({
  settledDate: Joi.date().max("now").required().messages({
    "date.max": "Settled date cannot be in the future",
    "any.required": "Settled date is required",
  }),
  paymentMethod: Joi.string().valid("ONLINE", "CASH").required().messages({
    "any.only": "Payment method must be either ONLINE or CASH",
    "any.required": "Payment method is required",
  }),
  settlementProof: Joi.string().uri().optional().messages({
    "string.uri": "Settlement proof must be a valid URL",
  }),
});
