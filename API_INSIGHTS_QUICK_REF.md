# AI Insights API - Quick Reference

## Base URL
```
http://localhost:5000/api/insights
```

## Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📋 Endpoints Quick Reference

### 1. Daily Insights
```
GET /daily/:date?
  Get daily productivity analysis
  
  Parameters:
    date: Optional (YYYY-MM-DD) - Default: today
  
  Example:
    GET /daily
    GET /daily/2026-02-09
  
  Returns:
    - completionRate (0-100)
    - productiveSlots (count)
    - moodTrend (improving/declining/stable)
    - highlights (array, 3 max)
    - improvements (array, 3 max)
    - motivationScore (0-100)
    - dayScore (total score)
```

---

### 2. Weekly Insights
```
GET /weekly/:weekStart?
  Analyze weekly patterns and trends
  
  Parameters:
    weekStart: Optional (YYYY-MM-DD, must be Monday)
              Default: current week Monday
  
  Example:
    GET /weekly
    GET /weekly/2026-02-02
  
  Returns:
    - scores (avg, high, low, trend)
    - bestDay (day name + score)
    - worstDay (day name + score)
    - consistency (0-100)
    - categoryStats (performance by category)
    - timeSlotAnalysis (by hour)
    - weekSummary (narrative)
```

---

### 3. Personalized Recommendations
```
GET /recommendations
  Get 3-5 personalized productivity suggestions
  
  No parameters
  
  Example:
    GET /recommendations
  
  Returns:
    - Array of recommendations:
      - title (string)
      - description (string)
      - priority (high/medium/low)
      - category (timing/focus/health/habits/improvement)
      - impact (expected benefit)
      - action (what to do)
  
  Requires:
    - Some logged activity data
```

---

### 4. Optimal Schedule Prediction
```
GET /schedule
  Predict optimal daily schedule based on history
  
  No parameters
  
  Example:
    GET /schedule
  
  Returns:
    - schedule (array of hourly recommendations)
    - confidence (0-100)
    - bestTimeSlot (hour with best performance)
    - worstTimeSlot (hour with worst performance)
    - recommendations (optimization tips)
  
  Requires:
    - Minimum 7 days of logged activity
```

---

### 5. Comprehensive Insights
```
GET /comprehensive
  Get all insights at once (best for dashboard)
  
  No parameters
  
  Example:
    GET /comprehensive
  
  Returns:
    - daily (full daily insights)
    - weekly (full weekly insights)
    - recommendations (array of recommendations)
    - backend (current backend used)
    - generated (timestamp)
  
  Performance:
    - Faster than calling endpoints individually
    - Cached for 1 hour
```

---

### 6. Service Status
```
GET /status
  Check AI service status and capabilities
  
  No parameters
  
  Example:
    GET /status
  
  Returns:
    - backend (LOCAL|OPENAI|HUGGINGFACE)
    - available (true/false)
    - capabilities (array of features)
    - cachingEnabled (true/false)
    - cacheSize (entries)
    - rateLimit (requests per hour/day)
```

---

### 7. Cache Status
```
GET /cache
  View cache status and metrics
  
  No parameters
  
  Example:
    GET /cache
  
  Returns:
    - backend (current backend)
    - cacheSize (number of entries)
    - cacheTTL (time to live in minutes)
    - enabled (true/false)
    - lastInsightGenerated (timestamp)
    - insightPreferences (user settings)
```

---

### 8. Clear Cache
```
DELETE /cache
  Clear cache (all or specific key)
  
  Query Parameters:
    key: Optional - specific cache key to clear
  
  Example:
    DELETE /cache                    (clear all)
    DELETE /cache?key=daily:userId:2026-02-09  (clear one)
  
  Returns:
    - message (confirmation)
    - cacheSize (entries remaining)
```

---

### 9. Set Preferences
```
POST /preferences
  Configure user insight preferences
  
  Body:
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
  
  Returns:
    - preferences (saved settings)
```

---

## 🔌 Endpoint Categories

### Analysis (3 endpoints)
- `GET /daily/:date?` - Daily performance
- `GET /weekly/:weekStart?` - Weekly patterns
- `GET /recommendations` - Smart suggestions

### Intelligence (2 endpoints)
- `GET /schedule` - Optimal timing
- `GET /comprehensive` - Everything combined

### Management (3 endpoints)
- `GET /status` - Service info
- `GET /cache` - Cache status
- `DELETE /cache` - Clear cache
- `POST /preferences` - Configure

---

## 📊 Common Use Cases

### Use Case 1: Dashboard View
```bash
curl -X GET "http://localhost:5000/api/insights/comprehensive" \
  -H "Authorization: Bearer TOKEN" | jq .
```

### Use Case 2: Daily Email Summary
```bash
curl -X GET "http://localhost:5000/api/insights/daily" \
  -H "Authorization: Bearer TOKEN" | jq '.data.insights | {summary, highlights, motivationScore}'
```

### Use Case 3: Get Recommendations
```bash
curl -X GET "http://localhost:5000/api/insights/recommendations" \
  -H "Authorization: Bearer TOKEN" | jq '.data.recommendations[0:3]'
```

### Use Case 4: Optimize Schedule
```bash
curl -X GET "http://localhost:5000/api/insights/schedule" \
  -H "Authorization: Bearer TOKEN" | jq '.data | {bestTimeSlot, schedule: .schedule[0:5]}'
```

### Use Case 5: Weekly Report
```bash
curl -X GET "http://localhost:5000/api/insights/weekly" \
  -H "Authorization: Bearer TOKEN" | jq '.data.insights | {scores, bestDay, worstDay, consistency}'
```

---

## ⏱️ Response Times

### LOCAL Backend
- Daily Insights: 50-100ms
- Weekly Insights: 80-150ms
- Recommendations: 100-200ms
- Schedule: 200-300ms
- **Cached Response: <50ms**

### OpenAI Backend
- Daily Insights: 1-2 seconds
- Weekly Insights: 1-3 seconds
- Recommendations: 1-2 seconds
- Schedule: 2-3 seconds
- **Cached Response: <50ms**

---

## 🔄 Caching Strategy

### Cache Duration
- Daily Insights: 1 hour
- Weekly Insights: 1 hour
- Recommendations: 1 hour
- Schedule: 24 hours

### Clear Cache
```bash
# Clear all cache
curl -X DELETE "http://localhost:5000/api/insights/cache" \
  -H "Authorization: Bearer TOKEN"

# Clear specific entry
curl -X DELETE "http://localhost:5000/api/insights/cache?key=daily:userId:2026-02-09" \
  -H "Authorization: Bearer TOKEN"
```

---

## 📈 Rate Limits

Default limits per user:
- 50 requests per hour
- 500 requests per day

Responses over limit:
```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests"
}
```

---

## ❌ Error Codes

### Common Errors

| Code | HTTP | Meaning |
|------|------|---------|
| NO_TOKEN | 401 | Missing JWT token |
| INVALID_TOKEN | 401 | Invalid/expired token |
| LOG_NOT_FOUND | 404 | No log for that date |
| NO_LOGS_FOUND | 404 | No logs in range |
| INSUFFICIENT_DATA | 400 | Not enough data (need 7+ days for schedule) |
| INSIGHTS_GENERATION_ERROR | 500 | Failed to generate |
| INVALID_DATE_FORMAT | 400 | Wrong date format |
| INVALID_REQUEST | 400 | Bad request data |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |

### Error Response Format
```json
{
  "success": false,
  "message": "Human-readable message",
  "code": "ERROR_CODE",
  "error": "Detailed error (development only)"
}
```

---

## 🎯 Quick Test Commands

### 1. Check Service
```bash
curl "http://localhost:5000/api/insights/status" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 2. Get Today's Insights
```bash
curl "http://localhost:5000/api/insights/daily" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 3. Get This Week's Insights
```bash
curl "http://localhost:5000/api/insights/weekly" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 4. Get Recommendations
```bash
curl "http://localhost:5000/api/insights/recommendations" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.recommendations'
```

### 5. Get Optimal Schedule
```bash
curl "http://localhost:5000/api/insights/schedule" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.schedule'
```

---

## 📱 Frontend Integration Example

```javascript
// React hook to fetch insights
const useInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/insights/comprehensive', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    })
    .then(data => {
      if (data.success) {
        setInsights(data.data.insights);
      } else {
        throw new Error(data.message);
      }
    })
    .catch(error => console.error('Insights error:', error))
    .finally(() => setLoading(false));
  }, []);

  return { insights, loading };
};

// Usage in component
function Dashboard() {
  const { insights, loading } = useInsights();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <DailyView data={insights?.daily} />
      <WeeklyView data={insights?.weekly} />
      <Recommendations data={insights?.recommendations} />
    </div>
  );
}
```

---

## 🔐 Security Notes

- All endpoints require JWT authentication
- Tokens expire after 7 days
- User data is isolated (can only see own insights)
- Rate limiting prevents abuse
- API keys stored in environment (never in code)
- Error messages don't leak sensitive data

---

## 📚 Documentation Links

- **Full API Reference:** `API_INSIGHTS.md`
- **Setup & Configuration:** `AI_INSIGHTS_SETUP.md`
- **Implementation Details:** `AI_INSIGHTS_SUMMARY.md`
- **Complete Overview:** `README_AI_INSIGHTS.md`
- **Testing Guide:** `TESTING_AI_INSIGHTS.sh`

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Check JWT token validity |
| 404 Not Found | Ensure you have logs for that date |
| INSUFFICIENT_DATA | Need 7+ days of activity data |
| Slow Response | Check cache status, consider LOCAL backend |
| No Recommendations | Need more logged activities |

---

**Version:** 1.0.0
**Last Updated:** February 9, 2026
**Status:** ✅ Production Ready
