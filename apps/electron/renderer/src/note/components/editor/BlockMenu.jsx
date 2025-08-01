/**
 * 블록 메뉴 컴포넌트
 * 
 * @description 블록 조작을 위한 컨텍스트 메뉴
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useRef, useEffect } from 'react';

export const BlockMenu = ({ onDuplicate, onDelete, onClose, blockType }) => {
  const menuRef = useRef(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItems = [
    {
      label: '복제',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      onClick: onDuplicate,
      shortcut: 'Ctrl+D'
    },
    {
      label: '삭제',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: onDelete,
      shortcut: 'Del',
      danger: true
    }
  ];

  return (
    <div
      ref={menuRef}
      className="
        absolute top-0 right-0 mt-8 mr-2 z-50
        bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
        min-w-48 py-1
      "
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={item.onClick}
          className={`
            w-full px-3 py-2 text-left text-sm flex items-center justify-between
            transition-colors duration-150
            ${item.danger 
              ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20' 
              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
            }
          `}
        >
          <span className="flex items-center space-x-2">
            {item.icon}
            <span>{item.label}</span>
          </span>
          {item.shortcut && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {item.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};