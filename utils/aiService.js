/**
 * AI Service for Generating Productivity Insights
 * 
 * Supports multiple backends:
 * - LOCAL: Rule-based analysis (free, no API)
 * - OPENAI: GPT-3.5-turbo (requires API key + free credits)
 * - HUGGINGFACE: Text generation (free tier API)
 * 
 * Features:
 * - Daily insights and patterns
 * - Weekly trend analysis
 * - Personalized recommendations
 * - Optimal schedule predictions
 * - Automatic caching
 * - Fallback mechanisms
 */

const logger = require('./logger');
const localInsights = require('./localInsights');
const promptService = require('./prompts');

class AIService {
  constructor(backend = 'LOCAL') {
    this.backend = backend || process.env.AI_SERVICE || 'LOCAL';
    this.cache = new Map();
    this.cacheTTL = 1000 * 60 * 60; // 1 hour
    
    logger.info(`AI Service initialized with backend: ${this.backend}`);
  }

  /**
   * Generate daily insights from today's log
   * @param {Object} dailyLog - DailyLog document
   * @param {Object} userPreferences - User settings
   * @returns {Promise<Object>} Insights object
   */
  async generateDailyInsights(dailyLog, userPreferences = {}) {
    try {
      const cacheKey = `daily:${dailyLog.userId}:${dailyLog.date}`;
      
      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTTL) {
          logger.debug(`Cache hit for daily insights: ${cacheKey}`);
          return cached.data;
        }
      }

      let insights;
      switch (this.backend) {
        case 'OPENAI':
          insights = await this._generateDailyInsightsOpenAI(dailyLog, userPreferences);
          break;
        case 'HUGGINGFACE':
          insights = await this._generateDailyInsightsHF(dailyLog, userPreferences);
          break;
        case 'LOCAL':
        default:
          insights = await localInsights.analyzeDailyLog(dailyLog, userPreferences);
      }

      // Cache result
      this.cache.set(cacheKey, {
        data: insights,
        timestamp: Date.now()
      });

      return insights;
    } catch (error) {
      logger.error(`Error generating daily insights: ${error.message}`);
      // Fallback to local if primary fails
      if (this.backend !== 'LOCAL') {
        return await localInsights.analyzeDailyLog(dailyLog, userPreferences);
      }
      throw error;
    }
  }

  /**
   * Generate weekly insights from week's logs
   * @param {Array} weekLogs - Array of DailyLog documents
   * @param {Object} userPreferences - User settings
   * @returns {Promise<Object>} Weekly insights
   */
  async generateWeeklyInsights(weekLogs, userPreferences = {}) {
    try {
      const cacheKey = `weekly:${weekLogs[0]?.userId}:${new Date(weekLogs[0]?.date).toISOString().split('T')[0]}`;
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTTL) {
          return cached.data;
        }
      }

      let insights;
      switch (this.backend) {
        case 'OPENAI':
          insights = await this._generateWeeklyInsightsOpenAI(weekLogs, userPreferences);
          break;
        case 'HUGGINGFACE':
          insights = await this._generateWeeklyInsightsHF(weekLogs, userPreferences);
          break;
        case 'LOCAL':
        default:
          insights = await localInsights.analyzeWeeklyPatterns(weekLogs, userPreferences);
      }

      this.cache.set(cacheKey, {
        data: insights,
        timestamp: Date.now()
      });

      return insights;
    } catch (error) {
      logger.error(`Error generating weekly insights: ${error.message}`);
      if (this.backend !== 'LOCAL') {
        return await localInsights.analyzeWeeklyPatterns(weekLogs, userPreferences);
      }
      throw error;
    }
  }

  /**
   * Generate personalized recommendations
   * @param {Object} userPatterns - Pattern analysis from analytics
   * @param {Object} user - User document
   * @returns {Promise<Array>} Array of recommendations
   */
  async generateRecommendations(userPatterns, user) {
    try {
      const cacheKey = `recommendations:${user._id}:${new Date().toISOString().split('T')[0]}`;
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTTL) {
          return cached.data;
        }
      }

      let recommendations;
      switch (this.backend) {
        case 'OPENAI':
          recommendations = await this._generateRecommendationsOpenAI(userPatterns, user);
          break;
        case 'HUGGINGFACE':
          recommendations = await this._generateRecommendationsHF(userPatterns, user);
          break;
        case 'LOCAL':
        default:
          recommendations = await localInsights.generateRecommendations(userPatterns, user);
      }

      this.cache.set(cacheKey, {
        data: recommendations,
        timestamp: Date.now()
      });

      return recommendations;
    } catch (error) {
      logger.error(`Error generating recommendations: ${error.message}`);
      if (this.backend !== 'LOCAL') {
        return await localInsights.generateRecommendations(userPatterns, user);
      }
      throw error;
    }
  }

  /**
   * Predict optimal schedule based on historical data
   * @param {Array} historicalLogs - Last 30+ days of logs
   * @param {Object} user - User document
   * @returns {Promise<Object>} Predicted optimal schedule
   */
  async predictOptimalSchedule(historicalLogs, user) {
    try {
      const cacheKey = `schedule:${user._id}`;
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTTL * 24) { // 24 hour cache for schedule
          return cached.data;
        }
      }

      let schedule;
      switch (this.backend) {
        case 'OPENAI':
          schedule = await this._predictOptimalScheduleOpenAI(historicalLogs, user);
          break;
        case 'HUGGINGFACE':
          schedule = await this._predictOptimalScheduleHF(historicalLogs, user);
          break;
        case 'LOCAL':
        default:
          schedule = await localInsights.predictOptimalSchedule(historicalLogs, user);
      }

      this.cache.set(cacheKey, {
        data: schedule,
        timestamp: Date.now()
      });

      return schedule;
    } catch (error) {
      logger.error(`Error predicting optimal schedule: ${error.message}`);
      if (this.backend !== 'LOCAL') {
        return await localInsights.predictOptimalSchedule(historicalLogs, user);
      }
      throw error;
    }
  }

  /**
   * Clear cache for specific key or all
   * @param {string} key - Optional cache key
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // ============ OPENAI IMPLEMENTATIONS ============

  async _generateDailyInsightsOpenAI(dailyLog, userPreferences) {
    const openai = require('openai');
    const client = new openai.OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = promptService.getDailyInsightPrompt(dailyLog, userPreferences);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity coach analyzing daily routine logs. Provide concise, actionable insights in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      return this._parseJSONResponse(content, {
        summary: 'Daily performance summary',
        highlights: [],
        improvements: [],
        motivationScore: 0
      });
    } catch (error) {
      logger.error(`OpenAI API error: ${error.message}`);
      throw error;
    }
  }

  async _generateWeeklyInsightsOpenAI(weekLogs, userPreferences) {
    const openai = require('openai');
    const client = new openai.OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = promptService.getWeeklyInsightPrompt(weekLogs, userPreferences);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity analyst. Analyze weekly patterns and trends in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      const content = response.choices[0].message.content;
      return this._parseJSONResponse(content, {
        bestDay: '',
        worstDay: '',
        trends: [],
        weekScore: 0,
        consistency: 0
      });
    } catch (error) {
      logger.error(`OpenAI API error: ${error.message}`);
      throw error;
    }
  }

  async _generateRecommendationsOpenAI(userPatterns, user) {
    const openai = require('openai');
    const client = new openai.OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = promptService.getRecommendationPrompt(userPatterns, user);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity expert. Generate 3-5 specific, actionable recommendations as JSON array.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 600
      });

      const content = response.choices[0].message.content;
      return this._parseJSONResponse(content, [
        { recommendation: 'Focus on your strongest time slots', priority: 'high', category: 'timing' }
      ]);
    } catch (error) {
      logger.error(`OpenAI API error: ${error.message}`);
      throw error;
    }
  }

  async _predictOptimalScheduleOpenAI(historicalLogs, user) {
    const openai = require('openai');
    const client = new openai.OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = promptService.getSchedulePredictionPrompt(historicalLogs, user);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a scheduling expert. Predict the optimal daily schedule based on productivity patterns as JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 700
      });

      const content = response.choices[0].message.content;
      return this._parseJSONResponse(content, {
        schedule: [],
        confidence: 0.75,
        reasoning: ''
      });
    } catch (error) {
      logger.error(`OpenAI API error: ${error.message}`);
      throw error;
    }
  }

  // ============ HUGGING FACE IMPLEMENTATIONS ============

  async _generateDailyInsightsHF(dailyLog, userPreferences) {
    const response = await fetch('https://api-inference.huggingface.co/models/distilgpt2', {
      headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
      method: 'POST',
      body: JSON.stringify({
        inputs: promptService.getDailyInsightPrompt(dailyLog, userPreferences),
        parameters: { max_length: 300 }
      })
    });

    const result = await response.json();
    const text = result[0]?.generated_text || '';
    
    return {
      summary: this._extractSummary(text),
      highlights: this._extractHighlights(text),
      improvements: this._extractImprovements(text),
      motivationScore: this._calculateMotivationScore(dailyLog),
      generated: new Date()
    };
  }

  async _generateWeeklyInsightsHF(weekLogs, userPreferences) {
    const response = await fetch('https://api-inference.huggingface.co/models/distilgpt2', {
      headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
      method: 'POST',
      body: JSON.stringify({
        inputs: promptService.getWeeklyInsightPrompt(weekLogs, userPreferences),
        parameters: { max_length: 400 }
      })
    });

    const result = await response.json();
    return localInsights.analyzeWeeklyPatterns(weekLogs, userPreferences);
  }

  async _generateRecommendationsHF(userPatterns, user) {
    return await localInsights.generateRecommendations(userPatterns, user);
  }

  async _predictOptimalScheduleHF(historicalLogs, user) {
    return await localInsights.predictOptimalSchedule(historicalLogs, user);
  }

  // ============ UTILITY METHODS ============

  _parseJSONResponse(text, fallback = {}) {
    try {
      // Extract JSON from text (handles markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return fallback;
    } catch (error) {
      logger.warn(`Failed to parse JSON response: ${error.message}`);
      return fallback;
    }
  }

  _extractSummary(text) {
    const lines = text.split('\n').filter(l => l.trim());
    return lines[0]?.substring(0, 200) || 'Analysis generated';
  }

  _extractHighlights(text) {
    const highlights = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.includes('highlight') || line.includes('good') || line.includes('great')) {
        highlights.push(line.trim().substring(0, 100));
      }
    });
    return highlights.slice(0, 3);
  }

  _extractImprovements(text) {
    const improvements = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.includes('improve') || line.includes('could') || line.includes('try')) {
        improvements.push(line.trim().substring(0, 100));
      }
    });
    return improvements.slice(0, 3);
  }

  _calculateMotivationScore(dailyLog) {
    if (!dailyLog.summary) return 50;
    
    const score = dailyLog.summary.totalScore || 0;
    const completion = dailyLog.summary.completionPercentage || 0;
    const productivity = dailyLog.summary.productivityPercentage || 0;
    
    return Math.round((score / 1000) * 100 * 0.5 + completion * 0.3 + productivity * 0.2);
  }
}

// Export singleton instance
module.exports = new AIService();
