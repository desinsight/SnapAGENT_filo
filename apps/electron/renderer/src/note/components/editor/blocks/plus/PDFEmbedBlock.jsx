import React, { useRef, useState } from 'react';

/**
 * PDFEmbedBlock
 * @description PDF 문서 임베드를 지원하는 블록
 */
const isPdfUrl = (url) => /\.pdf$/i.test(url);

const PDFEmbedBlock = ({ block, onUpdate, onFocus, readOnly = false, placeholder = "PDF 파일 업로드 또는 URL 입력", isEditing, onEditingChange }) => {
  const [inputUrl, setInputUrl] = useState(block.content || '');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const embedUrl = block.content || inputUrl;

  const handleUrlChange = (e) => {
    setInputUrl(e.target.value);
    setError('');
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!isPdfUrl(inputUrl)) {
      setError('PDF 파일(.pdf)만 지원합니다.');
      return;
    }
    onUpdate({ content: inputUrl });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isPdfUrl(file.name)) {
      setError('PDF 파일(.pdf)만 지원합니다.');
      return;
    }
    const url = URL.createObjectURL(file);
    onUpdate({ content: url });
    setInputUrl(url);
    setError('');
  };

  const handleDelete = () => {
    setInputUrl('');
    onUpdate({ content: '' });
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="pdf-embed-block py-2" onClick={onFocus}>
      {/* URL 입력 및 파일 업로드 */}
      {!embedUrl && !readOnly && (
        <form onSubmit={handleUrlSubmit} className="flex items-center space-x-2 mb-2">
          <input
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
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={readOnly}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-150"
            disabled={readOnly}
          >
            파일 선택
          </button>
        </form>
      )}
      {error && <div className="text-red-500 text-sm mb-1">{error}</div>}

      {/* PDF 미리보기 */}
      {embedUrl && (
        <div className="relative mt-2">
          <iframe
            src={embedUrl}
            title="PDF 미리보기"
            className="w-full min-h-[480px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
          {/* 삭제/교체 버튼 */}
          {!readOnly && (
            <button
              onClick={handleDelete}
              className="absolute top-2 right-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-1 shadow hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
              title="PDF 삭제/교체"
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

export default PDFEmbedBlock; 