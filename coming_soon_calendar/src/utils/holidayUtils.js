// holidayUtils.js
// 한국 공휴일 API 연동 및 연도별 공휴일 목록 반환 유틸리티

const axios = require('axios');

// 공공데이터포털 한국 공휴일 API (예시용, 실제 서비스키 필요)
const HOLIDAY_API_URL = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';
const SERVICE_KEY = process.env.KOREA_HOLIDAY_API_KEY || 'YOUR_API_KEY';

/**
 * 연도별 공휴일 목록 조회 (API)
 * @param {number} year - 연도
 * @param {number} month - 월(1~12, 선택)
 * @returns {Promise<Date[]>} 공휴일 배열
 */
async function getKoreanHolidays(year, month = null) {
  try {
    if (!year || typeof year !== 'number') throw new Error('연도는 필수입니다');
    const holidays = [];
    const months = month ? [month] : Array.from({ length: 12 }, (_, i) => i + 1);

    for (const m of months) {
      const url = `${HOLIDAY_API_URL}?solYear=${year}&solMonth=${String(m).padStart(2, '0')}&ServiceKey=${SERVICE_KEY}&_type=json`;
      const res = await axios.get(url);
      const items =
        res.data?.response?.body?.items?.item || [];
      for (const item of Array.isArray(items) ? items : [items]) {
        if (item && item.locdate) {
          // locdate: YYYYMMDD
          const y = Number(String(item.locdate).slice(0, 4));
          const mo = Number(String(item.locdate).slice(4, 6)) - 1;
          const d = Number(String(item.locdate).slice(6, 8));
          holidays.push(new Date(y, mo, d));
        }
      }
    }
    return holidays;
  } catch (error) {
    console.error('공휴일 API 조회 오류:', error);
    return [];
  }
}

module.exports = {
  getKoreanHolidays
}; 