import React from 'react';

// 아이콘 컴포넌트들
const FolderIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LoadingIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const StatusBar = ({
  statusItems = [],
  notifications = [],
  loading = false
}) => {
  // 알림 아이콘 색상
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="h-6 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 text-xs text-gray-600 dark:text-gray-400">
      {/* 왼쪽 영역 - 동적 상태 정보 */}
      <div className="flex items-center space-x-4">
        {/* 로딩 상태 */}
        {loading && (
          <div className="flex items-center space-x-1">
            <LoadingIcon />
            <span>로딩 중...</span>
          </div>
        )}

        {/* 동적 상태 아이템들 */}
        {statusItems.map((item, index) => (
          <div key={index} className={`flex items-center space-x-1 ${item.color || 'text-gray-600 dark:text-gray-400'}`}>
            {item.icon}
            <span>{item.label}: {item.value}</span>
          </div>
        ))}
      </div>

      {/* 가운데 영역 - 빈 공간 */}
      <div className="flex-1"></div>

      {/* 오른쪽 영역 - 알림 및 상태 */}
      <div className="flex items-center space-x-4">
        {/* 최근 알림 (최대 3개) */}
        {notifications && notifications.slice(-3).map((notification, index) => (
          <div
            key={notification.id || `notification-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
          >
            <span className={`w-2 h-2 rounded-full ${getNotificationColor(notification.type)}`} />
            <span className="max-w-32 truncate">{notification.message}</span>
            <button
              onClick={() => {
                // 알림 제거 로직 (부모 컴포넌트에서 처리)
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <CloseIcon />
            </button>
          </div>
        ))}

        {/* 시스템 정보 */}
        <div className="text-gray-500 dark:text-gray-500">
          SnapCodex Platform v1.0.0
        </div>
      </div>
    </div>
  );
};

export default StatusBar;