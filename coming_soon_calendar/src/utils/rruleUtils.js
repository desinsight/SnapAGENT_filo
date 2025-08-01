// rruleUtils.js
// RRULE 고급 반복 옵션 생성/파싱 유틸리티

const { RRule, rrulestr } = require('rrule');

/**
 * RRULE 문자열 생성
 * @param {Object} options - 반복 옵션
 * @param {string} options.freq - 반복 빈도(DAILY, WEEKLY, MONTHLY, YEARLY)
 * @param {number} options.interval - 반복 간격(1=매주, 2=격주 등)
 * @param {string[]} options.byweekday - 반복 요일(["MO", "WE"] 등)
 * @param {number[]} options.bymonthday - 반복 일([1,15,30] 등)
 * @param {number[]} options.bymonth - 반복 월([1,6,12] 등)
 * @param {string} options.until - 종료일(YYYYMMDDT000000Z)
 * @param {number} options.count - 반복 횟수
 * @returns {string} RRULE 문자열
 */
function buildRRuleString(options = {}) {
  const rrule = [];
  if (options.freq) rrule.push(`FREQ=${options.freq}`);
  if (options.interval) rrule.push(`INTERVAL=${options.interval}`);
  if (options.byweekday && options.byweekday.length)
    rrule.push(`BYDAY=${options.byweekday.join(',')}`);
  if (options.bymonthday && options.bymonthday.length)
    rrule.push(`BYMONTHDAY=${options.bymonthday.join(',')}`);
  if (options.bymonth && options.bymonth.length)
    rrule.push(`BYMONTH=${options.bymonth.join(',')}`);
  if (options.until) rrule.push(`UNTIL=${options.until}`);
  if (options.count) rrule.push(`COUNT=${options.count}`);
  return rrule.join(';');
}

/**
 * RRULE 문자열 파싱 → 옵션 객체
 * @param {string} rruleStr
 * @returns {Object} 옵션 객체
 */
function parseRRuleString(rruleStr) {
  try {
    const rule = rrulestr(rruleStr);
    return rule.options;
  } catch (error) {
    console.error('RRULE 파싱 오류:', error);
    return {};
  }
}

/**
 * RRULE 예시 생성 함수 (문서/테스트용)
 */
function getRRuleExamples() {
  return [
    {
      desc: '매주 월/수 반복',
      rrule: buildRRuleString({ freq: 'WEEKLY', byweekday: ['MO', 'WE'] })
    },
    {
      desc: '격주 금요일 반복',
      rrule: buildRRuleString({ freq: 'WEEKLY', interval: 2, byweekday: ['FR'] })
    },
    {
      desc: '매월 1, 15, 30일 반복',
      rrule: buildRRuleString({ freq: 'MONTHLY', bymonthday: [1, 15, 30] })
    },
    {
      desc: '매년 6월 1일 반복',
      rrule: buildRRuleString({ freq: 'YEARLY', bymonth: [6], bymonthday: [1] })
    },
    {
      desc: '2024-12-31까지 매일 반복',
      rrule: buildRRuleString({ freq: 'DAILY', until: '20241231T000000Z' })
    }
  ];
}

module.exports = {
  buildRRuleString,
  parseRRuleString,
  getRRuleExamples
}; 