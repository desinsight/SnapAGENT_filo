/**
 * 블록 선택 관리자
 * 
 * @description 여러 블록 선택 및 관리 로직
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * 블록 선택 타입 관리자
 */
export class BlockSelection {
  constructor(selectionManager) {
    this.manager = selectionManager;
    this.selectedBlocks = new Set();
    this.lastSelectedBlock = null;
    this.selectionMode = 'single'; // 'single' | 'multiple' | 'range'
  }

  /**
   * 블록 선택 처리
   * @param {string|Array} blockIds - 블록 ID(들)
   * @param {Object} options - 선택 옵션
   * @returns {Object} - 선택 결과
   */
  select(blockIds, options = {}) {
    const {
      mode = 'single',
      append = false,
      range = false,
      toggle = false
    } = options;

    this.manager.log('[BlockSelection] Selecting blocks:', { blockIds, options });

    const ids = Array.isArray(blockIds) ? blockIds : [blockIds];
    
    // 기존 선택 처리
    if (!append && !toggle) {
      this.selectedBlocks.clear();
    }

    // 범위 선택 처리
    if (range && this.lastSelectedBlock) {
      const rangeBlocks = this.getBlockRange(this.lastSelectedBlock, ids[0]);
      rangeBlocks.forEach(id => this.selectedBlocks.add(id));
    } else {
      // 개별 선택/토글 처리
      ids.forEach(id => {
        if (toggle && this.selectedBlocks.has(id)) {
          this.selectedBlocks.delete(id);
        } else {
          this.selectedBlocks.add(id);
        }
      });
    }

    this.lastSelectedBlock = ids[ids.length - 1];
    this.selectionMode = mode;

    return this.getSelectionResult();
  }

  /**
   * 모든 블록 선택
   * @returns {Object} - 선택 결과
   */
  selectAll() {
    this.manager.log('[BlockSelection] Selecting all blocks');

    const allBlocks = this.getAllBlockIds();
    this.selectedBlocks.clear();
    allBlocks.forEach(id => this.selectedBlocks.add(id));
    
    this.selectionMode = 'multiple';
    this.lastSelectedBlock = allBlocks[allBlocks.length - 1];

    return this.getSelectionResult();
  }

  /**
   * 특정 블록까지 범위 선택
   * @param {string} fromBlockId - 시작 블록 ID
   * @param {string} toBlockId - 끝 블록 ID
   * @returns {Array} - 범위 내 블록 ID들
   */
  getBlockRange(fromBlockId, toBlockId) {
    const allBlocks = this.getAllBlockIds();
    const fromIndex = allBlocks.indexOf(fromBlockId);
    const toIndex = allBlocks.indexOf(toBlockId);

    if (fromIndex === -1 || toIndex === -1) {
      return [toBlockId];
    }

    const startIndex = Math.min(fromIndex, toIndex);
    const endIndex = Math.max(fromIndex, toIndex);

    return allBlocks.slice(startIndex, endIndex + 1);
  }

  /**
   * 블록 선택 해제
   * @param {string|Array} blockIds - 해제할 블록 ID(들)
   * @returns {Object} - 선택 결과
   */
  deselect(blockIds) {
    const ids = Array.isArray(blockIds) ? blockIds : [blockIds];
    
    this.manager.log('[BlockSelection] Deselecting blocks:', ids);

    ids.forEach(id => this.selectedBlocks.delete(id));

    return this.getSelectionResult();
  }

  /**
   * 모든 선택 해제
   * @returns {Object} - 선택 결과
   */
  clearSelection() {
    this.manager.log('[BlockSelection] Clearing all block selection');

    this.selectedBlocks.clear();
    this.lastSelectedBlock = null;
    this.selectionMode = 'single';

    return this.getSelectionResult();
  }

  /**
   * 다음 블록 선택 (키보드 네비게이션)
   * @param {Object} options - 선택 옵션
   * @returns {Object} - 선택 결과
   */
  selectNext(options = {}) {
    const { extend = false } = options;
    const currentBlock = this.lastSelectedBlock;
    
    if (!currentBlock) {
      const firstBlock = this.getFirstBlockId();
      return firstBlock ? this.select(firstBlock) : null;
    }

    const nextBlock = this.getNextBlockId(currentBlock);
    if (!nextBlock) return null;

    return this.select(nextBlock, { append: extend });
  }

  /**
   * 이전 블록 선택 (키보드 네비게이션)
   * @param {Object} options - 선택 옵션
   * @returns {Object} - 선택 결과
   */
  selectPrevious(options = {}) {
    const { extend = false } = options;
    const currentBlock = this.lastSelectedBlock;
    
    if (!currentBlock) {
      const lastBlock = this.getLastBlockId();
      return lastBlock ? this.select(lastBlock) : null;
    }

    const prevBlock = this.getPreviousBlockId(currentBlock);
    if (!prevBlock) return null;

    return this.select(prevBlock, { append: extend });
  }

  /**
   * 선택된 블록들 삭제
   * @returns {Object} - 삭제 결과
   */
  deleteSelected() {
    if (this.selectedBlocks.size === 0) {
      return null;
    }

    this.manager.log('[BlockSelection] Deleting selected blocks:', Array.from(this.selectedBlocks));

    const deletedBlocks = Array.from(this.selectedBlocks);
    
    return {
      type: 'blocks_deleted',
      engine: 'block_selection',
      deletedBlocks,
      count: deletedBlocks.length
    };
  }

  /**
   * 선택된 블록들 복사
   * @returns {Object} - 복사 결과
   */
  copySelected() {
    if (this.selectedBlocks.size === 0) {
      return null;
    }

    this.manager.log('[BlockSelection] Copying selected blocks:', Array.from(this.selectedBlocks));

    const copiedBlocks = this.getSelectedBlocksData();
    
    return {
      type: 'blocks_copied',
      engine: 'block_selection',
      copiedBlocks,
      count: copiedBlocks.length
    };
  }

  /**
   * 선택된 블록들 잘라내기
   * @returns {Object} - 잘라내기 결과
   */
  cutSelected() {
    const copyResult = this.copySelected();
    const deleteResult = this.deleteSelected();
    
    if (!copyResult || !deleteResult) {
      return null;
    }

    return {
      type: 'blocks_cut',
      engine: 'block_selection',
      cutBlocks: copyResult.copiedBlocks,
      count: copyResult.count
    };
  }

  /**
   * 블록 이동 (드래그 앤 드롭)
   * @param {string} targetBlockId - 이동 대상 블록 ID
   * @param {string} position - 이동 위치 ('before' | 'after' | 'inside')
   * @returns {Object} - 이동 결과
   */
  moveSelected(targetBlockId, position = 'after') {
    if (this.selectedBlocks.size === 0) {
      return null;
    }

    this.manager.log('[BlockSelection] Moving selected blocks:', {
      selectedBlocks: Array.from(this.selectedBlocks),
      targetBlockId,
      position
    });

    return {
      type: 'blocks_moved',
      engine: 'block_selection',
      movedBlocks: Array.from(this.selectedBlocks),
      targetBlockId,
      position
    };
  }

  /**
   * 모든 블록 ID 가져오기
   * @returns {Array} - 블록 ID 배열
   */
  getAllBlockIds() {
    const blockElements = document.querySelectorAll('[data-block-id]');
    return Array.from(blockElements).map(el => el.getAttribute('data-block-id'));
  }

  /**
   * 첫 번째 블록 ID 가져오기
   * @returns {string|null} - 블록 ID
   */
  getFirstBlockId() {
    const allBlocks = this.getAllBlockIds();
    return allBlocks.length > 0 ? allBlocks[0] : null;
  }

  /**
   * 마지막 블록 ID 가져오기
   * @returns {string|null} - 블록 ID
   */
  getLastBlockId() {
    const allBlocks = this.getAllBlockIds();
    return allBlocks.length > 0 ? allBlocks[allBlocks.length - 1] : null;
  }

  /**
   * 다음 블록 ID 가져오기
   * @param {string} currentBlockId - 현재 블록 ID
   * @returns {string|null} - 다음 블록 ID
   */
  getNextBlockId(currentBlockId) {
    const allBlocks = this.getAllBlockIds();
    const currentIndex = allBlocks.indexOf(currentBlockId);
    
    if (currentIndex === -1 || currentIndex >= allBlocks.length - 1) {
      return null;
    }
    
    return allBlocks[currentIndex + 1];
  }

  /**
   * 이전 블록 ID 가져오기
   * @param {string} currentBlockId - 현재 블록 ID
   * @returns {string|null} - 이전 블록 ID
   */
  getPreviousBlockId(currentBlockId) {
    const allBlocks = this.getAllBlockIds();
    const currentIndex = allBlocks.indexOf(currentBlockId);
    
    if (currentIndex <= 0) {
      return null;
    }
    
    return allBlocks[currentIndex - 1];
  }

  /**
   * 선택된 블록들의 데이터 가져오기
   * @returns {Array} - 블록 데이터 배열
   */
  getSelectedBlocksData() {
    // TODO: 실제 블록 데이터를 가져오는 로직 구현
    // 현재는 ID만 반환
    return Array.from(this.selectedBlocks).map(id => ({ id }));
  }

  /**
   * 선택 결과 생성
   * @returns {Object} - 선택 결과
   */
  getSelectionResult() {
    const selectedArray = Array.from(this.selectedBlocks);
    
    return {
      type: 'block_selection',
      engine: 'block_selection',
      selectedBlocks: selectedArray,
      count: selectedArray.length,
      lastSelected: this.lastSelectedBlock,
      selectionMode: this.selectionMode,
      hasSelection: selectedArray.length > 0
    };
  }

  /**
   * 블록이 선택되었는지 확인
   * @param {string} blockId - 블록 ID
   * @returns {boolean} - 선택 여부
   */
  isSelected(blockId) {
    return this.selectedBlocks.has(blockId);
  }

  /**
   * 선택된 블록 수 가져오기
   * @returns {number} - 선택된 블록 수
   */
  getSelectionCount() {
    return this.selectedBlocks.size;
  }

  /**
   * 선택 상태 가져오기
   * @returns {Object} - 선택 상태
   */
  getState() {
    return {
      selectedBlocks: Array.from(this.selectedBlocks),
      lastSelectedBlock: this.lastSelectedBlock,
      selectionMode: this.selectionMode,
      count: this.selectedBlocks.size
    };
  }

  /**
   * 상태 초기화
   */
  reset() {
    this.selectedBlocks.clear();
    this.lastSelectedBlock = null;
    this.selectionMode = 'single';
  }
}