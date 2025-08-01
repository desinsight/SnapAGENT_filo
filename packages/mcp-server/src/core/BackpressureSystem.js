import { EventEmitter } from 'events';
import os from 'os';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

/**
 * 고성능 백프레셔 시스템
 * - 실시간 시스템 리소스 모니터링
 * - 적응형 부하 제어
 * - 예측적 성능 조절
 * - 우선순위 기반 작업 스케줄링
 */
export class BackpressureSystem extends EventEmitter {
    constructor() {
        super();
        this.systemMonitor = new SystemResourceMonitor();
        this.loadController = new AdaptiveLoadController();
        this.predictor = new PerformancePredictor();
        this.scheduler = new PriorityScheduler();
        this.circuitBreaker = new CircuitBreaker();
        
        this.isInitialized = false;
        this.currentState = 'normal'; // normal, throttled, critical
        this.metrics = {
            requestsProcessed: 0,
            requestsThrottled: 0,
            requestsRejected: 0,
            avgResponseTime: 0,
            currentThroughput: 0
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        await this.systemMonitor.initialize();
        await this.loadController.initialize();
        await this.predictor.initialize();
        
        // 모니터링 시작
        this.systemMonitor.on('metrics', (metrics) => {
            this.handleSystemMetrics(metrics);
        });

        this.systemMonitor.on('threshold_breach', (event) => {
            this.handleThresholdBreach(event);
        });

        this.systemMonitor.start();
        
        this.isInitialized = true;
        logger.info('백프레셔 시스템 초기화 완료');
    }

    /**
     * 요청 처리 가능 여부 확인
     */
    async canProcessRequest(request) {
        const priority = this.calculateRequestPriority(request);
        const currentLoad = this.systemMonitor.getCurrentLoad();
        
        // 회로 차단기 상태 확인
        if (this.circuitBreaker.isOpen()) {
            this.metrics.requestsRejected++;
            return {
                allowed: false,
                reason: 'circuit_breaker_open',
                estimatedWaitTime: this.circuitBreaker.getEstimatedRecoveryTime()
            };
        }

        // 시스템 상태 기반 결정
        const decision = await this.loadController.makeDecision(currentLoad, priority, request);
        
        if (decision.action === 'reject') {
            this.metrics.requestsRejected++;
            return {
                allowed: false,
                reason: decision.reason,
                estimatedWaitTime: decision.estimatedWaitTime
            };
        }

        if (decision.action === 'throttle') {
            this.metrics.requestsThrottled++;
            return {
                allowed: true,
                throttled: true,
                delay: decision.delay,
                reason: decision.reason
            };
        }

        this.metrics.requestsProcessed++;
        return {
            allowed: true,
            throttled: false
        };
    }

    /**
     * 요청 우선순위 계산
     */
    calculateRequestPriority(request) {
        const factors = {
            type: this.getTypePriority(request.type),
            size: this.getSizePriority(request.size),
            user: this.getUserPriority(request.user),
            age: this.getAgePriority(request.timestamp)
        };

        // 가중 평균 계산
        const weights = { type: 0.4, size: 0.3, user: 0.2, age: 0.1 };
        let priority = 0;

        for (const [factor, value] of Object.entries(factors)) {
            priority += value * weights[factor];
        }

        return Math.max(0, Math.min(1, priority)); // 0-1 범위로 정규화
    }

    getTypePriority(type) {
        const priorities = {
            'read': 0.9,     // 읽기 작업 높은 우선순위
            'search': 0.8,   // 검색 작업
            'write': 0.6,    // 쓰기 작업
            'copy': 0.4,     // 복사 작업
            'move': 0.3,     // 이동 작업
            'delete': 0.2,   // 삭제 작업 낮은 우선순위
            'compress': 0.1  // 압축 작업 가장 낮음
        };
        return priorities[type] || 0.5;
    }

    getSizePriority(size) {
        // 작은 파일이 높은 우선순위
        if (size < 1024 * 1024) return 0.9;      // 1MB 미만
        if (size < 10 * 1024 * 1024) return 0.7; // 10MB 미만
        if (size < 100 * 1024 * 1024) return 0.5; // 100MB 미만
        return 0.3; // 100MB 이상
    }

    getUserPriority(user) {
        // 사용자별 우선순위 (실제 구현에서는 DB/설정에서 가져옴)
        return 0.5; // 기본값
    }

    getAgePriority(timestamp) {
        const age = Date.now() - timestamp;
        const maxAge = 5 * 60 * 1000; // 5분
        return Math.max(0, 1 - (age / maxAge));
    }

    /**
     * 시스템 메트릭 처리
     */
    handleSystemMetrics(metrics) {
        // 예측 모델 업데이트
        this.predictor.updateMetrics(metrics);
        
        // 상태 전환 평가
        const newState = this.evaluateSystemState(metrics);
        if (newState !== this.currentState) {
            this.transitionState(newState, metrics);
        }

        // 성능 메트릭 업데이트
        this.updatePerformanceMetrics(metrics);
    }

    evaluateSystemState(metrics) {
        const { memory, cpu, severe } = metrics.backpressure;
        
        if (severe || (memory && cpu)) {
            return 'critical';
        } else if (memory || cpu) {
            return 'throttled';
        } else {
            return 'normal';
        }
    }

    transitionState(newState, metrics) {
        const oldState = this.currentState;
        this.currentState = newState;
        
        logger.info(`백프레셔 상태 변경: ${oldState} -> ${newState}`);
        
        // 상태별 대응 조치
        switch (newState) {
            case 'critical':
                this.activateCriticalMode(metrics);
                break;
            case 'throttled':
                this.activateThrottleMode(metrics);
                break;
            case 'normal':
                this.activateNormalMode(metrics);
                break;
        }

        this.emit('state_change', {
            oldState,
            newState,
            metrics,
            timestamp: Date.now()
        });
    }

    activateCriticalMode(metrics) {
        // 심각한 상황: 대폭적인 처리 제한
        this.loadController.setThrottleRate(0.9); // 90% 요청 제한
        this.circuitBreaker.activate();
        
        // 강제 가비지 컬렉션
        if (global.gc) global.gc();
        
        // 긴급 메모리 정리
        this.scheduler.clearLowPriorityQueue();
    }

    activateThrottleMode(metrics) {
        // 부하 상황: 적당한 처리 제한
        const throttleRate = this.calculateThrottleRate(metrics);
        this.loadController.setThrottleRate(throttleRate);
        
        // 우선순위 기반 작업 지연
        this.scheduler.delayLowPriorityTasks();
    }

    activateNormalMode(metrics) {
        // 정상 상태: 제한 해제
        this.loadController.setThrottleRate(0);
        this.circuitBreaker.deactivate();
        this.scheduler.resumeAllTasks();
    }

    calculateThrottleRate(metrics) {
        const memoryUsage = metrics.memory.usage;
        const cpuUsage = metrics.cpu.usage;
        
        // 메모리와 CPU 사용률 기반 스로틀링 비율 계산
        const memoryFactor = Math.max(0, (memoryUsage - 0.7) / 0.2); // 70% 이상에서 시작
        const cpuFactor = Math.max(0, (cpuUsage - 0.8) / 0.2);       // 80% 이상에서 시작
        
        return Math.min(0.8, Math.max(memoryFactor, cpuFactor));
    }

    /**
     * 임계값 위반 처리
     */
    handleThresholdBreach(event) {
        logger.warn(`임계값 위반: ${event.metric} = ${event.value} (임계값: ${event.threshold})`);
        
        // 즉시 대응 조치
        switch (event.severity) {
            case 'critical':
                this.handleCriticalBreach(event);
                break;
            case 'warning':
                this.handleWarningBreach(event);
                break;
        }
    }

    handleCriticalBreach(event) {
        // 즉시 회로 차단
        this.circuitBreaker.trip();
        
        // 모든 새 요청 차단
        this.loadController.blockNewRequests(30000); // 30초간 차단
        
        this.emit('critical_breach', event);
    }

    handleWarningBreach(event) {
        // 예방적 스로틀링 증가
        const currentRate = this.loadController.getThrottleRate();
        this.loadController.setThrottleRate(Math.min(0.8, currentRate + 0.2));
        
        this.emit('warning_breach', event);
    }

    /**
     * 성능 메트릭 업데이트
     */
    updatePerformanceMetrics(systemMetrics) {
        // 처리량 계산
        const now = Date.now();
        if (this.lastMetricUpdate) {
            const timeDelta = now - this.lastMetricUpdate;
            const requestsDelta = this.metrics.requestsProcessed - (this.lastRequestCount || 0);
            this.metrics.currentThroughput = (requestsDelta / timeDelta) * 1000; // requests/sec
        }
        
        this.lastMetricUpdate = now;
        this.lastRequestCount = this.metrics.requestsProcessed;
    }

    /**
     * 현재 상태 조회
     */
    getStatus() {
        return {
            state: this.currentState,
            systemLoad: this.systemMonitor.getCurrentLoad(),
            throttleRate: this.loadController.getThrottleRate(),
            circuitBreakerOpen: this.circuitBreaker.isOpen(),
            metrics: { ...this.metrics },
            predictions: this.predictor.getCurrentPredictions(),
            queueStatus: this.scheduler.getQueueStatus()
        };
    }

    /**
     * 정리
     */
    async shutdown() {
        if (this.systemMonitor) {
            this.systemMonitor.stop();
        }
        
        logger.info('백프레셔 시스템 종료됨');
    }
}

/**
 * 시스템 리소스 모니터
 */
class SystemResourceMonitor extends EventEmitter {
    constructor() {
        super();
        this.monitoringInterval = null;
        this.metricsHistory = [];
        this.thresholds = {
            memory: { warning: 0.7, critical: 0.9 },
            cpu: { warning: 0.8, critical: 0.95 },
            heap: { warning: 0.8, critical: 0.95 }
        };
    }

    async initialize() {
        // 초기 시스템 정보 수집
        this.baselineMetrics = await this.collectMetrics();
    }

    start() {
        this.monitoringInterval = setInterval(() => {
            this.collectAndEmitMetrics();
        }, config.performance.updateInterval);
    }

    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    async collectAndEmitMetrics() {
        try {
            const metrics = await this.collectMetrics();
            this.metricsHistory.push(metrics);
            
            // 히스토리 크기 제한
            if (this.metricsHistory.length > 1000) {
                this.metricsHistory = this.metricsHistory.slice(-500);
            }

            // 임계값 검사
            this.checkThresholds(metrics);
            
            this.emit('metrics', metrics);
        } catch (error) {
            logger.error('메트릭 수집 오류:', error);
        }
    }

    async collectMetrics() {
        const memInfo = process.memoryUsage();
        const systemMemory = {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem()
        };

        return {
            timestamp: Date.now(),
            memory: {
                system: {
                    total: systemMemory.total,
                    free: systemMemory.free,
                    used: systemMemory.used,
                    usage: systemMemory.used / systemMemory.total
                },
                process: {
                    rss: memInfo.rss,
                    heapTotal: memInfo.heapTotal,
                    heapUsed: memInfo.heapUsed,
                    external: memInfo.external,
                    heapUsage: memInfo.heapUsed / memInfo.heapTotal
                }
            },
            cpu: {
                usage: this.getCpuUsage(),
                loadAvg: os.loadavg(),
                cores: os.cpus().length
            },
            backpressure: config.performance.getDynamicConfig().getBackpressureThresholds()
        };
    }

    getCpuUsage() {
        const loadAvg = os.loadavg()[0];
        const cores = os.cpus().length;
        return Math.min(loadAvg / cores, 1.0);
    }

    checkThresholds(metrics) {
        const checks = [
            { name: 'memory', value: metrics.memory.system.usage, thresholds: this.thresholds.memory },
            { name: 'cpu', value: metrics.cpu.usage, thresholds: this.thresholds.cpu },
            { name: 'heap', value: metrics.memory.process.heapUsage, thresholds: this.thresholds.heap }
        ];

        for (const check of checks) {
            if (check.value >= check.thresholds.critical) {
                this.emit('threshold_breach', {
                    metric: check.name,
                    value: check.value,
                    threshold: check.thresholds.critical,
                    severity: 'critical'
                });
            } else if (check.value >= check.thresholds.warning) {
                this.emit('threshold_breach', {
                    metric: check.name,
                    value: check.value,
                    threshold: check.thresholds.warning,
                    severity: 'warning'
                });
            }
        }
    }

    getCurrentLoad() {
        if (this.metricsHistory.length === 0) return null;
        return this.metricsHistory[this.metricsHistory.length - 1];
    }
}

/**
 * 적응형 부하 제어기
 */
class AdaptiveLoadController {
    constructor() {
        this.throttleRate = 0;
        this.isBlocking = false;
        this.blockEndTime = 0;
        this.adaptiveThresholds = new Map();
    }

    async initialize() {
        // 초기화 로직
    }

    async makeDecision(currentLoad, priority, request) {
        // 차단 상태 확인
        if (this.isBlocking && Date.now() < this.blockEndTime) {
            return {
                action: 'reject',
                reason: 'system_blocked',
                estimatedWaitTime: this.blockEndTime - Date.now()
            };
        }

        // 스로틀링 적용
        if (this.shouldThrottle(priority)) {
            const delay = this.calculateDelay(currentLoad, priority);
            return {
                action: 'throttle',
                delay,
                reason: 'load_throttling'
            };
        }

        return { action: 'allow' };
    }

    shouldThrottle(priority) {
        if (this.throttleRate === 0) return false;
        
        // 우선순위 기반 스로틀링 확률
        const adjustedRate = this.throttleRate * (1 - priority);
        return Math.random() < adjustedRate;
    }

    calculateDelay(currentLoad, priority) {
        const baseDelay = 100; // 100ms 기본 지연
        const loadFactor = currentLoad ? currentLoad.memory.system.usage + currentLoad.cpu.usage : 1;
        const priorityFactor = 1 - priority;
        
        return baseDelay * loadFactor * priorityFactor;
    }

    setThrottleRate(rate) {
        this.throttleRate = Math.max(0, Math.min(1, rate));
    }

    getThrottleRate() {
        return this.throttleRate;
    }

    blockNewRequests(duration) {
        this.isBlocking = true;
        this.blockEndTime = Date.now() + duration;
        
        setTimeout(() => {
            this.isBlocking = false;
        }, duration);
    }
}

/**
 * 성능 예측기
 */
class PerformancePredictor {
    constructor() {
        this.historicalData = [];
        this.predictions = {};
    }

    async initialize() {
        // 예측 모델 초기화
    }

    updateMetrics(metrics) {
        this.historicalData.push(metrics);
        
        // 예측 업데이트 (간단한 트렌드 기반)
        if (this.historicalData.length >= 10) {
            this.updatePredictions();
        }

        // 데이터 크기 제한
        if (this.historicalData.length > 100) {
            this.historicalData = this.historicalData.slice(-50);
        }
    }

    updatePredictions() {
        const recent = this.historicalData.slice(-10);
        
        // 메모리 사용량 트렌드
        const memoryTrend = this.calculateTrend(recent.map(m => m.memory.system.usage));
        
        // CPU 사용량 트렌드
        const cpuTrend = this.calculateTrend(recent.map(m => m.cpu.usage));
        
        this.predictions = {
            memoryTrend,
            cpuTrend,
            estimatedPeakTime: this.estimatePeakTime(memoryTrend, cpuTrend),
            recommendedAction: this.recommendAction(memoryTrend, cpuTrend)
        };
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const recent = values.slice(-5);
        const older = values.slice(-10, -5);
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        return recentAvg - olderAvg; // 양수면 증가 트렌드
    }

    estimatePeakTime(memoryTrend, cpuTrend) {
        // 간단한 선형 예측
        const maxTrend = Math.max(memoryTrend, cpuTrend);
        if (maxTrend <= 0) return null;
        
        const currentUsage = this.historicalData[this.historicalData.length - 1];
        const maxUsage = Math.max(currentUsage.memory.system.usage, currentUsage.cpu.usage);
        
        const timeToMax = (1 - maxUsage) / maxTrend;
        return Date.now() + (timeToMax * 60000); // 분 단위를 밀리초로 변환
    }

    recommendAction(memoryTrend, cpuTrend) {
        if (memoryTrend > 0.1 || cpuTrend > 0.1) {
            return 'preemptive_throttling';
        } else if (memoryTrend < -0.05 && cpuTrend < -0.05) {
            return 'reduce_throttling';
        }
        return 'maintain_current';
    }

    getCurrentPredictions() {
        return { ...this.predictions };
    }
}

/**
 * 우선순위 스케줄러
 */
class PriorityScheduler {
    constructor() {
        this.queues = {
            high: [],
            medium: [],
            low: []
        };
        this.delayedTasks = new Map();
    }

    addTask(task, priority) {
        const queue = this.getQueueByPriority(priority);
        queue.push(task);
    }

    getQueueByPriority(priority) {
        if (priority >= 0.7) return this.queues.high;
        if (priority >= 0.4) return this.queues.medium;
        return this.queues.low;
    }

    delayLowPriorityTasks() {
        const lowTasks = this.queues.low.splice(0);
        const delay = 5000; // 5초 지연
        
        lowTasks.forEach(task => {
            const timeoutId = setTimeout(() => {
                this.queues.low.push(task);
                this.delayedTasks.delete(task.id);
            }, delay);
            
            this.delayedTasks.set(task.id, timeoutId);
        });
    }

    clearLowPriorityQueue() {
        this.queues.low = [];
        
        // 지연된 작업들도 취소
        for (const timeoutId of this.delayedTasks.values()) {
            clearTimeout(timeoutId);
        }
        this.delayedTasks.clear();
    }

    resumeAllTasks() {
        // 지연된 작업들을 즉시 복원
        for (const [taskId, timeoutId] of this.delayedTasks.entries()) {
            clearTimeout(timeoutId);
        }
        this.delayedTasks.clear();
    }

    getQueueStatus() {
        return {
            high: this.queues.high.length,
            medium: this.queues.medium.length,
            low: this.queues.low.length,
            delayed: this.delayedTasks.size
        };
    }
}

/**
 * 회로 차단기
 */
class CircuitBreaker {
    constructor() {
        this.state = 'closed'; // closed, open, half-open
        this.failureCount = 0;
        this.failureThreshold = 5;
        this.recoveryTimeout = 30000; // 30초
        this.lastFailureTime = 0;
    }

    isOpen() {
        if (this.state === 'open') {
            // 복구 시간 확인
            if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
                this.state = 'half-open';
                this.failureCount = 0;
            }
        }
        
        return this.state === 'open';
    }

    trip() {
        this.state = 'open';
        this.lastFailureTime = Date.now();
    }

    activate() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.trip();
        }
    }

    deactivate() {
        this.state = 'closed';
        this.failureCount = 0;
    }

    getEstimatedRecoveryTime() {
        if (this.state !== 'open') return 0;
        return Math.max(0, this.recoveryTimeout - (Date.now() - this.lastFailureTime));
    }
}

export default BackpressureSystem;