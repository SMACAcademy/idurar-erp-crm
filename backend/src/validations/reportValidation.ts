import Joi from "joi";

export const weeklyReportQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

// Monthly report cards validation (no filters needed)
export const monthlyReportQuerySchema = Joi.object({
   page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2020).max(2030).optional()
});


export const reportDownloadQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2020).max(2030).optional(),

});

export const reportDownloadParamsSchema = Joi.object({
  reportType: Joi.string().valid("weekly", "monthly").required()
});

// Weekly report stats validation
export const weeklyReportStatsQuerySchema = Joi.object({
  weekNumber: Joi.number().integer().min(1).max(53).required(),
  year: Joi.number().integer().min(2020).max(2030).required()
});

// Monthly report stats validation
export const monthlyReportStatsQuerySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2020).max(2030).required()
});

// Unified report validation schema (supports both weekly and monthly)
export const unifiedReportQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  year: Joi.number().integer().min(2020).max(2030).required(),
  // Either weekNumber or month must be provided, but not both
  weekNumber: Joi.number().integer().min(1).max(53).optional(),
  month: Joi.number().integer().min(1).max(12).optional()
}).custom((value, helpers) => {
  const { weekNumber, month } = value;
  
  // Ensure either weekNumber or month is provided, but not both
  if (!weekNumber && !month) {
    return helpers.error('any.required', { message: 'Either weekNumber or month is required' });
  }
  
  if (weekNumber && month) {
    return helpers.error('object.conflict', { message: 'Cannot specify both weekNumber and month' });
  }
  
  return value;
});
