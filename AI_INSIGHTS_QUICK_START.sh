#!/bin/bash

# ============================================================================
# AI INSIGHTS QUICK START GUIDE
# ============================================================================

echo "=============================================="
echo "AI INSIGHTS - QUICK START GUIDE"
echo "=============================================="
echo ""

# Configuration
BEARER_TOKEN=${1:-"your-jwt-token"}
BASE_URL="http://localhost:5000"

if [ "$BEARER_TOKEN" = "your-jwt-token" ]; then
  echo "⚠️  No bearer token provided"
  echo ""
  echo "Usage: ./AI_INSIGHTS_QUICK_START.sh YOUR_JWT_TOKEN"
  echo ""
  echo "Examples:"
  echo "  ./AI_INSIGHTS_QUICK_START.sh eyJhbGc..."
  echo ""
  exit 1
fi

echo "Using token: ${BEARER_TOKEN:0:20}..."
echo "Base URL: $BASE_URL"
echo ""

# ============================================================================
# STEP 1: Verify Service Status
# ============================================================================

echo "STEP 1: Checking AI Service Status..."
echo ""

STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/insights/status" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json")

BACKEND=$(echo "$STATUS_RESPONSE" | jq -r '.data.backend // "unknown"')
SERVICE_AVAILABLE=$(echo "$STATUS_RESPONSE" | jq -r '.data.available // false')

echo "Backend: $BACKEND"
echo "Service Available: $SERVICE_AVAILABLE"
echo ""

if [ "$SERVICE_AVAILABLE" != "true" ]; then
  echo "❌ Service not available. Check configuration."
  exit 1
fi

echo "✓ Service is running"
echo ""

# ============================================================================
# STEP 2: Get Daily Insights
# ============================================================================

echo "STEP 2: Getting Daily Insights..."
echo ""

DAILY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/insights/daily" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json")

DAILY_SUCCESS=$(echo "$DAILY_RESPONSE" | jq -r '.success // false')

if [ "$DAILY_SUCCESS" = "true" ]; then
  echo "✓ Daily insights retrieved"
  echo ""
  echo "Daily Insights:"
  echo "$DAILY_RESPONSE" | jq '.data.insights | {
    completionRate,
    motivationScore,
    moodTrend,
    dayScore,
    summary
  }'
else
  echo "⚠️  Could not retrieve daily insights"
  echo "Note: Need at least one log entry for insights"
fi

echo ""

# ============================================================================
# STEP 3: Get Weekly Insights
# ============================================================================

echo "STEP 3: Getting Weekly Insights..."
echo ""

WEEKLY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/insights/weekly" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json")

WEEKLY_SUCCESS=$(echo "$WEEKLY_RESPONSE" | jq -r '.success // false')

if [ "$WEEKLY_SUCCESS" = "true" ]; then
  echo "✓ Weekly insights retrieved"
  echo ""
  echo "Weekly Summary:"
  echo "$WEEKLY_RESPONSE" | jq '.data.insights.scores'
else
  echo "⚠️  Could not retrieve weekly insights"
  echo "Note: Need multiple log entries for weekly analysis"
fi

echo ""

# ============================================================================
# STEP 4: Get Recommendations
# ============================================================================

echo "STEP 4: Getting Personalized Recommendations..."
echo ""

RECS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/insights/recommendations" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json")

RECS_SUCCESS=$(echo "$RECS_RESPONSE" | jq -r '.success // false')

if [ "$RECS_SUCCESS" = "true" ]; then
  REC_COUNT=$(echo "$RECS_RESPONSE" | jq '.data.count // 0')
  echo "✓ Retrieved $REC_COUNT recommendations"
  echo ""
  echo "Your Top Recommendation:"
  echo "$RECS_RESPONSE" | jq '.data.recommendations[0] | {
    title,
    description,
    priority,
    action
  }'
else
  echo "⚠️  Could not retrieve recommendations"
  echo "Note: Need sufficient logged activity for recommendations"
fi

echo ""

# ============================================================================
# STEP 5: Get Optimal Schedule
# ============================================================================

echo "STEP 5: Getting Predicted Optimal Schedule..."
echo ""

SCHEDULE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/insights/schedule" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json")

SCHEDULE_SUCCESS=$(echo "$SCHEDULE_RESPONSE" | jq -r '.success // false')

if [ "$SCHEDULE_SUCCESS" = "true" ]; then
  echo "✓ Schedule prediction retrieved"
  echo ""
  echo "Best Time Slot:"
  echo "$SCHEDULE_RESPONSE" | jq '.data.bestTimeSlot'
  echo ""
  echo "Sample Schedule:"
  echo "$SCHEDULE_RESPONSE" | jq '.data.schedule[0:3]'
else
  echo "⚠️  Could not generate schedule"
  echo "Note: Need at least 7 days of logged activity (minimum)"
fi

echo ""

# ============================================================================
# STEP 6: Check Cache Status
# ============================================================================

echo "STEP 6: Checking Cache Status..."
echo ""

CACHE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/insights/cache" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json")

CACHE_SIZE=$(echo "$CACHE_RESPONSE" | jq '.data.cacheSize // 0')
CACHE_TTL=$(echo "$CACHE_RESPONSE" | jq '.data.cacheTTL // 0')

echo "✓ Cache Status:"
echo "  Entries: $CACHE_SIZE"
echo "  TTL: ${CACHE_TTL} minutes"
echo ""

# ============================================================================
# FINAL SUMMARY
# ============================================================================

echo "=============================================="
echo "✓ QUICK START COMPLETED"
echo "=============================================="
echo ""
echo "Next Steps:"
echo "1. Integrate insights into your frontend"
echo "2. Check API_INSIGHTS.md for all endpoints"
echo "3. Review AI_INSIGHTS_SETUP.md for configuration"
echo "4. Run TESTING_AI_INSIGHTS.sh for comprehensive tests"
echo ""
echo "Key Endpoints:"
echo "  • /api/insights/daily - Daily analysis"
echo "  • /api/insights/weekly - Weekly patterns"
echo "  • /api/insights/recommendations - Smart suggestions"
echo "  • /api/insights/schedule - Optimal timing"
echo "  • /api/insights/comprehensive - All at once"
echo ""
echo "Documentation:"
echo "  • API_INSIGHTS.md - Complete API reference"
echo "  • AI_INSIGHTS_SETUP.md - Setup guide"
echo "  • AI_INSIGHTS_SUMMARY.md - Implementation details"
echo ""
