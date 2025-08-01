import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

// 블록 타입 정보 (섹션별 그룹핑)
const BLOCK_SECTIONS = [
  {
    label: '기본/텍스트',
    blocks: [
      { type: 'text', label: '텍스트', icon: <span className="font-bold text-base">T</span> },
      { type: 'heading1', label: '제목 1', icon: <span className="font-bold text-lg">H1</span> },
      { type: 'heading2', label: '제목 2', icon: <span className="font-bold text-base">H2</span> },
      { type: 'heading3', label: '제목 3', icon: <span className="font-bold text-sm">H3</span> },
      { type: 'quote', label: '인용구', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 17a4 4 0 0 1 4-4V7a4 4 0 0 0-4 4v6zm10 0a4 4 0 0 1 4-4V7a4 4 0 0 0-4 4v6z"/></svg> },
      { type: 'divider', label: '구분선', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="4" y1="12" x2="20" y2="12"/></svg> },
      { type: 'code', label: '코드', icon: <span className="font-mono text-base">{'</>'}</span> },
      { type: 'bulletList', label: '불릿 리스트', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="7" cy="7" r="2"/><circle cx="7" cy="12" r="2"/><circle cx="7" cy="17" r="2"/><line x1="11" y1="7" x2="21" y2="7"/><line x1="11" y1="12" x2="21" y2="12"/><line x1="11" y1="17" x2="21" y2="17"/></svg> },
      { type: 'numberedList', label: '번호 리스트', icon: <span className="font-mono text-base">1.</span> },
      { type: 'checkList', label: '체크 리스트', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><polyline points="9 12 12 15 17 10"/></svg> },
    ]
  },
  {
    label: '레이아웃',
    blocks: [
      { type: 'column2', label: '2열 레이아웃', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg> },
      { type: 'column3', label: '3열 레이아웃', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="5" height="18"/><rect x="9" y="3" width="5" height="18"/><rect x="16" y="3" width="5" height="18"/></svg> },
      { type: 'column4', label: '4열 레이아웃', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="4" height="18"/><rect x="7" y="3" width="4" height="18"/><rect x="13" y="3" width="4" height="18"/><rect x="19" y="3" width="4" height="18"/></svg> },
      { 
        type: 'designLayouts', 
        label: '디자인 블록', 
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>,
        hasSubmenu: true,
        submenuItems: [
          { type: 'sidebarLayout', label: '사이드바 블록', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="13" height="18"/><rect x="17" y="3" width="4" height="18"/></svg> },
          { type: 'tabLayout', label: '탭 블록', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14"/><path d="M3 7V5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2m4-2h4c1.1 0 2 .9 2 2v2"/></svg> },
          { type: 'accordionLayout', label: '아코디언 블록', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="4"/><rect x="3" y="9" width="18" height="4"/><rect x="3" y="15" width="18" height="4"/></svg> },
          { type: 'gridLayout', label: '그리드 블록', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
          { type: 'timelineLayout', label: '타임라인 블록', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="3" x2="12" y2="21"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/></svg> },
          { type: 'cardLayout', label: '카드 블록', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="8" rx="2"/><rect x="4" y="14" width="16" height="6" rx="2"/></svg> },
          { type: 'heroLayout', label: '히어로 블록', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="10"/><rect x="3" y="17" width="5" height="2"/><rect x="10" y="17" width="11" height="2"/></svg> },
          { type: 'splitLayout', label: '분할 블록', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v18M3 12h18"/></svg> },
        ]
      },
    ]
  },
  {
    label: '미디어',
    blocks: [
      { type: 'image', label: '이미지', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
      { type: 'video', label: '비디오', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><polygon points="10,9 16,12 10,15"/></svg> },
      { type: 'audio', label: '오디오', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8v8m8-8v8"/></svg> },
      { type: 'file', label: '파일', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8"/></svg> },
      { type: 'gallery', label: '갤러리', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/><rect x="12" y="12" width="6" height="6"/></svg> },
    ]
  },
  {
    label: '데이터/표',
    blocks: [
      { type: 'table', label: '표', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg> },
      { type: 'chart', label: '차트', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="12" width="4" height="8"/><rect x="10" y="8" width="4" height="12"/><rect x="16" y="4" width="4" height="16"/></svg> },
      { type: 'timeline', label: '타임라인', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><line x1="6" y1="12" x2="18" y2="12"/></svg> },
      { type: 'board', label: '보드', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg> },
      { type: 'progressBar', label: '진행바', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="4" rx="2"/></svg> },
      { type: 'rating', label: '별점', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12,2 15,8.5 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 9,8.5"/></svg> },
    ]
  },
  {
    label: '인터랙티브',
    blocks: [
      { type: 'toggle', label: '토글', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg> },
      { type: 'button', label: '버튼', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="4" rx="2"/></svg> },
      { type: 'poll', label: '투표', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8"/></svg> },
      { type: 'comment', label: '댓글', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="8"/><path d="M12 20v4"/></svg> },
      { type: 'reminder', label: '리마인더', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
      { type: 'tag', label: '태그', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8v8H8z"/></svg> },
      { type: 'alert', label: '알림', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1"/></svg> },
      { type: 'calendar', label: '캘린더', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="15" r="1"/></svg> },
    ]
  },
  {
    label: '임베드/외부',
    blocks: [
      { type: 'webEmbed', label: '웹 임베드', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8v8H8z"/></svg> },
      { type: 'pdfEmbed', label: 'PDF', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8v8H8z"/></svg> },
      { type: 'mermaid', label: 'Mermaid', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg> },
      { type: 'math', label: '수식', icon: <span className="font-mono text-base">∑</span> },
      { type: 'customHTML', label: 'Custom HTML', icon: <span className="font-mono text-base">{'</>'}</span> },
      { type: 'profile', label: '프로필', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><rect x="6" y="14" width="12" height="6" rx="3"/></svg> },
    ]
  },
  {
    label: '페이지',
    blocks: [
      { type: 'page', label: '새 페이지', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8v8H8z"/></svg> },
    ]
  },
];

const PlusButton = React.forwardRef(({ onAdd, index, onMenuOpenChange, isTypeChangeMode = false, onTypeChange, block, blocks }, ref) => {
  const [open, setOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const submenuRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // 열블록 그룹의 마지막 인덱스를 찾는 헬퍼 함수
  const findColumnGroupEnd = (startIndex, totalColumns) => {
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
  };

  // 메뉴 외부 클릭, ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        (!submenuRef.current || !submenuRef.current.contains(event.target))
      ) {
        setOpen(false);
        setHoveredItem(null);
      }
    };
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setHoveredItem(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);
  
  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // open 상태가 바뀔 때 상위에 알림
  useEffect(() => {
    if (onMenuOpenChange) {
      onMenuOpenChange(open);
    }
  }, [open, onMenuOpenChange]);

  // 메뉴 Portal 위치 계산
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [open]);

  // 키보드 접근성: 첫 메뉴 아이템에 포커스
  useEffect(() => {
    if (open && menuRef.current) {
      const firstBtn = menuRef.current.querySelector('button');
      if (firstBtn) firstBtn.focus();
    }
  }, [open]);

  // 블록 타입 선택 핸들러
  const handleBlockSelect = (blockType) => {
    // 디자인 레이아웃은 서브메뉴를 열기만 하고 선택하지 않음
    if (blockType === 'designLayouts') {
      return;
    }
    
    if (isTypeChangeMode && onTypeChange) {
      // 타입 변경 모드: 열 블록은 별도 처리
      if (blockType.startsWith('column')) {
        const columnCount = parseInt(blockType.replace('column', ''));
        onTypeChange('column', columnCount); // column 타입과 열 개수 전달
      } else {
        onTypeChange(blockType);
      }
    } else if (onAdd) {
      // 새 블록 추가 모드: 다음 블록에 새 블록 추가
      
      // 현재 블록이 열블록 내부에 있는지 확인
      const isInColumnBlock = block?.metadata?.isColumnBlock === true;
      let insertIndex = index + 1;
      
      if (isInColumnBlock) {
        // 열블록 내부에서 추가하는 경우, 현재 열블록 그룹의 끝 다음에 추가
        const currentTotalColumns = block.metadata.totalColumns;
        const columnGroupEnd = findColumnGroupEnd(index, currentTotalColumns);
        insertIndex = columnGroupEnd + 1;
      }
      
      // 열 타입 처리
      if (blockType.startsWith('column')) {
        const columnCount = parseInt(blockType.replace('column', ''));
        
        // 그리드 그룹 ID 생성
        const groupId = `grid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 각 열에 대해 텍스트 블록 생성
        for (let i = 0; i < columnCount; i++) {
          const metadata = { 
            isColumnBlock: true, 
            columnIndex: i,
            totalColumns: columnCount,
            rowSpan: 1,        // 초기에는 모든 블록이 1행
            rowIndex: 0,       // 첫 번째 행
            groupId: groupId   // 같은 그리드 그룹
          };
          
          // 첫 번째 열이 아닌 경우 포커스하지 않음
          if (i !== 0) {
            metadata.shouldFocus = false;
          }
          
          onAdd('text', '', insertIndex + i, metadata);
        }
      } else {
        // 일반 블록 추가
        onAdd(blockType, '', insertIndex);
      }
    }
    setOpen(false);
  };

  // 메뉴 내부 빈 공간 클릭 핸들러
  const handleMenuClick = (e) => {
    // 버튼이나 다른 클릭 가능한 요소가 아닌 경우에만 메뉴 닫기
    if (e.target === e.currentTarget || e.target.tagName === 'DIV') {
      setOpen(false);
    }
  };

  // 아이템 호버 핸들러
  const handleItemHover = (item, event) => {
    console.log('[PlusButton] Item hover:', item.type, item.hasSubmenu, item.submenuItems);
    if (!item.hasSubmenu || !item.submenuItems) return;
    
    // 지연 후 서브메뉴 표시
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // 즉시 rect를 가져와서 저장 (timeout 안에서 currentTarget이 null이 될 수 있음)
    const target = event.currentTarget;
    if (!target) return;
    
    const rect = target.getBoundingClientRect();
    console.log('[PlusButton] Setting submenu position:', rect);
    
    hoverTimeoutRef.current = setTimeout(() => {
      setSubmenuPosition({
        top: rect.top,
        left: rect.right + 4
      });
      setHoveredItem(item.type);
    }, 200); // 200ms 지연
  };

  // 아이템 호버 아웃 핸들러
  const handleItemLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // 서브메뉴로 이동할 시간을 주기 위해 약간의 지연
    hoverTimeoutRef.current = setTimeout(() => {
      if (!submenuRef.current?.matches(':hover')) {
        setHoveredItem(null);
      }
    }, 100);
  };

  // 서브메뉴 호버 핸들러
  const handleSubmenuHover = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // 서브메뉴 호버 아웃 핸들러
  const handleSubmenuLeave = () => {
    setHoveredItem(null);
  };

  // 메뉴 렌더링 (Portal)
  const menu = open ? ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9998,
        background: 'transparent',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        ref={menuRef}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: menuPos.top,
          left: menuPos.left,
          minWidth: 240,
          maxWidth: 320,
          background: 'white',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid #e5e7eb',
          zIndex: 9999,
          padding: '8px 0',
          maxHeight: 400,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="custom-scrollbar plus-menu-animate"
        role="menu"
        aria-label="블록 타입 선택"
      >
        {BLOCK_SECTIONS.map((section, si) => (
          <div key={section.label}>
            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
              {section.label}
            </div>
            {section.blocks.map((blockType, i) => (
              <button
                key={blockType.type}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!blockType.hasSubmenu) {
                    handleBlockSelect(blockType.type);
                  }
                }}
                onMouseEnter={(e) => handleItemHover(blockType, e)}
                onMouseLeave={handleItemLeave}
                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-150 font-normal focus:bg-blue-50 focus:outline-none ${blockType.hasSubmenu ? 'cursor-default' : 'cursor-pointer'}`}
                role="menuitem"
                aria-label={`${blockType.label} ${blockType.hasSubmenu ? '메뉴' : '블록 추가'}`}
                type="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (!blockType.hasSubmenu) {
                      handleBlockSelect(blockType.type);
                    }
                  }
                }}
              >
                <span className="text-base text-gray-500 dark:text-gray-400">
                  {blockType.icon}
                </span>
                <span className="flex-1">{blockType.label}</span>
                {blockType.hasSubmenu && (
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}
            
            {si < BLOCK_SECTIONS.length - 1 && <div className="my-2 border-t border-gray-200" />}
          </div>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  // 서브메뉴 Portal (별도로 렌더링)
  const submenu = hoveredItem && open ? (() => {
    console.log('[PlusButton] Rendering submenu for:', hoveredItem);
    let submenuItems = null;
    
    // 모든 섹션에서 해당 아이템 찾기
    for (const section of BLOCK_SECTIONS) {
      const item = section.blocks.find(b => b.type === hoveredItem);
      if (item?.submenuItems) {
        submenuItems = item.submenuItems;
        break;
      }
    }
    
    console.log('[PlusButton] Found submenu items:', submenuItems);
    if (!submenuItems) return null;
    
    return ReactDOM.createPortal(
      <div
        ref={submenuRef}
        onMouseEnter={handleSubmenuHover}
        onMouseLeave={handleSubmenuLeave}
        style={{
          position: 'fixed',
          top: submenuPosition.top,
          left: submenuPosition.left,
          minWidth: 240,
          maxWidth: 320,
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          zIndex: 10000,
          padding: '8px 0',
          maxHeight: 400,
          overflowY: 'auto',
        }}
        className="custom-scrollbar submenu-animate bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        {submenuItems.map((blockType) => (
          <button
            key={blockType.type}
            onClick={() => handleBlockSelect(blockType.type)}
            className="w-full text-left px-4 py-2 text-sm flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-150 font-normal focus:bg-blue-50 focus:outline-none"
            role="menuitem"
            aria-label={`${blockType.label} 블록 추가`}
            type="button"
            tabIndex={0}
          >
            <span className="text-base text-gray-500 dark:text-gray-400">
              {blockType.icon}
            </span>
            <span>{blockType.label}</span>
          </button>
        ))}
      </div>,
      document.body
    );
  })() : null;

  return (
    <>
      <button
        ref={(node) => {
          buttonRef.current = node;
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
        onClick={() => setOpen(!open)}
        className="plus-button w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600 transition-colors duration-150 shadow-sm"
        title="블록 추가"
        aria-label="블록 추가"
        aria-expanded={open}
        aria-haspopup="true"
        type="button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      {menu}
      {submenu}
      {/* 메뉴 등장 애니메이션 스타일 */}
      <style>{`
        .plus-menu-animate {
          animation: plus-menu-pop 0.28s cubic-bezier(0.4,1.4,0.4,1);
        }
        .submenu-animate {
          animation: submenu-slide 0.2s ease-out;
        }
        @keyframes plus-menu-pop {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes submenu-slide {
          0% {
            opacity: 0;
            transform: translateX(-8px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
});

// PropTypes 정의
PlusButton.propTypes = {
  onAdd: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  onMenuOpenChange: PropTypes.func,
  isTypeChangeMode: PropTypes.bool,
  onTypeChange: PropTypes.func,
  block: PropTypes.object,
  blocks: PropTypes.array,
};

export default PlusButton;