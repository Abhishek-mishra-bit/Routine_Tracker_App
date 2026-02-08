/**
 * Summary Controller
 * Handles daily, weekly, and monthly summary endpoints
 */

const DailyLog = require("../models/DailyLog");
const logger = require("../utils/logger");

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get today's date normalized
 */
const getTodayNormalized = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Get this week's start date (Monday)
 */
const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Get this week's end date (Sunday)
 */
const getWeekEnd = (date = new Date()) => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

/**
 * Get this month's start and end dates
 */
const getMonthRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

/**
 * Format date string
 */
const getDateString = (date) => {
  return date.toISOString().split("T")[0];
};

/**
 * Format summary response
 */
const formatSummary = (log, period) => {
  return {
    period,
    date: getDateString(log.date),
    score: log.summary.totalScore,
    completionRate: log.summary.completionPercentage,
    productivityRate: log.summary.productivityPercentage,
    totalSlots: log.summary.totalPlanned,
    completedSlots: log.summary.totalCompleted,
    productiveSlots: log.summary.totalProductive,
    mood: log.summary.moodAverage,
    energy: log.summary.energyAverage,
    dayRating: log.dayRating,
    aiInsights: log.aiInsights,
    categoryBreakdown: Object.fromEntries(
      log.summary.categoryBreakdown || new Map(),
    ),
    successfulDay: log.summary.totalScore >= 70,
  };
};

// ============================================================================
// SUMMARY ENDPOINTS
// ============================================================================

/**
 * GET /api/summary/today
 * Get today's summary
 */
exports.getTodaySummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = getTodayNormalized();

    logger.debug(`Fetching today's summary for user ${userId}`);

    const log = await DailyLog.findOne({
      userId,
      date: today,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "No daily log found for today",
        code: "LOG_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Today's summary retrieved",
      data: {
        summary: formatSummary(log, "daily"),
        slots: log.slots,
      },
    });
  } catch (error) {
    logger.error(`Get today's summary error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve today's summary",
      code: "TODAY_SUMMARY_ERROR",
    });
  }
};

/**
 * GET /api/summary/week
 * Get this week's summary
 */
exports.getWeekSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();

    logger.debug(`Fetching week summary for user ${userId}`);

    const logs = await DailyLog.find({
      userId,
      date: { $gte: weekStart, $lte: weekEnd },
    }).sort({ date: 1 });

    if (logs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No logs found for this week",
        code: "LOG_NOT_FOUND",
      });
    }

    // Calculate aggregate statistics
    const weekStats = calculateWeekStats(logs);

    // Daily breakdown
    const dailyBreakdown = logs.map((log) => ({
      date: getDateString(log.date),
      score: log.summary.totalScore,
      completion: log.summary.completionPercentage,
      productivity: log.summary.productivityPercentage,
      mood: log.summary.moodAverage,
      energy: log.summary.energyAverage,
    }));

    return res.status(200).json({
      success: true,
      message: "Week summary retrieved",
      data: {
        period: `${getDateString(weekStart)} to ${getDateString(weekEnd)}`,
        summary: weekStats,
        dailyBreakdown,
      },
    });
  } catch (error) {
    logger.error(`Get week summary error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve week summary",
      code: "WEEK_SUMMARY_ERROR",
    });
  }
};

/**
 * GET /api/summary/month
 * Get this month's summary
 */
exports.getMonthSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = getMonthRange();

    logger.debug(`Fetching month summary for user ${userId}`);

    const logs = await DailyLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    if (logs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No logs found for this month",
        code: "LOG_NOT_FOUND",
      });
    }

    // Calculate aggregate statistics
    const monthStats = calculateMonthStats(logs);

    // Weekly breakdown
    const weeklyBreakdown = getWeeklyBreakdown(logs);

    return res.status(200).json({
      success: true,
      message: "Month summary retrieved",
      data: {
        period: `${startDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        })}`,
        summary: monthStats,
        weeklyBreakdown,
      },
    });
  } catch (error) {
    logger.error(`Get month summary error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve month summary",
      code: "MONTH_SUMMARY_ERROR",
    });
  }
};

/**
 * GET /api/summary/comparison
 * Compare performance with previous periods
 */
exports.getComparison = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = "week" } = req.query;

    logger.debug(`Fetching performance comparison for user ${userId}`);

    let currentLogs = [];
    let previousLogs = [];

    if (period === "week") {
      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd();

      currentLogs = await DailyLog.find({
        userId,
        date: { $gte: weekStart, $lte: weekEnd },
      });

      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekEnd = new Date(weekEnd);
      prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

      previousLogs = await DailyLog.find({
        userId,
        date: { $gte: prevWeekStart, $lte: prevWeekEnd },
      });
    } else if (period === "month") {
      const { startDate, endDate } = getMonthRange();
      currentLogs = await DailyLog.find({
        userId,
        date: { $gte: startDate, $lte: endDate },
      });

      const prevStart = new Date(startDate);
      prevStart.setMonth(prevStart.getMonth() - 1);
      const prevEnd = new Date(endDate);
      prevEnd.setMonth(prevEnd.getMonth() - 1);

      previousLogs = await DailyLog.find({
        userId,
        date: { $gte: prevStart, $lte: prevEnd },
      });
    }

    const currentStats =
      period === "week"
        ? calculateWeekStats(currentLogs)
        : calculateMonthStats(currentLogs);

    const previousStats =
      period === "week"
        ? calculateWeekStats(previousLogs)
        : calculateMonthStats(previousLogs);

    // Calculate differences
    const comparison = {
      period,
      current: currentStats,
      previous: previousStats,
      difference: {
        score:
          currentStats.averageScore - previousStats.averageScore,
        completion:
          currentStats.completionRate - previousStats.completionRate,
        productivity:
          currentStats.productivityRate - previousStats.productivityRate,
        energy: currentStats.averageEnergy - previousStats.averageEnergy,
      },
      percentageChange: {
        score: previousStats.averageScore
          ? Math.round(
              ((currentStats.averageScore - previousStats.averageScore) /
                previousStats.averageScore) *
                100,
            )
          : 0,
        completion: previousStats.completionRate
          ? Math.round(
              ((currentStats.completionRate - previousStats.completionRate) /
                previousStats.completionRate) *
                100,
            )
          : 0,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Performance comparison retrieved",
      data: {
        comparison,
      },
    });
  } catch (error) {
    logger.error(`Get comparison error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve comparison data",
      code: "COMPARISON_ERROR",
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS FOR CALCULATIONS
// ============================================================================

/**
 * Calculate statistics for a week
 */
function calculateWeekStats(logs) {
  if (logs.length === 0) {
    return {
      totalScore: 0,
      averageScore: 0,
      completionRate: 0,
      productivityRate: 0,
      averageEnergy: 0,
      highScoreDays: 0,
      daysLogged: 0,
    };
  }

  let totalScore = 0;
  let totalEnergy = 0;
  let totalCompletion = 0;
  let totalProductivity = 0;
  let highScoreDays = 0;

  logs.forEach((log) => {
    totalScore += log.summary.totalScore;
    totalEnergy += log.summary.energyAverage;
    totalCompletion += log.summary.completionPercentage;
    totalProductivity += log.summary.productivityPercentage;

    if (log.summary.totalScore >= 70) {
      highScoreDays++;
    }
  });

  return {
    totalScore: Math.round(totalScore),
    averageScore: Math.round(totalScore / logs.length),
    completionRate: Math.round(totalCompletion / logs.length),
    productivityRate: Math.round(totalProductivity / logs.length),
    averageEnergy: Math.round(totalEnergy / logs.length),
    highScoreDays,
    daysLogged: logs.length,
  };
}

/**
 * Calculate statistics for a month
 */
function calculateMonthStats(logs) {
  return calculateWeekStats(logs); // Same calculation logic
}

/**
 * Get weekly breakdown for month
 */
function getWeeklyBreakdown(logs) {
  const weeks = {};

  logs.forEach((log) => {
    const date = new Date(log.date);
    const weekNum = Math.ceil(date.getDate() / 7);
    const weekKey = `Week ${weekNum}`;

    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }

    weeks[weekKey].push(log);
  });

  return Object.entries(weeks).map(([week, weekLogs]) => {
    const stats = calculateWeekStats(weekLogs);
    return {
      week,
      ...stats,
    };
  });
}
