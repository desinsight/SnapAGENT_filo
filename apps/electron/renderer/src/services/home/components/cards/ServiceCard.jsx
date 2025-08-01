import React from 'react';
import { motion } from 'framer-motion';
import { getServiceIcon } from '../icons/ServiceIcons';

const ServiceCard = ({ service, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={() => onClick?.(service)}
      className="min-w-[220px] bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 cursor-pointer group flex-shrink-0"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${service.bgColor} group-hover:scale-110 transition-transform duration-300`}>
          <div className={service.iconColor}>
            {getServiceIcon(service.iconType)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {service.description}
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {service.count}
          </div>
          <div className={`text-xs ${service.trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {service.trend}
          </div>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {service.title}
      </h3>
    </motion.div>
  );
};

export default ServiceCard;