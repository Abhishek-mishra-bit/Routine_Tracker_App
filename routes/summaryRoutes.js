/**
 * Summary Routes
 * Defines all endpoints for daily, weekly, and monthly summaries
 */

const express = require("express");
const summaryController = require("../controllers/summaryController");
const { verifyToken, refreshTokenIfNeeded } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

// ============================================================================
// MIDDLEWARE - Apply authentication to all routes
// ============================================================================

router.use(verifyToken);
router.use(refreshTokenIfNeeded);

// ============================================================================
// SUMMARY ENDPOINTS
// ============================================================================

/**
 * GET /api/summary/today
 * Get today's summary
 *
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Today's summary retrieved",
 *   "data": {
 *     "summary": {
 *       "period": "daily",
 *       "date": "2026-02-09",
 *       "score": 78,
 *       "completionRate": 85,
 *       "productivityRate": 72,
 *       "totalSlots": 15,
 *       "completedSlots": 13,
 *       "productiveSlots": 9,
 *       "mood": "happy",
 *       "energy": 7,
 *       "dayRating": 4,
 *       "aiInsights": "Great day! You completed 85% of your tasks...",
 *       "categoryBreakdown": {
 *         "work": 8,
 *         "exercise": 3,
 *         "study": 2,
 *         "leisure": 2
 *       },
 *       "successfulDay": true
 *     },
 *     "slots": [ ... ]
 *   }
 * }
 */
router.get("/today", summaryController.getTodaySummary);

/**
 * GET /api/summary/week
 * Get this week's summary
 *
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Week summary retrieved",
 *   "data": {
 *     "period": "2026-02-02 to 2026-02-08",
 *     "summary": {
 *       "totalScore": 504,
 *       "averageScore": 72,
 *       "completionRate": 80,
 *       "productivityRate": 68,
 *       "averageEnergy": 6.5,
 *       "highScoreDays": 5,
 *       "daysLogged": 7
 *     },
 *     "dailyBreakdown": [
 *       {
 *         "date": "2026-02-02",
 *         "score": 70,
 *         "completion": 80,
 *         "productivity": 65,
 *         "mood": "neutral",
 *         "energy": 6
 *       },
 *       ...
 *     ]
 *   }
 * }
 */
router.get("/week", summaryController.getWeekSummary);

/**
 * GET /api/summary/month
 * Get this month's summary
 *
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Month summary retrieved",
 *   "data": {
 *     "period": "February 2026",
 *     "summary": {
 *       "totalScore": 2016,
 *       "averageScore": 72,
 *       "completionRate": 78,
 *       "productivityRate": 65,
 *       "averageEnergy": 6.4,
 *       "highScoreDays": 18,
 *       "daysLogged": 28
 *     },
 *     "weeklyBreakdown": [
 *       {
 *         "week": "Week 1",
 *         "averageScore": 70,
 *         "completionRate": 75,
 *         "productivityRate": 62,
 *         "averageEnergy": 6,
 *         "highScoreDays": 4,
 *         "daysLogged": 7
 *       },
 *       ...
 *     ]
 *   }
 * }
 */
router.get("/month", summaryController.getMonthSummary);

/**
 * GET /api/summary/comparison
 * Compare performance with previous period
 *
 * Query Parameters:
 * - period: "week" or "month" (default: "week")
 *
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Performance comparison retrieved",
 *   "data": {
 *     "comparison": {
 *       "period": "week",
 *       "current": {
 *         "averageScore": 75,
 *         "completionRate": 82,
 *         "productivityRate": 70,
 *         "averageEnergy": 7
 *       },
 *       "previous": {
 *         "averageScore": 68,
 *         "completionRate": 75,
 *         "productivityRate": 60,
 *         "averageEnergy": 6
 *       },
 *       "difference": {
 *         "score": 7,
 *         "completion": 7,
 *         "productivity": 10,
 *         "energy": 1
 *       },
 *       "percentageChange": {
 *         "score": 10,
 *         "completion": 9
 *       }
 *     }
 *   }
 * }
 */
router.get("/comparison", summaryController.getComparison);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 handler for summary routes
 */
router.all("*", (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Summary endpoint not found",
    code: "NOT_FOUND",
  });
});

module.exports = router;
