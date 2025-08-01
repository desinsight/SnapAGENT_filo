/**
 * 공용노트 헤더 컴포넌트
 * 
 * @description 공용노트 서비스의 상단 헤더 - 검색, 필터, 협업 상태 등을 포함
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { VIEW_MODES, SORT_OPTIONS, NOTE_CATEGORIES } from '../../constants/noteConfig';

const SharedNoteHeader = ({
  title = "공용노트",
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
  collaborationStats = {}
}) => {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showCollaborationStats, setShowCollaborationStats] = useState(false);

  /**
   * 검색어 변경 핸들러
   */
  const handleSearchChange = (e) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  /**
   * 필터 변경 핸들러
   */
  const handleFilterChange = (filterType, value) => {
    if (onFiltersChange) {
      onFiltersChange({ [filterType]: value });
    }
  };

  /**
   * 정렬 옵션 변경 핸들러
   */
  const handleSortChange = (newSortBy) => {
    if (onSortChange) {
      onSortChange(newSortBy);
    }
    setShowSortMenu(false);
  };

  /**
   * 뷰 모드 변경 핸들러
   */
  const handleViewModeChange = (newViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(newViewMode);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* 메인 헤더 */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 좌측: 제목 및 통계 */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {title}
            </h1>
            
            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
              <span>{noteCount}개의 공유 노트</span>
              
              {/* 협업 통계 */}
              {collaborationStats.activeSessions > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowCollaborationStats(!showCollaborationStats)}
                    className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors duration-200"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>{collaborationStats.activeSessions}개 협업 중</span>
                  </button>
                  
                  {/* 협업 통계 드롭다운 */}
                  {showCollaborationStats && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">협업 현황</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">활성 세션</span>
                            <span className="font-medium">{collaborationStats.activeSessions || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">참여자</span>
                            <span className="font-medium">{collaborationStats.activeUsers || 0}명</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">실시간 편집</span>
                            <span className="font-medium">{collaborationStats.editingUsers || 0}명</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {loading && (
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span>로딩중...</span>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 액션 버튼들 */}
          <div className="flex items-center space-x-3">
            {/* 새 공유 노트 버튼 */}
            <button
              onClick={onCreateNote}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 공유 노트
            </button>

            {/* 새로고침 버튼 */}
            <button
              onClick={onRefresh}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              title="새로고침"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 바 */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between space-x-4">
          {/* 검색바 */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="공유 노트 검색..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 필터 및 정렬 컨트롤 */}
          <div className="flex items-center space-x-2">
            {/* 가시성 필터 */}
            <select
              value={filters.visibility || 'all'}
              onChange={(e) => handleFilterChange('visibility', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 공개 설정</option>
              <option value="public">공개</option>
              <option value="shared">공유</option>
              <option value="private">비공개</option>
            </select>

            {/* 카테고리 필터 */}
            <select
              value={filters.category || 'all'}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 카테고리</option>
              {NOTE_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>

            {/* 빠른 필터 */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleFilterChange('isCollaborating', !filters.isCollaborating)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                  filters.isCollaborating
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="협업 중인 노트만 보기"
              >
                협업 중
              </button>
              
              <button
                onClick={() => handleFilterChange('myNotes', !filters.myNotes)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                  filters.myNotes
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="내가 만든 노트만 보기"
              >
                내 노트
              </button>
            </div>

            {/* 정렬 메뉴 */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                정렬
              </button>

              {/* 정렬 드롭다운 */}
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="py-1">
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        onClick={() => handleSortChange(option.id)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                          sortBy === option.id
                            ? 'bg-blue-50 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 뷰 모드 스위처 */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {/* 그리드 뷰 */}
              <button
                onClick={() => handleViewModeChange(VIEW_MODES.GRID)}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === VIEW_MODES.GRID
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
                title="그리드 뷰"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>

              {/* 리스트 뷰 */}
              <button
                onClick={() => handleViewModeChange(VIEW_MODES.LIST)}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === VIEW_MODES.LIST
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
                title="리스트 뷰"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* 클릭 외부 감지를 위한 오버레이 */}
      {(showSortMenu || showCollaborationStats) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowSortMenu(false);
            setShowCollaborationStats(false);
          }}
        />
      )}
    </div>
  );
};

export default SharedNoteHeader;