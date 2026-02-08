/**
 * Analytics Routes
 * Defines all endpoints for analytics and statistics
 */

const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const { verifyToken, refreshTokenIfNeeded } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

// ============================================================================
// MIDDLEWARE - Apply authentication to all routes
// ============================================================================

router.use(verifyToken);
router.use(refreshTokenIfNeeded);

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/analytics/weekly/:weekStart?
 * Get weekly statistics
 *
 * URL Parameters:
 * - weekStart (optional): YYYY-MM-DD format, defaults to current week Monday
 *
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Weekly statistics retrieved",
 *   "data": {
 *     "week": "2026-02-02 to 2026-02-08",
 *     "stats": {
 *       "totalSlotsPlanned": 70,
 *       "totalSlotsCompleted": 56,
 *       "completionRate": 80,
 *       "averageProductivity": 65,
 *       "averageScore": 72,
 *       "highestScore": 95,
 *       "lowestScore": 45,
 *       "highScoreDays": 5,
 *       "dailyScores": [70, 75, 80, 72, 68, 85, 90]
 *     },
 *     "trends": { ... }
 *   }
 * }
 */
router.get("/weekly/:weekStart?", analyticsController.getWeeklyStats);

/**
 * GET /api/analytics/monthly/:year/:month
 * Get monthly overview
 *
 * URL Parameters:
 * - year: YYYY format
 * - month: MM format (01-12)
 *
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Monthly statistics retrieved",
 *   "data": {
 *     "month": "2026-02",
 *     "stats": {
 *       "totalLogs": 28,
 *       "averageScore": 70,
 *       "completionRate": 78,
 *       "productivityRate": 65,
 *       "highScoreDays": 18,
 *       "totalSlots": 200,
 *       "completedSlots": 156,
 *       "productiveSlots": 100,
 *       "averageEnergy": 6.5
 *     }
 *   }
 * }
 */
router.get("/monthly/:year/:month", analyticsController.getMonthlyStats);

/**
 * GET /api/analytics/streak
 * Get current streak information
 *
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Streak information retrieved",
 *   "data": {
 *     "streak": {
 *       "current": 7,
 *       "best": 21,
 *       "startDate": "2026-02-03",
 *       "endDate": "2026-02-09"
 *     }
 *   }
 * }
 */
router.get("/streak", analyticsController.getStreak);

/**
 * GET /api/analytics/patterns
 * Get user behavior patterns (last 90 days)
 *
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Behavior patterns retrieved",
 *   "data": {
 *     "patterns": {
 *       "bestTimeSlots": [
 *         {
 *           "timeSlot": "07:00-08:00",
 *           "averageScore": 85,
 *           "completionRate": 95,
 *           "count": 30,
 *           "mostCommonMood": "energetic"
 *         }
 *       ],
 *       "worstTimeSlots": [ ... ],
 *       "bestActivities": [
 *         {
 *           "activity": "Exercise",
 *           "count": 25,
 *           "completionRate": 88,
 *           "productivityRate": 80,
 *           "averageScore": 82
 *         }
 *       ],
 *       "moodPattern": {
 *         "Monday": "neutral",
 *         "Tuesday": "happy",
 *         ...
 *       },
 *       "energyPattern": [
 *         {
 *           "dayOfWeek": "Monday",
 *           "averageEnergy": 6
 *         }
 *       ],
 *       "productivityByCategory": {
 *         "work": { "count": 50, "productive": 42 },
 *         "exercise": { "count": 30, "productive": 28 }
 *       },
 *       "frequentDistractions": [
 *         { "distraction": "Phone", "count": 45 },
 *         { "distraction": "Social Media", "count": 38 }
 *       ]
 *     }
 *   }
 * }
 */
router.get("/patterns", analyticsController.getBehaviorPatterns);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 handler for analytics routes
 */
router.all("*", (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Analytics endpoint not found",
    code: "NOT_FOUND",
  });
});

module.exports = router;
