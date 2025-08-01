/**
 * contenteditable 요소를 위한 공통 훅
 * 
 * @description 한글 입력, 포커스, 선택 등을 처리하는 공통 로직
 * @author AI Assistant
 * @version 1.0.0
 */

import { useRef, useEffect, useCallback } from 'react';

export const useContentEditable = ({
  block,
  onUpdate,
  onFocus,
  onSelectionChange,
  onEditingChange,
  onFormatChange,
  readOnly = false
}) => {
  const contentRef = useRef(null);
  const isComposing = useRef(false);

  // 초기 콘텐츠 설정
  useEffect(() => {
    if (!isComposing.current && contentRef.current && contentRef.current.innerHTML !== block.content) {
      const selection = window.getSelection();
      const wasActive = document.activeElement === contentRef.current;
      let range = null;
      
      if (wasActive && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      }
      contentRef.current.innerHTML = block.content || '';
      if (wasActive && range) {
        try {
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          const newRange = document.createRange();
          newRange.selectNodeContents(contentRef.current);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  }, [block.content]);

  // 포커스 시 커서 위치 설정
  useEffect(() => {
    if (block.focused && contentRef.current && !readOnly) {
      contentRef.current.focus();
      
      // 빈 블록이면 시작 위치에, 내용이 있으면 끝 위치에 커서 설정
      const range = document.createRange();
      const selection = window.getSelection();
      
      if (!block.content || block.content.trim() === '') {
        // 빈 블록: 시작 위치에 커서
        if (contentRef.current.firstChild && contentRef.current.firstChild.nodeType === Node.TEXT_NODE) {
          range.setStart(contentRef.current.firstChild, 0);
          range.setEnd(contentRef.current.firstChild, 0);
        } else {
          range.setStart(contentRef.current, 0);
          range.setEnd(contentRef.current, 0);
        }
      } else {
        // 내용이 있는 블록: 끝 위치에 커서
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
      }
      
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, [block.focused, readOnly, block.content]);

  // 콘텐츠 변경 처리
  const handleInput = useCallback((e) => {
    if (!isComposing.current) {
      const content = e.target.innerHTML || '';
      onUpdate({ content });
      // 포맷 변경 알림
      if (onFormatChange) {
        onFormatChange('content', content);
      }
    }
  }, [onUpdate, onFormatChange]);

  // 한글 조합 처리
  const handleCompositionStart = useCallback(() => {
    isComposing.current = true;
  }, []);

  const handleCompositionEnd = useCallback((e) => {
    isComposing.current = false;
    // 한글 조합 완료 후 콘텐츠 업데이트
    setTimeout(() => {
      const content = e.target.innerHTML || '';
      onUpdate({ content });
      // 포맷 변경 알림
      if (onFormatChange) {
        onFormatChange('content', content);
      }
    }, 0);
  }, [onUpdate, onFormatChange]);

  // 포커스 처리
  const handleFocus = useCallback(() => {
    onFocus();
    if (onEditingChange) {
      onEditingChange(true);
    }
  }, [onFocus, onEditingChange]);

  // 블러 처리
  const handleBlur = useCallback(() => {
    if (onEditingChange) {
      onEditingChange(false);
    }
    // 선택 해제
    if (onSelectionChange) {
      onSelectionChange(null);
    }
  }, [onEditingChange, onSelectionChange]);

  // 텍스트 선택 처리
  const handleMouseUp = useCallback(() => {
    if (onSelectionChange) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        
        if (selectedText.trim()) {
          onSelectionChange({
            text: selectedText,
            rect: range.getBoundingClientRect(),
            element: contentRef.current,
            range: range,
            selection: selection
          });
        }
      } else {
        onSelectionChange(null);
      }
    }
  }, [onSelectionChange]);

  // 붙여넣기 처리 (HTML 태그 지원)
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const htmlData = (e.clipboardData || window.clipboardData).getData('text/html');
    const textData = (e.clipboardData || window.clipboardData).getData('text');
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    selection.deleteFromDocument();
    
    // HTML 데이터가 있으면 HTML을 우선 사용, 없으면 텍스트 사용
    if (htmlData) {
      const div = document.createElement('div');
      div.innerHTML = htmlData;
      const fragment = document.createDocumentFragment();
      while (div.firstChild) {
        fragment.appendChild(div.firstChild);
      }
      selection.getRangeAt(0).insertNode(fragment);
    } else {
      selection.getRangeAt(0).insertNode(document.createTextNode(textData));
    }
    
    selection.collapseToEnd();
    
    // 콘텐츠 업데이트
    const content = contentRef.current.innerHTML || '';
    onUpdate({ content });
    // 포맷 변경 알림
    if (onFormatChange) {
      onFormatChange('content', content);
    }
  }, [onUpdate, onFormatChange]);

  return {
    contentRef,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    handleFocus,
    handleBlur,
    handleMouseUp,
    handlePaste
  };
}; 