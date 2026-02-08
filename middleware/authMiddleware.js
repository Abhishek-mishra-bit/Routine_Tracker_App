/**
 * Authentication Middleware
 * Handles JWT token verification and user extraction
 */

const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

/**
 * Verify JWT token and attach user to request
 * Expects token in Authorization header as: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn("Missing authorization header");
      return res.status(401).json({
        success: false,
        message: "No authorization token provided",
        code: "NO_TOKEN",
      });
    }

    // Extract token from "Bearer <token>" format
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      logger.warn("Invalid authorization header format");
      return res.status(401).json({
        success: false,
        message: "Invalid token format. Use: Bearer <token>",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default-secret",
    );

    // Attach user info to request
    req.user = decoded;
    req.token = token;

    logger.debug(`Token verified for user: ${decoded.userId}`);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      logger.warn("Token expired");
      return res.status(401).json({
        success: false,
        message: "Token has expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      logger.warn("Invalid token");
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    logger.error(`Token verification error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Token verification failed",
      code: "TOKEN_VERIFICATION_ERROR",
    });
  }
};

/**
 * Optional token verification
 * Continues even if token is invalid/missing, but attaches user if valid
 */
const verifyTokenOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return next();
    }

    const token = parts[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default-secret",
    );

    req.user = decoded;
    req.token = token;

    logger.debug(`Optional token verified for user: ${decoded.userId}`);
  } catch (error) {
    // Log but continue - token is optional
    logger.debug(`Optional token verification skipped: ${error.message}`);
  }

  next();
};

/**
 * Check if user has required role
 * @param {String|Array} roles - Required role(s)
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
        code: "NOT_AUTHENTICATED",
      });
    }

    const userRole = req.user.role || "user";
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    if (!requiredRoles.includes(userRole)) {
      logger.warn(`User ${req.user.userId} attempted unauthorized access`);
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    next();
  };
};

/**
 * Refresh token middleware
 * Generates a new token if current one is about to expire (within 1 day)
 */
const refreshTokenIfNeeded = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  // Check if token expires within 1 day
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = req.user.exp - now;
  const oneDayInSeconds = 24 * 60 * 60;

  if (expiresIn < oneDayInSeconds) {
    // Generate new token
    const newToken = jwt.sign(
      {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
      process.env.JWT_SECRET || "default-secret",
      { expiresIn: "7d" },
    );

    // Attach new token to response headers
    res.set("X-New-Token", newToken);
    logger.debug(`New token generated for user: ${req.user.userId}`);
  }

  next();
};

module.exports = {
  verifyToken,
  verifyTokenOptional,
  authorize,
  refreshTokenIfNeeded,
};
