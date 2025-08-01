import { Plugin } from 'prosemirror-state';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { inputRules, InputRule, wrappingInputRule, textblockTypeInputRule } from 'prosemirror-inputrules';
import { chainCommands, newlineInCode } from 'prosemirror-commands';

// 리스트 관련 명령어들 제거 (CSS로 처리)
// const splitListItem = (itemType) => (state, dispatch) => { ... };
// const liftListItem = (itemType) => (state, dispatch) => { ... };
// const liftTarget = (doc, range) => { ... };

// 플레이스홀더 플러그인
const placeholderPlugin = (placeholder) => new Plugin({
  props: {
    decorations: (state) => {
      const { doc } = state;
      if (doc.childCount === 1 && doc.firstChild.content.size === 0) {
        const decoration = Decoration.widget(0, () => {
          const span = document.createElement('span');
          span.textContent = placeholder;
          span.style.cssText = `
            color: #9ca3af;
            pointer-events: none;
            position: absolute;
            user-select: none;
          `;
          return span;
        });
        return DecorationSet.create(doc, [decoration]);
      }
      return null;
    }
  }
});

// 선택 관리 플러그인
const selectionPlugin = (onSelectionChange) => new Plugin({
  props: {
    handleDOMEvents: {
      mouseup: (view, event) => {
        const { state } = view;
        const selection = state.selection;
        
        if (!selection.empty && onSelectionChange) {
          const selectedText = state.doc.textBetween(selection.from, selection.to);
          onSelectionChange({
            text: selectedText,
            from: selection.from,
            to: selection.to,
            rect: view.coordsAtPos(selection.from)
          });
        } else if (onSelectionChange) {
          onSelectionChange(null);
        }
        
        return false;
      }
    }
  }
});

// 읽기 전용 플러그인
const readOnlyPlugin = (readOnly) => new Plugin({
  props: {
    editable: () => !readOnly
  }
});

// 입력 규칙 플러그인 (공식 방식)
const inputRulesPlugin = (schema) => {
  // 제목 규칙들
  const headingRule1 = textblockTypeInputRule(/^(#{1})\s$/, schema.nodes.heading, match => ({ level: 1 }));
  const headingRule2 = textblockTypeInputRule(/^(#{2})\s$/, schema.nodes.heading, match => ({ level: 2 }));
  const headingRule3 = textblockTypeInputRule(/^(#{3})\s$/, schema.nodes.heading, match => ({ level: 3 }));
  const headingRule4 = textblockTypeInputRule(/^(#{4})\s$/, schema.nodes.heading, match => ({ level: 4 }));
  const headingRule5 = textblockTypeInputRule(/^(#{5})\s$/, schema.nodes.heading, match => ({ level: 5 }));
  const headingRule6 = textblockTypeInputRule(/^(#{6})\s$/, schema.nodes.heading, match => ({ level: 6 }));
  
  // 기타 블록 규칙들 (리스트 관련 제거)
  const blockquoteRule = wrappingInputRule(/^>\s$/, schema.nodes.blockquote);
  const codeBlockRule = textblockTypeInputRule(/^```$/, schema.nodes.code_block);
  const hrRule = new InputRule(/^---$/, (state, match, start, end) => {
    const { tr } = state;
    if (match) tr.replaceWith(start - 3, end, schema.nodes.horizontal_rule.create());
    return tr;
  });
  
  return inputRules({
    rules: [
      headingRule1,
      headingRule2,
      headingRule3,
      headingRule4,
      headingRule5,
      headingRule6,
      blockquoteRule,
      codeBlockRule,
      hrRule
    ]
  });
};

// 커스텀 키맵 (텍스트 포맷팅)
const customKeymap = (schema, isSingleEditor = false) => {
  const keymap = {};
  
  // Ctrl/Cmd + B: 볼드
  keymap['Mod-b'] = toggleMark(schema.marks.bold);
  
  // Ctrl/Cmd + I: 이탤릭
  keymap['Mod-i'] = toggleMark(schema.marks.italic);
  
  // Ctrl/Cmd + U: 밑줄
  keymap['Mod-u'] = toggleMark(schema.marks.underline);
  
  // Ctrl/Cmd + 1~6: 제목 레벨 변경
  keymap['Mod-1'] = setBlockType(schema.nodes.heading, { level: 1 });
  keymap['Mod-2'] = setBlockType(schema.nodes.heading, { level: 2 });
  keymap['Mod-3'] = setBlockType(schema.nodes.heading, { level: 3 });
  keymap['Mod-4'] = setBlockType(schema.nodes.heading, { level: 4 });
  keymap['Mod-5'] = setBlockType(schema.nodes.heading, { level: 5 });
  keymap['Mod-6'] = setBlockType(schema.nodes.heading, { level: 6 });
  
  // Ctrl/Cmd + 0: 일반 텍스트로 변경
  keymap['Mod-0'] = setBlockType(schema.nodes.paragraph);
  
  // Ctrl/Cmd + Shift + Q: 인용구로 변경
  keymap['Mod-Shift-q'] = setBlockType(schema.nodes.blockquote);
  
  // Ctrl/Cmd + Shift + C: 코드 블록으로 변경
  keymap['Mod-Shift-c'] = setBlockType(schema.nodes.code_block);
  
  // 리스트 관련 단축키 제거 (CSS로 처리)
  // Ctrl/Cmd + Shift + L: 불릿 리스트로 변경
  // keymap['Mod-Shift-l'] = wrapIn(schema.nodes.bullet_list);
  
  // Ctrl/Cmd + Shift + O: 번호 리스트로 변경
  // keymap['Mod-Shift-o'] = wrapIn(schema.nodes.ordered_list);
  
  // Enter 키 처리
  if (!isSingleEditor) {
    // 블록 에디터에서만 Enter 키를 차단 (BlockEditor에서 처리)
    keymap['Enter'] = (state, dispatch) => {
      return false;
    };
  } else {
    // 단일 에디터에서는 Enter 키를 ProseMirror 기본 동작으로 처리
    keymap['Enter'] = baseKeymap['Enter'];
  }
  
  // Tab 키 처리 (BlockEditor에서 처리하도록 false 반환)
  keymap['Tab'] = (state, dispatch) => {
    // BlockEditor에서 Tab 키 처리
    return false;
  };
  
  // Shift+Tab 키 처리 (BlockEditor에서 처리하도록 false 반환)
  keymap['Shift-Tab'] = (state, dispatch) => {
    // BlockEditor에서 Shift+Tab 키 처리
    return false;
  };
  
  // Ctrl/Cmd + Z: 실행 취소 - BlockEditor에서 처리하도록 제거
  // ProseMirror 레벨에서는 undo/redo를 처리하지 않음
  
  // Ctrl/Cmd + Shift + Z: 다시 실행 - BlockEditor에서 처리하도록 제거
  // ProseMirror 레벨에서는 undo/redo를 처리하지 않음
  
  // Shift+Enter: 줄바꿈(soft break)
  keymap['Shift-Enter'] = chainCommands(
    newlineInCode,
    (state, dispatch) => {
      if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView());
      }
      return true;
    }
  );
  
  // baseKeymap에서 필요한 키들만 제외하고 나머지는 유지
  const filteredBaseKeymap = { ...baseKeymap };
  
  // 단일 에디터 모드가 아닐 때만 Enter 키 제거
  if (!isSingleEditor) {
    delete filteredBaseKeymap['Enter'];
  }
  
  delete filteredBaseKeymap['Tab'];
  delete filteredBaseKeymap['Shift-Tab'];
  
  return { ...filteredBaseKeymap, ...keymap };
};

// 플러그인 통합
export const plugins = ({ placeholder, onSelectionChange, readOnly, onFormatChange, schema, isSingleEditor = false }) => [
  // history() 플러그인 제거 - BlockEditor에서 히스토리를 관리
  placeholderPlugin(placeholder),
  selectionPlugin(onSelectionChange),
  readOnlyPlugin(readOnly),
  inputRulesPlugin(schema),
  keymap(customKeymap(schema, isSingleEditor))
]; 