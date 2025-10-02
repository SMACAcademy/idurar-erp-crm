import Joi from "joi";

// Room creation validation schema
export const createRoomSchema = Joi.object({
  roomNo: Joi.string().required().min(1).max(10).trim(),
  rent: Joi.number().required().min(0).max(999999),
  electricityCharge: Joi.number().required().min(0).max(999999),
  capacity: Joi.number().integer().required().min(1).max(20),
  pgLocation: Joi.string().optional()
});

// Room update validation schema
export const updateRoomSchema = Joi.object({
  roomNo: Joi.string().optional().min(1).max(10).trim(),
  rent: Joi.number().optional().min(0).max(999999),
  electricityCharge: Joi.number().optional().min(0).max(999999),
  capacity: Joi.number().integer().optional().min(1).max(20),
}).min(1);

// Common validation schemas
export const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

export const pgIdParamSchema = Joi.object({
  pgId: Joi.string().required(),
});

export const roomIdParamSchema = Joi.object({
  roomId: Joi.string().required(),
});

export const pgIdAndRoomIdParamSchema = Joi.object({
  pgId: Joi.string().required(),
  roomId: Joi.string().required(),
});

export const locationParamSchema = Joi.object({
  location: Joi.string().required().min(1).trim(),
});

export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Room filtering and pagination query schema
export const roomFilterQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  occupancyStatus: Joi.string().valid('FULLY_VACANT', 'PARTIALLY_OCCUPIED', 'FULLY_OCCUPIED').optional(),
}).custom((value, helpers) => {
  // Validate rent range
  if (value.minRent && value.maxRent && value.minRent > value.maxRent) {
    return helpers.error('custom.rentRange');
  }
  
  // Validate capacity range
  if (value.minCapacity && value.maxCapacity && value.minCapacity > value.maxCapacity) {
    return helpers.error('custom.capacityRange');
  }
  
  return value;
}).messages({
  'custom.rentRange': 'minRent cannot be greater than maxRent',
  'custom.capacityRange': 'minCapacity cannot be greater than maxCapacity',
});


export const roomFilterParamsSchema = Joi.object({
  location: Joi.string().optional(),
  occupancyStatus: Joi.string().valid('FULLY_VACANT', 'PARTIALLY_OCCUPIED', 'FULLY_OCCUPIED').optional(),
});