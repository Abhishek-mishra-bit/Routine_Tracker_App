/**
 * Insights Routes
 * 
 * AI-powered productivity insights and recommendations
 * All routes protected - require authentication
 */

const express = require('express');
const router = express.Router();
const { verifyToken, refreshTokenIfNeeded } = require('../middleware/authMiddleware');
const insightsController = require('../controllers/insightsController');

/**
 * Apply authentication middleware to all routes
 */
router.use(verifyToken);
router.use(refreshTokenIfNeeded);

/**
 * GET /insights/status
 * Get AI service status and capabilities
 */
router.get('/status', insightsController.getServiceStatus);

/**
 * GET /insights/daily/:date?
 * Get daily insights for specific date (default: today)
 * 
 * Query Parameters:
 * - date: Optional date in YYYY-MM-DD format
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "date": "2026-02-09",
 *     "insights": {
 *       "completionRate": 85,
 *       "summary": "Outstanding day! You completed most tasks...",
 *       "highlights": ["Great completion rate", "Strong productivity"],
 *       "improvements": ["Reduce mid-day distractions"],
 *       "motivationScore": 88
 *     }
 *   }
 * }
 */
router.get('/daily/:date?', insightsController.getDailyInsights);

/**
 * GET /insights/weekly/:weekStart?
 * Get weekly insights for specific week (default: current week)
 * 
 * Query Parameters:
 * - weekStart: Optional start date in YYYY-MM-DD format (must be Monday)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "weekStart": "2026-02-02",
 *     "insights": {
 *       "scores": { "average": 75, "trend": "improving" },
 *       "bestDay": "Friday",
 *       "worstDay": "Monday",
 *       "consistency": 85
 *     }
 *   }
 * }
 */
router.get('/weekly/:weekStart?', insightsController.getWeeklyInsights);

/**
 * GET /insights/recommendations
 * Get personalized recommendations based on patterns
 * 
 * Requires: At least some logged activity
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "count": 5,
 *     "recommendations": [
 *       {
 *         "title": "Schedule Your Most Important Tasks",
 *         "description": "You're most productive between 9:00-12:00...",
 *         "priority": "high",
 *         "category": "timing",
 *         "action": "Reorganize your daily schedule"
 *       }
 *     ]
 *   }
 * }
 */
router.get('/recommendations', insightsController.getRecommendations);

/**
 * GET /insights/schedule
 * Predict optimal daily schedule based on historical performance
 * 
 * Requires: At least 7 days of logged activities
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "schedule": [
 *       {
 *         "time": "7:00",
 *         "recommendation": "Challenges/Important tasks - High focus time",
 *         "expectedProductivity": 85,
 *         "expectedEnergy": 9
 *       }
 *     ],
 *     "confidence": 78
 *   }
 * }
 */
router.get('/schedule', insightsController.getPredictedSchedule);

/**
 * GET /insights/cache
 * Get cache status and insight generation history
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "backend": "LOCAL",
 *     "cacheSize": 5,
 *     "cacheTTL": 60,
 *     "enabled": true
 *   }
 * }
 */
router.get('/cache', insightsController.getCacheStatus);

/**
 * DELETE /insights/cache
 * Clear insights cache (all or specific key)
 * 
 * Query Parameters:
 * - key: Optional cache key to clear specific entry
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Cache cleared"
 * }
 */
router.delete('/cache', insightsController.clearCache);

/**
 * GET /insights/comprehensive
 * Get all insights at once (daily + weekly + recommendations)
 * Best for dashboard/home screen
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "insights": {
 *       "daily": { ... },
 *       "weekly": { ... },
 *       "recommendations": [ ... ]
 *     }
 *   }
 * }
 */
router.get('/comprehensive', insightsController.getComprehensiveInsights);

/**
 * POST /insights/preferences
 * Set user preferences for insights generation
 * 
 * Body:
 * {
 *   "insightPreferences": {
 *     "enableDailyInsights": true,
 *     "enableWeeklyInsights": true,
 *     "enableRecommendations": true,
 *     "enableSchedulePrediction": true,
 *     "insightFrequency": "daily",
 *     "preferredInsightTime": "09:00",
 *     "maxRecommendations": 5
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "preferences": { ... }
 *   }
 * }
 */
router.post('/preferences', insightsController.setInsightPreferences);

module.exports = router;
