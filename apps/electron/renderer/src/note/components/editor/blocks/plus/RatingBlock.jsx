import React, { useState, useEffect, useRef } from 'react';

/**
 * RatingBlock - Minimal & Modern
 * @description 미니멀하고 현대적인 평가 블록 - 다양한 점수 표현 방식
 * @version 2.0.0
 */
const RatingBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  onRemove,
  readOnly = false, 
  placeholder = "평가", 
  isEditing, 
  onEditingChange,
  index 
}) => {
  // 기본 설정값
  const defaultSettings = {
    value: 0,
    maxValue: 5,
    label: '',
    style: 'stars', // stars, hearts, thumbs, numbers, dots, emojis, bars, slider, percentage
    size: 'medium', // small, medium, large
    color: 'yellow', // yellow, red, blue, green, purple, gray
    showValue: true,
    showLabel: true,
    allowHalf: false,
    customIcon: null,
    description: ''
  };

  // 상태 관리
  const [settings, setSettings] = useState({
    ...defaultSettings,
    ...block.metadata?.settings,
    value: block.content || defaultSettings.value
  });
  
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState(settings.label);
  const [hoverValue, setHoverValue] = useState(null);
  const [sliderValue, setSliderValue] = useState(settings.value);
  
  const containerRef = useRef(null);

  // 색상 시스템
  const colorSystem = {
    yellow: {
      primary: 'text-yellow-500',
      secondary: 'text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-700',
      fill: 'bg-yellow-500'
    },
    red: {
      primary: 'text-red-500',
      secondary: 'text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-700',
      fill: 'bg-red-500'
    },
    blue: {
      primary: 'text-blue-500',
      secondary: 'text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-700',
      fill: 'bg-blue-500'
    },
    green: {
      primary: 'text-green-500',
      secondary: 'text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-700',
      fill: 'bg-green-500'
    },
    purple: {
      primary: 'text-purple-500',
      secondary: 'text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-700',
      fill: 'bg-purple-500'
    },
    gray: {
      primary: 'text-gray-500',
      secondary: 'text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-700',
      fill: 'bg-gray-500'
    }
  };

  // 사이즈 시스템
  const sizeSystem = {
    small: {
      icon: 'text-sm',
      text: 'text-xs',
      padding: 'py-1',
      gap: 'gap-1',
      button: 'w-6 h-6',
      slider: 'h-1'
    },
    medium: {
      icon: 'text-lg',
      text: 'text-sm',
      padding: 'py-2',
      gap: 'gap-2',
      button: 'w-8 h-8',
      slider: 'h-2'
    },
    large: {
      icon: 'text-xl',
      text: 'text-base',
      padding: 'py-3',
      gap: 'gap-3',
      button: 'w-10 h-10',
      slider: 'h-3'
    }
  };

  // 아이콘 시스템
  const iconSystem = {
    stars: { icon: '★', empty: '☆' },
    hearts: { icon: '♥', empty: '♡' },
    thumbs: { icon: '👍', empty: '👍' },
    dots: { icon: '●', empty: '○' },
    emojis: {
      icons: ['😢', '😞', '😐', '🙂', '😊'],
      getIcon: (value, max) => {
        const percentage = value / max;
        if (percentage <= 0.2) return '😢';
        if (percentage <= 0.4) return '😞';
        if (percentage <= 0.6) return '😐';
        if (percentage <= 0.8) return '🙂';
        return '😊';
      }
    }
  };

  // 메타데이터 업데이트
  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        content: settings.value,
        metadata: {
          ...block.metadata,
          settings
        }
      });
    }
  }, [settings]);

  // 값 변경 핸들러
  const handleValueChange = (newValue) => {
    const value = settings.allowHalf 
      ? Math.max(0, Math.min(settings.maxValue, parseFloat(newValue) || 0))
      : Math.max(0, Math.min(settings.maxValue, Math.round(newValue) || 0));
    setSettings(prev => ({ ...prev, value }));
  };

  // 라벨 업데이트
  const updateLabel = () => {
    setSettings(prev => ({ ...prev, label: tempLabel }));
    setIsEditingLabel(false);
  };

  // 스타일별 렌더링
  const renderRating = () => {
    const colors = colorSystem[settings.color];
    const sizes = sizeSystem[settings.size];
    const currentValue = hoverValue !== null ? hoverValue : settings.value;

    switch (settings.style) {
      case 'hearts':
        return (
          <div className={`flex items-center ${sizes.gap}`}>
            {Array.from({ length: settings.maxValue }).map((_, i) => {
              const value = i + 1;
              const isActive = currentValue >= value;
              const isHalf = settings.allowHalf && currentValue >= value - 0.5 && currentValue < value;
              
              return (
                <button
                  key={i}
                  onClick={() => !readOnly && handleValueChange(value)}
                  onMouseEnter={() => !readOnly && setHoverValue(value)}
                  onMouseLeave={() => !readOnly && setHoverValue(null)}
                  className={`${sizes.icon} transition-all duration-200 ${
                    isActive ? colors.primary : 'text-gray-300 dark:text-gray-600'
                  } ${!readOnly ? 'hover:scale-110 cursor-pointer' : ''}`}
                  disabled={readOnly}
                >
                  {iconSystem.hearts.icon}
                </button>
              );
            })}
          </div>
        );

      case 'thumbs':
        return (
          <div className={`flex items-center ${sizes.gap}`}>
            <button
              onClick={() => !readOnly && handleValueChange(settings.value === 1 ? 0 : 1)}
              className={`${sizes.icon} transition-all duration-200 ${
                settings.value > 0 ? colors.primary : 'text-gray-300 dark:text-gray-600'
              } ${!readOnly ? 'hover:scale-110 cursor-pointer' : ''}`}
              disabled={readOnly}
            >
              👍
            </button>
            <button
              onClick={() => !readOnly && handleValueChange(settings.value === -1 ? 0 : -1)}
              className={`${sizes.icon} transition-all duration-200 ${
                settings.value < 0 ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'
              } ${!readOnly ? 'hover:scale-110 cursor-pointer' : ''}`}
              disabled={readOnly}
            >
              👎
            </button>
          </div>
        );

      case 'numbers':
        return (
          <div className={`flex items-center ${sizes.gap}`}>
            {Array.from({ length: settings.maxValue }).map((_, i) => {
              const value = i + 1;
              const isActive = currentValue >= value;
              
              return (
                <button
                  key={i}
                  onClick={() => !readOnly && handleValueChange(value)}
                  onMouseEnter={() => !readOnly && setHoverValue(value)}
                  onMouseLeave={() => !readOnly && setHoverValue(null)}
                  className={`${sizes.button} rounded-full border-2 transition-all duration-200 ${sizes.text} font-medium ${
                    isActive 
                      ? `${colors.fill} text-white border-transparent` 
                      : `border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 ${!readOnly ? 'hover:border-gray-400 dark:hover:border-gray-500' : ''}`
                  } ${!readOnly ? 'cursor-pointer' : ''}`}
                  disabled={readOnly}
                >
                  {value}
                </button>
              );
            })}
          </div>
        );

      case 'dots':
        return (
          <div className={`flex items-center ${sizes.gap}`}>
            {Array.from({ length: settings.maxValue }).map((_, i) => {
              const value = i + 1;
              const isActive = currentValue >= value;
              
              return (
                <button
                  key={i}
                  onClick={() => !readOnly && handleValueChange(value)}
                  onMouseEnter={() => !readOnly && setHoverValue(value)}
                  onMouseLeave={() => !readOnly && setHoverValue(null)}
                  className={`${sizes.icon} transition-all duration-200 ${
                    isActive ? colors.primary : 'text-gray-300 dark:text-gray-600'
                  } ${!readOnly ? 'hover:scale-125 cursor-pointer' : ''}`}
                  disabled={readOnly}
                >
                  {iconSystem.dots.icon}
                </button>
              );
            })}
          </div>
        );

      case 'emojis':
        const emojiIcon = iconSystem.emojis.getIcon(settings.value, settings.maxValue);
        return (
          <div className={`flex items-center ${sizes.gap}`}>
            <div className={`flex items-center ${sizes.gap}`}>
              {iconSystem.emojis.icons.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => !readOnly && handleValueChange(i + 1)}
                  className={`${sizes.icon} transition-all duration-200 ${
                    i + 1 === settings.value ? 'scale-125' : 'opacity-50'
                  } ${!readOnly ? 'hover:scale-110 cursor-pointer' : ''}`}
                  disabled={readOnly}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        );

      case 'bars':
        return (
          <div className={`flex items-center ${sizes.gap} w-full max-w-xs`}>
            {Array.from({ length: settings.maxValue }).map((_, i) => {
              const value = i + 1;
              const isActive = currentValue >= value;
              
              return (
                <button
                  key={i}
                  onClick={() => !readOnly && handleValueChange(value)}
                  onMouseEnter={() => !readOnly && setHoverValue(value)}
                  onMouseLeave={() => !readOnly && setHoverValue(null)}
                  className={`flex-1 ${sizes.slider} rounded transition-all duration-200 ${
                    isActive ? colors.fill : 'bg-gray-200 dark:bg-gray-700'
                  } ${!readOnly ? 'cursor-pointer' : ''}`}
                  disabled={readOnly}
                />
              );
            })}
          </div>
        );

      case 'slider':
        return (
          <div className="w-full max-w-xs">
            <input
              type="range"
              min={0}
              max={settings.maxValue}
              step={settings.allowHalf ? 0.5 : 1}
              value={settings.value}
              onChange={(e) => !readOnly && handleValueChange(parseFloat(e.target.value))}
              className={`w-full ${sizes.slider} bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer ${
                readOnly ? 'pointer-events-none' : ''
              }`}
              disabled={readOnly}
              style={{
                background: `linear-gradient(to right, ${colorSystem[settings.color].fill.replace('bg-', '')} 0%, ${colorSystem[settings.color].fill.replace('bg-', '')} ${(settings.value / settings.maxValue) * 100}%, #e5e7eb ${(settings.value / settings.maxValue) * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>
        );

      case 'percentage':
        return (
          <div className="w-full max-w-xs">
            <div className={`w-full ${sizes.slider} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
              <div
                className={`h-full ${colors.fill} transition-all duration-300 ease-out`}
                style={{ width: `${(settings.value / settings.maxValue) * 100}%` }}
              />
            </div>
          </div>
        );

      default: // stars
        return (
          <div className={`flex items-center ${sizes.gap}`}>
            {Array.from({ length: settings.maxValue }).map((_, i) => {
              const value = i + 1;
              const isActive = currentValue >= value;
              const isHalf = settings.allowHalf && currentValue >= value - 0.5 && currentValue < value;
              
              return (
                <button
                  key={i}
                  onClick={() => !readOnly && handleValueChange(value)}
                  onMouseEnter={() => !readOnly && setHoverValue(value)}
                  onMouseLeave={() => !readOnly && setHoverValue(null)}
                  className={`${sizes.icon} transition-all duration-200 ${
                    isActive ? colors.primary : 'text-gray-300 dark:text-gray-600'
                  } ${!readOnly ? 'hover:scale-110 cursor-pointer' : ''}`}
                  disabled={readOnly}
                >
                  {isActive ? iconSystem.stars.icon : iconSystem.stars.empty}
                </button>
              );
            })}
          </div>
        );
    }
  };

  const sizes = sizeSystem[settings.size];
  const colors = colorSystem[settings.color];

  return (
    <div 
      ref={containerRef}
      className={`relative ${sizes.padding} group transition-all duration-200 ${
        isFocused ? 'ring-1 ring-gray-200 dark:ring-gray-700 rounded-md' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onFocus}
    >
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {/* 라벨 */}
          {isEditingLabel ? (
            <input
              type="text"
              value={tempLabel}
              onChange={(e) => setTempLabel(e.target.value)}
              onBlur={updateLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateLabel();
                if (e.key === 'Escape') {
                  setTempLabel(settings.label);
                  setIsEditingLabel(false);
                }
              }}
              className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400"
              placeholder="라벨 입력..."
              autoFocus
            />
          ) : (
            <div
              className={`text-sm ${settings.label ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'} cursor-text`}
              onClick={(e) => {
                if (!readOnly) {
                  e.stopPropagation();
                  setIsEditingLabel(true);
                }
              }}
            >
              {settings.label || (isHovered ? '라벨 추가' : '')}
            </div>
          )}

          {/* 점수 표시 */}
          {settings.showValue && (
            <div className={`${sizes.text} font-medium ${colors.primary}`}>
              {settings.style === 'percentage' 
                ? `${Math.round((settings.value / settings.maxValue) * 100)}%`
                : settings.style === 'thumbs'
                ? (settings.value > 0 ? '👍' : settings.value < 0 ? '👎' : '-')
                : `${settings.value}${settings.style !== 'emojis' ? `/${settings.maxValue}` : ''}`
              }
            </div>
          )}
        </div>

        {/* 컨트롤 버튼 */}
        {!readOnly && (
          <div className={`flex items-center gap-1 transition-opacity duration-200 ${
            isHovered || showSettings ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* 초기화 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleValueChange(0);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors duration-150"
              title="초기화"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* 설정 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors duration-150"
              title="설정"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>

            {/* 삭제 */}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors duration-150"
                title="삭제"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 평가 인터페이스 */}
      <div className="flex items-center justify-center">
        {renderRating()}
      </div>

      {/* 설명 텍스트 */}
      {settings.description && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {settings.description}
        </div>
      )}

      {/* 설정 패널 */}
      {showSettings && !readOnly && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md shadow-sm z-30 p-3">
          <div className="space-y-3">
            {/* 스타일 선택 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12">스타일</label>
              <div className="grid grid-cols-3 gap-1 flex-1">
                {[
                  { id: 'stars', name: '별점', icon: '★' },
                  { id: 'hearts', name: '하트', icon: '♥' },
                  { id: 'thumbs', name: '추천', icon: '👍' },
                  { id: 'numbers', name: '숫자', icon: '1' },
                  { id: 'dots', name: '점', icon: '●' },
                  { id: 'emojis', name: '이모지', icon: '😊' },
                  { id: 'bars', name: '바', icon: '▬' },
                  { id: 'slider', name: '슬라이더', icon: '━' },
                  { id: 'percentage', name: '퍼센트', icon: '%' }
                ].map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSettings(prev => ({ ...prev, style: style.id }))}
                    className={`px-2 py-1 text-xs rounded transition-colors duration-150 flex items-center gap-1 ${
                      settings.style === style.id
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title={style.name}
                  >
                    <span>{style.icon}</span>
                    <span className="hidden sm:inline">{style.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 색상 선택 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12">색상</label>
              <div className="flex gap-1 flex-1">
                {Object.keys(colorSystem).map(color => (
                  <button
                    key={color}
                    onClick={() => setSettings(prev => ({ ...prev, color }))}
                    className={`w-6 h-6 rounded ${colorSystem[color].fill} ${
                      settings.color === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                    }`}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* 크기 및 최대값 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12">크기</label>
              <div className="flex gap-1 flex-1">
                {[
                  { id: 'small', name: '작게' },
                  { id: 'medium', name: '보통' },
                  { id: 'large', name: '크게' }
                ].map(size => (
                  <button
                    key={size.id}
                    onClick={() => setSettings(prev => ({ ...prev, size: size.id }))}
                    className={`px-2 py-1 text-xs rounded transition-colors duration-150 ${
                      settings.size === size.id
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
              {settings.style !== 'thumbs' && settings.style !== 'emojis' && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">최대</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.maxValue}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      maxValue: Math.max(1, Math.min(10, parseInt(e.target.value) || 5))
                    }))}
                    className="w-12 px-1 py-0.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                  />
                </div>
              )}
            </div>

            {/* 옵션 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12">옵션</label>
              <div className="flex gap-3 flex-1">
                <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={settings.showValue}
                    onChange={(e) => setSettings(prev => ({ ...prev, showValue: e.target.checked }))}
                    className="w-3 h-3 text-gray-600 focus:ring-gray-400 border-gray-300 rounded"
                  />
                  <span>점수 표시</span>
                </label>
                {settings.style === 'stars' && (
                  <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={settings.allowHalf}
                      onChange={(e) => setSettings(prev => ({ ...prev, allowHalf: e.target.checked }))}
                      className="w-3 h-3 text-gray-600 focus:ring-gray-400 border-gray-300 rounded"
                    />
                    <span>반개 허용</span>
                  </label>
                )}
              </div>
            </div>

            {/* 설명 추가 */}
            <div className="flex items-start gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12 mt-1">설명</label>
              <textarea
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="설명 추가..."
                className="flex-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                rows={2}
              />
            </div>
          </div>
        </div>
      )}

      {/* 외부 클릭으로 설정 닫기 */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default RatingBlock;