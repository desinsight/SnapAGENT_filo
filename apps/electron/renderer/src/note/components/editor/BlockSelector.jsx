/**
 * 블록 선택 도구 컴포넌트
 * 
 * @description 다중 선택된 블록들을 조작하는 도구
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';

export const BlockSelector = ({ selectedCount, onDelete, onDuplicate, onClear }) => {
  return (
    <div className="
      fixed top-4 right-4 z-50 
      bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
      px-4 py-2 flex items-center space-x-3
    ">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {selectedCount}개 블록 선택됨
      </span>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={onDuplicate}
          className="
            p-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400
            hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded
            transition-colors duration-150
          "
          title="선택된 블록 복제"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        
        <button
          onClick={onDelete}
          className="
            p-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400
            hover:bg-red-50 dark:hover:bg-red-900/20 rounded
            transition-colors duration-150
          "
          title="선택된 블록 삭제"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
        <button
          onClick={onClear}
          className="
            p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200
            hover:bg-gray-50 dark:hover:bg-gray-700 rounded
            transition-colors duration-150
          "
          title="선택 해제"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};