import fs from 'fs/promises';
import path from 'path';
import { Worker } from 'worker_threads';
import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

export class AnalysisEngine {
  constructor() {
    this.workers = new Map();
    this.cache = new Map();
    this.metrics = new Map();
  }

  async initialize() {
    // 워커 풀 초기화
    for (let i = 0; i < config.worker.poolSize; i++) {
      const worker = new Worker('./workers/analysisWorker.js');
      this.workers.set(i, worker);
    }

    // 기본 메트릭 초기화
    this.initializeMetrics();
  }

  async getTools() {
    return [
      {
        name: 'analyze_disk_usage',
        description: '디스크 사용량을 분석합니다.',
        parameters: {
          path: { type: 'string', description: '분석할 경로' },
          options: { type: 'object', description: '분석 옵션' }
        },
        execute: this.analyzeDiskUsage.bind(this)
      },
      {
        name: 'analyze_folder_sizes',
        description: '폴더 크기를 분석합니다.',
        parameters: {
          path: { type: 'string', description: '분석할 경로' },
          options: { type: 'object', description: '분석 옵션' }
        },
        execute: this.analyzeFolderSizes.bind(this)
      },
      {
        name: 'analyze_file_types',
        description: '파일 타입별 통계를 분석합니다.',
        parameters: {
          path: { type: 'string', description: '분석할 경로' },
          options: { type: 'object', description: '분석 옵션' }
        },
        execute: this.analyzeFileTypes.bind(this)
      },
      {
        name: 'analyze_access_patterns',
        description: '파일 액세스 패턴을 분석합니다.',
        parameters: {
          path: { type: 'string', description: '분석할 경로' },
          options: { type: 'object', description: '분석 옵션' }
        },
        execute: this.analyzeAccessPatterns.bind(this)
      },
      {
        name: 'predict_growth',
        description: '디스크 사용량 성장률을 예측합니다.',
        parameters: {
          path: { type: 'string', description: '분석할 경로' },
          options: { type: 'object', description: '분석 옵션' }
        },
        execute: this.predictGrowth.bind(this)
      },
      {
        name: 'find_large_files',
        description: '용량이 큰 파일을 찾습니다.',
        parameters: {
          path: { type: 'string', description: '분석할 경로' },
          options: { type: 'object', description: '분석 옵션' }
        },
        execute: this.findLargeFiles.bind(this)
      },
      {
        name: 'track_file_lifecycle',
        description: '파일 수명 주기를 추적합니다.',
        parameters: {
          path: { type: 'string', description: '분석할 경로' },
          options: { type: 'object', description: '분석 옵션' }
        },
        execute: this.trackFileLifecycle.bind(this)
      }
    ];
  }

  async analyzeDiskUsage({ path, options = {} }) {
    try {
      const {
        recursive = true,
        includeHidden = false,
        minSize = 0
      } = options;

      const stats = {
        totalSize: 0,
        fileCount: 0,
        dirCount: 0,
        errors: 0
      };

      const processFile = async (filePath) => {
        try {
          const fileStats = await fs.stat(filePath);
          if (fileStats.size >= minSize) {
            stats.totalSize += fileStats.size;
            stats.fileCount++;
          }
        } catch (e) {
          logger.warn(`파일 분석 실패: ${filePath}`, e);
          stats.errors++;
        }
      };

      const processDirectory = async (dirPath) => {
        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
              if (recursive) {
                await processDirectory(fullPath);
              }
              stats.dirCount++;
            } else {
              if (!includeHidden && entry.name.startsWith('.')) continue;
              await processFile(fullPath);
            }
          }
        } catch (e) {
          logger.warn(`디렉토리 분석 실패: ${dirPath}`, e);
          stats.errors++;
        }
      };

      await processDirectory(path);
      return stats;
    } catch (error) {
      logger.error('디스크 사용량 분석 실패:', error);
      throw error;
    }
  }

  async analyzeFolderSizes({ path, options = {} }) {
    try {
      const {
        recursive = true,
        includeHidden = false,
        minSize = 0,
        maxDepth = Infinity
      } = options;

      const folderSizes = new Map();

      const processDirectory = async (dirPath, depth = 0) => {
        if (depth > maxDepth) return;

        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          let totalSize = 0;
          
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
              if (recursive) {
                const subDirSize = await processDirectory(fullPath, depth + 1);
                totalSize += subDirSize;
              }
            } else {
              if (!includeHidden && entry.name.startsWith('.')) continue;
              try {
                const fileStats = await fs.stat(fullPath);
                totalSize += fileStats.size;
              } catch (e) {
                logger.warn(`파일 분석 실패: ${fullPath}`, e);
              }
            }
          }

          if (totalSize >= minSize) {
            folderSizes.set(dirPath, totalSize);
          }

          return totalSize;
        } catch (e) {
          logger.warn(`디렉토리 분석 실패: ${dirPath}`, e);
          return 0;
        }
      };

      await processDirectory(path);

      // 크기별로 정렬
      const sortedFolders = Array.from(folderSizes.entries())
        .sort((a, b) => b[1] - a[1]);

      return {
        folders: sortedFolders,
        totalFolders: folderSizes.size
      };
    } catch (error) {
      logger.error('폴더 크기 분석 실패:', error);
      throw error;
    }
  }

  async analyzeFileTypes({ path, options = {} }) {
    try {
      const {
        recursive = true,
        includeHidden = false,
        minCount = 0
      } = options;

      const typeStats = new Map();

      const processFile = async (filePath) => {
        try {
          const ext = path.extname(filePath).toLowerCase().slice(1) || 'no_extension';
          const stats = await fs.stat(filePath);
          
          if (!typeStats.has(ext)) {
            typeStats.set(ext, {
              count: 0,
              totalSize: 0,
              avgSize: 0,
              largestFile: { path: filePath, size: stats.size }
            });
          }

          const typeStat = typeStats.get(ext);
          typeStat.count++;
          typeStat.totalSize += stats.size;
          typeStat.avgSize = typeStat.totalSize / typeStat.count;

          if (stats.size > typeStat.largestFile.size) {
            typeStat.largestFile = { path: filePath, size: stats.size };
          }
        } catch (e) {
          logger.warn(`파일 분석 실패: ${filePath}`, e);
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            if (!includeHidden && entry.name.startsWith('.')) continue;
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(path);

      // 최소 개수 필터링 및 정렬
      const filteredStats = Array.from(typeStats.entries())
        .filter(([_, stats]) => stats.count >= minCount)
        .sort((a, b) => b[1].totalSize - a[1].totalSize);

      return {
        types: filteredStats,
        totalTypes: filteredStats.length
      };
    } catch (error) {
      logger.error('파일 타입 분석 실패:', error);
      throw error;
    }
  }

  async analyzeAccessPatterns({ path, options = {} }) {
    try {
      const {
        recursive = true,
        includeHidden = false,
        timeWindow = 30 * 24 * 60 * 60 * 1000 // 30일
      } = options;

      const accessPatterns = {
        recent: new Map(), // 최근 접근
        frequent: new Map(), // 자주 접근
        inactive: new Map() // 비활성
      };

      const now = Date.now();

      const processFile = async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          const lastAccess = stats.atime.getTime();
          const lastModify = stats.mtime.getTime();
          const age = now - lastAccess;

          if (age <= timeWindow) {
            // 최근 접근 파일
            accessPatterns.recent.set(filePath, {
              lastAccess,
              lastModify,
              size: stats.size
            });
          } else if (age <= timeWindow * 3) {
            // 자주 접근 파일
            accessPatterns.frequent.set(filePath, {
              lastAccess,
              lastModify,
              size: stats.size
            });
          } else {
            // 비활성 파일
            accessPatterns.inactive.set(filePath, {
              lastAccess,
              lastModify,
              size: stats.size
            });
          }
        } catch (e) {
          logger.warn(`파일 분석 실패: ${filePath}`, e);
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            if (!includeHidden && entry.name.startsWith('.')) continue;
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(path);

      return {
        recent: {
          count: accessPatterns.recent.size,
          files: Array.from(accessPatterns.recent.entries())
        },
        frequent: {
          count: accessPatterns.frequent.size,
          files: Array.from(accessPatterns.frequent.entries())
        },
        inactive: {
          count: accessPatterns.inactive.size,
          files: Array.from(accessPatterns.inactive.entries())
        }
      };
    } catch (error) {
      logger.error('액세스 패턴 분석 실패:', error);
      throw error;
    }
  }

  async predictGrowth({ path, options = {} }) {
    try {
      const {
        timeWindow = 30 * 24 * 60 * 60 * 1000, // 30일
        predictionPeriod = 90 * 24 * 60 * 60 * 1000 // 90일
      } = options;

      // 과거 데이터 수집
      const historicalData = await this.collectHistoricalData(path, timeWindow);
      
      // 성장률 계산
      const growthRate = this.calculateGrowthRate(historicalData);
      
      // 미래 예측
      const prediction = this.predictFutureGrowth(historicalData, growthRate, predictionPeriod);

      return {
        currentSize: historicalData[historicalData.length - 1].size,
        growthRate,
        prediction,
        historicalData
      };
    } catch (error) {
      logger.error('성장률 예측 실패:', error);
      throw error;
    }
  }

  async findLargeFiles({ path, options = {} }) {
    try {
      const {
        recursive = true,
        includeHidden = false,
        minSize = 100 * 1024 * 1024, // 100MB
        maxCount = 100
      } = options;

      const largeFiles = [];

      const processFile = async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          if (stats.size >= minSize) {
            largeFiles.push({
              path: filePath,
              size: stats.size,
              lastModified: stats.mtime
            });
          }
        } catch (e) {
          logger.warn(`파일 분석 실패: ${filePath}`, e);
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            if (!includeHidden && entry.name.startsWith('.')) continue;
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(path);

      // 크기별로 정렬하고 최대 개수 제한
      return largeFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, maxCount);
    } catch (error) {
      logger.error('대용량 파일 검색 실패:', error);
      throw error;
    }
  }

  async trackFileLifecycle({ path, options = {} }) {
    try {
      const {
        recursive = true,
        includeHidden = false,
        timeWindow = 30 * 24 * 60 * 60 * 1000 // 30일
      } = options;

      const lifecycleData = {
        created: new Map(),
        modified: new Map(),
        accessed: new Map()
      };

      const processFile = async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          const now = Date.now();

          // 생성 시간
          const created = stats.birthtime.getTime();
          if (now - created <= timeWindow) {
            lifecycleData.created.set(filePath, {
              time: created,
              size: stats.size
            });
          }

          // 수정 시간
          const modified = stats.mtime.getTime();
          if (now - modified <= timeWindow) {
            lifecycleData.modified.set(filePath, {
              time: modified,
              size: stats.size
            });
          }

          // 접근 시간
          const accessed = stats.atime.getTime();
          if (now - accessed <= timeWindow) {
            lifecycleData.accessed.set(filePath, {
              time: accessed,
              size: stats.size
            });
          }
        } catch (e) {
          logger.warn(`파일 분석 실패: ${filePath}`, e);
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            if (!includeHidden && entry.name.startsWith('.')) continue;
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(path);

      return {
        created: {
          count: lifecycleData.created.size,
          files: Array.from(lifecycleData.created.entries())
        },
        modified: {
          count: lifecycleData.modified.size,
          files: Array.from(lifecycleData.modified.entries())
        },
        accessed: {
          count: lifecycleData.accessed.size,
          files: Array.from(lifecycleData.accessed.entries())
        }
      };
    } catch (error) {
      logger.error('파일 수명 주기 추적 실패:', error);
      throw error;
    }
  }

  initializeMetrics() {
    // 기본 메트릭 초기화
    this.metrics.set('disk_usage', {
      total: 0,
      used: 0,
      free: 0
    });

    this.metrics.set('file_stats', {
      total: 0,
      byType: new Map()
    });

    this.metrics.set('access_stats', {
      reads: 0,
      writes: 0,
      deletes: 0
    });
  }

  async collectHistoricalData(path, timeWindow) {
    // TODO: 실제 구현
    return [];
  }

  calculateGrowthRate(historicalData) {
    // TODO: 실제 구현
    return 0;
  }

  predictFutureGrowth(historicalData, growthRate, predictionPeriod) {
    // TODO: 실제 구현
    return {
      predictedSize: 0,
      confidence: 0
    };
  }
} 