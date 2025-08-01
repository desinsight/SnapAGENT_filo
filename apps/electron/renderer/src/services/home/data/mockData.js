// Service Cards Data
export const servicesData = [
  {
    title: '파일 탐색기',
    description: '파일 관리',
    count: '2,457',
    trend: '+12%',
    iconType: 'folder',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    action: () => console.log('Open File Manager'),
  },
  {
    title: 'AI 어시스턴트',
    description: '대화 시작',
    count: '156',
    trend: '+8%',
    iconType: 'chat',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    action: () => console.log('Open AI Chat'),
  },
  {
    title: '일정 관리',
    description: '오늘 일정',
    count: '8',
    trend: '오늘',
    iconType: 'calendar',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
    action: () => console.log('Open Calendar'),
  },
  {
    title: '작업 관리',
    description: '진행 중',
    count: '24',
    trend: '+5%',
    iconType: 'task',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    action: () => console.log('Open Tasks'),
  },
  {
    title: '보고서 생성',
    description: '자동 생성',
    count: '12',
    trend: '+15%',
    iconType: 'report',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    action: () => console.log('Generate Report'),
  },
  {
    title: '팀 협업',
    description: '실시간 채팅',
    count: '8',
    trend: '활성',
    iconType: 'team',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
    action: () => console.log('Open Team Chat'),
  },
  {
    title: '데이터 분석',
    description: '인사이트',
    count: '45',
    trend: '+18%',
    iconType: 'analytics',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    action: () => console.log('Open Analytics'),
  },
];

// Schedule Data
export const schedulesData = [
  {
    title: '경영진 회의',
    description: '월간 경영 검토 및 전략 수립',
    time: '09:00',
    location: '회의실 A',
    priority: 'high',
  },
  {
    title: '프로젝트 킥오프',
    description: '신규 AI 프로젝트 시작',
    time: '10:30',
    location: '개발팀 회의실',
    priority: 'high',
  },
  {
    title: '클라이언트 미팅',
    description: '삼성전자 담당자 미팅',
    time: '14:00',
    location: '온라인',
    priority: 'medium',
  },
  {
    title: '팀 회고',
    description: '주간 스프린트 리뷰',
    time: '16:00',
    location: '회의실 B',
    priority: 'medium',
  },
  {
    title: '개인 학습 시간',
    description: '새로운 기술 스택 학습',
    time: '17:30',
    location: '개인 데스크',
    priority: 'low',
  },
];

// Notifications Data
export const notificationsData = [
  {
    title: '시스템 업데이트 완료',
    message: 'AI 서버가 성공적으로 업데이트되었습니다.',
    time: '방금 전',
    type: 'success',
    read: false,
  },
  {
    title: '새로운 메시지',
    message: '김철수님이 메시지를 보냈습니다.',
    time: '5분 전',
    type: 'info',
    read: false,
  },
  {
    title: '저장 공간 부족',
    message: '디스크 사용량이 85%에 도달했습니다.',
    time: '10분 전',
    type: 'warning',
    read: false,
  },
  {
    title: '백업 완료',
    message: '일일 자동 백업이 완료되었습니다.',
    time: '1시간 전',
    type: 'success',
    read: true,
  },
  {
    title: '보안 알림',
    message: '새로운 로그인이 감지되었습니다.',
    time: '2시간 전',
    type: 'warning',
    read: true,
  },
];

// Storage Data
export const storageData = [
  { name: '문서', value: 35, color: '#3B82F6' },
  { name: '이미지', value: 25, color: '#10B981' },
  { name: '동영상', value: 20, color: '#F59E0B' },
  { name: '기타', value: 20, color: '#6B7280' },
];

// Chart Data Generators
export const generatePerformanceData = () => {
  const data = [];
  for (let i = 0; i < 10; i++) {
    data.push({
      time: new Date(Date.now() - (9 - i) * 300000).toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      cpu: Math.floor(Math.random() * 60) + 20,
      memory: Math.floor(Math.random() * 40) + 40,
    });
  }
  return data;
};

export const generateSystemStats = () => ({
  cpu: Math.floor(Math.random() * 60) + 20,
  memory: Math.floor(Math.random() * 40) + 40,
  storage: Math.floor(Math.random() * 20) + 60,
});