/**
 * Production-Ready Node.js/Express Server
 *
 * This server is configured with:
 * - Environment variable management
 * - MongoDB connection with retry logic
 * - Security headers and CORS
 * - Rate limiting
 * - Request/response logging
 * - Comprehensive error handling
 * - Graceful shutdown
 */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");
const logger = require("./utils/logger");

// Load environment variables from .env file
dotenv.config();

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/routine";
const NODE_ENV = process.env.NODE_ENV || "development";
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "900000",
  10,
);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "100", 10);

// Validate critical environment variables
if (!process.env.JWT_SECRET && NODE_ENV === "production") {
  logger.error("FATAL: JWT_SECRET not defined in environment variables");
  process.exit(1);
}

// ============================================================================
// INITIALIZE EXPRESS APP
// ============================================================================

const app = express();

// ============================================================================
// DATABASE CONNECTION WITH RETRY LOGIC
// ============================================================================

/**
 * Establishes MongoDB connection with automatic retry logic
 * Implements exponential backoff for failed attempts
 */
const connectDatabase = async () => {
  const maxRetries = 5;
  const baseDelay = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(
        `Attempting MongoDB connection (Attempt ${attempt}/${maxRetries})...`,
      );

      await mongoose.connect(MONGODB_URI, {
        // Connection options
        retryWrites: true,
        w: "majority",
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info("✓ MongoDB connected successfully");
      return;
    } catch (error) {
      logger.error(`✗ Connection attempt ${attempt} failed: ${error.message}`);

      if (attempt === maxRetries) {
        logger.error("FATAL: Failed to connect to MongoDB after all retries");
        process.exit(1);
      }

      // Exponential backoff: wait before next retry
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.info(`Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Handles Mongoose connection events
 */
mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (error) => {
  logger.error(`Mongoose connection error: ${error.message}`);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose disconnected from MongoDB");
});

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet helps secure Express apps by setting various HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// CORS configuration for frontend connection
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS, // 15 minutes default
  max: RATE_LIMIT_MAX, // 100 requests per windowMs default
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
});

// Apply rate limiting to all requests
app.use(limiter);

// ============================================================================
// COMPRESSION MIDDLEWARE
// ============================================================================

// Compress response bodies for all requests
app.use(
  compression({
    level: 6, // Balance between compression and CPU usage
    threshold: 1024, // Only compress responses larger than 1KB
  }),
);

// ============================================================================
// BODY PARSING MIDDLEWARE
// ============================================================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ============================================================================
// CUSTOM MIDDLEWARE
// ============================================================================

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, and timestamp
 */
app.use((req, res, next) => {
  const startTime = Date.now();

  // Capture the original res.send function
  const originalSend = res.send;

  // Override res.send to log response details
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    logger.info(
      `${req.method} ${req.path} - Status: ${statusCode} - Duration: ${duration}ms`,
    );

    // Call the original send function
    return originalSend.call(this, data);
  };

  next();
});

/**
 * Request ID middleware
 * Adds a unique ID to each request for tracking and debugging
 */
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  res.setHeader("X-Request-ID", req.id);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health check endpoint
 * Use this to verify server is running (used for load balancers, monitoring)
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

/**
 * API status endpoint
 */
app.get("/api/status", (req, res) => {
  res.status(200).json({
    message: "API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Routes will be imported and mounted here
 * Example:
 * app.use('/api/users', require('./routes/users'));
 * app.use('/api/auth', require('./routes/auth'));
 */

// ============================================================================
// 404 NOT FOUND MIDDLEWARE
// ============================================================================

app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Centralized error handling middleware
 * Catches and formats all errors in a consistent way
 */
app.use((error, req, res, next) => {
  // Log the error
  logger.error(`Error: ${error.message}`, {
    requestId: req.id,
    method: req.method,
    path: req.path,
    statusCode: error.statusCode || 500,
    stack: error.stack,
  });

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || "Internal Server Error";

  // Environment-specific error details
  const response = {
    success: false,
    message,
    requestId: req.id,
  };

  // Include stack trace in development only
  if (NODE_ENV === "development") {
    response.error = {
      stack: error.stack,
      details: error,
    };
  }

  res.status(statusCode).json(response);
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Handles graceful shutdown of the server
 * Closes database connections and exits process cleanly
 */
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  // Close Express server
  server.close(async () => {
    logger.info("Express server closed");

    // Close MongoDB connection
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
    } catch (error) {
      logger.error(`Error closing MongoDB connection: ${error.message}`);
    }

    logger.info("Graceful shutdown completed");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown timeout exceeded");
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, {
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at ${promise}: ${reason}`);
});

// ============================================================================
// START SERVER
// ============================================================================

/**
 * Starts the Express server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Create HTTP server
    const server = app.listen(PORT, () => {
      logger.info(
        `
╔════════════════════════════════════════╗
║  Production Server Started             ║
╚════════════════════════════════════════╝
Environment: ${NODE_ENV}
Port: ${PORT}
Database: ${MONGODB_URI.split("@")[1] || "Local MongoDB"}
Rate Limit: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW_MS / 1000 / 60} minutes
Timestamp: ${new Date().toISOString()}
      `.trim(),
      );
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        logger.error(
          `Port ${PORT} is already in use. Please use a different port.`,
        );
      } else {
        logger.error(`Server error: ${error.message}`);
      }
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Export the app for testing purposes
module.exports = app;

// Start the server if this file is run directly
if (require.main === module) {
  startServer()
    .then((server) => {
      // Server is now running
    })
    .catch((error) => {
      logger.error(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}
