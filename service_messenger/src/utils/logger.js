// 로깅 유틸리티 (확장형)
// info, warn, error, event 등 다양한 로그 레벨 지원
// 추후 외부 모니터링 서비스 연동(예: Sentry, Datadog 등) 확장성 고려

const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  event: (...args) => console.log('[EVENT]', ...args),
  // TODO: 외부 연동 시 이 부분에서 확장
};

module.exports = logger; 