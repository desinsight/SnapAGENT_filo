import React, { useState, useRef, useEffect } from 'react';
import './TimelineBlock.css';

/**
 * TimelineBlock - Notion-style Timeline Component
 * @description 노션 스타일의 세련된 타임라인 블록 컴포넌트
 */
const TimelineBlock = ({ block, onUpdate, onFocus, readOnly = false, placeholder = "이벤트 추가", isEditing, onEditingChange }) => {
  const [events, setEvents] = useState(block.content?.events || []);
  const [viewMode, setViewMode] = useState(block.content?.viewMode || 'expanded'); // compact, expanded, gantt
  const [showCompleted, setShowCompleted] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(block.content?.isCollapsed || false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [draggedId, setDraggedId] = useState(null);
  const [isEditingTypes, setIsEditingTypes] = useState(false);
  const [editingTypeKey, setEditingTypeKey] = useState(null);
  const containerRef = useRef(null);

  // 기본 이벤트 타입
  const defaultEventTypes = {
    default: { label: '일반', icon: '○', color: '#6B7280' },
    milestone: { label: '마일스톤', icon: '◆', color: '#8B5CF6' },
    meeting: { label: '미팅', icon: '●', color: '#10B981' },
    deadline: { label: '마감일', icon: '▲', color: '#EF4444' },
    release: { label: '릴리즈', icon: '★', color: '#F59E0B' }
  };

  // 사용자 정의 이벤트 타입 (저장된 것이 있으면 사용, 없으면 기본값)
  const [eventTypes, setEventTypes] = useState(block.content?.eventTypes || defaultEventTypes);

  // 새 이벤트 폼 상태
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    description: '',
    type: 'default',
    color: '#6B7280',
    completed: false
  });

  useEffect(() => {
    const content = {
      events,
      viewMode,
      eventTypes,
      isCollapsed,
      updatedAt: new Date().toISOString()
    };
    onUpdate({ content });
  }, [events, viewMode, eventTypes, isCollapsed]);

  // 날짜 포맷팅 함수
  const formatDate = (dateStr, showYear = false) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return '오늘';
    if (date.toDateString() === yesterday.toDateString()) return '어제';
    if (date.toDateString() === tomorrow.toDateString()) return '내일';
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      year: showYear || date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  // 상대 시간 계산
  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}일 후`;
    if (days < 0) return `${Math.abs(days)}일 전`;
    return '오늘';
  };

  // 이벤트 정렬
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date + (a.time ? ` ${a.time}` : ''));
    const dateB = new Date(b.date + (b.time ? ` ${b.time}` : ''));
    return dateA - dateB;
  });

  // 필터링된 이벤트
  const filteredEvents = showCompleted 
    ? sortedEvents 
    : sortedEvents.filter(e => !e.completed);

  // 이벤트 추가
  const handleAddEvent = () => {
    if (!newEvent.title.trim()) return;
    
    const event = {
      ...newEvent,
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString()
    };
    
    setEvents([...events, event]);
    setNewEvent({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      description: '',
      type: 'default',
      color: '#3B82F6',
      completed: false
    });
    setIsAddingEvent(false);
  };

  // 이벤트 업데이트
  const updateEvent = (id, updates) => {
    setEvents(events.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  // 이벤트 삭제
  const deleteEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
  };

  // 드래그 앤 드롭
  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (draggedId === targetId) return;
    
    const draggedIndex = events.findIndex(e => e.id === draggedId);
    const targetIndex = events.findIndex(e => e.id === targetId);
    
    const newEvents = [...events];
    const [draggedEvent] = newEvents.splice(draggedIndex, 1);
    newEvents.splice(targetIndex, 0, draggedEvent);
    
    setEvents(newEvents);
    setDraggedId(null);
  };

  // 접힌 뷰 렌더링 (매우 간단한 리스트)
  const renderCollapsedView = () => (
    <div className="timeline-collapsed">
      {filteredEvents.slice(0, 3).map(event => (
        <div key={event.id} className={`collapsed-event ${event.completed ? 'completed' : ''}`}>
          <span className="collapsed-event-marker" style={{ color: eventTypes[event.type]?.color || '#6B7280' }}>
            {eventTypes[event.type]?.icon || '○'}
          </span>
          <span className="collapsed-event-title">{event.title}</span>
          <span className="collapsed-event-date">{formatDate(event.date)}</span>
        </div>
      ))}
      {filteredEvents.length > 3 && (
        <div className="collapsed-more">
          +{filteredEvents.length - 3}개 더보기
        </div>
      )}
      {filteredEvents.length === 0 && (
        <div className="collapsed-empty">이벤트 없음</div>
      )}
    </div>
  );

  // 컴팩트 뷰 렌더링
  const renderCompactView = () => (
    <div className="timeline-compact">
      {filteredEvents.map(event => (
        <div 
          key={event.id}
          className={`compact-event ${event.completed ? 'completed' : ''}`}
          onMouseEnter={() => setHoveredId(event.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div className="compact-event-marker" style={{ color: eventTypes[event.type].color }}>
            {eventTypes[event.type].icon}
          </div>
          <div className="compact-event-content">
            <span className="compact-event-date">{formatDate(event.date)}</span>
            <span className="compact-event-title">{event.title}</span>
            {event.time && <span className="compact-event-time">{event.time}</span>}
          </div>
        </div>
      ))}
    </div>
  );

  // 확장 뷰 렌더링
  const renderExpandedView = () => (
    <div className="timeline-expanded">
      {filteredEvents.map((event, idx) => (
        <div 
          key={event.id}
          className={`expanded-event ${event.completed ? 'completed' : ''} ${hoveredId === event.id ? 'hovered' : ''} ${draggedId === event.id ? 'dragging' : ''}`}
          draggable={!readOnly}
          onDragStart={(e) => handleDragStart(e, event.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, event.id)}
          onMouseEnter={() => setHoveredId(event.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div className="event-timeline-connector">
            <div 
              className="event-marker" 
              style={{ 
                backgroundColor: event.completed ? '#E5E7EB' : eventTypes[event.type].color,
                borderColor: eventTypes[event.type].color 
              }}
            >
              {event.completed && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {idx < filteredEvents.length - 1 && <div className="timeline-line"></div>}
          </div>
          
          <div className="event-card">
            <div className="event-header">
              <div className="event-header-left">
                {editingId === event.id ? (
                  <input
                    type="text"
                    value={event.title}
                    onChange={(e) => updateEvent(event.id, { title: e.target.value })}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                    className="event-title-input"
                    autoFocus
                  />
                ) : (
                  <h3 
                    className="event-title"
                    onClick={() => !readOnly && setEditingId(event.id)}
                  >
                    {event.title}
                  </h3>
                )}
                <div className="event-meta">
                  <span className="event-date">{formatDate(event.date, true)}</span>
                  {event.time && <span className="event-time">{event.time}</span>}
                  <span className="event-relative">{getRelativeTime(event.date)}</span>
                </div>
              </div>
              
              <div className="event-actions">
                <label className="event-checkbox">
                  <input
                    type="checkbox"
                    checked={event.completed}
                    onChange={(e) => updateEvent(event.id, { completed: e.target.checked })}
                    disabled={readOnly}
                  />
                  <span className="checkbox-custom"></span>
                </label>
                
                {!readOnly && (
                  <div className="event-menu">
                    <button
                      className="event-type-btn"
                      style={{ color: eventTypes[event.type].color }}
                      onClick={() => {
                        const types = Object.keys(eventTypes);
                        const currentIndex = types.indexOf(event.type);
                        const nextType = types[(currentIndex + 1) % types.length];
                        updateEvent(event.id, { type: nextType });
                      }}
                      title="이벤트 타입 변경"
                    >
                      {eventTypes[event.type].icon}
                    </button>
                    
                    <button
                      className="event-delete-btn"
                      onClick={() => deleteEvent(event.id)}
                      title="삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {event.description && (
              <p className="event-description">{event.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="timeline-block-container" ref={containerRef} onClick={onFocus}>
      <div className="timeline-header">
        <div className="timeline-title" onClick={() => setIsCollapsed(!isCollapsed)}>
          <button className="collapse-toggle-btn" title={isCollapsed ? "펴기" : "접기"}>
            <svg 
              className={`w-4 h-4 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="timeline-icon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2>타임라인</h2>
          {isCollapsed && events.length > 0 && (
            <span className="timeline-count">({events.length})</span>
          )}
        </div>
        
        {!isCollapsed && (
          <div className="timeline-controls">
            <button
              className={`view-mode-btn ${viewMode === 'compact' ? 'active' : ''}`}
              onClick={() => setViewMode('compact')}
              title="컴팩트 뷰"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'expanded' ? 'active' : ''}`}
              onClick={() => setViewMode('expanded')}
              title="확장 뷰"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </button>
            
            <div className="timeline-separator"></div>
            
            <label className="show-completed-toggle">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
              />
              <span>완료 항목 표시</span>
            </label>
          </div>
        )}
      </div>

      {!readOnly && !isCollapsed && (
        <div 
          className={`add-event-trigger ${isAddingEvent ? 'active' : ''}`}
          onClick={() => !isAddingEvent && setIsAddingEvent(true)}
        >
          {isAddingEvent ? (
            <div className="add-event-form" onClick={(e) => e.stopPropagation()}>
              <div className="form-row">
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="이벤트 제목"
                  className="event-input-title"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
                />
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="event-input-date"
                />
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="event-input-time"
                />
              </div>
              
              <div className="form-row">
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="설명 추가 (선택사항)"
                  className="event-input-description"
                  rows="2"
                />
              </div>
              
              <div className="form-row form-actions">
                <div className="event-type-selector">
                  {Object.entries(eventTypes).map(([type, config]) => (
                    <button
                      key={type}
                      className={`type-option ${newEvent.type === type ? 'active' : ''}`}
                      onClick={() => setNewEvent({ ...newEvent, type })}
                      style={{ 
                        color: newEvent.type === type ? config.color : '#6B7280',
                        borderColor: newEvent.type === type ? config.color : 'transparent'
                      }}
                    >
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </button>
                  ))}
                  <button
                    className="type-option type-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTypes(true);
                    }}
                    title="타입 편집"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </button>
                </div>
                
                <div className="form-buttons">
                  <button 
                    className="btn-cancel"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddingEvent(false);
                      setNewEvent({
                        title: '',
                        date: new Date().toISOString().split('T')[0],
                        time: '',
                        description: '',
                        type: 'default',
                        color: '#3B82F6',
                        completed: false
                      });
                    }}
                  >
                    취소
                  </button>
                  <button 
                    className="btn-add"
                    onClick={handleAddEvent}
                    disabled={!newEvent.title.trim()}
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="add-event-placeholder">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{placeholder}</span>
            </div>
          )}
        </div>
      )}

      <div className="timeline-content">
        {isCollapsed ? (
          renderCollapsedView()
        ) : (
          filteredEvents.length > 0 ? (
            viewMode === 'compact' ? renderCompactView() : renderExpandedView()
          ) : (
            <div className="timeline-empty">
              <div className="empty-icon">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="empty-title">타임라인이 비어 있습니다</p>
              <p className="empty-subtitle">첫 번째 이벤트를 추가해보세요</p>
            </div>
          )
        )}
      </div>

      {/* 타입 편집 모달 */}
      {isEditingTypes && (
        <div className="type-editor-modal" onClick={() => setIsEditingTypes(false)}>
          <div className="type-editor-content" onClick={(e) => e.stopPropagation()}>
            <div className="type-editor-header">
              <h3>이벤트 타입 편집</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setIsEditingTypes(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="type-editor-list">
              {Object.entries(eventTypes).map(([key, type]) => (
                <div key={key} className="type-editor-item">
                  {editingTypeKey === key ? (
                    <>
                      <input
                        type="text"
                        value={type.icon}
                        onChange={(e) => {
                          const newTypes = { ...eventTypes };
                          newTypes[key].icon = e.target.value.slice(0, 2);
                          setEventTypes(newTypes);
                        }}
                        className="type-icon-input"
                        placeholder="아이콘"
                      />
                      <input
                        type="text"
                        value={type.label}
                        onChange={(e) => {
                          const newTypes = { ...eventTypes };
                          newTypes[key].label = e.target.value;
                          setEventTypes(newTypes);
                        }}
                        className="type-label-input"
                        placeholder="라벨"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingTypeKey(null);
                          }
                        }}
                      />
                      <input
                        type="color"
                        value={type.color}
                        onChange={(e) => {
                          const newTypes = { ...eventTypes };
                          newTypes[key].color = e.target.value;
                          setEventTypes(newTypes);
                        }}
                        className="type-color-input"
                      />
                      <button
                        className="type-save-btn"
                        onClick={() => setEditingTypeKey(null)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="type-preview" style={{ color: type.color }}>
                        {type.icon} {type.label}
                      </span>
                      <div className="type-actions">
                        <button
                          className="type-edit-item-btn"
                          onClick={() => setEditingTypeKey(key)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {key !== 'default' && (
                          <button
                            className="type-delete-btn"
                            onClick={() => {
                              const newTypes = { ...eventTypes };
                              delete newTypes[key];
                              setEventTypes(newTypes);
                              // 삭제된 타입을 사용하는 이벤트를 default로 변경
                              setEvents(events.map(e => e.type === key ? { ...e, type: 'default' } : e));
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            <button
              className="add-type-btn"
              onClick={() => {
                const newKey = `custom_${Date.now()}`;
                setEventTypes({
                  ...eventTypes,
                  [newKey]: { label: '새 타입', icon: '●', color: '#6B7280' }
                });
                setEditingTypeKey(newKey);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 타입 추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineBlock;