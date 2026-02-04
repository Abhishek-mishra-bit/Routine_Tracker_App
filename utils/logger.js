/**
 * Winston Logger Configuration
 * Provides structured logging for the application
 */

const winston = require("winston");
const path = require("path");

// Define log levels with colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define log colors
const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  debug: "blue",
};

// Add custom colors to Winston
winston.addColors(logColors);

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels,
  format: winston.format.combine(
    // Add timestamp
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    // Add request ID if available
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length
        ? "\n" + JSON.stringify(meta, null, 2)
        : "";
      return `[${timestamp}] ${level}: ${message}${metaString}`;
    }),
  ),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaString = Object.keys(meta).length
            ? "\n" + JSON.stringify(meta, null, 2)
            : "";
          return `[${timestamp}] ${level}: ${message}${metaString}`;
        }),
      ),
    }),
    // Error file transport
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
      level: "error",
      format: winston.format.json(),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Combined file transport
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/combined.log"),
      format: winston.format.json(),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

module.exports = logger;
