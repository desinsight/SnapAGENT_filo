import React, { useMemo, useEffect } from 'react';
import { detectDuplicates } from '../utils/duplicateDetector';

const ExtensionFilterBar = ({ 
  files, 
  selectedExtensions, 
  onExtensionChange,
  isDarkMode 
}) => {
  useEffect(() => {
    console.log('[ExtensionFilterBar] selectedExtensions 변경:', selectedExtensions);
  }, [selectedExtensions]);

  // 현재 폴더의 파일들에서 확장자 추출, 카운트 및 중복 감지
  const extensionStats = useMemo(() => {
    if (!files || files.length === 0) return [];

    const stats = new Map();
    
    // 전체 파일 카운트
    let totalFiles = 0;
    let totalFolders = 0;

    files.forEach(file => {
      if (file.isDirectory) {
        totalFolders++;
      } else {
        totalFiles++;
        const ext = file.extension?.toLowerCase() || '';
        if (ext) {
          stats.set(ext, (stats.get(ext) || 0) + 1);
        } else {
          // 확장자가 없는 파일
          stats.set('no-ext', (stats.get('no-ext') || 0) + 1);
        }
      }
    });

    // 중복 파일 감지
    const { duplicateCount } = detectDuplicates(files);
    console.log('📊 [ExtensionFilterBar] Duplicate count:', duplicateCount);

    // 확장자별 통계를 배열로 변환하고 정렬
    const extensionArray = Array.from(stats.entries())
      .map(([ext, count]) => ({
        extension: ext,
        count,
        displayName: ext === 'no-ext' ? '확장자 없음' : ext.toUpperCase()
      }))
      .sort((a, b) => b.count - a.count); // 개수 순으로 정렬

    // 전체 항목을 맨 앞에 추가
    const result = [];
    
    if (totalFiles + totalFolders > 0) {
      result.push({
        extension: 'all',
        count: totalFiles + totalFolders,
        displayName: '전체'
      });
    }

    if (totalFolders > 0) {
      result.push({
        extension: 'folder',
        count: totalFolders,
        displayName: '폴더'
      });
    }

    // 중복 파일이 있으면 중복 필터 추가
    if (duplicateCount > 0) {
      result.push({
        extension: 'duplicate',
        count: duplicateCount,
        displayName: '중복 파일'
      });
    }

    return result.concat(extensionArray);
  }, [files]);

  // 다중 선택 토글 함수
  const toggleExtension = (extension) => {
    if (extension === 'all') {
      // '전체' 클릭 시 모든 선택 해제
      onExtensionChange([]);
      return;
    }

    const currentSelected = selectedExtensions || [];
    const isSelected = currentSelected.includes(extension);
    
    if (isSelected) {
      // 이미 선택된 경우 제거
      onExtensionChange(currentSelected.filter(ext => ext !== extension));
    } else {
      // 선택되지 않은 경우 추가
      onExtensionChange([...currentSelected, extension]);
    }
  };

  // 모든 필터 초기화
  const clearAllFilters = () => {
    onExtensionChange([]);
  };

  // 확장자가 없으면 필터바 숨김
  if (extensionStats.length <= 1) {
    return null;
  }

  return (
    <div className={`border-b transition-colors ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="px-4 py-3">
        {/* 파일 유형 헤더 - 고정 */}
        <div className="flex items-center space-x-2 text-sm mb-3">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            파일 유형:
          </span>
          {selectedExtensions && selectedExtensions.length > 0 && (
            <div className="flex items-center space-x-2 ml-auto">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedExtensions.length}개 선택됨
              </span>
              <button
                onClick={clearAllFilters}
                className={`p-1.5 rounded-full transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
                title="모든 필터 초기화"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* 필터 버튼들 - 체크박스 스타일 */}
        <div className="flex items-center gap-2 flex-wrap">
          {extensionStats.map(({ extension, count, displayName }) => {
            const isSelected = selectedExtensions && selectedExtensions.includes(extension);
            const isAllFilter = extension === 'all';
            
            return (
              <button
                key={extension}
                onClick={() => toggleExtension(extension)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-blue-500 text-white shadow-lg'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                } ${isAllFilter ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
              >
                {/* 체크박스 아이콘 */}
                <div className={`w-3 h-3 mr-1.5 rounded-sm border flex items-center justify-center ${
                  isSelected
                    ? 'bg-white border-white'
                    : isDarkMode
                      ? 'border-gray-400'
                      : 'border-gray-400'
                }`}>
                  {isSelected && (
                    <svg className="w-2 h-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <span>{displayName}</span>
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : isDarkMode
                      ? 'bg-gray-600 text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* 선택된 필터 정보 */}
        {selectedExtensions && selectedExtensions.length > 0 && (
          <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span>선택된 필터: </span>
            {selectedExtensions.map((ext, index) => {
              let displayText = '';
              if (ext === 'folder') displayText = '폴더';
              else if (ext === 'no-ext') displayText = '확장자 없음';
              else if (ext === 'duplicate') displayText = '중복 파일';
              else displayText = ext.toUpperCase();
              
              return (
                <span key={ext}>
                  {displayText}
                  {index < selectedExtensions.length - 1 && ', '}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtensionFilterBar;