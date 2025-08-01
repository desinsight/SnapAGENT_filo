/**
 * 즐겨찾기 빠른 액세스 컴포넌트
 * 
 * @description 자주 사용하는 즐겨찾기에 빠르게 액세스할 수 있는 수평 바
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { formatDate } from '../../utils/noteHelpers';

const BookmarkQuickAccess = ({
  quickAccess,
  onToggle,
  onRemove
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef(null);

  /**
   * 스크롤 핸들러
   */
  const handleScroll = useCallback((direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);

    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    setScrollPosition(newPosition);
  }, [scrollPosition]);

  /**
   * 노트 열기 핸들러
   */
  const handleOpenNote = useCallback((note) => {
    window.dispatchEvent(new CustomEvent('openNote', { 
      detail: { noteId: note._id, type: note.type } 
    }));
  }, []);

  /**
   * 빠른 액세스 제거 핸들러
   */
  const handleRemoveFromQuickAccess = useCallback((e, note) => {
    e.stopPropagation();
    onRemove(note);
  }, [onRemove]);

  if (!quickAccess || quickAccess.length === 0) {
    return null;
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">빠른 액세스</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({quickAccess.length}개)
          </span>
        </div>
        
        {/* 스크롤 버튼들 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleScroll('left')}
            className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
            title="왼쪽으로 스크롤"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
            title="오른쪽으로 스크롤"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 빠른 액세스 아이템들 */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide px-6 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex space-x-3 min-w-max">
          {quickAccess.map((note) => (
            <div
              key={note._id}
              className="group relative flex-shrink-0 w-48 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-md"
              onClick={() => handleOpenNote(note)}
            >
              {/* 노트 타입 배지 */}
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                {note.type === 'shared' && (
                  <div className="w-3 h-3 bg-green-500 rounded-full" title="공유노트" />
                )}
                {note.priority > 3 && (
                  <div className="w-3 h-3 bg-red-500 rounded-full" title="높은 우선순위" />
                )}
              </div>

              {/* 제거 버튼 */}
              <button
                onClick={(e) => handleRemoveFromQuickAccess(e, note)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                title="빠른 액세스에서 제거"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* 노트 내용 */}
              <div className="pr-6">
                {/* 제목 */}
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1 truncate">
                  {note.title || '제목 없음'}
                </h4>
                
                {/* 미리보기 */}
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  {note.summary || (note.content?.substring(0, 80) + '...')}
                </p>

                {/* 메타데이터 */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatDate(note.updatedAt)}</span>
                  <div className="flex items-center space-x-1">
                    {note.tags && note.tags.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        #{note.tags[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 사용 안내 */}
      <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 자주 사용하는 노트를 빠른 액세스에 추가하여 쉽게 접근하세요. 
          노트 카드에서 번개 아이콘을 클릭하면 추가됩니다.
        </p>
      </div>
    </div>
  );
};

export default BookmarkQuickAccess;