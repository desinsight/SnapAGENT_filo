import React, { useRef, useState } from 'react';

/**
 * GalleryBlock
 * @description 여러 이미지를 카드/그리드 형태로 보여주는 갤러리 블록
 */
const GalleryBlock = ({ block, onUpdate, onFocus, readOnly = false, placeholder = "이미지 추가", isEditing, onEditingChange }) => {
  const [images, setImages] = useState(block.content || []);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));
    const updated = [...images, ...newImages];
    setImages(updated);
    onUpdate({ content: updated });
  };

  const handleDelete = (idx) => {
    const updated = images.filter((_, i) => i !== idx);
    setImages(updated);
    onUpdate({ content: updated });
  };

  return (
    <div className="gallery-block py-2" onClick={onFocus}>
      {/* 이미지 업로드 */}
      {!readOnly && (
        <div className="mb-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={readOnly}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
            disabled={readOnly}
          >
            이미지 추가
          </button>
        </div>
      )}
      {/* 이미지 썸네일 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div key={idx} className="relative group border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
            <img src={img.url} alt={img.name || `이미지${idx+1}`} className="w-full h-32 object-cover" />
            {!readOnly && (
              <button
                onClick={() => handleDelete(idx)}
                className="absolute top-1 right-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-1 shadow hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                title="이미지 삭제"
                type="button"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        ))}
      </div>
      {images.length === 0 && <div className="text-gray-400 text-sm mt-2">이미지가 없습니다.</div>}
    </div>
  );
};

export default GalleryBlock; 