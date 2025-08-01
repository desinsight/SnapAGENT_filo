/**
 * ProseMirror 선택 엔진
 * 
 * @description 블록 내부 텍스트 편집에 특화된 안정적인 선택 처리
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * ProseMirror 기반 선택 엔진
 */
export class ProseMirrorEngine {
  constructor(selectionManager) {
    this.manager = selectionManager;
    this.activeViews = new Map(); // blockId -> ProseMirror view
    this.isInitialized = false;
    this.currentSelection = null;
  }

  /**
   * 엔진 초기화
   * @param {Object} context - 초기화 컨텍스트
   */
  async initialize(context = {}) {
    if (this.isInitialized) return;

    this.manager.log('[ProseMirrorEngine] Initializing');
    
    // 모든 ProseMirror 인스턴스 찾아서 등록
    this.discoverProseMirrorViews();
    
    // ProseMirror 이벤트 리스너 설정
    this.setupEventListeners();
    
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
      this.manager.log(`[ProseMirrorEngine] Handling ${eventType}`, eventData);

      switch (eventType) {
        case 'selectionstart':
          return this.handleSelectionStart(eventData);
        case 'selectionchange':
          return this.handleSelectionChange(eventData);
        case 'selectionend':
          return this.handleSelectionEnd(eventData);
        case 'mousedown':
          return this.handleMouseDown(eventData);
        case 'mousemove':
          return this.handleMouseMove(eventData);
        case 'mouseup':
          return this.handleMouseUp(eventData);
        case 'keydown':
          return this.handleKeyDown(eventData);
        default:
          this.manager.log(`[ProseMirrorEngine] Unknown event type: ${eventType}`);
          return null;
      }
    } catch (error) {
      console.error('[ProseMirrorEngine] Error handling event:', error);
      return null;
    }
  }

  /**
   * 선택 시작 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleSelectionStart(eventData) {
    const blockId = this.manager.findBlockId(eventData.target);
    if (!blockId) return null;

    const view = this.activeViews.get(blockId);
    if (!view) return null;

    // ProseMirror 내부 좌표로 변환
    const pos = this.getPositionFromCoords(view, eventData.clientX, eventData.clientY);
    if (pos === null) return null;

    this.currentSelection = {
      type: 'text',
      engine: 'prosemirror',
      blockId,
      startPos: pos,
      endPos: pos,
      view
    };

    return this.currentSelection;
  }

  /**
   * 선택 변경 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleSelectionChange(eventData) {
    if (!this.currentSelection) return null;

    const { view } = this.currentSelection;
    const { selection } = view.state;

    // ProseMirror 선택이 비어있으면 처리하지 않음
    if (selection.empty) {
      return null;
    }

    // 크로스 블록 선택 감지
    if (this.detectCrossBlockExtension(eventData)) {
      // Native 엔진으로 전환 신호
      return {
        switchToEngine: 'native',
        context: {
          startingFrom: 'prosemirror',
          initialSelection: this.currentSelection,
          eventData
        }
      };
    }

    // ProseMirror 내부 선택 업데이트
    this.currentSelection = {
      ...this.currentSelection,
      startPos: selection.from,
      endPos: selection.to,
      selectedText: view.state.doc.textBetween(selection.from, selection.to),
      range: { from: selection.from, to: selection.to }
    };

    return this.currentSelection;
  }

  /**
   * 선택 종료 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleSelectionEnd(eventData) {
    const result = this.currentSelection;
    this.currentSelection = null;
    return result;
  }

  /**
   * 마우스 다운 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleMouseDown(eventData) {
    return this.handleSelectionStart(eventData);
  }

  /**
   * 마우스 이동 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleMouseMove(eventData) {
    if (!this.currentSelection) return null;

    // 현재 블록 밖으로 마우스가 나갔는지 확인
    const currentBlockId = this.manager.findBlockId(eventData.target);
    if (currentBlockId !== this.currentSelection.blockId) {
      // 크로스 블록 확장 감지
      return {
        switchToEngine: 'native',
        context: {
          startingFrom: 'prosemirror',
          initialSelection: this.currentSelection,
          eventData
        }
      };
    }

    return this.handleSelectionChange(eventData);
  }

  /**
   * 마우스 업 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleMouseUp(eventData) {
    return this.handleSelectionEnd(eventData);
  }

  /**
   * 키보드 이벤트 처리
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleKeyDown(eventData) {
    const { key, shiftKey, ctrlKey, metaKey } = eventData;

    // Shift + 방향키로 선택 확장
    if (shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return this.handleSelectionExtension(eventData);
    }

    // Ctrl/Cmd + A로 전체 선택
    if ((ctrlKey || metaKey) && key.toLowerCase() === 'a') {
      return this.handleSelectAll(eventData);
    }

    return null;
  }

  /**
   * 좌표에서 ProseMirror 위치 찾기
   * @param {Object} view - ProseMirror view
   * @param {number} clientX - X 좌표
   * @param {number} clientY - Y 좌표
   * @returns {number|null} - ProseMirror 위치
   */
  getPositionFromCoords(view, clientX, clientY) {
    try {
      const pos = view.posAtCoords({ left: clientX, top: clientY });
      return pos ? pos.pos : null;
    } catch (error) {
      this.manager.log('[ProseMirrorEngine] Error getting position from coords:', error);
      return null;
    }
  }

  /**
   * 크로스 블록 확장 감지
   * @param {Object} eventData - 이벤트 데이터
   * @returns {boolean} - 크로스 블록 확장 여부
   */
  detectCrossBlockExtension(eventData) {
    if (!this.currentSelection) return false;

    const currentBlockId = this.manager.findBlockId(eventData.target);
    return currentBlockId && currentBlockId !== this.currentSelection.blockId;
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
   * 전체 선택 처리 (Ctrl+A)
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object|null} - 선택 결과
   */
  handleSelectAll(eventData) {
    const blockId = this.manager.findBlockId(eventData.target);
    if (!blockId) return null;

    const view = this.activeViews.get(blockId);
    if (!view) return null;

    // 전체 문서 선택
    const { state } = view;
    const tr = state.tr.setSelection(state.selection.constructor.create(state.doc, 0, state.doc.content.size));
    view.dispatch(tr);

    return {
      type: 'text',
      engine: 'prosemirror',
      blockId,
      startPos: 0,
      endPos: state.doc.content.size,
      selectedText: state.doc.textContent,
      view
    };
  }

  /**
   * ProseMirror 뷰들 발견 및 등록
   */
  discoverProseMirrorViews() {
    const proseMirrorElements = document.querySelectorAll('.ProseMirror');
    proseMirrorElements.forEach(element => {
      if (element.pmView) {
        const blockId = this.manager.findBlockId(element);
        if (blockId) {
          this.activeViews.set(blockId, element.pmView);
          this.manager.log(`[ProseMirrorEngine] Registered view for block: ${blockId}`);
        }
      }
    });
  }

  /**
   * ProseMirror 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 전역 선택 변경 감지 - 텍스트 입력 간섭을 방지하기 위해 비활성화
    // document.addEventListener('selectionchange', this.handleDocumentSelectionChange.bind(this));
    this.manager.log('[ProseMirrorEngine] Global selectionchange listener disabled for text input compatibility');
  }

  /**
   * 문서 선택 변경 처리
   */
  handleDocumentSelectionChange() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    // ProseMirror 내부 선택인지 확인
    const proseMirrorElement = range.commonAncestorContainer.closest ? 
      range.commonAncestorContainer.closest('.ProseMirror') :
      null;

    if (proseMirrorElement && proseMirrorElement.pmView) {
      const blockId = this.manager.findBlockId(proseMirrorElement);
      if (blockId) {
        this.manager.handleSelection('selectionchange', {
          target: proseMirrorElement,
          range,
          blockId,
          forceEngine: 'prosemirror'
        });
      }
    }
  }

  /**
   * 현재 상태 가져오기
   * @returns {Object} - 엔진 상태
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      activeViewsCount: this.activeViews.size,
      currentSelection: this.currentSelection
    };
  }

  /**
   * 선택 해제
   */
  clear() {
    this.manager.log('[ProseMirrorEngine] Clearing selection');
    
    // 모든 ProseMirror 뷰에서 선택 해제
    this.activeViews.forEach((view) => {
      try {
        const { state } = view;
        const tr = state.tr.setSelection(state.selection.constructor.near(state.doc.resolve(0)));
        view.dispatch(tr);
      } catch (error) {
        this.manager.log('[ProseMirrorEngine] Error clearing view selection:', error);
      }
    });

    this.currentSelection = null;
  }

  /**
   * ProseMirror 포커스 처리
   * @param {string} blockId - 블록 ID
   * @param {Object} view - ProseMirror EditorView
   */
  handleFocus(blockId, view) {
    this.manager.log(`[ProseMirrorEngine] Focus: ${blockId}`);
    
    // 뷰 등록 (이미 등록되어 있을 수 있음)
    if (!this.activeViews.has(blockId)) {
      this.activeViews.set(blockId, view);
    }
    
    // 현재 활성 블록 설정
    this.currentActiveBlock = blockId;
  }

  /**
   * ProseMirror 블러 처리
   * @param {string} blockId - 블록 ID
   * @param {Object} view - ProseMirror EditorView
   */
  handleBlur(blockId, view) {
    this.manager.log(`[ProseMirrorEngine] Blur: ${blockId}`);
    
    // 현재 활성 블록 해제
    if (this.currentActiveBlock === blockId) {
      this.currentActiveBlock = null;
    }
  }

  /**
   * 엔진 정리
   */
  cleanup() {
    this.manager.log('[ProseMirrorEngine] Cleaning up');
    this.clear();
    // 추가 정리 작업은 destroy에서
  }

  /**
   * 엔진 소멸
   */
  destroy() {
    this.manager.log('[ProseMirrorEngine] Destroying');
    
    // 이벤트 리스너 제거 - 비활성화된 리스너이므로 제거할 필요 없음
    // document.removeEventListener('selectionchange', this.handleDocumentSelectionChange.bind(this));
    
    // 상태 초기화
    this.activeViews.clear();
    this.currentSelection = null;
    this.isInitialized = false;
  }
}