/**
 * 블록 드롭 영역 컴포넌트
 * 
 * @description 블록 타입별 드롭 가능 여부와 병합 기능을 처리하는 드롭 영역
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDrop } from 'react-dnd';
import { useInteractionContext } from '../../selection/interactions/InteractionContext.jsx';

// 통합 상호작용 시스템으로 대체됨 - 기존 호환성 규칙들은 더 이상 사용하지 않음

export const BlockDropZone = ({ 
  block, 
  index, 
  onDrop, 
  onMerge,
  isVisible = true,
  className = "",
  children 
}) => {
  const [isOver, setIsOver] = useState(false);
  const [canDrop, setCanDrop] = useState(false);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const dropRef = useRef(null);

  // 통합 상호작용 시스템 사용
  const { canMerge, canConvert } = useInteractionContext();

  // 병합 가능성 확인 (통합 상호작용 시스템)
  const checkCanMerge = useCallback((item) => {
    if (!item || !block) return false;

    try {
      // 소스 블록들 추출
      let sourceBlocks = [];
      if (item.dragType === 'single' && item.block) {
        sourceBlocks = [item.block];
      } else if (item.blocks && Array.isArray(item.blocks)) {
        sourceBlocks = item.blocks;
      } else if (item.block) {
        sourceBlocks = [item.block];
      }

      if (sourceBlocks.length === 0) return false;

      // 자기 자신에게 드롭하는 경우 방지
      if (sourceBlocks.some(source => source.id === block.id)) return false;

      // 통합 상호작용 시스템으로 병합 가능성 확인
      const mergeCheck = canMerge(sourceBlocks, block);
      
      console.log('🔍 Merge compatibility check:', {
        sourceBlocks: sourceBlocks.map(b => b.type),
        targetBlock: block.type,
        canMerge: mergeCheck.isValid,
        reason: mergeCheck.rule || mergeCheck.error
      });

      return mergeCheck.isValid;
    } catch (error) {
      console.error('❌ checkCanMerge error:', error);
      return false;
    }
  }, [block, canMerge]);


  // 드롭 설정
  const [{ isOver: dropIsOver, canDrop: dropCanDrop }, drop] = useDrop({
    accept: ['block', 'single-block', 'multiple-blocks', 'merge-blocks'],
    hover: (item, monitor) => {
      if (!dropRef.current) return;
      
      setDragItem(item);
      
      const dragIndex = item.index || item.sourceIndex;
      const hoverIndex = index;
      
      // 자기 자신 위에 드롭하는 경우 무시
      if (dragIndex === hoverIndex) return;
      
      // 드롭 위치 계산 - 간단하게 위/아래만
      const hoverBoundingRect = dropRef.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // 상단/하단 구분만 - 중간 구역 제거
      const indicatorPosition = hoverClientY < hoverMiddleY ? 'top' : 'bottom';
      setDropIndicator(indicatorPosition);
    },
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        const dropResult = {
          item,
          targetBlock: block,
          targetIndex: index,
          dropPosition: dropIndicator || 'middle',
          isShift: monitor.getDropResult?.()?.isShift || (window.event && window.event.shiftKey)
        };
        
        console.log('🎬 Drop executed:', dropResult);
        
        // Shift 키가 눌린 경우에만 병합 시도
        const canMergeBlocks = dropResult.isShift && checkCanMerge(item);
        
        if (canMergeBlocks) {
          console.log('✅ Merge possible (Shift+드롭) - triggering merge via onDrop');
          dropResult.item.dragType = 'merge';
        } else {
          console.log('📦 Normal move - preserving original dragType');
          // 원래 dragType 유지 (single, multiple 등)
        }
        
        // 모든 경우에 onDrop 호출 (기본 이동도 포함)
        if (onDrop) {
          onDrop(dropResult);
        }
      }
    },
    canDrop: (item, monitor) => {
      // 기본적인 드롭 가능성 확인 (자기 자신에게 드롭하는 경우만 제외)
      if (!item || !block) return false;
      
      // 소스 블록들 추출
      let sourceBlocks = [];
      if (item.dragType === 'single' && item.block) {
        sourceBlocks = [item.block];
      } else if (item.blocks && Array.isArray(item.blocks)) {
        sourceBlocks = item.blocks;
      } else if (item.block) {
        sourceBlocks = [item.block];
      }
      
      // 자기 자신에게 드롭하는 경우 방지
      if (sourceBlocks.some(source => source.id === block.id)) {
        return false;
      }
      
      // 기본적으로는 모든 드롭을 허용 (이동 또는 병합)
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop()
    })
  });

  // 드롭 상태 업데이트
  React.useEffect(() => {
    setIsOver(dropIsOver);
    setCanDrop(dropCanDrop);
    
    // 드래그가 끝나면 dragItem 초기화
    if (!dropIsOver) {
      setDragItem(null);
    }
  }, [dropIsOver, dropCanDrop]);

  // 드롭 인디케이터 스타일 (메모이제이션) - 더 눈에 띄게
  const getDropIndicatorStyle = useMemo(() => {
    if (!isOver || !canDrop) return null;
    
    const baseStyle = "absolute left-0 right-0 h-1 bg-blue-500 shadow-lg transition-all duration-150 z-10";
    
    switch (dropIndicator) {
      case 'top':
        return `${baseStyle} -top-0.5`;
      case 'bottom':
        return `${baseStyle} -bottom-0.5`;
      default:
        return null;
    }
  }, [isOver, canDrop, dropIndicator]);

  // 드롭 영역 스타일 (메모이제이션) - 배경 하이라이트 제거
  const getDropZoneStyle = useMemo(() => {
    const baseStyle = `relative transition-all duration-150`;
    return `${baseStyle} ${className}`;
  }, [className]);

  // 드롭 가능 여부에 따른 커서 스타일 (메모이제이션)
  const getCursorStyle = useMemo(() => {
    if (isOver && canDrop) {
      return 'cursor-copy';
    } else if (isOver && !canDrop) {
      return 'cursor-not-allowed';
    }
    return '';
  }, [isOver, canDrop]);

  if (!isVisible) return children;

  return (
    <div
      ref={(node) => {
        drop(node);
        dropRef.current = node;
      }}
      className={`block-drop-zone ${getDropZoneStyle} ${getCursorStyle}`}
      data-block-id={block.id}
      data-drop-index={index}
    >
      {/* 자식 컴포넌트 먼저 렌더링 */}
      {children}
      
      {/* 드롭 인디케이터 - 더 명확한 선 */}
      {getDropIndicatorStyle && (
        <div className={getDropIndicatorStyle}>
          {/* 인디케이터 끝부분 동그라미 */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1"></div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full translate-x-1"></div>
        </div>
      )}
      
      {/* 드롭 불가능할 때만 빨간 테두리 */}
      {isOver && !canDrop && (
        <div className="absolute inset-0 border-2 border-red-500 border-dashed rounded-lg bg-red-50 bg-opacity-30 pointer-events-none" />
      )}
      
      {/* 간단한 드롭 힌트 */}
      {isOver && canDrop && dropIndicator && (
        <div className={`
          absolute px-3 py-1 bg-blue-500 text-white text-sm rounded shadow-lg pointer-events-none z-20
          ${dropIndicator === 'top' ? 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-1' : 
            'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-1'}
        `}>
          여기에 {dragItem?.dragType === 'merge' ? '병합' : '이동'}
        </div>
      )}
    </div>
  );
};

// PropTypes 정의
BlockDropZone.propTypes = {
  block: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onDrop: PropTypes.func,
  onMerge: PropTypes.func,
  isVisible: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node
};

// export { BLOCK_COMPATIBILITY, MERGE_RULES }; // 더 이상 사용하지 않음
export default BlockDropZone; 