/**
 * 타임라인 디자인 블록 컴포넌트 (Premium Version)
 * 
 * @description 미니멀하고 현대적인 타임라인 디자인 - 노션급 기능과 편의성
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';

export const TimelineBlock = ({
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
  // 타임라인 설정 상태
  const [timelineSettings, setTimelineSettings] = useState({
    orientation: block.metadata?.orientation || 'vertical', // vertical, horizontal
    style: block.metadata?.style || 'modern', // modern, classic, minimal
    showDates: block.metadata?.showDates !== false,
    showConnector: block.metadata?.showConnector !== false,
    colorTheme: block.metadata?.colorTheme || 'blue', // blue, green, purple, orange
    animation: block.metadata?.animation !== false,
    ...block.metadata
  });

  // 타임라인 아이템들
  const [timelineItems, setTimelineItems] = useState(block.metadata?.items || [
    {
      id: nanoid(),
      title: '프로젝트 시작',
      content: '새로운 프로젝트를 시작했습니다. 초기 계획과 목표를 설정하고 팀원들과 킥오프 미팅을 진행했습니다.',
      date: '2024-01-15',
      time: '09:00',
      type: 'milestone',
      color: '#3B82F6',
      icon: '🚀'
    },
    {
      id: nanoid(),
      title: '개발 1단계 완료',
      content: '핵심 기능 개발을 완료했습니다. 사용자 인터페이스와 기본 기능들이 구현되었습니다.',
      date: '2024-02-28',
      time: '17:30',
      type: 'achievement',
      color: '#10B981',
      icon: '✅'
    },
    {
      id: nanoid(),
      title: '베타 테스트 시작',
      content: '내부 베타 테스트를 시작했습니다. 다양한 시나리오에서 테스트를 진행하고 피드백을 수집하고 있습니다.',
      date: '2024-03-15',
      time: '10:00',
      type: 'event',
      color: '#8B5CF6',
      icon: '🧪'
    },
    {
      id: nanoid(),
      title: '최종 출시',
      content: '모든 테스트를 완료하고 최종 버전을 출시했습니다. 사용자들의 긍정적인 반응을 받고 있습니다.',
      date: '2024-04-01',
      time: '12:00',
      type: 'milestone',
      color: '#F59E0B',
      icon: '🎉'
    }
  ]);

  // UI 상태
  const [isHovered, setIsHovered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const containerRef = useRef(null);
  const settingsRef = useRef(null);

  // 색상 테마 정의
  const colorThemes = {
    blue: { primary: '#3B82F6', secondary: '#EFF6FF', accent: '#1D4ED8' },
    green: { primary: '#10B981', secondary: '#ECFDF5', accent: '#059669' },
    purple: { primary: '#8B5CF6', secondary: '#F3E8FF', accent: '#7C3AED' },
    orange: { primary: '#F59E0B', secondary: '#FFFBEB', accent: '#D97706' },
    red: { primary: '#EF4444', secondary: '#FEF2F2', accent: '#DC2626' },
    gray: { primary: '#6B7280', secondary: '#F9FAFB', accent: '#374151' }
  };

  // 아이템 타입별 설정
  const itemTypes = {
    milestone: { label: '마일스톤', icon: '🎯', color: '#3B82F6' },
    achievement: { label: '성과', icon: '✅', color: '#10B981' },
    event: { label: '이벤트', icon: '📅', color: '#8B5CF6' },
    note: { label: '노트', icon: '📝', color: '#F59E0B' },
    warning: { label: '주의사항', icon: '⚠️', color: '#EF4444' },
    info: { label: '정보', icon: 'ℹ️', color: '#06B6D4' }
  };

  // 템플릿 정의
  const templates = [
    {
      name: '프로젝트 타임라인',
      items: [
        { title: '프로젝트 계획', content: '프로젝트 목표 설정 및 계획 수립', type: 'milestone', icon: '📋' },
        { title: '개발 시작', content: '개발 작업 착수', type: 'event', icon: '🚀' },
        { title: '중간 점검', content: '진행 상황 점검 및 조정', type: 'note', icon: '📊' },
        { title: '베타 테스트', content: '베타 버전 테스트 진행', type: 'event', icon: '🧪' },
        { title: '최종 출시', content: '제품 최종 출시', type: 'achievement', icon: '🎉' }
      ]
    },
    {
      name: '학습 로드맵',
      items: [
        { title: '기초 학습', content: '기본 개념 및 이론 학습', type: 'milestone', icon: '📚' },
        { title: '실습 프로젝트', content: '실제 프로젝트를 통한 실습', type: 'event', icon: '💻' },
        { title: '중급 단계', content: '중급 기술 및 패턴 학습', type: 'milestone', icon: '📈' },
        { title: '고급 학습', content: '고급 기술 및 아키텍처 학습', type: 'achievement', icon: '🎓' }
      ]
    },
    {
      name: '제품 개발',
      items: [
        { title: '아이디어 구상', content: '제품 아이디어 발굴 및 검증', type: 'milestone', icon: '💡' },
        { title: '프로토타입', content: '초기 프로토타입 제작', type: 'event', icon: '🔧' },
        { title: '사용자 테스트', content: '사용자 피드백 수집', type: 'note', icon: '👥' },
        { title: '정식 출시', content: '정식 제품 출시', type: 'achievement', icon: '🚀' }
      ]
    }
  ];

  // 메타데이터 업데이트
  const updateMetadata = useCallback((updates) => {
    if (!readOnly) {
      onUpdate({
        metadata: {
          ...block.metadata,
          ...updates
        }
      });
    }
  }, [block.metadata, onUpdate, readOnly]);

  // 설정 변경
  const handleSettingChange = useCallback((key, value) => {
    const newSettings = { ...timelineSettings, [key]: value };
    setTimelineSettings(newSettings);
    updateMetadata(newSettings);
  }, [timelineSettings, updateMetadata]);

  // 타임라인 아이템 업데이트
  const updateTimelineItems = useCallback((newItems) => {
    setTimelineItems(newItems);
    updateMetadata({ items: newItems });
  }, [updateMetadata]);

  // 아이템 추가
  const addTimelineItem = useCallback((type = 'event') => {
    const newItem = {
      id: nanoid(),
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      type: type,
      color: itemTypes[type]?.color || '#3B82F6',
      icon: itemTypes[type]?.icon || '📅'
    };
    updateTimelineItems([...timelineItems, newItem]);
    setEditingItem(newItem.id);
  }, [timelineItems, updateTimelineItems]);

  // 아이템 삭제
  const removeTimelineItem = useCallback((itemId) => {
    if (timelineItems.length <= 1) return;
    const filteredItems = timelineItems.filter(item => item.id !== itemId);
    updateTimelineItems(filteredItems);
  }, [timelineItems, updateTimelineItems]);

  // 아이템 내용 업데이트
  const updateItemField = useCallback((itemId, field, value) => {
    const updatedItems = timelineItems.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    updateTimelineItems(updatedItems);
  }, [timelineItems, updateTimelineItems]);

  // 템플릿 적용
  const applyTemplate = useCallback((template) => {
    const newItems = template.items.map((item, index) => ({
      id: nanoid(),
      title: item.title,
      content: item.content,
      date: new Date(Date.now() + index * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 일주일씩 간격
      time: '09:00',
      type: item.type,
      color: itemTypes[item.type]?.color || '#3B82F6',
      icon: item.icon
    }));
    updateTimelineItems(newItems);
    setShowTemplates(false);
  }, [updateTimelineItems]);


  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
      if (!event.target.closest('.color-picker-panel')) {
        setShowColorPicker(null);
      }
      if (!event.target.closest('.templates-panel')) {
        setShowTemplates(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isHovered || readOnly) return;

      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        addTimelineItem();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, readOnly, addTimelineItem]);

  // 날짜 포매팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div 
      className={`timeline-block-wrapper timeline-${timelineSettings.orientation} theme-${timelineSettings.colorTheme}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={containerRef}
    >
      {/* 툴바 */}
      {isHovered && !readOnly && (
        <div className="timeline-toolbar">
          <div className="toolbar-left">
            <button
              className="toolbar-button"
              onClick={() => setShowSettings(!showSettings)}
              title="타임라인 설정"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            
            <button
              className="toolbar-button"
              onClick={() => setShowTemplates(!showTemplates)}
              title="템플릿"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="6" cy="3" r="1" fill="currentColor"/>
                <circle cx="6" cy="8" r="1" fill="currentColor"/>
                <circle cx="6" cy="13" r="1" fill="currentColor"/>
              </svg>
            </button>

            <div className="add-button-group">
              {Object.entries(itemTypes).map(([type, config]) => (
                <button
                  key={type}
                  className="toolbar-button add-item"
                  onClick={() => addTimelineItem(type)}
                  title={`${config.label} 추가`}
                >
                  <span style={{ fontSize: '12px' }}>{config.icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-right">
            <span className="timeline-info">
              {timelineItems.length} items • {timelineSettings.orientation} • {timelineSettings.style}
            </span>
          </div>
        </div>
      )}

      {/* 설정 패널 */}
      {showSettings && (
        <div className="timeline-settings-panel" ref={settingsRef}>
          <div className="settings-header">
            <h4>타임라인 설정</h4>
            <button 
              className="close-button"
              onClick={() => setShowSettings(false)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="settings-content">
            <div className="setting-group">
              <label>방향</label>
              <div className="orientation-buttons">
                {[
                  { value: 'vertical', label: '세로', icon: '↕️' },
                  { value: 'horizontal', label: '가로', icon: '↔️' }
                ].map(option => (
                  <button
                    key={option.value}
                    className={`orientation-button ${timelineSettings.orientation === option.value ? 'active' : ''}`}
                    onClick={() => handleSettingChange('orientation', option.value)}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>스타일</label>
              <select
                value={timelineSettings.style}
                onChange={(e) => handleSettingChange('style', e.target.value)}
                className="setting-select"
              >
                <option value="modern">모던</option>
                <option value="classic">클래식</option>
                <option value="minimal">미니멀</option>
              </select>
            </div>

            <div className="setting-group">
              <label>색상 테마</label>
              <div className="color-theme-grid">
                {Object.entries(colorThemes).map(([theme, colors]) => (
                  <button
                    key={theme}
                    className={`color-theme-button ${timelineSettings.colorTheme === theme ? 'active' : ''}`}
                    onClick={() => handleSettingChange('colorTheme', theme)}
                    style={{ backgroundColor: colors.primary }}
                    title={theme}
                  />
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={timelineSettings.showDates}
                  onChange={(e) => handleSettingChange('showDates', e.target.checked)}
                />
                날짜 표시
              </label>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={timelineSettings.showConnector}
                  onChange={(e) => handleSettingChange('showConnector', e.target.checked)}
                />
                연결선 표시
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 템플릿 패널 */}
      {showTemplates && (
        <div className="templates-panel">
          <div className="templates-header">
            <h4>템플릿 선택</h4>
            <button 
              className="close-button"
              onClick={() => setShowTemplates(false)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="templates-content">
            {templates.map((template, index) => (
              <button
                key={index}
                className="template-item"
                onClick={() => applyTemplate(template)}
              >
                <span className="template-name">{template.name}</span>
                <span className="template-count">{template.items.length} items</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 타임라인 컨테이너 */}
      <div className="timeline-container">
        {timelineItems.map((item, index) => (
          <div
            key={item.id}
            className={`timeline-item ${selectedItem === item.id ? 'selected' : ''} ${editingItem === item.id ? 'editing' : ''}`}
            onClick={() => setSelectedItem(item.id)}
          >
            {/* 타임라인 노드 */}
            <div className="timeline-node">
              <div 
                className="timeline-dot"
                style={{ backgroundColor: item.color }}
              >
                <span className="timeline-icon">{item.icon}</span>
              </div>
              {timelineSettings.showConnector && index < timelineItems.length - 1 && (
                <div 
                  className="timeline-connector"
                  style={{ backgroundColor: colorThemes[timelineSettings.colorTheme]?.primary }}
                />
              )}
            </div>

            {/* 타임라인 콘텐츠 */}
            <div className="timeline-content">
              {/* 날짜/시간 */}
              {timelineSettings.showDates && (
                <div className="timeline-date">
                  <span className="date">{formatDate(item.date)}</span>
                  <span className="time">{item.time}</span>
                  <span className="type-badge" style={{ backgroundColor: item.color }}>
                    {itemTypes[item.type]?.label}
                  </span>
                </div>
              )}

              {/* 제목 */}
              <div className="timeline-title">
                {editingItem === item.id ? (
                  <input
                    className="title-editor"
                    value={item.title}
                    onChange={(e) => updateItemField(item.id, 'title', e.target.value)}
                    onBlur={() => setEditingItem(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingItem(null);
                      if (e.key === 'Escape') setEditingItem(null);
                    }}
                    placeholder="제목을 입력하세요..."
                    autoFocus
                  />
                ) : (
                  <h3 
                    onClick={() => !readOnly && setEditingItem(item.id)}
                    className={item.title ? '' : 'placeholder'}
                  >
                    {item.title || '제목을 입력하세요'}
                  </h3>
                )}
              </div>

              {/* 내용 */}
              <div className="timeline-description">
                {editingItem === item.id ? (
                  <textarea
                    className="content-editor"
                    value={item.content}
                    onChange={(e) => updateItemField(item.id, 'content', e.target.value)}
                    onBlur={() => setEditingItem(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        setEditingItem(null);
                      }
                      if (e.key === 'Escape') {
                        setEditingItem(null);
                      }
                    }}
                    placeholder="내용을 입력하세요..."
                    rows="3"
                    autoFocus
                  />
                ) : (
                  <div 
                    className={`content-display ${item.content ? '' : 'placeholder'}`}
                    onClick={() => !readOnly && setEditingItem(item.id)}
                  >
                    {item.content || '내용을 입력하세요'}
                  </div>
                )}
              </div>

              {/* 아이템 툴바 */}
              {isHovered && !readOnly && selectedItem === item.id && (
                <div className="item-toolbar">
                  <button
                    className="item-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item.id);
                    }}
                    title="편집"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M8.5 1.5L10.5 3.5L3.5 10.5H1.5V8.5L8.5 1.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => updateItemField(item.id, 'date', e.target.value)}
                    className="date-input"
                    title="날짜 변경"
                  />

                  <input
                    type="time"
                    value={item.time}
                    onChange={(e) => updateItemField(item.id, 'time', e.target.value)}
                    className="time-input"
                    title="시간 변경"
                  />

                  <select
                    value={item.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      updateItemField(item.id, 'type', newType);
                      updateItemField(item.id, 'color', itemTypes[newType]?.color);
                      updateItemField(item.id, 'icon', itemTypes[newType]?.icon);
                    }}
                    className="type-select"
                    title="타입 변경"
                  >
                    {Object.entries(itemTypes).map(([type, config]) => (
                      <option key={type} value={type}>{config.label}</option>
                    ))}
                  </select>

                  {timelineItems.length > 1 && (
                    <button
                      className="item-button item-button-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTimelineItem(item.id);
                      }}
                      title="삭제"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 3h8M4 3V1.5A.5.5 0 014.5 1h3a.5.5 0 01.5.5V3M5 5v3M7 5v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {timelineItems.length === 0 && (
        <div className="timeline-empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="2"/>
              <circle cx="24" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="24" cy="24" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="24" cy="36" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <p>타임라인 아이템을 추가하여 시작하세요</p>
          {!readOnly && (
            <button className="add-first-item" onClick={addTimelineItem}>
              첫 번째 아이템 추가
            </button>
          )}
        </div>
      )}

      {/* TimelineBlock 전용 스타일 */}
      <style jsx scoped>{`
        .timeline-block-wrapper {
          position: relative;
          margin: 16px 0;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .timeline-block-wrapper:hover {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* 툴바 */
        .timeline-toolbar {
          position: absolute;
          top: -40px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }

        .toolbar-left {
          display: flex;
          gap: 4px;
        }

        .toolbar-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          border-radius: 4px;
          color: rgb(107, 114, 128);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toolbar-button:hover {
          background: rgb(243, 244, 246);
          color: rgb(55, 65, 81);
        }

        .add-button-group {
          display: flex;
          gap: 2px;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 4px;
          overflow: hidden;
        }

        .add-button-group .toolbar-button {
          border-radius: 0;
          border: none;
          border-right: 1px solid rgb(229, 231, 235);
        }

        .add-button-group .toolbar-button:last-child {
          border-right: none;
        }

        .timeline-info {
          font-size: 12px;
          color: rgb(107, 114, 128);
          font-weight: 500;
        }

        /* 설정 패널 */
        .timeline-settings-panel {
          position: absolute;
          top: -40px;
          right: 0;
          width: 320px;
          background: white;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          z-index: 20;
        }

        .templates-panel {
          position: absolute;
          top: -40px;
          right: 60px;
          width: 280px;
          background: white;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          z-index: 20;
        }

        .settings-header,
        .templates-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid rgb(243, 244, 246);
        }

        .settings-header h4,
        .templates-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: rgb(31, 41, 55);
        }

        .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          border-radius: 4px;
          color: rgb(107, 114, 128);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgb(243, 244, 246);
          color: rgb(55, 65, 81);
        }

        .settings-content,
        .templates-content {
          padding: 16px;
        }

        .setting-group {
          margin-bottom: 16px;
        }

        .setting-group:last-child {
          margin-bottom: 0;
        }

        .setting-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgb(55, 65, 81);
          margin-bottom: 8px;
        }

        .orientation-buttons {
          display: flex;
          gap: 8px;
        }

        .orientation-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px;
          border: 1px solid rgb(229, 231, 235);
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1;
        }

        .orientation-button:hover {
          border-color: rgb(59, 130, 246);
        }

        .orientation-button.active {
          background: rgb(59, 130, 246);
          border-color: rgb(59, 130, 246);
          color: white;
        }

        .setting-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 6px;
          font-size: 14px;
          color: rgb(55, 65, 81);
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .setting-select:focus {
          outline: none;
          border-color: rgb(59, 130, 246);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .color-theme-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }

        .color-theme-button {
          width: 32px;
          height: 32px;
          border: 2px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .color-theme-button:hover {
          transform: scale(1.1);
        }

        .color-theme-button.active {
          border-color: rgb(55, 65, 81);
          box-shadow: 0 0 0 2px white, 0 0 0 4px rgb(59, 130, 246);
        }

        .checkbox-label {
          display: flex !important;
          flex-direction: row !important;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          margin: 0;
        }

        /* 템플릿 아이템 */
        .template-item {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 8px;
        }

        .template-item:last-child {
          margin-bottom: 0;
        }

        .template-item:hover {
          border-color: rgb(59, 130, 246);
          background: rgb(239, 246, 255);
        }

        .template-name {
          font-size: 14px;
          font-weight: 500;
          color: rgb(55, 65, 81);
        }

        .template-count {
          font-size: 12px;
          color: rgb(107, 114, 128);
        }

        /* 타임라인 컨테이너 */
        .timeline-container {
          background: white;
          border: 1px solid rgb(243, 244, 246);
          border-radius: 8px;
          padding: 24px;
          min-height: 200px;
        }

        /* 타임라인 아이템 */
        .timeline-item {
          position: relative;
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 16px;
          border-radius: 8px;
        }

        .timeline-item:last-child {
          margin-bottom: 0;
        }

        .timeline-item:hover {
          background: rgb(249, 250, 251);
        }

        .timeline-item.selected {
          background: rgb(239, 246, 255);
          border: 1px solid rgb(59, 130, 246);
        }

        .timeline-item.editing {
          background: rgb(236, 253, 245);
          border: 1px solid rgb(16, 185, 129);
        }

        /* 타임라인 노드 */
        .timeline-node {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .timeline-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 2;
        }

        .timeline-icon {
          font-size: 16px;
        }

        .timeline-connector {
          width: 2px;
          height: 40px;
          margin-top: 8px;
          opacity: 0.3;
        }

        /* 수평 타임라인 */
        .timeline-horizontal .timeline-container {
          display: flex;
          overflow-x: auto;
          padding: 24px 24px 40px 24px;
        }

        .timeline-horizontal .timeline-item {
          flex-direction: column;
          min-width: 280px;
          margin-bottom: 0;
          margin-right: 32px;
        }

        .timeline-horizontal .timeline-item:last-child {
          margin-right: 0;
        }

        .timeline-horizontal .timeline-node {
          flex-direction: row;
          align-items: center;
          margin-bottom: 16px;
        }

        .timeline-horizontal .timeline-connector {
          width: 40px;
          height: 2px;
          margin-top: 0;
          margin-left: 8px;
        }

        /* 타임라인 콘텐츠 */
        .timeline-content {
          flex: 1;
          min-width: 0;
        }

        .timeline-date {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .date {
          font-size: 12px;
          color: rgb(107, 114, 128);
          font-weight: 500;
        }

        .time {
          font-size: 12px;
          color: rgb(156, 163, 175);
        }

        .type-badge {
          font-size: 10px;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 500;
        }

        .timeline-title {
          margin-bottom: 12px;
        }

        .timeline-title h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: rgb(31, 41, 55);
          cursor: pointer;
        }

        .timeline-title h3.placeholder {
          color: rgb(156, 163, 175);
          font-style: italic;
        }

        .title-editor {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 16px;
          font-weight: 600;
          color: rgb(31, 41, 55);
          outline: none;
          border-bottom: 2px solid rgb(16, 185, 129);
          padding-bottom: 4px;
        }

        .timeline-description {
          line-height: 1.6;
        }

        .content-display {
          font-size: 14px;
          color: rgb(55, 65, 81);
          cursor: pointer;
          min-height: 20px;
          white-space: pre-wrap;
        }

        .content-display.placeholder {
          color: rgb(156, 163, 175);
          font-style: italic;
        }

        /* 내용 에디터 스타일 */
        .content-editor {
          width: 100%;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 6px;
          padding: 12px;
          min-height: 80px;
          font-size: 14px;
          line-height: 1.6;
          color: rgb(55, 65, 81);
          font-family: inherit;
          resize: vertical;
          outline: none;
        }

        .content-editor:focus {
          border-color: rgb(59, 130, 246);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* 아이템 툴바 */
        .item-toolbar {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgb(243, 244, 246);
          flex-wrap: wrap;
        }

        .item-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: 1px solid rgb(229, 231, 235);
          background: white;
          border-radius: 4px;
          color: rgb(107, 114, 128);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .item-button:hover {
          background: rgb(243, 244, 246);
          color: rgb(55, 65, 81);
        }

        .item-button-danger:hover {
          background: rgb(254, 226, 226);
          color: rgb(239, 68, 68);
          border-color: rgb(254, 202, 202);
        }

        .date-input,
        .time-input {
          padding: 4px 8px;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 4px;
          font-size: 12px;
          color: rgb(55, 65, 81);
          background: white;
        }

        .type-select {
          padding: 4px 8px;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 4px;
          font-size: 12px;
          color: rgb(55, 65, 81);
          background: white;
          cursor: pointer;
        }

        /* 빈 상태 */
        .timeline-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          color: rgb(107, 114, 128);
        }

        .empty-icon {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .timeline-empty-state p {
          margin: 0 0 16px 0;
          font-size: 14px;
        }

        .add-first-item {
          padding: 8px 16px;
          background: rgb(59, 130, 246);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-first-item:hover {
          background: rgb(37, 99, 235);
        }

        /* 색상 테마별 스타일 */
        .theme-blue .timeline-connector {
          background-color: #3B82F6;
        }

        .theme-green .timeline-connector {
          background-color: #10B981;
        }

        .theme-purple .timeline-connector {
          background-color: #8B5CF6;
        }

        .theme-orange .timeline-connector {
          background-color: #F59E0B;
        }

        .theme-red .timeline-connector {
          background-color: #EF4444;
        }

        .theme-gray .timeline-connector {
          background-color: #6B7280;
        }

        /* 다크모드 지원 */
        @media (prefers-color-scheme: dark) {
          .timeline-block-wrapper:hover {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          }

          .timeline-toolbar,
          .timeline-settings-panel,
          .templates-panel {
            background: rgb(31, 41, 55);
            border-color: rgb(55, 65, 81);
          }

          .settings-header,
          .templates-header {
            border-bottom-color: rgb(55, 65, 81);
          }

          .settings-header h4,
          .templates-header h4 {
            color: rgb(243, 244, 246);
          }

          .setting-group label {
            color: rgb(209, 213, 219);
          }

          .setting-select,
          .template-item {
            background: rgb(55, 65, 81);
            border-color: rgb(75, 85, 99);
            color: rgb(243, 244, 246);
          }

          .timeline-container {
            background: rgb(17, 24, 39);
            border-color: rgb(55, 65, 81);
          }

          .timeline-item:hover {
            background: rgb(31, 41, 55);
          }

          .timeline-title h3 {
            color: rgb(243, 244, 246);
          }

          .content-display {
            color: rgb(209, 213, 219);
          }

          .timeline-empty-state {
            color: rgb(156, 163, 175);
          }
        }
      `}</style>
    </div>
  );
};

export default TimelineBlock;