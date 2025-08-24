import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Target, 
  Bell, 
  BarChart3, 
  Calendar, 
  Heart, 
  User, 
  Menu, 
  X,
  Settings
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { requestPermission, permission } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  // Default user data for demo
  const user = {
    name: 'Demo User',
    email: 'demo@wellness.com'
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Habits', href: '/habits', icon: Target },
    { name: 'Reminders', href: '/reminders', icon: Bell },
    { name: 'Progress', href: '/progress', icon: BarChart3 },
    { name: 'Schedules', href: '/schedules', icon: Calendar },
    { name: 'Yoga Time', href: '/yoga', icon: Heart },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const handleLogout = () => {
    // Since we're not using authentication, just show a message
    alert('Logout functionality is disabled in demo mode');
  };

  const handleNotificationPermission = async () => {
    await requestPermission();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:flex lg:flex-col`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Heart className="w-8 h-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Wellness</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email || user?.mobile}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <motion.button
                key={item.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </motion.button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 py-6 border-t border-gray-200 space-y-2">
          {/* Notification permission */}
          {permission !== 'granted' && (
            <button
              onClick={handleNotificationPermission}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors duration-200"
            >
              <Bell className="w-5 h-5 mr-3" />
              Enable Notifications
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors duration-200"
          >
            <Settings className="w-5 h-5 mr-3" />
            Demo Mode
          </button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
