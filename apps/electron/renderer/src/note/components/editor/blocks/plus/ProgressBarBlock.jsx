import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';

/**
 * ProgressBarBlock - Minimal & Modern
 * @description 미니멀하고 현대적인 진행률 표시 블록 - 노션 스타일
 * @version 2.0.0
 */
const ProgressBarBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  onRemove,
  readOnly = false, 
  placeholder = "진행률", 
  isEditing, 
  onEditingChange,
  index 
}) => {
  // 기본 설정값
  const defaultSettings = {
    value: 50,
    label: '',
    showPercentage: true,
    style: 'minimal', // minimal, gradient, segmented, circular
    color: 'gray', // gray, blue, green, yellow, red, purple
    size: 'medium', // small, medium, large
    animate: true,
    milestone: null,
    segments: 10,
    showMilestones: false
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
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef(null);
  const progressRef = useRef(null);

  // 색상 시스템
  const colorSystem = {
    gray: {
      bg: 'bg-gray-200 dark:bg-gray-700',
      fill: 'bg-gray-500 dark:bg-gray-400',
      gradient: 'from-gray-400 to-gray-600',
      text: 'text-gray-600 dark:text-gray-400',
      hover: 'hover:bg-gray-300 dark:hover:bg-gray-600'
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      fill: 'bg-blue-500 dark:bg-blue-400',
      gradient: 'from-blue-400 to-blue-600',
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:bg-blue-200 dark:hover:bg-blue-800/30'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      fill: 'bg-green-500 dark:bg-green-400',
      gradient: 'from-green-400 to-green-600',
      text: 'text-green-600 dark:text-green-400',
      hover: 'hover:bg-green-200 dark:hover:bg-green-800/30'
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      fill: 'bg-yellow-500 dark:bg-yellow-400',
      gradient: 'from-yellow-400 to-yellow-600',
      text: 'text-yellow-600 dark:text-yellow-400',
      hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800/30'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      fill: 'bg-red-500 dark:bg-red-400',
      gradient: 'from-red-400 to-red-600',
      text: 'text-red-600 dark:text-red-400',
      hover: 'hover:bg-red-200 dark:hover:bg-red-800/30'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      fill: 'bg-purple-500 dark:bg-purple-400',
      gradient: 'from-purple-400 to-purple-600',
      text: 'text-purple-600 dark:text-purple-400',
      hover: 'hover:bg-purple-200 dark:hover:bg-purple-800/30'
    }
  };

  // 사이즈 시스템
  const sizeSystem = {
    small: {
      height: 'h-1',
      textSize: 'text-xs',
      padding: 'py-1',
      circleSize: 'w-16 h-16'
    },
    medium: {
      height: 'h-2',
      textSize: 'text-sm',
      padding: 'py-2',
      circleSize: 'w-24 h-24'
    },
    large: {
      height: 'h-3',
      textSize: 'text-base',
      padding: 'py-3',
      circleSize: 'w-32 h-32'
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
    const value = Math.max(0, Math.min(100, parseInt(newValue) || 0));
    setSettings(prev => ({ ...prev, value }));
  };

  // 드래그로 값 조정
  const handleMouseDown = (e) => {
    if (readOnly) return;
    setIsDragging(true);
    updateValueFromMouse(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || readOnly) return;
    updateValueFromMouse(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateValueFromMouse = (e) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    handleValueChange(Math.round(percentage));
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // 라벨 업데이트
  const updateLabel = () => {
    setSettings(prev => ({ ...prev, label: tempLabel }));
    setIsEditingLabel(false);
  };

  // 스타일별 진행바 렌더링
  const renderProgressBar = () => {
    const colors = colorSystem[settings.color];
    const sizes = sizeSystem[settings.size];

    switch (settings.style) {
      case 'gradient':
        return (
          <div 
            ref={progressRef}
            className={`w-full ${sizes.height} ${colors.bg} rounded-full overflow-hidden cursor-pointer transition-all duration-200 ${isHovered ? 'shadow-sm' : ''}`}
            onMouseDown={handleMouseDown}
          >
            <div
              className={`h-full bg-gradient-to-r ${colors.gradient} transition-all ${settings.animate ? 'duration-500' : 'duration-0'} ease-out`}
              style={{ width: `${settings.value}%` }}
            />
          </div>
        );

      case 'segmented':
        return (
          <div 
            ref={progressRef}
            className={`w-full ${sizes.height} flex gap-0.5 cursor-pointer`}
            onMouseDown={handleMouseDown}
          >
            {Array.from({ length: settings.segments }).map((_, i) => {
              const segmentPercentage = (100 / settings.segments) * (i + 1);
              const isFilled = settings.value >= segmentPercentage;
              const isPartial = settings.value > segmentPercentage - (100 / settings.segments) && settings.value < segmentPercentage;
              const partialWidth = isPartial ? ((settings.value - (segmentPercentage - (100 / settings.segments))) / (100 / settings.segments)) * 100 : 0;
              
              return (
                <div
                  key={i}
                  className={`flex-1 ${sizes.height} ${colors.bg} rounded-sm overflow-hidden transition-all duration-200`}
                >
                  {(isFilled || isPartial) && (
                    <div
                      className={`h-full ${colors.fill} transition-all ${settings.animate ? 'duration-300' : 'duration-0'}`}
                      style={{ width: isFilled ? '100%' : `${partialWidth}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'circular':
        const circumference = 2 * Math.PI * 45;
        const strokeDashoffset = circumference - (settings.value / 100) * circumference;
        
        return (
          <div className="flex justify-center">
            <div className={`relative ${sizes.circleSize}`}>
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className={colors.text}
                  opacity="0.2"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className={colors.text}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transition: settings.animate ? 'stroke-dashoffset 0.5s ease-out' : 'none'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`${sizes.textSize} font-medium ${colors.text}`}>
                  {settings.value}%
                </span>
              </div>
            </div>
          </div>
        );

      default: // minimal
        return (
          <div 
            ref={progressRef}
            className={`w-full ${sizes.height} ${colors.bg} rounded-full overflow-hidden cursor-pointer transition-all duration-200 ${isHovered ? 'shadow-sm' : ''}`}
            onMouseDown={handleMouseDown}
          >
            <div
              className={`h-full ${colors.fill} transition-all ${settings.animate ? 'duration-500' : 'duration-0'} ease-out`}
              style={{ width: `${settings.value}%` }}
            />
          </div>
        );
    }
  };

  // 마일스톤 표시
  const renderMilestones = () => {
    if (!settings.showMilestones || settings.style === 'circular') return null;
    
    const milestones = [0, 25, 50, 75, 100];
    return (
      <div className="relative w-full mt-1">
        <div className="flex justify-between">
          {milestones.map(milestone => (
            <div
              key={milestone}
              className={`text-[10px] ${
                settings.value >= milestone 
                  ? colorSystem[settings.color].text 
                  : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              {milestone}%
            </div>
          ))}
        </div>
      </div>
    );
  };

  const sizes = sizeSystem[settings.size];

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

          {/* 퍼센트 표시 */}
          {settings.showPercentage && settings.style !== 'circular' && (
            <div className={`text-sm font-medium ${colorSystem[settings.color].text}`}>
              {settings.value}%
            </div>
          )}
        </div>

        {/* 컨트롤 버튼 */}
        {!readOnly && (
          <div className={`flex items-center gap-1 transition-opacity duration-200 ${
            isHovered || showSettings ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* 직접 입력 */}
            <div className="relative group/input">
              <button
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors duration-150"
                title="값 직접 입력"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md shadow-sm p-2 opacity-0 invisible group-hover/input:opacity-100 group-hover/input:visible transition-all duration-150 z-10">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.value}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                />
              </div>
            </div>

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

      {/* 진행바 */}
      {renderProgressBar()}

      {/* 마일스톤 */}
      {renderMilestones()}

      {/* 설정 패널 */}
      {showSettings && !readOnly && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md shadow-sm z-30 p-3">
          <div className="space-y-3">
            {/* 스타일 선택 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12">스타일</label>
              <div className="flex gap-1 flex-1">
                {[
                  { id: 'minimal', name: '미니멀' },
                  { id: 'gradient', name: '그라데이션' },
                  { id: 'segmented', name: '분할' },
                  { id: 'circular', name: '원형' }
                ].map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSettings(prev => ({ ...prev, style: style.id }))}
                    className={`px-2 py-1 text-xs rounded transition-colors duration-150 ${
                      settings.style === style.id
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {style.name}
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

            {/* 크기 선택 */}
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
            </div>

            {/* 옵션 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 w-12">옵션</label>
              <div className="flex gap-3 flex-1">
                <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={settings.showPercentage}
                    onChange={(e) => setSettings(prev => ({ ...prev, showPercentage: e.target.checked }))}
                    className="w-3 h-3 text-gray-600 focus:ring-gray-400 border-gray-300 rounded"
                  />
                  <span>퍼센트</span>
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={settings.animate}
                    onChange={(e) => setSettings(prev => ({ ...prev, animate: e.target.checked }))}
                    className="w-3 h-3 text-gray-600 focus:ring-gray-400 border-gray-300 rounded"
                  />
                  <span>애니메이션</span>
                </label>
                {settings.style !== 'circular' && (
                  <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={settings.showMilestones}
                      onChange={(e) => setSettings(prev => ({ ...prev, showMilestones: e.target.checked }))}
                      className="w-3 h-3 text-gray-600 focus:ring-gray-400 border-gray-300 rounded"
                    />
                    <span>마일스톤</span>
                  </label>
                )}
              </div>
            </div>

            {/* 분할 수 (segmented 스타일일 때만) */}
            {settings.style === 'segmented' && (
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-600 dark:text-gray-400 w-12">분할</label>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={settings.segments}
                  onChange={(e) => setSettings(prev => ({ ...prev, segments: parseInt(e.target.value) }))}
                  className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 w-8">{settings.segments}</span>
              </div>
            )}
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

export default ProgressBarBlock;