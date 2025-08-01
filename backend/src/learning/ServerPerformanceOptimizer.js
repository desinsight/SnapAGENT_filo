/**
 * ⚡ 백엔드 전용 서버 성능 최적화기
 * 서버 리소스 모니터링, 성능 병목 탐지, 자동 최적화 제안
 */

import fs from 'fs';
import path from 'path';
import net from 'net';

export class ServerPerformanceOptimizer {
  constructor() {
    // 성능 메트릭 데이터
    this.performanceMetrics = new Map();
    
    // 리소스 사용량 추적
    this.resourceUsage = {
      cpu: [],
      memory: [],
      disk: [],
      network: []
    };
    
    // 성능 병목 지점
    this.bottlenecks = new Map();
    
    // 최적화 제안
    this.optimizationSuggestions = [];
    
    // 성능 알림
    this.performanceAlerts = [];
    
    // 성능 설정
    this.config = {
      cpuThreshold: 90, // 90% (더 현실적인 임계값)
      memoryThreshold: 90, // 90% (더 현실적인 임계값)
      diskThreshold: 95, // 95%
      responseTimeThreshold: 2000, // 2초
      alertInterval: 5 * 60 * 1000, // 5분
      maxMetricsHistory: 1000,
      optimizationCheckInterval: 10 * 60 * 1000 // 10분
    };
    
    // 성능 모니터링 시작
    this.startMonitoring();
  }

  /**
   * 성능 모니터링 시작
   */
  startMonitoring() {
    // CPU 사용량 모니터링
    setInterval(() => {
      this.monitorCPU();
    }, 5000); // 5초마다

    // 메모리 사용량 모니터링
    setInterval(() => {
      this.monitorMemory();
    }, 5000);

    // 디스크 사용량 모니터링
    setInterval(() => {
      this.monitorDisk();
    }, 30000); // 30초마다

    // 네트워크 사용량 모니터링
    setInterval(() => {
      this.monitorNetwork();
    }, 10000); // 10초마다

    // 성능 최적화 체크
    setInterval(() => {
      this.checkOptimizationOpportunities();
    }, this.config.optimizationCheckInterval);
  }

  /**
   * CPU 사용량 모니터링
   */
  monitorCPU() {
    try {
      const startUsage = process.cpuUsage();
      
      // 100ms 대기 후 CPU 사용량 재측정
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const elapsed = 100; // 100ms
        
        // 실제 CPU 사용률 계산 (백분율)
        const cpuPercent = ((endUsage.user + endUsage.system) / 1000) / elapsed * 100;
        
        this.resourceUsage.cpu.push({
          timestamp: Date.now(),
          usage: cpuPercent,
          user: (endUsage.user / 1000) / elapsed * 100,
          system: (endUsage.system / 1000) / elapsed * 100
        });

        // 최대 기록 수 제한
        if (this.resourceUsage.cpu.length > this.config.maxMetricsHistory) {
          this.resourceUsage.cpu.shift();
        }

        // CPU 사용량 알림 (실제 사용률 기준)
        if (cpuPercent > this.config.cpuThreshold) {
          this.createPerformanceAlert('cpu_high', `CPU 사용량이 높습니다 (${cpuPercent.toFixed(1)}%)`);
        }
      }, 100);

    } catch (error) {
      console.error('❌ CPU 모니터링 실패:', error);
    }
  }

  /**
   * 메모리 사용량 모니터링
   */
  monitorMemory() {
    try {
      const memUsage = process.memoryUsage();
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      this.resourceUsage.memory.push({
        timestamp: Date.now(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        usagePercent: memoryUsagePercent
      });

      // 최대 기록 수 제한
      if (this.resourceUsage.memory.length > this.config.maxMetricsHistory) {
        this.resourceUsage.memory.shift();
      }

      // 메모리 사용량 알림
      if (memoryUsagePercent > this.config.memoryThreshold) {
        this.createPerformanceAlert('memory_high', '메모리 사용량이 높습니다');
      }

    } catch (error) {
      console.error('❌ 메모리 모니터링 실패:', error);
    }
  }

  /**
   * 디스크 사용량 모니터링
   */
  monitorDisk() {
    try {
      // Node.js에서는 직접적인 디스크 사용량 측정이 어려우므로
      // 파일 시스템 작업을 통한 간접 측정
      
      // 임시 파일 생성으로 디스크 상태 확인
      const tempFile = path.join(process.cwd(), 'temp_performance_check');
      
      const startTime = Date.now();
      fs.writeFileSync(tempFile, 'performance_check');
      const writeTime = Date.now() - startTime;
      
      // 파일 읽기 성능 측정
      const readStartTime = Date.now();
      fs.readFileSync(tempFile);
      const readTime = Date.now() - readStartTime;
      
      // 임시 파일 삭제
      fs.unlinkSync(tempFile);
      
      this.resourceUsage.disk.push({
        timestamp: Date.now(),
        writeTime,
        readTime,
        diskHealth: this.calculateDiskHealth(writeTime, readTime)
      });

      // 최대 기록 수 제한
      if (this.resourceUsage.disk.length > this.config.maxMetricsHistory) {
        this.resourceUsage.disk.shift();
      }

    } catch (error) {
      console.error('❌ 디스크 모니터링 실패:', error);
    }
  }

  /**
   * 네트워크 사용량 모니터링
   */
  monitorNetwork() {
    try {
      // 네트워크 연결 상태 확인
      
      this.resourceUsage.network.push({
        timestamp: Date.now(),
        activeConnections: this.getActiveConnections(),
        networkLatency: this.measureNetworkLatency()
      });

      // 최대 기록 수 제한
      if (this.resourceUsage.network.length > this.config.maxMetricsHistory) {
        this.resourceUsage.network.shift();
      }

    } catch (error) {
      console.error('❌ 네트워크 모니터링 실패:', error);
    }
  }

  /**
   * API 성능 메트릭 기록
   */
  recordAPIPerformance(endpoint, method, responseTime, statusCode, timestamp = Date.now()) {
    const key = `${endpoint}:${method}`;
    const metric = this.performanceMetrics.get(key) || {
      totalRequests: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimeHistory: [],
      successCount: 0,
      errorCount: 0,
      lastRequest: 0
    };

    metric.totalRequests++;
    metric.lastRequest = timestamp;
    
    if (statusCode < 400) {
      metric.successCount++;
    } else {
      metric.errorCount++;
    }

    // 응답 시간 통계 업데이트
    metric.responseTimeHistory.push(responseTime);
    if (metric.responseTimeHistory.length > 100) {
      metric.responseTimeHistory.shift();
    }
    
    metric.avgResponseTime = metric.responseTimeHistory.reduce((a, b) => a + b, 0) / metric.responseTimeHistory.length;
    metric.minResponseTime = Math.min(metric.minResponseTime, responseTime);
    metric.maxResponseTime = Math.max(metric.maxResponseTime, responseTime);

    // 성능 병목 탐지
    if (responseTime > this.config.responseTimeThreshold) {
      this.detectBottleneck(endpoint, method, responseTime, timestamp);
    }

    this.performanceMetrics.set(key, metric);
  }

  /**
   * 성능 병목 탐지
   */
  detectBottleneck(endpoint, method, responseTime, timestamp) {
    const key = `${endpoint}:${method}`;
    const bottleneck = this.bottlenecks.get(key) || {
      occurrences: 0,
      avgResponseTime: 0,
      firstOccurrence: timestamp,
      lastOccurrence: timestamp,
      suggestions: []
    };

    bottleneck.occurrences++;
    bottleneck.lastOccurrence = timestamp;
    bottleneck.avgResponseTime = 
      (bottleneck.avgResponseTime * (bottleneck.occurrences - 1) + responseTime) / bottleneck.occurrences;

    // 병목 유형 분석 및 제안 생성
    bottleneck.suggestions = this.generateBottleneckSuggestions(endpoint, method, responseTime);

    this.bottlenecks.set(key, bottleneck);
  }

  /**
   * 성능 최적화 기회 체크
   */
  checkOptimizationOpportunities() {
    try {
      // 1. 리소스 사용량 기반 최적화 제안
      this.checkResourceBasedOptimizations();
      
      // 2. API 성능 기반 최적화 제안
      this.checkAPIBasedOptimizations();
      
      // 3. 메모리 누수 체크
      this.checkMemoryLeaks();
      
      // 4. 캐싱 최적화 제안
      this.checkCachingOptimizations();
      
      console.log('🔍 성능 최적화 기회 체크 완료');
      
    } catch (error) {
      console.error('❌ 성능 최적화 체크 실패:', error);
    }
  }

  /**
   * 리소스 기반 최적화 제안
   */
  checkResourceBasedOptimizations() {
    const avgCPU = this.getAverageCPUUsage();
    const avgMemory = this.getAverageMemoryUsage();
    const avgDiskHealth = this.getAverageDiskHealth();

    if (avgCPU > 70) {
      this.addOptimizationSuggestion({
        type: 'cpu_optimization',
        priority: 'high',
        title: 'CPU 사용량 최적화',
        description: 'CPU 사용량이 높습니다. 코드 최적화나 스케일링을 고려하세요.',
        suggestions: [
          '비동기 처리 도입',
          '불필요한 루프 최적화',
          '서버 스케일링 고려'
        ]
      });
    }

    if (avgMemory > 80) {
      this.addOptimizationSuggestion({
        type: 'memory_optimization',
        priority: 'high',
        title: '메모리 사용량 최적화',
        description: '메모리 사용량이 높습니다. 메모리 누수나 최적화가 필요합니다.',
        suggestions: [
          '메모리 누수 체크',
          '가비지 컬렉션 최적화',
          '메모리 사용량 모니터링 강화'
        ]
      });
    }

    if (avgDiskHealth < 0.7) {
      this.addOptimizationSuggestion({
        type: 'disk_optimization',
        priority: 'medium',
        title: '디스크 성능 최적화',
        description: '디스크 성능이 저하되었습니다.',
        suggestions: [
          'SSD 사용 고려',
          '디스크 조각화 체크',
          '불필요한 파일 정리'
        ]
      });
    }
  }

  /**
   * API 기반 최적화 제안
   */
  checkAPIBasedOptimizations() {
    for (const [key, metric] of this.performanceMetrics) {
      if (metric.avgResponseTime > this.config.responseTimeThreshold) {
        this.addOptimizationSuggestion({
          type: 'api_optimization',
          priority: 'high',
          title: `API 성능 최적화: ${key}`,
          description: `평균 응답 시간이 ${metric.avgResponseTime.toFixed(2)}ms로 높습니다.`,
          suggestions: [
            '데이터베이스 쿼리 최적화',
            '캐싱 도입',
            '비동기 처리 적용',
            '응답 데이터 크기 최적화'
          ]
        });
      }

      const errorRate = metric.errorCount / metric.totalRequests;
      if (errorRate > 0.1) { // 10% 이상 에러율
        this.addOptimizationSuggestion({
          type: 'api_error_optimization',
          priority: 'high',
          title: `API 에러율 개선: ${key}`,
          description: `에러율이 ${(errorRate * 100).toFixed(2)}%로 높습니다.`,
          suggestions: [
            '에러 로깅 강화',
            '예외 처리 개선',
            '입력 검증 강화'
          ]
        });
      }
    }
  }

  /**
   * 메모리 누수 체크
   */
  checkMemoryLeaks() {
    const memoryHistory = this.resourceUsage.memory.slice(-20); // 최근 20개
    
    if (memoryHistory.length < 10) return;

    // 메모리 사용량이 지속적으로 증가하는지 체크
    let increasingCount = 0;
    for (let i = 1; i < memoryHistory.length; i++) {
      if (memoryHistory[i].heapUsed > memoryHistory[i-1].heapUsed) {
        increasingCount++;
      }
    }

    if (increasingCount > memoryHistory.length * 0.8) { // 80% 이상 증가
      this.addOptimizationSuggestion({
        type: 'memory_leak',
        priority: 'critical',
        title: '메모리 누수 의심',
        description: '메모리 사용량이 지속적으로 증가하고 있습니다.',
        suggestions: [
          '메모리 프로파일링 실행',
          '가비지 컬렉션 강제 실행',
          '메모리 사용량 패턴 분석'
        ]
      });
    }
  }

  /**
   * 캐싱 최적화 제안
   */
  checkCachingOptimizations() {
    // 자주 호출되는 API 체크
    const frequentAPIs = Array.from(this.performanceMetrics.entries())
      .filter(([key, metric]) => metric.totalRequests > 100)
      .sort((a, b) => b[1].totalRequests - a[1].totalRequests)
      .slice(0, 5);

    for (const [key, metric] of frequentAPIs) {
      if (metric.avgResponseTime > 500) { // 500ms 이상
        this.addOptimizationSuggestion({
          type: 'caching_optimization',
          priority: 'medium',
          title: `캐싱 도입 고려: ${key}`,
          description: `자주 호출되는 API의 응답 시간이 ${metric.avgResponseTime.toFixed(2)}ms입니다.`,
          suggestions: [
            'Redis 캐싱 도입',
            '메모리 캐싱 구현',
            'CDN 사용 고려'
          ]
        });
      }
    }
  }

  /**
   * 최적화 제안 추가
   */
  addOptimizationSuggestion(suggestion) {
    // 중복 제안 방지
    const existing = this.optimizationSuggestions.find(
      s => s.type === suggestion.type && s.title === suggestion.title
    );
    
    if (!existing) {
      suggestion.timestamp = Date.now();
      suggestion.id = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.optimizationSuggestions.push(suggestion);
      
      // 최대 제안 수 제한
      if (this.optimizationSuggestions.length > 50) {
        this.optimizationSuggestions.shift();
      }
    }
  }

  /**
   * 성능 알림 생성
   */
  createPerformanceAlert(type, message) {
    // 최근 5분 내 동일한 타입의 알림이 있는지 확인
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentAlert = this.performanceAlerts.find(
      alert => alert.type === type && alert.timestamp > fiveMinutesAgo
    );
    
    // 중복 알림 방지
    if (recentAlert) {
      return;
    }

    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type)
    };

    this.performanceAlerts.push(alert);
    
    // 최대 알림 수 제한
    if (this.performanceAlerts.length > 100) {
      this.performanceAlerts.shift();
    }

    console.log(`⚠️ 성능 알림: ${message}`);
  }

  /**
   * 성능 분석 결과 조회
   */
  getPerformanceAnalysis() {
    return {
      resourceUsage: this.getResourceUsageAnalysis(),
      apiPerformance: this.getAPIPerformanceAnalysis(),
      bottlenecks: this.getBottleneckAnalysis(),
      optimizationSuggestions: this.getOptimizationSuggestions(),
      performanceAlerts: this.getPerformanceAlerts()
    };
  }

  /**
   * 리소스 사용량 분석
   */
  getResourceUsageAnalysis() {
    return {
      cpu: {
        current: this.getCurrentCPUUsage(),
        average: this.getAverageCPUUsage(),
        trend: this.getCPUTrend()
      },
      memory: {
        current: this.getCurrentMemoryUsage(),
        average: this.getAverageMemoryUsage(),
        trend: this.getMemoryTrend()
      },
      disk: {
        health: this.getAverageDiskHealth(),
        performance: this.getDiskPerformance()
      },
      network: {
        activeConnections: this.getActiveConnections(),
        latency: this.getAverageNetworkLatency()
      }
    };
  }

  /**
   * API 성능 분석
   */
  getAPIPerformanceAnalysis() {
    const analysis = [];
    
    for (const [key, metric] of this.performanceMetrics) {
      analysis.push({
        endpoint: key,
        totalRequests: metric.totalRequests,
        avgResponseTime: metric.avgResponseTime.toFixed(2) + 'ms',
        minResponseTime: metric.minResponseTime + 'ms',
        maxResponseTime: metric.maxResponseTime + 'ms',
        successRate: ((metric.successCount / metric.totalRequests) * 100).toFixed(2) + '%',
        errorRate: ((metric.errorCount / metric.totalRequests) * 100).toFixed(2) + '%',
        lastRequest: new Date(metric.lastRequest).toLocaleString()
      });
    }

    return analysis.sort((a, b) => b.totalRequests - a.totalRequests);
  }

  /**
   * 병목 분석
   */
  getBottleneckAnalysis() {
    const analysis = [];
    
    for (const [key, bottleneck] of this.bottlenecks) {
      analysis.push({
        endpoint: key,
        occurrences: bottleneck.occurrences,
        avgResponseTime: bottleneck.avgResponseTime.toFixed(2) + 'ms',
        firstOccurrence: new Date(bottleneck.firstOccurrence).toLocaleString(),
        lastOccurrence: new Date(bottleneck.lastOccurrence).toLocaleString(),
        suggestions: bottleneck.suggestions
      });
    }

    return analysis.sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * 최적화 제안 조회
   */
  getOptimizationSuggestions() {
    return this.optimizationSuggestions
      .sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority))
      .slice(0, 20); // 상위 20개만
  }

  /**
   * 성능 알림 조회
   */
  getPerformanceAlerts() {
    return this.performanceAlerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20); // 최근 20개만
  }

  /**
   * 유틸리티 메서드들
   */
  getAverageCPUUsage() {
    if (this.resourceUsage.cpu.length === 0) return 0;
    const recent = this.resourceUsage.cpu.slice(-10);
    return recent.reduce((sum, cpu) => sum + cpu.usage, 0) / recent.length;
  }

  getCurrentCPUUsage() {
    if (this.resourceUsage.cpu.length === 0) return 0;
    return this.resourceUsage.cpu[this.resourceUsage.cpu.length - 1].usage;
  }

  getCPUTrend() {
    if (this.resourceUsage.cpu.length < 5) return 'stable';
    const recent = this.resourceUsage.cpu.slice(-5);
    const first = recent[0].usage;
    const last = recent[recent.length - 1].usage;
    return last > first * 1.1 ? 'increasing' : last < first * 0.9 ? 'decreasing' : 'stable';
  }

  getAverageMemoryUsage() {
    if (this.resourceUsage.memory.length === 0) return 0;
    const recent = this.resourceUsage.memory.slice(-10);
    return recent.reduce((sum, mem) => sum + mem.usagePercent, 0) / recent.length;
  }

  getCurrentMemoryUsage() {
    if (this.resourceUsage.memory.length === 0) return 0;
    return this.resourceUsage.memory[this.resourceUsage.memory.length - 1].usagePercent;
  }

  getMemoryTrend() {
    if (this.resourceUsage.memory.length < 5) return 'stable';
    const recent = this.resourceUsage.memory.slice(-5);
    const first = recent[0].usagePercent;
    const last = recent[recent.length - 1].usagePercent;
    return last > first * 1.1 ? 'increasing' : last < first * 0.9 ? 'decreasing' : 'stable';
  }

  getAverageDiskHealth() {
    if (this.resourceUsage.disk.length === 0) return 1;
    const recent = this.resourceUsage.disk.slice(-10);
    return recent.reduce((sum, disk) => sum + disk.diskHealth, 0) / recent.length;
  }

  getDiskPerformance() {
    if (this.resourceUsage.disk.length === 0) return { writeTime: 0, readTime: 0 };
    const recent = this.resourceUsage.disk.slice(-5);
    return {
      avgWriteTime: recent.reduce((sum, disk) => sum + disk.writeTime, 0) / recent.length,
      avgReadTime: recent.reduce((sum, disk) => sum + disk.readTime, 0) / recent.length
    };
  }

  getActiveConnections() {
    // 실제 구현에서는 서버의 활성 연결 수를 반환
    return Math.floor(Math.random() * 100) + 10; // 임시 구현
  }

  getAverageNetworkLatency() {
    if (this.resourceUsage.network.length === 0) return 0;
    const recent = this.resourceUsage.network.slice(-10);
    return recent.reduce((sum, net) => sum + (net.networkLatency || 0), 0) / recent.length;
  }

  measureNetworkLatency() {
    // 실제 구현에서는 네트워크 지연 시간을 측정
    return Math.floor(Math.random() * 50) + 10; // 임시 구현
  }

  calculateDiskHealth(writeTime, readTime) {
    // 디스크 성능을 0-1 사이의 값으로 정규화
    const maxWriteTime = 1000; // 1초
    const maxReadTime = 500; // 0.5초
    
    const writeHealth = Math.max(0, 1 - (writeTime / maxWriteTime));
    const readHealth = Math.max(0, 1 - (readTime / maxReadTime));
    
    return (writeHealth + readHealth) / 2;
  }

  generateBottleneckSuggestions(endpoint, method, responseTime) {
    const suggestions = [];
    
    if (responseTime > 5000) {
      suggestions.push('데이터베이스 쿼리 최적화 필요');
    }
    
    if (responseTime > 2000) {
      suggestions.push('캐싱 도입 고려');
    }
    
    if (endpoint.includes('upload') || endpoint.includes('file')) {
      suggestions.push('파일 업로드 최적화');
    }
    
    return suggestions.length > 0 ? suggestions : ['일반적인 성능 최적화'];
  }

  getAlertSeverity(type) {
    const severityMap = {
      'cpu_high': 'warning',
      'memory_high': 'warning',
      'disk_full': 'critical',
      'network_down': 'critical'
    };
    return severityMap[type] || 'info';
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

  /**
   * 메모리 정리
   */
  cleanup() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // 오래된 메트릭 정리
    this.resourceUsage.cpu = this.resourceUsage.cpu.filter(
      cpu => cpu.timestamp > oneDayAgo
    );
    
    this.resourceUsage.memory = this.resourceUsage.memory.filter(
      mem => mem.timestamp > oneDayAgo
    );
    
    this.resourceUsage.disk = this.resourceUsage.disk.filter(
      disk => disk.timestamp > oneDayAgo
    );
    
    this.resourceUsage.network = this.resourceUsage.network.filter(
      net => net.timestamp > oneDayAgo
    );
    
    // 오래된 알림 정리
    this.performanceAlerts = this.performanceAlerts.filter(
      alert => alert.timestamp > oneDayAgo
    );
  }
} 