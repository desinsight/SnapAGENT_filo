// 캘린더 툴바 컴포넌트
import React, { useState } from 'react';
import { CALENDAR_CONFIG } from '../../constants/calendarConfig';

const CalendarToolbar = ({
  searchQuery,
  onSearchQueryChange,
  filters,
  onUpdateFilters,
  calendars,
  selectedCalendars,
  onToggleCalendar,
  onRefresh,
  isLoading,
  onShowAdvancedSearch
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  // 필터 카운트 계산
  const activeFilterCount = Object.values(filters).filter(filter => {
    if (Array.isArray(filter)) return filter.length > 0;
    if (filter && typeof filter === 'object') return Object.keys(filter).length > 0;
    return !!filter;
  }).length;

  // 선택된 캘린더 이름 표시
  const getSelectedCalendarDisplay = () => {
    if (selectedCalendars.length === 0) return '캘린더 선택';
    if (selectedCalendars.length === 1) {
      const calendar = calendars.find(cal => cal.id === selectedCalendars[0]);
      return calendar?.name || '캘린더';
    }
    return `${selectedCalendars.length}개 캘린더`;
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* 왼쪽: 검색 및 필터 */}
        <div className="flex items-center space-x-4 flex-1">
          {/* 검색 바 */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="일정 검색..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* 고급 검색 버튼 */}
          <button
            onClick={onShowAdvancedSearch}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
            title="고급 검색"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            고급
          </button>

          {/* 필터 버튼 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeFilterCount > 0
                ? 'bg-blue-50 text-blue-700 border border-blue-300'
                : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            필터
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* 캘린더 선택 */}
          <div className="relative">
            <button
              onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {getSelectedCalendarDisplay()}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 캘린더 드롭다운 */}
            {showCalendarDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <div className="mb-2 px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                    캘린더 선택
                  </div>
                  {calendars.map((calendar) => (
                    <label
                      key={calendar.id}
                      className="flex items-center px-2 py-2 hover:bg-gray-50 rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCalendars.includes(calendar.id)}
                        onChange={() => onToggleCalendar(calendar.id)}
                        className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center flex-1">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: calendar.color }}
                        />
                        <span className="text-sm text-gray-700">{calendar.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 액션 버튼 */}
        <div className="flex items-center space-x-2">
          {/* 새로고침 버튼 */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="새로고침"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-4 gap-4">
            {/* 우선순위 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                우선순위
              </label>
              <select
                multiple
                value={filters.priorities || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  onUpdateFilters({ priorities: selected });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="critical">매우 중요</option>
                <option value="urgent">긴급</option>
                <option value="high">높음</option>
                <option value="normal">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>

            {/* 카테고리 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리
              </label>
              <select
                multiple
                value={filters.categories || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  onUpdateFilters({ categories: selected });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="business">비즈니스</option>
                <option value="personal">개인</option>
                <option value="health">건강</option>
                <option value="team">팀</option>
                <option value="other">기타</option>
              </select>
            </div>

            {/* 상태 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                multiple
                value={filters.status || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  onUpdateFilters({ status: selected });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="confirmed">확정</option>
                <option value="tentative">임시</option>
                <option value="cancelled">취소</option>
                <option value="pending">대기</option>
              </select>
            </div>

            {/* 필터 초기화 */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  onUpdateFilters({
                    priorities: [],
                    categories: [],
                    status: [],
                    tags: [],
                    dateRange: null
                  });
                }}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-md transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarToolbar;