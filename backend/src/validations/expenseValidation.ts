import Joi from 'joi';

// Validation schema for adding expense
export const addExpenseValidation = Joi.object({
  entryType: Joi.string().valid('CASH_IN', 'CASH_OUT').required(),
  amount: Joi.number().positive().required(),
  date: Joi.date().iso().required(),
  partyName: Joi.string().min(2).max(100).required(),
  paymentType: Joi.string().valid('ONLINE', 'CASH').required(),
  remarks: Joi.string().max(500).optional().allow('', null),
  pgId: Joi.string().required()
});

// Validation schema for updating expense
export const updateExpenseValidation = Joi.object({
  entryType: Joi.string().valid('CASH_IN', 'CASH_OUT').required(),
  amount: Joi.number().positive().required(),
  date: Joi.date().iso().required(),
  partyName: Joi.string().min(2).max(100).required(),
  paymentType: Joi.string().valid('ONLINE', 'CASH').required(),
  remarks: Joi.string().max(500).optional().allow('', null)
});

// Validation schema for getting expenses with pagination and filters
export const getExpensesValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  pgId: Joi.string().optional(),
  entryType: Joi.string().valid('CASH_IN', 'CASH_OUT').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional().when('startDate', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('startDate')),
    otherwise: Joi.optional()
  }),
  paymentType: Joi.string().valid('ONLINE', 'CASH').optional(),
  sortBy: Joi.string().valid('date', 'amount', 'createdAt', 'entryType', 'partyName').default('date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Validation schema for expense ID parameter
export const expenseIdValidation = Joi.object({
  id: Joi.string().required()
});

// Validation schema for expense statistics
export const expenseStatsValidation = Joi.object({
  pgId: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional().when('startDate', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('startDate')),
    otherwise: Joi.optional()
  })
});