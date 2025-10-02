import Joi from "joi";

// Member approval validation schema
export const approveRejectMemberSchema = Joi.object({
  status: Joi.string().valid("APPROVED", "REJECTED").required(),
  pgId: Joi.string().when("status", {
    is: "APPROVED",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  roomId: Joi.string().optional(),
  rentAmount: Joi.number().min(0).optional(),
  advanceAmount: Joi.number().min(0).optional(),
  dateOfJoining: Joi.string().isoDate().optional(),
  pricePerDay: Joi.number().min(0).optional(),
  endingDate: Joi.string().isoDate().optional(),
});

// Payment approval validation schema
export const approveRejectPaymentSchema = Joi.object({
  approvalStatus: Joi.string().valid("APPROVED", "REJECTED").required(),
});

// Common validation schemas
export const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

export const paymentIdParamSchema = Joi.object({
  paymentId: Joi.string().required(),
});

// Pagination and query schemas
export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const memberPaymentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(""),
  rentType: Joi.string().valid("LONG_TERM", "SHORT_TERM").optional(),
  paymentStatus: Joi.string().valid("PAID", "PENDING", "OVERDUE").optional(),
  approvalStatus: Joi.string().valid("APPROVED", "PENDING", "REJECTED").optional(),
  pgLocation: Joi.string().optional().allow(""),
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2020).max(2030).optional(),
  sortBy: Joi.string().valid(
    "createdAt", "name", "memberId", "dateOfJoining", "age", 
    "location", "work", "pgName", "pgLocation", "roomNo", "rentAmount"
  ).default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});
