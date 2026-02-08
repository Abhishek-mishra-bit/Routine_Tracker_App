# AI Insights API Documentation

## Overview

The AI Insights API provides AI-powered productivity insights, personalized recommendations, and schedule predictions. The system uses a modular backend architecture supporting multiple AI providers:

- **LOCAL (Default)**: Rule-based analysis - completely free, no API keys needed
- **OPENAI**: GPT-3.5-turbo for advanced analysis - requires free API credits
- **HUGGINGFACE**: Text generation models - requires free tier API key

## Features

### Daily Insights
- Completion rate analysis
- Productivity trends
- Mood and energy tracking
- Performance highlights and improvement areas
- Motivation scoring

### Weekly Analysis
- Pattern detection across the week
- Best/worst days identification
- Category performance breakdown
- Time slot effectiveness analysis
- Consistency scoring

### Personalized Recommendations
- Activity timing optimization
- Distraction minimization strategies
- Energy management guidance
- Mood-based wellness tips
- Goal achievement suggestions

### Schedule Prediction
- Optimal time slot identification
- Task recommendation by hour
- Energy level forecasting
- Based on 7+ days of historical data

## Configuration

### Environment Variables

Add to `.env`:

```bash
# AI Service Configuration
AI_SERVICE=LOCAL                    # LOCAL | OPENAI | HUGGINGFACE
OPENAI_API_KEY=sk-xxx              # Optional - for OpenAI backend
HUGGINGFACE_API_KEY=hf_xxx         # Optional - for Hugging Face backend
```

### Backend Comparison

| Feature | LOCAL | OPENAI | HUGGINGFACE |
|---------|-------|--------|-------------|
| Cost | FREE | Free tier | Free tier |
| API Key Required | No | Yes | Yes |
| Processing Speed | Fast (local) | Medium | Variable |
| Accuracy | Good | Excellent | Good |
| Customization | Limited | Excellent | Good |
| Offline Support | Yes | No | No |
| Best For | Quick start | Production | Budget-friendly |

## Endpoints

All endpoints require authentication via `Authorization: Bearer <JWT_TOKEN>` header.

### 1. Daily Insights

**GET** `/api/insights/daily/:date?`

Generate AI-powered analysis for a specific day.

**Parameters:**
- `date` (optional): Date in YYYY-MM-DD format. Default: today

**Response:**
```json
{
  "success": true,
  "message": "Daily insights generated",
  "data": {
    "date": "2026-02-09",
    "insights": {
      "completionRate": 85,
      "productiveSlots": 8,
      "totalSlots": 10,
      "moodTrend": "improving",
      "averageEnergy": 7,
      "dayScore": 750,
      "highlights": [
        "Excellent completion rate today!",
        "Strong productivity throughout the day",
        "Best performance: Morning workout"
      ],
      "improvements": [
        "Reduce mid-day distractions",
        "Take more frequent breaks"
      ],
      "motivationScore": 88,
      "summary": "Outstanding day! You completed most tasks and maintained good productivity."
    },
    "backend": "LOCAL"
  }
}
```

**Error Responses:**
- 404: No log found for specified date
- 500: Insight generation failed

---

### 2. Weekly Insights

**GET** `/api/insights/weekly/:weekStart?`

Analyze patterns and trends for a full week.

**Parameters:**
- `weekStart` (optional): Week start date in YYYY-MM-DD format. Default: current week Monday

**Response:**
```json
{
  "success": true,
  "message": "Weekly insights generated",
  "data": {
    "weekStart": "2026-02-02",
    "weekEnd": "2026-02-08",
    "logsCount": 7,
    "insights": {
      "week": {
        "startDate": "2026-02-02",
        "endDate": "2026-02-08",
        "daysLogged": 7
      },
      "scores": {
        "average": 720,
        "highest": 850,
        "lowest": 580,
        "trend": "improving"
      },
      "completion": {
        "average": 78,
        "trend": "stable"
      },
      "bestDay": {
        "day": "Friday",
        "score": 850,
        "completion": 90
      },
      "worstDay": {
        "day": "Monday",
        "score": 580,
        "completion": 65
      },
      "categoryStats": {
        "work": { "completionRate": 85, "productivityRate": 90, "tasksCompleted": 25 },
        "personal": { "completionRate": 75, "productivityRate": 70, "tasksCompleted": 15 }
      },
      "timeSlotAnalysis": {
        "09:00-10:00": { "avgScore": 85, "completionRate": 90 },
        "10:00-11:00": { "avgScore": 80, "completionRate": 88 }
      },
      "consistency": 82,
      "weekSummary": "Productive week! You maintained strong focus and completed most activities."
    },
    "backend": "LOCAL"
  }
}
```

**Error Responses:**
- 404: No logs found for specified week
- 500: Insight generation failed

---

### 3. Recommendations

**GET** `/api/insights/recommendations`

Get personalized productivity recommendations.

**Response:**
```json
{
  "success": true,
  "message": "Personalized recommendations generated",
  "data": {
    "count": 5,
    "recommendations": [
      {
        "id": "schedule-optimization",
        "title": "Schedule Your Most Important Tasks",
        "description": "You're most productive between 9:00-12:00. Schedule challenging tasks during these hours.",
        "priority": "high",
        "category": "timing",
        "impact": "High productivity boost",
        "action": "Reorganize your daily schedule"
      },
      {
        "id": "minimize-distractions",
        "title": "Reduce Common Distractions",
        "description": "Notifications are your most frequent distraction. Try to eliminate or minimize them during work sessions.",
        "priority": "high",
        "category": "focus",
        "impact": "Improved concentration",
        "action": "Create distraction-free work environment"
      },
      {
        "id": "boost-energy",
        "title": "Boost Your Energy Levels",
        "description": "Your energy seems low. Try: adequate sleep, short walks, healthy snacks, or hydration.",
        "priority": "high",
        "category": "health",
        "impact": "Increased productivity",
        "action": "Implement energy-boosting habits"
      },
      {
        "id": "take-breaks",
        "title": "Schedule Regular Breaks",
        "description": "Take 5-10 minute breaks every hour to maintain focus and energy.",
        "priority": "medium",
        "category": "wellbeing",
        "impact": "Sustained productivity",
        "action": "Set break reminders"
      },
      {
        "id": "improve-weak-area",
        "title": "Improve Personal Tasks",
        "description": "Your success rate in personal tasks is lower. Consider breaking them into smaller steps.",
        "priority": "medium",
        "category": "improvement",
        "impact": "Overall performance boost",
        "action": "Plan smaller tasks in this area"
      }
    ],
    "basedOnData": true,
    "backend": "LOCAL"
  }
}
```

**Error Responses:**
- 400: Insufficient data for recommendations
- 500: Recommendation generation failed

---

### 4. Schedule Prediction

**GET** `/api/insights/schedule`

Predict optimal daily schedule based on 30 days of data.

**Response:**
```json
{
  "success": true,
  "message": "Optimal schedule predicted",
  "data": {
    "schedule": [
      {
        "time": "7",
        "recommendation": "Challenges/Important tasks - High focus time",
        "expectedProductivity": 85,
        "expectedEnergy": 9
      },
      {
        "time": "8",
        "recommendation": "Challenges/Important tasks - High focus time",
        "expectedProductivity": 88,
        "expectedEnergy": 9
      },
      {
        "time": "9",
        "recommendation": "Challenges/Important tasks - High focus time",
        "expectedProductivity": 90,
        "expectedEnergy": 9
      },
      {
        "time": "12",
        "recommendation": "Breaks or low-focus tasks",
        "expectedProductivity": 45,
        "expectedEnergy": 5
      },
      {
        "time": "13",
        "recommendation": "Medium priority tasks",
        "expectedProductivity": 65,
        "expectedEnergy": 6
      }
    ],
    "daysAnalyzed": 30,
    "basedOnDays": 30,
    "confidence": 85,
    "bestTimeSlot": { "hour": "9:00", "score": 90 },
    "worstTimeSlot": { "hour": "12:00", "score": 45 },
    "recommendations": [
      "Peak productivity: 9:00 - schedule important tasks then",
      "Lowest productivity: 12:00 - use for breaks"
    ]
  }
}
```

**Error Responses:**
- 400: Insufficient data (need 7+ days)
- 500: Schedule prediction failed

---

### 5. Comprehensive Insights

**GET** `/api/insights/comprehensive`

Get all insights at once (daily + weekly + recommendations). Ideal for dashboard.

**Response:**
```json
{
  "success": true,
  "message": "Comprehensive insights generated",
  "data": {
    "insights": {
      "daily": { /* daily insights object */ },
      "weekly": { /* weekly insights object */ },
      "recommendations": [ /* recommendations array */ ]
    },
    "backend": "LOCAL",
    "generated": "2026-02-09T10:30:00Z"
  }
}
```

---

### 6. Set Insight Preferences

**POST** `/api/insights/preferences`

Configure user preferences for insights generation.

**Body:**
```json
{
  "insightPreferences": {
    "enableDailyInsights": true,
    "enableWeeklyInsights": true,
    "enableRecommendations": true,
    "enableSchedulePrediction": true,
    "insightFrequency": "daily",
    "preferredInsightTime": "09:00",
    "maxRecommendations": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Insight preferences updated",
  "data": {
    "preferences": { /* saved preferences */ }
  }
}
```

---

### 7. Cache Status

**GET** `/api/insights/cache`

Check cache status and insight generation history.

**Response:**
```json
{
  "success": true,
  "message": "Cache status retrieved",
  "data": {
    "backend": "LOCAL",
    "cacheSize": 5,
    "cacheTTL": 60,
    "enabled": true,
    "lastInsightGenerated": "2026-02-09T10:25:00Z",
    "insightPreferences": { /* user preferences */ }
  }
}
```

---

### 8. Clear Cache

**DELETE** `/api/insights/cache`

Clear insights cache (all or specific key).

**Query Parameters:**
- `key` (optional): Cache key to clear specific entry

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared",
  "data": {
    "cacheSize": 0
  }
}
```

---

### 9. Service Status

**GET** `/api/insights/status`

Get AI service status and capabilities.

**Response:**
```json
{
  "success": true,
  "message": "AI Service status",
  "data": {
    "backend": "LOCAL",
    "available": true,
    "capabilities": [
      "Daily Insights",
      "Weekly Analysis",
      "Personalized Recommendations",
      "Schedule Prediction"
    ],
    "cachingEnabled": true,
    "cacheSize": 5,
    "supportedLanguages": ["en"],
    "rateLimit": {
      "requestsPerHour": 50,
      "requestsPerDay": 500
    }
  }
}
```

---

## Usage Examples

### Example 1: Get Today's Insights

```bash
curl -X GET "http://localhost:5000/api/insights/daily" \
  -H "Authorization: Bearer your_jwt_token"
```

### Example 2: Get Weekly Analysis

```bash
curl -X GET "http://localhost:5000/api/insights/weekly" \
  -H "Authorization: Bearer your_jwt_token"
```

### Example 3: Get Recommendations

```bash
curl -X GET "http://localhost:5000/api/insights/recommendations" \
  -H "Authorization: Bearer your_jwt_token"
```

### Example 4: Predict Optimal Schedule

```bash
curl -X GET "http://localhost:5000/api/insights/schedule" \
  -H "Authorization: Bearer your_jwt_token"
```

### Example 5: Get Everything at Once

```bash
curl -X GET "http://localhost:5000/api/insights/comprehensive" \
  -H "Authorization: Bearer your_jwt_token"
```

### Example 6: Set Preferences

```bash
curl -X POST "http://localhost:5000/api/insights/preferences" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "insightPreferences": {
      "enableDailyInsights": true,
      "insightFrequency": "daily",
      "preferredInsightTime": "09:00",
      "maxRecommendations": 5
    }
  }'
```

---

## Caching Strategy

Insights are automatically cached to improve performance:

- **Daily Insights**: 1 hour cache TTL
- **Weekly Insights**: 1 hour cache TTL
- **Recommendations**: 1 hour cache TTL
- **Schedule Prediction**: 24 hour cache TTL

Clear cache manually:
```bash
# Clear all cache
curl -X DELETE "http://localhost:5000/api/insights/cache" \
  -H "Authorization: Bearer your_jwt_token"

# Clear specific key
curl -X DELETE "http://localhost:5000/api/insights/cache?key=daily:userId:2026-02-09" \
  -H "Authorization: Bearer your_jwt_token"
```

---

## Backend Configuration

### 1. Using LOCAL Backend (Default)

No configuration needed. Works out of the box!

```bash
AI_SERVICE=LOCAL
```

**Advantages:**
- No API keys needed
- Completely free
- Works offline
- Instant responses

**Use case:** Development, quick prototyping, privacy-focused

---

### 2. Using OpenAI Backend

First, set up an OpenAI account and get free credits.

**Installation:**
```bash
npm install openai
```

**Configuration:**
```bash
# .env
AI_SERVICE=OPENAI
OPENAI_API_KEY=sk-xxx...
```

**Cost estimate:**
- ~$0.01-0.02 per insight generation
- Free tier: Usually $5 free credits
- Sufficient for ~250-500 requests

**Advantages:**
- Highest quality insights
- Advanced analysis
- Better natural language

**Use case:** Production deployments, premium features

---

### 3. Using Hugging Face Backend

Get a free Hugging Face API token.

**Configuration:**
```bash
# .env
AI_SERVICE=HUGGINGFACE
HUGGINGFACE_API_KEY=hf_xxx...
```

**Advantages:**
- Free tier available
- Good quality
- Open-source models

**Use case:** Budget-friendly production

---

## Implementation Details

### Files Created

1. **utils/aiService.js** - Main service with backend abstraction
2. **utils/localInsights.js** - Local rule-based analysis (no API)
3. **utils/prompts.js** - Prompt templates for API calls
4. **controllers/insightsController.js** - Endpoint handlers
5. **routes/insightsRoutes.js** - Route definitions

### Architecture

```
aiService (abstraction layer)
├── LOCAL backend (localInsights.js)
├── OPENAI backend
└── HUGGINGFACE backend

insightsController (HTTP handlers)
├── getDailyInsights()
├── getWeeklyInsights()
├── getRecommendations()
├── getPredictedSchedule()
├── getComprehensiveInsights()
└── ...

insightsRoutes (Express routes)
├── /daily
├── /weekly
├── /recommendations
├── /schedule
├── /comprehensive
└── /preferences
```

### Data Flow

```
HTTP Request
    ↓
insightsController
    ↓
aiService (routes to appropriate backend)
    ├─→ LOCAL: localInsights.js (pure JS)
    ├─→ OPENAI: OpenAI API call
    └─→ HUGGINGFACE: HF API call
    ↓
Response + Cache
    ↓
HTTP Response
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "error": "Detailed error (development only)"
}
```

**Common Error Codes:**
- `LOG_NOT_FOUND`: No log found for date
- `NO_LOGS_FOUND`: No logs in date range
- `INSUFFICIENT_DATA`: Not enough data for analysis
- `INSIGHTS_GENERATION_ERROR`: Failed to generate insights
- `INVALID_REQUEST`: Invalid request parameters
- `CACHE_CLEAR_ERROR`: Failed to clear cache

---

## Rate Limiting

Default rate limits:
- 50 requests per hour per user
- 500 requests per day per user

Adjust in environment:
```bash
INSIGHTS_RATE_LIMIT_HOUR=50
INSIGHTS_RATE_LIMIT_DAY=500
```

---

## Best Practices

1. **Start with LOCAL backend** - No setup needed, good results
2. **Cache aggressively** - Insights are expensive to generate
3. **Batch requests** - Get comprehensive insights instead of individual calls
4. **Clear cache periodically** - Keep system fresh
5. **Monitor API costs** - If using OpenAI/HF
6. **Log failures** - Help improve accuracy

---

## Frontend Integration

### React Example

```javascript
import { useEffect, useState } from 'react';

function InsightsDashboard() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/insights/comprehensive', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setInsights(data.data.insights);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading insights...</div>;

  return (
    <div>
      <h1>Your Insights</h1>
      <DailyInsights data={insights.daily} />
      <WeeklyInsights data={insights.weekly} />
      <Recommendations data={insights.recommendations} />
    </div>
  );
}
```

---

## Troubleshooting

**Q: Insights are slow to load**
- A: Check cache status, consider switching to LOCAL backend

**Q: Getting "Insufficient Data" error**
- A: Continue logging activities for 7+ days, then try again

**Q: OpenAI API errors**
- A: Check API key, verify free credits, check rate limits

**Q: Insights seem inaccurate**
- A: Ensure accurate data logging, increase activity logging period

---

## Future Enhancements

- [ ] Streaming responses for faster perceived performance
- [ ] Custom model fine-tuning
- [ ] Multi-language support
- [ ] Advanced goal tracking
- [ ] Motivation scoring trends
- [ ] Social recommendations (if users allow)
- [ ] Email digest with insights
- [ ] Mobile push notifications
- [ ] Integration with calendar APIs
- [ ] Habit formation suggestions

---

**Version:** 1.0.0  
**Last Updated:** February 9, 2026  
**Maintained By:** Routine Development Team
