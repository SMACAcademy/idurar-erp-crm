const Joi = require('joi');
const schema = Joi.object({
  client: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
  description: Joi.string().required(),
  number: Joi.number().required(),
  resolution: Joi.string().optional().max(100),
  status: Joi.string().required().valid('Open', 'InProgress', 'Closed'),
  // array cannot be empty
  notes: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().allow('').optional(),
        text: Joi.string().optional(),
      }).required()
    )
    .optional(),
});

module.exports = schema;
