import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Play } from 'lucide-react';

const Yoga = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yoga Time</h1>
          <p className="text-gray-600">Guided yoga sessions and mindfulness practice</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary flex items-center"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Session
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
        <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Yoga & Mindfulness</h2>
        <p className="text-gray-600 mb-6">
          Practice guided yoga poses and meditation for inner peace and wellness.
        </p>
        <p className="text-sm text-gray-500">
          This feature is coming soon with guided sessions, timer, and pose instructions.
        </p>
      </motion.div>
    </div>
  );
};

export default Yoga;
