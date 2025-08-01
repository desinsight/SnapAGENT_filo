// 주간 뷰 컴포넌트
import React, { useMemo, useState } from 'react';
import { KOREAN_LOCALE } from '../../constants/calendarConfig';
import { 
  getWeekDates,
  isSameDay,
  isToday,
  formatDate,
  formatTime,
  isWeekend
} from '../../utils/dateHelpers';
import { 
  sortEvents,
  getEventBackgroundColor,
  getEventTextColor,
  getEventDuration
} from '../../utils/calendarHelpers';

const WeekView = ({
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
  const [hoveredDay, setHoveredDay] = useState(null);

  // 주간 날짜 배열 생성
  const weekDates = useMemo(() => {
    return getWeekDates(currentDate, 1); // 월요일 시작
  }, [currentDate]);

  // 시간대 배열 (0시부터 23시)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 이벤트를 시간별로 그룹화
  const eventsByDateTime = useMemo(() => {
    const grouped = {};
    
    events.forEach(event => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      const dateKey = formatDate(startDate, 'YYYY-MM-DD');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {};
      }
      
      // 전체 일정인 경우
      if (event.allDay) {
        if (!grouped[dateKey].allDay) {
          grouped[dateKey].allDay = [];
        }
        grouped[dateKey].allDay.push(event);
      } else {
        // 시간대별 이벤트
        const startHour = startDate.getHours();
        const endHour = endDate.getHours();
        
        for (let hour = startHour; hour <= endHour; hour++) {
          if (!grouped[dateKey][hour]) {
            grouped[dateKey][hour] = [];
          }
          grouped[dateKey][hour].push(event);
        }
      }
    });

    return grouped;
  }, [events]);

  // 시간 셀 클래스 생성
  const getTimeCellClass = (date, hour) => {
    const isSelected = isSameDay(date, selectedDate) && hoveredHour === hour;
    const isHovered = hoveredDay === date && hoveredHour === hour;
    const isCurrentHour = isToday(date) && new Date().getHours() === hour;

    return `
      relative h-16 border-r border-b border-gray-200
      ${isSelected ? 'bg-blue-100' : ''}
      ${isHovered && !isSelected ? 'bg-gray-50' : ''}
      ${isCurrentHour ? 'bg-yellow-50' : ''}
      hover:bg-gray-50 cursor-pointer transition-colors
    `;
  };

  // 날짜 헤더 클래스 생성
  const getDateHeaderClass = (date) => {
    const isTodayDate = isToday(date);
    const isSelected = isSameDay(date, selectedDate);
    const isWeekendDate = isWeekend(date);

    return `
      text-center py-2 border-r border-b border-gray-200
      ${isTodayDate ? 'bg-blue-50' : ''}
      ${isSelected ? 'bg-blue-100' : ''}
      ${isWeekendDate ? 'bg-red-50' : ''}
    `;
  };

  // 이벤트 위치 및 크기 계산
  const getEventStyle = (event) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    const startMinutes = startDate.getMinutes();
    const duration = (endDate - startDate) / (1000 * 60); // 분 단위
    
    const top = (startMinutes / 60) * 64; // 64px = h-16
    const height = Math.max((duration / 60) * 64, 20); // 최소 높이 20px
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      position: 'absolute',
      left: '2px',
      right: '2px',
      zIndex: 10
    };
  };

  // 이벤트 렌더링
  const renderEvent = (event) => {
    const calendar = calendars.find(cal => cal.id === event.calendarId);
    const bgColor = getEventBackgroundColor(event, 0.9);
    const textColor = getEventTextColor(bgColor);

    return (
      <div
        key={event.id}
        onClick={(e) => {
          e.stopPropagation();
          onEventSelect(event);
        }}
        className="px-2 py-1 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
        style={{
          ...getEventStyle(event),
          backgroundColor: bgColor,
          color: textColor
        }}
        title={`${event.title}\n${formatTime(event.start)} - ${formatTime(event.end)}`}
      >
        <div className="text-xs font-medium truncate">
          {event.title}
        </div>
        <div className="text-xs opacity-80">
          {formatTime(event.start)}
        </div>
      </div>
    );
  };

  // 빠른 이벤트 생성
  const handleTimeSlotClick = (date, hour) => {
    const clickedDate = new Date(date);
    clickedDate.setHours(hour, 0, 0, 0);
    onQuickEvent(clickedDate, hour);
  };

  // 현재 시간 표시선
  const renderCurrentTimeLine = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const top = currentHour * 64 + (currentMinutes / 60) * 64;

    return (
      <div
        className="absolute left-0 right-0 z-20 pointer-events-none"
        style={{ top: `${top}px` }}
      >
        <div className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <div className="flex-1 h-0.5 bg-red-500"></div>
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
    <div className="h-full bg-white overflow-hidden flex">
      {/* 시간 라벨 */}
      <div className="w-16 flex-shrink-0">
        <div className="h-24 border-b border-gray-200"></div>
        <div className="overflow-y-auto h-[calc(100%-6rem)]">
          {hours.map(hour => (
            <div
              key={hour}
              className="h-16 border-b border-gray-200 text-xs text-gray-500 text-right pr-2 pt-1"
            >
              {hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`}
            </div>
          ))}
        </div>
      </div>

      {/* 주간 그리드 */}
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* 날짜 헤더 */}
          <div className="grid grid-cols-7 h-24">
            {weekDates.map((date, index) => {
              const dateEvents = eventsByDateTime[formatDate(date, 'YYYY-MM-DD')];
              const allDayEvents = dateEvents?.allDay || [];
              
              return (
                <div key={index} className={getDateHeaderClass(date)}>
                  <div className="font-medium text-sm">
                    {KOREAN_LOCALE.weekdaysShort[date.getDay()]}
                  </div>
                  <div className={`text-2xl font-bold ${isToday(date) ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                  </div>
                  {/* 전체 일정 표시 */}
                  {allDayEvents.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {allDayEvents.length}개 전체일정
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 시간대 그리드 */}
          <div className="relative overflow-y-auto h-[calc(100%-6rem)]">
            <div className="grid grid-cols-7">
              {weekDates.map((date, dayIndex) => (
                <div key={dayIndex} className="relative">
                  {hours.map(hour => {
                    const dateKey = formatDate(date, 'YYYY-MM-DD');
                    const hourEvents = eventsByDateTime[dateKey]?.[hour] || [];
                    
                    return (
                      <div
                        key={hour}
                        className={getTimeCellClass(date, hour)}
                        onClick={() => handleTimeSlotClick(date, hour)}
                        onMouseEnter={() => {
                          setHoveredDay(date);
                          setHoveredHour(hour);
                        }}
                        onMouseLeave={() => {
                          setHoveredDay(null);
                          setHoveredHour(null);
                        }}
                      >
                        {/* 시간대별 이벤트 */}
                        {hour === Math.min(...hourEvents.map(e => new Date(e.start).getHours())) && 
                          hourEvents.map(event => renderEvent(event))
                        }
                      </div>
                    );
                  })}
                  
                  {/* 현재 시간 표시 */}
                  {isToday(date) && renderCurrentTimeLine()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;