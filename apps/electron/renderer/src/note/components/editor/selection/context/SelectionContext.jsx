/**
 * 선택 시스템 React 컨텍스트
 * 
 * @description 선택 시스템의 상태와 관리자를 React 컴포넌트 트리에 제공
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import { SelectionManager } from '../SelectionManager.js';

/**
 * 선택 컨텍스트
 */
export const SelectionContext = createContext(null);

// selection 객체 얕은 비교 함수 (직렬화 가능한 필드만)
function shallowEqualSelection(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.text === b.text &&
    JSON.stringify(a.rect) === JSON.stringify(b.rect) &&
    a.from === b.from &&
    a.to === b.to
    // 필요한 필드만 추가
  );
}

/**
 * 선택 컨텍스트 프로바이더
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 자식 컴포넌트들
 * @param {Object} props.config - 선택 시스템 설정
 */
export function SelectionProvider({ children, config = {} }) {
  const selectionManagerRef = useRef(null);
  const [selection, setSelection] = useState(null);

  // SelectionManager 초기화 (한 번만)
  if (!selectionManagerRef.current) {
    selectionManagerRef.current = new SelectionManager(config);
  }
  const selectionManager = selectionManagerRef.current;

  // selection 변경 이벤트 핸들러
  const handleSelectionChange = useCallback((newSelection) => {
    setSelection(prev => {
      if (!shallowEqualSelection(prev, newSelection)) {
        return newSelection;
      }
      return prev;
    });
  }, []);

  // 컴포넌트 마운트 시 선택 시스템 초기화
  useEffect(() => {
    const initializeSelection = async () => {
      try {
        console.log('[SelectionProvider] Initializing selection system');
        await selectionManager.initialize();
        console.log('[SelectionProvider] Selection system initialized successfully');
      } catch (error) {
        console.error('[SelectionProvider] Failed to initialize selection system:', error);
      }
    };
    initializeSelection();
    return () => {
      console.log('[SelectionProvider] Cleaning up selection system');
      selectionManager.destroy();
    };
  }, [selectionManager]);

  // 컨텍스트 값
  const contextValue = {
    selectionManager,
    selection,
    setSelection: handleSelectionChange
  };

  return (
    <SelectionContext.Provider value={contextValue}>
      {children}
    </SelectionContext.Provider>
  );
}

/**
 * 선택 컨텍스트 훅 (편의 함수)
 * @returns {Object} - 선택 컨텍스트 값
 * @throws {Error} - SelectionProvider 외부에서 사용 시 에러
 */
export function useSelectionContext() {
  const context = useContext(SelectionContext);
  
  if (!context) {
    throw new Error('useSelectionContext must be used within a SelectionProvider');
  }
  
  return context;
}

/**
 * HOC: 선택 시스템과 함께 컴포넌트 래핑
 * @param {React.Component} Component - 래핑할 컴포넌트
 * @param {Object} config - 선택 시스템 설정
 * @returns {React.Component} - 래핑된 컴포넌트
 */
export function withSelection(Component, config = {}) {
  const WrappedComponent = (props) => {
    return (
      <SelectionProvider config={config}>
        <Component {...props} />
      </SelectionProvider>
    );
  };

  WrappedComponent.displayName = `withSelection(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}