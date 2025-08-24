const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get dashboard data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Get daily motivational quote
    const [quotes] = await pool.execute(
      'SELECT * FROM motivational_quotes WHERE is_active = TRUE ORDER BY RAND() LIMIT 1'
    );

    // Get user's habits with today's completion status
    const [habits] = await pool.execute(
      `SELECT h.*, 
              CASE WHEN hc.id IS NOT NULL THEN TRUE ELSE FALSE END as completed_today,
              hc.completed_at as today_completion_time
       FROM habits h 
       LEFT JOIN habit_completions hc ON h.id = hc.habit_id 
         AND hc.completed_date = ? 
         AND hc.user_id = ?
       WHERE h.user_id = ? AND h.is_active = TRUE
       ORDER BY h.created_at DESC`,
      [today, userId, userId]
    );

    // Calculate overall streak
    const [streakData] = await pool.execute(
      `SELECT COUNT(*) as streak
       FROM (
         SELECT completed_date,
                ROW_NUMBER() OVER (ORDER BY completed_date DESC) as rn,
                DATE_SUB(completed_date, INTERVAL ROW_NUMBER() OVER (ORDER BY completed_date DESC) DAY) as grp
         FROM habit_completions 
         WHERE user_id = ?
       ) t
       WHERE grp = (
         SELECT DATE_SUB(completed_date, INTERVAL ROW_NUMBER() OVER (ORDER BY completed_date DESC) DAY) as grp
         FROM habit_completions 
         WHERE user_id = ?
         ORDER BY completed_date DESC
         LIMIT 1
       )`,
      [userId, userId]
    );

    // Get today's completion count
    const [todayCompletions] = await pool.execute(
      'SELECT COUNT(*) as count FROM habit_completions WHERE user_id = ? AND completed_date = ?',
      [userId, today]
    );

    // Get this week's completion count
    const [weeklyCompletions] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM habit_completions 
       WHERE user_id = ? 
       AND YEARWEEK(completed_date) = YEARWEEK(CURRENT_DATE())`,
      [userId]
    );

    // Get this month's completion count
    const [monthlyCompletions] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM habit_completions 
       WHERE user_id = ? 
       AND MONTH(completed_date) = MONTH(CURRENT_DATE())
       AND YEAR(completed_date) = YEAR(CURRENT_DATE())`,
      [userId]
    );

    // Get user's badges
    const [badges] = await pool.execute(
      `SELECT b.*, ub.earned_at 
       FROM badges b 
       INNER JOIN user_badges ub ON b.id = ub.badge_id 
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    // Get recent progress metrics
    const [recentMetrics] = await pool.execute(
      `SELECT * FROM progress_metrics 
       WHERE user_id = ? 
       ORDER BY date DESC 
       LIMIT 7`,
      [userId]
    );

    // Calculate completion percentage for today
    const totalHabits = habits.length;
    const completedHabits = habits.filter(h => h.completed_today).length;
    const completionPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    const dashboardData = {
      quote: quotes[0] || null,
      habits,
      stats: {
        currentStreak: streakData[0].streak || 0,
        todayCompletions: todayCompletions[0].count,
        weeklyCompletions: weeklyCompletions[0].count,
        monthlyCompletions: monthlyCompletions[0].count,
        totalHabits,
        completedHabits,
        completionPercentage
      },
      badges,
      recentMetrics
    };

    res.json(dashboardData);

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get weekly progress
router.get('/weekly-progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    let startDate, endDate;
    if (start_date && end_date) {
      startDate = start_date;
      endDate = end_date;
    } else {
      // Default to current week
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      
      startDate = startOfWeek.toISOString().split('T')[0];
      endDate = endOfWeek.toISOString().split('T')[0];
    }

    // Get habits for the week
    const [habits] = await pool.execute(
      'SELECT id, name, icon FROM habits WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );

    // Get completions for the week
    const [completions] = await pool.execute(
      `SELECT habit_id, completed_date 
       FROM habit_completions 
       WHERE user_id = ? AND completed_date BETWEEN ? AND ?
       ORDER BY completed_date`,
      [userId, startDate, endDate]
    );

    // Create weekly progress data
    const weeklyData = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayCompletions = completions.filter(c => c.completed_date === dateStr);
      
      weeklyData.push({
        date: dateStr,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        completions: dayCompletions.length,
        totalHabits: habits.length,
        percentage: habits.length > 0 ? Math.round((dayCompletions.length / habits.length) * 100) : 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      startDate,
      endDate,
      habits,
      weeklyData
    });

  } catch (error) {
    console.error('Get weekly progress error:', error);
    res.status(500).json({ error: 'Failed to get weekly progress' });
  }
});

// Get monthly progress
router.get('/monthly-progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;

    // Get habits
    const [habits] = await pool.execute(
      'SELECT id, name, icon FROM habits WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );

    // Get completions for the month
    const [completions] = await pool.execute(
      `SELECT habit_id, completed_date 
       FROM habit_completions 
       WHERE user_id = ? 
       AND YEAR(completed_date) = ? 
       AND MONTH(completed_date) = ?
       ORDER BY completed_date`,
      [userId, targetYear, targetMonth]
    );

    // Create monthly calendar data
    const firstDay = new Date(targetYear, targetMonth - 1, 1);
    const lastDay = new Date(targetYear, targetMonth, 0);
    const daysInMonth = lastDay.getDate();

    const monthlyData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayCompletions = completions.filter(c => c.completed_date === dateStr);
      
      monthlyData.push({
        day,
        date: dateStr,
        completions: dayCompletions.length,
        totalHabits: habits.length,
        percentage: habits.length > 0 ? Math.round((dayCompletions.length / habits.length) * 100) : 0
      });
    }

    // Calculate monthly statistics
    const totalCompletions = completions.length;
    const totalPossible = habits.length * daysInMonth;
    const monthlyPercentage = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

    res.json({
      year: targetYear,
      month: targetMonth,
      monthName: firstDay.toLocaleDateString('en-US', { month: 'long' }),
      habits,
      monthlyData,
      stats: {
        totalCompletions,
        totalPossible,
        monthlyPercentage,
        averageDailyCompletions: daysInMonth > 0 ? Math.round(totalCompletions / daysInMonth) : 0
      }
    });

  } catch (error) {
    console.error('Get monthly progress error:', error);
    res.status(500).json({ error: 'Failed to get monthly progress' });
  }
});

// Get streak information
router.get('/streaks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current streak
    const [currentStreak] = await pool.execute(
      `SELECT COUNT(*) as streak
       FROM (
         SELECT completed_date,
                ROW_NUMBER() OVER (ORDER BY completed_date DESC) as rn,
                DATE_SUB(completed_date, INTERVAL ROW_NUMBER() OVER (ORDER BY completed_date DESC) DAY) as grp
         FROM habit_completions 
         WHERE user_id = ?
       ) t
       WHERE grp = (
         SELECT DATE_SUB(completed_date, INTERVAL ROW_NUMBER() OVER (ORDER BY completed_date DESC) DAY) as grp
         FROM habit_completions 
         WHERE user_id = ?
         ORDER BY completed_date DESC
         LIMIT 1
       )`,
      [userId, userId]
    );

    // Get longest streak
    const [longestStreak] = await pool.execute(
      `SELECT MAX(streak_length) as longest_streak
       FROM (
         SELECT COUNT(*) as streak_length
         FROM (
           SELECT completed_date,
                  ROW_NUMBER() OVER (ORDER BY completed_date DESC) as rn,
                  DATE_SUB(completed_date, INTERVAL ROW_NUMBER() OVER (ORDER BY completed_date DESC) DAY) as grp
           FROM habit_completions 
           WHERE user_id = ?
         ) t
         GROUP BY grp
       ) streak_groups`,
      [userId]
    );

    // Get streak history (last 10 streaks)
    const [streakHistory] = await pool.execute(
      `SELECT COUNT(*) as streak_length, MIN(completed_date) as start_date, MAX(completed_date) as end_date
       FROM (
         SELECT completed_date,
                ROW_NUMBER() OVER (ORDER BY completed_date DESC) as rn,
                DATE_SUB(completed_date, INTERVAL ROW_NUMBER() OVER (ORDER BY completed_date DESC) DAY) as grp
         FROM habit_completions 
         WHERE user_id = ?
       ) t
       GROUP BY grp
       ORDER BY MAX(completed_date) DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      currentStreak: currentStreak[0].streak || 0,
      longestStreak: longestStreak[0].longest_streak || 0,
      streakHistory
    });

  } catch (error) {
    console.error('Get streaks error:', error);
    res.status(500).json({ error: 'Failed to get streak information' });
  }
});

module.exports = router;
