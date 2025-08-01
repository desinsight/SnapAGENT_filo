/**
 * 인용 블록 컴포넌트 (ProseMirror 기반)
 * 
 * @description 인용문을 입력하고 편집할 수 있는 블록 - ProseMirror 엔진 사용
 * @author AI Assistant
 * @version 2.0.0
 */

import React from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';

export const QuoteBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  placeholder = "",
  isEditing,
  onEditingChange,
  onSelectionChange,
  onStartTyping,
  textFormat,
  onFormatChange
}) => {
  // ProseMirror 콘텐츠 변경 처리
  const handleProseMirrorChange = (json) => {
    console.log('Quote ProseMirror change received:', json); // 디버깅용
    
    // JSON에서 텍스트 추출
    let content = '';
    if (json.content && json.content.length > 0) {
      const paragraph = json.content[0];
      if (paragraph.content && paragraph.content.length > 0) {
        content = paragraph.content.map(node => {
          if (node.type === 'text') {
            return node.text || '';
          }
          return '';
        }).join('');
      }
    }
    
    console.log('Extracted quote content:', content); // 디버깅용
    onUpdate({ content });
    if (onStartTyping) {
      onStartTyping(true);
    }
  };

  // ProseMirror 선택 변경 처리
  const handleProseMirrorSelectionChange = (selection) => {
    if (onSelectionChange) {
      onSelectionChange(selection);
    }
  };

  // ProseMirror 포맷팅 변경 처리
  const handleProseMirrorFormatChange = (cmd, value) => {
    if (onFormatChange) {
      onFormatChange(cmd, value);
    }
  };

  return (
    <div className="quote-block relative">
      {/* 왼쪽 인용 바 */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      
      {/* 인용 아이콘 */}
      <div className="absolute -left-2 -top-1 w-4 h-4 bg-white dark:bg-gray-900 flex items-center justify-center">
        <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-10zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
        </svg>
      </div>
      
      {/* 콘텐츠 */}
      <div className="pl-8 pr-4 py-2 relative">
        <ProseMirrorTextEditor
          content={block.content}
          onChange={handleProseMirrorChange}
          onSelectionChange={handleProseMirrorSelectionChange}
          onFormatChange={handleProseMirrorFormatChange}
          placeholder={placeholder || "인용문을 입력하세요..."}
          readOnly={readOnly}
          blockId={block.id}
          blockType="quote" // 인용구 블록 타입
          className="relative z-10 outline-none min-h-[32px] leading-relaxed text-gray-700 dark:text-gray-300 font-medium italic"
          style={{ 
            fontSize: '18px', 
            lineHeight: '1.6',
            fontFamily: 'inherit',
            fontStyle: 'italic',
            fontWeight: '500',
            textAlign: 'left',
            color: 'inherit',
            backgroundColor: 'transparent'
          }}
        />
      </div>
    </div>
  );
};