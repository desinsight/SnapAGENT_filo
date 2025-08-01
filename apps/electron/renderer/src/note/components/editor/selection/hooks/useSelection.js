/**
 * 선택 시스템 React 훅
 * 
 * @description 선택 시스템의 상태와 액션을 React 컴포넌트에서 사용하기 위한 훅
 * @author AI Assistant
 * @version 1.0.0
 */

import { useContext, useEffect, useState, useCallback } from 'react';
import { SelectionContext } from '../context/SelectionContext.jsx';

/**
 * 선택 시스템 훅
 * @returns {Object} - 선택 상태와 액션들
 */
export function useSelection() {
  const context = useContext(SelectionContext);
  
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }

  const { selectionManager } = context;
  const [selectionState, setSelectionState] = useState(() => selectionManager.getSelectionState());

  // 선택 상태 업데이트 리스너
  useEffect(() => {
    const handleSelectionChange = (selection) => {
      setSelectionState(selectionManager.getSelectionState());
    };

    selectionManager.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      selectionManager.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [selectionManager]);

  // 블록 선택 액션들
  const selectBlock = useCallback((blockId, options = {}) => {
    return selectionManager.blockSelection.select(blockId, options);
  }, [selectionManager]);

  const selectBlocks = useCallback((blockIds, options = {}) => {
    return selectionManager.blockSelection.select(blockIds, options);
  }, [selectionManager]);

  const selectAllBlocks = useCallback(() => {
    return selectionManager.blockSelection.selectAll();
  }, [selectionManager]);

  const deselectBlock = useCallback((blockId) => {
    return selectionManager.blockSelection.deselect(blockId);
  }, [selectionManager]);

  const toggleBlockSelection = useCallback((blockId) => {
    return selectionManager.blockSelection.select(blockId, { toggle: true });
  }, [selectionManager]);

  const selectBlockRange = useCallback((fromBlockId, toBlockId) => {
    const rangeBlocks = selectionManager.blockSelection.getBlockRange(fromBlockId, toBlockId);
    return selectionManager.blockSelection.select(rangeBlocks);
  }, [selectionManager]);

  // 텍스트 선택 액션들
  const startTextSelection = useCallback((startPoint) => {
    return selectionManager.textSelection.startSelection(startPoint);
  }, [selectionManager]);

  const extendTextSelection = useCallback((endPoint) => {
    return selectionManager.textSelection.extendSelection(endPoint);
  }, [selectionManager]);

  const endTextSelection = useCallback(() => {
    return selectionManager.textSelection.endSelection();
  }, [selectionManager]);

  // 선택 조작 액션들
  const deleteSelection = useCallback(() => {
    const { activeSelection } = selectionState;
    if (!activeSelection) return null;

    if (activeSelection.type === 'block_selection') {
      return selectionManager.blockSelection.deleteSelected();
    } else if (activeSelection.type === 'text') {
      return selectionManager.textSelection.deleteSelectedText();
    }
    
    return null;
  }, [selectionManager, selectionState]);

  const copySelection = useCallback(() => {
    const { activeSelection } = selectionState;
    if (!activeSelection) return null;

    if (activeSelection.type === 'block_selection') {
      return selectionManager.blockSelection.copySelected();
    } else if (activeSelection.type === 'text') {
      return selectionManager.textSelection.copySelectedText();
    }
    
    return null;
  }, [selectionManager, selectionState]);

  const cutSelection = useCallback(() => {
    const { activeSelection } = selectionState;
    if (!activeSelection) return null;

    if (activeSelection.type === 'block_selection') {
      return selectionManager.blockSelection.cutSelected();
    } else if (activeSelection.type === 'text') {
      return selectionManager.textSelection.cutSelectedText();
    }
    
    return null;
  }, [selectionManager, selectionState]);

  const formatSelection = useCallback((formatType, formatValue) => {
    const { activeSelection } = selectionState;
    if (!activeSelection || activeSelection.type !== 'text') {
      return null;
    }

    return selectionManager.textSelection.formatSelectedText(formatType, formatValue);
  }, [selectionManager, selectionState]);

  // 드래그 선택 액션들
  const startDrag = useCallback((startPoint) => {
    return selectionManager.dragSelection.startDrag(startPoint);
  }, [selectionManager]);

  const updateDrag = useCallback((currentPoint) => {
    return selectionManager.dragSelection.updateDrag(currentPoint);
  }, [selectionManager]);

  const endDrag = useCallback((endPoint) => {
    return selectionManager.dragSelection.endDrag(endPoint);
  }, [selectionManager]);

  const cancelDrag = useCallback(() => {
    return selectionManager.dragSelection.cancelDrag();
  }, [selectionManager]);

  // 전체 선택 해제
  const clearSelection = useCallback(() => {
    return selectionManager.clearSelection();
  }, [selectionManager]);

  // 키보드 네비게이션
  const selectNext = useCallback((options = {}) => {
    return selectionManager.blockSelection.selectNext(options);
  }, [selectionManager]);

  const selectPrevious = useCallback((options = {}) => {
    return selectionManager.blockSelection.selectPrevious(options);
  }, [selectionManager]);

  // 선택 상태 헬퍼들
  const isBlockSelected = useCallback((blockId) => {
    return selectionManager.blockSelection.isSelected(blockId);
  }, [selectionManager]);

  const getSelectedBlocks = useCallback(() => {
    const blockSelectionState = selectionManager.blockSelection.getState();
    return blockSelectionState.selectedBlocks;
  }, [selectionManager]);

  const getSelectedText = useCallback(() => {
    const textSelectionState = selectionManager.textSelection.getState();
    return textSelectionState.currentSelection?.selectedText || '';
  }, [selectionManager]);

  const hasSelection = useCallback(() => {
    return selectionState.hasSelection;
  }, [selectionState]);

  const getSelectionType = useCallback(() => {
    return selectionState.activeSelection?.type || 'none';
  }, [selectionState]);

  const getSelectionCount = useCallback(() => {
    const { activeSelection } = selectionState;
    if (!activeSelection) return 0;

    if (activeSelection.type === 'block_selection') {
      return activeSelection.count || 0;
    } else if (activeSelection.type === 'text') {
      return activeSelection.selectedText ? activeSelection.selectedText.length : 0;
    }
    
    return 0;
  }, [selectionState]);

  // 플러그인 관리
  const addPlugin = useCallback((plugin) => {
    return selectionManager.addPlugin(plugin);
  }, [selectionManager]);

  const removePlugin = useCallback((pluginName) => {
    return selectionManager.removePlugin(pluginName);
  }, [selectionManager]);

  return {
    // 상태
    selectionState,
    activeSelection: selectionState.activeSelection,
    currentEngine: selectionState.currentEngine,
    isSelecting: selectionState.isSelecting,
    
    // 블록 선택
    selectBlock,
    selectBlocks,
    selectAllBlocks,
    deselectBlock,
    toggleBlockSelection,
    selectBlockRange,
    selectNext,
    selectPrevious,
    
    // 텍스트 선택
    startTextSelection,
    extendTextSelection,
    endTextSelection,
    
    // 드래그 선택
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    
    // 선택 조작
    deleteSelection,
    copySelection,
    cutSelection,
    formatSelection,
    clearSelection,
    
    // 헬퍼들
    isBlockSelected,
    getSelectedBlocks,
    getSelectedText,
    hasSelection,
    getSelectionType,
    getSelectionCount,
    
    // 플러그인
    addPlugin,
    removePlugin,
    
    // 직접 접근 (고급 사용)
    selectionManager
  };
}