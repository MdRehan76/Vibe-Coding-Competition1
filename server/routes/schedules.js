const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all schedules for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [schedules] = await pool.execute(
      'SELECT * FROM schedules WHERE user_id = ? ORDER BY start_time ASC',
      [userId]
    );

    res.json({ schedules });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Failed to get schedules' });
  }
});

// Create new schedule
router.post('/', authenticateToken, [
  body('activity_name').trim().isLength({ min: 1, max: 255 }).withMessage('Activity name is required'),
  body('activity_type').isIn(['sleep', 'breakfast', 'lunch', 'dinner', 'work', 'exercise', 'other']).withMessage('Invalid activity type'),
  body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
  body('days_of_week').optional().isArray().withMessage('Days of week must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { activity_name, activity_type, start_time, end_time, days_of_week } = req.body;
    const userId = req.user.id;

    const [result] = await pool.execute(
      'INSERT INTO schedules (user_id, activity_name, activity_type, start_time, end_time, days_of_week) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, activity_name, activity_type, start_time, end_time, JSON.stringify(days_of_week || [])]
    );

    const scheduleId = result.insertId;

    // Get the created schedule
    const [schedules] = await pool.execute(
      'SELECT * FROM schedules WHERE id = ?',
      [scheduleId]
    );

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule: schedules[0]
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// Update schedule
router.put('/:id', authenticateToken, [
  body('activity_name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Activity name must be between 1-255 characters'),
  body('activity_type').optional().isIn(['sleep', 'breakfast', 'lunch', 'dinner', 'work', 'exercise', 'other']).withMessage('Invalid activity type'),
  body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
  body('days_of_week').optional().isArray().withMessage('Days of week must be an array'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const scheduleId = req.params.id;
    const userId = req.user.id;
    const { activity_name, activity_type, start_time, end_time, days_of_week, is_active } = req.body;

    // Check if schedule belongs to user
    const [existingSchedules] = await pool.execute(
      'SELECT id FROM schedules WHERE id = ? AND user_id = ?',
      [scheduleId, userId]
    );

    if (existingSchedules.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (activity_name !== undefined) {
      updateFields.push('activity_name = ?');
      updateValues.push(activity_name);
    }

    if (activity_type !== undefined) {
      updateFields.push('activity_type = ?');
      updateValues.push(activity_type);
    }

    if (start_time !== undefined) {
      updateFields.push('start_time = ?');
      updateValues.push(start_time);
    }

    if (end_time !== undefined) {
      updateFields.push('end_time = ?');
      updateValues.push(end_time);
    }

    if (days_of_week !== undefined) {
      updateFields.push('days_of_week = ?');
      updateValues.push(JSON.stringify(days_of_week));
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(scheduleId, userId);

    await pool.execute(
      `UPDATE schedules SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    // Get updated schedule
    const [schedules] = await pool.execute(
      'SELECT * FROM schedules WHERE id = ? AND user_id = ?',
      [scheduleId, userId]
    );

    res.json({
      message: 'Schedule updated successfully',
      schedule: schedules[0]
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Delete schedule
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const userId = req.user.id;

    // Check if schedule belongs to user
    const [existingSchedules] = await pool.execute(
      'SELECT id FROM schedules WHERE id = ? AND user_id = ?',
      [scheduleId, userId]
    );

    if (existingSchedules.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await pool.execute(
      'DELETE FROM schedules WHERE id = ? AND user_id = ?',
      [scheduleId, userId]
    );

    res.json({ message: 'Schedule deleted successfully' });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// Get today's schedule
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

    const [schedules] = await pool.execute(
      `SELECT * FROM schedules 
       WHERE user_id = ? AND is_active = TRUE 
       AND (days_of_week IS NULL OR JSON_CONTAINS(days_of_week, ?))
       ORDER BY start_time ASC`,
      [userId, JSON.stringify(today)]
    );

    res.json({ schedules });
  } catch (error) {
    console.error('Get today schedule error:', error);
    res.status(500).json({ error: 'Failed to get today schedule' });
  }
});

// Get weekly schedule
router.get('/weekly', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [schedules] = await pool.execute(
      'SELECT * FROM schedules WHERE user_id = ? AND is_active = TRUE ORDER BY start_time ASC',
      [userId]
    );

    // Group schedules by day of week
    const weeklySchedule = {};
    for (let day = 0; day < 7; day++) {
      weeklySchedule[day] = schedules.filter(schedule => {
        const daysOfWeek = schedule.days_of_week ? JSON.parse(schedule.days_of_week) : [];
        return daysOfWeek.length === 0 || daysOfWeek.includes(day);
      }).sort((a, b) => a.start_time.localeCompare(b.start_time));
    }

    res.json({ weeklySchedule });
  } catch (error) {
    console.error('Get weekly schedule error:', error);
    res.status(500).json({ error: 'Failed to get weekly schedule' });
  }
});

// Get schedule timeline
router.get('/timeline', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    const targetDate = date || new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date(targetDate).getDay();

    const [schedules] = await pool.execute(
      `SELECT * FROM schedules 
       WHERE user_id = ? AND is_active = TRUE 
       AND (days_of_week IS NULL OR JSON_CONTAINS(days_of_week, ?))
       ORDER BY start_time ASC`,
      [userId, JSON.stringify(dayOfWeek)]
    );

    // Create timeline with time slots
    const timeline = [];
    for (let hour = 0; hour < 24; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      const activities = schedules.filter(schedule => {
        const startHour = parseInt(schedule.start_time.split(':')[0]);
        const endHour = schedule.end_time ? parseInt(schedule.end_time.split(':')[0]) : startHour + 1;
        return hour >= startHour && hour < endHour;
      });

      timeline.push({
        time: timeSlot,
        hour,
        activities
      });
    }

    res.json({
      date: targetDate,
      dayOfWeek,
      schedules,
      timeline
    });

  } catch (error) {
    console.error('Get schedule timeline error:', error);
    res.status(500).json({ error: 'Failed to get schedule timeline' });
  }
});

// Get schedule statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total schedules
    const [totalSchedules] = await pool.execute(
      'SELECT COUNT(*) as total FROM schedules WHERE user_id = ?',
      [userId]
    );

    // Get schedules by type
    const [schedulesByType] = await pool.execute(
      'SELECT activity_type, COUNT(*) as count FROM schedules WHERE user_id = ? GROUP BY activity_type',
      [userId]
    );

    // Get active schedules
    const [activeSchedules] = await pool.execute(
      'SELECT COUNT(*) as count FROM schedules WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );

    // Get schedules by day of week
    const [schedulesByDay] = await pool.execute(
      'SELECT days_of_week, COUNT(*) as count FROM schedules WHERE user_id = ? GROUP BY days_of_week',
      [userId]
    );

    const stats = {
      total: totalSchedules[0].total,
      active: activeSchedules[0].count,
      byType: schedulesByType,
      byDay: schedulesByDay
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get schedule stats error:', error);
    res.status(500).json({ error: 'Failed to get schedule statistics' });
  }
});

module.exports = router;
