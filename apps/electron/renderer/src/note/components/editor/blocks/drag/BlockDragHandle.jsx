/**
 * 블록 드래그 핸들 컴포넌트
 * 
 * @description 노션과 같은 고급 드래그 앤 드롭 기능을 제공하는 드래그 핸들
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

const DRAG_TYPES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  MERGE: 'merge'
};

export const BlockDragHandle = ({ 
  block, 
  index, 
  isMultiSelect = false,
  selectedBlocks = [],
  onDragStart,
  onDragEnd,
  onDrop,
  dragType = DRAG_TYPES.SINGLE,
  isVisible = true,
  className = ""
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState(null);
  const handleRef = useRef(null);

  // 드래그 아이템 결정 (메모이제이션)
  const getDragItem = useCallback(() => {
    switch (dragType) {
      case DRAG_TYPES.MULTIPLE:
        // 선택된 블록들 중 첫 번째 블록의 인덱스를 찾음
        const firstSelectedIndex = selectedBlocks.length > 0 
          ? (selectedBlocks[0].index !== undefined ? selectedBlocks[0].index : index)
          : index;
        
        return {
          type: 'multiple-blocks',
          blocks: selectedBlocks,
          sourceIndex: firstSelectedIndex,
          dragType: DRAG_TYPES.MULTIPLE
        };
      case DRAG_TYPES.MERGE:
        return {
          type: 'merge-blocks',
          blocks: selectedBlocks,
          sourceIndex: index,
          dragType: DRAG_TYPES.MERGE,
          targetType: 'checkList' // 기본 병합 타입
        };
      default:
        return {
          type: 'single-block',
          block,
          index,
          dragType: DRAG_TYPES.SINGLE
        };
    }
  }, [dragType, selectedBlocks, index, block]);

  // 드래그 설정
  const [{ isDragging: dragState }, drag, preview] = useDrag({
    type: getDragItem().type, // 동적으로 타입 결정
    item: () => {
      const item = getDragItem();
      setIsDragging(true);
      if (onDragStart) {
        onDragStart(item);
      }
      return item;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      setIsDragging(false);
      if (onDragEnd) {
        onDragEnd(item, monitor);
      }
    }
  });

  // 드래그 프리뷰 숨김 (커스텀 프리뷰 사용)
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // 드래그 핸들 클릭 처리 (메모이제이션)
  const handleDragHandleClick = useCallback((e) => {
    e.stopPropagation();
    
    // 다중 선택 모드에서 드래그 핸들 클릭 시 해당 블록만 선택
    if (isMultiSelect) {
      // 선택 상태 토글 로직
      console.log('Toggle block selection:', block.id);
    }
  }, [isMultiSelect, block.id]);

  // 키보드 접근성 (메모이제이션)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDragHandleClick(e);
    }
  }, [handleDragHandleClick]);

  // 드래그 가능한 블록 타입 확인 (메모이제이션)
  const canDrag = useMemo(() => {
    // 읽기 전용이거나 특정 조건에서는 드래그 불가
    if (block.readOnly) return false;
    
    // 다중 선택 시 최소 2개 이상 선택되어야 함
    if (dragType === DRAG_TYPES.MULTIPLE && selectedBlocks.length < 2) return false;
    
    return true;
  }, [block.readOnly, dragType, selectedBlocks.length]);

  // 드래그 핸들 스타일 결정 (메모이제이션)
  const getHandleStyle = useMemo(() => {
    const baseStyle = `
      w-6 h-6 flex items-center justify-center
      text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200
      hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600
      transition-colors duration-150 shadow-sm cursor-grab active:cursor-grabbing
      ${isDragging ? 'opacity-50' : ''}
      ${!canDrag ? 'opacity-30 cursor-not-allowed' : ''}
    `;
    
    return baseStyle;
  }, [isDragging, canDrag]);

  // 드래그 타입별 아이콘 (메모이제이션)
  const getDragIcon = useMemo(() => {
    switch (dragType) {
      case DRAG_TYPES.MULTIPLE:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        );
      case DRAG_TYPES.MERGE:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        );
    }
  }, [dragType]);

  // 툴팁 텍스트 (메모이제이션)
  const getTooltipText = useMemo(() => {
    switch (dragType) {
      case DRAG_TYPES.MULTIPLE:
        return `선택된 ${selectedBlocks.length}개 블록 이동`;
      case DRAG_TYPES.MERGE:
        return '선택된 블록들을 병합';
      default:
        return '드래그하여 이동';
    }
  }, [dragType, selectedBlocks.length]);

  if (!isVisible) return null;

  return (
    <>
      <button
        ref={(node) => {
          drag(node);
          handleRef.current = node;
        }}
        className={`drag-handle ${getHandleStyle} ${className}`}
        title={getTooltipText}
        onClick={handleDragHandleClick}
        onKeyDown={handleKeyDown}
        disabled={!canDrag}
        aria-label={getTooltipText}
        role="button"
        tabIndex={0}
      >
        {getDragIcon}
      </button>
      
      {/* 드래그 중일 때 추가 시각적 피드백 */}
      {isDragging && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-500 bg-opacity-10" />
        </div>
      )}
    </>
  );
};

// PropTypes 정의
BlockDragHandle.propTypes = {
  block: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  isMultiSelect: PropTypes.bool,
  selectedBlocks: PropTypes.array,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDrop: PropTypes.func,
  dragType: PropTypes.oneOf(Object.values(DRAG_TYPES)),
  isVisible: PropTypes.bool,
  className: PropTypes.string
};

export { DRAG_TYPES };
export default BlockDragHandle; 