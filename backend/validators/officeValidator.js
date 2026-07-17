const Joi = require("joi");

// A short list of service tags: max 20 items, each trimmed and 1..150 chars.
// Empty strings are stripped so `["A", "", "B"]` becomes `["A", "B"]`.
const servicesSchema = Joi.array()
  .items(Joi.string().trim().min(1).max(150))
  .max(20)
  .default([])
  .messages({
    "array.max": "An office can have at most 20 services",
    "string.max": "Each service must be 150 characters or fewer",
  });

/**
 * Cross-field checks that Joi's `.when()` handles awkwardly: for each optional
 * pair we simply verify "EN present ⇒ AM present" ourselves. Also enforces
 * `services` and `services_am` have identical length.
 */
const enforceBilingualPairs = (value, helpers) => {
  const hasText = (v) => typeof v === "string" && v.trim().length > 0;

  const pairs = [
    ["department", "department_am", "department"],
    ["contact_person", "contact_person_am", "contact person"],
    ["description", "description_am", "description"],
  ];
  for (const [enKey, amKey, label] of pairs) {
    const enFilled = hasText(value[enKey]);
    const amFilled = hasText(value[amKey]);
    if (enFilled && !amFilled) {
      return helpers.message({
        custom: `Amharic ${label} is required when English ${label} is set`,
      });
    }
  }

  const en = Array.isArray(value.services) ? value.services : [];
  const am = Array.isArray(value.services_am) ? value.services_am : [];
  if (en.length !== am.length) {
    return helpers.message({
      custom:
        "Amharic services must have the same number of items as English services",
    });
  }
  return value;
};

const officeCreateSchema = Joi.object({
  floor_id: Joi.string().uuid().required().messages({
    "any.required": "Floor is required",
    "string.guid": "Floor id must be a valid UUID",
  }),
  // English
  name: Joi.string().trim().min(1).max(150).required().messages({
    "any.required": "Office name is required",
    "string.empty": "Office name is required",
    "string.min": "Office name is required",
  }),
  department: Joi.string().trim().allow(null, "").max(150).optional(),
  contact_person: Joi.string().trim().allow(null, "").max(150).optional(),
  description: Joi.string().trim().allow(null, "").optional(),

  // Amharic — only `name_am` is unconditionally required. The rest are only
  // required when the English sibling is filled; that's enforced by
  // `enforceBilingualPairs` below.
  name_am: Joi.string().trim().min(1).max(150).required().messages({
    "any.required": "Amharic office name is required",
    "string.empty": "Amharic office name is required",
    "string.min": "Amharic office name is required",
  }),
  department_am: Joi.string().trim().allow(null, "").max(150).optional(),
  contact_person_am: Joi.string().trim().allow(null, "").max(150).optional(),
  description_am: Joi.string().trim().allow(null, "").optional(),

  room_number: Joi.string().trim().min(1).max(50).required().messages({
    "any.required": "Room number is required",
    "string.empty": "Room number is required",
  }),
  display_order: Joi.number().integer().min(0).max(100000).optional(),

  services: servicesSchema.optional(),
  services_am: servicesSchema.optional(),
}).custom(enforceBilingualPairs, "bilingual pairs");

const officeUpdateSchema = Joi.object({
  floor_id: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(1).max(150).optional(),
  name_am: Joi.string().trim().min(1).max(150).optional(),
  department: Joi.string().trim().allow(null, "").max(150).optional(),
  department_am: Joi.string().trim().allow(null, "").max(150).optional(),
  contact_person: Joi.string().trim().allow(null, "").max(150).optional(),
  contact_person_am: Joi.string().trim().allow(null, "").max(150).optional(),
  room_number: Joi.string().trim().min(1).max(50).optional(),
  description: Joi.string().trim().allow(null, "").optional(),
  description_am: Joi.string().trim().allow(null, "").optional(),
  display_order: Joi.number().integer().min(0).max(100000).optional(),
  services: servicesSchema.optional(),
  services_am: servicesSchema.optional(),
})
  .min(1)
  .custom((value, helpers) => {
    // Only enforce length match on updates where both are provided.
    if (value.services !== undefined && value.services_am !== undefined) {
      if (value.services.length !== value.services_am.length) {
        return helpers.message({
          custom:
            "Amharic services must have the same number of items as English services",
        });
      }
    }
    return value;
  }, "services length match");

const officeReorderSchema = Joi.object({
  floor_id: Joi.string().uuid().required(),
  ordered_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const respond = (res, error) =>
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.details.map((e) => e.message),
  });

const runValidator = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) return respond(res, error);
  req.body = value;
  next();
};

exports.validateOfficeCreate = runValidator(officeCreateSchema);
exports.validateOfficeUpdate = runValidator(officeUpdateSchema);
exports.validateOfficeReorder = runValidator(officeReorderSchema);
