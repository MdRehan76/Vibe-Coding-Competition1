import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  Target, 
  CheckCircle, 
  Circle, 
  TrendingUp, 
  Calendar, 
  Award,
  Plus,
  ArrowRight,
  Zap,
  Heart,
  Droplets,
  Moon,
  Activity,
  Bell
} from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { sendMotivationalQuote } = useNotification();
  const navigate = useNavigate();

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    'dashboard',
    async () => {
      const response = await axios.get('/api/dashboard');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Toggle habit completion
  const toggleHabit = async (habitId, completed) => {
    try {
      await axios.post(`/api/habits/${habitId}/toggle`, {
        completed_date: selectedDate.toISOString().split('T')[0]
      });
      refetch(); // Refetch dashboard data
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  // Send motivational quote notification
  const handleQuoteNotification = () => {
    if (dashboardData?.quote) {
      sendMotivationalQuote(dashboardData.quote.quote);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading dashboard data
      </div>
    );
  }

  const { quote, habits, stats, badges } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Track your wellness journey</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/habits')}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Habit
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.currentStreak || 0} days</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-accent-100 rounded-lg">
              <Target className="w-6 h-6 text-accent-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completionPercentage || 0}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completedHabits || 0}/{stats?.totalHabits || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Badges Earned</p>
              <p className="text-2xl font-bold text-gray-900">{badges?.length || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habits Section */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Today's Habits</h2>
              <button
                onClick={() => navigate('/habits')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {habits && habits.length > 0 ? (
              <div className="space-y-3">
                {habits.map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{habit.icon || '🎯'}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{habit.name}</h3>
                        <p className="text-sm text-gray-500">{habit.frequency}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleHabit(habit.id, !habit.completed_today)}
                      className={`p-2 rounded-full transition-all duration-200 ${
                        habit.completed_today
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {habit.completed_today ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No habits set up yet</p>
                <button
                  onClick={() => navigate('/habits')}
                  className="btn-primary"
                >
                  Create Your First Habit
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Motivational Quote */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Daily Motivation</h3>
              <button
                onClick={handleQuoteNotification}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
            {quote ? (
              <div>
                <blockquote className="text-gray-700 italic mb-3">
                  "{quote.quote}"
                </blockquote>
                <p className="text-sm text-gray-500">— {quote.author || 'Unknown'}</p>
              </div>
            ) : (
              <p className="text-gray-500">Loading motivational quote...</p>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/reminders')}
                className="w-full flex items-center p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                <Bell className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Set Reminders</span>
              </button>
              
              <button
                onClick={() => navigate('/yoga')}
                className="w-full flex items-center p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
              >
                <Heart className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Yoga Time</span>
              </button>
              
              <button
                onClick={() => navigate('/progress')}
                className="w-full flex items-center p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
              >
                <TrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">View Progress</span>
              </button>
              
              <button
                onClick={() => navigate('/schedules')}
                className="w-full flex items-center p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200"
              >
                <Calendar className="w-5 h-5 text-orange-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Manage Schedule</span>
              </button>
            </div>
          </motion.div>

          {/* Recent Badges */}
          {badges && badges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Badges</h3>
              <div className="space-y-3">
                {badges.slice(0, 3).map((badge, index) => (
                  <div key={badge.id} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-2xl mr-3">{badge.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{badge.name}</p>
                      <p className="text-sm text-gray-500">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Weekly Overview</h2>
        <div className="grid grid-cols-7 gap-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={day} className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">{day}</p>
              <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-500">Coming soon</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
