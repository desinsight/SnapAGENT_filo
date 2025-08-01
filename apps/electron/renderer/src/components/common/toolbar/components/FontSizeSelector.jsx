/**
 * 폰트 크기 선택 컴포넌트
 * 
 * @description 폰트 크기 선택 드롭다운 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';

const FontSizeSelector = ({ currentFormat, onFormat, onMenuOpen, showMenu }) => {
  const menuRef = useRef(null);

  // 폰트 사이즈 옵션
  const FONT_SIZES = [
    { value: '12px', label: '12' },
    { value: '14px', label: '14' },
    { value: '16px', label: '16' },
    { value: '18px', label: '18' },
    { value: '20px', label: '20' },
    { value: '24px', label: '24' },
    { value: '28px', label: '28' },
    { value: '32px', label: '32' },
    { value: '36px', label: '36' },
    { value: '48px', label: '48' },
  ];

  const handleMenuToggle = () => {
    if (onMenuOpen) {
      onMenuOpen(showMenu ? null : 'fontSize');
    }
  };

  const handleSizeSelect = (sizeValue) => {
    onFormat('fontSize', sizeValue);
    if (onMenuOpen) {
      onMenuOpen(null);
    }
  };

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (onMenuOpen) onMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu, onMenuOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onMouseDown={e => e.preventDefault()}
        onClick={handleMenuToggle}
        className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-150 text-sm min-w-[65px] flex items-center justify-between"
        title="폰트 크기"
      >
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-7 4 7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6" />
          </svg>
          <span className="text-xs">
            {currentFormat?.fontSize ? currentFormat.fontSize.replace('px', '') : '14'}
          </span>
        </div>
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[10000] min-w-[80px] max-h-60 overflow-y-auto custom-scrollbar">
          {FONT_SIZES.map((size, i) => (
            <button
              key={i}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSizeSelect(size.value)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
            >
              {size.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FontSizeSelector;