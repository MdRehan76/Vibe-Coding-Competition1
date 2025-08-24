const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all reminders for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [reminders] = await pool.execute(
      'SELECT * FROM reminders WHERE user_id = ? ORDER BY reminder_time ASC',
      [userId]
    );

    res.json({ reminders });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Failed to get reminders' });
  }
});

// Create new reminder
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Reminder title is required'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('reminder_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('days_of_week').optional().isArray().withMessage('Days of week must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, reminder_time, days_of_week } = req.body;
    const userId = req.user.id;

    const [result] = await pool.execute(
      'INSERT INTO reminders (user_id, title, description, reminder_time, days_of_week) VALUES (?, ?, ?, ?, ?)',
      [userId, title, description, reminder_time, JSON.stringify(days_of_week || [])]
    );

    const reminderId = result.insertId;

    // Get the created reminder
    const [reminders] = await pool.execute(
      'SELECT * FROM reminders WHERE id = ?',
      [reminderId]
    );

    res.status(201).json({
      message: 'Reminder created successfully',
      reminder: reminders[0]
    });

  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Update reminder
router.put('/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Reminder title must be between 1-255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('reminder_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('days_of_week').optional().isArray().withMessage('Days of week must be an array'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reminderId = req.params.id;
    const userId = req.user.id;
    const { title, description, reminder_time, days_of_week, is_active } = req.body;

    // Check if reminder belongs to user
    const [existingReminders] = await pool.execute(
      'SELECT id FROM reminders WHERE id = ? AND user_id = ?',
      [reminderId, userId]
    );

    if (existingReminders.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (reminder_time !== undefined) {
      updateFields.push('reminder_time = ?');
      updateValues.push(reminder_time);
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

    updateValues.push(reminderId, userId);

    await pool.execute(
      `UPDATE reminders SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    // Get updated reminder
    const [reminders] = await pool.execute(
      'SELECT * FROM reminders WHERE id = ? AND user_id = ?',
      [reminderId, userId]
    );

    res.json({
      message: 'Reminder updated successfully',
      reminder: reminders[0]
    });

  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// Delete reminder
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reminderId = req.params.id;
    const userId = req.user.id;

    // Check if reminder belongs to user
    const [existingReminders] = await pool.execute(
      'SELECT id FROM reminders WHERE id = ? AND user_id = ?',
      [reminderId, userId]
    );

    if (existingReminders.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    await pool.execute(
      'DELETE FROM reminders WHERE id = ? AND user_id = ?',
      [reminderId, userId]
    );

    res.json({ message: 'Reminder deleted successfully' });

  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// Toggle reminder active status
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const reminderId = req.params.id;
    const userId = req.user.id;

    // Check if reminder belongs to user
    const [existingReminders] = await pool.execute(
      'SELECT id, is_active FROM reminders WHERE id = ? AND user_id = ?',
      [reminderId, userId]
    );

    if (existingReminders.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const currentStatus = existingReminders[0].is_active;
    const newStatus = !currentStatus;

    await pool.execute(
      'UPDATE reminders SET is_active = ? WHERE id = ? AND user_id = ?',
      [newStatus, reminderId, userId]
    );

    res.json({
      message: `Reminder ${newStatus ? 'activated' : 'deactivated'} successfully`,
      is_active: newStatus
    });

  } catch (error) {
    console.error('Toggle reminder error:', error);
    res.status(500).json({ error: 'Failed to toggle reminder' });
  }
});

// Get reminders for today
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

    const [reminders] = await pool.execute(
      `SELECT * FROM reminders 
       WHERE user_id = ? AND is_active = TRUE 
       AND (days_of_week IS NULL OR JSON_CONTAINS(days_of_week, ?))
       ORDER BY reminder_time ASC`,
      [userId, JSON.stringify(today)]
    );

    res.json({ reminders });
  } catch (error) {
    console.error('Get today reminders error:', error);
    res.status(500).json({ error: 'Failed to get today reminders' });
  }
});

// Get upcoming reminders
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const today = now.getDay();

    // Get reminders for today (after current time) and next few days
    const [reminders] = await pool.execute(
      `SELECT *, 
              CASE 
                WHEN JSON_CONTAINS(days_of_week, ?) AND reminder_time > ? THEN 0
                WHEN JSON_CONTAINS(days_of_week, ?) THEN 1
                WHEN JSON_CONTAINS(days_of_week, ?) THEN 2
                WHEN JSON_CONTAINS(days_of_week, ?) THEN 3
                WHEN JSON_CONTAINS(days_of_week, ?) THEN 4
                WHEN JSON_CONTAINS(days_of_week, ?) THEN 5
                WHEN JSON_CONTAINS(days_of_week, ?) THEN 6
                ELSE 7
              END as days_until
       FROM reminders 
       WHERE user_id = ? AND is_active = TRUE 
       AND days_of_week IS NOT NULL
       HAVING days_until <= 7
       ORDER BY days_until ASC, reminder_time ASC
       LIMIT 10`,
      [
        JSON.stringify(today), currentTime,
        JSON.stringify((today + 1) % 7),
        JSON.stringify((today + 2) % 7),
        JSON.stringify((today + 3) % 7),
        JSON.stringify((today + 4) % 7),
        JSON.stringify((today + 5) % 7),
        JSON.stringify((today + 6) % 7),
        userId
      ]
    );

    res.json({ reminders });
  } catch (error) {
    console.error('Get upcoming reminders error:', error);
    res.status(500).json({ error: 'Failed to get upcoming reminders' });
  }
});

module.exports = router;
