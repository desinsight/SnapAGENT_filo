// 캘린더 관련 유틸리티 함수
import { CALENDAR_CONFIG } from '../constants/calendarConfig';
import { formatDate, isSameDay, isDateInRange } from './dateHelpers';

// 이벤트 배경색 생성
export const getEventBackgroundColor = (event, opacity = 1) => {
  const calendar = event.calendar || {};
  const baseColor = calendar.color || CALENDAR_CONFIG.COLOR_PALETTE[0];
  
  // 우선순위에 따른 색상 조정
  let color = baseColor;
  if (event.priority === 'urgent' || event.priority === 'critical') {
    color = '#EF4444'; // 빨간색
  } else if (event.priority === 'high') {
    color = '#F59E0B'; // 주황색
  }
  
  // 전체 일정인 경우 더 연한 색상
  if (event.allDay) {
    opacity = Math.min(opacity, 0.8);
  }
  
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// 이벤트 텍스트 색상 생성
export const getEventTextColor = (backgroundColor) => {
  // 배경색의 밝기를 계산하여 텍스트 색상 결정
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

// 이벤트 충돌 검사
export const detectEventConflicts = (events, newEvent) => {
  const conflicts = [];
  
  events.forEach(event => {
    if (event.id === newEvent.id) return; // 자기 자신 제외
    
    // 전체 일정 처리
    if (event.allDay && newEvent.allDay) {
      if (isSameDay(event.start, newEvent.start)) {
        conflicts.push(event);
      }
      return;
    }
    
    // 시간 겹침 검사
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const newStart = new Date(newEvent.start);
    const newEnd = new Date(newEvent.end);
    
    if ((newStart < eventEnd && newEnd > eventStart)) {
      conflicts.push(event);
    }
  });
  
  return conflicts;
};

// 이벤트 정렬
export const sortEvents = (events, sortBy = 'start', direction = 'asc') => {
  return [...events].sort((a, b) => {
    let valueA = a[sortBy];
    let valueB = b[sortBy];
    
    // 날짜 비교
    if (sortBy === 'start' || sortBy === 'end') {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }
    
    // 우선순위 비교
    if (sortBy === 'priority') {
      const priorityOrder = { critical: 5, urgent: 4, high: 3, normal: 2, low: 1 };
      valueA = priorityOrder[valueA] || 1;
      valueB = priorityOrder[valueB] || 1;
    }
    
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// 이벤트 필터링
export const filterEvents = (events, filters) => {
  return events.filter(event => {
    // 캘린더 필터
    if (filters.calendars && filters.calendars.length > 0) {
      if (!filters.calendars.includes(event.calendarId)) return false;
    }
    
    // 날짜 범위 필터
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      if (!isDateInRange(event.start, start, end)) return false;
    }
    
    // 우선순위 필터
    if (filters.priorities && filters.priorities.length > 0) {
      if (!filters.priorities.includes(event.priority)) return false;
    }
    
    // 태그 필터
    if (filters.tags && filters.tags.length > 0) {
      const eventTags = event.tags || [];
      if (!filters.tags.some(tag => eventTags.includes(tag))) return false;
    }
    
    // 카테고리 필터
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(event.category)) return false;
    }
    
    // 참석자 필터
    if (filters.attendees && filters.attendees.length > 0) {
      const eventAttendees = event.attendees || [];
      const attendeeEmails = eventAttendees.map(a => a.email);
      if (!filters.attendees.some(email => attendeeEmails.includes(email))) return false;
    }
    
    // 상태 필터
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(event.status)) return false;
    }
    
    return true;
  });
};

// 이벤트 검색
export const searchEvents = (events, query) => {
  if (!query || query.trim() === '') return events;
  
  const searchTerm = query.toLowerCase().trim();
  
  return events.filter(event => {
    // 제목에서 검색
    if (event.title && event.title.toLowerCase().includes(searchTerm)) return true;
    
    // 설명에서 검색
    if (event.description && event.description.toLowerCase().includes(searchTerm)) return true;
    
    // 위치에서 검색
    if (event.location && event.location.name && 
        event.location.name.toLowerCase().includes(searchTerm)) return true;
    
    // 참석자에서 검색
    if (event.attendees && event.attendees.some(attendee => 
        attendee.name && attendee.name.toLowerCase().includes(searchTerm) ||
        attendee.email && attendee.email.toLowerCase().includes(searchTerm)
    )) return true;
    
    // 태그에서 검색
    if (event.tags && event.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm)
    )) return true;
    
    return false;
  });
};

// 이벤트 그룹화 (날짜별)
export const groupEventsByDate = (events) => {
  const grouped = {};
  
  events.forEach(event => {
    const dateKey = formatDate(event.start, 'YYYY-MM-DD');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });
  
  // 각 날짜의 이벤트를 시간 순으로 정렬
  Object.keys(grouped).forEach(date => {
    grouped[date] = sortEvents(grouped[date], 'start', 'asc');
  });
  
  return grouped;
};

// 캘린더 반복 하영 처리
export const generateRecurrenceEvents = (baseEvent, recurrence, endDate) => {
  const events = [];
  const start = new Date(baseEvent.start);
  const eventDuration = new Date(baseEvent.end) - new Date(baseEvent.start);
  
  let currentDate = new Date(start);
  const maxDate = endDate ? new Date(endDate) : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
  
  while (currentDate <= maxDate && events.length < 100) { // 최대 100개 제한
    const eventStart = new Date(currentDate);
    const eventEnd = new Date(eventStart.getTime() + eventDuration);
    
    events.push({
      ...baseEvent,
      id: `${baseEvent.id}_${formatDate(eventStart, 'YYYY-MM-DD')}`,
      start: eventStart,
      end: eventEnd,
      isRecurring: true,
      originalEventId: baseEvent.id
    });
    
    // 다음 반복 일자 계산
    switch (recurrence.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + (recurrence.interval || 1));
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * (recurrence.interval || 1));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + (recurrence.interval || 1));
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + (recurrence.interval || 1));
        break;
      default:
        return events;
    }
  }
  
  return events;
};

// 이벤트 지속 시간 계산
export const getEventDuration = (event) => {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const durationMs = end - start;
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes}분`;
  } else if (minutes === 0) {
    return `${hours}시간`;
  } else {
    return `${hours}시간 ${minutes}분`;
  }
};

// 이벤트 상태 라벨 및 색상
export const getEventStatusInfo = (event) => {
  const statusConfig = {
    confirmed: { label: '확정', color: '#10B981', bgColor: '#ECFDF5' },
    tentative: { label: '임시', color: '#F59E0B', bgColor: '#FFFBEB' },
    cancelled: { label: '취소', color: '#EF4444', bgColor: '#FEF2F2' },
    pending: { label: '대기', color: '#6B7280', bgColor: '#F9FAFB' }
  };
  
  return statusConfig[event.status] || statusConfig.pending;
};

// 이벤트 우선순위 라벨 및 색상
export const getEventPriorityInfo = (event) => {
  const priorityConfig = {
    critical: { label: '매우 중요', color: '#DC2626', bgColor: '#FEF2F2' },
    urgent: { label: '긴급', color: '#EA580C', bgColor: '#FFF7ED' },
    high: { label: '높음', color: '#D97706', bgColor: '#FFFBEB' },
    normal: { label: '보통', color: '#059669', bgColor: '#ECFDF5' },
    low: { label: '낮음', color: '#6B7280', bgColor: '#F9FAFB' }
  };
  
  return priorityConfig[event.priority] || priorityConfig.normal;
};

// 캘린더 공유 권한 확인
export const hasCalendarPermission = (calendar, userId, permission) => {
  // 소유자인 경우 모든 권한
  if (calendar.ownerId === userId) return true;
  
  // 공유 권한 확인
  const userPermission = calendar.sharedWith?.find(share => share.userId === userId);
  if (!userPermission) return false;
  
  const permissionLevels = {
    view: 1,
    create: 2,
    edit: 3,
    delete: 4,
    manage: 5,
    admin: 6
  };
  
  const userLevel = permissionLevels[userPermission.role] || 0;
  const requiredLevel = permissionLevels[permission] || 0;
  
  return userLevel >= requiredLevel;
};

// 이벤트 알림 시간 계산
export const calculateReminderTimes = (event, reminders) => {
  const eventStart = new Date(event.start);
  
  return reminders.map(reminder => {
    const reminderTime = new Date(eventStart.getTime() - reminder.minutes * 60 * 1000);
    return {
      ...reminder,
      time: reminderTime,
      timeString: formatDate(reminderTime, 'YYYY-MM-DD HH:mm')
    };
  });
};

// 이벤트 참석자 통계
export const getAttendeeStats = (attendees) => {
  const stats = {
    total: attendees.length,
    accepted: 0,
    declined: 0,
    tentative: 0,
    pending: 0
  };
  
  attendees.forEach(attendee => {
    stats[attendee.status] = (stats[attendee.status] || 0) + 1;
  });
  
  return stats;
};

// 캘린더 색상 생성
export const generateCalendarColor = (index) => {
  return CALENDAR_CONFIG.COLOR_PALETTE[index % CALENDAR_CONFIG.COLOR_PALETTE.length];
};

// 이벤트 요약 생성
export const generateEventSummary = (event) => {
  const parts = [];
  
  if (event.title) parts.push(event.title);
  if (event.location?.name) parts.push(`@ ${event.location.name}`);
  if (event.attendees?.length > 0) parts.push(`참석자 ${event.attendees.length}명`);
  
  return parts.join(' • ');
};

// 대용량 데이터 처리를 위한 가상화 도우미
export const getVisibleEvents = (events, viewType, currentDate, viewportStart, viewportEnd) => {
  // 보이는 날짜 범위에 있는 이벤트만 필터링
  return events.filter(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    return (eventStart <= viewportEnd && eventEnd >= viewportStart);
  });
};

// 이벤트 드래그 가능 여부 확인
export const canDragEvent = (event, calendar, userId) => {
  if (!calendar) return false;
  
  // 캘린더 편집 권한 확인
  if (!hasCalendarPermission(calendar, userId, 'edit')) return false;
  
  // 반복 이벤트의 경우 제한
  if (event.isRecurring && !event.canEditSingle) return false;
  
  // 종료된 이벤트는 드래그 불가
  if (event.end && new Date(event.end) < new Date()) return false;
  
  return true;
};