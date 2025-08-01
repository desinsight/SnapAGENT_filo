/**
 * Logger.js
 * 공통 로깅 모듈 - 모든 AI 코어 컴포넌트에서 사용
 * 이모지 기반 로깅 스타일 통일
 */

export class Logger {
  static log(message, emoji = '📝') {
    console.log(`${emoji} ${message}`);
  }

  static error(message, error = null, emoji = '❌') {
    if (error) {
      console.error(`${emoji} ${message}`, error);
    } else {
      console.error(`${emoji} ${message}`);
    }
  }

  static warn(message, emoji = '⚠️') {
    console.warn(`${emoji} ${message}`);
  }

  static success(message, emoji = '✅') {
    console.log(`${emoji} ${message}`);
  }

  static info(message, emoji = 'ℹ️') {
    console.log(`${emoji} ${message}`);
  }

  static debug(message, emoji = '🔍') {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${emoji} ${message}`);
    }
  }

  // 특정 컴포넌트별 로깅
  static component(componentName) {
    return {
      log: (message, emoji = '📝') => Logger.log(`[${componentName}] ${message}`, emoji),
      error: (message, error = null, emoji = '❌') => Logger.error(`[${componentName}] ${message}`, error, emoji),
      warn: (message, emoji = '⚠️') => Logger.warn(`[${componentName}] ${message}`, emoji),
      success: (message, emoji = '✅') => Logger.success(`[${componentName}] ${message}`, emoji),
      info: (message, emoji = 'ℹ️') => Logger.info(`[${componentName}] ${message}`, emoji),
      debug: (message, emoji = '🔍') => Logger.debug(`[${componentName}] ${message}`, emoji)
    };
  }
} 