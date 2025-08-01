import React, { useState, useEffect } from 'react';
import { FiFolder, FiDatabase, FiPlay, FiPause, FiSave, FiDownload, FiAlertCircle, FiRefreshCw, FiX } from 'react-icons/fi';

/**
 * IndexManagement - 파일 인덱스 관리 컴포넌트
 * 
 * 기능:
 * - 디렉토리 선택 및 인덱싱
 * - 인덱스 저장/불러오기
 * - 실시간 파일 감시 제어
 * 
 * @param {Object} props
 * @param {string} props.currentDirectory - 현재 인덱싱된 디렉토리
 * @param {boolean} props.isIndexing - 인덱싱 진행 중 여부
 * @param {boolean} props.isWatching - 파일 감시 활성화 여부
 * @param {Function} props.onIndex - 인덱싱 시작 함수
 * @param {Function} props.onSave - 인덱스 저장 함수
 * @param {Function} props.onLoad - 인덱스 불러오기 함수
 * @param {Function} props.onToggleWatch - 파일 감시 토글 함수
 */
const IndexManagement = ({
  currentDirectory,
  isIndexing,
  isWatching,
  onIndex,
  onSave,
  onLoad,
  onToggleWatch
}) => {
  const [selectedDirectory, setSelectedDirectory] = useState(currentDirectory || '');
  const [showDirectoryPicker, setShowDirectoryPicker] = useState(false);
  const [error, setError] = useState(null);
  const [indexingStatus, setIndexingStatus] = useState({
    isIndexing: false,
    isPaused: false,
    currentPath: null,
    processedFiles: 0,
    progress: 0
  });

  // 디렉토리 선택 처리
  const handleDirectorySelect = async () => {
    try {
      // Electron API를 통한 디렉토리 선택
      if (window.electronAPI && window.electronAPI.showOpenDialog) {
        const result = await window.electronAPI.showOpenDialog({ properties: ['openDirectory'] });
        if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
          setSelectedDirectory(result.filePaths[0]);
        }
      } else if (window.electronAPI && window.electronAPI.selectDirectory) {
        // fallback: selectDirectory 지원 시
        const result = await window.electronAPI.selectDirectory();
        if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
          setSelectedDirectory(result.filePaths[0]);
        }
      } else {
        // 폴백: 수동 입력
        setShowDirectoryPicker(true);
      }
    } catch (error) {
      console.error('디렉토리 선택 오류:', error);
      setError(error.message || String(error));
    }
  };

  // 인덱싱 상태 조회
  const checkIndexingStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tools/ultra-fast-search/status');
      const data = await response.json();
      console.log('📊 상태 조회 응답:', data);
      
      if (data.success) {
        setIndexingStatus(data);
        
        // 인덱싱이 완료되었다면 부모 컴포넌트에도 알림
        if (!data.isIndexing && isIndexing) {
          // 인덱싱이 완료되었음을 부모에게 알려야 하는 경우
          // (현재는 직접적인 방법이 없으므로 로깅만)
          console.log('🎉 인덱싱 완료 감지됨');
        }
      }
    } catch (error) {
      console.error('인덱싱 상태 조회 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    checkIndexingStatus();
  }, []);

  // 정기적으로 인덱싱 상태 확인
  useEffect(() => {
    let interval;
    if (indexingStatus.isIndexing) {
      interval = setInterval(checkIndexingStatus, 500); // 500ms마다 상태 확인 (더 빠른 업데이트)
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [indexingStatus.isIndexing]);

  // 인덱싱 시작
  const handleStartIndexing = async () => {
    if (selectedDirectory) {
      try {
        // 인덱싱 시작 요청
        await onIndex(selectedDirectory);
        setError(null);
        
        // 인덱싱 시작됨을 즉시 반영
        setIndexingStatus(prev => ({
          ...prev,
          isIndexing: true,
          isPaused: false,
          currentPath: selectedDirectory,
          processedFiles: 0
        }));
        
        // 즉시 상태 확인 시작
        checkIndexingStatus();
      } catch (error) {
        setError(error && error.message ? error.message : String(error));
      }
    }
  };

  // 인덱싱 일시정지
  const handlePauseIndexing = async () => {
    try {
      console.log('🔄 일시정지 API 호출 중...');
      const response = await fetch('http://localhost:5000/api/tools/ultra-fast-search/pause', {
        method: 'POST'
      });
      const data = await response.json();
      console.log('🔄 일시정지 API 응답:', data);
      
      if (data.success) {
        // 즉시 UI 상태 업데이트
        setIndexingStatus(prev => ({
          ...prev,
          isPaused: true
        }));
        // 백엔드 상태도 확인
        checkIndexingStatus();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('일시정지 실패: ' + error.message);
      console.error('일시정지 에러:', error);
    }
  };

  // 인덱싱 재개
  const handleResumeIndexing = async () => {
    try {
      console.log('▶️ 재개 API 호출 중...');
      const response = await fetch('http://localhost:5000/api/tools/ultra-fast-search/resume', {
        method: 'POST'
      });
      const data = await response.json();
      console.log('▶️ 재개 API 응답:', data);
      
      if (data.success) {
        // 즉시 UI 상태 업데이트
        setIndexingStatus(prev => ({
          ...prev,
          isPaused: false
        }));
        // 백엔드 상태도 확인
        checkIndexingStatus();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('재개 실패: ' + error.message);
      console.error('재개 에러:', error);
    }
  };

  // 인덱싱 취소
  const handleCancelIndexing = async () => {
    if (confirm('인덱싱을 취소하시겠습니까?')) {
      try {
        console.log('❌ 취소 API 호출 중...');
        const response = await fetch('http://localhost:5000/api/tools/ultra-fast-search/cancel', {
          method: 'POST'
        });
        const data = await response.json();
        console.log('❌ 취소 API 응답:', data);
        
        if (data.success) {
          // 즉시 UI 상태 업데이트
          setIndexingStatus(prev => ({
            ...prev,
            isIndexing: false,
            isPaused: false,
            currentPath: null,
            processedFiles: 0
          }));
          // 백엔드 상태도 확인
          checkIndexingStatus();
        } else {
          setError(data.message);
        }
      } catch (error) {
        setError('취소 실패: ' + error.message);
        console.error('취소 에러:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-800 flex items-center">
          <FiDatabase className="w-5 h-5 mr-2 text-gray-600" />
          인덱스 관리
        </h2>
        {indexingStatus.isIndexing && (
          <div className="flex items-center text-sm text-blue-600">
            <FiRefreshCw className="w-4 h-4 mr-1 animate-spin" />
            인덱싱 중...
          </div>
        )}
      </div>

      {/* 디렉토리 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          인덱싱 디렉토리
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={selectedDirectory}
            onChange={(e) => setSelectedDirectory(e.target.value)}
            placeholder="디렉토리 경로를 입력하세요"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white text-gray-900"
          />
          <button
            onClick={handleDirectorySelect}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md
                     transition-colors duration-200 flex items-center"
            title="디렉토리 선택"
          >
            <FiFolder className="w-4 h-4" />
          </button>
        </div>
        
        {/* 현재 디렉토리 표시 */}
        {currentDirectory && currentDirectory !== selectedDirectory && (
          <p className="text-xs text-gray-500">
            현재: {currentDirectory}
          </p>
        )}
      </div>

      {/* 인덱싱 진행 상태 표시 */}
      {indexingStatus.isIndexing && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              {indexingStatus.isPaused ? '일시정지됨' : '인덱싱 진행 중...'}
            </span>
            <span className="text-xs text-blue-600">
              {indexingStatus.processedFiles || 0}개 파일 처리됨
            </span>
          </div>
          {indexingStatus.currentPath && (
            <div className="text-xs text-blue-700 truncate mb-2">
              {indexingStatus.currentPath}
            </div>
          )}
          {indexingStatus.progress > 0 && (
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${indexingStatus.progress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* 인덱싱 제어 버튼 */}
      <div className="space-y-2">
        {!indexingStatus.isIndexing ? (
          /* 인덱싱 시작 버튼 */
          <button
            onClick={handleStartIndexing}
            disabled={!selectedDirectory}
            className={`w-full px-4 py-2 rounded-md font-medium text-sm transition-all duration-200
                       flex items-center justify-center space-x-2
                       ${selectedDirectory
                         ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
                         : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            <FiDatabase className="w-4 h-4" />
            <span>인덱싱 시작</span>
          </button>
        ) : (
          /* 인덱싱 제어 버튼들 */
          <div className="grid grid-cols-3 gap-2">
            {!indexingStatus.isPaused ? (
              <button
                onClick={handlePauseIndexing}
                className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md
                         transition-colors duration-200 flex items-center justify-center space-x-1"
                title="일시정지"
              >
                <FiPause className="w-4 h-4" />
                <span className="text-xs">일시정지</span>
              </button>
            ) : (
              <button
                onClick={handleResumeIndexing}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md
                         transition-colors duration-200 flex items-center justify-center space-x-1"
                title="재개"
              >
                <FiPlay className="w-4 h-4" />
                <span className="text-xs">재개</span>
              </button>
            )}
            
            <button
              onClick={handleCancelIndexing}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md
                       transition-colors duration-200 flex items-center justify-center space-x-1"
              title="취소"
            >
              <FiX className="w-4 h-4" />
              <span className="text-xs">취소</span>
            </button>
            
            <button
              onClick={checkIndexingStatus}
              className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md
                       transition-colors duration-200 flex items-center justify-center space-x-1"
              title="상태 새로고침"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span className="text-xs">새로고침</span>
            </button>
          </div>
        )}
      </div>

      {/* 에러 메시지 표시 */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 rounded-md p-2 mt-2">
          {typeof error === 'string' ? error : (error && error.message ? error.message : JSON.stringify(error))}
        </div>
      )}


      {/* 도움말 */}
      <div className="bg-blue-50 rounded-md p-3 text-sm">
        <div className="flex items-start">
          <FiAlertCircle className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-blue-700">
            <p className="font-medium">빠른 검색을 위한 인덱싱</p>
            <p className="text-xs mt-1">
              대용량 디렉토리의 파일을 빠르게 검색하려면 먼저 인덱싱을 실행하세요.
              실시간 감시를 활성화하면 파일 변경사항이 자동으로 반영됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexManagement;