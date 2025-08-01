import React, { useState, useEffect, useCallback } from 'react';
import { useFileExplorer } from '../hooks/useFileExplorer';
import { useAIFeatures } from '../hooks/useAIFeatures';
import Sidebar from './file-management/Sidebar';
import HeaderBar from './shared/HeaderBar';
import FileGrid from './file-management/FileGrid';
import AICopilotPanel from './ai/AICopilotPanel';
import FilePreview from './file-management/FilePreview';
import ContextMenu from './shared/ContextMenu';

const FileExplorer = () => {
  const {
    currentPath,
    files,
    fileIcons,
    loading,
    selectedFiles,
    viewMode,
    sortBy,
    sortOrder,
    searchQuery,
    filterType,
    isDarkMode,
    drives,
    favorites,
    recentFiles,
    aiSearchResults,
    setCurrentPath,
    setViewMode,
    setSortBy,
    setSortOrder,
    setSearchQuery,
    setFilterType,
    setIsDarkMode,
    loadFiles,
    toggleFileSelection,
    toggleSelectAll,
    deleteFiles,
    loadFavorites,
    loadRecentFiles,
    applyAiSearchResults,
    clearAiSearchResults
  } = useFileExplorer();

  // UI 필터 적용 콜백
  const handleUIFilterApply = useCallback((filterInfo) => {
    console.log('🎯 UI 필터 적용 시작:', filterInfo);
    
    if (filterInfo.type === 'extension') {
      // 확장자 필터 적용
      setFilterType(filterInfo.extension);
      setSearchQuery(''); // 검색 쿼리 초기화
      
      // 검색 결과를 파일 목록에 적용
      if (filterInfo.files && filterInfo.files.length > 0) {
        const searchResults = {
          type: 'extension',
          extension: filterInfo.extension,
          files: filterInfo.files,
          totalFound: filterInfo.totalFound,
          searchPaths: filterInfo.searchPaths,
          formattedResult: filterInfo.formattedResult
        };
        
        console.log('📤 applyAiSearchResults 호출:', searchResults);
        applyAiSearchResults(searchResults);
        console.log('✅ 확장자 검색 결과 적용 완료:', filterInfo.files.length, '개 파일');
        
        // 강제로 파일 목록 업데이트 트리거
        setTimeout(() => {
          console.log('🔄 파일 목록 강제 업데이트 트리거');
        }, 100);
      }
    } else if (filterInfo.type === 'search') {
      // 일반 검색 필터 적용
      setSearchQuery(filterInfo.query);
      setFilterType('all'); // 확장자 필터 초기화
      
      if (filterInfo.files && filterInfo.files.length > 0) {
        const searchResults = {
          type: 'search',
          query: filterInfo.query,
          files: filterInfo.files,
          totalFound: filterInfo.totalFound
        };
        
        applyAiSearchResults(searchResults);
      }
    }
  }, [setFilterType, setSearchQuery, applyAiSearchResults]);

  const {
    aiResult,
    chatInput,
    chatHistory,
    aiThinking,
    aiSuggestions,
    contextAwareness,
    setChatInput,
    handleAIAnalysis,
    handleSendChat,
    analyzeFileGroup,
    executeSuggestion,
    updateContext
  } = useAIFeatures(handleUIFilterApply);

  const [preview, setPreview] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);

  // 컨텍스트 업데이트
  useEffect(() => {
    updateContext({
      currentFolder: currentPath,
      fileCount: files.length,
      fileTypes: [...new Set(files.map(f => f.extension).filter(Boolean))],
      recentActivity: []
    });
  }, [currentPath, files, updateContext]);

  // 다크 모드 적용
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 파일 클릭 핸들러
  const handleFileClick = (file) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
    } else {
      setPreview(file);
      // AI 분석 자동 실행 (선택사항)
      // handleAIAnalysis(file);
    }
  };

  // 파일 더블클릭 핸들러
  const handleFileDoubleClick = (file) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
    } else {
      // 파일 열기 로직
      console.log('Opening file:', file.path);
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (file) => {
    toggleFileSelection(file);
  };

  // 컨텍스트 메뉴 핸들러
  const handleContextMenu = (e, file) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  // 네비게이션 핸들러
  const handleNavigate = (path) => {
    setCurrentPath(path);
    // 새로운 경로로 이동할 때 AI 검색 결과 초기화
    clearAiSearchResults();
  };

  // 즐겨찾기 토글
  const handleToggleFavorite = (item) => {
    // 즐겨찾기 토글 로직
    console.log('Toggle favorite:', item);
    loadFavorites();
  };

  // 파일 드롭 핸들러
  const handleFileDrop = (files, targetPath) => {
    console.log('Files dropped:', files, 'Target:', targetPath);
    // 파일 업로드 로직
  };

  // 고급 검색 표시
  const handleShowAdvancedSearch = () => {
    console.log('Show advanced search');
  };

  return (
    <div className={`h-screen flex ${isDarkMode ? 'dark' : ''}`}>
      {/* CSS 스타일 */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* 사이드바 */}
      {showSidebar && (
        <Sidebar
          currentPath={currentPath}
          drives={drives}
          favorites={favorites}
          recentFiles={recentFiles}
          onNavigate={handleNavigate}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 바 */}
        <HeaderBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          filterType={filterType}
          setFilterType={setFilterType}
          selectedFiles={selectedFiles}
          onToggleSelectAll={toggleSelectAll}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onShowAdvancedSearch={handleShowAdvancedSearch}
          onClearAiResults={clearAiSearchResults}
        />

        {/* AI 검색 결과 표시 */}
        {aiSearchResults && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  🔍 AI 검색 결과
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {aiSearchResults.totalFound}개 파일
                </span>
                {aiSearchResults.type === 'extension' && (
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    확장자: {aiSearchResults.extension}
                  </span>
                )}
              </div>
              <button
                onClick={clearAiSearchResults}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                결과 지우기
              </button>
            </div>
          </div>
        )}

        {/* 파일 그리드 */}
        <div className="flex-1 flex">
          <FileGrid
            files={files}
            viewMode={viewMode}
            selectedFiles={selectedFiles}
            onFileClick={handleFileClick}
            onFileDoubleClick={handleFileDoubleClick}
            onFileSelect={handleFileSelect}
            onContextMenu={handleContextMenu}
            fileIcons={fileIcons}
            currentPath={currentPath}
            onFileDrop={handleFileDrop}
          />

          {/* 파일 미리보기 */}
          {preview && (
            <FilePreview
              file={preview}
              onClose={() => setPreview(null)}
              onAIAnalysis={handleAIAnalysis}
            />
          )}
        </div>
      </div>

      {/* AI 코파일럿 패널 */}
      {showAIPanel && (
        <AICopilotPanel
          chatHistory={chatHistory}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendChat={handleSendChat}
          aiThinking={aiThinking}
          aiSuggestions={aiSuggestions}
          onExecuteSuggestion={executeSuggestion}
          contextAwareness={contextAwareness}
        />
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          selectedFiles={selectedFiles}
          onClose={() => setContextMenu(null)}
          onDelete={deleteFiles}
          onToggleFavorite={handleToggleFavorite}
          onAIAnalysis={handleAIAnalysis}
        />
      )}

      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span>파일을 불러오는 중...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;