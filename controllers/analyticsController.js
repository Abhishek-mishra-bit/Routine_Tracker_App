/**
 * Analytics Controller
 * Handles analytics and statistics queries
 */

const DailyLog = require("../models/DailyLog");
const Analytics = require("../models/Analytics");
const logger = require("../utils/logger");

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the Monday of the week for a given date
 * @param {Date} date - Date object
 * @returns {Date} - Monday of that week
 */
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Get the Sunday of the week for a given date
 * @param {Date} date - Date object
 * @returns {Date} - Sunday of that week
 */
const getWeekEnd = (date) => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

/**
 * Format date as YYYY-MM-DD
 */
const getDateString = (date) => {
  return date.toISOString().split("T")[0];
};

/**
 * Format week string
 */
const getWeekString = (weekStart) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return `${getDateString(weekStart)} to ${getDateString(weekEnd)}`;
};

// ============================================================================
// WEEKLY ANALYTICS
// ============================================================================

/**
 * GET /api/analytics/weekly/:weekStart?
 * Get weekly statistics
 */
exports.getWeeklyStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    let { weekStart } = req.params;

    // Default to current week
    if (!weekStart) {
      weekStart = getWeekStart(new Date());
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
          code: "INVALID_DATE_FORMAT",
        });
      }
      weekStart = getWeekStart(new Date(weekStart));
    }

    logger.debug(`Fetching weekly stats for week of ${getDateString(weekStart)}`);

    const weekEnd = getWeekEnd(weekStart);

    // Try to get cached analytics
    let analytics = await Analytics.findOne({
      userId,
      weekStart,
    });

    if (!analytics || analytics.needsRefresh) {
      // Generate fresh analytics
      const logs = await DailyLog.find({
        userId,
        date: { $gte: weekStart, $lte: weekEnd },
      }).sort({ date: 1 });

      analytics = await calculateWeeklyAnalytics(userId, weekStart, logs);
    }

    return res.status(200).json({
      success: true,
      message: "Weekly statistics retrieved",
      data: {
        week: getWeekString(weekStart),
        stats: analytics.weeklyStats,
        trends: analytics.trends,
      },
    });
  } catch (error) {
    logger.error(`Get weekly stats error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve weekly statistics",
      code: "WEEKLY_STATS_ERROR",
    });
  }
};

/**
 * GET /api/analytics/monthly/:year/:month
 * Get monthly overview
 */
exports.getMonthlyStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year, month } = req.params;

    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid year or month",
        code: "INVALID_DATE",
      });
    }

    logger.debug(`Fetching monthly stats for ${year}-${month}`);

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get all logs for the month
    const logs = await DailyLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Calculate aggregated statistics
    const stats = calculateMonthlyStats(logs);

    return res.status(200).json({
      success: true,
      message: "Monthly statistics retrieved",
      data: {
        month: `${year}-${String(monthNum).padStart(2, "0")}`,
        stats,
      },
    });
  } catch (error) {
    logger.error(`Get monthly stats error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve monthly statistics",
      code: "MONTHLY_STATS_ERROR",
    });
  }
};

/**
 * GET /api/analytics/streak
 * Get current streak information
 */
exports.getStreak = async (req, res) => {
  try {
    const userId = req.user.userId;

    logger.debug(`Fetching streak info for user ${userId}`);

    // Get recent logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await DailyLog.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    // Calculate streak
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let streakStartDate = null;
    let streakEndDate = null;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const isHighScore = log.summary.totalScore >= 70;

      if (isHighScore) {
        if (tempStreak === 0) {
          streakEndDate = new Date(log.date);
        }
        tempStreak++;

        if (i === 0) {
          currentStreak = tempStreak;
        }
      } else {
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
          streakStartDate = new Date(streakEndDate);
          streakStartDate.setDate(streakStartDate.getDate() - tempStreak + 1);
        }
        tempStreak = 0;
      }
    }

    // Set streak dates
    if (currentStreak > 0) {
      streakStartDate = new Date(streakEndDate);
      streakStartDate.setDate(streakStartDate.getDate() - currentStreak + 1);
    }

    return res.status(200).json({
      success: true,
      message: "Streak information retrieved",
      data: {
        streak: {
          current: currentStreak,
          best: Math.max(bestStreak, currentStreak),
          startDate: streakStartDate
            ? streakStartDate.toISOString().split("T")[0]
            : null,
          endDate: streakEndDate
            ? streakEndDate.toISOString().split("T")[0]
            : null,
        },
      },
    });
  } catch (error) {
    logger.error(`Get streak error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve streak information",
      code: "STREAK_ERROR",
    });
  }
};

/**
 * GET /api/analytics/patterns
 * Get user behavior patterns
 */
exports.getBehaviorPatterns = async (req, res) => {
  try {
    const userId = req.user.userId;

    logger.debug(`Fetching behavior patterns for user ${userId}`);

    // Get last 90 days of data
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const logs = await DailyLog.find({
      userId,
      date: { $gte: ninetyDaysAgo },
    }).sort({ date: 1 });

    const patterns = {
      bestTimeSlots: [],
      worstTimeSlots: [],
      bestActivities: [],
      moodPattern: {},
      energyPattern: [],
      productivityByCategory: {},
      frequentDistractions: [],
    };

    // Analyze time slots
    const timeSlotStats = {};

    logs.forEach((log) => {
      log.slots.forEach((slot) => {
        if (!timeSlotStats[slot.timeSlot]) {
          timeSlotStats[slot.timeSlot] = {
            count: 0,
            completions: 0,
            score: 0,
            moods: {},
          };
        }

        timeSlotStats[slot.timeSlot].count++;
        timeSlotStats[slot.timeSlot].score += slot.slotScore || 0;

        if (slot.completed) {
          timeSlotStats[slot.timeSlot].completions++;
        }

        timeSlotStats[slot.timeSlot].moods[slot.mood] =
          (timeSlotStats[slot.timeSlot].moods[slot.mood] || 0) + 1;
      });
    });

    // Calculate best and worst time slots
    const sortedTimeSlots = Object.entries(timeSlotStats)
      .map(([timeSlot, stats]) => ({
        timeSlot,
        averageScore: Math.round(stats.score / stats.count),
        completionRate: Math.round((stats.completions / stats.count) * 100),
        count: stats.count,
        mostCommonMood: Object.keys(stats.moods).reduce((a, b) =>
          stats.moods[a] > stats.moods[b] ? a : b,
        ),
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    patterns.bestTimeSlots = sortedTimeSlots.slice(0, 5);
    patterns.worstTimeSlots = sortedTimeSlots.slice(-5).reverse();

    // Analyze activities
    const activityStats = {};

    logs.forEach((log) => {
      log.slots.forEach((slot) => {
        if (!activityStats[slot.plannedActivity]) {
          activityStats[slot.plannedActivity] = {
            count: 0,
            completions: 0,
            productiveCount: 0,
            avgScore: 0,
          };
        }

        activityStats[slot.plannedActivity].count++;
        activityStats[slot.plannedActivity].avgScore += slot.slotScore || 0;

        if (slot.completed) {
          activityStats[slot.plannedActivity].completions++;
        }

        if (slot.productive) {
          activityStats[slot.plannedActivity].productiveCount++;
        }
      });
    });

    patterns.bestActivities = Object.entries(activityStats)
      .map(([activity, stats]) => ({
        activity,
        count: stats.count,
        completionRate: Math.round((stats.completions / stats.count) * 100),
        productivityRate: Math.round(
          (stats.productiveCount / stats.completions) * 100,
        ),
        averageScore: Math.round(stats.avgScore / stats.count),
      }))
      .filter((a) => a.count >= 3)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);

    // Mood pattern
    logs.forEach((log) => {
      const dayOfWeek = new Date(log.date).toLocaleDateString("en-US", {
        weekday: "long",
      });
      patterns.moodPattern[dayOfWeek] = log.summary.moodAverage;
    });

    // Energy pattern
    const energyByDayOfWeek = {};
    logs.forEach((log) => {
      const dayOfWeek = new Date(log.date).getDay();
      if (!energyByDayOfWeek[dayOfWeek]) {
        energyByDayOfWeek[dayOfWeek] = [];
      }
      energyByDayOfWeek[dayOfWeek].push(log.summary.energyAverage);
    });

    patterns.energyPattern = Object.entries(energyByDayOfWeek).map(
      ([day, values]) => ({
        dayOfWeek: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][day],
        averageEnergy: Math.round(
          values.reduce((a, b) => a + b) / values.length,
        ),
      }),
    );

    // Category breakdown
    logs.forEach((log) => {
      log.slots.forEach((slot) => {
        const category = slot.category || "other";
        if (!patterns.productivityByCategory[category]) {
          patterns.productivityByCategory[category] = {
            count: 0,
            productive: 0,
          };
        }
        patterns.productivityByCategory[category].count++;
        if (slot.productive) {
          patterns.productivityByCategory[category].productive++;
        }
      });
    });

    // Frequent distractions
    const distractionCounts = {};
    logs.forEach((log) => {
      log.slots.forEach((slot) => {
        slot.distractions.forEach((distraction) => {
          distractionCounts[distraction] =
            (distractionCounts[distraction] || 0) + 1;
        });
      });
    });

    patterns.frequentDistractions = Object.entries(distractionCounts)
      .map(([distraction, count]) => ({
        distraction,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      message: "Behavior patterns retrieved",
      data: {
        patterns,
      },
    });
  } catch (error) {
    logger.error(`Get behavior patterns error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve behavior patterns",
      code: "PATTERNS_ERROR",
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS FOR CALCULATIONS
// ============================================================================

/**
 * Calculate weekly analytics from logs
 */
async function calculateWeeklyAnalytics(userId, weekStart, logs) {
  const weekEnd = getWeekEnd(weekStart);

  let analytics = await Analytics.findOne({
    userId,
    weekStart,
  });

  if (!analytics) {
    analytics = new Analytics({
      userId,
      weekStart,
      weekEnd,
    });
  }

  // Calculate stats from logs
  const weeklyStats = {
    totalSlotsPlanned: 0,
    totalSlotsCompleted: 0,
    completionRate: 0,
    averageProductivity: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 100,
    highScoreDays: 0,
    currentStreak: 0,
    dailyScores: [],
  };

  let totalProductivity = 0;
  let totalScore = 0;

  logs.forEach((log) => {
    weeklyStats.totalSlotsPlanned += log.slots.length;
    weeklyStats.totalSlotsCompleted += log.slots.filter(
      (s) => s.completed,
    ).length;
    weeklyStats.dailyScores.push(log.summary.totalScore);
    totalScore += log.summary.totalScore;
    totalProductivity += log.summary.productivityPercentage;

    if (log.summary.totalScore > weeklyStats.highestScore) {
      weeklyStats.highestScore = log.summary.totalScore;
    }

    if (log.summary.totalScore < weeklyStats.lowestScore) {
      weeklyStats.lowestScore = log.summary.totalScore;
    }

    if (log.summary.totalScore >= 70) {
      weeklyStats.highScoreDays++;
    }
  });

  weeklyStats.completionRate = logs.length
    ? Math.round(
        (weeklyStats.totalSlotsCompleted / weeklyStats.totalSlotsPlanned) * 100,
      )
    : 0;

  weeklyStats.averageScore = logs.length
    ? Math.round(totalScore / logs.length)
    : 0;

  weeklyStats.averageProductivity = logs.length
    ? Math.round(totalProductivity / logs.length)
    : 0;

  analytics.weeklyStats = weeklyStats;
  analytics.lastUpdated = new Date();
  analytics.needsRefresh = false;

  await analytics.save();

  return analytics;
}

/**
 * Calculate monthly statistics
 */
function calculateMonthlyStats(logs) {
  const stats = {
    totalLogs: logs.length,
    averageScore: 0,
    completionRate: 0,
    productivityRate: 0,
    highScoreDays: 0,
    totalSlots: 0,
    completedSlots: 0,
    productiveSlots: 0,
    averageEnergy: 0,
  };

  if (logs.length === 0) {
    return stats;
  }

  let totalScore = 0;
  let totalEnergy = 0;

  logs.forEach((log) => {
    totalScore += log.summary.totalScore;
    totalEnergy += log.summary.energyAverage;
    stats.totalSlots += log.slots.length;
    stats.completedSlots += log.slots.filter((s) => s.completed).length;
    stats.productiveSlots += log.slots.filter((s) => s.productive).length;

    if (log.summary.totalScore >= 70) {
      stats.highScoreDays++;
    }
  });

  stats.averageScore = Math.round(totalScore / logs.length);
  stats.averageEnergy = Math.round(totalEnergy / logs.length);
  stats.completionRate = Math.round(
    (stats.completedSlots / stats.totalSlots) * 100,
  );
  stats.productivityRate =
    stats.completedSlots > 0
      ? Math.round((stats.productiveSlots / stats.completedSlots) * 100)
      : 0;

  return stats;
}
