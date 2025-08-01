/**
 * 툴바 위치 관리 훅
 * 
 * @description 툴바 위치 계산 및 Popper.js 관리 로직
 * @author AI Assistant
 * @version 1.0.0
 */

import { useState, useEffect, useRef } from 'react';
import { createPopper } from '@popperjs/core';

export const useToolbarPositioner = (selection, isVisible) => {
  const [popperInstance, setPopperInstance] = useState(null);
  const toolbarRef = useRef(null);
  const virtualRef = useRef({ getBoundingClientRect: () => ({}) });
  
  // 정리 함수를 참조로 저장하여 메모리 누수 방지
  const cleanupRef = useRef(null);

  // selection prop 변경 감지 (Quill/textarea/ProseMirror 모두 지원)
  useEffect(() => {
    console.log('[useToolbarPositioner] Selection changed:', {
      selection,
      hasQuill: !!(selection?.quill),
      hasProseMirror: !!(selection?.prosemirror),
      hasRect: !!(selection?.rect),
      hasElement: !!(selection?.element),
      rectDetails: selection?.rect
    });
    
    if (selection && selection.quill && selection.range && selection.range.length > 0) {
      // Quill 에디터용 위치 계산
      const quill = selection.quill;
      const range = selection.range;
      const bounds = quill.getBounds(range.index, range.length);
      const containerRect = quill.container.getBoundingClientRect();
      
      // 선택된 텍스트 중앙 위쪽에 툴바 표시
      const centerX = containerRect.left + bounds.left + (bounds.width / 2);
      const topY = containerRect.top + bounds.top - 10; // 선택된 텍스트 위로 10px
      
      console.log('[useToolbarPositioner] Quill position:', { centerX, topY });
      
      virtualRef.current.getBoundingClientRect = () => ({
        x: centerX,
        y: topY,
        width: 0,
        height: 0,
        top: topY,
        left: centerX,
        right: centerX,
        bottom: topY,
      });
    } else if (selection && selection.rect && (selection.prosemirror || selection.text)) {
      // ProseMirror 에디터용 위치 계산 (조건 순서 변경)
      const rect = selection.rect;
      
      // rect가 올바른 형태인지 확인
      if (rect && typeof rect.left === 'number' && typeof rect.top === 'number') {
        const centerX = rect.left + ((rect.width || 0) / 2);
        const topY = rect.top - 10;
        
        console.log('[useToolbarPositioner] ProseMirror position:', { centerX, topY, rect });
        
        virtualRef.current.getBoundingClientRect = () => ({
          x: centerX,
          y: topY,
          width: 0,
          height: 0,
          top: topY,
          left: centerX,
          right: centerX,
          bottom: topY,
        });
      } else {
        console.warn('[useToolbarPositioner] Invalid rect:', rect);
      }
    } else if (selection && selection.element && selection.range) {
      // contenteditable이나 textarea용 위치 계산
      const element = selection.element;
      const range = selection.range;
      
      try {
        // ProseMirror range 객체인지 확인
        if (range && typeof range.getClientRects === 'function') {
          const rects = range.getClientRects();
          if (rects.length > 0) {
            const rect = rects[0];
            const centerX = rect.left + (rect.width / 2);
            const topY = rect.top - 10;
            
            virtualRef.current.getBoundingClientRect = () => ({
              x: centerX,
              y: topY,
              width: 0,
              height: 0,
              top: topY,
              left: centerX,
              right: centerX,
              bottom: topY,
            });
          } else {
            // range에서 rect를 가져올 수 없는 경우 element의 위치 사용
            const elementRect = element.getBoundingClientRect();
            const centerX = elementRect.left + (elementRect.width / 2);
            const topY = elementRect.top - 10;
            
            virtualRef.current.getBoundingClientRect = () => ({
              x: centerX,
              y: topY,
              width: 0,
              height: 0,
              top: topY,
              left: centerX,
              right: centerX,
              bottom: topY,
            });
          }
        } else {
          // ProseMirror range 객체인 경우 (from, to 속성을 가짐)
          const elementRect = element.getBoundingClientRect();
          const centerX = elementRect.left + (elementRect.width / 2);
          const topY = elementRect.top - 10;
          
          virtualRef.current.getBoundingClientRect = () => ({
            x: centerX,
            y: topY,
            width: 0,
            height: 0,
            top: topY,
            left: centerX,
            right: centerX,
            bottom: topY,
          });
        }
      } catch (error) {
        console.error('위치 계산 실패:', error);
      }
    }
  }, [selection]);

  // Popper.js로 툴바 위치 지정
  useEffect(() => {
    // 이전 정리 함수 실행
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    if (isVisible && toolbarRef.current && virtualRef.current) {
      try {
        if (popperInstance) {
          popperInstance.destroy();
        }
        
        const instance = createPopper(virtualRef.current, toolbarRef.current, {
          placement: 'top',
          modifiers: [
            { name: 'offset', options: { offset: [0, 8] } },
            { name: 'preventOverflow', options: { padding: 8 } },
            { name: 'computeStyles', options: { adaptive: false } },
            { 
              name: 'flip', 
              options: { 
                fallbackPlacements: ['bottom', 'top'],
                padding: 8,
                boundary: 'viewport'
              } 
            }
          ],
        });
        
        setPopperInstance(instance);
        
        // 정리 함수 저장
        cleanupRef.current = () => {
          if (instance) {
            instance.destroy();
          }
        };
        
        return cleanupRef.current;
      } catch (error) {
        console.error('useToolbarPositioner: Error creating popper instance:', error);
      }
    }
  }, [isVisible, selection]);
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    toolbarRef,
    virtualRef,
    popperInstance
  };
};