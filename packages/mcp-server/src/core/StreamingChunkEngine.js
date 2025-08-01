import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline, Transform } from 'stream';
import { promisify } from 'util';
import { Worker } from 'worker_threads';
import path from 'path';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

const pipelineAsync = promisify(pipeline);

/**
 * 고성능 스트리밍 청크 처리 엔진
 * - 대용량 파일을 청크로 분할하여 병렬 처리
 * - 동적 청크 크기 조절
 * - 백프레셔 관리
 * - 메모리 효율적 스트리밍
 */
export class StreamingChunkEngine extends EventEmitter {
    constructor() {
        super();
        this.activeStreams = new Map();
        this.chunkProcessors = new Map();
        this.backpressureManager = new BackpressureManager();
        this.throughputOptimizer = new ThroughputOptimizer();
        this.memoryManager = new StreamMemoryManager();
    }

    /**
     * 대용량 파일을 청크로 분할하여 병렬 처리
     */
    async processFileInChunks(filePath, options = {}) {
        const {
            processor,
            chunkSize = config.fileSystem.getOptimalChunkSize(),
            maxConcurrent = config.performance.getMaxConcurrent(),
            outputPath,
            enableBackpressure = true,
            onProgress,
            onChunkComplete
        } = options;

        const jobId = `chunk_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            // 파일 정보 수집
            const stats = await fs.stat(filePath);
            const fileSize = stats.size;
            const optimalChunkSize = config.fileSystem.getOptimalChunkSize(fileSize);
            const finalChunkSize = chunkSize || optimalChunkSize;
            
            logger.info(`청크 처리 시작: ${filePath} (${fileSize} bytes, 청크: ${finalChunkSize} bytes)`);

            // 청크 계획 수립
            const chunkPlan = this.createChunkPlan(fileSize, finalChunkSize);
            
            // 처리 상태 초기화
            const processingState = {
                jobId,
                filePath,
                totalChunks: chunkPlan.chunks.length,
                completedChunks: 0,
                failedChunks: 0,
                startTime: Date.now(),
                bytesProcessed: 0,
                results: []
            };

            this.activeStreams.set(jobId, processingState);

            // 백프레셔 모니터링 시작
            if (enableBackpressure) {
                this.backpressureManager.startMonitoring(jobId);
            }

            // 청크 병렬 처리
            const results = await this.processChunksInParallel(
                filePath,
                chunkPlan,
                processor,
                maxConcurrent,
                processingState,
                { onProgress, onChunkComplete }
            );

            // 결과 병합 (필요한 경우)
            if (outputPath) {
                await this.mergeChunkResults(results, outputPath);
            }

            // 정리
            this.activeStreams.delete(jobId);
            if (enableBackpressure) {
                this.backpressureManager.stopMonitoring(jobId);
            }

            const processingTime = Date.now() - processingState.startTime;
            const throughput = fileSize / (processingTime / 1000); // bytes/sec

            logger.info(`청크 처리 완료: ${jobId} (${processingTime}ms, ${Math.round(throughput/1024/1024)}MB/s)`);

            return {
                jobId,
                success: true,
                totalChunks: processingState.totalChunks,
                completedChunks: processingState.completedChunks,
                failedChunks: processingState.failedChunks,
                processingTime,
                throughput,
                results
            };

        } catch (error) {
            logger.error(`청크 처리 실패: ${jobId}`, error);
            this.activeStreams.delete(jobId);
            throw error;
        }
    }

    /**
     * 청크 계획 수립
     */
    createChunkPlan(fileSize, chunkSize) {
        const chunks = [];
        let offset = 0;

        while (offset < fileSize) {
            const currentChunkSize = Math.min(chunkSize, fileSize - offset);
            chunks.push({
                id: chunks.length,
                start: offset,
                end: offset + currentChunkSize - 1,
                size: currentChunkSize
            });
            offset += currentChunkSize;
        }

        return {
            totalSize: fileSize,
            chunkSize,
            chunks
        };
    }

    /**
     * 청크 병렬 처리
     */
    async processChunksInParallel(filePath, chunkPlan, processor, maxConcurrent, state, callbacks) {
        const semaphore = new Semaphore(maxConcurrent);
        const promises = [];

        for (const chunk of chunkPlan.chunks) {
            const promise = semaphore.acquire().then(async (release) => {
                try {
                    // 백프레셔 체크
                    if (this.backpressureManager.shouldThrottle(state.jobId)) {
                        await this.backpressureManager.waitForRelief(state.jobId);
                    }

                    const result = await this.processChunk(filePath, chunk, processor, state.jobId);
                    
                    // 진행 상황 업데이트
                    state.completedChunks++;
                    state.bytesProcessed += chunk.size;
                    
                    if (callbacks.onProgress) {
                        callbacks.onProgress({
                            jobId: state.jobId,
                            completedChunks: state.completedChunks,
                            totalChunks: state.totalChunks,
                            bytesProcessed: state.bytesProcessed,
                            progress: (state.completedChunks / state.totalChunks) * 100
                        });
                    }

                    if (callbacks.onChunkComplete) {
                        callbacks.onChunkComplete(chunk.id, result);
                    }

                    return result;

                } catch (error) {
                    state.failedChunks++;
                    logger.error(`청크 처리 실패 (${state.jobId}:${chunk.id}):`, error);
                    throw error;
                } finally {
                    release();
                }
            });

            promises.push(promise);
        }

        return Promise.allSettled(promises);
    }

    /**
     * 개별 청크 처리
     */
    async processChunk(filePath, chunk, processor, jobId) {
        const chunkId = `${jobId}_chunk_${chunk.id}`;
        
        return new Promise((resolve, reject) => {
            const stream = createReadStream(filePath, {
                start: chunk.start,
                end: chunk.end,
                highWaterMark: this.calculateOptimalBufferSize(chunk.size)
            });

            const chunkData = [];
            let bytesRead = 0;

            stream.on('data', (buffer) => {
                chunkData.push(buffer);
                bytesRead += buffer.length;
                
                // 메모리 사용량 모니터링
                this.memoryManager.trackChunkMemory(chunkId, bytesRead);
            });

            stream.on('end', async () => {
                try {
                    const fullBuffer = Buffer.concat(chunkData);
                    
                    // 프로세서 실행
                    const result = await processor(fullBuffer, chunk, jobId);
                    
                    // 메모리 정리
                    this.memoryManager.releaseChunkMemory(chunkId);
                    
                    resolve({
                        chunkId: chunk.id,
                        size: bytesRead,
                        result
                    });
                } catch (error) {
                    this.memoryManager.releaseChunkMemory(chunkId);
                    reject(error);
                }
            });

            stream.on('error', (error) => {
                this.memoryManager.releaseChunkMemory(chunkId);
                reject(error);
            });
        });
    }

    /**
     * 스트리밍 변환 처리
     */
    async createTransformStream(transformFn, options = {}) {
        const {
            chunkSize = config.fileSystem.getOptimalChunkSize(),
            enableBackpressure = true,
            bufferSize = chunkSize
        } = options;

        return new Transform({
            highWaterMark: bufferSize,
            objectMode: false,
            
            transform(chunk, encoding, callback) {
                try {
                    // 백프레셔 체크
                    if (enableBackpressure && this.backpressureManager.shouldThrottle()) {
                        setImmediate(() => {
                            this.backpressureManager.waitForRelief().then(() => {
                                const result = transformFn(chunk);
                                callback(null, result);
                            });
                        });
                    } else {
                        const result = transformFn(chunk);
                        callback(null, result);
                    }
                } catch (error) {
                    callback(error);
                }
            }
        });
    }

    /**
     * 청크 결과 병합
     */
    async mergeChunkResults(results, outputPath) {
        const writeStream = createWriteStream(outputPath);
        
        // 성공한 결과만 순서대로 병합
        const successfulResults = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value)
            .sort((a, b) => a.chunkId - b.chunkId);

        for (const result of successfulResults) {
            if (result.result && Buffer.isBuffer(result.result)) {
                writeStream.write(result.result);
            }
        }

        writeStream.end();
        
        return new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    }

    /**
     * 최적 버퍼 크기 계산
     */
    calculateOptimalBufferSize(chunkSize) {
        const metrics = config.performance.getMetrics();
        const memoryUsage = metrics.memory.usage;
        
        // 메모리 사용률에 따른 버퍼 크기 조절
        let multiplier = 1;
        if (memoryUsage > 0.8) {
            multiplier = 0.5; // 메모리 부족시 버퍼 감소
        } else if (memoryUsage < 0.3) {
            multiplier = 2; // 여유로울 때 버퍼 증가
        }

        const baseBuffer = 64 * 1024; // 64KB 기본
        const maxBuffer = 1024 * 1024; // 1MB 최대
        
        return Math.min(baseBuffer * multiplier, maxBuffer, chunkSize / 4);
    }

    /**
     * 활성 스트림 상태 조회
     */
    getStreamingStatus() {
        const status = [];
        
        for (const [jobId, state] of this.activeStreams.entries()) {
            status.push({
                jobId,
                filePath: state.filePath,
                progress: (state.completedChunks / state.totalChunks) * 100,
                completedChunks: state.completedChunks,
                totalChunks: state.totalChunks,
                failedChunks: state.failedChunks,
                bytesProcessed: state.bytesProcessed,
                elapsedTime: Date.now() - state.startTime,
                estimatedTimeRemaining: this.calculateETA(state)
            });
        }

        return status;
    }

    calculateETA(state) {
        if (state.completedChunks === 0) return null;
        
        const elapsedTime = Date.now() - state.startTime;
        const avgTimePerChunk = elapsedTime / state.completedChunks;
        const remainingChunks = state.totalChunks - state.completedChunks;
        
        return remainingChunks * avgTimePerChunk;
    }

    /**
     * 정리
     */
    async cleanup() {
        // 모든 활성 스트림 종료
        for (const jobId of this.activeStreams.keys()) {
            this.backpressureManager.stopMonitoring(jobId);
        }
        
        this.activeStreams.clear();
        this.memoryManager.cleanup();
    }
}

/**
 * 백프레셔 관리자
 */
class BackpressureManager {
    constructor() {
        this.monitoredJobs = new Set();
        this.thresholds = {
            memory: 0.8,
            cpu: 0.9,
            concurrency: 0.85
        };
    }

    startMonitoring(jobId) {
        this.monitoredJobs.add(jobId);
    }

    stopMonitoring(jobId) {
        this.monitoredJobs.delete(jobId);
    }

    shouldThrottle(jobId = null) {
        const metrics = config.performance.getMetrics();
        const { memory, cpu, severe } = metrics.backpressure;
        
        return severe || memory || cpu;
    }

    async waitForRelief(jobId = null, maxWait = 30000) {
        const startTime = Date.now();
        
        while (this.shouldThrottle(jobId)) {
            if (Date.now() - startTime > maxWait) {
                logger.warn(`백프레셔 해제 타임아웃: ${jobId}`);
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

/**
 * 스트림 메모리 관리자
 */
class StreamMemoryManager {
    constructor() {
        this.chunkMemoryUsage = new Map();
        this.totalMemoryUsed = 0;
        this.maxMemoryLimit = os.totalmem() * config.performance.memory.bufferPoolLimit;
    }

    trackChunkMemory(chunkId, bytesUsed) {
        const previousUsage = this.chunkMemoryUsage.get(chunkId) || 0;
        this.chunkMemoryUsage.set(chunkId, bytesUsed);
        this.totalMemoryUsed += (bytesUsed - previousUsage);
    }

    releaseChunkMemory(chunkId) {
        const usage = this.chunkMemoryUsage.get(chunkId) || 0;
        this.chunkMemoryUsage.delete(chunkId);
        this.totalMemoryUsed -= usage;
    }

    isMemoryLimitExceeded() {
        return this.totalMemoryUsed > this.maxMemoryLimit;
    }

    getMemoryUsage() {
        return {
            used: this.totalMemoryUsed,
            limit: this.maxMemoryLimit,
            utilization: this.totalMemoryUsed / this.maxMemoryLimit,
            activeChunks: this.chunkMemoryUsage.size
        };
    }

    cleanup() {
        this.chunkMemoryUsage.clear();
        this.totalMemoryUsed = 0;
    }
}

/**
 * 처리량 최적화기
 */
class ThroughputOptimizer {
    constructor() {
        this.performanceHistory = [];
        this.optimizationStrategies = new Map();
    }

    recordPerformance(jobId, metrics) {
        this.performanceHistory.push({
            timestamp: Date.now(),
            jobId,
            ...metrics
        });

        // 히스토리 크기 제한
        if (this.performanceHistory.length > 1000) {
            this.performanceHistory = this.performanceHistory.slice(-500);
        }
    }

    getOptimizedParameters(fileSize, fileType) {
        const historical = this.getHistoricalPerformance(fileSize, fileType);
        
        if (historical.length === 0) {
            return this.getDefaultParameters(fileSize);
        }

        // 최고 성능을 보인 파라미터 조합 찾기
        const bestPerformance = historical.reduce((best, current) => {
            return current.throughput > best.throughput ? current : best;
        });

        return {
            chunkSize: bestPerformance.chunkSize,
            maxConcurrent: bestPerformance.maxConcurrent,
            bufferSize: bestPerformance.bufferSize
        };
    }

    getHistoricalPerformance(fileSize, fileType) {
        const sizeTolerance = fileSize * 0.1; // 10% 오차 허용
        
        return this.performanceHistory.filter(record => {
            return Math.abs(record.fileSize - fileSize) <= sizeTolerance &&
                   record.fileType === fileType;
        });
    }

    getDefaultParameters(fileSize) {
        return {
            chunkSize: config.fileSystem.getOptimalChunkSize(fileSize),
            maxConcurrent: config.performance.getMaxConcurrent(),
            bufferSize: Math.min(1024 * 1024, fileSize / 10)
        };
    }
}

/**
 * 세마포어 (동시 실행 제한)
 */
class Semaphore {
    constructor(max) {
        this.max = max;
        this.current = 0;
        this.queue = [];
    }

    async acquire() {
        return new Promise((resolve) => {
            if (this.current < this.max) {
                this.current++;
                resolve(() => this.release());
            } else {
                this.queue.push(() => {
                    this.current++;
                    resolve(() => this.release());
                });
            }
        });
    }

    release() {
        this.current--;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            next();
        }
    }
}

export default StreamingChunkEngine;