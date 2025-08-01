// 리스트 뷰 컴포넌트
import React, { useMemo, useState } from 'react';
import { 
  formatDate,
  formatTime,
  isToday,
  isSameDay,
  getDatesBetween,
  formatDateRange
} from '../../utils/dateHelpers';
import { 
  sortEvents,
  groupEventsByDate,
  getEventBackgroundColor,
  getEventTextColor,
  getEventDuration,
  filterEvents
} from '../../utils/calendarHelpers';
import { KOREAN_LOCALE } from '../../constants/calendarConfig';

const ListView = ({
  events,
  currentDate,
  selectedDate,
  onEventSelect,
  onDateSelect,
  onQuickEvent,
  calendars,
  selectedCalendars,
  isLoading,
  viewRange = 'month' // 'week', 'month', '3months'
}) => {
  const [expandedDates, setExpandedDates] = useState(new Set());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 표시할 날짜 범위 계산
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    switch (viewRange) {
      case 'week':
        start.setDate(start.getDate() - start.getDay() + 1); // 월요일 시작
        end.setDate(start.getDate() + 6);
        break;
      case '3months':
        start.setMonth(start.getMonth() - 1);
        end.setMonth(currentDate.getMonth() + 1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      default: // month
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
    }
    
    return { start, end };
  }, [currentDate, viewRange]);

  // 날짜별로 그룹화된 이벤트
  const groupedEvents = useMemo(() => {
    const filtered = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= dateRange.start && eventDate <= dateRange.end;
    });
    
    const sorted = sortEvents(filtered, 'start', 'asc');
    return groupEventsByDate(sorted);
  }, [events, dateRange]);

  // 날짜 토글
  const toggleDateExpanded = (dateKey) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  // 모든 날짜 펼치기/접기
  const toggleAllDates = () => {
    if (expandedDates.size === Object.keys(groupedEvents).length) {
      setExpandedDates(new Set());
    } else {
      setExpandedDates(new Set(Object.keys(groupedEvents)));
    }
  };

  // 이벤트 상태 아이콘
  const getEventStatusIcon = (event) => {
    switch (event.status) {
      case 'cancelled':
        return '❌';
      case 'tentative':
        return '❓';
      case 'confirmed':
        return '✅';
      default:
        return '';
    }
  };

  // 우선순위 배지
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      critical: { bg: 'bg-red-100', text: 'text-red-700', label: '매우 중요' },
      urgent: { bg: 'bg-orange-100', text: 'text-orange-700', label: '긴급' },
      high: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '높음' },
      normal: { bg: 'bg-blue-100', text: 'text-blue-700', label: '보통' },
      low: { bg: 'bg-gray-100', text: 'text-gray-700', label: '낮음' }
    };

    const config = priorityConfig[priority] || priorityConfig.normal;
    
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // 이벤트 카드 렌더링
  const renderEventCard = (event) => {
    const calendar = calendars.find(cal => cal.id === event.calendarId);
    const bgColor = getEventBackgroundColor(event, 0.1);
    const borderColor = calendar?.color || '#3B82F6';
    const duration = getEventDuration(event);
    const isSelected = selectedEvent?.id === event.id;

    return (
      <div
        key={event.id}
        onClick={() => {
          setSelectedEvent(event);
          onEventSelect(event);
        }}
        className={`
          mb-2 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
          hover:shadow-lg hover:scale-[1.02]
          ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
        `}
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <h4 className="font-semibold text-base mr-2">{event.title}</h4>
              {getEventStatusIcon(event)}
            </div>
            
            {/* 시간 정보 */}
            <div className="text-sm text-gray-600 mb-2">
              {event.allDay ? (
                <span>전체 일정</span>
              ) : (
                <span>
                  {formatTime(event.start)} - {formatTime(event.end)} ({duration})
                </span>
              )}
            </div>

            {/* 설명 */}
            {event.description && (
              <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>

          {/* 우선순위 */}
          <div className="ml-4">
            {getPriorityBadge(event.priority)}
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          {/* 캘린더 */}
          <div className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: borderColor }}
            />
            <span>{calendar?.name}</span>
          </div>

          {/* 위치 */}
          {event.location && (
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{event.location.name}</span>
            </div>
          )}

          {/* 참석자 */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              <span>{event.attendees.length}명 참석</span>
            </div>
          )}

          {/* 반복 */}
          {event.recurrence && (
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>반복 일정</span>
            </div>
          )}

          {/* 태그 */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-1">
              {event.tags.map((tag, index) => (
                <span key={index} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 날짜 그룹 렌더링
  const renderDateGroup = (dateKey, events) => {
    const date = new Date(dateKey);
    const isExpanded = expandedDates.has(dateKey);
    const isTodayDate = isToday(date);
    const dayOfWeek = KOREAN_LOCALE.weekdays[date.getDay()];

    return (
      <div key={dateKey} className="mb-6">
        {/* 날짜 헤더 */}
        <div
          onClick={() => toggleDateExpanded(dateKey)}
          className={`
            sticky top-0 z-10 px-4 py-3 bg-white border-b-2 cursor-pointer
            hover:bg-gray-50 transition-colors
            ${isTodayDate ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg
                className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <h3 className={`text-lg font-semibold ${isTodayDate ? 'text-blue-700' : 'text-gray-900'}`}>
                {formatDate(date, 'MM월 DD일')} {dayOfWeek}
              </h3>
              {isTodayDate && (
                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  오늘
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {events.length}개 일정
              </span>
              {events.some(e => e.priority === 'critical' || e.priority === 'urgent') && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 이벤트 목록 */}
        {isExpanded && (
          <div className="px-4 py-2">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>예정된 일정이 없습니다</p>
                <button
                  onClick={() => onQuickEvent(date, null)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  일정 추가하기
                </button>
              </div>
            ) : (
              events.map(event => renderEventCard(event))
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasEvents = Object.keys(groupedEvents).length > 0;

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* 도구 모음 */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {viewRange === 'week' && '주간 일정'}
              {viewRange === 'month' && '월간 일정'}
              {viewRange === '3months' && '3개월 일정'}
            </h2>
            <span className="text-sm text-gray-500">
              {formatDateRange(dateRange.start, dateRange.end)}
            </span>
          </div>
          
          {hasEvents && (
            <button
              onClick={toggleAllDates}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {expandedDates.size === Object.keys(groupedEvents).length ? '모두 접기' : '모두 펼치기'}
            </button>
          )}
        </div>
      </div>

      {/* 일정 목록 */}
      <div className="max-w-4xl mx-auto py-4">
        {hasEvents ? (
          Object.entries(groupedEvents).map(([dateKey, events]) => 
            renderDateGroup(dateKey, events)
          )
        ) : (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xl font-medium mb-2">일정이 없습니다</p>
            <p className="text-sm text-gray-500 mb-4">
              {formatDateRange(dateRange.start, dateRange.end)} 기간에 예정된 일정이 없습니다
            </p>
            <button
              onClick={() => onQuickEvent(currentDate, null)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 일정 만들기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;