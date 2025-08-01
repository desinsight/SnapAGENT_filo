import React, { useState } from 'react';
import { FiHardDrive, FiActivity, FiClock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import IndexManageModal from './IndexManageModal';

/**
 * StatusIndicator - 인덱스 및 시스템 상태 표시 컴포넌트
 * 
 * 기능:
 * - 인덱스 상태 표시 (로드됨/로드 안됨)
 * - 파일 감시 상태 표시
 * - 총 파일 수 표시
 * - 마지막 업데이트 시간 표시
 * 
 * @param {Object} props
 * @param {string} props.indexStatus - 인덱스 상태 ('loaded', 'not-loaded', 'loading')
 * @param {boolean} props.isWatching - 파일 감시 활성화 여부
 * @param {number} props.totalFiles - 인덱싱된 총 파일 수
 * @param {Date} props.lastUpdateTime - 마지막 업데이트 시간
 * @param {boolean} props.onIndexComplete - 인덱싱 완료 플래그
 */
const StatusIndicator = ({ indexStatus, isWatching, totalFiles, lastUpdateTime, onIndexComplete }) => {
  const [showModal, setShowModal] = useState(false);

  // 상태에 따른 색상 결정
  const getStatusColor = () => {
    if (indexStatus === 'loaded' && isWatching) return 'text-green-600';
    if (indexStatus === 'loaded') return 'text-blue-600';
    if (indexStatus === 'loading') return 'text-yellow-600';
    return 'text-gray-400';
  };

  // 상태 아이콘 결정
  const getStatusIcon = () => {
    if (indexStatus === 'loading') {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />;
    }
    if (indexStatus === 'loaded') {
      return <FiCheckCircle className="w-4 h-4" />;
    }
    return <FiAlertCircle className="w-4 h-4" />;
  };

  // 시간 포맷팅
  const formatTime = (date) => {
    if (!date) return '없음';
    
    const now = new Date();
    const diff = now - new Date(date);
    
    // 1분 미만
    if (diff < 60000) {
      return '방금 전';
    }
    
    // 1시간 미만
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}분 전`;
    }
    
    // 24시간 미만
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}시간 전`;
    }
    
    // 그 이상
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center space-x-4 text-sm">
      {/* 인덱스 상태 */}
      <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="font-medium">
          {indexStatus === 'loaded' ? '인덱스 로드됨' : 
           indexStatus === 'loading' ? '인덱싱 중...' : 
           '인덱스 없음'}
        </span>
        {/* 인덱스 관리 버튼: 항상 표시 */}
        <button
          onClick={() => setShowModal(true)}
          className="ml-2 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          title="인덱스 관리"
        >
          관리
        </button>
      </div>

      {/* 구분선 */}
      {indexStatus === 'loaded' && (
        <>
          <div className="w-px h-5 bg-gray-300" />
          
          {/* 파일 수 */}
          <div className="flex items-center space-x-2 text-gray-600">
            <FiHardDrive className="w-4 h-4" />
            <span>{totalFiles?.toLocaleString() || 0}개 파일</span>
          </div>

          {/* 구분선 */}
          <div className="w-px h-5 bg-gray-300" />

          {/* 감시 상태 */}
          <div className={`flex items-center space-x-2 ${isWatching ? 'text-green-600' : 'text-gray-400'}`}>
            <FiActivity className="w-4 h-4" />
            <span>{isWatching ? '실시간 감시 중' : '감시 중지됨'}</span>
          </div>

          {/* 구분선 */}
          {lastUpdateTime && (
            <>
              <div className="w-px h-5 bg-gray-300" />
              
              {/* 마지막 업데이트 */}
              <div className="flex items-center space-x-2 text-gray-500">
                <FiClock className="w-4 h-4" />
                <span>업데이트: {formatTime(lastUpdateTime)}</span>
              </div>
            </>
          )}
        </>
      )}

      {/* 인덱스 관리 모달 */}
      <IndexManageModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        onIndexComplete={onIndexComplete}
      />
    </div>
  );
};

export default StatusIndicator;