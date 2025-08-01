import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  BellIcon,
  BellSlashIcon,
  CheckIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  UserPlusIcon,
  DocumentTextIcon,
  CalendarIcon,
  CogIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

const NotificationPanel = ({ 
  isOpen, 
  onClose, 
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  unreadCount = 0
}) => {
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    inApp: true,
    taskAssigned: true,
    taskCompleted: true,
    commentAdded: true,
    projectUpdated: true,
    teamInvited: true,
    dueDateReminder: true,
    overdueTask: true
  });
  const [showSettings, setShowSettings] = useState(false);

  // 알림 타입별 아이콘
  const getNotificationIcon = (type) => {
    const icons = {
      task_assigned: DocumentTextIcon,
      task_completed: CheckCircleIcon,
      task_overdue: ExclamationTriangleIcon,
      comment_added: DocumentTextIcon,
      project_updated: InformationCircleIcon,
      team_invited: UserPlusIcon,
      due_date_reminder: CalendarIcon,
      mention: DocumentTextIcon
    };
    const Icon = icons[type] || InformationCircleIcon;
    return <Icon className="w-5 h-5" />;
  };

  // 알림 타입별 색상
  const getNotificationColor = (type) => {
    const colors = {
      task_assigned: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      task_completed: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      task_overdue: 'text-red-600 bg-red-100 dark:bg-red-900/30',
      comment_added: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
      project_updated: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
      team_invited: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
      due_date_reminder: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
      mention: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30'
    };
    return colors[type] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
  };

  // 알림 필터링
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true;
  });

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`;
    return notificationTime.toLocaleDateString();
  };

  // 알림 설정 토글
  const toggleNotificationSetting = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">알림</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림` : '모든 알림을 확인했습니다'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="알림 설정"
            >
              <CogIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 알림 설정 패널 */}
        {showSettings && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">알림 설정</h3>
            
            {/* 알림 채널 설정 */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">알림 수신 방법</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationSettings.inApp}
                    onChange={() => toggleNotificationSetting('inApp')}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <BellIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">앱 내 알림</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationSettings.email}
                    onChange={() => toggleNotificationSetting('email')}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">이메일 알림</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationSettings.push}
                    onChange={() => toggleNotificationSetting('push')}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <DevicePhoneMobileIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">푸시 알림</span>
                </label>
              </div>
            </div>

            {/* 알림 유형 설정 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">알림받을 이벤트</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'taskAssigned', label: '태스크 배정' },
                  { key: 'taskCompleted', label: '태스크 완료' },
                  { key: 'commentAdded', label: '댓글 추가' },
                  { key: 'projectUpdated', label: '프로젝트 업데이트' },
                  { key: 'teamInvited', label: '팀 초대' },
                  { key: 'dueDateReminder', label: '마감일 알림' },
                  { key: 'overdueTask', label: '연체 알림' }
                ].map(setting => (
                  <label key={setting.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={notificationSettings[setting.key]}
                      onChange={() => toggleNotificationSetting(setting.key)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{setting.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 필터 및 액션 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-1">
            {['all', 'unread', 'read'].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === filterType
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {filterType === 'all' ? '전체' : filterType === 'unread' ? '읽지 않음' : '읽음'}
                {filterType === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
              >
                모두 읽음 처리
              </button>
            )}
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-white`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(notification.created_at)}
                        </span>
                        <div className="flex items-center space-x-1">
                          {!notification.is_read && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                              title="읽음 처리"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="삭제"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BellSlashIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'unread' ? '읽지 않은 알림이 없습니다' : 
                 filter === 'read' ? '읽은 알림이 없습니다' : 
                 '알림이 없습니다'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;