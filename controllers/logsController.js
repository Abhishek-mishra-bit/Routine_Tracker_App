/**
 * Daily Logs Controller
 * Handles all daily log and slot management operations
 */

const DailyLog = require("../models/DailyLog");
const Analytics = require("../models/Analytics");
const logger = require("../utils/logger");

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize date to start of day (00:00:00)
 * @param {Date|String} date - Date to normalize
 * @returns {Date} - Normalized date
 */
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get date string in YYYY-MM-DD format
 * @param {Date} date - Date object
 * @returns {String} - Formatted date string
 */
const getDateString = (date) => {
  return date.toISOString().split("T")[0];
};

/**
 * Format daily log response
 * @param {Object} log - Daily log document
 * @returns {Object} - Formatted log object
 */
const formatLogResponse = (log) => {
  return {
    id: log._id,
    userId: log.userId,
    date: getDateString(log.date),
    slots: log.slots,
    summary: log.summary,
    aiInsights: log.aiInsights,
    dayRating: log.dayRating,
    tags: log.tags,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
};

// ============================================================================
// DAILY LOG CRUD OPERATIONS
// ============================================================================

/**
 * GET /api/logs/:date?
 * Get daily log for a specific date (default: today)
 */
exports.getDailyLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    let { date } = req.params;

    // Default to today if no date provided
    if (!date) {
      date = getDateString(new Date());
    }

    logger.debug(`Fetching daily log for user ${userId} on ${date}`);

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        code: "INVALID_DATE_FORMAT",
      });
    }

    const normalizedDate = normalizeDate(new Date(date));

    // Find log
    const log = await DailyLog.findOne({
      userId,
      date: normalizedDate,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Daily log not found for this date",
        code: "LOG_NOT_FOUND",
      });
    }

    logger.debug(`Daily log retrieved for ${date}`);

    return res.status(200).json({
      success: true,
      message: "Daily log retrieved",
      data: {
        log: formatLogResponse(log),
      },
    });
  } catch (error) {
    logger.error(`Get daily log error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve daily log",
      code: "GET_LOG_ERROR",
    });
  }
};

/**
 * POST /api/logs
 * Create new daily log with default slots
 */
exports.createDailyLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, slots = [] } = req.body;

    logger.info(`Creating daily log for user ${userId} on ${date}`);

    // Validate date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        code: "INVALID_DATE_FORMAT",
      });
    }

    const normalizedDate = normalizeDate(new Date(date));

    // Check if log already exists
    const existingLog = await DailyLog.findOne({
      userId,
      date: normalizedDate,
    });

    if (existingLog) {
      return res.status(409).json({
        success: false,
        message: "Daily log already exists for this date",
        code: "LOG_ALREADY_EXISTS",
      });
    }

    // Create default slots if none provided
    const defaultSlots = slots.length > 0 ? slots : generateDefaultSlots();

    // Create new log
    const newLog = new DailyLog({
      userId,
      date: normalizedDate,
      slots: defaultSlots,
    });

    await newLog.save();

    logger.info(`Daily log created for ${date}`);

    return res.status(201).json({
      success: true,
      message: "Daily log created successfully",
      data: {
        log: formatLogResponse(newLog),
      },
    });
  } catch (error) {
    logger.error(`Create daily log error: ${error.message}`);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: "Validation error",
        code: "VALIDATION_ERROR",
        details: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create daily log",
      code: "CREATE_LOG_ERROR",
    });
  }
};

/**
 * PUT /api/logs/:date
 * Update entire daily log
 */
exports.updateDailyLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date } = req.params;
    const { slots, dayRating, tags, aiInsights, isSpecialDay } = req.body;

    logger.info(`Updating daily log for ${date}`);

    // Validate date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        code: "INVALID_DATE_FORMAT",
      });
    }

    const normalizedDate = normalizeDate(new Date(date));

    // Find and update log
    const log = await DailyLog.findOne({
      userId,
      date: normalizedDate,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Daily log not found",
        code: "LOG_NOT_FOUND",
      });
    }

    // Update fields
    if (slots) log.slots = slots;
    if (dayRating !== undefined) log.dayRating = dayRating;
    if (tags) log.tags = tags;
    if (aiInsights !== undefined) log.aiInsights = aiInsights;
    if (isSpecialDay !== undefined) log.isSpecialDay = isSpecialDay;

    await log.save();

    logger.info(`Daily log updated for ${date}`);

    return res.status(200).json({
      success: true,
      message: "Daily log updated successfully",
      data: {
        log: formatLogResponse(log),
      },
    });
  } catch (error) {
    logger.error(`Update daily log error: ${error.message}`);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: "Validation error",
        code: "VALIDATION_ERROR",
        details: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update daily log",
      code: "UPDATE_LOG_ERROR",
    });
  }
};

/**
 * DELETE /api/logs/:date
 * Delete daily log
 */
exports.deleteDailyLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date } = req.params;

    logger.info(`Deleting daily log for ${date}`);

    // Validate date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        code: "INVALID_DATE_FORMAT",
      });
    }

    const normalizedDate = normalizeDate(new Date(date));

    const result = await DailyLog.findOneAndDelete({
      userId,
      date: normalizedDate,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Daily log not found",
        code: "LOG_NOT_FOUND",
      });
    }

    logger.info(`Daily log deleted for ${date}`);

    return res.status(200).json({
      success: true,
      message: "Daily log deleted successfully",
    });
  } catch (error) {
    logger.error(`Delete daily log error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to delete daily log",
      code: "DELETE_LOG_ERROR",
    });
  }
};

/**
 * GET /api/logs/range/:start/:end
 * Get logs for date range with pagination
 */
exports.getLogsByDateRange = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { start, end } = req.params;
    const { page = 1, limit = 30 } = req.query;

    logger.debug(`Fetching logs range from ${start} to ${end}`);

    // Validate date format
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(end)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        code: "INVALID_DATE_FORMAT",
      });
    }

    const startDate = normalizeDate(new Date(start));
    const endDate = normalizeDate(new Date(end));

    // Ensure start is before end
    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date",
        code: "INVALID_DATE_RANGE",
      });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Fetch total count
    const total = await DailyLog.countDocuments({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Fetch logs
    const logs = await DailyLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    logger.debug(`Retrieved ${logs.length} logs for date range`);

    return res.status(200).json({
      success: true,
      message: "Logs retrieved for date range",
      data: {
        logs: logs.map(formatLogResponse),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error(`Get logs by date range error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve logs",
      code: "GET_RANGE_ERROR",
    });
  }
};

// ============================================================================
// SLOT OPERATIONS
// ============================================================================

/**
 * PATCH /api/logs/:date/slot/:slotId
 * Update specific time slot
 */
exports.updateSlot = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, slotId } = req.params;
    const updateData = req.body;

    logger.debug(`Updating slot ${slotId} for ${date}`);

    // Validate date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        code: "INVALID_DATE_FORMAT",
      });
    }

    const normalizedDate = normalizeDate(new Date(date));

    // Allowed fields to update
    const allowedFields = [
      "plannedActivity",
      "completed",
      "productive",
      "mood",
      "energyLevel",
      "notes",
      "distractions",
      "startTime",
      "endTime",
      "actualDuration",
      "priority",
      "category",
    ];

    // Validate allowed fields
    for (const key in updateData) {
      if (!allowedFields.includes(key)) {
        return res.status(400).json({
          success: false,
          message: `Field '${key}' is not allowed to be updated`,
          code: "INVALID_FIELD",
        });
      }
    }

    // Find log
    const log = await DailyLog.findOne({
      userId,
      date: normalizedDate,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Daily log not found",
        code: "LOG_NOT_FOUND",
      });
    }

    // Find slot
    const slotIndex = log.slots.findIndex((s) => s._id.toString() === slotId);

    if (slotIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
        code: "SLOT_NOT_FOUND",
      });
    }

    // Update slot
    const slot = log.slots[slotIndex];
    for (const key in updateData) {
      slot[key] = updateData[key];
    }

    // Recalculate slot score
    calculateSlotScore(slot);

    await log.save();

    logger.debug(`Slot ${slotId} updated`);

    return res.status(200).json({
      success: true,
      message: "Slot updated successfully",
      data: {
        slot: log.slots[slotIndex],
        summary: log.summary,
      },
    });
  } catch (error) {
    logger.error(`Update slot error: ${error.message}`);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: "Validation error",
        code: "VALIDATION_ERROR",
        details: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update slot",
      code: "UPDATE_SLOT_ERROR",
    });
  }
};

/**
 * PATCH /api/logs/:date/complete/:slotId
 * Mark slot as completed
 */
exports.completeSlot = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, slotId } = req.params;

    logger.debug(`Marking slot ${slotId} as complete`);

    const normalizedDate = normalizeDate(new Date(date));

    const log = await DailyLog.findOne({
      userId,
      date: normalizedDate,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Daily log not found",
        code: "LOG_NOT_FOUND",
      });
    }

    const slot = log.slots.find((s) => s._id.toString() === slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
        code: "SLOT_NOT_FOUND",
      });
    }

    slot.completed = true;
    slot.endTime = new Date();

    // Calculate actual duration if startTime exists
    if (slot.startTime) {
      slot.actualDuration = Math.round(
        (slot.endTime - slot.startTime) / (1000 * 60),
      );
    }

    calculateSlotScore(slot);
    await log.save();

    logger.debug(`Slot ${slotId} marked as complete`);

    return res.status(200).json({
      success: true,
      message: "Slot marked as completed",
      data: {
        slot,
        summary: log.summary,
      },
    });
  } catch (error) {
    logger.error(`Complete slot error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to complete slot",
      code: "COMPLETE_SLOT_ERROR",
    });
  }
};

/**
 * PATCH /api/logs/:date/productive/:slotId
 * Mark slot as productive
 */
exports.markProductive = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, slotId } = req.params;
    const { productive } = req.body;

    logger.debug(`Marking slot ${slotId} productivity`);

    if (typeof productive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Productive must be a boolean",
        code: "INVALID_INPUT",
      });
    }

    const normalizedDate = normalizeDate(new Date(date));

    const log = await DailyLog.findOne({
      userId,
      date: normalizedDate,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Daily log not found",
        code: "LOG_NOT_FOUND",
      });
    }

    const slot = log.slots.find((s) => s._id.toString() === slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
        code: "SLOT_NOT_FOUND",
      });
    }

    slot.productive = productive;
    calculateSlotScore(slot);
    await log.save();

    return res.status(200).json({
      success: true,
      message: "Slot productivity updated",
      data: {
        slot,
        summary: log.summary,
      },
    });
  } catch (error) {
    logger.error(`Mark productive error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to mark productivity",
      code: "PRODUCTIVITY_ERROR",
    });
  }
};

/**
 * PATCH /api/logs/:date/mood/:slotId
 * Update mood for slot
 */
exports.updateMood = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, slotId } = req.params;
    const { mood } = req.body;

    const validMoods = ["happy", "neutral", "sad", "angry", "energetic", "tired"];

    if (!validMoods.includes(mood)) {
      return res.status(400).json({
        success: false,
        message: `Mood must be one of: ${validMoods.join(", ")}`,
        code: "INVALID_MOOD",
      });
    }

    const normalizedDate = normalizeDate(new Date(date));

    const log = await DailyLog.findOne({
      userId,
      date: normalizedDate,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Daily log not found",
        code: "LOG_NOT_FOUND",
      });
    }

    const slot = log.slots.find((s) => s._id.toString() === slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
        code: "SLOT_NOT_FOUND",
      });
    }

    slot.mood = mood;
    calculateSlotScore(slot);
    await log.save();

    return res.status(200).json({
      success: true,
      message: "Mood updated",
      data: {
        slot,
        summary: log.summary,
      },
    });
  } catch (error) {
    logger.error(`Update mood error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to update mood",
      code: "MOOD_UPDATE_ERROR",
    });
  }
};

/**
 * PATCH /api/logs/:date/notes/:slotId
 * Update notes for slot
 */
exports.updateNotes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, slotId } = req.params;
    const { notes } = req.body;

    if (!notes || typeof notes !== "string") {
      return res.status(400).json({
        success: false,
        message: "Notes must be a non-empty string",
        code: "INVALID_INPUT",
      });
    }

    const normalizedDate = normalizeDate(new Date(date));

    const log = await DailyLog.findOne({
      userId,
      date: normalizedDate,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Daily log not found",
        code: "LOG_NOT_FOUND",
      });
    }

    const slot = log.slots.find((s) => s._id.toString() === slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
        code: "SLOT_NOT_FOUND",
      });
    }

    slot.notes = notes;
    await log.save();

    return res.status(200).json({
      success: true,
      message: "Notes updated",
      data: {
        slot,
      },
    });
  } catch (error) {
    logger.error(`Update notes error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to update notes",
      code: "NOTES_UPDATE_ERROR",
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS FOR SLOTS
// ============================================================================

/**
 * Generate default slots for a day (hourly from 7 AM to 10 PM)
 */
function generateDefaultSlots() {
  const slots = [];
  for (let hour = 7; hour < 22; hour++) {
    const startTime = String(hour).padStart(2, "0") + ":00";
    const endTime = String(hour + 1).padStart(2, "0") + ":00";
    slots.push({
      timeSlot: `${startTime}-${endTime}`,
      plannedActivity: `Activity ${hour - 6}`,
      completed: false,
      productive: false,
      mood: "neutral",
      energyLevel: 5,
      notes: "",
      distractions: [],
      category: "other",
    });
  }
  return slots;
}

/**
 * Calculate score for a slot based on completion and mood
 */
function calculateSlotScore(slot) {
  let score = 0;

  if (slot.completed) score += 40;
  if (slot.productive) score += 30;
  if (["happy", "energetic"].includes(slot.mood)) score += 15;
  if (slot.energyLevel >= 7) score += 15;

  const distractionPenalty = Math.min(slot.distractions.length * 5, 20);
  score = Math.max(0, score - distractionPenalty);

  slot.slotScore = score;
}
