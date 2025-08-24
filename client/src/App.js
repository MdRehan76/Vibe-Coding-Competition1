import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Reminders from './pages/Reminders';
import Progress from './pages/Progress';
import Schedules from './pages/Schedules';
import Yoga from './pages/Yoga';
import Profile from './pages/Profile';

function AppRoutes() {
  return (
    <Routes>
      {/* Main App Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="habits" element={<Habits />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="progress" element={<Progress />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="yoga" element={<Yoga />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppRoutes />
    </NotificationProvider>
  );
}

export default App;
