import React from 'react';
import { 
  MagnifyingGlassIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

const HeaderBar = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  filterType,
  setFilterType,
  selectedFiles,
  onToggleSelectAll,
  isDarkMode,
  setIsDarkMode,
  onShowAdvancedSearch,
  onClearAiResults
}) => {
  const sortOptions = [
    { value: 'name', label: '이름' },
    { value: 'size', label: '크기' },
    { value: 'date', label: '수정일' },
    { value: 'type', label: '유형' }
  ];

  const filterOptions = [
    { value: 'all', label: '모든 파일' },
    { value: 'images', label: '이미지' },
    { value: 'videos', label: '비디오' },
    { value: 'audio', label: '오디오' },
    { value: 'documents', label: '문서' },
    { value: 'code', label: '코드' },
    { value: 'archives', label: '압축파일' }
  ];

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 space-x-4">
      {/* 검색 */}
      <div className="flex-1 max-w-md relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // 검색어가 변경되면 AI 검색 결과 초기화
            if (onClearAiResults) {
              onClearAiResults();
            }
          }}
          placeholder="파일 검색..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
        />
        <button
          onClick={onShowAdvancedSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          title="고급 검색"
        >
          <Cog6ToothIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 필터 */}
      <select
        value={filterType}
        onChange={(e) => {
          setFilterType(e.target.value);
          // 필터가 변경되면 AI 검색 결과 초기화
          if (onClearAiResults) {
            onClearAiResults();
          }
        }}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
      >
        {filterOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* 정렬 */}
      <div className="flex items-center space-x-2">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
        >
          {sortOrder === 'asc' ? (
            <ArrowUpIcon className="w-5 h-5" />
          ) : (
            <ArrowDownIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 뷰 모드 */}
      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="그리드 뷰"
        >
          <Squares2X2Icon className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="리스트 뷰"
        >
          <ListBulletIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 선택된 파일 수 */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedFiles.length}개 선택됨
          </span>
          <button
            onClick={onToggleSelectAll}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            모두 선택/해제
          </button>
        </div>
      )}

      {/* 다크 모드 토글 */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        title={isDarkMode ? '라이트 모드' : '다크 모드'}
      >
        {isDarkMode ? (
          <SunIcon className="w-5 h-5" />
        ) : (
          <MoonIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default HeaderBar;