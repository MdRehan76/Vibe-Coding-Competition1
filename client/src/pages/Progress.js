import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

const Progress = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
          <p className="text-gray-600">Track your wellness journey and achievements</p>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card text-center py-12"
      >
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Progress Tracking</h2>
        <p className="text-gray-600 mb-6">
          Visualize your progress with charts, graphs, and detailed analytics.
        </p>
        <p className="text-sm text-gray-500">
          This feature is coming soon with interactive charts and comprehensive analytics.
        </p>
      </motion.div>
    </div>
  );
};

export default Progress;
