// 전자문서 서비스 설정
export const documentsConfig = {
  id: 'documents',
  name: 'Documents',
  description: 'AI 전자문서 관리 서비스',
  
  // 패널 목록 (메인 사이드바에 표시될 옵션들)
  panels: [
    { 
      id: 'documents', 
      icon: 'DocumentTextIcon', 
      label: '문서 목록', 
      shortcut: 'Ctrl+D',
      description: '모든 전자문서 관리'
    },
    { 
      id: 'templates', 
      icon: 'DocumentDuplicateIcon', 
      label: '템플릿', 
      shortcut: 'Ctrl+T',
      description: '문서 템플릿 관리'
    },
    { 
      id: 'editor', 
      icon: 'PencilIcon', 
      label: '문서 편집기', 
      shortcut: 'Ctrl+E',
      description: '문서 작성 및 편집'
    },
    { 
      id: 'signatures', 
      icon: 'IdentificationIcon', 
      label: '전자서명', 
      shortcut: 'Ctrl+S',
      description: '전자서명 관리'
    },
    { 
      id: 'versions', 
      icon: 'ClockIcon', 
      label: '버전 관리', 
      shortcut: 'Ctrl+V',
      description: '문서 버전 히스토리'
    },
    { 
      id: 'sharing', 
      icon: 'ShareIcon', 
      label: '공유 관리', 
      shortcut: 'Ctrl+H',
      description: '문서 공유 및 권한'
    },
  ],
  
  // 컴포넌트 매핑 (패널 ID -> 컴포넌트)
  components: {
    'documents': 'DocumentListPanel',
    'templates': 'TemplatePanel', 
    'editor': 'DocumentEditorPanel',
    'signatures': 'SignaturePanel',
    'versions': 'VersionHistoryPanel',
    'sharing': 'SharingPanel',
  },
  
  // 기본 패널
  defaultPanel: 'documents',
  
  // 서비스별 설정
  settings: {
    autoSave: true,
    versionControl: true,
    encryptDocuments: true,
    aiAssistance: true,
    cloudSync: true,
  }
};