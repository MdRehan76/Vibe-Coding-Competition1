const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { sendEmailOTP, sendSMSOTP, verifyOTP } = require('../services/otpService');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.execute(
      'SELECT id, email, mobile, name, avatar, is_verified FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Register user
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('mobile').optional().isMobilePhone().withMessage('Invalid mobile number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, mobile, password } = req.body;

    // Check if user already exists
    let existingUser;
    if (email) {
      [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    } else if (mobile) {
      [existingUser] = await pool.execute('SELECT id FROM users WHERE mobile = ?', [mobile]);
    }

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, mobile, password) VALUES (?, ?, ?, ?)',
      [name, email, mobile, hashedPassword]
    );

    const userId = result.insertId;

    // Send OTP for verification
    let otpSent = false;
    if (email) {
      otpSent = await sendEmailOTP(userId, email);
    } else if (mobile) {
      otpSent = await sendSMSOTP(userId, mobile);
    }

    res.status(201).json({
      message: 'User registered successfully',
      userId,
      otpSent,
      verificationRequired: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Send OTP
router.post('/send-otp', [
  body('userId').isInt().withMessage('Valid user ID required'),
  body('type').isIn(['email', 'mobile']).withMessage('Type must be email or mobile'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, type } = req.body;

    // Get user details
    const [users] = await pool.execute(
      'SELECT email, mobile FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    let otpSent = false;

    if (type === 'email' && user.email) {
      otpSent = await sendEmailOTP(userId, user.email);
    } else if (type === 'mobile' && user.mobile) {
      otpSent = await sendSMSOTP(userId, user.mobile);
    } else {
      return res.status(400).json({ error: `${type} not found for user` });
    }

    if (otpSent) {
      res.json({ message: 'OTP sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send OTP' });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('userId').isInt().withMessage('Valid user ID required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('type').isIn(['email', 'mobile']).withMessage('Type must be email or mobile'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, otp, type } = req.body;

    const isValid = await verifyOTP(userId, otp, type);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark user as verified
    await pool.execute(
      'UPDATE users SET is_verified = TRUE WHERE id = ?',
      [userId]
    );

    res.json({ message: 'OTP verified successfully' });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Login
router.post('/login', [
  body('identifier').notEmpty().withMessage('Email or mobile required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    // Find user by email or mobile
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? OR mobile = ?',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    delete user.password;

    res.json({
      message: 'Login successful',
      token,
      user,
      isVerified: user.is_verified
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('avatar').optional().isURL().withMessage('Invalid avatar URL'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, avatar } = req.body;
    const userId = req.user.id;

    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (avatar) {
      updateFields.push('avatar = ?');
      updateValues.push(avatar);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(userId);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated user
    const [users] = await pool.execute(
      'SELECT id, email, mobile, name, avatar, is_verified FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: users[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = { router, authenticateToken };
