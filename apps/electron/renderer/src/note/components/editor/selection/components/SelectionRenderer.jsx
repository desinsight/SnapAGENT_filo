/**
 * 선택 시각적 피드백 렌더러
 * 
 * @description 선택 상태를 시각적으로 표시하는 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useSelection } from '../hooks/useSelection.js';
import './SelectionRenderer.css';

/**
 * 선택 렌더러 컴포넌트
 */
export function SelectionRenderer() {
  const {
    selectionState,
    activeSelection,
    isSelecting,
    currentEngine
  } = useSelection();

  const [dragRect, setDragRect] = useState(null);
  const [highlightBlocks, setHighlightBlocks] = useState([]);

  // 드래그 선택 영역 업데이트
  useEffect(() => {
    if (activeSelection?.type === 'drag' && activeSelection.selectionRect) {
      setDragRect(activeSelection.selectionRect);
    } else {
      setDragRect(null);
    }
  }, [activeSelection]);

  // 선택된 블록들 하이라이트 업데이트
  useEffect(() => {
    if (activeSelection?.type === 'block_selection' && activeSelection.selectedBlocks) {
      setHighlightBlocks(activeSelection.selectedBlocks);
    } else {
      setHighlightBlocks([]);
    }
  }, [activeSelection]);

  // 선택 상태에 따른 CSS 클래스 적용
  useEffect(() => {
    const body = document.body;
    
    // 선택 중 상태 클래스
    if (isSelecting) {
      body.classList.add('selection-active');
      body.classList.add(`selection-engine-${currentEngine}`);
    } else {
      body.classList.remove('selection-active');
      body.classList.remove('selection-engine-prosemirror');
      body.classList.remove('selection-engine-native');
      body.classList.remove('selection-engine-hybrid');
      body.classList.remove('selection-engine-drag');
    }

    return () => {
      body.classList.remove('selection-active');
      body.classList.remove('selection-engine-prosemirror');
      body.classList.remove('selection-engine-native');
      body.classList.remove('selection-engine-hybrid');
      body.classList.remove('selection-engine-drag');
    };
  }, [isSelecting, currentEngine]);

  // 블록 하이라이트 적용/제거
  useEffect(() => {
    const applyBlockHighlights = () => {
      // 기존 하이라이트 제거
      document.querySelectorAll('.block-selected').forEach(el => {
        el.classList.remove('block-selected');
      });

      // 새로운 하이라이트 적용
      highlightBlocks.forEach(blockId => {
        const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
        if (blockElement) {
          blockElement.classList.add('block-selected');
        }
      });
    };

    applyBlockHighlights();

    return () => {
      // 컴포넌트 언마운트 시 하이라이트 제거
      document.querySelectorAll('.block-selected').forEach(el => {
        el.classList.remove('block-selected');
      });
    };
  }, [highlightBlocks]);

  // 드래그 오버레이 렌더링
  const renderDragOverlay = useCallback(() => {
    if (!dragRect) return null;

    const overlayStyle = {
      position: 'fixed',
      left: dragRect.left,
      top: dragRect.top,
      width: dragRect.width,
      height: dragRect.height,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      pointerEvents: 'none',
      zIndex: 1000
    };

    return (
      <div 
        className="selection-drag-overlay" 
        style={overlayStyle}
      />
    );
  }, [dragRect]);

  // 선택 정보 디버그 패널 (개발 모드에서만)
  const renderDebugPanel = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return null;

    if (!activeSelection) return null;

    const debugStyle = {
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 10000,
      maxWidth: '300px'
    };

    return (
      <div className="selection-debug-panel" style={debugStyle}>
        <div><strong>Engine:</strong> {currentEngine}</div>
        <div><strong>Type:</strong> {activeSelection.type}</div>
        {activeSelection.type === 'block_selection' && (
          <div><strong>Blocks:</strong> {activeSelection.count || 0}</div>
        )}
        {activeSelection.type === 'text' && (
          <div><strong>Text:</strong> {activeSelection.selectedText?.length || 0} chars</div>
        )}
        {activeSelection.crossBlock && (
          <div><strong>Cross-block:</strong> Yes</div>
        )}
      </div>
    );
  }, [activeSelection, currentEngine]);

  return (
    <>
      {renderDragOverlay()}
      {renderDebugPanel()}
    </>
  );
}

/**
 * 선택 상태 표시기 컴포넌트
 */
export function SelectionIndicator() {
  const { selectionState, getSelectionCount, getSelectionType } = useSelection();

  if (!selectionState.hasSelection) {
    return null;
  }

  const count = getSelectionCount();
  const type = getSelectionType();

  let indicator = '';
  switch (type) {
    case 'block_selection':
      indicator = `${count} 블록 선택됨`;
      break;
    case 'text':
      indicator = `${count} 문자 선택됨`;
      break;
    case 'drag':
      indicator = '드래그 선택 중...';
      break;
    default:
      indicator = '선택됨';
  }

  const indicatorStyle = {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    zIndex: 1000,
    animation: 'fadeInUp 0.2s ease-out'
  };

  return (
    <div className="selection-indicator" style={indicatorStyle}>
      {indicator}
    </div>
  );
}