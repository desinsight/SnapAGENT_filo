/**
 * 헤딩 블록 컴포넌트 (ProseMirror 기반)
 * 
 * @description 제목 블록 (H1, H2, H3) - ProseMirror 엔진 사용
 * @author AI Assistant
 * @version 2.0.0
 */

import React, { useRef, useEffect } from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';

const HEADING_STYLES = {
  heading1: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    lineHeight: '1.2'
  },
  heading2: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '0.375rem',
    lineHeight: '1.3'
  },
  heading3: {
    fontSize: '1.25rem',
    fontWeight: '500',
    marginBottom: '0.25rem',
    lineHeight: '1.4'
  }
};

export const HeadingBlock = ({ 
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
  const headingLevel = block.type || 'heading1';
  const styles = HEADING_STYLES[headingLevel] || HEADING_STYLES.heading1;

  // 제목 레벨에 따른 placeholder 생성
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    const level = headingLevel.slice(-1);
    return `제목 ${level}`;
  };

  // 제목 레벨에 따른 스타일 동적 계산
  const getDynamicStyles = () => {
    const baseStyles = HEADING_STYLES[headingLevel] || HEADING_STYLES.heading1;
    return {
      fontSize: baseStyles.fontSize,
      fontWeight: baseStyles.fontWeight,
      lineHeight: baseStyles.lineHeight,
      marginBottom: baseStyles.marginBottom,
      fontFamily: 'inherit',
      fontStyle: 'normal',
      textAlign: 'left',
      color: 'inherit',
      backgroundColor: 'transparent'
    };
  };

  // ProseMirror 콘텐츠 변경 처리
  const handleProseMirrorChange = (json, metadata = {}) => {
    console.log('Heading ProseMirror change received:', json); // 디버깅용
    console.log('Metadata:', metadata); // 메타데이터 확인
    
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
    
    console.log('Extracted heading content:', content); // 디버깅용
    
    // 블록 타입 변경이 있는 경우
    if (metadata.blockTypeChanged && metadata.newBlockType) {
      console.log('Block type changed to:', metadata.newBlockType);
      onUpdate({ 
        content,
        type: metadata.newBlockType // 블록 타입도 함께 업데이트
      });
    } else {
      onUpdate({ content });
    }
    
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
    <div className="heading-block relative">
      <ProseMirrorTextEditor
        content={block.content}
        onChange={handleProseMirrorChange}
        onSelectionChange={handleProseMirrorSelectionChange}
        onFormatChange={handleProseMirrorFormatChange}
        placeholder={getPlaceholder()}
        readOnly={readOnly}
        blockId={block.id}
        blockType={headingLevel} // 제목 레벨 전달
        className="relative z-10 outline-none min-h-[32px] text-gray-900 dark:text-gray-100"
        style={getDynamicStyles()}
      />
    </div>
  );
};