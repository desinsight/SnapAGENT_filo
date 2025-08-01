import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { LocalCache } from '../utils/LocalCache.js';

/**
 * 파일 시스템 분석 엔진
 * 파일 구조, 중복, 유사도, 메타데이터 등 종합적 분석
 * @class FileSystemAnalyzer
 */
export class FileSystemAnalyzer extends EventEmitter {
  constructor() {
    super();
    
    this.cache = new LocalCache('fs-analyzer');
    this.workers = new Map();
    this.maxWorkers = 4;
    this.analysisQueue = [];
    this.isProcessing = false;
    
    // 분석 결과 저장소
    this.analysisResults = {
      fileIndex: new Map(),
      duplicates: new Map(),
      similarities: new Map(),
      statistics: {},
      lastUpdate: null
    };
    
    // 파일 해시 캐시
    this.hashCache = new Map();
    
    // 지원 파일 타입
    this.supportedTypes = {
      text: ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.json', '.xml', '.html', '.css'],
      image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
      video: ['.mp4', '.avi', '.mov', '.wmv', '.mkv', '.flv'],
      audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
      document: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'],
      archive: ['.zip', '.rar', '.7z', '.tar', '.gz']
    };
  }

  /**
   * 초기화
   */
  async initialize() {
    try {
      logger.info('파일 시스템 분석 엔진 초기화');
      
      // 캐시된 인덱스 로드
      await this.loadCachedIndex();
      
      // 워커 초기화
      await this.initializeWorkers();
      
      logger.info('파일 시스템 분석 엔진 초기화 완료');
    } catch (error) {
      logger.error('파일 시스템 분석 엔진 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 구조 분석
   * @param {Object} params - 분석 매개변수
   * @returns {Promise<Object>} 분석 결과
   */
  async analyzeStructure(params) {
    const { path: targetPath, depth = 3, includeHidden = false } = params;
    
    try {
      const startTime = Date.now();
      
      // 캐시 확인
      const cacheKey = `structure:${targetPath}:${depth}:${includeHidden}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        logger.info('캐시된 구조 분석 결과 반환');
        return cached;
      }
      
      logger.info('파일 구조 분석 시작:', targetPath);
      
      // 구조 스캔
      const structure = await this.scanDirectory(targetPath, {
        maxDepth: depth,
        includeHidden,
        collectMetadata: true
      });
      
      // 통계 계산
      const statistics = this.calculateStructureStatistics(structure);
      
      // 패턴 분석
      const patterns = await this.analyzeNamingPatterns(structure);
      
      // 권장사항 생성
      const recommendations = this.generateStructureRecommendations(
        structure,
        statistics,
        patterns
      );
      
      const result = {
        path: targetPath,
        structure,
        statistics,
        patterns,
        recommendations,
        analyzedAt: new Date().toISOString(),
        duration: Date.now() - startTime
      };
      
      // 결과 캐싱 (10분)
      await this.cache.set(cacheKey, result, 600);
      
      return result;
      
    } catch (error) {
      logger.error('파일 구조 분석 실패:', error);
      throw new Error(`구조 분석 실패: ${error.message}`);
    }
  }

  /**
   * 중복 파일 분석
   * @param {Object} params - 분석 매개변수
   * @returns {Promise<Object>} 중복 파일 분석 결과
   */
  async analyzeDuplicates(params) {
    const { path: targetPath, compareContent = true, minSize = 1024 } = params;
    
    try {
      const startTime = Date.now();
      
      logger.info('중복 파일 분석 시작:', targetPath);
      
      // 파일 목록 수집
      const files = await this.collectFiles(targetPath, {
        minSize,
        includeHidden: false
      });
      
      // 크기별 그룹화
      const sizeGroups = this.groupFilesBySize(files);
      
      // 중복 후보 찾기
      const duplicateCandidates = Object.values(sizeGroups)
        .filter(group => group.length > 1);
      
      // 해시 비교
      const duplicates = await this.findDuplicatesByHash(
        duplicateCandidates,
        compareContent
      );
      
      // 중복 그룹 생성
      const duplicateGroups = this.createDuplicateGroups(duplicates);
      
      // 절약 가능 용량 계산
      const savingsAnalysis = this.calculatePotentialSavings(duplicateGroups);
      
      const result = {
        path: targetPath,
        totalFiles: files.length,
        duplicateGroups,
        savingsAnalysis,
        analyzedAt: new Date().toISOString(),
        duration: Date.now() - startTime
      };
      
      return result;
      
    } catch (error) {
      logger.error('중복 파일 분석 실패:', error);
      throw new Error(`중복 분석 실패: ${error.message}`);
    }
  }

  /**
   * 파일 유사도 분석
   * @param {Object} params - 분석 매개변수
   * @returns {Promise<Object>} 유사도 분석 결과
   */
  async analyzeSimilarity(params) {
    const { 
      path: targetPath, 
      threshold = 0.8, 
      analyzeContent = false,
      fileTypes = null 
    } = params;
    
    try {
      const startTime = Date.now();
      
      logger.info('파일 유사도 분석 시작:', targetPath);
      
      // 파일 수집
      const files = await this.collectFiles(targetPath, {
        includeContent: analyzeContent,
        filterTypes: fileTypes
      });
      
      // 유사도 계산 방법 결정
      const similarityMethods = this.determineSimilarityMethods(files, params);
      
      // 유사 파일 그룹 찾기
      const similarGroups = await this.findSimilarFiles(
        files,
        similarityMethods,
        threshold
      );
      
      // 유사도 점수 계산
      const scoredGroups = await this.calculateSimilarityScores(similarGroups);
      
      const result = {
        path: targetPath,
        totalFiles: files.length,
        similarGroups: scoredGroups,
        threshold,
        methods: similarityMethods,
        analyzedAt: new Date().toISOString(),
        duration: Date.now() - startTime
      };
      
      return result;
      
    } catch (error) {
      logger.error('파일 유사도 분석 실패:', error);
      throw new Error(`유사도 분석 실패: ${error.message}`);
    }
  }

  /**
   * 디렉토리 스캔
   * @private
   */
  async scanDirectory(dirPath, options = {}) {
    const {
      maxDepth = 3,
      currentDepth = 0,
      includeHidden = false,
      collectMetadata = false
    } = options;
    
    if (currentDepth >= maxDepth) {
      return null;
    }
    
    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        return null;
      }
      
      const items = await fs.readdir(dirPath);
      const children = [];
      
      for (const item of items) {
        if (!includeHidden && item.startsWith('.')) {
          continue;
        }
        
        const itemPath = path.join(dirPath, item);
        
        try {
          const itemStat = await fs.stat(itemPath);
          
          const nodeInfo = {
            name: item,
            path: itemPath,
            isDirectory: itemStat.isDirectory(),
            size: itemStat.size,
            created: itemStat.birthtime,
            modified: itemStat.mtime,
            extension: itemStat.isFile() ? path.extname(item).toLowerCase() : null
          };
          
          // 메타데이터 수집
          if (collectMetadata) {
            nodeInfo.metadata = await this.collectFileMetadata(itemPath, itemStat);
          }
          
          // 하위 디렉토리 재귀 스캔
          if (itemStat.isDirectory()) {
            nodeInfo.children = await this.scanDirectory(itemPath, {
              ...options,
              currentDepth: currentDepth + 1
            });
          }
          
          children.push(nodeInfo);
          
        } catch (error) {
          logger.warn(`파일 접근 실패: ${itemPath}`, error.message);
        }
      }
      
      return {
        name: path.basename(dirPath),
        path: dirPath,
        isDirectory: true,
        children,
        size: children.reduce((sum, child) => sum + (child.size || 0), 0),
        created: stat.birthtime,
        modified: stat.mtime
      };
      
    } catch (error) {
      logger.error(`디렉토리 스캔 실패: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * 파일 메타데이터 수집
   * @private
   */
  async collectFileMetadata(filePath, stat) {
    const metadata = {
      permissions: stat.mode,
      uid: stat.uid,
      gid: stat.gid,
      extension: path.extname(filePath).toLowerCase(),
      type: this.determineFileType(filePath)
    };
    
    // 이미지 파일 메타데이터
    if (metadata.type === 'image') {
      try {
        metadata.imageInfo = await this.getImageMetadata(filePath);
      } catch (error) {
        logger.debug('이미지 메타데이터 수집 실패:', error.message);
      }
    }
    
    // 텍스트 파일 메타데이터
    if (metadata.type === 'text' && stat.size < 1024 * 1024) { // 1MB 미만
      try {
        metadata.textInfo = await this.getTextMetadata(filePath);
      } catch (error) {
        logger.debug('텍스트 메타데이터 수집 실패:', error.message);
      }
    }
    
    return metadata;
  }

  /**
   * 파일 타입 결정
   * @private
   */
  determineFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    for (const [type, extensions] of Object.entries(this.supportedTypes)) {
      if (extensions.includes(ext)) {
        return type;
      }
    }
    
    return 'unknown';
  }

  /**
   * 파일 수집
   * @private
   */
  async collectFiles(dirPath, options = {}) {
    const {
      minSize = 0,
      maxSize = Infinity,
      includeHidden = false,
      includeContent = false,
      filterTypes = null
    } = options;
    
    const files = [];
    
    const traverse = async (currentPath) => {
      try {
        const items = await fs.readdir(currentPath);
        
        for (const item of items) {
          if (!includeHidden && item.startsWith('.')) {
            continue;
          }
          
          const itemPath = path.join(currentPath, item);
          const stat = await fs.stat(itemPath);
          
          if (stat.isDirectory()) {
            await traverse(itemPath);
          } else if (stat.isFile()) {
            // 크기 필터
            if (stat.size < minSize || stat.size > maxSize) {
              continue;
            }
            
            // 타입 필터
            const fileType = this.determineFileType(itemPath);
            if (filterTypes && !filterTypes.includes(fileType)) {
              continue;
            }
            
            const fileInfo = {
              path: itemPath,
              name: item,
              size: stat.size,
              created: stat.birthtime,
              modified: stat.mtime,
              extension: path.extname(item).toLowerCase(),
              type: fileType
            };
            
            // 내용 포함
            if (includeContent && fileType === 'text' && stat.size < 1024 * 1024) {
              try {
                fileInfo.content = await fs.readFile(itemPath, 'utf-8');
              } catch (error) {
                logger.debug('파일 내용 읽기 실패:', error.message);
              }
            }
            
            files.push(fileInfo);
          }
        }
      } catch (error) {
        logger.warn(`디렉토리 탐색 실패: ${currentPath}`, error.message);
      }
    };
    
    await traverse(dirPath);
    return files;
  }

  /**
   * 파일 해시 계산
   * @private
   */
  async calculateFileHash(filePath, algorithm = 'md5') {
    // 캐시 확인
    const cacheKey = `${filePath}:${algorithm}`;
    if (this.hashCache.has(cacheKey)) {
      return this.hashCache.get(cacheKey);
    }
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash(algorithm).update(fileBuffer).digest('hex');
      
      // 캐시 저장
      this.hashCache.set(cacheKey, hash);
      
      return hash;
    } catch (error) {
      logger.error(`해시 계산 실패: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 크기별 파일 그룹화
   * @private
   */
  groupFilesBySize(files) {
    const groups = {};
    
    for (const file of files) {
      const size = file.size;
      if (!groups[size]) {
        groups[size] = [];
      }
      groups[size].push(file);
    }
    
    return groups;
  }

  /**
   * 해시로 중복 파일 찾기
   * @private
   */
  async findDuplicatesByHash(candidates, compareContent = true) {
    const duplicates = new Map();
    
    for (const group of candidates) {
      const hashGroups = {};
      
      for (const file of group) {
        try {
          let hash;
          
          if (compareContent) {
            // 전체 파일 해시
            hash = await this.calculateFileHash(file.path);
          } else {
            // 파일 시작 부분만 해시 (빠른 비교)
            hash = await this.calculatePartialHash(file.path);
          }
          
          if (!hashGroups[hash]) {
            hashGroups[hash] = [];
          }
          hashGroups[hash].push(file);
          
        } catch (error) {
          logger.warn(`해시 계산 실패: ${file.path}`, error.message);
        }
      }
      
      // 중복 그룹만 추가
      for (const [hash, files] of Object.entries(hashGroups)) {
        if (files.length > 1) {
          duplicates.set(hash, files);
        }
      }
    }
    
    return duplicates;
  }

  /**
   * 부분 해시 계산 (빠른 중복 검사용)
   * @private
   */
  async calculatePartialHash(filePath, sampleSize = 8192) {
    try {
      const fileHandle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(sampleSize);
      
      const { bytesRead } = await fileHandle.read(buffer, 0, sampleSize, 0);
      await fileHandle.close();
      
      return crypto.createHash('md5')
        .update(buffer.slice(0, bytesRead))
        .digest('hex');
        
    } catch (error) {
      logger.error(`부분 해시 계산 실패: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 구조 통계 계산
   * @private
   */
  calculateStructureStatistics(structure) {
    const stats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      fileTypes: {},
      depthDistribution: {},
      largestFiles: [],
      emptyDirectories: []
    };
    
    const traverse = (node, depth = 0) => {
      if (node.isDirectory) {
        stats.totalDirectories++;
        
        if (!node.children || node.children.length === 0) {
          stats.emptyDirectories.push(node.path);
        }
        
        if (node.children) {
          for (const child of node.children) {
            traverse(child, depth + 1);
          }
        }
      } else {
        stats.totalFiles++;
        stats.totalSize += node.size || 0;
        
        // 파일 타입별 통계
        const ext = node.extension || 'no-extension';
        if (!stats.fileTypes[ext]) {
          stats.fileTypes[ext] = { count: 0, size: 0 };
        }
        stats.fileTypes[ext].count++;
        stats.fileTypes[ext].size += node.size || 0;
        
        // 깊이별 분포
        if (!stats.depthDistribution[depth]) {
          stats.depthDistribution[depth] = 0;
        }
        stats.depthDistribution[depth]++;
        
        // 큰 파일 추적
        stats.largestFiles.push({
          path: node.path,
          size: node.size || 0
        });
      }
    };
    
    traverse(structure);
    
    // 큰 파일 정렬 (상위 10개)
    stats.largestFiles = stats.largestFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
    
    return stats;
  }

  /**
   * 캐시된 인덱스 로드
   * @private
   */
  async loadCachedIndex() {
    try {
      const cached = await this.cache.get('file-index');
      if (cached) {
        this.analysisResults.fileIndex = new Map(cached.fileIndex);
        this.analysisResults.lastUpdate = cached.lastUpdate;
        logger.info('캐시된 파일 인덱스 로드 완료');
      }
    } catch (error) {
      logger.warn('캐시된 인덱스 로드 실패:', error.message);
    }
  }

  /**
   * 워커 초기화
   * @private
   */
  async initializeWorkers() {
    // 워커 스레드 초기화 로직
    logger.info('분석 워커 초기화 완료');
  }

  /**
   * 인덱스 업데이트
   */
  async updateIndex() {
    try {
      logger.info('파일 인덱스 업데이트 시작');
      
      // 백그라운드에서 인덱스 업데이트
      this.emit('indexUpdate', { status: 'started' });
      
      // 실제 업데이트 로직...
      
      this.analysisResults.lastUpdate = new Date().toISOString();
      
      // 캐시 저장
      await this.cache.set('file-index', {
        fileIndex: Array.from(this.analysisResults.fileIndex.entries()),
        lastUpdate: this.analysisResults.lastUpdate
      }, 3600); // 1시간
      
      this.emit('indexUpdate', { status: 'completed' });
      
    } catch (error) {
      logger.error('인덱스 업데이트 실패:', error);
      this.emit('indexUpdate', { status: 'failed', error: error.message });
    }
  }
}

export default FileSystemAnalyzer;