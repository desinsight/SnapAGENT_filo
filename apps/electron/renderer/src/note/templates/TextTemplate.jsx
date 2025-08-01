/**
 * 프로즈미러 단일 에디터 템플릿
 * 
 * @description 블록 방식이 아닌 단일 ProseMirror 에디터를 사용한 템플릿
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';

export const TextTemplate = {
  id: 'prosemirror-single',
  name: '빈노트 (텍스트)',
  description: '처음부터 자유롭게 작성',
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  content: {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: []
    }]
  },
  defaultTitle: '',
  category: '에디터',
  tags: ['prosemirror', '리치텍스트', '단일에디터'],
  placeholder: '여기에 텍스트를 입력하세요.',
  editorType: 'prosemirror-single', // 단일 ProseMirror 에디터 지시
  useBlockEditor: false // 블록 에디터 사용 안함
};