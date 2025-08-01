// 알림 서비스 설정
export const notificationsConfig = {
  id: 'notifications',
  name: 'Notifications',
  description: '알림 서비스',
  
  // 패널 목록
  panels: [
    { 
      id: 'inbox', 
      icon: 'InboxIcon', 
      label: '알림함', 
      shortcut: 'Ctrl+N',
      description: '받은 알림 목록'
    },
    { 
      id: 'settings', 
      icon: 'SettingsIcon', 
      label: '알림 설정', 
      shortcut: 'Ctrl+S',
      description: '알림 환경설정'
    },
    { 
      id: 'history', 
      icon: 'HistoryIcon', 
      label: '알림 기록', 
      shortcut: 'Ctrl+H',
      description: '지난 알림 내역'
    },
  ],
  
  // 컴포넌트 매핑
  components: {
    'inbox': 'NotificationInboxPanel',
    'settings': 'NotificationSettingsPanel',
    'history': 'NotificationHistoryPanel',
  },
  
  // 기본 패널
  defaultPanel: 'inbox',
  
  // 서비스별 설정
  settings: {
    soundEnabled: true,
    desktopNotifications: true,
    emailNotifications: false,
  }
};