import React, { useState, useEffect } from 'react';

// 아이콘 컴포넌트들
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SizeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const TypeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ClearIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const SearchPanel = ({
  searchQuery,
  filterType,
  onSearchChange,
  onFilterChange,
  onSearchAnalysis,
  onNotification
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    fileType: '',
    sizeMin: '',
    sizeMax: '',
    dateFrom: '',
    dateTo: '',
    location: ''
  });
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 검색 기록 불러오기
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 검색 실행
  const performSearch = async (query = localQuery) => {
    if (!query.trim()) return;

    setIsSearching(true);
    
    try {
      // 검색 로직 (실제 구현 시 API 호출)
      const results = await mockSearch(query, filters);
      setSearchResults(results);
      
      // 검색 기록에 추가
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      
      onSearchChange && onSearchChange(query);
      onNotification && onNotification(`"${query}" 검색 완료: ${results.length}개 결과`, 'success');
    } catch (error) {
      console.error('Search error:', error);
      onNotification && onNotification('검색 중 오류가 발생했습니다', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // 모의 검색 함수
  const mockSearch = async (query, filters) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // 검색 시뮬레이션
    
    // 모의 검색 결과
    return [
      {
        name: `${query}_document.pdf`,
        path: `/documents/${query}_document.pdf`,
        size: 1024000,
        type: 'pdf',
        modifiedAt: new Date().toISOString(),
        isDirectory: false
      },
      {
        name: `${query}_folder`,
        path: `/documents/${query}_folder`,
        size: 0,
        type: 'folder',
        modifiedAt: new Date().toISOString(),
        isDirectory: true
      }
    ];
  };

  // 검색 폼 제출
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch();
  };

  // 필터 초기화
  const clearFilters = () => {
    setFilters({
      fileType: '',
      sizeMin: '',
      sizeMax: '',
      dateFrom: '',
      dateTo: '',
      location: ''
    });
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* 검색 헤더 */}
        <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">고급 검색</h2>
            
            {/* 메인 검색 바 */}
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="파일명, 내용, 태그로 검색..."
                  className="
                    w-full pl-12 pr-12 py-4 text-lg
                    bg-gray-50 dark:bg-gray-700
                    border border-gray-200 dark:border-gray-600
                    rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder-gray-500 dark:placeholder-gray-400
                    text-gray-900 dark:text-white
                  "
                />
                {localQuery && (
                  <button
                    type="button"
                    onClick={() => setLocalQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <ClearIcon />
                  </button>
                )}
              </div>

              {/* 빠른 필터 */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${showAdvanced 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <FilterIcon />
                  <span>고급 필터</span>
                </button>

                {['문서', '이미지', '동영상', '음악'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, fileType: type }))}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${filters.fileType === type
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* 고급 필터 */}
              {showAdvanced && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 파일 유형 */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <TypeIcon />
                        <span>파일 유형</span>
                      </label>
                      <select
                        value={filters.fileType}
                        onChange={(e) => setFilters(prev => ({ ...prev, fileType: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                      >
                        <option value="">모든 유형</option>
                        <option value="document">문서</option>
                        <option value="image">이미지</option>
                        <option value="video">동영상</option>
                        <option value="audio">음악</option>
                        <option value="archive">압축파일</option>
                      </select>
                    </div>

                    {/* 파일 크기 */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <SizeIcon />
                        <span>파일 크기</span>
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={filters.sizeMin}
                          onChange={(e) => setFilters(prev => ({ ...prev, sizeMin: e.target.value }))}
                          placeholder="최소"
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={filters.sizeMax}
                          onChange={(e) => setFilters(prev => ({ ...prev, sizeMax: e.target.value }))}
                          placeholder="최대"
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* 수정일 */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <CalendarIcon />
                        <span>수정일</span>
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                        />
                        <input
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      필터 초기화
                    </button>
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {isSearching ? '검색 중...' : '검색'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* 검색 결과 및 히스토리 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* 사이드바 - 검색 기록 */}
            <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">검색 기록</h3>
              <div className="space-y-2">
                {searchHistory.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setLocalQuery(query);
                      performSearch(query);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {query}
                  </button>
                ))}
                {searchHistory.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">검색 기록이 없습니다</p>
                )}
              </div>

              {/* 인기 검색어 */}
              <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">인기 검색어</h4>
                <div className="space-y-1">
                  {['문서', '이미지', '프로젝트', '다운로드', '바탕화면'].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setLocalQuery(term);
                        performSearch(term);
                      }}
                      className="block w-full text-left px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 메인 결과 영역 */}
            <div className="flex-1 p-6">
              {isSearching ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">검색 중...</p>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      검색 결과 ({searchResults.length}개)
                    </h3>
                    <button
                      onClick={() => onSearchAnalysis && onSearchAnalysis(localQuery, searchResults)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <StarIcon />
                      <span>AI 분석</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-shrink-0">
                          {result.isDirectory ? (
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                          ) : (
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.path}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {!result.isDirectory && <span>{formatFileSize(result.size)}</span>}
                            <span>{new Date(result.modifiedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : localQuery ? (
                <div className="text-center py-16">
                  <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    "{localQuery}"에 대한 결과를 찾을 수 없습니다
                  </p>
                  <button
                    onClick={() => onSearchAnalysis && onSearchAnalysis(localQuery, [])}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    AI가 대안을 제안해드릴까요?
                  </button>
                </div>
              ) : (
                <div className="text-center py-16">
                  <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    파일과 폴더를 검색하세요
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    파일명, 내용, 태그로 빠르고 정확한 검색이 가능합니다
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;