/**
 * 구분선 블록 컴포넌트
 * 
 * @description 콘텐츠를 구분하는 선을 그리는 블록
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';

export const DividerBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  placeholder = "",
  isEditing,
  onEditingChange 
}) => {
  // 구분선 스타일 옵션
  const dividerStyles = {
    solid: {
      className: 'border-gray-300 dark:border-gray-600',
      style: { borderTopStyle: 'solid', borderTopWidth: '1px' }
    },
    dashed: {
      className: 'border-gray-300 dark:border-gray-600',
      style: { borderTopStyle: 'dashed', borderTopWidth: '1px' }
    },
    dotted: {
      className: 'border-gray-300 dark:border-gray-600',
      style: { borderTopStyle: 'dotted', borderTopWidth: '2px' }
    },
    double: {
      className: 'border-gray-300 dark:border-gray-600',
      style: { borderTopStyle: 'double', borderTopWidth: '3px' }
    }
  };

  const currentStyle = block.metadata?.style || 'solid';
  const dividerStyle = dividerStyles[currentStyle] || dividerStyles.solid;

  // 스타일 변경 처리
  const handleStyleChange = (style) => {
    onUpdate({
      metadata: {
        ...block.metadata,
        style
      }
    });
  };

  // 클릭 처리 - 스타일 변경만 가능하도록
  const handleClick = (e) => {
    // 클릭 이벤트가 버블링되지 않도록 중지
    e.stopPropagation();
  };

  return (
    <div 
      className="divider-block py-1 cursor-pointer group"
      onClick={handleClick}
      role="separator"
      aria-label="구분선"
    >
      {/* 구분선 */}
      <div 
        className={`w-full ${dividerStyle.className} transition-colors duration-200`}
        style={dividerStyle.style}
      />
      
      {/* 편집 도구 (호버 시 표시) */}
      {!readOnly && (
        <div className="flex justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 shadow-sm">
            {Object.entries(dividerStyles).map(([styleKey, styleValue]) => (
              <button
                key={styleKey}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStyleChange(styleKey);
                }}
                className={`
                  w-8 h-6 border-t-2 transition-colors duration-150
                  ${currentStyle === styleKey 
                    ? 'border-blue-500' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                `}
                style={{
                  borderTopStyle: styleValue.style.borderTopStyle,
                  borderTopWidth: styleValue.style.borderTopWidth
                }}
                title={`${styleKey} 스타일`}
              />
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};