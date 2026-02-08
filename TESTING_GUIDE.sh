#!/usr/bin/env node

/**
 * API Testing Guide - Quick Reference
 * Copy and paste these curl commands to test the API
 */

// ============================================================================
// SETUP
// ============================================================================

// Set these variables
// const BASE_URL = 'http://localhost:5000/api';
// const TOKEN = 'your-jwt-token-here';
// const USER_EMAIL = 'user@example.com';
// const USER_PASSWORD = 'SecurePass123!';

// ============================================================================
// 1. AUTHENTICATION TESTS
// ============================================================================

/**
 * Register a new user
 */
// POST /auth/register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'

/**
 * Login and get token
 */
// POST /auth/login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'

// Store the token from response for use in other requests

/**
 * Get current user profile
 */
// GET /auth/me
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Verify token
 */
// GET /auth/verify
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Refresh token
 */
// POST /auth/refresh
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Update user settings
 */
// PUT /auth/update
curl -X PUT http://localhost:5000/api/auth/update \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "morningTime": "06:00",
      "timezone": "EST",
      "theme": "dark",
      "language": "en"
    }
  }'

/**
 * Change password
 */
// PUT /auth/change-password
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewPass456!",
    "confirmPassword": "NewPass456!"
  }'

/**
 * Logout
 */
// POST /auth/logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

// ============================================================================
// 2. DAILY LOGS TESTS
// ============================================================================

/**
 * Create a new daily log
 */
// POST /logs
curl -X POST http://localhost:5000/api/logs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-09"
  }'

/**
 * Get today's log
 */
// GET /logs
curl -X GET http://localhost:5000/api/logs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Get specific date log
 */
// GET /logs/:date
curl -X GET http://localhost:5000/api/logs/2026-02-09 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Get logs for date range
 */
// GET /logs/range/:start/:end
curl -X GET "http://localhost:5000/api/logs/range/2026-02-01/2026-02-28?page=1&limit=30" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Update entire daily log
 */
// PUT /logs/:date
curl -X PUT http://localhost:5000/api/logs/2026-02-09 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "dayRating": 4,
    "tags": ["productive", "focused"],
    "isSpecialDay": false
  }'

/**
 * Delete daily log
 */
// DELETE /logs/:date
curl -X DELETE http://localhost:5000/api/logs/2026-02-09 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

// ============================================================================
// 3. SLOT OPERATIONS TESTS
// ============================================================================

// Note: Replace {slotId} with actual slot MongoDB ObjectId

/**
 * Update specific slot
 */
// PATCH /logs/:date/slot/:slotId
curl -X PATCH http://localhost:5000/api/logs/2026-02-09/slot/{slotId} \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "plannedActivity": "Morning Exercise",
    "energyLevel": 8,
    "notes": "Great workout today!"
  }'

/**
 * Mark slot as completed
 */
// PATCH /logs/:date/complete/:slotId
curl -X PATCH http://localhost:5000/api/logs/2026-02-09/complete/{slotId} \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Mark slot as productive
 */
// PATCH /logs/:date/productive/:slotId
curl -X PATCH http://localhost:5000/api/logs/2026-02-09/productive/{slotId} \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "productive": true
  }'

/**
 * Update mood for slot
 */
// PATCH /logs/:date/mood/:slotId
curl -X PATCH http://localhost:5000/api/logs/2026-02-09/mood/{slotId} \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "mood": "happy"
  }'

// Valid moods: happy, neutral, sad, angry, energetic, tired

/**
 * Update notes for slot
 */
// PATCH /logs/:date/notes/:slotId
curl -X PATCH http://localhost:5000/api/logs/2026-02-09/notes/{slotId} \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Updated notes about the activity"
  }'

// ============================================================================
// 4. ANALYTICS TESTS
// ============================================================================

/**
 * Get weekly statistics
 */
// GET /analytics/weekly
curl -X GET http://localhost:5000/api/analytics/weekly \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Get weekly statistics for specific week
 */
// GET /analytics/weekly/:weekStart
curl -X GET http://localhost:5000/api/analytics/weekly/2026-02-02 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Get monthly statistics
 */
// GET /analytics/monthly/:year/:month
curl -X GET http://localhost:5000/api/analytics/monthly/2026/02 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Get current streak
 */
// GET /analytics/streak
curl -X GET http://localhost:5000/api/analytics/streak \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Get behavior patterns
 */
// GET /analytics/patterns
curl -X GET http://localhost:5000/api/analytics/patterns \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

// ============================================================================
// 5. SUMMARY TESTS
// ============================================================================

/**
 * Get today's summary
 */
// GET /summary/today
curl -X GET http://localhost:5000/api/summary/today \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Get week summary
 */
// GET /summary/week
curl -X GET http://localhost:5000/api/summary/week \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Get month summary
 */
// GET /summary/month
curl -X GET http://localhost:5000/api/summary/month \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Get performance comparison
 */
// GET /summary/comparison?period=week
curl -X GET "http://localhost:5000/api/summary/comparison?period=week" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

// ============================================================================
// USEFUL SCRIPTS
// ============================================================================

/**
 * Test Script: Complete Workflow
 * Run these commands in sequence
 */

// 1. Register
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }' | jq -r '.data.token')

echo "Token: $TOKEN"

// 2. Create log
curl -X POST http://localhost:5000/api/logs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-09"
  }'

// 3. Get today's summary
curl -X GET http://localhost:5000/api/summary/today \
  -H "Authorization: Bearer $TOKEN" | jq '.'

// ============================================================================
// USING WITH POSTMAN
// ============================================================================

/**
 * Import this into Postman as a collection
 * 
 * 1. Create a collection "Daily Routine API"
 * 2. Add variable: token = ""
 * 3. Set base URL: {{BASE_URL}}/api where BASE_URL = http://localhost:5000
 * 
 * After login, extract token:
 * Tests tab: pm.environment.set("token", pm.response.json().data.token)
 */

// ============================================================================
// COMMON TESTING PATTERNS
// ============================================================================

/**
 * Test Full Day Flow
 */

// 1. Create log for today
// 2. Get first slot ID from response
// 3. Mark slots as completed
// 4. Update moods for slots
// 5. Get today's summary
// 6. Check streak
// 7. Get weekly analytics

/**
 * Test Error Handling
 */

// 1. Login with wrong password (401)
// 2. Access protected route without token (401)
// 3. Invalid date format (400)
// 4. Non-existent log (404)
// 5. Duplicate email registration (409)

/**
 * Test Rate Limiting
 */

// 1. Register user 4 times within 15 minutes
// 2. Should get 429 on 4th attempt
// 3. Wait 15 minutes or clear rate limiter

// ============================================================================
// DEBUGGING
// ============================================================================

/**
 * Check server health
 */
curl -X GET http://localhost:5000/health

/**
 * Check API status
 */
curl -X GET http://localhost:5000/api/status

/**
 * View request details (with verbose)
 */
curl -v -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

/**
 * Pretty print JSON response
 */
curl -s -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.'

/**
 * Save response to file
 */
curl -X GET http://localhost:5000/api/summary/today \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o response.json

// ============================================================================
// ENVIRONMENT SETUP FOR TESTING
// ============================================================================

/**
 * Create test data seed script (.env for testing)
 */
TEST_USER_EMAIL=testuser@test.com
TEST_USER_PASSWORD=TestPass123!
TEST_USER_NAME=Test User
API_BASE_URL=http://localhost:5000/api

/**
 * Bash script for quick testing
 */

#!/bin/bash

BASE_URL="http://localhost:5000/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Register user
echo "Registering user..."
RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.data.token')

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  echo "Token: $TOKEN"
else
  echo -e "${RED}✗ Registration failed${NC}"
  echo $RESPONSE | jq '.'
  exit 1
fi

# Create log
echo "Creating daily log..."
curl -s -X POST $BASE_URL/logs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-09"
  }' | jq '.'

// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/*
✓ Authentication
  [ ] Register new user
  [ ] Login with correct credentials
  [ ] Login with wrong credentials (401)
  [ ] Get user profile
  [ ] Update settings
  [ ] Change password
  [ ] Verify token
  [ ] Refresh token
  [ ] Token expiry handling

✓ Daily Logs
  [ ] Create log
  [ ] Get today's log
  [ ] Get specific date
  [ ] Get date range with pagination
  [ ] Update entire log
  [ ] Update single slot
  [ ] Mark slot completed
  [ ] Mark slot productive
  [ ] Update mood
  [ ] Update notes
  [ ] Delete log

✓ Analytics
  [ ] Weekly statistics
  [ ] Monthly statistics
  [ ] Streak information
  [ ] Behavior patterns
  [ ] Best time slots
  [ ] Best activities
  [ ] Distraction analysis
  [ ] Energy patterns

✓ Summary
  [ ] Today's summary
  [ ] Week summary
  [ ] Month summary
  [ ] Performance comparison

✓ Error Handling
  [ ] Invalid token
  [ ] Expired token
  [ ] Missing token
  [ ] Invalid date format
  [ ] Non-existent resources
  [ ] Duplicate email
  [ ] Validation errors
  [ ] Rate limiting

✓ Performance
  [ ] Response times < 200ms
  [ ] Pagination works correctly
  [ ] Caching improves speed
  [ ] No N+1 queries
*/

module.exports = {
  documentation: "API Testing Guide",
  version: "1.0.0",
  note: "Replace YOUR_TOKEN_HERE with actual JWT token from login response"
};
