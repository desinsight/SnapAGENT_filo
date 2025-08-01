/**
 * 전역 선택 해제 훅
 * 
 * @description 빈 곳 클릭 시 텍스트 선택을 해제하는 전역 이벤트 리스너 관리 훅
 * @author AI Assistant
 * @version 1.0.0
 */

import { useEffect, useCallback } from 'react';
import { setupGlobalSelectionClearer, getSelectionState } from '../utils/selectionUtils';

export const useGlobalSelectionClearer = (options = {}) => {
  const {
    enabled = true,
    excludeSelectors = [
      '.notion-toolbar', 
      '.ql-toolbar', 
      '.toolbar-menu',
      '[data-toolbar]',
      '[contenteditable="true"]',
      'textarea',
      'input[type="text"]',
      'input[type="search"]',
      'input[type="url"]',
      'input[type="tel"]',
      'input[type="email"]',
      'input[type="password"]'
    ],
    clearOnEscape = true,
    clearOnClickOutside = true,
    onSelectionCleared = null,
    debug = false
  } = options;

  // 선택 해제 콜백 함수
  const handleSelectionCleared = useCallback((trigger, selectionState) => {
    if (debug) {
      console.log('[GlobalSelectionClearer] Selection cleared:', {
        trigger,
        selectionType: selectionState.selectionType,
        selectedText: selectionState.selectedText,
        element: selectionState.element
      });
    }

    if (onSelectionCleared) {
      onSelectionCleared(trigger, selectionState);
    }
  }, [onSelectionCleared, debug]);

  // 전역 선택 해제 이벤트 리스너 설정
  useEffect(() => {
    if (!enabled) return;

    const cleanup = setupGlobalSelectionClearer(handleSelectionCleared, {
      excludeSelectors,
      clearOnEscape,
      clearOnClickOutside
    });

    return cleanup;
  }, [
    enabled,
    excludeSelectors,
    clearOnEscape,
    clearOnClickOutside,
    handleSelectionCleared
  ]);

  // 현재 선택 상태를 가져오는 함수
  const getCurrentSelectionState = useCallback(() => {
    return getSelectionState();
  }, []);

  // 수동으로 선택을 해제하는 함수
  const clearSelection = useCallback(() => {
    const selectionState = getSelectionState();
    if (selectionState.hasSelection) {
      const { clearTextSelection } = require('../utils/selectionUtils');
      const cleared = clearTextSelection();
      if (cleared && onSelectionCleared) {
        onSelectionCleared('manual', selectionState);
      }
      return cleared;
    }
    return false;
  }, [onSelectionCleared]);

  return {
    getCurrentSelectionState,
    clearSelection
  };
};