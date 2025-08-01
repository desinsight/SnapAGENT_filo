/**
 * 탭 레이아웃 디자인 블록 컴포넌트 (Modern Minimal Version)
 * 
 * @description 현대적이고 미니멀한 탭 레이아웃 - 풍부한 기능, 절제된 디자인
 * @author AI Assistant
 * @version 3.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';

export const TabLayout = ({
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
  // 탭 기능 타입 정의
  const tabFeatures = {
    text: {
      name: '텍스트',
      icon: '📝',
      placeholder: '내용을 입력하세요...',
      color: 'slate'
    },
    checklist: {
      name: '체크리스트',
      icon: '✓',
      placeholder: '할 일을 입력하세요...',
      color: 'emerald'
    },
    code: {
      name: '코드',
      icon: '</>',
      placeholder: '코드를 입력하세요...',
      color: 'violet'
    },
    notes: {
      name: '메모',
      icon: '※',
      placeholder: '메모를 작성하세요...',
      color: 'amber'
    },
    links: {
      name: '링크',
      icon: '↗',
      placeholder: '링크를 추가하세요...',
      color: 'blue'
    },
    gallery: {
      name: '갤러리',
      icon: '◊',
      placeholder: '이미지를 추가하세요...',
      color: 'rose'
    }
  };

  // 기본 설정
  const [tabs, setTabs] = useState(
    block.metadata?.tabs || [
      { 
        id: nanoid(), 
        title: '텍스트', 
        content: '', 
        active: true, 
        feature: 'text',
        settings: {},
        items: []
      },
      { 
        id: nanoid(), 
        title: '할 일', 
        content: '', 
        active: false, 
        feature: 'checklist',
        settings: {},
        items: []
      }
    ]
  );
  
  const [activeTabId, setActiveTabId] = useState(
    block.metadata?.activeTabId || tabs.find(tab => tab.active)?.id || tabs[0]?.id
  );
  
  // 상호작용 상태
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [editingTabId, setEditingTabId] = useState(null);
  const [newTabTitle, setNewTabTitle] = useState('');
  const [showTabSettings, setShowTabSettings] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const containerRef = useRef(null);

  // 컬러 시스템 (미니멀하고 현대적)
  const getFeatureColor = (feature, variant = 'bg') => {
    const colors = {
      slate: {
        bg: 'bg-slate-500',
        light: 'bg-slate-50 dark:bg-slate-900/20',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700'
      },
      emerald: {
        bg: 'bg-emerald-500',
        light: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-700'
      },
      violet: {
        bg: 'bg-violet-500',
        light: 'bg-violet-50 dark:bg-violet-900/20',
        text: 'text-violet-600 dark:text-violet-400',
        border: 'border-violet-200 dark:border-violet-700'
      },
      amber: {
        bg: 'bg-amber-500',
        light: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-700'
      },
      blue: {
        bg: 'bg-blue-500',
        light: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-700'
      },
      rose: {
        bg: 'bg-rose-500',
        light: 'bg-rose-50 dark:bg-rose-900/20',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-700'
      }
    };
    
    const featureColor = tabFeatures[feature]?.color || 'slate';
    return colors[featureColor]?.[variant] || colors.slate[variant];
  };

  // 메타데이터 업데이트
  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        metadata: {
          ...block.metadata,
          tabs,
          activeTabId
        }
      });
    }
  }, [tabs, activeTabId]);

  // 활성 탭 변경
  const handleTabChange = (tabId) => {
    setActiveTabId(tabId);
    setTabs(prev => prev.map(tab => ({ ...tab, active: tab.id === tabId })));
  };

  // 탭 내용 변경
  const handleContentChange = (content) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, content } : tab
    ));
    if (onStartTyping) onStartTyping(true);
  };

  // 탭 아이템 변경
  const handleItemsChange = (items) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, items } : tab
    ));
  };

  // 탭 제목 변경
  const handleTitleChange = (tabId, newTitle) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, title: newTitle || '제목 없음' } : tab
    ));
    setEditingTabId(null);
  };

  // 탭 기능 변경
  const handleFeatureChange = (tabId, feature) => {
    const featureInfo = tabFeatures[feature];
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { 
        ...tab, 
        feature,
        title: featureInfo.name,
        content: '',
        items: [],
        settings: feature === 'code' ? { language: 'javascript' } : {}
      } : tab
    ));
    setShowTabSettings(null);
  };

  // 탭 추가
  const addNewTab = (feature = 'text') => {
    const featureInfo = tabFeatures[feature];
    const newTab = {
      id: nanoid(),
      title: featureInfo.name,
      content: '',
      active: false,
      feature,
      settings: feature === 'code' ? { language: 'javascript' } : {},
      items: []
    };
    setTabs(prev => [...prev, newTab]);
    setShowAddMenu(false);
  };

  // 탭 삭제
  const removeTab = (tabId) => {
    if (tabs.length <= 1) return;
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      const newActiveId = newTabs[0]?.id;
      setActiveTabId(newActiveId);
    }
  };

  // 체크리스트 아이템 관리
  const addChecklistItem = () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      const newItem = { id: nanoid(), text: '', checked: false };
      handleItemsChange([...activeTab.items, newItem]);
    }
  };

  const toggleChecklistItem = (itemId) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      const newItems = activeTab.items.map(item => 
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      handleItemsChange(newItems);
    }
  };

  const updateChecklistItem = (itemId, text) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      const newItems = activeTab.items.map(item => 
        item.id === itemId ? { ...item, text } : item
      );
      handleItemsChange(newItems);
    }
  };

  const deleteChecklistItem = (itemId) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      handleItemsChange(activeTab.items.filter(item => item.id !== itemId));
    }
  };

  // 링크 아이템 관리
  const addLinkItem = () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      const newItem = { id: nanoid(), title: '', url: '', description: '' };
      handleItemsChange([...activeTab.items, newItem]);
    }
  };

  const updateLinkItem = (itemId, field, value) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      const newItems = activeTab.items.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      );
      handleItemsChange(newItems);
    }
  };

  const deleteLinkItem = (itemId) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      handleItemsChange(activeTab.items.filter(item => item.id !== itemId));
    }
  };

  // 컨텐츠 렌더러
  const renderTabContent = (tab) => {
    const feature = tabFeatures[tab.feature];
    
    switch (tab.feature) {
      case 'checklist':
        return (
          <div className="space-y-3">
            {tab.items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 group py-1">
                <button
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`
                    mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200
                    ${item.checked 
                      ? `${getFeatureColor('checklist', 'bg')} border-transparent text-white` 
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                    }
                  `}
                >
                  {item.checked && (
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                  placeholder="할 일을 입력하세요..."
                  className={`
                    flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400
                    ${item.checked ? 'line-through opacity-60' : ''}
                  `}
                />
                <button
                  onClick={() => deleteChecklistItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={addChecklistItem}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>항목 추가</span>
            </button>
          </div>
        );

      case 'links':
        return (
          <div className="space-y-4">
            {tab.items.map((item) => (
              <div key={item.id} className="group">
                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateLinkItem(item.id, 'title', e.target.value)}
                      placeholder="링크 제목"
                      className="w-full bg-transparent border-none outline-none font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    />
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => updateLinkItem(item.id, 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-transparent border-none outline-none text-blue-600 dark:text-blue-400 text-sm placeholder-gray-400"
                    />
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLinkItem(item.id, 'description', e.target.value)}
                      placeholder="설명 (선택사항)"
                      className="w-full bg-transparent border-none outline-none text-gray-600 dark:text-gray-400 text-sm placeholder-gray-400"
                    />
                  </div>
                  <button
                    onClick={() => deleteLinkItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addLinkItem}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>링크 추가</span>
            </button>
          </div>
        );

      case 'code':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <select
                value={tab.settings?.language || 'javascript'}
                onChange={(e) => {
                  setTabs(prev => prev.map(t => 
                    t.id === tab.id ? { 
                      ...t, 
                      settings: { ...t.settings, language: e.target.value }
                    } : t
                  ));
                }}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
            <div className="relative">
              <textarea
                value={tab.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={feature.placeholder}
                className="w-full min-h-[200px] resize-none bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg font-mono text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                style={{ 
                  fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                  lineHeight: '1.6'
                }}
              />
            </div>
          </div>
        );

      default:
        return (
          <textarea
            value={tab.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={feature.placeholder}
            className="w-full min-h-[200px] resize-none border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 text-base leading-relaxed focus:outline-none"
            style={{
              fontFamily: textFormat?.fontFamily || '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: `${textFormat?.fontSize || 16}px`
            }}
          />
        );
    }
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div 
      ref={containerRef}
      className={`
        relative w-full min-h-[400px] 
        bg-white dark:bg-gray-900 
        border border-gray-200 dark:border-gray-800 
        rounded-xl
        transition-all duration-300 ease-out
        ${isHovered || isFocused ? 'shadow-lg border-gray-300 dark:border-gray-700' : 'shadow-sm'}
        group
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 편집 도구 - 우상단 */}
      <div className={`
        absolute top-3 right-3 z-20 flex items-center gap-1
        transition-all duration-300 ease-out
        ${isHovered || isFocused ? 'opacity-100' : 'opacity-0'}
      `}>
        {!readOnly && onRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            title="블록 삭제"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* 탭 바 */}
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <div key={tab.id} className="relative group/tab">
                <button
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${tab.id === activeTabId 
                      ? `${getFeatureColor(tab.feature, 'bg')} text-white shadow-sm` 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <span className="text-sm font-mono">
                    {tabFeatures[tab.feature]?.icon}
                  </span>
                  
                  {editingTabId === tab.id ? (
                    <input
                      type="text"
                      value={newTabTitle}
                      onChange={(e) => setNewTabTitle(e.target.value)}
                      onBlur={() => handleTitleChange(tab.id, newTabTitle)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTitleChange(tab.id, newTabTitle);
                        } else if (e.key === 'Escape') {
                          setEditingTabId(null);
                        }
                      }}
                      className="bg-transparent border-none outline-none text-current w-20 min-w-0"
                      autoFocus
                    />
                  ) : (
                    <span
                      onDoubleClick={() => {
                        if (!readOnly) {
                          setEditingTabId(tab.id);
                          setNewTabTitle(tab.title);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {tab.title}
                    </span>
                  )}
                  
                  {/* 탭 액션 버튼들 */}
                  {!readOnly && (isHovered || tab.id === activeTabId) && (
                    <div className="flex items-center gap-1 ml-1">
                      {/* 탭 설정 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTabSettings(showTabSettings === tab.id ? null : tab.id);
                        }}
                        className="p-0.5 text-current/60 hover:text-current rounded transition-colors duration-200"
                        title="탭 설정"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      {/* 탭 삭제 */}
                      {tabs.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTab(tab.id);
                          }}
                          className="p-0.5 text-current/60 hover:text-red-500 rounded transition-colors duration-200"
                          title="탭 삭제"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </button>

                {/* 탭 설정 드롭다운 */}
                {showTabSettings === tab.id && (
                  <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 min-w-40">
                    <div className="p-2 space-y-1">
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">기능 변경</div>
                      {Object.entries(tabFeatures).map(([key, feature]) => (
                        <button
                          key={key}
                          onClick={() => handleFeatureChange(tab.id, key)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors duration-200
                            ${tab.feature === key 
                              ? `${getFeatureColor(key, 'light')} ${getFeatureColor(key, 'text')}` 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          <span className="font-mono text-sm">{feature.icon}</span>
                          <span>{feature.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* 탭 추가 버튼 */}
          {!readOnly && (isHovered || isFocused) && (
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                title="새 탭 추가"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>탭 추가</span>
              </button>

              {showAddMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 min-w-48">
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">탭 종류</div>
                    {Object.entries(tabFeatures).map(([key, feature]) => (
                      <button
                        key={key}
                        onClick={() => addNewTab(key)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                      >
                        <span className="font-mono text-sm">{feature.icon}</span>
                        <span>{feature.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-6">
        {activeTab && (
          <div 
            onFocus={() => {
              setIsFocused(true);
              if (onFocus) onFocus();
              if (onEditingChange) onEditingChange(true);
            }}
            onBlur={(e) => {
              // 현재 요소 내부로 포커스가 이동하는지 확인
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsFocused(false);
                if (onEditingChange) onEditingChange(false);
              }
            }}
          >
            {renderTabContent(activeTab)}
            
            {/* 빈 상태 플레이스홀더 */}
            {!activeTab.content && !activeTab.items?.length && !isFocused && (
              <div className="flex items-center justify-center min-h-[200px] text-center">
                <div className="text-gray-400 dark:text-gray-600">
                  <div className="text-4xl mb-3 font-mono opacity-40">
                    {tabFeatures[activeTab.feature]?.icon}
                  </div>
                  <p className="text-lg font-medium opacity-60">{activeTab.title}</p>
                  <p className="text-sm opacity-40 mt-1">
                    클릭하여 {tabFeatures[activeTab.feature]?.name}을 시작하세요
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 정보 */}
      <div className={`
        absolute bottom-3 left-6 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-600
        transition-opacity duration-300
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `}>
        <span>{tabs.length}개 탭</span>
        {activeTab && (
          <span className="flex items-center gap-1">
            <span className="font-mono">{tabFeatures[activeTab.feature]?.icon}</span>
            <span>{tabFeatures[activeTab.feature]?.name}</span>
          </span>
        )}
      </div>

      {/* 외부 클릭으로 드롭다운 닫기 */}
      {(showTabSettings || showAddMenu) && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => {
            setShowTabSettings(null);
            setShowAddMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default TabLayout;