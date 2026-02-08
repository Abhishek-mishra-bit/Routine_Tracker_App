/**
 * Prompt Templates for AI Services
 * 
 * Provides structured prompts for different insight types
 * Optimized for cost-effective API usage and clear outputs
 */

class PromptService {
  /**
   * Daily insight prompt
   */
  getDailyInsightPrompt(dailyLog, userPreferences = {}) {
    const slots = dailyLog.slots || [];
    const completed = slots.filter(s => s.completed).length;
    const completion = Math.round((completed / slots.length) * 100);

    const moodTrend = slots
      .map(s => s.mood)
      .filter(Boolean)
      .slice(-3)
      .join(', ');

    const topActivities = slots
      .filter(s => s.completed && s.plannedActivity)
      .slice(0, 3)
      .map(s => s.plannedActivity)
      .join(', ');

    const distractions = slots
      .flatMap(s => s.distractions || [])
      .slice(0, 5)
      .join(', ');

    return `Analyze this daily log and provide brief insights in JSON format:
Date: ${dailyLog.date}
Completion Rate: ${completion}%
Total Slots: ${slots.length}
Slots Completed: ${completed}
Day Score: ${dailyLog.summary?.totalScore || 0}

Activities Done: ${topActivities || 'None logged'}
Mood Trend: ${moodTrend || 'Not tracked'}
Distractions: ${distractions || 'None recorded'}

Provide response in this JSON format:
{
  "summary": "2-sentence overall assessment",
  "highlights": ["achievement 1", "achievement 2"],
  "improvements": ["area 1", "area 2"],
  "motivationScore": 0-100
}`;
  }

  /**
   * Weekly insight prompt
   */
  getWeeklyInsightPrompt(weekLogs, userPreferences = {}) {
    const scores = weekLogs.map(log => log.summary?.totalScore || 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);

    const dayNames = weekLogs.map(log => {
      const date = new Date(log.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const completionRates = weekLogs.map(log => {
      const slots = log.slots || [];
      return slots.length > 0 
        ? Math.round((slots.filter(s => s.completed).length / slots.length) * 100)
        : 0;
    });

    return `Analyze this week's productivity data:

Days: ${dayNames.join(', ')}
Daily Scores: ${scores.join(', ')}
Average Score: ${avgScore}
Completion Rates: ${completionRates.join(', ')}%

Days Logged: ${weekLogs.length}
Best Day: ${dayNames[scores.indexOf(Math.max(...scores))]}
Worst Day: ${dayNames[scores.indexOf(Math.min(...scores))]}

Provide JSON response:
{
  "weekSummary": "2-3 sentence analysis",
  "bestDay": "day name and reason",
  "worstDay": "day name and reason",
  "trends": ["trend 1", "trend 2"],
  "weekScore": 0-100,
  "consistency": 0-100
}`;
  }

  /**
   * Recommendation prompt
   */
  getRecommendationPrompt(userPatterns, user) {
    const bestTime = userPatterns.bestTimeSlots?.[0]?.time || 'N/A';
    const worstTime = userPatterns.worstTimeSlots?.[0]?.time || 'N/A';
    const topDistractions = userPatterns.frequentDistractions?.slice(0, 3).join(', ') || 'None';
    const bestCategory = Object.keys(userPatterns.categoryStats || {})[0] || 'N/A';
    const consistencyScore = userPatterns.consistency || 50;

    return `Generate 3-5 personalized productivity recommendations for:

User Timezone: ${user.settings?.timezone || 'UTC'}
Consistency Score: ${consistencyScore}%
Best Performance Time: ${bestTime}
Worst Performance Time: ${worstTime}
Top Distractions: ${topDistractions}
Strongest Category: ${bestCategory}
Days Active: ${userPatterns.daysActive || 'N/A'}

Generate response as JSON array:
[
  {
    "recommendation": "specific action",
    "priority": "high|medium|low",
    "category": "timing|focus|habits|health|improvement",
    "rationale": "why this matters"
  }
]

Focus on actionable, specific recommendations based on their patterns.`;
  }

  /**
   * Schedule prediction prompt
   */
  getSchedulePredictionPrompt(historicalLogs, user) {
    const hours = this._analyzeHistoricalHours(historicalLogs);
    const bestHour = hours.best;
    const worstHour = hours.worst;
    const averageCompletion = hours.avgCompletion;

    return `Predict optimal daily schedule based on historical data:

User: ${user.name}
Timezone: ${user.settings?.timezone || 'UTC'}
Morning Preference: ${user.settings?.morningTime || '8:00'}
Evening Preference: ${user.settings?.eveningTime || '22:00'}

Historical Data Summary:
- Best Performing Hour: ${bestHour}
- Worst Performing Hour: ${worstHour}
- Average Completion Rate: ${averageCompletion}%
- Analysis Period: ${historicalLogs.length} days

Generate optimal schedule as JSON:
{
  "schedule": [
    {"time": "HH:00", "type": "Focus|Routine|Break|Administrative", "reason": "why"},
    ...
  ],
  "reasoning": "overall strategy",
  "expectedProductivity": 0-100,
  "keyInsights": ["insight 1", "insight 2"]
}

Create a realistic, personalized schedule for their timezone and preferences.`;
  }

  /**
   * Motivation boost prompt
   */
  getMotivationPrompt(userData) {
    return `Generate a brief, personalized motivational message for a productivity app user:

Current Streak: ${userData.streak || 0} days
Weekly Score: ${userData.weeklyScore || 0}
Completion Rate: ${userData.completionRate || 0}%
Recent Mood: ${userData.recentMood || 'neutral'}

${userData.completionRate > 80 ? 'They are performing well.' : 'They need encouragement.'}

Generate a 1-2 sentence encouraging message that is:
- Specific to their situation
- Actionable
- Positive but realistic

Message: `;
  }

  /**
   * Goal suggestion prompt
   */
  getGoalSuggestionPrompt(userPatterns, currentGoals = []) {
    return `Suggest 2-3 realistic goals for a productivity routine app user:

Current Patterns:
- Strongest Area: ${userPatterns.bestCategory}
- Weakest Area: ${userPatterns.worstCategory}
- Consistency: ${userPatterns.consistency}%
- Average Daily Score: ${userPatterns.avgScore}

Existing Goals: ${currentGoals.join(', ') || 'None'}

Generate achievable 7-day goals as JSON:
{
  "goals": [
    {"goal": "specific goal", "target": "measurable target", "difficulty": "easy|medium|hard"}
  ],
  "rationale": "why these goals"
}`;
  }

  // ============ HELPER METHODS ============

  _analyzeHistoricalHours(logs) {
    const hourly = {};
    const hours = Array.from({ length: 16 }, (_, i) => i + 7);

    hours.forEach(h => {
      hourly[h] = { scores: [], completed: 0, total: 0 };
    });

    logs.forEach(log => {
      const slots = log.slots || [];
      slots.forEach(slot => {
        const hour = new Date(slot.timeSlot).getHours();
        if (hourly[hour]) {
          if (slot.slotScore) hourly[hour].scores.push(slot.slotScore);
          hourly[hour].total++;
          if (slot.completed) hourly[hour].completed++;
        }
      });
    });

    let best = { hour: 7, score: -1 };
    let worst = { hour: 7, score: 100 };
    let totalCompletion = 0;
    let totalSlots = 0;

    Object.entries(hourly).forEach(([h, data]) => {
      const avgScore = data.scores.length > 0
        ? data.scores.reduce((a, b) => a + b) / data.scores.length
        : 0;

      if (avgScore > best.score) best = { hour: h, score: avgScore };
      if (avgScore < worst.score && data.total > 0) worst = { hour: h, score: avgScore };

      totalCompletion += data.completed;
      totalSlots += data.total;
    });

    return {
      best: `${best.hour}:00`,
      worst: `${worst.hour}:00`,
      avgCompletion: totalSlots > 0 ? Math.round((totalCompletion / totalSlots) * 100) : 0
    };
  }
}

module.exports = new PromptService();
