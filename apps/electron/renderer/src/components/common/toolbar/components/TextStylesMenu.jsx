/**
 * 텍스트 스타일 메뉴 컴포넌트
 * 
 * @description 제목 스타일 (H1, H2, H3) 선택 메뉴
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';

const TextStylesMenu = ({ onStyleSelect }) => {
  // 텍스트 스타일 메뉴
  const TEXT_STYLES = [
    { 
      cmd: 'h1', 
      label: 'H1', 
      title: '제목 1',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>,
      style: { fontSize: '1.875rem', fontWeight: '700', lineHeight: '2.25rem' }
    },
    { 
      cmd: 'h2', 
      label: 'H2', 
      title: '제목 2',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>,
      style: { fontSize: '1.5rem', fontWeight: '600', lineHeight: '2rem' }
    },
    { 
      cmd: 'h3', 
      label: 'H3', 
      title: '제목 3',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>,
      style: { fontSize: '1.25rem', fontWeight: '600', lineHeight: '1.75rem' }
    },
  ];

  const handleStyleSelect = (style) => {
    onStyleSelect(style.cmd);
  };

  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium px-2">텍스트 스타일</div>
      {TEXT_STYLES.map((style, i) => (
        <button
          key={i}
          onMouseDown={e => e.preventDefault()}
          onClick={() => handleStyleSelect(style)}
          className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
          title={style.title}
        >
          <span className="mr-3">{style.icon}</span>
          <span className="flex-1 text-left">{style.title}</span>
          <span className="text-xs opacity-60">{style.label}</span>
        </button>
      ))}
    </div>
  );
};

export default TextStylesMenu;