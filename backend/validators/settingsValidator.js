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

// ─── Display mode ───────────────────────────────────────────────────

const displayModeConfigSchema = Joi.object({
  mode: Joi.string()
    .valid("guide_only", "announcements_only", "both")
    .optional()
    .messages({
      "any.only": "Mode must be one of guide_only, announcements_only, both.",
    }),
  rotation_seconds: Joi.number()
    .integer()
    .min(5)
    .max(3600)
    .optional()
    .messages({
      "number.min": "Rotation must be at least 5 seconds.",
      "number.max": "Rotation must be at most 3600 seconds (1 hour).",
    }),
});

// Allow a map of floor IDs to their display configurations.
const displayModeUpdateSchema = Joi.object()
  .pattern(Joi.string(), displayModeConfigSchema)
  .min(1);

exports.validateDisplayModeUpdate = (req, res, next) => {
  const { error, value } = displayModeUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) return respond(res, error);
  req.body = value;
  next();
};
