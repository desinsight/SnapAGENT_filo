/**
 * 노트 템플릿 인덱스
 * 
 * @description 모든 노트 템플릿을 관리하는 중앙 파일
 * @author AI Assistant
 * @version 1.0.0
 */

import { BlankTemplate } from './BlankTemplate.jsx';
import { TextTemplate } from './TextTemplate.jsx';
import { TodoListTemplate } from './TodoListTemplate.jsx';

// 모든 템플릿 배열
export const NOTE_TEMPLATES = [
  BlankTemplate,
  TextTemplate,
  TodoListTemplate
];

// 템플릿 ID로 검색
export const getTemplateById = (id) => {
  return NOTE_TEMPLATES.find(template => template.id === id);
};

// 기본 템플릿 (빈 노트)
export const DEFAULT_TEMPLATE = BlankTemplate;