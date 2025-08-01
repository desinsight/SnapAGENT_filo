/**
 * 즐겨찾기 목록 컴포넌트
 * 
 * @description 즐겨찾기된 노트들을 그리드/리스트 형태로 표시하는 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import BookmarkCard from './BookmarkCard';

const BookmarkList = ({
  bookmarks,
  viewMode,
  selectedBookmarks,
  bulkActionMode,
  onToggleBookmark,
  onAddToCollection,
  onRemoveFromCollection,
  onSelectBookmark,
  onSelectAll,
  loading,
  error,
  emptyMessage
}) => {
  const [hoveredBookmark, setHoveredBookmark] = useState(null);

  /**
   * 전체 선택/해제 핸들러
   */
  const handleSelectAll = useCallback((e) => {
    onSelectAll(e.target.checked);
  }, [onSelectAll]);

  /**
   * 개별 선택 핸들러
   */
  const handleSelectBookmark = useCallback((bookmarkId, selected) => {
    onSelectBookmark(bookmarkId, selected);
  }, [onSelectBookmark]);

  /**
   * 즐겨찾기 토글 핸들러
   */
  const handleToggleBookmark = useCallback((bookmark) => {
    onToggleBookmark(bookmark);
  }, [onToggleBookmark]);


  /**
   * 컬렉션 추가 핸들러
   */
  const handleAddToCollection = useCallback((collectionId, bookmarkId) => {
    onAddToCollection(collectionId, [bookmarkId]);
  }, [onAddToCollection]);

  /**
   * 컬렉션 제거 핸들러
   */
  const handleRemoveFromCollection = useCallback((collectionId, bookmarkId) => {
    onRemoveFromCollection(collectionId, bookmarkId);
  }, [onRemoveFromCollection]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">즐겨찾기를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            즐겨찾기 로드 실패
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (bookmarks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            즐겨찾기가 없습니다
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {emptyMessage}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            노트에서 별표를 클릭하여 즐겨찾기에 추가하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 일괄 작업 모드 헤더 */}
      {bulkActionMode && (
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedBookmarks.length === bookmarks.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                전체 선택
              </span>
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedBookmarks.length}/{bookmarks.length}개 선택됨
            </span>
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            선택한 항목에 대해 일괄 작업을 수행할 수 있습니다.
          </div>
        </div>
      )}

      {/* 즐겨찾기 목록 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {viewMode === 'grid' ? (
          // 그리드 뷰
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark._id}
                bookmark={bookmark}
                viewMode="grid"
                isSelected={selectedBookmarks.includes(bookmark._id)}
                bulkActionMode={bulkActionMode}
                onToggleBookmark={handleToggleBookmark}
                onAddToCollection={handleAddToCollection}
                onRemoveFromCollection={handleRemoveFromCollection}
                onSelect={handleSelectBookmark}
                onMouseEnter={() => setHoveredBookmark(bookmark._id)}
                onMouseLeave={() => setHoveredBookmark(null)}
                isHovered={hoveredBookmark === bookmark._id}
              />
            ))}
          </div>
        ) : (
          // 리스트 뷰
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark._id}
                bookmark={bookmark}
                viewMode="list"
                isSelected={selectedBookmarks.includes(bookmark._id)}
                bulkActionMode={bulkActionMode}
                onToggleBookmark={handleToggleBookmark}
                onAddToCollection={handleAddToCollection}
                onRemoveFromCollection={handleRemoveFromCollection}
                onSelect={handleSelectBookmark}
                onMouseEnter={() => setHoveredBookmark(bookmark._id)}
                onMouseLeave={() => setHoveredBookmark(null)}
                isHovered={hoveredBookmark === bookmark._id}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default BookmarkList;