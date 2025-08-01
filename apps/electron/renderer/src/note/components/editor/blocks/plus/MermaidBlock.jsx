import React, { useState } from 'react';

/**
 * MermaidBlock
 * @description Mermaid 다이어그램(플로우차트 등) 입력을 지원하는 블록
 */
const MermaidBlock = ({ block, onUpdate, onFocus, readOnly = false, placeholder = "Mermaid 코드 입력", isEditing, onEditingChange }) => {
  const [code, setCode] = useState(block.content || 'graph TD; A-->B;');

  const handleChange = (e) => {
    setCode(e.target.value);
    onUpdate({ content: e.target.value });
  };

  return (
    <div className="mermaid-block py-2" onClick={onFocus}>
      <div className="mb-2">
        {readOnly ? (
          <div className="font-mono text-green-700 dark:text-green-300 whitespace-pre-line">{code}</div>
        ) : (
          <textarea
            value={code}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full min-h-[40px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded font-mono text-base"
            disabled={readOnly}
          />
        )}
      </div>
      {/* 미리보기: 실제 환경에서는 mermaid.js로 렌더링 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded px-3 py-2 font-mono text-green-700 dark:text-green-300">
        {code ? `미리보기: ${code}` : '다이어그램 미리보기'}
      </div>
    </div>
  );
};

export default MermaidBlock; 