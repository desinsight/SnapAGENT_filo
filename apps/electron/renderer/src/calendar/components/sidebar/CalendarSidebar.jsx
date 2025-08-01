// 캘린더 사이드바 컴포넌트 (MainSidebar children/slot에 들어갈 컨텐츠)
import React, { useState } from 'react';
import { CALENDAR_CONFIG, KOREAN_LOCALE } from '../../constants/calendarConfig';

const CalendarSidebar = ({ 
  calendars = [], 
  selectedCalendars = [], 
  onToggleCalendar,
  onCreateCalendar,
  currentDate = new Date(),
  onDateSelect,
  recentEvents = [],
  urgentNotices = [],
  activeModules = [],
  onCreateEvent,
  onShowTemplates,
  onShowRecurrence,
  onShowModules
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarColor, setNewCalendarColor] = useState(CALENDAR_CONFIG.COLOR_PALETTE[0]);
  
  // 접고 펴기 상태 관리
  const [expandedSections, setExpandedSections] = useState({
    miniCalendar: true,
    calendars: true,
    urgentNotices: true,
    recentEvents: true,
    activeModules: true,
    quickActions: true
  });

  // 미니 캘린더 생성 함수
  const generateMiniCalendar = () => {
    const today = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    
    const weeks = [];
    let currentWeek = [];
    
    // 이전 달의 빈 날짜들
    for (let i = 0; i < startWeekday; i++) {
      currentWeek.push(null);
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }
    
    // 다음 달의 빈 날짜들
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
    
    return weeks;
  };

  // 새 캘린더 생성
  const handleCreateCalendar = () => {
    if (!newCalendarName.trim()) return;
    
    const newCalendar = {
      id: `calendar-${Date.now()}`,
      name: newCalendarName.trim(),
      color: newCalendarColor,
      isDefault: false,
      isVisible: true,
      owner: 'current-user'
    };
    
    onCreateCalendar?.(newCalendar);
    setNewCalendarName('');
    setShowCreateForm(false);
  };

  const weeks = generateMiniCalendar();
  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-600 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
      {/* 미니 캘린더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, miniCalendar: !prev.miniCalendar }))}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className={`w-3 h-3 transition-transform ${expandedSections.miniCalendar ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {KOREAN_LOCALE.months[currentDate.getMonth()]} {currentDate.getFullYear()}년
            </h3>
          </div>
          <div className="flex space-x-1">
            <button 
              onClick={() => {
                const prevMonth = new Date(currentDate);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                onDateSelect?.(prevMonth);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => {
                const nextMonth = new Date(currentDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                onDateSelect?.(nextMonth);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        {expandedSections.miniCalendar && (
          <div className="grid grid-cols-7 gap-1 text-xs">
          {KOREAN_LOCALE.weekdaysMin.map(day => (
            <div key={day} className="text-center text-gray-500 dark:text-gray-400 font-medium py-1">
              {day}
            </div>
          ))}
          {weeks.map((week, weekIndex) => 
            week.map((day, dayIndex) => (
              <button
                key={`${weekIndex}-${dayIndex}`}
                onClick={() => {
                  if (day) {
                    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    onDateSelect?.(selectedDate);
                  }
                }}
                className={`
                  w-6 h-6 text-xs rounded flex items-center justify-center
                  ${day ? 'hover:bg-blue-100 dark:hover:bg-blue-900/50' : ''}
                  ${isToday(day) ? 'bg-blue-500 text-white font-medium' : 
                    day ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}
                `}
                disabled={!day}
              >
                {day}
              </button>
            ))
          )}
        </div>
        )}
      </div>

      {/* 내 캘린더 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, calendars: !prev.calendars }))}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className={`w-3 h-3 transition-transform ${expandedSections.calendars ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">내 캘린더</h3>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
            title="새 캘린더 추가"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {expandedSections.calendars && (
        <>
        {/* 새 캘린더 생성 폼 */}
        {showCreateForm && (
          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
            <input
              type="text"
              placeholder="캘린더 이름"
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateCalendar()}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex space-x-1">
                {CALENDAR_CONFIG.COLOR_PALETTE.slice(0, 5).map(color => (
                  <button
                    key={color}
                    onClick={() => setNewCalendarColor(color)}
                    className={`w-4 h-4 rounded border-2 ${
                      newCalendarColor === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={handleCreateCalendar}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  생성
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCalendarName('');
                  }}
                  className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 캘린더 목록 */}
        <div className="space-y-2">
          {calendars.length > 0 ? calendars.map(calendar => (
            <div key={calendar.id} className="flex items-center space-x-2">
              <button
                onClick={() => onToggleCalendar?.(calendar.id)}
                className="flex items-center space-x-2 flex-1 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1"
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded border-2 ${
                      selectedCalendars.includes(calendar.id) 
                        ? 'border-transparent' 
                        : 'border-gray-300 dark:border-gray-600 bg-transparent'
                    }`}
                    style={selectedCalendars.includes(calendar.id) ? { backgroundColor: calendar.color } : {}}
                  />
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {calendar.name}
                </span>
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          )) : (
            // 더미 캘린더 데이터
            [
              { id: 'work', name: '업무', color: '#3b82f6' },
              { id: 'personal', name: '개인', color: '#10b981' },
              { id: 'meetings', name: '회의', color: '#f59e0b' },
              { id: 'projects', name: '프로젝트', color: '#8b5cf6' },
              { id: 'deadlines', name: '마감일', color: '#ef4444' },
              { id: 'team', name: '팀 활동', color: '#06b6d4' },
              { id: 'client', name: '고객 미팅', color: '#84cc16' },
              { id: 'training', name: '교육', color: '#f97316' },
              { id: 'holiday', name: '휴가', color: '#ec4899' },
              { id: 'maintenance', name: '정기 점검', color: '#6b7280' },
              { id: 'review', name: '코드 리뷰', color: '#14b8a6' },
              { id: 'deployment', name: '배포', color: '#f43f5e' },
              { id: 'planning', name: '계획 수립', color: '#a855f7' },
              { id: 'retrospective', name: '회고', color: '#eab308' },
              { id: 'workshop', name: '워크샵', color: '#22c55e' }
            ].map(calendar => (
              <div key={calendar.id} className="flex items-center space-x-2">
                <button
                  onClick={() => onToggleCalendar?.(calendar.id)}
                  className="flex items-center space-x-2 flex-1 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded border-2 ${
                        selectedCalendars.includes(calendar.id) 
                          ? 'border-transparent' 
                          : 'border-gray-300 dark:border-gray-600 bg-transparent'
                      }`}
                      style={selectedCalendars.includes(calendar.id) ? { backgroundColor: calendar.color } : {}}
                    />
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                    {calendar.name}
                  </span>
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
        </>
        )}
      </div>

      {/* 긴급 알림 */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, urgentNotices: !prev.urgentNotices }))}
              className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              <svg className={`w-3 h-3 transition-transform ${expandedSections.urgentNotices ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">긴급 알림</h3>
          </div>
        </div>
        {expandedSections.urgentNotices && (
        <div className="space-y-1">
          {urgentNotices.slice(0, 2).map(notice => (
            <div key={notice.id} className="text-xs text-red-700 dark:text-red-300">
              {notice.title}
            </div>
          ))}
        </div>
        )}
      </div>

      {/* 최근 이벤트 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, recentEvents: !prev.recentEvents }))}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className={`w-3 h-3 transition-transform ${expandedSections.recentEvents ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">최근 이벤트</h3>
          </div>
        </div>
        {expandedSections.recentEvents && (
        <div className="space-y-2">
          {recentEvents && recentEvents.length > 0 ? recentEvents.slice(0, 3).map(event => (
            <div key={event.id} className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: event.calendar?.color || CALENDAR_CONFIG.COLOR_PALETTE[0] }}
              />
              <div className="flex-1">
                <div className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                  {event.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(event.start).toLocaleDateString()}
                </div>
              </div>
            </div>
          )) : (
            // 더미 이벤트 데이터
            [
              { id: '1', title: '팀 미팅', start: new Date(), calendar: { color: '#3b82f6' } },
              { id: '2', title: '프로젝트 리뷰', start: new Date(Date.now() - 86400000), calendar: { color: '#10b981' } },
              { id: '3', title: '클라이언트 통화', start: new Date(Date.now() - 2 * 86400000), calendar: { color: '#f59e0b' } },
              { id: '4', title: '코드 리뷰', start: new Date(Date.now() - 3 * 86400000), calendar: { color: '#8b5cf6' } },
              { id: '5', title: '개발자 회의', start: new Date(Date.now() - 4 * 86400000), calendar: { color: '#ef4444' } },
              { id: '6', title: '디자인 리뷰', start: new Date(Date.now() - 5 * 86400000), calendar: { color: '#06b6d4' } },
              { id: '7', title: 'QA 테스트', start: new Date(Date.now() - 6 * 86400000), calendar: { color: '#84cc16' } },
              { id: '8', title: '배포 준비', start: new Date(Date.now() - 7 * 86400000), calendar: { color: '#f97316' } },
              { id: '9', title: '성능 모니터링', start: new Date(Date.now() - 8 * 86400000), calendar: { color: '#ec4899' } },
              { id: '10', title: '보안 점검', start: new Date(Date.now() - 9 * 86400000), calendar: { color: '#6b7280' } },
              { id: '11', title: '사용자 피드백 수집', start: new Date(Date.now() - 10 * 86400000), calendar: { color: '#14b8a6' } },
              { id: '12', title: '문서 업데이트', start: new Date(Date.now() - 11 * 86400000), calendar: { color: '#f43f5e' } },
              { id: '13', title: '백업 확인', start: new Date(Date.now() - 12 * 86400000), calendar: { color: '#a855f7' } },
              { id: '14', title: '시스템 점검', start: new Date(Date.now() - 13 * 86400000), calendar: { color: '#eab308' } },
              { id: '15', title: '업데이트 배포', start: new Date(Date.now() - 14 * 86400000), calendar: { color: '#22c55e' } }
            ].map(event => (
              <div key={event.id} className="flex items-center space-x-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: event.calendar?.color || CALENDAR_CONFIG.COLOR_PALETTE[0] }}
                />
                <div className="flex-1">
                  <div className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                    {event.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(event.start).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </div>

      {/* 활성 모듈 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, activeModules: !prev.activeModules }))}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className={`w-3 h-3 transition-transform ${expandedSections.activeModules ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">활성 모듈</h3>
          </div>
        </div>
        {expandedSections.activeModules && (
        <div className="space-y-1">
          {activeModules && activeModules.length > 0 ? activeModules.slice(0, 3).map(moduleId => (
            <div key={moduleId} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                {moduleId.replace(/-/g, ' ')}
              </span>
            </div>
          )) : (
            // 더미 모듈 데이터
            [
              'event-management', 'calendar-sync', 'notification-system',
              'recurring-events', 'template-library', 'attendee-management',
              'conflict-resolution', 'location-mapping', 'external-integration',
              'analytics-dashboard', 'reporting-tools', 'backup-system',
              'security-module', 'performance-monitor', 'user-management'
            ].map(moduleId => (
              <div key={moduleId} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {moduleId.replace(/-/g, ' ')}
                </span>
              </div>
            ))
          )}
        </div>
        )}
      </div>

      {/* 바로가기 버튼들 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, quickActions: !prev.quickActions }))}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className={`w-3 h-3 transition-transform ${expandedSections.quickActions ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">빠른 작업</h3>
          </div>
        </div>
        {expandedSections.quickActions && (
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => onCreateEvent?.()}
            className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 text-center"
          >
            새 이벤트
          </button>
          <button 
            onClick={() => onShowTemplates?.()}
            className="px-2 py-1 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/50 text-center"
          >
            템플릿
          </button>
          <button 
            onClick={() => onShowRecurrence?.()}
            className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-900/50 text-center"
          >
            반복 이벤트
          </button>
          <button 
            onClick={() => onShowModules?.()}
            className="px-2 py-1 text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-100 dark:hover:bg-orange-900/50 text-center"
          >
            모듈 관리
          </button>
        </div>
        )}
      </div>
    </div>
  );
};

export default CalendarSidebar;