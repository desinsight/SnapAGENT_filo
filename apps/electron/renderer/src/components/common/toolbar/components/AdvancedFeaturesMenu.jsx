/**
 * 고급 기능 메뉴 컴포넌트
 * 
 * @description 실행 취소/다시 실행, 표, 체크박스, 이미지, 콜아웃, 수식, 임베드 등 고급 기능 선택 메뉴
 * @author AI Assistant
 * @version 1.0.0
 */

import React from 'react';

const AdvancedFeaturesMenu = ({ onFeatureSelect }) => {
  // 고급 기능 메뉴
  const ADVANCED_FEATURES = [
    { 
      cmd: 'undo', 
      label: '실행 취소', 
      title: '실행 취소',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>,
      shortcut: '⌘Z'
    },
    { 
      cmd: 'redo', 
      label: '다시 실행', 
      title: '다시 실행',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>,
      shortcut: '⌘⇧Z'
    },
    { 
      cmd: 'table', 
      label: '표 삽입', 
      title: '3x3 표',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" /></svg>,
      shortcut: '⌘⇧T'
    },
    { 
      cmd: 'checkbox', 
      label: '체크박스', 
      title: '할 일 목록',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      shortcut: '⌘⇧X'
    },
    { 
      cmd: 'image', 
      label: '이미지', 
      title: '이미지 삽입',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      shortcut: '⌘⇧I'
    },
    { 
      cmd: 'callout', 
      label: '콜아웃', 
      title: '강조 상자',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      shortcut: '⌘⇧K'
    },
    { 
      cmd: 'formula', 
      label: '수식', 
      title: '수학 공식',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      shortcut: '⌘⇧F'
    },
    { 
      cmd: 'embed', 
      label: '임베드', 
      title: '외부 콘텐츠',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
      shortcut: '⌘⇧E'
    },
  ];

  const handleFeatureSelect = (feature) => {
    onFeatureSelect(feature.cmd);
  };

  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium px-2">고급 기능</div>
      {ADVANCED_FEATURES.map((feature, i) => (
        <button
          key={i}
          onMouseDown={e => e.preventDefault()}
          onClick={() => handleFeatureSelect(feature)}
          className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
          title={feature.title}
        >
          <span className="mr-3">{feature.icon}</span>
          <span className="flex-1 text-left">{feature.label}</span>
          <span className="text-xs opacity-60">{feature.shortcut}</span>
        </button>
      ))}
    </div>
  );
};

export default AdvancedFeaturesMenu;