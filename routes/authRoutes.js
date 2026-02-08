/**
 * Authentication Routes
 * Defines all authentication endpoints
 */

const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const {
  verifyToken,
  refreshTokenIfNeeded,
} = require("../middleware/authMiddleware");
const {
  validateRegister,
  validateLogin,
  validateUpdateSettings,
} = require("../middleware/validationMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

// ============================================================================
// RATE LIMITERS FOR AUTH ROUTES
// ============================================================================

/**
 * Rate limiter for registration (3 requests per 15 minutes per IP)
 * Prevents brute force registration attempts
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: "Too many registration attempts, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for registration from IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many registration attempts",
      code: "RATE_LIMIT_EXCEEDED",
    });
  },
  skip: (req) => {
    // Skip rate limiting in development environment
    return process.env.NODE_ENV === "development";
  },
});

/**
 * Rate limiter for login (10 requests per 15 minutes per IP)
 * Prevents brute force login attacks
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: "Too many login attempts, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for login from IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many login attempts",
      code: "RATE_LIMIT_EXCEEDED",
    });
  },
  skip: (req) => {
    return process.env.NODE_ENV === "development";
  },
});

/**
 * Rate limiter for password change (5 requests per hour per user)
 */
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many password change attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID as key instead of IP for authenticated routes
    return req.user?.userId || req.ip;
  },
  skip: (req) => {
    return process.env.NODE_ENV === "development";
  },
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * POST /api/auth/register
 * Register a new user
 * Public route
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "name": "John Doe"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIs...",
 *     "user": { ... }
 *   }
 * }
 */
router.post(
  "/register",
  registerLimiter,
  validateRegister,
  authController.register,
);

/**
 * POST /api/auth/login
 * Authenticate user and get token
 * Public route
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIs...",
 *     "user": { ... }
 *   }
 * }
 */
router.post("/login", loginLimiter, validateLogin, authController.login);

// ============================================================================
// PROTECTED ROUTES
// ============================================================================

/**
 * GET /api/auth/me
 * Get current user profile
 * Protected route - requires valid JWT token
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "User profile retrieved",
 *   "data": {
 *     "user": { ... }
 *   }
 * }
 */
router.get(
  "/me",
  verifyToken,
  refreshTokenIfNeeded,
  authController.getCurrentUser,
);

/**
 * GET /api/auth/verify
 * Verify if token is valid
 * Protected route
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Token is valid",
 *   "data": {
 *     "userId": "...",
 *     "email": "...",
 *     "role": "..."
 *   }
 * }
 */
router.get(
  "/verify",
  verifyToken,
  refreshTokenIfNeeded,
  authController.verifyTokenEndpoint,
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 * Protected route
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Token refreshed successfully",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIs..."
 *   }
 * }
 */
router.post("/refresh", verifyToken, authController.refreshToken);

/**
 * PUT /api/auth/update
 * Update user settings
 * Protected route
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Request body:
 * {
 *   "settings": {
 *     "morningTime": "06:00",
 *     "timezone": "EST",
 *     "theme": "dark"
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Settings updated successfully",
 *   "data": {
 *     "user": { ... }
 *   }
 * }
 */
router.put(
  "/update",
  verifyToken,
  validateUpdateSettings,
  refreshTokenIfNeeded,
  authController.updateUserSettings,
);

/**
 * PUT /api/auth/change-password
 * Change user password
 * Protected route
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Request body:
 * {
 *   "currentPassword": "OldPass123!",
 *   "newPassword": "NewPass456!",
 *   "confirmPassword": "NewPass456!"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Password changed successfully"
 * }
 */
router.put(
  "/change-password",
  verifyToken,
  passwordChangeLimiter,
  authController.changePassword,
);

/**
 * POST /api/auth/logout
 * Logout user
 * Protected route (optional - mainly for logging)
 *
 * Headers:
 * Authorization: Bearer <token> (optional)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Logout successful"
 * }
 */
router.post("/logout", (req, res, next) => {
  // Optional token verification - continue even if not provided
  verifyToken(req, res, (err) => {
    if (err) {
      // If token verification fails, still allow logout
      return authController.logout(req, res);
    }
    // If token is valid, proceed with logout
    authController.logout(req, res);
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 handler for auth routes
 */
router.all("*", (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Authentication endpoint not found",
    code: "NOT_FOUND",
  });
});

module.exports = router;
