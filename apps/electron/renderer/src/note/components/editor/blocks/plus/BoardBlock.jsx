import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import './BoardBlock.css';

/**
 * BoardBlock - Notion-style Kanban Board
 * @description 노션 스타일의 세련된 칸반 보드 블록 컴포넌트
 */

const defaultBoard = [
  { id: nanoid(), title: '할 일', cards: [], color: '#6B7280' },
  { id: nanoid(), title: '진행 중', cards: [], color: '#F59E0B' },
  { id: nanoid(), title: '완료', cards: [], color: '#10B981' },
];

const cardPriorities = {
  low: { label: '낮음', color: '#6B7280', bgColor: '#F3F4F6' },
  medium: { label: '보통', color: '#F59E0B', bgColor: '#FEF3C7' },
  high: { label: '높음', color: '#EF4444', bgColor: '#FEE2E2' },
  urgent: { label: '긴급', color: '#DC2626', bgColor: '#FECACA' }
};

const cardLabels = {
  bug: { label: '버그', color: '#EF4444', bgColor: '#FEE2E2' },
  feature: { label: '기능', color: '#3B82F6', bgColor: '#DBEAFE' },
  design: { label: '디자인', color: '#8B5CF6', bgColor: '#EDE9FE' },
  docs: { label: '문서', color: '#10B981', bgColor: '#D1FAE5' },
  test: { label: '테스트', color: '#F59E0B', bgColor: '#FEF3C7' }
};

function normalizeBoardContent(content) {
  if (!content || !Array.isArray(content.columns)) {
    return {
      isCollapsed: false,
      columns: defaultBoard,
      settings: { showPriority: true, showLabels: true },
      customLabels: cardLabels
    };
  }
  
  return {
    isCollapsed: content.isCollapsed || false,
    columns: content.columns.map(col => ({
      ...col,
      id: col.id || nanoid(),
      color: col.color || '#6B7280',
      cards: Array.isArray(col.cards)
        ? col.cards.map(card => ({
            ...card,
            id: card.id || nanoid(),
            priority: card.priority || 'medium',
            labels: card.labels || [],
            description: card.description || '',
            createdAt: card.createdAt || new Date().toISOString()
          }))
        : []
    })),
    settings: content.settings || { showPriority: true, showLabels: true },
    customLabels: content.customLabels || cardLabels
  };
}

const BoardBlock = ({ block, onUpdate, onFocus, readOnly = false, placeholder = '칸반 보드', isEditing, onEditingChange }) => {
  const boardData = normalizeBoardContent(block.content);
  const [isCollapsed, setIsCollapsed] = useState(boardData.isCollapsed);
  const [columns, setColumns] = useState(boardData.columns);
  const [settings, setSettings] = useState(boardData.settings);
  const [customLabels, setCustomLabels] = useState(boardData.customLabels);
  const [newColTitle, setNewColTitle] = useState('');
  const [dragColIdx, setDragColIdx] = useState(null);
  const [dragCard, setDragCard] = useState(null);
  const [editingColIdx, setEditingColIdx] = useState(null);
  const [editingCard, setEditingCard] = useState({ colIdx: null, cardIdx: null });
  const [newCard, setNewCard] = useState({});
  const [showCardForm, setShowCardForm] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  const [editingLabelKey, setEditingLabelKey] = useState(null);
  const [showLabelDropdown, setShowLabelDropdown] = useState(null); // cardId를 저장
  const containerRef = useRef(null);
  
  // 슬라이드 상태
  const [startIndex, setStartIndex] = useState(0);
  const columnsPerView = 3;
  const canGoPrev = startIndex > 0;
  // 컬럼 추가 영역이 다음 페이지에 있을 때도 다음 버튼 활성화
  const canGoNext = startIndex + columnsPerView < columns.length || 
                    (columns.length % columnsPerView === 0 && columns.length > 0 && startIndex + columnsPerView === columns.length);
  const visibleColumns = columns.slice(startIndex, startIndex + columnsPerView);

  // 상위에 변경 반영
  const updateBoard = (updatedColumns = columns, updatedSettings = settings, collapsed = isCollapsed, labels = customLabels) => {
    const content = {
      isCollapsed: collapsed,
      columns: updatedColumns,
      settings: updatedSettings,
      customLabels: labels,
      updatedAt: new Date().toISOString()
    };
    onUpdate({ content });
  };

  useEffect(() => {
    updateBoard(columns, settings, isCollapsed, customLabels);
  }, [columns, settings, isCollapsed, customLabels]);

  // 슬라이드 이동 함수
  const goToPrev = () => {
    if (canGoPrev) {
      setStartIndex(prev => Math.max(0, prev - columnsPerView));
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      const nextIndex = startIndex + columnsPerView;
      // 컬럼이 3의 배수이고 현재 페이지가 마지막일 때, 다음 페이지로 이동해서 add column 영역 표시
      if (columns.length % columnsPerView === 0 && nextIndex === columns.length) {
        setStartIndex(nextIndex);
      } else {
        setStartIndex(Math.min(columns.length - columnsPerView, nextIndex));
      }
    }
  };

  // 컬럼 추가
  const handleAddCol = () => {
    if (!newColTitle.trim()) return;
    const newColumn = {
      id: nanoid(),
      title: newColTitle.trim(),
      cards: [],
      color: '#6B7280'
    };
    const updated = [...columns, newColumn];
    setColumns(updated);
    setNewColTitle('');
    
    // 컬럼 추가 후, 새로 추가된 컬럼이 보이도록 페이지 조정
    const newColumnIndex = updated.length - 1;
    const pageForNewColumn = Math.floor(newColumnIndex / columnsPerView) * columnsPerView;
    setStartIndex(pageForNewColumn);
  };

  // 컬럼 삭제
  const handleDeleteCol = (colIdx) => {
    if (columns[colIdx].cards.length > 0) {
      if (!window.confirm('이 컬럼에 카드가 있습니다. 정말 삭제하시겠습니까?')) {
        return;
      }
    }
    const updated = columns.filter((_, i) => i !== colIdx);
    setColumns(updated);
  };

  // 컬럼 이름/색상 변경
  const handleColChange = (colIdx, changes) => {
    const updated = columns.map((col, i) => 
      i === colIdx ? { ...col, ...changes } : col
    );
    setColumns(updated);
  };

  // 카드 추가
  const handleAddCard = (colIdx) => {
    const cardData = newCard[columns[colIdx].id];
    if (!cardData?.title?.trim()) return;
    
    const newCardItem = {
      id: nanoid(),
      title: cardData.title.trim(),
      description: cardData.description || '',
      priority: cardData.priority || 'medium',
      labels: cardData.labels || [],
      createdAt: new Date().toISOString()
    };
    
    const updated = columns.map((col, i) =>
      i === colIdx ? { ...col, cards: [...col.cards, newCardItem] } : col
    );
    setColumns(updated);
    setNewCard({ ...newCard, [columns[colIdx].id]: { title: '', description: '', priority: 'medium', labels: [] } });
    setShowCardForm({ ...showCardForm, [columns[colIdx].id]: false });
  };

  // 카드 삭제
  const handleDeleteCard = (colIdx, cardIdx) => {
    const updated = columns.map((col, i) =>
      i === colIdx ? { ...col, cards: col.cards.filter((_, j) => j !== cardIdx) } : col
    );
    setColumns(updated);
  };

  // 카드 변경
  const handleCardChange = (colIdx, cardIdx, changes) => {
    const updated = columns.map((col, i) =>
      i === colIdx ? {
        ...col,
        cards: col.cards.map((card, j) => j === cardIdx ? { ...card, ...changes } : card)
      } : col
    );
    setColumns(updated);
  };

  // 드래그 앤 드롭
  const handleColDragStart = (idx) => setDragColIdx(idx);
  const handleColDrop = (idx) => {
    if (dragColIdx === null || dragColIdx === idx) return;
    const updated = [...columns];
    const [moved] = updated.splice(dragColIdx, 1);
    updated.splice(idx, 0, moved);
    setColumns(updated);
    setDragColIdx(null);
  };

  const handleCardDragStart = (colIdx, cardIdx) => setDragCard({ colIdx, cardIdx });
  const handleCardDrop = (colIdx, cardIdx = null) => {
    if (!dragCard || (dragCard.colIdx === colIdx && dragCard.cardIdx === cardIdx)) return;
    
    const updated = [...columns];
    const [movedCard] = updated[dragCard.colIdx].cards.splice(dragCard.cardIdx, 1);
    
    // 카드를 컬럼 끝에 추가하거나 특정 위치에 삽입
    if (cardIdx === null) {
      updated[colIdx].cards.push(movedCard);
    } else {
      updated[colIdx].cards.splice(cardIdx, 0, movedCard);
    }
    
    setColumns(updated);
    setDragCard(null);
  };

  // 접힌 뷰 렌더링
  const renderCollapsedView = () => (
    <div className="board-collapsed">
      <div className="collapsed-stats">
        {columns.map((col, idx) => (
          <div key={col.id} className="collapsed-column-stat">
            <div className="column-indicator" style={{ backgroundColor: col.color }}></div>
            <span className="column-name">{col.title}</span>
            <span className="card-count">({col.cards.length})</span>
          </div>
        ))}
      </div>
      {columns.some(col => col.cards.length > 0) && (
        <div className="collapsed-recent-cards">
          <span className="recent-label">최근 카드:</span>
          {columns
            .flatMap(col => col.cards.map(card => ({ ...card, columnTitle: col.title })))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
            .map(card => (
              <span key={card.id} className="recent-card">
                {card.title}
              </span>
            ))}
        </div>
      )}
    </div>
  );

  // 애니메이션 variants
  const colVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  return (
    <div className="board-block-container" ref={containerRef} onClick={onFocus}>
      {/* 헤더 */}
      <div className="board-header">
        <div className="board-title" onClick={() => setIsCollapsed(!isCollapsed)}>
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
          <div className="board-icon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 002 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h2>칸반 보드</h2>
          {isCollapsed && columns.length > 0 && (
            <span className="board-stats">
              • 컬럼 {columns.length}개 • 카드 {columns.reduce((acc, col) => acc + col.cards.length, 0)}개
            </span>
          )}
        </div>

        {!isCollapsed && !readOnly && (
          <div className="board-controls">
            <label className="board-setting">
              <input
                type="checkbox"
                checked={settings.showPriority}
                onChange={(e) => setSettings({ ...settings, showPriority: e.target.checked })}
              />
              <span>우선순위 표시</span>
            </label>
            <label className="board-setting">
              <input
                type="checkbox"
                checked={settings.showLabels}
                onChange={(e) => setSettings({ ...settings, showLabels: e.target.checked })}
              />
              <span>라벨 표시</span>
            </label>
            <button
              className="label-edit-btn"
              onClick={() => setShowLabelEditor(true)}
              title="라벨 편집"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              라벨 편집
            </button>
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="board-content">
        {isCollapsed ? (
          renderCollapsedView()
        ) : (
          <div className="board-columns-container">
            <div className="board-columns-wrapper">
              {/* 왼쪽 슬라이드 버튼 */}
              <button 
                className="slide-btn slide-btn-left"
                onClick={goToPrev}
                disabled={!canGoPrev}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="board-columns">
              <AnimatePresence>
                {visibleColumns.map((col, displayIdx) => {
                  const colIdx = startIndex + displayIdx;
                  return (
                  <motion.div
                    key={col.id}
                    className={`board-column ${dragColIdx === colIdx ? 'dragging' : ''}`}
                    variants={colVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    draggable={!readOnly}
                    onDragStart={() => handleColDragStart(colIdx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('drag-over');
                    }}
                    onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('drag-over');
                      if (dragCard) {
                        handleCardDrop(colIdx);
                      } else {
                        handleColDrop(colIdx);
                      }
                    }}
                  >
                    {/* 컬럼 헤더 */}
                    <div className="column-header">
                      <div className="column-title-section">
                        <div className="column-color-dot" style={{ backgroundColor: col.color }}></div>
                        {editingColIdx === colIdx && !readOnly ? (
                          <input
                            className="column-title-input"
                            value={col.title}
                            autoFocus
                            onChange={e => handleColChange(colIdx, { title: e.target.value })}
                            onBlur={() => setEditingColIdx(null)}
                            onKeyDown={e => { if (e.key === 'Enter') setEditingColIdx(null); }}
                          />
                        ) : (
                          <h3 
                            className="column-title"
                            onClick={() => !readOnly && setEditingColIdx(colIdx)}
                          >
                            {col.title}
                          </h3>
                        )}
                        <span className="card-count">({col.cards.length})</span>
                      </div>
                      
                      {!readOnly && (
                        <div className="column-actions">
                          <input
                            type="color"
                            value={col.color}
                            onChange={(e) => handleColChange(colIdx, { color: e.target.value })}
                            className="color-picker"
                            title="컬럼 색상"
                          />
                          <button
                            className="delete-column-btn"
                            onClick={() => handleDeleteCol(colIdx)}
                            title="컬럼 삭제"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 카드 리스트 */}
                    <div className="column-cards">
                      <AnimatePresence>
                        {col.cards.map((card, cardIdx) => (
                          <motion.div
                            key={card.id}
                            className={`board-card ${hoveredCard === card.id ? 'hovered' : ''} ${dragCard && dragCard.colIdx === colIdx && dragCard.cardIdx === cardIdx ? 'dragging' : ''}`}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            draggable={!readOnly}
                            onDragStart={() => handleCardDragStart(colIdx, cardIdx)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.currentTarget.classList.add('drag-over');
                            }}
                            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.currentTarget.classList.remove('drag-over');
                              handleCardDrop(colIdx, cardIdx);
                            }}
                            onMouseEnter={() => setHoveredCard(card.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                          >
                            {/* 카드 내용 */}
                            <div className="card-content">
                              {editingCard.colIdx === colIdx && editingCard.cardIdx === cardIdx && !readOnly ? (
                                <div className="card-edit-form">
                                  <input
                                    className="card-title-input"
                                    value={card.title}
                                    autoFocus
                                    onChange={e => handleCardChange(colIdx, cardIdx, { title: e.target.value })}
                                    onBlur={() => setEditingCard({ colIdx: null, cardIdx: null })}
                                    onKeyDown={e => { if (e.key === 'Enter') setEditingCard({ colIdx: null, cardIdx: null }); }}
                                  />
                                  <textarea
                                    className="card-description-input"
                                    value={card.description}
                                    placeholder="설명 추가..."
                                    rows="2"
                                    onChange={e => handleCardChange(colIdx, cardIdx, { description: e.target.value })}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="card-display"
                                  onClick={() => !readOnly && setEditingCard({ colIdx, cardIdx })}
                                >
                                  <div className="card-title">{card.title}</div>
                                  {card.description && (
                                    <div className="card-description">{card.description}</div>
                                  )}
                                </div>
                              )}
                              
                              {/* 카드 메타데이터 */}
                              <div className="card-meta">
                                {settings.showPriority && (
                                  <select
                                    className="priority-select"
                                    value={card.priority}
                                    onChange={(e) => handleCardChange(colIdx, cardIdx, { priority: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={readOnly}
                                    style={{ 
                                      backgroundColor: cardPriorities[card.priority]?.bgColor,
                                      color: cardPriorities[card.priority]?.color 
                                    }}
                                  >
                                    {Object.entries(cardPriorities).map(([key, priority]) => (
                                      <option key={key} value={key}>{priority.label}</option>
                                    ))}
                                  </select>
                                )}
                                
                                {settings.showLabels && (
                                  <div className="card-labels">
                                    {card.labels.map(labelKey => {
                                      const label = customLabels[labelKey];
                                      return label ? (
                                        <span 
                                          key={labelKey}
                                          className={`card-label ${!readOnly ? 'removable' : ''}`}
                                          style={{
                                            backgroundColor: label.bgColor,
                                            color: label.color
                                          }}
                                          onClick={(e) => {
                                            if (!readOnly) {
                                              e.stopPropagation();
                                              handleCardChange(colIdx, cardIdx, {
                                                labels: card.labels.filter(l => l !== labelKey)
                                              });
                                            }
                                          }}
                                          title={!readOnly ? "클릭해서 제거" : undefined}
                                        >
                                          {label.label}
                                          {!readOnly && <span className="remove-label-x">×</span>}
                                        </span>
                                      ) : null;
                                    })}
                                    {!readOnly && (
                                      <div className="add-label-dropdown">
                                        <button
                                          className="add-label-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowLabelDropdown(showLabelDropdown === card.id ? null : card.id);
                                          }}
                                          title="라벨 추가"
                                        >
                                          +
                                        </button>
                                        {showLabelDropdown === card.id && (
                                          <div className="label-dropdown">
                                            {Object.entries(customLabels)
                                              .filter(([key]) => !card.labels.includes(key))
                                              .map(([key, label]) => (
                                                <button
                                                  key={key}
                                                  className="label-dropdown-item"
                                                  style={{
                                                    backgroundColor: label.bgColor,
                                                    color: label.color
                                                  }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCardChange(colIdx, cardIdx, {
                                                      labels: [...card.labels, key]
                                                    });
                                                    setShowLabelDropdown(null);
                                                  }}
                                                >
                                                  {label.label}
                                                </button>
                                              ))}
                                            {Object.keys(customLabels).filter(key => !card.labels.includes(key)).length === 0 && (
                                              <div className="label-dropdown-empty">
                                                모든 라벨이 추가됨
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 카드 액션 */}
                            {!readOnly && hoveredCard === card.id && (
                              <div className="card-actions">
                                <button
                                  className="delete-card-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCard(colIdx, cardIdx);
                                  }}
                                  title="카드 삭제"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {/* 카드 추가 영역 */}
                      {!readOnly && (
                        <div className="add-card-section">
                          {showCardForm[col.id] ? (
                            <div className="add-card-form">
                              <input
                                type="text"
                                placeholder="카드 제목"
                                value={newCard[col.id]?.title || ''}
                                onChange={(e) => setNewCard({
                                  ...newCard,
                                  [col.id]: { ...newCard[col.id], title: e.target.value }
                                })}
                                className="new-card-title-input"
                                autoFocus
                              />
                              <textarea
                                placeholder="설명 (선택사항)"
                                value={newCard[col.id]?.description || ''}
                                onChange={(e) => setNewCard({
                                  ...newCard,
                                  [col.id]: { ...newCard[col.id], description: e.target.value }
                                })}
                                className="new-card-description-input"
                                rows="2"
                              />
                              <div className="form-row">
                                <select
                                  value={newCard[col.id]?.priority || 'medium'}
                                  onChange={(e) => setNewCard({
                                    ...newCard,
                                    [col.id]: { ...newCard[col.id], priority: e.target.value }
                                  })}
                                  className="priority-select"
                                >
                                  {Object.entries(cardPriorities).map(([key, priority]) => (
                                    <option key={key} value={key}>{priority.label}</option>
                                  ))}
                                </select>
                                <div className="form-buttons">
                                  <button
                                    className="btn-cancel"
                                    onClick={() => {
                                      setShowCardForm({ ...showCardForm, [col.id]: false });
                                      setNewCard({ ...newCard, [col.id]: { title: '', description: '', priority: 'medium', labels: [] } });
                                    }}
                                  >
                                    취소
                                  </button>
                                  <button
                                    className="btn-add"
                                    onClick={() => handleAddCard(colIdx)}
                                    disabled={!newCard[col.id]?.title?.trim()}
                                  >
                                    추가
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="add-card-trigger"
                              onClick={() => setShowCardForm({ ...showCardForm, [col.id]: true })}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              카드 추가
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* 컬럼 추가 - 현재 페이지의 마지막에 표시 또는 빈 페이지에 표시 */}
              {!readOnly && (
                (startIndex + visibleColumns.length === columns.length) || 
                (startIndex >= columns.length && columns.length % columnsPerView === 0)
              ) && (
                <div className="add-column-section">
                  <div className="add-column-form">
                    <input
                      type="text"
                      placeholder="새 컬럼 이름"
                      value={newColTitle}
                      onChange={(e) => setNewColTitle(e.target.value)}
                      className="new-column-input"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddCol(); }}
                    />
                    <button
                      className="add-column-btn"
                      onClick={handleAddCol}
                      disabled={!newColTitle.trim()}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      컬럼 추가
                    </button>
                  </div>
                </div>
              )}
              </div>
              
              {/* 오른쪽 슬라이드 버튼 */}
              <button 
                className="slide-btn slide-btn-right"
                onClick={goToNext}
                disabled={!canGoNext}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* 페이지 정보 */}
            {columns.length > columnsPerView && (
              <div className="page-info-center">
                {startIndex >= columns.length 
                  ? `새 컬럼 추가 페이지 / ${columns.length}`
                  : `${startIndex + 1}-${Math.min(startIndex + columnsPerView, columns.length)} / ${columns.length}`
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* 라벨 편집 모달 */}
      {showLabelEditor && (
        <div className="label-editor-modal" onClick={() => setShowLabelEditor(false)}>
          <div className="label-editor-content" onClick={(e) => e.stopPropagation()}>
            <div className="label-editor-header">
              <h3>라벨 편집</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowLabelEditor(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="label-editor-list">
              {Object.entries(customLabels).map(([key, label]) => (
                <div key={key} className="label-editor-item">
                  {editingLabelKey === key ? (
                    <>
                      <input
                        type="text"
                        value={label.label}
                        onChange={(e) => {
                          const newLabels = { ...customLabels };
                          newLabels[key].label = e.target.value;
                          setCustomLabels(newLabels);
                        }}
                        className="label-name-input"
                        placeholder="라벨 이름"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingLabelKey(null);
                          }
                        }}
                      />
                      <input
                        type="color"
                        value={label.color}
                        onChange={(e) => {
                          const newLabels = { ...customLabels };
                          newLabels[key].color = e.target.value;
                          // 배경색도 자동으로 연한 버전으로 설정
                          const hex = e.target.value;
                          const r = parseInt(hex.slice(1, 3), 16);
                          const g = parseInt(hex.slice(3, 5), 16);
                          const b = parseInt(hex.slice(5, 7), 16);
                          newLabels[key].bgColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
                          setCustomLabels(newLabels);
                        }}
                        className="label-color-input"
                      />
                      <button
                        className="label-save-btn"
                        onClick={() => setEditingLabelKey(null)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <span 
                        className="label-preview" 
                        style={{ 
                          backgroundColor: label.bgColor,
                          color: label.color 
                        }}
                      >
                        {label.label}
                      </span>
                      <div className="label-actions">
                        <button
                          className="label-edit-item-btn"
                          onClick={() => setEditingLabelKey(key)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="label-delete-btn"
                          onClick={() => {
                            const newLabels = { ...customLabels };
                            delete newLabels[key];
                            setCustomLabels(newLabels);
                            
                            // 삭제된 라벨을 사용하는 모든 카드에서 해당 라벨 제거
                            const updatedColumns = columns.map(col => ({
                              ...col,
                              cards: col.cards.map(card => ({
                                ...card,
                                labels: card.labels.filter(labelKey => labelKey !== key)
                              }))
                            }));
                            setColumns(updatedColumns);
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            <button
              className="add-label-btn-modal"
              onClick={() => {
                const newKey = `custom_${Date.now()}`;
                setCustomLabels({
                  ...customLabels,
                  [newKey]: { label: '새 라벨', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.15)' }
                });
                setEditingLabelKey(newKey);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 라벨 추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardBlock;