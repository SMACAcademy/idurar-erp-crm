import Joi from "joi";

// Get all members query validation schema
export const getAllMembersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  pgId: Joi.string().optional(),
  work: Joi.string().optional().trim(), // Can be comma-separated values
  paymentStatus: Joi.string().valid('PAID', 'PENDING', 'OVERDUE').optional(),
  status: Joi.string().valid('PAID', 'PENDING', 'OVERDUE').optional(), // Alias for paymentStatus
  search: Joi.string().optional().trim(),
  sortBy: Joi.string().valid(
    'name', 'memberId', 'dateOfJoining', 'createdAt', 'age', 
    'rentAmount', 'pgName', 'pgLocation', 'roomNo', 'work'
  ).optional().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
});

// Dashboard filter options query validation schema
export const getDashboardFilterOptionsQuerySchema = Joi.object({
  // No specific query parameters needed for filter options
});
