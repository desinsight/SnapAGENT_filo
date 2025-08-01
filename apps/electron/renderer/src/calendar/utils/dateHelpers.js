// 날짜 관련 유틸리티 함수
import { KOREAN_LOCALE } from '../constants/calendarConfig';

// 날짜 포맷팅
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  const formats = {
    'YYYY-MM-DD': `${year}-${month}-${day}`,
    'YYYY-MM-DD HH:mm': `${year}-${month}-${day} ${hours}:${minutes}`,
    'MM/DD': `${month}/${day}`,
    'MM/DD HH:mm': `${month}/${day} ${hours}:${minutes}`,
    'HH:mm': `${hours}:${minutes}`,
    'YYYY년 MM월 DD일': `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`,
    'MM월 DD일': `${parseInt(month)}월 ${parseInt(day)}일`
  };
  
  return formats[format] || formats['YYYY-MM-DD'];
};

// 시간 포맷팅
export const formatTime = (date, format24h = true) => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (format24h) {
    return formatDate(d, 'HH:mm');
  }
  
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 || 12;
  
  return `${ampm} ${displayHours}:${minutes}`;
};

// 날짜 범위 포맷팅
export const formatDateRange = (startDate, endDate, allDay = false) => {
  if (!startDate) return '';
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;
  
  if (allDay) {
    if (isSameDay(start, end)) {
      return formatDate(start, 'MM월 DD일');
    }
    return `${formatDate(start, 'MM월 DD일')} - ${formatDate(end, 'MM월 DD일')}`;
  }
  
  if (isSameDay(start, end)) {
    return `${formatDate(start, 'MM월 DD일')} ${formatTime(start)} - ${formatTime(end)}`;
  }
  
  return `${formatDate(start, 'MM월 DD일')} ${formatTime(start)} - ${formatDate(end, 'MM월 DD일')} ${formatTime(end)}`;
};

// 날짜 비교
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// 오늘 여부 확인
export const isToday = (date) => {
  return isSameDay(date, new Date());
};

// 주말 여부 확인
export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

// 월의 첫 번째 날
export const getStartOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

// 월의 마지막 날
export const getEndOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
};

// 주의 첫 번째 날 (월요일 시작)
export const getStartOfWeek = (date, weekStart = 1) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 7 - weekStart) % 7;
  d.setDate(d.getDate() - diff);
  return d;
};

// 주의 마지막 날
export const getEndOfWeek = (date, weekStart = 1) => {
  const start = getStartOfWeek(date, weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

// 날짜 추가/빼기
export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const addWeeks = (date, weeks) => {
  return addDays(date, weeks * 7);
};

export const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

export const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

// 날짜 배열 생성
export const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

// ListView에서 사용하는 getDatesBetween (getDatesInRange와 동일)
export const getDatesBetween = getDatesInRange;

// 월 뷰용 날짜 그리드 생성
export const getMonthGrid = (date, weekStart = 1) => {
  const startOfMonth = getStartOfMonth(date);
  const endOfMonth = getEndOfMonth(date);
  const startOfGrid = getStartOfWeek(startOfMonth, weekStart);
  const endOfGrid = getEndOfWeek(endOfMonth, weekStart);
  
  const dates = getDatesInRange(startOfGrid, endOfGrid);
  
  // 6주 그리드로 맞추기
  while (dates.length < 42) {
    const lastDate = dates[dates.length - 1];
    dates.push(addDays(lastDate, 1));
  }
  
  // 7일씩 그룹화
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }
  
  return weeks;
};

// 주 뷰용 날짜 배열 생성
export const getWeekDates = (date, weekStart = 1) => {
  const startOfWeek = getStartOfWeek(date, weekStart);
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(startOfWeek, i));
  }
  
  return dates;
};

// 시간 대 반환
export const getTimezoneOffset = () => {
  return new Date().getTimezoneOffset();
};

// UTC로 변환
export const toUTC = (date) => {
  const d = new Date(date);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
};

// 로컬 시간으로 변환
export const toLocalTime = (date) => {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};

// 주차 계산
export const getWeekNumber = (date) => {
  const d = new Date(date);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekStart = getStartOfWeek(yearStart, 1);
  const diff = d - weekStart;
  
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
};

// 상대 시간 표시 (예: "어제", "오늘", "내일")
export const getRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffDays = Math.floor((target - now) / (24 * 60 * 60 * 1000));
  
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '내일';
  if (diffDays === -1) return '어제';
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}일 후`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}일 전`;
  
  return formatDate(date, 'MM월 DD일');
};

// 공휴일 확인 (기본 공휴일)
export const isHoliday = (date) => {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  // 기본 공휴일 (예시)
  const holidays = [
    { month: 1, day: 1 },   // 신정
    { month: 3, day: 1 },   // 삼일절
    { month: 5, day: 5 },   // 어린이날
    { month: 6, day: 6 },   // 현충일
    { month: 8, day: 15 },  // 광복절
    { month: 10, day: 3 },  // 개천절
    { month: 10, day: 9 },  // 한글날
    { month: 12, day: 25 }  // 크리스마스
  ];
  
  return holidays.some(holiday => holiday.month === month && holiday.day === day);
};

// 날짜 유효성 검사
export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

// 날짜 범위 중복 검사
export const isDateInRange = (date, startDate, endDate) => {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return d >= start && d <= end;
};

// 오늘부터 며칠 후인지 계산
export const getDaysFromToday = (date) => {
  const today = new Date();
  const target = new Date(date);
  
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  return Math.floor((target - today) / (24 * 60 * 60 * 1000));
};