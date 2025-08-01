/**
 * 텍스트 색상 선택 컴포넌트
 * 
 * @description 텍스트 색상을 선택하는 드롭다운 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';

const ColorPicker = ({ onColorSelect, onMenuOpen, showMenu }) => {
  const menuRef = useRef(null);

  // 색상 팔레트 (확장된 노션 스타일)
  const COLORS = [
    { name: '검정', value: '#000000' },
    { name: '진회색', value: '#37352F' },
    { name: '회색', value: '#9B9A97' },
    { name: '연회색', value: '#787774' },
    { name: '갈색', value: '#64473A' },
    { name: '화이트', value: '#fff' },
    { name: '주황', value: '#D9730D' },
    { name: '진주황', value: '#B8610A' },
    { name: '노랑', value: '#DFAB01' },
    { name: '진노랑', value: '#B7950B' },
    { name: '초록', value: '#0F7B6C' },
    { name: '연초록', value: '#16A085' },
    { name: '진초록', value: '#0A6B5D' },
    { name: '파랑', value: '#0B6E99' },
    { name: '연파랑', value: '#2980B9' },
    { name: '진파랑', value: '#1F4E79' },
    { name: '보라', value: '#6940A5' },
    { name: '연보라', value: '#8E44AD' },
    { name: '진보라', value: '#512E5F' },
    { name: '분홍', value: '#AD1A72' },
    { name: '연분홍', value: '#E91E63' },
    { name: '진분홍', value: '#880E4F' },
    { name: '빨강', value: '#E03E3E' },
    { name: '연빨강', value: '#E74C3C' },
    { name: '진빨강', value: '#B71C1C' },
  ];

  const handleMenuToggle = () => {
    if (onMenuOpen) {
      onMenuOpen(showMenu ? null : 'color');
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
        title="텍스트 색상"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <span className="text-xs">색상</span>
      </button>
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[10000]">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">텍스트 색상</div>
          <div className="grid grid-cols-5 gap-1.5 w-52">
            {COLORS.map((color, i) => (
              <button
                key={i}
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleColorSelect(color.value)}
                className="w-7 h-7 rounded-lg border border-gray-300 hover:scale-110 transition-transform shadow-sm bg-white dark:bg-gray-100 flex items-center justify-center"
                title={color.name}
              >
                <span 
                  className="text-sm font-bold"
                  style={{ color: color.value }}
                >
                  A
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;