/**
 * 즐겨찾기 카드 컴포넌트
 * 
 * @description 개별 즐겨찾기 아이템을 표시하는 카드 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { formatDate, generatePreview, getCategoryColorClass } from '../../utils/noteHelpers';

const BookmarkCard = ({
  bookmark,
  viewMode,
  isSelected,
  bulkActionMode,
  onToggleBookmark,
  onAddToCollection,
  onRemoveFromCollection,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  isHovered
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);

  // 즐겨찾기 데이터 추출
  const {
    _id,
    title = '제목 없음',
    content = '',
    summary = '',
    category = 'personal',
    tags = [],
    type = 'personal',
    priority = 3,
    bookmarkedAt,
    updatedAt,
    createdAt,
    collections = [],
    collaborators = [],
    isShared = false
  } = bookmark;

  const preview = summary || generatePreview(content);

  /**
   * 즐겨찾기 해제 핸들러
   */
  const handleToggleBookmark = useCallback((e) => {
    e.stopPropagation();
    onToggleBookmark(bookmark);
  }, [onToggleBookmark, bookmark]);

  /**
   * 빠른 액세스 토글 핸들러
   */

  /**
   * 선택 핸들러
   */
  const handleSelect = useCallback((e) => {
    if (bulkActionMode) {
      onSelect(_id, e.target.checked);
    }
  }, [bulkActionMode, onSelect, _id]);

  /**
   * 카드 클릭 핸들러 - 노트 열기
   */
  const handleCardClick = useCallback((e) => {
    if (bulkActionMode) {
      e.preventDefault();
      onSelect(_id, !isSelected);
    } else {
      // 노트 열기 로직 (부모 컴포넌트에서 처리)
      window.dispatchEvent(new CustomEvent('openNote', { 
        detail: { noteId: _id, type } 
      }));
    }
  }, [bulkActionMode, onSelect, _id, isSelected, type]);

  /**
   * 우선순위 색상 가져오기
   */
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 5: return 'text-red-500';
      case 4: return 'text-orange-500';
      case 3: return 'text-yellow-500';
      case 2: return 'text-green-500';
      case 1: return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  /**
   * 우선순위 스타 렌더링
   */
  const renderPriorityStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`w-3 h-3 ${index < priority ? getPriorityColor(priority) : 'text-gray-300 dark:text-gray-600'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ));
  };

  /**
   * 그리드 뷰 렌더링
   */
  const renderGridView = () => (
    <div
      className={`group relative bg-white dark:bg-gray-800 border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-xl ${
        isSelected 
          ? 'border-blue-500 dark:border-blue-400 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800/40' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-1'
      }`}
      onClick={handleCardClick}
      onMouseEnter={() => {
        setShowActions(true);
        onMouseEnter?.();
      }}
      onMouseLeave={() => {
        setShowActions(false);
        onMouseLeave?.();
      }}
    >
      {/* 선택 체크박스 (일괄 작업 모드) */}
      {bulkActionMode && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* 카테고리 및 타입 표시 */}
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColorClass(category, 'bg')} bg-opacity-20`}>
              <svg className={`w-4 h-4 ${getCategoryColorClass(category, 'text')}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="flex items-center space-x-1">
              {type === 'shared' && (
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center" title="공유노트">
                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                </div>
              )}
              
            </div>
          </div>
        </div>

        {/* 즐겨찾기 해제 버튼 */}
        <button
          onClick={handleToggleBookmark}
          className="flex-shrink-0 p-1.5 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200"
          title="즐겨찾기 해제"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      {/* 제목 */}
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3rem]">
        {title}
      </h3>

      {/* 미리보기 */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 min-h-[3.75rem] leading-relaxed">
        {preview}
      </p>

      {/* 우선순위 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-1">
          {renderPriorityStars()}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          우선순위 {priority}/5
        </span>
      </div>

      {/* 태그 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded-full"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="inline-block px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
              +{tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* 컬렉션 정보 */}
      {collections.length > 0 && (
        <div className="flex items-center space-x-1 mb-3">
          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {collections.length}개 컬렉션
          </span>
        </div>
      )}

      {/* 메타데이터 */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>즐겨찾기: {formatDate(bookmarkedAt)}</span>
        <span>수정: {formatDate(updatedAt)}</span>
      </div>

      {/* 액션 버튼들 (호버 시 표시) */}
      <div className={`absolute top-2 right-12 flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-1 transition-all duration-200 ${
        showActions && !bulkActionMode ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowCollectionMenu(!showCollectionMenu);
          }}
          className="p-1.5 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors duration-200"
          title="컬렉션 관리"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
        </button>
      </div>
    </div>
  );

  /**
   * 리스트 뷰 렌더링
   */
  const renderListView = () => (
    <div
      className={`group flex items-center p-4 bg-white dark:bg-gray-800 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
        isSelected 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
          : ''
      }`}
      onClick={handleCardClick}
      onMouseEnter={() => {
        setShowActions(true);
        onMouseEnter?.();
      }}
      onMouseLeave={() => {
        setShowActions(false);
        onMouseLeave?.();
      }}
    >
      {/* 선택 체크박스 (일괄 작업 모드) */}
      {bulkActionMode && (
        <div className="flex-shrink-0 mr-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* 좌측: 아이콘 및 상태 */}
      <div className="flex items-center space-x-3 flex-shrink-0">
        <div className={`w-3 h-3 rounded-full ${getCategoryColorClass(category, 'bg')}`} />
        
        {type === 'shared' && (
          <div className="w-4 h-4 text-green-500" title="공유노트">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </div>
        )}
        
      </div>

      {/* 중앙: 제목과 미리보기 */}
      <div className="flex-1 min-w-0 mx-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
              {preview}
            </p>
          </div>
        </div>
      </div>

      {/* 우선순위 */}
      <div className="flex items-center space-x-1 flex-shrink-0 mr-4">
        <div className="flex items-center space-x-1">
          {renderPriorityStars()}
        </div>
      </div>

      {/* 태그 */}
      {tags.length > 0 && (
        <div className="hidden md:flex space-x-1 flex-shrink-0 mr-4">
          {tags.slice(0, 1).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 날짜 */}
      <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 w-20 text-right mr-4">
        {formatDate(bookmarkedAt)}
      </div>

      {/* 액션 버튼들 */}
      <div className={`flex items-center space-x-1 flex-shrink-0 transition-opacity duration-200 ${
        showActions && !bulkActionMode ? 'opacity-100' : 'opacity-0'
      }`}>
        <button
          onClick={handleToggleBookmark}
          className="p-1.5 text-yellow-500 hover:text-yellow-600 rounded transition-colors duration-200"
          title="즐겨찾기 해제"
        >
          <svg className="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>
    </div>
  );

  // 뷰 모드에 따른 렌더링
  return viewMode === 'grid' ? renderGridView() : renderListView();
};

export default BookmarkCard;