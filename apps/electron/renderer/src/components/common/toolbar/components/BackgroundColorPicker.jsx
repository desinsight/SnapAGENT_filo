/**
 * 배경 색상 선택 컴포넌트
 * 
 * @description 배경 색상을 선택하는 드롭다운 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';

const BackgroundColorPicker = ({ onColorSelect, onMenuOpen, showMenu }) => {
  const menuRef = useRef(null);

  // 배경 색상 팔레트 (확장된 노션 스타일)
  const BG_COLORS = [
    { name: '기본', value: 'transparent' },
    { name: '연회색', value: '#F8F8F7' },
    { name: '회색', value: '#EBECED' },
    { name: '진회색', value: '#E1E1E0' },
    { name: '연갈색', value: '#F1EEE8' },
    { name: '갈색', value: '#E9E5E3' },
    { name: '진갈색', value: '#DDD6CE' },
    { name: '연주황', value: '#FDF2E9' },
    { name: '주황', value: '#FAEBDD' },
    { name: '진주황', value: '#F4E1CC' },
    { name: '연노랑', value: '#FEF9E7' },
    { name: '노랑', value: '#FBF3DB' },
    { name: '진노랑', value: '#F5E6A3' },
    { name: '연초록', value: '#E8F5E8' },
    { name: '초록', value: '#DDEDEA' },
    { name: '진초록', value: '#D1E7DD' },
    { name: '연파랑', value: '#E7F3FF' },
    { name: '파랑', value: '#DDEBF1' },
    { name: '진파랑', value: '#CFE2F3' },
    { name: '연보라', value: '#F0E8FF' },
    { name: '보라', value: '#EAE4F2' },
    { name: '진보라', value: '#E1D5E7' },
    { name: '연분홍', value: '#FCE7F3' },
    { name: '분홍', value: '#F4DFEB' },
    { name: '진분홍', value: '#ECD5E3' },
    { name: '연빨강', value: '#FDEBEB' },
    { name: '빨강', value: '#FBE4E4' },
    { name: '진빨강', value: '#F5C6CB' },
  ];

  const handleMenuToggle = () => {
    if (onMenuOpen) {
      onMenuOpen(showMenu ? null : 'bgcolor');
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
        title="배경 색상"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
        <span className="text-xs">배경</span>
      </button>
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[10000]">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">배경 색상</div>
          <div className="grid grid-cols-5 gap-1.5 w-52">
            {BG_COLORS.map((color, i) => (
              <button
                key={i}
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleColorSelect(color.value)}
                className="w-7 h-7 rounded-lg border border-gray-300 hover:scale-110 transition-transform shadow-sm bg-white dark:bg-gray-100 flex items-center justify-center relative"
                title={color.name}
              >
                <span 
                  className="text-sm font-bold px-1 py-0.5 rounded"
                  style={{ 
                    backgroundColor: color.value === 'transparent' ? 'transparent' : color.value,
                    color: color.value === 'transparent' ? '#666' : '#000'
                  }}
                >
                  a
                </span>
                {color.value === 'transparent' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-0.5 bg-red-500 transform rotate-45"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundColorPicker;