/**
 * 🚀 백엔드 전용 API 호출 패턴 학습기
 * API 엔드포인트별 사용 패턴, 성능 패턴, 사용자별 패턴을 학습
 */

export class APICallPatternLearner {
  constructor() {
    // 엔드포인트별 패턴 데이터
    this.endpointPatterns = new Map();
    
    // 사용자별 API 패턴
    this.userAPIPatterns = new Map();
    
    // 성능 패턴 분석
    this.performancePatterns = new Map();
    
    // 시간대별 사용 패턴
    this.timePatterns = new Map();
    
    // 파라미터 패턴 분석
    this.parameterPatterns = new Map();
    
    // 학습 설정
    this.config = {
      maxPatternsPerEndpoint: 100,
      maxUserPatterns: 50,
      performanceThreshold: 1000, // 1초
      memoryThreshold: 0.8, // 80%
      learningRate: 0.1
    };
  }

  /**
   * API 호출 패턴 학습
   */
  learnAPICall(userId, endpoint, method, params, responseTime, statusCode, timestamp = Date.now()) {
    try {
      // 1. 엔드포인트별 패턴 학습
      this.learnEndpointPattern(endpoint, method, responseTime, statusCode, timestamp);
      
      // 2. 사용자별 패턴 학습
      this.learnUserPattern(userId, endpoint, method, params, responseTime, statusCode, timestamp);
      
      // 3. 성능 패턴 학습
      this.learnPerformancePattern(endpoint, method, responseTime, statusCode, timestamp);
      
      // 4. 시간대별 패턴 학습
      this.learnTimePattern(endpoint, timestamp);
      
      // 5. 파라미터 패턴 학습
      this.learnParameterPattern(endpoint, method, params, responseTime, statusCode);
      
      console.log(`📊 API 패턴 학습 완료: ${endpoint} (${responseTime}ms)`);
      
    } catch (error) {
      console.error('❌ API 패턴 학습 실패:', error);
    }
  }

  /**
   * 엔드포인트별 패턴 학습
   */
  learnEndpointPattern(endpoint, method, responseTime, statusCode, timestamp) {
    const key = `${endpoint}:${method}`;
    const pattern = this.endpointPatterns.get(key) || {
      totalCalls: 0,
      successCalls: 0,
      errorCalls: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimeHistory: [],
      errorRate: 0,
      lastUsed: 0,
      peakUsageTimes: new Map(),
      commonParams: new Map()
    };

    // 기본 통계 업데이트
    pattern.totalCalls++;
    pattern.lastUsed = timestamp;
    
    if (statusCode < 400) {
      pattern.successCalls++;
    } else {
      pattern.errorCalls++;
    }

    // 응답 시간 통계 업데이트
    pattern.responseTimeHistory.push(responseTime);
    if (pattern.responseTimeHistory.length > 100) {
      pattern.responseTimeHistory.shift(); // 최근 100개만 유지
    }
    
    pattern.avgResponseTime = pattern.responseTimeHistory.reduce((a, b) => a + b, 0) / pattern.responseTimeHistory.length;
    pattern.minResponseTime = Math.min(pattern.minResponseTime, responseTime);
    pattern.maxResponseTime = Math.max(pattern.maxResponseTime, responseTime);
    
    // 에러율 계산
    pattern.errorRate = pattern.errorCalls / pattern.totalCalls;

    // 시간대별 사용 패턴
    const hour = new Date(timestamp).getHours();
    pattern.peakUsageTimes.set(hour, (pattern.peakUsageTimes.get(hour) || 0) + 1);

    this.endpointPatterns.set(key, pattern);
  }

  /**
   * 사용자별 패턴 학습
   */
  learnUserPattern(userId, endpoint, method, params, responseTime, statusCode, timestamp) {
    const userPattern = this.userAPIPatterns.get(userId) || {
      favoriteEndpoints: new Map(),
      usageTimes: new Map(),
      errorProneActions: new Map(),
      avgResponseTime: 0,
      totalCalls: 0,
      lastActivity: 0
    };

    // 사용자 활동 업데이트
    userPattern.totalCalls++;
    userPattern.lastActivity = timestamp;

    // 선호 엔드포인트 학습
    const endpointKey = `${endpoint}:${method}`;
    userPattern.favoriteEndpoints.set(endpointKey, 
      (userPattern.favoriteEndpoints.get(endpointKey) || 0) + 1
    );

    // 사용 시간 패턴
    const hour = new Date(timestamp).getHours();
    userPattern.usageTimes.set(hour, (userPattern.usageTimes.get(hour) || 0) + 1);

    // 에러 발생 패턴
    if (statusCode >= 400) {
      userPattern.errorProneActions.set(endpointKey, 
        (userPattern.errorProneActions.get(endpointKey) || 0) + 1
      );
    }

    // 평균 응답 시간 업데이트
    userPattern.avgResponseTime = 
      (userPattern.avgResponseTime * (userPattern.totalCalls - 1) + responseTime) / userPattern.totalCalls;

    // 최대 개수 제한
    if (userPattern.favoriteEndpoints.size > this.config.maxUserPatterns) {
      const sorted = Array.from(userPattern.favoriteEndpoints.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, this.config.maxUserPatterns);
      userPattern.favoriteEndpoints = new Map(sorted);
    }

    this.userAPIPatterns.set(userId, userPattern);
  }

  /**
   * 성능 패턴 학습
   */
  learnPerformancePattern(endpoint, method, responseTime, statusCode, timestamp) {
    const key = `${endpoint}:${method}`;
    const pattern = this.performancePatterns.get(key) || {
      slowCalls: 0,
      fastCalls: 0,
      performanceTrend: [],
      bottlenecks: new Map(),
      optimizationSuggestions: []
    };

    // 성능 분류
    if (responseTime > this.config.performanceThreshold) {
      pattern.slowCalls++;
    } else {
      pattern.fastCalls++;
    }

    // 성능 트렌드 업데이트
    pattern.performanceTrend.push({
      responseTime,
      timestamp,
      statusCode
    });

    if (pattern.performanceTrend.length > 50) {
      pattern.performanceTrend.shift();
    }

    // 병목 지점 분석
    if (responseTime > this.config.performanceThreshold) {
      const bottleneck = {
        responseTime,
        timestamp,
        frequency: 1
      };
      
      const existingBottleneck = pattern.bottlenecks.get(timestamp);
      if (existingBottleneck) {
        existingBottleneck.frequency++;
        existingBottleneck.responseTime = Math.max(existingBottleneck.responseTime, responseTime);
      } else {
        pattern.bottlenecks.set(timestamp, bottleneck);
      }
    }

    this.performancePatterns.set(key, pattern);
  }

  /**
   * 시간대별 패턴 학습
   */
  learnTimePattern(endpoint, timestamp) {
    const hour = new Date(timestamp).getHours();
    const timePattern = this.timePatterns.get(hour) || {
      totalCalls: 0,
      endpoints: new Map(),
      avgResponseTime: 0,
      peakHours: []
    };

    timePattern.totalCalls++;
    timePattern.endpoints.set(endpoint, (timePattern.endpoints.get(endpoint) || 0) + 1);

    this.timePatterns.set(hour, timePattern);
  }

  /**
   * 파라미터 패턴 학습
   */
  learnParameterPattern(endpoint, method, params, responseTime, statusCode) {
    const key = `${endpoint}:${method}`;
    const pattern = this.parameterPatterns.get(key) || {
      commonParams: new Map(),
      paramSizePatterns: new Map(),
      errorParams: new Map()
    };

    // 파라미터 크기 분석
    const paramSize = JSON.stringify(params).length;
    const sizeCategory = this.categorizeParamSize(paramSize);
    pattern.paramSizePatterns.set(sizeCategory, (pattern.paramSizePatterns.get(sizeCategory) || 0) + 1);

    // 에러와 관련된 파라미터 분석
    if (statusCode >= 400) {
      Object.keys(params).forEach(paramKey => {
        pattern.errorParams.set(paramKey, (pattern.errorParams.get(paramKey) || 0) + 1);
      });
    }

    this.parameterPatterns.set(key, pattern);
  }

  /**
   * 파라미터 크기 분류
   */
  categorizeParamSize(size) {
    if (size < 100) return 'small';
    if (size < 1000) return 'medium';
    if (size < 10000) return 'large';
    return 'very_large';
  }

  /**
   * 패턴 분석 결과 조회
   */
  getPatternAnalysis() {
    return {
      endpointPatterns: this.getEndpointAnalysis(),
      userPatterns: this.getUserAnalysis(),
      performancePatterns: this.getPerformanceAnalysis(),
      timePatterns: this.getTimeAnalysis(),
      parameterPatterns: this.getParameterAnalysis()
    };
  }

  /**
   * 엔드포인트 분석 결과
   */
  getEndpointAnalysis() {
    const analysis = [];
    
    for (const [key, pattern] of this.endpointPatterns) {
      analysis.push({
        endpoint: key,
        totalCalls: pattern.totalCalls,
        successRate: ((pattern.successCalls / pattern.totalCalls) * 100).toFixed(2) + '%',
        avgResponseTime: pattern.avgResponseTime.toFixed(2) + 'ms',
        errorRate: (pattern.errorRate * 100).toFixed(2) + '%',
        peakHour: this.getPeakHour(pattern.peakUsageTimes),
        lastUsed: new Date(pattern.lastUsed).toLocaleString()
      });
    }

    return analysis.sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * 사용자 분석 결과
   */
  getUserAnalysis() {
    const analysis = [];
    
    for (const [userId, pattern] of this.userAPIPatterns) {
      analysis.push({
        userId,
        totalCalls: pattern.totalCalls,
        avgResponseTime: pattern.avgResponseTime.toFixed(2) + 'ms',
        favoriteEndpoint: this.getTopEndpoint(pattern.favoriteEndpoints),
        peakHour: this.getPeakHour(pattern.usageTimes),
        errorRate: this.calculateUserErrorRate(pattern),
        lastActivity: new Date(pattern.lastActivity).toLocaleString()
      });
    }

    return analysis.sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * 성능 분석 결과
   */
  getPerformanceAnalysis() {
    const analysis = [];
    
    for (const [key, pattern] of this.performancePatterns) {
      analysis.push({
        endpoint: key,
        slowCalls: pattern.slowCalls,
        fastCalls: pattern.fastCalls,
        slowCallRate: ((pattern.slowCalls / (pattern.slowCalls + pattern.fastCalls)) * 100).toFixed(2) + '%',
        bottlenecks: pattern.bottlenecks.size,
        suggestions: this.generatePerformanceSuggestions(pattern)
      });
    }

    return analysis.sort((a, b) => b.slowCalls - a.slowCalls);
  }

  /**
   * 시간대 분석 결과
   */
  getTimeAnalysis() {
    const analysis = [];
    
    for (const [hour, pattern] of this.timePatterns) {
      analysis.push({
        hour: `${hour}:00`,
        totalCalls: pattern.totalCalls,
        topEndpoint: this.getTopEndpoint(pattern.endpoints),
        avgResponseTime: pattern.avgResponseTime.toFixed(2) + 'ms'
      });
    }

    return analysis.sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * 파라미터 분석 결과
   */
  getParameterAnalysis() {
    const analysis = [];
    
    for (const [key, pattern] of this.parameterPatterns) {
      analysis.push({
        endpoint: key,
        commonParamSizes: Object.fromEntries(pattern.paramSizePatterns),
        errorProneParams: Array.from(pattern.errorParams.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      });
    }

    return analysis;
  }

  /**
   * 유틸리티 메서드들
   */
  getPeakHour(timeMap) {
    if (timeMap.size === 0) return 'N/A';
    const maxEntry = Array.from(timeMap.entries()).reduce((a, b) => a[1] > b[1] ? a : b);
    return `${maxEntry[0]}:00 (${maxEntry[1]}회)`;
  }

  getTopEndpoint(endpointMap) {
    if (endpointMap.size === 0) return 'N/A';
    const maxEntry = Array.from(endpointMap.entries()).reduce((a, b) => a[1] > b[1] ? a : b);
    return `${maxEntry[0]} (${maxEntry[1]}회)`;
  }

  calculateUserErrorRate(pattern) {
    const totalErrors = Array.from(pattern.errorProneActions.values()).reduce((a, b) => a + b, 0);
    return totalErrors > 0 ? ((totalErrors / pattern.totalCalls) * 100).toFixed(2) + '%' : '0%';
  }

  generatePerformanceSuggestions(pattern) {
    const suggestions = [];
    
    if (pattern.slowCalls > pattern.fastCalls) {
      suggestions.push('캐싱 도입 고려');
    }
    
    if (pattern.bottlenecks.size > 5) {
      suggestions.push('성능 최적화 필요');
    }
    
    return suggestions.length > 0 ? suggestions : ['성능 상태 양호'];
  }

  /**
   * 메모리 정리
   */
  cleanup() {
    // 오래된 데이터 정리
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    for (const [key, pattern] of this.endpointPatterns) {
      if (pattern.lastUsed < oneDayAgo) {
        this.endpointPatterns.delete(key);
      }
    }
    
    for (const [userId, pattern] of this.userAPIPatterns) {
      if (pattern.lastActivity < oneDayAgo) {
        this.userAPIPatterns.delete(userId);
      }
    }
  }
} 