/**
 * 정렬 버튼 컴포넌트
 * 
 * @description 텍스트 정렬 (왼쪽, 가운데, 오른쪽) 버튼들
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';
import PropTypes from 'prop-types';

const AlignmentButtons = ({ onFormat }) => {
  // PropTypes 검증
  if (!onFormat || typeof onFormat !== 'function') {
    console.error('AlignmentButtons: onFormat prop is required and must be a function');
    return null;
  }
  // 정렬 옵션
  const ALIGNMENT_OPTIONS = [
    { 
      cmd: 'alignLeft', 
      label: '왼쪽 정렬',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>,
      shortcut: '⌘⇧L'
    },
    { 
      cmd: 'alignCenter', 
      label: '가운데 정렬',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm-2 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /></svg>,
      shortcut: '⌘⇧E'
    },
    { 
      cmd: 'alignRight', 
      label: '오른쪽 정렬',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm4 4a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zm-4 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm4 4a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1z" /></svg>,
      shortcut: '⌘⇧R'
    },
  ];

  return (
    <>
      {ALIGNMENT_OPTIONS.map((align, i) => (
        <button
          key={i}
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            try {
              onFormat(align.cmd);
            } catch (error) {
              console.error('AlignmentButtons: Error applying format:', error);
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
          title={`${align.label} ${align.shortcut}`}
          aria-label={`${align.label} ${align.shortcut}`}
          type="button"
        >
          {align.icon}
          <div className="tooltip absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded hidden pointer-events-none whitespace-nowrap z-[10000]">
            {align.label} <span className="opacity-75">{align.shortcut}</span>
          </div>
        </button>
      ))}
    </>
  );
};

// PropTypes 정의
AlignmentButtons.propTypes = {
  onFormat: PropTypes.func.isRequired,
};

export default AlignmentButtons;