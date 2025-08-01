/**
 * 그리드 레이아웃 디자인 블록 컴포넌트 (Premium Version)
 * 
 * @description 미니멀하고 현대적인 그리드 레이아웃 - 노션급 기능과 편의성
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';

export const GridLayout = ({
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
  // 그리드 설정 상태
  const [gridSettings, setGridSettings] = useState({
    columns: block.metadata?.columns || 2,
    gap: block.metadata?.gap || 'medium',
    aspectRatio: block.metadata?.aspectRatio || 'auto',
    alignment: block.metadata?.alignment || 'start',
    ...block.metadata
  });

  // 그리드 아이템들
  const [gridItems, setGridItems] = useState(block.metadata?.items || [
    { id: nanoid(), content: '', type: 'text', style: {} },
    { id: nanoid(), content: '', type: 'text', style: {} },
    { id: nanoid(), content: '', type: 'text', style: {} },
    { id: nanoid(), content: '', type: 'text', style: {} }
  ]);

  // UI 상태
  const [isHovered, setIsHovered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(null);

  // 커스텀 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState(null);
  const [dragPreviewPos, setDragPreviewPos] = useState({ x: 0, y: 0 });

  const gridRef = useRef(null);
  const settingsRef = useRef(null);

  // 프로즈미러 에디터 참조
  const editorsRef = useRef({});

  // 설정값 정의
  const gapOptions = {
    none: '0px',
    small: '8px',
    medium: '16px',
    large: '24px',
    xlarge: '32px'
  };

  const aspectRatioOptions = {
    auto: 'auto',
    square: '1 / 1',
    portrait: '3 / 4',
    landscape: '4 / 3',
    wide: '16 / 9'
  };

  // 색상 팔레트
  const colorPalette = {
    backgrounds: [
      { name: 'Default', value: 'rgb(249, 250, 251)', light: true },
      { name: 'Blue', value: 'rgb(239, 246, 255)', light: true },
      { name: 'Green', value: 'rgb(240, 253, 244)', light: true },
      { name: 'Yellow', value: 'rgb(254, 249, 195)', light: true },
      { name: 'Red', value: 'rgb(254, 242, 242)', light: true },
      { name: 'Purple', value: 'rgb(245, 243, 255)', light: true },
      { name: 'Pink', value: 'rgb(253, 242, 248)', light: true },
      { name: 'Orange', value: 'rgb(255, 247, 237)', light: true },
      { name: 'Gray', value: 'rgb(243, 244, 246)', light: true },
      { name: 'Dark Blue', value: 'rgb(30, 58, 138)', light: false },
      { name: 'Dark Green', value: 'rgb(20, 83, 45)', light: false },
      { name: 'Dark Red', value: 'rgb(153, 27, 27)', light: false },
      { name: 'Dark Purple', value: 'rgb(88, 28, 135)', light: false },
      { name: 'Black', value: 'rgb(17, 24, 39)', light: false }
    ],
    texts: [
      { name: 'Default', value: 'rgb(55, 65, 81)' },
      { name: 'Blue', value: 'rgb(29, 78, 216)' },
      { name: 'Green', value: 'rgb(21, 128, 61)' },
      { name: 'Yellow', value: 'rgb(180, 83, 9)' },
      { name: 'Red', value: 'rgb(220, 38, 38)' },
      { name: 'Purple', value: 'rgb(126, 34, 206)' },
      { name: 'Pink', value: 'rgb(190, 24, 93)' },
      { name: 'Orange', value: 'rgb(234, 88, 12)' },
      { name: 'Gray', value: 'rgb(107, 114, 128)' },
      { name: 'White', value: 'rgb(255, 255, 255)' }
    ]
  };

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

  // 그리드 설정 변경
  const handleSettingChange = useCallback((key, value) => {
    const newSettings = { ...gridSettings, [key]: value };
    setGridSettings(newSettings);
    updateMetadata(newSettings);
  }, [gridSettings, updateMetadata]);

  // 그리드 아이템 업데이트
  const updateGridItems = useCallback((newItems) => {
    setGridItems(newItems);
    updateMetadata({ items: newItems });
  }, [updateMetadata]);

  // 아이템 추가
  const addGridItem = useCallback(() => {
    const newItem = {
      id: nanoid(),
      content: '',
      type: 'text',
      style: {}
    };
    updateGridItems([...gridItems, newItem]);
  }, [gridItems, updateGridItems]);

  // 아이템 삭제
  const removeGridItem = useCallback((itemId) => {
    const filteredItems = gridItems.filter(item => item.id !== itemId);
    updateGridItems(filteredItems);
  }, [gridItems, updateGridItems]);

  // 아이템 내용 업데이트
  const updateItemContent = useCallback((itemId, content) => {
    const updatedItems = gridItems.map(item =>
      item.id === itemId ? { ...item, content } : item
    );
    updateGridItems(updatedItems);
  }, [gridItems, updateGridItems]);

  // 아이템 스타일 업데이트
  const updateItemStyle = useCallback((itemId, styleUpdates) => {
    const updatedItems = gridItems.map(item =>
      item.id === itemId ? { ...item, style: { ...item.style, ...styleUpdates } } : item
    );
    updateGridItems(updatedItems);
  }, [gridItems, updateGridItems]);

  // 색상 변경 함수
  const handleColorChange = useCallback((itemId, colorType, color) => {
    const styleUpdate = {};
    if (colorType === 'background') {
      styleUpdate.backgroundColor = color.value;
      // 배경이 어두우면 텍스트를 밝게, 밝으면 텍스트를 어둡게
      if (!color.light && !gridItems.find(item => item.id === itemId)?.style?.color) {
        styleUpdate.color = 'rgb(255, 255, 255)';
      }
    } else if (colorType === 'text') {
      styleUpdate.color = color.value;
    }
    updateItemStyle(itemId, styleUpdate);
    setShowColorPicker(null);
  }, [updateItemStyle, gridItems]);

  // 커스텀 드래그 핸들러
  const handleMouseDown = useCallback((e, item) => {
    if (e.button !== 0 || readOnly) return; // 왼쪽 클릭만 처리
    
    e.preventDefault();
    e.stopPropagation();
    
    // 실제 그리드 아이템의 rect를 가져옴 (드래그 핸들이 아닌)
    const gridItemElement = e.currentTarget.closest('.grid-item');
    const rect = gridItemElement ? gridItemElement.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
    const startPos = { x: e.clientX, y: e.clientY };
    
    setDragStartPos(startPos);
    // 드래그 프리뷰가 커서에서 약간 오른쪽 아래로 오프셋되도록 설정
    // 이렇게 하면 커서가 드래그되는 아이템을 가리지 않음
    setDragOffset({
      x: -10,  // 커서 왼쪽으로 10px
      y: -10   // 커서 위쪽으로 10px
    });
    
    // 드래그 시작을 위한 임계값 설정
    const handleMouseMove = (moveEvent) => {
      const distance = Math.sqrt(
        Math.pow(moveEvent.clientX - startPos.x, 2) +
        Math.pow(moveEvent.clientY - startPos.y, 2)
      );
      
      // 5px 이상 움직이면 드래그 시작
      if (distance > 5 && !isDragging) {
        setIsDragging(true);
        setDraggedItem(item);
        setSelectedItem(item.id);
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isDragging, readOnly]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !draggedItem) return;
    
    // 드래그 프리뷰 위치 업데이트
    setDragPreviewPos({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
    
    // 마우스 위치에서 드롭 타겟 찾기
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const gridItemElement = elements.find(el => 
      el.classList.contains('grid-item') && 
      el.getAttribute('data-item-id') !== draggedItem.id
    );
    
    if (gridItemElement) {
      const targetId = gridItemElement.getAttribute('data-item-id');
      setDropTarget(targetId);
    } else {
      setDropTarget(null);
    }
  }, [isDragging, draggedItem, dragOffset]);

  const handleMouseUp = useCallback((e) => {
    if (!isDragging || !draggedItem) return;
    
    if (dropTarget) {
      const targetItem = gridItems.find(item => item.id === dropTarget);
      if (targetItem) {
        const newItems = [...gridItems];
        const draggedIndex = newItems.findIndex(item => item.id === draggedItem.id);
        const targetIndex = newItems.findIndex(item => item.id === targetItem.id);

        // 아이템 순서 변경
        newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, draggedItem);
        updateGridItems(newItems);
      }
    }
    
    // 드래그 상태 초기화
    setIsDragging(false);
    setDraggedItem(null);
    setDropTarget(null);
    setDragStartPos({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });
    setDragPreviewPos({ x: 0, y: 0 });
  }, [isDragging, draggedItem, dropTarget, gridItems, updateGridItems]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
      // 색상 피커 외부 클릭 시 닫기
      const colorPicker = document.querySelector('.color-picker-panel');
      if (colorPicker && !colorPicker.contains(event.target)) {
        setShowColorPicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 드래그 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isHovered || readOnly) return;

      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        addGridItem();
      }
      
      // ESC로 드래그 취소
      if (e.key === 'Escape' && isDragging) {
        setIsDragging(false);
        setDraggedItem(null);
        setDropTarget(null);
        setDragPreviewPos({ x: 0, y: 0 });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, readOnly, addGridItem, isDragging]);

  // 그리드 스타일 계산
  const getGridStyle = () => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${gridSettings.columns}, 1fr)`,
    gap: gapOptions[gridSettings.gap],
    alignItems: gridSettings.alignment,
    width: '100%'
  });

  // 아이템 스타일 계산
  const getItemStyle = (item) => ({
    aspectRatio: aspectRatioOptions[gridSettings.aspectRatio],
    backgroundColor: item.style?.backgroundColor || 'rgb(249, 250, 251)',
    color: item.style?.color || 'rgb(55, 65, 81)',
    ...item.style
  });

  return (
    <div 
      className="grid-layout-wrapper grid-layout-block-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 툴바 */}
      {isHovered && !readOnly && (
        <div className="grid-toolbar">
          <div className="toolbar-left">
            <button
              className="toolbar-button"
              onClick={() => setShowSettings(!showSettings)}
              title="그리드 설정"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            
            <button
              className="toolbar-button"
              onClick={addGridItem}
              title="아이템 추가 (Ctrl+Enter)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="toolbar-right">
            <span className="grid-info">
              {gridItems.length} items • {gridSettings.columns} columns
            </span>
          </div>
        </div>
      )}

      {/* 설정 패널 */}
      {showSettings && (
        <div className="grid-settings-panel" ref={settingsRef}>
          <div className="settings-header">
            <h4>그리드 설정</h4>
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
            {/* 컬럼 수 */}
            <div className="setting-group">
              <label>컬럼 수</label>
              <div className="column-buttons">
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    className={`column-button ${gridSettings.columns === num ? 'active' : ''}`}
                    onClick={() => handleSettingChange('columns', num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* 간격 */}
            <div className="setting-group">
              <label>간격</label>
              <select
                value={gridSettings.gap}
                onChange={(e) => handleSettingChange('gap', e.target.value)}
                className="setting-select"
              >
                <option value="none">없음</option>
                <option value="small">작게</option>
                <option value="medium">보통</option>
                <option value="large">크게</option>
                <option value="xlarge">매우 크게</option>
              </select>
            </div>

            {/* 가로세로 비율 */}
            <div className="setting-group">
              <label>가로세로 비율</label>
              <select
                value={gridSettings.aspectRatio}
                onChange={(e) => handleSettingChange('aspectRatio', e.target.value)}
                className="setting-select"
              >
                <option value="auto">자동</option>
                <option value="square">정사각형 (1:1)</option>
                <option value="portrait">세로형 (3:4)</option>
                <option value="landscape">가로형 (4:3)</option>
                <option value="wide">와이드 (16:9)</option>
              </select>
            </div>

            {/* 정렬 */}
            <div className="setting-group">
              <label>정렬</label>
              <select
                value={gridSettings.alignment}
                onChange={(e) => handleSettingChange('alignment', e.target.value)}
                className="setting-select"
              >
                <option value="start">위</option>
                <option value="center">중앙</option>
                <option value="end">아래</option>
                <option value="stretch">늘이기</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 그리드 컨테이너 */}
      <div 
        className="grid-container"
        style={getGridStyle()}
        ref={gridRef}
        onClick={(e) => {
          // 빈 공간 클릭 시 선택 해제
          if (e.target === e.currentTarget) {
            setSelectedItem(null);
            setShowColorPicker(null);
          }
        }}
      >
        {gridItems.map((item, itemIndex) => (
          <div
            key={item.id}
            data-item-id={item.id}
            className={`grid-item ${editingItem === item.id ? 'editing' : ''} ${selectedItem === item.id ? 'selected' : ''} ${dropTarget === item.id ? 'drop-target' : ''} ${draggedItem?.id === item.id ? 'dragging' : ''}`}
            style={getItemStyle(item)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem(item.id);
            }}
          >
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
                
                <button
                  className="item-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(showColorPicker === item.id ? null : item.id);
                  }}
                  title="색상"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1" fill="none"/>
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                </button>
                
                <button
                  className="item-button item-button-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeGridItem(item.id);
                  }}
                  title="삭제"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 3h8M4 3V1.5A.5.5 0 014.5 1h3a.5.5 0 01.5.5V3M5 5v3M7 5v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}

            {/* 색상 피커 */}
            {showColorPicker === item.id && (
              <div className="color-picker-panel">
                <div className="color-section">
                  <h5>배경 색상</h5>
                  <div className="color-grid">
                    {colorPalette.backgrounds.map((color, colorIndex) => (
                      <button
                        key={colorIndex}
                        className="color-button"
                        style={{ backgroundColor: color.value }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleColorChange(item.id, 'background', color);
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="color-section">
                  <h5>텍스트 색상</h5>
                  <div className="color-grid">
                    {colorPalette.texts.map((color, colorIndex) => (
                      <button
                        key={colorIndex}
                        className="color-button text-color-button"
                        style={{ backgroundColor: color.value }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleColorChange(item.id, 'text', color);
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 아이템 내용 */}
            <div className="item-content">
              {editingItem === item.id ? (
                <textarea
                  className="item-editor"
                  value={item.content}
                  onChange={(e) => updateItemContent(item.id, e.target.value)}
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
                  autoFocus
                />
              ) : (
                <div 
                  className="item-display"
                  onClick={() => !readOnly && setEditingItem(item.id)}
                >
                  {item.content || (
                    <span className="item-placeholder">
                      클릭하여 내용 추가
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 드래그 핸들 */}
            {!readOnly && (
              <div 
                className="grid-drag-handle"
                onMouseDown={(e) => handleMouseDown(e, item)}
                title="드래그하여 순서 변경"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <circle cx="2" cy="2" r="0.5" fill="currentColor"/>
                  <circle cx="6" cy="2" r="0.5" fill="currentColor"/>
                  <circle cx="2" cy="6" r="0.5" fill="currentColor"/>
                  <circle cx="6" cy="6" r="0.5" fill="currentColor"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {gridItems.length === 0 && (
        <div className="grid-empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="6" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <rect x="26" y="6" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <rect x="6" y="26" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <rect x="26" y="26" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <p>그리드 아이템을 추가하여 시작하세요</p>
          {!readOnly && (
            <button className="add-first-item" onClick={addGridItem}>
              첫 번째 아이템 추가
            </button>
          )}
        </div>
      )}

      {/* 드래그 프리뷰 */}
      {isDragging && draggedItem && (
        <div 
          className="drag-preview"
          style={{
            position: 'fixed',
            left: dragPreviewPos.x,
            top: dragPreviewPos.y,
            width: '100px',    // 더 작게
            height: '80px',    // 더 작게
            pointerEvents: 'none',
            zIndex: 9999,
            transform: 'rotate(5deg) scale(0.8)', // 회전과 크기 조정
            transition: 'none'
          }}
        >
          <div className="drag-preview-content" style={getItemStyle(draggedItem)}>
            <div className="drag-preview-text">
              {draggedItem.content || (
                <span className="item-placeholder">
                  클릭하여 내용 추가
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GridLayout 전용 스타일 (기존 블록 드래그 시스템과 분리) */}
      <style jsx scoped>{`
        .grid-layout-wrapper {
          position: relative;
          margin: 16px 0;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .grid-layout-wrapper:hover {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* 그리드 레이아웃 전용 툴바 */
        .grid-layout-wrapper .grid-toolbar {
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

        .grid-layout-wrapper .toolbar-left {
          display: flex;
          gap: 4px;
        }

        .grid-layout-wrapper .toolbar-button {
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

        .grid-layout-wrapper .toolbar-button:hover {
          background: rgb(243, 244, 246);
          color: rgb(55, 65, 81);
        }

        .grid-layout-wrapper .grid-info {
          font-size: 12px;
          color: rgb(107, 114, 128);
          font-weight: 500;
        }

        /* 설정 패널 */
        .grid-layout-wrapper .grid-settings-panel {
          position: absolute;
          top: -40px;
          right: 0;
          width: 280px;
          background: white;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          z-index: 20;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid rgb(243, 244, 246);
        }

        .settings-header h4 {
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

        .settings-content {
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

        .column-buttons {
          display: flex;
          gap: 4px;
        }

        .column-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid rgb(229, 231, 235);
          background: white;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          color: rgb(107, 114, 128);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .column-button:hover {
          border-color: rgb(59, 130, 246);
          color: rgb(59, 130, 246);
        }

        .column-button.active {
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

        /* 그리드 컨테이너 */
        .grid-container {
          background: white;
          border: 1px solid rgb(243, 244, 246);
          border-radius: 8px;
          padding: 16px;
          min-height: 200px;
        }

        /* 그리드 아이템 */
        .grid-item {
          position: relative;
          background: rgb(249, 250, 251);
          border: 1px solid rgb(229, 231, 235);
          border-radius: 6px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 100px;
        }

        .grid-item:hover {
          border-color: rgb(209, 213, 219);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .grid-item.selected {
          border-color: rgb(59, 130, 246);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .grid-item.editing {
          border-color: rgb(16, 185, 129);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .grid-item.dragging {
          opacity: 0.5;
          transform: rotate(5deg);
          z-index: 1000;
          pointer-events: none;
        }

        .grid-item.drop-target {
          border-color: rgb(59, 130, 246);
          background: rgba(59, 130, 246, 0.05);
          transform: scale(1.02);
        }

        /* 아이템 툴바 */
        .item-toolbar {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          background: white;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 4px;
          padding: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .item-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          border-radius: 3px;
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
        }

        /* 아이템 내용 */
        .item-content {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-editor {
          width: 100%;
          height: 100%;
          border: none;
          background: transparent;
          font-size: 14px;
          color: rgb(55, 65, 81);
          resize: none;
          outline: none;
          font-family: inherit;
        }

        .item-editor::placeholder {
          color: rgb(156, 163, 175);
        }

        .item-display {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: rgb(55, 65, 81);
          text-align: center;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .item-placeholder {
          color: rgb(156, 163, 175);
          font-style: italic;
        }

        /* 그리드 내부 전용 드래그 핸들 (기존 블록 드래그 핸들과 완전 분리) */
        .grid-item .grid-drag-handle {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgb(156, 163, 175);
          cursor: grab;
          opacity: 0;
          transition: all 0.2s ease;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.8);
          user-select: none;
        }

        .grid-item .grid-drag-handle:hover {
          color: rgb(107, 114, 128);
          background: rgba(255, 255, 255, 0.95);
          transform: scale(1.1);
        }

        .grid-item .grid-drag-handle:active {
          cursor: grabbing;
          background: rgba(255, 255, 255, 1);
        }

        .grid-item:hover .grid-drag-handle {
          opacity: 1;
        }

        .grid-item.dragging .grid-drag-handle {
          opacity: 0;
        }

        /* 그리드 전용 드래그 프리뷰 */
        .grid-layout-wrapper .drag-preview {
          opacity: 0.8;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
          animation: drag-preview-bounce 0.2s ease-out;
        }

        .grid-layout-wrapper .drag-preview-content {
          width: 100%;
          height: 100%;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 6px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: rgb(55, 65, 81);
          text-align: center;
          word-wrap: break-word;
          white-space: pre-wrap;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .grid-layout-wrapper .drag-preview-text {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1.4;
        }

        @keyframes drag-preview-bounce {
          0% {
            transform: rotate(5deg) scale(0.6);
            opacity: 0.5;
          }
          100% {
            transform: rotate(5deg) scale(0.8);
            opacity: 0.8;
          }
        }

        /* 색상 피커 */
        .color-picker-panel {
          position: absolute;
          top: 40px;
          right: 0;
          background: white;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          padding: 16px;
          z-index: 30;
          min-width: 200px;
        }

        .color-section {
          margin-bottom: 16px;
        }

        .color-section:last-child {
          margin-bottom: 0;
        }

        .color-section h5 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 600;
          color: rgb(55, 65, 81);
        }

        .color-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .color-button {
          width: 24px;
          height: 24px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .color-button:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .text-color-button {
          border: 2px solid rgb(229, 231, 235);
        }

        .text-color-button:hover {
          border-color: rgb(59, 130, 246);
        }

        /* 빈 상태 */
        .grid-empty-state {
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

        .grid-empty-state p {
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

        /* 다크모드 지원 */
        @media (prefers-color-scheme: dark) {
          .grid-layout-wrapper:hover {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          }

          .grid-toolbar,
          .grid-settings-panel {
            background: rgb(31, 41, 55);
            border-color: rgb(55, 65, 81);
          }

          .settings-header {
            border-bottom-color: rgb(55, 65, 81);
          }

          .settings-header h4 {
            color: rgb(243, 244, 246);
          }

          .setting-group label {
            color: rgb(209, 213, 219);
          }

          .setting-select {
            background: rgb(55, 65, 81);
            border-color: rgb(75, 85, 99);
            color: rgb(243, 244, 246);
          }

          .grid-container {
            background: rgb(17, 24, 39);
            border-color: rgb(55, 65, 81);
          }

          .grid-item {
            background: rgb(31, 41, 55);
            border-color: rgb(55, 65, 81);
          }

          .grid-item:hover {
            border-color: rgb(75, 85, 99);
          }

          .item-toolbar {
            background: rgb(31, 41, 55);
            border-color: rgb(55, 65, 81);
          }

          .item-editor,
          .item-display {
            color: rgb(243, 244, 246);
          }

          .grid-empty-state {
            color: rgb(156, 163, 175);
          }

          .color-picker-panel {
            background: rgb(31, 41, 55);
            border-color: rgb(55, 65, 81);
          }

          .color-section h5 {
            color: rgb(243, 244, 246);
          }
        }
      `}</style>
    </div>
  );
};

export default GridLayout;