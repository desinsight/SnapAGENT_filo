/**
 * 노션 스타일 플로팅 툴바 컴포넌트
 * 
 * @description 텍스트 선택 시 나타나는 노션 스타일의 플로팅 툴바
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import BasicToolbarButtons from './toolbar/components/BasicToolbarButtons';
import AlignmentButtons from './toolbar/components/AlignmentButtons';
import FontSelector from './toolbar/components/FontSelector';
import FontSizeSelector from './toolbar/components/FontSizeSelector';
import RecentColors from './toolbar/components/RecentColors';
import ColorPicker from './toolbar/components/ColorPicker';
import BackgroundColorPicker from './toolbar/components/BackgroundColorPicker';
import MoreMenu from './toolbar/components/MoreMenu';
// import BlockColorPicker from './toolbar/components/BlockColorPicker';
import { useColorManager } from './toolbar/hooks/useColorManager';
import { useToolbarPositioner } from './toolbar/hooks/useToolbarPositioner';
import { useFormatHandler } from './toolbar/hooks/useFormatHandler';
import { useGlobalSelectionClearer } from './toolbar/hooks/useGlobalSelectionClearer';

const NotionLikeToolbar = ({
  selection = null,
  onFormatChange = () => {},
  currentFormat = {},
  enableGlobalSelectionClearer = true,
  onSelectionCleared = null
}) => {
  // PropTypes 검증
  if (onFormatChange && typeof onFormatChange !== 'function') {
    console.error('NotionLikeToolbar: onFormatChange must be a function');
    return null;
  }
  
  if (onSelectionCleared && typeof onSelectionCleared !== 'function') {
    console.error('NotionLikeToolbar: onSelectionCleared must be a function');
    return null;
  }
  const [isVisible, setIsVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  
  // 커스텀 훅 사용
  const { recentColors, addRecentColor } = useColorManager();
  const { toolbarRef, virtualRef, popperInstance } = useToolbarPositioner(selection, isVisible);
  const { applyFormat } = useFormatHandler(selection, onFormatChange, addRecentColor);
  
  // 전역 선택 해제 기능
  const { clearSelection } = useGlobalSelectionClearer({
    enabled: enableGlobalSelectionClearer,
    excludeSelectors: [
      '.notion-toolbar',
      '.ql-toolbar', 
      '.toolbar-menu',
      '[data-toolbar]',
      '[contenteditable="true"]',
      'textarea',
      'input[type="text"]',
      'input[type="search"]',
      'input[type="url"]',
      'input[type="tel"]',
      'input[type="email"]',
      'input[type="password"]'
    ],
    onSelectionCleared: useCallback((trigger, selectionState) => {
      // 툴바 숨기기
      setIsVisible(false);
      setActiveMenu(null);
      
      // 부모 컴포넌트에 알림
      if (onSelectionCleared) {
        onSelectionCleared(trigger, selectionState);
      }
    }, [onSelectionCleared])
  });

  // 기본 포맷 설정 (메모이제이션)
  const defaultFormat = useMemo(() => ({
    fontFamily: 'Inter',
    fontSize: '14',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    lineHeight: '1.5',
    color: '#000000',
    backgroundColor: 'transparent',
    ...currentFormat
  }), [currentFormat]);


  // selection prop 변경 감지
  useEffect(() => {
    console.log('[NotionLikeToolbar] Selection changed:', {
      selection,
      hasSelection: !!selection,
      selectionText: selection?.text,
      selectionRect: selection?.rect,
      isProseMirror: !!selection?.prosemirror,
      hasQuill: !!selection?.quill,
      hasRange: !!selection?.range,
      timestamp: new Date().toISOString()
    });
    
    if (!selection) {
      console.log('[NotionLikeToolbar] No selection - hiding toolbar', {
        wasVisible: isVisible,
        timestamp: new Date().toISOString()
      });
      setIsVisible(false);
      setActiveMenu(null);
      return;
    }
    
    // 툴바 메뉴 상태 초기화
    setActiveMenu(null);
    
    // 선택된 텍스트가 있으면 툴바 표시
    const shouldShow = (selection.quill && selection.range && selection.range.length > 0) || 
                      (selection.text && selection.text.length > 0) ||
                      (selection.prosemirror && selection.text && selection.text.length > 0);
    
    console.log('[NotionLikeToolbar] Should show toolbar:', {
      shouldShow,
      wasVisible: isVisible,
      willShow: shouldShow,
      timestamp: new Date().toISOString()
    });
    
    if (shouldShow) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [selection, isVisible]);

  // 외부 클릭 시 툴바와 메뉴 닫기 (ProseMirror 에디터 제외)
  useEffect(() => {
    if (!isVisible) return;
    const handleClick = (e) => {
      // ProseMirror 에디터나 툴바 내부 클릭은 무시
      const isInToolbar = toolbarRef.current && toolbarRef.current.contains(e.target);
      const isInProseMirror = e.target.closest('.prosemirror-text-editor');
      const isInBlockContent = e.target.closest('.block-content');
      
      console.log('[NotionLikeToolbar] Click detected:', {
        isInToolbar,
        isInProseMirror,
        isInBlockContent,
        target: e.target.tagName
      });
      
      if (!isInToolbar && !isInProseMirror && !isInBlockContent) {
        console.log('[NotionLikeToolbar] External click - hiding toolbar');
        // 툴바 외부 클릭 시 툴바와 모든 메뉴 닫기
        setIsVisible(false);
        setActiveMenu(null);
      }
    };
    
    // mousedown 대신 click 이벤트 사용하여 지연 시간 확보
    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [isVisible]);

  // 메뉴 상태 관리 헬퍼 함수 (메모이제이션)
  const openMenu = useCallback((menuName) => {
    setActiveMenu(menuName === 'more' ? 'more' : null);
  }, []);

  // 포맷 적용 핸들러 (메모이제이션)
  const handleFormat = useCallback((cmd, value = null) => {
    console.log('[NotionLikeToolbar] Format command:', cmd, value);
    window.preventSelectionClear = true;
    setActiveMenu(null); // 포맷 버튼 클릭 시 모든 드롭다운/패널 닫기
    if (cmd === 'blockColor') {
      if (onFormatChange) onFormatChange(cmd, value);
      setTimeout(() => { window.preventSelectionClear = false; }, 200);
      return;
    }
    try {
      applyFormat(cmd, value);
    } catch (error) {
      console.error('NotionLikeToolbar: Error applying format:', error);
    }
    if (onFormatChange) onFormatChange(cmd, value);
    setTimeout(() => { window.preventSelectionClear = false; }, 200);
  }, [applyFormat, onFormatChange]);

  // 색상 선택 핸들러 (메모이제이션)
  const handleColorSelect = useCallback((color) => {
    try {
      handleFormat('color', color);
    } catch (error) {
      console.error('NotionLikeToolbar: Error applying color:', error);
    }
  }, [handleFormat]);

  // 배경색 선택 핸들러 (메모이제이션)
  const handleBackgroundColorSelect = useCallback((color) => {
    try {
      handleFormat('backgroundColor', color);
    } catch (error) {
      console.error('NotionLikeToolbar: Error applying background color:', error);
    }
  }, [handleFormat]);

  if (!isVisible) return null;

  return createPortal(
    <div
      ref={toolbarRef}
      className="notion-toolbar z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl transition-none"
      style={{ minWidth: '580px', transition: 'none' }}
      data-toolbar="true"
      role="toolbar"
      aria-label="텍스트 서식 도구모음"
      onMouseDown={(e) => {
        console.log('[NotionLikeToolbar] Toolbar mousedown - preventing default');
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        console.log('[NotionLikeToolbar] Toolbar click - stopping propagation');
        e.stopPropagation();
      }}
    >
      <div className="flex items-center p-1.5 space-x-0.5">
            <BasicToolbarButtons onFormat={handleFormat} />
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            <FontSelector currentFormat={defaultFormat} onFormat={handleFormat} onMenuOpen={menuName => setActiveMenu(menuName)} showMenu={activeMenu === 'font'} />
            <FontSizeSelector currentFormat={defaultFormat} onFormat={handleFormat} onMenuOpen={menuName => setActiveMenu(menuName)} showMenu={activeMenu === 'fontSize'} />
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            <AlignmentButtons currentFormat={defaultFormat} onFormat={handleFormat} onMenuOpen={menuName => setActiveMenu(menuName)} showMenu={activeMenu === 'align'} />
            <RecentColors onColorSelect={handleColorSelect} recentColors={recentColors} onMenuOpen={menuName => setActiveMenu(menuName)} showMenu={activeMenu === 'recentColors'} />
            <ColorPicker currentFormat={defaultFormat} onFormat={handleFormat} onColorSelect={handleColorSelect} onMenuOpen={menuName => setActiveMenu(menuName)} showMenu={activeMenu === 'color'} />
            <BackgroundColorPicker currentFormat={defaultFormat} onFormat={handleFormat} onColorSelect={handleBackgroundColorSelect} onMenuOpen={menuName => setActiveMenu(menuName)} showMenu={activeMenu === 'bgcolor'} />
            <MoreMenu onFormat={handleFormat} onMenuOpen={menuName => setActiveMenu(menuName)} showMenu={activeMenu === 'more'} />
      </div>
    </div>,
    document.body
  );
};

// PropTypes 정의
NotionLikeToolbar.propTypes = {
  selection: PropTypes.shape({
    // Quill 에디터 선택 객체
    quill: PropTypes.object,
    range: PropTypes.object,
    // 일반 텍스트 선택 객체
    text: PropTypes.string,
    element: PropTypes.object,
    selection: PropTypes.object,
    // 위치 정보
    rect: PropTypes.shape({
      left: PropTypes.number,
      top: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number
    })
  }),
  onFormatChange: PropTypes.func,
  currentFormat: PropTypes.shape({
    fontFamily: PropTypes.string,
    fontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fontWeight: PropTypes.string,
    fontStyle: PropTypes.string,
    textAlign: PropTypes.string,
    lineHeight: PropTypes.string,
    color: PropTypes.string,
    backgroundColor: PropTypes.string
  }),
  enableGlobalSelectionClearer: PropTypes.bool,
  onSelectionCleared: PropTypes.func,
};


export default NotionLikeToolbar;