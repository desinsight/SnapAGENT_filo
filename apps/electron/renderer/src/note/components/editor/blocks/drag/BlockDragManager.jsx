/**
 * 블록 드래그 관리자 컴포넌트
 * 
 * @description 전역 드래그 상태와 다중 선택, 병합 로직을 관리하는 컨텍스트 제공자
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';

// 드래그 상태 타입
const DRAG_STATES = {
  IDLE: 'idle',
  DRAGGING: 'dragging',
  DROPPING: 'dropping'
};

// 액션 타입
const ACTION_TYPES = {
  SET_DRAG_STATE: 'SET_DRAG_STATE',
  SET_SELECTED_BLOCKS: 'SET_SELECTED_BLOCKS',
  ADD_SELECTED_BLOCK: 'ADD_SELECTED_BLOCK',
  REMOVE_SELECTED_BLOCK: 'REMOVE_SELECTED_BLOCK',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  SET_DRAG_ITEM: 'SET_DRAG_ITEM',
  SET_DROP_TARGET: 'SET_DROP_TARGET',
  RESET_DRAG: 'RESET_DRAG'
};

// 초기 상태
const initialState = {
  dragState: DRAG_STATES.IDLE,
  selectedBlocks: [],
  dragItem: null,
  dropTarget: null,
  isMultiSelect: false,
  dragType: 'single'
};

// 리듀서
const dragReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_DRAG_STATE:
      return {
        ...state,
        dragState: action.payload
      };
    
    case ACTION_TYPES.SET_SELECTED_BLOCKS:
      return {
        ...state,
        selectedBlocks: action.payload,
        isMultiSelect: action.payload.length > 1
      };
    
    case ACTION_TYPES.ADD_SELECTED_BLOCK:
      const newSelected = [...state.selectedBlocks];
      if (!newSelected.find(block => block.id === action.payload.id)) {
        newSelected.push(action.payload);
      }
      return {
        ...state,
        selectedBlocks: newSelected,
        isMultiSelect: newSelected.length > 1
      };
    
    case ACTION_TYPES.REMOVE_SELECTED_BLOCK:
      return {
        ...state,
        selectedBlocks: state.selectedBlocks.filter(block => block.id !== action.payload),
        isMultiSelect: state.selectedBlocks.length - 1 > 1
      };
    
    case ACTION_TYPES.CLEAR_SELECTION:
      return {
        ...state,
        selectedBlocks: [],
        isMultiSelect: false
      };
    
    case ACTION_TYPES.SET_DRAG_ITEM:
      return {
        ...state,
        dragItem: action.payload,
        dragType: action.payload?.dragType || 'single'
      };
    
    case ACTION_TYPES.SET_DROP_TARGET:
      return {
        ...state,
        dropTarget: action.payload
      };
    
    case ACTION_TYPES.RESET_DRAG:
      return {
        ...initialState
      };
    
    default:
      return state;
  }
};

// 컨텍스트 생성
const BlockDragContext = createContext();

// 컨텍스트 훅
export const useBlockDrag = () => {
  const context = useContext(BlockDragContext);
  if (!context) {
    throw new Error('useBlockDrag must be used within a BlockDragProvider');
  }
  return context;
};

// 블록 병합 로직
const mergeBlocks = (blocks, targetType) => {
  switch (targetType) {
    case 'checkList':
      return {
        type: 'checkList',
        content: '',
        metadata: {
          items: blocks.map((block, index) => ({
            id: `item-${index}`,
            content: block.content,
            checked: false
          }))
        }
      };
    
    case 'bulletList':
      return {
        type: 'bulletList',
        content: '',
        metadata: {
          items: blocks.map((block, index) => ({
            id: `item-${index}`,
            content: block.content
          }))
        }
      };
    
    case 'numberedList':
      return {
        type: 'numberedList',
        content: '',
        metadata: {
          items: blocks.map((block, index) => ({
            id: `item-${index}`,
            content: block.content
          }))
        }
      };
    
    default:
      return null;
  }
};

// 블록 타입 변환 로직
const convertBlockType = (block, targetType) => {
  switch (targetType) {
    case 'heading1':
    case 'heading2':
    case 'heading3':
      return {
        ...block,
        type: targetType
      };
    
    case 'bulletList':
    case 'numberedList':
    case 'checkList':
      return {
        ...block,
        type: targetType,
        metadata: {
          ...block.metadata,
          items: [{
            id: 'item-0',
            content: block.content,
            checked: targetType === 'checkList' ? false : undefined
          }]
        }
      };
    
    default:
      return block;
  }
};

export const BlockDragProvider = ({ children, onBlockMove, onBlockMerge, onBlockConvert }) => {
  const [state, dispatch] = useReducer(dragReducer, initialState);

  // 드래그 상태 설정
  const setDragState = useCallback((dragState) => {
    dispatch({ type: ACTION_TYPES.SET_DRAG_STATE, payload: dragState });
  }, []);

  // 선택된 블록 설정
  const setSelectedBlocks = useCallback((blocks) => {
    dispatch({ type: ACTION_TYPES.SET_SELECTED_BLOCKS, payload: blocks });
  }, []);

  // 블록 선택 추가
  const addSelectedBlock = useCallback((block) => {
    dispatch({ type: ACTION_TYPES.ADD_SELECTED_BLOCK, payload: block });
  }, []);

  // 블록 선택 제거
  const removeSelectedBlock = useCallback((blockId) => {
    dispatch({ type: ACTION_TYPES.REMOVE_SELECTED_BLOCK, payload: blockId });
  }, []);

  // 선택 초기화
  const clearSelection = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_SELECTION });
  }, []);

  // 드래그 아이템 설정
  const setDragItem = useCallback((item) => {
    dispatch({ type: ACTION_TYPES.SET_DRAG_ITEM, payload: item });
  }, []);

  // 드롭 타겟 설정
  const setDropTarget = useCallback((target) => {
    dispatch({ type: ACTION_TYPES.SET_DROP_TARGET, payload: target });
  }, []);

  // 드래그 리셋
  const resetDrag = useCallback(() => {
    dispatch({ type: ACTION_TYPES.RESET_DRAG });
  }, []);

  // 드래그 시작 처리
  const handleDragStart = useCallback((item) => {
    setDragState(DRAG_STATES.DRAGGING);
    setDragItem(item);
  }, [setDragState, setDragItem]);

  // 드래그 종료 처리
  const handleDragEnd = useCallback((item, monitor) => {
    setDragState(DRAG_STATES.IDLE);
    setDragItem(null);
    setDropTarget(null);
    
    if (!monitor.didDrop()) {
      // 드롭되지 않은 경우 선택 유지
      return;
    }
  }, [setDragState, setDragItem, setDropTarget]);

  // 드롭 처리
  const handleDrop = useCallback((dropResult) => {
    const { item, targetBlock, targetIndex, dropPosition } = dropResult;
    
    if (item.dragType === 'merge') {
      // 병합 처리
      const mergedBlock = mergeBlocks(item.blocks, targetBlock.type);
      if (mergedBlock && onBlockMerge) {
        onBlockMerge({
          sourceBlocks: item.blocks,
          targetBlock,
          targetIndex,
          mergedBlock
        });
      }
    } else {
      // 이동 처리
      if (onBlockMove) {
        onBlockMove({
          sourceIndex: item.index,
          targetIndex,
          block: item.block || item.blocks[0],
          dropPosition
        });
      }
    }
    
    resetDrag();
  }, [onBlockMove, onBlockMerge, resetDrag]);

  // 블록 변환 처리
  const handleBlockConvert = useCallback((block, targetType) => {
    const convertedBlock = convertBlockType(block, targetType);
    if (convertedBlock && onBlockConvert) {
      onBlockConvert(block, convertedBlock);
    }
  }, [onBlockConvert]);

  // 컨텍스트 값
  const contextValue = {
    // 상태
    ...state,
    
    // 액션
    setDragState,
    setSelectedBlocks,
    addSelectedBlock,
    removeSelectedBlock,
    clearSelection,
    setDragItem,
    setDropTarget,
    resetDrag,
    
    // 이벤트 핸들러
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleBlockConvert,
    
    // 유틸리티
    isBlockSelected: (blockId) => state.selectedBlocks.some(block => block.id === blockId),
    canMerge: (blocks, targetType) => {
      // 병합 가능 여부 확인 로직
      return blocks.length > 1 && ['checkList', 'bulletList', 'numberedList'].includes(targetType);
    }
  };

  return (
    <BlockDragContext.Provider value={contextValue}>
      {children}
    </BlockDragContext.Provider>
  );
};

// PropTypes 정의
BlockDragProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onBlockMove: PropTypes.func,
  onBlockMerge: PropTypes.func,
  onBlockConvert: PropTypes.func
};

export { DRAG_STATES, ACTION_TYPES };
export default BlockDragProvider; 