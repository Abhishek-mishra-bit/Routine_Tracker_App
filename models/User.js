/**
 * User Model
 * Represents a user in the daily routine tracking application
 *
 * Features:
 * - Password hashing with bcryptjs
 * - Settings with default values
 * - Methods to compare passwords and sanitize output
 * - Timestamp tracking
 */

const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const validator = require("validator");

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

const userSchema = new mongoose.Schema(
  {
    /**
     * User's email address (unique identifier)
     */
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email address"],
      index: true,
    },

    /**
     * User's name
     */
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    /**
     * Hashed password
     */
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Exclude from queries by default
      validate: [
        function (value) {
          // Password must contain at least one uppercase, one lowercase, one number, and one special character
          const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return strongPasswordRegex.test(value);
        },
        "Password must contain uppercase, lowercase, number, and special character",
      ],
    },

    /**
     * User settings and preferences
     */
    settings: {
      type: {
        /**
         * Morning routine start time (24-hour format)
         */
        morningTime: {
          type: String,
          default: "07:00",
          match: [
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Morning time must be in HH:mm format",
          ],
        },

        /**
         * Evening routine end time (24-hour format)
         */
        eveningTime: {
          type: String,
          default: "22:30",
          match: [
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Evening time must be in HH:mm format",
          ],
        },

        /**
         * Enable/disable reminders
         */
        reminders: {
          type: Boolean,
          default: true,
        },

        /**
         * User's timezone
         */
        timezone: {
          type: String,
          default: "UTC",
          enum: [
            "UTC",
            "EST",
            "CST",
            "MST",
            "PST",
            "GMT",
            "IST",
            "JST",
            "AEST",
          ],
        },

        /**
         * Theme preference
         */
        theme: {
          type: String,
          default: "light",
          enum: ["light", "dark"],
        },

        /**
         * Language preference
         */
        language: {
          type: String,
          default: "en",
          enum: ["en", "es", "fr", "de", "hi", "zh", "ja"],
        },

        /**
         * Enable/disable email notifications
         */
        emailNotifications: {
          type: Boolean,
          default: true,
        },
      },
      default: () => ({}), // Initialize with empty object, populated with defaults
    },

    /**
     * User's account status
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * Account verification status
     */
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * Profile picture URL
     */
    profileImage: {
      type: String,
      default: null,
    },

    /**
     * Last login timestamp
     */
    lastLogin: {
      type: Date,
      default: null,
    },

    /**
     * User role (for admin functionality)
     */
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "moderator"],
    },
  },
  {
    /**
     * Automatically add createdAt and updatedAt timestamps
     */
    timestamps: true,
    /**
     * Define JSON representation
     */
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ============================================================================
// INDEXES FOR PERFORMANCE
// ============================================================================

/**
 * Index on email for fast lookups
 */
userSchema.index({ email: 1 });

/**
 * Index on creation date for sorting users by registration date
 */
userSchema.index({ createdAt: -1 });

/**
 * Index on active status for filtering active users
 */
userSchema.index({ isActive: 1 });

/**
 * Compound index for finding active users by email
 */
userSchema.index({ isActive: 1, email: 1 });

// ============================================================================
// MIDDLEWARE - PRE-SAVE HOOKS
// ============================================================================

/**
 * Hash password before saving if it's new or modified
 * Uses bcryptjs with salt rounds of 10
 */
userSchema.pre("save", async function (next) {
  // Only hash password if it has been modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Ensure settings have default values on first save
 */
userSchema.pre("save", function (next) {
  if (!this.settings.morningTime) {
    this.settings.morningTime = "07:00";
  }
  if (!this.settings.eveningTime) {
    this.settings.eveningTime = "22:30";
  }
  if (this.settings.reminders === undefined) {
    this.settings.reminders = true;
  }
  if (!this.settings.timezone) {
    this.settings.timezone = "UTC";
  }
  next();
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Compare provided password with hashed password in database
 * @param {String} enteredPassword - The password to compare
 * @returns {Promise<Boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

/**
 * Return user data without sensitive information
 * Automatically called when converting to JSON
 * @returns {Object} - User object without password
 */
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

/**
 * Update last login timestamp
 * @returns {Promise} - Updated user document
 */
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

/**
 * Update user settings
 * @param {Object} newSettings - Settings to update
 * @returns {Promise} - Updated user document
 */
userSchema.methods.updateSettings = function (newSettings) {
  this.settings = { ...this.settings, ...newSettings };
  return this.save();
};

/**
 * Deactivate user account
 * @returns {Promise} - Updated user document
 */
userSchema.methods.deactivateAccount = function () {
  this.isActive = false;
  return this.save();
};

/**
 * Activate user account
 * @returns {Promise} - Updated user document
 */
userSchema.methods.activateAccount = function () {
  this.isActive = true;
  return this.save();
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find active users
 * @param {Object} query - Additional query conditions
 * @returns {Promise<Array>} - Array of active users
 */
userSchema.statics.findActive = function (query = {}) {
  return this.find({ isActive: true, ...query });
};

/**
 * Find user by email and return with password field (for login)
 * @param {String} email - User email
 * @returns {Promise<Object>} - User document with password
 */
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select("+password");
};

/**
 * Find verified users
 * @returns {Promise<Array>} - Array of verified users
 */
userSchema.statics.findVerified = function () {
  return this.find({ isEmailVerified: true, isActive: true });
};

/**
 * Get user statistics
 * @returns {Promise<Object>} - User statistics
 */
userSchema.statics.getUserStats = async function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: ["$isActive", 1, 0] },
        },
        verifiedUsers: {
          $sum: { $cond: ["$isEmailVerified", 1, 0] },
        },
        adminCount: {
          $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
        },
      },
    },
  ]);
};

/**
 * Count users registered in the last N days
 * @param {Number} days - Number of days
 * @returns {Promise<Number>} - Count of users
 */
userSchema.statics.recentUsersCount = function (days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return this.countDocuments({ createdAt: { $gte: date } });
};

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

/**
 * Account age in days
 */
userSchema.virtual("accountAgeDays").get(function () {
  const now = new Date();
  const createdDate = new Date(this.createdAt);
  const diffTime = Math.abs(now - createdDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Days since last login
 */
userSchema.virtual("daysSinceLastLogin").get(function () {
  if (!this.lastLogin) return null;
  const now = new Date();
  const lastLoginDate = new Date(this.lastLogin);
  const diffTime = Math.abs(now - lastLoginDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ============================================================================
// EXPORT MODEL
// ============================================================================

module.exports = mongoose.model("User", userSchema);
