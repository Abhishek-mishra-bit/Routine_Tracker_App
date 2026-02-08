/**
 * Daily Logs Routes
 * Defines all endpoints for daily log management
 */

const express = require("express");
const logsController = require("../controllers/logsController");
const { verifyToken, refreshTokenIfNeeded } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

// ============================================================================
// MIDDLEWARE - Apply authentication to all routes
// ============================================================================

router.use(verifyToken);
router.use(refreshTokenIfNeeded);

// ============================================================================
// DAILY LOG CRUD OPERATIONS
// ============================================================================

/**
 * GET /api/logs/:date?
 * Get daily log for specific date (default: today)
 *
 * Query Parameters:
 * - date (optional): YYYY-MM-DD format
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Daily log retrieved",
 *   "data": {
 *     "log": { ... }
 *   }
 * }
 */
router.get("/:date?", logsController.getDailyLog);

/**
 * POST /api/logs
 * Create new daily log
 *
 * Request body:
 * {
 *   "date": "2026-02-09",
 *   "slots": [ ... ] (optional)
 * }
 *
 * Response: 201
 * {
 *   "success": true,
 *   "message": "Daily log created successfully",
 *   "data": {
 *     "log": { ... }
 *   }
 * }
 */
router.post("/", logsController.createDailyLog);

/**
 * PUT /api/logs/:date
 * Update entire daily log
 *
 * URL Parameters:
 * - date: YYYY-MM-DD format
 *
 * Request body:
 * {
 *   "slots": [ ... ],
 *   "dayRating": 4,
 *   "tags": ["productive"],
 *   "aiInsights": "...",
 *   "isSpecialDay": false
 * }
 *
 * Response: 200
 */
router.put("/:date", logsController.updateDailyLog);

/**
 * DELETE /api/logs/:date
 * Delete daily log
 *
 * URL Parameters:
 * - date: YYYY-MM-DD format
 *
 * Response: 200
 */
router.delete("/:date", logsController.deleteDailyLog);

/**
 * GET /api/logs/range/:start/:end
 * Get logs for date range
 *
 * URL Parameters:
 * - start: YYYY-MM-DD format
 * - end: YYYY-MM-DD format
 *
 * Query Parameters:
 * - page (optional): Page number, default 1
 * - limit (optional): Results per page, default 30 (max 100)
 *
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Logs retrieved for date range",
 *   "data": {
 *     "logs": [ ... ],
 *     "pagination": {
 *       "page": 1,
 *       "limit": 30,
 *       "total": 60,
 *       "pages": 2
 *     }
 *   }
 * }
 */
router.get("/range/:start/:end", logsController.getLogsByDateRange);

// ============================================================================
// SLOT OPERATIONS
// ============================================================================

/**
 * PATCH /api/logs/:date/slot/:slotId
 * Update specific time slot
 *
 * URL Parameters:
 * - date: YYYY-MM-DD format
 * - slotId: MongoDB ObjectId
 *
 * Request body: Any updatable slot field
 * {
 *   "plannedActivity": "New activity",
 *   "energyLevel": 7,
 *   "notes": "Updated notes"
 * }
 *
 * Response: 200
 */
router.patch("/:date/slot/:slotId", logsController.updateSlot);

/**
 * PATCH /api/logs/:date/complete/:slotId
 * Mark slot as completed
 *
 * URL Parameters:
 * - date: YYYY-MM-DD format
 * - slotId: MongoDB ObjectId
 *
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Slot marked as completed",
 *   "data": {
 *     "slot": { ... },
 *     "summary": { ... }
 *   }
 * }
 */
router.patch("/:date/complete/:slotId", logsController.completeSlot);

/**
 * PATCH /api/logs/:date/productive/:slotId
 * Mark slot as productive
 *
 * URL Parameters:
 * - date: YYYY-MM-DD format
 * - slotId: MongoDB ObjectId
 *
 * Request body:
 * {
 *   "productive": true
 * }
 *
 * Response: 200
 */
router.patch("/:date/productive/:slotId", logsController.markProductive);

/**
 * PATCH /api/logs/:date/mood/:slotId
 * Update mood for slot
 *
 * URL Parameters:
 * - date: YYYY-MM-DD format
 * - slotId: MongoDB ObjectId
 *
 * Request body:
 * {
 *   "mood": "happy" | "neutral" | "sad" | "angry" | "energetic" | "tired"
 * }
 *
 * Response: 200
 */
router.patch("/:date/mood/:slotId", logsController.updateMood);

/**
 * PATCH /api/logs/:date/notes/:slotId
 * Update notes for slot
 *
 * URL Parameters:
 * - date: YYYY-MM-DD format
 * - slotId: MongoDB ObjectId
 *
 * Request body:
 * {
 *   "notes": "Updated notes about the slot"
 * }
 *
 * Response: 200
 */
router.patch("/:date/notes/:slotId", logsController.updateNotes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 handler for logs routes
 */
router.all("*", (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Logs endpoint not found",
    code: "NOT_FOUND",
  });
});

module.exports = router;
