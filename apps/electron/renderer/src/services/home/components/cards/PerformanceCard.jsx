import React from 'react';
import { motion } from 'framer-motion';

const PerformanceCard = ({ systemStats, performanceData }) => {
  const CircularProgress = ({ value, color, size = 60 }) => {
    const circumference = 2 * Math.PI * 18;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r="18"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r="18"
            stroke={color}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            {value}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            시스템 성능
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">실시간 모니터링</p>
        </div>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <CircularProgress value={systemStats.cpu} color="#3B82F6" />
          <div className="mt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">CPU</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{systemStats.cpu}%</div>
          </div>
        </div>
        <div className="text-center">
          <CircularProgress value={systemStats.memory} color="#10B981" />
          <div className="mt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">Memory</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{systemStats.memory}%</div>
          </div>
        </div>
        <div className="text-center">
          <CircularProgress value={systemStats.storage} color="#F59E0B" />
          <div className="mt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">Storage</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{systemStats.storage}%</div>
          </div>
        </div>
      </div>

      {performanceData.length > 0 && (
        <div className="h-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl"></div>
          <div className="relative h-full">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">성능 추이</div>
            <div className="flex items-end justify-between h-12 space-x-1">
              {performanceData.slice(-8).map((point, index) => (
                <div key={index} className="flex flex-col items-center group">
                  <div className="relative">
                    <div 
                      className="w-2 bg-gradient-to-t from-blue-500 to-purple-500 rounded transition-all duration-500 hover:from-purple-500 hover:to-blue-500"
                      style={{ height: `${Math.max(point.cpu * 0.4, 2)}px` }}
                    ></div>
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-1 py-0.5 rounded">
                        {point.cpu}%
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-mono">
                    {point.time.substring(0, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PerformanceCard;