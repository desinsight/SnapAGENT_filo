/**
 * 블록 요소 메뉴 컴포넌트
 * 
 * @description 목록, 인용문, 코드블록, 구분선 등 블록 요소 선택 메뉴
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';

const BlockElementsMenu = ({ onElementSelect }) => {
  // 블록 요소 메뉴
  const BLOCK_ELEMENTS = [
    { 
      cmd: 'bulletList', 
      label: '글머리 기호', 
      title: '순서 없는 목록',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
      shortcut: '⌘⇧8'
    },
    { 
      cmd: 'numberedList', 
      label: '번호 매기기', 
      title: '순서 있는 목록',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0V3a2 2 0 00-2-2h-2a2 2 0 00-2 2v2m4 0h2m-6 4h6m-6 4h6m-6 4h6" /></svg>,
      shortcut: '⌘⇧7'
    },
    { 
      cmd: 'quote', 
      label: '인용문', 
      title: '인용 블록',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      shortcut: '⌘⇧.'
    },
    { 
      cmd: 'codeBlock', 
      label: '코드 블록', 
      title: '코드 블록',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
      shortcut: '⌘⇧C'
    },
    { 
      cmd: 'divider', 
      label: '구분선', 
      title: '수평선',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>,
      shortcut: '⌘⇧-'
    },
  ];

  const handleElementSelect = (element) => {
    onElementSelect(element.cmd);
  };

  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium px-2">블록 요소</div>
      {BLOCK_ELEMENTS.map((element, i) => (
        <button
          key={i}
          onMouseDown={e => e.preventDefault()}
          onClick={() => handleElementSelect(element)}
          className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
          title={element.title}
        >
          <span className="mr-3">{element.icon}</span>
          <span className="flex-1 text-left">{element.label}</span>
          <span className="text-xs opacity-60">{element.shortcut}</span>
        </button>
      ))}
    </div>
  );
};

export default BlockElementsMenu;