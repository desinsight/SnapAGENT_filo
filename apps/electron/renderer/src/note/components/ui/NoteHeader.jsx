/**
 * 노트 헤더 컴포넌트
 * 
 * @description 노트 서비스의 상단 헤더 - 제목, 검색, 필터, 뷰 옵션 등을 포함
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { VIEW_MODES, SORT_OPTIONS, FILTER_OPTIONS, NOTE_CATEGORIES } from '../../constants/noteConfig';

const NoteHeader = ({
  title = "개인노트",
  searchQuery = "",
  onSearchChange,
  filters = {},
  onFiltersChange,
  sortBy = "updated_desc",
  onSortChange,
  viewMode = VIEW_MODES.GRID,
  onViewModeChange,
  onCreateNote,
  onRefresh,
  noteCount = 0,
  loading = false,
  // 탭 관련 props
  activeTab = 'personal',
  onTabChange,
  sharedNoteCount = 0
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  /**
   * 검색어 변경 핸들러
   */
  const handleSearchChange = (e) => {
    console.log('🔍 검색어 변경:', e.target.value); // 디버깅 로그 추가
    if (onSearchChange && typeof onSearchChange === 'function') {
      onSearchChange(e.target.value);
    } else {
      console.warn('⚠️ onSearchChange 함수가 전달되지 않았습니다.');
    }
  };

  /**
   * 필터 변경 핸들러
   */
  const handleFilterChange = (filterType, value) => {
    console.log('🔧 필터 변경:', filterType, value); // 디버깅 로그 추가
    if (onFiltersChange && typeof onFiltersChange === 'function') {
      onFiltersChange({ [filterType]: value });
    } else {
      console.warn('⚠️ onFiltersChange 함수가 전달되지 않았습니다.');
    }
  };

  /**
   * 정렬 옵션 변경 핸들러
   */
  const handleSortChange = (newSortBy) => {
    console.log('📊 정렬 변경:', newSortBy); // 디버깅 로그 추가
    if (onSortChange && typeof onSortChange === 'function') {
      onSortChange(newSortBy);
    } else {
      console.warn('⚠️ onSortChange 함수가 전달되지 않았습니다.');
    }
    setShowSortMenu(false);
  };

  /**
   * 뷰 모드 변경 핸들러
   */
  const handleViewModeChange = (newViewMode) => {
    console.log('👁️ 뷰 모드 변경:', newViewMode); // 디버깅 로그 추가
    if (onViewModeChange && typeof onViewModeChange === 'function') {
      onViewModeChange(newViewMode);
    } else {
      console.warn('⚠️ onViewModeChange 함수가 전달되지 않았습니다.');
    }
  };

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
      {/* 통합 헤더 - 하나의 깔끔한 레이어 */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          {/* 좌측: 탭 네비게이션 */}
          {onTabChange && (
            <div className="flex items-center bg-gray-100/80 dark:bg-gray-800/80 rounded-xl p-1 backdrop-blur-sm">
              {/* 전체 탭 */}
              <button
                onClick={() => onTabChange('all')}
                className={`relative flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className={`w-4 h-4 ${activeTab === 'all' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14-7H3a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  </svg>
                  <span>전체</span>
                  <div className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
                    activeTab === 'all' ? 'bg-purple-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {noteCount + sharedNoteCount}
                  </div>
                </div>
              </button>

              {/* 개인노트 탭 */}
              <button
                onClick={() => onTabChange('personal')}
                className={`relative flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'personal'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className={`w-4 h-4 ${activeTab === 'personal' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>개인</span>
                  <div className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
                    activeTab === 'personal' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {noteCount}
                  </div>
                </div>
              </button>

              {/* 공유노트 탭 */}
              <button
                onClick={() => onTabChange('shared')}
                className={`relative flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'shared'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className={`w-4 h-4 ${activeTab === 'shared' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.114 15.938 18 15.482 18 15c0-.482.114-.938.316-1.342m0 2.684a3 3 0 110-2.684M9 9a3 3 0 110-6 3 3 0 010 6zm6 6a3 3 0 110-6 3 3 0 010 6zM9 21a3 3 0 110-6 3 3 0 010 6z" />
                  </svg>
                  <span>공유</span>
                  <div className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
                    activeTab === 'shared' ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {sharedNoteCount}
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* 우측: 액션 버튼들 */}
          <div className="flex items-center space-x-2">
            {/* 새 노트 버튼 */}
            <button
              onClick={() => onCreateNote && typeof onCreateNote === 'function' && onCreateNote()}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 노트
            </button>

            {/* 새로고침 버튼 */}
            <button
              onClick={() => onRefresh && typeof onRefresh === 'function' && onRefresh()}
              className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
              title="새로고침"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* 검색 및 컨트롤 바 */}
        <div className="flex items-center justify-between space-x-4">
          {/* 좌측: 검색바 */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="노트 검색..."
                className="block w-full pl-12 pr-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all duration-200"
              />
            </div>
          </div>

          {/* 우측: 필터 및 정렬 컨트롤 */}
          <div className="flex items-center space-x-3">
            {/* 통계 정보 */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-800/80 px-4 py-2.5 rounded-xl backdrop-blur-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">{noteCount}개</span>
              {loading && (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              )}
            </div>

            {/* 빠른 필터 */}
            <div className="flex items-center bg-gray-50/80 dark:bg-gray-800/80 rounded-xl p-1 backdrop-blur-sm">
              {FILTER_OPTIONS && FILTER_OPTIONS.slice(1, 4).map(filter => (
                <button
                  key={filter.id}
                  onClick={() => handleFilterChange(filter.id, !filters?.[filter.id])}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    filters?.[filter.id]
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60'
                  }`}
                  title={filter.label}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* 정렬 메뉴 */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="inline-flex items-center px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h9m4-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                <span className="font-medium">정렬</span>
                <svg className={`w-4 h-4 ml-1 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 정렬 드롭다운 */}
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 z-20 overflow-hidden">
                  <div className="py-2">
                    {SORT_OPTIONS && SORT_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        onClick={() => handleSortChange(option.id)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center ${
                          sortBy === option.id
                            ? 'bg-blue-50/80 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200 border-r-2 border-blue-500'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        {sortBy === option.id && (
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 뷰 모드 스위처 */}
            <div className="flex items-center bg-gray-50/80 dark:bg-gray-800/80 rounded-xl p-1 backdrop-blur-sm">
              {/* 그리드 뷰 */}
              <button
                onClick={() => handleViewModeChange(VIEW_MODES.GRID)}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === VIEW_MODES.GRID
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60'
                }`}
                title="그리드 뷰"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>

              {/* 리스트 뷰 */}
              <button
                onClick={() => handleViewModeChange(VIEW_MODES.LIST)}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === VIEW_MODES.LIST
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60'
                }`}
                title="리스트 뷰"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 클릭 외부 감지를 위한 오버레이 */}
      {showSortMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSortMenu(false)}
        />
      )}
    </div>
  );
};

export default NoteHeader;