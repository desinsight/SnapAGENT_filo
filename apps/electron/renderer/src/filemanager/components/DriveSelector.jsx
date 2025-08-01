import React, { useState, useEffect } from 'react';
import { FiHardDrive, FiServer, FiExternalLink, FiChevronDown, FiChevronUp } from 'react-icons/fi';

/**
 * DriveSelector - 드라이브 선택 컴포넌트
 * 
 * 기능:
 * - 시스템 드라이브 목록 표시
 * - 드라이브 타입별 아이콘 구분 (로컬, 네트워크, 이동식)
 * - 드라이브 선택 시 콜백 함수 호출
 * - 사용 불가능한 드라이브 표시
 * 
 * @param {Object} props
 * @param {string} props.selectedDrive - 현재 선택된 드라이브
 * @param {Function} props.onDriveSelect - 드라이브 선택 시 호출될 함수
 * @param {string} props.className - 추가 CSS 클래스
 */
const DriveSelector = ({ 
  selectedDrive, 
  onDriveSelect, 
  className = '' 
}) => {
  const [drives, setDrives] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 컴포넌트 마운트 시 드라이브 목록 가져오기
  useEffect(() => {
    fetchDrives();
  }, []);

  /**
   * 시스템 드라이브 목록 가져오기
   */
  const fetchDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Electron API 사용 가능성 확인
      if (!window.electronAPI || !window.electronAPI.listDrives) {
        console.warn('Electron API 사용 불가, 기본 드라이브 사용');
        setDrives(getDefaultDrives());
        return;
      }
      
      // 실제 Electron API 호출
      const driveList = await window.electronAPI.listDrives();
      console.log('드라이브 목록 조회 결과:', driveList);
      
      if (!driveList || driveList.length === 0) {
        console.warn('드라이브 목록이 비어있음, 기본 드라이브 사용');
        setDrives(getDefaultDrives());
        return;
      }
      
      setDrives(
        driveList.map(d => ({
          letter: d.name.replace(/\\$/, ''), // 'C:' 형태로 변환
          label: d.name.replace(/\\$/, '') + ' 드라이브',
          type: 'local', // 필요시 타입 구분 추가
          available: true,
          size: '알 수 없음'
        }))
      );
      
      console.log('드라이브 목록 설정 완료');
    } catch (err) {
      console.error('드라이브 목록 가져오기 실패:', err);
      setError('드라이브 목록을 가져올 수 없습니다: ' + err.message);
      setDrives(getDefaultDrives());
    } finally {
      setLoading(false);
    }
  };

  /**
   * 드라이브 목록 가져오기 (임시 구현)
   * 실제로는 Electron Main Process에서 OS API를 통해 가져옴
   */
  // const getDriveList = async () => {
  //   return new Promise((resolve) => {
  //     setTimeout(() => {
  //       resolve([
  //         { letter: 'C:', label: 'Windows (C:)', type: 'local', available: true, size: '250GB' },
  //         { letter: 'D:', label: 'Data (D:)', type: 'local', available: true, size: '500GB' },
  //         { letter: 'E:', label: 'USB Drive (E:)', type: 'removable', available: true, size: '64GB' },
  //         { letter: 'F:', label: 'Network Drive (F:)', type: 'network', available: false, size: '1TB' },
  //         { letter: 'G:', label: 'Backup Drive (G:)', type: 'removable', available: true, size: '2TB' }
  //       ]);
  //     }, 500);
  //   });
  // };

  /**
   * 기본 드라이브 목록 (에러 발생 시 사용)
   */
  const getDefaultDrives = () => {
    // 플랫폼별 기본 드라이브
    if (window.electronAPI && window.electronAPI.platform === 'win32') {
      return [
        { letter: 'C:', label: 'C: 드라이브', type: 'local', available: true, size: '알 수 없음' },
        { letter: 'D:', label: 'D: 드라이브', type: 'local', available: true, size: '알 수 없음' }
      ];
    } else {
      return [
        { letter: '/', label: '루트 드라이브', type: 'local', available: true, size: '알 수 없음' }
      ];
    }
  };

  /**
   * 드라이브 타입에 따른 아이콘 반환
   */
  const getDriveIcon = (type, available) => {
    const baseClass = `w-4 h-4 ${available ? '' : 'text-gray-400'}`;
    
    switch (type) {
      case 'network':
        return <FiServer className={`${baseClass} ${available ? 'text-blue-500' : ''}`} />;
      case 'removable':
        return <FiExternalLink className={`${baseClass} ${available ? 'text-orange-500' : ''}`} />;
      case 'local':
      default:
        return <FiHardDrive className={`${baseClass} ${available ? 'text-green-500' : ''}`} />;
    }
  };

  /**
   * 드라이브 선택 처리
   */
  const handleDriveSelect = (drive) => {
    onDriveSelect(drive.letter);
    setIsOpen(false);
  };

  /**
   * 전체 드라이브 선택 처리
   */
  const handleAllDrives = () => {
    onDriveSelect('');
    setIsOpen(false);
  };

  /**
   * 선택된 드라이브 정보 가져오기
   */
  const getSelectedDriveInfo = () => {
    if (!selectedDrive) return null;
    return drives.find(drive => drive.letter === selectedDrive);
  };

  const selectedDriveInfo = getSelectedDriveInfo();

  return (
    <div className={`drive-selector ${className}`}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          드라이브 선택
        </label>
        
        {/* 드라이브 선택 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={loading}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm
                     bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            <div className="flex items-center min-w-0">
              {loading ? (
                <span className="text-gray-500">드라이브 목록 로딩 중...</span>
              ) : selectedDriveInfo ? (
                <>
                  {getDriveIcon(selectedDriveInfo.type, selectedDriveInfo.available)}
                  <span className="ml-2 truncate">
                    {selectedDriveInfo.letter} {selectedDriveInfo.label}
                  </span>
                </>
              ) : (
                <span className="text-gray-500">모든 드라이브</span>
              )}
            </div>
            {!loading && (
              isOpen ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* 드롭다운 메뉴 */}
          {isOpen && !loading && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="py-1">
                {/* 모든 드라이브 옵션 */}
                <button
                  onClick={handleAllDrives}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center hover:bg-gray-50 transition-colors duration-200
                           ${!selectedDrive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  <FiHardDrive className="w-4 h-4 text-gray-400 mr-2" />
                  <span>모든 드라이브</span>
                </button>
                
                {/* 구분선 */}
                <div className="border-t border-gray-100 my-1"></div>
                
                {/* 개별 드라이브 옵션 */}
                {drives.map((drive) => (
                  <button
                    key={drive.letter}
                    onClick={() => handleDriveSelect(drive)}
                    disabled={!drive.available}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors duration-200
                             ${drive.available 
                               ? 'text-gray-700 hover:bg-gray-50' 
                               : 'text-gray-400 cursor-not-allowed bg-gray-25'
                             }
                             ${selectedDrive === drive.letter ? 'bg-blue-50 text-blue-700' : ''}`}
                  >
                    <div className="flex items-center min-w-0">
                      {getDriveIcon(drive.type, drive.available)}
                      <span className="ml-2 truncate">
                        {drive.letter} {drive.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {drive.size}
                      </span>
                      {!drive.available && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                          사용 불가
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 rounded-md p-2">
            {typeof error === 'string' ? error : (error && error.message ? error.message : JSON.stringify(error))}
          </div>
        )}

        {/* 선택된 드라이브 정보 */}
        {selectedDriveInfo && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-2">
            <div className="flex items-center justify-between">
              <span>선택됨: {selectedDriveInfo.label}</span>
              <span className="text-gray-400">{selectedDriveInfo.size}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriveSelector;