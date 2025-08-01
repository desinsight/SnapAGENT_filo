// 캘린더 관리 훅
import { useState, useCallback, useEffect } from 'react';
import { CALENDAR_CONFIG } from '../constants/calendarConfig';
import { generateCalendarColor } from '../utils/calendarHelpers';

const useCalendar = () => {
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 모크 데이터 (추후 API 연동시 제거)
  const mockCalendars = [
    {
      id: 'calendar-1',
      name: '개인 일정',
      description: '개인적인 일정들',
      color: '#3B82F6',
      ownerId: 'user-1',
      isVisible: true,
      isDefault: true,
      permissions: ['view', 'create', 'edit', 'delete'],
      sharedWith: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'calendar-2',
      name: '업무 일정',
      description: '회사 업무 관련 일정',
      color: '#10B981',
      ownerId: 'user-1',
      isVisible: true,
      isDefault: false,
      permissions: ['view', 'create', 'edit'],
      sharedWith: [
        { userId: 'user-2', role: 'editor', addedAt: new Date('2024-01-15') }
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'calendar-3',
      name: '팀 일정',
      description: '팀 공유 일정',
      color: '#F59E0B',
      ownerId: 'user-2',
      isVisible: true,
      isDefault: false,
      permissions: ['view', 'create'],
      sharedWith: [
        { userId: 'user-1', role: 'editor', addedAt: new Date('2024-01-10') }
      ],
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-20')
    }
  ];

  // 캘린더 목록 로드
  const loadCalendars = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API 호출로 대체
      // const response = await fetch('/api/calendars');
      // const data = await response.json();
      
      // 모크 데이터 사용
      await new Promise(resolve => setTimeout(resolve, 500)); // 로딩 시뮤레이션
      setCalendars(mockCalendars);
      
      // 기본 선택 캘린더 설정
      const defaultSelected = mockCalendars
        .filter(cal => cal.isVisible)
        .map(cal => cal.id);
      setSelectedCalendars(defaultSelected);
      
    } catch (err) {
      setError('캘린더 목록을 불러오는 데 실패했습니다.');
      console.error('캘린더 로드 오류:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 캘린더 토글
  const toggleCalendar = useCallback((calendarId) => {
    setSelectedCalendars(prev => {
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId);
      } else {
        return [...prev, calendarId];
      }
    });
  }, []);

  // 캘린더 생성
  const createCalendar = useCallback(async (calendarData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API 호출로 대체
      // const response = await fetch('/api/calendars', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(calendarData)
      // });
      // const newCalendar = await response.json();
      
      const newCalendar = {
        id: `calendar-${Date.now()}`,
        ...calendarData,
        color: calendarData.color || generateCalendarColor(calendars.length),
        ownerId: 'user-1',
        isVisible: true,
        permissions: ['view', 'create', 'edit', 'delete'],
        sharedWith: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCalendars(prev => [...prev, newCalendar]);
      setSelectedCalendars(prev => [...prev, newCalendar.id]);
      
      return newCalendar;
      
    } catch (err) {
      setError('캘린더 생성에 실패했습니다.');
      console.error('캘린더 생성 오류:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [calendars.length]);

  // 캘린더 수정
  const updateCalendar = useCallback(async (calendarId, updates) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API 호출로 대체
      // const response = await fetch(`/api/calendars/${calendarId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
      // const updatedCalendar = await response.json();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCalendars(prev => prev.map(cal => 
        cal.id === calendarId 
          ? { ...cal, ...updates, updatedAt: new Date() }
          : cal
      ));
      
    } catch (err) {
      setError('캘린더 수정에 실패했습니다.');
      console.error('캘린더 수정 오류:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 캘린더 삭제
  const deleteCalendar = useCallback(async (calendarId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API 호출로 대체
      // await fetch(`/api/calendars/${calendarId}`, { method: 'DELETE' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCalendars(prev => prev.filter(cal => cal.id !== calendarId));
      setSelectedCalendars(prev => prev.filter(id => id !== calendarId));
      
    } catch (err) {
      setError('캘린더 삭제에 실패했습니다.');
      console.error('캘린더 삭제 오류:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 캘린더 공유
  const shareCalendar = useCallback(async (calendarId, shareData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API 호출로 대체
      // await fetch(`/api/calendars/${calendarId}/share`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(shareData)
      // });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCalendars(prev => prev.map(cal => {
        if (cal.id === calendarId) {
          return {
            ...cal,
            sharedWith: [...cal.sharedWith, {
              ...shareData,
              addedAt: new Date()
            }],
            updatedAt: new Date()
          };
        }
        return cal;
      }));
      
    } catch (err) {
      setError('캘린더 공유에 실패했습니다.');
      console.error('캘린더 공유 오류:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 캘린더 가져오기 (ID로)
  const getCalendar = useCallback((calendarId) => {
    return calendars.find(cal => cal.id === calendarId);
  }, [calendars]);

  // 선택된 캘린더들 가져오기
  const getSelectedCalendars = useCallback(() => {
    return calendars.filter(cal => selectedCalendars.includes(cal.id));
  }, [calendars, selectedCalendars]);

  // 기본 캘린더 가져오기
  const getDefaultCalendar = useCallback(() => {
    return calendars.find(cal => cal.isDefault) || calendars[0];
  }, [calendars]);

  // 모든 캘린더 선택/해제
  const selectAllCalendars = useCallback(() => {
    setSelectedCalendars(calendars.map(cal => cal.id));
  }, [calendars]);

  const deselectAllCalendars = useCallback(() => {
    setSelectedCalendars([]);
  }, []);

  // 캘린더 선택 상태 확인
  const isCalendarSelected = useCallback((calendarId) => {
    return selectedCalendars.includes(calendarId);
  }, [selectedCalendars]);

  // 캘린더 가시성 토글
  const toggleCalendarVisibility = useCallback(async (calendarId, isVisible) => {
    await updateCalendar(calendarId, { isVisible });
    
    if (!isVisible) {
      // 비가시 상태로 만들면 선택에서도 제거
      setSelectedCalendars(prev => prev.filter(id => id !== calendarId));
    }
  }, [updateCalendar]);

  // 로컬 저장소에 선택 상태 저장
  useEffect(() => {
    if (selectedCalendars.length > 0) {
      localStorage.setItem('selectedCalendars', JSON.stringify(selectedCalendars));
    }
  }, [selectedCalendars]);

  // 로컬 저장소에서 선택 상태 복원
  useEffect(() => {
    const saved = localStorage.getItem('selectedCalendars');
    if (saved && calendars.length > 0) {
      try {
        const savedSelected = JSON.parse(saved);
        const validSelected = savedSelected.filter(id => 
          calendars.some(cal => cal.id === id)
        );
        if (validSelected.length > 0) {
          setSelectedCalendars(validSelected);
        }
      } catch (err) {
        console.error('저장된 캘린더 선택 상태 복원 실패:', err);
      }
    }
  }, [calendars]);

  return {
    // 상태
    calendars,
    selectedCalendars,
    isLoading,
    error,
    
    // 액션
    loadCalendars,
    toggleCalendar,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    shareCalendar,
    
    // 유틸리티
    getCalendar,
    getSelectedCalendars,
    getDefaultCalendar,
    selectAllCalendars,
    deselectAllCalendars,
    isCalendarSelected,
    toggleCalendarVisibility
  };
};

export default useCalendar;