import React, { useRef, useState } from 'react';

/**
 * WebEmbedBlock
 * @description 웹사이트/iframe 임베드를 지원하는 블록
 */
const isValidUrl = (url) => /^https?:\/\//.test(url);

const WebEmbedBlock = ({ block, onUpdate, onFocus, readOnly = false, placeholder = "웹사이트 URL을 입력하세요", isEditing, onEditingChange }) => {
  const [inputUrl, setInputUrl] = useState(block.content || '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const embedUrl = block.content || inputUrl;

  const handleUrlChange = (e) => {
    setInputUrl(e.target.value);
    setError('');
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!isValidUrl(inputUrl)) {
      setError('유효한 http(s) URL만 지원합니다.');
      return;
    }
    onUpdate({ content: inputUrl });
  };

  const handleDelete = () => {
    setInputUrl('');
    onUpdate({ content: '' });
    setError('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="web-embed-block py-2" onClick={onFocus}>
      {/* URL 입력 폼 */}
      {(!embedUrl || !block.content) && !readOnly && (
        <form onSubmit={handleUrlSubmit} className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="url"
            value={inputUrl}
            onChange={handleUrlChange}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled={readOnly}
          />
          <button
            type="submit"
            disabled={!inputUrl.trim() || readOnly}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            추가
          </button>
        </form>
      )}
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}

      {/* 웹사이트 임베드 미리보기 */}
      {embedUrl && block.content && (
        <div className="relative mt-3">
          <iframe
            src={embedUrl}
            title="웹사이트 임베드"
            className="w-full min-h-[320px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
          {/* 삭제/교체 버튼 */}
          {!readOnly && (
            <button
              onClick={handleDelete}
              className="absolute top-2 right-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-1 shadow hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
              title="임베드 삭제/교체"
              type="button"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WebEmbedBlock; 