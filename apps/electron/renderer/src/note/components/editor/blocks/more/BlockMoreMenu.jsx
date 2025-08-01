import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

const BlockMoreMenu = ({ show, setShow, onDuplicate, onDelete, anchorRef, children }) => {
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (show && anchorRef && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const menuWidth = 140; // 줄어든 메뉴 너비(px)
      const left = Math.min(
        rect.left,
        window.innerWidth - menuWidth - 16
      );
      setMenuPos({
        top: rect.bottom + 4,
        left
      });
    }
  }, [show, anchorRef]);

  useEffect(() => {
    if (!show) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && (!anchorRef || !anchorRef.current.contains(e.target))) {
        setShow(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShow(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [show, setShow, anchorRef]);

  if (!show) return null;

  return ReactDOM.createPortal(
    <div>
      {/* 오버레이 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9998,
          background: 'transparent',
          pointerEvents: 'auto',
        }}
        onClick={() => setShow(false)}
      />
      {/* 메뉴 */}
      <div
        ref={menuRef}
        className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1.5 z-10 min-w-[140px] backdrop-blur-sm"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          zIndex: 9999,
          pointerEvents: 'auto',
          boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 복제 버튼 */}
        <button
          onClick={e => {
            e.stopPropagation();
            onDuplicate();
            setShow(false);
          }}
          className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-150 group"
        >
          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-all duration-150">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </span>
          <span className="font-medium">복제</span>
        </button>
        
        {/* 구분선 */}
        <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2 my-0.5"></div>
        
        {/* 블록 색상 */}
        <div className="px-0.5">
          {children}
        </div>
        
        {/* 구분선 */}
        <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2 my-0.5"></div>
        
        {/* 삭제 버튼 */}
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete();
            setShow(false);
          }}
          className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-150 group"
        >
          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-all duration-150">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6v14a2,2 0,0,1,-2,2H7a2,2 0,0,1,-2,-2V6m3,0V4a2,2 0,0,1,2,-2h4a2,2 0,0,1,2,2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </span>
          <span className="font-medium">삭제</span>
        </button>
      </div>
    </div>,
    document.body
  );
};

export default BlockMoreMenu; 