// 이벤트 상세 정보 컴포넌트
import React, { useState } from 'react';
import { formatDate, formatTime, formatDateRange } from '../../utils/dateHelpers';
import { getEventBackgroundColor, getEventTextColor, getEventDuration } from '../../utils/calendarHelpers';

const EventDetail = ({
  event,
  calendar,
  onEdit,
  onDelete,
  onClose,
  onDuplicate,
  onToggleStatus,
  onManageAttendees,
  onManageFiles,
  onManageSharing,
  isOpen
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !event) return null;

  const bgColor = getEventBackgroundColor(event, 0.1);
  const textColor = getEventTextColor(bgColor);
  const borderColor = calendar?.color || '#3B82F6';
  const duration = getEventDuration(event);

  // 우선순위 표시
  const getPriorityInfo = (priority) => {
    const priorityMap = {
      critical: { label: '매우 중요', color: 'text-red-600', bg: 'bg-red-100' },
      urgent: { label: '긴급', color: 'text-orange-600', bg: 'bg-orange-100' },
      high: { label: '높음', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      normal: { label: '보통', color: 'text-blue-600', bg: 'bg-blue-100' },
      low: { label: '낮음', color: 'text-gray-600', bg: 'bg-gray-100' }
    };
    return priorityMap[priority] || priorityMap.normal;
  };

  // 상태 표시
  const getStatusInfo = (status) => {
    const statusMap = {
      confirmed: { label: '확정', color: 'text-green-600', bg: 'bg-green-100', icon: '✅' },
      tentative: { label: '임시', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '❓' },
      cancelled: { label: '취소', color: 'text-red-600', bg: 'bg-red-100', icon: '❌' },
      pending: { label: '대기', color: 'text-gray-600', bg: 'bg-gray-100', icon: '⏳' }
    };
    return statusMap[status] || statusMap.confirmed;
  };

  // 카테고리 표시
  const getCategoryInfo = (category) => {
    const categoryMap = {
      personal: { label: '개인', icon: '👤' },
      business: { label: '비즈니스', icon: '💼' },
      health: { label: '건강', icon: '🏥' },
      team: { label: '팀', icon: '👥' },
      other: { label: '기타', icon: '📋' }
    };
    return categoryMap[category] || categoryMap.other;
  };

  const priorityInfo = getPriorityInfo(event.priority);
  const statusInfo = getStatusInfo(event.status);
  const categoryInfo = getCategoryInfo(event.category);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(event.id);
      setShowDeleteConfirm(false);
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleStatusToggle = () => {
    const newStatus = event.status === 'confirmed' ? 'tentative' : 'confirmed';
    onToggleStatus(event.id, newStatus);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div 
          className="px-6 py-4 border-b border-gray-200"
          style={{ backgroundColor: bgColor, borderColor: borderColor }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: borderColor }}
                  />
                  <span>{calendar?.name}</span>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {/* 날짜 및 시간 정보 */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">
                  {event.allDay ? (
                    <span>
                      {formatDate(event.start, 'YYYY년 MM월 DD일')}
                      {new Date(event.start).toDateString() !== new Date(event.end).toDateString() && (
                        <span> - {formatDate(event.end, 'YYYY년 MM월 DD일')}</span>
                      )}
                      <span className="ml-2 text-sm text-gray-500">전체 일정</span>
                    </span>
                  ) : (
                    <span>
                      {formatDate(event.start, 'YYYY년 MM월 DD일')} {formatTime(event.start)}
                      {' - '}
                      {new Date(event.start).toDateString() !== new Date(event.end).toDateString() && (
                        <span>{formatDate(event.end, 'MM월 DD일')} </span>
                      )}
                      {formatTime(event.end)}
                    </span>
                  )}
                </div>
                {!event.allDay && (
                  <div className="text-sm text-gray-500">
                    소요 시간: {duration}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 기타 정보 */}
          <div className="space-y-4">
            {/* 우선순위 & 카테고리 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">우선순위:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.bg} ${priorityInfo.color}`}>
                  {priorityInfo.label}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">카테고리:</span>
                <span className="text-sm text-gray-700">
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
              </div>
            </div>

            {/* 위치 */}
            {event.location && (
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">{event.location.name}</div>
                  {event.location.address && (
                    <div className="text-sm text-gray-500">{event.location.address}</div>
                  )}
                </div>
              </div>
            )}

            {/* 설명 */}
            {event.description && (
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <div className="flex-1">
                  <div className="text-gray-900 whitespace-pre-wrap">{event.description}</div>
                </div>
              </div>
            )}

            {/* 참석자 */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-2">
                    참석자 ({event.attendees.length}명)
                  </div>
                  <div className="space-y-1">
                    {event.attendees.map((attendee, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-gray-900">{attendee.name}</span>
                        {attendee.email && (
                          <span className="text-gray-500 ml-2">({attendee.email})</span>
                        )}
                        <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
                          attendee.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          attendee.status === 'declined' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {attendee.status === 'accepted' ? '수락' :
                           attendee.status === 'declined' ? '거절' : '대기'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 반복 정보 */}
            {event.recurrence && (
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">
                  반복 일정 - {event.recurrence.frequency}
                </span>
              </div>
            )}

            {/* 태그 */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 생성/수정 정보 */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                {event.createdAt && (
                  <div>생성일: {formatDate(event.createdAt, 'YYYY년 MM월 DD일 HH:mm')}</div>
                )}
                {event.updatedAt && (
                  <div>수정일: {formatDate(event.updatedAt, 'YYYY년 MM월 DD일 HH:mm')}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 - 액션 버튼 */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStatusToggle}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                event.status === 'confirmed' 
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {event.status === 'confirmed' ? '임시로 변경' : '확정으로 변경'}
            </button>
            <button
              onClick={() => onDuplicate(event)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              복제
            </button>
            {/* 참석자 관리 버튼 */}
            {onManageAttendees && (
              <button
                onClick={() => onManageAttendees(event)}
                className="px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-300 rounded-md hover:bg-purple-200 transition-colors"
              >
                참석자 관리
              </button>
            )}
            {/* 파일 첨부 관리 버튼 */}
            {onManageFiles && (
              <button
                onClick={() => onManageFiles(event)}
                className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors"
              >
                파일 관리
              </button>
            )}
            {/* 공유 관리 버튼 */}
            {onManageSharing && (
              <button
                onClick={() => onManageSharing({ event, calendar })}
                className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors"
              >
                공유 관리
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                showDeleteConfirm 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {showDeleteConfirm ? '취소' : '삭제'}
            </button>
            {showDeleteConfirm && (
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                확인
              </button>
            )}
            <button
              onClick={() => onEdit(event)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;