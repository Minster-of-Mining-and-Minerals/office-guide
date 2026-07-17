const Joi = require("joi");

// 3- or 6-digit hex, `#` prefix required.
const hexColor = Joi.string()
  .trim()
  .pattern(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .messages({
    "string.pattern.base":
      "Color must be a hex string like #ffffff or #fff.",
  });

// Partial update — every field is optional, but if any hex is invalid we bail.
const themeUpdateSchema = Joi.object({
  page_bg: hexColor.optional(),
  card_bg: hexColor.optional(),
  card_text: hexColor.optional(),
  accent: hexColor.optional(),
  accent_dark: hexColor.optional(),
}).min(1);

const respond = (res, error) =>
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.details.map((e) => e.message),
  });

exports.validateThemeUpdate = (req, res, next) => {
  const { error, value } = themeUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) return respond(res, error);
  req.body = value;
  next();
};
