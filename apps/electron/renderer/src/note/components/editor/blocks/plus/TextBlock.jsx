/**
 * 텍스트 블록 컴포넌트
 * 
 * @description 일반 텍스트를 입력하고 편집할 수 있는 블록
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';

export const TextBlock = ({ 
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
  // ProseMirror 콘텐츠 변경 처리
  const handleProseMirrorChange = (json) => {
    if (!json || !json.content) {
      onUpdate({ content: json });
      if (onStartTyping) onStartTyping(true);
      return;
    }
    // ProseMirror JSON에서 plain text 추출
    let plainText = '';
    if (json.content && json.content.length > 0) {
      const paragraph = json.content[0];
      if (paragraph.content && paragraph.content.length > 0) {
        plainText = paragraph.content.map(node => node.text || '').join('');
      }
    }

    // 패턴 감지 및 변환 함수
    const stripPatternFromJson = (pattern) => {
      // 첫 번째 텍스트 노드에서 패턴 제거
      const newJson = JSON.parse(JSON.stringify(json)); // deep copy
      if (
        newJson.content &&
        newJson.content[0] &&
        newJson.content[0].content &&
        newJson.content[0].content[0] &&
        newJson.content[0].content[0].type === 'text'
      ) {
        newJson.content[0].content[0].text = newJson.content[0].content[0].text.replace(pattern, '');
      }
      return newJson;
    };

    // 번호 리스트
    if (/^\d+\.\s/.test(plainText)) {
      const newJson = stripPatternFromJson(/^\d+\.\s/);
      onUpdate({ type: 'numberedList', content: newJson });
      if (onStartTyping) onStartTyping(true);
      return;
    }
    // 불릿 리스트
    if (/^[-*+]\s/.test(plainText)) {
      const newJson = stripPatternFromJson(/^[-*+]\s/);
      onUpdate({ type: 'bulletList', content: newJson });
      if (onStartTyping) onStartTyping(true);
      return;
    }
    // 체크리스트
    if (/^\[\s*\]\s/.test(plainText)) {
      const newJson = stripPatternFromJson(/^\[\s*\]\s/);
      onUpdate({ type: 'checkList', content: newJson });
      if (onStartTyping) onStartTyping(true);
      return;
    }
    // 기본 동작
    onUpdate({ content: json });
    if (onStartTyping) {
      onStartTyping(true);
    }
  };

  const handleProseMirrorSelectionChange = (selection) => {
    if (onSelectionChange) {
      onSelectionChange(selection);
    }
  };

  const handleProseMirrorFormatChange = (cmd, value) => {
    if (onFormatChange) {
      onFormatChange(cmd, value);
    }
  };

  return (
    <div className="text-block relative">
      <ProseMirrorTextEditor
        content={block.content}
        onChange={handleProseMirrorChange}
        placeholder={placeholder}
        readOnly={readOnly}
        blockId={block.id}
        blockType="text"
        className="relative z-10 outline-none min-h-[24px] leading-relaxed text-gray-900 dark:text-gray-100"
        style={{ 
          fontSize: '16px', 
          lineHeight: '1.6',
          fontFamily: 'inherit',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          color: 'inherit',
          backgroundColor: 'transparent'
        }}
      />
    </div>
  );
};