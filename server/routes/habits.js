const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all habits for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [habits] = await pool.execute(
      `SELECT h.*, 
              CASE WHEN hc.id IS NOT NULL THEN TRUE ELSE FALSE END as completed_today,
              hc.completed_at as today_completion_time,
              hc.notes as today_notes
       FROM habits h 
       LEFT JOIN habit_completions hc ON h.id = hc.habit_id 
         AND hc.completed_date = ? 
         AND hc.user_id = ?
       WHERE h.user_id = ? AND h.is_active = TRUE
       ORDER BY h.created_at DESC`,
      [today, userId, userId]
    );

    res.json({ habits });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Failed to get habits' });
  }
});

// Create new habit
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Habit name is required'),
  body('icon').optional().isLength({ max: 100 }).withMessage('Icon must be less than 100 characters'),
  body('frequency').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
  body('reminder_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, icon, frequency, reminder_time } = req.body;
    const userId = req.user.id;

    const [result] = await pool.execute(
      'INSERT INTO habits (user_id, name, icon, frequency, reminder_time) VALUES (?, ?, ?, ?, ?)',
      [userId, name, icon, frequency, reminder_time]
    );

    const habitId = result.insertId;

    // Get the created habit
    const [habits] = await pool.execute(
      'SELECT * FROM habits WHERE id = ?',
      [habitId]
    );

    res.status(201).json({
      message: 'Habit created successfully',
      habit: habits[0]
    });

  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Update habit
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Habit name must be between 1-255 characters'),
  body('icon').optional().isLength({ max: 100 }).withMessage('Icon must be less than 100 characters'),
  body('frequency').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
  body('reminder_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const habitId = req.params.id;
    const userId = req.user.id;
    const { name, icon, frequency, reminder_time, is_active } = req.body;

    // Check if habit belongs to user
    const [existingHabits] = await pool.execute(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );

    if (existingHabits.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(icon);
    }

    if (frequency !== undefined) {
      updateFields.push('frequency = ?');
      updateValues.push(frequency);
    }

    if (reminder_time !== undefined) {
      updateFields.push('reminder_time = ?');
      updateValues.push(reminder_time);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(habitId, userId);

    await pool.execute(
      `UPDATE habits SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    // Get updated habit
    const [habits] = await pool.execute(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );

    res.json({
      message: 'Habit updated successfully',
      habit: habits[0]
    });

  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// Delete habit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const habitId = req.params.id;
    const userId = req.user.id;

    // Check if habit belongs to user
    const [existingHabits] = await pool.execute(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );

    if (existingHabits.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Delete habit completions first (due to foreign key constraint)
    await pool.execute(
      'DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ?',
      [habitId, userId]
    );

    // Delete habit
    await pool.execute(
      'DELETE FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );

    res.json({ message: 'Habit deleted successfully' });

  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Toggle habit completion
router.post('/:id/toggle', authenticateToken, [
  body('completed_date').optional().isDate().withMessage('Invalid date format'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const habitId = req.params.id;
    const userId = req.user.id;
    const { completed_date, notes } = req.body;

    const targetDate = completed_date || new Date().toISOString().split('T')[0];

    // Check if habit belongs to user
    const [existingHabits] = await pool.execute(
      'SELECT id FROM habits WHERE id = ? AND user_id = ? AND is_active = TRUE',
      [habitId, userId]
    );

    if (existingHabits.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Check if already completed for this date
    const [existingCompletions] = await pool.execute(
      'SELECT id FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completed_date = ?',
      [habitId, userId, targetDate]
    );

    if (existingCompletions.length > 0) {
      // Remove completion
      await pool.execute(
        'DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completed_date = ?',
        [habitId, userId, targetDate]
      );

      res.json({
        message: 'Habit completion removed',
        completed: false,
        date: targetDate
      });
    } else {
      // Add completion
      await pool.execute(
        'INSERT INTO habit_completions (habit_id, user_id, completed_date, notes) VALUES (?, ?, ?, ?)',
        [habitId, userId, targetDate, notes]
      );

      res.json({
        message: 'Habit completed successfully',
        completed: true,
        date: targetDate
      });
    }

  } catch (error) {
    console.error('Toggle habit completion error:', error);
    res.status(500).json({ error: 'Failed to toggle habit completion' });
  }
});

// Get habit completion history
router.get('/:id/history', authenticateToken, [
  body('start_date').optional().isDate().withMessage('Invalid start date'),
  body('end_date').optional().isDate().withMessage('Invalid end date'),
], async (req, res) => {
  try {
    const habitId = req.params.id;
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    // Check if habit belongs to user
    const [existingHabits] = await pool.execute(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );

    if (existingHabits.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    let query = `
      SELECT completed_date, completed_at, notes 
      FROM habit_completions 
      WHERE habit_id = ? AND user_id = ?
    `;
    const queryParams = [habitId, userId];

    if (start_date) {
      query += ' AND completed_date >= ?';
      queryParams.push(start_date);
    }

    if (end_date) {
      query += ' AND completed_date <= ?';
      queryParams.push(end_date);
    }

    query += ' ORDER BY completed_date DESC';

    const [completions] = await pool.execute(query, queryParams);

    res.json({ completions });

  } catch (error) {
    console.error('Get habit history error:', error);
    res.status(500).json({ error: 'Failed to get habit history' });
  }
});

// Get habit statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const habitId = req.params.id;
    const userId = req.user.id;

    // Check if habit belongs to user
    const [existingHabits] = await pool.execute(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );

    if (existingHabits.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Get total completions
    const [totalCompletions] = await pool.execute(
      'SELECT COUNT(*) as total FROM habit_completions WHERE habit_id = ? AND user_id = ?',
      [habitId, userId]
    );

    // Get current streak
    const [currentStreak] = await pool.execute(
      `SELECT COUNT(*) as streak
       FROM (
         SELECT completed_date,
                ROW_NUMBER() OVER (ORDER BY completed_date DESC) as rn,
                DATE_SUB(completed_date, INTERVAL ROW_NUMBER() OVER (ORDER BY completed_date DESC) DAY) as grp
         FROM habit_completions 
         WHERE habit_id = ? AND user_id = ?
       ) t
       WHERE grp = (
         SELECT DATE_SUB(completed_date, INTERVAL ROW_NUMBER() OVER (ORDER BY completed_date DESC) DAY) as grp
         FROM habit_completions 
         WHERE habit_id = ? AND user_id = ?
         ORDER BY completed_date DESC
         LIMIT 1
       )`,
      [habitId, userId, habitId, userId]
    );

    // Get this month's completions
    const [monthlyCompletions] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM habit_completions 
       WHERE habit_id = ? AND user_id = ? 
       AND MONTH(completed_date) = MONTH(CURRENT_DATE())
       AND YEAR(completed_date) = YEAR(CURRENT_DATE())`,
      [habitId, userId]
    );

    // Get this week's completions
    const [weeklyCompletions] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM habit_completions 
       WHERE habit_id = ? AND user_id = ? 
       AND YEARWEEK(completed_date) = YEARWEEK(CURRENT_DATE())`,
      [habitId, userId]
    );

    res.json({
      totalCompletions: totalCompletions[0].total,
      currentStreak: currentStreak[0].streak || 0,
      monthlyCompletions: monthlyCompletions[0].count,
      weeklyCompletions: weeklyCompletions[0].count
    });

  } catch (error) {
    console.error('Get habit stats error:', error);
    res.status(500).json({ error: 'Failed to get habit statistics' });
  }
});

module.exports = router;
