/**
 * 노션 스타일 블록 에디터
 * 
 * @description 드래그 앤 드롭, 키보드 단축키, 슬래시 명령어를 지원하는 블록 기반 에디터
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect, useMemo, useContext, forwardRef, useImperativeHandle } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { nanoid } from 'nanoid';
import { Block } from './Block';
import { BlockSelector } from './BlockSelector';
import { SlashCommand } from './SlashCommand';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUndoRedo } from './hooks/useUndoRedo';
import { SelectionProvider, SelectionContext } from './selection/context/SelectionContext.jsx';
import { BlockDragProvider, DragLayer } from './blocks/drag';
import { InteractionProvider } from './selection/interactions/InteractionContext.jsx';
import './BlockEditor.css';

export const BlockEditor = forwardRef(({ 
  initialBlocks = [], 
  onChange, 
  onSave,
  onSelectionChange,
  onSelectionCleared,
  readOnly = false,
  placeholder = "내용을 입력하세요...",
  selectedBlocks,
  setSelectedBlocks,
  textFormat = {},
  onFormatChange
}, ref) => {
  const [blocks, setBlocks] = useState(() => {
    if (initialBlocks.length > 0) {
      return initialBlocks;
    }
    return [{ id: nanoid(), type: 'text', content: '', focused: false }];
  });

  // 외부에서 호출할 수 있는 메서드들 노출
  useImperativeHandle(ref, () => ({
    focusFirstBlock: () => {
      if (blocks.length > 0) {
        const firstBlockId = blocks[0].id;
        setCurrentBlockId(firstBlockId);
        // 첫 번째 블록에 포커스 설정
        setTimeout(() => {
          const firstBlockElement = document.querySelector(`[data-block-id="${firstBlockId}"]`);
          if (firstBlockElement) {
            const editor = firstBlockElement.querySelector('[contenteditable="true"], input, textarea');
            if (editor) {
              editor.focus();
            }
          }
        }, 0);
      }
    },
    setBlocks: (newBlocks) => {
      setBlocks(newBlocks);
    }
  }), [blocks]);
  const [currentBlockId, setCurrentBlockId] = useState(null);
  const [isClicking, setIsClicking] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidths, setResizeStartWidths] = useState([]);
  const [columnWidths, setColumnWidths] = useState({});
  const [resizingColumnId, setResizingColumnId] = useState(null);
  const [resizingColumnIndex, setResizingColumnIndex] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [currentMousePos, setCurrentMousePos] = useState(null);
  const [isColumnInsert, setIsColumnInsert] = useState(false);

  const { selection, setSelection } = useContext(SelectionContext);

  // 선택된 텍스트 변경 시 상위 컴포넌트에 전달
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selection);
    }
  }, [selection, onSelectionChange]);
  
  const editorRef = useRef(null);
  const { undo, redo, saveState } = useUndoRedo(blocks, setBlocks);
  const saveStateTimeoutRef = useRef(null);
  const batchOperationTimeoutRef = useRef(null);

  // 마우스 좌표를 요소의 상대 좌표로 변환하는 함수
  const getRelativePosition = useCallback((clientX, clientY) => {
    if (!editorRef.current) return { x: 0, y: 0 };
    const rect = editorRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // 초기 상태를 히스토리에 저장
  useEffect(() => {
    if (blocks.length > 0) {
      saveState();
    }
  }, []); // 마운트 시 한 번만 실행

  // 블록 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    if (onChange) {
      onChange(blocks);
    }
    // 블록이 바뀌면 선택도 초기화
    if (setSelectedBlocks) {
      setSelectedBlocks([]);
    }
  }, [blocks, onChange, setSelectedBlocks]);

  // initialBlocks가 변경될 때 처리 (마운트 시에만)
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized && initialBlocks.length > 0) {
      setBlocks(initialBlocks);
      setIsInitialized(true);
    }
  }, [initialBlocks, isInitialized]);

  // 빈 블록 상태 처리
  useEffect(() => {
    if (blocks.length === 0 && !isColumnInsert) {
      // 빈 배열이고 현재 블록도 없으면 기본 블록 생성
      setBlocks([{ id: nanoid(), type: 'text', content: '', focused: false }]);
    }
  }, [blocks.length, isColumnInsert]);

  // Shift 키 이벤트 감지
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 열 그룹 수집 유틸리티 함수
  const collectColumnGroup = useCallback((blocks, startIndex) => {
    const startBlock = blocks[startIndex];
    if (!startBlock?.metadata?.isColumnBlock) return null;
    
    const { groupId, totalColumns } = startBlock.metadata;
    const columnBlocks = {};
    
    // 같은 그룹의 모든 블록을 열별로 수집
    for (let i = startIndex; i < blocks.length; i++) {
      const block = blocks[i];
      if (block?.metadata?.groupId === groupId) {
        const columnIndex = block.metadata.columnIndex;
        if (!columnBlocks[columnIndex]) {
          columnBlocks[columnIndex] = [];
        }
        columnBlocks[columnIndex].push({ block, index: i });
      } else {
        break;
      }
    }
    
    return {
      groupId,
      totalColumns,
      columns: columnBlocks
    };
  }, []);

  // Flexbox 구조를 위한 열 정렬
  const arrangeColumns = useCallback((columnGroup) => {
    const { totalColumns, columns } = columnGroup;
    const arrangedColumns = [];
    
    // 각 열을 순서대로 정렬
    for (let i = 0; i < totalColumns; i++) {
      if (columns[i]) {
        arrangedColumns.push({
          columnIndex: i,
          blocks: columns[i]
        });
      }
    }
    
    return arrangedColumns;
  }, []);

  // 블록 추가
  const addBlock = useCallback((type = 'text', content = null, index = null, metadata = {}) => {
    // 특수 블록 타입들은 열 블록 메타데이터를 명시적으로 false로 설정
    const specialBlockTypes = ['image', 'video', 'audio', 'file', 'divider', 'code', 'quote'];
    if (specialBlockTypes.includes(type)) {
      metadata = {
        ...metadata,
        isColumnBlock: false // 명시적으로 false로 설정
      };
    }
    
    const newBlock = {
      id: nanoid(),
      type,
      content,
      focused: false,
      metadata: { ...metadata }
    };
    // 새 페이지 블록일 경우 onCreatePage 콜백을 metadata에 저장
    if (type === 'page') {
      newBlock.metadata.onCreatePage = (title) => {
        // TODO: 실제 새 페이지 생성 로직 구현 (예: API 호출, 상태 갱신 등)
        alert(`새 페이지 생성: ${title}`);
      };
    }
    setBlocks(prev => {
      const newBlocks = [...prev];
      const insertIndex = index !== null ? index : newBlocks.length;
      newBlocks.splice(insertIndex, 0, newBlock);
      return newBlocks;
    });
    saveState();
    
    // 새 블록이 추가되면 해당 블록에 포커스 설정
    // 빈 블록인 경우에만 자동 포커스, 단 metadata.shouldFocus가 false인 경우 포커스하지 않음
    if (content === '' && metadata.shouldFocus !== false) {
      setTimeout(() => {
        const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`);
        if (newBlockElement) {
          const input = newBlockElement.querySelector('[contenteditable="true"]');
          if (input) {
            input.focus();
            
            // 커서를 시작 위치로 설정
            const range = document.createRange();
            const selection = window.getSelection();
            
            // 텍스트 노드가 있으면 첫 번째 텍스트 노드의 시작에 커서 설정
            if (input.firstChild && input.firstChild.nodeType === Node.TEXT_NODE) {
              range.setStart(input.firstChild, 0);
              range.setEnd(input.firstChild, 0);
            } else {
              // 텍스트 노드가 없으면 input 요소의 시작에 커서 설정
              range.setStart(input, 0);
              range.setEnd(input, 0);
            }
            
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }, 10);
    }
    
    return newBlock.id;
  }, [saveState]);

  // debounced saveState (텍스트 편집용)
  const debouncedSaveState = useCallback(() => {
    if (saveStateTimeoutRef.current) {
      clearTimeout(saveStateTimeoutRef.current);
    }
    saveStateTimeoutRef.current = setTimeout(() => {
      console.log('[BlockEditor] Debounced saveState triggered');
      saveState();
    }, 1000); // 1초 후 저장
  }, [saveState]);

  // batched saveState (연속 작업용 - 삭제, 이동 등)
  const batchedSaveState = useCallback(() => {
    if (batchOperationTimeoutRef.current) {
      clearTimeout(batchOperationTimeoutRef.current);
    }
    batchOperationTimeoutRef.current = setTimeout(() => {
      console.log('[BlockEditor] Batched saveState triggered');
      saveState();
    }, 100); // 100ms 후 저장 (연속 작업 묶기)
  }, [saveState]);

  // 블록 업데이트 (텍스트 편집은 debounce로 처리)
  const updateBlock = useCallback((id, updates) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
    
    // forceUpdate 플래그가 있으면 즉시 저장
    if (updates.forceUpdate) {
      console.log('[BlockEditor] Force update detected, saving immediately');
      saveState();
      return;
    }
    
    // 텍스트 content 변경인 경우 debounce 적용
    if (updates.content !== undefined) {
      debouncedSaveState();
    } else {
      // 다른 속성 변경(type 등)은 즉시 저장
      saveState();
    }
  }, [debouncedSaveState, saveState]);

  // 열블록 그룹 재조정 헬퍼 함수
  const adjustColumnGroups = useCallback((blocks) => {
    const adjustedBlocks = [...blocks];
    const processedGroups = new Set();
    
    for (let i = 0; i < adjustedBlocks.length; i++) {
      const block = adjustedBlocks[i];
      
      if (block?.metadata?.isColumnBlock && !processedGroups.has(i)) {
        const originalTotalColumns = block.metadata.totalColumns;
        
        // 현재 열블록 그룹 찾기
        const groupBlocks = [];
        const groupIndices = [];
        
        for (let j = i; j < adjustedBlocks.length; j++) {
          const currentBlock = adjustedBlocks[j];
          if (currentBlock?.metadata?.isColumnBlock && 
              currentBlock?.metadata?.totalColumns === originalTotalColumns) {
            groupBlocks.push(currentBlock);
            groupIndices.push(j);
            processedGroups.add(j);
          } else {
            break;
          }
        }
        
        // 열 개수가 1개면 일반 블록으로 변환
        if (groupBlocks.length === 1) {
          delete adjustedBlocks[groupIndices[0]].metadata.isColumnBlock;
          delete adjustedBlocks[groupIndices[0]].metadata.columnIndex;
          delete adjustedBlocks[groupIndices[0]].metadata.totalColumns;
        } else if (groupBlocks.length > 1) {
          // 열 인덱스와 총 개수 재조정
          groupBlocks.forEach((groupBlock, index) => {
            const blockIndex = groupIndices[index];
            adjustedBlocks[blockIndex] = {
              ...groupBlock,
              metadata: {
                ...groupBlock.metadata,
                columnIndex: index,
                totalColumns: groupBlocks.length
              }
            };
          });
        }
      }
    }
    
    return adjustedBlocks;
  }, []);

  // 블록 삭제
  const deleteBlock = useCallback((id) => {
    setBlocks(prev => {
      let newBlocks = prev.filter(block => block.id !== id);
      // 빈 에디터가 되면 기본 블록 추가
      if (newBlocks.length === 0) {
        return [{ id: nanoid(), type: 'text', content: '', focused: true }];
      }
      // 열블록 그룹 재조정
      newBlocks = adjustColumnGroups(newBlocks);
      return newBlocks;
    });
    batchedSaveState(); // 연속 삭제를 묶어서 저장
  }, [batchedSaveState, adjustColumnGroups]);

  // 선택된 블록들 삭제
  const deleteSelectedBlocks = useCallback(() => {
    if (selectedBlocks.length > 0) {
      setBlocks(prev => {
        let newBlocks = prev.filter(block => !selectedBlocks.includes(block.id));
        if (newBlocks.length === 0) {
          return [{ id: nanoid(), type: 'text', content: '', focused: true }];
        }
        // 열블록 그룹 재조정
        newBlocks = adjustColumnGroups(newBlocks);
        return newBlocks;
      });
      setSelectedBlocks([]);
      saveState(); // 다중 선택 삭제는 즉시 저장 (한 번의 액션)
    }
  }, [selectedBlocks, saveState, setBlocks, setSelectedBlocks, adjustColumnGroups]);

  // 블록 이동
  const moveBlock = useCallback((dragIndex, hoverIndex) => {
    console.log('Moving block:', { dragIndex, hoverIndex, totalBlocks: blocks.length });
    setBlocks(prev => {
      let newBlocks = [...prev];
      if (
        dragIndex < 0 ||
        dragIndex >= newBlocks.length ||
        hoverIndex < 0 ||
        hoverIndex > newBlocks.length
      ) {
        return newBlocks;
      }
      const draggedBlock = newBlocks[dragIndex];
      if (!draggedBlock) return newBlocks;
      
      // 이동되는 블록이 열블록인 경우 일반 블록으로 변환
      const movedBlock = { ...draggedBlock };
      if (movedBlock.metadata?.isColumnBlock) {
        movedBlock.metadata = { ...movedBlock.metadata };
        delete movedBlock.metadata.isColumnBlock;
        delete movedBlock.metadata.columnIndex;
        delete movedBlock.metadata.totalColumns;
      }
      
      newBlocks.splice(dragIndex, 1);
      newBlocks.splice(hoverIndex, 0, movedBlock);
      
      // 열블록 그룹 재조정 (원래 위치의 나머지 열블록들)
      newBlocks = adjustColumnGroups(newBlocks);
      
      console.log('New blocks order:', newBlocks.filter(Boolean).map(b => ({ id: b.id, type: b.type })));
      return newBlocks;
    });
    batchedSaveState(); // 드래그 중 연속 이동을 묶어서 저장
  }, [batchedSaveState, blocks.length, adjustColumnGroups]);

  // 다중 블록 이동
  const moveMultipleBlocks = useCallback((sourceIndex, targetIndex, selectedBlocks) => {
    console.log('Moving multiple blocks:', { sourceIndex, targetIndex, selectedBlocks });
    
    setBlocks(prev => {
      const newBlocks = [...prev];
      
      // 선택된 블록들의 인덱스 찾기 (유효한 인덱스만)
      const selectedIndices = selectedBlocks
        .map(block => newBlocks.findIndex(b => b.id === block.id))
        .filter(idx => idx !== -1)
        .sort((a, b) => a - b);
      console.log('Selected indices:', selectedIndices);
      
      // 선택된 블록들을 제거하고 열블록인 경우 일반 블록으로 변환
      const removedBlocks = [];
      for (let i = selectedIndices.length - 1; i >= 0; i--) {
        const index = selectedIndices[i];
        const removed = newBlocks.splice(index, 1)[0];
        if (removed) {
          // 이동되는 블록이 열블록인 경우 일반 블록으로 변환
          const movedBlock = { ...removed };
          if (movedBlock.metadata?.isColumnBlock) {
            movedBlock.metadata = { ...movedBlock.metadata };
            delete movedBlock.metadata.isColumnBlock;
            delete movedBlock.metadata.columnIndex;
            delete movedBlock.metadata.totalColumns;
          }
          removedBlocks.unshift(movedBlock);
        }
      }
      
      // 새 위치에 삽입
      const adjustedTargetIndex = targetIndex - selectedIndices.filter(i => i < targetIndex).length;
      newBlocks.splice(adjustedTargetIndex, 0, ...removedBlocks);
      
      // 열블록 그룹 재조정 (원래 위치의 나머지 열블록들)
      const finalBlocks = adjustColumnGroups(newBlocks);
      
      console.log('New blocks order after multiple move:', finalBlocks.map(b => ({ id: b.id, type: b.type })));
      return finalBlocks;
    });
    
    batchedSaveState();
  }, [batchedSaveState, adjustColumnGroups]);

  // 블록 복제
  const duplicateBlock = useCallback((id) => {
    const blockToDuplicate = blocks.find(block => block.id === id);
    if (blockToDuplicate) {
      const blockIndex = blocks.findIndex(block => block.id === id);
      addBlock(
        blockToDuplicate.type,
        blockToDuplicate.content,
        blockIndex + 1,
        blockToDuplicate.metadata // 메타데이터(색상 등)도 복제
      );
    }
  }, [blocks, addBlock]);



  // 블록 포커스 처리
  const handleBlockFocus = useCallback((blockId) => {
    setCurrentBlockId(blockId);
    setBlocks(prev => prev.map(block => ({
      ...block,
      focused: block.id === blockId
    })));
  }, []);

  // 블록 선택 처리
  const handleBlockSelect = useCallback((blockId, isMultiSelect = false) => {
    if (isMultiSelect) {
      setSelectedBlocks(prev => 
        prev.includes(blockId) 
          ? prev.filter(id => id !== blockId)
          : [...prev, blockId]
      );
    } else {
      setSelectedBlocks([blockId]);
    }
  }, [setSelectedBlocks]);

  // Enter 키 처리
  const handleEnterKey = useCallback((blockId) => {
    const blockIndex = blocks.findIndex(block => block.id === blockId);
    const currentBlock = blocks[blockIndex];
    
    // 열 블록에서 엔터를 치면 같은 열에 새 블록 추가
    if (currentBlock.metadata?.isColumnBlock) {
      const { columnIndex, totalColumns, groupId } = currentBlock.metadata;
      
      // 현재 블록이 리스트인 경우 같은 타입의 리스트 블록 생성
      let newBlockType = 'text';
      if (currentBlock.type === 'bulletList' || currentBlock.type === 'numberedList' || currentBlock.type === 'checkList') {
        newBlockType = currentBlock.type;
      }
      
      // 현재 열에 새 블록 추가
      const newBlockId = addBlock(newBlockType, null, blockIndex + 1, {
        isColumnBlock: true,
        columnIndex: columnIndex,
        totalColumns: totalColumns,
        groupId: groupId
      });
      
      // 새 블록에 포커스 설정
      setTimeout(() => {
        const newBlockElement = document.querySelector(`[data-block-id="${newBlockId}"]`);
        if (newBlockElement) {
          const input = newBlockElement.querySelector('[contenteditable="true"]');
          if (input) {
            input.focus();
            
            const range = document.createRange();
            const selection = window.getSelection();
            
            if (input.firstChild && input.firstChild.nodeType === Node.TEXT_NODE) {
              range.setStart(input.firstChild, 0);
              range.setEnd(input.firstChild, 0);
            } else {
              range.setStart(input, 0);
              range.setEnd(input, 0);
            }
            
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }, 10);
      return;
    }
    
    // 현재 블록이 리스트인 경우 같은 타입의 리스트 블록 생성
    let newBlockType = 'text';
    let metadata = {};
    
    if (currentBlock.type === 'bulletList' || currentBlock.type === 'numberedList' || currentBlock.type === 'checkList') {
      newBlockType = currentBlock.type;
    }
    
    // 현재 블록이 열 블록 내부에 있으면 메타데이터 상속
    if (currentBlock.metadata?.isColumnBlock) {
      metadata = {
        isColumnBlock: true,
        columnIndex: currentBlock.metadata.columnIndex,
        totalColumns: currentBlock.metadata.totalColumns,
        groupId: currentBlock.metadata.groupId
      };
    }
    
    const newBlockId = addBlock(newBlockType, null, blockIndex + 1, metadata);
    
    // 새 블록에 포커스 설정 (공통 함수로 분리 가능)
    setTimeout(() => {
      const newBlockElement = document.querySelector(`[data-block-id="${newBlockId}"]`);
      if (newBlockElement) {
        const input = newBlockElement.querySelector('[contenteditable="true"]');
        if (input) {
          input.focus();
          
          // 커서를 시작 위치로 설정
          const range = document.createRange();
          const selection = window.getSelection();
          
          // 텍스트 노드가 있으면 첫 번째 텍스트 노드의 시작에 커서 설정
          if (input.firstChild && input.firstChild.nodeType === Node.TEXT_NODE) {
            range.setStart(input.firstChild, 0);
            range.setEnd(input.firstChild, 0);
          } else {
            // 텍스트 노드가 없으면 input 요소의 시작에 커서 설정
            range.setStart(input, 0);
            range.setEnd(input, 0);
          }
          
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, 10);
  }, [blocks, addBlock]);

  // 백스페이스 키 처리
  const handleBackspaceKey = useCallback((blockId) => {
    const block = blocks.find(b => b.id === blockId);
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    
    if (block && block.content === '' && blocks.length > 1) {
      deleteBlock(blockId);
      
      // 이전 블록에 포커스
      if (blockIndex > 0) {
        const prevBlock = blocks[blockIndex - 1];
        setTimeout(() => {
          const prevBlockElement = document.querySelector(`[data-block-id="${prevBlock.id}"]`);
          if (prevBlockElement) {
            const input = prevBlockElement.querySelector('[contenteditable="true"]');
            if (input) {
              input.focus();
              // 커서를 끝으로 이동
              const range = document.createRange();
              const selection = window.getSelection();
              range.selectNodeContents(input);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }, 0);
      }
    }
  }, [blocks, deleteBlock]);

  // 크로스 블록 드래그 감지를 위한 전역 상태
  const dragState = useRef({
    isDragging: false,
    startBlockId: null,
    lastBlockId: null
  });

  // 전역 크로스 블록 드래그 감지
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (e.buttons === 1 && dragState.current.isDragging) {
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);
        const targetBlock = targetElement?.closest('[data-block-id]');
        const targetBlockId = targetBlock?.getAttribute('data-block-id');
        
        if (targetBlockId && targetBlockId !== dragState.current.lastBlockId) {
          console.log('🌐 Global cross-block drag detected!', {
            from: dragState.current.startBlockId,
            to: targetBlockId,
            mousePos: { x: e.clientX, y: e.clientY }
          });
          
          dragState.current.lastBlockId = targetBlockId;
          
          // SelectionManager에 크로스 블록 선택 생성 요청
          if (window.globalSelectionManager) {
            const startElement = document.querySelector(`[data-block-id="${dragState.current.startBlockId}"]`);
            const endElement = document.querySelector(`[data-block-id="${targetBlockId}"]`);
            
            if (startElement && endElement) {
              window.globalSelectionManager.createNativeCrossBlockSelection({
                startElement,
                endElement,
                startBlockId: dragState.current.startBlockId,
                endBlockId: targetBlockId,
                mouseEvent: e
              });
            }
          }
        }
      }
    };

    const handleGlobalMouseDown = (e) => {
      const targetElement = e.target;
      const targetBlock = targetElement.closest('[data-block-id]');
      const targetBlockId = targetBlock?.getAttribute('data-block-id');
      
      if (targetBlockId && targetElement.closest('.ProseMirror')) {
        dragState.current.isDragging = true;
        dragState.current.startBlockId = targetBlockId;
        dragState.current.lastBlockId = targetBlockId;
        console.log('🌐 Global drag started from block:', targetBlockId);
      }
    };

    const handleGlobalMouseUp = (e) => {
      if (dragState.current.isDragging) {
        console.log('🌐 Global drag ended');
        dragState.current.isDragging = false;
        dragState.current.startBlockId = null;
        dragState.current.lastBlockId = null;
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mousedown', handleGlobalMouseDown);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mousedown', handleGlobalMouseDown);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // 전역 키보드 이벤트 처리 (블록 에디터 레벨의 특수 키들만)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (readOnly) return;
      
      // 특수 키들만 처리 (일반 텍스트 입력은 무시)
      const isSpecialKey = e.key === 'Delete' || 
                          ((e.ctrlKey || e.metaKey) && ['z', 'y', 's'].includes(e.key.toLowerCase()));
                          
      if (!isSpecialKey) return;
      
      console.log('[BlockEditor] Special KeyDown event:', {
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        target: e.target.tagName,
        readOnly
      });
      
      // Delete 키 - 선택된 블록 삭제
      if (e.key === 'Delete' && selectedBlocks.length > 0) {
        e.preventDefault();
        deleteSelectedBlocks();
      }
      
      // Ctrl/Cmd + Z - 되돌리기
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[BlockEditor] Ctrl+Z pressed - executing undo');
        undo();
      }
      
      // Ctrl/Cmd + Y 또는 Ctrl/Cmd + Shift + Z - 다시하기
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[BlockEditor] Ctrl+Shift+Z or Ctrl+Y pressed - executing redo');
        redo();
      }
      
      // Ctrl/Cmd + S - 저장
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };
    
    // 캡처 단계에서 이벤트 잡기 (더 높은 우선순위)
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedBlocks, deleteSelectedBlocks, undo, redo, onSave, readOnly]);

  // 컴포넌트 언마운트 시 pending된 saveState 실행
  useEffect(() => {
    return () => {
      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current);
      }
      if (batchOperationTimeoutRef.current) {
        clearTimeout(batchOperationTimeoutRef.current);
      }
      saveState(); // 즉시 저장
    };
  }, [saveState]);

  // 선택된 블록들 상태 변화 감지 (디버깅용 - 필요시 주석 해제)
  // useEffect(() => {
  //   console.log('[BlockEditor] 선택된 블록:', selectedBlocks);
  // }, [selectedBlocks]);

  // 블록 이동 처리
  const handleBlockMove = useCallback(({ sourceIndex, targetIndex, block, dropPosition }) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      const [movedBlock] = newBlocks.splice(sourceIndex, 1);
      newBlocks.splice(targetIndex, 0, movedBlock);
      return newBlocks;
    });
    batchedSaveState();
  }, [batchedSaveState]);

  // 블록 병합 처리
  const handleBlockMerge = useCallback(({ sourceBlocks, targetBlock, targetIndex, mergedBlock }) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      
      // 소스 블록들 제거
      const sourceIds = sourceBlocks.map(b => b.id);
      const filteredBlocks = newBlocks.filter(block => !sourceIds.includes(block.id));
      
      // 병합된 블록으로 교체
      const targetIndexInFiltered = filteredBlocks.findIndex(block => block.id === targetBlock.id);
      if (targetIndexInFiltered !== -1) {
        filteredBlocks[targetIndexInFiltered] = {
          ...mergedBlock,
          id: nanoid(),
          focused: false
        };
      }
      
      return filteredBlocks;
    });
    batchedSaveState();
  }, [batchedSaveState]);

  // 블록 변환 처리
  const handleBlockConvert = useCallback((originalBlock, convertedBlock) => {
    setBlocks(prev => prev.map(block => 
      block.id === originalBlock.id ? { ...convertedBlock, id: block.id } : block
    ));
    saveState();
  }, [saveState]);

  // 통합 상호작용 시스템 - 블록 변경 처리
  const handleInteractionChange = useCallback((changes) => {
    setBlocks(prev => {
      let newBlocks = [...prev];
      
      // 변경사항들을 순서대로 적용
      changes.forEach(change => {
        switch (change.action) {
          case 'update':
            const updateIndex = newBlocks.findIndex(block => block.id === change.blockId);
            if (updateIndex !== -1) {
              newBlocks[updateIndex] = {
                ...newBlocks[updateIndex],
                type: change.newType || newBlocks[updateIndex].type,
                content: change.newContent !== undefined ? change.newContent : newBlocks[updateIndex].content,
                metadata: change.newMetadata || change.metadata || newBlocks[updateIndex].metadata
              };
            }
            break;
            
          case 'insert':
            const insertIndex = change.afterBlockId 
              ? newBlocks.findIndex(block => block.id === change.afterBlockId) + 1
              : newBlocks.length;
            newBlocks.splice(insertIndex, 0, change.block);
            break;
            
          case 'delete':
            newBlocks = newBlocks.filter(block => block.id !== change.blockId);
            break;
            
          default:
            console.warn('Unknown change action:', change.action);
        }
      });
      
      return newBlocks;
    });
    
    batchedSaveState();
  }, [batchedSaveState]);

  // 통합 상호작용 시스템 - 상호작용 완료 처리
  const handleInteractionComplete = useCallback((result) => {
    if (result.success) {
      console.log('✅ 블록 상호작용 완료:', {
        type: result.type,
        strategy: result.strategy,
        data: result.data
      });
      
      // 성공 피드백 (선택사항)
      if (result.data?.itemsAdded || result.data?.blocksConverted || result.data?.partsCreated) {
        // UI 피드백이나 토스트 메시지 등
      }
    } else {
      console.error('❌ 블록 상호작용 실패:', result.error);
    }
  }, []);

  // 리사이즈 시작
  const handleResizeStart = useCallback((e, groupId, columnIndex) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizingColumnId(groupId);
    setResizingColumnIndex(columnIndex);
    setResizeStartX(e.clientX);
    
    // 현재 그룹의 열 개수 찾기
    const columnGroup = blocks.find(b => b.metadata?.groupId === groupId);
    const totalColumns = columnGroup?.metadata?.totalColumns || 2;
    
    // 기본 너비 설정
    let defaultWidths = [];
    for (let i = 0; i < totalColumns; i++) {
      defaultWidths.push(100 / totalColumns);
    }
    
    const currentWidths = columnWidths[groupId] || defaultWidths;
    setResizeStartWidths(currentWidths);
  }, [readOnly, columnWidths, blocks]);

  // 리사이즈 중
  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !resizingColumnId || resizingColumnIndex === null) return;
    
    const deltaX = e.clientX - resizeStartX;
    
    // 컬럼 수에 따른 최소/최대 너비 설정
    const columnCount = resizeStartWidths.length;
    const minWidth = columnCount === 2 ? 15 : columnCount === 3 ? 10 : 8; // 컬럼이 많을수록 최소 너비 감소
    const maxWidth = columnCount === 2 ? 85 : columnCount === 3 ? 80 : 75; // 컬럼이 많을수록 최대 너비 감소
    
    // 시작 너비들 복사
    const newWidths = [...resizeStartWidths];
    
    // 현재 열과 다음 열의 너비 조정
    const currentWidth = newWidths[resizingColumnIndex];
    const nextWidth = newWidths[resizingColumnIndex + 1];
    
    // 델타를 퍼센트로 변환 - 컨테이너 너비 기준으로 더 정확하게 계산
    const containerWidth = editorRef.current ? editorRef.current.offsetWidth * 0.8 : window.innerWidth * 0.8; // 에디터 컨테이너 너비의 80% 추정
    const sensitivity = columnCount === 2 ? 1.0 : columnCount === 3 ? 0.8 : 0.6; // 컬럼이 많을수록 감도 감소
    const deltaPercent = (deltaX / containerWidth) * 100 * sensitivity;
    
    // 새로운 너비 계산
    const newCurrentWidth = Math.max(minWidth, Math.min(maxWidth, currentWidth + deltaPercent));
    const newNextWidth = Math.max(minWidth, Math.min(maxWidth, nextWidth - deltaPercent));
    
    // 너비 업데이트
    newWidths[resizingColumnIndex] = newCurrentWidth;
    newWidths[resizingColumnIndex + 1] = newNextWidth;
    
    // 전체 너비가 100%가 되도록 정규화
    const totalWidth = newWidths.reduce((sum, width) => sum + width, 0);
    if (totalWidth !== 100) {
      const scale = 100 / totalWidth;
      newWidths.forEach((_, index) => {
        newWidths[index] = newWidths[index] * scale;
      });
    }
    
    // Shift 키가 눌렸으면 모든 같은 타입의 열 블록에 동일한 비율 적용
    if (isShiftPressed) {
      const totalColumns = newWidths.length;
      const columnType = totalColumns === 2 ? 'column' : totalColumns === 3 ? 'column3' : 'column4';
      
      // 모든 같은 타입의 열 블록에 동일한 비율 적용
      setColumnWidths(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (key.startsWith(columnType)) {
            updated[key] = [...newWidths];
          }
        });
        return updated;
      });
    } else {
      // 개별 조절
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumnId]: newWidths
      }));
    }
  }, [isResizing, resizingColumnId, resizeStartX, resizeStartWidths, resizingColumnIndex, isShiftPressed]);

  // 리사이즈 종료
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizingColumnId(null);
    setResizingColumnIndex(null); // 리사이즈 중인 열 인덱스 초기화
    setResizeStartX(0);
    setResizeStartWidths([]);
  }, []);

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (isResizing) {
      // 리사이징 중에 body에 클래스 추가
      document.body.classList.add('resizing');
      
      const handleGlobalMouseMove = (e) => {
        handleResizeMove(e);
      };
      
      const handleGlobalMouseUp = () => {
        handleResizeEnd();
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.body.classList.remove('resizing');
      };
    } else {
      // 리사이징이 끝나면 body에서 클래스 제거
      document.body.classList.remove('resizing');
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // 열 블록 추가 후 불필요한 빈 텍스트 블록 정리
  useEffect(() => {
    if (isColumnInsert) {
      setBlocks(prev => {
        const emptyTextBlocks = prev.filter(b => b.type === 'text' && !b.content && !b.metadata?.isColumnBlock);
        if (emptyTextBlocks.length > 1) {
          // 첫 번째만 남기고 나머지 제거
          const idsToRemove = emptyTextBlocks.slice(1).map(b => b.id);
          return prev.filter(b => !idsToRemove.includes(b.id));
        }
        return prev;
      });
    }
  }, [isColumnInsert]);

  // 포맷 변경 핸들러
  const handleFormatChange = useCallback((cmd, value) => {
    if (cmd === 'blockColor') {
      // 선택된 블록들에 대해 blockColor를 업데이트
      setBlocks(prevBlocks => prevBlocks.map(block =>
        selectedBlocks && selectedBlocks.includes(block.id)
          ? { ...block, metadata: { ...block.metadata, blockColor: value } }
          : block
      ));
    } else {
      // 기존 포맷 핸들러(텍스트 등)
      setTextFormat(prev => ({
        ...prev,
        [cmd]: value
      }));
    }
  }, [selectedBlocks]);

  // selection 변경 시 setSelection만 호출
  const handleSelectionChange = useCallback((selection) => {
    setSelection(selection);
  }, [setSelection]);

  return (
    <SelectionProvider config={{ debugMode: true, enableCrossBlock: true, enableDragSelection: false }}>
      <InteractionProvider
        onBlockChange={handleInteractionChange}
        onInteractionComplete={handleInteractionComplete}
        config={{ debugMode: false, enableAnimations: true }}
      >
        <DndProvider backend={HTML5Backend}>
          <BlockDragProvider
            onBlockMove={handleBlockMove}
            onBlockMerge={handleBlockMerge}
            onBlockConvert={handleBlockConvert}
          >
          <DragLayer>
            <div 
              ref={editorRef}
              className={`block-editor min-h-full p-8 bg-white dark:bg-gray-900${isSelecting ? ' is-selecting' : ''}`}
              style={{ 
                position: 'relative',
                userSelect: 'none',
                cursor: 'default'
              }}
              role="textbox"
              aria-label="노트 에디터"
              tabIndex={0}
        onClick={(e) => {
          if (isSelecting || isClicking) {
            return; // 드래그 중이거나 클릭 중에는 클릭 이벤트 무시
          }
          // 빈 곳 클릭 시 선택 해제
          const isBlock = e.target.closest('[data-block-id]');
          const isContainer = e.target.classList?.contains('blocks-container') || e.target.classList?.contains('block-editor');
          if (
            editorRef.current &&
            editorRef.current.contains(e.target) &&
            !isBlock &&
            !isContainer
          ) {
            setSelectedBlocks([]);
            setSelection(null); // 텍스트 선택 해제하여 툴바 숨기기
            window.getSelection().removeAllRanges();
          }
        }}
        onMouseDown={(e) => {
          // 빈 공간에서 드래그 선택 시작
          const target = e.target;
          const isBlock = target.closest('[data-block-id]');
          const isContentEditable = target.contentEditable === 'true' || 
                                   target.closest('[contenteditable="true"]');
          const isToolbar = target.closest('[data-toolbar]') || 
                           target.closest('.notion-toolbar');
          
          // 빈 공간에서만 드래그 시작 (툴바 제외)
          if (!isBlock && !isContentEditable && !isToolbar) {
            setIsClicking(true);
            setSelectionStart({ x: e.clientX, y: e.clientY });
            setSelectedBlocks([]); // 드래그 시작 시 선택 초기화
            setSelection(null); // 텍스트 선택 해제하여 툴바 숨기기
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onMouseMove={(e) => {
          setCurrentMousePos({ x: e.clientX, y: e.clientY });
          
          // 클릭 상태에서 마우스가 움직이면 드래그로 전환
          if (isClicking && selectionStart) {
            const moveDistance = Math.sqrt(
              Math.pow(e.clientX - selectionStart.x, 2) + 
              Math.pow(e.clientY - selectionStart.y, 2)
            );
            
            if (moveDistance > 5) {
              setIsClicking(false);
              setIsSelecting(true);
            }
          }
          
          if (isSelecting && selectionStart) {
            const blockElements = editorRef.current.querySelectorAll('[data-block-id]');
            const selectedBlockIds = [];
            
            // 마우스가 지나간 모든 블록을 선택하는 방식
            blockElements.forEach((element) => {
              const rect = element.getBoundingClientRect();
              const mouseX = e.clientX;
              const mouseY = e.clientY;
              
              // 마우스가 블록 영역 내에 있는지 확인
              if (mouseX >= rect.left && mouseX <= rect.right && 
                  mouseY >= rect.top && mouseY <= rect.bottom) {
                const blockId = element.getAttribute('data-block-id');
                if (!selectedBlockIds.includes(blockId)) {
                  selectedBlockIds.push(blockId);
                }
              }
            });
            
            // 시작점에서 현재점까지의 직선 경로상에 있는 블록들도 추가
            const startX = selectionStart.x;
            const startY = selectionStart.y;
            const endX = e.clientX;
            const endY = e.clientY;
            
            blockElements.forEach((element) => {
              const rect = element.getBoundingClientRect();
              const blockId = element.getAttribute('data-block-id');
              
              // 직선 경로와 블록이 겹치는지 확인
              if (rect.left < Math.max(startX, endX) && rect.right > Math.min(startX, endX) &&
                  rect.top < Math.max(startY, endY) && rect.bottom > Math.min(startY, endY)) {
                if (!selectedBlockIds.includes(blockId)) {
                  selectedBlockIds.push(blockId);
                }
              }
            });
            
            setSelectedBlocks(selectedBlockIds);
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onMouseUp={(e) => {
          if (isClicking) {
            // 클릭만 했으면 선택 해제
            setSelectedBlocks([]);
            setSelection(null); // 텍스트 선택 해제하여 툴바 숨기기
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              selection.removeAllRanges();
            }
            // 툴바 숨기기 콜백 호출
            if (onSelectionCleared) {
              onSelectionCleared('click', {
                hasSelection: false,
                selectionType: 'native',
                selectedText: '',
                element: null,
                range: null
              });
            }
            setIsClicking(false);
            setSelectionStart(null);
            e.preventDefault();
            e.stopPropagation();
          } else if (isSelecting) {
            // 드래그 선택 완료
            setIsSelecting(false);
            setSelectionStart(null);
            // 블록 선택 시 selection context를 명확히 초기화
            setSelection({
              selectionType: 'block_selection',
              selectedBlocks: selectedBlocks,
              text: '',
              rect: null,
              from: null,
              to: null
            });
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {/* 블록 렌더링 */}
        <div className="blocks-container max-w-5xl mx-auto space-y-1">
          {(() => {
            const renderedBlocks = [];
            
            for (let i = 0; i < blocks.length; i++) {
              const block = blocks[i];
              const nextBlock = blocks[i + 1];
              
              // Flexbox 기반 열블록 렌더링
              const columnGroup = collectColumnGroup(blocks, i);
              if (columnGroup && block.metadata?.groupId === columnGroup.groupId && 
                  block.metadata?.columnIndex === 0) { // 첫 번째 열일 때만 렌더링
                
                const arrangedColumns = arrangeColumns(columnGroup);
                const groupId = `column-group-${columnGroup.groupId}`;
                
                renderedBlocks.push(
                  <div 
                    key={groupId} 
                    className="relative group"
                    style={{
                      display: 'flex',
                      gap: '8px',
                      minHeight: '40px',
                      alignItems: 'flex-start'
                    }}
                  >
                    {arrangedColumns.map(({ columnIndex, blocks: columnBlocks }, idx) => {
                      // columnWidths가 지정되어 있으면 해당 비율, 없으면 flex: 1
                      const hasCustomWidth = columnWidths[columnGroup.groupId]?.[columnIndex] !== undefined;
                      const columnWidth = columnWidths[columnGroup.groupId]?.[columnIndex] || (100 / columnGroup.totalColumns);

                      return (
                        <div
                          key={`column-${columnIndex}`}
                          style={hasCustomWidth
                            ? {
                                flex: `0 0 ${columnWidth}%`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                position: 'relative'
                              }
                            : {
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                position: 'relative'
                              }
                          }
                          className="relative column-container"
                        >
                        {columnBlocks.map(({ block: columnBlock, index: blockIndex }) => (
                          <Block
                            key={columnBlock.id}
                            block={columnBlock}
                            index={blockIndex}
                            isSelected={selectedBlocks.includes(columnBlock.id)}
                            selectedBlocks={blocks.filter(b => selectedBlocks.includes(b.id))}
                            onUpdate={updateBlock}
                            onDelete={deleteBlock}
                            onDuplicate={duplicateBlock}
                            onMove={(sourceIndex, targetIndex, selectedBlocks) => {
                              if (selectedBlocks && selectedBlocks.length > 1) {
                                moveMultipleBlocks(sourceIndex, targetIndex, selectedBlocks);
                              } else {
                                moveBlock(sourceIndex, targetIndex);
                              }
                            }}
                            onFocus={handleBlockFocus}
                            onSelect={handleBlockSelect}
                            onEnterKey={handleEnterKey}
                            onBackspaceKey={handleBackspaceKey}
                            onSelectionChange={handleSelectionChange}
                            onAdd={(type, _content, atIndex, metadata) => addBlock(type, null, atIndex, metadata)}
                            onSlashCommand={(position) => {
                              setCurrentBlockId(columnBlock.id);
                            }}
                            readOnly={readOnly}
                            placeholder={blockIndex === 0 ? placeholder : ""}
                            className="px-2"
                            textFormat={textFormat}
                            onFormatChange={onFormatChange}
                            setIsColumnInsert={setIsColumnInsert}
                            setBlocks={setBlocks}
                            blocks={blocks}
                          />
                        ))}
                        {/* 리사이징 핸들 - 마지막 열 제외 */}
                        {idx < arrangedColumns.length - 1 && !readOnly && (
                          <div
                            className="column-resizer"
                            onMouseDown={(e) => handleResizeStart(e, columnGroup.groupId, idx)}
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: '-4px',
                              width: '8px',
                              height: '100%',
                              cursor: 'col-resize',
                              zIndex: 10
                            }}
                          >
                            <div
                              className="column-resizer-line"
                              style={{
                                position: 'absolute',
                                left: '3px',
                                top: 0,
                                width: '2px',
                                height: '100%',
                                backgroundColor: 'transparent',
                                transition: 'background-color 0.2s'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                    })}
                  </div>
                );
                
                // 열 그룹의 모든 블록을 건너뛰기
                let skipCount = 0;
                Object.values(columnGroup.columns).forEach(col => {
                  skipCount += col.length;
                });
                i += skipCount - 1;
              } else {
                // 일반 블록 렌더링 (열블록이 아니거나 그리드에서 이미 처리됨)
                if (!block.metadata?.isColumnBlock) {
                  renderedBlocks.push(
                    <Block
                      key={block.id}
                      block={block}
                      index={i}
                      isSelected={selectedBlocks.includes(block.id)}
                          selectedBlocks={blocks.filter(b => selectedBlocks.includes(b.id))}
                          onUpdate={updateBlock}
                          onDelete={deleteBlock}
                          onDuplicate={duplicateBlock}
                          onMove={(sourceIndex, targetIndex, selectedBlocks) => {
                            if (selectedBlocks && selectedBlocks.length > 1) {
                              moveMultipleBlocks(sourceIndex, targetIndex, selectedBlocks);
                            } else {
                              moveBlock(sourceIndex, targetIndex);
                            }
                          }}
                          onFocus={handleBlockFocus}
                          onSelect={handleBlockSelect}
                          onEnterKey={handleEnterKey}
                          onBackspaceKey={handleBackspaceKey}
                          onSelectionChange={handleSelectionChange}
                          onAdd={(type, _content, atIndex, metadata) => addBlock(type, '', atIndex, metadata)}
                          onSlashCommand={(position) => {
                            setCurrentBlockId(block.id);
                          }}
                          readOnly={readOnly}
                          placeholder={i === 0 ? placeholder : ""}
                          className="px-2"
                          textFormat={textFormat}
                          onFormatChange={onFormatChange}
                          setIsColumnInsert={setIsColumnInsert}
                          setBlocks={setBlocks}
                          blocks={blocks}
                        />
                  );
                }
              }
            }
            
            return renderedBlocks;
          })()}
        </div>

        {/* 슬래시 명령어 메뉴 */}
        {/* showSlashCommand, setShowSlashCommand, SlashCommand 관련 코드 모두 삭제 */}

        {/* 드래그 선택 영역 표시 */}
        {isSelecting && selectionStart && currentMousePos && (
          (() => {
            const startPos = getRelativePosition(selectionStart.x, selectionStart.y);
            const currentPos = getRelativePosition(currentMousePos.x, currentMousePos.y);
            return (
              <div
                style={{
                  position: 'absolute',
                  left: Math.min(startPos.x, currentPos.x),
                  top: Math.min(startPos.y, currentPos.y),
                  width: Math.abs(currentPos.x - startPos.x),
                  height: Math.abs(currentPos.y - startPos.y),
                  backgroundColor: 'rgba(168, 85, 247, 0.13)', // 연보라색
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  pointerEvents: 'none',
                  zIndex: 1000
                }}
              />
            );
          })()
        )}
            </div>
          </DragLayer>
        </BlockDragProvider>
      </DndProvider>
      </InteractionProvider>
    </SelectionProvider>
  );
});