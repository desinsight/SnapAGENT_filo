import React, { useState, useEffect, useRef } from 'react';
import SmartOrganizeModal from './SmartOrganizeModal';
import { organizeByExtension, organizeByDate, organizeByDuplicate, organizeByTemp, organizeBySize, organizeByAI } from '../../../utils/api';

// 아이콘 컴포넌트들
const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);


const SmartOrganizeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const TopBar = ({
  currentPath,
  selectedFiles,
  searchQuery,
  onSearchChange,
  onNavigate,
  onToggleRightPanel,
  rightPanelVisible,
  onNotification,
  reloadFiles, // 새로고침 함수 추가
  viewMode, // 뷰 모드 상태 추가
  onViewModeChange, // 뷰 모드 변경 함수 추가
  includeSubfolders = false,
  onIncludeSubfoldersChange
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [showSmartOrganizeModal, setShowSmartOrganizeModal] = useState(false);
  const [includeSubfoldersState, setIncludeSubfoldersState] = useState(includeSubfolders);
  const debounceRef = useRef(null);

  // 실시간 검색을 위한 debounce 효과
  useEffect(() => {
    // 기존 타이머 클리어
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 300ms 후에 검색 실행 (타이핑이 멈춘 후)
    debounceRef.current = setTimeout(() => {
      onSearchChange(localSearchQuery);
    }, 300);

    // 컴포넌트 언마운트 시 타이머 클리어
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localSearchQuery, onSearchChange]);

  // 외부에서 searchQuery가 변경되면 localSearchQuery도 동기화
  useEffect(() => {
    setLocalSearchQuery(searchQuery || '');
  }, [searchQuery]);

  // 경로를 브레드크럼으로 변환
  const getBreadcrumbs = () => {
    if (!currentPath) return [];
    
    const parts = currentPath.split(/[\\/]/).filter(Boolean);
    const breadcrumbs = [];
    
    // 홈 추가
    breadcrumbs.push({
      name: '홈',
      path: '/',
      isHome: true
    });
    
    // 각 경로 부분 추가
    let currentBuildPath = '';
    parts.forEach((part, index) => {
      currentBuildPath += (index === 0 && part.includes(':')) ? part + '\\' : '/' + part;
      breadcrumbs.push({
        name: part,
        path: currentBuildPath,
        isLast: index === parts.length - 1
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // 검색 클리어 핸들러
  const handleSearchClear = () => {
    setLocalSearchQuery('');
    // debounce를 건너뛰고 즉시 클리어
    onSearchChange('');
  };

  // 경로 복사 핸들러
  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(currentPath);
      onNotification('경로가 클립보드에 복사되었습니다.', 'success');
    } catch (error) {
      console.error('경로 복사 실패:', error);
      onNotification('경로 복사에 실패했습니다.', 'error');
    }
  };

  // 스마트 정리 핸들러
  const handleSmartOrganize = async (optionId, targetPath, includeSubfolders = false, options = {}) => {
    try {
      if (optionId === 'extension') {
        const result = await organizeByExtension(targetPath, includeSubfolders);
        if (result.success) {
          onNotification(`확장자별 정리가 완료되었습니다.${includeSubfolders ? ' (하위 폴더 포함)' : ''}`, 'success');
          if (typeof reloadFiles === 'function') {
            reloadFiles(targetPath);
          }
        } else {
          onNotification(result.error || '정리 중 오류가 발생했습니다.', 'error');
        }
        return;
      }
      // 날짜별 정리 API 호출
      if (optionId === 'date') {
        const result = await organizeByDate(targetPath, includeSubfolders);
        if (result.success) {
          onNotification(`날짜별 정리가 완료되었습니다.${includeSubfolders ? ' (하위 폴더 포함)' : ''}`, 'success');
          if (typeof reloadFiles === 'function') {
            reloadFiles(targetPath);
          }
        } else {
          onNotification(result.error || '정리 중 오류가 발생했습니다.', 'error');
        }
        return;
      }
      
      // 중복 파일 정리 API 호출
      if (optionId === 'duplicate') {
        const result = await organizeByDuplicate(targetPath, includeSubfolders);
        if (result.success) {
          onNotification(`중복 파일 정리가 완료되었습니다.${includeSubfolders ? ' (하위 폴더 포함)' : ''}`, 'success');
          if (typeof reloadFiles === 'function') {
            reloadFiles(targetPath);
          }
        } else {
          onNotification(result.error || '정리 중 오류가 발생했습니다.', 'error');
        }
        return;
      }
      
      // 임시파일 정리 API 호출
      if (optionId === 'temp') {
        const result = await organizeByTemp(targetPath, includeSubfolders);
        if (result.success) {
          onNotification(`임시 파일 정리가 완료되었습니다.${includeSubfolders ? ' (하위 폴더 포함)' : ''}`, 'success');
          if (typeof reloadFiles === 'function') {
            reloadFiles(targetPath);
          }
        } else {
          onNotification(result.error || '정리 중 오류가 발생했습니다.', 'error');
        }
        return;
      }
      
      // 대용량 파일 정리 API 호출
      if (optionId === 'size') {
        const sizeThreshold = options.sizeThreshold || 100 * 1024 * 1024;
        const result = await organizeBySize(targetPath, includeSubfolders, sizeThreshold);
        if (result.success) {
          const sizeMsg = `${Math.round(sizeThreshold / (1024 * 1024))}MB 이상의 대용량 파일이 ZIP으로 압축되고 원본은 별도 폴더로 이동되었습니다.`;
          onNotification(sizeMsg, 'success');
          if (typeof reloadFiles === 'function') {
            reloadFiles(targetPath);
          }
        } else {
          onNotification(result.error || '정리 중 오류가 발생했습니다.', 'error');
        }
        return;
      }
      
      // AI 추천 정리 API 호출
      if (optionId === 'ai') {
        const aiRequest = options.aiRequest || '파일을 체계적으로 정리해주세요';
        const result = await organizeByAI(targetPath, includeSubfolders, aiRequest);
        if (result.success) {
          const successCount = result.results?.filter(r => r.success).length || 0;
          const totalCount = result.results?.length || 0;
          onNotification(`AI 정리 완료: ${totalCount}개 작업 중 ${successCount}개 성공`, 'success');
          if (typeof reloadFiles === 'function') {
            reloadFiles(targetPath);
          }
        } else {
          onNotification(result.error || 'AI 정리 중 오류가 발생했습니다.', 'error');
        }
        return;
      }
      
      // 기타 옵션들
      onNotification('정리가 완료되었습니다.', 'success');
    } catch (error) {
      console.error('스마트 정리 실행 중 오류:', error);
      onNotification('정리 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-6 space-x-6 shadow-sm">
      {/* 네비게이션 브레드크럼 */}
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <nav className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 overflow-hidden">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center space-x-1">
              {index > 0 && <ChevronRightIcon />}
              <button
                onClick={() => onNavigate(crumb.path)}
                className={`
                  flex items-center px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                  ${crumb.isLast ? 'text-gray-900 dark:text-white font-medium' : 'hover:text-gray-900 dark:hover:text-white'}
                `}
                title={crumb.path}
              >
                {crumb.isHome && <HomeIcon />}
                <span className={`${crumb.isHome ? 'ml-1' : ''} truncate max-w-32`}>
                  {crumb.name}
                </span>
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* 경로 복사 버튼 */}
      <div className="flex-shrink-0">
        <button
          onClick={handleCopyPath}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-sm"
          title="현재 경로 복사"
        >
          <CopyIcon />
        </button>
      </div>

      {/* 하위 폴더 체크박스 */}
      <div className="flex-shrink-0">
        <label className="flex items-center whitespace-nowrap cursor-pointer">
          <input
            type="checkbox"
            checked={includeSubfoldersState}
            onChange={(e) => {
              console.log('[DEBUG] 체크박스 상태 변경:', e.target.checked);
              setIncludeSubfoldersState(e.target.checked);
              if (onIncludeSubfoldersChange) {
                onIncludeSubfoldersChange(e.target.checked);
              }
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">하위 폴더</span>
        </label>
      </div>

      {/* 검색 영역 */}
      <div className="flex-shrink-0 w-96">
        <div className="relative">
          <input
            type="text"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="파일 및 폴더 검색... (실시간 검색)"
            className="
              w-full pl-12 pr-12 py-3 text-sm
              bg-gray-50 dark:bg-gray-700 
              border border-gray-200 dark:border-gray-600
              rounded-xl
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder-gray-500 dark:placeholder-gray-400
              text-gray-900 dark:text-white
              shadow-sm hover:shadow-md transition-shadow
            "
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          {localSearchQuery && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="검색 지우기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 도구 모음 */}
      <div className="flex items-center space-x-3">
        {/* 선택된 파일 개수 표시 */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/25">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {selectedFiles.length}개 선택됨
          </div>
        )}

        {/* 보기 옵션 */}
        <div className="relative">
          <button
            onClick={() => setShowViewOptions(!showViewOptions)}
            className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:shadow-sm"
            title="보기 옵션"
          >
            {viewMode === 'grid' ? <GridIcon /> : <ListIcon />}
          </button>

          {showViewOptions && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  onViewModeChange('grid');
                  setShowViewOptions(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${
                  viewMode === 'grid' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <GridIcon />
                <span className="ml-2">격자 보기</span>
              </button>
              <button
                onClick={() => {
                  onViewModeChange('list');
                  setShowViewOptions(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${
                  viewMode === 'list' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <ListIcon />
                <span className="ml-2">목록 보기</span>
              </button>
            </div>
          )}
        </div>

        {/* 스마트 정리 버튼 */}
        <button
          onClick={() => setShowSmartOrganizeModal(true)}
          className="p-3 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all duration-200 hover:shadow-sm"
          title="스마트 정리"
        >
          <SmartOrganizeIcon />
        </button>
      </div>

      {/* 클릭 외부 감지 */}
      {showViewOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowViewOptions(false)}
        />
      )}

      {/* 스마트 정리 모달 */}
      <SmartOrganizeModal
        isOpen={showSmartOrganizeModal}
        onClose={() => setShowSmartOrganizeModal(false)}
        onOrganize={handleSmartOrganize}
        currentPath={currentPath}
      />
    </div>
  );
};

export default TopBar;