/**
 * 개별 블록 컴포넌트
 * 
 * @description 드래그 앤 드롭, 선택, 편집 기능을 지원하는 블록 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useRef, useEffect, useState, memo, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { nanoid } from 'nanoid';
import { TextBlock } from './blocks/plus/TextBlock';
import { HeadingBlock } from './blocks/plus/HeadingBlock';
import { ListBlock } from './blocks/plus/ListBlock';
import { CodeBlock } from './blocks/plus/CodeBlock';
import { QuoteBlock } from './blocks/plus/QuoteBlock';
import { DividerBlock } from './blocks/plus/DividerBlock';
import { ImageBlock } from './blocks/plus/ImageBlock';
import PlusButton from './blocks/PlusButton';
import { BlockMenu } from './BlockMenu';
import GalleryBlock from './blocks/plus/GalleryBlock';
import BoardBlock from './blocks/plus/BoardBlock';
import ToggleBlock from './blocks/plus/ToggleBlock';
import ButtonBlock from './blocks/plus/ButtonBlock';
import AlertBlock from './blocks/plus/AlertBlock';
import ProgressBarBlock from './blocks/plus/ProgressBarBlock';
import RatingBlock from './blocks/plus/RatingBlock';
import MathBlock from './blocks/plus/MathBlock';
import MermaidBlock from './blocks/plus/MermaidBlock';
import ChartBlock from './blocks/plus/ChartBlock';
import TimelineBlock from './blocks/plus/TimelineBlock';
import ProfileBlock from './blocks/plus/ProfileBlock';
import PollBlock from './blocks/plus/PollBlock';
import CommentBlock from './blocks/plus/CommentBlock';
import ReminderBlock from './blocks/plus/ReminderBlock';
import TagBlock from './blocks/plus/TagBlock';
import CustomHTMLBlock from './blocks/plus/CustomHTMLBlock';
import PDFEmbedBlock from './blocks/plus/PDFEmbedBlock';
import WebEmbedBlock from './blocks/plus/WebEmbedBlock';
import FileBlock from './blocks/plus/FileBlock';
import AudioBlock from './blocks/plus/AudioBlock';
import VideoBlock from './blocks/plus/VideoBlock';
import TableBlock from './blocks/plus/TableBlock';
import PageBlock from './blocks/plus/PageBlock';
import ColumnBlock from './blocks/plus/ColumnBlock';
import CalendarBlock from './blocks/plus/CalendarBlock';
import SidebarLayout from './blocks/plus/designlayout/SidebarLayout';
import TabLayout from './blocks/plus/designlayout/TabLayout';
import AccordionLayout from './blocks/plus/designlayout/AccordionLayout';
import GridLayout from './blocks/plus/designlayout/GridLayout';
import DesignTimelineBlock from './blocks/plus/designlayout/TimelineBlock';

// 새로운 드래그 컴포넌트들
import { 
  BlockDragHandle, 
  BlockDropZone, 
  useBlockDrag,
  DRAG_TYPES 
} from './blocks/drag';

// 통합 상호작용 시스템
import { useInteractionContext } from './selection/interactions/InteractionContext.jsx';

// 성능 최적화 유틸리티
import { rafThrottle, debounce } from './utils/performanceUtils';
import usePerformanceMonitor from './hooks/usePerformanceMonitor';
import BlockMoreMenu from './blocks/more/BlockMoreMenu';
import BlockColorPopover from './blocks/more/BlockColorPopover';

const BLOCK_TYPE = 'block';

// 블록 타입별 컴포넌트 매핑 (정적 객체)
const BLOCK_COMPONENTS = {
  text: TextBlock,
  heading1: HeadingBlock,
  heading2: HeadingBlock,
  heading3: HeadingBlock,
  bulletList: ListBlock,
  numberedList: ListBlock,
  checkList: ListBlock,
  code: CodeBlock,
  quote: QuoteBlock,
  divider: DividerBlock,
  image: ImageBlock,
  // 신규 블록 타입 매핑
  video: VideoBlock,
  audio: AudioBlock,
  file: FileBlock,
  column: ColumnBlock,
  gallery: GalleryBlock,
  table: TableBlock,
  chart: ChartBlock,
  timeline: TimelineBlock,
  board: BoardBlock,
  progressBar: ProgressBarBlock,
  rating: RatingBlock,
  toggle: ToggleBlock,
  button: ButtonBlock,
  poll: PollBlock,
  comment: CommentBlock,
  reminder: ReminderBlock,
  tag: TagBlock,
  alert: AlertBlock,
  webEmbed: WebEmbedBlock,
  pdfEmbed: PDFEmbedBlock,
  mermaid: MermaidBlock,
  math: MathBlock,
  customHTML: CustomHTMLBlock,
  profile: ProfileBlock,
  page: PageBlock,
  calendar: CalendarBlock,
  sidebarLayout: SidebarLayout,
  tabLayout: TabLayout,
  accordionLayout: AccordionLayout,
  gridLayout: GridLayout,
  timelineLayout: DesignTimelineBlock,
};

const BlockComponent = ({
  block,
  index,
  isSelected,
  selectedBlocks: selectedBlocksFromProps = [],
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
  onFocus,
  onSelect,
  onEnterKey,
  onBackspaceKey,
  onSelectionChange,
  onAdd,
  readOnly = false,
  placeholder = "",
  className = "",
  textFormat = {},
  onFormatChange,
  setIsColumnInsert, // 추가
  setBlocks, // 추가
  blocks = [] // 추가 - blocks 배열
}) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isTypeChangeMode, setIsTypeChangeMode] = useState(false);
  const plusButtonRef = useRef(null);
  const menuButtonRef = useRef(null);

  // 성능 모니터링 (개발 모드에서만)
  usePerformanceMonitor('Block', {
    enabled: process.env.NODE_ENV === 'development' && block.type !== 'text', // 텍스트 블록은 제외
    logRenderTime: true,
    logMemoryUsage: false,
    logRerenderCount: false,
    threshold: 50 // 임계값을 50ms로 증가 (복잡한 블록용)
  });

  // 통합 상호작용 시스템
  const {
    executeMerge,
    executeConvert,
    executeSplit,
    isBlockSelected: isInteractionSelected,
    addSelectedBlock,
    removeSelectedBlock,
    setTargetBlock,
    canMerge,
    canConvert,
    canSplit,
    interactionFeedback,
    blockInteraction
  } = useInteractionContext();

  // 드래그 관련 함수들 (props로 받은 selectedBlocks 사용, 메모이제이션)
  const isBlockSelected = useCallback((blockId) => 
    selectedBlocksFromProps.some(block => block.id === blockId), 
    [selectedBlocksFromProps]
  );
  
  const handleDragStart = useCallback((item) => {
    console.log('Drag start:', item);
  }, []);
  
  const handleDragEnd = useCallback((item, monitor) => {
    console.log('Drag end:', item, monitor);
  }, []);
  
  const handleDrop = useCallback((dropResult) => {
    console.log('Drop:', dropResult);
  }, []);

  // 블록 컴포넌트 선택 (메모이제이션)
  const SelectedBlockComponent = useMemo(() => 
    BLOCK_COMPONENTS[block.type] || TextBlock, 
    [block.type]
  );

  // 블록 클릭 처리 (메모이제이션)
  const handleBlockClick = useCallback((e) => {
    e.stopPropagation();
    
    // 텍스트 에디터 영역 클릭인지 확인
    const isTextEditorClick = e.target.closest('.prosemirror-text-editor') || 
                             e.target.closest('[contenteditable="true"]');
    
    if (e.ctrlKey || e.metaKey) {
      onSelect(block.id, true);
    } else if (!isSelected) {
      onSelect(block.id, false);
    }
    
    // 포커스 설정
    onFocus(block.id);
    
    // 텍스트 에디터 클릭이 아닌 경우에만 추가 포커스 처리
    if (!isTextEditorClick && e.currentTarget) {
      // 블록 내의 텍스트 에디터에 포커스 설정
      setTimeout(() => {
        const textEditor = e.currentTarget?.querySelector('.prosemirror-text-editor');
        if (textEditor) {
          textEditor.focus();
          
          // 커서를 끝으로 이동
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(textEditor);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }, 10);
    }
  }, [block.id, isSelected, onSelect, onFocus]);

  // 블록 더블클릭 처리 (메모이제이션)
  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  // 블록 업데이트 (메모이제이션)
  const handleUpdate = useCallback((updates) => {
    console.log('Block update:', updates);
    
    // 블록 타입이 변경되는 경우 포커스 유지
    if (updates.type && updates.type !== block.type) {
      
      // 블록 업데이트
      onUpdate(block.id, updates);
      
      // 간단한 포커스 유지
      setTimeout(() => {
        const newTextEditor = ref.current?.querySelector('.prosemirror-text-editor');
        if (newTextEditor) {
          console.log('Restoring focus to new editor');
          newTextEditor.focus();
        }
      }, 10);
    } else {
      onUpdate(block.id, updates);
    }
  }, [block.id, block.type, onUpdate]);

  // 키보드 이벤트 처리 (메모이제이션)
  const handleKeyDown = useCallback((e) => {
    if (readOnly) return;

    switch (e.key) {
      case 'Enter':
        if (!e.shiftKey) {
          e.preventDefault();
          onEnterKey(block.id);
        }
        break;
      case 'Backspace':
        if (block.content === '' && e.target.textContent === '') {
          e.preventDefault();
          onBackspaceKey(block.id);
        }
        break;
      case '/':
        // 슬래시 키로 타입 변경 모드로 플러스 버튼 메뉴 열기
        const isEmptyContent = () => {
          if (block.content === '' || block.content === null || block.content === undefined) {
            return true;
          }
          
          // ProseMirror JSON 구조인 경우 빈 상태 체크
          if (typeof block.content === 'object' && block.content.type === 'doc') {
            if (!block.content.content || block.content.content.length === 0) {
              return true;
            }
            
            // paragraph가 하나만 있고 내용이 없는 경우
            if (block.content.content.length === 1 && 
                block.content.content[0].type === 'paragraph' &&
                (!block.content.content[0].content || block.content.content[0].content.length === 0)) {
              return true;
            }
          }
          
          return false;
        };
        
        if (isEmptyContent()) {
          e.preventDefault();
          setIsTypeChangeMode(true);
          // PlusButton 클릭 대신 직접 메뉴 열기 처리
          if (plusButtonRef.current) {
            // PlusButton의 setOpen(true) 호출을 위해 클릭 이벤트 생성
            const clickEvent = new Event('click', { bubbles: true });
            plusButtonRef.current.dispatchEvent(clickEvent);
          }
        }
        break;
    }
  }, [readOnly, block.content, block.id, onEnterKey, onBackspaceKey]);

  // 메뉴 버튼 클릭 (메모이제이션)
  const handleMenuClick = useCallback((e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  }, [showMenu]);

  // 복제 처리 (메모이제이션)
  const handleDuplicate = useCallback(() => {
    onDuplicate(block.id);
    setShowMenu(false);
  }, [block.id, onDuplicate]);

  // 삭제 처리 (메모이제이션)
  const handleDelete = useCallback(() => {
    onDelete(block.id);
    setShowMenu(false);
  }, [block.id, onDelete]);

  // 플러스 메뉴 열기/닫기 처리 (메모이제이션)
  const handleMenuOpenChange = useCallback((open) => {
    setIsPlusMenuOpen(open);
    if (!open) {
      setIsTypeChangeMode(false);
    }
  }, []);

  // 열블록 그룹의 마지막 인덱스를 찾는 헬퍼 함수
  const findColumnGroupEnd = useCallback((blocks, startIndex, totalColumns) => {
    if (!blocks || !Array.isArray(blocks)) return startIndex;
    
    let groupEndIndex = startIndex;
    for (let i = startIndex; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      if (currentBlock?.metadata?.isColumnBlock && 
          currentBlock?.metadata?.totalColumns === totalColumns) {
        groupEndIndex = i;
      } else {
        break;
      }
    }
    return groupEndIndex;
  }, []);

  // 블록 타입 변경 처리 (메모이제이션)
  const handleTypeChange = useCallback((newType, columnCount) => {
    if (newType === 'column' && columnCount && setBlocks) {
      // 열 블록 변환: 기존 블록을 삭제하지 않고 직접 교체
      setBlocks(prev => {
        const idx = prev.findIndex(b => b.id === block.id);
        if (idx === -1) return prev;
        
        const newBlocks = [...prev];
        const currentBlock = newBlocks[idx];
        
        // 현재 블록이 열블록 내부에 있는지 확인
        const isInColumnBlock = currentBlock?.metadata?.isColumnBlock === true;
        let replaceStartIndex = idx;
        let replaceCount = 1;
        
        if (isInColumnBlock) {
          // 열블록 내부에서 변환하는 경우, 현재 열블록 그룹 전체를 교체
          const currentTotalColumns = currentBlock.metadata.totalColumns;
          
          // 열블록 그룹의 시작점 찾기
          let groupStartIndex = idx;
          for (let i = idx - 1; i >= 0; i--) {
            const prevBlock = newBlocks[i];
            if (prevBlock?.metadata?.isColumnBlock && 
                prevBlock?.metadata?.totalColumns === currentTotalColumns) {
              groupStartIndex = i;
            } else {
              break;
            }
          }
          
          // 열블록 그룹의 끝점 찾기
          const groupEndIndex = findColumnGroupEnd(newBlocks, groupStartIndex, currentTotalColumns);
          
          replaceStartIndex = groupStartIndex;
          replaceCount = groupEndIndex - groupStartIndex + 1;
        }
        
        const columnBlocks = [];
        
        // columnCount만큼 텍스트 블록 생성
        for (let i = 0; i < columnCount; i++) {
          columnBlocks.push({
            id: nanoid(),
            type: 'text',
            content: '',
            focused: i === 0, // 첫 번째 블록에만 포커스
            metadata: { 
              isColumnBlock: true, 
              columnIndex: i, 
              totalColumns: columnCount 
            }
          });
        }
        
        // 기존 블록(들)을 새로운 열블록들로 교체
        newBlocks.splice(replaceStartIndex, replaceCount, ...columnBlocks);
        
        // 첫 번째 열블록에 포커스 설정
        setTimeout(() => {
          const firstColumnBlock = columnBlocks[0];
          if (firstColumnBlock) {
            const firstBlockElement = document.querySelector(`[data-block-id="${firstColumnBlock.id}"]`);
            if (firstBlockElement) {
              const input = firstBlockElement.querySelector('[contenteditable="true"]');
              if (input) {
                input.focus();
                // 커서를 시작 위치로 설정
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(input);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          }
        }, 10);
        
        return newBlocks;
      });
    } else {
      onUpdate(block.id, { type: newType });
    }
  }, [block.id, onUpdate, setBlocks, findColumnGroupEnd]);

  // 드래그 타입 결정 (메모이제이션)
  const getDragType = useMemo(() => {
    if (isBlockSelected(block.id) && selectedBlocksFromProps.length > 1) {
      return DRAG_TYPES.MULTIPLE;
    }
    return DRAG_TYPES.SINGLE;
  }, [isBlockSelected, block.id, selectedBlocksFromProps.length]);

  // 드롭 처리 (메모이제이션)
  const handleDropResult = useCallback(async (dropResult) => {
    console.log('Block drop result:', dropResult);
    
    if (dropResult.item.dragType === 'merge') {
      // 새로운 통합 병합 시스템 사용
      const sourceBlocks = dropResult.item.blocks || [dropResult.item.block];
      const targetBlock = block;
      
      console.log('🔗 Attempting merge:', { sourceBlocks, targetBlock });
      
      // 통합 상호작용 시스템으로 직접 병합 실행
      try {
        const result = await blockInteraction.mergeBlocks(sourceBlocks, targetBlock, {
          dropPosition: dropResult.dropPosition
        });
        
        if (result?.success || result?.result === 'success') {
          console.log('✅ 블록 병합 성공:', result);
        } else {
          console.warn('⚠️ 블록 병합 실패:', result?.error || 'Unknown error');
        }
      } catch (error) {
        console.error('❌ 병합 중 오류:', error);
      }
      
    } else if (dropResult.item.dragType === 'multiple') {
      // 다중 블록 이동 처리 (기존 로직 유지)
      const selectedBlocks = dropResult.item.blocks;
      const targetIndex = dropResult.targetIndex;
      // 다중 블록의 경우 첫 번째 선택된 블록의 인덱스를 찾아야 함
      const sourceIndex = dropResult.item.sourceIndex || 
                         (selectedBlocks && selectedBlocks.length > 0 ? selectedBlocks[0].index : index);
      
      console.log('📦 Moving multiple blocks:', { sourceIndex, targetIndex, selectedBlocks });
      
      if (onMove && selectedBlocks && selectedBlocks.length > 0 && sourceIndex !== targetIndex) {
        onMove(sourceIndex, targetIndex, selectedBlocks);
      }
      
    } else {
      // 단일 블록 이동 처리 (기존 로직 유지)
      const sourceIndex = dropResult.item.index || dropResult.item.sourceIndex;
      const targetIndex = dropResult.targetIndex;
      
      console.log('📄 Moving single block:', { sourceIndex, targetIndex });
      
      if (onMove && sourceIndex !== targetIndex) {
        onMove(sourceIndex, targetIndex);
      }
    }
  }, [onMove, blockInteraction, block]);

  return (
    <BlockDropZone
      block={block}
      index={index}
      onDrop={handleDropResult}
      isVisible={!readOnly}
    >
      <div
        ref={ref}
        data-block-id={block.id}
        className={`
          block-wrapper group relative
          ${isSelected ? 'selected' : ''}
          py-1 mb-0.5 rounded-lg
          ${className}
        `}
        style={
          typeof block.metadata?.blockColor === 'object' && block.metadata?.blockColor?.type === 'dot'
            ? {
                backgroundColor: block.metadata.blockColor.bgColor,
                backgroundImage: `radial-gradient(${block.metadata.blockColor.dotColor} 2px, transparent 2px)`,
                backgroundSize: `${block.metadata.blockColor.size}px ${block.metadata.blockColor.size}px`,
                backgroundRepeat: 'repeat',
                opacity: block.metadata.blockColor.alpha ?? 1
              }
            : typeof block.metadata?.blockColor === 'object' && block.metadata?.blockColor?.type === 'gradientWithOpacity'
            ? {
                position: 'relative'
              }
            : {
                background: block.metadata?.blockColor || undefined
              }
        }
        onMouseEnter={useCallback(() => setIsHovered(true), [])}
        onMouseMove={useCallback(
          rafThrottle((e) => {
            // 마우스 움직임 감지 - 타이핑 중에도 움직이면 버튼 표시
            const newPos = { x: e.clientX, y: e.clientY };
            const distance = Math.sqrt(
              Math.pow(newPos.x - mousePosition.x, 2) + 
              Math.pow(newPos.y - mousePosition.y, 2)
            );
            
            // 마우스가 5px 이상 움직이면 타이핑 상태 해제
            if (distance > 5 && isTyping) {
              setIsTyping(false);
            }
            
            setMousePosition(newPos);
            setIsHovered(true);
          }),
          [mousePosition, isTyping]
        )}
        onMouseLeave={useCallback(() => {
          // 플러스 메뉴가 열려 있으면 hover 상태 유지
          if (!showMenu && !isPlusMenuOpen) {
            setIsHovered(false);
          }
        }, [showMenu, isPlusMenuOpen])}
        onClick={handleBlockClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
      >
        {/* 그라데이션 배경용 의사 요소 */}
        {typeof block.metadata?.blockColor === 'object' && block.metadata?.blockColor?.type === 'gradientWithOpacity' && (
          <div 
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              background: block.metadata.blockColor.gradient,
              opacity: block.metadata.blockColor.opacity ?? 1,
              zIndex: -1
            }}
          />
        )}

        {/* 왼쪽 컨트롤 (플러스 + 드래그 핸들) */}
        {!readOnly && (
          <div 
            className={`
              absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 flex items-center space-x-1
              transition-opacity duration-150
              ${(isHovered || isSelected) && !isTyping ? 'opacity-100' : 'opacity-0'}
            `}
            style={{ 
              paddingRight: '8px',
              pointerEvents: 'auto' // opacity가 0이어도 클릭 가능하도록 설정
            }}
          >
            {/* 플러스 버튼 */}
            <PlusButton 
              ref={plusButtonRef}
              onAdd={onAdd} 
              index={index} 
              onMenuOpenChange={handleMenuOpenChange}
              isTypeChangeMode={isTypeChangeMode}
              onTypeChange={handleTypeChange}
              block={block}
              blocks={blocks}
            />
            
            {/* 새로운 드래그 핸들 */}
            <BlockDragHandle
              block={block}
              index={index}
              isMultiSelect={isBlockSelected(block.id)}
              selectedBlocks={selectedBlocksFromProps}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              dragType={getDragType}
              isVisible={true}
            />
          </div>
        )}

        {/* 블록 콘텐츠 */}
        <div className="block-content relative">
          <SelectedBlockComponent
            block={block}
            onUpdate={handleUpdate}
            onFocus={() => onFocus(block.id)}
            onAdd={onAdd}
            onDelete={onDelete}
            index={index}
            readOnly={readOnly}
            placeholder={placeholder}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
            onSelectionChange={onSelectionChange}
            onStartTyping={setIsTyping}
            textFormat={textFormat}
            onFormatChange={onFormatChange}
          />
        </div>

        {/* 더보기 버튼 (블록 밖 오른쪽에 표시) */}
        {isHovered && !isTyping && !readOnly && (
          <div 
            className={`
              absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 flex items-center space-x-1
              transition-opacity duration-150
              ${(isHovered || isSelected) ? 'opacity-100' : 'opacity-0'}
            `}
            style={{ paddingLeft: '8px' }}
          >
            <button
              ref={menuButtonRef}
              onClick={handleMenuClick}
              className="
                menu-button w-6 h-6 flex items-center justify-center
                text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200
                hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600
                transition-colors duration-150 shadow-sm
              "
              title="블록 메뉴"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
          </div>
        )}

        {/* 더보기 메뉴 오버레이 (Portal) */}
        {showMenu && !readOnly && ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9998,
              background: 'transparent',
              pointerEvents: 'none', // 오버레이는 클릭 이벤트를 받지 않음
            }}
            onClick={() => setShowMenu(false)}
          />,
          document.body
        )}
        {/* 더보기 메뉴 (BlockMoreMenu로 교체) */}
        <BlockMoreMenu
          show={showMenu}
          setShow={setShowMenu}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          anchorRef={menuButtonRef}
        >
          <BlockColorPopover 
            currentBlockColor={block.metadata?.blockColor}
            onColorSelect={color => {
              onUpdate(block.id, {
                ...block,
                metadata: { ...block.metadata, blockColor: color }
              });
            }} 
          />
        </BlockMoreMenu>
      </div>
    </BlockDropZone>
  );
};

// 성능 최적화를 위한 메모이제이션
export const Block = memo(BlockComponent, (prevProps, nextProps) => {
  // 블록 내용이나 선택 상태가 변경된 경우에만 리렌더링
  const blockChanged = 
    prevProps.block.id !== nextProps.block.id ||
    prevProps.block.content !== nextProps.block.content ||
    prevProps.block.type !== nextProps.block.type ||
    JSON.stringify(prevProps.block.metadata) !== JSON.stringify(nextProps.block.metadata);
    
  const selectionChanged = 
    prevProps.isSelected !== nextProps.isSelected ||
    prevProps.selectedBlocks.length !== nextProps.selectedBlocks.length;
    
  const propsChanged = 
    prevProps.readOnly !== nextProps.readOnly ||
    prevProps.index !== nextProps.index ||
    prevProps.className !== nextProps.className;
    
  // 변경사항이 없으면 리렌더링 방지
  return !blockChanged && !selectionChanged && !propsChanged;
});