/**
 * 더보기 메뉴 컴포넌트
 * 
 * @description 텍스트 스타일, 블록 요소, 고급 기능, 텍스트 변환을 통합한 더보기 메뉴
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import TextStylesMenu from './TextStylesMenu';
import BlockElementsMenu from './BlockElementsMenu';
import AdvancedFeaturesMenu from './AdvancedFeaturesMenu';
import StyleOptionsMenu from './StyleOptionsMenu';

const MoreMenu = ({ onFormat, onMenuOpen, showMenu }) => {
  const menuRef = useRef(null);

  const handleMenuToggle = () => {
    if (onMenuOpen) {
      onMenuOpen(showMenu ? null : 'more');
    }
  };

  const handleItemSelect = (cmd) => {
    if (cmd === 'undo' || cmd === 'redo') {
      // 실행 취소/다시 실행은 BlockEditor에서 처리 (키보드 이벤트로 전달)
      const event = new KeyboardEvent('keydown', {
        ctrlKey: true,
        metaKey: true,
        shiftKey: cmd === 'redo',
        key: 'z',
        bubbles: true
      });
      document.dispatchEvent(event);
    } else {
      onFormat(cmd);
    }
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
        title="더보기"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
        <span className="text-xs">더보기</span>
      </button>
      {showMenu && (
        <div className="absolute top-full right-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[10000] min-w-[320px] max-h-96 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <TextStylesMenu onStyleSelect={handleItemSelect} />
            <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
            <BlockElementsMenu onElementSelect={handleItemSelect} />
            <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
            <AdvancedFeaturesMenu onFeatureSelect={handleItemSelect} />
            <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
            <StyleOptionsMenu onOptionSelect={handleItemSelect} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MoreMenu;