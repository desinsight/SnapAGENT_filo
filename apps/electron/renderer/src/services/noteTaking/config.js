// 노트 서비스 설정
export const noteTakingConfig = {
  id: 'note-taking',
  name: 'Notes',
  description: '노트 및 문서 관리',
  
  // 패널 목록
  panels: [
    { 
      id: 'personal-notes', 
      icon: 'NoteIcon', 
      label: '개인노트', 
      shortcut: 'Ctrl+N',
      description: '개인 노트 작성 및 관리'
    },
    { 
      id: 'bookmarks', 
      icon: 'BookmarkIcon', 
      label: '즐겨찾기', 
      shortcut: 'Ctrl+B',
      description: '개인노트와 공유노트 즐겨찾기 통합 관리'
    },
    { 
      id: 'templates', 
      icon: 'DocumentDuplicateIcon', 
      label: '템플릿', 
      shortcut: 'Ctrl+T',
      description: '노트 템플릿 관리'
    },
  ],
  
  // 컴포넌트 매핑
  components: {
    'personal-notes': 'PersonalNotesPanel',
    'bookmarks': 'BookmarkPanel',
    'templates': 'TemplatesPanel',
  },
  
  // 기본 패널
  defaultPanel: 'personal-notes',
  
  // 서비스별 설정
  settings: {
    autoSave: true,
    markdown: true,
    syncCloud: false,
  }
};