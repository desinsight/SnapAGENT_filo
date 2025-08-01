// 캘린더 서비스 설정
export const calendarConfig = {
  id: 'calendar',
  name: 'Calendar',
  description: '캘린더 서비스',
  
  // 패널 목록
  panels: [
    { 
      id: 'calendar', 
      icon: 'CalendarIcon', 
      label: '캘린더', 
      shortcut: 'Ctrl+D',
      description: '일정 관리'
    },
    { 
      id: 'events', 
      icon: 'EventIcon', 
      label: '이벤트', 
      shortcut: 'Ctrl+E',
      description: '이벤트 목록'
    },
    { 
      id: 'reminders', 
      icon: 'ReminderIcon', 
      label: '알림', 
      shortcut: 'Ctrl+R',
      description: '일정 알림 설정'
    },
  ],
  
  // 컴포넌트 매핑
  components: {
    'calendar': 'CalendarPanel',
    'events': 'EventsPanel',
    'reminders': 'RemindersPanel',
  },
  
  // 기본 패널
  defaultPanel: 'calendar',
  
  // 서비스별 설정
  settings: {
    defaultView: 'month',
    notifications: true,
    weekStart: 'monday',
  }
};