/**
 * Insights Controller
 * 
 * Generates and manages AI-powered productivity insights
 * Supports daily, weekly, recommendations, and schedule predictions
 * 
 * Endpoints:
 * - GET /insights/daily/:date? - Daily analysis
 * - GET /insights/weekly/:weekStart? - Weekly patterns
 * - GET /insights/recommendations - Personalized suggestions
 * - GET /insights/schedule - Optimal schedule prediction
 * - POST /insights/preferences - User insight preferences
 * - GET /insights/cache - Check cache status
 * - DELETE /insights/cache - Clear cache
 */

const logger = require('../utils/logger');
const aiService = require('../utils/aiService');
const DailyLog = require('../models/DailyLog');
const Analytics = require('../models/Analytics');
const User = require('../models/User');

/**
 * Format date string (YYYY-MM-DD)
 */
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Get daily insights
 * GET /insights/daily/:date?
 */
exports.getDailyInsights = async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = date ? formatDate(date) : formatDate(new Date());

    // Get daily log
    const dailyLog = await DailyLog.findOne({
      userId: req.user._id,
      date: new Date(targetDate)
    });

    if (!dailyLog) {
      return res.status(404).json({
        success: false,
        message: 'No log found for this date',
        code: 'LOG_NOT_FOUND'
      });
    }

    // Generate insights
    const insights = await aiService.generateDailyInsights(
      dailyLog,
      req.user.settings || {}
    );

    logger.info(`Daily insights generated for user ${req.user._id} on ${targetDate}`);

    res.json({
      success: true,
      message: 'Daily insights generated',
      data: {
        date: targetDate,
        insights,
        backend: aiService.backend
      }
    });
  } catch (error) {
    logger.error(`Error getting daily insights: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily insights',
      code: 'INSIGHTS_GENERATION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get weekly insights
 * GET /insights/weekly/:weekStart?
 */
exports.getWeeklyInsights = async (req, res) => {
  try {
    let { weekStart } = req.params;

    // Default to current week Monday
    if (!weekStart) {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      weekStart = formatDate(new Date(today.setDate(diff)));
    } else {
      weekStart = formatDate(weekStart);
    }

    // Get week's logs
    const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekLogs = await DailyLog.find({
      userId: req.user._id,
      date: {
        $gte: new Date(weekStart),
        $lt: weekEnd
      }
    }).sort({ date: 1 });

    if (weekLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No logs found for this week',
        code: 'NO_LOGS_FOUND'
      });
    }

    // Generate insights
    const insights = await aiService.generateWeeklyInsights(
      weekLogs,
      req.user.settings || {}
    );

    logger.info(`Weekly insights generated for user ${req.user._id} starting ${weekStart}`);

    res.json({
      success: true,
      message: 'Weekly insights generated',
      data: {
        weekStart,
        weekEnd: formatDate(new Date(weekEnd.getTime() - 1)),
        logsCount: weekLogs.length,
        insights,
        backend: aiService.backend
      }
    });
  } catch (error) {
    logger.error(`Error getting weekly insights: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate weekly insights',
      code: 'INSIGHTS_GENERATION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get personalized recommendations
 * GET /insights/recommendations
 */
exports.getRecommendations = async (req, res) => {
  try {
    // Get user's analytics
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    const userAnalytics = await Analytics.findOne({
      userId: req.user._id
    });

    if (!userAnalytics) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient analytics data. Need more logged activity.',
        code: 'INSUFFICIENT_DATA',
        suggestion: 'Continue logging your daily activities for better recommendations'
      });
    }

    // Compile user patterns
    const userPatterns = {
      bestTimeSlots: userAnalytics.weeklyStats?.bestTimeSlots || [],
      worstTimeSlots: userAnalytics.weeklyStats?.worstTimeSlots || [],
      frequentDistractions: userAnalytics.weeklyStats?.frequentDistractions || [],
      categoryStats: userAnalytics.weeklyStats?.categoryStats || {},
      moodPattern: userAnalytics.weeklyStats?.moodPattern || {},
      energyPattern: userAnalytics.weeklyStats?.energyPattern || {},
      consistency: userAnalytics.weeklyStats?.consistency || 0,
      weeklyStats: userAnalytics.weeklyStats
    };

    // Generate recommendations
    const recommendations = await aiService.generateRecommendations(
      userPatterns,
      req.user
    );

    logger.info(`Recommendations generated for user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Personalized recommendations generated',
      data: {
        count: recommendations.length,
        recommendations,
        basedOnData: userAnalytics.weeklyStats ? 'Yes' : 'No',
        backend: aiService.backend
      }
    });
  } catch (error) {
    logger.error(`Error getting recommendations: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      code: 'RECOMMENDATIONS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Predict optimal schedule
 * GET /insights/schedule
 */
exports.getPredictedSchedule = async (req, res) => {
  try {
    // Get last 30 days of logs
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalLogs = await DailyLog.find({
      userId: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });

    if (historicalLogs.length < 7) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient historical data',
        code: 'INSUFFICIENT_DATA',
        daysAvailable: historicalLogs.length,
        daysRequired: 7,
        suggestion: 'Log your activities for at least 7 days to get schedule predictions'
      });
    }

    // Predict schedule
    const schedule = await aiService.predictOptimalSchedule(
      historicalLogs,
      req.user
    );

    logger.info(`Schedule predicted for user ${req.user._id} based on ${historicalLogs.length} days`);

    res.json({
      success: true,
      message: 'Optimal schedule predicted',
      data: {
        schedule,
        daysAnalyzed: historicalLogs.length,
        backend: aiService.backend
      }
    });
  } catch (error) {
    logger.error(`Error predicting schedule: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to predict schedule',
      code: 'SCHEDULE_PREDICTION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Set insight preferences
 * POST /insights/preferences
 */
exports.setInsightPreferences = async (req, res) => {
  try {
    const { insightPreferences } = req.body;

    // Validate preferences
    if (!insightPreferences || typeof insightPreferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferences format',
        code: 'INVALID_REQUEST'
      });
    }

    const allowedPreferences = [
      'enableDailyInsights',
      'enableWeeklyInsights',
      'enableRecommendations',
      'enableSchedulePrediction',
      'insightFrequency',
      'preferredInsightTime',
      'maxRecommendations'
    ];

    // Validate fields
    Object.keys(insightPreferences).forEach(key => {
      if (!allowedPreferences.includes(key)) {
        delete insightPreferences[key];
      }
    });

    // Update user settings
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'settings.insightPreferences': insightPreferences },
      { new: true, runValidators: true }
    );

    logger.info(`Insight preferences updated for user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Insight preferences updated',
      data: {
        preferences: user.settings.insightPreferences || {}
      }
    });
  } catch (error) {
    logger.error(`Error updating preferences: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      code: 'UPDATE_PREFERENCES_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get insight generation history/cache status
 * GET /insights/cache
 */
exports.getCacheStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const cacheInfo = {
      backend: aiService.backend,
      cacheSize: aiService.cache.size,
      cacheTTL: aiService.cacheTTL / 1000 / 60, // in minutes
      enabled: true,
      lastInsightGenerated: user.settings?.lastInsightDate || null,
      insightPreferences: user.settings?.insightPreferences || {}
    };

    res.json({
      success: true,
      message: 'Cache status retrieved',
      data: cacheInfo
    });
  } catch (error) {
    logger.error(`Error getting cache status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache status',
      code: 'CACHE_STATUS_ERROR'
    });
  }
};

/**
 * Clear insights cache
 * DELETE /insights/cache
 */
exports.clearCache = async (req, res) => {
  try {
    const { key } = req.query;

    if (key) {
      aiService.clearCache(key);
      logger.info(`Cache key cleared: ${key}`);
    } else {
      aiService.clearCache();
      logger.info(`All cache cleared`);
    }

    res.json({
      success: true,
      message: key ? `Cache key cleared: ${key}` : 'All cache cleared',
      data: {
        cacheSize: aiService.cache.size
      }
    });
  } catch (error) {
    logger.error(`Error clearing cache: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      code: 'CACHE_CLEAR_ERROR'
    });
  }
};

/**
 * Get AI backend status
 * GET /insights/status
 */
exports.getServiceStatus = async (req, res) => {
  try {
    const status = {
      backend: aiService.backend,
      available: true,
      capabilities: [
        'Daily Insights',
        'Weekly Analysis',
        'Personalized Recommendations',
        'Schedule Prediction'
      ],
      cachingEnabled: true,
      cacheSize: aiService.cache.size,
      supportedLanguages: ['en'],
      rateLimit: {
        requestsPerHour: 50,
        requestsPerDay: 500
      }
    };

    // Check API availability
    if (aiService.backend === 'OPENAI' && !process.env.OPENAI_API_KEY) {
      status.available = false;
      status.warning = 'OpenAI API key not configured, falling back to local analysis';
    }

    res.json({
      success: true,
      message: 'AI Service status',
      data: status
    });
  } catch (error) {
    logger.error(`Error getting service status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get service status',
      code: 'STATUS_ERROR'
    });
  }
};

/**
 * Generate all insights (daily + weekly + recommendations)
 * GET /insights/comprehensive
 */
exports.getComprehensiveInsights = async (req, res) => {
  try {
    const targetDate = formatDate(new Date());
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = formatDate(new Date(today.setDate(diff)));

    // Get logs
    const dailyLog = await DailyLog.findOne({
      userId: req.user._id,
      date: new Date(targetDate)
    });

    const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekLogs = await DailyLog.find({
      userId: req.user._id,
      date: { $gte: new Date(weekStart), $lt: weekEnd }
    }).sort({ date: 1 });

    const userAnalytics = await Analytics.findOne({ userId: req.user._id });

    const comprehensiveInsights = {
      date: targetDate,
      daily: null,
      weekly: null,
      recommendations: null
    };

    // Generate daily insights
    if (dailyLog) {
      comprehensiveInsights.daily = await aiService.generateDailyInsights(
        dailyLog,
        req.user.settings || {}
      );
    }

    // Generate weekly insights
    if (weekLogs.length > 0) {
      comprehensiveInsights.weekly = await aiService.generateWeeklyInsights(
        weekLogs,
        req.user.settings || {}
      );
    }

    // Generate recommendations
    if (userAnalytics?.weeklyStats) {
      const userPatterns = {
        bestTimeSlots: userAnalytics.weeklyStats?.bestTimeSlots || [],
        worstTimeSlots: userAnalytics.weeklyStats?.worstTimeSlots || [],
        frequentDistractions: userAnalytics.weeklyStats?.frequentDistractions || [],
        categoryStats: userAnalytics.weeklyStats?.categoryStats || {},
        consistency: userAnalytics.weeklyStats?.consistency || 0
      };
      comprehensiveInsights.recommendations = await aiService.generateRecommendations(
        userPatterns,
        req.user
      );
    }

    logger.info(`Comprehensive insights generated for user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Comprehensive insights generated',
      data: {
        insights: comprehensiveInsights,
        backend: aiService.backend,
        generated: new Date()
      }
    });
  } catch (error) {
    logger.error(`Error getting comprehensive insights: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate comprehensive insights',
      code: 'COMPREHENSIVE_INSIGHTS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
