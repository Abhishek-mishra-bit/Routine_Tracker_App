/**
 * Local Insights Engine
 * 
 * Rule-based and mathematical analysis for productivity insights
 * No external API calls - completely free
 * 
 * Provides:
 * - Daily log analysis
 * - Weekly pattern detection
 * - Personalized recommendations
 * - Schedule optimization
 */

const logger = require('./logger');

class LocalInsights {
  /**
   * Analyze a single daily log
   * @param {Object} dailyLog - DailyLog document
   * @param {Object} userPreferences - User settings
   * @returns {Object} Daily insights
   */
  async analyzeDailyLog(dailyLog, userPreferences = {}) {
    try {
      const slots = dailyLog.slots || [];
      const summary = dailyLog.summary || {};

      const completionRate = slots.length > 0 
        ? (slots.filter(s => s.completed).length / slots.length) * 100 
        : 0;

      const productiveSlots = slots.filter(s => s.productive).length;
      const distractedSlots = slots.filter(s => s.distractions && s.distractions.length > 0).length;

      // Calculate moods
      const moods = slots.map(s => s.mood).filter(Boolean);
      const moodTrend = moods.length > 0 
        ? this._getMoodTrend(moods)
        : 'neutral';

      // Energy analysis
      const energyLevels = slots.map(s => s.energyLevel).filter(Boolean);
      const averageEnergy = energyLevels.length > 0
        ? Math.round(energyLevels.reduce((a, b) => a + b) / energyLevels.length)
        : 5;

      // Identify best and worst performing slots
      const rankedSlots = slots
        .map(s => ({ ...s, score: s.slotScore || 0 }))
        .sort((a, b) => b.score - a.score);

      const highlights = this._generateHighlights(
        completionRate,
        productiveSlots,
        slots.length,
        moodTrend,
        rankedSlots
      );

      const improvements = this._generateImprovements(
        completionRate,
        distractedSlots,
        slots.filter(s => !s.completed).length,
        rankedSlots
      );

      // Calculate motivation score
      const motivationScore = this._calculateMotivationScore(
        completionRate,
        productiveSlots / Math.max(slots.length, 1),
        summary.totalScore || 0
      );

      return {
        date: dailyLog.date,
        completionRate: Math.round(completionRate),
        productiveSlots,
        totalSlots: slots.length,
        moodTrend,
        averageEnergy,
        dayScore: summary.totalScore || 0,
        highlights,
        improvements,
        motivationScore,
        summary: this._generateDailySummary(
          completionRate,
          productiveSlots,
          moodTrend,
          summary.totalScore
        ),
        generated: new Date()
      };
    } catch (error) {
      logger.error(`Error analyzing daily log: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze weekly patterns
   * @param {Array} weekLogs - Array of DailyLog documents
   * @param {Object} userPreferences - User settings
   * @returns {Object} Weekly insights
   */
  async analyzeWeeklyPatterns(weekLogs, userPreferences = {}) {
    try {
      if (weekLogs.length === 0) {
        return this._emptyWeeklyInsights();
      }

      const dailyScores = weekLogs.map(log => log.summary?.totalScore || 0);
      const completionRates = weekLogs.map(log => {
        const slots = log.slots || [];
        return slots.length > 0 
          ? (slots.filter(s => s.completed).length / slots.length) * 100 
          : 0;
      });

      // Calculate trends
      const scoresTrend = this._calculateTrend(dailyScores);
      const completionTrend = this._calculateTrend(completionRates);

      // Find best and worst days
      const sortedByScore = weekLogs
        .map((log, idx) => ({ 
          date: new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' }),
          score: dailyScores[idx],
          completion: completionRates[idx],
          log 
        }))
        .sort((a, b) => b.score - a.score);

      const bestDay = sortedByScore[0];
      const worstDay = sortedByScore[sortedByScore.length - 1];

      // Category analysis
      const categoryStats = this._analyzeCategoryPerformance(weekLogs);

      // Time slot analysis
      const timeSlotAnalysis = this._analyzeTimeSlots(weekLogs);

      // Consistency score
      const consistency = this._calculateConsistency(completionRates);

      // Generate weekly summary
      const weekSummary = this._generateWeeklySummary(
        dailyScores,
        completionRates,
        categoryStats,
        bestDay,
        worstDay
      );

      return {
        week: {
          startDate: weekLogs[0].date,
          endDate: weekLogs[weekLogs.length - 1].date,
          daysLogged: weekLogs.length
        },
        scores: {
          average: Math.round(dailyScores.reduce((a, b) => a + b) / dailyScores.length),
          highest: Math.max(...dailyScores),
          lowest: Math.min(...dailyScores),
          trend: scoresTrend
        },
        completion: {
          average: Math.round(completionRates.reduce((a, b) => a + b) / completionRates.length),
          trend: completionTrend
        },
        bestDay: {
          day: bestDay.date,
          score: bestDay.score,
          completion: Math.round(bestDay.completion)
        },
        worstDay: {
          day: worstDay.date,
          score: worstDay.score,
          completion: Math.round(worstDay.completion)
        },
        categoryStats,
        timeSlotAnalysis,
        consistency,
        weekSummary,
        generated: new Date()
      };
    } catch (error) {
      logger.error(`Error analyzing weekly patterns: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate personalized recommendations
   * @param {Object} userPatterns - Pattern analysis
   * @param {Object} user - User document
   * @returns {Array} Array of recommendations
   */
  async generateRecommendations(userPatterns, user) {
    try {
      const recommendations = [];

      // Analyze patterns
      if (userPatterns.bestTimeSlots && userPatterns.bestTimeSlots.length > 0) {
        const bestTime = userPatterns.bestTimeSlots[0];
        recommendations.push({
          id: 'schedule-optimization',
          title: 'Schedule Your Most Important Tasks',
          description: `You're most productive between ${bestTime.time}. Schedule challenging tasks during these hours.`,
          priority: 'high',
          category: 'timing',
          impact: 'High productivity boost',
          action: 'Reorganize your daily schedule'
        });
      }

      // Distraction analysis
      if (userPatterns.frequentDistractions && userPatterns.frequentDistractions.length > 0) {
        const topDistraction = userPatterns.frequentDistractions[0];
        recommendations.push({
          id: 'minimize-distractions',
          title: 'Reduce Common Distractions',
          description: `"${topDistraction}" is your most frequent distraction. Try to eliminate or minimize it during work sessions.`,
          priority: 'high',
          category: 'focus',
          impact: 'Improved concentration',
          action: 'Create distraction-free work environment'
        });
      }

      // Energy management
      if (userPatterns.energyPattern) {
        const recommendation = this._generateEnergyRecommendation(userPatterns.energyPattern);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      // Mood-based recommendations
      if (userPatterns.moodPattern) {
        const recommendation = this._generateMoodRecommendation(userPatterns.moodPattern);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      // Break recommendations
      recommendations.push({
        id: 'take-breaks',
        title: 'Schedule Regular Breaks',
        description: 'Take 5-10 minute breaks every hour to maintain focus and energy. Step away from your workspace.',
        priority: 'medium',
        category: 'wellbeing',
        impact: 'Sustained productivity',
        action: 'Set break reminders'
      });

      // Consistency recommendations
      if (userPatterns.weeklyStats) {
        const consistency = userPatterns.weeklyStats.consistency || 0;
        if (consistency < 60) {
          recommendations.push({
            id: 'build-consistency',
            title: 'Build Daily Habits',
            description: 'Try to log activities consistently every day. Consistency builds momentum and better insights.',
            priority: 'high',
            category: 'habits',
            impact: 'Better pattern recognition',
            action: 'Log in at the same time each day'
          });
        }
      }

      // Activity-based recommendations
      if (userPatterns.categoryStats) {
        const worstCategory = this._findWorstCategory(userPatterns.categoryStats);
        if (worstCategory) {
          recommendations.push({
            id: 'improve-weak-area',
            title: `Improve ${worstCategory.category}`,
            description: `Your success rate in ${worstCategory.category} is lower than other areas. Consider breaking down these tasks into smaller steps.`,
            priority: 'medium',
            category: 'improvement',
            impact: 'Overall performance boost',
            action: 'Plan smaller tasks in this area'
          });
        }
      }

      return recommendations.slice(0, 5);
    } catch (error) {
      logger.error(`Error generating recommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Predict optimal daily schedule
   * @param {Array} historicalLogs - Last 30+ days of logs
   * @param {Object} user - User document
   * @returns {Object} Predicted optimal schedule
   */
  async predictOptimalSchedule(historicalLogs, user) {
    try {
      if (historicalLogs.length < 7) {
        return this._insufficientDataSchedule();
      }

      // Analyze performance by hour
      const hourlyPerformance = {};
      const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM

      hours.forEach(hour => {
        hourlyPerformance[hour] = {
          scores: [],
          completions: [],
          productivity: [],
          energies: []
        };
      });

      historicalLogs.forEach(log => {
        const slots = log.slots || [];
        slots.forEach(slot => {
          const hour = new Date(slot.timeSlot).getHours();
          if (hourlyPerformance[hour]) {
            if (slot.slotScore) hourlyPerformance[hour].scores.push(slot.slotScore);
            if (slot.completed) hourlyPerformance[hour].completions.push(1);
            if (slot.productive) hourlyPerformance[hour].productivity.push(1);
            if (slot.energyLevel) hourlyPerformance[hour].energies.push(slot.energyLevel);
          }
        });
      });

      // Calculate averages
      const hourlyStats = {};
      Object.keys(hourlyPerformance).forEach(hour => {
        const data = hourlyPerformance[hour];
        hourlyStats[hour] = {
          avgScore: data.scores.length > 0 
            ? Math.round(data.scores.reduce((a, b) => a + b) / data.scores.length)
            : 0,
          completionRate: data.completions.length > 0
            ? Math.round((data.completions.length / data.scores.length) * 100)
            : 0,
          productivityRate: data.productivity.length > 0
            ? Math.round((data.productivity.length / data.scores.length) * 100)
            : 0,
          avgEnergy: data.energies.length > 0
            ? Math.round(data.energies.reduce((a, b) => a + b) / data.energies.length)
            : 5
        };
      });

      // Generate schedule recommendations
      const schedule = this._generateOptimalSchedule(hourlyStats, user);

      return {
        schedule,
        basedOnDays: historicalLogs.length,
        confidence: Math.min(90, 50 + (historicalLogs.length * 2)), // Higher confidence with more data
        bestTimeSlot: this._findBestTimeSlot(hourlyStats),
        worstTimeSlot: this._findWorstTimeSlot(hourlyStats),
        recommendations: this._getScheduleRecommendations(hourlyStats),
        generated: new Date()
      };
    } catch (error) {
      logger.error(`Error predicting optimal schedule: ${error.message}`);
      throw error;
    }
  }

  // ============ HELPER METHODS ============

  _generateHighlights(completion, productive, total, moodTrend, rankedSlots) {
    const highlights = [];

    if (completion >= 80) {
      highlights.push('Excellent completion rate today!');
    }
    if (productive >= total * 0.7) {
      highlights.push('Strong productivity throughout the day');
    }
    if (moodTrend === 'positive' || moodTrend === 'improving') {
      highlights.push('Great mood trend - keep it up!');
    }
    if (rankedSlots.length > 0 && rankedSlots[0].score > 80) {
      highlights.push(`Best performance: ${rankedSlots[0].plannedActivity}`);
    }

    return highlights.slice(0, 3);
  }

  _generateImprovements(completion, distracted, incomplete, rankedSlots) {
    const improvements = [];

    if (completion < 60) {
      improvements.push('Try to complete more planned activities');
    }
    if (distracted > 3) {
      improvements.push('Minimize distractions - too many interruptions today');
    }
    if (incomplete > 3) {
      improvements.push(`${incomplete} tasks remain incomplete - plan better tomorrow`);
    }
    if (rankedSlots.length > 0 && rankedSlots[rankedSlots.length - 1].score < 40) {
      improvements.push(`Improve: ${rankedSlots[rankedSlots.length - 1].plannedActivity}`);
    }

    return improvements.slice(0, 3);
  }

  _getMoodTrend(moods) {
    const moodValues = {
      happy: 3,
      energetic: 3,
      neutral: 2,
      tired: 1,
      sad: 0,
      angry: -1
    };

    if (moods.length === 0) return 'neutral';

    const values = moods.map(m => moodValues[m] || 0);
    const trend = values[values.length - 1] - values[0];

    if (trend > 1) return 'improving';
    if (trend < -1) return 'declining';
    return values[values.length - 1] > 1 ? 'positive' : 'neutral';
  }

  _calculateMotivationScore(completion, productivity, dayScore) {
    return Math.round(
      (completion * 0.4) +
      (productivity * 100 * 0.3) +
      (Math.min(dayScore / 10, 100) * 0.3)
    );
  }

  _generateDailySummary(completion, productive, mood, score) {
    if (completion >= 80 && productive > 0 && mood !== 'declining') {
      return 'Outstanding day! You completed most tasks and maintained good productivity.';
    }
    if (completion >= 60) {
      return 'Good day overall. You made solid progress on your planned activities.';
    }
    if (completion >= 40) {
      return 'Moderate productivity. Consider adjusting your task list for better completion.';
    }
    return 'Challenging day. Remember, productivity is built gradually - keep improving!';
  }

  _calculateTrend(values) {
    if (values.length < 2) return 'stable';
    const recent = values.slice(-3);
    const average = recent.reduce((a, b) => a + b) / recent.length;
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
      .reduce((a, b) => a + b) / Math.floor(values.length / 2);

    if (average > firstHalf + 10) return 'improving';
    if (average < firstHalf - 10) return 'declining';
    return 'stable';
  }

  _analyzeCategoryPerformance(weekLogs) {
    const categoryData = {};

    weekLogs.forEach(log => {
      const slots = log.slots || [];
      slots.forEach(slot => {
        const category = slot.category || 'uncategorized';
        if (!categoryData[category]) {
          categoryData[category] = { total: 0, completed: 0, productive: 0 };
        }
        categoryData[category].total++;
        if (slot.completed) categoryData[category].completed++;
        if (slot.productive) categoryData[category].productive++;
      });
    });

    const stats = {};
    Object.keys(categoryData).forEach(cat => {
      const data = categoryData[cat];
      stats[cat] = {
        completionRate: Math.round((data.completed / data.total) * 100),
        productivityRate: Math.round((data.productive / data.total) * 100),
        tasksCompleted: data.completed
      };
    });

    return stats;
  }

  _analyzeTimeSlots(weekLogs) {
    const timeSlotData = {};

    weekLogs.forEach(log => {
      const slots = log.slots || [];
      slots.forEach(slot => {
        const hour = new Date(slot.timeSlot).getHours();
        const timeRange = `${hour}:00-${hour + 1}:00`;

        if (!timeSlotData[timeRange]) {
          timeSlotData[timeRange] = { scores: [], completed: 0, total: 0 };
        }

        timeSlotData[timeRange].total++;
        if (slot.slotScore) timeSlotData[timeRange].scores.push(slot.slotScore);
        if (slot.completed) timeSlotData[timeRange].completed++;
      });
    });

    const analysis = {};
    Object.keys(timeSlotData).forEach(time => {
      const data = timeSlotData[time];
      analysis[time] = {
        avgScore: data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b) / data.scores.length)
          : 0,
        completionRate: Math.round((data.completed / data.total) * 100)
      };
    });

    return analysis;
  }

  _calculateConsistency(completionRates) {
    const average = completionRates.reduce((a, b) => a + b) / completionRates.length;
    const variance = completionRates.reduce((sum, rate) => 
      sum + Math.pow(rate - average, 2), 0
    ) / completionRates.length;
    const stdDev = Math.sqrt(variance);

    return Math.round(Math.max(0, 100 - stdDev));
  }

  _generateWeeklySummary(scores, completions, categoryStats, bestDay, worstDay) {
    const avgScore = scores.reduce((a, b) => a + b) / scores.length;
    
    if (avgScore >= 70) {
      return 'Productive week! You maintained strong focus and completed most activities.';
    }
    if (avgScore >= 50) {
      return 'Decent week overall. Some inconsistency but generally good progress.';
    }
    return 'Challenging week. Next week, focus on consistency and building momentum.';
  }

  _findWorstCategory(categoryStats) {
    let worst = null;
    Object.entries(categoryStats).forEach(([cat, stats]) => {
      if (!worst || stats.completionRate < worst.rate) {
        worst = { category: cat, rate: stats.completionRate };
      }
    });
    return worst;
  }

  _generateEnergyRecommendation(energyPattern) {
    const avgEnergy = Object.values(energyPattern).reduce((a, b) => a + b) / 
                      Object.keys(energyPattern).length;

    if (avgEnergy < 4) {
      return {
        id: 'boost-energy',
        title: 'Boost Your Energy Levels',
        description: 'Your energy seems low. Try: adequate sleep, short walks, healthy snacks, or hydration.',
        priority: 'high',
        category: 'health',
        impact: 'Increased productivity',
        action: 'Implement energy-boosting habits'
      };
    }
    return null;
  }

  _generateMoodRecommendation(moodPattern) {
    const negativeMoods = Object.values(moodPattern).filter(m => 
      m === 'sad' || m === 'angry' || m === 'tired'
    ).length;

    if (negativeMoods > Object.keys(moodPattern).length * 0.5) {
      return {
        id: 'mood-support',
        title: 'Support Your Mental Wellbeing',
        description: 'Consider breaks, meditation, or talking to someone. Your wellbeing matters.',
        priority: 'high',
        category: 'mental-health',
        impact: 'Better mood and productivity',
        action: 'Practice stress-relief techniques'
      };
    }
    return null;
  }

  _findBestTimeSlot(hourlyStats) {
    let best = null;
    Object.entries(hourlyStats).forEach(([hour, stats]) => {
      if (!best || stats.avgScore > best.score) {
        best = { hour: `${hour}:00`, score: stats.avgScore };
      }
    });
    return best;
  }

  _findWorstTimeSlot(hourlyStats) {
    let worst = null;
    Object.entries(hourlyStats).forEach(([hour, stats]) => {
      if (!worst || stats.avgScore < worst.score) {
        worst = { hour: `${hour}:00`, score: stats.avgScore };
      }
    });
    return worst;
  }

  _generateOptimalSchedule(hourlyStats, user) {
    const schedule = [];
    const hours = Object.keys(hourlyStats).sort();

    hours.forEach(hour => {
      const stats = hourlyStats[hour];
      let recommendation = 'Regular tasks';

      if (stats.avgEnergy >= 8 && stats.avgScore >= 70) {
        recommendation = 'Challenging/Important tasks - High focus time';
      } else if (stats.avgEnergy >= 6 && stats.completionRate >= 70) {
        recommendation = 'Medium priority tasks';
      } else if (stats.avgEnergy <= 4) {
        recommendation = 'Routine/Administrative tasks';
      } else if (stats.productivityRate <= 40) {
        recommendation = 'Breaks or low-focus tasks';
      }

      schedule.push({
        time: hour,
        recommendation,
        expectedProductivity: stats.productivityRate,
        expectedEnergy: stats.avgEnergy
      });
    });

    return schedule;
  }

  _getScheduleRecommendations(hourlyStats) {
    const recs = [];
    const sorted = Object.entries(hourlyStats)
      .sort((a, b) => b[1].avgScore - a[1].avgScore);

    recs.push(`Peak productivity: ${sorted[0][0]} - schedule important tasks then`);
    recs.push(`Lowest productivity: ${sorted[sorted.length - 1][0]} - use for breaks`);

    return recs;
  }

  _emptyWeeklyInsights() {
    return {
      week: { startDate: null, endDate: null, daysLogged: 0 },
      scores: { average: 0, highest: 0, lowest: 0, trend: 'insufficient-data' },
      completion: { average: 0, trend: 'insufficient-data' },
      message: 'Not enough data for weekly analysis. Keep logging!'
    };
  }

  _insufficientDataSchedule() {
    return {
      schedule: [],
      basedOnDays: 0,
      confidence: 0,
      message: 'Need at least 7 days of data to predict optimal schedule.',
      recommendation: 'Keep logging your daily activities consistently'
    };
  }
}

module.exports = new LocalInsights();
