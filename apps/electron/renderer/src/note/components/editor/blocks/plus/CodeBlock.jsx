/**
 * 코드 블록 컴포넌트 (Notion-style)
 * 
 * @description 노션 스타일의 심플하고 깔끔한 코드 블록 - ProseMirror 기반
 * @author AI Assistant
 * @version 3.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';
import './CodeBlock.css';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', color: '#f7df1e' },
  { value: 'typescript', label: 'TypeScript', color: '#3178c6' },
  { value: 'python', label: 'Python', color: '#3776ab' },
  { value: 'java', label: 'Java', color: '#ed8b00' },
  { value: 'html', label: 'HTML', color: '#e34f26' },
  { value: 'css', label: 'CSS', color: '#1572b6' },
  { value: 'json', label: 'JSON', color: '#000000' },
  { value: 'markdown', label: 'Markdown', color: '#083fa1' },
  { value: 'bash', label: 'Bash', color: '#4eaa25' },
  { value: 'sql', label: 'SQL', color: '#336791' },
  { value: 'go', label: 'Go', color: '#00add8' },
  { value: 'rust', label: 'Rust', color: '#ce422b' },
  { value: 'php', label: 'PHP', color: '#777bb4' },
  { value: 'swift', label: 'Swift', color: '#fa7343' },
  { value: 'kotlin', label: 'Kotlin', color: '#7f52ff' },
  { value: 'plain', label: 'Plain Text', color: '#6b7280' }
];

export const CodeBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  placeholder = "",
  isEditing,
  onEditingChange,
  onSelectionChange,
  onStartTyping,
  textFormat,
  onFormatChange
}) => {
  const [language, setLanguage] = useState(block.metadata?.language || 'javascript');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef(null);

  // 언어 변경 시 블록 업데이트
  useEffect(() => {
    if (language !== (block.metadata?.language || 'javascript')) {
      onUpdate({
        metadata: {
          ...block.metadata,
          language
        }
      });
    }
  }, [language, block.metadata, onUpdate]);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
    };

    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLanguageMenu]);

  // ProseMirror 콘텐츠 변경 처리
  const handleProseMirrorChange = (json) => {
    // JSON에서 텍스트 추출
    let content = '';
    if (json.content && json.content.length > 0) {
      const codeBlock = json.content[0];
      if (codeBlock.content && codeBlock.content.length > 0) {
        content = codeBlock.content.map(node => {
          if (node.type === 'text') {
            return node.text || '';
          }
          return '';
        }).join('');
      }
    }
    
    onUpdate({ content });
    if (onStartTyping) {
      onStartTyping(true);
    }
  };

  // ProseMirror 선택 변경 처리
  const handleProseMirrorSelectionChange = (selection) => {
    if (onSelectionChange) {
      onSelectionChange(selection);
    }
  };

  // ProseMirror 포맷팅 변경 처리
  const handleProseMirrorFormatChange = (cmd, value) => {
    if (onFormatChange) {
      onFormatChange(cmd, value);
    }
  };

  // 언어 선택 처리
  const handleLanguageSelect = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    setShowLanguageMenu(false);
  };

  // 복사 버튼 처리
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(block.content || '');
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const currentLanguage = LANGUAGES.find(lang => lang.value === language) || LANGUAGES[0];
  const isEmpty = !block.content || block.content.trim() === '';

  return (
    <div 
      className={`
        code-block group relative
        bg-gray-50 dark:bg-gray-900/30 
        border border-gray-200/60 dark:border-gray-700/60
        rounded-lg transition-all duration-200 ease-out
        ${isHovered ? 'border-gray-300 dark:border-gray-600 shadow-sm' : ''}
        ${isEmpty ? 'min-h-[120px]' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200/40 dark:border-gray-700/40">
        <div className="flex items-center space-x-3">
          {/* 언어 표시 점 */}
          <div 
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: currentLanguage.color }}
          />
          
          {/* 언어 선택 버튼 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => !readOnly && setShowLanguageMenu(!showLanguageMenu)}
              className={`
                text-sm font-medium text-gray-600 dark:text-gray-400
                hover:text-gray-900 dark:hover:text-gray-200
                transition-colors duration-150
                ${readOnly ? 'cursor-default' : 'cursor-pointer'}
              `}
              disabled={readOnly}
            >
              {currentLanguage.label}
              {!readOnly && (
                <svg className="w-3 h-3 ml-1 inline-block opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            
            {/* 언어 선택 메뉴 */}
            {showLanguageMenu && (
              <div className="absolute top-full left-0 mt-2 z-50 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                <div className="py-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => handleLanguageSelect(lang.value)}
                      className={`
                        w-full px-3 py-2 text-left text-sm flex items-center space-x-3
                        hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150
                        ${language === lang.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                      `}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: lang.color }}
                      />
                      <span>{lang.label}</span>
                      {language === lang.value && (
                        <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-1">
          {/* 복사 버튼 */}
          <button
            onClick={handleCopyCode}
            className={`
              relative p-1.5 rounded-md transition-all duration-150
              ${showCopyFeedback 
                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }
              ${isEmpty ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={showCopyFeedback ? '복사됨!' : '코드 복사'}
            disabled={isEmpty}
          >
            {showCopyFeedback ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 코드 에디터 */}
      <div className="relative">
        <ProseMirrorTextEditor
          content={block.content}
          onChange={handleProseMirrorChange}
          onSelectionChange={handleProseMirrorSelectionChange}
          onFormatChange={handleProseMirrorFormatChange}
          placeholder={placeholder || `${currentLanguage.label} 코드를 입력하세요...`}
          readOnly={readOnly}
          blockId={block.id}
          blockType="code"
          className="relative outline-none min-h-[80px] font-mono text-[13px] leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap px-4 py-3"
          style={{ 
            fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", "Consolas", "Courier New", monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            color: 'inherit',
            backgroundColor: 'transparent',
            tabSize: 2
          }}
        />
        
        {/* 빈 상태 플레이스홀더 */}
        {isEmpty && !readOnly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400 dark:text-gray-600">
              <div className="text-2xl mb-2">
                <svg className="w-8 h-8 mx-auto opacity-40 empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <p className="text-sm">클릭하여 코드를 입력하세요</p>
              <p className="text-xs mt-1 opacity-70">{currentLanguage.label}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* 복사 피드백 토스트 */}
      {showCopyFeedback && (
        <div className="absolute top-2 right-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1 shadow-sm animate-fade-in">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>복사됨</span>
        </div>
      )}
    </div>
  );
};