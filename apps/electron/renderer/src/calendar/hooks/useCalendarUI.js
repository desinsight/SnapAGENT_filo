// 캘린더 UI 상태 관리 훅
import { useState, useCallback, useEffect, useMemo } from 'react';
import { CALENDAR_CONFIG, MODULE_CATEGORIES } from '../constants/calendarConfig';

const useCalendarUI = () => {
  const [notifications, setNotifications] = useState([]);
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(CALENDAR_CONFIG.DEFAULT_SETTINGS);

  // 모크 알림 데이터
  const mockNotifications = [
    {
      id: 'notif-1',
      title: '회의 10분 전',
      message: '"오늘 회의" 일정이 10분 후 시작됩니다.',
      type: 'event_reminder',
      priority: 'normal',
      channels: ['push', 'in_app'],
      sentAt: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
      read: false,
      actions: [
        { type: 'snooze', label: '10분 후 다시 알림' },
        { type: 'dismiss', label: '확인' }
      ],
      eventId: 'event-1'
    },
    {
      id: 'notif-2',
      title: '일정 변경 알림',
      message: '"팀 빌딩" 일정이 수정되었습니다.',
      type: 'event_update',
      priority: 'normal',
      channels: ['email', 'push'],
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
      read: false,
      actions: [
        { type: 'view', label: '일정 보기' },
        { type: 'dismiss', label: '확인' }
      ],
      eventId: 'event-4'
    },
    {
      id: 'notif-3',
      title: '시스템 점검 예정',
      message: '오늘 밤 12시부터 2시간 동안 시스템 점검이 예정되어 있습니다.',
      type: 'system_notice',
      priority: 'urgent',
      channels: ['email', 'push', 'in_app'],
      sentAt: new Date(Date.now() - 30 * 60 * 1000), // 30분 전
      read: false,
      actions: [
        { type: 'dismiss', label: '확인' }
      ],
      urgentNotice: {
        enabled: true,
        displayType: 'banner',
        backgroundColor: '#F59E0B',
        requireAcknowledgment: true
      }
    }
  ];

  // 모크 모듈 데이터 (ModulePanel format)
  const mockModules = [
    {
      id: 'business-meetings',
      name: '비즈니스 미팅',
      version: '1.2.0',
      category: 'business',
      description: '화상회의 연동, 회의실 예약, 참석자 관리 등 비즈니스 미팅에 특화된 기능을 제공합니다.',
      features: [
        'Zoom/Teams 연동',
        '회의실 자동 예약',
        '참석자 자동 초대',
        '회의록 템플릿',
        '반복 미팅 설정'
      ],
      developer: 'Calendar Pro',
      rating: 4.8,
      installed: true
    },
    {
      id: 'education-schedule',
      name: '교육 스케줄러',
      version: '2.1.0',
      category: 'education',
      description: '수업 시간표, 과제 관리, 시험 일정 등 교육 기관에서 필요한 일정 관리 기능을 제공합니다.',
      features: [
        '시간표 자동 생성',
        '과제 마감일 관리',
        '시험 일정 알림',
        '성적 관리 연동',
        '학부모 알림'
      ],
      developer: 'EduTech Solutions',
      rating: 4.6,
      installed: false
    },
    {
      id: 'healthcare-appointments',
      name: '의료 예약 관리',
      version: '1.5.0',
      category: 'healthcare',
      description: '환자 예약, 진료 일정, 처방전 관리 등 의료진을 위한 전문적인 일정 관리 시스템입니다.',
      features: [
        '환자 예약 시스템',
        '진료 기록 연동',
        '처방전 알림',
        '응급 상황 대응',
        'EMR 시스템 연동'
      ],
      developer: 'MedCal Inc.',
      rating: 4.9,
      installed: true
    },
    {
      id: 'personal-fitness',
      name: '개인 피트니스',
      version: '1.0.5',
      category: 'personal',
      description: '운동 계획, 식단 관리, 건강 목표 추적 등 개인 건강 관리를 위한 캘린더 모듈입니다.',
      features: [
        '운동 계획 수립',
        '식단 일정 관리',
        '건강 목표 추적',
        '웨어러블 연동',
        '진행상황 리포트'
      ],
      developer: 'FitLife Apps',
      rating: 4.3,
      installed: false
    },
    {
      id: 'integration-google',
      name: 'Google 워크스페이스',
      version: '3.0.0',
      category: 'integration',
      description: 'Google Calendar, Gmail, Drive 등 Google 서비스와의 완벽한 동기화를 제공합니다.',
      features: [
        'Google Calendar 동기화',
        'Gmail 일정 자동 추출',
        'Drive 파일 연결',
        'Meet 회의 생성',
        '실시간 동기화'
      ],
      developer: 'Google LLC',
      rating: 4.7,
      installed: true
    }
  ];

  // 알림 로드
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API 호출로 대체
      // const response = await fetch('/api/notifications');
      // const data = await response.json();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setNotifications(mockNotifications);
      
    } catch (err) {
      setError('알림을 불러오는 데 실패했습니다.');
      console.error('알림 로드 오류:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 모듈 로드
  const loadModules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API 호출로 대체
      // const response = await fetch('/api/modules');
      // const data = await response.json();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setModules(mockModules);
      
    } catch (err) {
      setError('모듈을 불러오는 데 실패했습니다.');
      console.error('모듈 로드 오류:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 알림 읽음 처리
  const markNotificationRead = useCallback(async (notificationId) => {
    try {
      // TODO: API 호출로 대체
      // await fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
      
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      ));
      
    } catch (err) {
      console.error('알림 읽음 처리 오류:', err);
    }
  }, []);

  // 모든 알림 읽음 처리
  const markAllNotificationsRead = useCallback(async () => {
    try {
      // TODO: API 호출로 대체
      // await fetch('/api/notifications/read-all', { method: 'PATCH' });
      
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      
    } catch (err) {
      console.error('모든 알림 읽음 처리 오류:', err);
    }
  }, []);

  // 알림 삭제
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      // TODO: API 호출로 대체
      // await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
    } catch (err) {
      console.error('알림 삭제 오류:', err);
    }
  }, []);

  // 모듈 토글
  const toggleModule = useCallback(async (moduleId) => {
    try {
      // TODO: API 호출로 대체
      // await fetch(`/api/modules/${moduleId}/toggle`, { method: 'PATCH' });
      
      setModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, installed: !module.installed }
          : module
      ));
      
    } catch (err) {
      console.error('모듈 토글 오류:', err);
    }
  }, []);

  // 모듈 설치
  const installModule = useCallback(async (moduleId) => {
    try {
      // TODO: API 호출로 대체
      // await fetch(`/api/modules/${moduleId}/install`, { method: 'POST' });
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // 설치 시뮤레이션
      
      setModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, installed: true }
          : module
      ));
      
    } catch (err) {
      console.error('모듈 설치 오류:', err);
      throw err;
    }
  }, []);

  // 모듈 제거
  const uninstallModule = useCallback(async (moduleId) => {
    try {
      // TODO: API 호출로 대체
      // await fetch(`/api/modules/${moduleId}/uninstall`, { method: 'POST' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, installed: false }
          : module
      ));
      
    } catch (err) {
      console.error('모듈 제거 오류:', err);
      throw err;
    }
  }, []);

  // 설정 업데이트
  const updateSettings = useCallback(async (newSettings) => {
    try {
      // TODO: API 호출로 대체
      // await fetch('/api/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newSettings)
      // });
      
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      // 로컬 저장소에 저장
      localStorage.setItem('calendarSettings', JSON.stringify({ ...settings, ...newSettings }));
      
    } catch (err) {
      console.error('설정 업데이트 오류:', err);
      throw err;
    }
  }, [settings]);

  // 긴급 공지 필터링
  const urgentNotices = useMemo(() => {
    return notifications.filter(notif => 
      notif.priority === 'urgent' && 
      !notif.read &&
      notif.urgentNotice?.enabled
    );
  }, [notifications]);

  // 읽지 않은 알림 수
  const unreadCount = useMemo(() => {
    return notifications.filter(notif => !notif.read).length;
  }, [notifications]);

  // 설치된 모듈
  const installedModules = useMemo(() => {
    return modules.filter(module => module.installed);
  }, [modules]);

  // 설치된 모듈 (installed: true)
  const enabledModules = useMemo(() => {
    return modules.filter(module => module.installed);
  }, [modules]);

  // 활성 모듈 ID 배열 (설치된 모듈들)
  const activeModules = useMemo(() => {
    return modules.filter(module => module.installed).map(module => module.id);
  }, [modules]);

  // 카테고리별 모듈
  const modulesByCategory = useMemo(() => {
    const grouped = {};
    modules.forEach(module => {
      if (!grouped[module.category]) {
        grouped[module.category] = [];
      }
      grouped[module.category].push(module);
    });
    return grouped;
  }, [modules]);

  // 로컬 저장소에서 설정 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem('calendarSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (err) {
        console.error('저장된 설정 로드 오류:', err);
      }
    }
  }, []);

  // 자동 알림 새로고침 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 30 * 1000);
    
    return () => clearInterval(interval);
  }, [loadNotifications]);

  return {
    // 상태
    notifications,
    modules,
    settings,
    isLoading,
    error,
    
    // 계산된 값
    urgentNotices,
    unreadCount,
    installedModules,
    enabledModules,
    activeModules,
    modulesByCategory,
    
    // 액션
    loadNotifications,
    loadModules,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    toggleModule,
    installModule,
    uninstallModule,
    updateSettings
  };
};

export default useCalendarUI;