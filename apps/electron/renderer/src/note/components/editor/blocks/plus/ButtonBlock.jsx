import React, { useState, useRef, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';

/**
 * ButtonBlock - 프리미엄 버튼 블록 (완전 재설계)
 * @description 노션을 넘어서는 최고급 버튼 시스템
 */
const ButtonBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  placeholder = "버튼 텍스트를 입력하세요", 
  isEditing, 
  onEditingChange 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(true);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [iconCategory, setIconCategory] = useState('all');
  
  // 버튼 설정 상태
  const [text, setText] = useState(block.content?.text || '');
  const [style, setStyle] = useState(block.content?.style || 'primary');
  const [size, setSize] = useState(block.content?.size || 'medium');
  const [shape, setShape] = useState(block.content?.shape || 'rounded');
  const [icon, setIcon] = useState(block.content?.icon || '');
  const [iconPosition, setIconPosition] = useState(block.content?.iconPosition || 'left');
  const [animation, setAnimation] = useState(block.content?.animation || 'hover');
  const [width, setWidth] = useState(block.content?.width || 'auto');
  const [alignment, setAlignment] = useState(block.content?.alignment || 'left');
  
  // 커스텀 색상 설정
  const [customBgColor, setCustomBgColor] = useState(block.content?.customBgColor || '#3b82f6');
  const [customTextColor, setCustomTextColor] = useState(block.content?.customTextColor || '#ffffff');
  const [useCustomColors, setUseCustomColors] = useState(block.content?.useCustomColors || false);
  
  // 액션 설정
  const [actionType, setActionType] = useState(block.content?.actionType || 'link');
  const [url, setUrl] = useState(block.content?.url || '');
  const [newTab, setNewTab] = useState(block.content?.newTab || true);
  const [onClick, setOnClick] = useState(block.content?.onClick || '');
  const [confirmMessage, setConfirmMessage] = useState(block.content?.confirmMessage || '');
  
  const containerRef = useRef(null);
  const textInputRef = useRef(null);

  // 버튼 스타일 프리셋
  const buttonStyles = {
    primary: {
      base: 'bg-blue-500 text-white border-blue-500',
      hover: 'hover:bg-blue-600 hover:border-blue-600',
      focus: 'focus:ring-blue-200',
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    secondary: {
      base: 'bg-gray-100 text-gray-700 border-gray-300',
      hover: 'hover:bg-gray-200 hover:border-gray-400',
      focus: 'focus:ring-gray-200',
      gradient: 'bg-gradient-to-r from-gray-100 to-gray-200'
    },
    success: {
      base: 'bg-green-500 text-white border-green-500',
      hover: 'hover:bg-green-600 hover:border-green-600',
      focus: 'focus:ring-green-200',
      gradient: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    warning: {
      base: 'bg-yellow-500 text-white border-yellow-500',
      hover: 'hover:bg-yellow-600 hover:border-yellow-600',
      focus: 'focus:ring-yellow-200',
      gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    },
    danger: {
      base: 'bg-red-500 text-white border-red-500',
      hover: 'hover:bg-red-600 hover:border-red-600',
      focus: 'focus:ring-red-200',
      gradient: 'bg-gradient-to-r from-red-500 to-red-600'
    },
    outline: {
      base: 'bg-transparent text-blue-500 border-blue-500',
      hover: 'hover:bg-blue-50 hover:text-blue-600',
      focus: 'focus:ring-blue-200',
      gradient: 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100'
    },
    ghost: {
      base: 'bg-transparent text-gray-600 border-transparent',
      hover: 'hover:bg-gray-100 hover:text-gray-800',
      focus: 'focus:ring-gray-200',
      gradient: 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100'
    },
    gradient: {
      base: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent',
      hover: 'hover:from-purple-600 hover:to-pink-600',
      focus: 'focus:ring-purple-200',
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-500'
    }
  };

  // 버튼 사이즈
  const buttonSizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
    xlarge: 'px-8 py-4 text-xl'
  };

  // 버튼 모양
  const buttonShapes = {
    square: 'rounded-none',
    rounded: 'rounded-lg',
    pill: 'rounded-full',
    circle: 'rounded-full aspect-square'
  };

  // 아이콘 목록 (대폭 확장)
  const iconList = [
    { name: 'none', icon: '', label: '없음', type: 'none' },
    
    // 기본 화살표/방향
    { name: 'arrow-right', icon: '→', label: '오른쪽 화살표', type: 'arrow' },
    { name: 'arrow-left', icon: '←', label: '왼쪽 화살표', type: 'arrow' },
    { name: 'arrow-up', icon: '↑', label: '위쪽 화살표', type: 'arrow' },
    { name: 'arrow-down', icon: '↓', label: '아래쪽 화살표', type: 'arrow' },
    { name: 'external', icon: '↗', label: '외부 링크', type: 'arrow' },
    
    // 라인 아이콘 (SVG 기반)
    { name: 'line-arrow-right', icon: '→', label: '라인 화살표 →', type: 'line' },
    { name: 'line-download', icon: '↓', label: '라인 다운로드', type: 'line' },
    { name: 'line-upload', icon: '↑', label: '라인 업로드', type: 'line' },
    { name: 'line-check', icon: '✓', label: '라인 체크', type: 'line' },
    { name: 'line-plus', icon: '+', label: '라인 플러스', type: 'line' },
    { name: 'line-minus', icon: '−', label: '라인 마이너스', type: 'line' },
    { name: 'line-x', icon: '×', label: '라인 X', type: 'line' },
    
    // 액션/상태
    { name: 'check', icon: '✓', label: '체크', type: 'action' },
    { name: 'x', icon: '×', label: 'X', type: 'action' },
    { name: 'plus', icon: '+', label: '플러스', type: 'action' },
    { name: 'minus', icon: '−', label: '마이너스', type: 'action' },
    { name: 'edit', icon: '✏️', label: '편집', type: 'action' },
    { name: 'delete', icon: '🗑️', label: '삭제', type: 'action' },
    { name: 'save', icon: '💾', label: '저장', type: 'action' },
    { name: 'refresh', icon: '🔄', label: '새로고침', type: 'action' },
    
    // 이모지 - 표정/감정
    { name: 'smile', icon: '😊', label: '웃음', type: 'emoji' },
    { name: 'heart', icon: '❤️', label: '하트', type: 'emoji' },
    { name: 'thumbs-up', icon: '👍', label: '좋음', type: 'emoji' },
    { name: 'clap', icon: '👏', label: '박수', type: 'emoji' },
    { name: 'thinking', icon: '🤔', label: '생각', type: 'emoji' },
    { name: 'wow', icon: '😮', label: '놀람', type: 'emoji' },
    { name: 'celebrate', icon: '🎉', label: '축하', type: 'emoji' },
    
    // 이모지 - 사물/아이템
    { name: 'star', icon: '⭐', label: '별', type: 'emoji' },
    { name: 'fire', icon: '🔥', label: '불', type: 'emoji' },
    { name: 'rocket', icon: '🚀', label: '로켓', type: 'emoji' },
    { name: 'gem', icon: '💎', label: '보석', type: 'emoji' },
    { name: 'crown', icon: '👑', label: '왕관', type: 'emoji' },
    { name: 'trophy', icon: '🏆', label: '트로피', type: 'emoji' },
    { name: 'gift', icon: '🎁', label: '선물', type: 'emoji' },
    { name: 'key', icon: '🔑', label: '열쇠', type: 'emoji' },
    { name: 'lock', icon: '🔒', label: '자물쇠', type: 'emoji' },
    { name: 'unlock', icon: '🔓', label: '열린 자물쇠', type: 'emoji' },
    
    // 기술/업무
    { name: 'computer', icon: '💻', label: '컴퓨터', type: 'tech' },
    { name: 'mobile', icon: '📱', label: '모바일', type: 'tech' },
    { name: 'globe', icon: '🌐', label: '지구본', type: 'tech' },
    { name: 'wifi', icon: '📶', label: 'WiFi', type: 'tech' },
    { name: 'battery', icon: '🔋', label: '배터리', type: 'tech' },
    { name: 'plug', icon: '🔌', label: '플러그', type: 'tech' },
    
    // 커뮤니케이션
    { name: 'mail', icon: '📧', label: '메일', type: 'communication' },
    { name: 'message', icon: '💬', label: '메시지', type: 'communication' },
    { name: 'phone', icon: '📞', label: '전화', type: 'communication' },
    { name: 'video', icon: '📹', label: '비디오', type: 'communication' },
    { name: 'microphone', icon: '🎤', label: '마이크', type: 'communication' },
    { name: 'speaker', icon: '🔊', label: '스피커', type: 'communication' },
    
    // 시간/일정
    { name: 'calendar', icon: '📅', label: '달력', type: 'time' },
    { name: 'clock', icon: '⏰', label: '시계', type: 'time' },
    { name: 'timer', icon: '⏱️', label: '타이머', type: 'time' },
    { name: 'hourglass', icon: '⏳', label: '모래시계', type: 'time' },
    
    // 장소/이동
    { name: 'home', icon: '🏠', label: '홈', type: 'place' },
    { name: 'office', icon: '🏢', label: '사무실', type: 'place' },
    { name: 'location', icon: '📍', label: '위치', type: 'place' },
    { name: 'map', icon: '🗺️', label: '지도', type: 'place' },
    { name: 'car', icon: '🚗', label: '자동차', type: 'place' },
    { name: 'plane', icon: '✈️', label: '비행기', type: 'place' },
    
    // 도구/기능
    { name: 'search', icon: '🔍', label: '검색', type: 'tool' },
    { name: 'filter', icon: '🔽', label: '필터', type: 'tool' },
    { name: 'settings', icon: '⚙️', label: '설정', type: 'tool' },
    { name: 'wrench', icon: '🔧', label: '렌치', type: 'tool' },
    { name: 'hammer', icon: '🔨', label: '해머', type: 'tool' },
    { name: 'scissors', icon: '✂️', label: '가위', type: 'tool' },
    
    // 미디어
    { name: 'camera', icon: '📷', label: '카메라', type: 'media' },
    { name: 'image', icon: '🖼️', label: '이미지', type: 'media' },
    { name: 'music', icon: '🎵', label: '음악', type: 'media' },
    { name: 'headphones', icon: '🎧', label: '헤드폰', type: 'media' },
    { name: 'play', icon: '▶️', label: '재생', type: 'media' },
    { name: 'pause', icon: '⏸️', label: '일시정지', type: 'media' },
    
    // 사용자/사람
    { name: 'user', icon: '👤', label: '사용자', type: 'user' },
    { name: 'users', icon: '👥', label: '사용자들', type: 'user' },
    { name: 'team', icon: '👨‍👩‍👧‍👦', label: '팀', type: 'user' },
    { name: 'admin', icon: '👨‍💼', label: '관리자', type: 'user' }
  ];

  // 애니메이션 스타일
  const animationStyles = {
    none: '',
    hover: 'transition-all duration-200 hover:scale-105',
    bounce: 'transition-all duration-200 hover:animate-bounce',
    pulse: 'transition-all duration-200 hover:animate-pulse',
    wiggle: 'transition-all duration-200 hover:animate-wiggle',
    shake: 'transition-all duration-200 hover:animate-shake',
    glow: 'transition-all duration-200 hover:shadow-lg hover:shadow-blue-300/50',
    float: 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg'
  };

  // 콘텐츠 업데이트
  const updateContent = useCallback(() => {
    onUpdate({
      content: {
        text,
        style,
        size,
        shape,
        icon,
        iconPosition,
        animation,
        width,
        alignment,
        actionType,
        url,
        newTab,
        onClick,
        confirmMessage,
        customBgColor,
        customTextColor,
        useCustomColors
      }
    });
  }, [text, style, size, shape, icon, iconPosition, animation, width, alignment, actionType, url, newTab, onClick, confirmMessage, customBgColor, customTextColor, useCustomColors, onUpdate]);

  // 버튼 클릭 핸들러
  const handleButtonClick = useCallback((e) => {
    if (readOnly || isConfigMode) return;
    
    // 확인 메시지가 있으면 먼저 확인
    if (confirmMessage && !window.confirm(confirmMessage)) {
      e.preventDefault();
      return;
    }

    if (actionType === 'link' && url) {
      if (newTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    } else if (actionType === 'javascript' && onClick) {
      try {
        // 간단한 JavaScript 실행 (보안상 제한적으로)
        if (onClick.includes('alert(')) {
          const match = onClick.match(/alert\(['"`](.+?)['"`]\)/);
          if (match) {
            alert(match[1]);
          }
        }
      } catch (error) {
        console.error('Button action error:', error);
      }
    }
  }, [readOnly, isConfigMode, confirmMessage, actionType, url, newTab, onClick]);

  // 버튼 클래스 생성
  const getButtonClasses = useCallback(() => {
    const sizeClass = buttonSizes[size] || buttonSizes.medium;
    const shapeClass = buttonShapes[shape] || buttonShapes.rounded;
    const animationClass = animationStyles[animation] || animationStyles.hover;
    
    let widthClass = '';
    if (width === 'full') widthClass = 'w-full';
    else if (width === 'auto') widthClass = 'w-auto';
    else if (width === 'fit') widthClass = 'w-fit';
    
    // 커스텀 색상 사용 시 기본 클래스만 적용
    if (useCustomColors) {
      return `
        inline-flex items-center justify-center gap-2 border font-medium 
        focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer
        transition-all duration-200
        ${sizeClass} ${shapeClass} ${animationClass} ${widthClass}
      `.trim();
    }
    
    // 프리셋 스타일 사용 시
    const styleConfig = buttonStyles[style] || buttonStyles.primary;
    return `
      inline-flex items-center justify-center gap-2 border font-medium 
      focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer
      ${styleConfig.base} ${styleConfig.hover} ${styleConfig.focus}
      ${sizeClass} ${shapeClass} ${animationClass} ${widthClass}
    `.trim();
  }, [style, size, shape, animation, width, useCustomColors]);

  // 커스텀 스타일 생성
  const getCustomStyle = useCallback(() => {
    if (!useCustomColors) return {};
    
    return {
      backgroundColor: customBgColor,
      color: customTextColor,
      borderColor: customBgColor,
      '--hover-bg': adjustColor(customBgColor, -20),
      '--hover-border': adjustColor(customBgColor, -20),
    };
  }, [useCustomColors, customBgColor, customTextColor]);

  // 색상 조정 헬퍼 함수
  const adjustColor = useCallback((color, amount) => {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = (num >> 8 & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  }, []);

  // 정렬 클래스
  const getAlignmentClass = useCallback(() => {
    switch (alignment) {
      case 'center': return 'flex justify-center';
      case 'right': return 'flex justify-end';
      default: return '';
    }
  }, [alignment]);

  // 아이콘 필터링
  const getFilteredIcons = useCallback(() => {
    if (iconCategory === 'all') return iconList;
    return iconList.filter(icon => icon.type === iconCategory);
  }, [iconCategory]);

  // 아이콘 렌더링
  const renderIcon = useCallback(() => {
    if (!icon) return null;
    const iconData = iconList.find(i => i.name === icon);
    return iconData ? iconData.icon : null;
  }, [icon]);

  return (
    <div
      ref={containerRef}
      className="group relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onFocus}
    >
      <div className="space-y-4">
        
        {/* 설정 모드 토글 버튼 */}
        {!readOnly && isHovered && (
          <div className="absolute -top-2 -right-2 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsConfigMode(!isConfigMode);
              }}
              className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 shadow-md"
              title="버튼 설정"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        )}

        {/* 설정 패널 */}
        {!readOnly && isConfigMode && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3 shadow-lg animate-slideDown">
            
            {/* 텍스트 입력 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                버튼 텍스트
              </label>
              <input
                ref={textInputRef}
                type="text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setTimeout(updateContent, 0);
                }}
                placeholder={placeholder}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* 탭 메뉴 */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded p-0.5">
              <button
                onClick={() => setShowStylePanel(true)}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                  showStylePanel ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                스타일
              </button>
              <button
                onClick={() => setShowStylePanel(false)}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                  !showStylePanel ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                액션
              </button>
            </div>

            {/* 스타일 패널 */}
            {showStylePanel ? (
              <div className="space-y-3">
                
                {/* 버튼 스타일 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    버튼 스타일
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {Object.keys(buttonStyles).map((styleName) => (
                      <button
                        key={styleName}
                        onClick={() => {
                          setStyle(styleName);
                          setTimeout(updateContent, 0);
                        }}
                        className={`
                          px-2 py-1.5 text-xs rounded border transition-all duration-200 capitalize
                          ${style === styleName 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        {styleName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 사이즈와 모양 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      크기
                    </label>
                    <select
                      value={size}
                      onChange={(e) => {
                        setSize(e.target.value);
                        setTimeout(updateContent, 0);
                      }}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    >
                      <option value="small">작음</option>
                      <option value="medium">보통</option>
                      <option value="large">큼</option>
                      <option value="xlarge">매우 큼</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      모양
                    </label>
                    <select
                      value={shape}
                      onChange={(e) => {
                        setShape(e.target.value);
                        setTimeout(updateContent, 0);
                      }}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    >
                      <option value="square">사각형</option>
                      <option value="rounded">둥근 모서리</option>
                      <option value="pill">알약형</option>
                      <option value="circle">원형</option>
                    </select>
                  </div>
                </div>

                {/* 아이콘 설정 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    아이콘 ({iconList.length-1}개)
                  </label>
                  
                  {/* 아이콘 카테고리 탭 */}
                  <div className="flex flex-wrap gap-0.5 mb-2">
                    {['all', 'line', 'arrow', 'action', 'emoji', 'tech', 'communication', 'time', 'place', 'tool', 'media', 'user'].map((category) => (
                      <button
                        key={category}
                        onClick={() => setIconCategory(category)}
                        className={`px-1.5 py-0.5 text-xs rounded transition-colors duration-200 ${
                          iconCategory === category 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {category === 'all' ? '전체' : 
                         category === 'line' ? '라인' :
                         category === 'arrow' ? '화살표' :
                         category === 'action' ? '액션' :
                         category === 'emoji' ? '이모지' :
                         category === 'tech' ? '기술' :
                         category === 'communication' ? '소통' :
                         category === 'time' ? '시간' :
                         category === 'place' ? '장소' :
                         category === 'tool' ? '도구' :
                         category === 'media' ? '미디어' :
                         category === 'user' ? '사용자' : category}
                      </button>
                    ))}
                  </div>
                  
                  {/* 아이콘 그리드 */}
                  <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto border rounded p-1.5 bg-gray-50">
                    {getFilteredIcons().map((iconData) => (
                      <button
                        key={iconData.name}
                        onClick={() => {
                          setIcon(iconData.name);
                          setTimeout(updateContent, 0);
                        }}
                        className={`
                          p-1 text-sm rounded border transition-all duration-200 hover:scale-105
                          ${icon === iconData.name 
                            ? 'border-blue-500 bg-blue-100 shadow-sm' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                        title={iconData.label}
                      >
                        {iconData.icon || '∅'}
                      </button>
                    ))}
                  </div>
                  
                  {/* 아이콘 위치 */}
                  {icon && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        아이콘 위치
                      </label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setIconPosition('left');
                            setTimeout(updateContent, 0);
                          }}
                          className={`px-2 py-1.5 text-xs rounded border transition-all duration-200 ${
                            iconPosition === 'left' 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          왼쪽
                        </button>
                        <button
                          onClick={() => {
                            setIconPosition('right');
                            setTimeout(updateContent, 0);
                          }}
                          className={`px-2 py-1.5 text-xs rounded border transition-all duration-200 ${
                            iconPosition === 'right' 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          오른쪽
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 커스텀 색상 설정 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      색상 설정
                    </label>
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={useCustomColors}
                        onChange={(e) => {
                          setUseCustomColors(e.target.checked);
                          setTimeout(updateContent, 0);
                        }}
                        className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">커스텀 색상 사용</span>
                    </label>
                  </div>
                  
                  {useCustomColors && (
                    <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          배경색
                        </label>
                        <div className="flex items-center space-x-1">
                          <input
                            type="color"
                            value={customBgColor}
                            onChange={(e) => {
                              setCustomBgColor(e.target.value);
                              setTimeout(updateContent, 0);
                            }}
                            className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customBgColor}
                            onChange={(e) => {
                              setCustomBgColor(e.target.value);
                              setTimeout(updateContent, 0);
                            }}
                            className="flex-1 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          글자색
                        </label>
                        <div className="flex items-center space-x-1">
                          <input
                            type="color"
                            value={customTextColor}
                            onChange={(e) => {
                              setCustomTextColor(e.target.value);
                              setTimeout(updateContent, 0);
                            }}
                            className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customTextColor}
                            onChange={(e) => {
                              setCustomTextColor(e.target.value);
                              setTimeout(updateContent, 0);
                            }}
                            className="flex-1 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 추가 옵션 */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      너비
                    </label>
                    <select
                      value={width}
                      onChange={(e) => {
                        setWidth(e.target.value);
                        setTimeout(updateContent, 0);
                      }}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    >
                      <option value="auto">자동</option>
                      <option value="fit">내용에 맞춤</option>
                      <option value="full">전체 너비</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      정렬
                    </label>
                    <select
                      value={alignment}
                      onChange={(e) => {
                        setAlignment(e.target.value);
                        setTimeout(updateContent, 0);
                      }}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    >
                      <option value="left">왼쪽</option>
                      <option value="center">가운데</option>
                      <option value="right">오른쪽</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      애니멤이션
                    </label>
                    <select
                      value={animation}
                      onChange={(e) => {
                        setAnimation(e.target.value);
                        setTimeout(updateContent, 0);
                      }}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    >
                      <option value="none">없음</option>
                      <option value="hover">호버 확대</option>
                      <option value="bounce">바운스</option>
                      <option value="pulse">햄스</option>
                      <option value="glow">글로우</option>
                      <option value="float">플로트</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* 액션 패널 */
              <div className="space-y-3">
                
                {/* 액션 타입 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    액션 타입
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => {
                        setActionType('link');
                        setTimeout(updateContent, 0);
                      }}
                      className={`
                        px-2 py-1.5 text-xs rounded border transition-all duration-200
                        ${actionType === 'link' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      링크
                    </button>
                    <button
                      onClick={() => {
                        setActionType('javascript');
                        setTimeout(updateContent, 0);
                      }}
                      className={`
                        px-2 py-1.5 text-xs rounded border transition-all duration-200
                        ${actionType === 'javascript' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      JavaScript
                    </button>
                  </div>
                </div>

                {/* 링크 설정 */}
                {actionType === 'link' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          setTimeout(updateContent, 0);
                        }}
                        placeholder="https://example.com"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={newTab}
                        onChange={(e) => {
                          setNewTab(e.target.checked);
                          setTimeout(updateContent, 0);
                        }}
                        className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">새 탭에서 열기</span>
                    </label>
                  </div>
                )}

                {/* JavaScript 설정 */}
                {actionType === 'javascript' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      JavaScript 코드
                    </label>
                    <textarea
                      value={onClick}
                      onChange={(e) => {
                        setOnClick(e.target.value);
                        setTimeout(updateContent, 0);
                      }}
                      placeholder="alert('Hello, World!');"
                      rows={2}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono"
                    />
                  </div>
                )}

                {/* 확인 메시지 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    확인 메시지 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={confirmMessage}
                    onChange={(e) => {
                      setConfirmMessage(e.target.value);
                      setTimeout(updateContent, 0);
                    }}
                    placeholder="정말로 실행하시겠습니까?"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 버튼 미리보기 */}
        <div className={getAlignmentClass()}>
          <button
            onClick={handleButtonClick}
            disabled={readOnly && !url}
            className={getButtonClasses()}
            style={getCustomStyle()}
            onMouseEnter={(e) => {
              if (useCustomColors) {
                e.target.style.backgroundColor = adjustColor(customBgColor, -20);
                e.target.style.borderColor = adjustColor(customBgColor, -20);
              }
            }}
            onMouseLeave={(e) => {
              if (useCustomColors) {
                e.target.style.backgroundColor = customBgColor;
                e.target.style.borderColor = customBgColor;
              }
            }}
          >
            {iconPosition === 'left' && renderIcon() && (
              <span className="text-lg">{renderIcon()}</span>
            )}
            <span>{text || '버튼'}</span>
            {iconPosition === 'right' && renderIcon() && (
              <span className="text-lg">{renderIcon()}</span>
            )}
          </button>
        </div>

        {/* 상태 표시 */}
      </div>

      {/* 커스텀 CSS 애니메이션 */}
      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        
        .animate-wiggle {
          animation: wiggle 0.6s ease-in-out;
        }
        
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ButtonBlock;