// 참석자 관리 패널
import React, { useState, useEffect, useMemo } from 'react';
import { formatDate, formatTime } from '../../utils/dateHelpers';

const AttendeeManagementPanel = ({
  isOpen,
  onClose,
  event,
  attendees = [],
  availableUsers = [],
  onInviteAttendees,
  onUpdateAttendee,
  onRemoveAttendee,
  onSendReminder,
  onCheckAvailability,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState('attendees'); // 'attendees', 'invite', 'availability', 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [invitationSettings, setInvitationSettings] = useState({
    subject: '',
    message: '',
    allowGuests: true,
    requireRSVP: true,
    sendCalendarInvite: true,
    reminderBefore: 24 // hours
  });
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [availabilityData, setAvailabilityData] = useState({});
  const [filterStatus, setFilterStatus] = useState('all'); // all, accepted, declined, pending

  // 참석자 통계 계산
  const attendeeStats = useMemo(() => {
    const stats = {
      total: attendees.length,
      accepted: 0,
      declined: 0,
      tentative: 0,
      pending: 0,
      organizers: 0,
      optional: 0
    };

    attendees.forEach(attendee => {
      if (attendee.rsvp?.status) {
        stats[attendee.rsvp.status]++;
      } else {
        stats.pending++;
      }
      
      if (attendee.role === 'organizer') stats.organizers++;
      if (attendee.role === 'optional') stats.optional++;
    });

    return stats;
  }, [attendees]);

  // 필터링된 참석자 목록
  const filteredAttendees = useMemo(() => {
    return attendees.filter(attendee => {
      const statusMatch = filterStatus === 'all' || 
        (filterStatus === 'pending' && !attendee.rsvp?.status) ||
        attendee.rsvp?.status === filterStatus;
      
      const searchMatch = !searchQuery || 
        attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      return statusMatch && searchMatch;
    });
  }, [attendees, filterStatus, searchQuery]);

  // 사용자 검색 필터링
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return availableUsers.slice(0, 20); // 처음 20명만 표시
    
    return availableUsers.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 50);
  }, [availableUsers, searchQuery]);

  // 참석자 역할 변경
  const handleRoleChange = (attendeeId, newRole) => {
    onUpdateAttendee?.(attendeeId, { role: newRole });
  };

  // RSVP 상태 업데이트
  const handleRSVPUpdate = (attendeeId, status, message = '') => {
    const rsvpData = {
      status,
      respondedAt: new Date().toISOString(),
      responseMessage: message
    };
    
    onUpdateAttendee?.(attendeeId, { rsvp: rsvpData });
  };

  // 일괄 초대 전송
  const handleBulkInvite = () => {
    const selectedUserList = Array.from(selectedUsers).map(userId =>
      availableUsers.find(user => user.id === userId)
    ).filter(Boolean);

    onInviteAttendees?.(selectedUserList, invitationSettings);
    setSelectedUsers(new Set());
    setActiveTab('attendees');
  };

  // 사용자 선택 토글
  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  // 가용성 확인
  const checkAvailability = async (userIds, timeSlot) => {
    try {
      const result = await onCheckAvailability?.(userIds, timeSlot);
      setAvailabilityData(result);
    } catch (error) {
      console.error('가용성 확인 실패:', error);
    }
  };

  // 참석자 상태별 색상
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-gray-700 bg-gray-100';
      case 'declined': return 'text-gray-700 bg-gray-100';
      case 'tentative': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 역할별 표시
  const getRoleLabel = (role) => {
    switch (role) {
      case 'organizer': return '주최자';
      case 'attendee': return '참석자';
      case 'optional': return '선택참석';
      case 'resource': return '리소스';
      default: return '참석자';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-6xl mx-4 h-[85vh] flex flex-col border border-gray-300">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-lg font-medium text-gray-900">참석자 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              {event?.title || '이벤트'} - {attendeeStats.total}명 초대됨
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{attendeeStats.total}</div>
              <div className="text-xs text-gray-600">총 초대</div>
            </div>
            <div className="bg-white border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{attendeeStats.accepted}</div>
              <div className="text-xs text-gray-600">참석</div>
            </div>
            <div className="bg-white border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{attendeeStats.declined}</div>
              <div className="text-xs text-gray-600">불참</div>
            </div>
            <div className="bg-white border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{attendeeStats.tentative}</div>
              <div className="text-xs text-gray-600">미정</div>
            </div>
            <div className="bg-white border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{attendeeStats.pending}</div>
              <div className="text-xs text-gray-600">응답 대기</div>
            </div>
            <div className="bg-white border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{attendeeStats.organizers}</div>
              <div className="text-xs text-gray-600">주최자</div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('attendees')}
            className={`px-6 py-3 text-sm border-b-2 transition-colors ${
              activeTab === 'attendees'
                ? 'border-gray-800 text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            참석자 목록 ({attendeeStats.total})
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`px-6 py-3 text-sm border-b-2 transition-colors ${
              activeTab === 'invite'
                ? 'border-gray-800 text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            새 참석자 초대
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-6 py-3 text-sm border-b-2 transition-colors ${
              activeTab === 'availability'
                ? 'border-gray-800 text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            가용성 확인
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-sm border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-gray-800 text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            초대 설정
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'attendees' && (
            <div className="h-full flex flex-col">
              {/* 검색 및 필터 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="참석자 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">모든 상태</option>
                      <option value="accepted">참석</option>
                      <option value="declined">불참</option>
                      <option value="tentative">미정</option>
                      <option value="pending">응답 대기</option>
                    </select>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      일괄 작업
                    </button>
                    <button
                      onClick={() => onSendReminder?.(filteredAttendees.map(a => a.id))}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      리마인더 전송
                    </button>
                  </div>
                </div>
              </div>

              {/* 참석자 목록 */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {filteredAttendees.map((attendee) => (
                    <div
                      key={attendee.id}
                      className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* 프로필 이미지 */}
                          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            {attendee.photo ? (
                              <img src={attendee.photo} alt={attendee.name} className="w-10 h-10 rounded-full" />
                            ) : (
                              <span className="text-gray-600 dark:text-gray-400 font-medium">
                                {attendee.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {attendee.name}
                              </h4>
                              <span className="text-lg">{getRoleIcon(attendee.role)}</span>
                              {attendee.role === 'organizer' && (
                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                  주최자
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {attendee.email}
                            </div>
                            {attendee.rsvp?.responseMessage && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                💬 {attendee.rsvp.responseMessage}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {/* RSVP 상태 */}
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            getStatusColor(attendee.rsvp?.status)
                          }`}>
                            {attendee.rsvp?.status === 'accepted' ? '참석' :
                             attendee.rsvp?.status === 'declined' ? '불참' :
                             attendee.rsvp?.status === 'tentative' ? '미정' : '응답 대기'}
                          </span>

                          {/* 역할 변경 */}
                          <select
                            value={attendee.role}
                            onChange={(e) => handleRoleChange(attendee.id, e.target.value)}
                            disabled={attendee.id === currentUser?.id}
                            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded
                                       bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                       focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="attendee">참석자</option>
                            <option value="organizer">주최자</option>
                            <option value="optional">선택 참석</option>
                            <option value="resource">리소스</option>
                          </select>

                          {/* 액션 버튼 */}
                          <div className="flex space-x-1">
                            {attendee.rsvp?.status !== 'accepted' && (
                              <button
                                onClick={() => handleRSVPUpdate(attendee.id, 'accepted')}
                                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                                title="참석으로 변경"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            {attendee.rsvp?.status !== 'declined' && (
                              <button
                                onClick={() => handleRSVPUpdate(attendee.id, 'declined')}
                                className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                                title="불참으로 변경"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => onSendReminder?.([attendee.id])}
                              className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                              title="리마인더 전송"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                            </button>
                            {attendee.role !== 'organizer' && (
                              <button
                                onClick={() => onRemoveAttendee?.(attendee.id)}
                                className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                                title="참석자 제거"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredAttendees.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <p className="text-lg font-medium">참석자가 없습니다</p>
                      <p className="text-sm text-gray-500">새 참석자를 초대해보세요</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invite' && (
            <div className="h-full flex flex-col">
              {/* 사용자 검색 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="이름 또는 이메일로 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {selectedUsers.size > 0 && (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedUsers.size}명 선택됨
                      </span>
                      <button
                        onClick={handleBulkInvite}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        선택한 사용자 초대
                      </button>
                    </div>
                  )}
                </div>
                
                {filteredUsers.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedUsers.size === filteredUsers.length ? '전체 해제' : '전체 선택'}
                    </button>
                  </div>
                )}
              </div>

              {/* 사용자 목록 */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredUsers.map((user) => {
                    const isAlreadyInvited = attendees.some(a => a.email === user.email);
                    const isSelected = selectedUsers.has(user.id);

                    return (
                      <div
                        key={user.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : isAlreadyInvited
                              ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 opacity-50'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        onClick={() => !isAlreadyInvited && toggleUserSelection(user.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isAlreadyInvited}
                            onChange={() => toggleUserSelection(user.id)}
                            className="text-blue-600"
                          />
                          
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            {user.photo ? (
                              <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full" />
                            ) : (
                              <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </div>
                            {user.department && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {user.department}
                              </div>
                            )}
                          </div>

                          {isAlreadyInvited && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              이미 초대됨
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredUsers.length === 0 && searchQuery && (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-lg font-medium">검색 결과가 없습니다</p>
                    <p className="text-sm text-gray-500">다른 키워드로 검색해보세요</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">참석자 가용성 확인</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  이벤트 시간에 참석자들의 일정 충돌을 확인합니다.
                </p>
                
                <button
                  onClick={() => checkAvailability(
                    attendees.map(a => a.id),
                    { start: event?.start, end: event?.end }
                  )}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  가용성 확인하기
                </button>

                {Object.keys(availabilityData).length > 0 && (
                  <div className="mt-6 space-y-4">
                    {Object.entries(availabilityData).map(([userId, availability]) => (
                      <div key={userId} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {attendees.find(a => a.id === userId)?.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {availability.conflictCount > 0 
                                ? `${availability.conflictCount}개 일정 충돌`
                                : '일정 충돌 없음'
                              }
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            availability.conflictCount === 0 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {availability.conflictCount === 0 ? '가능' : '충돌'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">초대 설정</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      초대 제목
                    </label>
                    <input
                      type="text"
                      value={invitationSettings.subject}
                      onChange={(e) => setInvitationSettings(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder={`초대: ${event?.title || '이벤트'}`}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      초대 메시지
                    </label>
                    <textarea
                      value={invitationSettings.message}
                      onChange={(e) => setInvitationSettings(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      placeholder="참석자들에게 보낼 메시지를 입력하세요..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="allowGuests"
                        checked={invitationSettings.allowGuests}
                        onChange={(e) => setInvitationSettings(prev => ({ ...prev, allowGuests: e.target.checked }))}
                        className="text-blue-600"
                      />
                      <label htmlFor="allowGuests" className="text-sm text-gray-700 dark:text-gray-300">
                        참석자가 추가 게스트를 초대할 수 있음
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="requireRSVP"
                        checked={invitationSettings.requireRSVP}
                        onChange={(e) => setInvitationSettings(prev => ({ ...prev, requireRSVP: e.target.checked }))}
                        className="text-blue-600"
                      />
                      <label htmlFor="requireRSVP" className="text-sm text-gray-700 dark:text-gray-300">
                        RSVP 응답 필수
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="sendCalendarInvite"
                        checked={invitationSettings.sendCalendarInvite}
                        onChange={(e) => setInvitationSettings(prev => ({ ...prev, sendCalendarInvite: e.target.checked }))}
                        className="text-blue-600"
                      />
                      <label htmlFor="sendCalendarInvite" className="text-sm text-gray-700 dark:text-gray-300">
                        캘린더 초대장 전송
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      리마인더 시간 (이벤트 시작 전)
                    </label>
                    <select
                      value={invitationSettings.reminderBefore}
                      onChange={(e) => setInvitationSettings(prev => ({ ...prev, reminderBefore: parseInt(e.target.value) }))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1시간 전</option>
                      <option value={6}>6시간 전</option>
                      <option value={24}>1일 전</option>
                      <option value={48}>2일 전</option>
                      <option value={168}>1주 전</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-6">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
            >
              닫기
            </button>
            {activeTab === 'invite' && selectedUsers.size > 0 && (
              <button
                onClick={handleBulkInvite}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {selectedUsers.size}명 초대하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendeeManagementPanel;