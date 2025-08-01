// 일간 뷰 컴포넌트
import React, { useMemo, useState } from 'react';
import { KOREAN_LOCALE } from '../../constants/calendarConfig';
import { 
  formatDate,
  formatTime,
  isToday,
  formatDateRange
} from '../../utils/dateHelpers';
import { 
  sortEvents,
  getEventBackgroundColor,
  getEventTextColor,
  getEventDuration,
  filterEvents
} from '../../utils/calendarHelpers';

const DayView = ({
  events,
  currentDate,
  selectedDate,
  onEventSelect,
  onDateSelect,
  onQuickEvent,
  calendars,
  selectedCalendars,
  isLoading
}) => {
  const [hoveredHour, setHoveredHour] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  // 시간대 배열 (0시부터 23시, 30분 단위)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({ hour, minute: 0 });
      slots.push({ hour, minute: 30 });
    }
    return slots;
  }, []);

  // 해당 날짜의 이벤트 필터링
  const dayEvents = useMemo(() => {
    const dateStr = formatDate(currentDate, 'YYYY-MM-DD');
    const filtered = events.filter(event => {
      const eventDateStr = formatDate(event.start, 'YYYY-MM-DD');
      return eventDateStr === dateStr;
    });
    return sortEvents(filtered, 'start', 'asc');
  }, [events, currentDate]);

  // 전체 일정과 시간대 일정 분리
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay = [];
    const timed = [];
    
    dayEvents.forEach(event => {
      if (event.allDay) {
        allDay.push(event);
      } else {
        timed.push(event);
      }
    });
    
    return { allDayEvents: allDay, timedEvents: timed };
  }, [dayEvents]);

  // 시간대별 이벤트 그룹화
  const eventsByTimeSlot = useMemo(() => {
    const grouped = {};
    
    timedEvents.forEach(event => {
      const startDate = new Date(event.start);
      const hour = startDate.getHours();
      const minute = startDate.getMinutes() < 30 ? 0 : 30;
      const key = `${hour}-${minute}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    });
    
    return grouped;
  }, [timedEvents]);

  // 시간 셀 클래스 생성
  const getTimeSlotClass = (hour, minute) => {
    const isHovered = hoveredHour === `${hour}-${minute}`;
    const isSelected = selectedTimeSlot === `${hour}-${minute}`;
    const isCurrentTime = isToday(currentDate) && 
      new Date().getHours() === hour && 
      (minute === 0 ? new Date().getMinutes() < 30 : new Date().getMinutes() >= 30);

    return `
      relative px-4 py-2 border-b border-gray-200
      ${minute === 0 ? 'border-t border-gray-300' : ''}
      ${isHovered ? 'bg-gray-50' : ''}
      ${isSelected ? 'bg-blue-50' : ''}
      ${isCurrentTime ? 'bg-yellow-50' : ''}
      hover:bg-gray-50 cursor-pointer transition-colors
    `;
  };

  // 시간 포맷팅
  const formatTimeSlot = (hour, minute) => {
    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${period} ${displayHour}:${minute.toString().padStart(2, '0')}`;
  };

  // 이벤트 렌더링
  const renderEvent = (event) => {
    const calendar = calendars.find(cal => cal.id === event.calendarId);
    const bgColor = getEventBackgroundColor(event, 0.9);
    const textColor = getEventTextColor(bgColor);
    const duration = getEventDuration(event);

    return (
      <div
        key={event.id}
        onClick={(e) => {
          e.stopPropagation();
          onEventSelect(event);
        }}
        className="mb-2 p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderLeft: `4px solid ${calendar?.color || '#3B82F6'}`
        }}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
            <p className="text-xs opacity-90">
              {formatTime(event.start)} - {formatTime(event.end)} ({duration})
            </p>
            {event.location && (
              <p className="text-xs mt-1 opacity-80">
                📍 {event.location.name}
              </p>
            )}
          </div>
          {event.priority === 'urgent' || event.priority === 'critical' ? (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              긴급
            </span>
          ) : null}
        </div>
        {event.attendees && event.attendees.length > 0 && (
          <div className="mt-2 flex items-center text-xs opacity-80">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            {event.attendees.length}명 참석
          </div>
        )}
      </div>
    );
  };

  // 빠른 이벤트 생성
  const handleTimeSlotClick = (hour, minute) => {
    const clickedDate = new Date(currentDate);
    clickedDate.setHours(hour, minute, 0, 0);
    onQuickEvent(clickedDate, { hour, minute });
  };

  // 현재 시간 표시선
  const renderCurrentTimeLine = () => {
    if (!isToday(currentDate)) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const slotIndex = currentHour * 2 + (currentMinutes >= 30 ? 1 : 0);
    const topPosition = slotIndex * 60; // 60px per slot

    return (
      <div
        className="absolute left-0 right-0 z-10 pointer-events-none"
        style={{ top: `${topPosition + (currentMinutes % 30) * 2}px` }}
      >
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
          <div className="flex-1 h-0.5 bg-red-500 shadow"></div>
          <span className="text-xs text-red-500 font-medium px-2">
            {formatTime(now)}
          </span>
        </div>
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

  return (
    <div className="h-full bg-gray-50 flex">
      {/* 왼쪽: 시간대 목록 */}
      <div className="w-32 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3">
          <h3 className="text-sm font-semibold text-gray-700">시간대</h3>
        </div>
        {timeSlots.map(({ hour, minute }) => {
          const key = `${hour}-${minute}`;
          const hasEvents = eventsByTimeSlot[key]?.length > 0;
          
          return (
            <div
              key={key}
              className={`
                px-3 py-2 text-sm border-b border-gray-100
                ${minute === 0 ? 'font-medium' : 'text-gray-500'}
                ${hasEvents ? 'bg-blue-50 text-blue-700' : ''}
                hover:bg-gray-50 cursor-pointer transition-colors
              `}
              onClick={() => setSelectedTimeSlot(key)}
            >
              {formatTimeSlot(hour, minute)}
              {hasEvents && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                  {eventsByTimeSlot[key].length}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 오른쪽: 일정 상세 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* 날짜 헤더 */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {formatDate(currentDate, 'YYYY년 MM월 DD일')}
            </h2>
            <p className="text-gray-500">
              {KOREAN_LOCALE.weekdays[currentDate.getDay()]}
            </p>
          </div>

          {/* 전체 일정 */}
          {allDayEvents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                전체 일정
              </h3>
              <div className="space-y-2">
                {allDayEvents.map(event => {
                  const calendar = calendars.find(cal => cal.id === event.calendarId);
                  const bgColor = getEventBackgroundColor(event, 0.1);
                  
                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventSelect(event)}
                      className="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all"
                      style={{
                        backgroundColor: bgColor,
                        borderColor: calendar?.color || '#3B82F6'
                      }}
                    >
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      {event.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 시간대별 일정 */}
          <div className="relative">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              시간대별 일정
            </h3>
            
            {timedEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">예정된 일정이 없습니다</p>
                <button
                  onClick={() => onQuickEvent(currentDate, null)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  일정 추가하기
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {timeSlots.map(({ hour, minute }) => {
                  const key = `${hour}-${minute}`;
                  const slotEvents = eventsByTimeSlot[key] || [];
                  
                  if (slotEvents.length === 0) return null;
                  
                  return (
                    <div key={key} className="relative">
                      <div className="absolute left-0 top-0 text-xs text-gray-500 font-medium w-20">
                        {formatTimeSlot(hour, minute)}
                      </div>
                      <div className="ml-24">
                        {slotEvents.map(event => renderEvent(event))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {renderCurrentTimeLine()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView;