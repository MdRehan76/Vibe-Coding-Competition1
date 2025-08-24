import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings } from 'lucide-react';

const Profile = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-secondary flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card text-center py-12"
      >
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Management</h2>
        <p className="text-gray-600 mb-6">
          Update your profile information and manage your account settings.
        </p>
        <p className="text-sm text-gray-500">
          This feature is coming soon with profile editing and account management.
        </p>
      </motion.div>
    </div>
  );
};

export default Profile;
