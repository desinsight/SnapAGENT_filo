/**
 * 🗺️ 경로 매핑 관리 시스템
 * 한국어/영어 지원 경로 매핑 및 자동 감지/학습 시스템 통합
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import { AutoPathDetector } from './AutoPathDetector.js';
import { PeriodicPathScanner } from './PeriodicPathScanner.js';
import { UserPathLearner } from './UserPathLearner.js';

export class PathMapper extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.userProfile = os.homedir();
    this.username = os.userInfo().username;
    this.platform = os.platform();
    
    // 하위 시스템들
    this.autoDetector = new AutoPathDetector();
    this.periodicScanner = new PeriodicPathScanner(options.scanner || {});
    this.userLearner = new UserPathLearner(options.learner || {});
    
    // 통합 매핑 데이터
    this.integratedMappings = new Map();
    
    // 캐시
    this.mappingCache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000; // 5분
    
    // 설정
    this.config = {
      enableAutoDetection: options.enableAutoDetection !== false,
      enablePeriodicScan: options.enablePeriodicScan !== false,
      enableUserLearning: options.enableUserLearning !== false,
      language: options.language || 'ko',
      fallbackLanguage: options.fallbackLanguage || 'en'
    };
    
    // 이벤트 연결
    this.setupEventHandlers();
  }

  /**
   * 🚀 PathMapper 초기화
   */
  async initialize() {
    console.log('🗺️ PathMapper 초기화 시작...');
    
    try {
      // 1. 자동 감지 시스템 초기화
      if (this.config.enableAutoDetection) {
        await this.autoDetector.startDetection();
      }
      
      // 2. 주기적 스캐너 초기화
      if (this.config.enablePeriodicScan) {
        await this.periodicScanner.startPeriodicScan();
      }
      
      // 3. 사용자 학습 시스템 초기화
      if (this.config.enableUserLearning) {
        await this.userLearner.initialize();
      }
      
      // 4. 통합 매핑 데이터 구축
      await this.buildIntegratedMappings();
      
      console.log('✅ PathMapper 초기화 완료');
      this.emit('initialized');
      
    } catch (error) {
      console.error('❌ PathMapper 초기화 실패:', error);
      this.emit('initializationError', error);
    }
  }

  /**
   * 🔗 이벤트 핸들러 설정
   */
  setupEventHandlers() {
    // 자동 감지 완료 시
    this.autoDetector.on('detectionComplete', (detectedPaths) => {
      console.log('🔍 자동 감지 완료, 매핑 업데이트 중...');
      this.updateMappingsFromDetection(detectedPaths);
    });
    
    // 주기적 스캔 변화 감지 시
    this.periodicScanner.on('pathsChanged', (changes) => {
      console.log('🔄 경로 변화 감지, 매핑 업데이트 중...');
      this.updateMappingsFromChanges(changes);
    });
    
    // 사용자 학습 완료 시
    this.userLearner.on('pathLearned', (learningData) => {
      console.log('🧠 사용자 학습 완료, 매핑 업데이트 중...');
      this.updateMappingsFromLearning(learningData);
    });
  }

  /**
   * 🏗️ 통합 매핑 데이터 구축
   */
  async buildIntegratedMappings() {
    console.log('🏗️ 통합 매핑 데이터 구축 중...');
    
    // 1. 기본 매핑 로드
    this.loadBasicMappings();
    
    // 2. 자동 감지 결과 로드
    await this.loadDetectedMappings();
    
    // 3. 사용자 학습 데이터 로드
    await this.loadLearnedMappings();
    
    console.log(`✅ 통합 매핑 구축 완료 (${this.integratedMappings.size}개 매핑)`);
  }

  /**
   * 📚 기본 매핑 로드
   */
  loadBasicMappings() {
    // 한국어/영어 기본 매핑
    const basicMappings = {
      // 바탕화면/데스크톱
      '바탕화면': {
        ko: ['바탕 화면', '바탕화면', '데스크탑', '데스크톱'],
        en: ['Desktop'],
        paths: []
      },
      'desktop': {
        ko: ['바탕 화면', '바탕화면', '데스크탑', '데스크톱'],
        en: ['Desktop'],
        paths: []
      },
      
      // 문서
      '문서': {
        ko: ['문서', '내 문서', '도큐먼트'],
        en: ['Documents'],
        paths: []
      },
      'documents': {
        ko: ['문서', '내 문서', '도큐먼트'],
        en: ['Documents'],
        paths: []
      },
      
      // 다운로드
      '다운로드': {
        ko: ['다운로드', '받은 파일', '내려받기'],
        en: ['Downloads'],
        paths: []
      },
      'downloads': {
        ko: ['다운로드', '받은 파일', '내려받기'],
        en: ['Downloads'],
        paths: []
      },
      
      // 카카오톡
      '카카오톡': {
        ko: ['카카오톡', '카톡', 'kakao'],
        en: ['KakaoTalk', 'Kakao'],
        paths: []
      },
      'kakao': {
        ko: ['카카오톡', '카톡', 'kakao'],
        en: ['KakaoTalk', 'Kakao'],
        paths: []
      }
    };

    for (const [key, mapping] of Object.entries(basicMappings)) {
      this.integratedMappings.set(key, mapping);
    }
  }

  /**
   * 🔍 감지된 매핑 로드
   */
  async loadDetectedMappings() {
    try {
      const detectedPaths = this.autoDetector.getDetectedPaths();
      
      for (const [type, paths] of Object.entries(detectedPaths)) {
        if (this.integratedMappings.has(type)) {
          const mapping = this.integratedMappings.get(type);
          mapping.paths = paths.map(p => p.path);
        } else {
          // 새로운 타입 추가
          this.integratedMappings.set(type, {
            ko: [type],
            en: [type],
            paths: paths.map(p => p.path)
          });
        }
      }
    } catch (error) {
      console.warn('감지된 매핑 로드 실패:', error.message);
    }
  }

  /**
   * 🧠 학습된 매핑 로드
   */
  async loadLearnedMappings() {
    try {
      // 사용자 학습 데이터에서 인기 경로 추출
      const globalData = this.userLearner.globalData;
      
      for (const [path, count] of globalData.popularPaths) {
        const pathType = this.extractPathType(path);
        if (pathType && this.integratedMappings.has(pathType)) {
          const mapping = this.integratedMappings.get(pathType);
          if (!mapping.paths.includes(path)) {
            mapping.paths.push(path);
          }
        }
      }
    } catch (error) {
      console.warn('학습된 매핑 로드 실패:', error.message);
    }
  }

  /**
   * 🎯 경로 해석 (메인 함수)
   */
  async resolvePath(input, context = {}) {
    const userId = context.userId || 'default';
    const language = context.language || this.config.language;
    
    try {
      // 1. 캐시 확인
      const cacheKey = this.generateCacheKey(input, context);
      const cached = this.getCachedMapping(cacheKey);
      if (cached) {
        return cached;
      }
      
      // 2. 사용자 학습 기반 예측
      if (this.config.enableUserLearning) {
        const userPrediction = await this.userLearner.predictUserPath(userId, input, context);
        if (userPrediction.confidence > 0.5) {
          const result = userPrediction.paths;
          this.cacheMapping(cacheKey, result);
          return result;
        }
      }
      
      // 3. 통합 매핑 기반 해석
      const mappingResult = this.resolveFromMappings(input, language);
      if (mappingResult.length > 0) {
        this.cacheMapping(cacheKey, mappingResult);
        return mappingResult;
      }
      
      // 4. 폴백 언어로 재시도
      if (language !== this.config.fallbackLanguage) {
        const fallbackResult = this.resolveFromMappings(input, this.config.fallbackLanguage);
        if (fallbackResult.length > 0) {
          this.cacheMapping(cacheKey, fallbackResult);
          return fallbackResult;
        }
      }
      
      // 5. 기본 경로 반환
      const defaultResult = this.resolveDefaultPath(input);
      this.cacheMapping(cacheKey, defaultResult);
      return defaultResult;
      
    } catch (error) {
      console.error('경로 해석 실패:', error);
      return [];
    }
  }

  /**
   * 🗺️ 매핑 기반 경로 해석
   */
  resolveFromMappings(input, language) {
    const results = [];
    const normalizedInput = input.toLowerCase().trim();
    
    for (const [key, mapping] of this.integratedMappings) {
      // 키워드 매칭
      if (normalizedInput.includes(key.toLowerCase())) {
        results.push(...mapping.paths);
        continue;
      }
      
      // 언어별 별칭 매칭
      const aliases = mapping[language] || mapping.ko || [];
      for (const alias of aliases) {
        if (normalizedInput.includes(alias.toLowerCase())) {
          results.push(...mapping.paths);
          break;
        }
      }
    }
    
    return [...new Set(results)]; // 중복 제거
  }

  /**
   * 🎯 기본 경로 해석
   */
  resolveDefaultPath(input) {
    const normalizedInput = input.toLowerCase().trim();
    
    // 일반적인 경로 패턴 감지
    if (normalizedInput.includes('바탕') || normalizedInput.includes('desktop')) {
      return [path.join(this.userProfile, 'Desktop')];
    }
    
    if (normalizedInput.includes('문서') || normalizedInput.includes('document')) {
      return [path.join(this.userProfile, 'Documents')];
    }
    
    if (normalizedInput.includes('다운로드') || normalizedInput.includes('download')) {
      return [path.join(this.userProfile, 'Downloads')];
    }
    
    if (normalizedInput.includes('카카오') || normalizedInput.includes('kakao')) {
      return [path.join(this.userProfile, 'Documents', '카카오톡 받은 파일')];
    }
    
    return [];
  }

  /**
   * 🔄 매핑 업데이트 (자동 감지 결과)
   */
  updateMappingsFromDetection(detectedPaths) {
    for (const [type, paths] of detectedPaths) {
      if (this.integratedMappings.has(type)) {
        const mapping = this.integratedMappings.get(type);
        mapping.paths = paths.map(p => p.path);
      } else {
        // 새로운 타입 추가
        this.integratedMappings.set(type, {
          ko: [type],
          en: [type],
          paths: paths.map(p => p.path)
        });
      }
    }
    
    this.clearCache();
    this.emit('mappingsUpdated', { source: 'detection' });
  }

  /**
   * 🔄 매핑 업데이트 (주기적 스캔 변화)
   */
  updateMappingsFromChanges(changes) {
    // 새로운 경로 추가
    for (const [targetPath, newPaths] of changes.newPaths) {
      for (const newPath of newPaths) {
        const pathType = this.extractPathType(newPath.path);
        if (pathType && this.integratedMappings.has(pathType)) {
          const mapping = this.integratedMappings.get(pathType);
          if (!mapping.paths.includes(newPath.path)) {
            mapping.paths.push(newPath.path);
          }
        }
      }
    }
    
    this.clearCache();
    this.emit('mappingsUpdated', { source: 'scan' });
  }

  /**
   * 🔄 매핑 업데이트 (사용자 학습)
   */
  updateMappingsFromLearning(learningData) {
    const { userId, input, resolvedPath, success } = learningData;
    
    if (success && resolvedPath) {
      const pathType = this.extractPathType(resolvedPath);
      if (pathType && this.integratedMappings.has(pathType)) {
        const mapping = this.integratedMappings.get(pathType);
        if (!mapping.paths.includes(resolvedPath)) {
          mapping.paths.push(resolvedPath);
        }
      }
    }
    
    this.clearCache();
    this.emit('mappingsUpdated', { source: 'learning' });
  }

  /**
   * 🏷️ 경로 타입 추출
   */
  extractPathType(path) {
    const pathLower = path.toLowerCase();
    
    if (pathLower.includes('desktop') || pathLower.includes('바탕')) {
      return 'desktop';
    }
    
    if (pathLower.includes('document') || pathLower.includes('문서')) {
      return 'documents';
    }
    
    if (pathLower.includes('download') || pathLower.includes('다운로드')) {
      return 'downloads';
    }
    
    if (pathLower.includes('kakao') || pathLower.includes('카카오')) {
      return 'kakao';
    }
    
    return null;
  }

  /**
   * 💾 캐시 관리
   */
  generateCacheKey(input, context) {
    return `${input}_${context.language || 'ko'}_${context.userId || 'default'}`;
  }

  getCachedMapping(key) {
    const cached = this.mappingCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  cacheMapping(key, data) {
    this.mappingCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.mappingCache.clear();
  }

  /**
   * 📊 매핑 상태 조회
   */
  getMappingStatus() {
    return {
      totalMappings: this.integratedMappings.size,
      cacheSize: this.mappingCache.size,
      autoDetectionEnabled: this.config.enableAutoDetection,
      periodicScanEnabled: this.config.enablePeriodicScan,
      userLearningEnabled: this.config.enableUserLearning,
      language: this.config.language,
      fallbackLanguage: this.config.fallbackLanguage
    };
  }

  /**
   * 📋 매핑 목록 조회
   */
  getMappings(type = null) {
    if (type) {
      return this.integratedMappings.get(type) || null;
    }
    return Object.fromEntries(this.integratedMappings);
  }

  /**
   * 🧹 메모리 정리
   */
  cleanup() {
    // 하위 시스템 정리 (cleanup 함수가 있는 경우만)
    if (this.autoDetector && typeof this.autoDetector.cleanup === 'function') {
      this.autoDetector.cleanup();
    }
    if (this.periodicScanner && typeof this.periodicScanner.cleanup === 'function') {
      this.periodicScanner.cleanup();
    }
    if (this.userLearner && typeof this.userLearner.cleanup === 'function') {
      this.userLearner.cleanup();
    }
    
    // 캐시 및 데이터 정리
    this.clearCache();
    this.integratedMappings.clear();
    this.removeAllListeners();
  }
} 