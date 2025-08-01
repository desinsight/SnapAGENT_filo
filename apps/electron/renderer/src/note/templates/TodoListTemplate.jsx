/**
 * 할 일 목록 템플릿
 *
 * @description 체크리스트 형태의 할 일 목록 템플릿
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';

export const TodoListTemplate = {
  id: 'todo-list',
  name: '할 일 목록',
  description: '체크리스트로 할 일을 관리하세요',
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  content: [
    {
      type: "heading1",
      content: "📋 오늘의 할 일 목록"
    },
    {
      type: "text",
      content: "오늘 해야 할 일들을 체계적으로 관리해보세요."
    },
    {
      type: "divider",
      content: ""
    },
    {
      type: "heading2",
      content: "🔥 긴급 & 중요"
    },
    {
      type: "checkList",
      content: "",
      metadata: {
        items: [
          { id: "urgent-1", text: "긴급한 할 일을 입력하세요", checked: false },
          { id: "urgent-2", text: "중요한 할 일을 입력하세요", checked: false }
        ]
      }
    },
    {
      type: "heading2",
      content: "📝 일반 할 일"
    },
    {
      type: "checkList",
      content: "",
      metadata: {
        items: [
          { id: "normal-1", text: "일반 할 일을 입력하세요", checked: false },
          { id: "normal-2", text: "추가 할 일을 입력하세요", checked: false }
        ]
      }
    },
    {
      type: "divider",
      content: ""
    },
    {
      type: "progressBar",
      content: 0,
      metadata: {
        settings: {
          value: 0,
          label: "전체 진행률",
          showPercentage: true,
          style: "minimal",
          color: "blue",
          size: "medium",
          animate: true
        }
      }
    },
    {
      type: "divider",
      content: ""
    },
    {
      type: "heading2",
      content: "📝 메모"
    },
    {
      type: "text",
      content: "할 일과 관련된 메모나 아이디어를 여기에 작성하세요."
    },
    {
      type: "divider",
      content: ""
    },
    {
      type: "tag",
      content: "",
      metadata: {
        tags: [
          { id: "tag-1", text: "긴급", color: "red" },
          { id: "tag-2", text: "중요", color: "yellow" },
          { id: "tag-3", text: "프로젝트", color: "blue" },
          { id: "tag-4", text: "회의", color: "purple" },
          { id: "tag-5", text: "마감일", color: "red" }
        ]
      }
    },
    {
      type: "divider",
      content: ""
    },
    {
      type: "reminder",
      content: "",
      metadata: {
        title: "할 일 완료 리마인더",
        description: "오늘 할 일들을 완료했는지 확인하세요",
        date: new Date().toISOString().slice(0, 10),
        time: "18:00",
        repeat: "daily",
        enabled: true
      }
    }
  ],
  defaultTitle: '',
  category: '생산성',
  tags: ['할일', '체크리스트', '생산성', '프로젝트관리'],
  placeholder: '할 일을 추가하려면 / 를 입력하세요'
}; 