/**
 * 기본 툴바 버튼 컴포넌트
 * 
 * @description 볼드, 이탤릭, 밑줄, 취소선, 코드, 링크 등 기본적인 텍스트 포맷 버튼들
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';
import PropTypes from 'prop-types';

const BasicToolbarButtons = ({ onFormat }) => {
  // PropTypes 검증
  if (!onFormat || typeof onFormat !== 'function') {
    console.error('BasicToolbarButtons: onFormat prop is required and must be a function');
    return null;
  }
  // 기본 툴바 버튼 목록
  const BASIC_BUTTONS = [
    { 
      cmd: 'bold', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12M6 6h12M6 18h12" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 12h12M6 6h12M6 18h12" /></svg>,
      title: '굵게', 
      shortcut: '⌘B'
    },
    { 
      cmd: 'italic', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4l-2 16h-4l2-16z" /></svg>,
      title: '기울임', 
      shortcut: '⌘I'
    },
    { 
      cmd: 'underline', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18h12" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6v7a4 4 0 008 0V6" /></svg>,
      title: '밑줄', 
      shortcut: '⌘U'
    },
    { 
      cmd: 'strike', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6v7a4 4 0 008 0V6" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" /></svg>,
      title: '취소선', 
      shortcut: '⌘⇧X'
    },
    { 
      cmd: 'code', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
      title: '인라인 코드', 
      shortcut: '⌘E'
    },
    { 
      cmd: 'link', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
      title: '링크', 
      shortcut: '⌘K'
    },
  ];

  return (
    <>
      {BASIC_BUTTONS.map((btn, i) => (
        <button
          key={i}
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            try {
              onFormat(btn.cmd);
            } catch (error) {
              console.error('BasicToolbarButtons: Error applying format:', error);
            }
          }}
          onMouseLeave={(e) => {
            // 마우스가 버튼을 벗어날 때 툴팁 숨기기
            const tooltip = e.currentTarget.querySelector('.tooltip');
            if (tooltip) {
              tooltip.style.display = 'none';
            }
          }}
          onMouseEnter={(e) => {
            // 마우스가 버튼에 들어올 때 툴팁 표시
            const tooltip = e.currentTarget.querySelector('.tooltip');
            if (tooltip) {
              tooltip.style.display = 'block';
            }
          }}
          className="group relative p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-150"
          title={`${btn.title} ${btn.shortcut}`}
          aria-label={`${btn.title} ${btn.shortcut}`}
          type="button"
        >
          {btn.icon}
          <div className="tooltip absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded hidden pointer-events-none whitespace-nowrap z-[10000]">
            {btn.title} <span className="opacity-75">{btn.shortcut}</span>
          </div>
        </button>
      ))}
    </>
  );
};

// PropTypes 정의
BasicToolbarButtons.propTypes = {
  onFormat: PropTypes.func.isRequired,
};

export default BasicToolbarButtons;