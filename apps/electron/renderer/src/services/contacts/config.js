// 연락처 서비스 설정
export const contactsConfig = {
  id: 'contacts',
  name: 'Contacts',
  description: 'AI 연락처 관리 서비스',
  
  // 패널 목록 (메인 사이드바에 표시될 옵션들)
  panels: [
    { 
      id: 'contacts', 
      icon: 'UserIcon', 
      label: '연락처 목록', 
      shortcut: 'Ctrl+C',
      description: '모든 연락처 관리'
    },
    { 
      id: 'groups', 
      icon: 'UserGroupIcon', 
      label: '그룹 관리', 
      shortcut: 'Ctrl+G',
      description: '연락처 그룹 및 라벨'
    },
    { 
      id: 'recent', 
      icon: 'ClockIcon', 
      label: '연락처 찾기', 
      shortcut: 'Ctrl+R',
      description: '연락처 검색 및 찾기'
    },
  ],
  
  // 컴포넌트 매핑 (패널 ID -> 컴포넌트)
  components: {
    'contacts': 'ContactListPanel',
    'groups': 'ContactGroupPanel', 
    'recent': 'RecentContactsPanel',
  },
  
  // 기본 패널
  defaultPanel: 'contacts',
  
  // 서비스별 설정
  settings: {
    autoSync: true,
    duplicateDetection: true,
    backupContacts: true,
    aiSuggestions: true,
  }
};