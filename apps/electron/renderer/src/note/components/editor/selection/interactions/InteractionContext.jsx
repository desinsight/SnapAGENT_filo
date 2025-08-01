/**
 * 블록 상호작용 컨텍스트
 * 
 * @description React Context를 통한 전역 블록 상호작용 상태 관리
 * - 전체 에디터에서 블록 상호작용 상태 공유
 * - 드래그, 선택, 상호작용 모드 관리
 * - 실시간 피드백과 상태 동기화
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useBlockInteraction } from './useBlockInteraction';

// 상호작용 모드 정의
export const INTERACTION_MODES = {
  IDLE: 'idle',
  SELECTING: 'selecting',
  DRAGGING: 'dragging',
  MERGING: 'merging',
  CONVERTING: 'converting',
  SPLITTING: 'splitting'
};

// 액션 타입 정의
const ACTION_TYPES = {
  SET_MODE: 'SET_MODE',
  SET_SELECTED_BLOCKS: 'SET_SELECTED_BLOCKS',
  ADD_SELECTED_BLOCK: 'ADD_SELECTED_BLOCK',
  REMOVE_SELECTED_BLOCK: 'REMOVE_SELECTED_BLOCK',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  SET_DRAG_STATE: 'SET_DRAG_STATE',
  SET_TARGET_BLOCK: 'SET_TARGET_BLOCK',
  SET_INTERACTION_FEEDBACK: 'SET_INTERACTION_FEEDBACK',
  SET_SUGGESTIONS: 'SET_SUGGESTIONS',
  CLEAR_FEEDBACK: 'CLEAR_FEEDBACK'
};

// 초기 상태
const initialState = {
  mode: INTERACTION_MODES.IDLE,
  selectedBlocks: [],
  targetBlock: null,
  dragState: {
    isDragging: false,
    draggedBlocks: [],
    dropTarget: null,
    dropPosition: null
  },
  interactionFeedback: {
    type: null,
    message: '',
    isVisible: false
  },
  suggestions: {
    merge: [],
    convert: [],
    split: []
  },
  lastAction: null
};

// 리듀서
const interactionReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_MODE:
      return {
        ...state,
        mode: action.payload,
        interactionFeedback: action.payload === INTERACTION_MODES.IDLE 
          ? { ...state.interactionFeedback, isVisible: false }
          : state.interactionFeedback
      };
    
    case ACTION_TYPES.SET_SELECTED_BLOCKS:
      return {
        ...state,
        selectedBlocks: action.payload,
        mode: action.payload.length > 0 ? INTERACTION_MODES.SELECTING : INTERACTION_MODES.IDLE
      };
    
    case ACTION_TYPES.ADD_SELECTED_BLOCK:
      const existingIndex = state.selectedBlocks.findIndex(block => block.id === action.payload.id);
      if (existingIndex >= 0) return state;
      
      const newSelectedBlocks = [...state.selectedBlocks, action.payload];
      return {
        ...state,
        selectedBlocks: newSelectedBlocks,
        mode: INTERACTION_MODES.SELECTING
      };
    
    case ACTION_TYPES.REMOVE_SELECTED_BLOCK:
      const filteredBlocks = state.selectedBlocks.filter(block => block.id !== action.payload);
      return {
        ...state,
        selectedBlocks: filteredBlocks,
        mode: filteredBlocks.length > 0 ? INTERACTION_MODES.SELECTING : INTERACTION_MODES.IDLE
      };
    
    case ACTION_TYPES.CLEAR_SELECTION:
      return {
        ...state,
        selectedBlocks: [],
        targetBlock: null,
        mode: INTERACTION_MODES.IDLE,
        suggestions: { merge: [], convert: [], split: [] }
      };
    
    case ACTION_TYPES.SET_DRAG_STATE:
      return {
        ...state,
        dragState: { ...state.dragState, ...action.payload },
        mode: action.payload.isDragging ? INTERACTION_MODES.DRAGGING : state.mode
      };
    
    case ACTION_TYPES.SET_TARGET_BLOCK:
      return {
        ...state,
        targetBlock: action.payload
      };
    
    case ACTION_TYPES.SET_INTERACTION_FEEDBACK:
      return {
        ...state,
        interactionFeedback: {
          ...state.interactionFeedback,
          ...action.payload,
          isVisible: true
        }
      };
    
    case ACTION_TYPES.SET_SUGGESTIONS:
      return {
        ...state,
        suggestions: { ...state.suggestions, ...action.payload }
      };
    
    case ACTION_TYPES.CLEAR_FEEDBACK:
      return {
        ...state,
        interactionFeedback: { ...state.interactionFeedback, isVisible: false }
      };
    
    default:
      return state;
  }
};

// 컨텍스트 생성
const InteractionContext = createContext();

// 컨텍스트 훅
export const useInteractionContext = () => {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error('useInteractionContext must be used within an InteractionProvider');
  }
  return context;
};

/**
 * 상호작용 컨텍스트 프로바이더
 */
export const InteractionProvider = ({ 
  children, 
  onBlockChange, 
  onInteractionComplete,
  config = {} 
}) => {
  const [state, dispatch] = useReducer(interactionReducer, initialState);
  const timeoutRef = useRef(null);
  
  // 블록 상호작용 훅 사용
  const blockInteraction = useBlockInteraction({
    debugMode: config.debugMode || false,
    enableAnimations: config.enableAnimations !== false,
    ...config
  });
  
  // 피드백 자동 숨김 타이머
  useEffect(() => {
    if (state.interactionFeedback.isVisible) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        dispatch({ type: ACTION_TYPES.CLEAR_FEEDBACK });
      }, 3000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state.interactionFeedback.isVisible]);
  
  // 선택된 블록 변경 시 제안 업데이트
  useEffect(() => {
    if (state.selectedBlocks.length > 0) {
      updateSuggestions();
    }
  }, [state.selectedBlocks, state.targetBlock]);
  
  // 모드 설정
  const setMode = useCallback((mode) => {
    dispatch({ type: ACTION_TYPES.SET_MODE, payload: mode });
  }, []);
  
  // 블록 선택 관리
  const setSelectedBlocks = useCallback((blocks) => {
    dispatch({ type: ACTION_TYPES.SET_SELECTED_BLOCKS, payload: blocks });
  }, []);
  
  const addSelectedBlock = useCallback((block) => {
    dispatch({ type: ACTION_TYPES.ADD_SELECTED_BLOCK, payload: block });
  }, []);
  
  const removeSelectedBlock = useCallback((blockId) => {
    dispatch({ type: ACTION_TYPES.REMOVE_SELECTED_BLOCK, payload: blockId });
  }, []);
  
  const clearSelection = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_SELECTION });
  }, []);
  
  const isBlockSelected = useCallback((blockId) => {
    return state.selectedBlocks.some(block => block.id === blockId);
  }, [state.selectedBlocks]);
  
  // 드래그 상태 관리
  const setDragState = useCallback((dragState) => {
    dispatch({ type: ACTION_TYPES.SET_DRAG_STATE, payload: dragState });
  }, []);
  
  const startDrag = useCallback((blocks) => {
    setDragState({
      isDragging: true,
      draggedBlocks: blocks
    });
    setMode(INTERACTION_MODES.DRAGGING);
  }, [setDragState, setMode]);
  
  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedBlocks: [],
      dropTarget: null,
      dropPosition: null
    });
    setMode(INTERACTION_MODES.IDLE);
  }, [setDragState, setMode]);
  
  // 타겟 블록 설정
  const setTargetBlock = useCallback((block) => {
    dispatch({ type: ACTION_TYPES.SET_TARGET_BLOCK, payload: block });
  }, []);
  
  // 피드백 메시지 표시
  const showFeedback = useCallback((type, message) => {
    dispatch({ 
      type: ACTION_TYPES.SET_INTERACTION_FEEDBACK, 
      payload: { type, message } 
    });
  }, []);
  
  const clearFeedback = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_FEEDBACK });
  }, []);
  
  // 제안 업데이트
  const updateSuggestions = useCallback(async () => {
    if (state.selectedBlocks.length === 0) {
      dispatch({ 
        type: ACTION_TYPES.SET_SUGGESTIONS, 
        payload: { merge: [], convert: [], split: [] } 
      });
      return;
    }
    
    const suggestions = {};
    
    // 병합 제안
    if (state.targetBlock && state.selectedBlocks.length > 0) {
      const mergeSuggestion = blockInteraction.getMergeSuggestions(state.selectedBlocks, state.targetBlock);
      suggestions.merge = mergeSuggestion ? [mergeSuggestion] : [];
    }
    
    // 변환 제안
    if (state.selectedBlocks.length > 0) {
      suggestions.convert = blockInteraction.getConversionSuggestions(state.selectedBlocks);
    }
    
    // 분할 제안 (단일 블록만)
    if (state.selectedBlocks.length === 1) {
      suggestions.split = blockInteraction.getSplitSuggestions(state.selectedBlocks[0]);
    }
    
    dispatch({ type: ACTION_TYPES.SET_SUGGESTIONS, payload: suggestions });
  }, [state.selectedBlocks, state.targetBlock, blockInteraction]);
  
  // 블록 병합 실행
  const executeMerge = useCallback(async (options = {}) => {
    if (!state.targetBlock || state.selectedBlocks.length === 0) {
      showFeedback('error', '병합할 블록과 대상을 선택해주세요');
      return null;
    }
    
    setMode(INTERACTION_MODES.MERGING);
    showFeedback('info', '블록을 병합하는 중...');
    
    try {
      const result = await blockInteraction.mergeBlocks(state.selectedBlocks, state.targetBlock, options);
      
      if (result.success) {
        showFeedback('success', `${state.selectedBlocks.length}개 블록이 성공적으로 병합되었습니다`);
        
        if (onBlockChange) {
          onBlockChange(result.changes);
        }
        
        if (onInteractionComplete) {
          onInteractionComplete(result);
        }
        
        clearSelection();
      } else {
        showFeedback('error', `병합 실패: ${result.error}`);
      }
      
      return result;
    } finally {
      setMode(INTERACTION_MODES.IDLE);
    }
  }, [state.selectedBlocks, state.targetBlock, showFeedback, setMode, blockInteraction, onBlockChange, onInteractionComplete, clearSelection]);
  
  // 블록 변환 실행
  const executeConvert = useCallback(async (targetType, options = {}) => {
    if (state.selectedBlocks.length === 0) {
      showFeedback('error', '변환할 블록을 선택해주세요');
      return null;
    }
    
    setMode(INTERACTION_MODES.CONVERTING);
    showFeedback('info', '블록을 변환하는 중...');
    
    try {
      const result = await blockInteraction.convertBlocks(state.selectedBlocks, targetType, options);
      
      if (result.success) {
        showFeedback('success', `${state.selectedBlocks.length}개 블록이 ${targetType}로 변환되었습니다`);
        
        if (onBlockChange) {
          onBlockChange(result.changes);
        }
        
        if (onInteractionComplete) {
          onInteractionComplete(result);
        }
        
        clearSelection();
      } else {
        showFeedback('error', `변환 실패: ${result.error}`);
      }
      
      return result;
    } finally {
      setMode(INTERACTION_MODES.IDLE);
    }
  }, [state.selectedBlocks, showFeedback, setMode, blockInteraction, onBlockChange, onInteractionComplete, clearSelection]);
  
  // 블록 분할 실행
  const executeSplit = useCallback(async (options = {}) => {
    if (state.selectedBlocks.length !== 1) {
      showFeedback('error', '분할할 블록을 하나만 선택해주세요');
      return null;
    }
    
    setMode(INTERACTION_MODES.SPLITTING);
    showFeedback('info', '블록을 분할하는 중...');
    
    try {
      const result = await blockInteraction.splitBlock(state.selectedBlocks[0], options);
      
      if (result.success) {
        showFeedback('success', `블록이 ${result.data.partsCreated}개로 분할되었습니다`);
        
        if (onBlockChange) {
          onBlockChange(result.changes);
        }
        
        if (onInteractionComplete) {
          onInteractionComplete(result);
        }
        
        clearSelection();
      } else {
        showFeedback('error', `분할 실패: ${result.error}`);
      }
      
      return result;
    } finally {
      setMode(INTERACTION_MODES.IDLE);
    }
  }, [state.selectedBlocks, showFeedback, setMode, blockInteraction, onBlockChange, onInteractionComplete, clearSelection]);
  
  // 그룹 생성
  const createGroup = useCallback(async (options = {}) => {
    if (state.selectedBlocks.length < 2) {
      showFeedback('error', '그룹을 만들려면 최소 2개 블록을 선택해주세요');
      return null;
    }
    
    try {
      const result = await blockInteraction.createGroup(state.selectedBlocks, options);
      
      if (result.success) {
        showFeedback('success', `${state.selectedBlocks.length}개 블록이 그룹으로 묶였습니다`);
        
        if (onBlockChange) {
          onBlockChange(result.changes);
        }
        
        if (onInteractionComplete) {
          onInteractionComplete(result);
        }
      } else {
        showFeedback('error', `그룹 생성 실패: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      showFeedback('error', `그룹 생성 중 오류: ${error.message}`);
      return null;
    }
  }, [state.selectedBlocks, showFeedback, blockInteraction, onBlockChange, onInteractionComplete]);
  
  // 그룹 해제
  const ungroupBlocks = useCallback(async (blocks = null) => {
    const targetBlocks = blocks || state.selectedBlocks;
    
    try {
      const result = await blockInteraction.ungroupBlocks(targetBlocks);
      
      if (result.success) {
        showFeedback('success', `${targetBlocks.length}개 블록의 그룹이 해제되었습니다`);
        
        if (onBlockChange) {
          onBlockChange(result.changes);
        }
        
        if (onInteractionComplete) {
          onInteractionComplete(result);
        }
      } else {
        showFeedback('error', `그룹 해제 실패: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      showFeedback('error', `그룹 해제 중 오류: ${error.message}`);
      return null;
    }
  }, [state.selectedBlocks, showFeedback, blockInteraction, onBlockChange, onInteractionComplete]);
  
  // 컨텍스트 값
  const contextValue = {
    // 상태
    ...state,
    
    // 기본 액션들
    setMode,
    setSelectedBlocks,
    addSelectedBlock,
    removeSelectedBlock,
    clearSelection,
    isBlockSelected,
    
    // 드래그 관련
    setDragState,
    startDrag,
    endDrag,
    setTargetBlock,
    
    // 피드백 관련
    showFeedback,
    clearFeedback,
    
    // 제안 관련
    updateSuggestions,
    
    // 실행 함수들
    executeMerge,
    executeConvert,
    executeSplit,
    createGroup,
    ungroupBlocks,
    
    // 블록 상호작용 인스턴스 (고급 사용)
    blockInteraction,
    
    // 검증 함수들
    canMerge: blockInteraction.canMerge,
    canConvert: blockInteraction.canConvert,
    canSplit: blockInteraction.canSplit
  };
  
  return (
    <InteractionContext.Provider value={contextValue}>
      {children}
    </InteractionContext.Provider>
  );
};

// PropTypes 정의
InteractionProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onBlockChange: PropTypes.func,
  onInteractionComplete: PropTypes.func,
  config: PropTypes.object
};

export default InteractionProvider;