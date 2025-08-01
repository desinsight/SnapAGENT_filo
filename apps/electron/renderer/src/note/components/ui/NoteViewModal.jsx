/**
 * 노트 보기 모달 컴포넌트
 */

import React from 'react';
import { formatDate, getCategoryInfo, calculateReadingTime } from '../../utils/noteHelpers';

const NoteViewModal = ({ note, isOpen, onClose, onEdit, onDelete, onFavoriteToggle }) => {
  if (!isOpen || !note) return null;

  const {
    title = '제목 없음',
    content = '',
    category = 'personal',
    tags = [],
    isFavorite = false,
    createdAt,
    updatedAt,
    viewCount = 0,
    editCount = 0
  } = note;

  const categoryInfo = getCategoryInfo(category);
  const readingTime = calculateReadingTime(content);

  const handleEdit = () => {
    onEdit(note);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('이 노트를 삭제하시겠습니까?')) {
      onDelete(note);
      onClose();
    }
  };

  const handleFavoriteToggle = () => {
    onFavoriteToggle(note);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{readingTime}분</span>
              </span>
              <span>{formatDate(updatedAt)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {/* 즐겨찾기 */}
            <button
              onClick={handleFavoriteToggle}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isFavorite 
                  ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>

            {/* 편집 */}
            <button
              onClick={handleEdit}
              className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
              title="편집"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* 삭제 */}
            <button
              onClick={handleDelete}
              className="p-2.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
              title="삭제"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* 닫기 */}
            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
              title="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 태그 */}
        {tags.length > 0 && (
          <div className="flex-shrink-0 px-8 pb-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 노트 내용 */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {content ? (
              <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed text-base">
                {content}
              </div>
            ) : (
              <div className="text-gray-400 dark:text-gray-500 italic text-center py-12">
                내용이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex-shrink-0 px-8 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <span>{content.length} 글자</span>
              <span>{content.trim().split(/\s+/).filter(w => w).length} 단어</span>
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{viewCount}</span>
              </span>
            </div>
            
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-xl transition-all duration-200"
            >
              편집하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteViewModal;