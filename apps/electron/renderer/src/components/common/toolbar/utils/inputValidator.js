/**
 * 입력값 검증 및 XSS 방지 유틸리티
 * 
 * @description 사용자 입력값을 검증하고 XSS 공격을 방지하는 함수들
 * @author AI Assistant
 * @version 1.0.0
 */

// 허용된 폰트 크기 범위
const FONT_SIZE_MIN = 8;
const FONT_SIZE_MAX = 72;

// 허용된 폰트 패밀리 목록
const ALLOWED_FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
  'Verdana', 'Georgia', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black',
  'Impact', 'Lucida Console', 'Tahoma', 'Geneva', 'sans-serif', 'serif',
  'monospace', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'system-ui', 'Noto Sans KR', 'Nanum Gothic', 'Malgun Gothic'
];

/**
 * CSS 색상 값 검증
 * @param {string} color - 검증할 색상 값
 * @returns {boolean} - 유효한 색상인지 여부
 */
export const isValidColor = (color) => {
  if (!color || typeof color !== 'string') {
    console.warn('isValidColor: Invalid color input:', color);
    return false;
  }
  
  // 색상 문자열 길이 및 상용성 검사
  if (color.length > 50) {
    console.warn('isValidColor: Color string too long:', color);
    return false;
  }
  
  // HEX 색상 (#rgb, #rrggbb, #rrggbbaa)
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  if (hexPattern.test(color)) return true;
  
  // RGB/RGBA 색상
  const rgbPattern = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/;
  const rgbMatch = color.match(rgbPattern);
  if (rgbMatch) {
    try {
      const [, r, g, b, a] = rgbMatch;
      const red = parseInt(r, 10);
      const green = parseInt(g, 10);
      const blue = parseInt(b, 10);
      const alpha = a ? parseFloat(a) : 1;
      
      // NaN 및 범위 검사
      if (isNaN(red) || isNaN(green) || isNaN(blue) || isNaN(alpha)) {
        return false;
      }
      
      return red >= 0 && red <= 255 && 
             green >= 0 && green <= 255 && 
             blue >= 0 && blue <= 255 && 
             alpha >= 0 && alpha <= 1;
    } catch (error) {
      console.warn('isValidColor: Error parsing RGB color:', error);
      return false;
    }
  }
  
  // HSL/HSLA 색상
  const hslPattern = /^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+))?\s*\)$/;
  const hslMatch = color.match(hslPattern);
  if (hslMatch) {
    const [, h, s, l, a] = hslMatch;
    const hue = parseInt(h, 10);
    const saturation = parseInt(s, 10);
    const lightness = parseInt(l, 10);
    const alpha = a ? parseFloat(a) : 1;
    
    return hue >= 0 && hue <= 360 && 
           saturation >= 0 && saturation <= 100 && 
           lightness >= 0 && lightness <= 100 && 
           alpha >= 0 && alpha <= 1;
  }
  
  // 사전 정의된 색상명
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
    'pink', 'brown', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'maroon',
    'navy', 'olive', 'silver', 'teal', 'transparent'
  ];
  
  return namedColors.includes(color.toLowerCase());
};

/**
 * 폰트 크기 값 검증 및 정규화
 * @param {string|number} fontSize - 검증할 폰트 크기
 * @returns {string|null} - 정규화된 폰트 크기 또는 null
 */
export const validateFontSize = (fontSize) => {
  if (!fontSize) return null;
  
  let size;
  if (typeof fontSize === 'string') {
    // "14px", "1.2em", "16" 등의 형태 처리
    const match = fontSize.match(/^(\d+(?:\.\d+)?)(px|em|rem|%)?$/);
    if (!match) return null;
    
    size = parseFloat(match[1]);
    const unit = match[2] || 'px';
    
    // px 단위로 정규화
    if (unit === 'px') {
      // 그대로 사용
    } else if (unit === 'em' || unit === 'rem') {
      size = size * 16; // 기본 16px 기준
    } else if (unit === '%') {
      size = (size / 100) * 16; // 기본 16px 기준
    }
  } else if (typeof fontSize === 'number') {
    size = fontSize;
  } else {
    return null;
  }
  
  // 범위 검증
  if (size < FONT_SIZE_MIN || size > FONT_SIZE_MAX) return null;
  
  return `${Math.round(size)}px`;
};

/**
 * 폰트 패밀리 검증
 * @param {string} fontFamily - 검증할 폰트 패밀리
 * @returns {string|null} - 검증된 폰트 패밀리 또는 null
 */
export const validateFontFamily = (fontFamily) => {
  if (!fontFamily || typeof fontFamily !== 'string') return null;
  
  // 따옴표 제거 및 공백 정리
  const cleanFont = fontFamily.replace(/['"]/g, '').trim();
  
  // 허용된 폰트 목록에 있는지 확인
  return ALLOWED_FONTS.includes(cleanFont) ? cleanFont : null;
};

/**
 * URL 검증 (링크용)
 * @param {string} url - 검증할 URL
 * @returns {boolean} - 유효한 URL인지 여부
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    // HTTP/HTTPS 프로토콜만 허용
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * HTML 태그 및 특수 문자 이스케이프
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} - 이스케이프된 텍스트
 */
export const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * CSS 속성값 검증
 * @param {string} property - CSS 속성명
 * @param {string} value - CSS 속성값
 * @returns {boolean} - 유효한 CSS 속성값인지 여부
 */
export const isValidCssValue = (property, value) => {
  if (!property || !value || typeof property !== 'string' || typeof value !== 'string') {
    return false;
  }
  
  // 위험한 CSS 속성/값 차단
  const dangerousPatterns = [
    /javascript:/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /@import/i,
    /behavior:/i,
    /binding:/i,
    /mozbinding:/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(value));
};