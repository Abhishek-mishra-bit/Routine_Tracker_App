/**
 * DailyLog Model
 * Represents daily routine logs with time slot tracking
 *
 * Features:
 * - Time slot tracking with multiple metrics
 * - Mood and energy level tracking
 * - Automatic score calculation
 * - Daily summary generation
 * - AI insights placeholder
 */

const mongoose = require("mongoose");

// ============================================================================
// SLOT SCHEMA (Nested Document)
// ============================================================================

const slotSchema = new mongoose.Schema(
  {
    /**
     * Time slot identifier (e.g., "07:00-08:00")
     */
    timeSlot: {
      type: String,
      required: [true, "Time slot is required"],
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/,
        "Time slot must be in HH:mm-HH:mm format",
      ],
    },

    /**
     * Planned activity for this slot
     */
    plannedActivity: {
      type: String,
      required: [true, "Planned activity is required"],
      maxlength: [200, "Activity description cannot exceed 200 characters"],
    },

    /**
     * Was the activity completed?
     */
    completed: {
      type: Boolean,
      default: false,
    },

    /**
     * Was the activity productive?
     */
    productive: {
      type: Boolean,
      default: false,
    },

    /**
     * User's mood during this slot
     */
    mood: {
      type: String,
      enum: {
        values: ["happy", "neutral", "sad", "angry", "energetic", "tired"],
        message: "{VALUE} is not a valid mood",
      },
      default: "neutral",
    },

    /**
     * Energy level (1-10 scale)
     */
    energyLevel: {
      type: Number,
      min: [1, "Energy level must be at least 1"],
      max: [10, "Energy level cannot exceed 10"],
      default: 5,
    },

    /**
     * Additional notes about the slot
     */
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },

    /**
     * Array of distractions encountered
     */
    distractions: {
      type: [String],
      default: [],
      maxlength: 10, // Maximum 10 distractions per slot
    },

    /**
     * Actual start time of activity
     */
    startTime: {
      type: Date,
      default: null,
    },

    /**
     * Actual end time of activity
     */
    endTime: {
      type: Date,
      default: null,
    },

    /**
     * Actual duration in minutes
     */
    actualDuration: {
      type: Number,
      min: 0,
      default: null,
    },

    /**
     * Priority level of the activity
     */
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    /**
     * Category of the activity
     */
    category: {
      type: String,
      enum: [
        "work",
        "exercise",
        "study",
        "leisure",
        "personal",
        "health",
        "social",
        "other",
      ],
      default: "other",
    },

    /**
     * Slot-specific score (0-100)
     */
    slotScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: true, timestamps: false },
);

/**
 * Calculate slot score before saving
 */
slotSchema.pre("save", function () {
  let score = 0;

  // Completion (40 points)
  if (this.completed) score += 40;

  // Productivity (30 points)
  if (this.productive) score += 30;

  // Mood bonus (15 points for positive moods)
  if (["happy", "energetic"].includes(this.mood)) score += 15;

  // Energy level (15 points for high energy)
  if (this.energyLevel >= 7) score += 15;

  // Penalty for distractions (5 points per distraction, max 20 point deduction)
  const distractionPenalty = Math.min(this.distractions.length * 5, 20);
  score = Math.max(0, score - distractionPenalty);

  this.slotScore = score;
});

// ============================================================================
// SUMMARY SCHEMA (Nested Document)
// ============================================================================

const summarySchema = new mongoose.Schema(
  {
    /**
     * Total daily score (0-100)
     */
    totalScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    /**
     * Percentage of slots completed
     */
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    /**
     * Percentage of completed slots that were productive
     */
    productivityPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    /**
     * Current streak count (consecutive days with high score)
     */
    streak: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Average mood for the day
     */
    moodAverage: {
      type: String,
      enum: ["happy", "neutral", "sad", "angry", "energetic", "tired"],
      default: "neutral",
    },

    /**
     * Average energy level for the day
     */
    energyAverage: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },

    /**
     * Total activities planned
     */
    totalPlanned: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Total activities completed
     */
    totalCompleted: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Total productive activities
     */
    totalProductive: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Average distraction count
     */
    averageDistractions: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Activity breakdown by category
     */
    categoryBreakdown: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  { _id: false, timestamps: false },
);

// ============================================================================
// DAILY LOG SCHEMA
// ============================================================================

const dailyLogSchema = new mongoose.Schema(
  {
    /**
     * Reference to the user
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    /**
     * Date of the log (stored as Date object)
     */
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },

    /**
     * Array of time slot entries
     */
    slots: {
      type: [slotSchema],
      default: [],
      validate: [
        function (v) {
          return v.length <= 24; // Maximum 24 slots per day
        },
        "Cannot have more than 24 slots in a day",
      ],
    },

    /**
     * Daily summary and metrics
     */
    summary: {
      type: summarySchema,
      default: () => ({}),
    },

    /**
     * AI-generated insights about the day
     */
    aiInsights: {
      type: String,
      maxlength: [1000, "Insights cannot exceed 1000 characters"],
      default: null,
    },

    /**
     * Whether AI has processed this log
     */
    aiProcessed: {
      type: Boolean,
      default: false,
    },

    /**
     * Weather condition for the day
     */
    weather: {
      type: String,
      enum: ["sunny", "cloudy", "rainy", "snowy", "unknown"],
      default: "unknown",
    },

    /**
     * Overall day rating (1-5)
     */
    dayRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    /**
     * Custom tags for the day
     */
    tags: {
      type: [String],
      default: [],
      maxlength: 20,
    },

    /**
     * Whether the day was a holiday or special day
     */
    isSpecialDay: {
      type: Boolean,
      default: false,
    },

    /**
     * Public notes visible to others (if sharing enabled)
     */
    publicNotes: {
      type: String,
      maxlength: [500, "Public notes cannot exceed 500 characters"],
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
 * Compound index on userId and date for efficient querying
 */
dailyLogSchema.index({ userId: 1, date: -1 });

/**
 * Unique index: One log per user per date
 */
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

/**
 * Index for finding logs within date range
 */
dailyLogSchema.index({ userId: 1, date: 1 });

/**
 * Index for filtering by AI processing status
 */
dailyLogSchema.index({ userId: 1, aiProcessed: 1 });

/**
 * Index for day rating queries (for trending)
 */
dailyLogSchema.index({ userId: 1, dayRating: 1 });

// ============================================================================
// MIDDLEWARE - PRE-SAVE HOOKS
// ============================================================================

/**
 * Calculate summary before saving
 */
dailyLogSchema.pre("save", function (next) {
  if (this.slots.length === 0) {
    return next();
  }

  const slots = this.slots;

  // Calculate completion percentage
  const completedCount = slots.filter((s) => s.completed).length;
  this.summary.completionPercentage =
    Math.round((completedCount / slots.length) * 100) || 0;

  // Calculate productivity percentage
  const productiveCount = slots.filter(
    (s) => s.completed && s.productive,
  ).length;
  this.summary.productivityPercentage =
    completedCount > 0
      ? Math.round((productiveCount / completedCount) * 100) || 0
      : 0;

  // Calculate average mood
  const moodMap = {
    happy: 5,
    energetic: 5,
    neutral: 3,
    tired: 2,
    sad: 1,
    angry: 1,
  };

  const moodSum = slots.reduce((sum, s) => sum + (moodMap[s.mood] || 3), 0);
  const avgMoodScore = moodSum / slots.length;

  const moodRanges = {
    happy: [4.5, 5],
    energetic: [4.5, 5],
    neutral: [2.5, 3.5],
    tired: [1.5, 2.5],
    sad: [0, 1.5],
    angry: [0, 1.5],
  };

  const moodKey = Object.keys(moodRanges).find(
    ([min, max]) =>
      avgMoodScore >= moodRanges[moodKey][0] &&
      avgMoodScore <= moodRanges[moodKey][1],
  );
  this.summary.moodAverage = moodKey || "neutral";

  // Calculate average energy
  const energySum = slots.reduce((sum, s) => sum + (s.energyLevel || 5), 0);
  this.summary.energyAverage = Math.round(energySum / slots.length);

  // Set total counts
  this.summary.totalPlanned = slots.length;
  this.summary.totalCompleted = completedCount;
  this.summary.totalProductive = productiveCount;

  // Calculate average distractions
  const totalDistractions = slots.reduce(
    (sum, s) => sum + s.distractions.length,
    0,
  );
  this.summary.averageDistractions = (totalDistractions / slots.length).toFixed(
    2,
  );

  // Calculate category breakdown
  const categoryMap = new Map();
  slots.forEach((slot) => {
    const category = slot.category || "other";
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });
  this.summary.categoryBreakdown = categoryMap;

  // Calculate total score (average of all slot scores)
  const totalSlotScore = slots.reduce((sum, s) => sum + (s.slotScore || 0), 0);
  this.summary.totalScore = Math.round(totalSlotScore / slots.length) || 0;

  next();
});

/**
 * Convert date to start of day (normalize)
 */
dailyLogSchema.pre("save", function (next) {
  const dateObj = new Date(this.date);
  dateObj.setHours(0, 0, 0, 0);
  this.date = dateObj;
  next();
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Add a new slot to the daily log
 * @param {Object} slotData - Slot data
 * @returns {Promise} - Updated document
 */
dailyLogSchema.methods.addSlot = function (slotData) {
  this.slots.push(slotData);
  return this.save();
};

/**
 * Update a specific slot by index
 * @param {Number} slotIndex - Index of the slot
 * @param {Object} updateData - Data to update
 * @returns {Promise} - Updated document
 */
dailyLogSchema.methods.updateSlot = function (slotIndex, updateData) {
  if (slotIndex < 0 || slotIndex >= this.slots.length) {
    throw new Error("Invalid slot index");
  }
  this.slots[slotIndex] = { ...this.slots[slotIndex], ...updateData };
  return this.save();
};

/**
 * Remove a slot by index
 * @param {Number} slotIndex - Index of the slot to remove
 * @returns {Promise} - Updated document
 */
dailyLogSchema.methods.removeSlot = function (slotIndex) {
  if (slotIndex < 0 || slotIndex >= this.slots.length) {
    throw new Error("Invalid slot index");
  }
  this.slots.splice(slotIndex, 1);
  return this.save();
};

/**
 * Mark all slots as reviewed/processed
 * @returns {Promise} - Updated document
 */
dailyLogSchema.methods.markAsReviewed = function () {
  this.aiProcessed = true;
  return this.save();
};

/**
 * Get slots by category
 * @param {String} category - Category to filter by
 * @returns {Array} - Filtered slots
 */
dailyLogSchema.methods.getSlotsByCategory = function (category) {
  return this.slots.filter((slot) => slot.category === category);
};

/**
 * Calculate mood trend (for comparison with previous days)
 * @returns {Object} - Mood data
 */
dailyLogSchema.methods.getMoodData = function () {
  return {
    moodAverage: this.summary.moodAverage,
    energyAverage: this.summary.energyAverage,
    moodDistribution: this.slots.reduce((acc, slot) => {
      acc[slot.mood] = (acc[slot.mood] || 0) + 1;
      return acc;
    }, {}),
  };
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Get logs for a user within a date range
 * @param {ObjectId} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Array of logs
 */
dailyLogSchema.statics.findByDateRange = function (userId, startDate, endDate) {
  return this.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1 });
};

/**
 * Get user's logs for the last N days
 * @param {ObjectId} userId - User ID
 * @param {Number} days - Number of days
 * @returns {Promise<Array>} - Array of logs
 */
dailyLogSchema.statics.getRecentLogs = function (userId, days = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.findByDateRange(userId, startDate, endDate);
};

/**
 * Get user's weekly statistics
 * @param {ObjectId} userId - User ID
 * @param {Date} weekStart - Start of the week
 * @returns {Promise<Object>} - Weekly statistics
 */
dailyLogSchema.statics.getWeeklyStats = function (userId, weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: { $gte: weekStart, $lt: weekEnd },
      },
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: "$summary.totalScore" },
        avgCompletion: { $avg: "$summary.completionPercentage" },
        avgProductivity: { $avg: "$summary.productivityPercentage" },
        avgEnergy: { $avg: "$summary.energyAverage" },
        totalDays: { $sum: 1 },
        highScoreDays: {
          $sum: { $cond: [{ $gte: ["$summary.totalScore", 70] }, 1, 0] },
        },
      },
    },
  ]);
};

/**
 * Find best performing days
 * @param {ObjectId} userId - User ID
 * @param {Number} limit - Limit results
 * @returns {Promise<Array>} - Top performing days
 */
dailyLogSchema.statics.getBestDays = function (userId, limit = 5) {
  return this.find({ userId }).sort({ "summary.totalScore": -1 }).limit(limit);
};

/**
 * Find days that need improvement
 * @param {ObjectId} userId - User ID
 * @param {Number} limit - Limit results
 * @returns {Promise<Array>} - Low performing days
 */
dailyLogSchema.statics.getWorstDays = function (userId, limit = 5) {
  return this.find({ userId }).sort({ "summary.totalScore": 1 }).limit(limit);
};

/**
 * Get unprocessed logs requiring AI analysis
 * @returns {Promise<Array>} - Unprocessed logs
 */
dailyLogSchema.statics.getUnprocessedLogs = function () {
  return this.find({ aiProcessed: false }).limit(100);
};

/**
 * Calculate user's average statistics
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>} - Average statistics
 */
dailyLogSchema.statics.getUserAverageStats = function (userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        avgScore: { $avg: "$summary.totalScore" },
        avgCompletion: { $avg: "$summary.completionPercentage" },
        avgProductivity: { $avg: "$summary.productivityPercentage" },
        avgEnergy: { $avg: "$summary.energyAverage" },
        totalLogs: { $sum: 1 },
        bestScore: { $max: "$summary.totalScore" },
        worstScore: { $min: "$summary.totalScore" },
      },
    },
  ]);
};

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

/**
 * Date formatted as YYYY-MM-DD string
 */
dailyLogSchema.virtual("dateString").get(function () {
  return this.date.toISOString().split("T")[0];
});

/**
 * Total time spent (sum of actual durations)
 */
dailyLogSchema.virtual("totalTime").get(function () {
  return this.slots.reduce((sum, slot) => {
    return sum + (slot.actualDuration || 0);
  }, 0);
});

/**
 * Whether the day was successful (score >= 70)
 */
dailyLogSchema.virtual("isSuccessfulDay").get(function () {
  return this.summary.totalScore >= 70;
});

// ============================================================================
// EXPORT MODEL
// ============================================================================

module.exports = mongoose.model("DailyLog", dailyLogSchema);
