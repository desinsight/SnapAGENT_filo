/**
 * 폰트 선택 컴포넌트
 * 
 * @description 폰트 패밀리 선택 드롭다운 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const FontSelector = ({ currentFormat, onFormat, onMenuOpen, showMenu }) => {
  // PropTypes 검증
  if (!onFormat || typeof onFormat !== 'function') {
    console.error('FontSelector: onFormat prop is required and must be a function');
    return null;
  }
  const menuRef = useRef(null);

  // 폰트 패밀리 옵션
  const FONT_FAMILIES = [
    { value: 'Inter', label: 'Inter' },
    { value: 'system-ui', label: 'System UI' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Times New Roman', label: 'Times' },
    { value: 'Courier New', label: 'Courier' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Noto Sans KR', label: '본고딕' },
    { value: 'Nanum Gothic', label: '나눔고딕' },
    { value: 'Malgun Gothic', label: '맑은고딕' },
  ];

  const handleMenuToggle = () => {
    if (onMenuOpen) {
      onMenuOpen(showMenu ? null : 'font');
    }
  };

  const handleFontSelect = (fontValue) => {
    try {
      onFormat('fontFamily', fontValue);
      if (onMenuOpen) {
        onMenuOpen(null);
      }
    } catch (error) {
      console.error('FontSelector: Error applying font family:', error);
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
        className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-150 text-sm min-w-[100px] flex items-center justify-between"
        title="폰트 패밀리"
        aria-label="폰트 패밀리 선택"
        aria-expanded={showMenu}
        aria-haspopup="true"
        type="button"
      >
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="truncate text-xs">{currentFormat?.fontFamily || 'Inter'}</span>
        </div>
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[10000] min-w-[180px] max-h-60 overflow-y-auto custom-scrollbar">
          {FONT_FAMILIES.map((font, i) => (
            <button
              key={i}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleFontSelect(font.value)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              style={{ fontFamily: font.value }}
              role="menuitem"
              aria-label={`폰트 ${font.label} 선택`}
              type="button"
            >
              {font.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// PropTypes 정의
FontSelector.propTypes = {
  currentFormat: PropTypes.object,
  onFormat: PropTypes.func.isRequired,
  onMenuOpen: PropTypes.func,
  showMenu: PropTypes.bool,
};

export default FontSelector;