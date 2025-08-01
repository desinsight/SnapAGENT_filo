/**
 * 드래그 선택 관리자
 * 
 * @description 마우스 드래그를 통한 영역 선택 및 드래그 앤 드롭 로직
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * 드래그 선택 타입 관리자
 */
export class DragSelection {
  constructor(selectionManager) {
    this.manager = selectionManager;
    this.isDragging = false;
    this.dragStartPoint = null;
    this.dragCurrentPoint = null;
    this.selectionRect = null;
    this.dragThreshold = 5; // 최소 드래그 거리 (픽셀)
    this.dragMode = 'selection'; // 'selection' | 'move'
  }

  /**
   * 드래그 시작
   * @param {Object} startPoint - 시작점 정보
   * @returns {Object} - 드래그 시작 결과
   */
  startDrag(startPoint) {
    const { clientX, clientY, target, button } = startPoint;
    
    // 우클릭은 드래그 선택 안함
    if (button === 2) {
      return null;
    }

    this.manager.log('[DragSelection] Starting drag:', startPoint);

    this.dragStartPoint = {
      x: clientX,
      y: clientY,
      target,
      blockId: this.manager.findBlockId(target),
      timestamp: Date.now()
    };

    // 드래그 모드 결정
    this.dragMode = this.determineDragMode(startPoint);
    
    return {
      type: 'drag_start',
      engine: 'drag_selection',
      startPoint: this.dragStartPoint,
      mode: this.dragMode
    };
  }

  /**
   * 드래그 진행
   * @param {Object} currentPoint - 현재 위치 정보
   * @returns {Object} - 드래그 진행 결과
   */
  updateDrag(currentPoint) {
    if (!this.dragStartPoint) {
      return null;
    }

    const { clientX, clientY, target } = currentPoint;
    
    this.dragCurrentPoint = {
      x: clientX,
      y: clientY,
      target,
      blockId: this.manager.findBlockId(target)
    };

    // 드래그 거리 계산
    const distance = this.calculateDistance(this.dragStartPoint, this.dragCurrentPoint);
    
    // 임계값 이하면 아직 드래그 시작 안함
    if (!this.isDragging && distance < this.dragThreshold) {
      return null;
    }

    // 드래그 시작
    if (!this.isDragging) {
      this.isDragging = true;
      this.manager.log('[DragSelection] Drag threshold exceeded, starting drag');
    }

    // 선택 영역 계산
    this.selectionRect = this.calculateSelectionRect();
    
    // 드래그 모드에 따른 처리
    if (this.dragMode === 'selection') {
      return this.handleSelectionDrag();
    } else if (this.dragMode === 'move') {
      return this.handleMoveDrag();
    }

    return null;
  }

  /**
   * 드래그 종료
   * @param {Object} endPoint - 종료점 정보
   * @returns {Object} - 드래그 종료 결과
   */
  endDrag(endPoint) {
    if (!this.dragStartPoint) {
      return null;
    }

    this.manager.log('[DragSelection] Ending drag:', { 
      isDragging: this.isDragging, 
      mode: this.dragMode 
    });

    const result = {
      type: 'drag_end',
      engine: 'drag_selection',
      wasDragging: this.isDragging,
      mode: this.dragMode,
      startPoint: this.dragStartPoint,
      endPoint: this.dragCurrentPoint,
      selectionRect: this.selectionRect
    };

    // 드래그 선택 결과 처리
    if (this.isDragging && this.dragMode === 'selection') {
      result.selectedItems = this.getSelectedItems();
    }

    // 상태 초기화
    this.reset();

    return result;
  }

  /**
   * 드래그 모드 결정
   * @param {Object} startPoint - 시작점 정보
   * @returns {string} - 드래그 모드
   */
  determineDragMode(startPoint) {
    const { target } = startPoint;
    
    // 이미 선택된 요소에서 시작하면 이동 모드
    if (this.isSelectedElement(target)) {
      return 'move';
    }

    // 편집 가능한 영역에서 시작하면 텍스트 선택
    if (this.isEditableArea(target)) {
      return 'text';
    }

    // 기본은 영역 선택 모드
    return 'selection';
  }

  /**
   * 선택 드래그 처리
   * @returns {Object} - 선택 드래그 결과
   */
  handleSelectionDrag() {
    const selectedItems = this.getSelectedItems();
    
    return {
      type: 'selection_drag_update',
      engine: 'drag_selection',
      selectionRect: this.selectionRect,
      selectedItems,
      count: selectedItems.length
    };
  }

  /**
   * 이동 드래그 처리
   * @returns {Object} - 이동 드래그 결과
   */
  handleMoveDrag() {
    const dropTarget = this.findDropTarget(this.dragCurrentPoint);
    
    return {
      type: 'move_drag_update',
      engine: 'drag_selection',
      currentPosition: this.dragCurrentPoint,
      dropTarget,
      canDrop: this.canDropAt(dropTarget)
    };
  }

  /**
   * 선택된 아이템들 가져오기
   * @returns {Array} - 선택된 아이템 배열
   */
  getSelectedItems() {
    if (!this.selectionRect) {
      return [];
    }

    const selectedBlocks = [];
    const blockElements = document.querySelectorAll('[data-block-id]');
    
    blockElements.forEach(element => {
      if (this.isElementInSelectionRect(element, this.selectionRect)) {
        selectedBlocks.push({
          type: 'block',
          id: element.getAttribute('data-block-id'),
          element: element
        });
      }
    });

    return selectedBlocks;
  }

  /**
   * 선택 영역 계산
   * @returns {Object} - 선택 영역 정보
   */
  calculateSelectionRect() {
    if (!this.dragStartPoint || !this.dragCurrentPoint) {
      return null;
    }

    const startX = this.dragStartPoint.x;
    const startY = this.dragStartPoint.y;
    const currentX = this.dragCurrentPoint.x;
    const currentY = this.dragCurrentPoint.y;

    return {
      left: Math.min(startX, currentX),
      top: Math.min(startY, currentY),
      right: Math.max(startX, currentX),
      bottom: Math.max(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY)
    };
  }

  /**
   * 두 점 사이의 거리 계산
   * @param {Object} point1 - 첫 번째 점
   * @param {Object} point2 - 두 번째 점
   * @returns {number} - 거리
   */
  calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 요소가 선택 영역 내에 있는지 확인
   * @param {Element} element - 확인할 요소
   * @param {Object} selectionRect - 선택 영역
   * @returns {boolean} - 포함 여부
   */
  isElementInSelectionRect(element, selectionRect) {
    const elementRect = element.getBoundingClientRect();
    
    // 완전히 포함되거나 교차하는 경우
    return !(elementRect.right < selectionRect.left || 
             elementRect.left > selectionRect.right || 
             elementRect.bottom < selectionRect.top || 
             elementRect.top > selectionRect.bottom);
  }

  /**
   * 선택된 요소인지 확인
   * @param {Element} element - 확인할 요소
   * @returns {boolean} - 선택 여부
   */
  isSelectedElement(element) {
    const blockId = this.manager.findBlockId(element);
    if (!blockId) return false;

    // 현재 선택된 블록인지 확인
    const selectionState = this.manager.getSelectionState();
    const selectedBlocks = selectionState.activeSelection?.selectedBlocks || [];
    
    return selectedBlocks.includes(blockId);
  }

  /**
   * 편집 가능한 영역인지 확인
   * @param {Element} element - 확인할 요소
   * @returns {boolean} - 편집 가능 여부
   */
  isEditableArea(element) {
    return element.contentEditable === 'true' ||
           element.closest('[contenteditable="true"]') ||
           element.closest('.ProseMirror') ||
           element.tagName === 'INPUT' ||
           element.tagName === 'TEXTAREA';
  }

  /**
   * 드롭 대상 찾기
   * @param {Object} point - 드롭 위치
   * @returns {Object|null} - 드롭 대상 정보
   */
  findDropTarget(point) {
    const elementAtPoint = document.elementFromPoint(point.x, point.y);
    if (!elementAtPoint) return null;

    const blockElement = elementAtPoint.closest('[data-block-id]');
    if (!blockElement) return null;

    const blockId = blockElement.getAttribute('data-block-id');
    const blockRect = blockElement.getBoundingClientRect();
    
    // 드롭 위치 결정 (위/아래)
    const relativeY = point.y - blockRect.top;
    const position = relativeY < blockRect.height / 2 ? 'before' : 'after';

    return {
      blockId,
      element: blockElement,
      position,
      rect: blockRect
    };
  }

  /**
   * 특정 위치에 드롭 가능한지 확인
   * @param {Object} dropTarget - 드롭 대상
   * @returns {boolean} - 드롭 가능 여부
   */
  canDropAt(dropTarget) {
    if (!dropTarget) return false;

    // 자기 자신에게는 드롭 불가
    const draggedBlocks = this.getDraggedBlocks();
    return !draggedBlocks.includes(dropTarget.blockId);
  }

  /**
   * 현재 드래그 중인 블록들 가져오기
   * @returns {Array} - 드래그 중인 블록 ID 배열
   */
  getDraggedBlocks() {
    const selectionState = this.manager.getSelectionState();
    return selectionState.activeSelection?.selectedBlocks || [];
  }

  /**
   * 드래그 취소
   * @returns {Object} - 취소 결과
   */
  cancelDrag() {
    this.manager.log('[DragSelection] Canceling drag');

    const result = {
      type: 'drag_canceled',
      engine: 'drag_selection',
      wasDragging: this.isDragging
    };

    this.reset();
    return result;
  }

  /**
   * 현재 상태 가져오기
   * @returns {Object} - 드래그 상태
   */
  getState() {
    return {
      isDragging: this.isDragging,
      dragMode: this.dragMode,
      dragStartPoint: this.dragStartPoint,
      dragCurrentPoint: this.dragCurrentPoint,
      selectionRect: this.selectionRect
    };
  }

  /**
   * 상태 초기화
   */
  reset() {
    this.isDragging = false;
    this.dragStartPoint = null;
    this.dragCurrentPoint = null;
    this.selectionRect = null;
    this.dragMode = 'selection';
  }
}