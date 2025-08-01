import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

const AIThinkingIndicator = () => {
  return (
    <div className="flex items-center space-x-2 text-gray-500">
      <SparklesIcon className="w-5 h-5 animate-pulse" />
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm">AI가 생각 중입니다...</span>
    </div>
  );
};

export default AIThinkingIndicator;