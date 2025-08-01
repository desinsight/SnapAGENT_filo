/**
 * 하이브리드 선택 엔진
 * 
 * @description ProseMirror와 Native Selection 사이의 매끄러운 전환 처리
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * ProseMirror ↔ Native 하이브리드 엔진
 */
export class HybridEngine {
  constructor(selectionManager) {
    this.manager = selectionManager;
    this.isInitialized = false;
    this.transitionState = null;
    this.isTransitioning = false;
  }

  /**
   * 엔진 초기화
   * @param {Object} context - 초기화 컨텍스트
   */
  async initialize(context = {}) {
    if (this.isInitialized) return;

    this.manager.log('[HybridEngine] Initializing', context);
    
    // 전환 상태 설정
    if (context.transition) {
      this.setupTransition(context.transition);
    }
    
    this.isInitialized = true;
  }

  /**
   * 선택 이벤트 처리
   * @param {string} eventType - 이벤트 타입
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handle(eventType, eventData) {
    try {
      this.manager.log(`[HybridEngine] Handling ${eventType}`, eventData);

      switch (eventType) {
        case 'transition_start':
          return this.handleTransitionStart(eventData);
        case 'transition_progress':
          return this.handleTransitionProgress(eventData);
        case 'transition_end':
          return this.handleTransitionEnd(eventData);
        case 'mousemove':
          return this.handleMouseMove(eventData);
        case 'mouseup':
          return this.handleMouseUp(eventData);
        case 'keydown':
          return this.handleKeyDown(eventData);
        default:
          // 전환 중이면 적절한 엔진으로 위임
          return this.delegateToEngine(eventType, eventData);
      }
    } catch (error) {
      console.error('[HybridEngine] Error handling event:', error);
      return null;
    }
  }

  /**
   * 전환 시작 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleTransitionStart(eventData) {
    const { from, to, context } = eventData;
    
    this.manager.log(`[HybridEngine] Starting transition: ${from} → ${to}`, context);
    
    this.isTransitioning = true;
    this.transitionState = {
      from,
      to,
      context,
      startTime: Date.now(),
      phase: 'starting'
    };

    // 전환 시작 처리
    if (from === 'prosemirror' && to === 'native') {
      return this.startProseMirrorToNativeTransition(context);
    } else if (from === 'native' && to === 'prosemirror') {
      return this.startNativeToProseMirrorTransition(context);
    }

    return null;
  }

  /**
   * 전환 진행 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleTransitionProgress(eventData) {
    if (!this.isTransitioning || !this.transitionState) {
      return null;
    }

    this.transitionState.phase = 'progressing';
    
    // 전환 중 선택 동기화
    return this.synchronizeSelection(eventData);
  }

  /**
   * 전환 종료 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleTransitionEnd(eventData) {
    if (!this.isTransitioning || !this.transitionState) {
      return null;
    }

    const { to } = this.transitionState;
    
    this.manager.log(`[HybridEngine] Transition completed to: ${to}`);
    
    // 최종 엔진으로 전환
    const result = {
      type: 'transition_completed',
      engine: 'hybrid',
      targetEngine: to,
      finalSelection: eventData.selection
    };

    // 전환 상태 정리
    this.isTransitioning = false;
    this.transitionState = null;

    return result;
  }

  /**
   * 마우스 이동 처리 (전환 중)
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleMouseMove(eventData) {
    if (!this.isTransitioning) {
      return this.delegateToEngine('mousemove', eventData);
    }

    // 전환 중 마우스 이동은 연속적인 선택으로 처리
    return this.handleTransitionProgress({
      type: 'mousemove',
      ...eventData
    });
  }

  /**
   * 마우스 업 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleMouseUp(eventData) {
    if (this.isTransitioning) {
      return this.handleTransitionEnd(eventData);
    }

    return this.delegateToEngine('mouseup', eventData);
  }

  /**
   * 키보드 이벤트 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleKeyDown(eventData) {
    // ESC 키로 전환 취소
    if (eventData.key === 'Escape' && this.isTransitioning) {
      return this.cancelTransition();
    }

    return this.delegateToEngine('keydown', eventData);
  }

  /**
   * ProseMirror → Native 전환 시작
   * @param {Object} context - 전환 컨텍스트
   * @returns {Object} - 전환 결과
   */
  startProseMirrorToNativeTransition(context) {
    const { initialSelection, eventData } = context;
    
    try {
      // ProseMirror 선택 정보를 네이티브로 변환
      const { view, startPos, blockId } = initialSelection;
      
      // ProseMirror 위치를 DOM 좌표로 변환
      const startCoords = view.coordsAtPos(startPos);
      
      // 네이티브 선택 시작점 설정
      const startRange = document.caretRangeFromPoint(startCoords.left, startCoords.top);
      if (!startRange) {
        throw new Error('Could not create start range');
      }

      // 현재 마우스 위치까지의 범위 생성
      const endRange = document.caretRangeFromPoint(eventData.clientX, eventData.clientY);
      if (!endRange) {
        throw new Error('Could not create end range');
      }

      // 네이티브 선택 생성
      const selection = window.getSelection();
      selection.removeAllRanges();
      
      const range = document.createRange();
      range.setStart(startRange.startContainer, startRange.startOffset);
      range.setEnd(endRange.startContainer, endRange.startOffset);
      selection.addRange(range);

      return {
        type: 'transition_started',
        engine: 'hybrid',
        from: 'prosemirror',
        to: 'native',
        initialSelection,
        nativeRange: range,
        selectedText: selection.toString()
      };
    } catch (error) {
      this.manager.log('[HybridEngine] Error in ProseMirror to Native transition:', error);
      this.cancelTransition();
      return null;
    }
  }

  /**
   * Native → ProseMirror 전환 시작
   * @param {Object} context - 전환 컨텍스트
   * @returns {Object} - 전환 결과
   */
  startNativeToProseMirrorTransition(context) {
    const { range, blockId } = context;
    
    try {
      // 대상 블록의 ProseMirror 뷰 찾기
      const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
      if (!blockElement) {
        throw new Error(`Block not found: ${blockId}`);
      }

      const proseMirrorElement = blockElement.querySelector('.ProseMirror');
      if (!proseMirrorElement || !proseMirrorElement.pmView) {
        throw new Error(`ProseMirror view not found in block: ${blockId}`);
      }

      const view = proseMirrorElement.pmView;
      
      // DOM 범위를 ProseMirror 위치로 변환
      const startPos = this.domOffsetToProseMirrorPos(view, range.startContainer, range.startOffset);
      const endPos = this.domOffsetToProseMirrorPos(view, range.endContainer, range.endOffset);
      
      if (startPos === null || endPos === null) {
        throw new Error('Could not convert DOM range to ProseMirror positions');
      }

      // ProseMirror 선택 설정
      const { state } = view;
      const proseMirrorSelection = state.selection.constructor.create(state.doc, startPos, endPos);
      const tr = state.tr.setSelection(proseMirrorSelection);
      view.dispatch(tr);

      return {
        type: 'transition_started',
        engine: 'hybrid',
        from: 'native',
        to: 'prosemirror',
        blockId,
        view,
        startPos,
        endPos,
        selectedText: state.doc.textBetween(startPos, endPos)
      };
    } catch (error) {
      this.manager.log('[HybridEngine] Error in Native to ProseMirror transition:', error);
      this.cancelTransition();
      return null;
    }
  }

  /**
   * 선택 동기화 (전환 중)
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 동기화 결과
   */
  synchronizeSelection(eventData) {
    if (!this.transitionState) return null;

    const { from, to } = this.transitionState;
    
    // 양방향 동기화
    if (from === 'prosemirror' && to === 'native') {
      return this.syncProseMirrorToNative(eventData);
    } else if (from === 'native' && to === 'prosemirror') {
      return this.syncNativeToProseMirror(eventData);
    }

    return null;
  }

  /**
   * ProseMirror → Native 동기화
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 동기화 결과
   */
  syncProseMirrorToNative(eventData) {
    // 실시간 동기화 로직
    // 마우스 움직임에 따라 네이티브 선택 업데이트
    return this.updateNativeSelectionFromMouse(eventData);
  }

  /**
   * Native → ProseMirror 동기화
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 동기화 결과
   */
  syncNativeToProseMirror(eventData) {
    // 네이티브 선택을 ProseMirror 선택으로 실시간 변환
    return this.updateProseMirrorSelectionFromNative(eventData);
  }

  /**
   * 마우스 위치로부터 네이티브 선택 업데이트
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 업데이트 결과
   */
  updateNativeSelectionFromMouse(eventData) {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const currentRange = selection.getRangeAt(0);
      const newEndRange = document.caretRangeFromPoint(eventData.clientX, eventData.clientY);
      
      if (newEndRange) {
        currentRange.setEnd(newEndRange.startContainer, newEndRange.startOffset);
        
        return {
          type: 'selection_updated',
          engine: 'hybrid',
          selectedText: selection.toString(),
          range: currentRange
        };
      }
    } catch (error) {
      this.manager.log('[HybridEngine] Error updating native selection:', error);
    }
    return null;
  }

  /**
   * 네이티브 선택으로부터 ProseMirror 선택 업데이트
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 업데이트 결과
   */
  updateProseMirrorSelectionFromNative(eventData) {
    // TODO: 구현 필요
    return null;
  }

  /**
   * DOM 오프셋을 ProseMirror 위치로 변환
   * @param {Object} view - ProseMirror view
   * @param {Node} container - DOM 컨테이너
   * @param {number} offset - DOM 오프셋
   * @returns {number|null} - ProseMirror 위치
   */
  domOffsetToProseMirrorPos(view, container, offset) {
    try {
      return view.posAtDOM(container, offset);
    } catch (error) {
      this.manager.log('[HybridEngine] Error converting DOM offset to ProseMirror pos:', error);
      return null;
    }
  }

  /**
   * 전환 설정
   * @param {Object} transition - 전환 정보
   */
  setupTransition(transition) {
    this.transitionState = {
      ...transition,
      startTime: Date.now(),
      phase: 'setup'
    };
  }

  /**
   * 전환 취소
   * @returns {Object} - 취소 결과
   */
  cancelTransition() {
    this.manager.log('[HybridEngine] Canceling transition');
    
    const result = {
      type: 'transition_canceled',
      engine: 'hybrid',
      reason: 'user_canceled'
    };

    this.isTransitioning = false;
    this.transitionState = null;

    return result;
  }

  /**
   * 적절한 엔진으로 이벤트 위임
   * @param {string} eventType - 이벤트 타입
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 처리 결과
   */
  delegateToEngine(eventType, eventData) {
    if (!this.transitionState) return null;

    const targetEngine = this.transitionState.to;
    
    if (targetEngine === 'prosemirror') {
      return this.manager.proseMirrorEngine.handle(eventType, eventData);
    } else if (targetEngine === 'native') {
      return this.manager.nativeEngine.handle(eventType, eventData);
    }

    return null;
  }

  /**
   * 현재 상태 가져오기
   * @returns {Object} - 엔진 상태
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isTransitioning: this.isTransitioning,
      transitionState: this.transitionState
    };
  }

  /**
   * 선택 해제
   */
  clear() {
    this.manager.log('[HybridEngine] Clearing selection');
    
    if (this.isTransitioning) {
      this.cancelTransition();
    }
  }

  /**
   * 엔진 정리
   */
  cleanup() {
    this.manager.log('[HybridEngine] Cleaning up');
    this.clear();
  }

  /**
   * 엔진 소멸
   */
  destroy() {
    this.manager.log('[HybridEngine] Destroying');
    
    this.clear();
    this.isInitialized = false;
  }
}