/**
 * 하이브리드 선택 시스템의 통합 관리자
 * 
 * @description ProseMirror와 Native Selection을 조율하는 중앙 관리자
 * @author AI Assistant
 * @version 1.0.0
 */

import { ProseMirrorEngine } from './engines/ProseMirrorEngine.js';
import { NativeEngine } from './engines/NativeEngine.js';
import { HybridEngine } from './engines/HybridEngine.js';
import { BlockSelection } from './types/BlockSelection.js';
import { TextSelection } from './types/TextSelection.js';
import { DragSelection } from './types/DragSelection.js';

/**
 * 선택 시스템의 중앙 관리자
 */
export class SelectionManager {
  constructor(options = {}) {
    this.options = {
      enableCrossBlock: true,
      enableDragSelection: true,
      visualFeedback: true,
      engines: ['prosemirror', 'native'],
      debugMode: false,
      ...options
    };

    // 엔진 초기화
    this.proseMirrorEngine = new ProseMirrorEngine(this);
    this.nativeEngine = new NativeEngine(this);
    this.hybridEngine = new HybridEngine(this);

    // 선택 타입 관리자들
    this.blockSelection = new BlockSelection(this);
    this.textSelection = new TextSelection(this);
    this.dragSelection = new DragSelection(this);

    // 현재 상태
    this.currentEngine = null;
    this.activeSelection = null;
    this.isSelecting = false;
    this.plugins = new Map();

    // 이벤트 리스너들
    this.listeners = {
      selectionchange: [],
      selectionstart: [],
      selectionend: [],
      engineswitch: []
    };

    // ProseMirror 뷰 레지스트리
    this.proseMirrorViews = new Map();

    this.log('SelectionManager initialized', this.options);
  }

  /**
   * 선택 이벤트 처리의 진입점
   * @param {string} eventType - 이벤트 타입
   * @param {Object} eventData - 이벤트 데이터
   * @returns {boolean} - 처리 성공 여부
   */
  handleSelection(eventType, eventData) {
    try {
      this.log(`Handling selection event: ${eventType}`, eventData);

      // 엔진 감지 및 선택
      const engine = this.detectEngine(eventData);
      
      if (engine !== this.currentEngine) {
        this.switchEngine(engine, eventData);
      }

      // 해당 엔진으로 이벤트 처리
      const result = this.currentEngine === 'prosemirror' 
        ? this.proseMirrorEngine.handle(eventType, eventData)
        : this.nativeEngine.handle(eventType, eventData);

      // 결과 처리
      if (result) {
        this.updateActiveSelection(result);
        this.notifyListeners('selectionchange', result);
      }

      return result;
    } catch (error) {
      console.error('[SelectionManager] Error handling selection:', error);
      return false;
    }
  }

  /**
   * 상황에 맞는 엔진 감지
   * @param {Object} eventData - 이벤트 데이터
   * @returns {string} - 사용할 엔진 ('prosemirror' | 'native' | 'hybrid')
   */
  detectEngine(eventData) {
    // 강제 엔진 지정이 있으면 우선
    if (eventData.forceEngine) {
      return eventData.forceEngine;
    }

    // 크로스 블록 선택이면 네이티브 엔진
    if (this.isCrossBlockSelection(eventData)) {
      return 'native';
    }

    // ProseMirror 내부 선택이면 ProseMirror 엔진
    if (this.isProseMirrorSelection(eventData)) {
      return 'prosemirror';
    }

    // 하이브리드 상황이면 하이브리드 엔진
    if (this.isHybridSelection(eventData)) {
      return 'hybrid';
    }

    // 기본값은 네이티브
    return 'native';
  }

  /**
   * 엔진 전환
   * @param {string} newEngine - 새 엔진
   * @param {Object} context - 전환 컨텍스트
   */
  switchEngine(newEngine, context = {}) {
    const oldEngine = this.currentEngine;
    
    // 같은 엔진으로 전환하려는 경우 무시 (성능 최적화)
    if (oldEngine === newEngine) {
      this.log(`🔄 Engine switch ignored: already using ${newEngine}`);
      return;
    }
    
    this.log(`🔀 Switching engine: ${oldEngine} → ${newEngine}`, context);

    // 이전 엔진 정리
    if (oldEngine && this[`${oldEngine}Engine`]) {
      this[`${oldEngine}Engine`].cleanup();
    }

    // 새 엔진 초기화
    this.currentEngine = newEngine;
    if (newEngine === 'drag_selection') {
      // 드래그 선택은 별도 처리
      // dragSelection 타입 관리자는 이미 초기화되어 있음
    } else if (this[`${newEngine}Engine`]) {
      this[`${newEngine}Engine`].initialize(context);
    }

    // 엔진 전환 이벤트 발생
    this.notifyListeners('engineswitch', {
      from: oldEngine,
      to: newEngine,
      context
    });
  }

  /**
   * 크로스 블록 선택인지 확인
   * @param {Object} eventData - 이벤트 데이터
   * @returns {boolean}
   */
  isCrossBlockSelection(eventData) {
    if (!eventData.range) return false;

    const startBlockId = this.findBlockId(eventData.range.startContainer || eventData.target);
    const endBlockId = this.findBlockId(eventData.range.endContainer || eventData.target);

    return startBlockId && endBlockId && startBlockId !== endBlockId;
  }

  /**
   * ProseMirror 내부 선택인지 확인
   * @param {Object} eventData - 이벤트 데이터
   * @returns {boolean}
   */
  isProseMirrorSelection(eventData) {
    const element = eventData.target || eventData.element;
    return element && (
      element.closest('.ProseMirror') ||
      element.closest('.prosemirror-text-editor')
    );
  }

  /**
   * 하이브리드 선택인지 확인 (ProseMirror에서 시작해서 다른 블록으로 확장)
   * @param {Object} eventData - 이벤트 데이터
   * @returns {boolean}
   */
  isHybridSelection(eventData) {
    // ProseMirror에서 시작해서 외부로 확장되는 경우
    return this.isProseMirrorSelection(eventData) && 
           eventData.extendingOutside;
  }

  /**
   * DOM 요소에서 블록 ID 찾기
   * @param {Element} element - DOM 요소
   * @returns {string|null} - 블록 ID
   */
  findBlockId(element) {
    if (!element) return null;
    
    let current = element;
    while (current && current !== document.body) {
      if (current.hasAttribute && current.hasAttribute('data-block-id')) {
        return current.getAttribute('data-block-id');
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * 활성 선택 상태 업데이트
   * @param {Object} selectionResult - 선택 결과
   */
  updateActiveSelection(selectionResult) {
    this.activeSelection = {
      ...selectionResult,
      timestamp: Date.now(),
      engine: this.currentEngine
    };

    this.log('Active selection updated', this.activeSelection);
  }

  /**
   * 플러그인 등록
   * @param {Object} plugin - 플러그인 객체
   */
  addPlugin(plugin) {
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }

    this.plugins.set(plugin.name, plugin);
    this.log(`Plugin registered: ${plugin.name}`);
  }

  /**
   * 플러그인 제거
   * @param {string} pluginName - 플러그인 이름
   */
  removePlugin(pluginName) {
    this.plugins.delete(pluginName);
    this.log(`Plugin removed: ${pluginName}`);
  }

  /**
   * 이벤트 리스너 등록
   * @param {string} eventType - 이벤트 타입
   * @param {Function} listener - 리스너 함수
   */
  addEventListener(eventType, listener) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(listener);
  }

  /**
   * 이벤트 리스너 제거
   * @param {string} eventType - 이벤트 타입
   * @param {Function} listener - 리스너 함수
   */
  removeEventListener(eventType, listener) {
    if (this.listeners[eventType]) {
      const index = this.listeners[eventType].indexOf(listener);
      if (index > -1) {
        this.listeners[eventType].splice(index, 1);
      }
    }
  }

  /**
   * 리스너들에게 이벤트 통지
   * @param {string} eventType - 이벤트 타입
   * @param {Object} data - 이벤트 데이터
   */
  notifyListeners(eventType, data) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[SelectionManager] Error in ${eventType} listener:`, error);
        }
      });
    }
  }

  /**
   * 현재 선택 상태 가져오기
   * @returns {Object} - 선택 상태
   */
  getSelectionState() {
    return {
      activeSelection: this.activeSelection,
      currentEngine: this.currentEngine,
      isSelecting: this.isSelecting,
      hasSelection: !!this.activeSelection,
      engines: {
        prosemirror: this.proseMirrorEngine.getState(),
        native: this.nativeEngine.getState(),
        hybrid: this.hybridEngine.getState()
      }
    };
  }

  /**
   * 모든 선택 해제
   */
  clearSelection() {
    this.log('Clearing all selections');

    // 모든 엔진에서 선택 해제
    this.proseMirrorEngine.clear();
    this.nativeEngine.clear();
    this.hybridEngine.clear();

    // 상태 초기화
    this.activeSelection = null;
    this.isSelecting = false;
    this.currentEngine = null;

    this.notifyListeners('selectionchange', null);
  }

  /**
   * 시스템 종료 및 정리
   */
  destroy() {
    this.log('Destroying SelectionManager');

    // 모든 엔진 정리
    this.proseMirrorEngine.destroy();
    this.nativeEngine.destroy();
    this.hybridEngine.destroy();

    // 리스너 정리
    this.listeners = {};
    this.plugins.clear();

    // 상태 초기화
    this.activeSelection = null;
    this.currentEngine = null;
    this.isSelecting = false;
  }

  /**
   * ProseMirror 뷰 등록
   * @param {string} blockId - 블록 ID
   * @param {Object} view - ProseMirror EditorView
   */
  registerProseMirrorView(blockId, view) {
    this.proseMirrorViews.set(blockId, view);
    this.log(`ProseMirror view registered for block: ${blockId}`);
  }

  /**
   * ProseMirror 뷰 등록 해제
   * @param {string} blockId - 블록 ID
   */
  unregisterProseMirrorView(blockId) {
    this.proseMirrorViews.delete(blockId);
    this.log(`ProseMirror view unregistered for block: ${blockId}`);
  }

  /**
   * ProseMirror 선택 변경 처리
   * @param {Object} data - 선택 변경 데이터
   */
  handleProseMirrorSelectionChange(data) {
    this.log('ProseMirror selection changed', data);
    
    const { view, selection, blockId, transaction, eventType, originalEvent } = data;
    
    // 크로스 블록 확장 감지 - 하지만 일반적인 선택에서는 간섭하지 않도록 제한적으로 처리
    if (eventType === 'mouseup' && !selection.empty) {
      // 현재는 로그만 남기고 실제 전환은 하지 않음 (안전한 방식)
      this.log('ProseMirror selection completed, potential cross-block candidate');
    }
    
    // ProseMirror 엔진에 선택 변경 전달 (기존 기능 유지)
    if (this.proseMirrorEngine) {
      const result = this.proseMirrorEngine.handleSelectionChange({
        view,
        selection,
        blockId,
        transaction,
        type: 'prosemirror_selection_change',
        eventType,
        originalEvent
      });

      if (result) {
        this.updateActiveSelection(result);
        this.notifyListeners('selectionchange', result);
      }
    }
  }

  /**
   * 크로스 블록 드래그 처리
   * @param {Object} dragData - 드래그 데이터
   */
  handleCrossBlockDrag(dragData) {
    this.log('Cross-block drag detected', dragData);
    
    const { startView, startSelection, startBlockId, currentMouseEvent, targetElement, targetBlockId } = dragData;
    
    // 이미 Native 엔진이 활성화된 경우 중복 처리 방지
    if (this.currentEngine === 'native') {
      this.log('Native engine already active, skipping duplicate cross-block drag');
      return null;
    }
    
    // 크로스 블록 드래그가 확실하게 감지된 경우에만 Native 엔진으로 전환
    if (startBlockId !== targetBlockId) {
      this.log('Switching to Native engine for cross-block selection', {
        from: startBlockId,
        to: targetBlockId,
        currentEngine: this.currentEngine
      });
      
      // Native 엔진으로 전환하면서 초기 선택 정보 전달
      const context = {
        startingFrom: 'prosemirror',
        initialSelection: {
          view: startView,
          selection: startSelection,
          blockId: startBlockId,
          startPos: startSelection.from,
          endPos: startSelection.to
        },
        targetBlockId,
        currentMouseEvent,
        eventData: {
          type: 'cross_block_drag',
          clientX: currentMouseEvent.clientX,
          clientY: currentMouseEvent.clientY,
          target: targetElement
        }
      };
      
      this.switchEngine('native', context);
      
      // 전환 결과 반환
      const result = {
        type: 'cross_block_transition',
        engine: 'native',
        startBlockId,
        targetBlockId,
        context
      };
      
      this.updateActiveSelection(result);
      this.notifyListeners('selectionchange', result);
      
      return result;
    }
    
    return null;
  }

  /**
   * 네이티브 크로스 블록 선택 직접 생성
   * @param {Object} selectionData - 선택 데이터
   */
  createNativeCrossBlockSelection(selectionData) {
    this.log('🚀 Creating native cross-block selection directly', selectionData);
    
    const { startElement, endElement, startBlockId, endBlockId, mouseEvent } = selectionData;
    
    try {
      // 기존 선택 제거
      const selection = window.getSelection();
      selection.removeAllRanges();
      
      // 시작 블록의 첫 번째 텍스트 노드 찾기
      const startTextNode = this.findFirstTextNode(startElement);
      const endTextNode = this.findTextNodeAtPoint(endElement, mouseEvent.clientX, mouseEvent.clientY);
      
      if (startTextNode && endTextNode) {
        const range = document.createRange();
        
        // 시작점: 첫 번째 텍스트 노드의 시작
        range.setStart(startTextNode, 0);
        
        // 끝점: 마우스 위치의 텍스트 노드
        range.setEnd(endTextNode.node, endTextNode.offset);
        
        selection.addRange(range);
        
        this.log('✅ Native cross-block selection created!', {
          startBlock: startBlockId,
          endBlock: endBlockId,
          selectedText: selection.toString().substring(0, 100),
          rangeCount: selection.rangeCount
        });
        
        // 선택 상태 업데이트
        this.updateActiveSelection({
          type: 'cross_block_native',
          startBlockId,
          endBlockId,
          selectedText: selection.toString(),
          range,
          native: true
        });
        
        return true;
      }
    } catch (error) {
      this.log('❌ Error creating native cross-block selection:', error);
    }
    
    return false;
  }

  /**
   * 요소의 첫 번째 텍스트 노드 찾기
   * @param {Element} element - 검색할 요소
   * @returns {Node|null} - 첫 번째 텍스트 노드
   */
  findFirstTextNode(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    return walker.nextNode();
  }

  /**
   * 특정 좌표의 텍스트 노드와 오프셋 찾기
   * @param {Element} element - 검색할 요소
   * @param {number} clientX - X 좌표
   * @param {number} clientY - Y 좌표
   * @returns {Object|null} - {node, offset}
   */
  findTextNodeAtPoint(element, clientX, clientY) {
    try {
      // 좌표에서 캐럿 위치 찾기
      let caretPos = null;
      
      if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(clientX, clientY);
        if (range) {
          caretPos = { node: range.startContainer, offset: range.startOffset };
        }
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(clientX, clientY);
        if (pos) {
          caretPos = { node: pos.offsetNode, offset: pos.offset };
        }
      }
      
      // 텍스트 노드가 아니면 가장 가까운 텍스트 노드 찾기
      if (caretPos && caretPos.node.nodeType !== Node.TEXT_NODE) {
        const textNode = this.findFirstTextNode(element);
        if (textNode) {
          caretPos = { node: textNode, offset: textNode.textContent.length };
        }
      }
      
      return caretPos;
    } catch (error) {
      this.log('Error finding text node at point:', error);
      // 폴백: 요소의 마지막 텍스트 노드
      const textNode = this.findFirstTextNode(element);
      return textNode ? { node: textNode, offset: textNode.textContent.length } : null;
    }
  }

  /**
   * ProseMirror 포커스 처리
   * @param {string} blockId - 블록 ID
   * @param {Object} view - ProseMirror EditorView
   */
  handleProseMirrorFocus(blockId, view) {
    this.log(`ProseMirror focused: ${blockId}`);
    
    // 현재 포커스된 블록 설정
    this.currentFocusedBlock = blockId;
    
    // ProseMirror 엔진에 포커스 이벤트 전달
    if (this.proseMirrorEngine) {
      this.proseMirrorEngine.handleFocus(blockId, view);
    }
  }

  /**
   * ProseMirror 블러 처리
   * @param {string} blockId - 블록 ID
   * @param {Object} view - ProseMirror EditorView
   */
  handleProseMirrorBlur(blockId, view) {
    this.log(`ProseMirror blurred: ${blockId}`);
    
    // 현재 포커스된 블록 해제 (다른 블록으로 이동하지 않은 경우)
    setTimeout(() => {
      if (this.currentFocusedBlock === blockId) {
        this.currentFocusedBlock = null;
      }
    }, 100);
    
    // ProseMirror 엔진에 블러 이벤트 전달
    if (this.proseMirrorEngine) {
      this.proseMirrorEngine.handleBlur(blockId, view);
    }
  }

  /**
   * 키보드 이벤트 처리
   * @param {Object} eventData - 키보드 이벤트 데이터
   * @returns {Object|null} - 처리 결과
   */
  handleKeyboardEvent(eventData) {
    // 일반 텍스트 입력 키는 무시 (ProseMirror가 직접 처리)
    const isTextInput = !eventData.ctrlKey && !eventData.metaKey && 
                       !['Escape', 'Tab', 'Enter', 'Delete', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(eventData.key) &&
                       eventData.key.length === 1;
    
    if (isTextInput) {
      this.log('Ignoring text input key:', eventData.key);
      return null;
    }
    
    this.log('Keyboard event', eventData);
    
    // 현재 엔진에 키보드 이벤트 전달
    if (this.currentEngine && this[`${this.currentEngine}Engine`]) {
      return this[`${this.currentEngine}Engine`].handle('keydown', eventData);
    }
    
    // 엔진이 없으면 자동 감지하여 처리
    const engine = this.detectEngine(eventData);
    this.switchEngine(engine, eventData);
    
    if (this[`${engine}Engine`]) {
      return this[`${engine}Engine`].handle('keydown', eventData);
    }
    
    return null;
  }

  /**
   * 마우스 이벤트 처리
   * @param {Object} eventData - 마우스 이벤트 데이터
   * @returns {Object|null} - 처리 결과
   */
  handleMouseEvent(eventData) {
    this.log(`Mouse event: ${eventData.type}`, eventData);
    
    // 드래그 선택 이벤트 처리
    if (eventData.type === 'mousedown') {
      // 드래그 선택 시작 가능성
      const result = this.dragSelection.startDrag(eventData);
      if (result) {
        this.switchEngine('drag_selection', { dragStart: eventData });
        this.updateActiveSelection(result);
        this.notifyListeners('selectionchange', result);
        return result;
      }
    } else if (eventData.type === 'mousemove' && this.currentEngine === 'drag_selection') {
      const result = this.dragSelection.updateDrag(eventData);
      if (result) {
        this.updateActiveSelection(result);
        this.notifyListeners('selectionchange', result);
        return result;
      }
    } else if (eventData.type === 'mouseup' && this.currentEngine === 'drag_selection') {
      const result = this.dragSelection.endDrag(eventData);
      if (result) {
        this.updateActiveSelection(result);
        this.notifyListeners('selectionchange', result);
        // 드래그 종료 후 엔진 전환
        const nextEngine = this.detectEngine(eventData);
        this.switchEngine(nextEngine, eventData);
        return result;
      }
    }
    
    // 현재 엔진에 마우스 이벤트 전달
    if (this.currentEngine && this[`${this.currentEngine}Engine`]) {
      return this[`${this.currentEngine}Engine`].handle(eventData.type, eventData);
    }
    
    // 엔진이 없으면 자동 감지하여 처리
    const engine = this.detectEngine(eventData);
    this.switchEngine(engine, eventData);
    
    if (this[`${engine}Engine`]) {
      return this[`${engine}Engine`].handle(eventData.type, eventData);
    }
    
    return null;
  }

  /**
   * 시스템 초기화
   * @param {Object} options - 초기화 옵션
   */
  async initialize(options = {}) {
    this.log('Initializing SelectionManager', options);
    
    // 엔진들 초기화
    try {
      await this.proseMirrorEngine.initialize();
      await this.nativeEngine.initialize();
      await this.hybridEngine.initialize();
      
      this.log('All engines initialized successfully');
    } catch (error) {
      console.error('[SelectionManager] Failed to initialize engines:', error);
      throw error;
    }
  }

  /**
   * 디버그 로그
   * @param {string} message - 메시지
   * @param {*} data - 추가 데이터
   */
  log(message, data = null) {
    if (this.options.debugMode) {
      console.log(`[SelectionManager] ${message}`, data || '');
    }
  }
}

// 싱글톤 인스턴스 (옵션)
let globalSelectionManager = null;

/**
 * 전역 SelectionManager 인스턴스 가져오기
 * @param {Object} options - 옵션 (최초 생성 시에만 적용)
 * @returns {SelectionManager}
 */
export function getSelectionManager(options = {}) {
  if (!globalSelectionManager) {
    globalSelectionManager = new SelectionManager(options);
  }
  return globalSelectionManager;
}

/**
 * 전역 SelectionManager 인스턴스 제거
 */
export function destroySelectionManager() {
  if (globalSelectionManager) {
    globalSelectionManager.destroy();
    globalSelectionManager = null;
  }
}