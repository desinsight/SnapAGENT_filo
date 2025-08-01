import os from 'os';

// 동적 성능 계산 클래스
class DynamicPerformanceConfig {
  constructor() {
    this.cpuCount = os.cpus().length;
    this.totalMemory = os.totalmem();
    this.memoryThresholds = {
      low: 0.3,    // 30% 미만 - 고성능 모드
      medium: 0.6, // 60% 미만 - 표준 모드
      high: 0.8    // 80% 이상 - 절약 모드
    };
    this.updateInterval = 5000; // 5초마다 성능 파라미터 업데이트
    this.lastUpdate = Date.now();
  }

  // 현재 시스템 상태 기반 최적 청크 크기 계산
  calculateOptimalChunkSize(fileSize = 0) {
    const memoryUsage = this.getMemoryUsage();
    const baseChunkSize = 4 * 1024 * 1024; // 4MB 기본값
    const maxChunkSize = 64 * 1024 * 1024; // 64MB 최대값
    
    let multiplier = 1;
    
    // 메모리 사용량에 따른 조절
    if (memoryUsage < this.memoryThresholds.low) {
      multiplier = 4; // 고성능 모드
    } else if (memoryUsage < this.memoryThresholds.medium) {
      multiplier = 2; // 표준 모드
    } else {
      multiplier = 0.5; // 절약 모드
    }

    // 파일 크기에 따른 적응적 조절
    if (fileSize > 0) {
      const fileSizeMultiplier = Math.min(fileSize / (100 * 1024 * 1024), 8); // 100MB 기준
      multiplier *= Math.max(fileSizeMultiplier, 0.25);
    }

    return Math.min(Math.max(baseChunkSize * multiplier, 1024 * 1024), maxChunkSize);
  }

  // 최적 워커 풀 크기 계산
  calculateOptimalWorkerPool() {
    const memoryUsage = this.getMemoryUsage();
    const availableMemoryGB = (this.totalMemory * (1 - memoryUsage)) / (1024 * 1024 * 1024);
    
    // CPU 코어와 메모리 기반 계산
    const cpuBasedWorkers = Math.max(this.cpuCount - 1, 2);
    const memoryBasedWorkers = Math.floor(availableMemoryGB / 0.5); // 500MB per worker
    
    return Math.min(cpuBasedWorkers, memoryBasedWorkers, 16); // 최대 16개
  }

  // 최적 동시 처리 수 계산
  calculateMaxConcurrent() {
    const memoryUsage = this.getMemoryUsage();
    const workerCount = this.calculateOptimalWorkerPool();
    
    if (memoryUsage < this.memoryThresholds.low) {
      return workerCount * 3; // 고성능 모드
    } else if (memoryUsage < this.memoryThresholds.medium) {
      return workerCount * 2; // 표준 모드
    } else {
      return workerCount; // 절약 모드
    }
  }

  // 현재 메모리 사용률 반환
  getMemoryUsage() {
    const used = this.totalMemory - os.freemem();
    return used / this.totalMemory;
  }

  // CPU 사용률 추정 (간단한 로드 애버리지 기반)
  getCpuUsage() {
    const loadAvg = os.loadavg()[0]; // 1분 평균
    return Math.min(loadAvg / this.cpuCount, 1.0);
  }

  // 시스템 상태 기반 백프레셔 임계값
  getBackpressureThresholds() {
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = this.getCpuUsage();
    
    return {
      memory: memoryUsage > this.memoryThresholds.high,
      cpu: cpuUsage > 0.8,
      severe: memoryUsage > 0.9 || cpuUsage > 0.95
    };
  }

  // 실시간 성능 메트릭스
  getPerformanceMetrics() {
    return {
      timestamp: Date.now(),
      memory: {
        total: this.totalMemory,
        free: os.freemem(),
        used: this.totalMemory - os.freemem(),
        usage: this.getMemoryUsage()
      },
      cpu: {
        count: this.cpuCount,
        usage: this.getCpuUsage(),
        loadAvg: os.loadavg()
      },
      optimal: {
        chunkSize: this.calculateOptimalChunkSize(),
        workerPool: this.calculateOptimalWorkerPool(),
        maxConcurrent: this.calculateMaxConcurrent()
      },
      backpressure: this.getBackpressureThresholds()
    };
  }
}

const dynamicConfig = new DynamicPerformanceConfig();

export const config = {
  // 서버 설정
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // 고성능 파일 시스템 설정
  fileSystem: {
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB (대폭 증가)
    minChunkSize: 1024 * 1024, // 1MB 최소
    maxChunkSize: 64 * 1024 * 1024, // 64MB 최대
    getOptimalChunkSize: (fileSize) => dynamicConfig.calculateOptimalChunkSize(fileSize),
    tempDir: './temp',
    cacheSize: 10000, // 10배 증가
    cacheTTL: 3600,
    allowedExtensions: [
      'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx',
      'html', 'css', 'scss', 'less',
      'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp',
      'mp3', 'mp4', 'avi', 'mov', 'mkv', 'flv',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'zip', 'rar', '7z', 'tar', 'gz', 'bz2'
    ],
    // 스트리밍 처리 설정
    streaming: {
      highWaterMark: () => dynamicConfig.calculateOptimalChunkSize(),
      enableBackpressure: true,
      backpressureThreshold: 0.8
    }
  },

  // 적응형 워커 설정
  worker: {
    getOptimalPoolSize: () => dynamicConfig.calculateOptimalWorkerPool(),
    minPoolSize: 2,
    maxPoolSize: 16,
    timeout: 300000, // 5분으로 증가 (대용량 처리)
    retryCount: 3,
    // 동적 스케일링 설정
    scaling: {
      scaleUpThreshold: 0.8,   // 80% 사용률에서 스케일 업
      scaleDownThreshold: 0.3, // 30% 사용률에서 스케일 다운
      scaleInterval: 30000     // 30초마다 체크
    }
  },

  // 성능 최적화 설정
  performance: {
    getDynamicConfig: () => dynamicConfig,
    getMetrics: () => dynamicConfig.getPerformanceMetrics(),
    getMaxConcurrent: () => dynamicConfig.calculateMaxConcurrent(),
    updateInterval: 5000,
    // 메모리 관리
    memory: {
      gcThreshold: 0.7,        // 70% 사용시 강제 GC
      heapSizeLimit: 0.8,      // 힙 크기 80% 제한
      bufferPoolLimit: 0.1     // 총 메모리의 10%를 버퍼로
    },
    // CPU 관리
    cpu: {
      throttleThreshold: 0.9,  // 90% 사용시 스로틀링
      priorityBoost: true,     // 우선순위 부스트 활성화
      affinityOptimization: true // CPU 친화성 최적화
    }
  },

  // 로깅 설정
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: './logs/app.log',
    maxSize: 1024 * 1024 * 10, // 10MB
    maxFiles: 5
  },

  // 보안 설정
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: '24h',
    bcryptRounds: 10,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15분
      max: 100 // IP당 최대 요청 수
    }
  },

  // 백업 설정
  backup: {
    enabled: true,
    schedule: '0 0 * * *', // 매일 자정
    retention: 7, // 보관 기간 (일)
    compression: true,
    encryption: true
  },

  // 검색 설정
  search: {
    maxResults: 1000,
    minQueryLength: 2,
    fuzzyMatch: true,
    includeContent: true,
    excludePatterns: [
      'node_modules',
      '.git',
      'dist',
      'build'
    ]
  },

  // 모니터링 설정
  monitoring: {
    enabled: true,
    interval: 60000, // 1분
    metrics: {
      cpu: true,
      memory: true,
      disk: true,
      network: true
    }
  }
}; 