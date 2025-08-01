// 문자열 유틸리티 함수 모음 - 캘린더 앱 전용

/**
 * 문자열이 비어있는지 체크
 * @param {any} str - 검사할 문자열
 * @returns {boolean} 비어있는지 여부
 */
exports.isEmpty = (str) => {
  try {
    if (str === null || str === undefined) {
      return true;
    }
    
    if (typeof str !== 'string') {
      return true;
    }
    
    return str.trim().length === 0;
  } catch (error) {
    console.error('문자열 비어있음 검사 오류:', error);
    return true;
  }
};

/**
 * 문자열이 비어있지 않은지 체크
 * @param {any} str - 검사할 문자열
 * @returns {boolean} 비어있지 않은지 여부
 */
exports.isNotEmpty = (str) => {
  return !exports.isEmpty(str);
};

/**
 * UUID v4 형식인지 검증
 * @param {string} str - 검증할 문자열
 * @returns {boolean} UUID v4 형식 여부
 */
exports.isUUID = (str) => {
  try {
    if (exports.isEmpty(str)) {
      return false;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  } catch (error) {
    console.error('UUID 검증 오류:', error);
    return false;
  }
};

/**
 * 문자열 앞뒤 공백 제거
 * @param {any} str - 처리할 문자열
 * @returns {string} 공백이 제거된 문자열
 */
exports.trim = (str) => {
  try {
    if (str === null || str === undefined) {
      return '';
    }
    
    if (typeof str !== 'string') {
      return String(str).trim();
    }
    
    return str.trim();
  } catch (error) {
    console.error('문자열 공백 제거 오류:', error);
    return '';
  }
};

/**
 * 문자열 길이 제한
 * @param {string} str - 원본 문자열
 * @param {number} maxLength - 최대 길이
 * @param {string} suffix - 잘린 문자열 뒤에 붙일 접미사 (기본값: '...')
 * @returns {string} 길이가 제한된 문자열
 */
exports.truncate = (str, maxLength, suffix = '...') => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    if (typeof maxLength !== 'number' || maxLength < 0) {
      throw new Error('최대 길이는 0 이상의 숫자여야 합니다');
    }
    
    if (typeof suffix !== 'string') {
      throw new Error('접미사는 문자열이어야 합니다');
    }
    
    const trimmedStr = exports.trim(str);
    
    if (trimmedStr.length <= maxLength) {
      return trimmedStr;
    }
    
    return trimmedStr.substring(0, maxLength - suffix.length) + suffix;
  } catch (error) {
    console.error('문자열 자르기 오류:', error);
    return str || '';
  }
};

/**
 * 문자열을 카멜케이스로 변환
 * @param {string} str - 변환할 문자열
 * @returns {string} 카멜케이스 문자열
 */
exports.toCamelCase = (str) => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    const trimmedStr = exports.trim(str);
    return trimmedStr
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
  } catch (error) {
    console.error('카멜케이스 변환 오류:', error);
    return str || '';
  }
};

/**
 * 문자열을 파스칼케이스로 변환
 * @param {string} str - 변환할 문자열
 * @returns {string} 파스칼케이스 문자열
 */
exports.toPascalCase = (str) => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    const camelCase = exports.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  } catch (error) {
    console.error('파스칼케이스 변환 오류:', error);
    return str || '';
  }
};

/**
 * 문자열을 스네이크케이스로 변환
 * @param {string} str - 변환할 문자열
 * @returns {string} 스네이크케이스 문자열
 */
exports.toSnakeCase = (str) => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    const trimmedStr = exports.trim(str);
    return trimmedStr
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');
  } catch (error) {
    console.error('스네이크케이스 변환 오류:', error);
    return str || '';
  }
};

/**
 * 문자열을 케밥케이스로 변환
 * @param {string} str - 변환할 문자열
 * @returns {string} 케밥케이스 문자열
 */
exports.toKebabCase = (str) => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    const trimmedStr = exports.trim(str);
    return trimmedStr
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
  } catch (error) {
    console.error('케밥케이스 변환 오류:', error);
    return str || '';
  }
};

/**
 * 이메일 형식 검증
 * @param {string} email - 검증할 이메일
 * @returns {boolean} 유효한 이메일 형식 여부
 */
exports.isValidEmail = (email) => {
  try {
    if (exports.isEmpty(email)) {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(exports.trim(email));
  } catch (error) {
    console.error('이메일 검증 오류:', error);
    return false;
  }
};

/**
 * 전화번호 형식 검증 (한국)
 * @param {string} phone - 검증할 전화번호
 * @returns {boolean} 유효한 전화번호 형식 여부
 */
exports.isValidPhone = (phone) => {
  try {
    if (exports.isEmpty(phone)) {
      return false;
    }
    
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    const cleanPhone = exports.trim(phone).replace(/[^0-9-]/g, '');
    return phoneRegex.test(cleanPhone);
  } catch (error) {
    console.error('전화번호 검증 오류:', error);
    return false;
  }
};

/**
 * URL 형식 검증
 * @param {string} url - 검증할 URL
 * @returns {boolean} 유효한 URL 형식 여부
 */
exports.isValidUrl = (url) => {
  try {
    if (exports.isEmpty(url)) {
      return false;
    }
    
    const urlRegex = /^https?:\/\/.+/i;
    return urlRegex.test(exports.trim(url));
  } catch (error) {
    console.error('URL 검증 오류:', error);
    return false;
  }
};

/**
 * 문자열에서 특수문자 제거
 * @param {string} str - 원본 문자열
 * @param {boolean} keepSpaces - 공백 유지 여부 (기본값: true)
 * @returns {string} 특수문자가 제거된 문자열
 */
exports.removeSpecialChars = (str, keepSpaces = true) => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    const trimmedStr = exports.trim(str);
    const regex = keepSpaces 
      ? /[^a-zA-Z0-9가-힣\s]/g 
      : /[^a-zA-Z0-9가-힣]/g;
    
    return trimmedStr.replace(regex, '');
  } catch (error) {
    console.error('특수문자 제거 오류:', error);
    return str || '';
  }
};

/**
 * 문자열에서 숫자만 추출
 * @param {string} str - 원본 문자열
 * @returns {string} 숫자만 포함된 문자열
 */
exports.extractNumbers = (str) => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    const trimmedStr = exports.trim(str);
    return trimmedStr.replace(/[^0-9]/g, '');
  } catch (error) {
    console.error('숫자 추출 오류:', error);
    return '';
  }
};

/**
 * 문자열에서 알파벳만 추출
 * @param {string} str - 원본 문자열
 * @param {boolean} includeKorean - 한글 포함 여부 (기본값: true)
 * @returns {string} 알파벳만 포함된 문자열
 */
exports.extractLetters = (str, includeKorean = true) => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    const trimmedStr = exports.trim(str);
    const regex = includeKorean 
      ? /[^a-zA-Z가-힣]/g 
      : /[^a-zA-Z]/g;
    
    return trimmedStr.replace(regex, '');
  } catch (error) {
    console.error('알파벳 추출 오류:', error);
    return '';
  }
};

/**
 * 문자열을 지정된 길이로 패딩
 * @param {string} str - 원본 문자열
 * @param {number} length - 목표 길이
 * @param {string} padChar - 패딩 문자 (기본값: ' ')
 * @param {boolean} padStart - 앞쪽 패딩 여부 (기본값: true)
 * @returns {string} 패딩된 문자열
 */
exports.pad = (str, length, padChar = ' ', padStart = true) => {
  try {
    if (typeof length !== 'number' || length < 0) {
      throw new Error('길이는 0 이상의 숫자여야 합니다');
    }
    
    if (typeof padChar !== 'string' || padChar.length !== 1) {
      throw new Error('패딩 문자는 한 글자여야 합니다');
    }
    
    const targetStr = String(str || '');
    
    if (targetStr.length >= length) {
      return targetStr;
    }
    
    const padding = padChar.repeat(length - targetStr.length);
    return padStart ? padding + targetStr : targetStr + padding;
  } catch (error) {
    console.error('문자열 패딩 오류:', error);
    return str || '';
  }
};

/**
 * 문자열을 지정된 길이로 앞쪽 패딩
 * @param {string} str - 원본 문자열
 * @param {number} length - 목표 길이
 * @param {string} padChar - 패딩 문자 (기본값: ' ')
 * @returns {string} 앞쪽 패딩된 문자열
 */
exports.padStart = (str, length, padChar = ' ') => {
  return exports.pad(str, length, padChar, true);
};

/**
 * 문자열을 지정된 길이로 뒤쪽 패딩
 * @param {string} str - 원본 문자열
 * @param {number} length - 목표 길이
 * @param {string} padChar - 패딩 문자 (기본값: ' ')
 * @returns {string} 뒤쪽 패딩된 문자열
 */
exports.padEnd = (str, length, padChar = ' ') => {
  return exports.pad(str, length, padChar, false);
};

/**
 * 문자열을 안전하게 HTML 이스케이프
 * @param {string} str - 원본 문자열
 * @returns {string} HTML 이스케이프된 문자열
 */
exports.escapeHtml = (str) => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return exports.trim(str).replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
  } catch (error) {
    console.error('HTML 이스케이프 오류:', error);
    return str || '';
  }
};

/**
 * 문자열에서 첫 글자만 대문자로 변환
 * @param {string} str - 원본 문자열
 * @returns {string} 첫 글자가 대문자인 문자열
 */
exports.capitalize = (str) => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    const trimmedStr = exports.trim(str);
    return trimmedStr.charAt(0).toUpperCase() + trimmedStr.slice(1).toLowerCase();
  } catch (error) {
    console.error('첫 글자 대문자 변환 오류:', error);
    return str || '';
  }
};

/**
 * 문자열에서 모든 단어의 첫 글자를 대문자로 변환
 * @param {string} str - 원본 문자열
 * @returns {string} 모든 단어의 첫 글자가 대문자인 문자열
 */
exports.capitalizeWords = (str) => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    const trimmedStr = exports.trim(str);
    return trimmedStr
      .split(/\s+/)
      .map(word => exports.capitalize(word))
      .join(' ');
  } catch (error) {
    console.error('단어 첫 글자 대문자 변환 오류:', error);
    return str || '';
  }
};

/**
 * 문자열에서 중복 공백 제거
 * @param {string} str - 원본 문자열
 * @returns {string} 중복 공백이 제거된 문자열
 */
exports.normalizeSpaces = (str) => {
  try {
    if (exports.isEmpty(str)) {
      return '';
    }
    
    const trimmedStr = exports.trim(str);
    return trimmedStr.replace(/\s+/g, ' ');
  } catch (error) {
    console.error('중복 공백 제거 오류:', error);
    return str || '';
  }
};

/**
 * 문자열을 지정된 구분자로 분할
 * @param {string} str - 원본 문자열
 * @param {string|RegExp} separator - 구분자
 * @param {number} limit - 최대 분할 개수
 * @returns {Array<string>} 분할된 문자열 배열
 */
exports.split = (str, separator, limit) => {
  try {
    if (exports.isEmpty(str)) {
      return [];
    }
    
    const trimmedStr = exports.trim(str);
    
    if (limit !== undefined && (typeof limit !== 'number' || limit < 0)) {
      throw new Error('limit는 0 이상의 숫자여야 합니다');
    }
    
    const result = trimmedStr.split(separator);
    return limit !== undefined ? result.slice(0, limit) : result;
  } catch (error) {
    console.error('문자열 분할 오류:', error);
    return [];
  }
}; 