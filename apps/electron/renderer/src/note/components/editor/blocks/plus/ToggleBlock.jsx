import React, { useState, useEffect, useRef } from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';

/**
 * ToggleBlock - Minimal & Modern
 * @description 미니멀하고 현대적인 토글 블록 - 노션 스타일의 접기/펼치기
 * @version 2.0.0
 */
const ToggleBlock = ({
  block,
  onUpdate,
  onFocus,
  onRemove,
  readOnly = false,
  placeholder = '토글 제목',
  isEditing,
  onEditingChange,
  index
}) => {
  // 기본 설정값
  const defaultSettings = {
    title: '',
    open: false,
    style: 'minimal', // minimal, bordered, elevated, compact
    size: 'medium', // small, medium, large
    color: 'gray', // gray, blue, green, purple, amber
    showIcon: true,
    animation: 'smooth', // smooth, fast, none
    indent: true,
    autoClose: false
  };

  // 상태 관리
  const [settings, setSettings] = useState({
    ...defaultSettings,
    ...block.metadata?.settings,
    title: block.metadata?.title || { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
    open: block.metadata?.open ?? defaultSettings.open
  });
  
  const [content, setContent] = useState(block.content || { type: 'doc', content: [{ type: 'paragraph', content: [] }] });
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // 색상 시스템
  const colorSystem = {
    gray: {
      primary: 'text-gray-600 dark:text-gray-400',
      secondary: 'text-gray-500 dark:text-gray-500',
      bg: 'bg-gray-50 dark:bg-gray-800/30',
      border: 'border-gray-200 dark:border-gray-700',
      hover: 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
    },
    blue: {
      primary: 'text-blue-600 dark:text-blue-400',
      secondary: 'text-blue-500 dark:text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-700',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-800/30'
    },
    green: {
      primary: 'text-green-600 dark:text-green-400',
      secondary: 'text-green-500 dark:text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-700',
      hover: 'hover:bg-green-100 dark:hover:bg-green-800/30'
    },
    purple: {
      primary: 'text-purple-600 dark:text-purple-400',
      secondary: 'text-purple-500 dark:text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-700',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-800/30'
    },
    amber: {
      primary: 'text-amber-600 dark:text-amber-400',
      secondary: 'text-amber-500 dark:text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-700',
      hover: 'hover:bg-amber-100 dark:hover:bg-amber-800/30'
    }
  };

  // 사이즈 시스템
  const sizeSystem = {
    small: {
      title: 'text-sm font-medium',
      content: 'text-xs',
      padding: 'py-1',
      icon: 'w-3 h-3',
      gap: 'gap-1.5'
    },
    medium: {
      title: 'text-base font-medium',
      content: 'text-sm',
      padding: 'py-2',
      icon: 'w-4 h-4',
      gap: 'gap-2'
    },
    large: {
      title: 'text-lg font-medium',
      content: 'text-base',
      padding: 'py-3',
      icon: 'w-5 h-5',
      gap: 'gap-3'
    }
  };

  // 스타일 시스템
  const styleSystem = {
    minimal: {
      container: 'border-none bg-transparent',
      header: 'rounded-md transition-colors duration-150',
      content: 'mt-2'
    },
    bordered: {
      container: 'border rounded-lg',
      header: 'p-3 rounded-t-lg transition-colors duration-150',
      content: 'p-3 border-t'
    },
    elevated: {
      container: 'border rounded-lg shadow-sm bg-white dark:bg-gray-900',
      header: 'p-3 rounded-t-lg transition-colors duration-150',
      content: 'p-3 border-t bg-gray-50/50 dark:bg-gray-800/30'
    },
    compact: {
      container: 'border-l-2 pl-3',
      header: 'py-1 transition-colors duration-150',
      content: 'mt-1 pl-6'
    }
  };

  // 애니메이션 속도
  const animationSpeed = {
    smooth: 'duration-300',
    fast: 'duration-150',
    none: 'duration-0'
  };

  // 메타데이터 업데이트
  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        content,
        metadata: {
          ...block.metadata,
          settings
        }
      });
    }
  }, [settings, content]);

  // 토글 상태 변경
  const handleToggle = () => {
    setSettings(prev => ({ ...prev, open: !prev.open }));
  };

  // 제목 ProseMirror 변경 처리
  const handleTitleChange = (json) => {
    setSettings(prev => ({ ...prev, title: json }));
  };


  // ProseMirror 콘텐츠 변경 처리
  const handleProseMirrorChange = (json) => {
    setContent(json);
  };


  // 스타일 적용
  const colors = colorSystem[settings.color];
  const sizes = sizeSystem[settings.size];
  const styles = styleSystem[settings.style];
  const speed = animationSpeed[settings.animation];

  return (
    <div 
      ref={containerRef}
      className={`relative ${sizes.padding} group transition-all duration-200 ${
        styles.container
      } ${colors.border} ${
        isFocused ? 'ring-1 ring-gray-200 dark:ring-gray-700' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onFocus}
    >
      {/* 토글 헤더 */}
      <div className={`flex items-center justify-between ${styles.header} ${sizes.gap}`}>
        <div className={`flex items-center ${sizes.gap} flex-1 min-w-0`}>
          {/* 토글 아이콘 */}
          {settings.showIcon && (
            <div 
              className={`transition-transform ${speed} cursor-pointer p-1 rounded ${colors.hover} ${
                settings.open ? 'rotate-90' : 'rotate-0'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
            >
              <svg 
                className={`${sizes.icon} ${colors.secondary}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}

          {/* 제목 */}
          <div className="flex-1 min-w-0">
            <ProseMirrorTextEditor
              content={settings.title}
              onChange={handleTitleChange}
              placeholder={placeholder}
              readOnly={readOnly}
              blockId={`toggle-title-${block.id}`}
              blockType="toggle-title"
              className={`relative z-10 outline-none ${sizes.title} text-gray-700 dark:text-gray-200 placeholder-gray-400`}
              style={{ 
                fontSize: sizes.title.includes('text-sm') ? '14px' : sizes.title.includes('text-lg') ? '18px' : '16px',
                lineHeight: '1.4',
                fontFamily: 'inherit',
                fontWeight: 'medium',
                fontStyle: 'normal',
                textAlign: 'left',
                color: 'inherit',
                backgroundColor: 'transparent',
                minHeight: '24px'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* 상태 표시 */}
          {content && content.content && content.content[0] && content.content[0].content && (
            <div className="text-xs text-gray-400 dark:text-gray-600">
              {(() => {
                let textLength = 0;
                if (content.content[0].content) {
                  textLength = content.content[0].content.reduce((acc, node) => {
                    return acc + (node.text ? node.text.length : 0);
                  }, 0);
                }
                return textLength > 0 ? `${textLength}자` : '';
              })()}
            </div>
          )}
        </div>

        {/* 컨트롤 버튼 */}
        {!readOnly && (
          <div className={`flex items-center gap-1 transition-opacity duration-200 ${
            isHovered || showSettings ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* 복사 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // ProseMirror JSON에서 텍스트 추출하여 복사
                let plainText = '';
                if (content.content && content.content[0] && content.content[0].content) {
                  plainText = content.content[0].content.map(node => node.text || '').join('');
                }
                navigator.clipboard.writeText(plainText);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors duration-150"
              title="내용 복사"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* 설정 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors duration-150"
              title="설정"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>

            {/* 삭제 */}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors duration-150"
                title="삭제"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 토글 내용 */}
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all ${speed} ease-out ${
          settings.open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={styles.content}>
          <ProseMirrorTextEditor
            content={content}
            onChange={handleProseMirrorChange}
            placeholder="내용을 입력하세요..."
            readOnly={readOnly}
            blockId={`toggle-${block.id}`}
            blockType="toggle"
            className={`relative z-10 outline-none min-h-[80px] leading-relaxed text-gray-900 dark:text-gray-100 ${
              settings.indent ? 'pl-6' : ''
            }`}
            style={{ 
              fontSize: sizes.content.includes('text-xs') ? '12px' : sizes.content.includes('text-sm') ? '14px' : '16px',
              lineHeight: '1.6',
              fontFamily: 'inherit',
              fontWeight: 'normal',
              fontStyle: 'normal',
              textAlign: 'left',
              color: 'inherit',
              backgroundColor: 'transparent'
            }}
            onFocus={() => {
              setIsFocused(true);
              if (onEditingChange) onEditingChange(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              if (onEditingChange) onEditingChange(false);
            }}
          />
        </div>
      </div>

      {/* 설정 패널 */}
      {showSettings && !readOnly && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md shadow-sm z-30 p-3">
          <div className="space-y-3">
            {/* 스타일 선택 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12">스타일</label>
              <div className="flex gap-1 flex-1">
                {[
                  { id: 'minimal', name: '미니멀' },
                  { id: 'bordered', name: '테두리' },
                  { id: 'elevated', name: '부각' },
                  { id: 'compact', name: '컴팩트' }
                ].map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSettings(prev => ({ ...prev, style: style.id }))}
                    className={`px-2 py-1 text-xs rounded transition-colors duration-150 ${
                      settings.style === style.id
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 색상 선택 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12">색상</label>
              <div className="flex gap-1 flex-1">
                {Object.entries(colorSystem).map(([key, color]) => (
                  <button
                    key={key}
                    onClick={() => setSettings(prev => ({ ...prev, color: key }))}
                    className={`w-6 h-6 rounded ${color.bg} ${
                      settings.color === key ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                    }`}
                    title={key}
                  />
                ))}
              </div>
            </div>

            {/* 크기 선택 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12">크기</label>
              <div className="flex gap-1 flex-1">
                {[
                  { id: 'small', name: '작게' },
                  { id: 'medium', name: '보통' },
                  { id: 'large', name: '크게' }
                ].map(size => (
                  <button
                    key={size.id}
                    onClick={() => setSettings(prev => ({ ...prev, size: size.id }))}
                    className={`px-2 py-1 text-xs rounded transition-colors duration-150 ${
                      settings.size === size.id
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 애니메이션 속도 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12">애니메이션</label>
              <div className="flex gap-1 flex-1">
                {[
                  { id: 'smooth', name: '부드럽게' },
                  { id: 'fast', name: '빠르게' },
                  { id: 'none', name: '없음' }
                ].map(anim => (
                  <button
                    key={anim.id}
                    onClick={() => setSettings(prev => ({ ...prev, animation: anim.id }))}
                    className={`px-2 py-1 text-xs rounded transition-colors duration-150 ${
                      settings.animation === anim.id
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {anim.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 옵션 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12">옵션</label>
              <div className="flex gap-3 flex-1">
                <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={settings.showIcon}
                    onChange={(e) => setSettings(prev => ({ ...prev, showIcon: e.target.checked }))}
                    className="w-3 h-3 text-gray-600 focus:ring-gray-400 border-gray-300 rounded"
                  />
                  <span>아이콘 표시</span>
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={settings.indent}
                    onChange={(e) => setSettings(prev => ({ ...prev, indent: e.target.checked }))}
                    className="w-3 h-3 text-gray-600 focus:ring-gray-400 border-gray-300 rounded"
                  />
                  <span>내용 들여쓰기</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 외부 클릭으로 설정 닫기 */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setShowSettings(false)}
        />
      )}

    </div>
  );
};

export default ToggleBlock;