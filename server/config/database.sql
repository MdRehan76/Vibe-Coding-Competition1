-- Create database
CREATE DATABASE IF NOT EXISTS wellness_tracker;
USE wellness_tracker;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE,
  mobile VARCHAR(20) UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- OTP table for verification
CREATE TABLE IF NOT EXISTS otp_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  otp VARCHAR(6) NOT NULL,
  type ENUM('email', 'mobile') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100),
  frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
  reminder_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  habit_id INT NOT NULL,
  user_id INT NOT NULL,
  completed_date DATE NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_habit_date (habit_id, completed_date)
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reminder_time TIME NOT NULL,
  days_of_week JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  activity_type ENUM('sleep', 'breakfast', 'lunch', 'dinner', 'work', 'exercise', 'other') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  days_of_week JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Progress tracking table
CREATE TABLE IF NOT EXISTS progress_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  metric_type ENUM('water_intake', 'sleep_hours', 'exercise_minutes', 'meditation_minutes') NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  target_value DECIMAL(10,2),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Yoga sessions table
CREATE TABLE IF NOT EXISTS yoga_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  pose_name VARCHAR(255) NOT NULL,
  duration_minutes INT DEFAULT 5,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  criteria JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_badge (user_id, badge_id)
);

-- Motivational quotes table
CREATE TABLE IF NOT EXISTS motivational_quotes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quote TEXT NOT NULL,
  author VARCHAR(255),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample motivational quotes
INSERT INTO motivational_quotes (quote, author, category) VALUES
('The only bad workout is the one that didn\'t happen.', 'Unknown', 'fitness'),
('Every day is a new beginning. Take a deep breath and start again.', 'Unknown', 'motivation'),
('Your body can stand almost anything. It\'s your mind you have to convince.', 'Unknown', 'mindset'),
('The difference between try and triumph is just a little umph!', 'Marvin Phillips', 'perseverance'),
('Small progress is still progress.', 'Unknown', 'growth'),
('You are stronger than you think.', 'Unknown', 'strength'),
('The only person you are destined to become is the person you decide to be.', 'Ralph Waldo Emerson', 'self-improvement'),
('Don\'t watch the clock; do what it does. Keep going.', 'Sam Levenson', 'perseverance'),
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', 'resilience'),
('The future depends on what you do today.', 'Mahatma Gandhi', 'action');

-- Insert sample badges
INSERT INTO badges (name, description, icon, criteria) VALUES
('First Step', 'Complete your first habit', '🎯', '{"habit_completions": 1}'),
('Week Warrior', 'Complete habits for 7 consecutive days', '🔥', '{"streak_days": 7}'),
('Month Master', 'Complete habits for 30 consecutive days', '👑', '{"streak_days": 30}'),
('Hydration Hero', 'Track water intake for 7 days', '💧', '{"water_tracking_days": 7}'),
('Yoga Yogi', 'Complete 10 yoga sessions', '🧘', '{"yoga_sessions": 10}'),
('Early Bird', 'Wake up early for 5 consecutive days', '🌅', '{"early_wake_ups": 5}'),
('Consistency King', 'Maintain 80% habit completion for a month', '📈', '{"completion_rate": 80, "days": 30}'),
('Wellness Warrior', 'Complete all daily habits for a week', '🛡️', '{"perfect_week": true}');
