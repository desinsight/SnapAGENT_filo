/**
 * 슬래시 명령어 컴포넌트
 * 
 * @description 노션 스타일의 슬래시 명령어 메뉴
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';

const SLASH_COMMANDS = [
  {
    category: '기본',
    commands: [
      {
        type: 'text',
        name: '텍스트',
        description: '일반 텍스트를 입력하세요',
        icon: '📝',
        content: '',
        keywords: ['text', 'paragraph', '텍스트', '문단']
      },
      {
        type: 'heading1',
        name: '제목 1',
        description: '큰 제목',
        icon: '📰',
        content: '',
        keywords: ['heading', 'h1', 'title', '제목', '헤딩']
      },
      {
        type: 'heading2',
        name: '제목 2',
        description: '중간 제목',
        icon: '📋',
        content: '',
        keywords: ['heading', 'h2', 'subtitle', '제목', '헤딩']
      },
      {
        type: 'heading3',
        name: '제목 3',
        description: '작은 제목',
        icon: '📄',
        content: '',
        keywords: ['heading', 'h3', 'subheading', '제목', '헤딩']
      }
    ]
  },
  {
    category: '리스트',
    commands: [
      {
        type: 'bulletList',
        name: '불릿 리스트',
        description: '• 불릿 포인트 리스트',
        icon: '•',
        content: '',
        keywords: ['bullet', 'list', 'ul', '불릿', '리스트', '목록']
      },
      {
        type: 'numberedList',
        name: '번호 리스트',
        description: '1. 번호가 있는 리스트',
        icon: '1.',
        content: '',
        keywords: ['numbered', 'list', 'ol', '번호', '리스트', '목록']
      },
      {
        type: 'checkList',
        name: '체크 리스트',
        description: '☐ 할 일 목록',
        icon: '☐',
        content: '',
        keywords: ['check', 'todo', 'task', '체크', '할일', '작업']
      }
    ]
  },
  {
    category: '미디어',
    commands: [
      {
        type: 'code',
        name: '코드',
        description: '코드 블록',
        icon: '💻',
        content: '',
        keywords: ['code', 'programming', '코드', '프로그래밍']
      },
      {
        type: 'quote',
        name: '인용',
        description: '인용문',
        icon: '💬',
        content: '',
        keywords: ['quote', 'blockquote', '인용', '인용문']
      },
      {
        type: 'divider',
        name: '구분선',
        description: '구분선을 삽입',
        icon: '➖',
        content: '',
        keywords: ['divider', 'separator', 'line', '구분선', '선']
      },
      {
        type: 'image',
        name: '이미지',
        description: '이미지 삽입',
        icon: '🖼️',
        content: '',
        keywords: ['image', 'picture', 'photo', '이미지', '사진', '그림']
      }
    ]
  }
];

export const SlashCommand = ({ position, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // 검색어로 명령어 필터링
  useEffect(() => {
    const filtered = [];
    
    SLASH_COMMANDS.forEach(category => {
      const matchedCommands = category.commands.filter(command => {
        const search = searchTerm.toLowerCase();
        return (
          command.name.toLowerCase().includes(search) ||
          command.description.toLowerCase().includes(search) ||
          command.keywords.some(keyword => keyword.toLowerCase().includes(search))
        );
      });
      
      if (matchedCommands.length > 0) {
        filtered.push({
          ...category,
          commands: matchedCommands
        });
      }
    });
    
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [searchTerm]);

  // 전체 명령어 배열 생성 (키보드 네비게이션용)
  const allCommands = filteredCommands.flatMap(category => category.commands);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, allCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (allCommands[selectedIndex]) {
            onSelect(allCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, allCommands, onSelect, onClose]);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 자동 포커스
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div
      ref={menuRef}
      className="
        fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
        w-80 max-h-96 overflow-y-auto
      "
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* 검색 입력 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="블록 타입 검색..."
          className="
            w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
            rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
          "
        />
      </div>

      {/* 명령어 목록 */}
      <div className="py-2">
        {filteredCommands.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            검색 결과가 없습니다.
          </div>
        ) : (
          filteredCommands.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {category.category}
              </div>
              {category.commands.map((command, commandIndex) => {
                const globalIndex = filteredCommands
                  .slice(0, categoryIndex)
                  .reduce((sum, cat) => sum + cat.commands.length, 0) + commandIndex;
                
                return (
                  <button
                    key={command.type}
                    onClick={() => onSelect(command)}
                    className={`
                      w-full px-3 py-2 text-left text-sm flex items-center space-x-3
                      transition-colors duration-150
                      ${globalIndex === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <span className="text-lg">{command.icon}</span>
                    <div>
                      <div className="font-medium">{command.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {command.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* 힌트 */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        ↑↓ 선택 • Enter 확인 • Esc 취소
      </div>
    </div>
  );
};