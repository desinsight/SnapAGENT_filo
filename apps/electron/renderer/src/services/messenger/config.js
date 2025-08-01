// 메신저 서비스 설정
export const messengerConfig = {
  id: 'messenger',
  name: 'Messenger',
  description: 'AI 메신저 서비스',
  
  // 패널 목록 (메인 사이드바에 표시될 옵션들)
  panels: [
    { 
      id: 'chats', 
      icon: 'ChatIcon', 
      label: '채팅 목록', 
      shortcut: 'Ctrl+T',
      description: '모든 채팅 대화 목록'
    },
    { 
      id: 'group-chats', 
      icon: 'UsersIcon', 
      label: '그룹 채팅', 
      shortcut: 'Ctrl+G',
      description: '그룹 채팅방 관리'
    },
    { 
      id: 'media', 
      icon: 'PhotoIcon', 
      label: '미디어', 
      shortcut: 'Ctrl+M',
      description: '공유된 사진, 비디오, 파일'
    },
  ],
  
  // 컴포넌트 매핑 (패널 ID -> 컴포넌트)
  components: {
    'chats': 'ChatListPanel',
    'group-chats': 'GroupChatPanel',
    'media': 'MediaPanel',
  },
  
  // 기본 패널
  defaultPanel: 'chats',
  
  // 서비스별 설정
  settings: {
    enableNotifications: true,
    autoSave: true,
    encryptMessages: true,
    aiSuggestions: true,
  }
};