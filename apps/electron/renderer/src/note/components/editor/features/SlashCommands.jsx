/**
 * 슬래시 명령어 시스템
 * 
 * @description 노션과 같은 슬래시 명령어 기능
 * @author AI Assistant
 * @version 1.0.0
 */

import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

// 명령어 정의
export const SLASH_COMMANDS = [
  {
    id: 'text',
    title: '텍스트',
    description: '일반 텍스트 블록',
    icon: '📝',
    action: (state, dispatch) => {
      // 텍스트 블록으로 변환
      return true;
    }
  },
  {
    id: 'heading1',
    title: '제목 1',
    description: '큰 제목',
    icon: 'H1',
    action: (state, dispatch) => {
      const { selection } = state;
      const tr = state.tr.setBlockType(selection.from, selection.to, state.schema.nodes.heading, { level: 1 });
      dispatch(tr);
      return true;
    }
  },
  {
    id: 'heading2',
    title: '제목 2',
    description: '중간 제목',
    icon: 'H2',
    action: (state, dispatch) => {
      const { selection } = state;
      const tr = state.tr.setBlockType(selection.from, selection.to, state.schema.nodes.heading, { level: 2 });
      dispatch(tr);
      return true;
    }
  },
  {
    id: 'heading3',
    title: '제목 3',
    description: '작은 제목',
    icon: 'H3',
    action: (state, dispatch) => {
      const { selection } = state;
      const tr = state.tr.setBlockType(selection.from, selection.to, state.schema.nodes.heading, { level: 3 });
      dispatch(tr);
      return true;
    }
  },
  {
    id: 'bullet_list',
    title: '글머리 기호 목록',
    description: '글머리 기호가 있는 목록',
    icon: '•',
    action: (state, dispatch) => {
      const { selection } = state;
      const tr = state.tr.setBlockType(selection.from, selection.to, state.schema.nodes.bullet_list);
      dispatch(tr);
      return true;
    }
  },
  {
    id: 'ordered_list',
    title: '번호 매기기 목록',
    description: '번호가 매겨진 목록',
    icon: '1.',
    action: (state, dispatch) => {
      const { selection } = state;
      const tr = state.tr.setBlockType(selection.from, selection.to, state.schema.nodes.ordered_list);
      dispatch(tr);
      return true;
    }
  },
  {
    id: 'blockquote',
    title: '인용구',
    description: '인용 블록',
    icon: '💬',
    action: (state, dispatch) => {
      const { selection } = state;
      const tr = state.tr.setBlockType(selection.from, selection.to, state.schema.nodes.blockquote);
      dispatch(tr);
      return true;
    }
  },
  {
    id: 'code',
    title: '코드',
    description: '코드 블록',
    icon: '💻',
    action: (state, dispatch) => {
      // 코드 블록 구현 (나중에 확장)
      return true;
    }
  },
  {
    id: 'divider',
    title: '구분선',
    description: '수평 구분선',
    icon: '➖',
    action: (state, dispatch) => {
      // 구분선 구현 (나중에 확장)
      return true;
    }
  }
];

/**
 * 슬래시 명령어 플러그인 생성
 */
export function createSlashCommandsPlugin(onShowCommands, onHideCommands) {
  return new Plugin({
    state: {
      init() {
        return {
          showCommands: false,
          commands: [],
          selectedIndex: 0,
          query: ''
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
      handleKeyDown(view, event) {
        const { state } = view;
        const slashState = this.getState(state);
        
        if (slashState.showCommands) {
          switch (event.key) {
            case 'ArrowDown':
              event.preventDefault();
              const nextIndex = (slashState.selectedIndex + 1) % slashState.commands.length;
              this.updateState(state, { selectedIndex: nextIndex });
              return true;
            case 'ArrowUp':
              event.preventDefault();
              const prevIndex = slashState.selectedIndex === 0 
                ? slashState.commands.length - 1 
                : slashState.selectedIndex - 1;
              this.updateState(state, { selectedIndex: prevIndex });
              return true;
            case 'Enter':
              event.preventDefault();
              const selectedCommand = slashState.commands[slashState.selectedIndex];
              if (selectedCommand) {
                selectedCommand.action(state, view.dispatch);
                this.hideCommands(state, view.dispatch);
              }
              return true;
            case 'Escape':
              event.preventDefault();
              this.hideCommands(state, view.dispatch);
              return true;
          }
        }
        
        return false;
      },
      handleTextInput(view, from, to, text) {
        const { state } = view;
        const pos = state.selection.from;
        const node = state.doc.nodeAt(pos - 1);
        
        if (text === '/' && (!node || node.type.name === 'paragraph')) {
          // 슬래시 입력 감지
          this.showCommands(state, view.dispatch, SLASH_COMMANDS);
          return true;
        }
        
        if (this.getState(state).showCommands) {
          // 명령어 검색
          const query = text.toLowerCase();
          const filteredCommands = SLASH_COMMANDS.filter(cmd => 
            cmd.title.toLowerCase().includes(query) || 
            cmd.description.toLowerCase().includes(query)
          );
          this.updateState(state, { 
            commands: filteredCommands, 
            query: query,
            selectedIndex: 0 
          });
          return true;
        }
        
        return false;
      }
    },
    view() {
      return {
        update: (view, prevState) => {
          const prevSlashState = this.getState(prevState);
          const slashState = this.getState(view.state);
          
          if (slashState.showCommands && !prevSlashState.showCommands) {
            onShowCommands(slashState);
          } else if (!slashState.showCommands && prevSlashState.showCommands) {
            onHideCommands();
          } else if (slashState.showCommands && prevSlashState.showCommands) {
            onShowCommands(slashState);
          }
        }
      };
    }
  });
}

/**
 * 슬래시 명령어 메뉴 컴포넌트
 */
export const SlashCommandsMenu = ({ 
  isVisible, 
  commands = [], 
  selectedIndex = 0, 
  position = { x: 0, y: 0 } 
}) => {
  if (!isVisible || commands.length === 0) return null;

  return (
    <div 
      className="slash-commands-menu"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        maxHeight: '300px',
        overflow: 'auto',
        minWidth: '200px'
      }}
    >
      {commands.map((command, index) => (
        <div
          key={command.id}
          className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: index === selectedIndex ? '#f3f4f6' : 'transparent',
            borderBottom: index < commands.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}
        >
          <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>
            {command.icon}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>
              {command.title}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {command.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 