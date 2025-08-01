/**
 * 아코디언 레이아웃 디자인 블록 컴포넌트 (Minimal Version)
 * 
 * @description 미니멀하고 현대적인 아코디언 레이아웃 - 노션 스타일의 얇은 바 디자인
 * @author AI Assistant
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';

export const AccordionLayout = ({
  block,
  onUpdate,
  onFocus,
  onAdd,
  blocks,
  index,
  onSplit,
  readOnly = false,
  isEditing,
  onEditingChange,
  textFormat,
  onFormatChange,
  onRemove,
  onSelectionChange,
  onStartTyping
}) => {
  // 아코디언 아이템 기능 타입
  const itemFeatures = {
    text: {
      name: '텍스트',
      icon: '📝',
      placeholder: '내용을 입력하세요...',
      color: 'slate',
      description: '일반 텍스트 내용'
    },
    checklist: {
      name: '체크리스트',
      icon: '✓',
      placeholder: '할 일을 추가하세요...',
      color: 'emerald',
      description: '완료 가능한 작업 목록'
    },
    code: {
      name: '코드',
      icon: '</>',
      placeholder: '코드를 입력하세요...',
      color: 'violet',
      description: '코드 스니펫과 예제'
    },
    quote: {
      name: '인용구',
      icon: '"',
      placeholder: '인용구를 입력하세요...',
      color: 'blue',
      description: '중요한 인용문과 참고사항'
    },
    warning: {
      name: '경고',
      icon: '⚠',
      placeholder: '경고 내용을 입력하세요...',
      color: 'amber',
      description: '주의사항과 경고'
    },
    info: {
      name: '정보',
      icon: 'ℹ',
      placeholder: '정보를 입력하세요...',
      color: 'cyan',
      description: '유용한 팁과 정보'
    },
    success: {
      name: '성공',
      icon: '✨',
      placeholder: '성공 내용을 입력하세요...',
      color: 'green',
      description: '완료된 작업과 성과'
    },
    gallery: {
      name: '갤러리',
      icon: '🖼',
      placeholder: '이미지를 추가하세요...',
      color: 'rose',
      description: '이미지와 미디어'
    }
  };

  // 아코디언 스타일 옵션 - 미니멀 디자인
  const accordionStyles = {
    minimal: {
      name: '미니멀',
      container: 'bg-transparent',
      item: 'border-b border-gray-100 dark:border-gray-800/30 last:border-b-0',
      header: 'pl-0 pr-2 py-2 hover:bg-gray-50/30 dark:hover:bg-gray-800/10',
      content: 'pl-0 pr-2 pb-2'
    },
    clean: {
      name: '클린',
      container: 'bg-transparent',
      item: '',
      header: 'pl-0 pr-2 py-2 rounded-md hover:bg-gray-50/50 dark:hover:bg-gray-800/20',
      content: 'pl-6 pr-2 pb-2'
    },
    divider: {
      name: '구분선',
      container: 'bg-transparent',
      item: 'relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700/50',
      header: 'pl-4 pr-2 py-2 hover:bg-gray-50/30 dark:hover:bg-gray-800/10',
      content: 'pl-4 pr-2 pb-2'
    }
  };

  // 상태 관리
  const [items, setItems] = useState(
    block.metadata?.items || [
      {
        id: nanoid(),
        title: 'FAQ 1',
        content: '',
        feature: 'text',
        isOpen: false,
        settings: {},
        items: []
      },
      {
        id: nanoid(),
        title: 'FAQ 2',
        content: '',
        feature: 'text',
        isOpen: false,
        settings: {},
        items: []
      }
    ]
  );

  const [accordionMode, setAccordionMode] = useState(block.metadata?.accordionMode || 'single'); // single, multiple
  const [accordionStyle, setAccordionStyle] = useState(block.metadata?.accordionStyle || 'clean');
  const [animationSpeed, setAnimationSpeed] = useState(block.metadata?.animationSpeed || 'normal'); // fast, normal, slow
  const [defaultOpen, setDefaultOpen] = useState(block.metadata?.defaultOpen || false);
  
  // 상호작용 상태
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  
  const containerRef = useRef(null);
  const itemRefs = useRef({});

  // 컬러 시스템 - 미니멀 톤
  const getFeatureColor = (feature, variant = 'bg') => {
    const colors = {
      slate: {
        bg: 'bg-gray-400',
        light: 'bg-gray-50/50 dark:bg-gray-900/10',
        text: 'text-gray-500 dark:text-gray-500',
        border: 'border-gray-200/50 dark:border-gray-700/30'
      },
      emerald: {
        bg: 'bg-emerald-500/80',
        light: 'bg-emerald-50/30 dark:bg-emerald-900/10',
        text: 'text-emerald-600/80 dark:text-emerald-500/80',
        border: 'border-emerald-200/50 dark:border-emerald-700/30'
      },
      violet: {
        bg: 'bg-violet-500/80',
        light: 'bg-violet-50/30 dark:bg-violet-900/10',
        text: 'text-violet-600/80 dark:text-violet-500/80',
        border: 'border-violet-200/50 dark:border-violet-700/30'
      },
      blue: {
        bg: 'bg-blue-500/80',
        light: 'bg-blue-50/30 dark:bg-blue-900/10',
        text: 'text-blue-600/80 dark:text-blue-500/80',
        border: 'border-blue-200/50 dark:border-blue-700/30'
      },
      amber: {
        bg: 'bg-amber-500/80',
        light: 'bg-amber-50/30 dark:bg-amber-900/10',
        text: 'text-amber-600/80 dark:text-amber-500/80',
        border: 'border-amber-200/50 dark:border-amber-700/30'
      },
      cyan: {
        bg: 'bg-cyan-500/80',
        light: 'bg-cyan-50/30 dark:bg-cyan-900/10',
        text: 'text-cyan-600/80 dark:text-cyan-500/80',
        border: 'border-cyan-200/50 dark:border-cyan-700/30'
      },
      green: {
        bg: 'bg-green-500/80',
        light: 'bg-green-50/30 dark:bg-green-900/10',
        text: 'text-green-600/80 dark:text-green-500/80',
        border: 'border-green-200/50 dark:border-green-700/30'
      },
      rose: {
        bg: 'bg-rose-500/80',
        light: 'bg-rose-50/30 dark:bg-rose-900/10',
        text: 'text-rose-600/80 dark:text-rose-500/80',
        border: 'border-rose-200/50 dark:border-rose-700/30'
      }
    };
    
    const featureColor = itemFeatures[feature]?.color || 'slate';
    return colors[featureColor]?.[variant] || colors.slate[variant];
  };

  // 애니메이션 속도 클래스
  const getAnimationClass = () => {
    const speeds = {
      fast: 'duration-150',
      normal: 'duration-300',
      slow: 'duration-500'
    };
    return speeds[animationSpeed] || speeds.normal;
  };

  // 메타데이터 업데이트
  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        metadata: {
          ...block.metadata,
          items,
          accordionMode,
          accordionStyle,
          animationSpeed,
          defaultOpen
        }
      });
    }
  }, [items, accordionMode, accordionStyle, animationSpeed, defaultOpen]);

  // 아이템 토글
  const toggleItem = useCallback((itemId) => {
    setItems(prev => {
      if (accordionMode === 'single') {
        // 단일 모드: 하나만 열리게
        return prev.map(item => ({
          ...item,
          isOpen: item.id === itemId ? !item.isOpen : false
        }));
      } else {
        // 다중 모드: 독립적으로 토글
        return prev.map(item => 
          item.id === itemId ? { ...item, isOpen: !item.isOpen } : item
        );
      }
    });
  }, [accordionMode]);

  // 모든 아이템 열기/닫기
  const toggleAllItems = useCallback((open) => {
    setItems(prev => prev.map(item => ({ ...item, isOpen: open })));
  }, []);

  // 아이템 추가
  const addItem = useCallback((feature = 'text') => {
    const featureInfo = itemFeatures[feature];
    const newItem = {
      id: nanoid(),
      title: `${featureInfo.name} ${items.length + 1}`,
      content: '',
      feature,
      isOpen: defaultOpen,
      settings: feature === 'code' ? { language: 'javascript' } : {},
      items: []
    };
    setItems(prev => [...prev, newItem]);
  }, [items.length, defaultOpen]);

  // 아이템 삭제
  const removeItem = useCallback((itemId) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, [items.length]);

  // 아이템 제목 변경
  const updateItemTitle = useCallback((itemId, newTitle) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, title: newTitle || '제목 없음' } : item
    ));
    setEditingItemId(null);
  }, []);

  // 아이템 내용 변경
  const updateItemContent = useCallback((itemId, content) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, content } : item
    ));
    if (onStartTyping) onStartTyping(true);
  }, [onStartTyping]);

  // 아이템 하위 요소 변경
  const updateItemItems = useCallback((itemId, newItems) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, items: newItems } : item
    ));
  }, []);

  // 아이템 기능 변경
  const changeItemFeature = useCallback((itemId, feature) => {
    const featureInfo = itemFeatures[feature];
    setItems(prev => prev.map(item => 
      item.id === itemId ? {
        ...item,
        feature,
        content: '',
        items: [],
        settings: feature === 'code' ? { language: 'javascript' } : {}
      } : item
    ));
  }, []);

  // 드래그 앤 드롭 핸들러
  const handleDragStart = useCallback((e, itemId) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e, itemId) => {
    e.preventDefault();
    setDragOverItem(itemId);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverItem(null);
    }
  }, []);

  const handleDrop = useCallback((e, targetItemId) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== targetItemId) {
      const draggedIndex = items.findIndex(item => item.id === draggedItem);
      const targetIndex = items.findIndex(item => item.id === targetItemId);
      
      const newItems = [...items];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, removed);
      
      setItems(newItems);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  }, [draggedItem, items]);

  // 체크리스트 관리
  const addChecklistItem = useCallback((itemId) => {
    const newCheckItem = { id: nanoid(), text: '', checked: false };
    const item = items.find(i => i.id === itemId);
    if (item) {
      updateItemItems(itemId, [...item.items, newCheckItem]);
    }
  }, [items, updateItemItems]);

  const toggleChecklistItem = useCallback((itemId, checkItemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const newItems = item.items.map(ci => 
        ci.id === checkItemId ? { ...ci, checked: !ci.checked } : ci
      );
      updateItemItems(itemId, newItems);
    }
  }, [items, updateItemItems]);

  const updateChecklistItemText = useCallback((itemId, checkItemId, text) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const newItems = item.items.map(ci => 
        ci.id === checkItemId ? { ...ci, text } : ci
      );
      updateItemItems(itemId, newItems);
    }
  }, [items, updateItemItems]);

  const deleteChecklistItem = useCallback((itemId, checkItemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const newItems = item.items.filter(ci => ci.id !== checkItemId);
      updateItemItems(itemId, newItems);
    }
  }, [items, updateItemItems]);

  // 컨텐츠 렌더러
  const renderItemContent = useCallback((item) => {
    const feature = itemFeatures[item.feature];
    
    switch (item.feature) {
      case 'checklist':
        return (
          <div className="space-y-3">
            {item.items?.map((checkItem) => (
              <div key={checkItem.id} className="flex items-start gap-3 group py-1">
                <button
                  onClick={() => toggleChecklistItem(item.id, checkItem.id)}
                  className={`
                    mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${getAnimationClass()}
                    ${checkItem.checked 
                      ? `bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100 text-white dark:text-gray-900` 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400'
                    }
                  `}
                >
                  {checkItem.checked && (
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <input
                  type="text"
                  value={checkItem.text}
                  onChange={(e) => updateChecklistItemText(item.id, checkItem.id, e.target.value)}
                  placeholder="할 일을 입력하세요..."
                  className={`
                    flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400
                    ${checkItem.checked ? 'line-through opacity-60' : ''}
                  `}
                />
                <button
                  onClick={() => deleteChecklistItem(item.id, checkItem.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 rounded transition-all duration-150"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={() => addChecklistItem(item.id)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 mt-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>항목 추가</span>
            </button>
          </div>
        );

      case 'code':
        return (
          <div className="space-y-2">
            <select
              value={item.settings?.language || 'javascript'}
              onChange={(e) => {
                setItems(prev => prev.map(i => 
                  i.id === item.id ? { 
                    ...i, 
                    settings: { ...i.settings, language: e.target.value }
                  } : i
                ));
              }}
              className="px-2 py-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
            </select>
            <textarea
              value={item.content}
              onChange={(e) => updateItemContent(item.id, e.target.value)}
              placeholder={feature.placeholder}
              className="w-full min-h-[100px] resize-none bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 p-3 rounded-md font-mono text-xs border border-gray-100 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
              style={{ 
                fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                lineHeight: '1.5'
              }}
            />
          </div>
        );

      case 'quote':
        return (
          <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
            <textarea
              value={item.content}
              onChange={(e) => updateItemContent(item.id, e.target.value)}
              placeholder={feature.placeholder}
              className="w-full min-h-[60px] resize-none border-none outline-none bg-transparent text-gray-600 dark:text-gray-300 placeholder-gray-400 text-sm leading-relaxed italic"
              style={{
                fontFamily: textFormat?.fontFamily || '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: `${textFormat?.fontSize || 14}px`
              }}
            />
          </div>
        );

      case 'warning':
      case 'info':
      case 'success':
        return (
          <div className="flex items-start gap-2">
            <span className={`text-sm ${getFeatureColor(item.feature, 'text')} font-mono mt-0.5`}>
              {feature.icon}
            </span>
            <textarea
              value={item.content}
              onChange={(e) => updateItemContent(item.id, e.target.value)}
              placeholder={feature.placeholder}
              className="flex-1 min-h-[60px] resize-none border-none outline-none bg-transparent text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm leading-relaxed"
              style={{
                fontFamily: textFormat?.fontFamily || '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: `${textFormat?.fontSize || 14}px`
              }}
            />
          </div>
        );

      default:
        return (
          <textarea
            value={item.content}
            onChange={(e) => updateItemContent(item.id, e.target.value)}
            placeholder={feature.placeholder}
            className="w-full min-h-[60px] resize-none border-none outline-none bg-transparent text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm leading-relaxed focus:outline-none"
            style={{
              fontFamily: textFormat?.fontFamily || '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: `${textFormat?.fontSize || 14}px`
            }}
          />
        );
    }
  }, [items, textFormat, getAnimationClass, getFeatureColor, updateItemContent, toggleChecklistItem, updateChecklistItemText, deleteChecklistItem, addChecklistItem]);

  const currentStyle = accordionStyles[accordionStyle];

  return (
    <div 
      ref={containerRef}
      className={`
        relative w-full
        ${currentStyle.container}
        transition-all ${getAnimationClass()} ease-out
        group
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 헤더 컨트롤 - 미니멀 */}
      <div className={`
        flex items-center justify-between mb-1
        transition-all ${getAnimationClass()}
        ${isHovered || isFocused ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <span>{items.length} 항목</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{items.filter(item => item.isOpen).length} 열림</span>
          </div>
        </div>

        {/* 컨트롤 버튼들 - 미니멀 */}
        <div className={`
          flex items-center gap-1
          transition-all ${getAnimationClass()}
          ${isHovered || isFocused ? 'opacity-100' : 'opacity-0'}
        `}>
          {/* 전체 열기/닫기 */}
          <button
            onClick={() => toggleAllItems(!items.every(item => item.isOpen))}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded transition-colors duration-150"
            title={items.every(item => item.isOpen) ? '모두 닫기' : '모두 열기'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {items.every(item => item.isOpen) ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7-7-7 7M19 8l-7-7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7 7 7-7M5 16l7 7 7-7" />
              )}
            </svg>
          </button>

          {/* 설정 버튼 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded transition-colors duration-150"
            title="설정"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>

          {/* 아이템 추가 */}
          <button
            onClick={() => addItem()}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded transition-colors duration-150"
            title="항목 추가"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* 삭제 버튼 */}
          {!readOnly && onRemove && (
            <button
              onClick={() => onRemove(index)}
              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors duration-150"
              title="블록 삭제"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 설정 패널 - 미니멀 */}
      {showSettings && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md shadow-sm z-30 p-3">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {/* 모드 설정 */}
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>모드</span>
                <select
                  value={accordionMode}
                  onChange={(e) => setAccordionMode(e.target.value)}
                  className="px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                >
                  <option value="single">단일</option>
                  <option value="multiple">다중</option>
                </select>
              </label>

              {/* 스타일 설정 */}
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>스타일</span>
                <select
                  value={accordionStyle}
                  onChange={(e) => setAccordionStyle(e.target.value)}
                  className="px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                >
                  {Object.entries(accordionStyles).map(([key, style]) => (
                    <option key={key} value={key}>{style.name}</option>
                  ))}
                </select>
              </label>

              {/* 애니메이션 속도 */}
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>속도</span>
                <select
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(e.target.value)}
                  className="px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                >
                  <option value="fast">빠름</option>
                  <option value="normal">보통</option>
                  <option value="slow">느림</option>
                </select>
              </label>

              <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={defaultOpen}
                  onChange={(e) => setDefaultOpen(e.target.checked)}
                  className="w-3 h-3 text-gray-600 focus:ring-gray-400 border-gray-300 rounded-sm"
                />
                <span>기본 열림</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 아코디언 아이템들 - 미니멀 */}
      <div className={accordionStyle === 'minimal' ? '' : accordionStyle === 'divider' ? 'space-y-2' : 'space-y-1'}>
        {items.map((item, itemIndex) => (
          <div
            key={item.id}
            ref={el => itemRefs.current[item.id] = el}
            className={`
              ${currentStyle.item}
              ${dragOverItem === item.id ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}
              transition-all ${getAnimationClass()}
            `}
            draggable={!readOnly}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
          >
            {/* 아이템 헤더 - 미니멀 */}
            <div
              className={`
                ${currentStyle.header}
                flex items-center justify-between cursor-pointer group/item
                transition-all ${getAnimationClass()}
              `}
              onClick={() => toggleItem(item.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* 토글 아이콘 */}
                <svg 
                  className={`
                    w-3 h-3 text-gray-400 transition-transform ${getAnimationClass()}
                    ${item.isOpen ? 'rotate-90' : 'rotate-0'}
                  `} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>

                {/* 제목 */}
                {editingItemId === item.id ? (
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    onBlur={() => updateItemTitle(item.id, newItemTitle)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateItemTitle(item.id, newItemTitle);
                      } else if (e.key === 'Escape') {
                        setEditingItemId(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 text-sm"
                    autoFocus
                  />
                ) : (
                  <h4
                    className="flex-1 text-sm text-gray-700 dark:text-gray-200"
                    onDoubleClick={(e) => {
                      if (!readOnly) {
                        e.stopPropagation();
                        setEditingItemId(item.id);
                        setNewItemTitle(item.title);
                      }
                    }}
                  >
                    {item.title}
                  </h4>
                )}

                {/* 미리보기 텍스트 */}
                {!item.isOpen && item.content && (
                  <div className="hidden md:block text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">
                    {item.content.substring(0, 50)}{item.content.length > 50 ? '...' : ''}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* 아이템 액션 버튼들 - 미니멀 */}
                {!readOnly && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                    {/* 기능 아이콘 표시 */}
                    <div className={`
                      w-4 h-4 rounded flex items-center justify-center text-[10px] font-mono
                      ${getFeatureColor(item.feature, 'light')} ${getFeatureColor(item.feature, 'text')}
                    `}>
                      {itemFeatures[item.feature]?.icon}
                    </div>


                    {/* 기능 변경 및 삭제 */}
                    <div className="relative group/menu">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors duration-200"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {/* 메뉴 드롭다운 */}
                      <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md shadow-sm opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-150 z-40 min-w-36">
                        <div className="py-1">
                          {/* 기능 변경 */}
                          <div className="px-2 py-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">기능</div>
                          {Object.entries(itemFeatures).map(([key, feature]) => (
                            <button
                              key={key}
                              onClick={(e) => {
                                e.stopPropagation();
                                changeItemFeature(item.id, key);
                              }}
                              className={`
                                w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors duration-150
                                ${item.feature === key 
                                  ? 'text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800' 
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }
                              `}
                            >
                              <span className="font-mono text-[10px]">{feature.icon}</span>
                              <span>{feature.name}</span>
                            </button>
                          ))}
                          
                          <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                          
                          {/* 복제 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newItem = { ...item, id: nanoid(), title: `${item.title} 복사본` };
                              setItems(prev => [...prev.slice(0, itemIndex + 1), newItem, ...prev.slice(itemIndex + 1)]);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>복제</span>
                          </button>
                          
                          {/* 삭제 */}
                          {items.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>삭제</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 토글 아이콘 */}
                <svg 
                  className={`
                    w-4 h-4 text-gray-400 transition-transform ${getAnimationClass()}
                    ${item.isOpen ? 'rotate-180' : 'rotate-0'}
                  `} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* 아이템 내용 */}
            <div
              className={`
                overflow-hidden transition-all ${animationSpeed === 'fast' ? 'duration-150' : animationSpeed === 'slow' ? 'duration-500' : 'duration-300'} ease-out
                ${item.isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
              `}
            >
              <div 
                className={`${currentStyle.content} pt-4`}
                onFocus={() => {
                  setIsFocused(true);
                  if (onFocus) onFocus();
                  if (onEditingChange) onEditingChange(true);
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsFocused(false);
                    if (onEditingChange) onEditingChange(false);
                  }
                }}
              >
                {renderItemContent(item)}
                
                {/* 빈 상태 플레이스홀더 */}
                {!item.content && (!item.items || item.items.length === 0) && !isFocused && (
                  <div className="flex items-center justify-center min-h-[100px] text-center">
                    <div className="text-gray-400 dark:text-gray-600">
                      <div className="text-3xl mb-2 font-mono opacity-40">
                        {itemFeatures[item.feature]?.icon}
                      </div>
                      <p className="text-sm font-medium opacity-60">{itemFeatures[item.feature]?.name}</p>
                      <p className="text-xs opacity-40 mt-1">
                        {itemFeatures[item.feature]?.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 외부 클릭으로 설정 닫기 */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default AccordionLayout;