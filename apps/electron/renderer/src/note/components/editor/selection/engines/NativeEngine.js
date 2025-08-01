/**
 * Native Browser Selection 엔진
 * 
 * @description 크로스 블록 선택과 자연스러운 브라우저 동작 처리
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * 브라우저 네이티브 선택 엔진
 */
export class NativeEngine {
  constructor(selectionManager) {
    this.manager = selectionManager;
    this.isInitialized = false;
    this.currentSelection = null;
    this.isSelecting = false;
    this.selectionStart = null;
    this.eventListeners = [];
  }

  /**
   * 엔진 초기화
   * @param {Object} context - 초기화 컨텍스트
   */
  async initialize(context = {}) {
    this.manager.log('[NativeEngine] Initializing', context);
    
    // 컨텍스트에서 ProseMirror 전환 정보 확인
    if (context.startingFrom === 'prosemirror' && context.initialSelection) {
      const result = this.initializeFromProseMirror(context);
      if (result) {
        this.manager.log('[NativeEngine] Successfully initialized from ProseMirror');
      }
    }
    
    this.setupEventListeners();
    this.isInitialized = true;
    
    return this.currentSelection;
  }

  /**
   * ProseMirror에서 전환된 경우 초기화
   * @param {Object} context - 전환 컨텍스트
   */
  initializeFromProseMirror(context) {
    const { initialSelection, eventData } = context;
    
    this.manager.log('[NativeEngine] Initializing from ProseMirror', { initialSelection, eventData });
    
    // ProseMirror 선택을 네이티브 선택으로 변환
    const result = this.convertProseMirrorToNative(initialSelection, eventData);
    return result;
  }

  /**
   * ProseMirror 선택을 네이티브 선택으로 변환
   * @param {Object} proseMirrorSelection - ProseMirror 선택 정보
   * @param {Object} eventData - 이벤트 데이터
   */
  convertProseMirrorToNative(proseMirrorSelection, eventData) {
    try {
      const { view, blockId, startPos, endPos } = proseMirrorSelection;
      
      this.manager.log('[NativeEngine] Converting ProseMirror selection to native', {
        blockId,
        startPos,
        endPos,
        eventType: eventData.type
      });
      
      // ProseMirror 선택의 시작점을 DOM 좌표로 변환
      const startCoords = view.coordsAtPos(startPos);
      const endCoords = eventData.clientX && eventData.clientY 
        ? { left: eventData.clientX, top: eventData.clientY }
        : view.coordsAtPos(endPos);
      
      // 기존 선택 제거
      const selection = window.getSelection();
      selection.removeAllRanges();
      
      // 시작점과 현재 마우스 위치에서 DOM Range 생성 (브라우저 호환성 개선)
      const startRange = document.caretRangeFromPoint ? 
        document.caretRangeFromPoint(startCoords.left, startCoords.top) :
        document.caretPositionFromPoint ? 
        (() => {
          const pos = document.caretPositionFromPoint(startCoords.left, startCoords.top);
          if (pos) {
            const range = document.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
            return range;
          }
          return null;
        })() : null;
        
      const endRange = document.caretRangeFromPoint ? 
        document.caretRangeFromPoint(endCoords.left, endCoords.top) :
        document.caretPositionFromPoint ? 
        (() => {
          const pos = document.caretPositionFromPoint(endCoords.left, endCoords.top);
          if (pos) {
            const range = document.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
            return range;
          }
          return null;
        })() : null;
      
      if (startRange && endRange) {
        const range = document.createRange();
        
        // 텍스트 선택 방향 고려 (역방향 선택 지원)
        const comparison = startRange.compareBoundaryPoints(Range.START_TO_START, endRange);
        
        if (comparison <= 0) {
          // 정방향 선택
          range.setStart(startRange.startContainer, startRange.startOffset);
          range.setEnd(endRange.startContainer, endRange.startOffset);
        } else {
          // 역방향 선택
          range.setStart(endRange.startContainer, endRange.startOffset);
          range.setEnd(startRange.startContainer, startRange.startOffset);
        }
        
        selection.addRange(range);
        
        // 선택 상태 업데이트
        const endBlockId = this.manager.findBlockId(endRange.startContainer);
        
        this.currentSelection = {
          type: 'text',
          engine: 'native',
          startBlockId: blockId,
          endBlockId: endBlockId,
          range,
          selectedText: selection.toString(),
          crossBlock: blockId !== endBlockId,
          proseMirrorOrigin: true
        };
        
        this.manager.log('[NativeEngine] ✅ Native cross-block selection created successfully!', {
          startBlock: blockId,
          endBlock: endBlockId,
          crossBlock: this.currentSelection.crossBlock,
          selectedLength: this.currentSelection.selectedText.length,
          selectedText: this.currentSelection.selectedText.substring(0, 50) + (this.currentSelection.selectedText.length > 50 ? '...' : '')
        });
        
        return this.currentSelection;
      }
    } catch (error) {
      this.manager.log('[NativeEngine] Error converting ProseMirror selection:', error);
    }
    
    return null;
  }

  /**
   * 선택 이벤트 처리
   * @param {string} eventType - 이벤트 타입
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handle(eventType, eventData) {
    try {
      this.manager.log(`[NativeEngine] Handling ${eventType}`, eventData);

      switch (eventType) {
        case 'mousedown':
          return this.handleMouseDown(eventData);
        case 'mousemove':
          return this.handleMouseMove(eventData);
        case 'mouseup':
          return this.handleMouseUp(eventData);
        case 'selectionchange':
          return this.handleSelectionChange(eventData);
        case 'keydown':
          return this.handleKeyDown(eventData);
        case 'dragstart':
          return this.handleDragStart(eventData);
        case 'dragend':
          return this.handleDragEnd(eventData);
        default:
          return null;
      }
    } catch (error) {
      console.error('[NativeEngine] Error handling event:', error);
      return null;
    }
  }

  /**
   * 마우스 다운 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleMouseDown(eventData) {
    // 편집 가능한 요소 내부가 아닌 경우에만 처리
    if (this.isInsideEditableArea(eventData.target)) {
      return null;
    }

    this.isSelecting = true;
    this.selectionStart = {
      x: eventData.clientX,
      y: eventData.clientY,
      blockId: this.manager.findBlockId(eventData.target),
      target: eventData.target
    };

    // 기존 선택 해제
    this.clearNativeSelection();

    return {
      type: 'selection_start',
      engine: 'native',
      startPoint: this.selectionStart
    };
  }

  /**
   * 마우스 이동 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleMouseMove(eventData) {
    if (!this.isSelecting || !this.selectionStart) {
      return null;
    }

    const currentBlockId = this.manager.findBlockId(eventData.target);
    const distance = Math.sqrt(
      Math.pow(eventData.clientX - this.selectionStart.x, 2) +
      Math.pow(eventData.clientY - this.selectionStart.y, 2)
    );

    // 최소 거리 이동 후 선택 시작
    if (distance < 5) {
      return null;
    }

    // 크로스 블록 선택 생성
    const selection = this.createCrossBlockSelection(
      this.selectionStart,
      { x: eventData.clientX, y: eventData.clientY, blockId: currentBlockId }
    );

    if (selection) {
      this.currentSelection = selection;
      return selection;
    }

    return null;
  }

  /**
   * 마우스 업 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleMouseUp(eventData) {
    if (!this.isSelecting) {
      return null;
    }

    this.isSelecting = false;
    const result = this.currentSelection;
    
    // 선택이 없거나 너무 작으면 해제
    if (!result || !this.isValidSelection(result)) {
      this.clearNativeSelection();
      this.currentSelection = null;
      return null;
    }

    return result;
  }

  /**
   * 선택 변경 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleSelectionChange(eventData) {
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (this.currentSelection) {
        this.currentSelection = null;
        return { type: 'selection_cleared', engine: 'native' };
      }
      return null;
    }

    const range = selection.getRangeAt(0);
    const startBlockId = this.manager.findBlockId(range.startContainer);
    const endBlockId = this.manager.findBlockId(range.endContainer);

    // 단일 블록 내 선택은 ProseMirror로 위임
    if (startBlockId && endBlockId && startBlockId === endBlockId) {
      return {
        switchToEngine: 'prosemirror',
        context: {
          startingFrom: 'native',
          blockId: startBlockId,
          range
        }
      };
    }

    // 크로스 블록 선택 처리
    this.currentSelection = {
      type: 'text',
      engine: 'native',
      startBlockId,
      endBlockId,
      range,
      selectedText: selection.toString(),
      crossBlock: startBlockId !== endBlockId,
      selectedBlocks: this.getSelectedBlocks(startBlockId, endBlockId)
    };

    return this.currentSelection;
  }

  /**
   * 키보드 이벤트 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleKeyDown(eventData) {
    const { key, ctrlKey, metaKey, shiftKey } = eventData;

    // Ctrl/Cmd + A: 전체 선택
    if ((ctrlKey || metaKey) && key.toLowerCase() === 'a') {
      return this.handleSelectAll();
    }

    // Delete/Backspace: 선택된 내용 삭제
    if ((key === 'Delete' || key === 'Backspace') && this.currentSelection) {
      return this.handleDeleteSelection();
    }

    // Shift + 방향키: 선택 확장
    if (shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return this.handleSelectionExtension(eventData);
    }

    return null;
  }

  /**
   * 드래그 시작 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleDragStart(eventData) {
    if (this.currentSelection && this.currentSelection.selectedText) {
      return {
        type: 'drag_start',
        engine: 'native',
        dragData: this.currentSelection.selectedText,
        selection: this.currentSelection
      };
    }
    return null;
  }

  /**
   * 드래그 종료 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleDragEnd(eventData) {
    return {
      type: 'drag_end',
      engine: 'native'
    };
  }

  /**
   * 크로스 블록 선택 생성
   * @param {Object} startPoint - 시작점
   * @param {Object} endPoint - 끝점
   * @returns {Object|null} - 선택 결과
   */
  createCrossBlockSelection(startPoint, endPoint) {
    try {
      const startRange = document.caretRangeFromPoint(startPoint.x, startPoint.y);
      const endRange = document.caretRangeFromPoint(endPoint.x, endPoint.y);

      if (!startRange || !endRange) return null;

      const selection = window.getSelection();
      selection.removeAllRanges();

      const range = document.createRange();
      range.setStart(startRange.startContainer, startRange.startOffset);
      range.setEnd(endRange.startContainer, endRange.startOffset);
      
      selection.addRange(range);

      return {
        type: 'text',
        engine: 'native',
        startBlockId: startPoint.blockId,
        endBlockId: endPoint.blockId,
        range,
        selectedText: selection.toString(),
        crossBlock: startPoint.blockId !== endPoint.blockId,
        selectedBlocks: this.getSelectedBlocks(startPoint.blockId, endPoint.blockId)
      };
    } catch (error) {
      this.manager.log('[NativeEngine] Error creating cross-block selection:', error);
      return null;
    }
  }

  /**
   * 선택된 블록 ID들 가져오기
   * @param {string} startBlockId - 시작 블록 ID
   * @param {string} endBlockId - 끝 블록 ID
   * @returns {Array} - 선택된 블록 ID 배열
   */
  getSelectedBlocks(startBlockId, endBlockId) {
    if (!startBlockId || !endBlockId) return [];

    // 모든 블록 요소 찾기
    const allBlocks = Array.from(document.querySelectorAll('[data-block-id]'));
    const startIndex = allBlocks.findIndex(block => block.getAttribute('data-block-id') === startBlockId);
    const endIndex = allBlocks.findIndex(block => block.getAttribute('data-block-id') === endBlockId);

    if (startIndex === -1 || endIndex === -1) return [];

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    return allBlocks
      .slice(minIndex, maxIndex + 1)
      .map(block => block.getAttribute('data-block-id'));
  }

  /**
   * 전체 선택 처리
   * @returns {Object} - 선택 결과
   */
  handleSelectAll() {
    const allBlocks = Array.from(document.querySelectorAll('[data-block-id]'));
    if (allBlocks.length === 0) return null;

    // 첫 번째와 마지막 블록 선택
    const firstBlock = allBlocks[0];
    const lastBlock = allBlocks[allBlocks.length - 1];

    try {
      const selection = window.getSelection();
      selection.removeAllRanges();

      const range = document.createRange();
      range.setStartBefore(firstBlock);
      range.setEndAfter(lastBlock);
      selection.addRange(range);

      this.currentSelection = {
        type: 'blocks',
        engine: 'native',
        startBlockId: firstBlock.getAttribute('data-block-id'),
        endBlockId: lastBlock.getAttribute('data-block-id'),
        selectedBlocks: allBlocks.map(block => block.getAttribute('data-block-id')),
        selectedText: selection.toString(),
        selectAll: true
      };

      return this.currentSelection;
    } catch (error) {
      this.manager.log('[NativeEngine] Error in select all:', error);
      return null;
    }
  }

  /**
   * 선택된 내용 삭제 처리
   * @returns {Object} - 삭제 결과
   */
  handleDeleteSelection() {
    if (!this.currentSelection) return null;

    return {
      type: 'delete_selection',
      engine: 'native',
      selection: this.currentSelection
    };
  }

  /**
   * 선택 확장 처리 (Shift + 방향키)
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleSelectionExtension(eventData) {
    // TODO: 키보드 기반 선택 확장 구현
    return null;
  }

  /**
   * 편집 가능한 영역 내부인지 확인
   * @param {Element} target - 대상 요소
   * @returns {boolean} - 편집 영역 내부 여부
   */
  isInsideEditableArea(target) {
    return target.closest('[contenteditable="true"]') ||
           target.closest('.ProseMirror') ||
           target.closest('input') ||
           target.closest('textarea');
  }

  /**
   * 유효한 선택인지 확인
   * @param {Object} selection - 선택 객체
   * @returns {boolean} - 유효성 여부
   */
  isValidSelection(selection) {
    return selection && 
           selection.selectedText && 
           selection.selectedText.trim().length > 0;
  }

  /**
   * 네이티브 선택 해제
   */
  clearNativeSelection() {
    try {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    } catch (error) {
      this.manager.log('[NativeEngine] Error clearing native selection:', error);
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 크로스 블록 선택에 필요한 최소한의 리스너만 활성화
    this.manager.log('[NativeEngine] Setting up limited listeners for cross-block selection');
    
    // Native 엔진이 초기화될 때는 항상 리스너 설정 (조건 제거)
    const listeners = [
      ['mousemove', this.handleDocumentMouseMove.bind(this)],
      ['mouseup', this.handleDocumentMouseUp.bind(this)]
    ];

    listeners.forEach(([event, handler]) => {
      document.addEventListener(event, handler);
      this.eventListeners.push([event, handler]);
    });
    
    this.manager.log('[NativeEngine] Cross-block selection listeners activated', {
      currentEngine: this.manager.currentEngine,
      listenersCount: this.eventListeners.length
    });
  }

  /**
   * 문서 마우스 다운 핸들러
   */
  handleDocumentMouseDown(event) {
    this.manager.handleSelection('mousedown', {
      target: event.target,
      clientX: event.clientX,
      clientY: event.clientY,
      button: event.button
    });
  }

  /**
   * 문서 마우스 이동 핸들러
   */
  handleDocumentMouseMove(event) {
    if (this.isSelecting) {
      this.manager.handleSelection('mousemove', {
        target: event.target,
        clientX: event.clientX,
        clientY: event.clientY
      });
    }
  }

  /**
   * 문서 마우스 업 핸들러
   */
  handleDocumentMouseUp(event) {
    this.manager.log('[NativeEngine] Mouse up - ending cross-block selection');
    
    if (this.isSelecting) {
      this.manager.handleSelection('mouseup', {
        target: event.target,
        clientX: event.clientX,
        clientY: event.clientY
      });
      this.isSelecting = false;
    }
    
    // 크로스 블록 선택 완료 후 ProseMirror 엔진으로 복귀 대기
    setTimeout(() => {
      if (this.currentSelection && this.currentSelection.crossBlock) {
        this.manager.log('[NativeEngine] Cross-block selection completed, ready to return to ProseMirror engine');
        // 향후 ProseMirror로 자동 복귀 로직 추가 가능
      }
    }, 100);
  }

  /**
   * 문서 선택 변경 핸들러
   */
  handleDocumentSelectionChange() {
    this.manager.handleSelection('selectionchange', {
      selection: window.getSelection()
    });
  }

  /**
   * 문서 키보드 핸들러
   */
  handleDocumentKeyDown(event) {
    this.manager.handleSelection('keydown', {
      key: event.key,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      target: event.target
    });
  }

  /**
   * 현재 상태 가져오기
   * @returns {Object} - 엔진 상태
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isSelecting: this.isSelecting,
      currentSelection: this.currentSelection,
      selectionStart: this.selectionStart
    };
  }

  /**
   * 선택 해제
   */
  clear() {
    this.manager.log('[NativeEngine] Clearing selection');
    
    this.clearNativeSelection();
    this.currentSelection = null;
    this.isSelecting = false;
    this.selectionStart = null;
  }

  /**
   * 엔진 정리
   */
  cleanup() {
    this.manager.log('[NativeEngine] Cleaning up');
    this.clear();
  }

  /**
   * 엔진 소멸
   */
  destroy() {
    this.manager.log('[NativeEngine] Destroying');
    
    // 활성화된 이벤트 리스너 제거
    this.eventListeners.forEach(([event, handler]) => {
      document.removeEventListener(event, handler);
    });
    this.eventListeners = [];
    
    // 상태 초기화
    this.clear();
    this.isInitialized = false;
  }
}