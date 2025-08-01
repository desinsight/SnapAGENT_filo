/**
 * 최근 색상 컴포넌트
 * 
 * @description 최근 사용한 색상들을 표시하는 드롭다운 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';

const RecentColors = ({ recentColors, onColorSelect, onMenuOpen, showMenu }) => {
  const menuRef = useRef(null);

  const handleMenuToggle = () => {
    if (onMenuOpen) {
      onMenuOpen(showMenu ? null : 'recentColors');
    }
  };

  const handleColorSelect = (color) => {
    onColorSelect(color);
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
        className="group relative px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-150 flex items-center"
        title="최근색상"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs">최근색상</span>
      </button>
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[10000]">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">최근 사용한 색상</div>
          {recentColors.length > 0 ? (
            <div className="grid grid-cols-5 gap-1.5 w-40">
              {recentColors.map((color, i) => (
                <button
                  key={i}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleColorSelect(color)}
                  className="w-7 h-7 rounded-lg border border-gray-300 hover:scale-110 transition-transform shadow-sm bg-white dark:bg-gray-100 flex items-center justify-center"
                  title={`최근 색상: ${color}`}
                >
                  <span 
                    className="text-sm font-bold"
                    style={{ color: color }}
                  >
                    A
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 text-center py-2 w-40">
              최근 사용한 색상이 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentColors;