// 작업 관리 서비스 설정
export const taskManagerConfig = {
  id: 'task-manager',
  name: 'Task Manager',
  description: '작업 관리 서비스',
  
  // 패널 목록
  panels: [
    { 
      id: 'tasks', 
      icon: 'TaskIcon', 
      label: '작업 목록', 
      shortcut: 'Ctrl+T',
      description: '할 일 관리'
    },
    { 
      id: 'projects', 
      icon: 'ProjectIcon', 
      label: '프로젝트', 
      shortcut: 'Ctrl+P',
      description: '프로젝트 관리'
    },
    { 
      id: 'analytics', 
      icon: 'AnalyticsIcon', 
      label: '분석', 
      shortcut: 'Ctrl+A',
      description: '생산성 분석'
    },
  ],
  
  // 컴포넌트 매핑
  components: {
    'tasks': 'TasksPanel',
    'projects': 'ProjectsPanel',
    'analytics': 'AnalyticsPanel',
  },
  
  // 기본 패널
  defaultPanel: 'tasks',
  
  // 서비스별 설정
  settings: {
    autoSort: true,
    showCompleted: false,
    reminderEnabled: true,
  }
};