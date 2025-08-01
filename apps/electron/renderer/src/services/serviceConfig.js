// 서비스 설정 파일들을 임포트
import { homeConfig } from './home/config.js';
import { fileManagerConfig } from './fileManager/config.js';
import { chatbotConfig } from './chatbot/config.js';
import { calendarConfig } from './calendar/config.js';
import { notificationsConfig } from './notifications/config.js';
import { taskManagerConfig } from './taskManager/config.js';
import { noteTakingConfig } from './noteTaking/config.js';
import { taxServiceConfig } from './cloudSync/config.js';
import { messengerConfig } from './messenger/config.js';
import { contactsConfig } from './contacts/config.js';
import { documentsConfig } from './documents/config.js';
import { getServiceGradient } from '../constants/colors.js';

// 모든 서비스 설정을 하나로 통합
export const serviceConfigs = {
  'home': homeConfig,
  'file-manager': fileManagerConfig,
  'chatbot': chatbotConfig,
  'calendar': calendarConfig,
  'notifications': notificationsConfig,
  'task-manager': taskManagerConfig,
  'note-taking': noteTakingConfig,
  'tax-service': taxServiceConfig,
  'messenger': messengerConfig,
  'contacts': contactsConfig,
  'documents': documentsConfig,
};

// 서비스 목록 (사이드바 표시용)
export const services = [
  {
    id: 'home',
    name: 'Home',
    icon: 'HomeIcon',
    color: getServiceGradient('home'),
    description: '홈 대시보드',
  },
  {
    id: 'file-manager',
    name: 'File Manager',
    icon: 'FileIcon',
    color: getServiceGradient('file-manager'),
    description: 'AI 파일 관리 서비스',
  },
  {
    id: 'chatbot',
    name: 'Chatbot',
    icon: 'ChatIcon',
    color: getServiceGradient('chatbot'),
    description: '챗봇 서비스',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: 'CalendarIcon',
    color: getServiceGradient('calendar'),
    description: '캘린더 서비스',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: 'BellIcon',
    color: getServiceGradient('notifications'),
    description: '알림 서비스',
  },
  {
    id: 'task-manager',
    name: 'Task Manager',
    icon: 'TaskIcon',
    color: getServiceGradient('task-manager'),
    description: '작업 관리 서비스',
  },
  {
    id: 'note-taking',
    name: 'Notes',
    icon: 'NoteIcon',
    color: getServiceGradient('note-taking'),
    description: '노트 및 문서 관리',
  },
  {
    id: 'tax-service',
    name: '세무서비스',
    icon: 'TaxIcon',
    color: getServiceGradient('tax-service'),
    description: 'AI 세무/회계 통합 서비스',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    icon: 'ChatBubbleIcon',
    color: getServiceGradient('messenger'),
    description: 'AI 메신저 서비스',
  },
  {
    id: 'contacts',
    name: 'Contacts',
    icon: 'UserIcon',
    color: getServiceGradient('contacts'),
    description: 'AI 연락처 관리',
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: 'DocumentTextIcon',
    color: getServiceGradient('documents'),
    description: 'AI 전자문서 관리',
  },
];

// 현재 활성 서비스의 설정 가져오기
export const getServiceConfig = (serviceId) => {
  return serviceConfigs[serviceId] || null;
};

// 현재 활성 서비스의 패널 목록 가져오기
export const getServicePanels = (serviceId) => {
  const config = getServiceConfig(serviceId);
  return config?.panels || [];
};

// 현재 활성 서비스의 메인 컴포넌트 가져오기
export const getServiceComponent = (serviceId, panelId) => {
  const config = getServiceConfig(serviceId);
  return config?.components?.[panelId] || null;
};