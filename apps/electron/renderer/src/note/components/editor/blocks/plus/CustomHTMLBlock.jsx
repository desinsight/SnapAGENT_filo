import React, { useState } from 'react';

/**
 * CustomHTMLBlock
 * @description 커스텀 HTML 입력/렌더링 블록
 */
const CustomHTMLBlock = ({ block, onUpdate, onFocus, readOnly = false, placeholder = "<div>HTML 입력</div>", isEditing, onEditingChange }) => {
  const [html, setHtml] = useState(block.content || '');

  const handleChange = (e) => {
    setHtml(e.target.value);
    onUpdate({ content: e.target.value });
  };

  return (
    <div className="custom-html-block py-2" onClick={onFocus}>
      <div className="mb-2">
        {readOnly ? (
          <div className="font-mono text-pink-700 dark:text-pink-300 whitespace-pre-line">{html}</div>
        ) : (
          <textarea
            value={html}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full min-h-[40px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded font-mono text-base"
            disabled={readOnly}
          />
        )}
      </div>
      {/* 미리보기: 실제 환경에서는 dangerouslySetInnerHTML 등으로 렌더링 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded px-3 py-2 font-mono text-pink-700 dark:text-pink-300">
        {html ? `미리보기: ${html}` : 'HTML 미리보기'}
      </div>
      <div className="text-xs text-red-500 mt-1">※ HTML 미리보기는 보안상 제한될 수 있습니다.</div>
    </div>
  );
};

export default CustomHTMLBlock; 