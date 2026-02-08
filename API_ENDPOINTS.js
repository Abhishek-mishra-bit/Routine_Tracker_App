/**
 * API Routes & Endpoints Documentation
 * Complete reference for all API endpoints
 */

// ============================================================================
// AUTHENTICATION ENDPOINTS (/api/auth)
// ============================================================================

/**
 * POST /api/auth/register
 * Register a new user
 * Rate Limit: 3 requests per 15 minutes per IP
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "name": "John Doe"
 * }
 * 
 * Response: 201
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "user": {
 *       "id": "507f1f77bcf86cd799439011",
 *       "email": "user@example.com",
 *       "name": "John Doe",
 *       "settings": {
 *         "morningTime": "07:00",
 *         "eveningTime": "22:30",
 *         "reminders": true,
 *         "timezone": "UTC",
 *         "theme": "light",
 *         "language": "en",
 *         "emailNotifications": true
 *       },
 *       "isActive": true,
 *       "isEmailVerified": false,
 *       "role": "user",
 *       "createdAt": "2026-02-09T10:30:00Z"
 *     }
 *   }
 * }
 */

/**
 * POST /api/auth/login
 * Authenticate user and get JWT token
 * Rate Limit: 10 requests per 15 minutes per IP
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "user": { ... }
 *   }
 * }
 */

/**
 * GET /api/auth/me
 * Get current user profile
 * Protected: YES (requires valid JWT)
 * Headers: Authorization: Bearer <token>
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "message": "User profile retrieved",
 *   "data": {
 *     "user": { ... }
 *   }
 * }
 */

/**
 * GET /api/auth/verify
 * Verify if token is valid
 * Protected: YES
 * Headers: Authorization: Bearer <token>
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Token is valid",
 *   "data": {
 *     "userId": "...",
 *     "email": "...",
 *     "role": "..."
 *   }
 * }
 */

/**
 * POST /api/auth/refresh
 * Refresh JWT token (get new 7-day token)
 * Protected: YES
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Token refreshed successfully",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */

/**
 * PUT /api/auth/update
 * Update user settings
 * Protected: YES
 * 
 * Request Body:
 * {
 *   "settings": {
 *     "morningTime": "06:00",
 *     "eveningTime": "23:00",
 *     "timezone": "EST",
 *     "theme": "dark",
 *     "language": "en",
 *     "reminders": true,
 *     "emailNotifications": false
 *   }
 * }
 * 
 * Response: 200
 */

/**
 * PUT /api/auth/change-password
 * Change user password
 * Protected: YES
 * Rate Limit: 5 requests per hour per user
 * 
 * Request Body:
 * {
 *   "currentPassword": "OldPass123!",
 *   "newPassword": "NewPass456!",
 *   "confirmPassword": "NewPass456!"
 * }
 * 
 * Response: 200
 */

/**
 * POST /api/auth/logout
 * Logout user (client removes token)
 * Protected: Optional
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Logout successful"
 * }
 */

// ============================================================================
// DAILY LOGS ENDPOINTS (/api/logs)
// ============================================================================

/**
 * GET /api/logs/:date?
 * Get daily log for specific date
 * Protected: YES
 * Query Params: date (optional, YYYY-MM-DD, defaults to today)
 * 
 * Example: GET /api/logs/2026-02-09
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Daily log retrieved",
 *   "data": {
 *     "log": {
 *       "id": "...",
 *       "userId": "...",
 *       "date": "2026-02-09",
 *       "slots": [
 *         {
 *           "_id": "...",
 *           "timeSlot": "07:00-08:00",
 *           "plannedActivity": "Morning Exercise",
 *           "completed": true,
 *           "productive": true,
 *           "mood": "energetic",
 *           "energyLevel": 8,
 *           "notes": "Great workout",
 *           "distractions": [],
 *           "startTime": "2026-02-09T07:00:00Z",
 *           "endTime": "2026-02-09T08:00:00Z",
 *           "actualDuration": 60,
 *           "priority": "high",
 *           "category": "exercise",
 *           "slotScore": 95
 *         }
 *       ],
 *       "summary": {
 *         "totalScore": 78,
 *         "completionPercentage": 85,
 *         "productivityPercentage": 72,
 *         "totalPlanned": 15,
 *         "totalCompleted": 13,
 *         "totalProductive": 9,
 *         "moodAverage": "happy",
 *         "energyAverage": 7,
 *         "categoryBreakdown": { "work": 8, "exercise": 3, ... }
 *       },
 *       "dayRating": 4,
 *       "tags": ["productive"],
 *       "createdAt": "...",
 *       "updatedAt": "..."
 *     }
 *   }
 * }
 */

/**
 * POST /api/logs
 * Create new daily log
 * Protected: YES
 * 
 * Request Body:
 * {
 *   "date": "2026-02-09",
 *   "slots": [ ... ] (optional, uses defaults if not provided)
 * }
 * 
 * Response: 201
 */

/**
 * PUT /api/logs/:date
 * Update entire daily log
 * Protected: YES
 * URL: PUT /api/logs/2026-02-09
 * 
 * Request Body:
 * {
 *   "slots": [ ... ],
 *   "dayRating": 4,
 *   "tags": ["productive"],
 *   "aiInsights": "Great day!",
 *   "isSpecialDay": false
 * }
 * 
 * Response: 200
 */

/**
 * DELETE /api/logs/:date
 * Delete daily log
 * Protected: YES
 * URL: DELETE /api/logs/2026-02-09
 * 
 * Response: 200
 */

/**
 * GET /api/logs/range/:start/:end
 * Get logs for date range with pagination
 * Protected: YES
 * URL: GET /api/logs/range/2026-02-01/2026-02-28?page=1&limit=30
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 30, max: 100)
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Logs retrieved for date range",
 *   "data": {
 *     "logs": [ ... ],
 *     "pagination": {
 *       "page": 1,
 *       "limit": 30,
 *       "total": 60,
 *       "pages": 2
 *     }
 *   }
 * }
 */

/**
 * PATCH /api/logs/:date/slot/:slotId
 * Update specific time slot
 * Protected: YES
 * URL: PATCH /api/logs/2026-02-09/slot/507f1f77bcf86cd799439011
 * 
 * Request Body (any updatable field):
 * {
 *   "plannedActivity": "New activity",
 *   "completed": true,
 *   "productive": true,
 *   "mood": "happy",
 *   "energyLevel": 7,
 *   "notes": "Updated notes",
 *   "distractions": ["Phone", "Noise"],
 *   "priority": "high",
 *   "category": "work"
 * }
 * 
 * Response: 200
 */

/**
 * PATCH /api/logs/:date/complete/:slotId
 * Mark slot as completed
 * Protected: YES
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Slot marked as completed",
 *   "data": {
 *     "slot": { ... },
 *     "summary": { ... }
 *   }
 * }
 */

/**
 * PATCH /api/logs/:date/productive/:slotId
 * Mark slot as productive
 * Protected: YES
 * 
 * Request Body:
 * {
 *   "productive": true
 * }
 * 
 * Response: 200
 */

/**
 * PATCH /api/logs/:date/mood/:slotId
 * Update mood for slot
 * Protected: YES
 * 
 * Request Body:
 * {
 *   "mood": "happy" | "neutral" | "sad" | "angry" | "energetic" | "tired"
 * }
 * 
 * Response: 200
 */

/**
 * PATCH /api/logs/:date/notes/:slotId
 * Update notes for slot
 * Protected: YES
 * 
 * Request Body:
 * {
 *   "notes": "Updated notes about the slot"
 * }
 * 
 * Response: 200
 */

// ============================================================================
// ANALYTICS ENDPOINTS (/api/analytics)
// ============================================================================

/**
 * GET /api/analytics/weekly/:weekStart?
 * Get weekly statistics
 * Protected: YES
 * URL: GET /api/analytics/weekly/2026-02-02
 * Query: week start date (optional, defaults to current week)
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

/**
 * GET /api/analytics/monthly/:year/:month
 * Get monthly overview
 * Protected: YES
 * URL: GET /api/analytics/monthly/2026/02
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

/**
 * GET /api/analytics/streak
 * Get current streak information
 * Protected: YES
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

/**
 * GET /api/analytics/patterns
 * Get user behavior patterns (last 90 days)
 * Protected: YES
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Behavior patterns retrieved",
 *   "data": {
 *     "patterns": {
 *       "bestTimeSlots": [ ... ],
 *       "worstTimeSlots": [ ... ],
 *       "bestActivities": [ ... ],
 *       "moodPattern": { ... },
 *       "energyPattern": [ ... ],
 *       "productivityByCategory": { ... },
 *       "frequentDistractions": [ ... ]
 *     }
 *   }
 * }
 */

// ============================================================================
// SUMMARY ENDPOINTS (/api/summary)
// ============================================================================

/**
 * GET /api/summary/today
 * Get today's summary
 * Protected: YES
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
 *       "aiInsights": "...",
 *       "categoryBreakdown": { ... },
 *       "successfulDay": true
 *     },
 *     "slots": [ ... ]
 *   }
 * }
 */

/**
 * GET /api/summary/week
 * Get this week's summary
 * Protected: YES
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
 *     "dailyBreakdown": [ ... ]
 *   }
 * }
 */

/**
 * GET /api/summary/month
 * Get this month's summary
 * Protected: YES
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "message": "Month summary retrieved",
 *   "data": {
 *     "period": "February 2026",
 *     "summary": { ... },
 *     "weeklyBreakdown": [ ... ]
 *   }
 * }
 */

/**
 * GET /api/summary/comparison?period=week
 * Compare performance with previous period
 * Protected: YES
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
 *       "current": { ... },
 *       "previous": { ... },
 *       "difference": { ... },
 *       "percentageChange": { ... }
 *     }
 *   }
 * }
 */

// ============================================================================
// COMMON ERROR RESPONSES
// ============================================================================

/**
 * 400 - Bad Request (Validation Error)
 * {
 *   "success": false,
 *   "message": "Validation error",
 *   "code": "VALIDATION_ERROR",
 *   "details": {
 *     "field": "email",
 *     "message": "Please provide a valid email address"
 *   }
 * }
 */

/**
 * 401 - Unauthorized (Authentication Error)
 * {
 *   "success": false,
 *   "message": "Invalid token",
 *   "code": "INVALID_TOKEN"
 * }
 */

/**
 * 403 - Forbidden (Authorization Error)
 * {
 *   "success": false,
 *   "message": "Insufficient permissions",
 *   "code": "INSUFFICIENT_PERMISSIONS"
 * }
 */

/**
 * 404 - Not Found
 * {
 *   "success": false,
 *   "message": "Daily log not found for this date",
 *   "code": "LOG_NOT_FOUND"
 * }
 */

/**
 * 409 - Conflict
 * {
 *   "success": false,
 *   "message": "Email already registered",
 *   "code": "EMAIL_ALREADY_EXISTS"
 * }
 */

/**
 * 429 - Too Many Requests (Rate Limited)
 * {
 *   "success": false,
 *   "message": "Too many login attempts",
 *   "code": "RATE_LIMIT_EXCEEDED"
 * }
 */

/**
 * 500 - Internal Server Error
 * {
 *   "success": false,
 *   "message": "Failed to retrieve daily log",
 *   "code": "GET_LOG_ERROR",
 *   "requestId": "abc123def"
 * }
 */

// ============================================================================
// AUTHENTICATION HEADER FORMAT
// ============================================================================

/**
 * All protected endpoints require Authorization header:
 * Authorization: Bearer <JWT_TOKEN>
 * 
 * Token is valid for 7 days
 * If token is expiring soon (within 1 day), a new token will be returned
 * in response header: X-New-Token
 * 
 * Example request:
 * GET /api/logs/2026-02-09
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

module.exports = {
  documentation: "API Routes & Endpoints Reference",
  version: "1.0.0",
  baseUrl: "http://localhost:5000/api",
  authentication: "JWT Bearer Token",
  endpoints: {
    auth: ["/auth/register", "/auth/login", "/auth/me"],
    logs: ["/logs", "/logs/:date", "/logs/range/:start/:end"],
    analytics: [
      "/analytics/weekly",
      "/analytics/monthly/:year/:month",
      "/analytics/streak",
      "/analytics/patterns",
    ],
    summary: ["/summary/today", "/summary/week", "/summary/month"],
  },
};
