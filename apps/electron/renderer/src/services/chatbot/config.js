// 챗봇 서비스 설정
export const chatbotConfig = {
  id: 'chatbot',
  name: 'Chatbot',
  description: '챗봇 서비스',
  
  // 패널 목록
  panels: [
    { 
      id: 'chat', 
      icon: 'ChatIcon', 
      label: '채팅', 
      shortcut: 'Ctrl+T',
      description: 'AI 챗봇과 대화'
    },
    { 
      id: 'history', 
      icon: 'HistoryIcon', 
      label: '대화 기록', 
      shortcut: 'Ctrl+H',
      description: '이전 대화 내역'
    },
    { 
      id: 'prompts', 
      icon: 'PromptIcon', 
      label: '프롬프트', 
      shortcut: 'Ctrl+P',
      description: '저장된 프롬프트 템플릿'
    },
  ],
  
  // 컴포넌트 매핑
  components: {
    'chat': 'ChatPanel',
    'history': 'ChatHistoryPanel',
    'prompts': 'PromptsPanel',
  },
  
  // 기본 패널
  defaultPanel: 'chat',
  
  // 서비스별 설정
  settings: {
    autoSave: true,
    voiceInput: false,
    theme: 'dark',
  }
};