import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG, TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../constants/taskConfig';

const TaskToolbar = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  quickFilters,
  onQuickFiltersChange,
  onRefresh,
  loading = false,
  totalTasks = 0,
  onAdvancedSearch
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const sortOptions = [
    { field: 'created_at', label: '생성일' },
    { field: 'updated_at', label: '수정일' },
    { field: 'due_date', label: '마감일' },
    { field: 'priority', label: '우선순위' },
    { field: 'title', label: '제목' },
    { field: 'status', label: '상태' },
    { field: 'assignee', label: '담당자' }
  ];

  const quickFilterOptions = [
    { key: 'my_tasks', label: '내 태스크', active: quickFilters.my_tasks },
    { key: 'overdue', label: '연체', active: quickFilters.overdue },
    { key: 'today', label: '오늘', active: quickFilters.today },
    { key: 'this_week', label: '이번 주', active: quickFilters.this_week },
    { key: 'urgent', label: '긴급', active: quickFilters.urgent },
    { key: 'in_progress', label: '진행중', active: quickFilters.in_progress }
  ];

  const handleQuickFilterToggle = (filterKey) => {
    onQuickFiltersChange({
      ...quickFilters,
      [filterKey]: !quickFilters[filterKey]
    });
  };

  const handleStatusFilterToggle = (status) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    onFiltersChange({
      ...filters,
      status: newStatuses
    });
  };

  const handlePriorityFilterToggle = (priority) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];
    
    onFiltersChange({
      ...filters,
      priority: newPriorities
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      priority: [],
      assignee: [],
      project: [],
      tag: []
    });
    onQuickFiltersChange({
      my_tasks: false,
      overdue: false,
      today: false,
      this_week: false,
      urgent: false,
      in_progress: false
    });
  };

  const hasActiveFilters = () => {
    const hasFilters = Object.values(filters).some(filter => 
      Array.isArray(filter) ? filter.length > 0 : !!filter
    );
    const hasQuickFilters = Object.values(quickFilters).some(filter => !!filter);
    return hasFilters || hasQuickFilters || searchQuery;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.values(filters).forEach(filter => {
      if (Array.isArray(filter)) count += filter.length;
      else if (filter) count++;
    });
    Object.values(quickFilters).forEach(filter => {
      if (filter) count++;
    });
    return count;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* 상단 툴바 */}
      <div className="px-6 py-3 flex items-center justify-between">
        {/* 좌측 - 검색 및 필터 */}
        <div className="flex items-center space-x-3">
          {/* 검색 입력 */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="태스크 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* 필터 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors
                ${showFilters || hasActiveFilters()
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }
              `}
            >
              <FunnelIcon className="w-4 h-4" />
              <span>필터</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* 정렬 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowsUpDownIcon className="w-4 h-4" />
              <span>정렬</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showSort ? 'rotate-180' : ''}`} />
            </button>

            {/* 정렬 드롭다운 */}
            {showSort && (
              <div className="absolute top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.field}
                      onClick={() => {
                        onSortByChange(option.field);
                        setShowSort(false);
                      }}
                      className={`
                        w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                        ${sortBy === option.field ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-700 dark:text-gray-300'}
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  <button
                    onClick={() => {
                      onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
                      setShowSort(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {sortOrder === 'asc' ? '내림차순' : '오름차순'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 고급 검색 버튼 */}
          <button
            onClick={onAdvancedSearch}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>고급 검색</span>
          </button>
        </div>

        {/* 우측 - 새로고침 및 통계 */}
        <div className="flex items-center space-x-3">
          {/* 결과 통계 */}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            총 {totalTasks}개 태스크
          </span>

          {/* 필터 초기화 버튼 */}
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>필터 초기화</span>
            </button>
          )}

          {/* 새로고침 버튼 */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="새로고침"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 퀵 필터 */}
      <div className="px-6 pb-3">
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {quickFilterOptions.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleQuickFilterToggle(filter.key)}
              className={`
                px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${filter.active
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 확장 필터 패널 */}
      {showFilters && (
        <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="pt-4 space-y-4">
            {/* 상태 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                상태
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TASK_STATUS_LABELS).map(([status, label]) => (
                  <button
                    key={status}
                    onClick={() => handleStatusFilterToggle(status)}
                    className={`
                      px-3 py-1 rounded-md text-sm transition-colors
                      ${(filters.status || []).includes(status)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 우선순위 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                우선순위
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRIORITY_LABELS).map(([priority, label]) => (
                  <button
                    key={priority}
                    onClick={() => handlePriorityFilterToggle(priority)}
                    className={`
                      px-3 py-1 rounded-md text-sm transition-colors
                      ${(filters.priority || []).includes(priority)
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskToolbar;