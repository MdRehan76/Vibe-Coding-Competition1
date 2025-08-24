const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { pool } = require('../config/database');

// Email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Twilio client
const createTwilioClient = () => {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in database
const storeOTP = async (userId, otp, type) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await pool.execute(
    'INSERT INTO otp_codes (user_id, otp, type, expires_at) VALUES (?, ?, ?, ?)',
    [userId, otp, type, expiresAt]
  );
};

// Send email OTP
const sendEmailOTP = async (userId, email) => {
  try {
    const otp = generateOTP();
    const transporter = createEmailTransporter();

    // Store OTP
    await storeOTP(userId, otp, 'email');

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Wellness Tracker - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50; text-align: center;">Wellness & Habit Tracker</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333;">OTP Verification</h3>
            <p style="color: #666;">Your verification code is:</p>
            <div style="background-color: #4CAF50; color: white; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
              ${otp}
            </div>
            <p style="color: #666; margin-top: 20px;">This code will expire in 10 minutes.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email OTP error:', error);
    return false;
  }
};

// Send SMS OTP
const sendSMSOTP = async (userId, mobile) => {
  try {
    const otp = generateOTP();
    const client = createTwilioClient();

    // Store OTP
    await storeOTP(userId, otp, 'mobile');

    // Send SMS
    await client.messages.create({
      body: `Your Wellness Tracker OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobile
    });

    return true;
  } catch (error) {
    console.error('SMS OTP error:', error);
    return false;
  }
};

// Verify OTP
const verifyOTP = async (userId, otp, type) => {
  try {
    // Get valid OTP
    const [otpCodes] = await pool.execute(
      `SELECT * FROM otp_codes 
       WHERE user_id = ? AND otp = ? AND type = ? 
       AND expires_at > NOW() AND is_used = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [userId, otp, type]
    );

    if (otpCodes.length === 0) {
      return false;
    }

    // Mark OTP as used
    await pool.execute(
      'UPDATE otp_codes SET is_used = TRUE WHERE id = ?',
      [otpCodes[0].id]
    );

    return true;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return false;
  }
};

// Clean expired OTPs
const cleanExpiredOTPs = async () => {
  try {
    await pool.execute(
      'DELETE FROM otp_codes WHERE expires_at < NOW() OR is_used = TRUE'
    );
  } catch (error) {
    console.error('Clean OTPs error:', error);
  }
};

// Schedule OTP cleanup every hour
setInterval(cleanExpiredOTPs, 60 * 60 * 1000);

module.exports = {
  sendEmailOTP,
  sendSMSOTP,
  verifyOTP,
  cleanExpiredOTPs
};
