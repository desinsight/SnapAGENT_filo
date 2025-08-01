/**
 * 🔒 백엔드 전용 보안 패턴 분석기
 * API 보안 위험 패턴, 이상 행동 탐지, 보안 이벤트 분석
 */

export class SecurityPatternAnalyzer {
  constructor() {
    // 보안 위험 패턴 데이터
    this.securityPatterns = new Map();
    
    // 이상 행동 탐지
    this.anomalyPatterns = new Map();
    
    // 보안 이벤트 로그
    this.securityEvents = [];
    
    // IP별 접근 패턴
    this.ipAccessPatterns = new Map();
    
    // 사용자별 보안 점수
    this.userSecurityScores = new Map();
    
    // 보안 설정
    this.config = {
      maxEvents: 1000,
      anomalyThreshold: 3,
      securityScoreThreshold: 0.7,
      rateLimitThreshold: 100, // 분당
      suspiciousPatterns: [
        'sql_injection',
        'xss_attempt',
        'path_traversal',
        'authentication_bypass',
        'rate_limit_exceeded'
      ]
    };
  }

  /**
   * 보안 이벤트 분석
   */
  analyzeSecurityEvent(event) {
    try {
      const {
        userId,
        ip,
        endpoint,
        method,
        userAgent,
        requestBody,
        responseCode,
        timestamp = Date.now()
      } = event;

      // 1. 기본 보안 패턴 분석
      this.analyzeBasicSecurityPattern(event);
      
      // 2. 이상 행동 탐지
      this.detectAnomaly(userId, ip, endpoint, method, timestamp);
      
      // 3. IP별 접근 패턴 분석
      this.analyzeIPAccessPattern(ip, endpoint, method, timestamp, userAgent);
      
      // 4. 사용자 보안 점수 업데이트
      this.updateUserSecurityScore(userId, event);
      
      // 5. 보안 이벤트 로그 저장
      this.logSecurityEvent(event);
      
      console.log(`🔒 보안 패턴 분석 완료: ${endpoint} (${ip})`);
      
    } catch (error) {
      console.error('❌ 보안 패턴 분석 실패:', error);
    }
  }

  /**
   * 기본 보안 패턴 분석
   */
  analyzeBasicSecurityPattern(event) {
    const {
      endpoint,
      method,
      requestBody,
      userAgent,
      responseCode
    } = event;

    const pattern = this.securityPatterns.get(endpoint) || {
      totalRequests: 0,
      failedRequests: 0,
      suspiciousRequests: 0,
      uniqueIPs: new Set(),
      userAgents: new Set(),
      responseCodes: new Map(),
      lastIncident: null
    };

    pattern.totalRequests++;
    pattern.uniqueIPs.add(event.ip);
    pattern.userAgents.add(userAgent);

    // 응답 코드 분류
    pattern.responseCodes.set(responseCode, (pattern.responseCodes.get(responseCode) || 0) + 1);

    // 실패 요청 카운트
    if (responseCode >= 400) {
      pattern.failedRequests++;
    }

    // 의심스러운 요청 탐지
    if (this.isSuspiciousRequest(event)) {
      pattern.suspiciousRequests++;
      pattern.lastIncident = {
        timestamp: event.timestamp,
        type: this.classifySuspiciousActivity(event),
        details: event
      };
    }

    this.securityPatterns.set(endpoint, pattern);
  }

  /**
   * 이상 행동 탐지
   */
  detectAnomaly(userId, ip, endpoint, method, timestamp) {
    const userKey = userId || 'anonymous';
    const anomaly = this.anomalyPatterns.get(userKey) || {
      requestCount: 0,
      uniqueEndpoints: new Set(),
      requestTimes: [],
      suspiciousActivities: [],
      lastActivity: 0
    };

    anomaly.requestCount++;
    anomaly.uniqueEndpoints.add(endpoint);
    anomaly.requestTimes.push(timestamp);
    anomaly.lastActivity = timestamp;

    // 최근 1시간 내 요청만 유지
    const oneHourAgo = timestamp - (60 * 60 * 1000);
    anomaly.requestTimes = anomaly.requestTimes.filter(time => time > oneHourAgo);

    // 이상 행동 탐지 로직
    const anomalies = this.checkForAnomalies(anomaly, { timestamp, endpoint, method, ip });
    
    if (anomalies.length > 0) {
      anomaly.suspiciousActivities.push({
        timestamp,
        anomalies,
        endpoint,
        method,
        ip
      });
    }

    this.anomalyPatterns.set(userKey, anomaly);
  }

  /**
   * IP별 접근 패턴 분석
   */
  analyzeIPAccessPattern(ip, endpoint, method, timestamp, userAgent) {
    const pattern = this.ipAccessPatterns.get(ip) || {
      totalRequests: 0,
      uniqueEndpoints: new Set(),
      requestTimes: [],
      userAgents: new Set(),
      lastActivity: 0,
      riskScore: 0
    };

    pattern.totalRequests++;
    pattern.uniqueEndpoints.add(endpoint);
    pattern.requestTimes.push(timestamp);
    pattern.userAgents.add(userAgent);
    pattern.lastActivity = timestamp;

    // 최근 1시간 내 요청만 유지
    const oneHourAgo = timestamp - (60 * 60 * 1000);
    pattern.requestTimes = pattern.requestTimes.filter(time => time > oneHourAgo);

    // 위험 점수 계산
    pattern.riskScore = this.calculateIPRiskScore(pattern);

    this.ipAccessPatterns.set(ip, pattern);
  }

  /**
   * 사용자 보안 점수 업데이트
   */
  updateUserSecurityScore(userId, event) {
    if (!userId) return;

    const score = this.userSecurityScores.get(userId) || {
      currentScore: 100,
      history: [],
      violations: [],
      lastUpdate: 0
    };

    // 기본 점수 감점
    let deduction = 0;

    // 의심스러운 활동에 따른 감점
    if (this.isSuspiciousRequest(event)) {
      deduction += 10;
      score.violations.push({
        timestamp: event.timestamp,
        type: this.classifySuspiciousActivity(event),
        endpoint: event.endpoint
      });
    }

    // 실패한 요청에 따른 감점
    if (event.responseCode >= 400) {
      deduction += 5;
    }

    // 점수 업데이트
    score.currentScore = Math.max(0, score.currentScore - deduction);
    score.history.push({
      timestamp: event.timestamp,
      score: score.currentScore,
      reason: deduction > 0 ? '보안 위반' : '정상 활동'
    });

    // 최근 100개 기록만 유지
    if (score.history.length > 100) {
      score.history.shift();
    }

    score.lastUpdate = event.timestamp;
    this.userSecurityScores.set(userId, score);
  }

  /**
   * 보안 이벤트 로그 저장
   */
  logSecurityEvent(event) {
    this.securityEvents.push({
      ...event,
      analyzed: true,
      riskLevel: this.calculateRiskLevel(event)
    });

    // 최대 이벤트 수 제한
    if (this.securityEvents.length > this.config.maxEvents) {
      this.securityEvents.shift();
    }
  }

  /**
   * 의심스러운 요청 탐지
   */
  isSuspiciousRequest(event) {
    const { requestBody, userAgent, endpoint, method } = event;

    // SQL 인젝션 패턴
    if (this.detectSQLInjection(requestBody)) {
      return true;
    }

    // XSS 패턴
    if (this.detectXSS(requestBody)) {
      return true;
    }

    // 경로 순회 공격
    if (this.detectPathTraversal(endpoint)) {
      return true;
    }

    // 비정상적인 User-Agent
    if (this.isSuspiciousUserAgent(userAgent)) {
      return true;
    }

    // 비정상적인 HTTP 메서드
    if (this.isSuspiciousMethod(method, endpoint)) {
      return true;
    }

    return false;
  }

  /**
   * SQL 인젝션 탐지
   */
  detectSQLInjection(requestBody) {
    if (!requestBody) return false;

    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
      /(\b(or|and)\b\s+\d+\s*=\s*\d+)/i,
      /(\b(union|select)\b.*\bfrom\b)/i,
      /(\b(union|select)\b.*\bwhere\b)/i,
      /(\b(union|select)\b.*\bgroup\b)/i,
      /(\b(union|select)\b.*\border\b)/i
    ];

    const bodyStr = JSON.stringify(requestBody).toLowerCase();
    return sqlPatterns.some(pattern => pattern.test(bodyStr));
  }

  /**
   * XSS 탐지
   */
  detectXSS(requestBody) {
    if (!requestBody) return false;

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b/gi,
      /<object\b/gi,
      /<embed\b/gi
    ];

    const bodyStr = JSON.stringify(requestBody);
    return xssPatterns.some(pattern => pattern.test(bodyStr));
  }

  /**
   * 경로 순회 공격 탐지
   */
  detectPathTraversal(endpoint) {
    const traversalPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e%2f/,
      /%2e%2e%5c/,
      /\.\.%2f/,
      /\.\.%5c/
    ];

    return traversalPatterns.some(pattern => pattern.test(endpoint));
  }

  /**
   * 의심스러운 User-Agent 탐지
   */
  isSuspiciousUserAgent(userAgent) {
    if (!userAgent) return true;

    const suspiciousPatterns = [
      /sqlmap/i,
      /nmap/i,
      /nikto/i,
      /dirbuster/i,
      /gobuster/i,
      /wfuzz/i,
      /burp/i,
      /zap/i,
      /curl/i,
      /wget/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * 의심스러운 HTTP 메서드 탐지
   */
  isSuspiciousMethod(method, endpoint) {
    // 일반적으로 사용되지 않는 메서드
    const suspiciousMethods = ['PUT', 'DELETE', 'PATCH', 'OPTIONS', 'TRACE'];
    
    // 관리자 엔드포인트에 대한 비정상 접근
    const adminEndpoints = ['/admin', '/api/admin', '/management'];
    
    return suspiciousMethods.includes(method) || 
           (adminEndpoints.some(admin => endpoint.includes(admin)) && method !== 'GET');
  }

  /**
   * 이상 행동 체크
   */
  checkForAnomalies(anomaly, event) {
    const anomalies = [];

    // 1. 요청 빈도 이상
    if (anomaly.requestTimes.length > this.config.rateLimitThreshold) {
      anomalies.push('rate_limit_exceeded');
    }

    // 2. 다양한 엔드포인트 접근
    if (anomaly.uniqueEndpoints.size > 20) {
      anomalies.push('excessive_endpoint_access');
    }

    // 3. 짧은 시간 내 반복 요청
    const recentRequests = anomaly.requestTimes.filter(
      time => event.timestamp - time < 60000 // 1분 내
    );
    if (recentRequests.length > 10) {
      anomalies.push('rapid_request_pattern');
    }

    return anomalies;
  }

  /**
   * IP 위험 점수 계산
   */
  calculateIPRiskScore(pattern) {
    let score = 0;

    // 요청 빈도
    if (pattern.totalRequests > 100) score += 20;
    if (pattern.totalRequests > 500) score += 30;

    // 다양한 엔드포인트 접근
    if (pattern.uniqueEndpoints.size > 10) score += 15;
    if (pattern.uniqueEndpoints.size > 30) score += 25;

    // 다양한 User-Agent
    if (pattern.userAgents.size > 5) score += 20;

    return Math.min(100, score);
  }

  /**
   * 위험 수준 계산
   */
  calculateRiskLevel(event) {
    let riskLevel = 'low';

    if (this.isSuspiciousRequest(event)) {
      riskLevel = 'high';
    } else if (event.responseCode >= 400) {
      riskLevel = 'medium';
    }

    return riskLevel;
  }

  /**
   * 의심스러운 활동 분류
   */
  classifySuspiciousActivity(event) {
    if (this.detectSQLInjection(event.requestBody)) return 'sql_injection';
    if (this.detectXSS(event.requestBody)) return 'xss_attempt';
    if (this.detectPathTraversal(event.endpoint)) return 'path_traversal';
    if (this.isSuspiciousUserAgent(event.userAgent)) return 'suspicious_user_agent';
    if (this.isSuspiciousMethod(event.method, event.endpoint)) return 'suspicious_method';
    
    return 'unknown_suspicious_activity';
  }

  /**
   * 보안 분석 결과 조회
   */
  getSecurityAnalysis() {
    return {
      securityPatterns: this.getSecurityPatternAnalysis(),
      anomalyPatterns: this.getAnomalyAnalysis(),
      ipAnalysis: this.getIPAnalysis(),
      userSecurityScores: this.getUserSecurityAnalysis(),
      recentSecurityEvents: this.getRecentSecurityEvents()
    };
  }

  /**
   * 보안 패턴 분석 결과
   */
  getSecurityPatternAnalysis() {
    const analysis = [];
    
    for (const [endpoint, pattern] of this.securityPatterns) {
      analysis.push({
        endpoint,
        totalRequests: pattern.totalRequests,
        failedRequests: pattern.failedRequests,
        suspiciousRequests: pattern.suspiciousRequests,
        uniqueIPs: pattern.uniqueIPs.size,
        failureRate: ((pattern.failedRequests / pattern.totalRequests) * 100).toFixed(2) + '%',
        suspiciousRate: ((pattern.suspiciousRequests / pattern.totalRequests) * 100).toFixed(2) + '%',
        lastIncident: pattern.lastIncident ? {
          timestamp: new Date(pattern.lastIncident.timestamp).toLocaleString(),
          type: pattern.lastIncident.type
        } : null
      });
    }

    return analysis.sort((a, b) => b.suspiciousRequests - a.suspiciousRequests);
  }

  /**
   * 이상 행동 분석 결과
   */
  getAnomalyAnalysis() {
    const analysis = [];
    
    for (const [userKey, anomaly] of this.anomalyPatterns) {
      analysis.push({
        user: userKey,
        requestCount: anomaly.requestCount,
        uniqueEndpoints: anomaly.uniqueEndpoints.size,
        suspiciousActivities: anomaly.suspiciousActivities.length,
        lastActivity: new Date(anomaly.lastActivity).toLocaleString(),
        riskLevel: this.calculateAnomalyRiskLevel(anomaly)
      });
    }

    return analysis.sort((a, b) => b.suspiciousActivities - a.suspiciousActivities);
  }

  /**
   * IP 분석 결과
   */
  getIPAnalysis() {
    const analysis = [];
    
    for (const [ip, pattern] of this.ipAccessPatterns) {
      analysis.push({
        ip,
        totalRequests: pattern.totalRequests,
        uniqueEndpoints: pattern.uniqueEndpoints.size,
        riskScore: pattern.riskScore,
        lastActivity: new Date(pattern.lastActivity).toLocaleString(),
        riskLevel: this.calculateIPRiskLevel(pattern.riskScore)
      });
    }

    return analysis.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * 사용자 보안 점수 분석
   */
  getUserSecurityAnalysis() {
    const analysis = [];
    
    for (const [userId, score] of this.userSecurityScores) {
      analysis.push({
        userId,
        currentScore: score.currentScore,
        violations: score.violations.length,
        lastUpdate: new Date(score.lastUpdate).toLocaleString(),
        riskLevel: this.calculateUserRiskLevel(score.currentScore)
      });
    }

    return analysis.sort((a, b) => a.currentScore - b.currentScore);
  }

  /**
   * 최근 보안 이벤트 조회
   */
  getRecentSecurityEvents() {
    return this.securityEvents
      .slice(-20) // 최근 20개
      .map(event => ({
        timestamp: new Date(event.timestamp).toLocaleString(),
        endpoint: event.endpoint,
        ip: event.ip,
        riskLevel: event.riskLevel,
        responseCode: event.responseCode
      }));
  }

  /**
   * 유틸리티 메서드들
   */
  calculateAnomalyRiskLevel(anomaly) {
    if (anomaly.suspiciousActivities.length > 5) return 'high';
    if (anomaly.suspiciousActivities.length > 2) return 'medium';
    return 'low';
  }

  calculateIPRiskLevel(riskScore) {
    if (riskScore > 70) return 'high';
    if (riskScore > 40) return 'medium';
    return 'low';
  }

  calculateUserRiskLevel(securityScore) {
    if (securityScore < 30) return 'high';
    if (securityScore < 70) return 'medium';
    return 'low';
  }

  /**
   * 메모리 정리
   */
  cleanup() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // 오래된 보안 이벤트 정리
    this.securityEvents = this.securityEvents.filter(
      event => event.timestamp > oneDayAgo
    );
    
    // 오래된 이상 행동 패턴 정리
    for (const [userKey, anomaly] of this.anomalyPatterns) {
      if (anomaly.lastActivity < oneDayAgo) {
        this.anomalyPatterns.delete(userKey);
      }
    }
    
    // 오래된 IP 패턴 정리
    for (const [ip, pattern] of this.ipAccessPatterns) {
      if (pattern.lastActivity < oneDayAgo) {
        this.ipAccessPatterns.delete(ip);
      }
    }
  }
} 