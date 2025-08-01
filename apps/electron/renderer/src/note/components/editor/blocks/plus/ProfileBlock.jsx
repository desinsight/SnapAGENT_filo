import React, { useRef, useState } from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';

/**
 * ProfileBlock - 미니멀 디자인 프로필 블록
 */
const ProfileBlock = ({ block, onUpdate, onFocus, readOnly = false, placeholder = "이름", isEditing, onEditingChange }) => {
  const [name, setName] = useState(block.metadata?.name || { type: 'doc', content: [{ type: 'paragraph', content: [] }] });
  const [title, setTitle] = useState(block.metadata?.title || { type: 'doc', content: [{ type: 'paragraph', content: [] }] });
  const [desc, setDesc] = useState(block.content || { type: 'doc', content: [{ type: 'paragraph', content: [] }] });
  const [image, setImage] = useState(block.metadata?.image || '');
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleNameChange = (json) => {
    setName(json);
    onUpdate({ metadata: { ...block.metadata, name: json, title, image }, content: desc });
  };

  const handleTitleChange = (json) => {
    setTitle(json);
    onUpdate({ metadata: { ...block.metadata, name, title: json, image }, content: desc });
  };

  const handleDescChange = (json) => {
    setDesc(json);
    onUpdate({ metadata: { ...block.metadata, name, title, image }, content: json });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    onUpdate({ metadata: { ...block.metadata, image: url, name, title }, content: desc });
  };

  const getInitials = () => {
    const textContent = name?.content?.[0]?.content?.[0]?.text || '';
    if (!textContent) return '';
    const words = textContent.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return textContent.charAt(0).toUpperCase();
  };

  return (
    <div 
      className="profile-block py-2 flex items-center gap-3 group"
      onClick={onFocus}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 이미지 */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
              {getInitials()}
            </div>
          )}
        </div>
        
        {/* 이미지 변경 버튼 - 호버시만 표시 */}
        {!readOnly && isHovered && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* 텍스트 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          {/* 이름 */}
          <ProseMirrorTextEditor
            content={name}
            onChange={handleNameChange}
            placeholder={placeholder}
            readOnly={readOnly}
            blockId={`profile-name-${block.id}`}
            blockType="profile-name"
            className="text-base font-medium text-gray-900 dark:text-gray-100"
            style={{ 
              fontSize: '16px',
              lineHeight: '1.2',
              fontWeight: '500'
            }}
          />
          
          {/* 직함 */}
          <ProseMirrorTextEditor
            content={title}
            onChange={handleTitleChange}
            placeholder="직함"
            readOnly={readOnly}
            blockId={`profile-title-${block.id}`}
            blockType="profile-title"
            className="text-sm text-gray-500 dark:text-gray-400"
            style={{ 
              fontSize: '14px',
              lineHeight: '1.2'
            }}
          />
        </div>
        
        {/* 설명 */}
        <ProseMirrorTextEditor
          content={desc}
          onChange={handleDescChange}
          placeholder="설명"
          readOnly={readOnly}
          blockId={`profile-desc-${block.id}`}
          blockType="profile-desc"
          className="text-sm text-gray-600 dark:text-gray-300 mt-1"
          style={{ 
            fontSize: '14px',
            lineHeight: '1.4'
          }}
        />
      </div>
    </div>
  );
};

export default ProfileBlock; 