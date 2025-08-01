import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFolder, FiDatabase, FiPlay, FiPause, FiSave, FiDownload } from 'react-icons/fi';

// 컴포넌트 임포트
import IndexManagement from './components/IndexManagement';
import SearchFilters from './components/SearchFilters';
import SearchResults from './components/SearchResults';
import StatusIndicator from './components/StatusIndicator';

// 훅 임포트
import useSearchIndex from './hooks/useSearchIndex.jsx';
import useFileSearch from './hooks/useFileSearch.jsx';

/**
 * SearchPanel - 파일매니저의 고급 검색 패널
 * 
 * 주요 기능:
 * - 디렉토리 인덱싱 및 실시간 감시
 * - 파일명, 확장자, 날짜 범위 검색
 * - 검색 결과 표시 및 관리
 * 
 * @param {Object} props
 * @param {string} props.activePanel - 현재 활성화된 패널
 * @param {Function} props.onNotification - 알림 표시 함수
 * @param {Function} props.onAddFileToAnalysis - 분석 패널에 파일 추가 함수
 */
const SearchPanel = ({ activePanel, onNotification, onAddFileToAnalysis }) => {
  // UI 상태
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [indexCompleteFlag, setIndexCompleteFlag] = useState(false);

  // 인덱싱 완료 콜백
  const handleIndexComplete = useCallback(() => {
    console.log('SearchPanel: 인덱싱 완료 감지');
    setIndexCompleteFlag(prev => !prev);
  }, []);

  // 인덱스 관리 상태
  const {
    indexStatus,
    isWatching,
    totalFiles,
    currentDirectory,
    lastUpdateTime,
    indexDirectory,
    saveIndex,
    loadIndex,
    toggleWatching,
    isIndexing
  } = useSearchIndex(handleIndexComplete);

  // 검색 상태 및 기능
  const {
    searchParams,
    searchResults,
    isSearching,
    totalResults,
    updateSearchParams,
    clearSearch,
    performSearch
  } = useFileSearch();

  // 검색 실행
  const handleSearch = async () => {
    try {
      await performSearch();
      if (totalResults === 0) {
        onNotification('검색 결과가 없습니다.', 'info');
      }
    } catch (error) {
      onNotification('검색 중 오류가 발생했습니다.', 'error');
    }
  };

  // 인덱싱 시작
  const handleIndexing = async (directory) => {
    try {
      await indexDirectory(directory);
      onNotification('인덱싱이 완료되었습니다.', 'success');
      // 인덱싱 완료는 useSearchIndex 훅에서 자동으로 처리됨
    } catch (error) {
      onNotification('인덱싱 시작 실패', 'error');
    }
  };

  // 파일 분석하기
  const handleAnalyzeFile = async (filePath) => {
    try {
      if (onAddFileToAnalysis) {
        await onAddFileToAnalysis(filePath);
      } else {
        onNotification(`파일 분석을 시작합니다: ${filePath}`, 'info');
      }
    } catch (error) {
      onNotification('파일 분석 시작 실패', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 헤더 영역 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiSearch className="w-6 h-6 text-gray-700" />
            <h1 className="text-xl font-semibold text-gray-900">고급 파일 검색</h1>
          </div>
          
          {/* 상태 표시기 */}
          <StatusIndicator
            indexStatus={indexStatus}
            isWatching={isWatching}
            totalFiles={totalFiles}
            lastUpdateTime={lastUpdateTime}
            onIndexComplete={indexCompleteFlag}
          />
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 overflow-hidden flex">
        {/* 왼쪽 패널 - 인덱스 관리 및 검색 필터 */}
        <div className={`${isExpanded ? 'w-96' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden`}>
          <div className="h-full overflow-y-auto">
            {/* 인덱스 관리 섹션 */}
            <div className="p-6 border-b border-gray-100">
              <IndexManagement
                currentDirectory={currentDirectory}
                isIndexing={isIndexing}
                isWatching={isWatching}
                onIndex={handleIndexing}
                onSave={saveIndex}
                onLoad={loadIndex}
                onToggleWatch={toggleWatching}
              />
            </div>

            {/* 검색 필터 섹션 */}
            <div className="p-6">
              <SearchFilters
                searchParams={searchParams}
                onUpdateParams={updateSearchParams}
                onSearch={handleSearch}
                onClear={clearSearch}
                isSearching={isSearching}
                isIndexReady={indexStatus === 'loaded'}
              />
            </div>
          </div>
        </div>

        {/* 오른쪽 패널 - 검색 결과 */}
        <div className="flex-1 bg-gray-50 overflow-hidden">
          <SearchResults
            results={searchResults}
            totalResults={totalResults}
            isSearching={isSearching}
            selectedResult={selectedResult}
            onSelectResult={setSelectedResult}
            onTogglePanel={() => setIsExpanded(!isExpanded)}
            isPanelExpanded={isExpanded}
            onAnalyzeFile={handleAnalyzeFile}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;