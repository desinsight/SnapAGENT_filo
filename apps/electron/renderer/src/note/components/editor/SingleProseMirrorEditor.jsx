/**
 * 단일 ProseMirror 에디터 컴포넌트
 * 
 * @description 블록 방식이 아닌 단일 ProseMirror 에디터 (워드프로세서 스타일)
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import ProseMirrorTextEditor from './prosemirror/ProseMirrorTextEditor';
import { SelectionProvider } from './selection/context/SelectionContext.jsx';

const SingleProseMirrorEditor = ({
  content = '',
  onChange,
  placeholder = '여기에 텍스트를 입력하세요...',
  readOnly = false,
  className = '',
  style = {}
}) => {
  const [editorContent, setEditorContent] = useState(content);
  const [focused, setFocused] = useState(false);
  const editorRef = useRef(null);

  // 초기 컨텐츠 설정
  useEffect(() => {
    if (content !== editorContent) {
      setEditorContent(content);
    }
  }, [content]);

  // 컨텐츠 변경 핸들러
  const handleContentChange = (newContent, options = {}) => {
    setEditorContent(newContent);
    if (onChange) {
      onChange(newContent, options);
    }
  };

  // 기본 ProseMirror 문서 구조
  const getDefaultContent = () => {
    if (typeof content === 'object' && content !== null) {
      return content;
    }
    
    return {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: content ? [{
          type: 'text',
          text: content
        }] : []
      }]
    };
  };

  return (
    <SelectionProvider>
      <div 
        className={`single-prosemirror-editor max-w-5xl mx-auto ${className}`}
        style={{
          minHeight: '400px',
          border: 'none',
          borderRadius: '8px',
          padding: '30px 16px',
          backgroundColor: '#ffffff',
          ...style
        }}
      >
        <ProseMirrorTextEditor
          ref={editorRef}
          content={getDefaultContent()}
          onChange={handleContentChange}
          placeholder={placeholder}
          readOnly={readOnly}
          focused={focused}
          blockId="single-editor"
          blockType="paragraph"
          isSingleEditor={true}
          className="single-editor-prosemirror"
          style={{
            minHeight: '360px',
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#374151'
          }}
        />
      </div>
    </SelectionProvider>
  );
};

export default SingleProseMirrorEditor;