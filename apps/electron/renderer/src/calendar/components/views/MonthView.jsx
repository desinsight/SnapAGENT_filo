// 월간 뷰 컴포넌트
import React, { useMemo, useState } from 'react';
import { KOREAN_LOCALE } from '../../constants/calendarConfig';
import { 
  getMonthGrid, 
  isSameDay, 
  isToday, 
  formatDate,
  isWeekend,
  isHoliday
} from '../../utils/dateHelpers';
import { 
  filterEvents, 
  sortEvents,
  getEventBackgroundColor,
  getEventTextColor 
} from '../../utils/calendarHelpers';

const MonthView = ({
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
  const [hoveredDate, setHoveredDate] = useState(null);
  const [draggedEvent, setDraggedEvent] = useState(null);

  // 월간 그리드 생성
  const monthGrid = useMemo(() => {
    return getMonthGrid(currentDate, 1); // 월요일 시작
  }, [currentDate]);

  // 날짜별 이벤트 그룹화
  const eventsByDate = useMemo(() => {
    const grouped = {};
    
    events.forEach(event => {
      const dateKey = formatDate(event.start, 'YYYY-MM-DD');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // 각 날짜의 이벤트를 시간순으로 정렬
    Object.keys(grouped).forEach(date => {
      grouped[date] = sortEvents(grouped[date], 'start', 'asc');
    });

    return grouped;
  }, [events]);

  // 날짜 셀 클래스 생성
  const getDayCellClass = (date) => {
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const isSelected = isSameDay(date, selectedDate);
    const isHovered = isSameDay(date, hoveredDate);
    const isTodayDate = isToday(date);
    const isWeekendDate = isWeekend(date);
    const isHolidayDate = isHoliday(date);

    return `
      relative h-32 p-2 border-r border-b border-gray-200
      ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
      ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}
      ${isHovered && !isSelected ? 'bg-blue-50' : ''}
      ${isTodayDate ? 'bg-blue-50' : ''}
      ${isWeekendDate || isHolidayDate ? 'bg-red-50' : ''}
      hover:bg-gray-50 cursor-pointer transition-colors
    `;
  };

  // 날짜 텍스트 클래스 생성
  const getDateTextClass = (date) => {
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const isTodayDate = isToday(date);
    const isWeekendDate = isWeekend(date);
    const isHolidayDate = isHoliday(date);

    return `
      text-sm font-medium
      ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
      ${isTodayDate ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : ''}
      ${(isWeekendDate || isHolidayDate) && !isTodayDate ? 'text-red-600' : ''}
    `;
  };

  // 이벤트 렌더링 (최대 3개까지 표시)
  const renderEvents = (date) => {
    const dateKey = formatDate(date, 'YYYY-MM-DD');
    const dayEvents = eventsByDate[dateKey] || [];
    const visibleEvents = dayEvents.slice(0, 3);
    const moreCount = dayEvents.length - 3;

    return (
      <div className="mt-1 space-y-1">
        {visibleEvents.map((event, index) => {
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
              className="px-2 py-0.5 text-xs rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: bgColor,
                color: textColor
              }}
              title={event.title}
            >
              {event.allDay ? (
                <span className="font-medium">{event.title}</span>
              ) : (
                <span>
                  <span className="font-medium">
                    {formatDate(event.start, 'HH:mm')}
                  </span>
                  {' '}
                  {event.title}
                </span>
              )}
            </div>
          );
        })}
        {moreCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDateSelect(date);
            }}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            +{moreCount} 더보기
          </button>
        )}
      </div>
    );
  };

  // 빠른 이벤트 생성
  const handleDateDoubleClick = (date) => {
    onQuickEvent(date, null);
  };

  // 드래그 시작
  const handleDragStart = (e, event) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 드롭
  const handleDrop = (e, date) => {
    e.preventDefault();
    if (draggedEvent) {
      // TODO: 이벤트 날짜 변경 처리
      console.log('이벤트 이동:', draggedEvent, date);
    }
    setDraggedEvent(null);
  };

  // 드래그 오버
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {KOREAN_LOCALE.weekdaysShort.map((day, index) => (
          <div
            key={day}
            className={`
              px-2 py-3 text-sm font-semibold text-center
              ${index === 0 || index === 6 ? 'text-red-600' : 'text-gray-900'}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 월간 그리드 */}
      <div className="grid grid-cols-7 grid-rows-6 h-[calc(100%-3rem)]">
        {monthGrid.flat().map((date, index) => (
          <div
            key={index}
            className={getDayCellClass(date)}
            onClick={() => onDateSelect(date)}
            onDoubleClick={() => handleDateDoubleClick(date)}
            onMouseEnter={() => setHoveredDate(date)}
            onMouseLeave={() => setHoveredDate(null)}
            onDrop={(e) => handleDrop(e, date)}
            onDragOver={handleDragOver}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={getDateTextClass(date)}>
                {date.getDate()}
              </span>
              {/* 휴일 표시 */}
              {isHoliday(date) && date.getMonth() === currentDate.getMonth() && (
                <span className="text-xs text-red-600 font-medium">
                  휴일
                </span>
              )}
            </div>
            
            {/* 이벤트 목록 */}
            <div className="overflow-hidden">
              {renderEvents(date)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;