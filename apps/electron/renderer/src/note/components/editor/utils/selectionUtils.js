/**
 * 텍스트 선택 관련 유틸리티 (기존 toolbar utils에서 이동)
 * 
 * @description 텍스트 선택 해제 및 선택 상태 관리 유틸리티 함수들
 * @author AI Assistant
 * @version 1.1.0 (editor로 이동)
 */

/**
 * 현재 텍스트 선택을 해제하는 함수
 * @param {Object} options - 선택 해제 옵션
 * @param {boolean} options.clearQuillSelection - Quill 에디터 선택 해제 여부
 * @param {boolean} options.clearNativeSelection - 네이티브 선택 해제 여부
 * @param {boolean} options.clearProseMirrorSelection - ProseMirror 선택 해제 여부
 * @param {Function} options.onSelectionCleared - 선택 해제 후 콜백 함수
 * @returns {boolean} - 선택 해제 성공 여부
 */
export const clearTextSelection = (options = {}) => {
  // 옵션 검증
  if (options && typeof options !== 'object') {
    console.warn('clearTextSelection: options must be an object');
    return false;
  }
  
  const {
    clearQuillSelection = true,
    clearNativeSelection = true,
    clearProseMirrorSelection = true,
    onSelectionCleared = null
  } = options;
  
  // 콜백 검증
  if (onSelectionCleared && typeof onSelectionCleared !== 'function') {
    console.warn('clearTextSelection: onSelectionCleared must be a function');
    return false;
  }

  let cleared = false;

  try {
    // 네이티브 선택 해제
    if (clearNativeSelection) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        selection.removeAllRanges();
        cleared = true;
      }
    }

    // ProseMirror 에디터 선택 해제
    if (clearProseMirrorSelection) {
      const proseMirrorElements = document.querySelectorAll('.ProseMirror');
      proseMirrorElements.forEach(element => {
        if (element.pmView) {
          const view = element.pmView;
          const { state } = view;
          const tr = state.tr.setSelection(state.selection.constructor.near(state.doc.resolve(0)));
          view.dispatch(tr);
          cleared = true;
        }
      });
    }

    // Quill 에디터 선택 해제 (전역 Quill 인스턴스가 있는 경우)
    if (clearQuillSelection) {
      // 페이지의 모든 Quill 인스턴스 찾기
      const quillContainers = document.querySelectorAll('.ql-container');
      quillContainers.forEach(container => {
        const quillInstance = container.__quill;
        if (quillInstance && quillInstance.getSelection) {
          const currentSelection = quillInstance.getSelection();
          if (currentSelection && currentSelection.length > 0) {
            quillInstance.setSelection(null);
            cleared = true;
          }
        }
      });
    }

    // contenteditable 요소의 선택 해제
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(element => {
      if (element.contains(document.activeElement)) {
        element.blur();
        cleared = true;
      }
    });

    // textarea/input 요소의 선택 해제
    const textInputs = document.querySelectorAll('textarea, input[type="text"]');
    textInputs.forEach(input => {
      if (document.activeElement === input) {
        input.blur();
        input.setSelectionRange(0, 0);
        cleared = true;
      }
    });

    // 선택 해제 후 콜백 실행
    if (cleared && onSelectionCleared) {
      try {
        onSelectionCleared();
      } catch (callbackError) {
        console.error('clearTextSelection: Error in onSelectionCleared callback:', callbackError);
      }
    }

    return cleared;
  } catch (error) {
    console.error('Failed to clear text selection:', error);
    return false;
  }
};

/**
 * 현재 텍스트 선택 상태를 확인하는 함수
 * @returns {Object} - 선택 상태 정보
 */
export const getSelectionState = () => {
  const state = {
    hasSelection: false,
    selectionType: null,
    selectedText: '',
    element: null,
    range: null,
    quillInstance: null,
    proseMirrorView: null
  };

  try {
    // 기본 상태 초기화 및 에러 방지
    if (typeof window === 'undefined' || !window.getSelection) {
      console.warn('getSelectionState: window.getSelection is not available');
      return state;
    }

    // ProseMirror 선택 확인 (우선순위 높음)
    const proseMirrorElements = document.querySelectorAll('.ProseMirror');
    for (const element of proseMirrorElements) {
      if (element.pmView) {
        const view = element.pmView;
        const { selection } = view.state;
        if (!selection.empty) {
          state.hasSelection = true;
          state.selectionType = 'prosemirror';
          state.selectedText = view.state.doc.textBetween(selection.from, selection.to);
          state.element = element;
          state.proseMirrorView = view;
          state.range = { from: selection.from, to: selection.to };
          return state;
        }
      }
    }
    
    // 네이티브 선택 확인
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        state.hasSelection = true;
        state.selectionType = 'native';
        state.selectedText = selection.toString();
        state.range = range;
        state.element = range.commonAncestorContainer;
      }
    }

    // Quill 에디터 선택 확인
    if (!state.hasSelection) {
      const quillContainers = document.querySelectorAll('.ql-container');
      for (const container of quillContainers) {
        const quillInstance = container.__quill;
        if (quillInstance && quillInstance.getSelection) {
          const quillSelection = quillInstance.getSelection();
          if (quillSelection && quillSelection.length > 0) {
            state.hasSelection = true;
            state.selectionType = 'quill';
            state.selectedText = quillInstance.getText(quillSelection.index, quillSelection.length);
            state.quillInstance = quillInstance;
            state.range = quillSelection;
            break;
          }
        }
      }
    }

    // contenteditable 요소 선택 확인
    if (!state.hasSelection) {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.contentEditable === 'true') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (!range.collapsed && activeElement.contains(range.commonAncestorContainer)) {
            state.hasSelection = true;
            state.selectionType = 'contenteditable';
            state.selectedText = selection.toString();
            state.element = activeElement;
            state.range = range;
          }
        }
      }
    }

    // textarea/input 요소 선택 확인
    if (!state.hasSelection) {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        if (start !== end) {
          state.hasSelection = true;
          state.selectionType = 'input';
          state.selectedText = activeElement.value.substring(start, end);
          state.element = activeElement;
          state.range = { start, end };
        }
      }
    }

    return state;
  } catch (error) {
    console.error('Failed to get selection state:', error);
    return state;
  }
};

/**
 * 특정 요소가 편집 가능한 요소인지 확인하는 함수
 * @param {Element} element - 확인할 요소
 * @returns {boolean} - 편집 가능한 요소인지 여부
 */
export const isEditableElement = (element) => {
  if (!element) return false;

  const editableTypes = ['INPUT', 'TEXTAREA'];
  const editableInputTypes = ['text', 'search', 'url', 'tel', 'email', 'password'];

  // textarea나 input 요소인 경우
  if (editableTypes.includes(element.tagName)) {
    if (element.tagName === 'INPUT') {
      return editableInputTypes.includes(element.type);
    }
    return true;
  }

  // contenteditable 요소인 경우
  if (element.contentEditable === 'true') {
    return true;
  }

  // ProseMirror 에디터인 경우
  if (element.classList.contains('ProseMirror') || element.closest('.prosemirror-text-editor')) {
    return true;
  }

  // Quill 에디터 컨테이너인 경우
  if (element.classList.contains('ql-editor') || element.closest('.ql-container')) {
    return true;
  }

  return false;
};

/**
 * 클릭된 요소가 편집 영역 외부인지 확인하는 함수
 * @param {Event} event - 클릭 이벤트
 * @param {Array} excludeSelectors - 제외할 선택자 배열
 * @returns {boolean} - 편집 영역 외부 클릭인지 여부
 */
export const isClickOutsideEditableArea = (event, excludeSelectors = []) => {
  const target = event.target;
  
  // 편집 가능한 요소 내부 클릭인지 확인
  let currentElement = target;
  while (currentElement) {
    if (isEditableElement(currentElement)) {
      return false;
    }
    currentElement = currentElement.parentElement;
  }

  // 제외할 선택자에 해당하는 요소 내부 클릭인지 확인
  for (const selector of excludeSelectors) {
    if (target.closest(selector)) {
      return false;
    }
  }

  return true;
};

/**
 * 두 포인트 사이의 모든 블록 찾기
 * @param {Array} blocks - 블록 배열
 * @param {string} startBlockId - 시작 블록 ID
 * @param {string} endBlockId - 끝 블록 ID
 * @returns {Array} - 선택된 블록 배열
 */
export const getBlocksBetween = (blocks, startBlockId, endBlockId) => {
  const startIndex = blocks.findIndex(block => block.id === startBlockId);
  const endIndex = blocks.findIndex(block => block.id === endBlockId);
  
  if (startIndex === -1 || endIndex === -1) {
    return [];
  }
  
  const minIndex = Math.min(startIndex, endIndex);
  const maxIndex = Math.max(startIndex, endIndex);
  
  return blocks.slice(minIndex, maxIndex + 1);
};

/**
 * DOM 요소에서 블록 ID 찾기
 * @param {Element} element - DOM 요소
 * @returns {string|null} - 블록 ID 또는 null
 */
export const findBlockId = (element) => {
  let current = element;
  while (current && current !== document.body) {
    if (current.hasAttribute && current.hasAttribute('data-block-id')) {
      return current.getAttribute('data-block-id');
    }
    current = current.parentElement;
  }
  return null;
};

/**
 * 전역 선택 해제 이벤트 리스너를 설정하는 함수
 * @param {Function} callback - 선택 해제 시 실행할 콜백 함수
 * @param {Object} options - 옵션 설정
 * @returns {Function} - 이벤트 리스너 제거 함수
 */
export const setupGlobalSelectionClearer = (callback, options = {}) => {
  const {
    excludeSelectors = ['.notion-toolbar', '.ql-toolbar', '.toolbar-menu', '.prosemirror-text-editor'],
    clearOnEscape = true,
    clearOnClickOutside = true
  } = options;

  const handlers = [];

  // 외부 클릭 시 선택 해제
  if (clearOnClickOutside) {
    const handleClick = (event) => {
      if (isClickOutsideEditableArea(event, excludeSelectors)) {
        const selectionState = getSelectionState();
        if (selectionState.hasSelection) {
          const cleared = clearTextSelection();
          if (cleared && callback) {
            callback('click', selectionState);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClick);
    handlers.push(() => document.removeEventListener('mousedown', handleClick));
  }

  // ESC 키 시 선택 해제
  if (clearOnEscape) {
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        const selectionState = getSelectionState();
        if (selectionState.hasSelection) {
          const cleared = clearTextSelection();
          if (cleared && callback) {
            callback('escape', selectionState);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    handlers.push(() => document.removeEventListener('keydown', handleKeydown));
  }

  // 모든 이벤트 리스너를 제거하는 함수 반환
  return () => {
    handlers.forEach(removeHandler => removeHandler());
  };
};