// 파일 매니저 서비스 설정
export const fileManagerConfig = {
  id: 'file-manager',
  name: 'File Manager',
  description: 'AI 파일 관리 서비스',
  
  // 패널 목록 (메인 사이드바에 표시될 옵션들)
  panels: [
    { 
      id: 'files', 
      icon: 'FileIcon', 
      label: '파일 탐색기', 
      shortcut: 'Ctrl+E',
      description: '파일 및 폴더 탐색'
    },
    { 
      id: 'search', 
      icon: 'SearchIcon', 
      label: '검색', 
      shortcut: 'Ctrl+F',
      description: '파일 및 내용 검색'
    },
    { 
      id: 'analysis', 
      icon: 'BarChart3Icon', 
      label: '문서 분석', 
      shortcut: 'Ctrl+A',
      description: '문서 내용 분석 및 인사이트'
    },
  ],
  
  // 컴포넌트 매핑 (패널 ID -> 컴포넌트)
  components: {
    'files': 'FileExplorerPanel',
    'search': 'SearchPanel',
    'analysis': 'AnalysisPanel',
  },
  
  // 기본 패널
  defaultPanel: 'files',
  
  // 서비스별 설정
  settings: {
    showHiddenFiles: false,
    autoBackup: true,
    aiAnalysis: true,
  }
};