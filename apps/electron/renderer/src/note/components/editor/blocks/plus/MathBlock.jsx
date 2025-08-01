import React, { useState } from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';

/**
 * MathBlock
 * @description 수식/LaTeX 입력을 지원하는 블록
 */
const MathBlock = ({ block, onUpdate, onFocus, readOnly = false, placeholder = "LaTeX 수식 입력", isEditing, onEditingChange }) => {
  const [latex, setLatex] = useState(block.content || { type: 'doc', content: [{ type: 'paragraph', content: [] }] });

  // ProseMirror 핸들러들
  const handleProseMirrorChange = (json) => {
    setLatex(json);
    onUpdate({ content: json });
  };


  return (
    <div className="math-block py-2" onClick={onFocus}>
      <div className="mb-2">
        <ProseMirrorTextEditor
          content={latex}
          onChange={handleProseMirrorChange}
          placeholder={placeholder}
          readOnly={readOnly}
          blockId={`math-${block.id}`}
          blockType="math"
          className="relative z-10 outline-none min-h-[36px] leading-relaxed text-gray-900 dark:text-gray-100 w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded font-mono text-base"
          style={{ 
            fontSize: '16px',
            lineHeight: '1.5',
            fontFamily: 'monospace',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            color: 'inherit',
            backgroundColor: 'transparent'
          }}
        />
      </div>
      
      {/* 미리보기: 실제 환경에서는 KaTeX/MathJax로 렌더링 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded px-3 py-2 text-lg font-mono text-blue-700 dark:text-blue-300">
        {(() => {
          let plainText = '';
          if (typeof latex === 'string') {
            plainText = latex;
          } else if (latex.content && latex.content[0] && latex.content[0].content) {
            plainText = latex.content[0].content.map(node => node.text || '').join('');
          }
          return plainText ? `미리보기: ${plainText}` : '수식 미리보기';
        })()}
      </div>

    </div>
  );
};

export default MathBlock; 