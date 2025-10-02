import Joi from "joi";

// Create enquiry validation schema (public)
export const createEnquirySchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim(),
  phone: Joi.string()
    .required()
    .pattern(/^[0-9]{10}$/)
    .message("Phone number must be 10 digits"),
  message: Joi.string().required().min(10).max(1000).trim(),
});

// Enquiry ID parameter validation
export const enquiryIdParamSchema = Joi.object({
  enquiryId: Joi.string().required(),
});

// Enquiry filtering and pagination query schema
export const enquiryFilterQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid("NOT_RESOLVED", "RESOLVED").optional(),
  search: Joi.string().min(1).max(100).optional().trim(),
  sortBy: Joi.string().valid("createdAt", "updatedAt", "name", "status").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  resolvedBy: Joi.string().optional(),
  dateRange: Joi.string().valid("7", "30", "90", "180", "365", "all").optional(),
});
