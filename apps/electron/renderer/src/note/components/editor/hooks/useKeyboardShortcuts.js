/**
 * 키보드 단축키 훅
 * 
 * @description 블록 에디터에서 사용하는 키보드 단축키들을 관리
 * @author AI Assistant
 * @version 1.0.0
 */

import { useEffect } from 'react';

export const useKeyboardShortcuts = ({
  onUndo,
  onRedo,
  onSave,
  onAddBlock,
  onDeleteBlock,
  readOnly = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 읽기 전용 모드에서는 편집 관련 단축키 비활성화
      if (readOnly && ['z', 'y', 's', 'Enter', 'Delete'].includes(e.key.toLowerCase())) {
        return;
      }

      // Ctrl/Cmd 키 조합
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              onRedo?.();
            } else {
              onUndo?.();
            }
            break;
          
          case 'y':
            e.preventDefault();
            onRedo?.();
            break;
          
          case 's':
            e.preventDefault();
            onSave?.();
            break;
          
          case 'enter':
            e.preventDefault();
            onAddBlock?.();
            break;
          
          case 'backspace':
          case 'delete':
            e.preventDefault();
            onDeleteBlock?.();
            break;
          
          default:
            break;
        }
      }
      
      // 단일 키 조합
      else {
        switch (e.key) {
          case 'Delete':
            // 블록이 선택된 상태에서 Delete 키
            if (document.activeElement?.tagName !== 'INPUT' && 
                document.activeElement?.tagName !== 'TEXTAREA' &&
                !document.activeElement?.contentEditable) {
              e.preventDefault();
              onDeleteBlock?.();
            }
            break;
          
          default:
            break;
        }
      }
    };

    // 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown);
    
    // 정리 함수
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onUndo, onRedo, onSave, onAddBlock, onDeleteBlock, readOnly]);
};