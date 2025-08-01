const { Worker } = require('worker_threads');
const path = require('path');
const { EventEmitter } = require('events');
const fs = require('fs/promises');
const os = require('os');
const cluster = require('cluster');
const logger = require('../utils/logger');
const { config } = require('../config');
const StreamingChunkEngine = require('../core/StreamingChunkEngine');
const BackpressureSystem = require('../core/BackpressureSystem');

/**
 * 차세대 고성능 매니저
 * - 실시간 성능 최적화
 * - 적응형 리소스 관리  
 * - 예측적 성능 튜닝
 * - 마이크로 최적화
 */
class PerformanceManager extends EventEmitter {
    constructor() {
        super();
        this.orchestrator = new PerformanceOrchestrator();
        this.streamingEngine = new StreamingChunkEngine();
        this.backpressureSystem = new BackpressureSystem();
        this.resourceOptimizer = new ResourceOptimizer();
        this.performanceTuner = new PerformanceTuner();
        this.metrics = new AdvancedMetricsCollector();
        this.predictiveAnalyzer = new PredictiveAnalyzer();
        
        this.isInitialized = false;
        this.optimizationMode = 'adaptive'; // conservative, balanced, aggressive, adaptive
        this.currentProfile = null;
    }

    async initialize() {
        if (this.isInitialized) return;

        logger.info('🚀 차세대 PerformanceManager 초기화 시작...');

        // 시스템 프로파일링
        this.currentProfile = await this.performanceTuner.generateSystemProfile();
        logger.info(`시스템 프로파일: ${this.currentProfile.class} (${this.currentProfile.score}/10)`);

        // 핵심 컴포넌트 초기화
        await Promise.all([
            this.orchestrator.initialize(this.currentProfile),
            this.streamingEngine.initialize(),
            this.backpressureSystem.initialize(),
            this.resourceOptimizer.initialize(this.currentProfile),
            this.metrics.initialize(),
            this.predictiveAnalyzer.initialize()
        ]);

        // 성능 최적화 프로파일 적용
        await this.applyOptimizationProfile();

        // 실시간 모니터링 시작
        this.startRealTimeOptimization();

        this.isInitialized = true;
        logger.info('✅ 차세대 PerformanceManager 초기화 완료');
    }

    /**
     * 최적화 프로파일 적용
     */
    async applyOptimizationProfile() {
        const profile = this.currentProfile;
        
        // CPU 최적화
        if (profile.cpu.cores >= 8) {
            await this.enableParallelOptimizations();
        }

        // 메모리 최적화
        if (profile.memory.total >= 16 * 1024 * 1024 * 1024) { // 16GB 이상
            await this.enableMemoryIntensiveOptimizations();
        }

        // SSD 최적화
        if (profile.storage.type === 'ssd') {
            await this.enableSSDOptimizations();
        }

        // GPU 가속 (사용 가능한 경우)
        if (profile.gpu.available) {
            await this.enableGPUAcceleration();
        }

        logger.info(`최적화 프로파일 적용 완료: ${profile.optimizations.join(', ')}`);
    }

    async enableParallelOptimizations() {
        // 고도병렬처리 활성화
        this.orchestrator.setParallelismLevel('high');
        this.currentProfile.optimizations.push('parallel');
    }

    async enableMemoryIntensiveOptimizations() {
        // 대용량 메모리 활용 최적화
        this.resourceOptimizer.enableLargeBuffers();
        this.streamingEngine.enableMemoryMappedIO();
        this.currentProfile.optimizations.push('memory_intensive');
    }

    async enableSSDOptimizations() {
        // SSD 특화 최적화
        this.resourceOptimizer.enableSequentialIO();
        this.streamingEngine.optimizeForSSD();
        this.currentProfile.optimizations.push('ssd');
    }

    async enableGPUAcceleration() {
        // GPU 가속 (실험적)
        try {
            await this.resourceOptimizer.initializeGPU();
            this.currentProfile.optimizations.push('gpu');
        } catch (error) {
            logger.warn('GPU 가속 초기화 실패:', error.message);
        }
    }

    /**
     * 실시간 성능 최적화 시작
     */
    startRealTimeOptimization() {
        // 실시간 메트릭 수집
        this.metrics.on('performance_data', (data) => {
            this.handlePerformanceData(data);
        });

        // 예측적 분석
        this.predictiveAnalyzer.on('optimization_recommendation', (recommendation) => {
            this.handleOptimizationRecommendation(recommendation);
        });

        // 백프레셔 시스템 연동
        this.backpressureSystem.on('state_change', (event) => {
            this.handleBackpressureStateChange(event);
        });

        // 주기적 최적화 실행
        this.optimizationInterval = setInterval(() => {
            this.performPeriodicOptimization();
        }, 30000); // 30초마다

        logger.info('실시간 성능 최적화 활성화됨');
    }

    /**
     * 성능 데이터 처리
     */
    async handlePerformanceData(data) {
        // 실시간 분석
        const analysis = this.predictiveAnalyzer.analyzePerformance(data);
        
        if (analysis.requiresAction) {
            await this.executeOptimizations(analysis.recommendations);
        }

        // 임계값 확인
        if (data.bottlenecks.length > 0) {
            await this.resolveBottlenecks(data.bottlenecks);
        }
    }

    /**
     * 최적화 권장사항 처리
     */
    async handleOptimizationRecommendation(recommendation) {
        logger.info(`최적화 권장: ${recommendation.type} - ${recommendation.description}`);
        
        if (this.optimizationMode === 'adaptive' || 
            recommendation.confidence >= 0.8) {
            
            await this.executeOptimizations([recommendation]);
        }
    }

    /**
     * 최적화 실행
     */
    async executeOptimizations(recommendations) {
        for (const rec of recommendations) {
            try {
                switch (rec.type) {
                    case 'memory_optimization':
                        await this.optimizeMemoryUsage(rec);
                        break;
                    case 'cpu_optimization':
                        await this.optimizeCPUUsage(rec);
                        break;
                    case 'io_optimization':
                        await this.optimizeIOOperations(rec);
                        break;
                    case 'concurrency_optimization':
                        await this.optimizeConcurrency(rec);
                        break;
                    case 'cache_optimization':
                        await this.optimizeCaching(rec);
                        break;
                }
                
                logger.info(`최적화 적용됨: ${rec.type}`);
            } catch (error) {
                logger.error(`최적화 실행 실패 (${rec.type}):`, error);
            }
        }
    }

    /**
     * 메모리 사용량 최적화
     */
    async optimizeMemoryUsage(recommendation) {
        const actions = {
            'reduce_buffer_size': () => this.resourceOptimizer.reduceBufferSizes(),
            'enable_compression': () => this.resourceOptimizer.enableCompression(),
            'clear_cache': () => this.resourceOptimizer.clearLRUCache(),
            'force_gc': () => this.resourceOptimizer.triggerGarbageCollection(),
            'optimize_heap': () => this.resourceOptimizer.optimizeHeapUsage()
        };

        const action = actions[recommendation.action];
        if (action) {
            await action();
        }
    }

    /**
     * CPU 사용량 최적화
     */
    async optimizeCPUUsage(recommendation) {
        const actions = {
            'reduce_concurrency': () => this.orchestrator.reduceConcurrency(),
            'enable_batching': () => this.orchestrator.enableBatching(),
            'optimize_algorithms': () => this.performanceTuner.optimizeAlgorithms(),
            'balance_load': () => this.orchestrator.rebalanceLoad(),
            'enable_cpu_affinity': () => this.resourceOptimizer.enableCPUAffinity()
        };

        const action = actions[recommendation.action];
        if (action) {
            await action();
        }
    }

    /**
     * I/O 작업 최적화
     */
    async optimizeIOOperations(recommendation) {
        const actions = {
            'increase_buffer_size': () => this.streamingEngine.increaseBufferSize(),
            'enable_prefetching': () => this.resourceOptimizer.enablePrefetching(),
            'optimize_sequential_access': () => this.streamingEngine.optimizeSequentialAccess(),
            'enable_async_io': () => this.resourceOptimizer.enableAsyncIO(),
            'optimize_chunk_size': () => this.streamingEngine.optimizeChunkSize()
        };

        const action = actions[recommendation.action];
        if (action) {
            await action();
        }
    }

    /**
     * 동시성 최적화
     */
    async optimizeConcurrency(recommendation) {
        const currentConcurrency = config.performance.getMaxConcurrent();
        
        switch (recommendation.action) {
            case 'increase':
                const newConcurrency = Math.min(currentConcurrency * 1.5, 32);
                this.orchestrator.setConcurrency(newConcurrency);
                break;
            case 'decrease':
                const reducedConcurrency = Math.max(currentConcurrency * 0.7, 2);
                this.orchestrator.setConcurrency(reducedConcurrency);
                break;
            case 'adaptive':
                this.orchestrator.enableAdaptiveConcurrency();
                break;
        }
    }

    /**
     * 캐싱 최적화
     */
    async optimizeCaching(recommendation) {
        switch (recommendation.action) {
            case 'increase_cache_size':
                this.resourceOptimizer.increaseCacheSize();
                break;
            case 'optimize_cache_policy':
                this.resourceOptimizer.optimizeCachePolicy();
                break;
            case 'enable_multi_level_cache':
                this.resourceOptimizer.enableMultiLevelCache();
                break;
            case 'preload_cache':
                this.resourceOptimizer.preloadFrequentData();
                break;
        }
    }

    /**
     * 병목현상 해결
     */
    async resolveBottlenecks(bottlenecks) {
        for (const bottleneck of bottlenecks) {
            logger.warn(`병목현상 감지: ${bottleneck.type} (${bottleneck.severity})`);
            
            switch (bottleneck.type) {
                case 'memory':
                    await this.resolveMemoryBottleneck(bottleneck);
                    break;
                case 'cpu':
                    await this.resolveCPUBottleneck(bottleneck);
                    break;
                case 'io':
                    await this.resolveIOBottleneck(bottleneck);
                    break;
                case 'network':
                    await this.resolveNetworkBottleneck(bottleneck);
                    break;
            }
        }
    }

    async resolveMemoryBottleneck(bottleneck) {
        // 즉시 메모리 정리
        if (global.gc) global.gc();
        
        // 캐시 크기 감소
        this.resourceOptimizer.reduceCacheSize();
        
        // 버퍼 크기 최적화
        this.streamingEngine.optimizeBufferSizeForMemory();
    }

    async resolveCPUBottleneck(bottleneck) {
        // 동시성 감소
        this.orchestrator.reduceConcurrency();
        
        // 백프레셔 활성화
        this.backpressureSystem.activateThrottleMode();
        
        // CPU 집약적 작업 지연
        this.orchestrator.delayIntensiveTasks();
    }

    async resolveIOBottleneck(bottleneck) {
        // I/O 배치 크기 조절
        this.streamingEngine.optimizeBatchSize();
        
        // 비동기 I/O 최적화
        this.resourceOptimizer.optimizeAsyncIO();
        
        // 순차 접근 패턴 활성화
        this.streamingEngine.enableSequentialPattern();
    }

    async resolveNetworkBottleneck(bottleneck) {
        // 네트워크 버퍼 최적화
        this.resourceOptimizer.optimizeNetworkBuffers();
        
        // 압축 활성화
        this.resourceOptimizer.enableNetworkCompression();
        
        // 연결 풀 최적화
        this.resourceOptimizer.optimizeConnectionPool();
    }

    /**
     * 주기적 최적화
     */
    async performPeriodicOptimization() {
        try {
            const currentMetrics = await this.metrics.getCurrentMetrics();
            const recommendations = this.predictiveAnalyzer.generateOptimizationPlan(currentMetrics);
            
            if (recommendations.length > 0) {
                logger.debug(`주기적 최적화 실행: ${recommendations.length}개 권장사항`);
                await this.executeOptimizations(recommendations);
            }

            // 성능 프로파일 업데이트
            await this.updatePerformanceProfile();
            
        } catch (error) {
            logger.error('주기적 최적화 실패:', error);
        }
    }

    /**
     * 성능 프로파일 업데이트
     */
    async updatePerformanceProfile() {
        const newProfile = await this.performanceTuner.generateSystemProfile();
        
        if (newProfile.score !== this.currentProfile.score) {
            logger.info(`성능 점수 변경: ${this.currentProfile.score} -> ${newProfile.score}`);
            this.currentProfile = newProfile;
            
            // 프로파일 변경에 따른 재최적화
            if (Math.abs(newProfile.score - this.currentProfile.score) >= 2) {
                await this.applyOptimizationProfile();
            }
        }
    }

    /**
     * 백프레셔 상태 변경 처리
     */
    async handleBackpressureStateChange(event) {
        logger.info(`백프레셔 상태 변경: ${event.oldState} -> ${event.newState}`);
        
        switch (event.newState) {
            case 'critical':
                await this.activateEmergencyMode();
                break;
            case 'throttled':
                await this.activateConservativeMode();
                break;
            case 'normal':
                await this.activateOptimalMode();
                break;
        }
    }

    async activateEmergencyMode() {
        // 응급 모드: 최소한의 리소스로 안정성 확보
        this.orchestrator.setConcurrency(2);
        this.resourceOptimizer.enableEmergencySettings();
        this.streamingEngine.enableLowMemoryMode();
        
        logger.warn('🚨 응급 모드 활성화됨');
    }

    async activateConservativeMode() {
        // 보수적 모드: 안정성 우선
        this.orchestrator.setConcurrency(Math.ceil(os.cpus().length / 2));
        this.resourceOptimizer.enableConservativeSettings();
        
        logger.info('⚠️ 보수적 모드 활성화됨');
    }

    async activateOptimalMode() {
        // 최적 모드: 성능 최대화
        this.orchestrator.setConcurrency(config.performance.getMaxConcurrent());
        this.resourceOptimizer.enableOptimalSettings();
        
        logger.info('⚡ 최적 모드 활성화됨');
    }

    getTools() {
        return [
            {
                name: 'optimize_file_processing',
                description: '파일 처리 최적화',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: '파일 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                useMemoryMap: { type: 'boolean', description: '메모리 매핑 사용' },
                                bufferSize: { type: 'integer', description: '버퍼 크기' },
                                chunkSize: { type: 'integer', description: '청크 크기' }
                            }
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'optimize_batch_processing',
                description: '배치 처리 최적화',
                parameters: {
                    type: 'object',
                    properties: {
                        paths: { type: 'array', items: { type: 'string' }, description: '파일 경로 목록' },
                        options: {
                            type: 'object',
                            properties: {
                                maxConcurrent: { type: 'integer', description: '최대 동시 처리 수' },
                                chunkSize: { type: 'integer', description: '청크 크기' },
                                useCache: { type: 'boolean', description: '캐시 사용' }
                            }
                        }
                    },
                    required: ['paths']
                }
            },
            {
                name: 'optimize_network_drive',
                description: '네트워크 드라이브 최적화',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: '네트워크 드라이브 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                bufferSize: { type: 'integer', description: '버퍼 크기' },
                                timeout: { type: 'integer', description: '타임아웃' },
                                retryCount: { type: 'integer', description: '재시도 횟수' }
                            }
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'manage_cache',
                description: '캐시 관리',
                parameters: {
                    type: 'object',
                    properties: {
                        action: { type: 'string', enum: ['clear', 'stats', 'optimize'], description: '캐시 작업' },
                        options: {
                            type: 'object',
                            properties: {
                                maxSize: { type: 'integer', description: '최대 캐시 크기' },
                                ttl: { type: 'integer', description: '캐시 유효 시간' }
                            }
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'monitor_performance',
                description: '성능 모니터링',
                parameters: {
                    type: 'object',
                    properties: {
                        metrics: { type: 'array', items: { type: 'string' }, description: '모니터링할 메트릭' },
                        options: {
                            type: 'object',
                            properties: {
                                interval: { type: 'integer', description: '모니터링 간격' },
                                duration: { type: 'integer', description: '모니터링 기간' }
                            }
                        }
                    },
                    required: ['metrics']
                }
            }
        ];
    }

    async optimizeFileProcessing(filePath, options = {}) {
        const {
            useMemoryMap = true,
            bufferSize = 8192,
            chunkSize = 1024 * 1024
        } = options;

        const worker = this.getAvailableWorker();
        return new Promise((resolve, reject) => {
            worker.once('message', (result) => {
                if (result.error) {
                    reject(new Error(result.error));
                } else {
                    resolve(result);
                }
            });

            worker.postMessage({
                type: 'optimize_file',
                data: {
                    filePath,
                    useMemoryMap,
                    bufferSize,
                    chunkSize
                }
            });
        });
    }

    async optimizeBatchProcessing(paths, options = {}) {
        const {
            maxConcurrent = 4,
            chunkSize = 1024 * 1024,
            useCache = true
        } = options;

        const worker = this.getAvailableWorker();
        return new Promise((resolve, reject) => {
            worker.once('message', (result) => {
                if (result.error) {
                    reject(new Error(result.error));
                } else {
                    resolve(result);
                }
            });

            worker.postMessage({
                type: 'optimize_batch',
                data: {
                    paths,
                    maxConcurrent,
                    chunkSize,
                    useCache
                }
            });
        });
    }

    async optimizeNetworkDrive(networkPath, options = {}) {
        const {
            bufferSize = 16384,
            timeout = 30000,
            retryCount = 3
        } = options;

        const worker = this.getAvailableWorker();
        return new Promise((resolve, reject) => {
            worker.once('message', (result) => {
                if (result.error) {
                    reject(new Error(result.error));
                } else {
                    resolve(result);
                }
            });

            worker.postMessage({
                type: 'optimize_network',
                data: {
                    networkPath,
                    bufferSize,
                    timeout,
                    retryCount
                }
            });
        });
    }

    async manageCache(action, options = {}) {
        const {
            maxSize = 1024 * 1024 * 1024, // 1GB
            ttl = 3600000 // 1시간
        } = options;

        switch (action) {
            case 'clear':
                this.cache.clear();
                return { status: 'cleared' };

            case 'stats':
                return {
                    size: this.getCacheSize(),
                    entries: this.cache.size,
                    hitRate: this.calculateHitRate()
                };

            case 'optimize':
                await this.optimizeCache(maxSize, ttl);
                return { status: 'optimized' };

            default:
                throw new Error('Invalid cache action');
        }
    }

    async monitorPerformance(metrics, options = {}) {
        const {
            interval = 1000,
            duration = 60000
        } = options;

        const worker = this.getAvailableWorker();
        return new Promise((resolve, reject) => {
            const results = [];
            const startTime = Date.now();

            const timer = setInterval(() => {
                if (Date.now() - startTime >= duration) {
                    clearInterval(timer);
                    resolve(results);
                }
            }, interval);

            worker.on('message', (result) => {
                if (result.type === 'metrics') {
                    results.push(result.data);
                }
            });

            worker.postMessage({
                type: 'monitor',
                data: {
                    metrics,
                    interval,
                    duration
                }
            });
        });
    }

    async initializeCache() {
        // 캐시 디렉토리 생성
        const cacheDir = path.join(config.cache.directory, 'performance');
        await fs.mkdir(cacheDir, { recursive: true });

        // 캐시 설정 로드
        const cacheConfig = config.cache.performance || {};
        this.cacheConfig = {
            maxSize: cacheConfig.maxSize || 1024 * 1024 * 1024, // 1GB
            ttl: cacheConfig.ttl || 3600000, // 1시간
            maxEntries: cacheConfig.maxEntries || 10000
        };
    }

    async initializeWatchers() {
        // 파일 시스템 감시 설정
        const watchConfig = config.watch || {};
        this.watchConfig = {
            ignored: watchConfig.ignored || /(^|[\/\\])\../,
            persistent: watchConfig.persistent || true,
            ignoreInitial: watchConfig.ignoreInitial || true,
            awaitWriteFinish: watchConfig.awaitWriteFinish || {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        };
    }

    getAvailableWorker() {
        const workers = Array.from(this.workers.values());
        return workers[Math.floor(Math.random() * workers.length)];
    }

    handleWorkerMessage(worker, message) {
        if (message.type === 'metrics') {
            this.emit('metrics', message.data);
        }
    }

    handleWorkerError(worker, error) {
        logger.error('Worker error:', error);
    }

    getCacheSize() {
        let size = 0;
        for (const [key, value] of this.cache.entries()) {
            size += key.length + JSON.stringify(value).length;
        }
        return size;
    }

    calculateHitRate() {
        const stats = this.cache.get('__stats__') || { hits: 0, misses: 0 };
        const total = stats.hits + stats.misses;
        return total > 0 ? stats.hits / total : 0;
    }

    async optimizeCache(maxSize, ttl) {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        let currentSize = this.getCacheSize();

        // TTL 기반 정리
        for (const [key, value] of entries) {
            if (key === '__stats__') continue;
            if (value.expiry && value.expiry < now) {
                this.cache.delete(key);
                currentSize -= key.length + JSON.stringify(value).length;
            }
        }

        // 크기 기반 정리
        if (currentSize > maxSize) {
            entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
            for (const [key, value] of entries) {
                if (key === '__stats__') continue;
                this.cache.delete(key);
                currentSize -= key.length + JSON.stringify(value).length;
                if (currentSize <= maxSize) break;
            }
        }
    }

    async watchDirectory(dirPath) {
        if (this.watchers.has(dirPath)) {
            return;
        }

        const watcher = chokidar.watch(dirPath, this.watchConfig);

        watcher
            .on('add', path => this.handleFileChange('add', path))
            .on('change', path => this.handleFileChange('change', path))
            .on('unlink', path => this.handleFileChange('unlink', path))
            .on('error', error => logger.error('Watcher error:', error));

        this.watchers.set(dirPath, watcher);
    }

    async unwatchDirectory(dirPath) {
        const watcher = this.watchers.get(dirPath);
        if (watcher) {
            await watcher.close();
            this.watchers.delete(dirPath);
        }
    }

    handleFileChange(event, filePath) {
        this.emit('fileChange', { event, filePath });
        this.cache.delete(filePath);
    }

    async createMemoryMap(filePath, size) {
        if (this.memoryMaps.has(filePath)) {
            return this.memoryMaps.get(filePath);
        }

        const fd = await fs.open(filePath, 'r+');
        const map = mmap.map(size, mmap.PROT_READ | mmap.PROT_WRITE, mmap.MAP_SHARED, fd.fd, 0);
        this.memoryMaps.set(filePath, map);
        return map;
    }

    async unmapMemory(filePath) {
        const map = this.memoryMaps.get(filePath);
        if (map) {
            mmap.unmap(map);
            this.memoryMaps.delete(filePath);
        }
    }
}

module.exports = PerformanceManager; 