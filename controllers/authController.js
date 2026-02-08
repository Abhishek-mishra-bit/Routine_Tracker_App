/**
 * Authentication Controller
 * Handles all authentication business logic
 */

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate JWT token
 * @param {String} userId - User ID
 * @param {String} email - User email
 * @param {String} role - User role
 * @returns {String} - JWT token
 */
const generateToken = (userId, email, role = "user") => {
  return jwt.sign(
    {
      userId,
      email,
      role,
    },
    process.env.JWT_SECRET || "default-secret",
    { expiresIn: "7d" },
  );
};

/**
 * Format user response (exclude sensitive data)
 * @param {Object} user - User document
 * @returns {Object} - Formatted user object
 */
const formatUserResponse = (user) => {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    settings: user.settings,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    profileImage: user.profileImage,
    role: user.role,
    createdAt: user.createdAt,
  };
};

// ============================================================================
// AUTHENTICATION CONTROLLERS
// ============================================================================

/**
 * POST /api/auth/register
 * Register a new user
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    logger.info(`Registration attempt for email: ${email}`);

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      logger.warn(`Registration failed: Email already in use - ${email}`);
      return res.status(409).json({
        success: false,
        message: "Email already registered",
        code: "EMAIL_ALREADY_EXISTS",
      });
    }

    // Create new user
    const newUser = new User({
      email,
      password,
      name,
      settings: {
        morningTime: "07:00",
        eveningTime: "22:30",
        reminders: true,
        timezone: "UTC",
        theme: "light",
        language: "en",
        emailNotifications: true,
      },
    });

    // Save user (password will be hashed by pre-save middleware)
    await newUser.save();

    logger.info(`User registered successfully: ${email}`);

    // Generate JWT token
    const token = generateToken(newUser._id, newUser.email, newUser.role);

    // Return response
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: formatUserResponse(newUser),
      },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: "Validation error",
        code: "VALIDATION_ERROR",
        details: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      code: "REGISTRATION_ERROR",
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and generate token
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info(`Login attempt for email: ${email}`);

    // Find user by email with password field
    const user = await User.findByEmailWithPassword(email);

    if (!user) {
      logger.warn(`Login failed: User not found - ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      logger.warn(`Login failed: Account inactive - ${email}`);
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated",
        code: "ACCOUNT_INACTIVE",
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password - ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`Login successful: ${email}`);

    // Generate JWT token
    const token = generateToken(user._id, user.email, user.role);

    // Return response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      code: "LOGIN_ERROR",
    });
  }
};

/**
 * GET /api/auth/me
 * Get current user profile (protected route)
 *
 * @param {Object} req - Express request object (with user attached by middleware)
 * @param {Object} res - Express response object
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // User ID from token
    const userId = req.user.userId;

    logger.debug(`Fetching user profile: ${userId}`);

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    logger.debug(`User profile retrieved: ${userId}`);

    return res.status(200).json({
      success: true,
      message: "User profile retrieved",
      data: {
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    logger.error(`Get current user error: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile",
      code: "PROFILE_RETRIEVAL_ERROR",
    });
  }
};

/**
 * PUT /api/auth/update
 * Update user settings (protected route)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { settings } = req.body;

    logger.info(`Updating settings for user: ${userId}`);

    // Find and update user
    const user = await User.findById(userId);

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Update only allowed fields
    const allowedFields = [
      "morningTime",
      "eveningTime",
      "reminders",
      "timezone",
      "theme",
      "language",
      "emailNotifications",
    ];

    for (const key in settings) {
      if (allowedFields.includes(key)) {
        user.settings[key] = settings[key];
      }
    }

    // Save updated user
    await user.save();

    logger.info(`Settings updated for user: ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: {
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    logger.error(`Update settings error: ${error.message}`);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: "Validation error",
        code: "VALIDATION_ERROR",
        details: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update settings",
      code: "UPDATE_ERROR",
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 * This is mainly for logging purposes
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.userId || "unknown";
    logger.info(`User logged out: ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
      code: "LOGOUT_SUCCESS",
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
      code: "LOGOUT_ERROR",
    });
  }
};

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.refreshToken = async (req, res) => {
  try {
    const userId = req.user.userId;
    const email = req.user.email;
    const role = req.user.role || "user";

    logger.debug(`Refreshing token for user: ${userId}`);

    // Generate new token
    const newToken = generateToken(userId, email, role);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Failed to refresh token",
      code: "TOKEN_REFRESH_ERROR",
    });
  }
};

/**
 * PUT /api/auth/change-password
 * Change user password (protected route)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
        code: "MISSING_FIELDS",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
        code: "PASSWORD_MISMATCH",
      });
    }

    logger.info(`Password change attempt for user: ${userId}`);

    // Find user with password
    const user = await User.findById(userId).select("+password");

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      logger.warn(
        `Password change failed: Invalid current password - ${userId}`,
      );
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
        code: "INVALID_CURRENT_PASSWORD",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed successfully for user: ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: "Validation error",
        code: "VALIDATION_ERROR",
        details: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      code: "PASSWORD_CHANGE_ERROR",
    });
  }
};

/**
 * GET /api/auth/verify
 * Verify if token is valid
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyTokenEndpoint = (req, res) => {
  try {
    logger.debug(`Token verified for user: ${req.user.userId}`);

    return res.status(200).json({
      success: true,
      message: "Token is valid",
      data: {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    logger.error(`Token verification endpoint error: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Token verification failed",
      code: "VERIFICATION_ERROR",
    });
  }
};
