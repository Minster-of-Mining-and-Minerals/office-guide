const Joi = require("joi");

const floorCreateSchema = Joi.object({
  floor_number: Joi.number().integer().min(-10).max(200).required().messages({
    "any.required": "Floor number is required",
    "number.base": "Floor number must be a number",
  }),
  name: Joi.string().trim().min(1).max(100).required().messages({
    "any.required": "Floor name is required",
    "string.empty": "Floor name is required",
    "string.min": "Floor name is required",
  }),
  name_am: Joi.string().trim().min(1).max(100).required().messages({
    "any.required": "Amharic floor name is required",
    "string.empty": "Amharic floor name is required",
    "string.min": "Amharic floor name is required",
  }),
  map_image_url: Joi.string().uri().allow(null, "").max(500).optional(),
  is_active: Joi.boolean().optional(),
});

const floorUpdateSchema = Joi.object({
  floor_number: Joi.number().integer().min(-10).max(200).optional(),
  name: Joi.string().trim().min(1).max(100).optional(),
  name_am: Joi.string().trim().min(1).max(100).optional(),
  map_image_url: Joi.string().uri().allow(null, "").max(500).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

const respond = (res, error) =>
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.details.map((e) => e.message),
  });

exports.validateFloorCreate = (req, res, next) => {
  const { error, value } = floorCreateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) return respond(res, error);
  req.body = value;
  next();
};

exports.validateFloorUpdate = (req, res, next) => {
  const { error, value } = floorUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) return respond(res, error);
  req.body = value;
  next();
};
