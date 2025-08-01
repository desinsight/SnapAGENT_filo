/**
 * 캘린더 블록 컴포넌트
 * 
 * @description 향상된 기능을 갖춘 프로페셔널 캘린더 블록
 * @author AI Assistant
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CalendarBlock.css';

// 이벤트 타입별 색상 (연한 톤)
const EVENT_COLORS = {
  default: '#93C5FD', // light blue
  work: '#6EE7B7', // light green
  personal: '#FCD34D', // light yellow
  important: '#FCA5A5', // light red
  birthday: '#F9A8D4', // light pink
  holiday: '#C4B5FD', // light purple
  other: '#D1D5DB' // light gray
};

// 이벤트 모달 컴포넌트
const EventModal = ({ isOpen, onClose, onSave, event, date, selectedTime, readOnly }) => {
  // 기본 formData 초기값
  const defaultFormData = {
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'default',
    description: '',
    repeat: 'none',
    reminder: 'none'
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (!isOpen) return; // 모달이 닫혀있으면 아무것도 하지 않음

    if (event) {
      // 기존 이벤트 수정
      setFormData({ ...defaultFormData, ...event });
    } else if (selectedTime) {
      // 선택된 시간이 있으면 시작 시간으로 설정
      const endTime = new Date(`2000-01-01T${selectedTime}`);
      endTime.setHours(endTime.getHours() + 1);
      const endTimeString = endTime.toTimeString().slice(0, 5);
      
      setFormData({
        ...defaultFormData,
        startTime: selectedTime,
        endTime: endTimeString
      });
    } else {
      // 완전히 새로운 일정
      setFormData(defaultFormData);
    }
  }, [isOpen, event, selectedTime]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={e => e.stopPropagation()}>
        <div className="event-modal-header">
          <h3>{event ? '일정 수정' : '새 일정'}</h3>
          <button className="close-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="일정 제목"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="form-input"
              autoFocus
              required
              disabled={readOnly}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>시작 시간</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                className="form-input"
                disabled={readOnly}
              />
            </div>
            <div className="form-group">
              <label>종료 시간</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                className="form-input"
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="form-group">
            <label>유형</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="form-select"
              disabled={readOnly}
            >
              <option value="default">일반</option>
              <option value="work">업무</option>
              <option value="personal">개인</option>
              <option value="important">중요</option>
              <option value="birthday">생일</option>
              <option value="holiday">휴일</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div className="form-group">
            <label>반복</label>
            <select
              value={formData.repeat}
              onChange={e => setFormData({ ...formData, repeat: e.target.value })}
              className="form-select"
              disabled={readOnly}
            >
              <option value="none">반복 안함</option>
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="monthly">매월</option>
              <option value="yearly">매년</option>
            </select>
          </div>

          <div className="form-group">
            <label>알림</label>
            <select
              value={formData.reminder}
              onChange={e => setFormData({ ...formData, reminder: e.target.value })}
              className="form-select"
              disabled={readOnly}
            >
              <option value="none">알림 없음</option>
              <option value="5min">5분 전</option>
              <option value="15min">15분 전</option>
              <option value="30min">30분 전</option>
              <option value="1hour">1시간 전</option>
              <option value="1day">1일 전</option>
            </select>
          </div>

          <div className="form-group">
            <textarea
              placeholder="메모"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows={3}
              disabled={readOnly}
            />
          </div>

          {!readOnly && (
            <div className="form-actions">
              <button type="button" onClick={onClose} className="button-secondary">
                취소
              </button>
              <button type="submit" className="button-primary">
                저장
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export const CalendarBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  isEditing,
  onEditingChange 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState(block.metadata?.viewMode || 'month');
  const [events, setEvents] = useState(block.metadata?.events || {});
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const calendarRef = useRef(null);

  // 이벤트 업데이트 시 부모에게 알림
  useEffect(() => {
    if (!readOnly) {
      onUpdate({
        metadata: {
          ...block.metadata,
          viewMode,
          events,
          currentDate: currentDate.toISOString()
        }
      });
    }
  }, [viewMode, events, currentDate]);

  // 날짜 포맷팅
  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // 날짜 비교 함수들
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSameMonth = (date) => {
    return date.getMonth() === currentDate.getMonth() &&
           date.getFullYear() === currentDate.getFullYear();
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // 이벤트 관리 함수들
  const handleDateClick = (date) => {
    if (!readOnly) {
      setSelectedDate(date);
      setShowEventModal(true);
      setSelectedEvent(null);
      // 호버 상태 초기화
      setHoveredDate(null);
    }
  };

  const handleTimeClick = (date, time) => {
    if (!readOnly) {
      setSelectedDate(date);
      setShowEventModal(true);
      setSelectedEvent(null);
      // 호버 상태 초기화
      setHoveredDate(null);
      // 선택된 시간을 모달에 전달하기 위해 상태 추가
      setSelectedTime(time);
    }
  };

  const handleEventClick = (e, event, date) => {
    e.stopPropagation();
    if (!readOnly) {
      setSelectedDate(date);
      setSelectedEvent(event);
      setShowEventModal(true);
    }
  };

  const handleEventSave = (eventData) => {
    const dateKey = formatDateKey(selectedDate);
    const newEvents = { ...events };
    
    if (!newEvents[dateKey]) {
      newEvents[dateKey] = [];
    }

    if (selectedEvent) {
      // 기존 이벤트 수정
      const eventIndex = newEvents[dateKey].findIndex(e => e.id === selectedEvent.id);
      if (eventIndex !== -1) {
        newEvents[dateKey][eventIndex] = { ...eventData, id: selectedEvent.id };
      }
    } else {
      // 새 이벤트 추가
      newEvents[dateKey].push({
        ...eventData,
        id: Date.now().toString()
      });
    }

    // 빈 배열 제거
    if (newEvents[dateKey].length === 0) {
      delete newEvents[dateKey];
    }

    setEvents(newEvents);
    // 모달 닫을 때 상태 초기화
    setShowEventModal(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleEventDelete = (e, eventId, dateKey) => {
    e.stopPropagation();
    if (readOnly) return;

    const newEvents = { ...events };
    if (newEvents[dateKey]) {
      newEvents[dateKey] = newEvents[dateKey].filter(event => event.id !== eventId);
      if (newEvents[dateKey].length === 0) {
        delete newEvents[dateKey];
      }
    }
    setEvents(newEvents);
  };

  // 네비게이션 함수들
  const navigate = (direction) => {
    setIsTransitioning(true);
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(currentDate.getDate() + direction);
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + direction);
        break;
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() + direction);
        break;
    }
    
    setCurrentDate(newDate);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToToday = () => {
    setIsTransitioning(true);
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // 달력 데이터 생성
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (i > 27 && current.getMonth() !== month) break;
    }
    
    return days;
  };

  // 주간 뷰 데이터 생성
  const generateWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  // 일간 뷰 시간대 생성
  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // 아젠다 뷰 이벤트 목록 생성
  const generateAgendaEvents = () => {
    const agendaEvents = [];
    const sortedKeys = Object.keys(events).sort();
    
    sortedKeys.forEach(dateKey => {
      const date = new Date(dateKey);
      if (date >= new Date().setHours(0, 0, 0, 0)) {
        events[dateKey].forEach(event => {
          agendaEvents.push({
            ...event,
            date: date,
            dateKey: dateKey
          });
        });
      }
    });
    
    return agendaEvents;
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const fullDayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  // 월간 뷰 렌더링
  const renderMonthView = () => {
    const days = generateCalendarDays();
    
    return (
      <>
        <div className="calendar-weekdays">
          {dayNames.map(day => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-days">
          {days.map((date, index) => {
            const dateKey = formatDateKey(date);
            const dayEvents = events[dateKey] || [];
            const isHovered = hoveredDate && 
              hoveredDate.getDate() === date.getDate() &&
              hoveredDate.getMonth() === date.getMonth();
            
            return (
              <div
                key={index}
                className={`
                  calendar-day
                  ${!isSameMonth(date) ? 'other-month' : ''}
                  ${isToday(date) ? 'today' : ''}
                  ${isSelected(date) ? 'selected' : ''}
                  ${isWeekend(date) ? 'weekend' : ''}
                  ${isHovered ? 'hovered' : ''}
                  ${!readOnly ? 'clickable' : ''}
                `}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <span className="day-number">{date.getDate()}</span>
                
                {dayEvents.length > 0 && (
                  <div className="day-events">
                    {dayEvents.slice(0, 2).map((event, i) => (
                      <div
                        key={event.id}
                        className="month-event-item"
                        style={{ borderLeftColor: EVENT_COLORS[event.type] }}
                        onClick={(e) => handleEventClick(e, event, date)}
                        title={event.title}
                      >
                        <div className="month-event-title">{event.title}</div>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="more-events">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // 주간 뷰 렌더링
  const renderWeekView = () => {
    const days = generateWeekDays();
    
    return (
      <div className="week-view">
        <div className="week-header">
          {days.map((date, index) => (
            <div
              key={index}
              className={`
                week-day-header
                ${isToday(date) ? 'today' : ''}
                ${isSelected(date) ? 'selected' : ''}
              `}
              onClick={() => {
                setCurrentDate(date);
                if (viewMode === 'week') {
                  setViewMode('day');
                }
              }}
            >
              <div className="week-day-name">{dayNames[date.getDay()]}</div>
              <div className="week-day-number">{date.getDate()}</div>
            </div>
          ))}
        </div>
        
        <div className="week-body">
          {days.map((date, dayIndex) => {
            const dateKey = formatDateKey(date);
            const dayEvents = events[dateKey] || [];
            
            return (
              <div key={dayIndex} className="week-day-column">
                <div 
                  className="week-day-content"
                  onClick={() => handleDateClick(date)}
                >
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className="week-event"
                      style={{ backgroundColor: EVENT_COLORS[event.type] }}
                      onClick={(e) => handleEventClick(e, event, date)}
                    >
                      <div className="event-time">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </div>
                      <div className="event-title">{event.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 일간 뷰 렌더링
  const renderDayView = () => {
    const dateKey = formatDateKey(currentDate);
    const dayEvents = events[dateKey] || [];
    const timeSlots = generateTimeSlots();
    
    return (
      <div className="day-view">
        <div className="day-header">
          <h3>
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 {currentDate.getDate()}일 
            {fullDayNames[currentDate.getDay()]}
          </h3>
          {isToday(currentDate) && <span className="today-badge">오늘</span>}
        </div>
        
        <div className="day-timeline">
          <div className="timeline-hours">
            {timeSlots.map((time, index) => {
              const hourEvents = dayEvents.filter(event => 
                event.startTime.startsWith(time.split(':')[0])
              );
              
              return (
                <div key={index} className="timeline-hour-column">
                  <div className="timeline-hour-header">
                    {time}
                  </div>
                  <div 
                    className="timeline-hour-content" 
                    onClick={() => handleTimeClick(currentDate, time)}
                  >
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className="timeline-event"
                        style={{ backgroundColor: EVENT_COLORS[event.type] }}
                        onClick={(e) => handleEventClick(e, event, currentDate)}
                      >
                        <div className="event-header">
                          <span className="event-time">
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </span>
                          <button
                            className="event-delete"
                            onClick={(e) => handleEventDelete(e, event.id, dateKey)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="event-title">{event.title}</div>
                        {event.description && (
                          <div className="event-description">{event.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 연간 뷰 렌더링
  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [];
    
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const days = [];
      
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateKey = formatDateKey(date);
        const hasEvents = events[dateKey] && events[dateKey].length > 0;
        
        days.push({
          date,
          day,
          hasEvents,
          isToday: isToday(date)
        });
      }
      
      months.push({ month, name: monthNames[month], days });
    }
    
    return (
      <div className="year-view">
        {months.map(({ month, name, days }) => (
          <div key={month} className="year-month">
            <h4>{name}</h4>
            <div className="year-month-grid">
              {days.map(({ date, day, hasEvents, isToday: today }) => (
                <div
                  key={day}
                  className={`
                    year-day
                    ${today ? 'today' : ''}
                    ${hasEvents ? 'has-events' : ''}
                    ${!readOnly ? 'clickable' : ''}
                  `}
                  onClick={() => {
                    setCurrentDate(date);
                    setViewMode('day');
                  }}
                  title={hasEvents ? '일정 있음' : ''}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 아젠다 뷰 렌더링
  const renderAgendaView = () => {
    const agendaEvents = generateAgendaEvents();
    const groupedEvents = {};
    
    agendaEvents.forEach(event => {
      const dateKey = formatDateKey(event.date);
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });
    
    return (
      <div className="agenda-view">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="no-events">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="no-events-icon">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
              <path d="M16 24C16 19.5817 19.5817 16 24 16C28.4183 16 32 19.5817 32 24C32 28.4183 28.4183 32 24 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="2" fill="currentColor"/>
            </svg>
            <p>예정된 일정이 없습니다</p>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([dateKey, dayEvents]) => {
            const date = new Date(dateKey);
            const isToday = formatDateKey(new Date()) === dateKey;
            
            return (
              <div key={dateKey} className={`agenda-day ${isToday ? 'today' : ''}`}>
                <div className="agenda-date">
                  <div className="agenda-date-number">{date.getDate()}</div>
                  <div className="agenda-date-info">
                    <div className="agenda-date-month">{monthNames[date.getMonth()]}</div>
                    <div className="agenda-date-weekday">{fullDayNames[date.getDay()]}</div>
                  </div>
                </div>
                
                <div className="agenda-events">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className="agenda-event"
                      onClick={(e) => handleEventClick(e, event, date)}
                    >
                      <div
                        className="agenda-event-marker"
                        style={{ backgroundColor: EVENT_COLORS[event.type] }}
                      />
                      <div className="agenda-event-content">
                        <div className="agenda-event-header">
                          <span className="agenda-event-time">
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </span>
                          <span className="agenda-event-type">{event.type}</span>
                        </div>
                        <div className="agenda-event-title">{event.title}</div>
                        {event.description && (
                          <div className="agenda-event-description">{event.description}</div>
                        )}
                      </div>
                      {!readOnly && (
                        <button
                          className="agenda-event-delete"
                          onClick={(e) => handleEventDelete(e, event.id, dateKey)}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // 뷰 타이틀 생성
  const getViewTitle = () => {
    switch (viewMode) {
      case 'day':
        return `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}일`;
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`;
      case 'month':
        return `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`;
      case 'year':
        return `${currentDate.getFullYear()}년`;
      case 'agenda':
        return '일정 목록';
      default:
        return '';
    }
  };

  return (
    <div className="calendar-block-enhanced group" ref={calendarRef}>
      <div className="calendar-container">
        {/* 헤더 */}
        <div className="calendar-header">
          <div className="calendar-nav">
            <button
              className="nav-button"
              onClick={() => navigate(-1)}
              title="이전"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <h2 className="calendar-title">
              {getViewTitle()}
            </h2>
            
            <button
              className="nav-button"
              onClick={() => navigate(1)}
              title="다음"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="calendar-actions">
            <button
              className="today-button"
              onClick={goToToday}
              title="오늘로 이동"
            >
              오늘
            </button>
            
            <div className="view-mode-selector">
              <button
                className={`view-button ${viewMode === 'day' ? 'active' : ''}`}
                onClick={() => setViewMode('day')}
                title="일간 보기"
              >
                일
              </button>
              <button
                className={`view-button ${viewMode === 'week' ? 'active' : ''}`}
                onClick={() => setViewMode('week')}
                title="주간 보기"
              >
                주
              </button>
              <button
                className={`view-button ${viewMode === 'month' ? 'active' : ''}`}
                onClick={() => setViewMode('month')}
                title="월간 보기"
              >
                월
              </button>
              <button
                className={`view-button ${viewMode === 'year' ? 'active' : ''}`}
                onClick={() => setViewMode('year')}
                title="연간 보기"
              >
                년
              </button>
              <button
                className={`view-button ${viewMode === 'agenda' ? 'active' : ''}`}
                onClick={() => setViewMode('agenda')}
                title="일정 목록"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* 미니 캘린더 토글 버튼 (월간/연간 뷰가 아닐 때) */}
            {viewMode !== 'month' && viewMode !== 'year' && (
              <button
                className={`mini-calendar-toggle ${showMiniCalendar ? 'active' : ''}`}
                onClick={() => setShowMiniCalendar(!showMiniCalendar)}
                title="미니 캘린더"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3h10v10H3V3zm0 4h10M7 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}

            {!readOnly && (
              <button
                className="add-event-button"
                onClick={() => {
                  setSelectedDate(new Date());
                  setSelectedEvent(null);
                  setSelectedTime(null);
                  setShowEventModal(true);
                }}
                title="일정 추가"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 캘린더 본체 */}
        <div className={`calendar-body ${isTransitioning ? 'transitioning' : ''}`}>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'year' && renderYearView()}
          {viewMode === 'agenda' && renderAgendaView()}
        </div>

        {/* 미니 캘린더 (월간 뷰가 아닐 때) */}
        {viewMode !== 'month' && viewMode !== 'year' && showMiniCalendar && (
          <div className="mini-calendar">
            <div className="mini-calendar-header">
              <button onClick={() => setViewMode('month')}>
                {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
              </button>
              <button 
                className="mini-calendar-close"
                onClick={() => setShowMiniCalendar(false)}
                title="닫기"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="mini-calendar-body">
              {generateCalendarDays().map((date, index) => {
                const dateKey = formatDateKey(date);
                const hasEvents = events[dateKey] && events[dateKey].length > 0;
                
                return (
                  <div
                    key={index}
                    className={`
                      mini-day
                      ${!isSameMonth(date) ? 'other-month' : ''}
                      ${isToday(date) ? 'today' : ''}
                      ${hasEvents ? 'has-events' : ''}
                    `}
                    onClick={() => {
                      setCurrentDate(date);
                      setShowMiniCalendar(false); // 날짜 선택 시 모달 닫기
                      if (viewMode === 'agenda') {
                        setViewMode('day');
                      }
                    }}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 이벤트 모달 */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
          setSelectedDate(null);
          setHoveredDate(null);
          setSelectedTime(null);
        }}
        onSave={handleEventSave}
        event={selectedEvent}
        date={selectedDate}
        selectedTime={selectedTime}
        readOnly={readOnly}
      />
    </div>
  );
};

export default CalendarBlock;