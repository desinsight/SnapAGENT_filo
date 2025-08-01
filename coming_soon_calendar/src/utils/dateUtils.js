// dateUtils.js
// 날짜/시간 유틸리티 함수 모음 - 캘린더 앱 전용

/**
 * 유효한 날짜인지 검증
 * @param {any} date - 검증할 날짜
 * @returns {boolean} 유효한 날짜 여부
 */
const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * 날짜를 YYYY-MM-DD 형식 문자열로 변환
 * @param {Date|string|number} date - 변환할 날짜
 * @returns {string} YYYY-MM-DD 형식의 날짜 문자열
 */
exports.formatDate = (date) => {
  try {
    if (!isValidDate(date)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
  } catch (error) {
    console.error('날짜 형식 변환 오류:', error);
    return '';
  }
};

/**
 * 날짜를 YYYY-MM-DD HH:mm:ss 형식 문자열로 변환
 * @param {Date|string|number} date - 변환할 날짜
 * @param {boolean} includeTime - 시간 포함 여부 (기본값: true)
 * @returns {string} 형식화된 날짜 문자열
 */
exports.formatDateTime = (date, includeTime = true) => {
  try {
    if (!isValidDate(date)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    const d = new Date(date);
    const dateStr = d.toISOString().slice(0, 10);
    
    if (!includeTime) {
      return dateStr;
    }
    
    const timeStr = d.toTimeString().slice(0, 8);
    return `${dateStr} ${timeStr}`;
  } catch (error) {
    console.error('날짜시간 형식 변환 오류:', error);
    return '';
  }
};

/**
 * 두 날짜가 같은 날인지 비교
 * @param {Date|string|number} date1 - 첫 번째 날짜
 * @param {Date|string|number} date2 - 두 번째 날짜
 * @returns {boolean} 같은 날 여부
 */
exports.isSameDay = (date1, date2) => {
  try {
    if (!isValidDate(date1) || !isValidDate(date2)) {
      return false;
    }
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  } catch (error) {
    console.error('날짜 비교 오류:', error);
    return false;
  }
};

/**
 * 두 날짜가 같은 시간인지 비교
 * @param {Date|string|number} date1 - 첫 번째 날짜
 * @param {Date|string|number} date2 - 두 번째 날짜
 * @returns {boolean} 같은 시간 여부
 */
exports.isSameTime = (date1, date2) => {
  try {
    if (!isValidDate(date1) || !isValidDate(date2)) {
      return false;
    }
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1.getTime() === d2.getTime();
  } catch (error) {
    console.error('시간 비교 오류:', error);
    return false;
  }
};

/**
 * 날짜 차이(일 단위) 계산
 * @param {Date|string|number} date1 - 시작 날짜
 * @param {Date|string|number} date2 - 종료 날짜
 * @returns {number} 일 단위 차이
 */
exports.diffDays = (date1, date2) => {
  try {
    if (!isValidDate(date1) || !isValidDate(date2)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // 시간을 00:00:00으로 설정하여 정확한 일수 계산
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('날짜 차이 계산 오류:', error);
    return 0;
  }
};

/**
 * 시간 차이(분 단위) 계산
 * @param {Date|string|number} date1 - 시작 시간
 * @param {Date|string|number} date2 - 종료 시간
 * @returns {number} 분 단위 차이
 */
exports.diffMinutes = (date1, date2) => {
  try {
    if (!isValidDate(date1) || !isValidDate(date2)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60));
  } catch (error) {
    console.error('시간 차이 계산 오류:', error);
    return 0;
  }
};

/**
 * 날짜에 일수 추가
 * @param {Date|string|number} date - 기준 날짜
 * @param {number} days - 추가할 일수
 * @returns {Date} 계산된 날짜
 */
exports.addDays = (date, days) => {
  try {
    if (!isValidDate(date)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    if (typeof days !== 'number') {
      throw new Error('일수는 숫자여야 합니다');
    }
    
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  } catch (error) {
    console.error('날짜 추가 오류:', error);
    return new Date();
  }
};

/**
 * 날짜에 시간 추가
 * @param {Date|string|number} date - 기준 날짜
 * @param {number} hours - 추가할 시간
 * @returns {Date} 계산된 날짜
 */
exports.addHours = (date, hours) => {
  try {
    if (!isValidDate(date)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    if (typeof hours !== 'number') {
      throw new Error('시간은 숫자여야 합니다');
    }
    
    const d = new Date(date);
    d.setHours(d.getHours() + hours);
    return d;
  } catch (error) {
    console.error('시간 추가 오류:', error);
    return new Date();
  }
};

/**
 * 주의 시작일(월요일) 구하기
 * @param {Date|string|number} date - 기준 날짜
 * @returns {Date} 주의 시작일
 */
exports.getWeekStart = (date) => {
  try {
    if (!isValidDate(date)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일을 시작으로
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  } catch (error) {
    console.error('주 시작일 계산 오류:', error);
    return new Date();
  }
};

/**
 * 주의 종료일(일요일) 구하기
 * @param {Date|string|number} date - 기준 날짜
 * @returns {Date} 주의 종료일
 */
exports.getWeekEnd = (date) => {
  try {
    if (!isValidDate(date)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    const weekStart = exports.getWeekStart(date);
    weekStart.setDate(weekStart.getDate() + 6);
    weekStart.setHours(23, 59, 59, 999);
    return weekStart;
  } catch (error) {
    console.error('주 종료일 계산 오류:', error);
    return new Date();
  }
};

/**
 * 월의 시작일 구하기
 * @param {Date|string|number} date - 기준 날짜
 * @returns {Date} 월의 시작일
 */
exports.getMonthStart = (date) => {
  try {
    if (!isValidDate(date)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  } catch (error) {
    console.error('월 시작일 계산 오류:', error);
    return new Date();
  }
};

/**
 * 월의 종료일 구하기
 * @param {Date|string|number} date - 기준 날짜
 * @returns {Date} 월의 종료일
 */
exports.getMonthEnd = (date) => {
  try {
    if (!isValidDate(date)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1, 0); // 다음 달의 0일 = 이번 달의 마지막 날
    d.setHours(23, 59, 59, 999);
    return d;
  } catch (error) {
    console.error('월 종료일 계산 오류:', error);
    return new Date();
  }
};

/**
 * 날짜가 특정 범위 내에 있는지 확인
 * @param {Date|string|number} date - 확인할 날짜
 * @param {Date|string|number} start - 시작 날짜
 * @param {Date|string|number} end - 종료 날짜
 * @param {boolean} inclusive - 시작/종료 날짜 포함 여부 (기본값: true)
 * @returns {boolean} 범위 내 여부
 */
exports.isDateInRange = (date, start, end, inclusive = true) => {
  try {
    if (!isValidDate(date) || !isValidDate(start) || !isValidDate(end)) {
      return false;
    }
    
    const d = new Date(date);
    const s = new Date(start);
    const e = new Date(end);
    
    if (inclusive) {
      return d >= s && d <= e;
    } else {
      return d > s && d < e;
    }
  } catch (error) {
    console.error('날짜 범위 확인 오류:', error);
    return false;
  }
};

/**
 * 시간대별 카테고리 반환
 * @param {Date|string|number} date - 확인할 날짜
 * @returns {string} 시간대 카테고리 (morning/afternoon/evening/night)
 */
exports.getTimeCategory = (date) => {
  try {
    if (!isValidDate(date)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    const d = new Date(date);
    const hour = d.getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 17) {
      return 'afternoon';
    } else if (hour >= 17 && hour < 22) {
      return 'evening';
    } else {
      return 'night';
    }
  } catch (error) {
    console.error('시간대 카테고리 확인 오류:', error);
    return 'unknown';
  }
};

/**
 * 상대적 시간 표현 (예: "3일 전", "1시간 후")
 * @param {Date|string|number} date - 기준 날짜
 * @param {Date|string|number} baseDate - 비교 기준 날짜 (기본값: 현재 시간)
 * @returns {string} 상대적 시간 표현
 */
exports.getRelativeTime = (date, baseDate = new Date()) => {
  try {
    if (!isValidDate(date) || !isValidDate(baseDate)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    const d = new Date(date);
    const base = new Date(baseDate);
    const diffMs = d.getTime() - base.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (Math.abs(diffMinutes) < 1) {
      return '방금 전';
    } else if (Math.abs(diffMinutes) < 60) {
      return `${Math.abs(diffMinutes)}분 ${diffMinutes > 0 ? '후' : '전'}`;
    } else if (Math.abs(diffHours) < 24) {
      return `${Math.abs(diffHours)}시간 ${diffHours > 0 ? '후' : '전'}`;
    } else if (Math.abs(diffDays) < 7) {
      return `${Math.abs(diffDays)}일 ${diffDays > 0 ? '후' : '전'}`;
    } else {
      return exports.formatDate(date);
    }
  } catch (error) {
    console.error('상대적 시간 계산 오류:', error);
    return '';
  }
};

/**
 * 현재 시간이 영업시간 내인지 확인
 * @param {Date|string|number} date - 확인할 날짜 (기본값: 현재 시간)
 * @param {number} startHour - 시작 시간 (기본값: 9)
 * @param {number} endHour - 종료 시간 (기본값: 18)
 * @returns {boolean} 영업시간 내 여부
 */
exports.isBusinessHours = (date = new Date(), startHour = 9, endHour = 18) => {
  try {
    if (!isValidDate(date)) {
      throw new Error('유효하지 않은 날짜입니다');
    }
    
    const d = new Date(date);
    const hour = d.getHours();
    const day = d.getDay();
    
    // 주말 제외 (0: 일요일, 6: 토요일)
    if (day === 0 || day === 6) {
      return false;
    }
    
    return hour >= startHour && hour < endHour;
  } catch (error) {
    console.error('영업시간 확인 오류:', error);
    return false;
  }
}; 