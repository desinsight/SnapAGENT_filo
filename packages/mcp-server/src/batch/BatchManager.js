const { Worker } = require('worker_threads');
const path = require('path');
const { EventEmitter } = require('events');
const os = require('os');
const logger = require('../utils/logger');
const { config } = require('../config');

class AdaptiveWorkerPool {
    constructor(batchManager) {
        this.batchManager = batchManager;
        this.workers = new Map();
        this.workerStats = new Map(); // 워커별 성능 통계
        this.loadBalancer = new WorkerLoadBalancer();
        this.scaler = new WorkerScaler(this);
        this.performanceMonitor = new PerformanceMonitor();
        
        // 초기화
        this.minWorkers = config.worker.minPoolSize;
        this.maxWorkers = config.worker.maxPoolSize;
        this.targetWorkers = config.worker.getOptimalPoolSize();
        this.lastScaleTime = Date.now();
    }

    async initialize() {
        // 초기 워커 풀 생성
        const initialWorkers = this.targetWorkers;
        for (let i = 0; i < initialWorkers; i++) {
            await this.createWorker();
        }

        // 성능 모니터링 시작
        this.performanceMonitor.start();
        
        // 자동 스케일링 시작
        this.scaler.start();
        
        logger.info(`적응형 워커 풀 초기화 완료: ${initialWorkers}개 워커`);
    }

    async createWorker() {
        const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const worker = new Worker(path.join(__dirname, '../workers/batchWorker.js'), {
            workerData: { workerId }
        });

        // 워커 성능 통계 초기화
        this.workerStats.set(workerId, {
            id: workerId,
            created: Date.now(),
            tasksCompleted: 0,
            tasksActive: 0,
            totalProcessingTime: 0,
            avgProcessingTime: 0,
            errorCount: 0,
            lastTaskTime: 0,
            efficiency: 1.0,
            memoryUsage: 0,
            cpuUsage: 0
        });

        worker.on('message', (message) => {
            this.handleWorkerMessage(worker, workerId, message);
        });

        worker.on('error', (error) => {
            this.handleWorkerError(worker, workerId, error);
        });

        worker.on('exit', (code) => {
            this.handleWorkerExit(workerId, code);
        });

        this.workers.set(workerId, worker);
        this.loadBalancer.addWorker(workerId);

        return workerId;
    }

    async removeWorker(workerId) {
        const worker = this.workers.get(workerId);
        if (!worker) return;

        // 진행 중인 작업 완료 대기
        const stats = this.workerStats.get(workerId);
        if (stats && stats.tasksActive > 0) {
            // 새 작업 할당 중지
            this.loadBalancer.pauseWorker(workerId);
            
            // 최대 30초 대기
            const maxWait = 30000;
            const checkInterval = 1000;
            let waited = 0;
            
            while (stats.tasksActive > 0 && waited < maxWait) {
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                waited += checkInterval;
            }
        }

        // 워커 종료
        await worker.terminate();
        this.workers.delete(workerId);
        this.workerStats.delete(workerId);
        this.loadBalancer.removeWorker(workerId);

        logger.info(`워커 제거됨: ${workerId}`);
    }

    getBestWorker() {
        return this.loadBalancer.selectOptimalWorker(this.workerStats);
    }

    getWorkerStats() {
        return Array.from(this.workerStats.values());
    }

    async scale(targetSize) {
        const currentSize = this.workers.size;
        const diff = targetSize - currentSize;

        if (diff > 0) {
            // 스케일 업
            const promises = [];
            for (let i = 0; i < diff; i++) {
                promises.push(this.createWorker());
            }
            await Promise.all(promises);
            logger.info(`워커 풀 스케일 업: ${currentSize} -> ${targetSize}`);
        } else if (diff < 0) {
            // 스케일 다운
            const workersToRemove = this.loadBalancer.selectWorkersForRemoval(-diff, this.workerStats);
            const promises = workersToRemove.map(workerId => this.removeWorker(workerId));
            await Promise.all(promises);
            logger.info(`워커 풀 스케일 다운: ${currentSize} -> ${targetSize}`);
        }
    }

    handleWorkerMessage(worker, workerId, message) {
        const stats = this.workerStats.get(workerId);
        if (!stats) return;

        switch (message.type) {
            case 'task_started':
                stats.tasksActive++;
                stats.lastTaskTime = Date.now();
                break;
                
            case 'task_completed':
                stats.tasksActive--;
                stats.tasksCompleted++;
                const processingTime = Date.now() - stats.lastTaskTime;
                stats.totalProcessingTime += processingTime;
                stats.avgProcessingTime = stats.totalProcessingTime / stats.tasksCompleted;
                this.updateWorkerEfficiency(workerId);
                break;
                
            case 'task_failed':
                stats.tasksActive--;
                stats.errorCount++;
                this.updateWorkerEfficiency(workerId);
                break;
                
            case 'performance_metrics':
                stats.memoryUsage = message.data.memory;
                stats.cpuUsage = message.data.cpu;
                break;
        }

        // 메시지를 BatchManager로 전달
        this.batchManager.handleWorkerMessage(worker, message);
    }

    updateWorkerEfficiency(workerId) {
        const stats = this.workerStats.get(workerId);
        if (!stats) return;

        const successRate = stats.tasksCompleted / (stats.tasksCompleted + stats.errorCount);
        const speedScore = Math.max(0, 1 - (stats.avgProcessingTime / 10000)); // 10초 기준
        const reliabilityScore = Math.max(0, 1 - (stats.errorCount / Math.max(stats.tasksCompleted, 1)));
        
        stats.efficiency = (successRate * 0.4 + speedScore * 0.3 + reliabilityScore * 0.3);
    }

    handleWorkerError(worker, workerId, error) {
        const stats = this.workerStats.get(workerId);
        if (stats) {
            stats.errorCount++;
            this.updateWorkerEfficiency(workerId);
        }

        logger.error(`워커 오류 (${workerId}):`, error);
        this.batchManager.handleWorkerError(worker, error);
    }

    handleWorkerExit(workerId, code) {
        logger.warn(`워커 종료됨 (${workerId}): exit code ${code}`);
        
        // 비정상 종료인 경우 자동 재생성
        if (code !== 0 && this.workers.size < this.minWorkers) {
            setTimeout(() => {
                this.createWorker().catch(err => {
                    logger.error('워커 재생성 실패:', err);
                });
            }, 5000);
        }
    }
}

// 워커 로드 밸런서
class WorkerLoadBalancer {
    constructor() {
        this.roundRobinIndex = 0;
        this.pausedWorkers = new Set();
    }

    selectOptimalWorker(workerStats) {
        const activeWorkers = Array.from(workerStats.values())
            .filter(stats => !this.pausedWorkers.has(stats.id))
            .sort((a, b) => {
                // 효율성과 현재 부하를 고려한 선택
                const scoreA = a.efficiency / Math.max(a.tasksActive + 1, 1);
                const scoreB = b.efficiency / Math.max(b.tasksActive + 1, 1);
                return scoreB - scoreA;
            });

        return activeWorkers.length > 0 ? activeWorkers[0].id : null;
    }

    selectWorkersForRemoval(count, workerStats) {
        return Array.from(workerStats.values())
            .filter(stats => !this.pausedWorkers.has(stats.id))
            .sort((a, b) => a.efficiency - b.efficiency) // 낮은 효율성 우선
            .slice(0, count)
            .map(stats => stats.id);
    }

    addWorker(workerId) {
        // 워커 추가시 필요한 로직
    }

    removeWorker(workerId) {
        this.pausedWorkers.delete(workerId);
    }

    pauseWorker(workerId) {
        this.pausedWorkers.add(workerId);
    }

    resumeWorker(workerId) {
        this.pausedWorkers.delete(workerId);
    }
}

// 워커 스케일러
class WorkerScaler {
    constructor(workerPool) {
        this.workerPool = workerPool;
        this.scalingHistory = [];
        this.isScaling = false;
    }

    start() {
        this.scaleInterval = setInterval(() => {
            this.evaluateScaling();
        }, config.worker.scaling.scaleInterval);
    }

    stop() {
        if (this.scaleInterval) {
            clearInterval(this.scaleInterval);
        }
    }

    async evaluateScaling() {
        if (this.isScaling) return;

        const metrics = config.performance.getMetrics();
        const currentWorkers = this.workerPool.workers.size;
        const optimalWorkers = config.worker.getOptimalPoolSize();
        
        // 시스템 부하 확인
        const { memory, cpu, severe } = metrics.backpressure;
        
        let targetWorkers = currentWorkers;

        if (severe) {
            // 심각한 부하시 워커 감소
            targetWorkers = Math.max(this.workerPool.minWorkers, Math.floor(currentWorkers * 0.7));
        } else if (memory || cpu) {
            // 부하가 있으면 보수적으로 조절
            targetWorkers = Math.max(this.workerPool.minWorkers, currentWorkers - 1);
        } else {
            // 정상 상태에서 최적화
            const avgLoad = this.calculateAverageLoad();
            
            if (avgLoad > config.worker.scaling.scaleUpThreshold) {
                targetWorkers = Math.min(this.workerPool.maxWorkers, optimalWorkers);
            } else if (avgLoad < config.worker.scaling.scaleDownThreshold) {
                targetWorkers = Math.max(this.workerPool.minWorkers, currentWorkers - 1);
            }
        }

        if (targetWorkers !== currentWorkers) {
            this.isScaling = true;
            try {
                await this.workerPool.scale(targetWorkers);
                this.recordScaling(currentWorkers, targetWorkers, metrics);
            } finally {
                this.isScaling = false;
            }
        }
    }

    calculateAverageLoad() {
        const workers = this.workerPool.getWorkerStats();
        if (workers.length === 0) return 0;

        const totalLoad = workers.reduce((sum, worker) => sum + worker.tasksActive, 0);
        return totalLoad / workers.length;
    }

    recordScaling(from, to, metrics) {
        this.scalingHistory.push({
            timestamp: Date.now(),
            from,
            to,
            reason: this.getScalingReason(metrics),
            metrics: {
                memory: metrics.memory.usage,
                cpu: metrics.cpu.usage,
                load: this.calculateAverageLoad()
            }
        });

        // 히스토리 크기 제한
        if (this.scalingHistory.length > 100) {
            this.scalingHistory = this.scalingHistory.slice(-50);
        }
    }

    getScalingReason(metrics) {
        if (metrics.backpressure.severe) return 'severe_backpressure';
        if (metrics.backpressure.memory) return 'memory_pressure';
        if (metrics.backpressure.cpu) return 'cpu_pressure';
        
        const load = this.calculateAverageLoad();
        if (load > config.worker.scaling.scaleUpThreshold) return 'high_load';
        if (load < config.worker.scaling.scaleDownThreshold) return 'low_load';
        
        return 'optimization';
    }
}

// 성능 모니터
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            cpu: [],
            memory: [],
            throughput: []
        };
        this.lastGC = 0;
    }

    start() {
        this.monitorInterval = setInterval(() => {
            this.collectMetrics();
        }, config.performance.updateInterval);
    }

    stop() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
    }

    collectMetrics() {
        const metrics = config.performance.getMetrics();
        
        // 메트릭 저장
        this.metrics.cpu.push({
            timestamp: Date.now(),
            usage: metrics.cpu.usage
        });
        
        this.metrics.memory.push({
            timestamp: Date.now(),
            usage: metrics.memory.usage,
            heap: process.memoryUsage().heapUsed
        });

        // 메트릭 히스토리 제한
        const maxHistory = 1000;
        Object.keys(this.metrics).forEach(key => {
            if (this.metrics[key].length > maxHistory) {
                this.metrics[key] = this.metrics[key].slice(-500);
            }
        });

        // 가비지 컬렉션 트리거
        this.checkGarbageCollection(metrics);
    }

    checkGarbageCollection(metrics) {
        const now = Date.now();
        const memoryUsage = metrics.memory.usage;
        
        if (memoryUsage > config.performance.memory.gcThreshold && 
            now - this.lastGC > 30000) { // 30초 간격
            
            if (global.gc) {
                global.gc();
                this.lastGC = now;
                logger.debug('강제 가비지 컬렉션 실행됨');
            }
        }
    }
}

class BatchManager extends EventEmitter {
    constructor() {
        super();
        this.workerPool = new AdaptiveWorkerPool(this);
        this.jobs = new Map();
        this.jobQueue = [];
        this.priorityQueue = []; // 우선순위 큐 추가
        this.isProcessing = false;
        this.retryAttempts = 3;
        this.retryDelay = 5000;
        this.throughputTracker = new ThroughputTracker();
    }

    async initialize() {
        await this.workerPool.initialize();
        this.throughputTracker.start();
        logger.info('고성능 BatchManager 초기화 완료');
    }

    getTools() {
        return [
            {
                name: 'batch_copy',
                description: '대량 파일 복사 작업',
                parameters: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', description: '소스 경로' },
                        destination: { type: 'string', description: '대상 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                recursive: { type: 'boolean', description: '하위 폴더 포함' },
                                overwrite: { type: 'boolean', description: '덮어쓰기' },
                                preserveTimestamps: { type: 'boolean', description: '타임스탬프 유지' },
                                filter: { type: 'string', description: '파일 필터 패턴' }
                            }
                        }
                    },
                    required: ['source', 'destination']
                }
            },
            {
                name: 'batch_move',
                description: '대량 파일 이동 작업',
                parameters: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', description: '소스 경로' },
                        destination: { type: 'string', description: '대상 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                recursive: { type: 'boolean', description: '하위 폴더 포함' },
                                overwrite: { type: 'boolean', description: '덮어쓰기' },
                                preserveTimestamps: { type: 'boolean', description: '타임스탬프 유지' },
                                filter: { type: 'string', description: '파일 필터 패턴' }
                            }
                        }
                    },
                    required: ['source', 'destination']
                }
            },
            {
                name: 'batch_delete',
                description: '대량 파일 삭제 작업',
                parameters: {
                    type: 'object',
                    properties: {
                        paths: { type: 'array', items: { type: 'string' }, description: '삭제할 파일/폴더 경로 목록' },
                        options: {
                            type: 'object',
                            properties: {
                                recursive: { type: 'boolean', description: '하위 폴더 포함' },
                                force: { type: 'boolean', description: '강제 삭제' }
                            }
                        }
                    },
                    required: ['paths']
                }
            },
            {
                name: 'batch_compress',
                description: '대량 파일 압축 작업',
                parameters: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', description: '소스 경로' },
                        destination: { type: 'string', description: '대상 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                format: { type: 'string', enum: ['zip', 'tar', '7z'], description: '압축 형식' },
                                level: { type: 'integer', minimum: 0, maximum: 9, description: '압축 레벨' },
                                password: { type: 'string', description: '암호화 비밀번호' }
                            }
                        }
                    },
                    required: ['source', 'destination']
                }
            },
            {
                name: 'batch_extract',
                description: '대량 파일 압축 해제 작업',
                parameters: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', description: '소스 경로' },
                        destination: { type: 'string', description: '대상 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                password: { type: 'string', description: '암호화 비밀번호' },
                                overwrite: { type: 'boolean', description: '덮어쓰기' }
                            }
                        }
                    },
                    required: ['source', 'destination']
                }
            },
            {
                name: 'batch_rename',
                description: '대량 파일 이름 변경 작업',
                parameters: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', description: '소스 경로' },
                        pattern: { type: 'string', description: '변경 패턴' },
                        options: {
                            type: 'object',
                            properties: {
                                recursive: { type: 'boolean', description: '하위 폴더 포함' },
                                caseSensitive: { type: 'boolean', description: '대소문자 구분' },
                                useRegex: { type: 'boolean', description: '정규식 사용' }
                            }
                        }
                    },
                    required: ['source', 'pattern']
                }
            },
            {
                name: 'get_job_status',
                description: '작업 상태 조회',
                parameters: {
                    type: 'object',
                    properties: {
                        jobId: { type: 'string', description: '작업 ID' }
                    },
                    required: ['jobId']
                }
            },
            {
                name: 'pause_job',
                description: '작업 일시정지',
                parameters: {
                    type: 'object',
                    properties: {
                        jobId: { type: 'string', description: '작업 ID' }
                    },
                    required: ['jobId']
                }
            },
            {
                name: 'resume_job',
                description: '작업 재개',
                parameters: {
                    type: 'object',
                    properties: {
                        jobId: { type: 'string', description: '작업 ID' }
                    },
                    required: ['jobId']
                }
            },
            {
                name: 'cancel_job',
                description: '작업 취소',
                parameters: {
                    type: 'object',
                    properties: {
                        jobId: { type: 'string', description: '작업 ID' }
                    },
                    required: ['jobId']
                }
            },
            {
                name: 'get_job_report',
                description: '작업 리포트 생성',
                parameters: {
                    type: 'object',
                    properties: {
                        jobId: { type: 'string', description: '작업 ID' },
                        format: { type: 'string', enum: ['json', 'csv', 'html'], description: '리포트 형식' }
                    },
                    required: ['jobId']
                }
            }
        ];
    }

    async batchCopy(source, destination, options = {}) {
        return this.createJob('copy', { source, destination, options });
    }

    async batchMove(source, destination, options = {}) {
        return this.createJob('move', { source, destination, options });
    }

    async batchDelete(paths, options = {}) {
        return this.createJob('delete', { paths, options });
    }

    async batchCompress(source, destination, options = {}) {
        return this.createJob('compress', { source, destination, options });
    }

    async batchExtract(source, destination, options = {}) {
        return this.createJob('extract', { source, destination, options });
    }

    async batchRename(source, pattern, options = {}) {
        return this.createJob('rename', { source, pattern, options });
    }

    async getJobStatus(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error('Job not found');
        }
        return {
            id: job.id,
            type: job.type,
            status: job.status,
            progress: job.progress,
            total: job.total,
            processed: job.processed,
            failed: job.failed,
            startTime: job.startTime,
            endTime: job.endTime,
            error: job.error
        };
    }

    async pauseJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error('Job not found');
        }
        if (job.status !== 'running') {
            throw new Error('Job is not running');
        }
        job.status = 'paused';
        job.worker.postMessage({ type: 'pause' });
        return { status: 'paused' };
    }

    async resumeJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error('Job not found');
        }
        if (job.status !== 'paused') {
            throw new Error('Job is not paused');
        }
        job.status = 'running';
        job.worker.postMessage({ type: 'resume' });
        return { status: 'running' };
    }

    async cancelJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error('Job not found');
        }
        if (job.status === 'completed' || job.status === 'failed') {
            throw new Error('Job is already finished');
        }
        job.status = 'cancelled';
        job.worker.postMessage({ type: 'cancel' });
        return { status: 'cancelled' };
    }

    async getJobReport(jobId, format = 'json') {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        const report = {
            id: job.id,
            type: job.type,
            status: job.status,
            progress: job.progress,
            total: job.total,
            processed: job.processed,
            failed: job.failed,
            startTime: job.startTime,
            endTime: job.endTime,
            duration: job.endTime ? job.endTime - job.startTime : Date.now() - job.startTime,
            error: job.error,
            details: job.details || {}
        };

        switch (format) {
            case 'json':
                return report;
            case 'csv':
                return this.generateCsvReport(report);
            case 'html':
                return this.generateHtmlReport(report);
            default:
                throw new Error('Unsupported report format');
        }
    }

    async createJob(type, data) {
        const jobId = Date.now().toString();
        const job = {
            id: jobId,
            type,
            data,
            status: 'pending',
            progress: 0,
            total: 0,
            processed: 0,
            failed: 0,
            startTime: Date.now(),
            endTime: null,
            error: null,
            details: {},
            retryCount: 0
        };

        this.jobs.set(jobId, job);
        this.jobQueue.push(jobId);
        this.processQueue();

        return { jobId, status: 'pending' };
    }

    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.jobQueue.length > 0) {
            const availableWorkers = Array.from(this.workers.values())
                .filter(worker => !worker.busy);

            if (availableWorkers.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            const jobId = this.jobQueue.shift();
            const job = this.jobs.get(jobId);
            const worker = availableWorkers[0];

            worker.busy = true;
            job.worker = worker;
            job.status = 'running';

            worker.postMessage({
                type: job.type,
                jobId: job.id,
                data: job.data
            });
        }

        this.isProcessing = false;
    }

    handleWorkerMessage(worker, message) {
        const { jobId, type, data } = message;
        const job = this.jobs.get(jobId);

        if (!job) return;

        switch (type) {
            case 'progress':
                job.progress = data.progress;
                job.total = data.total;
                job.processed = data.processed;
                job.failed = data.failed;
                job.details = data.details;
                this.emit('progress', job);
                break;

            case 'completed':
                job.status = 'completed';
                job.progress = 100;
                job.endTime = Date.now();
                job.details = data;
                worker.busy = false;
                this.emit('completed', job);
                this.processQueue();
                break;

            case 'error':
                if (job.retryCount < this.retryAttempts) {
                    job.retryCount++;
                    setTimeout(() => {
                        job.status = 'pending';
                        this.jobQueue.unshift(jobId);
                        this.processQueue();
                    }, this.retryDelay);
                } else {
                    job.status = 'failed';
                    job.error = data.error;
                    job.endTime = Date.now();
                    worker.busy = false;
                    this.emit('failed', job);
                    this.processQueue();
                }
                break;
        }
    }

    handleWorkerError(worker, error) {
        logger.error('Worker error:', error);
        worker.busy = false;
        this.processQueue();
    }

    generateCsvReport(report) {
        const headers = ['ID', 'Type', 'Status', 'Progress', 'Total', 'Processed', 'Failed', 'Start Time', 'End Time', 'Duration', 'Error'];
        const values = [
            report.id,
            report.type,
            report.status,
            report.progress,
            report.total,
            report.processed,
            report.failed,
            new Date(report.startTime).toISOString(),
            report.endTime ? new Date(report.endTime).toISOString() : '',
            report.duration,
            report.error || ''
        ];

        return headers.join(',') + '\n' + values.join(',');
    }

    generateHtmlReport(report) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Job Report - ${report.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report { max-width: 800px; margin: 0 auto; }
                    .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
                    .details { margin-top: 20px; }
                    .progress { margin: 20px 0; }
                    .progress-bar { background: #eee; height: 20px; border-radius: 10px; }
                    .progress-value { background: #4CAF50; height: 100%; border-radius: 10px; }
                    .error { color: red; }
                </style>
            </head>
            <body>
                <div class="report">
                    <div class="header">
                        <h1>Job Report</h1>
                        <p>ID: ${report.id}</p>
                        <p>Type: ${report.type}</p>
                        <p>Status: ${report.status}</p>
                    </div>
                    <div class="progress">
                        <h3>Progress</h3>
                        <div class="progress-bar">
                            <div class="progress-value" style="width: ${report.progress}%"></div>
                        </div>
                        <p>${report.progress}% complete</p>
                    </div>
                    <div class="details">
                        <h3>Details</h3>
                        <p>Total: ${report.total}</p>
                        <p>Processed: ${report.processed}</p>
                        <p>Failed: ${report.failed}</p>
                        <p>Start Time: ${new Date(report.startTime).toISOString()}</p>
                        <p>End Time: ${report.endTime ? new Date(report.endTime).toISOString() : 'N/A'}</p>
                        <p>Duration: ${report.duration}ms</p>
                        ${report.error ? `<p class="error">Error: ${report.error}</p>` : ''}
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = BatchManager; 