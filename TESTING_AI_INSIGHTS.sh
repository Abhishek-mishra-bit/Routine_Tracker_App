#!/bin/bash

###############################################################################
# AI Insights Testing Guide
# 
# Test all AI insights endpoints with curl commands
# Before running, update variables:
# - BEARER_TOKEN: Your JWT token
# - BASE_URL: Server URL (default: http://localhost:5000)
###############################################################################

# Configuration
BASE_URL="http://localhost:5000"
BEARER_TOKEN="your-jwt-token-here"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AI INSIGHTS API TESTING GUIDE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Using token: ${BEARER_TOKEN:0:20}..."
echo ""

# ============================================================================
# TEST 1: Service Status
# ============================================================================

echo -e "${BLUE}TEST 1: Check AI Service Status${NC}"
echo "GET /api/insights/status"
echo ""

curl -X GET "$BASE_URL/api/insights/status" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# TEST 2: Daily Insights (Today)
# ============================================================================

echo -e "${BLUE}TEST 2: Get Daily Insights (Today)${NC}"
echo "GET /api/insights/daily"
echo ""

curl -X GET "$BASE_URL/api/insights/daily" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# TEST 3: Daily Insights (Specific Date)
# ============================================================================

echo -e "${BLUE}TEST 3: Get Daily Insights (Specific Date)${NC}"
echo "GET /api/insights/daily/2026-02-09"
echo ""

curl -X GET "$BASE_URL/api/insights/daily/2026-02-09" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# TEST 4: Weekly Insights (Current Week)
# ============================================================================

echo -e "${BLUE}TEST 4: Get Weekly Insights (Current Week)${NC}"
echo "GET /api/insights/weekly"
echo ""

curl -X GET "$BASE_URL/api/insights/weekly" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# TEST 5: Weekly Insights (Specific Week)
# ============================================================================

echo -e "${BLUE}TEST 5: Get Weekly Insights (Specific Week)${NC}"
echo "GET /api/insights/weekly/2026-02-02"
echo ""

curl -X GET "$BASE_URL/api/insights/weekly/2026-02-02" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# TEST 6: Personalized Recommendations
# ============================================================================

echo -e "${BLUE}TEST 6: Get Personalized Recommendations${NC}"
echo "GET /api/insights/recommendations"
echo ""

curl -X GET "$BASE_URL/api/insights/recommendations" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# TEST 7: Optimal Schedule Prediction
# ============================================================================

echo -e "${BLUE}TEST 7: Get Optimal Schedule Prediction${NC}"
echo "GET /api/insights/schedule"
echo ""

curl -X GET "$BASE_URL/api/insights/schedule" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# TEST 8: Comprehensive Insights (All at Once)
# ============================================================================

echo -e "${BLUE}TEST 8: Get Comprehensive Insights (Dashboard)${NC}"
echo "GET /api/insights/comprehensive"
echo ""

curl -X GET "$BASE_URL/api/insights/comprehensive" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# TEST 9: Cache Status
# ============================================================================

echo -e "${BLUE}TEST 9: Check Cache Status${NC}"
echo "GET /api/insights/cache"
echo ""

curl -X GET "$BASE_URL/api/insights/cache" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# TEST 10: Set Insight Preferences
# ============================================================================

echo -e "${BLUE}TEST 10: Set Insight Preferences${NC}"
echo "POST /api/insights/preferences"
echo ""

curl -X POST "$BASE_URL/api/insights/preferences" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "insightPreferences": {
      "enableDailyInsights": true,
      "enableWeeklyInsights": true,
      "enableRecommendations": true,
      "enableSchedulePrediction": true,
      "insightFrequency": "daily",
      "preferredInsightTime": "09:00",
      "maxRecommendations": 5
    }
  }' | jq .

echo ""
echo ""

# ============================================================================
# TEST 11: Clear Cache
# ============================================================================

echo -e "${BLUE}TEST 11: Clear All Cache${NC}"
echo "DELETE /api/insights/cache"
echo ""

curl -X DELETE "$BASE_URL/api/insights/cache" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# TEST 12: Clear Specific Cache Entry
# ============================================================================

echo -e "${BLUE}TEST 12: Clear Specific Cache Entry${NC}"
echo "DELETE /api/insights/cache?key=daily:userId:2026-02-09"
echo ""

curl -X DELETE "$BASE_URL/api/insights/cache?key=daily:userId:2026-02-09" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PERFORMANCE TESTS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Measure response time for daily insights
echo -e "${BLUE}Performance Test 1: Daily Insights Response Time${NC}"
echo "Running 5 consecutive requests..."
echo ""

for i in {1..5}; do
  echo "Request $i:"
  time curl -s -X GET "$BASE_URL/api/insights/daily" \
    -H "Authorization: Bearer $BEARER_TOKEN" \
    -H "Content-Type: application/json" > /dev/null
  echo ""
done

echo ""

# Test 2: Test cache effectiveness
echo -e "${BLUE}Performance Test 2: Cache Effectiveness${NC}"
echo "Comparing first request (no cache) vs subsequent requests (cached)"
echo ""

echo "First request (building cache):"
time curl -s -X GET "$BASE_URL/api/insights/comprehensive" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" > /dev/null

echo ""
echo "Second request (from cache - should be much faster):"
time curl -s -X GET "$BASE_URL/api/insights/comprehensive" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" > /dev/null

echo ""
echo ""

# ============================================================================
# CONCURRENT REQUEST TEST
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CONCURRENT REQUEST TEST${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}Running 10 concurrent requests to test concurrency handling${NC}"
echo ""

for i in {1..10}; do
  curl -s -X GET "$BASE_URL/api/insights/daily" \
    -H "Authorization: Bearer $BEARER_TOKEN" \
    -H "Content-Type: application/json" | jq '.data.insights.motivationScore' &
done

wait

echo ""
echo "All concurrent requests completed"
echo ""

# ============================================================================
# ERROR HANDLING TESTS
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ERROR HANDLING TESTS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Missing authentication
echo -e "${BLUE}Error Test 1: Request without authentication${NC}"
echo "Expected: 401 Unauthorized"
echo ""

curl -X GET "$BASE_URL/api/insights/daily" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# Test 2: Invalid date format
echo -e "${BLUE}Error Test 2: Invalid date format${NC}"
echo "GET /api/insights/daily/invalid-date"
echo ""

curl -X GET "$BASE_URL/api/insights/daily/invalid-date" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# Test 3: Non-existent date
echo -e "${BLUE}Error Test 3: Non-existent date${NC}"
echo "GET /api/insights/daily/1900-01-01"
echo ""

curl -X GET "$BASE_URL/api/insights/daily/1900-01-01" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# ============================================================================
# BACKEND VERIFICATION
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BACKEND VERIFICATION${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}Checking current backend configuration${NC}"
echo ""

BACKEND=$(curl -s -X GET "$BASE_URL/api/insights/status" \
  -H "Authorization: Bearer $BEARER_TOKEN" | jq -r '.data.backend')

echo "Current Backend: $BACKEND"
echo ""

if [ "$BACKEND" = "LOCAL" ]; then
  echo -e "${GREEN}✓ Using LOCAL backend (free, no API calls)${NC}"
elif [ "$BACKEND" = "OPENAI" ]; then
  echo -e "${GREEN}✓ Using OPENAI backend (requires API key)${NC}"
elif [ "$BACKEND" = "HUGGINGFACE" ]; then
  echo -e "${GREEN}✓ Using HUGGINGFACE backend (free tier)${NC}"
else
  echo -e "${RED}✗ Unknown backend: $BACKEND${NC}"
fi

echo ""
echo ""

# ============================================================================
# LOAD TEST
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}LOAD TEST${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}Sending 50 requests to test server load handling${NC}"
echo "This may take a minute or two..."
echo ""

START=$(date +%s%N)

for i in {1..50}; do
  curl -s -X GET "$BASE_URL/api/insights/daily" \
    -H "Authorization: Bearer $BEARER_TOKEN" \
    -H "Content-Type: application/json" > /dev/null &
done

wait

END=$(date +%s%N)
DURATION=$((($END - $START) / 1000000))

echo "Load test completed in ${DURATION}ms"
echo "Average time per request: $((DURATION / 50))ms"
echo "Requests per second: $((50000 / DURATION))"
echo ""
echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}TESTING SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo "✓ Service Status check"
echo "✓ Daily Insights (today & specific date)"
echo "✓ Weekly Insights (current & specific week)"
echo "✓ Recommendations generation"
echo "✓ Schedule Prediction"
echo "✓ Comprehensive Insights"
echo "✓ Cache Management"
echo "✓ Preference Settings"
echo "✓ Performance Testing"
echo "✓ Concurrent Requests"
echo "✓ Error Handling"
echo "✓ Backend Verification"
echo "✓ Load Testing"
echo ""

echo -e "${GREEN}All tests completed!${NC}"
echo ""

# ============================================================================
# POSTMAN COLLECTION
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}POSTMAN COLLECTION IMPORT${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo "To import these tests in Postman:"
echo ""
echo "1. Open Postman"
echo "2. Click 'Import' button"
echo "3. Paste this JSON:"
echo ""

cat << 'EOF' | jq .
{
  "info": {
    "name": "AI Insights API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Service Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/insights/status",
          "host": ["{{baseUrl}}"],
          "path": ["api", "insights", "status"]
        }
      }
    },
    {
      "name": "Daily Insights",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/insights/daily",
          "host": ["{{baseUrl}}"],
          "path": ["api", "insights", "daily"]
        }
      }
    },
    {
      "name": "Weekly Insights",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/insights/weekly",
          "host": ["{{baseUrl}}"],
          "path": ["api", "insights", "weekly"]
        }
      }
    },
    {
      "name": "Recommendations",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/insights/recommendations",
          "host": ["{{baseUrl}}"],
          "path": ["api", "insights", "recommendations"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
EOF

echo ""
echo ""

# ============================================================================
# END
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo "Testing guide completed!"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "For detailed documentation, see:"
echo "  - API_INSIGHTS.md (API reference)"
echo "  - AI_INSIGHTS_SETUP.md (Setup guide)"
echo ""
