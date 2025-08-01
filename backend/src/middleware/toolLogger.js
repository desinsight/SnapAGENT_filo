/**
 * Tool 실행 로깅 미들웨어
 * Tool 호출 추적, 성능 모니터링, 구독 사용량 분석
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ToolLogger {
  constructor() {
    // 로그 저장 경로 설정
    this.logDir = path.resolve(__dirname, '../../../logs');
    this.toolLogFile = path.join(this.logDir, 'tool-execution.log');
    this.errorLogFile = path.join(this.logDir, 'tool-errors.log');
    
    // 로깅 설정
    this.enableConsoleLog = process.env.NODE_ENV === 'development';
    this.enableFileLog = true;
    
    // 로그 큐 (배치 처리용)
    this.logQueue = [];
    this.isProcessing = false;
    
    // 초기화
    this.initializeLogger();
  }

  /**
   * 로거 초기화 - 로그 디렉토리 생성
   */
  async initializeLogger() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      console.log('📝 Tool Logger 초기화 완료:', this.logDir);
    } catch (error) {
      console.error('❌ Tool Logger 초기화 실패:', error);
    }
  }

  /**
   * 로그 엔트리 생성
   */
  createLogEntry(req, startTime) {
    return {
      // 기본 정보
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      
      // 요청 정보
      toolName: req.body?.tool,
      parameters: req.body?.parameters,
      
      // 사용자 정보
      userId: req.user?.id || 'anonymous',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      
      // 구독 정보 (향후 구독 시스템에서 설정)
      subscriptionStatus: req.subscriptionCheck?.status || 'unknown',
      subscriptionTier: req.subscriptionCheck?.tier || 'free',
      
      // 성능 정보
      startTime: startTime,
      
      // 요청 메타데이터
      method: req.method,
      url: req.url,
      headers: {
        authorization: req.get('Authorization') ? '[HIDDEN]' : undefined,
        'content-type': req.get('Content-Type')
      }
    };
  }

  /**
   * 응답 정보 추가
   */
  completeLogEntry(logEntry, res, responseData = null) {
    const endTime = Date.now();
    
    return {
      ...logEntry,
      
      // 응답 정보
      statusCode: res.statusCode,
      responseTime: endTime - logEntry.startTime,
      
      // 실행 결과
      success: res.statusCode >= 200 && res.statusCode < 300,
      errorMessage: res.statusCode >= 400 ? responseData?.error : undefined,
      
      // 완료 시간
      endTime: new Date(endTime).toISOString(),
      
      // 성능 등급
      performanceGrade: this.getPerformanceGrade(endTime - logEntry.startTime)
    };
  }

  /**
   * 성능 등급 계산
   */
  getPerformanceGrade(responseTime) {
    if (responseTime < 100) return 'excellent';
    if (responseTime < 500) return 'good';
    if (responseTime < 1000) return 'fair';
    if (responseTime < 3000) return 'slow';
    return 'very_slow';
  }

  /**
   * 로그 저장 (비동기 배치 처리)
   */
  async saveLog(logEntry) {
    // 큐에 추가
    this.logQueue.push(logEntry);
    
    // 배치 처리 시작
    if (!this.isProcessing) {
      this.processLogQueue();
    }
  }

  /**
   * 로그 큐 배치 처리
   */
  async processLogQueue() {
    if (this.isProcessing || this.logQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      const logsToProcess = [...this.logQueue];
      this.logQueue = [];
      
      // 콘솔 로깅
      if (this.enableConsoleLog) {
        logsToProcess.forEach(log => {
          const performance = `${log.responseTime}ms (${log.performanceGrade})`;
          const status = log.success ? '✅' : '❌';
          
          console.log(
            `${status} [TOOL] ${log.toolName} | ${log.userId} | ${performance} | ${log.statusCode}`
          );
        });
      }
      
      // 파일 로깅
      if (this.enableFileLog) {
        const successLogs = logsToProcess.filter(log => log.success);
        const errorLogs = logsToProcess.filter(log => !log.success);
        
        // 성공 로그
        if (successLogs.length > 0) {
          const logLines = successLogs.map(log => JSON.stringify(log)).join('\n') + '\n';
          await fs.appendFile(this.toolLogFile, logLines);
        }
        
        // 에러 로그
        if (errorLogs.length > 0) {
          const errorLines = errorLogs.map(log => JSON.stringify(log)).join('\n') + '\n';
          await fs.appendFile(this.errorLogFile, errorLines);
        }
      }
      
    } catch (error) {
      console.error('❌ 로그 저장 실패:', error);
    } finally {
      this.isProcessing = false;
      
      // 대기 중인 로그가 있으면 다시 처리
      if (this.logQueue.length > 0) {
        setTimeout(() => this.processLogQueue(), 100);
      }
    }
  }

  /**
   * 사용량 통계 생성 (향후 구독 시스템용)
   */
  generateUsageStats(logEntry) {
    return {
      userId: logEntry.userId,
      toolName: logEntry.toolName,
      timestamp: logEntry.timestamp,
      responseTime: logEntry.responseTime,
      success: logEntry.success,
      subscriptionTier: logEntry.subscriptionTier
    };
  }
}

// 싱글톤 인스턴스
const toolLoggerInstance = new ToolLogger();

/**
 * Express 미들웨어 함수
 */
export const toolLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // 로그 엔트리 생성
    const logEntry = toolLoggerInstance.createLogEntry(req, startTime);
    
    // 요청에 로그 정보 첨부
    req.toolLogEntry = logEntry;
    
    // 응답 완료 시 로깅
    const originalSend = res.send;
    res.send = function(data) {
      // 로그 완성 및 저장
      const completedLogEntry = toolLoggerInstance.completeLogEntry(
        logEntry, 
        res, 
        typeof data === 'string' ? JSON.parse(data) : data
      );
      
      // 비동기 로그 저장
      toolLoggerInstance.saveLog(completedLogEntry);
      
      // 원본 send 호출
      return originalSend.call(this, data);
    };
    
    next();
    
  } catch (error) {
    console.error('❌ Tool Logger 미들웨어 에러:', error);
    next(); // 에러가 있어도 요청은 계속 진행
  }
};

/**
 * 로그 조회 유틸리티 (향후 관리자 페이지용)
 */
export const getToolLogs = async (filters = {}) => {
  try {
    const logData = await fs.readFile(toolLoggerInstance.toolLogFile, 'utf-8');
    const logs = logData.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    // 필터링 적용
    let filteredLogs = logs;
    
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }
    
    if (filters.toolName) {
      filteredLogs = filteredLogs.filter(log => log.toolName === filters.toolName);
    }
    
    if (filters.dateFrom) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(filters.dateFrom)
      );
    }
    
    return filteredLogs;
    
  } catch (error) {
    console.error('❌ 로그 조회 실패:', error);
    return [];
  }
};

export default toolLogger;