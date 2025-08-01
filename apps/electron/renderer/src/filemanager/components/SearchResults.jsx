import React, { useState, useMemo } from 'react';
import { 
  FiFileText, FiFolder, FiImage, FiVideo, FiMusic, FiArchive, FiCode, 
  FiChevronLeft, FiChevronRight, FiCopy, FiExternalLink,
  FiArrowUp, FiArrowDown, FiGrid, FiList, FiSearch, FiBarChart2
} from 'react-icons/fi';
import { formatFileSize, formatDate, getFileIcon } from '../utils/fileHelpers.jsx';

/**
 * SearchResults - 검색 결과 표시 컴포넌트
 * 
 * 기능:
 * - 검색 결과 테이블/그리드 뷰
 * - 정렬 및 필터링
 * - 파일 미리보기
 * - 경로 복사 및 파일 열기
 * - 파일 분석하기
 * 
 * @param {Object} props
 * @param {Array} props.results - 검색 결과 배열
 * @param {number} props.totalResults - 전체 결과 수
 * @param {boolean} props.isSearching - 검색 진행 중 여부
 * @param {Object} props.selectedResult - 선택된 결과
 * @param {Function} props.onSelectResult - 결과 선택 함수
 * @param {Function} props.onTogglePanel - 패널 토글 함수
 * @param {boolean} props.isPanelExpanded - 패널 확장 여부
 * @param {Function} props.onAnalyzeFile - 파일 분석 함수
 */
const SearchResults = ({
  results = [],
  totalResults = 0,
  isSearching,
  selectedResult,
  onSelectResult,
  onTogglePanel,
  isPanelExpanded,
  onAnalyzeFile
}) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'size', 'mtime', 'ext'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [page, setPage] = useState(1);
  const itemsPerPage = viewMode === 'list' ? 50 : 48;

  // 정렬된 결과
  const sortedResults = useMemo(() => {
    const sorted = [...results].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // 파일 크기는 숫자로 비교
      if (sortBy === 'size') {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      }
      
      // 날짜는 Date 객체로 비교
      if (sortBy === 'mtime') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // 문자열은 대소문자 구분 없이 비교
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [results, sortBy, sortOrder]);

  // 페이지네이션된 결과
  const paginatedResults = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return sortedResults.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedResults, page, itemsPerPage]);

  // 전체 페이지 수
  const totalPages = Math.ceil(results.length / itemsPerPage);

  // 정렬 토글
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // 파일 열기
  const handleOpenFile = async (filePath) => {
    if (window.electronAPI && window.electronAPI.openFile) {
      try {
        await window.electronAPI.openFile(filePath);
      } catch (error) {
        console.error('파일 열기 실패:', error);
      }
    }
  };

  // 폴더에서 열기 (파일이 위치한 폴더를 윈도우 탐색기에서 열고 파일 선택)
  const handleOpenFolder = async (filePath) => {
    if (window.electronAPI) {
      try {
        // showItemInFolder API가 있으면 사용 (파일 선택하여 폴더 열기)
        if (window.electronAPI.showItemInFolder) {
          await window.electronAPI.showItemInFolder(filePath);
          console.log('폴더에서 파일 선택하여 열기:', filePath);
        } 
        // openFolder API가 있으면 사용 (폴더만 열기)
        else if (window.electronAPI.openFolder) {
          const folderPath = filePath.substring(0, filePath.lastIndexOf('\\'));
          await window.electronAPI.openFolder(folderPath);
          console.log('폴더 열기:', folderPath);
        }
        // 백업: openFile API 사용 (폴더 경로로)
        else if (window.electronAPI.openFile) {
          const folderPath = filePath.substring(0, filePath.lastIndexOf('\\'));
          await window.electronAPI.openFile(folderPath);
          console.log('폴더 열기 (openFile 사용):', folderPath);
        }
        else {
          console.warn('폴더 열기 API를 찾을 수 없습니다');
        }
      } catch (error) {
        console.error('폴더 열기 실패:', error);
      }
    } else {
      console.warn('Electron API를 사용할 수 없습니다');
    }
  };

  // 경로 복사 (파일이 위치한 폴더 경로만)
  const handleCopyPath = async (filePath) => {
    if (navigator.clipboard) {
      try {
        // 파일 경로에서 폴더 경로만 추출
        const folderPath = filePath.substring(0, filePath.lastIndexOf('\\'));
        await navigator.clipboard.writeText(folderPath);
        console.log('폴더 경로 복사 완료:', folderPath);
        // 복사 완료 피드백 (실제로는 toast 알림 사용)
      } catch (error) {
        console.error('경로 복사 실패:', error);
      }
    }
  };

  // 파일 분석하기
  const handleAnalyzeFile = async (filePath) => {
    if (onAnalyzeFile) {
      try {
        await onAnalyzeFile(filePath);
      } catch (error) {
        console.error('파일 분석 실패:', error);
      }
    }
  };

  // 빈 상태 렌더링
  if (!isSearching && results.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onTogglePanel}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title={isPanelExpanded ? "패널 숨기기" : "패널 표시"}
              >
                {isPanelExpanded ? <FiChevronLeft className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
              </button>
              <h2 className="text-lg font-medium text-gray-800">검색 결과</h2>
            </div>
          </div>
        </div>

        {/* 빈 상태 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
            <p className="text-gray-400 text-sm mt-2">
              왼쪽 패널에서 검색 조건을 입력하고 검색을 시작하세요
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onTogglePanel}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title={isPanelExpanded ? "패널 숨기기" : "패널 표시"}
            >
              {isPanelExpanded ? <FiChevronLeft className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
            </button>
            <h2 className="text-lg font-medium text-gray-800">
              검색 결과 
              {totalResults > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({totalResults.toLocaleString()}개)
                </span>
              )}
            </h2>
          </div>

          {/* 뷰 모드 전환 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-gray-200 text-gray-700' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
              title="리스트 뷰"
            >
              <FiList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-gray-200 text-gray-700' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
              title="그리드 뷰"
            >
              <FiGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 검색 중 표시 */}
      {isSearching && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">검색 중...</span>
            </div>
          </div>
        </div>
      )}

      {/* 결과 표시 */}
      {!isSearching && results.length > 0 && (
        <>
          {viewMode === 'list' ? (
            /* 리스트 뷰 */
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => toggleSort('name')}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        <span>파일명</span>
                        {sortBy === 'name' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => toggleSort('ext')}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        <span>확장자</span>
                        {sortBy === 'ext' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => toggleSort('size')}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        <span>크기</span>
                        {sortBy === 'size' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => toggleSort('mtime')}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        <span>수정일</span>
                        {sortBy === 'mtime' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedResults.map((result, index) => (
                    <tr
                      key={`${result.path}-${index}`}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedResult?.path === result.path ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => onSelectResult(result)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getFileIcon(result.ext)}
                          <span className="ml-2 text-sm text-gray-900 truncate max-w-md">
                            {result.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {result.ext ? `.${result.ext}` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {formatFileSize(result.size)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {formatDate(result.mtime)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPath(result.path);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="경로 복사"
                          >
                            <FiCopy className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFolder(result.path);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="폴더에서 열기"
                          >
                            <FiFolder className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFile(result.path);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="파일 열기"
                          >
                            <FiExternalLink className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeFile(result.path);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="파일 분석하기"
                          >
                            <FiBarChart2 className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* 그리드 뷰 */
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-4 gap-4">
                {paginatedResults.map((result, index) => (
                  <div
                    key={`${result.path}-${index}`}
                    className={`p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer ${
                      selectedResult?.path === result.path 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => onSelectResult(result)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-2">
                        {getFileIcon(result.ext, 'large')}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate w-full">
                        {result.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(result.size)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(result.mtime)}
                      </p>
                      
                      {/* 작업 버튼들 */}
                      <div className="flex items-center space-x-1 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPath(result.path);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="경로 복사"
                        >
                          <FiCopy className="w-3 h-3 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFolder(result.path);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="폴더에서 열기"
                        >
                          <FiFolder className="w-3 h-3 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFile(result.path);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="파일 열기"
                        >
                          <FiExternalLink className="w-3 h-3 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnalyzeFile(result.path);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="파일 분석하기"
                        >
                          <FiBarChart2 className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {((page - 1) * itemsPerPage + 1).toLocaleString()} - {Math.min(page * itemsPerPage, results.length).toLocaleString()} / 총 {results.length.toLocaleString()}개
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      page === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    이전
                  </button>
                  <span className="text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      page === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 선택된 파일 상세 정보 (하단 패널 - 추후 구현) */}
      {selectedResult && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="text-sm">
            <p className="font-medium text-gray-900">{selectedResult.name}</p>
            <p className="text-gray-500 text-xs mt-1">{selectedResult.path}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;