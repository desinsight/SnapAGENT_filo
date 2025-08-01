// 클라우드 동기화 서비스 설정
export const taxServiceConfig = {
  id: 'tax-service',
  name: '세무서비스',
  description: 'AI 세무/회계 통합 서비스',
  panels: [
    { id: 'tax', icon: 'TaxIcon', label: '세무신고', shortcut: 'Ctrl+T', description: '세무 신고 및 관리' },
    { id: 'accounting', icon: 'BookIcon', label: '회계장부', shortcut: 'Ctrl+A', description: '회계 장부 관리' },
    { id: 'receipt', icon: 'ReceiptIcon', label: '영수증 관리', shortcut: 'Ctrl+R', description: '영수증 및 증빙 관리' },
  ],
  components: {
    'tax': 'TaxPanel',
    'accounting': 'AccountingPanel',
    'receipt': 'ReceiptPanel',
  },
  defaultPanel: 'tax',
  settings: {
    autoSync: false,
    aiAssist: true,
    secureMode: true,
  }
};