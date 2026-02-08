/**
 * Validation Middleware
 * Input validation and sanitization
 */

const validator = require("validator");
const logger = require("../utils/logger");

/**
 * Standard response for validation errors
 */
const sendValidationError = (res, field, message) => {
  return res.status(400).json({
    success: false,
    message: "Validation error",
    code: "VALIDATION_ERROR",
    details: {
      field,
      message,
    },
  });
};

/**
 * Validate registration input
 */
const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;

  // Check required fields
  if (!email) {
    return sendValidationError(res, "email", "Email is required");
  }

  if (!password) {
    return sendValidationError(res, "password", "Password is required");
  }

  if (!name) {
    return sendValidationError(res, "name", "Name is required");
  }

  // Validate email format
  const trimmedEmail = email.trim().toLowerCase();
  if (!validator.isEmail(trimmedEmail)) {
    return sendValidationError(
      res,
      "email",
      "Please provide a valid email address",
    );
  }

  // Validate name
  if (name.trim().length < 2) {
    return sendValidationError(
      res,
      "name",
      "Name must be at least 2 characters long",
    );
  }

  if (name.trim().length > 50) {
    return sendValidationError(res, "name", "Name cannot exceed 50 characters");
  }

  // Validate password strength
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(password)) {
    return sendValidationError(
      res,
      "password",
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
    );
  }

  // Sanitize inputs
  req.body.email = trimmedEmail;
  req.body.name = validator.trim(name);
  req.body.password = password; // Don't trim password

  logger.debug(`Registration validation passed for email: ${trimmedEmail}`);
  next();
};

/**
 * Validate login input
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Check required fields
  if (!email) {
    return sendValidationError(res, "email", "Email is required");
  }

  if (!password) {
    return sendValidationError(res, "password", "Password is required");
  }

  // Validate email format
  const trimmedEmail = email.trim().toLowerCase();
  if (!validator.isEmail(trimmedEmail)) {
    return sendValidationError(
      res,
      "email",
      "Please provide a valid email address",
    );
  }

  // Sanitize inputs
  req.body.email = trimmedEmail;
  req.body.password = password;

  logger.debug(`Login validation passed for email: ${trimmedEmail}`);
  next();
};

/**
 * Validate update settings input
 */
const validateUpdateSettings = (req, res, next) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== "object") {
    return sendValidationError(res, "settings", "Settings object is required");
  }

  // Allowed fields to update
  const allowedFields = [
    "morningTime",
    "eveningTime",
    "reminders",
    "timezone",
    "theme",
    "language",
    "emailNotifications",
  ];

  // Validate timezone enum
  const allowedTimezones = [
    "UTC",
    "EST",
    "CST",
    "MST",
    "PST",
    "GMT",
    "IST",
    "JST",
    "AEST",
  ];
  const allowedThemes = ["light", "dark"];
  const allowedLanguages = ["en", "es", "fr", "de", "hi", "zh", "ja"];

  // Validate time format (HH:mm)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  for (const key in settings) {
    if (!allowedFields.includes(key)) {
      return sendValidationError(
        res,
        key,
        `Field '${key}' is not allowed to be updated`,
      );
    }

    // Validate specific fields
    if (key === "morningTime" && !timeRegex.test(settings[key])) {
      return sendValidationError(
        res,
        "morningTime",
        "Morning time must be in HH:mm format",
      );
    }

    if (key === "eveningTime" && !timeRegex.test(settings[key])) {
      return sendValidationError(
        res,
        "eveningTime",
        "Evening time must be in HH:mm format",
      );
    }

    if (key === "timezone" && !allowedTimezones.includes(settings[key])) {
      return sendValidationError(
        res,
        "timezone",
        `Timezone must be one of: ${allowedTimezones.join(", ")}`,
      );
    }

    if (key === "theme" && !allowedThemes.includes(settings[key])) {
      return sendValidationError(
        res,
        "theme",
        `Theme must be one of: ${allowedThemes.join(", ")}`,
      );
    }

    if (key === "language" && !allowedLanguages.includes(settings[key])) {
      return sendValidationError(
        res,
        "language",
        `Language must be one of: ${allowedLanguages.join(", ")}`,
      );
    }

    if (
      (key === "reminders" || key === "emailNotifications") &&
      typeof settings[key] !== "boolean"
    ) {
      return sendValidationError(res, key, `${key} must be a boolean value`);
    }
  }

  logger.debug("Settings validation passed");
  next();
};

/**
 * Sanitize email input
 */
const sanitizeEmail = (req, res, next) => {
  if (req.body.email) {
    req.body.email = validator.trim(req.body.email).toLowerCase();
  }
  next();
};

/**
 * Escape HTML in input fields
 */
const escapeHtml = (req, res, next) => {
  if (req.body.name) {
    req.body.name = validator.escape(req.body.name);
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateSettings,
  sanitizeEmail,
  escapeHtml,
  sendValidationError,
};
