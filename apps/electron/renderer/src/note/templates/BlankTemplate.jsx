/**
 * 빈 노트 템플릿
 * 
 * @description 처음부터 자유롭게 작성할 수 있는 빈 노트 템플릿
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';

export const BlankTemplate = {
  id: 'blank',
  name: '빈노트 (블록)',
  description: '처음부터 자유롭게 작성',
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  content: '',
  defaultTitle: '',
  category: '개인',
  tags: [],
  placeholder: '여기에 텍스트를 입력하세요. / 로 블록 변환'
};