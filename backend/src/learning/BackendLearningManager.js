/**
 * 🧠 백엔드 학습 시스템 메인 매니저
 * 모든 백엔드 학습 컴포넌트를 통합 관리하고 조율
 */

import { APICallPatternLearner } from './APICallPatternLearner.js';
import { SecurityPatternAnalyzer } from './SecurityPatternAnalyzer.js';
import { ServerPerformanceOptimizer } from './ServerPerformanceOptimizer.js';

export class BackendLearningManager {
  constructor() {
    // 학습 컴포넌트들
    this.apiPatternLearner = new APICallPatternLearner();
    this.securityAnalyzer = new SecurityPatternAnalyzer();
    this.performanceOptimizer = new ServerPerformanceOptimizer();
    
    // 학습 설정
    this.config = {
      learningEnabled: true,
      autoCleanup: true,
      cleanupInterval: 24 * 60 * 60 * 1000, // 24시간
      maxLearningData: 10000,
      learningRate: 0.1
    };
    
    // 학습 통계
    this.learningStats = {
      totalEvents: 0,
      apiEvents: 0,
      securityEvents: 0,
      performanceEvents: 0,
      lastCleanup: Date.now(),
      learningStartTime: Date.now()
    };
    
    // 자동 정리 설정
    if (this.config.autoCleanup) {
      setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
    
    console.log('🧠 백엔드 학습 시스템 초기화 완료');
  }

  /**
   * API 호출 이벤트 학습
   */
  learnAPICall(userId, endpoint, method, params, responseTime, statusCode, timestamp = Date.now()) {
    try {
      if (!this.config.learningEnabled) return;

      // 1. API 패턴 학습
      this.apiPatternLearner.learnAPICall(
        userId, endpoint, method, params, responseTime, statusCode, timestamp
      );

      // 2. 보안 패턴 분석
      this.securityAnalyzer.analyzeSecurityEvent({
        userId,
        ip: this.getClientIP(), // 실제 구현에서는 req.ip 사용
        endpoint,
        method,
        userAgent: this.getUserAgent(), // 실제 구현에서는 req.headers['user-agent'] 사용
        requestBody: params,
        responseCode: statusCode,
        timestamp
      });

      // 3. 성능 메트릭 기록
      this.performanceOptimizer.recordAPIPerformance(
        endpoint, method, responseTime, statusCode, timestamp
      );

      // 통계 업데이트
      this.learningStats.totalEvents++;
      this.learningStats.apiEvents++;

      console.log(`📊 백엔드 학습 완료: ${endpoint} (${responseTime}ms)`);

    } catch (error) {
      console.error('❌ 백엔드 학습 실패:', error);
    }
  }

  /**
   * 보안 이벤트 학습
   */
  learnSecurityEvent(event) {
    try {
      if (!this.config.learningEnabled) return;

      this.securityAnalyzer.analyzeSecurityEvent(event);
      this.learningStats.securityEvents++;

    } catch (error) {
      console.error('❌ 보안 이벤트 학습 실패:', error);
    }
  }

  /**
   * 성능 이벤트 학습
   */
  learnPerformanceEvent(event) {
    try {
      if (!this.config.learningEnabled) return;

      // 성능 최적화기에 이벤트 전달
      if (event.type === 'api_performance') {
        this.performanceOptimizer.recordAPIPerformance(
          event.endpoint,
          event.method,
          event.responseTime,
          event.statusCode,
          event.timestamp
        );
      }

      this.learningStats.performanceEvents++;

    } catch (error) {
      console.error('❌ 성능 이벤트 학습 실패:', error);
    }
  }

  /**
   * 종합 학습 분석 결과 조회
   */
  getComprehensiveAnalysis() {
    try {
      return {
        learningStats: this.getLearningStats(),
        apiAnalysis: this.apiPatternLearner.getPatternAnalysis(),
        securityAnalysis: this.securityAnalyzer.getSecurityAnalysis(),
        performanceAnalysis: this.performanceOptimizer.getPerformanceAnalysis(),
        systemHealth: this.getSystemHealth(),
        recommendations: this.generateRecommendations()
      };
    } catch (error) {
      console.error('❌ 종합 분석 실패:', error);
      return { error: '분석 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 학습 통계 조회
   */
  getLearningStats() {
    const uptime = Date.now() - this.learningStats.learningStartTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    return {
      ...this.learningStats,
      uptime: `${hours}시간 ${minutes}분`,
      eventsPerHour: this.calculateEventsPerHour(),
      lastCleanup: new Date(this.learningStats.lastCleanup).toLocaleString(),
      learningStartTime: new Date(this.learningStats.learningStartTime).toLocaleString()
    };
  }

  /**
   * 시스템 건강도 분석
   */
  getSystemHealth() {
    const apiAnalysis = this.apiPatternLearner.getPatternAnalysis();
    const securityAnalysis = this.securityAnalyzer.getSecurityAnalysis();
    const performanceAnalysis = this.performanceOptimizer.getPerformanceAnalysis();

    // API 건강도
    const apiHealth = this.calculateAPIHealth(apiAnalysis);
    
    // 보안 건강도
    const securityHealth = this.calculateSecurityHealth(securityAnalysis);
    
    // 성능 건강도
    const performanceHealth = this.calculatePerformanceHealth(performanceAnalysis);

    // 종합 건강도
    const overallHealth = (apiHealth + securityHealth + performanceHealth) / 3;

    return {
      overall: this.getHealthLevel(overallHealth),
      api: this.getHealthLevel(apiHealth),
      security: this.getHealthLevel(securityHealth),
      performance: this.getHealthLevel(performanceHealth),
      scores: {
        overall: overallHealth.toFixed(2),
        api: apiHealth.toFixed(2),
        security: securityHealth.toFixed(2),
        performance: performanceHealth.toFixed(2)
      }
    };
  }

  /**
   * 종합 권장사항 생성
   */
  generateRecommendations() {
    const recommendations = [];

    // API 패턴 기반 권장사항
    const apiAnalysis = this.apiPatternLearner.getPatternAnalysis();
    if (apiAnalysis.endpointPatterns.length > 0) {
      const topEndpoint = apiAnalysis.endpointPatterns[0];
      if (parseFloat(topEndpoint.errorRate) > 10) {
        recommendations.push({
          type: 'api_error_rate',
          priority: 'high',
          title: 'API 에러율 개선 필요',
          description: `${topEndpoint.endpoint}의 에러율이 ${topEndpoint.errorRate}입니다.`,
          action: '에러 로깅 강화 및 예외 처리 개선'
        });
      }
    }

    // 보안 기반 권장사항
    const securityAnalysis = this.securityAnalyzer.getSecurityAnalysis();
    if (securityAnalysis.recentSecurityEvents.length > 0) {
      const highRiskEvents = securityAnalysis.recentSecurityEvents.filter(
        event => event.riskLevel === 'high'
      );
      
      if (highRiskEvents.length > 0) {
        recommendations.push({
          type: 'security_alert',
          priority: 'critical',
          title: '보안 위험 감지',
          description: `${highRiskEvents.length}개의 고위험 보안 이벤트가 발생했습니다.`,
          action: '보안 로그 검토 및 대응 조치'
        });
      }
    }

    // 성능 기반 권장사항
    const performanceAnalysis = this.performanceOptimizer.getPerformanceAnalysis();
    const optimizationSuggestions = performanceAnalysis.optimizationSuggestions;
    
    if (optimizationSuggestions.length > 0) {
      const criticalSuggestions = optimizationSuggestions.filter(
        suggestion => suggestion.priority === 'critical'
      );
      
      if (criticalSuggestions.length > 0) {
        recommendations.push({
          type: 'performance_critical',
          priority: 'critical',
          title: '성능 최적화 긴급 필요',
          description: `${criticalSuggestions.length}개의 긴급 성능 최적화가 필요합니다.`,
          action: '성능 병목 분석 및 즉시 최적화'
        });
      }
    }

    return recommendations.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));
  }

  /**
   * 특정 사용자 분석
   */
  getUserAnalysis(userId) {
    try {
      const apiAnalysis = this.apiPatternLearner.getPatternAnalysis();
      const securityAnalysis = this.securityAnalyzer.getSecurityAnalysis();
      
      const userAPIPattern = apiAnalysis.userPatterns.find(
        user => user.userId === userId
      );
      
      const userSecurityScore = securityAnalysis.userSecurityScores.find(
        user => user.userId === userId
      );

      return {
        userId,
        apiPattern: userAPIPattern || null,
        securityScore: userSecurityScore || null,
        riskLevel: this.calculateUserRiskLevel(userAPIPattern, userSecurityScore),
        recommendations: this.generateUserRecommendations(userId, userAPIPattern, userSecurityScore)
      };
    } catch (error) {
      console.error('❌ 사용자 분석 실패:', error);
      return { error: '사용자 분석 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 특정 엔드포인트 분석
   */
  getEndpointAnalysis(endpoint, method) {
    try {
      const key = `${endpoint}:${method}`;
      
      const apiAnalysis = this.apiPatternLearner.getPatternAnalysis();
      const securityAnalysis = this.securityAnalyzer.getSecurityAnalysis();
      const performanceAnalysis = this.performanceOptimizer.getPerformanceAnalysis();
      
      const endpointPattern = apiAnalysis.endpointPatterns.find(
        ep => ep.endpoint === key
      );
      
      const securityPattern = securityAnalysis.securityPatterns.find(
        sp => sp.endpoint === key
      );
      
      const apiPerformance = performanceAnalysis.apiPerformance.find(
        ap => ap.endpoint === key
      );

      return {
        endpoint: key,
        apiPattern: endpointPattern || null,
        securityPattern: securityPattern || null,
        performance: apiPerformance || null,
        healthScore: this.calculateEndpointHealthScore(endpointPattern, securityPattern, apiPerformance),
        recommendations: this.generateEndpointRecommendations(key, endpointPattern, securityPattern, apiPerformance)
      };
    } catch (error) {
      console.error('❌ 엔드포인트 분석 실패:', error);
      return { error: '엔드포인트 분석 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 학습 시스템 설정 업데이트
   */
  updateConfig(newConfig) {
    try {
      this.config = { ...this.config, ...newConfig };
      console.log('⚙️ 백엔드 학습 설정 업데이트 완료');
      return { success: true, config: this.config };
    } catch (error) {
      console.error('❌ 설정 업데이트 실패:', error);
      return { error: '설정 업데이트 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 학습 데이터 내보내기
   */
  exportLearningData() {
    try {
      return {
        timestamp: Date.now(),
        config: this.config,
        learningStats: this.learningStats,
        apiPatterns: this.apiPatternLearner.getPatternAnalysis(),
        securityPatterns: this.securityAnalyzer.getSecurityAnalysis(),
        performanceMetrics: this.performanceOptimizer.getPerformanceAnalysis()
      };
    } catch (error) {
      console.error('❌ 학습 데이터 내보내기 실패:', error);
      return { error: '데이터 내보내기 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 학습 데이터 초기화
   */
  resetLearningData() {
    try {
      this.apiPatternLearner = new APICallPatternLearner();
      this.securityAnalyzer = new SecurityPatternAnalyzer();
      this.performanceOptimizer = new ServerPerformanceOptimizer();
      
      this.learningStats = {
        totalEvents: 0,
        apiEvents: 0,
        securityEvents: 0,
        performanceEvents: 0,
        lastCleanup: Date.now(),
        learningStartTime: Date.now()
      };
      
      console.log('🔄 백엔드 학습 데이터 초기화 완료');
      return { success: true, message: '학습 데이터가 초기화되었습니다.' };
    } catch (error) {
      console.error('❌ 학습 데이터 초기화 실패:', error);
      return { error: '데이터 초기화 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 메모리 정리
   */
  cleanup() {
    try {
      this.apiPatternLearner.cleanup();
      this.securityAnalyzer.cleanup();
      this.performanceOptimizer.cleanup();
      
      this.learningStats.lastCleanup = Date.now();
      console.log('🧹 백엔드 학습 데이터 정리 완료');
    } catch (error) {
      console.error('❌ 학습 데이터 정리 실패:', error);
    }
  }

  /**
   * 유틸리티 메서드들
   */
  calculateEventsPerHour() {
    const uptime = Date.now() - this.learningStats.learningStartTime;
    const hours = uptime / (1000 * 60 * 60);
    return hours > 0 ? (this.learningStats.totalEvents / hours).toFixed(2) : '0';
  }

  calculateAPIHealth(apiAnalysis) {
    if (apiAnalysis.endpointPatterns.length === 0) return 100;
    
    const avgErrorRate = apiAnalysis.endpointPatterns.reduce((sum, ep) => {
      return sum + parseFloat(ep.errorRate);
    }, 0) / apiAnalysis.endpointPatterns.length;
    
    return Math.max(0, 100 - avgErrorRate);
  }

  calculateSecurityHealth(securityAnalysis) {
    if (securityAnalysis.recentSecurityEvents.length === 0) return 100;
    
    const highRiskEvents = securityAnalysis.recentSecurityEvents.filter(
      event => event.riskLevel === 'high'
    ).length;
    
    const riskRatio = highRiskEvents / securityAnalysis.recentSecurityEvents.length;
    return Math.max(0, 100 - (riskRatio * 100));
  }

  calculatePerformanceHealth(performanceAnalysis) {
    const resourceUsage = performanceAnalysis.resourceUsage;
    
    const cpuHealth = Math.max(0, 100 - resourceUsage.cpu.average);
    const memoryHealth = Math.max(0, 100 - resourceUsage.memory.average);
    
    return (cpuHealth + memoryHealth) / 2;
  }

  getHealthLevel(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    if (score >= 20) return 'poor';
    return 'critical';
  }

  getPriorityScore(priority) {
    const scoreMap = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    return scoreMap[priority] || 0;
  }

  calculateUserRiskLevel(apiPattern, securityScore) {
    let riskScore = 0;
    
    if (apiPattern && parseFloat(apiPattern.errorRate) > 10) {
      riskScore += 30;
    }
    
    if (securityScore && securityScore.currentScore < 50) {
      riskScore += 40;
    }
    
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  generateUserRecommendations(userId, apiPattern, securityScore) {
    const recommendations = [];
    
    if (apiPattern && parseFloat(apiPattern.errorRate) > 10) {
      recommendations.push('API 사용 패턴 개선 필요');
    }
    
    if (securityScore && securityScore.currentScore < 50) {
      recommendations.push('보안 점수 개선 필요');
    }
    
    return recommendations;
  }

  calculateEndpointHealthScore(endpointPattern, securityPattern, apiPerformance) {
    let score = 100;
    
    if (endpointPattern && parseFloat(endpointPattern.errorRate) > 10) {
      score -= 30;
    }
    
    if (securityPattern && securityPattern.suspiciousRequests > 0) {
      score -= 25;
    }
    
    if (apiPerformance && parseFloat(apiPerformance.avgResponseTime) > 2000) {
      score -= 20;
    }
    
    return Math.max(0, score);
  }

  generateEndpointRecommendations(endpoint, endpointPattern, securityPattern, apiPerformance) {
    const recommendations = [];
    
    if (endpointPattern && parseFloat(endpointPattern.errorRate) > 10) {
      recommendations.push('에러 처리 개선');
    }
    
    if (securityPattern && securityPattern.suspiciousRequests > 0) {
      recommendations.push('보안 검증 강화');
    }
    
    if (apiPerformance && parseFloat(apiPerformance.avgResponseTime) > 2000) {
      recommendations.push('성능 최적화');
    }
    
    return recommendations;
  }

  // 임시 메서드들 (실제 구현에서는 req 객체에서 추출)
  getClientIP() {
    return '127.0.0.1'; // 임시 구현
  }

  getUserAgent() {
    return 'BackendLearningManager/1.0'; // 임시 구현
  }

  /**
   * 시간당 이벤트 수 계산
   */
  calculateEventsPerHour() {
    const uptime = Date.now() - this.learningStats.learningStartTime;
    const hours = uptime / (1000 * 60 * 60);
    return hours > 0 ? (this.learningStats.totalEvents / hours).toFixed(2) : '0';
  }
} 