/**
 * 텍스트 변환 메뉴 컴포넌트
 * 
 * @description 대문자, 소문자, 첫글자 대문자, 위첨자, 아래첨자 등 텍스트 변환 선택 메뉴
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';

const StyleOptionsMenu = ({ onOptionSelect }) => {
  // 스타일 옵션 메뉴
  const STYLE_OPTIONS = [
    { 
      cmd: 'uppercase', 
      label: '대문자', 
      title: '모든 글자를 대문자로',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" /></svg>,
      shortcut: '⌘⇧U'
    },
    { 
      cmd: 'lowercase', 
      label: '소문자', 
      title: '모든 글자를 소문자로',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 12h8m-8 4h16" /></svg>,
      shortcut: '⌘⇧L'
    },
    { 
      cmd: 'capitalize', 
      label: '첫글자 대문자', 
      title: '각 단어의 첫 글자를 대문자로',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h12M4 14h8M4 18h16" /></svg>,
      shortcut: '⌘⇧C'
    },
    { 
      cmd: 'superscript', 
      label: '위첨자', 
      title: '위첨자 적용',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      shortcut: '⌘⇧='
    },
    { 
      cmd: 'subscript', 
      label: '아래첨자', 
      title: '아래첨자 적용',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      shortcut: '⌘⇧-'
    },
  ];

  const handleOptionSelect = (option) => {
    onOptionSelect(option.cmd);
  };

  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium px-2">텍스트 변환</div>
      {STYLE_OPTIONS.map((option, i) => (
        <button
          key={i}
          onMouseDown={e => e.preventDefault()}
          onClick={() => handleOptionSelect(option)}
          className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
          title={option.title}
        >
          <span className="mr-3">{option.icon}</span>
          <span className="flex-1 text-left">{option.label}</span>
          <span className="text-xs opacity-60">{option.shortcut}</span>
        </button>
      ))}
    </div>
  );
};

export default StyleOptionsMenu;