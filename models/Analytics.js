/**
 * Analytics Model
 * Caches and stores aggregated analytics data for performance optimization
 *
 * Features:
 * - Weekly statistics caching
 * - Performance metrics aggregation
 * - Trend analysis data
 * - Automatic expiration
 */

const mongoose = require("mongoose");

// ============================================================================
// WEEKLY STATS SCHEMA (Nested Document)
// ============================================================================

const weeklyStatsSchema = new mongoose.Schema(
  {
    /**
     * Total time slots planned during the week
     */
    totalSlotsPlanned: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Total time slots completed during the week
     */
    totalSlotsCompleted: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Completion rate percentage
     */
    completionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    /**
     * Average productivity percentage
     */
    averageProductivity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    /**
     * Average daily score
     */
    averageScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    /**
     * Highest score achieved this week
     */
    highestScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    /**
     * Lowest score achieved this week
     */
    lowestScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    /**
     * Number of high-score days (>= 70)
     */
    highScoreDays: {
      type: Number,
      min: 0,
      max: 7,
      default: 0,
    },

    /**
     * Current streak of days with scores >= 70
     */
    currentStreak: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Best streak achieved this week
     */
    bestStreak: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Array of daily scores for the week
     */
    dailyScores: {
      type: [Number],
      default: [],
      validate: [
        function (v) {
          return v.length <= 7;
        },
        "Daily scores array cannot exceed 7 entries",
      ],
    },

    /**
     * History of streaks achieved
     * [{startDate, endDate, length}]
     */
    streakHistory: [
      {
        startDate: Date,
        endDate: Date,
        length: Number,
      },
    ],

    /**
     * Best performing time slots
     * [{timeSlot, count, avgScore}]
     */
    bestTimeSlots: [
      {
        timeSlot: String,
        completionCount: Number,
        averageScore: Number,
        averageMood: String,
      },
    ],

    /**
     * Worst performing time slots
     * [{timeSlot, count, avgScore}]
     */
    worstTimeSlots: [
      {
        timeSlot: String,
        completionCount: Number,
        averageScore: Number,
        averageMood: String,
      },
    ],

    /**
     * Activity category breakdown
     */
    categoryStats: {
      type: Map,
      of: new mongoose.Schema(
        {
          count: Number,
          completionRate: Number,
          averageScore: Number,
        },
        { _id: false },
      ),
      default: new Map(),
    },

    /**
     * Average energy level for the week
     */
    averageEnergy: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },

    /**
     * Mood distribution for the week
     */
    moodDistribution: {
      type: Map,
      of: Number,
      default: new Map(),
    },

    /**
     * Total distractions encountered
     */
    totalDistractions: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Most common distractions
     */
    topDistractions: [String],

    /**
     * Total productive hours
     */
    totalProductiveHours: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Top 5 productive activities
     */
    topActivities: [
      {
        activity: String,
        count: Number,
        successRate: Number,
      },
    ],
  },
  { _id: false, timestamps: false },
);

// ============================================================================
// ANALYTICS SCHEMA
// ============================================================================

const analyticsSchema = new mongoose.Schema(
  {
    /**
     * Reference to the user
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },

    /**
     * Week start date (Monday)
     */
    weekStart: {
      type: Date,
      required: [true, "Week start date is required"],
      index: true,
    },

    /**
     * Week end date (Sunday)
     */
    weekEnd: {
      type: Date,
      required: [true, "Week end date is required"],
    },

    /**
     * Weekly statistics object
     */
    weeklyStats: {
      type: weeklyStatsSchema,
      default: () => ({}),
    },

    /**
     * Month-to-date statistics
     */
    monthStats: {
      totalScore: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      totalLogs: { type: Number, default: 0 },
      bestDay: {
        date: Date,
        score: Number,
      },
    },

    /**
     * Year-to-date statistics
     */
    yearStats: {
      totalScore: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      totalLogs: { type: Number, default: 0 },
      bestMonth: {
        month: String,
        score: Number,
      },
    },

    /**
     * All-time personal statistics
     */
    allTimeStats: {
      totalLogs: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      bestScore: { type: Number, default: 0 },
      worstScore: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      totalHours: { type: Number, default: 0 },
      totalActivities: { type: Number, default: 0 },
    },

    /**
     * Trends and insights
     */
    trends: {
      /**
       * Is productivity trending up?
       */
      productivityTrend: {
        type: String,
        enum: ["up", "down", "stable"],
        default: "stable",
      },

      /**
       * Is energy level trending up?
       */
      energyTrend: {
        type: String,
        enum: ["up", "down", "stable"],
        default: "stable",
      },

      /**
       * Percentage change in productivity (week over week)
       */
      weekOverWeekChange: {
        type: Number,
        default: 0,
      },

      /**
       * Month over month change
       */
      monthOverMonthChange: {
        type: Number,
        default: 0,
      },

      /**
       * Key achievements this week
       */
      achievements: [String],

      /**
       * Areas for improvement
       */
      improvements: [String],

      /**
       * Next week recommendations
       */
      recommendations: [String],
    },

    /**
     * Comparison with user's average
     */
    comparison: {
      /**
       * Above, below, or equal to average
       */
      status: {
        type: String,
        enum: ["above", "below", "average"],
        default: "average",
      },

      /**
       * Percentage difference from user's average
       */
      percentageDifference: {
        type: Number,
        default: 0,
      },

      /**
       * Rank percentile among all users (optional)
       */
      percentile: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
    },

    /**
     * Data freshness - when was this last updated
     */
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },

    /**
     * Whether this record should be refreshed
     */
    needsRefresh: {
      type: Boolean,
      default: false,
    },

    /**
     * Number of times this record has been updated
     */
    updateCount: {
      type: Number,
      default: 1,
    },

    /**
     * Custom notes/insights about this week
     */
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ============================================================================
// INDEXES FOR PERFORMANCE
// ============================================================================

/**
 * Index on userId for fast user lookups
 */
analyticsSchema.index({ userId: 1 });

/**
 * Index on week start for date range queries
 */
analyticsSchema.index({ weekStart: -1 });

/**
 * Compound index for user's week data
 */
analyticsSchema.index({ userId: 1, weekStart: -1 });

/**
 * Index on lastUpdated for refresh queries
 */
analyticsSchema.index({ lastUpdated: -1 });

/**
 * Index on needsRefresh for batch update queries
 */
analyticsSchema.index({ needsRefresh: 1 });

// ============================================================================
// TTL (Time To Live) INDEX
// ============================================================================

/**
 * Automatically delete old analytics records after 1 year (31536000 seconds)
 * This helps manage storage for long-running applications
 */
analyticsSchema.index(
  { lastUpdated: 1 },
  { expireAfterSeconds: 31536000, sparse: true },
);

// ============================================================================
// MIDDLEWARE - PRE-SAVE HOOKS
// ============================================================================

/**
 * Update the lastUpdated timestamp and increment update count
 */
analyticsSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  this.updateCount += 1;
  next();
});

/**
 * Calculate comparison metrics
 */
analyticsSchema.pre("save", function (next) {
  // This would typically be calculated based on user's historical data
  // For now, we'll leave it as a placeholder for the application logic
  next();
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Check if analytics data is stale (older than 6 hours)
 * @returns {Boolean} - True if data needs refresh
 */
analyticsSchema.methods.isStale = function () {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return this.lastUpdated < sixHoursAgo;
};

/**
 * Mark data as needing refresh
 * @returns {Promise} - Updated document
 */
analyticsSchema.methods.markForRefresh = function () {
  this.needsRefresh = true;
  return this.save();
};

/**
 * Update weekly statistics
 * @param {Object} newStats - New statistics to merge
 * @returns {Promise} - Updated document
 */
analyticsSchema.methods.updateWeeklyStats = function (newStats) {
  this.weeklyStats = { ...this.weeklyStats.toObject(), ...newStats };
  this.needsRefresh = false;
  return this.save();
};

/**
 * Add achievement
 * @param {String} achievement - Achievement description
 * @returns {Promise} - Updated document
 */
analyticsSchema.methods.addAchievement = function (achievement) {
  if (!this.trends.achievements) {
    this.trends.achievements = [];
  }
  this.trends.achievements.push(achievement);
  return this.save();
};

/**
 * Add improvement area
 * @param {String} improvement - Improvement area description
 * @returns {Promise} - Updated document
 */
analyticsSchema.methods.addImprovement = function (improvement) {
  if (!this.trends.improvements) {
    this.trends.improvements = [];
  }
  this.trends.improvements.push(improvement);
  return this.save();
};

/**
 * Get trend comparison
 * @returns {Object} - Trend information
 */
analyticsSchema.methods.getTrendData = function () {
  return {
    productivityTrend: this.trends.productivityTrend,
    energyTrend: this.trends.energyTrend,
    weekOverWeekChange: this.trends.weekOverWeekChange,
    monthOverMonthChange: this.trends.monthOverMonthChange,
  };
};

/**
 * Get best performing time slot
 * @returns {Object} - Best time slot data
 */
analyticsSchema.methods.getBestTimeSlot = function () {
  if (
    !this.weeklyStats.bestTimeSlots ||
    this.weeklyStats.bestTimeSlots.length === 0
  ) {
    return null;
  }
  return this.weeklyStats.bestTimeSlots[0];
};

/**
 * Get worst performing time slot
 * @returns {Object} - Worst time slot data
 */
analyticsSchema.methods.getWorstTimeSlot = function () {
  if (
    !this.weeklyStats.worstTimeSlots ||
    this.weeklyStats.worstTimeSlots.length === 0
  ) {
    return null;
  }
  return this.weeklyStats.worstTimeSlots[0];
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find analytics for a user in a week
 * @param {ObjectId} userId - User ID
 * @param {Date} weekStart - Week start date
 * @returns {Promise<Object>} - Analytics document
 */
analyticsSchema.statics.findByWeek = function (userId, weekStart) {
  return this.findOne({ userId, weekStart });
};

/**
 * Find all records that need refresh
 * @param {Number} limit - Limit results
 * @returns {Promise<Array>} - Array of analytics records
 */
analyticsSchema.statics.findStale = function (limit = 100) {
  return this.find({ needsRefresh: true }).limit(limit);
};

/**
 * Get user's recent analytics (last 4 weeks)
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Array>} - Recent analytics records
 */
analyticsSchema.statics.getRecentAnalytics = function (userId) {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  return this.find({ userId, weekStart: { $gte: fourWeeksAgo } }).sort({
    weekStart: -1,
  });
};

/**
 * Get top performers (leaderboard)
 * @param {Number} limit - Number of top users to return
 * @returns {Promise<Array>} - Top performing users
 */
analyticsSchema.statics.getTopPerformers = function (limit = 10) {
  return this.aggregate([
    {
      $match: {
        weekStart: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
    {
      $sort: { "weeklyStats.averageScore": -1 },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
  ]);
};

/**
 * Get users needing motivation (low performers)
 * @param {Number} limit - Number of users to return
 * @returns {Promise<Array>} - Low performing users
 */
analyticsSchema.statics.getNeedsMotivation = function (limit = 10) {
  return this.aggregate([
    {
      $match: {
        weekStart: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
    {
      $sort: { "weeklyStats.averageScore": 1 },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
  ]);
};

/**
 * Get trend statistics for all users
 * @returns {Promise<Object>} - Aggregate trend data
 */
analyticsSchema.statics.getGlobalTrends = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        avgScore: { $avg: "$weeklyStats.averageScore" },
        avgCompletion: { $avg: "$weeklyStats.completionRate" },
        avgProductivity: { $avg: "$weeklyStats.averageProductivity" },
        totalRecords: { $sum: 1 },
      },
    },
  ]);
};

/**
 * Delete stale records older than specified days
 * @param {Number} days - Number of days old
 * @returns {Promise} - Deletion result
 */
analyticsSchema.statics.deleteStaleRecords = function (days = 365) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return this.deleteMany({ lastUpdated: { $lt: date } });
};

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

/**
 * Week formatted as string
 */
analyticsSchema.virtual("weekString").get(function () {
  const start = this.weekStart.toISOString().split("T")[0];
  const end = this.weekEnd.toISOString().split("T")[0];
  return `${start} to ${end}`;
});

/**
 * Whether this is the current week
 */
analyticsSchema.virtual("isCurrentWeek").get(function () {
  const now = new Date();
  return this.weekStart <= now && now <= this.weekEnd;
});

/**
 * Overall performance rating (1-5 stars)
 */
analyticsSchema.virtual("performanceRating").get(function () {
  const score = this.weeklyStats.averageScore;
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 45) return 2;
  return 1;
});

// ============================================================================
// EXPORT MODEL
// ============================================================================

module.exports = mongoose.model("Analytics", analyticsSchema);
