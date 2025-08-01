/**
 * 텍스트 선택 관리자
 * 
 * @description 크로스 블록 텍스트 선택 및 조작 로직
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * 텍스트 선택 타입 관리자
 */
export class TextSelection {
  constructor(selectionManager) {
    this.manager = selectionManager;
    this.currentTextSelection = null;
    this.selectionHistory = [];
    this.maxHistorySize = 10;
  }

  /**
   * 텍스트 선택 시작
   * @param {Object} startPoint - 시작점 정보
   * @returns {Object} - 선택 시작 결과
   */
  startSelection(startPoint) {
    const { blockId, offset, clientX, clientY, element } = startPoint;
    
    this.manager.log('[TextSelection] Starting text selection:', startPoint);

    this.currentTextSelection = {
      type: 'text',
      engine: 'text_selection',
      startBlockId: blockId,
      endBlockId: blockId,
      startOffset: offset,
      endOffset: offset,
      startCoords: { x: clientX, y: clientY },
      endCoords: { x: clientX, y: clientY },
      startElement: element,
      endElement: element,
      selectedText: '',
      crossBlock: false,
      isSelecting: true,
      timestamp: Date.now()
    };

    return this.currentTextSelection;
  }

  /**
   * 텍스트 선택 확장
   * @param {Object} endPoint - 끝점 정보
   * @returns {Object} - 선택 확장 결과
   */
  extendSelection(endPoint) {
    if (!this.currentTextSelection || !this.currentTextSelection.isSelecting) {
      return null;
    }

    const { blockId, offset, clientX, clientY, element } = endPoint;
    
    this.manager.log('[TextSelection] Extending text selection:', endPoint);

    // 선택 정보 업데이트
    this.currentTextSelection.endBlockId = blockId;
    this.currentTextSelection.endOffset = offset;
    this.currentTextSelection.endCoords = { x: clientX, y: clientY };
    this.currentTextSelection.endElement = element;
    this.currentTextSelection.crossBlock = this.currentTextSelection.startBlockId !== blockId;

    // 선택된 텍스트 추출
    this.currentTextSelection.selectedText = this.extractSelectedText();
    this.currentTextSelection.selectedBlocks = this.getSelectedBlocks();

    return this.currentTextSelection;
  }

  /**
   * 텍스트 선택 완료
   * @returns {Object} - 선택 완료 결과
   */
  endSelection() {
    if (!this.currentTextSelection) {
      return null;
    }

    this.manager.log('[TextSelection] Ending text selection');

    this.currentTextSelection.isSelecting = false;
    
    // 유효한 선택인지 확인
    if (!this.isValidTextSelection(this.currentTextSelection)) {
      this.currentTextSelection = null;
      return null;
    }

    // 히스토리에 추가
    this.addToHistory(this.currentTextSelection);

    const result = { ...this.currentTextSelection };
    return result;
  }

  /**
   * 선택된 텍스트 추출
   * @returns {string} - 선택된 텍스트
   */
  extractSelectedText() {
    if (!this.currentTextSelection) {
      return '';
    }

    const { startBlockId, endBlockId, startOffset, endOffset } = this.currentTextSelection;

    // 같은 블록 내 선택
    if (startBlockId === endBlockId) {
      return this.extractTextFromBlock(startBlockId, startOffset, endOffset);
    }

    // 크로스 블록 선택
    return this.extractCrossBlockText(startBlockId, endBlockId, startOffset, endOffset);
  }

  /**
   * 단일 블록에서 텍스트 추출
   * @param {string} blockId - 블록 ID
   * @param {number} startOffset - 시작 오프셋
   * @param {number} endOffset - 끝 오프셋
   * @returns {string} - 추출된 텍스트
   */
  extractTextFromBlock(blockId, startOffset, endOffset) {
    const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
    if (!blockElement) return '';

    // ProseMirror 블록인 경우
    const proseMirrorElement = blockElement.querySelector('.ProseMirror');
    if (proseMirrorElement && proseMirrorElement.pmView) {
      const view = proseMirrorElement.pmView;
      const minOffset = Math.min(startOffset, endOffset);
      const maxOffset = Math.max(startOffset, endOffset);
      return view.state.doc.textBetween(minOffset, maxOffset);
    }

    // 일반 텍스트 블록인 경우
    const textContent = blockElement.textContent || '';
    const minOffset = Math.min(startOffset, endOffset);
    const maxOffset = Math.max(startOffset, endOffset);
    return textContent.slice(minOffset, maxOffset);
  }

  /**
   * 크로스 블록 텍스트 추출
   * @param {string} startBlockId - 시작 블록 ID
   * @param {string} endBlockId - 끝 블록 ID
   * @param {number} startOffset - 시작 오프셋
   * @param {number} endOffset - 끝 오프셋
   * @returns {string} - 추출된 텍스트
   */
  extractCrossBlockText(startBlockId, endBlockId, startOffset, endOffset) {
    const selectedBlocks = this.getSelectedBlocks();
    let result = '';

    selectedBlocks.forEach((blockId, index) => {
      if (index === 0) {
        // 첫 번째 블록: startOffset부터 끝까지
        result += this.extractTextFromBlock(blockId, startOffset, Infinity);
      } else if (index === selectedBlocks.length - 1) {
        // 마지막 블록: 처음부터 endOffset까지
        result += this.extractTextFromBlock(blockId, 0, endOffset);
      } else {
        // 중간 블록들: 전체 텍스트
        result += this.extractTextFromBlock(blockId, 0, Infinity);
      }

      // 블록 사이에 줄바꿈 추가 (마지막 블록 제외)
      if (index < selectedBlocks.length - 1) {
        result += '\n';
      }
    });

    return result;
  }

  /**
   * 선택 영역의 블록들 가져오기
   * @returns {Array} - 선택된 블록 ID 배열
   */
  getSelectedBlocks() {
    if (!this.currentTextSelection) {
      return [];
    }

    const { startBlockId, endBlockId } = this.currentTextSelection;
    
    if (startBlockId === endBlockId) {
      return [startBlockId];
    }

    // 모든 블록 요소 찾기
    const allBlockElements = document.querySelectorAll('[data-block-id]');
    const allBlockIds = Array.from(allBlockElements).map(el => el.getAttribute('data-block-id'));
    
    const startIndex = allBlockIds.indexOf(startBlockId);
    const endIndex = allBlockIds.indexOf(endBlockId);
    
    if (startIndex === -1 || endIndex === -1) {
      return [startBlockId];
    }

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    
    return allBlockIds.slice(minIndex, maxIndex + 1);
  }

  /**
   * 선택된 텍스트 삭제
   * @returns {Object} - 삭제 결과
   */
  deleteSelectedText() {
    if (!this.currentTextSelection || !this.currentTextSelection.selectedText) {
      return null;
    }

    this.manager.log('[TextSelection] Deleting selected text');

    const selection = { ...this.currentTextSelection };
    
    // 선택 해제
    this.clearSelection();

    return {
      type: 'text_deleted',
      engine: 'text_selection',
      deletedText: selection.selectedText,
      selection: selection
    };
  }

  /**
   * 선택된 텍스트 복사
   * @returns {Object} - 복사 결과
   */
  copySelectedText() {
    if (!this.currentTextSelection || !this.currentTextSelection.selectedText) {
      return null;
    }

    this.manager.log('[TextSelection] Copying selected text');

    return {
      type: 'text_copied',
      engine: 'text_selection',
      copiedText: this.currentTextSelection.selectedText,
      selection: { ...this.currentTextSelection }
    };
  }

  /**
   * 선택된 텍스트 잘라내기
   * @returns {Object} - 잘라내기 결과
   */
  cutSelectedText() {
    const copyResult = this.copySelectedText();
    const deleteResult = this.deleteSelectedText();
    
    if (!copyResult || !deleteResult) {
      return null;
    }

    return {
      type: 'text_cut',
      engine: 'text_selection',
      cutText: copyResult.copiedText,
      selection: copyResult.selection
    };
  }

  /**
   * 텍스트 교체
   * @param {string} newText - 새 텍스트
   * @returns {Object} - 교체 결과
   */
  replaceSelectedText(newText) {
    if (!this.currentTextSelection) {
      return null;
    }

    this.manager.log('[TextSelection] Replacing selected text:', newText);

    const oldText = this.currentTextSelection.selectedText;
    
    return {
      type: 'text_replaced',
      engine: 'text_selection',
      oldText,
      newText,
      selection: { ...this.currentTextSelection }
    };
  }

  /**
   * 선택 영역에 포맷팅 적용
   * @param {string} formatType - 포맷 타입
   * @param {*} formatValue - 포맷 값
   * @returns {Object} - 포맷팅 결과
   */
  formatSelectedText(formatType, formatValue) {
    if (!this.currentTextSelection || !this.currentTextSelection.selectedText) {
      return null;
    }

    this.manager.log('[TextSelection] Formatting selected text:', { formatType, formatValue });

    return {
      type: 'text_formatted',
      engine: 'text_selection',
      formatType,
      formatValue,
      selection: { ...this.currentTextSelection }
    };
  }

  /**
   * 단어 단위로 선택 확장
   * @param {string} direction - 확장 방향 ('left' | 'right')
   * @returns {Object} - 확장 결과
   */
  extendSelectionByWord(direction) {
    if (!this.currentTextSelection) {
      return null;
    }

    // TODO: 단어 경계 감지 및 선택 확장 구현
    return null;
  }

  /**
   * 문단 단위로 선택 확장
   * @returns {Object} - 확장 결과
   */
  extendSelectionByParagraph() {
    if (!this.currentTextSelection) {
      return null;
    }

    // TODO: 문단 경계 감지 및 선택 확장 구현
    return null;
  }

  /**
   * 유효한 텍스트 선택인지 확인
   * @param {Object} selection - 선택 객체
   * @returns {boolean} - 유효성 여부
   */
  isValidTextSelection(selection) {
    return selection && 
           selection.selectedText && 
           selection.selectedText.trim().length > 0;
  }

  /**
   * 선택 히스토리에 추가
   * @param {Object} selection - 선택 객체
   */
  addToHistory(selection) {
    this.selectionHistory.push({
      ...selection,
      timestamp: Date.now()
    });

    // 히스토리 크기 제한
    if (this.selectionHistory.length > this.maxHistorySize) {
      this.selectionHistory.shift();
    }
  }

  /**
   * 선택 해제
   * @returns {Object} - 해제 결과
   */
  clearSelection() {
    this.manager.log('[TextSelection] Clearing text selection');

    const hadSelection = !!this.currentTextSelection;
    this.currentTextSelection = null;

    return {
      type: 'text_selection_cleared',
      engine: 'text_selection',
      hadSelection
    };
  }

  /**
   * 현재 선택 상태 가져오기
   * @returns {Object} - 선택 상태
   */
  getState() {
    return {
      currentSelection: this.currentTextSelection,
      hasSelection: !!this.currentTextSelection,
      historyCount: this.selectionHistory.length
    };
  }

  /**
   * 선택 히스토리 가져오기
   * @returns {Array} - 선택 히스토리
   */
  getHistory() {
    return [...this.selectionHistory];
  }

  /**
   * 상태 초기화
   */
  reset() {
    this.currentTextSelection = null;
    this.selectionHistory = [];
  }
}