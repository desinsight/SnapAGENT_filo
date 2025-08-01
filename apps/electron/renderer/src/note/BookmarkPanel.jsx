/**
 * 즐겨찾기 패널 - Office 365 스타일 테이블 인터페이스
 * 
 * @description SharePoint/Office 365 스타일의 단일 패널 테이블 중심 인터페이스
 * @design 상단 명령 바 + 필터 칩 + 데이터 테이블의 단일 페이지 레이아웃
 * @layout 세로 스택 레이아웃 (헤더 → 필터바 → 테이블) - 사이드바 없음
 * @colors 모노톤 디자인, 미니멀 액센트
 * @author AI Assistant
 * @version 5.0.0 - Office 365 Table Interface
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBookmarks } from './hooks/useBookmarks';
import { useNotes } from './hooks/useNotes';
import { useSharedNotes } from './hooks/useSharedNotes';

// UI 컴포넌트들
import BookmarkHeader from './components/bookmark/BookmarkHeader';
import BookmarkList from './components/bookmark/BookmarkList';
import BookmarkCollections from './components/bookmark/BookmarkCollections';
import BookmarkStats from './components/bookmark/BookmarkStats';

// 기본 설정
import { BOOKMARK_TYPES, BOOKMARK_VIEWS } from './constants/bookmarkConfig';

const BookmarkPanel = ({ 
  activePanel = 'bookmarks',
  onNotification,
  userId = 'anonymous'
}) => {
  // 즐겨찾기 관련 상태 및 함수
  const {
    bookmarks,
    collections,
    stats,
    loading,
    error,
    viewMode,
    sortBy,
    filters,
    selectedCollection,
    loadBookmarks,
    loadCollections,
    loadStats,
    toggleBookmark,
    addToCollection,
    removeFromCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    updateFilters,
    changeSortBy,
    changeViewMode,
    selectCollection,
    clearError,
    refreshBookmarks
  } = useBookmarks();

  // 노트 관련 함수 (즐겨찾기 토글용)
  const { updateNote } = useNotes();
  const { updateSharedNote } = useSharedNotes();

  // UI 상태 관리 - Office 365 테이블 인터페이스
  const [searchQuery, setSearchQuery] = useState(''); // 검색 쿼리
  const [selectedBookmarks, setSelectedBookmarks] = useState([]); // 선택된 북마크 (체크박스)
  const [showFilters, setShowFilters] = useState(false); // 필터 칩 영역 표시
  const [activeFilters, setActiveFilters] = useState([]); // 활성 필터 목록
  const [sortColumn, setSortColumn] = useState('bookmarkedAt'); // 정렬 컬럼
  const [sortDirection, setSortDirection] = useState('desc'); // 정렬 방향
  const [tableView, setTableView] = useState('comfortable'); // 테이블 뷰: comfortable, compact, spacious

  // 알림 도우미 함수
  const notify = useCallback((message, type = 'info') => {
    if (onNotification) {
      onNotification(message, type);
    }
  }, [onNotification]);

  /**
   * 즐겨찾기 토글 핸들러
   */
  const handleToggleBookmark = useCallback(async (note) => {
    try {
      const isBookmarked = note.isFavorite || note.isBookmarked;
      
      // 북마크 토글만 수행 (노트 상태는 별도로 업데이트하지 않음)
      await toggleBookmark(note._id, !isBookmarked);
      
      // 북마크 목록만 새로고침
      await refreshBookmarks();
      
      notify(
        isBookmarked ? '즐겨찾기에서 제거되었습니다.' : '즐겨찾기에 추가되었습니다.',
        'success'
      );
    } catch (error) {
      notify(`즐겨찾기 업데이트 실패: ${error.message}`, 'error');
    }
  }, [toggleBookmark, refreshBookmarks, notify]);


  /**
   * 검색 핸들러 - Office 365 스타일 실시간 검색
   */
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    updateFilters({ search: query });
  }, [updateFilters]);

  /**
   * 필터 추가/제거 핸들러
   */
  const handleFilterToggle = useCallback((filterType, filterValue) => {
    const filterId = `${filterType}:${filterValue}`;
    setActiveFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(f => f !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  }, []);

  /**
   * 테이블 정렬 핸들러
   */
  const handleSort = useCallback((column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    changeSortBy(column);
  }, [sortColumn, changeSortBy]);

  /**
   * 체크박스 선택 핸들러
   */
  const handleSelectBookmark = useCallback((bookmarkId, checked) => {
    setSelectedBookmarks(prev => {
      if (checked) {
        return [...prev, bookmarkId];
      } else {
        return prev.filter(id => id !== bookmarkId);
      }
    });
  }, []);

  /**
   * 전체 선택/해제 핸들러
   */
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      const filtered = bookmarks.filter(bookmark => {
        // 활성 필터 적용
        for (const filterId of activeFilters) {
          const [type, value] = filterId.split(':');
          switch (type) {
            case 'type':
              if (bookmark.type !== value) return false;
              break;
            case 'collections':
              if (!(bookmark.collections?.length > 0)) return false;
              break;
            case 'priority':
              if (bookmark.priority !== parseInt(value)) return false;
              break;
          }
        }
        return true;
      });
      setSelectedBookmarks(filtered.map(b => b._id));
    } else {
      setSelectedBookmarks([]);
    }
  }, [bookmarks, activeFilters]);

  // 에러 처리
  useEffect(() => {
    if (error) {
      notify(`오류 발생: ${error}`, 'error');
      clearError();
    }
  }, [error, notify, clearError]);

  // 초기 데이터 로드
  useEffect(() => {
    if (activePanel === 'bookmarks') {
      loadBookmarks();
      loadCollections();
      loadStats();
    }
  }, [activePanel, loadBookmarks, loadCollections, loadStats]);

  // 즐겨찾기 패널이 아닌 경우 렌더링하지 않음
  if (activePanel !== 'bookmarks') {
    return null;
  }

  // 필터링된 북마크 계산 - Office 365 스타일 다중 필터
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => {
      // 활성 필터 적용
      for (const filterId of activeFilters) {
        const [type, value] = filterId.split(':');
        switch (type) {
          case 'type':
            if (bookmark.type !== value) return false;
            break;
          case 'collections':
            if (!(bookmark.collections?.length > 0)) return false;
            break;
          case 'priority':
            if (bookmark.priority !== parseInt(value)) return false;
            break;
        }
      }
      return true;
    });
  }, [bookmarks, activeFilters]);

  // 통계 계산
  const statsData = {
    total: bookmarks.length,
    personal: bookmarks.filter(b => b.type === 'personal').length,
    shared: bookmarks.filter(b => b.type === 'shared').length,
    collections: collections.length,
    thisWeek: bookmarks.filter(b => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(b.bookmarkedAt || b.createdAt) > weekAgo;
    }).length
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full min-h-0">
      {/* Office 365 스타일 명령 바 (Command Bar) */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* 메인 헤더 영역 */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 좌측: 제목과 경로 */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">즐겨찾기</h1>
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                {filteredBookmarks.length}개 항목
              </div>
            </div>
            
            {/* 우측: 명령 버튼들 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => refreshBookmarks()}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                ↻ 새로고침
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  showFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                ⚙ 필터
              </button>
            </div>
          </div>
        </div>

        {/* 검색 및 도구 모음 영역 */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between space-x-4">
            {/* 검색창 */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="즐겨찾기 검색..."
                />
              </div>
            </div>

            {/* 뷰 및 정렬 옵션 */}
            <div className="flex items-center space-x-3">
              {/* 테이블 뷰 선택 */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {[
                  { mode: 'comfortable', label: '편안함', icon: '☰' },
                  { mode: 'compact', label: '컴팩트', icon: '≡' },
                  { mode: 'spacious', label: '여유롭게', icon: '▤' }
                ].map(view => (
                  <button
                    key={view.mode}
                    onClick={() => setTableView(view.mode)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      tableView === view.mode
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title={view.label}
                  >
                    {view.icon}
                  </button>
                ))}
              </div>

              {/* 정렬 선택 */}
              <select
                value={sortColumn}
                onChange={(e) => handleSort(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bookmarkedAt">즐겨찾기 날짜</option>
                <option value="title">제목</option>
                <option value="updatedAt">수정일</option>
                <option value="priority">우선순위</option>
                <option value="type">타입</option>
              </select>
            </div>
          </div>
        </div>

        {/* 필터 칩 영역 */}
        {showFilters && (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">필터:</span>
              {[
                { type: 'type', value: 'personal', label: '개인 노트', count: statsData.personal },
                { type: 'type', value: 'shared', label: '공유 노트', count: statsData.shared },
                { type: 'collections', value: 'true', label: '컬렉션', count: statsData.collections }
              ].map(filter => {
                const filterId = `${filter.type}:${filter.value}`;
                const isActive = activeFilters.includes(filterId);
                return (
                  <button
                    key={filterId}
                    onClick={() => handleFilterToggle(filter.type, filter.value)}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {filter.label}
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      isActive
                        ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Office 365 스타일 데이터 테이블 영역 */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 min-h-0">
        {/* 선택된 항목 정보 바 */}
        {selectedBookmarks.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {selectedBookmarks.length}개 항목 선택됨
                </span>
                <button
                  onClick={() => setSelectedBookmarks([])}
                  className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
                >
                  선택 해제
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg">
                  일괄 편집
                </button>
                <button className="px-3 py-1.5 text-sm text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg">
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 메인 테이블 컨테이너 */}
        <div className="flex-1 min-h-0">
          <BookmarkList
            bookmarks={filteredBookmarks}
            viewMode={tableView}
            selectedBookmarks={selectedBookmarks}
            bulkActionMode={selectedBookmarks.length > 0}
            onToggleBookmark={handleToggleBookmark}
            onAddToCollection={() => {}}
            onRemoveFromCollection={() => {}}
            onSelectBookmark={handleSelectBookmark}
            onSelectAll={handleSelectAll}
            loading={loading}
            error={error}
            emptyMessage="필터 조건에 맞는 즐겨찾기가 없습니다."
          />
        </div>
      </div>
    </div>
  );
};

export default BookmarkPanel;