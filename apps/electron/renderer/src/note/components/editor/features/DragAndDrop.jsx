/**
 * 드래그 앤 드롭 시스템
 * 
 * @description 블록 재정렬과 파일 업로드를 위한 고급 드래그 앤 드롭 기능
 * @author AI Assistant
 * @version 1.0.0
 */

import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

/**
 * 드래그 앤 드롭 플러그인 생성
 */
export function createDragAndDropPlugin(onBlockMove, onFileUpload) {
  return new Plugin({
    state: {
      init() {
        return {
          dragging: false,
          dragPos: null,
          dropPos: null,
          dragElement: null
        };
      },
      apply(tr, value) {
        const meta = tr.getMeta(this);
        if (meta) {
          return { ...value, ...meta };
        }
        return value;
      }
    },
    props: {
      handleDOMEvents: {
        dragstart(view, event) {
          const { state } = view;
          const pos = view.posAtDOM(event.target, 0);
          const node = state.doc.nodeAt(pos);
          
          if (node && node.type.name === 'paragraph') {
            // 블록 드래그 시작
            event.dataTransfer.setData('text/plain', 'block');
            event.dataTransfer.effectAllowed = 'move';
            
            this.updateState(state, {
              dragging: true,
              dragPos: pos,
              dragElement: event.target
            });
            
            // 드래그 중인 요소 스타일링
            event.target.style.opacity = '0.5';
            return true;
          }
          
          return false;
        },
        
        dragover(view, event) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          
          const { state } = view;
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          
          if (pos !== null) {
            this.updateState(state, { dropPos: pos.pos });
            
            // 드롭 위치 표시
            this.showDropIndicator(view, pos.pos);
          }
          
          return true;
        },
        
        drop(view, event) {
          event.preventDefault();
          
          const { state } = view;
          const dragState = this.getState(state);
          
          if (dragState.dragging && dragState.dropPos !== null) {
            // 파일 드롭 처리
            if (event.dataTransfer.files.length > 0) {
              this.handleFileDrop(event.dataTransfer.files, dragState.dropPos, onFileUpload);
            } else {
              // 블록 이동 처리
              this.handleBlockMove(
                state, 
                view.dispatch, 
                dragState.dragPos, 
                dragState.dropPos, 
                onBlockMove
              );
            }
          }
          
          // 드래그 상태 초기화
          this.updateState(state, {
            dragging: false,
            dragPos: null,
            dropPos: null,
            dragElement: null
          });
          
          // 스타일 복원
          if (dragState.dragElement) {
            dragState.dragElement.style.opacity = '1';
          }
          
          return true;
        },
        
        dragend(view, event) {
          const { state } = view;
          const dragState = this.getState(state);
          
          // 드래그 상태 초기화
          this.updateState(state, {
            dragging: false,
            dragPos: null,
            dropPos: null,
            dragElement: null
          });
          
          // 스타일 복원
          if (dragState.dragElement) {
            dragState.dragElement.style.opacity = '1';
          }
          
          return true;
        }
      }
    },
    view() {
      return {
        update: (view, prevState) => {
          // 드롭 인디케이터 업데이트
          const dragState = this.getState(view.state);
          if (dragState.dropPos !== null) {
            this.showDropIndicator(view, dragState.dropPos);
          }
        }
      };
    }
  });
}

/**
 * 블록 이동 처리
 */
function handleBlockMove(state, dispatch, fromPos, toPos, onBlockMove) {
  if (fromPos === toPos) return;
  
  const fromNode = state.doc.nodeAt(fromPos);
  const toNode = state.doc.nodeAt(toPos);
  
  if (!fromNode || !toNode) return;
  
  // 트랜잭션 생성
  let tr = state.tr;
  
  // 원본 노드 삭제
  tr = tr.delete(fromPos, fromPos + fromNode.nodeSize);
  
  // 새 위치에 삽입
  tr = tr.insert(toPos, fromNode);
  
  // 트랜잭션 적용
  dispatch(tr);
  
  // 콜백 호출
  if (onBlockMove) {
    onBlockMove({
      fromPos,
      toPos,
      node: fromNode
    });
  }
}

/**
 * 파일 드롭 처리
 */
function handleFileDrop(files, dropPos, onFileUpload) {
  if (!onFileUpload) return;
  
  const fileList = Array.from(files);
  
  fileList.forEach(file => {
    onFileUpload({
      file,
      position: dropPos,
      type: file.type,
      name: file.name,
      size: file.size
    });
  });
}

/**
 * 드롭 인디케이터 표시
 */
function showDropIndicator(view, pos) {
  const { state } = view;
  const node = state.doc.nodeAt(pos);
  
  if (!node) return;
  
  // 기존 인디케이터 제거
  const existingIndicator = document.querySelector('.drop-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // 새 인디케이터 생성
  const indicator = document.createElement('div');
  indicator.className = 'drop-indicator';
  indicator.style.cssText = `
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #3b82f6;
    border-radius: 1px;
    pointer-events: none;
    z-index: 1000;
    animation: drop-indicator-pulse 1s infinite;
  `;
  
  // 위치 계산
  const coords = view.coordsAtPos(pos);
  indicator.style.top = `${coords.top}px`;
  
  // DOM에 추가
  view.dom.parentElement.appendChild(indicator);
  
  // 애니메이션 CSS 추가
  if (!document.querySelector('#drop-indicator-styles')) {
    const style = document.createElement('style');
    style.id = 'drop-indicator-styles';
    style.textContent = `
      @keyframes drop-indicator-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * 드래그 앤 드롭 UI 컴포넌트
 */
export const DragAndDropZone = ({ 
  children, 
  onBlockMove, 
  onFileUpload, 
  isDragOver = false 
}) => {
  return (
    <div 
      className={`drag-drop-zone ${isDragOver ? 'drag-over' : ''}`}
      style={{
        position: 'relative',
        minHeight: '100px',
        border: isDragOver ? '2px dashed #3b82f6' : '2px dashed transparent',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
      }}
    >
      {children}
      
      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#3b82f6',
            fontSize: '16px',
            fontWeight: 500,
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          여기에 파일을 드롭하세요
        </div>
      )}
    </div>
  );
};

/**
 * 드래그 가능한 블록 래퍼
 */
export const DraggableBlock = ({ 
  children, 
  blockId, 
  isDragging = false 
}) => {
  return (
    <div
      className={`draggable-block ${isDragging ? 'dragging' : ''}`}
      draggable={true}
      data-block-id={blockId}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* 드래그 핸들 */}
      <div
        className="drag-handle"
        style={{
          position: 'absolute',
          left: '-20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          opacity: 0,
          transition: 'opacity 0.2s ease',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '0';
        }}
      >
        ⋮⋮
      </div>
      
      {children}
    </div>
  );
}; 