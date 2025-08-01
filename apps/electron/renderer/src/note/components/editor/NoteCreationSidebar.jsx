/**
 * 새 노트 작성 사이드바 컴포넌트
 * 
 * @description 새 노트 작성 및 편집시 사용되는 좌측 사이드바 - 템플릿 선택 및 노트 설정
 * @author AI Assistant
 * @version 1.1.0 - Enhanced UI/UX with minimal design
 */

import React, { useState } from 'react';
import { NOTE_CATEGORIES } from '../../constants/noteConfig';
import { NOTE_TEMPLATES } from '../../templates/index.js';

const NoteCreationSidebar = ({
  // 템플릿 관련
  selectedTemplate,
  onTemplateSelect,
  showTemplates = true, // 템플릿 섹션 표시 여부 (편집 모드에서는 false)
  
  // 노트 설정 관련
  noteOptions = {
    category: '개인',
    tags: [],
    isPrivate: true,
    enableAI: true
  },
  onOptionChange,
  onAddTag,
  onRemoveTag,
  
  // 공유노트 관련
  isSharedNote = false,
  collaborators = [],
  
  // 스타일 관련
  className = "",
  width = "w-72" // 기본 너비
}) => {
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);
  const [isTemplatesCollapsed, setIsTemplatesCollapsed] = useState(false);
  
  /**
   * 템플릿 선택 핸들러
   */
  const handleTemplateSelect = (template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  /**
   * 옵션 변경 핸들러
   */
  const handleOptionChange = (key, value) => {
    if (onOptionChange) {
      onOptionChange(key, value);
    }
  };

  /**
   * 태그 추가 핸들러
   */
  const handleAddTag = (tag) => {
    if (onAddTag) {
      onAddTag(tag);
    }
  };

  /**
   * 태그 제거 핸들러
   */
  const handleRemoveTag = (tagIndex) => {
    if (onRemoveTag) {
      onRemoveTag(tagIndex);
    }
  };

  return (
    <div className={`${width} bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${className}`}>
      {/* 템플릿 선택 - 새 노트 작성시에만 표시 */}
      {showTemplates && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsTemplatesCollapsed(!isTemplatesCollapsed)}
            className="w-full flex items-center justify-between text-left group mb-3"
          >
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">템플릿</h3>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${isTemplatesCollapsed ? '-rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {!isTemplatesCollapsed && (
            <div className="space-y-1">
              {NOTE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`w-full p-2 text-left transition-colors duration-150 ${
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 dark:text-gray-400">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{template.name}</div>
                      <div className="text-xs opacity-60 truncate">{template.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 노트 설정 */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <button
          onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
          className="w-full flex items-center justify-between text-left group mb-3"
        >
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">설정</h3>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${isSettingsCollapsed ? '-rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {!isSettingsCollapsed && (
          <div className="space-y-4">
            {/* 카테고리 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                카테고리
              </label>
              <select
                value={noteOptions.category}
                onChange={(e) => handleOptionChange('category', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {NOTE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                태그
              </label>
              <div className="space-y-2">
                {noteOptions.tags && noteOptions.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {noteOptions.tags.map((tag, index) => (
                      <span
                        key={`tag-${index}-${tag}`}
                        className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(index)}
                          className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="태그 입력 후 Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = e.target.value.trim();
                      if (value && !noteOptions.tags.includes(value)) {
                        handleAddTag(value);
                        e.target.value = '';
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* 옵션 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                옵션
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={noteOptions.isPrivate}
                    onChange={(e) => handleOptionChange('isPrivate', e.target.checked)}
                    className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    비공개 노트
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={noteOptions.enableAI}
                    onChange={(e) => handleOptionChange('enableAI', e.target.checked)}
                    className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    AI 기능 사용
                  </span>
                </label>
              </div>
            </div>

            {/* 공유노트 전용 설정 */}
            {isSharedNote && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  공유 설정
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      공개 범위
                    </label>
                    <select
                      value={noteOptions.visibility || 'shared'}
                      onChange={(e) => handleOptionChange('visibility', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="private">비공개</option>
                      <option value="shared">공유</option>
                      <option value="public">공개</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      권한 설정
                    </label>
                    <div className="space-y-1">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={noteOptions.permissions?.canEdit ?? true}
                          onChange={(e) => handleOptionChange('permissions', {
                            ...noteOptions.permissions,
                            canEdit: e.target.checked
                          })}
                          className="mr-2 w-3 h-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">편집 가능</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={noteOptions.permissions?.canComment ?? true}
                          onChange={(e) => handleOptionChange('permissions', {
                            ...noteOptions.permissions,
                            canComment: e.target.checked
                          })}
                          className="mr-2 w-3 h-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">댓글 가능</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={noteOptions.permissions?.canShare ?? true}
                          onChange={(e) => handleOptionChange('permissions', {
                            ...noteOptions.permissions,
                            canShare: e.target.checked
                          })}
                          className="mr-2 w-3 h-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">공유 가능</span>
                      </label>
                    </div>
                  </div>
                  
                  {collaborators.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        협업자 ({collaborators.length}명)
                      </label>
                      <div className="space-y-1">
                        {collaborators.map((collaborator, index) => (
                          <div key={collaborator.userId} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                                {(collaborator.name || collaborator.userId).charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {collaborator.name || collaborator.userId}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {collaborator.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteCreationSidebar;