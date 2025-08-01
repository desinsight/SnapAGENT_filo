/**
 * 사이드바 디자인 블록 컴포넌트 (완전 새로운 버전)
 * 
 * @description 노트 꾸미기용 예쁜 사이드바 디자인 블록 - 호버 시에만 편집 도구 표시
 * @author AI Assistant
 * @version 3.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';

export const SidebarLayout = ({
  block,
  onUpdate,
  onFocus,
  onAdd,
  blocks,
  index,
  onSplit,
  readOnly = false,
  isEditing,
  onEditingChange,
  textFormat,
  onFormatChange,
  onRemove,
  onSelectionChange,
  onStartTyping
}) => {
  // 기본 설정
  const [sidebarContent, setSidebarContent] = useState(block.metadata?.sidebarContent || '');
  const [mainContent, setMainContent] = useState(block.metadata?.mainContent || '');
  const [sidebarWidth, setSidebarWidth] = useState(block.metadata?.sidebarWidth || 40);
  const [colorTheme, setColorTheme] = useState(block.metadata?.colorTheme || 'ocean');
  
  // 상호작용 상태
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeArea, setActiveArea] = useState(null); // 'sidebar' | 'main' | null
  
  const containerRef = useRef(null);
  const sidebarTextareaRef = useRef(null);
  const mainTextareaRef = useRef(null);

  // 테마 색상 설정
  const colorThemes = {
    ocean: {
      gradient: 'from-blue-50 via-cyan-50 to-teal-50',
      darkGradient: 'dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-teal-900/20',
      accent: 'blue-500',
      border: 'border-blue-200/30 dark:border-blue-700/30',
      shadow: 'shadow-blue-100/50 dark:shadow-blue-900/20'
    },
    sunset: {
      gradient: 'from-orange-50 via-pink-50 to-red-50',
      darkGradient: 'dark:from-orange-900/20 dark:via-pink-900/20 dark:to-red-900/20',
      accent: 'orange-500',
      border: 'border-orange-200/30 dark:border-orange-700/30',
      shadow: 'shadow-orange-100/50 dark:shadow-orange-900/20'
    },
    forest: {
      gradient: 'from-green-50 via-emerald-50 to-lime-50',
      darkGradient: 'dark:from-green-900/20 dark:via-emerald-900/20 dark:to-lime-900/20',
      accent: 'green-500',
      border: 'border-green-200/30 dark:border-green-700/30',
      shadow: 'shadow-green-100/50 dark:shadow-green-900/20'
    },
    lavender: {
      gradient: 'from-purple-50 via-violet-50 to-indigo-50',
      darkGradient: 'dark:from-purple-900/20 dark:via-violet-900/20 dark:to-indigo-900/20',
      accent: 'purple-500',
      border: 'border-purple-200/30 dark:border-purple-700/30',
      shadow: 'shadow-purple-100/50 dark:shadow-purple-900/20'
    }
  };

  const currentTheme = colorThemes[colorTheme];

  // 메타데이터 업데이트
  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        metadata: {
          ...block.metadata,
          sidebarContent,
          mainContent,
          sidebarWidth,
          colorTheme
        }
      });
    }
  }, [sidebarContent, mainContent, sidebarWidth, colorTheme]);

  // 리사이징 핸들러
  const handleMouseDown = (e) => {
    if (readOnly) return;
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const containerWidth = containerRect.width;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(Math.max(startWidth + deltaPercent, 25), 65);
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 텍스트 영역 자동 높이 조절
  const autoResize = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`
        relative w-full min-h-[350px] rounded-2xl overflow-hidden
        bg-gradient-to-br ${currentTheme.gradient} ${currentTheme.darkGradient}
        border ${currentTheme.border}
        shadow-xl ${currentTheme.shadow}
        transition-all duration-500 ease-out
        ${isHovered || isFocused ? 'scale-[1.02] shadow-2xl' : 'hover:shadow-2xl'}
        ${isResizing ? 'select-none' : ''}
        group
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 편집 도구들 - 호버/포커스 시에만 표시 */}
      <div className={`
        absolute top-4 right-4 z-20 flex items-center space-x-2
        transition-all duration-300 ease-out
        ${isHovered || isFocused ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
      `}>
        {/* 테마 선택 */}
        {!readOnly && (
          <div className="flex items-center space-x-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 shadow-lg">
            {Object.entries(colorThemes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => setColorTheme(key)}
                className={`
                  w-6 h-6 rounded-md transition-all duration-200
                  bg-gradient-to-br ${theme.gradient}
                  border-2 ${colorTheme === key ? 'border-gray-600 scale-110' : 'border-transparent hover:scale-105'}
                `}
                title={key}
              />
            ))}
          </div>
        )}
        
        {/* 삭제 버튼 */}
        {!readOnly && onRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors duration-200 shadow-lg"
            title="블록 삭제"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex h-full min-h-[350px]">
        {/* 사이드바 */}
        <div 
          className="relative flex-shrink-0 p-6"
          style={{ width: `${sidebarWidth}%` }}
        >
          {/* 사이드바 라벨 - 호버 시에만 표시 */}
          <div className={`
            absolute top-2 left-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
            transition-all duration-300
            ${isHovered || activeArea === 'sidebar' ? 'opacity-100' : 'opacity-0'}
          `}>
            Sidebar
          </div>
          
          <div className="mt-4">
            <textarea
              ref={sidebarTextareaRef}
              value={sidebarContent}
              onChange={(e) => {
                setSidebarContent(e.target.value);
                autoResize(e.target);
                if (onStartTyping) onStartTyping(true);
              }}
              onFocus={() => {
                setIsFocused(true);
                setActiveArea('sidebar');
                if (onFocus) onFocus();
                if (onEditingChange) onEditingChange(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                setActiveArea(null);
                if (onEditingChange) onEditingChange(false);
              }}
              placeholder={readOnly ? '' : '사이드바 내용을 입력하세요...'}
              readOnly={readOnly}
              className={`
                w-full min-h-[100px] resize-none border-none outline-none bg-transparent
                text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
                text-sm leading-relaxed
                ${readOnly ? 'cursor-default' : 'cursor-text'}
                transition-all duration-200
              `}
              style={{
                fontFamily: textFormat?.fontFamily || 'Inter',
                fontSize: `${textFormat?.fontSize || 14}px`,
                overflow: 'hidden'
              }}
              onInput={(e) => autoResize(e.target)}
            />
            
            {/* 빈 상태 플레이스홀더 */}
            {!sidebarContent && !isFocused && (
              <div className="absolute inset-6 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400 dark:text-gray-600">
                  <div className="text-3xl mb-2 opacity-30">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <p className="text-sm opacity-60">사이드바</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 리사이저 */}
        <div
          onMouseDown={handleMouseDown}
          className={`
            relative w-2 cursor-col-resize flex-shrink-0
            transition-all duration-200
            ${!readOnly && (isHovered || isResizing) ? 'bg-white/30 dark:bg-gray-700/30' : 'bg-transparent'}
            group/resizer
          `}
          title={readOnly ? '' : '드래그하여 사이드바 너비 조절'}
        >
          <div className={`
            absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2
            bg-gradient-to-b from-transparent via-gray-400/50 to-transparent
            transition-all duration-200
            ${!readOnly && (isHovered || isResizing) ? 'opacity-100' : 'opacity-0'}
            group-hover/resizer:opacity-100
          `} />
          
          {/* 리사이저 핸들 */}
          {!readOnly && (
            <div className={`
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-6 h-12 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm
              rounded-full border border-gray-300/50 dark:border-gray-600/50
              flex items-center justify-center shadow-lg
              transition-all duration-200
              ${isHovered || isResizing ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
              hover:bg-white/80 dark:hover:bg-gray-700/80
            `}>
              <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          )}
        </div>

        {/* 메인 영역 */}
        <div className="flex-1 p-6 relative">
          {/* 메인 라벨 - 호버 시에만 표시 */}
          <div className={`
            absolute top-2 left-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
            transition-all duration-300
            ${isHovered || activeArea === 'main' ? 'opacity-100' : 'opacity-0'}
          `}>
            Main Content
          </div>
          
          <div className="mt-4">
            <textarea
              ref={mainTextareaRef}
              value={mainContent}
              onChange={(e) => {
                setMainContent(e.target.value);
                autoResize(e.target);
                if (onStartTyping) onStartTyping(true);
              }}
              onFocus={() => {
                setIsFocused(true);
                setActiveArea('main');
                if (onFocus) onFocus();
                if (onEditingChange) onEditingChange(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                setActiveArea(null);
                if (onEditingChange) onEditingChange(false);
              }}
              placeholder={readOnly ? '' : '메인 내용을 입력하세요...'}
              readOnly={readOnly}
              className={`
                w-full min-h-[150px] resize-none border-none outline-none bg-transparent
                text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
                text-base leading-relaxed
                ${readOnly ? 'cursor-default' : 'cursor-text'}
                transition-all duration-200
              `}
              style={{
                fontFamily: textFormat?.fontFamily || 'Inter',
                fontSize: `${textFormat?.fontSize || 16}px`,
                overflow: 'hidden'
              }}
              onInput={(e) => autoResize(e.target)}
            />
            
            {/* 빈 상태 플레이스홀더 */}
            {!mainContent && !isFocused && (
              <div className="absolute inset-6 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400 dark:text-gray-600">
                  <div className="text-4xl mb-3 opacity-20">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-base opacity-60">메인 컨텐츠</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 리사이징 중 오버레이 */}
      {isResizing && (
        <div className="absolute inset-0 bg-transparent cursor-col-resize z-30" />
      )}
      
      {/* 하단 너비 표시 - 리사이징 중에만 표시 */}
      {isResizing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
            {Math.round(sidebarWidth)}% / {Math.round(100 - sidebarWidth)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarLayout;