import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notification permission granted!');
        return true;
      } else {
        toast.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  };

  const sendNotification = (title, options = {}) => {
    if (!isSupported || permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  };

  const sendHabitReminder = (habitName) => {
    return sendNotification('Habit Reminder', {
      body: `Time to complete your habit: ${habitName}`,
      tag: 'habit-reminder',
      requireInteraction: false
    });
  };

  const sendYogaReminder = () => {
    return sendNotification('Yoga Time!', {
      body: 'Take a moment for yourself. Time for yoga practice.',
      tag: 'yoga-reminder',
      requireInteraction: false
    });
  };

  const sendMotivationalQuote = (quote) => {
    return sendNotification('Daily Motivation', {
      body: quote,
      tag: 'motivation',
      requireInteraction: false
    });
  };

  const sendScheduleReminder = (activityName, time) => {
    return sendNotification('Schedule Reminder', {
      body: `${activityName} at ${time}`,
      tag: 'schedule-reminder',
      requireInteraction: false
    });
  };

  const sendStreakNotification = (streakCount) => {
    return sendNotification('Streak Achievement!', {
      body: `Congratulations! You've maintained a ${streakCount}-day streak!`,
      tag: 'streak-achievement',
      requireInteraction: false
    });
  };

  const sendBadgeNotification = (badgeName) => {
    return sendNotification('New Badge Unlocked!', {
      body: `You've earned the "${badgeName}" badge!`,
      tag: 'badge-earned',
      requireInteraction: false
    });
  };

  const sendWaterReminder = () => {
    return sendNotification('Stay Hydrated!', {
      body: 'Time to drink some water. Stay healthy!',
      tag: 'water-reminder',
      requireInteraction: false
    });
  };

  const sendSleepReminder = () => {
    return sendNotification('Bedtime Reminder', {
      body: 'Time to wind down and prepare for a good night\'s sleep.',
      tag: 'sleep-reminder',
      requireInteraction: false
    });
  };

  const sendExerciseReminder = () => {
    return sendNotification('Exercise Time!', {
      body: 'Time to get moving and stay active!',
      tag: 'exercise-reminder',
      requireInteraction: false
    });
  };

  const sendMeditationReminder = () => {
    return sendNotification('Meditation Time', {
      body: 'Take a moment to breathe and center yourself.',
      tag: 'meditation-reminder',
      requireInteraction: false
    });
  };

  const value = {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    sendHabitReminder,
    sendYogaReminder,
    sendMotivationalQuote,
    sendScheduleReminder,
    sendStreakNotification,
    sendBadgeNotification,
    sendWaterReminder,
    sendSleepReminder,
    sendExerciseReminder,
    sendMeditationReminder
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
