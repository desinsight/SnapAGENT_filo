/**
 * 리스트 블록 컴포넌트 (ProseMirror 기반)
 * 
 * @description 불릿, 번호, 체크리스트 블록 - ProseMirror 엔진 사용
 * @author AI Assistant
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';

export const ListBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  placeholder = "",
  isEditing,
  onEditingChange,
  onSelectionChange,
  onStartTyping,
  textFormat = {},
  onFormatChange
}) => {
  const listType = block.type || 'bulletList';
  const [isChecked, setIsChecked] = useState(block.metadata?.checked || false);

  // 체크 상태 변경
  useEffect(() => {
    if (listType === 'checkList' && isChecked !== (block.metadata?.checked || false)) {
      onUpdate({ 
        metadata: { 
          ...block.metadata, 
          checked: isChecked 
        } 
      });
    }
  }, [isChecked, block.metadata, listType, onUpdate]);

  // ProseMirror 콘텐츠 변경 처리 (하이브리드 방식)
  const handleProseMirrorChange = (json, metadata = {}) => {
    console.log('List ProseMirror change received:', json); // 디버깅용
    
    // paragraph 모드에서 텍스트 추출 (단순화)
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
    
    console.log('Extracted content:', content); // 디버깅용
    
    // 하이브리드 방식에서는 블록 타입 변경 없이 텍스트 내용만 업데이트
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

  // 체크박스 클릭 처리
  const handleCheckClick = (e) => {
    e.stopPropagation();
    if (listType === 'checkList' && !readOnly) {
      setIsChecked(!isChecked);
    }
  };

  const getMarker = () => {
    switch (listType) {
      case 'bulletList':
        return '•';
      case 'numberedList':
        return ''; // CSS counter로 처리 (::before pseudo-element 사용)
      case 'checkList':
        return isChecked ? '☑' : '☐';
      default:
        return '';
    }
  };

  const getMarkerClass = () => {
    const baseClass = 'flex-shrink-0 w-6 text-left select-none';
    if (listType === 'checkList') {
      return `${baseClass} cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors`;
    }
    // 번호 리스트는 CSS counter로 처리, 불릿 리스트는 직접 표시
    return `${baseClass} text-gray-600 dark:text-gray-400`;
  };

  // 하이브리드 방식: 모든 리스트 타입에서 ProseMirror는 paragraph 모드로 사용
  const getProseMirrorBlockType = () => {
    return 'paragraph'; // 텍스트 편집만 담당, 리스트 구조는 BlockEditor가 관리
  };

  return (
    <div className={`list-block relative flex items-start ${listType}`} data-list-type={listType}>
      {/* 리스트 마커 */}
      <div 
        className={getMarkerClass()}
        onClick={handleCheckClick}
        style={{ minWidth: '1.5em', marginRight: '0.5em' }}
      >
        {getMarker()}
      </div>
      
      {/* 텍스트 에디터 */}
      <div className="flex-1">
        <ProseMirrorTextEditor
          content={block.content}
          onChange={handleProseMirrorChange}
          onSelectionChange={handleProseMirrorSelectionChange}
          onFormatChange={handleProseMirrorFormatChange}
          placeholder={placeholder}
          readOnly={readOnly}
          blockId={block.id}
          blockType={getProseMirrorBlockType()}
          focused={block.focused} // 포커스 상태 전달
          className={`relative z-10 outline-none min-h-[24px] leading-relaxed text-gray-900 dark:text-gray-100 ${isChecked && listType === 'checkList' ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}
          style={{ 
            fontSize: '15px', 
            lineHeight: '1.5',
            fontFamily: 'inherit',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            color: 'inherit',
            backgroundColor: 'transparent'
          }}
        />
      </div>
    </div>
  );
};