// 캘린더 이벤트 관리 훅
import { useState, useCallback, useEffect, useMemo } from 'react';
import { CALENDAR_CONFIG } from '../constants/calendarConfig';
import { 
  filterEvents, 
  searchEvents, 
  sortEvents, 
  generateRecurrenceEvents,
  detectEventConflicts
} from '../utils/calendarHelpers';
import { formatDate, addDays, getDatesInRange } from '../utils/dateHelpers';

const useCalendarEvents = (selectedCalendars = []) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    calendars: [],
    dateRange: null,
    priorities: [],
    tags: [],
    categories: [],
    attendees: [],
    status: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    field: 'start',
    direction: 'asc'
  });

  // 모크 데이터 (추후 API 연동시 제거)
  const mockEvents = [
    {
      id: 'event-1',
      calendarId: 'calendar-1',
      title: '오늘 회의',
      description: '주간 팀 미팅',
      start: new Date(2024, 6, 8, 10, 0), // 2024-07-08 10:00
      end: new Date(2024, 6, 8, 11, 0),   // 2024-07-08 11:00
      allDay: false,
      location: {
        name: '회의실 A',
        address: '서울시 강남구',
        latitude: 37.5665,
        longitude: 126.9780
      },
      attendees: [
        { id: 'att-1', name: '김민수', email: 'kim@company.com', status: 'accepted', role: 'organizer' },
        { id: 'att-2', name: '이영희', email: 'lee@company.com', status: 'pending', role: 'attendee' }
      ],
      reminders: [
        { id: 'rem-1', type: 'email', minutes: 30, isEnabled: true },
        { id: 'rem-2', type: 'push', minutes: 10, isEnabled: true }
      ],
      priority: 'high',
      status: 'confirmed',
      tags: ['work', 'meeting'],
      category: 'business',
      attachments: [],
      createdBy: 'user-1',
      createdAt: new Date('2024-07-01'),
      updatedAt: new Date('2024-07-05')
    },
    {
      id: 'event-2',
      calendarId: 'calendar-1',
      title: '치과 예약',
      description: '스케일링 및 검진',
      start: new Date(2024, 6, 9, 14, 30),
      end: new Date(2024, 6, 9, 15, 30),
      allDay: false,
      location: {
        name: '스마일 치과',
        address: '서울시 서초구'
      },
      attendees: [],
      reminders: [
        { id: 'rem-3', type: 'push', minutes: 60, isEnabled: true }
      ],
      priority: 'normal',
      status: 'confirmed',
      tags: ['personal', 'health'],
      category: 'health',
      attachments: [],
      createdBy: 'user-1',
      createdAt: new Date('2024-06-20'),
      updatedAt: new Date('2024-06-20')
    },
    {
      id: 'event-3',
      calendarId: 'calendar-2',
      title: '프로젝트 마감일',
      description: 'Q3 프로젝트 최종 제출',
      start: new Date(2024, 6, 10, 0, 0),
      end: new Date(2024, 6, 10, 23, 59),
      allDay: true,
      location: null,
      attendees: [
        { id: 'att-3', name: '박지우', email: 'park@company.com', status: 'accepted', role: 'attendee' },
        { id: 'att-4', name: '정은영', email: 'jung@company.com', status: 'accepted', role: 'attendee' }
      ],
      reminders: [
        { id: 'rem-4', type: 'email', minutes: 1440, isEnabled: true }, // 24시간 전
        { id: 'rem-5', type: 'push', minutes: 60, isEnabled: true }
      ],
      priority: 'urgent',
      status: 'confirmed',
      tags: ['work', 'deadline', 'project'],
      category: 'business',
      attachments: [],
      createdBy: 'user-1',
      createdAt: new Date('2024-05-15'),
      updatedAt: new Date('2024-07-01')
    },
    {
      id: 'event-4',
      calendarId: 'calendar-3',
      title: '월간 팀 빌딩',
      description: '팀 워크샵 및 식사',
      start: new Date(2024, 6, 12, 9, 0),
      end: new Date(2024, 6, 12, 18, 0),
      allDay: false,
      location: {
        name: '연수원',
        address: '경기도 가평시'
      },
      attendees: [
        { id: 'att-5', name: '전체 팀원', email: 'team@company.com', status: 'pending', role: 'attendee' }
      ],
      reminders: [
        { id: 'rem-6', type: 'email', minutes: 2880, isEnabled: true } // 2일 전
      ],
      priority: 'normal',
      status: 'tentative',
      tags: ['team', 'workshop', 'training'],
      category: 'team',
      attachments: [],
      recurrence: {
        frequency: 'monthly',
        interval: 1,
        endDate: new Date('2024-12-31')
      },
      createdBy: 'user-2',
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-06-15')
    }
  ];

  // 이벤트 로드
  const loadEvents = useCallback(async (dateRange = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API 호출로 대체
      // const params = new URLSearchParams();
      // if (dateRange) {
      //   params.append('start', dateRange.start.toISOString());
      //   params.append('end', dateRange.end.toISOString());
      // }
      // if (selectedCalendars.length > 0) {
      //   params.append('calendars', selectedCalendars.join(','));
      // }
      // const response = await fetch(`/api/events?${params}`);
      // const data = await response.json();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 반복 이벤트 처리
      let allEvents = [...mockEvents];
      
      mockEvents.forEach(event => {
        if (event.recurrence) {
          const recurringEvents = generateRecurrenceEvents(
            event, 
            event.recurrence, 
            event.recurrence.endDate
          );
          allEvents = allEvents.concat(recurringEvents.slice(1)); // 첫 번째는 원본이므로 제외
        }
      });
      
      setEvents(allEvents);
      
    } catch (err) {
      setError('이벤트를 불러오는 데 실패했습니다.');
      console.error('이벤트 로드 오류:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCalendars]);

  // 이벤트 생성
  const createEvent = useCallback(async (eventData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 충돌 검사
      const conflicts = detectEventConflicts(events, eventData);
      if (conflicts.length > 0) {
        const confirmCreate = window.confirm(
          `다른 일정과 충돌이 발생했습니다. (${conflicts.length}개) 그래도 생성하시겠습니까?`
        );
        if (!confirmCreate) {
          setIsLoading(false);
          return { conflicts };
        }
      }
      
      // TODO: API 호출로 대체
      // const response = await fetch('/api/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(eventData)
      // });
      // const newEvent = await response.json();
      
      const newEvent = {
        id: `event-${Date.now()}`,
        ...eventData,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setEvents(prev => [...prev, newEvent]);
      
      return newEvent;
      
    } catch (err) {
      setError('이벤트 생성에 실패했습니다.');
      console.error('이벤트 생성 오류:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [events]);

  // 이벤트 수정
  const updateEvent = useCallback(async (eventId, updates) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API 호출로 대체
      // const response = await fetch(`/api/events/${eventId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
      // const updatedEvent = await response.json();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, ...updates, updatedAt: new Date() }
          : event
      ));
      
    } catch (err) {
      setError('이벤트 수정에 실패했습니다.');
      console.error('이벤트 수정 오류:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 이벤트 삭제
  const deleteEvent = useCallback(async (eventId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API 호출로 대체
      // await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
    } catch (err) {
      setError('이벤트 삭제에 실패했습니다.');
      console.error('이벤트 삭제 오류:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 이벤트 복사
  const duplicateEvent = useCallback(async (eventId, newDate = null) => {
    const originalEvent = events.find(e => e.id === eventId);
    if (!originalEvent) return;
    
    const eventData = {
      ...originalEvent,
      title: `${originalEvent.title} (복사본)`,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined
    };
    
    if (newDate) {
      const duration = new Date(originalEvent.end) - new Date(originalEvent.start);
      eventData.start = new Date(newDate);
      eventData.end = new Date(newDate.getTime() + duration);
    }
    
    return await createEvent(eventData);
  }, [events, createEvent]);

  // 필터링된 이벤트 (메모이제이션으로 성능 최적화)
  const filteredEvents = useMemo(() => {
    let result = events;
    
    // 선택된 캘린더 필터
    if (selectedCalendars.length > 0) {
      result = result.filter(event => selectedCalendars.includes(event.calendarId));
    }
    
    // 추가 필터 적용
    result = filterEvents(result, filters);
    
    // 검색 적용
    if (searchQuery.trim()) {
      result = searchEvents(result, searchQuery);
    }
    
    // 정렬 적용
    result = sortEvents(result, sortConfig.field, sortConfig.direction);
    
    return result;
  }, [events, selectedCalendars, filters, searchQuery, sortConfig]);

  // 필터 업데이트
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // 정렬 업데이트
  const updateSort = useCallback((field, direction = 'asc') => {
    setSortConfig({ field, direction });
  }, []);

  // 필터 초기화
  const clearFilters = useCallback(() => {
    setFilters({
      calendars: [],
      dateRange: null,
      priorities: [],
      tags: [],
      categories: [],
      attendees: [],
      status: []
    });
    setSearchQuery('');
  }, []);

  // 이벤트 가져오기 (ID로)
  const getEvent = useCallback((eventId) => {
    return events.find(event => event.id === eventId);
  }, [events]);

  // 날짜별 이벤트 가져오기
  const getEventsByDate = useCallback((date) => {
    const dateStr = formatDate(date, 'YYYY-MM-DD');
    return filteredEvents.filter(event => {
      const eventDateStr = formatDate(event.start, 'YYYY-MM-DD');
      return eventDateStr === dateStr;
    });
  }, [filteredEvents]);

  // 날짜 범위별 이벤트 가져오기
  const getEventsInRange = useCallback((startDate, endDate) => {
    return filteredEvents.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (eventStart <= endDate && eventEnd >= startDate);
    });
  }, [filteredEvents]);

  // 충돌 검사
  const checkConflicts = useCallback((eventData) => {
    return detectEventConflicts(events, eventData);
  }, [events]);

  // 이벤트 통계
  const getEventStats = useCallback(() => {
    const stats = {
      total: filteredEvents.length,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byPriority: {},
      byStatus: {},
      byCalendar: {}
    };
    
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    filteredEvents.forEach(event => {
      const eventDate = new Date(event.start);
      
      // 오늘
      if (formatDate(eventDate, 'YYYY-MM-DD') === formatDate(today, 'YYYY-MM-DD')) {
        stats.today++;
      }
      
      // 이번 주
      if (eventDate >= weekStart) {
        stats.thisWeek++;
      }
      
      // 이번 달
      if (eventDate >= monthStart) {
        stats.thisMonth++;
      }
      
      // 우선순위별
      stats.byPriority[event.priority] = (stats.byPriority[event.priority] || 0) + 1;
      
      // 상태별
      stats.byStatus[event.status] = (stats.byStatus[event.status] || 0) + 1;
      
      // 캘린더별
      stats.byCalendar[event.calendarId] = (stats.byCalendar[event.calendarId] || 0) + 1;
    });
    
    return stats;
  }, [filteredEvents]);

  // 초기 로드
  useEffect(() => {
    if (selectedCalendars.length > 0) {
      loadEvents();
    }
  }, [selectedCalendars]);

  return {
    // 상태
    events,
    filteredEvents,
    isLoading,
    error,
    filters,
    searchQuery,
    sortConfig,
    
    // 액션
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    
    // 필터 & 검색
    updateFilters,
    updateSort,
    clearFilters,
    setSearchQuery,
    
    // 유틸리티
    getEvent,
    getEventsByDate,
    getEventsInRange,
    checkConflicts,
    getEventStats
  };
};

export default useCalendarEvents;