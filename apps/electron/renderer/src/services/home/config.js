// 홈 대시보드 서비스 설정
export const homeConfig = {
  id: 'home',
  name: 'Home Dashboard',
  description: '홈 대시보드 - 전체 시스템 개요',
  
  // 패널 구성
  panels: [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: 'HomeIcon',
      description: '시스템 개요 및 주요 정보',
      isDefault: true,
    },
    {
      id: 'quick-access',
      name: 'Quick Access',
      icon: 'BoltIcon',
      description: '빠른 실행 및 즐겨찾기',
    },
    {
      id: 'recent-activity',
      name: 'Recent Activity',
      icon: 'ClockIcon',
      description: '최근 활동 내역',
    },
  ],
  
  // 컴포넌트 매핑
  components: {
    'dashboard': () => import('./components/Dashboard.jsx'),
    'quick-access': () => import('./components/QuickAccess.jsx'),
    'recent-activity': () => import('./components/RecentActivity.jsx'),
  },
  
  // 홈 서비스 특정 설정
  settings: {
    showWelcomeMessage: true,
    autoRefreshInterval: 30000, // 30초
    compactMode: false,
    showSystemStats: true,
    showRecentFiles: true,
    maxRecentItems: 10,
  },
  
  // 툴바 액션
  toolbarActions: [
    {
      id: 'refresh',
      name: 'Refresh',
      icon: 'ArrowPathIcon',
      action: 'refresh',
    },
    {
      id: 'customize',
      name: 'Customize',
      icon: 'Cog6ToothIcon',
      action: 'customize',
    },
  ],
};