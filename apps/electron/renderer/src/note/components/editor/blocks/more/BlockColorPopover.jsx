import React, { useState, useRef, useEffect } from 'react';

// 기본 색상 (22개)
const BASIC_COLORS = [
  { name: '기본', value: 'transparent' },
  { name: '화이트', value: '#FFFFFF' },
  { name: '연회색', value: '#F8F9FA' },
  { name: '회색', value: '#E9ECEF' },
  { name: '진회색', value: '#6C757D' },
  { name: '블랙', value: '#212529' },
  { name: '연분홍', value: '#FFE8E8' },
  { name: '분홍', value: '#FF8A95' },
  { name: '진분홍', value: '#E91E63' },
  { name: '연빨강', value: '#FFEBEE' },
  { name: '빨강', value: '#F44336' },
  { name: '진빨강', value: '#C62828' },
  { name: '연주황', value: '#FFF3E0' },
  { name: '주황', value: '#FF9800' },
  { name: '진주황', value: '#E65100' },
  { name: '연노랑', value: '#FFFDE7' },
  { name: '노랑', value: '#FFEB3B' },
  { name: '진노랑', value: '#F57F17' },
  { name: '연초록', value: '#E8F5E8' },
  { name: '초록', value: '#4CAF50' },
  { name: '진초록', value: '#1B5E20' },
  { name: '민트', value: '#E0F2F1' },
  { name: '연청록', value: '#26A69A' },
  { name: '연파랑', value: '#E3F2FD' },
  { name: '파랑', value: '#2196F3' },
  { name: '진파랑', value: '#0D47A1' },
  { name: '남색', value: '#3F51B5' },
  { name: '연보라', value: '#F3E5F5' },
  { name: '보라', value: '#9C27B0' },
  { name: '진보라', value: '#4A148C' }
];

// 그라데이션 (4개)
const GRADIENTS = [
  { name: '오로라', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: '선셋', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: '오션', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: '피치', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
];


// 패턴 (9개) - CSS 그라데이션으로 미리보기
const PATTERNS = [
  { 
    name: '도트', 
    value: { type: 'dot', dotColor: '#ADB5BD', bgColor: '#F8F9FA', size: 12 },
    preview: { 
      background: '#F8F9FA',
      backgroundImage: 'radial-gradient(circle, #ADB5BD 1.5px, transparent 1.5px)',
      backgroundSize: '12px 12px'
    }
  },
  { 
    name: '스트라이프', 
    value: 'repeating-linear-gradient(45deg, #E9ECEF 0px, #E9ECEF 8px, #ADB5BD 8px, #ADB5BD 16px)',
    preview: {
      background: 'repeating-linear-gradient(45deg, #E9ECEF 0px, #E9ECEF 4px, #ADB5BD 4px, #ADB5BD 8px)'
    }
  },
  { 
    name: '체크', 
    value: 'repeating-linear-gradient(0deg, #F1F3F4 0px, #F1F3F4 16px, #CED4DA 16px, #CED4DA 32px), repeating-linear-gradient(90deg, transparent 0px, transparent 16px, rgba(173, 181, 189, 0.3) 16px, rgba(173, 181, 189, 0.3) 32px)',
    preview: {
      background: 'repeating-linear-gradient(0deg, #F1F3F4 0px, #F1F3F4 8px, #CED4DA 8px, #CED4DA 16px), repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(173, 181, 189, 0.3) 8px, rgba(173, 181, 189, 0.3) 16px)'
    }
  },
  { 
    name: '세로줄', 
    value: 'repeating-linear-gradient(0deg, #F8F9FA 0px, #F8F9FA 12px, #ADB5BD 12px, #ADB5BD 16px)',
    preview: {
      background: 'repeating-linear-gradient(0deg, #F8F9FA 0px, #F8F9FA 6px, #ADB5BD 6px, #ADB5BD 8px)'
    }
  },
  { 
    name: '가로줄', 
    value: 'repeating-linear-gradient(90deg, #F8F9FA 0px, #F8F9FA 12px, #ADB5BD 12px, #ADB5BD 16px)',
    preview: {
      background: 'repeating-linear-gradient(90deg, #F8F9FA 0px, #F8F9FA 6px, #ADB5BD 6px, #ADB5BD 8px)'
    }
  },
  { 
    name: '지그재그', 
    value: 'repeating-linear-gradient(-45deg, #E9ECEF 0px, #E9ECEF 8px, #ADB5BD 8px, #ADB5BD 16px)',
    preview: {
      background: 'repeating-linear-gradient(-45deg, #E9ECEF 0px, #E9ECEF 4px, #ADB5BD 4px, #ADB5BD 8px)'
    }
  },
  { 
    name: '다이아몬드', 
    value: 'repeating-linear-gradient(45deg, #F1F3F4 0px, #F1F3F4 12px, #CED4DA 12px, #CED4DA 24px), repeating-linear-gradient(-45deg, transparent 0px, transparent 12px, rgba(173, 181, 189, 0.2) 12px, rgba(173, 181, 189, 0.2) 24px)',
    preview: {
      background: 'repeating-linear-gradient(45deg, #F1F3F4 0px, #F1F3F4 6px, #CED4DA 6px, #CED4DA 12px), repeating-linear-gradient(-45deg, transparent 0px, transparent 6px, rgba(173, 181, 189, 0.2) 6px, rgba(173, 181, 189, 0.2) 12px)'
    }
  },
  { 
    name: '물결', 
    value: 'repeating-radial-gradient(circle at 0 0, #F1F3F4 0px, #F1F3F4 8px, #CED4DA 8px, #CED4DA 16px)',
    preview: {
      background: 'repeating-radial-gradient(circle at 0 0, #F1F3F4 0px, #F1F3F4 4px, #CED4DA 4px, #CED4DA 8px)'
    }
  },
  { 
    name: '크로스', 
    value: 'repeating-linear-gradient(0deg, transparent 0px, transparent 12px, #ADB5BD 12px, #ADB5BD 16px, transparent 16px, transparent 28px), repeating-linear-gradient(90deg, transparent 0px, transparent 12px, #ADB5BD 12px, #ADB5BD 16px, transparent 16px, transparent 28px)',
    preview: {
      background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 6px, #ADB5BD 6px, #ADB5BD 8px, transparent 8px, transparent 14px), repeating-linear-gradient(90deg, transparent 0px, transparent 6px, #ADB5BD 6px, #ADB5BD 8px, transparent 8px, transparent 14px)'
    }
  }
];

const BLOCK_COLORS = [...BASIC_COLORS, ...GRADIENTS, ...PATTERNS];

const BlockColorPopover = ({ onColorSelect, currentBlockColor }) => {
  const [show, setShow] = useState(false);
  const [alpha, setAlpha] = useState(1); // 투명도 상태 (0~1, 기본 1)
  const [previewAlpha, setPreviewAlpha] = useState(1); // 실시간 미리보기용 투명도
  const [selectedColor, setSelectedColor] = useState(null); // 현재 선택된 색상
  const [originalColor, setOriginalColor] = useState(null); // 원본 색상 (투명도 적용 전)
  const btnRef = useRef(null);
  const popoverRef = useRef(null);

  // 현재 블록 색상에서 원본 색상과 투명도 추출
  const parseCurrentColor = (colorValue) => {
    if (!colorValue || colorValue === 'transparent') return { color: null, alpha: 1 };
    
    // 객체 타입 먼저 체크
    if (typeof colorValue === 'object') {
      // 도트 패턴인 경우
      if (colorValue.type === 'dot') {
        return { color: colorValue, alpha: colorValue.alpha || 1 };
      }
      // 그라데이션 with 알파인 경우 (레거시)
      if (colorValue.type === 'gradientWithAlpha') {
        return { color: colorValue.gradient, alpha: colorValue.alpha || 1 };
      }
      // 그라데이션 with opacity인 경우 (새로운 방식)
      if (colorValue.type === 'gradientWithOpacity') {
        return { color: colorValue.gradient, alpha: colorValue.opacity || 1 };
      }
      // 기타 객체는 그대로 반환
      return { color: colorValue, alpha: 1 };
    }
    
    // 문자열 타입인 경우에만 match 사용
    if (typeof colorValue === 'string') {
      // rgba 형식인 경우
      const rgbaMatch = colorValue.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (rgbaMatch) {
        const [, r, g, b, a] = rgbaMatch;
        // rgba를 hex로 변환
        const hex = '#' + [r, g, b].map(x => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        return { color: hex, alpha: parseFloat(a) };
      }
      
      // 그라데이션이나 패턴인 경우
      if (colorValue.includes('gradient') || colorValue.includes('repeating')) {
        // rgba 값들을 찾아서 첫 번째 투명도 추출
        const alphaMatch = colorValue.match(/rgba\([^)]+,\s*([\d.]+)\)/);
        const currentAlpha = alphaMatch ? parseFloat(alphaMatch[1]) : 1;
        
        // 원본 그라데이션 찾기 (투명도를 1로 복원)
        const originalGradient = BLOCK_COLORS.find(c => {
          if (typeof c.value === 'string' && c.value.includes('gradient')) {
            // 두 그라데이션이 같은 패턴인지 확인 (투명도 무시)
            const normalized1 = colorValue.replace(/rgba?\([^)]+\)/g, 'COLOR');
            const normalized2 = c.value.replace(/rgba?\([^)]+\)/g, 'COLOR');
            return normalized1 === normalized2;
          }
          return false;
        });
        
        return { 
          color: originalGradient ? originalGradient.value : colorValue, 
          alpha: currentAlpha 
        };
      }
    }
    
    return { color: colorValue, alpha: 1 };
  };

  // 팝오버가 열릴 때마다 현재 색상 분석
  useEffect(() => {
    if (show) {
      if (currentBlockColor && currentBlockColor !== 'transparent') {
        const { color, alpha: currentAlpha } = parseCurrentColor(currentBlockColor);
        
        // 원본 색상 찾기
        const foundColor = BLOCK_COLORS.find(c => {
          if (typeof c.value === 'object' && typeof color === 'object') {
            return JSON.stringify(c.value) === JSON.stringify(color);
          }
          return c.value === color;
        });
        
        if (foundColor) {
          setSelectedColor(foundColor.value);
          setOriginalColor(foundColor.value);
        } else if (color) {
          setSelectedColor(color);
          setOriginalColor(color);
        }
        
        setAlpha(currentAlpha);
        setPreviewAlpha(currentAlpha);
      } else {
        // 색상이 없는 경우 기본값 설정
        setAlpha(1);
        setPreviewAlpha(1);
        setOriginalColor(null);
        // 기본 색상으로 첫 번째 실제 색상 선택 (transparent 제외)
        const defaultColor = BLOCK_COLORS.find(c => c.value !== 'transparent');
        if (defaultColor) {
          setSelectedColor(defaultColor.value);
          setOriginalColor(defaultColor.value);
        }
      }
    }
  }, [show, currentBlockColor]);

  useEffect(() => {
    if (!show) return;
    const handleClick = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [show]);

  // HEX -> RGBA 변환 함수
  function hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // CSS 문자열 내 모든 색상에 투명도 적용
  function applyAlphaToCssColors(css, alpha) {
    // 이미 rgba가 포함된 경우, 투명도만 업데이트
    let result = css.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/g, (match, r, g, b) => {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    });
    
    // rgb 형식을 rgba로 변환
    result = result.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, (match, r, g, b) => {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    });
    
    // #RRGGBB 또는 #RGB 패턴을 rgba로 변환
    result = result.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (hex) => hexToRgba(hex, alpha));
    
    return result;
  }
  
  // 그라데이션 투명도 처리 - 기존 알파값을 곱셈으로 조정
  function applyAlphaToGradient(css, alpha) {
    // rgba가 있는 경우 기존 알파값에 새 알파값을 곱함
    let result = css.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/g, (match, r, g, b, a) => {
      const originalAlpha = parseFloat(a);
      const newAlpha = originalAlpha * alpha;
      return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
    });
    
    // rgb인 경우에만 rgba로 변환
    result = result.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, (match, r, g, b) => {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    });
    
    // hex 색상인 경우에만 rgba로 변환
    result = result.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g, (hex) => hexToRgba(hex, alpha));
    
    return result;
  }

  // 색상 버튼 클릭 핸들러
  const handleColorSelect = (color, customAlpha = null) => {
    const alphaToUse = customAlpha !== null ? customAlpha : alpha;
    
    // 새로운 색상을 선택하는 경우 (버튼 클릭)
    if (customAlpha === null) {
      setOriginalColor(color); // 원본 색상 저장
      setSelectedColor(color);
    }
    
    // 투명도 조절 시에는 원본 색상 사용
    const colorToApply = customAlpha !== null && originalColor ? originalColor : color;
    
    // 그라데이션의 경우 특별 처리 - 원본 유지하고 투명도 별도 저장
    if (typeof colorToApply === 'string' && (colorToApply.includes('gradient') || colorToApply.includes('repeating'))) {
      onColorSelect({
        type: 'gradientWithOpacity',
        gradient: colorToApply,
        opacity: alphaToUse
      });
    } else if (typeof colorToApply === 'object' && colorToApply.type === 'dot') {
      // 도트 패턴: 객체로 alpha 포함해서 넘김
      onColorSelect({ ...colorToApply, alpha: alphaToUse });
    } else if (typeof colorToApply === 'string' && colorToApply.startsWith('#')) {
      onColorSelect(hexToRgba(colorToApply, alphaToUse));
    } else if (colorToApply === 'transparent') {
      onColorSelect('transparent');
    } else {
      onColorSelect(colorToApply);
    }
    
    // 실시간 적용이 아닌 경우에만 팝오버 닫기
    if (customAlpha === null) {
      setShow(false);
    }
  };

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        onClick={() => setShow(s => !s)}
        className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 transition-all duration-150 group rounded"
        title="블록 색상 변경"
        type="button"
      >
        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-all duration-150">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <circle cx="13.5" cy="6.5" r=".5"/>
            <circle cx="17.5" cy="10.5" r=".5"/>
            <circle cx="8.5" cy="7.5" r=".5"/>
            <circle cx="6.5" cy="12.5" r=".5"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
        </span>
        <span className="font-medium flex-1">블록 색상</span>
        <span className="text-gray-400 transition-transform duration-150 group-hover:rotate-180">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {show && (
        <div
          ref={popoverRef}
          className="absolute right-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[10000]"
          style={{ minWidth: '280px' }}
        >
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">블록 색상</div>
          
          {/* 기본 색상들 */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2">기본 색상</div>
            <div className="grid grid-cols-6 gap-2">
              {BASIC_COLORS.map((color, i) => (
                <button
                  key={i}
                  onClick={() => handleColorSelect(color.value)}
                  className={`w-8 h-8 rounded-md ${
                    JSON.stringify(selectedColor) === JSON.stringify(color.value) 
                      ? 'ring-2 ring-blue-500 ring-offset-1' 
                      : 'border border-gray-200'
                  } hover:scale-110 transition-all shadow-sm flex items-center justify-center relative overflow-hidden`}
                  title={color.name}
                  type="button"
                  style={{
                    background: typeof color.value === 'string' && color.value.startsWith('#') 
                      ? hexToRgba(color.value, previewAlpha) 
                      : color.value,
                    border: color.value === 'transparent' ? '1.5px dashed #bbb' : undefined
                  }}
                >
                  {color.value === 'transparent' && (
                    <span className="text-xs text-gray-500">∅</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 그라데이션 */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2">그라데이션</div>
            <div className="grid grid-cols-2 gap-2">
              {GRADIENTS.map((color, i) => (
                <button
                  key={`gradient-${i}`}
                  onClick={() => handleColorSelect(color.value)}
                  className={`w-full h-6 rounded-md ${
                    JSON.stringify(selectedColor) === JSON.stringify(color.value) 
                      ? 'ring-2 ring-blue-500 ring-offset-1' 
                      : 'border border-gray-200'
                  } hover:scale-105 transition-all shadow-sm relative overflow-hidden`}
                  title={color.name}
                  type="button"
                  style={{
                    background: color.value,
                    opacity: previewAlpha
                  }}
                />
              ))}
            </div>
          </div>

          {/* 패턴들 */}
          <div className="mb-2">
            <div className="text-xs text-gray-400 mb-2">패턴</div>
            <div className="grid grid-cols-3 gap-2">
              {PATTERNS.map((color, i) => (
                <button
                  key={`pattern-${i}`}
                  onClick={() => handleColorSelect(color.value)}
                  className={`w-full h-8 rounded-md ${
                    JSON.stringify(selectedColor) === JSON.stringify(color.value) 
                      ? 'ring-2 ring-blue-500 ring-offset-1' 
                      : 'border border-gray-200'
                  } hover:scale-105 transition-all shadow-sm relative overflow-hidden`}
                  title={color.name}
                  type="button"
                style={{
                  // CSS 그라데이션 미리보기 사용
                  ...(color.preview || { background: color.value }),
                  opacity: previewAlpha
                }}
              />
              ))}
            </div>
          </div>
          {/* 투명도 슬라이더 */}
          <div className="mt-4 px-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">투명도</span>
              <span className="text-xs w-10 text-right text-gray-700 dark:text-gray-200 font-medium ml-auto">
                {Math.round(alpha * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newAlpha = Math.max(0, alpha - 0.1);
                  setAlpha(newAlpha);
                  setPreviewAlpha(newAlpha);
                  // 원본 색상이 있으면 실시간으로 적용
                  if (originalColor) {
                    handleColorSelect(originalColor, newAlpha);
                  }
                }}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                -
              </button>
              <div 
                className="flex-1 h-3 bg-gray-200 rounded relative cursor-pointer group"
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const newAlpha = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setAlpha(newAlpha);
                  setPreviewAlpha(newAlpha);
                  if (originalColor) {
                    handleColorSelect(originalColor, newAlpha);
                  }

                  const handleMouseMove = (moveEvent) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const newAlpha = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                    setAlpha(newAlpha);
                    setPreviewAlpha(newAlpha);
                    if (originalColor) {
                      handleColorSelect(originalColor, newAlpha);
                    }
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                <div 
                  className="absolute h-full bg-blue-500 rounded transition-all duration-100"
                  style={{ width: `${alpha * 100}%` }}
                />
                <div 
                  className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md transform -translate-y-0.5 -translate-x-2 transition-all duration-100 group-hover:scale-110"
                  style={{ left: `${alpha * 100}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const newAlpha = Math.min(1, alpha + 0.1);
                  setAlpha(newAlpha);
                  setPreviewAlpha(newAlpha);
                  // 원본 색상이 있으면 실시간으로 적용
                  if (originalColor) {
                    handleColorSelect(originalColor, newAlpha);
                  }
                }}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockColorPopover; 