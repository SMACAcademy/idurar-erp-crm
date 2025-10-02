import Joi from "joi";
import { PgType } from "@prisma/client";

// PG validation schemas
export const createPGSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim(),
  type: Joi.string().valid(...Object.values(PgType)).required(),
  location: Joi.string().required().min(2).max(200).trim(),
});

export const updatePGSchema = Joi.object({
  name: Joi.string().optional().min(2).max(100).trim(),
  type: Joi.string().valid(...Object.values(PgType)).optional(),
  location: Joi.string().optional().min(2).max(200).trim(),
}).min(1); // At least one field must be provided

// Common validation schemas
export const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});
