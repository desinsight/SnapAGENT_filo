/**
 * 언두/리두 훅
 * 
 * @description 블록 에디터의 변경사항을 추적하고 언두/리두 기능을 제공
 * @author AI Assistant
 * @version 1.0.0
 */

import { useRef, useCallback } from 'react';

export const useUndoRedo = (blocks, setBlocks) => {
  const historyRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const maxHistorySize = 50;
  const isUndoRedoRef = useRef(false); // undo/redo 실행 중인지 추적

  // 콘텐츠 정규화 함수
  const normalizeBlocks = useCallback((blocks) => {
    return blocks.map(block => ({
      ...block,
      content: typeof block.content === 'string' ? block.content.trim() : block.content,
      // 메타데이터도 정규화하여 비교
      metadata: block.metadata ? { ...block.metadata } : {}
    }));
  }, []);

  // 상태 저장
  const saveState = useCallback(() => {
    // undo/redo 실행 중이면 저장하지 않음
    if (isUndoRedoRef.current) {
      console.log('[useUndoRedo] Skipping saveState during undo/redo');
      return;
    }
    
    const newHistory = [...historyRef.current];
    const currentIndex = currentIndexRef.current;
    
    // 중복 저장 방지: 현재 상태와 비교 (정규화하여 비교)
    const normalizedBlocks = normalizeBlocks(blocks);
    const currentStateString = JSON.stringify(normalizedBlocks);
    const lastStateString = currentIndex >= 0 ? JSON.stringify(historyRef.current[currentIndex]) : null;
    
    console.log('[useUndoRedo] State comparison:', {
      currentStateString: currentStateString.substring(0, 100) + '...',
      lastStateString: lastStateString ? lastStateString.substring(0, 100) + '...' : 'null',
      isEqual: currentStateString === lastStateString
    });
    
    if (currentStateString === lastStateString) {
      console.log('[useUndoRedo] Skipping duplicate state save');
      return;
    }
    
    console.log('[useUndoRedo] saveState called:', {
      blocksLength: blocks.length,
      currentIndex,
      historyLength: newHistory.length
    });
    
    // 현재 인덱스 이후의 히스토리 제거 (새로운 변경사항이 있을 때)
    if (currentIndex < newHistory.length - 1) {
      newHistory.splice(currentIndex + 1);
    }
    
    // 새로운 상태 추가 (정규화된 버전으로 저장)
    newHistory.push(normalizedBlocks);
    currentIndexRef.current += 1;
    
    // 히스토리 크기 제한
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
      currentIndexRef.current = maxHistorySize - 1; // 인덱스 조정
    }
    
    historyRef.current = newHistory;
    
    console.log('[useUndoRedo] State saved:', {
      newIndex: currentIndexRef.current,
      newHistoryLength: historyRef.current.length
    });
  }, [blocks, normalizeBlocks]);

  // 언두
  const undo = useCallback(() => {
    console.log('[useUndoRedo] undo called:', {
      currentIndex: currentIndexRef.current,
      historyLength: historyRef.current.length,
      canUndo: currentIndexRef.current > 0
    });
    
    if (currentIndexRef.current > 0) {
      isUndoRedoRef.current = true; // undo 시작
      currentIndexRef.current -= 1;
      const previousState = historyRef.current[currentIndexRef.current];
      console.log('[useUndoRedo] Undoing to index:', currentIndexRef.current);
      console.log('[useUndoRedo] Restoring state:', previousState);
      setBlocks([...previousState]);
      
      // 비동기적으로 플래그 해제
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 0);
    } else {
      console.log('[useUndoRedo] Cannot undo - at beginning of history');
    }
  }, [setBlocks]);

  // 리두
  const redo = useCallback(() => {
    console.log('[useUndoRedo] redo called:', {
      currentIndex: currentIndexRef.current,
      historyLength: historyRef.current.length,
      canRedo: currentIndexRef.current < historyRef.current.length - 1
    });
    
    if (currentIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoRef.current = true; // redo 시작
      currentIndexRef.current += 1;
      const nextState = historyRef.current[currentIndexRef.current];
      console.log('[useUndoRedo] Redoing to index:', currentIndexRef.current);
      console.log('[useUndoRedo] Restoring state:', nextState);
      setBlocks([...nextState]);
      
      // 비동기적으로 플래그 해제
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 0);
    } else {
      console.log('[useUndoRedo] Cannot redo - at end of history');
    }
  }, [setBlocks]);

  // 히스토리 초기화
  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
  }, []);

  // 현재 상태 확인
  const canUndo = currentIndexRef.current > 0;
  const canRedo = currentIndexRef.current < historyRef.current.length - 1;

  return {
    undo,
    redo,
    saveState,
    clearHistory,
    canUndo,
    canRedo
  };
};