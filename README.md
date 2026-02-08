# Daily Routine Tracking API - Complete Documentation

## Overview

This is a production-ready Node.js/Express REST API for a daily routine tracking application. It provides comprehensive endpoints for managing daily logs, analyzing productivity patterns, and tracking routine metrics.

## 📋 Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [API Endpoints](#api-endpoints)
4. [Authentication](#authentication)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)
8. [Database Schema](#database-schema)

## Installation

### Prerequisites

- Node.js (v14+)
- MongoDB (v4.4+)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```env
   # MongoDB
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/routine

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-in-production

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=100
   ```

5. **Start the server**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start

   # Watch mode for testing
   npm run watch
   ```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `MONGODB_URI` | localhost:27017 | MongoDB connection string |
| `JWT_SECRET` | N/A | JWT signing secret (REQUIRED in production) |
| `NODE_ENV` | development | Environment (development/production) |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX` | 100 | Max requests per window |

### Feature Configuration

**CORS Settings**
- Frontend: `http://localhost:3000`
- Modify in `server.js` line 120

**Security Headers**
- Helmet.js configured for production-grade security
- HTTPS redirect enabled in production
- Content Security Policy enforced

**Request Logging**
- Winston logger with console and file transports
- Log levels: error, warn, info, debug
- Logs stored in `logs/` directory

## API Endpoints

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Response:** 201 Created
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "settings": { ... },
      "role": "user",
      "createdAt": "2026-02-09T10:30:00Z"
    }
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

#### Update Settings
```http
PUT /auth/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": {
    "morningTime": "06:00",
    "timezone": "EST",
    "theme": "dark"
  }
}
```

### Daily Logs Endpoints

#### Get Today's Log
```http
GET /logs
Authorization: Bearer <token>
```

#### Get Specific Date
```http
GET /logs/2026-02-09
Authorization: Bearer <token>
```

#### Create Log
```http
POST /logs
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2026-02-09"
}
```

#### Get Date Range
```http
GET /logs/range/2026-02-01/2026-02-28?page=1&limit=30
Authorization: Bearer <token>
```

#### Update Slot
```http
PATCH /logs/2026-02-09/slot/{slotId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "completed": true,
  "productive": true,
  "mood": "happy",
  "energyLevel": 8,
  "notes": "Great progress"
}
```

#### Mark Completed
```http
PATCH /logs/2026-02-09/complete/{slotId}
Authorization: Bearer <token>
```

#### Update Mood
```http
PATCH /logs/2026-02-09/mood/{slotId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "mood": "happy"
}
```

**Valid Moods:** happy, neutral, sad, angry, energetic, tired

### Analytics Endpoints

#### Weekly Statistics
```http
GET /analytics/weekly/2026-02-02
Authorization: Bearer <token>
```

#### Monthly Statistics
```http
GET /analytics/monthly/2026/02
Authorization: Bearer <token>
```

#### Current Streak
```http
GET /analytics/streak
Authorization: Bearer <token>
```

#### Behavior Patterns
```http
GET /analytics/patterns
Authorization: Bearer <token>
```

### Summary Endpoints

#### Today's Summary
```http
GET /summary/today
Authorization: Bearer <token>
```

#### Week Summary
```http
GET /summary/week
Authorization: Bearer <token>
```

#### Month Summary
```http
GET /summary/month
Authorization: Bearer <token>
```

#### Performance Comparison
```http
GET /summary/comparison?period=week
Authorization: Bearer <token>
```

## Authentication

### JWT Token System

1. **Token Generation**
   - Issued on successful login/registration
   - Valid for 7 days
   - Contains: userId, email, role

2. **Using Tokens**
   ```http
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Token Refresh**
   - Automatically issued if expiring within 1 day
   - Returned in response header: `X-New-Token`
   - No additional endpoint needed

4. **Logout**
   - Client-side: Remove token from localStorage
   - Server-side: Optional (for logging)

### Password Security

- Passwords hashed with bcryptjs (10 salt rounds)
- Never transmitted in responses
- Strong password requirements enforced
- Change password endpoint available

## Error Handling

### Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": "Additional information (optional)"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `NO_TOKEN` | 401 | Missing authentication token |
| `INVALID_TOKEN` | 401 | Token is invalid or malformed |
| `TOKEN_EXPIRED` | 401 | Token has expired |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required role |
| `EMAIL_ALREADY_EXISTS` | 409 | Email is already registered |
| `LOG_NOT_FOUND` | 404 | Daily log doesn't exist |
| `SLOT_NOT_FOUND` | 404 | Time slot doesn't exist |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INVALID_DATE_FORMAT` | 400 | Date format must be YYYY-MM-DD |

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register` | 3 requests | 15 minutes |
| `/auth/login` | 10 requests | 15 minutes |
| `/auth/change-password` | 5 requests | 1 hour |
| Other endpoints | 100 requests | 15 minutes |

### Rate Limit Headers

```http
RateLimit-Limit: 10
RateLimit-Remaining: 7
RateLimit-Reset: 1644425400
```

## Examples

### Complete Workflow

#### 1. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

#### 2. Create Daily Log
```bash
curl -X POST http://localhost:5000/api/logs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-09"
  }'
```

#### 3. Update Slot
```bash
curl -X PATCH http://localhost:5000/api/logs/2026-02-09/slot/<slotId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true,
    "productive": true,
    "mood": "happy",
    "energyLevel": 8
  }'
```

#### 4. Get Weekly Analytics
```bash
curl -X GET http://localhost:5000/api/analytics/weekly \
  -H "Authorization: Bearer <token>"
```

#### 5. Get Today's Summary
```bash
curl -X GET http://localhost:5000/api/summary/today \
  -H "Authorization: Bearer <token>"
```

## Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  settings: {
    morningTime: String,
    eveningTime: String,
    reminders: Boolean,
    timezone: String,
    theme: String,
    language: String,
    emailNotifications: Boolean
  },
  isActive: Boolean,
  isEmailVerified: Boolean,
  role: String,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### DailyLog Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  date: Date,
  slots: [
    {
      timeSlot: String,
      plannedActivity: String,
      completed: Boolean,
      productive: Boolean,
      mood: String,
      energyLevel: Number,
      notes: String,
      distractions: [String],
      startTime: Date,
      endTime: Date,
      actualDuration: Number,
      category: String,
      slotScore: Number
    }
  ],
  summary: {
    totalScore: Number,
    completionPercentage: Number,
    productivityPercentage: Number,
    moodAverage: String,
    energyAverage: Number,
    categoryBreakdown: Map
  },
  dayRating: Number,
  tags: [String],
  aiInsights: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Analytics Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  weekStart: Date,
  weekEnd: Date,
  weeklyStats: {
    totalSlotsPlanned: Number,
    totalSlotsCompleted: Number,
    completionRate: Number,
    averageScore: Number,
    highScoreDays: Number,
    bestTimeSlots: Array,
    worstTimeSlots: Array
  },
  trends: {
    productivityTrend: String,
    energyTrend: String,
    achievements: [String],
    recommendations: [String]
  },
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## File Structure

```
server/
├── models/
│   ├── User.js
│   ├── DailyLog.js
│   └── Analytics.js
├── controllers/
│   ├── authController.js
│   ├── logsController.js
│   ├── analyticsController.js
│   └── summaryController.js
├── routes/
│   ├── authRoutes.js
│   ├── logsRoutes.js
│   ├── analyticsRoutes.js
│   └── summaryRoutes.js
├── middleware/
│   ├── authMiddleware.js
│   └── validationMiddleware.js
├── utils/
│   └── logger.js
├── logs/
│   ├── combined.log
│   └── error.log
├── package.json
├── server.js
├── .env
└── .gitignore
```

## Performance Optimization

### Database Indexes

- User: email (unique), active status
- DailyLog: userId + date (compound, unique)
- Analytics: userId (unique), weekStart

### Caching Strategy

- Weekly analytics cached and updated on demand
- Stale data threshold: 6 hours
- TTL deletion: 1 year for old analytics

### Pagination

- Default: 30 items per page
- Maximum: 100 items per page
- Supports cursor-based pagination for large datasets

## Security Features

1. **Password Security**
   - Bcryptjs hashing (10 rounds)
   - Strong password validation
   - Change password functionality

2. **Authentication**
   - JWT tokens with 7-day expiry
   - Bearer token validation
   - Optional token auto-refresh

3. **Authorization**
   - Role-based access control
   - User data isolation
   - Protected endpoints

4. **Rate Limiting**
   - IP-based for public endpoints
   - User-based for authenticated endpoints
   - Prevents brute force attacks

5. **Input Validation**
   - Email validation
   - Date format validation
   - Enum validation for moods/categories
   - HTML escaping

6. **Security Headers**
   - Helmet.js integration
   - CORS configuration
   - Content Security Policy

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000

# Change port in .env
PORT=5001
```

**MongoDB Connection Failed**
- Verify MongoDB is running
- Check connection string in .env
- Ensure network access is allowed

**Authentication Failing**
- Verify JWT_SECRET is set in .env
- Check token format: `Bearer <token>`
- Token may have expired (7 days)

**Rate Limit Errors**
- Wait for window to reset
- Or disable in development mode

## Support & Contribution

For issues, feature requests, or contributions, please contact the development team.

---

**Last Updated:** February 9, 2026
**Version:** 1.0.0
**API Status:** Production Ready
