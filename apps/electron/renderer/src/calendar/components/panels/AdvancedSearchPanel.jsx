import React, { useState, useEffect } from 'react';

const AdvancedSearchPanel = ({
  isOpen,
  onClose,
  onSearch,
  calendars = [],
  tags = [],
  categories = [],
  initialFilters = {},
  searchHistory = []
}) => {
  const [filters, setFilters] = useState({
    query: '',
    dateRange: {
      type: 'all', // 'all', 'today', 'thisWeek', 'thisMonth', 'custom'
      startDate: '',
      endDate: ''
    },
    calendars: [],
    tags: [],
    categories: [],
    priority: [],
    status: [],
    attendees: '',
    location: '',
    hasAttachments: null,
    isRecurring: null,
    createdBy: '',
    lastModified: {
      type: 'all', // 'all', 'today', 'thisWeek', 'thisMonth', 'custom'
      startDate: '',
      endDate: ''
    },
    sortBy: 'startDate', // 'startDate', 'title', 'created', 'modified', 'priority'
    sortOrder: 'asc' // 'asc', 'desc'
  });

  const [savedSearches, setSavedSearches] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const priorityOptions = [
    { value: 'low', label: '낮음', color: 'bg-gray-500' },
    { value: 'normal', label: '보통', color: 'bg-blue-500' },
    { value: 'high', label: '높음', color: 'bg-orange-500' },
    { value: 'urgent', label: '긴급', color: 'bg-red-500' },
    { value: 'critical', label: '매우 중요', color: 'bg-red-700' }
  ];

  const statusOptions = [
    { value: 'confirmed', label: '확정', color: 'bg-green-500' },
    { value: 'tentative', label: '임시', color: 'bg-yellow-500' },
    { value: 'cancelled', label: '취소', color: 'bg-red-500' },
    { value: 'pending', label: '대기', color: 'bg-gray-500' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: '전체 기간' },
    { value: 'today', label: '오늘' },
    { value: 'thisWeek', label: '이번 주' },
    { value: 'thisMonth', label: '이번 달' },
    { value: 'nextWeek', label: '다음 주' },
    { value: 'nextMonth', label: '다음 달' },
    { value: 'custom', label: '사용자 지정' }
  ];

  useEffect(() => {
    if (isOpen && initialFilters) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [isOpen, initialFilters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNestedFilterChange = (parentKey, childKey, value) => {
    setFilters(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  };

  const handleArrayFilterToggle = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const handleSearch = () => {
    const searchFilters = { ...filters };
    
    // 날짜 범위 처리
    if (filters.dateRange.type !== 'custom' && filters.dateRange.type !== 'all') {
      const today = new Date();
      let startDate, endDate;

      switch (filters.dateRange.type) {
        case 'today':
          startDate = new Date(today);
          endDate = new Date(today);
          break;
        case 'thisWeek':
          startDate = new Date(today.setDate(today.getDate() - today.getDay()));
          endDate = new Date(today.setDate(today.getDate() - today.getDay() + 6));
          break;
        case 'thisMonth':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          break;
        case 'nextWeek':
          const nextWeekStart = new Date(today.setDate(today.getDate() - today.getDay() + 7));
          startDate = nextWeekStart;
          endDate = new Date(nextWeekStart.setDate(nextWeekStart.getDate() + 6));
          break;
        case 'nextMonth':
          startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
          break;
      }

      searchFilters.dateRange = {
        ...searchFilters.dateRange,
        startDate: startDate?.toISOString().split('T')[0],
        endDate: endDate?.toISOString().split('T')[0]
      };
    }

    onSearch(searchFilters);
  };

  const handleReset = () => {
    setFilters({
      query: '',
      dateRange: { type: 'all', startDate: '', endDate: '' },
      calendars: [],
      tags: [],
      categories: [],
      priority: [],
      status: [],
      attendees: '',
      location: '',
      hasAttachments: null,
      isRecurring: null,
      createdBy: '',
      lastModified: { type: 'all', startDate: '', endDate: '' },
      sortBy: 'startDate',
      sortOrder: 'asc'
    });
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    
    const savedSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };

    setSavedSearches(prev => [...prev, savedSearch]);
    setSearchName('');
    setShowSaveDialog(false);
  };

  const handleLoadSavedSearch = (savedSearch) => {
    setFilters(savedSearch.filters);
  };

  const handleDeleteSavedSearch = (searchId) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">고급 검색 & 필터</h2>
              <p className="text-green-100 mt-1">상세한 조건으로 이벤트를 검색하세요</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={!filters.query && filters.dateRange.type === 'all'}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors disabled:opacity-50"
              >
                검색 저장
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 왼쪽: 기본 검색 조건 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 검색어 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검색어</label>
                <input
                  type="text"
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  placeholder="제목, 설명, 위치 등을 검색하세요..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* 날짜 범위 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">날짜 범위</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={filters.dateRange.type}
                    onChange={(e) => handleNestedFilterChange('dateRange', 'type', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {dateRangeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {filters.dateRange.type === 'custom' && (
                    <>
                      <input
                        type="date"
                        value={filters.dateRange.startDate}
                        onChange={(e) => handleNestedFilterChange('dateRange', 'startDate', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <input
                        type="date"
                        value={filters.dateRange.endDate}
                        onChange={(e) => handleNestedFilterChange('dateRange', 'endDate', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* 캘린더 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">캘린더</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {calendars.map(calendar => (
                    <label key={calendar.id} className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={filters.calendars.includes(calendar.id)}
                        onChange={() => handleArrayFilterToggle('calendars', calendar.id)}
                        className="mr-2"
                      />
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: calendar.color }}
                        />
                        <span className="text-sm">{calendar.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleArrayFilterToggle('tags', tag.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.tags.includes(tag.id)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleArrayFilterToggle('categories', category.id)}
                      className={`p-2 border rounded-lg transition-colors ${
                        filters.categories.includes(category.id)
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{category.icon || '📁'}</span>
                        <span className="text-sm">{category.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 우선순위 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map(priority => (
                    <button
                      key={priority.value}
                      onClick={() => handleArrayFilterToggle('priority', priority.value)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        filters.priority.includes(priority.value)
                          ? `${priority.color} text-white`
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(status => (
                    <button
                      key={status.value}
                      onClick={() => handleArrayFilterToggle('status', status.value)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        filters.status.includes(status.value)
                          ? `${status.color} text-white`
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 추가 조건 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">참석자</label>
                  <input
                    type="text"
                    value={filters.attendees}
                    onChange={(e) => handleFilterChange('attendees', e.target.value)}
                    placeholder="참석자 이름 또는 이메일"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">위치</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="위치명 또는 주소"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* 특별 조건 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">특별 조건</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasAttachments === true}
                      onChange={(e) => handleFilterChange('hasAttachments', e.target.checked ? true : null)}
                      className="mr-2"
                    />
                    <span className="text-sm">첨부파일이 있는 이벤트만</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isRecurring === true}
                      onChange={(e) => handleFilterChange('isRecurring', e.target.checked ? true : null)}
                      className="mr-2"
                    />
                    <span className="text-sm">반복 일정만</span>
                  </label>
                </div>
              </div>

              {/* 정렬 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="startDate">시작 날짜</option>
                    <option value="title">제목</option>
                    <option value="created">생성일</option>
                    <option value="modified">수정일</option>
                    <option value="priority">우선순위</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="asc">오름차순</option>
                    <option value="desc">내림차순</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 오른쪽: 저장된 검색 */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">저장된 검색</h3>
                {savedSearches.length === 0 ? (
                  <p className="text-gray-500 text-sm">저장된 검색이 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {savedSearches.map(search => (
                      <div key={search.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{search.name}</h4>
                          <button
                            onClick={() => handleDeleteSavedSearch(search.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {new Date(search.createdAt).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => handleLoadSavedSearch(search)}
                          className="w-full px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          불러오기
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 검색 기록 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">최근 검색</h3>
                {searchHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">검색 기록이 없습니다</p>
                ) : (
                  <div className="space-y-1">
                    {searchHistory.slice(0, 5).map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleFilterChange('query', query)}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                검색
              </button>
            </div>
          </div>
        </div>

        {/* 검색 저장 다이얼로그 */}
        {showSaveDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">검색 저장</h3>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="검색명을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveSearch()}
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveSearch}
                    disabled={!searchName.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearchPanel;