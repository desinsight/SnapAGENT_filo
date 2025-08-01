import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { EditorState, TextSelection, Selection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands';
import { schema } from './schema';
import { plugins } from './plugins';
import { useSelection } from '../selection/hooks/useSelection.js';
import NotionLikeToolbar from '../../../../components/common/NotionLikeToolbar';

// 번호 리스트 자동 번호 매기기 CSS
const listStyles = `
  /* 기본 리스트 스타일 */
  ol {
    padding-left: 0;
    margin: 0;
  }
  
  ol > li {
    padding-left: 0;
    position: relative;
    margin: 0;
  }
  
  ol > li::before {
    content: counter(list-item) ".";
    position: absolute;
    left: -1.5em;
    top: 0;
    font-weight: 500;
    color: #6b7280;
    font-size: 0.9em;
    min-width: 1.5em;
    text-align: right;
    counter-increment: list-item;
  }
  
  ul {
    padding-left: 0;
    margin: 0;
  }
  
  ul > li {
    padding-left: 0;
    position: relative;
    margin: 0;
  }
  
  ul > li::before {
    content: "•";
    position: absolute;
    left: -1.5em;
    top: 0;
    font-weight: 500;
    color: #6b7280;
    font-size: 0.9em;
    min-width: 1.5em;
    text-align: center;
  }
  
  li {
    margin: 0;
  }
  
  li p {
    margin: 0;
  }
`;

const ProseMirrorTextEditor = forwardRef(({
  content = '',
  onChange,
  placeholder = '',
  readOnly = false,
  className = '',
  style = {},
  blockId = null,
  blockType = 'text', // 블록 타입 추가
  focused = false, // 포커스 상태 추가
  isSingleEditor = false, // 단일 에디터 모드 추가
}, ref) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const { selectionManager } = useSelection();
  const [selection, setSelection] = useState(null); // 내부 selection (ProseMirror 상태용)
  const [toolbarSelection, setToolbarSelection] = useState(null); // 툴바 노출 전용 selection
  const [currentFormat, setCurrentFormat] = useState({});
  
  // CSS 스타일 주입
  useEffect(() => {
    if (!document.getElementById('prosemirror-list-styles')) {
      const style = document.createElement('style');
      style.id = 'prosemirror-list-styles';
      style.textContent = listStyles;
      document.head.appendChild(style);
    }
  }, []);
  
  // 크로스 블록 드래그 상태 추적 (Hook 규칙 준수)
  const crossBlockDragState = useRef({ 
    isActive: false, 
    lastTargetBlockId: null,
    throttleTimeout: null 
  });

  // ProseMirror에 포맷팅 명령 적용하는 함수 (텍스트 포맷팅만)
  const applyFormat = (cmd, value) => {
    if (!viewRef.current) return;
    
    const { state } = viewRef.current;
    const { schema, selection } = state;
    let tr = null;
    
    console.log('applyFormat called:', cmd, value); // 디버깅용
    console.log('Current selection:', selection); // 선택 상태 확인
    console.log('Schema marks:', Object.keys(schema.marks)); // 사용 가능한 마크 확인
    
    // 선택 영역이 없으면 전체 텍스트에 적용
    const from = selection.from;
    const to = selection.to;
    
    // 텍스트 포맷팅 명령들만 처리
    switch (cmd) {
      case 'undo':
        console.log('Undo command received - ignoring at ProseMirror level');
        // ProseMirror 레벨에서는 undo를 처리하지 않음 (BlockEditor에서 처리)
        return;
      case 'redo':
        console.log('Redo command received - ignoring at ProseMirror level');
        // ProseMirror 레벨에서는 redo를 처리하지 않음 (BlockEditor에서 처리)
        return;
      case 'bold': {
        const bold = schema.marks.bold;
        if (bold) {
          console.log('Toggling bold format');
          toggleMark(bold)(state, viewRef.current.dispatch);
        }
        break;
      }
      case 'italic': {
        const italic = schema.marks.italic;
        if (italic) {
          console.log('Toggling italic format');
          toggleMark(italic)(state, viewRef.current.dispatch);
        }
        break;
      }
      case 'underline': {
        const underline = schema.marks.underline;
        if (underline) {
          console.log('Toggling underline format');
          toggleMark(underline)(state, viewRef.current.dispatch);
        }
        break;
      }
      case 'strikethrough':
      case 'strike': {
        const strikethrough = schema.marks.strikethrough || schema.marks.strike;
        if (strikethrough) {
          console.log('Toggling strikethrough format');
          toggleMark(strikethrough)(state, viewRef.current.dispatch);
        }
        break;
      }
      case 'code':
        const code = schema.marks.code;
        if (code) {
          console.log('Applying code format');
          tr = state.tr.addMark(from, to, code.create());
        }
        break;
      case 'link':
        const link = schema.marks.link;
        if (link) {
          const url = value || prompt('링크 주소를 입력하세요:');
          if (url) {
            console.log('Applying link format:', url);
            tr = state.tr.addMark(from, to, link.create({ href: url }));
          }
        }
        break;
      case 'color':
        const textColor = schema.marks.textColor;
        if (textColor) {
          console.log('Applying text color:', value);
          tr = state.tr.addMark(from, to, textColor.create({ color: value }));
        }
        break;
      case 'backgroundColor':
        const backgroundColor = schema.marks.backgroundColor;
        if (backgroundColor) {
          console.log('Applying background color:', value);
          tr = state.tr.addMark(from, to, backgroundColor.create({ color: value }));
        }
        break;
      case 'fontSize':
        const fontSize = schema.marks.fontSize;
        if (fontSize) {
          console.log('Applying font size:', value);
          tr = state.tr.addMark(from, to, fontSize.create({ size: value }));
        }
        break;
      case 'fontFamily':
        const fontFamily = schema.marks.fontFamily;
        if (fontFamily) {
          console.log('Applying font family:', value);
          tr = state.tr.addMark(from, to, fontFamily.create({ family: value }));
        }
        break;
      case 'alignLeft':
      case 'alignCenter':
      case 'alignRight':
      case 'alignJustify':
        // 정렬은 블록 레벨 속성이므로 별도 처리
        const align = cmd.replace('align', '').toLowerCase();
        console.log('Applying alignment:', align);
        tr = state.tr.setNodeMarkup(selection.$from.before(), null, { align });
        break;
      default:
        console.log('Unknown format command:', cmd);
        return;
    }

    if (tr && tr.docChanged) {
      console.log('Dispatching transaction:', tr); // 디버깅용
      console.log('Transaction content before:', viewRef.current.state.doc.textContent); // 디버깅용
      viewRef.current.dispatch(tr);
      console.log('Transaction content after:', viewRef.current.state.doc.textContent); // 디버깅용
    } else {
      console.log('No transaction to dispatch - tr:', tr, 'docChanged:', tr?.docChanged); // 디버깅용
    }
  };

  // JSON에서 빈 텍스트 노드 제거하는 함수
  const sanitizeProseMirrorJSON = (json) => {
    if (!json || typeof json !== 'object') return json;
    
    // 배열인 경우
    if (Array.isArray(json)) {
      return json
        .filter(item => {
          // 빈 텍스트 노드 필터링
          if (item.type === 'text' && (!item.text || item.text === '')) {
            return false;
          }
          return true;
        })
        .map(item => sanitizeProseMirrorJSON(item));
    }
    
    // 객체인 경우
    const sanitized = {};
    for (const key in json) {
      if (key === 'content' && Array.isArray(json[key])) {
        const filteredContent = sanitizeProseMirrorJSON(json[key]);
        if (filteredContent.length > 0) {
          sanitized[key] = filteredContent;
        }
      } else if (typeof json[key] === 'object') {
        sanitized[key] = sanitizeProseMirrorJSON(json[key]);
      } else {
        sanitized[key] = json[key];
      }
    }
    
    return sanitized;
  };

  // ProseMirror 스키마 및 플러그인 설정
  const createEditorState = (content) => {
    console.log('Creating editor state with content:', content); // 디버깅용
    console.log('Block type:', blockType); // 블록 타입 확인
    
    try {
      let doc;
      
      // content가 JSON 객체인지 확인
      if (typeof content === 'object' && content !== null) {
        // JSON 객체인 경우 빈 텍스트 노드 제거 후 사용
        console.log('Content is JSON object, sanitizing and using');
        const sanitizedContent = sanitizeProseMirrorJSON(content);
        doc = schema.nodeFromJSON(sanitizedContent);
      } else if (!content || (typeof content === 'string' && content.trim() === '')) {
        // 빈 내용일 때 블록 타입에 따라 기본 노드 생성
        let defaultNode;
        
        if (blockType.startsWith('heading')) {
          const level = parseInt(blockType.slice(-1)) || 1;
          defaultNode = schema.node('heading', { level });
        } else if (blockType === 'quote') {
          defaultNode = schema.node('blockquote', null, [
            schema.node('paragraph')
          ]);
        } else if (blockType === 'code') {
          defaultNode = schema.node('code_block');
        } else if (blockType === 'bullet_list') {
          defaultNode = schema.node('bullet_list', null, [
            schema.node('list_item', null, [schema.node('paragraph')])
          ]);
        } else if (blockType === 'ordered_list') {
          defaultNode = schema.node('ordered_list', null, [
            schema.node('list_item', null, [schema.node('paragraph')])
          ]);
        } else {
          defaultNode = schema.node('paragraph');
        }
        
        doc = schema.node('doc', null, [defaultNode]);
      } else {
        // HTML 파싱을 위한 임시 div 생성
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        console.log('Parsing HTML content:', tempDiv.innerHTML); // 디버깅용
        doc = DOMParser.fromSchema(schema).parse(tempDiv);
      }

      console.log('Created document:', doc); // 디버깅용

      return EditorState.create({
        doc,
        schema,
        plugins: plugins({
          placeholder,
          onSelectionChange: (selectionData) => {
            setSelection(selectionData);
          },
          readOnly,
          onFormatChange: (cmd, value) => {
            setCurrentFormat(prev => ({ ...prev, [cmd]: value }));
            applyFormat(cmd, value);
          },
          schema,
          isSingleEditor
        })
      });
    } catch (error) {
      console.error('Error creating editor state:', error);
      // 에러 발생 시 기본 paragraph로 fallback
      const fallbackDoc = schema.node('doc', null, [
        schema.node('paragraph')
      ]);
      
      return EditorState.create({
        doc: fallbackDoc,
        schema,
        plugins: plugins({
          placeholder,
          onSelectionChange: (selectionData) => {
            setSelection(selectionData);
          },
          readOnly,
          onFormatChange: (cmd, value) => {
            setCurrentFormat(prev => ({ ...prev, [cmd]: value }));
            applyFormat(cmd, value);
          },
          schema,
          isSingleEditor
        })
      });
    }
  };

  // 에디터 초기화
  useEffect(() => {
    if (!editorRef.current) return;

    try {
      const state = createEditorState(content);
      
      const view = new EditorView(editorRef.current, {
        state,
        dispatchTransaction: (transaction) => {
          const newState = view.state.apply(transaction);
          view.updateState(newState);
          
          // 내용 변경 시 콜백 호출
          if (transaction.docChanged && onChange) {
            const json = newState.doc.toJSON();
            console.log('Content changed, new JSON:', json); // 디버깅용
            onChange(json);
          }
          
          // 블록 타입 변경 감지
          if (transaction.docChanged) {
            const { doc } = newState;
            if (doc.childCount > 0) {
              const firstChild = doc.firstChild;
              const currentBlockType = firstChild.type.name;
              const currentLevel = firstChild.attrs.level;
              
              // 제목 레벨이 변경된 경우 부모에게 알림
              if (currentBlockType === 'heading' && currentLevel) {
                const newHeadingType = `heading${currentLevel}`;
                if (newHeadingType !== blockType) {
                  console.log('Heading level changed:', blockType, '->', newHeadingType);
                  // 부모 컴포넌트에 블록 타입 변경 알림
                  if (onChange) {
                    // 블록 타입 변경 정보를 포함한 콜백 호출
                    onChange(json, { blockTypeChanged: true, newBlockType: newHeadingType });
                  }
                }
              }
              
              // 리스트 타입이 변경된 경우 부모에게 알림
              if (currentBlockType === 'bullet_list' && blockType !== 'bullet_list') {
                console.log('Block type changed to bullet_list');
                if (onChange) {
                  onChange(json, { blockTypeChanged: true, newBlockType: 'bullet_list' });
                }
              } else if (currentBlockType === 'ordered_list' && blockType !== 'ordered_list') {
                console.log('Block type changed to ordered_list');
                if (onChange) {
                  onChange(json, { blockTypeChanged: true, newBlockType: 'ordered_list' });
                }
              }
            }
          }
          
          // 선택 변경 시 내부 상태 업데이트 (툴바 표시용)
          if (transaction.selectionSet) {
            const selection = newState.selection;
            if (!selection.empty) {
              const selectedText = newState.doc.textBetween(selection.from, selection.to);
              const rect = view.coordsAtPos(selection.from);
              const selectionData = {
                text: selectedText,
                from: selection.from,
                to: selection.to,
                rect: rect,
                prosemirror: true,
                element: editorRef.current,
                range: { from: selection.from, to: selection.to },
                selection: selection
              };
              setSelection(selectionData); // 내부 selection만 업데이트
            } else {
              setSelection(null);
            }
          }
        }
      });

      viewRef.current = view;
      
      // ProseMirror 뷰를 SelectionManager에 등록 (뷰 등록만, 이벤트는 아직 비활성화)
      if (selectionManager && blockId) {
        selectionManager.registerProseMirrorView(blockId, view);
        console.log('[ProseMirror] View registered with SelectionManager:', blockId);
      }
      
      // 포커스 이벤트 리스너 추가 (툴바 숨기기용)
      const handleFocus = () => {
        // 포커스 시 현재 블록 설정
        if (blockId) {
          window.currentProseMirrorBlock = blockId;
          console.log('ProseMirror focused, blockId:', blockId);
        }
      };
      
      const handleBlur = (e) => {
        // 툴바로 포커스가 이동하는 경우 선택 해제하지 않음
        const relatedTarget = e.relatedTarget;
        const isToolbarClick = relatedTarget && (
          relatedTarget.closest('.notion-toolbar') ||
          relatedTarget.closest('[data-toolbar]') ||
          relatedTarget.hasAttribute('data-toolbar')
        );
        
        console.log('[ProseMirror] Blur event:', {
          blockId,
          relatedTarget: relatedTarget?.tagName,
          isToolbarClick,
          hasToolbarParent: !!relatedTarget?.closest('.notion-toolbar')
        });
        
        // 포커스를 잃으면 현재 블록 해제
        if (blockId && window.currentProseMirrorBlock === blockId) {
          setTimeout(() => {
            if (window.currentProseMirrorBlock === blockId) {
              window.currentProseMirrorBlock = null;
            }
          }, 100);
        }
        
        // 툴바로 포커스가 이동하거나 포맷 적용 중이 아닌 경우에만 선택을 해제
        if (!isToolbarClick && !window.preventSelectionClear) {
          // blur 시점에 현재 내용을 저장
          if (view && onChange) {
            const { state } = view;
            const json = state.doc.toJSON();
            console.log('[ProseMirror] Saving content on blur:', json);
            onChange(json);
          }
          
          setTimeout(() => {
            // 다시 한 번 확인 (포맷 적용 중일 수 있음)
            if (!window.preventSelectionClear) {
              console.log('[ProseMirror] Clearing selection after blur');
              // 내부 selection 상태만 클리어 (내용은 이미 저장했으므로 onChange(null) 호출하지 않음)
              setSelection(null);
              setCurrentFormat({});
            } else {
              console.log('[ProseMirror] Selection clear prevented (format in progress)');
            }
          }, 150); // 지연 시간을 늘려서 툴바 클릭 감지 시간 확보
        } else {
          console.log('[ProseMirror] Selection clear skipped:', {
            isToolbarClick,
            preventClear: !!window.preventSelectionClear
          });
        }
      };
      
      view.dom.addEventListener('focus', handleFocus);
      view.dom.addEventListener('blur', handleBlur);

      return () => {
        if (view) {
          view.dom.removeEventListener('focus', handleFocus);
          view.dom.removeEventListener('blur', handleBlur);
          
          // SelectionManager에서 뷰 등록 해제
          if (selectionManager && blockId) {
            selectionManager.unregisterProseMirrorView(blockId);
            console.log('[ProseMirror] View unregistered from SelectionManager:', blockId);
          }
          
          view.destroy();
        }
      };
    } catch (error) {
      console.error('ProseMirror initialization error:', error);
      // 에러 발생 시 기본 텍스트 에디터로 fallback
      return () => {};
    }
  }, [blockId]);

  // 내용 업데이트
  useEffect(() => {
    if (viewRef.current) {
      try {
        const currentContent = viewRef.current.state.doc.textContent;
        
        // JSON 객체인 경우 텍스트로 변환해서 비교
        let newContent = content;
        if (typeof content === 'object' && content !== null) {
          // ProseMirror JSON에서 텍스트 추출
          try {
            const sanitizedContent = sanitizeProseMirrorJSON(content);
            const tempDoc = schema.nodeFromJSON(sanitizedContent);
            newContent = tempDoc.textContent;
          } catch (e) {
            console.warn('Failed to parse ProseMirror JSON:', e);
            newContent = '';
          }
        }
        
        console.log('ProseMirror content comparison:', {
          current: `"${currentContent}"`,
          new: `"${newContent}"`,
          equal: newContent === currentContent
        });
        
        if (newContent !== currentContent) {
          console.log('Updating ProseMirror content:', currentContent, '->', newContent);
          const newState = createEditorState(content);
          viewRef.current.updateState(newState);
        } else {
          console.log('ProseMirror content unchanged, skipping update');
        }
      } catch (error) {
        console.error('Error updating ProseMirror content:', error);
      }
    }
  }, [content]);

  // 포커스 처리
  useEffect(() => {
    if (focused && viewRef.current && !readOnly) {
      setTimeout(() => {
        try {
          viewRef.current.focus();
          // 커서를 텍스트 끝으로 이동
          const { state } = viewRef.current;
          const endPos = state.doc.content.size;
          const tr = state.tr.setSelection(state.selection.constructor.atEnd(state.doc));
          viewRef.current.dispatch(tr);
        } catch (error) {
          console.warn('Error focusing ProseMirror:', error);
        }
      }, 10); // 작은 지연을 주어 DOM 업데이트 완료 후 포커스
    }
  }, [focused, readOnly]);

  // 전역 클릭 이벤트로 블록 밖 클릭 시 툴바 끄기
  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (!viewRef.current || (!selection && !toolbarSelection)) return;
      
      // 클릭된 요소가 현재 에디터 또는 툴바 내부인지 확인
      const editorElement = viewRef.current.dom;
      const isClickInsideEditor = editorElement.contains(event.target);
      const isClickInsideToolbar = event.target.closest('[data-toolbar="true"]');
      
      // 에디터나 툴바 외부를 클릭한 경우 선택 해제
      if (!isClickInsideEditor && !isClickInsideToolbar) {
        // ProseMirror 내부 선택도 완전히 정리
        if (viewRef.current) {
          const view = viewRef.current;
          const { state } = view;
          const tr = state.tr.setSelection(Selection.atStart(state.doc));
          view.dispatch(tr);
        }
        setSelection(null);
        setCurrentFormat({});
        setToolbarSelection(null); // ★ 툴바도 무조건 사라지게
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [selection, toolbarSelection]);

  // 포맷팅 명령 처리
  useEffect(() => {
    // 전역 함수로 등록 (툴바에서 호출할 수 있도록)
    const handleFormatChange = (cmd, value) => {
      console.log('Global format handler called:', cmd, value); // 디버깅용
      applyFormat(cmd, value);
      if (onChange) {
        onChange(null, { formatChanged: true, newFormat: { [cmd]: value } });
      }
    };
    
    window.applyProseMirrorFormat = handleFormatChange;
    
    return () => {
      delete window.applyProseMirrorFormat;
    };
  }, [onChange]);

  // 전역 포맷 핸들러 맵에 등록
  useEffect(() => {
    // 전역 핸들러 맵이 없으면 생성
    if (!window.proseMirrorFormats) {
      window.proseMirrorFormats = {};
    }
    
    // 블록 ID가 있으면 해당 ID로, 없으면 기본 키로 등록
    const handlerKey = blockId || 'default';
    window.proseMirrorFormats[handlerKey] = applyFormat;
    
    console.log(`[ProseMirror] Format handler registered for key: ${handlerKey}`);
    console.log('[ProseMirror] Available handlers:', Object.keys(window.proseMirrorFormats));
    
    // 현재 포커스된 블록 ID 저장
    if (blockId && viewRef.current?.hasFocus()) {
      window.currentProseMirrorBlock = blockId;
      console.log(`[ProseMirror] Current block set to: ${blockId}`);
    }
    
    return () => {
      // 컴포넌트 언마운트 시 핸들러 제거
      if (window.proseMirrorFormats) {
        delete window.proseMirrorFormats[handlerKey];
      }
      // 현재 블록이 포커스된 블록이었다면 초기화
      if (window.currentProseMirrorBlock === blockId) {
        window.currentProseMirrorBlock = null;
      }
    };
  }, [blockId]);

  // 키보드 및 마우스 이벤트 처리 (툴바 표시를 위한 기본 처리)
  useEffect(() => {
    if (!viewRef.current) return;

    // 키보드 이벤트 처리
    const handleKeyDown = (event) => {
      // 엔터 키 처리
      if (event.key === 'Enter' && !event.shiftKey) {
        if (isSingleEditor) {
          // 단일 에디터 모드: 일반적인 줄바꿈 허용 (ProseMirror 기본 동작)
          // 기본 동작을 허용하여 새 paragraph 생성
          // 추가: 단일 에디터에서 엔터키 후 내용 저장
          setTimeout(() => {
            if (viewRef.current && onChange) {
              const { state } = viewRef.current;
              const json = state.doc.toJSON();
              onChange(json);
            }
          }, 0);
          return;
        } else {
          // 블록 에디터 모드: 기존 블록 생성 로직
          event.preventDefault();
          event.stopPropagation();
          
          // 엔터 키 처리 전에 현재 내용을 먼저 저장
          if (viewRef.current && onChange) {
            const { state } = viewRef.current;
            const json = state.doc.toJSON();
            onChange(json);
          }
          
          // 부모 블록 요소에 엔터 키 이벤트 전달
          const blockElement = editorRef.current.closest('[data-block-id]');
          if (blockElement) {
            const enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              bubbles: true,
              cancelable: true
            });
            blockElement.dispatchEvent(enterEvent);
          }
        }
      }
      
      // Ctrl+A 전체 선택 처리
      if (event.ctrlKey && event.key === 'a') {
        // ProseMirror 기본 동작 후 툴바 표시를 위해 setTimeout 사용
        setTimeout(() => {
          const { state } = viewRef.current;
          const { selection } = state;
          const docSize = state.doc.content.size;
          
          if (!selection.empty && selection.from === 0 && selection.to === docSize) {
            const selectedText = state.doc.textBetween(selection.from, selection.to);
            if (selectedText.trim()) {
              try {
                // 전체 선택 시 에디터 영역의 중앙에 툴바 표시
                const editorRect = editorRef.current.getBoundingClientRect();
                const centerX = editorRect.left + (editorRect.width / 2);
                const topY = editorRect.top + 10; // 에디터 상단에서 약간 아래
                
                const selectionData = {
                  text: selectedText,
                  rect: {
                    top: topY,
                    left: centerX,
                    bottom: topY + 20,
                    right: centerX,
                    width: 0,
                    height: 20
                  },
                  element: editorRef.current,
                  range: { from: selection.from, to: selection.to },
                  selection: selection,
                  prosemirror: true
                };
                setToolbarSelection(selectionData);
              } catch (error) {
                console.warn('[ProseMirror] Error getting Ctrl+A selection coords:', error);
              }
            }
          }
        }, 10);
      }
    };

    // (기존 handleKeyUp, handleMouseUp, handleMouseMove 중)
    // selection set은 mouseup에서만 하도록 한다.
    const handleMouseUp = (event) => {
      setTimeout(() => {
        const { state } = viewRef.current;
        const { selection } = state;
        const docSize = state.doc.content.size;
        if (!selection.empty) {
          const selectedText = state.doc.textBetween(selection.from, selection.to);
          if (selectedText.trim()) {
            try {
              const coords = viewRef.current.coordsAtPos(selection.from);
              const endCoords = viewRef.current.coordsAtPos(selection.to);
              
              // 전체 선택인지 확인
              const isFullSelection = selection.from === 0 && selection.to === docSize;
              
              let rect;
              if (isFullSelection) {
                // 전체 선택 시 에디터 중앙에 툴바 표시
                const editorRect = editorRef.current.getBoundingClientRect();
                rect = {
                  top: editorRect.top,
                  left: editorRect.left + (editorRect.width / 2),
                  bottom: editorRect.top + 20,
                  right: editorRect.left + (editorRect.width / 2),
                  width: 0,
                  height: 20
                };
              } else {
                // 일반 선택 시 기존 방식
                rect = {
                  top: coords.top,
                  left: coords.left,
                  bottom: endCoords.bottom,
                  right: endCoords.right,
                  width: endCoords.right - coords.left,
                  height: endCoords.bottom - coords.top
                };
              }
              
              const selectionData = {
                text: selectedText,
                rect: rect,
                element: editorRef.current,
                range: { from: selection.from, to: selection.to },
                selection: selection,
                prosemirror: true
              };
              setToolbarSelection(selectionData);
              if (selectionManager) {
                selectionManager.handleProseMirrorSelectionChange({
                  view: viewRef.current,
                  selection,
                  blockId,
                  transaction: null,
                  eventType: 'mouseup',
                  originalEvent: event
                });
              }
            } catch (error) {
              console.warn('[ProseMirror] Error getting selection coords:', error);
            }
          } else {
            setToolbarSelection(null);
          }
        } else {
          setToolbarSelection(null);
        }
      }, 10);
    };

    const handleMouseMove = (event) => {
      // 기본 드래그 감지 로그
      if (event.buttons === 1) {
        console.log('🖱️ Mouse move with button pressed', {
          buttons: event.buttons,
          hasViewRef: !!viewRef.current,
          blockId: blockId
        });
      }
      
      // 크로스 블록 드래그 감지 - 더 간단한 접근법
      if (event.buttons === 1 && viewRef.current) { 
        // 먼저 블록 확인을 하고 나서 쓰로틀링 적용 (블록이 다른 경우는 즉시 처리)
        const currentBlockElement = editorRef.current.closest('[data-block-id]');
        const mouseTarget = document.elementFromPoint(event.clientX, event.clientY);
        let targetBlockElement = mouseTarget?.closest('[data-block-id]');
        
        // 마우스 위치에서 블록을 찾지 못한 경우, 현재 blockId와 비교
        const currentBlockId = currentBlockElement?.getAttribute('data-block-id');
        const targetBlockId = targetBlockElement?.getAttribute('data-block-id');
        
        // blockId가 변경되었다면 크로스 블록으로 간주
        const isDifferentBlock = (currentBlockId !== targetBlockId) || (blockId !== currentBlockId);
        
        console.log('🧭 Block ID comparison', {
          propsBlockId: blockId,
          currentBlockId: currentBlockId,
          targetBlockId: targetBlockId,
          isDifferentBlock: isDifferentBlock
        });
        
        // 블록이 같으면 쓰로틀링 적용, 다르면 즉시 처리
        if (!isDifferentBlock) {
          if (crossBlockDragState.current.throttleTimeout) {
            console.log('⏱️ Same block, throttled');
            return;
          }
          
          crossBlockDragState.current.throttleTimeout = setTimeout(() => {
            crossBlockDragState.current.throttleTimeout = null;
          }, 100);
        } else {
          console.log('🔥 Different block detected - bypassing throttle!');
        }
        
        console.log('🔍 Block detection', {
          currentBlock: currentBlockId,
          targetBlock: targetBlockId,
          mouseTarget: mouseTarget?.tagName,
          mousePos: { x: event.clientX, y: event.clientY }
        });
        
        if (currentBlockElement && targetBlockElement) {
          console.log('📦 Comparing blocks', {
            current: currentBlockId,
            target: targetBlockId,
            different: currentBlockId !== targetBlockId,
            lastTarget: crossBlockDragState.current.lastTargetBlockId,
            hasSelectionManager: !!selectionManager
          });
          
          // 다른 블록으로 확장되는 경우 감지 (개선된 감지 로직)
          if (isDifferentBlock && 
              blockId !== crossBlockDragState.current.lastTargetBlockId && 
              selectionManager) {
            
            console.log('[ProseMirror] 🎯 Cross-block drag detected (native approach)', {
              fromBlock: currentBlockId,
              toBlock: targetBlockId || 'unknown',
              propsBlockId: blockId,
              mousePos: { x: event.clientX, y: event.clientY }
            });
            
            crossBlockDragState.current.isActive = true;
            crossBlockDragState.current.lastTargetBlockId = blockId; // props blockId 사용
            
            // 타겟 블록 요소를 찾기 위해 다른 방법 시도
            if (!targetBlockElement) {
              // blockId로 블록 요소 찾기
              targetBlockElement = document.querySelector(`[data-block-id="${blockId}"]`);
            }
            
            // 네이티브 브라우저 선택 직접 생성 시도
            if (targetBlockElement) {
              selectionManager.createNativeCrossBlockSelection({
                startElement: currentBlockElement,
                endElement: targetBlockElement,
                startBlockId: currentBlockId,
                endBlockId: blockId, // props blockId 사용
                mouseEvent: event
              });
            } else {
              console.warn('Target block element not found for blockId:', blockId);
            }
          }
        }
      }
    };

    // 이벤트 리스너 추가
    const view = viewRef.current;
    view.dom.addEventListener('keydown', handleKeyDown);
    view.dom.addEventListener('mouseup', handleMouseUp);
    view.dom.addEventListener('mousemove', handleMouseMove);
    // keyup에서는 selection set을 하지 않는다.
    // view.dom.addEventListener('keyup', handleKeyUp); // 제거
    return () => {
      view.dom.removeEventListener('keydown', handleKeyDown);
      view.dom.removeEventListener('mouseup', handleMouseUp);
      view.dom.removeEventListener('mousemove', handleMouseMove);
      // view.dom.removeEventListener('keyup', handleKeyUp); // 제거
    };
  }, [blockId]);

  // 읽기 전용 모드 변경
  useEffect(() => {
    if (viewRef.current) {
      const newState = createEditorState(content);
      viewRef.current.updateState(newState);
    }
  }, [readOnly]);

  // selection이 null로 바뀔 때 ProseMirror EditorView의 blur()를 호출하여 커서/하이라이트까지 완전히 해제
  useEffect(() => {
    if (selection === null && viewRef.current) {
      // ProseMirror 내부 커서/selection 완전 해제 (EditorView에는 blur()가 없으므로 dom.blur() 사용)
      if (viewRef.current.dom && typeof viewRef.current.dom.blur === 'function') {
        viewRef.current.dom.blur();
      }
    }
  }, [selection]);

  return (
    <div
      ref={(element) => {
        // ref를 부모에게 전달
        if (ref) {
          if (typeof ref === 'function') {
            ref(element);
          } else {
            ref.current = element;
          }
        }
        // 내부 ref도 설정
        editorRef.current = element;
      }}
      className={`prosemirror-text-editor ${className}`}
      style={{
        outline: 'none',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#374151',
        minHeight: '1.5em',
        cursor: 'text', // 텍스트 커서 명시적 설정
        position: 'relative',
        ...style
      }}
    >
      {/* 툴바 자동 렌더 */}
      {toolbarSelection && (
        <NotionLikeToolbar
          selection={toolbarSelection}
          currentFormat={currentFormat}
          onFormatChange={(cmd, value) => {
            setCurrentFormat(prev => ({ ...prev, [cmd]: value }));
            applyFormat(cmd, value);
          }}
          onSelectionCleared={() => {
            setToolbarSelection(null);
            setCurrentFormat({});
          }}
        />
      )}
    </div>
  );
});

export default ProseMirrorTextEditor; 