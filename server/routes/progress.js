const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get progress metrics
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date, metric_type } = req.query;

    let query = 'SELECT * FROM progress_metrics WHERE user_id = ?';
    const queryParams = [userId];

    if (start_date) {
      query += ' AND date >= ?';
      queryParams.push(start_date);
    }

    if (end_date) {
      query += ' AND date <= ?';
      queryParams.push(end_date);
    }

    if (metric_type) {
      query += ' AND metric_type = ?';
      queryParams.push(metric_type);
    }

    query += ' ORDER BY date DESC';

    const [metrics] = await pool.execute(query, queryParams);

    res.json({ metrics });
  } catch (error) {
    console.error('Get progress metrics error:', error);
    res.status(500).json({ error: 'Failed to get progress metrics' });
  }
});

// Add progress metric
router.post('/', authenticateToken, [
  body('metric_type').isIn(['water_intake', 'sleep_hours', 'exercise_minutes', 'meditation_minutes']).withMessage('Invalid metric type'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('target_value').optional().isFloat({ min: 0 }).withMessage('Target value must be a positive number'),
  body('date').isDate().withMessage('Invalid date format'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { metric_type, value, target_value, date } = req.body;
    const userId = req.user.id;

    // Check if metric already exists for this date
    const [existingMetrics] = await pool.execute(
      'SELECT id FROM progress_metrics WHERE user_id = ? AND metric_type = ? AND date = ?',
      [userId, metric_type, date]
    );

    if (existingMetrics.length > 0) {
      return res.status(400).json({ error: 'Metric already exists for this date' });
    }

    const [result] = await pool.execute(
      'INSERT INTO progress_metrics (user_id, metric_type, value, target_value, date) VALUES (?, ?, ?, ?, ?)',
      [userId, metric_type, value, target_value, date]
    );

    const metricId = result.insertId;

    // Get the created metric
    const [metrics] = await pool.execute(
      'SELECT * FROM progress_metrics WHERE id = ?',
      [metricId]
    );

    res.status(201).json({
      message: 'Progress metric added successfully',
      metric: metrics[0]
    });

  } catch (error) {
    console.error('Add progress metric error:', error);
    res.status(500).json({ error: 'Failed to add progress metric' });
  }
});

// Update progress metric
router.put('/:id', authenticateToken, [
  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('target_value').optional().isFloat({ min: 0 }).withMessage('Target value must be a positive number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const metricId = req.params.id;
    const userId = req.user.id;
    const { value, target_value } = req.body;

    // Check if metric belongs to user
    const [existingMetrics] = await pool.execute(
      'SELECT id FROM progress_metrics WHERE id = ? AND user_id = ?',
      [metricId, userId]
    );

    if (existingMetrics.length === 0) {
      return res.status(404).json({ error: 'Progress metric not found' });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (value !== undefined) {
      updateFields.push('value = ?');
      updateValues.push(value);
    }

    if (target_value !== undefined) {
      updateFields.push('target_value = ?');
      updateValues.push(target_value);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(metricId, userId);

    await pool.execute(
      `UPDATE progress_metrics SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    // Get updated metric
    const [metrics] = await pool.execute(
      'SELECT * FROM progress_metrics WHERE id = ? AND user_id = ?',
      [metricId, userId]
    );

    res.json({
      message: 'Progress metric updated successfully',
      metric: metrics[0]
    });

  } catch (error) {
    console.error('Update progress metric error:', error);
    res.status(500).json({ error: 'Failed to update progress metric' });
  }
});

// Delete progress metric
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const metricId = req.params.id;
    const userId = req.user.id;

    // Check if metric belongs to user
    const [existingMetrics] = await pool.execute(
      'SELECT id FROM progress_metrics WHERE id = ? AND user_id = ?',
      [metricId, userId]
    );

    if (existingMetrics.length === 0) {
      return res.status(404).json({ error: 'Progress metric not found' });
    }

    await pool.execute(
      'DELETE FROM progress_metrics WHERE id = ? AND user_id = ?',
      [metricId, userId]
    );

    res.json({ message: 'Progress metric deleted successfully' });

  } catch (error) {
    console.error('Delete progress metric error:', error);
    res.status(500).json({ error: 'Failed to delete progress metric' });
  }
});

// Get progress analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'week' } = req.query;

    let startDate;
    const endDate = new Date().toISOString().split('T')[0];

    switch (period) {
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    // Get metrics for the period
    const [metrics] = await pool.execute(
      'SELECT * FROM progress_metrics WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC',
      [userId, startDate, endDate]
    );

    // Calculate analytics by metric type
    const analytics = {};
    const metricTypes = ['water_intake', 'sleep_hours', 'exercise_minutes', 'meditation_minutes'];

    metricTypes.forEach(type => {
      const typeMetrics = metrics.filter(m => m.metric_type === type);
      
      if (typeMetrics.length > 0) {
        const values = typeMetrics.map(m => parseFloat(m.value));
        const total = values.reduce((sum, val) => sum + val, 0);
        const average = total / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        analytics[type] = {
          total,
          average: Math.round(average * 100) / 100,
          max,
          min,
          count: typeMetrics.length,
          data: typeMetrics.map(m => ({
            date: m.date,
            value: parseFloat(m.value),
            target: m.target_value ? parseFloat(m.target_value) : null
          }))
        };
      } else {
        analytics[type] = {
          total: 0,
          average: 0,
          max: 0,
          min: 0,
          count: 0,
          data: []
        };
      }
    });

    // Calculate overall wellness score
    const wellnessScore = calculateWellnessScore(analytics);

    res.json({
      period,
      startDate,
      endDate,
      analytics,
      wellnessScore
    });

  } catch (error) {
    console.error('Get progress analytics error:', error);
    res.status(500).json({ error: 'Failed to get progress analytics' });
  }
});

// Get progress summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Get today's metrics
    const [todayMetrics] = await pool.execute(
      'SELECT * FROM progress_metrics WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    // Get this week's metrics
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [weekMetrics] = await pool.execute(
      'SELECT * FROM progress_metrics WHERE user_id = ? AND date >= ?',
      [userId, weekStart]
    );

    // Get this month's metrics
    const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [monthMetrics] = await pool.execute(
      'SELECT * FROM progress_metrics WHERE user_id = ? AND date >= ?',
      [userId, monthStart]
    );

    // Calculate summaries
    const summary = {
      today: calculateMetricSummary(todayMetrics),
      week: calculateMetricSummary(weekMetrics),
      month: calculateMetricSummary(monthMetrics)
    };

    res.json({ summary });

  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ error: 'Failed to get progress summary' });
  }
});

// Helper function to calculate wellness score
const calculateWellnessScore = (analytics) => {
  let score = 0;
  let totalWeight = 0;

  // Water intake (target: 8 glasses/day)
  if (analytics.water_intake && analytics.water_intake.average > 0) {
    const waterScore = Math.min((analytics.water_intake.average / 8) * 100, 100);
    score += waterScore * 0.25;
    totalWeight += 0.25;
  }

  // Sleep hours (target: 7-9 hours/day)
  if (analytics.sleep_hours && analytics.sleep_hours.average > 0) {
    let sleepScore = 0;
    if (analytics.sleep_hours.average >= 7 && analytics.sleep_hours.average <= 9) {
      sleepScore = 100;
    } else if (analytics.sleep_hours.average >= 6 && analytics.sleep_hours.average <= 10) {
      sleepScore = 80;
    } else if (analytics.sleep_hours.average >= 5 && analytics.sleep_hours.average <= 11) {
      sleepScore = 60;
    } else {
      sleepScore = 40;
    }
    score += sleepScore * 0.3;
    totalWeight += 0.3;
  }

  // Exercise minutes (target: 30 minutes/day)
  if (analytics.exercise_minutes && analytics.exercise_minutes.average > 0) {
    const exerciseScore = Math.min((analytics.exercise_minutes.average / 30) * 100, 100);
    score += exerciseScore * 0.25;
    totalWeight += 0.25;
  }

  // Meditation minutes (target: 10 minutes/day)
  if (analytics.meditation_minutes && analytics.meditation_minutes.average > 0) {
    const meditationScore = Math.min((analytics.meditation_minutes.average / 10) * 100, 100);
    score += meditationScore * 0.2;
    totalWeight += 0.2;
  }

  return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
};

// Helper function to calculate metric summary
const calculateMetricSummary = (metrics) => {
  const summary = {
    water_intake: { total: 0, average: 0, count: 0 },
    sleep_hours: { total: 0, average: 0, count: 0 },
    exercise_minutes: { total: 0, average: 0, count: 0 },
    meditation_minutes: { total: 0, average: 0, count: 0 }
  };

  metrics.forEach(metric => {
    const type = metric.metric_type;
    const value = parseFloat(metric.value);
    
    summary[type].total += value;
    summary[type].count += 1;
  });

  // Calculate averages
  Object.keys(summary).forEach(type => {
    if (summary[type].count > 0) {
      summary[type].average = Math.round((summary[type].total / summary[type].count) * 100) / 100;
    }
  });

  return summary;
};

module.exports = router;
