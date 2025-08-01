import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiFolder, FiTrash2, FiRefreshCw, FiFile, FiClock, FiSave, FiDownload } from 'react-icons/fi';

const IndexManageModal = ({ isOpen, onClose, onIndexComplete }) => {
  const [indexedPaths, setIndexedPaths] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalSize, setTotalSize] = useState('0 B');
  const [lastRefresh, setLastRefresh] = useState(0); // 새로고침 트리거용

  // 인덱스 정보 로드
  const loadIndexInfo = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/tools/ultra-fast-search/info?user_id=test');
      const data = await response.json();
      
      if (data.success) {
        setIndexedPaths(data.indexedPaths || []);
        setTotalFiles(data.totalFiles || 0);
        setTotalSize(data.totalSize || '0 B');
        console.log('인덱스 정보 로드 완료:', data.indexedPaths?.length, '개 경로');
      } else {
        console.error('인덱스 정보 로드 실패:', data.message);
      }
    } catch (error) {
      console.error('인덱스 정보 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 모달이 열릴 때마다 인덱스 정보 로드
  useEffect(() => {
    if (isOpen) {
      loadIndexInfo();
    }
  }, [isOpen, loadIndexInfo]);

  // 외부에서 인덱싱 완료 시 자동 새로고침
  useEffect(() => {
    if (onIndexComplete && isOpen) {
      console.log('인덱싱 완료 감지, 모달 새로고침 실행');
      setLastRefresh(Date.now());
      loadIndexInfo();
    }
  }, [onIndexComplete, isOpen, loadIndexInfo]);

  // 수동 새로고침 버튼 추가
  const handleManualRefresh = () => {
    console.log('수동 새로고침 실행');
    setLastRefresh(Date.now());
    loadIndexInfo();
  };

  const handleSelectItem = (path) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === indexedPaths.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(indexedPaths.map(item => item.path)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }

    if (confirm(`선택된 ${selectedItems.size}개 항목의 인덱스를 삭제하시겠습니까?`)) {
      try {
        const selectedPaths = indexedPaths
          .filter(item => selectedItems.has(item.path))
          .map(item => item.path);

        const response = await fetch('http://localhost:5000/api/tools/ultra-fast-search/remove?user_id=test', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paths: selectedPaths }),
        });

        const data = await response.json();
        
        if (data.success) {
          alert(data.message);
          setSelectedItems(new Set());
          loadIndexInfo(); // 목록 새로고침
        } else {
          alert('삭제 실패: ' + data.message);
        }
      } catch (error) {
        console.error('삭제 오류:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleRefreshIndex = async (path) => {
    const item = indexedPaths.find(p => p.path === path);
    if (!item) return;

    if (confirm(`"${item.path}" 경로의 인덱스를 다시 생성하시겠습니까?`)) {
      try {
        const response = await fetch('http://localhost:5000/api/tools/ultra-fast-search/index?user_id=test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rootDir: item.path }),
        });

        const data = await response.json();
        
        if (data.success) {
          alert('인덱스 재생성이 완료되었습니다.');
          loadIndexInfo(); // 목록 새로고침
        } else {
          alert('재인덱싱 실패: ' + data.message);
        }
      } catch (error) {
        console.error('재인덱싱 오류:', error);
        alert('재인덱싱 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSaveIndex = async () => {
    if (indexedPaths.length === 0) {
      alert('저장할 인덱스가 없습니다.');
      return;
    }

    if (confirm('현재 인덱스를 파일로 저장하시겠습니까?')) {
      try {
        const response = await fetch('http://localhost:5000/api/tools/ultra-fast-search/save?user_id=test', {
          method: 'POST',
        });

        const data = await response.json();
        
        if (data.success) {
          alert('인덱스가 저장되었습니다.');
        } else {
          alert('저장 실패: ' + data.message);
        }
      } catch (error) {
        console.error('저장 오류:', error);
        alert('저장 중 오류가 발생했습니다.');
      }
    }
  };

  const handleLoadIndex = async () => {
    if (confirm('인덱스 파일을 불러오시겠습니까? 현재 인덱스는 대체됩니다.')) {
      // Electron 폴더 선택 다이얼로그 사용
      if (window.electronAPI) {
        try {
          const result = await window.electronAPI.selectFolder();
          if (result.canceled) return;
          
          const response = await fetch('http://localhost:5000/api/tools/ultra-fast-search/load?user_id=test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rootDir: result.filePath }),
          });

          const data = await response.json();
          
          if (data.success) {
            alert('인덱스 파일을 불러왔습니다.');
            loadIndexInfo(); // 목록 새로고침
          } else {
            alert('불러오기 실패: ' + data.message);
          }
        } catch (error) {
          console.error('불러오기 오류:', error);
          alert('불러오기 중 오류가 발생했습니다.');
        }
      } else {
        alert('Electron 환경에서만 사용 가능합니다.');
      }
    }
  };

  const formatFileCount = (count) => {
    return count.toLocaleString() + '개';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              인덱스 관리
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              총 {indexedPaths.length}개 경로가 인덱싱되어 있습니다
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="새로고침"
            >
              <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 액션 바 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedItems.size === indexedPaths.length && indexedPaths.length > 0}
                onChange={handleSelectAll}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                전체 선택
              </span>
            </label>
            {selectedItems.size > 0 && (
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {selectedItems.size}개 선택됨
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveIndex}
              disabled={indexedPaths.length === 0 || loading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              저장
            </button>
            <button
              onClick={handleLoadIndex}
              disabled={loading}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              불러오기
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedItems.size === 0 || loading}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <FiTrash2 className="w-4 h-4" />
              선택 삭제
            </button>
          </div>
        </div>

        {/* 인덱스 목록 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>인덱스 정보를 불러오는 중...</p>
            </div>
          ) : indexedPaths.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FiFolder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>인덱싱된 경로가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {indexedPaths.map((item) => (
                <div
                  key={item.path}
                  className={`flex items-center p-4 rounded-lg border transition-all ${
                    selectedItems.has(item.path)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  {/* 체크박스 */}
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.path)}
                    onChange={() => handleSelectItem(item.path)}
                    className="mr-4 flex-shrink-0"
                  />

                  {/* 폴더 아이콘 */}
                  <FiFolder className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.path}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiFile className="w-4 h-4" />
                          <span>{formatFileCount(item.fileCount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{item.size}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          <span>{formatDate(item.lastUpdated)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 상태 표시 */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {item.status === 'active' ? '활성' : '비활성'}
                      </span>

                      {/* 개별 액션 버튼 */}
                      <button
                        onClick={() => handleRefreshIndex(item.path)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="재인덱싱"
                      >
                        <FiRefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              총 {totalFiles.toLocaleString()}개 파일이 인덱싱되어 있습니다
            </span>
            <span>
              전체 크기: {totalSize}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexManageModal;