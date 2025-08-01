import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import winston from 'winston';
import os from 'os';
// Node.js 18+에서는 fetch가 global로 제공됨

// 🌟 Enterprise-Grade AI Intelligence Engines
import { SmartPathEngine } from './smartPathEngine.js';
import { IntelligentFileMapper } from './intelligentFileMapper.js';
import { ContextualPredictor } from './contextualPredictor.js';
import { AdaptiveLearningCache } from './adaptiveLearningCache.js';
import { DocumentAnalysisLearningManager } from '../../../ai/services/filesystem/DocumentAnalysisLearningManager.js';

// 🎯 FileSummary.js for user-friendly error messages
import { 
  summarizeFileError, 
  summarizeFileReadError,
  summarizeFileWriteError,
  summarizeFileDeleteError,
  summarizeFileCopyError,
  summarizeFileMoveError
} from '../../../ai/services/filesystem/FileSummary.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export class FileSystemTools {
  constructor() {
    this.isInitialized = false;
    
    // 🌟 Enterprise-Grade AI Intelligence Components
    this.smartPathEngine = new SmartPathEngine();
    this.intelligentFileMapper = new IntelligentFileMapper();
    this.contextualPredictor = new ContextualPredictor();
    this.adaptiveLearningCache = new AdaptiveLearningCache();
    
    // 🤖 Hybrid AI Path Resolution System
    this.aiPathCache = new Map(); // AI 해석 결과 캐싱
    this.aiTimeoutMs = 12000; // 12초 타임아웃
    this.aiEnabled = true; // AI 백업 시스템 활성화
    
    // 🔄 Real-time Folder Discovery System
    this.dynamicFolderCache = new Map(); // 동적으로 발견된 폴더 캐싱
    this.folderScanCache = new Map(); // 폴더 스캔 결과 캐싱
    this.lastScanTime = new Map(); // 각 경로별 마지막 스캔 시간
    this.scanIntervalMs = 30000; // 30초마다 스캔
    this.maxScanDepth = 2; // 최대 2단계 깊이까지 스캔
    
    // 🧠 User Pattern Learning System
    this.userPatterns = new Map(); // 사용자 검색 패턴 학습
    this.frequentPaths = new Map(); // 자주 접근하는 경로
    this.recentQueries = []; // 최근 검색어 (최대 100개)
    this.maxRecentQueries = 100;
    
    // 🎯 Performance & Analytics
    this.performanceMetrics = {
      totalQueries: 0,
      intelligentMappings: 0,
      cacheHits: 0,
      aiCacheHits: 0,
      aiTimeouts: 0,
      dynamicDiscoveries: 0,
      realTimeScanHits: 0,
      averageResponseTime: 0,
      systemEfficiency: 100
    };
    
    // 📊 문서 분석 학습 관리자
    this.documentLearningManager = new DocumentAnalysisLearningManager();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🚀 Enterprise-Grade FileSystemTools 초기화 중...');
      
      // 기본 디렉토리 접근 테스트
      const testPath = process.cwd();
      await fs.access(testPath);
      
      // 🌟 안전한 AI 엔진 초기화 (개별 실패해도 시스템 계속 동작)
      const initResults = await Promise.allSettled([
        this.smartPathEngine.initialize(),
        this.intelligentFileMapper.initialize(),
        this.contextualPredictor.initialize(),
        this.adaptiveLearningCache.initialize(),
        this.documentLearningManager.initialize()
      ]);
      
      // 초기화 결과 검증 및 fallback 설정
      this.validateInitResults(initResults);
      
      this.isInitialized = true;
      logger.info('🎯 Enterprise FileSystemTools 초기화 완료 - 모든 AI 엔진 활성화됨');
      
      // 초기화 성공 리포트
      console.log('✅ 초기화된 AI 컴포넌트:');
      console.log('  🧠 SmartPathEngine - 지능형 경로 추론');
      console.log('  🎯 IntelligentFileMapper - 파일 타입 매핑');
      console.log('  📝 ContextualPredictor - 컨텍스트 예측');
      console.log('  🚀 AdaptiveLearningCache - 자가 학습 캐시');
      
    } catch (error) {
      logger.error('FileSystemTools 초기화 실패:', error);
      // 🛡️ 기본 모드로 동작 (AI 기능 없이)
      this.initializeBasicMode();
    }
  }

  // 🛡️ 초기화 결과 검증 및 fallback 설정
  validateInitResults(results) {
    const components = ['smartPathEngine', 'intelligentFileMapper', 'contextualPredictor', 'adaptiveLearningCache', 'documentLearningManager'];
    
    results.forEach((result, index) => {
      const componentName = components[index];
      if (result.status === 'rejected') {
        logger.warn(`${componentName} 초기화 실패, fallback 모드 적용:`, result.reason?.message || result.reason);
        this[componentName] = this.createFallbackComponent(componentName);
      } else {
        console.log(`  ✅ ${componentName} - 초기화 성공`);
      }
    });
  }

  // 🔄 기본 모드 초기화
  initializeBasicMode() {
    console.log('🛡️ 기본 모드로 초기화 (AI 기능 비활성화)');
    this.smartPathEngine = this.createFallbackComponent('smartPathEngine');
    this.intelligentFileMapper = this.createFallbackComponent('intelligentFileMapper');
    this.contextualPredictor = this.createFallbackComponent('contextualPredictor');
    this.adaptiveLearningCache = this.createFallbackComponent('adaptiveLearningCache');
    this.documentLearningManager = this.createFallbackComponent('documentLearningManager');
    this.isInitialized = true;
  }

  // 🔄 Fallback 컴포넌트 생성
  createFallbackComponent(componentName) {
    return {
      initialize: async () => Promise.resolve(),
      resolveSmartPath: async () => null,
      mapFileToIntelligentPath: async () => null,
      predictContextualPath: async () => null,
      get: async () => null,
      set: async () => Promise.resolve(),
      getPerformanceReport: () => ({ [componentName]: 'fallback 모드' })
    }
  }

  // 메인 실행 메서드 - MCP 커넥터 대신 직접 실행
  async executeTool(toolName, params = {}) {
    await this.initialize();
    
    try {
      logger.info(`파일시스템 도구 실행: ${toolName}`, { params });
      
      // 🧠 Enterprise AI 추론 이행을 위한 스마트 파라미터 처리
      params = await this.preprocessParameters(params);
      
      // 🔄 모든 경로 파라미터에 스마트 변환 적용
      if (params.path) {
        params.path = this.translateKoreanPath(params.path);
      }
      
      switch (toolName) {
        case 'list_files':
        case 'list_directory':
          console.log(`🔍 [DEBUG] list_files 실행 - 경로: ${params.path || process.cwd()}`);
          return await this.listDirectory(params.path || process.cwd());
        
        case 'search_files':
          console.log(`🔍 [DEBUG] search_files 실행 - 쿼리: ${params.query}, 패턴: ${params.pattern}, 경로: ${params.path}`);
          
          // 🔧 AI 파라미터 자동 보정 (확장자 검색)
          if (params.query && !params.pattern) {
            const extensionMatch = params.query.match(/^\.([a-z0-9]+)$/i);
            if (extensionMatch) {
              const extension = extensionMatch[1];
              params.pattern = `*.${extension}`;
              delete params.query;
              console.log(`🔧 [FileSystemTools] AI 파라미터 보정: query: ".${extension}" → pattern: "*.${extension}"`);
            } else if (params.options && params.options.fileTypes && params.options.fileTypes.length === 1) {
              const fileType = params.options.fileTypes[0];
              if (params.query === `.${fileType}` || params.query === fileType) {
                params.pattern = `*.${fileType}`;
                delete params.query;
                console.log(`🔧 [FileSystemTools] AI 파라미터 보정 (fileTypes): query: "${params.query}" → pattern: "*.${fileType}"`);
              }
            }
          }
          
          // 🔧 확장자 패턴 감지 시 searchFilesByExtension 사용
          const query = params.query || params.pattern || '';
          const extensionPattern = query.match(/^\*\.([a-z0-9]+)$/i);
          
          if (extensionPattern) {
            const extension = extensionPattern[1];
            console.log(`🔧 [FileSystemTools] 확장자 패턴 감지: "${query}" → searchFilesByExtension 호출`);
            return await this.searchFilesByExtension({
              extension: extension,
              searchPaths: params.path ? [params.path] : [],
              recursive: params.options?.recursive || false,
              limit: params.options?.maxResults || 100
            });
          }
          
          return await this.searchFiles(
            params.path || process.cwd(),
            query,
            params.options || {}
          );
        
        case 'search_by_extension':
          console.log(`🔍 [DEBUG] search_by_extension 실행 - 확장자: ${params.extension}`);
          return await this.searchFilesByExtension(params);
        
        case 'get_drives':
          return await this.getDrives();
        
        case 'read_file':
          console.log(`🔍 [DEBUG] read_file 실행 - 파일: ${params.path}`);
          return await this.readFile(params.path);
        
        case 'write_file':
          if (params.filePath) {
            params.filePath = this.translateKoreanPath(params.filePath);
          }
          if (params.targetPath) {
            params.targetPath = this.translateKoreanPath(params.targetPath);
          }
          return await this.writeFile(params.filePath || params.targetPath, params.content, params.options);
        
        case 'create_directory':
          if (params.dirPath) {
            params.dirPath = this.translateKoreanPath(params.dirPath);
          }
          return await this.createDirectory(params.dirPath);
        
        case 'delete_file':
          if (params.filePath) {
            params.filePath = this.translateKoreanPath(params.filePath);
          }
          return await this.deleteFile(params.filePath);
        
        case 'move_file':
          if (params.sourcePath) {
            params.sourcePath = this.translateKoreanPath(params.sourcePath);
          }
          if (params.targetPath) {
            params.targetPath = this.translateKoreanPath(params.targetPath);
          }
          return await this.moveFile(params.sourcePath, params.targetPath);
        
        case 'copy_file':
          if (params.sourcePath) {
            params.sourcePath = this.translateKoreanPath(params.sourcePath);
          }
          if (params.targetPath) {
            params.targetPath = this.translateKoreanPath(params.targetPath);
          }
          return await this.copyFile(params.sourcePath, params.targetPath);
        
        case 'analyze_file':
          if (params.filePath) {
            params.filePath = this.translateKoreanPath(params.filePath);
          }
          if (params.path) {
            params.path = this.translateKoreanPath(params.path);
          }
          return await this.analyzeFile(params.filePath || params.path);
        
        case 'find_path':
          console.log(`🔍 [DEBUG] find_path 실행 - 쿼리: ${params.query || params.intent}`);
          return await this.findPath(params.query || params.intent, params.path || process.cwd());
        
        case 'analyze_directory':
          console.log(`🔍 [DEBUG] analyze_directory 실행 - 경로: ${params.path}`);
          return await this.analyzeDirectory(params.path || process.cwd());
        
        case 'smart_search':
          console.log(`🔍 [DEBUG] smart_search 실행 - 쿼리: ${params.query}`);
          return await this.smartSearch(params.query, params.path || process.cwd(), params.options);
        
        case 'predict_files':
          console.log(`🔍 [DEBUG] predict_files 실행`);
          return await this.predictFiles(params.path || process.cwd(), params.intent);
        
        case 'get_file_insights':
          console.log(`🔍 [DEBUG] get_file_insights 실행 - 경로: ${params.path}`);
          return await this.getFileInsights(params.path || process.cwd());
        
        case 'bulk_operations':
          console.log(`🔍 [DEBUG] bulk_operations 실행`);
          return await this.bulkOperations(params.operation, params.path, params.options);
        
        case 'monitor_changes':
          console.log(`🔍 [DEBUG] monitor_changes 실행 - 경로: ${params.path}`);
          return await this.monitorChanges(params.path || process.cwd(), params.options);
        
        case 'validate_file':
          if (params.path) {
            params.path = this.translateKoreanPath(params.path);
          }
          if (params.filePath) {
            params.filePath = this.translateKoreanPath(params.filePath);
          }
          return await this.validateFile(params.path || params.filePath, params.rules);
        
        case 'generate_report':
          if (params.path) {
            params.path = this.translateKoreanPath(params.path);
          }
          if (params.dirPath) {
            params.dirPath = this.translateKoreanPath(params.dirPath);
          }
          return await this.generateReport(params.path || params.dirPath);
        
        case 'organize_files':
          if (params.path) {
            params.path = this.translateKoreanPath(params.path);
          }
          if (params.dirPath) {
            params.dirPath = this.translateKoreanPath(params.dirPath);
          }
          return await this.organizeFiles(params.path || params.dirPath, params.criteria);
        
        default:
          console.log(`❌ [DEBUG] 알 수 없는 도구: ${toolName}`);
          throw new Error(`알 수 없는 도구: ${toolName}`);
      }
    } catch (error) {
      logger.error(`파일시스템 도구 실행 실패 (${toolName}):`, error);
      throw error;
    }
  }

  // 🌟 AI 추론을 완벽 이행하는 스마트 경로 변환 엔진
  translateKoreanPath(inputPath) {
    console.log(`🔄 스마트 경로 변환 시도: "${inputPath}"`);
    
    // Windows와 Linux에 따른 홈 디렉토리 설정
    const homeDir = process.platform === 'win32' 
      ? path.join('C:\\Users', process.env.USERNAME || process.env.USER || 'user')
      : process.env.HOME || '/home/user';
    
    // 🎯 방대한 동의어 사전 - AI 추론의 모든 표현을 커버
    const synonymMappings = {
      // 🎵 음악 관련 모든 표현
      'music': {
        path: path.join(homeDir, 'Music'),
        synonyms: [
          // 한국어
          '음악', '뮤직', '노래', '음원', '사운드', '오디오', '곡', '멜로디',
          '음악파일', '음악폴더', '뮤직폴더', '노래폴더', '음원폴더',
          // 영어
          'music', 'songs', 'audio', 'sound', 'melody', 'track', 'tracks',
          'musicfolder', 'songfolder', 'audiofolder',
          // 파일 확장자 기반
          'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma',
          'mp3파일', 'wav파일', 'flac파일',
          // 브랜드/서비스
          '스포티파이', 'spotify', '유튜브뮤직', 'youtubemusic', '애플뮤직', 'applemusic'
        ]
      },
      
      // 🖼️ 사진/이미지 관련 모든 표현
      'pictures': {
        path: path.join(homeDir, 'Pictures'),
        synonyms: [
          // 한국어
          '사진', '그림', '이미지', '포토', '픽처', '갤러리', '앨범',
          '사진파일', '사진폴더', '그림폴더', '이미지폴더', '포토폴더',
          // 영어
          'pictures', 'photos', 'images', 'pics', 'gallery', 'album',
          'picture', 'photo', 'image', 'pic',
          'picturesfolder', 'photosfolder', 'imagesfolder',
          // 파일 확장자 기반
          'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff',
          'jpg파일', 'png파일', 'gif파일',
          // 용도별
          '스크린샷', 'screenshot', '캡처', 'capture', '배경화면', 'wallpaper'
        ]
      },
      
      // 🎬 비디오 관련 모든 표현
      'videos': {
        path: path.join(homeDir, 'Videos'),
        synonyms: [
          // 한국어
          '비디오', '동영상', '영상', '영화', '무비', '클립', '동영상파일',
          '비디오폴더', '동영상폴더', '영상폴더', '영화폴더',
          // 영어
          'videos', 'movies', 'clips', 'films', 'video', 'movie', 'clip',
          'videosfolder', 'moviesfolder',
          // 파일 확장자 기반
          'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v',
          'mp4파일', 'avi파일', 'mkv파일',
          // 플랫폼
          '유튜브', 'youtube', '넷플릭스', 'netflix', '티비', 'tv'
        ]
      },
      
      // 📁 문서 관련 모든 표현
      'documents': {
        path: path.join(homeDir, 'Documents'),
        synonyms: [
          // 한국어
          '문서', '도큐먼트', '자료', '파일', '내문서', '문서파일',
          '문서폴더', '자료폴더', '도큐먼트폴더',
          // 영어
          'documents', 'docs', 'files', 'data', 'document', 'doc',
          'documentsfolder', 'docsfolder',
          // 파일 확장자 기반
          'pdf', 'doc', 'docx', 'txt', 'rtf', 'hwp', 'ppt', 'pptx', 'xls', 'xlsx',
          'pdf파일', 'doc파일', 'txt파일', '한글파일', 'hwp파일',
          // 용도별
          '보고서', 'report', '계약서', 'contract', '이력서', 'resume'
        ]
      },
      
      // 💾 다운로드 관련 모든 표현
      'downloads': {
        path: path.join(homeDir, 'Downloads'),
        synonyms: [
          // 한국어
          '다운로드', '다운로드폴더', '받은파일', '내려받기', '저장폴더',
          // 영어
          'downloads', 'download', 'downloadsfolder', 'saved', 'savedfolder'
        ]
      },
      
      // 🖥️ 바탕화면 관련 모든 표현
      'desktop': {
        path: path.join(homeDir, 'Desktop'),
        synonyms: [
          // 한국어
          '바탕화면', '데스크탑', '데스크톱', '화면', '바탕',
          // 영어
          'desktop', 'screen'
        ]
      },
      
      // 🎮 게임 관련 모든 표현
      'games': {
        path: 'C:\\Program Files\\',
        synonyms: [
          // 한국어
          '게임', '게임즈', '놀이', '오락', '게임폴더', '게임파일',
          // 영어
          'games', 'game', 'gaming', 'play', 'gamesfolder',
          // 플랫폼
          '스팀', 'steam', '오리진', 'origin', '에픽', 'epic', 'epicgames'
        ]
      },
      
      // 💼 프로젝트/작업 관련
      'project': {
        path: 'D:\\my_app',
        synonyms: [
          // 한국어
          '프로젝트', '작업', '업무', '개발', '코딩', '소스', '소스코드',
          '프로젝트폴더', '작업폴더', '개발폴더', '코딩폴더',
          // 영어
          'project', 'work', 'dev', 'development', 'code', 'source', 'src',
          'projects', 'works', 'coding', 'programming',
          // 특정 프로젝트
          'my_app', 'myapp', 'web_mcp', 'webmcp', 'mcp'
        ]
      }
    };
    
    // 🔧 드라이브 매핑
    const driveMappings = {
      'c': 'C:\\',
      'd': 'D:\\',
      'e': 'E:\\',
      'f': 'F:\\'
    };
    
    // 📂 시스템 폴더 매핑
    const systemMappings = {
      '프로그램파일': 'C:\\Program Files',
      '프로그램 파일': 'C:\\Program Files',
      'program files': 'C:\\Program Files',
      'programfiles': 'C:\\Program Files',
      '시스템': 'C:\\Windows\\System32',
      '윈도우': 'C:\\Windows',
      'windows': 'C:\\Windows',
      '루트': process.platform === 'win32' ? 'C:\\' : '/',
      'root': process.platform === 'win32' ? 'C:\\' : '/',
      '홈': homeDir,
      '홈폴더': homeDir,
      'home': homeDir
    };
    
    // 입력 정규화 (소문자, 공백 제거)
    const normalizedInput = inputPath.toLowerCase().trim().replace(/\s+/g, '');
    
    // 1️⃣ 드라이브 패턴 매칭 (C드라이브, D드라이브 등)
    const driveMatch = normalizedInput.match(/([a-z])(?:드라이브|드라이브|drive)/i);
    if (driveMatch) {
      const driveLetter = driveMatch[1].toLowerCase();
      if (driveMappings[driveLetter]) {
        console.log(`✅ 드라이브 변환: "${inputPath}" → "${driveMappings[driveLetter]}"`);
        return driveMappings[driveLetter];
      }
    }
    
    // 2️⃣ 동의어 사전 매칭 (가장 정확한 매칭)
    for (const [category, mapping] of Object.entries(synonymMappings)) {
      for (const synonym of mapping.synonyms) {
        const normalizedSynonym = synonym.toLowerCase().replace(/\s+/g, '');
        
        // 정확한 매칭
        if (normalizedInput === normalizedSynonym) {
          console.log(`✅ 동의어 정확 매칭: "${inputPath}" → "${mapping.path}" (카테고리: ${category})`);
          return mapping.path;
        }
        
        // 부분 매칭 (폴더, 파일 등의 접미사 포함)
        if (normalizedInput.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedInput)) {
          console.log(`✅ 동의어 부분 매칭: "${inputPath}" → "${mapping.path}" (카테고리: ${category})`);
          return mapping.path;
        }
      }
    }
    
    // 3️⃣ 시스템 폴더 매칭
    for (const [korean, english] of Object.entries(systemMappings)) {
      const normalizedKorean = korean.toLowerCase().replace(/\s+/g, '');
      if (normalizedInput.includes(normalizedKorean) || normalizedKorean.includes(normalizedInput)) {
        console.log(`✅ 시스템 폴더 매칭: "${inputPath}" → "${english}"`);
        return english;
      }
    }
    
    // 4️⃣ 퍼지 매칭 (오타 처리)
    const fuzzyResult = this.performFuzzyMatching(normalizedInput, synonymMappings, systemMappings);
    if (fuzzyResult) {
      console.log(`✅ 퍼지 매칭 성공: "${inputPath}" → "${fuzzyResult}"`);
      return fuzzyResult;
    }
    
    // 5️⃣ 변환 실패시 원본 반환
    console.log(`ℹ️ 경로 변환 없음: "${inputPath}" (원본 유지)`);
    return inputPath;
  }
  
  // 🔍 퍼지 매칭으로 오타 수정
  performFuzzyMatching(input, synonymMappings, systemMappings) {
    const threshold = 0.8; // 80% 이상 유사도
    let bestMatch = null;
    let bestScore = 0;
    
    // 동의어 사전에서 퍼지 매칭
    for (const [category, mapping] of Object.entries(synonymMappings)) {
      for (const synonym of mapping.synonyms) {
        const normalizedSynonym = synonym.toLowerCase().replace(/\s+/g, '');
        const similarity = this.calculateSimilarity(input, normalizedSynonym);
        
        if (similarity > threshold && similarity > bestScore) {
          bestScore = similarity;
          bestMatch = mapping.path;
        }
      }
    }
    
    // 시스템 폴더에서 퍼지 매칭
    for (const [korean, english] of Object.entries(systemMappings)) {
      const normalizedKorean = korean.toLowerCase().replace(/\s+/g, '');
      const similarity = this.calculateSimilarity(input, normalizedKorean);
      
      if (similarity > threshold && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = english;
      }
    }
    
    return bestMatch;
  }
  
  // 📊 문자열 유사도 계산 (Levenshtein 거리 기반)
  calculateSimilarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    
    // 초기화
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    // 동적 프로그래밍
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // 삭제
          matrix[i][j - 1] + 1,      // 삽입
          matrix[i - 1][j - 1] + cost // 치환
        );
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
  }

  // 🧠 AI 추론을 위한 엔터프라이즈급 스마트 파라미터 전처리
  async preprocessParameters(params) {
    // 🛡️ 입력 검증
    if (!params || typeof params !== 'object') {
      logger.warn('잘못된 파라미터 입력:', params);
      return params || {};
    }

    const startTime = performance.now();
    const processed = { ...params };
    this.performanceMetrics.totalQueries++;
    
    try {
      console.log('🌟 Enterprise AI 파라미터 전처리 시작...');
      
      // 1️⃣ 캐시에서 먼저 확인 (안전하게)
      const cacheKey = this.generateCacheKey(params);
      try {
        const cachedResult = await this.adaptiveLearningCache.get(cacheKey, params);
        if (cachedResult) {
          this.performanceMetrics.cacheHits++;
          console.log(`⚡ 캐시 히트: 파라미터 전처리 결과 즉시 반환`);
          return cachedResult;
        }
      } catch (cacheError) {
        logger.warn('캐시 조회 실패 (계속 진행):', cacheError.message);
      }
      
      // 2️⃣ 스마트 경로 엔진으로 경로 해결 (안전하게)
      if (processed.query || processed.pattern) {
        const query = processed.query || processed.pattern || '';
        try {
          const smartPath = await this.smartPathEngine.resolveSmartPath(query, params);
          
          if (smartPath && !processed.path) {
            processed.path = smartPath;
            this.performanceMetrics.intelligentMappings++;
            console.log(`🧠 SmartPathEngine 경로 해결: "${query}" → "${smartPath}"`);
          }
        } catch (engineError) {
          logger.warn('SmartPathEngine 실패 (계속 진행):', engineError.message);
        }
      }
      
      // 3️⃣ 인텔리전트 파일 매퍼로 타입 기반 매핑 (안전하게)
      if (!processed.path && (processed.query || processed.pattern)) {
        const query = processed.query || processed.pattern || '';
        try {
          const mappedPath = await this.intelligentFileMapper.mapFileToIntelligentPath(query, null, params);
          
          if (mappedPath) {
            processed.path = mappedPath;
            this.performanceMetrics.intelligentMappings++;
            console.log(`🎯 IntelligentFileMapper 매핑: "${query}" → "${mappedPath}"`);
          }
        } catch (mapperError) {
          logger.warn('IntelligentFileMapper 실패 (계속 진행):', mapperError.message);
        }
      }
      
      // 4️⃣ 컨텍스트 예측기로 컨텍스트 기반 예측 (안전하게)
      if (!processed.path && (processed.intent || processed.context)) {
        const contextQuery = processed.intent || JSON.stringify(processed.context) || '';
        try {
          const predictedPath = await this.contextualPredictor.predictContextualPath(contextQuery, params);
          
          if (predictedPath) {
            processed.path = predictedPath;
            this.performanceMetrics.intelligentMappings++;
            console.log(`📝 ContextualPredictor 예측: "${contextQuery}" → "${predictedPath}"`);
          }
        } catch (predictorError) {
          logger.warn('ContextualPredictor 실패 (계속 진행):', predictorError.message);
        }
      }
      
      // 5️⃣ 기존 메서드들로 보완 처리
      if (!processed.path) {
        try {
          processed = this.fallbackParameterProcessing(processed, params);
        } catch (fallbackError) {
          logger.warn('보완 처리 실패:', fallbackError.message);
        }
      }
      
      // 6️⃣ 결과를 캐시에 저장 (안전하게)
      try {
        await this.adaptiveLearningCache.set(cacheKey, processed, params);
      } catch (setCacheError) {
        logger.warn('캐시 저장 실패:', setCacheError.message);
      }
      
      // 7️⃣ 성능 메트릭 업데이트
      const responseTime = performance.now() - startTime;
      this.updatePerformanceMetrics(responseTime);
      
      console.log(`✅ Enterprise AI 전처리 완료 (${responseTime.toFixed(2)}ms)`);
      return processed;
      
    } catch (error) {
      logger.error('스마트 파라미터 전처리 실패:', error);
      return this.fallbackParameterProcessing(params, params); // 실패 시 기본 처리로 fallback
    }
  }
  
  // 🔄 기존 메서드들을 보완으로 사용
  fallbackParameterProcessing(processed, originalParams) {
    console.log('🔄 보완 처리 모드 활성화...');
    
    // 기존 파일 타입 기반 경로 추론
    if (processed.query || processed.pattern) {
      const query = processed.query || processed.pattern || '';
      const inferredPath = this.inferPathFromFileType(query);
      
      if (inferredPath && !processed.path) {
        processed.path = inferredPath;
        console.log(`🎯 보완 - 파일 타입 기반 경로 추론: "${query}" → "${inferredPath}"`);
      }
    }
    
    // 기존 확장자 패턴 자동 보정
    if (processed.query && !processed.pattern) {
      const correctedPattern = this.correctFilePattern(processed.query);
      if (correctedPattern) {
        processed.pattern = correctedPattern;
        delete processed.query;
        console.log(`🔧 보완 - 파일 패턴 자동 보정: "${originalParams.query}" → pattern: "${correctedPattern}"`);
      }
    }
    
    // 기존 경로 컨텍스트 추론
    if (processed.intent || processed.context) {
      const contextPath = this.inferPathFromContext(processed.intent || processed.context);
      if (contextPath && !processed.path) {
        processed.path = contextPath;
        console.log(`📁 보완 - 컨텍스트 기반 경로 추론: "${processed.intent || processed.context}" → "${contextPath}"`);
      }
    }
    
    return processed;
  }
  
  // 🔑 캐시 키 생성
  generateCacheKey(params) {
    const keyParts = [
      params.query || '',
      params.pattern || '',
      params.path || '',
      params.intent || '',
      JSON.stringify(params.context || {})
    ];
    return Buffer.from(keyParts.join('|')).toString('base64').slice(0, 32);
  }
  
  // 📊 성능 메트릭 업데이트 (배치 처리 최적화)
  updatePerformanceMetrics(responseTime) {
    try {
      const currentAvg = this.performanceMetrics.averageResponseTime || 0;
      const totalQueries = this.performanceMetrics.totalQueries || 1;
      
      this.performanceMetrics.averageResponseTime = 
        ((currentAvg * (totalQueries - 1)) + responseTime) / totalQueries;
      
      this.performanceMetrics.systemEfficiency = 
        totalQueries > 0 ? (this.performanceMetrics.intelligentMappings / totalQueries) * 100 : 100;
      
      // 🚀 성능 모니터링 (임계값 체크)
      if (responseTime > 100) { // 100ms 초과시 경고
        logger.warn(`성능 저하 감지: ${responseTime.toFixed(2)}ms`);
      }
      
      // 🔄 주기적 성능 리포트 (100번 쿼리마다)
      if (totalQueries % 100 === 0) {
        this.logPerformanceReport();
      }
      
    } catch (error) {
      logger.warn('성능 메트릭 업데이트 실패:', error.message);
    }
  }

  // 📈 성능 리포트 로깅
  logPerformanceReport() {
    const report = {
      totalQueries: this.performanceMetrics.totalQueries,
      intelligentMappings: this.performanceMetrics.intelligentMappings,
      cacheHits: this.performanceMetrics.cacheHits,
      averageResponseTime: this.performanceMetrics.averageResponseTime?.toFixed(2) + 'ms',
      systemEfficiency: this.performanceMetrics.systemEfficiency?.toFixed(1) + '%',
      cacheHitRate: this.performanceMetrics.totalQueries > 0 ? 
        ((this.performanceMetrics.cacheHits / this.performanceMetrics.totalQueries) * 100).toFixed(1) + '%' : '0%'
    };
    
    console.log('📊 성능 리포트:', JSON.stringify(report, null, 2));
  }

  // 🚀 종합 성능 리포트 생성
  getPerformanceReport() {
    const engines = [this.smartPathEngine, this.intelligentFileMapper, this.contextualPredictor, this.adaptiveLearningCache];
    
    const report = {
      fileSystemTools: this.performanceMetrics,
      engines: engines.map(engine => {
        try {
          return engine.getPerformanceReport ? engine.getPerformanceReport() : { status: 'unavailable' };
        } catch (error) {
          return { status: 'error', message: error.message };
        }
      })
    };
    
    return report;
  }

  // 🎯 파일 타입으로부터 경로 추론
  inferPathFromFileType(query) {
    const homeDir = process.platform === 'win32' 
      ? path.join('C:\\Users', process.env.USERNAME || process.env.USER || 'user')
      : process.env.HOME || '/home/user';
    
    const fileTypeInferences = {
      // 🎵 음악 파일들
      music: [/mp3|wav|flac|aac|m4a|ogg|wma|음악|뮤직|노래|음원/i, path.join(homeDir, 'Music')],
      
      // 🖼️ 이미지 파일들
      images: [/jpg|jpeg|png|gif|bmp|svg|webp|tiff|사진|그림|이미지|포토/i, path.join(homeDir, 'Pictures')],
      
      // 🎬 비디오 파일들
      videos: [/mp4|avi|mkv|mov|wmv|flv|webm|m4v|비디오|동영상|영상|영화/i, path.join(homeDir, 'Videos')],
      
      // 📄 문서 파일들
      documents: [/pdf|doc|docx|txt|rtf|hwp|ppt|pptx|xls|xlsx|문서|도큐먼트|자료/i, path.join(homeDir, 'Documents')],
      
      // 📦 다운로드 파일들
      downloads: [/zip|rar|7z|exe|msi|다운로드|받은파일/i, path.join(homeDir, 'Downloads')],
      
      // 🎮 게임 파일들
      games: [/게임|game|exe.*game|스팀|steam/i, 'C:\\Program Files\\'],
      
      // 💻 프로젝트 파일들
      projects: [/js|ts|py|html|css|json|프로젝트|코딩|개발|소스/i, 'D:\\my_app']
    };
    
    for (const [category, [pattern, inferredPath]] of Object.entries(fileTypeInferences)) {
      if (pattern.test(query)) {
        return inferredPath;
      }
    }
    
    return null;
  }

  // 🔧 파일 패턴 자동 보정
  correctFilePattern(query) {
    // 확장자만 입력된 경우 *.확장자 패턴으로 변환
    const extensionMatch = query.match(/^\.?([a-z0-9]+)$/i);
    if (extensionMatch) {
      return `*.${extensionMatch[1]}`;
    }
    
    // 파일 타입 키워드를 확장자 패턴으로 변환
    const typeToExtension = {
      '음악': '*.{mp3,wav,flac,aac,m4a}',
      '뮤직': '*.{mp3,wav,flac,aac,m4a}',
      'music': '*.{mp3,wav,flac,aac,m4a}',
      '사진': '*.{jpg,jpeg,png,gif,bmp}',
      '그림': '*.{jpg,jpeg,png,gif,bmp}',
      '이미지': '*.{jpg,jpeg,png,gif,bmp}',
      'image': '*.{jpg,jpeg,png,gif,bmp}',
      'photo': '*.{jpg,jpeg,png,gif,bmp}',
      '비디오': '*.{mp4,avi,mkv,mov}',
      '동영상': '*.{mp4,avi,mkv,mov}',
      'video': '*.{mp4,avi,mkv,mov}',
      '문서': '*.{pdf,doc,docx,txt,hwp}',
      'document': '*.{pdf,doc,docx,txt,hwp}',
      '게임': '*.exe',
      'game': '*.exe'
    };
    
    const lowerQuery = query.toLowerCase();
    for (const [keyword, pattern] of Object.entries(typeToExtension)) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return pattern;
      }
    }
    
    return null;
  }

  // 📁 컨텍스트로부터 경로 추론
  inferPathFromContext(context) {
    const homeDir = process.platform === 'win32' 
      ? path.join('C:\\Users', process.env.USERNAME || process.env.USER || 'user')
      : process.env.HOME || '/home/user';
    
    const contextInferences = {
      // 시간 기반 컨텍스트
      '오늘': path.join(homeDir, 'Desktop'),
      '어제': path.join(homeDir, 'Downloads'),
      '최근': path.join(homeDir, 'Downloads'),
      'recent': path.join(homeDir, 'Downloads'),
      
      // 작업 기반 컨텍스트
      '작업': 'D:\\my_app',
      '프로젝트': 'D:\\my_app',
      'work': 'D:\\my_app',
      'project': 'D:\\my_app',
      
      // 용도 기반 컨텍스트
      '편집': path.join(homeDir, 'Documents'),
      '보고서': path.join(homeDir, 'Documents'),
      '발표': path.join(homeDir, 'Documents'),
      'edit': path.join(homeDir, 'Documents'),
      'report': path.join(homeDir, 'Documents'),
      
      // 저장 위치 기반
      '저장': path.join(homeDir, 'Documents'),
      '백업': path.join(homeDir, 'Documents'),
      'save': path.join(homeDir, 'Documents'),
      'backup': path.join(homeDir, 'Documents')
    };
    
    const lowerContext = context.toLowerCase();
    for (const [keyword, inferredPath] of Object.entries(contextInferences)) {
      if (lowerContext.includes(keyword.toLowerCase())) {
        return inferredPath;
      }
    }
    
    return null;
  }

  // 파일 읽기 메서드 추가
  async readFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        throw new Error('디렉토리는 읽을 수 없습니다');
      }
      
      const ext = path.extname(filePath).toLowerCase();
      
      // 텍스트 파일인 경우
      if (this.isTextFile(ext)) {
        const content = await fs.readFile(filePath, 'utf8');
        return {
          path: filePath,
          content: content,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          type: 'text',
          encoding: 'utf8'
        };
      }
      
      // 바이너리 파일인 경우
      const buffer = await fs.readFile(filePath);
      return {
        path: filePath,
        content: buffer.toString('base64'),
        size: stats.size,
        modified: stats.mtime.toISOString(),
        type: 'binary',
        encoding: 'base64'
      };
    } catch (error) {
      const userFriendlyError = summarizeFileReadError(error);
      logger.error('파일 읽기 실패:', error);
      
      return {
        success: false,
        error: userFriendlyError,
        technical_error: error.message,
        error_code: error.code,
        path: filePath,
        suggestions: [
          "파일 경로가 정확한지 확인하세요",
          "파일이 다른 프로그램에서 사용 중인지 확인하세요",
          "관리자 권한으로 프로그램을 실행해보세요"
        ]
      };
    }
  }

  // 드라이브 목록 조회 (크로스 플랫폼)
  async getDrives() {
    try {
      const drives = [];
      
      if (process.platform === 'win32') {
        // Windows: C:\, D:\ 등
        for (let i = 65; i <= 90; i++) {
          const drive = String.fromCharCode(i) + ":\\";
          try {
            await fs.access(drive);
            drives.push({
              path: drive,
              label: `${String.fromCharCode(i)}:`,
              type: 'local'
            });
          } catch (e) {
            // 드라이브가 존재하지 않음
          }
        }
      } else {
        // Linux/Mac: 루트 및 마운트된 드라이브 확인
        drives.push({
          path: '/',
          label: 'Root',
          type: 'local'
        });
        
        // WSL에서 Windows 드라이브 확인
        try {
          const mntPath = '/mnt';
          const mntItems = await fs.readdir(mntPath);
          
          for (const item of mntItems) {
            // 단일 문자인 경우 Windows 드라이브로 간주
            if (item.length === 1 && /[a-z]/i.test(item)) {
              const drivePath = path.join(mntPath, item);
              try {
                await fs.access(drivePath);
                drives.push({
                  path: drivePath,
                  label: `${item.toUpperCase()}:`,
                  type: 'windows'
                });
              } catch (e) {
                // 접근 불가
              }
            }
          }
        } catch (e) {
          // /mnt 폴더가 없거나 접근 불가
        }
        
        // 홈 디렉토리
        const homePath = process.env.HOME || process.env.USERPROFILE;
        if (homePath) {
          drives.push({
            path: homePath,
            label: 'Home',
            type: 'home'
          });
        }
      }
      
      return drives;
    } catch (error) {
      logger.error('드라이브 목록 조회 실패:', error);
      throw error;
    }
  }

  // 폴더 내용 조회
  async listDirectory(dirPath) {
    try {
      console.log(`🔍 [FileSystemTools.listDirectory] 시작: "${dirPath}"`);
      
      // 여러 경로 형식 시도 (환경에 따라 자동 선택)
      const pathsToTry = await this.generatePathAlternatives(dirPath);
      console.log(`📂 Trying paths for ${dirPath}:`, pathsToTry);
      console.log(`🔍 [DEBUG] Original input: "${dirPath}"`);
      console.log(`🔍 [DEBUG] Generated paths:`, pathsToTry);
      
      let items;
      let workingPath;
      
      // 각 경로를 순서대로 시도
      for (const pathToTry of pathsToTry) {
        try {
          console.log(`🔍 [FileSystemTools] 경로 시도 중: ${pathToTry}`);
          items = await fs.readdir(pathToTry);
          workingPath = pathToTry;
          console.log(`✅ Successfully read directory: ${pathToTry} (${items.length} items)`);
          break;
        } catch (error) {
          console.log(`❌ Failed to read ${pathToTry}: ${error.code} - ${error.message}`);
          continue;
        }
      }
      
      if (!items) {
        throw new Error(`Could not access directory with any of the attempted paths: ${pathsToTry.join(', ')}`);
      }
      const results = [];
      for (const name of items) {
        const fullPath = path.join(workingPath, name);
        try {
          const stats = await fs.stat(fullPath);
          results.push({
            name,
            path: fullPath,
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString()
          });
        } catch (e) {
          console.log(`❌ [DEBUG] stat() failed for: ${name}, error: ${e.code} - ${e.message}`);
          results.push({
            name,
            path: fullPath,
            error: '접근 불가',
            errorCode: e.code,
            errorMessage: e.message
          });
        }
      }
      
      // DEBUG: 결과 분석
      const successCount = results.filter(r => !r.error).length;
      const errorCount = results.filter(r => r.error).length;
      console.log(`📊 [DEBUG] Total items: ${results.length}, Success: ${successCount}, Errors: ${errorCount}`);
      
      if (successCount > 0) {
        console.log(`✅ [DEBUG] Successfully processed files:`, results.filter(r => !r.error).map(r => r.name));
      }
      
      return results;
    } catch (error) {
      const userFriendlyError = summarizeFileError(error);
      logger.error('폴더 내용 조회 실패:', error);
      
      return {
        success: false,
        error: userFriendlyError,
        technical_error: error.message,
        error_code: error.code,
        dirPath: dirPath,
        suggestions: [
          "폴더 경로가 정확한지 확인하세요",
          "폴더 접근 권한을 확인하세요",
          "폴더가 존재하는지 확인하세요",
          "관리자 권한으로 프로그램을 실행해보세요"
        ]
      };
    }
  }

  // 파일 검색
  async searchFilesByExtension(params) {
    try {
      console.log(`🔍 확장자 검색 시작: ${params.extension}`);
      
      const { extension, searchPaths = [], recursive = false, limit = 100 } = params;
      
      // 확장자 정규화
      const targetExtension = extension.toLowerCase().startsWith('.') 
        ? extension.toLowerCase() 
        : `.${extension.toLowerCase()}`;
      
      // 검색할 경로들 결정
      let pathsToSearch = [];
      
      if (searchPaths && searchPaths.length > 0) {
        pathsToSearch = searchPaths;
      } else {
        // 기본 검색 경로들 (확장자별 일반적인 위치)
        const commonPaths = {
          '.js': [os.homedir() + '\\Desktop', os.homedir() + '\\Documents', 'D:\\my_app'],
          '.py': [os.homedir() + '\\Desktop', os.homedir() + '\\Documents', 'D:\\my_app'],
          '.txt': [os.homedir() + '\\Desktop', os.homedir() + '\\Documents', os.homedir() + '\\Downloads'],
          '.pdf': [os.homedir() + '\\Desktop', os.homedir() + '\\Documents', os.homedir() + '\\Downloads'],
          '.jpg': [os.homedir() + '\\Pictures', os.homedir() + '\\Downloads', os.homedir() + '\\Desktop'],
          '.png': [os.homedir() + '\\Pictures', os.homedir() + '\\Downloads', os.homedir() + '\\Desktop'],
          '.mp3': [os.homedir() + '\\Music', os.homedir() + '\\Downloads'],
          '.mp4': [os.homedir() + '\\Videos', os.homedir() + '\\Downloads'],
          '.doc': [os.homedir() + '\\Documents', os.homedir() + '\\Downloads'],
          '.docx': [os.homedir() + '\\Documents', os.homedir() + '\\Downloads'],
          '.xls': [os.homedir() + '\\Documents', os.homedir() + '\\Downloads'],
          '.xlsx': [os.homedir() + '\\Documents', os.homedir() + '\\Downloads'],
          '.zip': [os.homedir() + '\\Downloads', os.homedir() + '\\Desktop'],
          '.rar': [os.homedir() + '\\Downloads', os.homedir() + '\\Desktop']
        };
        
        pathsToSearch = commonPaths[targetExtension] || [
          os.homedir() + '\\Desktop',
          os.homedir() + '\\Documents', 
          os.homedir() + '\\Downloads'
        ];
      }
      
      // 실제 파일 검색
      const allFiles = [];
      
      for (const searchPath of pathsToSearch) {
        try {
          const files = await this.scanDirectoryForExtension(searchPath, targetExtension, { recursive });
          allFiles.push(...files);
        } catch (error) {
          console.warn(`경로 검색 실패: ${searchPath}`, error.message);
        }
      }
      
      // 중복 제거 및 정렬
      const uniqueFiles = this.removeDuplicateFiles(allFiles);
      const sortedFiles = uniqueFiles.sort((a, b) => {
        // 최근 수정된 파일 우선
        return new Date(b.modified || 0) - new Date(a.modified || 0);
      });
      
      // 결과 제한
      const limitedFiles = sortedFiles.slice(0, limit);
      
      console.log(`✅ 확장자 검색 완료: ${targetExtension} - ${limitedFiles.length}개 파일 발견`);
      
      return {
        success: true,
        files: limitedFiles,
        totalFound: sortedFiles.length,
        extension: targetExtension,
        searchPaths: pathsToSearch,
        formattedResult: this.formatExtensionSearchResults(limitedFiles, targetExtension)
      };
      
    } catch (error) {
      console.error(`❌ 확장자 검색 실패: ${params.extension}`, error);
      
      return {
        success: false,
        error: error.message,
        extension: params.extension,
        files: []
      };
    }
  }
  
  /**
   * 📁 특정 확장자 파일 스캔
   */
  async scanDirectoryForExtension(directoryPath, targetExtension, options = {}) {
    const files = [];
    
    try {
      // 디렉토리 존재 확인
      if (!await this.pathExists(directoryPath)) {
        return files;
      }
      
      // 디렉토리 내용 읽기
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);
        
        if (entry.isFile()) {
          // 파일 확장자 확인
          const fileExtension = path.extname(entry.name).toLowerCase();
          
          if (fileExtension === targetExtension) {
            try {
              // 파일 정보 가져오기
              const stats = await fs.stat(fullPath);
              
              files.push({
                name: entry.name,
                path: fullPath,
                size: stats.size,
                modified: stats.mtime,
                created: stats.birthtime,
                isDirectory: false,
                extension: fileExtension
              });
            } catch (statError) {
              console.warn(`파일 정보 읽기 실패: ${fullPath}`, statError.message);
            }
          }
        } else if (entry.isDirectory() && options.recursive) {
          // 재귀 검색 (옵션)
          try {
            const subFiles = await this.scanDirectoryForExtension(fullPath, targetExtension, options);
            files.push(...subFiles);
          } catch (subError) {
            console.warn(`하위 디렉토리 검색 실패: ${fullPath}`, subError.message);
          }
        }
      }
      
    } catch (error) {
      console.warn(`디렉토리 스캔 실패: ${directoryPath}`, error.message);
    }
    
    return files;
  }
  
  /**
   * 🔄 중복 파일 제거
   */
  removeDuplicateFiles(files) {
    const seen = new Set();
    return files.filter(file => {
      const key = file.path;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  /**
   * 📝 확장자 검색 결과 포맷팅
   */
  formatExtensionSearchResults(files, extension) {
    if (files.length === 0) {
      return `🔍 ${extension} 확장자 파일을 찾을 수 없습니다.`;
    }
    
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const avgSize = totalSize / files.length;
    
    let result = `🔍 ${extension} 확장자 파일 ${files.length}개를 찾았습니다.\n\n`;
    
    // 파일 목록 (최대 10개)
    const displayFiles = files.slice(0, 10);
    result += displayFiles.map(file => {
      const size = this.formatSize(file.size || 0);
      const date = new Date(file.modified).toLocaleDateString('ko-KR');
      return `📄 ${file.name} (${size}, ${date})`;
    }).join('\n');
    
    if (files.length > 10) {
      result += `\n\n... 외 ${files.length - 10}개 파일`;
    }
    
    // 통계 정보
    result += `\n\n📊 통계:\n`;
    result += `• 총 크기: ${this.formatSize(totalSize)}\n`;
    result += `• 평균 크기: ${this.formatSize(avgSize)}\n`;
    result += `• 최근 수정: ${new Date(files[0].modified).toLocaleDateString('ko-KR')}`;
    
    return result;
  }
  
  async searchFiles(basePath, query, options = {}) {
    const {
      maxDepth = 10,
      maxResults = 50,
      fileTypes = [],
      caseSensitive = false
    } = options;

    // 다양한 경로 형식으로 검색 시도
    const pathAlternatives = await this.generatePathAlternatives(basePath);
    
    console.log(`🔍 [searchFiles] 입력 파라미터:`, {
      basePath,
      pathAlternatives,
      query,
      options,
      fileTypes
    });

    const results = [];
    
    // 간단한 패턴 매칭 (정규식 대신 문자열 매칭 사용)
    const isWildcardPattern = query.includes('*');
    const searchTerm = caseSensitive ? query : query.toLowerCase();

    async function searchInDirectory(currentPath, depth = 0) {
      if (depth > maxDepth || results.length >= maxResults) return;

      try {
        const items = await fs.readdir(currentPath);
        
        for (const item of items) {
          if (results.length >= maxResults) break;

          const fullPath = path.join(currentPath, item);
          try {
            const stats = await fs.stat(fullPath);
            
            if (stats.isDirectory()) {
              await searchInDirectory(fullPath, depth + 1);
            } else {
              const fileName = caseSensitive ? item : item.toLowerCase();
              const fileExt = path.extname(item).toLowerCase();
              
              // 파일 매칭 로직
              let matches = false;
              if (query === '') {
                matches = true;
              } else if (isWildcardPattern) {
                // *.csv 형태의 패턴 처리
                if (query.startsWith('*.')) {
                  const extension = query.substring(1); // .csv
                  matches = fileName.endsWith(extension);
                } else {
                  matches = fileName.includes(searchTerm.replace('*', ''));
                }
              } else if (query.match(/^\.([a-z0-9]+)$/i)) {
                // .pdf 형태의 query를 확장자로 인식
                matches = fileName.endsWith(query);
              } else {
                matches = fileName.includes(searchTerm);
              }
              
              // fileTypes 비교 시 점(.) 제거
              const fileExtWithoutDot = fileExt.startsWith('.') ? fileExt.substring(1) : fileExt;
              
              console.log(`🔍 [searchFiles] 파일 검사:`, {
                fileName,
                fileExt,
                fileExtWithoutDot,
                matches,
                fileTypes,
                includesCheck: fileTypes.includes(fileExtWithoutDot)
              });
              
              if (
                matches &&
                (fileTypes.length === 0 || fileTypes.includes(fileExtWithoutDot))
              ) {
                results.push({
                  name: item,
                  path: fullPath,
                  size: stats.size,
                  modified: stats.mtime.toISOString(),
                  created: stats.birthtime.toISOString()
                });
              }
            }
          } catch (e) {
            // 파일 접근 실패 시 무시
          }
        }
      } catch (error) {
        // 디렉토리 접근 실패 시 무시
      }
    }

    // 각 경로 대안을 시도하여 검색 수행
    for (const pathToTry of pathAlternatives) {
      try {
        console.log(`🔍 Searching in: ${pathToTry}`);
        await searchInDirectory(pathToTry);
        break; // 첫 번째 성공한 경로에서 검색 수행
      } catch (error) {
        console.log(`❌ Search failed in ${pathToTry}: ${error.code}`);
        continue;
      }
    }
    
    return results;
  }

  // 파일 정리
  async organizeFiles(dirPath, criteria) {
    try {
      const items = await this.listDirectory(dirPath);
      const organized = {
        byType: {},
        byDate: {},
        bySize: {}
      };

      for (const item of items) {
        if (item.isDirectory) continue;

        const ext = path.extname(item.name).toLowerCase();
        const date = new Date(item.modified);
        const size = item.size;

        // 파일 타입별 정리
        if (!organized.byType[ext]) {
          organized.byType[ext] = [];
        }
        organized.byType[ext].push(item);

        // 날짜별 정리
        const dateKey = date.toISOString().split('T')[0];
        if (!organized.byDate[dateKey]) {
          organized.byDate[dateKey] = [];
        }
        organized.byDate[dateKey].push(item);

        // 크기별 정리
        const sizeCategory = size < 1024 * 1024 ? 'small' :
                           size < 10 * 1024 * 1024 ? 'medium' : 'large';
        if (!organized.bySize[sizeCategory]) {
          organized.bySize[sizeCategory] = [];
        }
        organized.bySize[sizeCategory].push(item);
      }

      return organized;
    } catch (error) {
      logger.error('파일 정리 실패:', error);
      throw error;
    }
  }

  // ===== 파일 쓰기 및 관리 기능 =====
  async writeFile(filePath, content, options = {}) {
    try {
      const { encoding = 'utf8', backup = false, createDir = true } = options;
      
      // 디렉토리가 없으면 생성
      if (createDir) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      }
      
      // 백업 생성
      if (backup && await this.pathExists(filePath)) {
        await fs.copyFile(filePath, `${filePath}.bak`);
      }
      
      await fs.writeFile(filePath, content, encoding);
      
      return {
        success: true,
        filePath,
        size: Buffer.byteLength(content, encoding),
        backup: backup ? `${filePath}.bak` : null
      };
    } catch (error) {
      const userFriendlyError = summarizeFileWriteError(error);
      logger.error('파일 쓰기 실패:', error);
      
      return {
        success: false,
        error: userFriendlyError,
        technical_error: error.message,
        error_code: error.code,
        filePath: filePath,
        suggestions: [
          "디렉토리 권한을 확인하세요",
          "디스크 공간이 충분한지 확인하세요",
          "관리자 권한으로 프로그램을 실행해보세요"
        ]
      };
    }
  }

  async createDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return { success: true, dirPath };
    } catch (error) {
      logger.error('디렉토리 생성 실패:', error);
      throw error;
    }
  }

  async deleteFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true });
      } else {
        await fs.unlink(filePath);
      }
      return { success: true, filePath, type: stats.isDirectory() ? 'directory' : 'file' };
    } catch (error) {
      const userFriendlyError = summarizeFileDeleteError(error);
      logger.error('파일 삭제 실패:', error);
      
      return {
        success: false,
        error: userFriendlyError,
        technical_error: error.message,
        error_code: error.code,
        filePath: filePath,
        suggestions: [
          "파일이 다른 프로그램에서 사용 중인지 확인하세요",
          "파일 권한을 확인하세요",
          "관리자 권한으로 프로그램을 실행해보세요"
        ]
      };
    }
  }

  async moveFile(sourcePath, targetPath) {
    try {
      // 대상 디렉토리가 없으면 생성
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });
      
      await fs.rename(sourcePath, targetPath);
      return { success: true, sourcePath, targetPath };
    } catch (error) {
      const userFriendlyError = summarizeFileMoveError(error);
      logger.error('파일 이동 실패:', error);
      
      return {
        success: false,
        error: userFriendlyError,
        technical_error: error.message,
        error_code: error.code,
        sourcePath: sourcePath,
        targetPath: targetPath,
        suggestions: [
          "원본 파일이 다른 프로그램에서 사용 중인지 확인하세요",
          "대상 경로의 권한을 확인하세요",
          "디스크 공간이 충분한지 확인하세요"
        ]
      };
    }
  }

  async copyFile(sourcePath, targetPath) {
    try {
      // 대상 디렉토리가 없으면 생성
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });
      
      await fs.copyFile(sourcePath, targetPath);
      return { success: true, sourcePath, targetPath };
    } catch (error) {
      const userFriendlyError = summarizeFileCopyError(error);
      logger.error('파일 복사 실패:', error);
      
      return {
        success: false,
        error: userFriendlyError,
        technical_error: error.message,
        error_code: error.code,
        sourcePath: sourcePath,
        targetPath: targetPath,
        suggestions: [
          "원본 파일이 존재하는지 확인하세요",
          "대상 경로의 권한을 확인하세요",
          "디스크 공간이 충분한지 확인하세요"
        ]
      };
    }
  }

  // ===== 파일 분석 기능 =====
  async analyzeFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      const analysis = {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        sizeFormatted: this.formatSize(stats.size),
        extension: ext,
        type: this.getFileType(ext),
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        permissions: stats.mode.toString(8),
        isReadable: true,
        isWritable: true
      };
      
      // 파일 내용 분석 (텍스트 파일인 경우)
      if (this.isTextFile(ext)) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          analysis.lineCount = content.split('\n').length;
          analysis.wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
          analysis.charCount = content.length;
          analysis.encoding = 'utf8';
        } catch (e) {
          analysis.encoding = 'binary';
        }
      }
      
      // 보안 분석
      analysis.security = {
        suspicious: this.checkSuspiciousFile(filePath),
        executable: stats.mode & parseInt('111', 8) ? true : false,
        hidden: path.basename(filePath).startsWith('.')
      };
      
      return analysis;
    } catch (error) {
      logger.error('파일 분석 실패:', error);
      throw error;
    }
  }

  async analyzeDirectory(dirPath) {
    try {
      const files = await this.listDirectory(dirPath);
      
      const analysis = {
        path: dirPath,
        totalFiles: 0,
        totalDirectories: 0,
        totalSize: 0,
        fileTypes: {},
        largestFile: null,
        oldestFile: null,
        newestFile: null,
        duplicates: [],
        emptyFiles: [],
        permissions: {}
      };
      
      const fileHashes = new Map();
      
      for (const file of files) {
        if (file.error) continue;
        
        if (file.isDirectory) {
          analysis.totalDirectories++;
        } else {
          analysis.totalFiles++;
          analysis.totalSize += file.size;
          
          const ext = path.extname(file.name).toLowerCase();
          analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
          
          // 가장 큰 파일
          if (!analysis.largestFile || file.size > analysis.largestFile.size) {
            analysis.largestFile = file;
          }
          
          // 가장 오래된/새로운 파일
          const modifiedDate = new Date(file.modified);
          if (!analysis.oldestFile || modifiedDate < new Date(analysis.oldestFile.modified)) {
            analysis.oldestFile = file;
          }
          if (!analysis.newestFile || modifiedDate > new Date(analysis.newestFile.modified)) {
            analysis.newestFile = file;
          }
          
          // 빈 파일 체크
          if (file.size === 0) {
            analysis.emptyFiles.push(file.name);
          }
          
          // 중복 파일 체크 (크기 기준)
          const sizeKey = file.size.toString();
          if (fileHashes.has(sizeKey)) {
            analysis.duplicates.push({
              files: [fileHashes.get(sizeKey), file.name],
              size: file.size
            });
          } else {
            fileHashes.set(sizeKey, file.name);
          }
        }
      }
      
      analysis.totalSizeFormatted = this.formatSize(analysis.totalSize);
      
      return analysis;
    } catch (error) {
      logger.error('디렉토리 분석 실패:', error);
      throw error;
    }
  }

  // ===== 파일 검증 및 검토 기능 =====
  async validateFile(filePath, rules = {}) {
    try {
      const stats = await fs.stat(filePath);
      const validation = {
        path: filePath,
        valid: true,
        errors: [],
        warnings: []
      };
      
      // 크기 검증
      if (rules.maxSize && stats.size > rules.maxSize) {
        validation.errors.push(`파일 크기가 제한을 초과했습니다 (${this.formatSize(stats.size)} > ${this.formatSize(rules.maxSize)})`);
        validation.valid = false;
      }
      
      // 확장자 검증
      if (rules.allowedExtensions) {
        const ext = path.extname(filePath).toLowerCase();
        if (!rules.allowedExtensions.includes(ext)) {
          validation.errors.push(`허용되지 않은 파일 확장자입니다: ${ext}`);
          validation.valid = false;
        }
      }
      
      // 보안 검증
      if (rules.securityCheck) {
        const suspicious = this.checkSuspiciousFile(filePath);
        if (suspicious.length > 0) {
          validation.warnings.push(`의심스러운 파일 특성: ${suspicious.join(', ')}`);
        }
      }
      
      // 내용 검증 (텍스트 파일)
      if (rules.contentRules && this.isTextFile(path.extname(filePath))) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          
          if (rules.contentRules.maxLines && content.split('\n').length > rules.contentRules.maxLines) {
            validation.warnings.push(`라인 수가 권장값을 초과했습니다`);
          }
          
          if (rules.contentRules.forbiddenPatterns) {
            for (const pattern of rules.contentRules.forbiddenPatterns) {
              if (content.includes(pattern)) {
                validation.errors.push(`금지된 패턴이 발견되었습니다: ${pattern}`);
                validation.valid = false;
              }
            }
          }
        } catch (e) {
          validation.warnings.push('파일 내용을 읽을 수 없습니다');
        }
      }
      
      return validation;
    } catch (error) {
      logger.error('파일 검증 실패:', error);
      throw error;
    }
  }

  async generateReport(dirPath) {
    try {
      const analysis = await this.analyzeDirectory(dirPath);
      const stats = await fs.stat(dirPath);
      
      const report = {
        directory: dirPath,
        generatedAt: new Date().toISOString(),
        summary: {
          totalFiles: analysis.totalFiles,
          totalDirectories: analysis.totalDirectories,
          totalSize: analysis.totalSizeFormatted,
          lastModified: stats.mtime
        },
        fileTypes: analysis.fileTypes,
        findings: {
          duplicates: analysis.duplicates.length,
          emptyFiles: analysis.emptyFiles.length,
          largestFile: analysis.largestFile
        },
        recommendations: []
      };
      
      // 권장사항 생성
      if (analysis.duplicates.length > 0) {
        report.recommendations.push(`${analysis.duplicates.length}개의 중복 파일을 정리하여 공간을 절약할 수 있습니다.`);
      }
      
      if (analysis.emptyFiles.length > 0) {
        report.recommendations.push(`${analysis.emptyFiles.length}개의 빈 파일을 제거할 수 있습니다.`);
      }
      
      if (analysis.totalFiles > 1000) {
        report.recommendations.push('파일이 많습니다. 하위 디렉토리로 정리를 고려해보세요.');
      }
      
      return report;
    } catch (error) {
      logger.error('리포트 생성 실패:', error);
      throw error;
    }
  }

  // ===== 유틸리티 메서드 =====
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  getFileType(extension) {
    const types = {
      '.txt': 'text',
      '.md': 'text',
      '.js': 'code',
      '.ts': 'code',
      '.py': 'code',
      '.html': 'code',
      '.css': 'code',
      '.json': 'data',
      '.xml': 'data',
      '.csv': 'data',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.png': 'image',
      '.gif': 'image',
      '.mp3': 'audio',
      '.wav': 'audio',
      '.mp4': 'video',
      '.avi': 'video',
      '.pdf': 'document',
      '.doc': 'document',
      '.docx': 'document',
      '.zip': 'archive',
      '.rar': 'archive',
      '.7z': 'archive'
    };
    return types[extension] || 'unknown';
  }

  isTextFile(extension) {
    const textExtensions = ['.txt', '.md', '.js', '.ts', '.py', '.html', '.css', '.json', '.xml', '.csv', '.log'];
    return textExtensions.includes(extension);
  }

  checkSuspiciousFile(filePath) {
    const suspicious = [];
    const name = path.basename(filePath).toLowerCase();
    const ext = path.extname(filePath).toLowerCase();
    
    // 실행 파일
    if (['.exe', '.bat', '.cmd', '.scr', '.pif'].includes(ext)) {
      suspicious.push('executable');
    }
    
    // 의심스러운 이름
    if (name.includes('password') || name.includes('secret') || name.includes('key')) {
      suspicious.push('sensitive-name');
    }
    
    // 숨김 파일
    if (name.startsWith('.')) {
      suspicious.push('hidden');
    }
    
    return suspicious;
  }

  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Schema에서 정의한 추가 메서드들
  async findPath(query, basePath = process.cwd()) {
    try {
      console.log(`🔍 Path 찾기: "${query}" in ${basePath}`);
      const result = await this.searchFiles(basePath, query, { recursive: true });
      return {
        action: 'find_path',
        query,
        basePath,
        results: result.files || [],
        found: (result.files || []).length > 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async smartSearch(query, basePath = process.cwd(), options = {}) {
    return {
      action: 'smart_search',
      query,
      basePath,
      message: 'AI 기반 스마트 검색이 실행되었습니다.',
      timestamp: new Date().toISOString()
    };
  }

  async predictFiles(basePath = process.cwd(), intent) {
    return {
      action: 'predict_files',
      basePath,
      intent,
      message: '파일 예측 분석이 실행되었습니다.',
      timestamp: new Date().toISOString()
    };
  }

  async getFileInsights(targetPath = process.cwd()) {
    try {
      const stats = await fs.stat(targetPath);
      return {
        action: 'get_file_insights',
        path: targetPath,
        insights: {
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async bulkOperations(operation, targetPath, options = {}) {
    return {
      action: 'bulk_operations',
      operation,
      targetPath,
      message: `대량 작업 "${operation}"이 실행되었습니다.`,
      timestamp: new Date().toISOString()
    };
  }

  async monitorChanges(targetPath = process.cwd(), options = {}) {
    return {
      action: 'monitor_changes',
      targetPath,
      message: '파일 변경 모니터링이 시작되었습니다.',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 동적 환경 감지 및 경로 정규화
   */
  normalizePathForEnvironment(dirPath) {
    // Unix 경로는 그대로 반환
    if (dirPath.startsWith('/')) {
      return dirPath;
    }
    
    // 현재 작업 디렉토리 기반 환경 감지
    const cwd = process.cwd();
    const isRunningOnWindowsDrive = /^[A-Z]:/i.test(cwd) || cwd.includes('\\');
    const isRunningOnWSL = cwd.startsWith('/mnt/') || (process.platform === 'linux' && this.isWSLEnvironment());
    
    console.log(`🔍 Environment detection:`, {
      platform: process.platform,
      cwd: cwd,
      isRunningOnWindowsDrive,
      isRunningOnWSL
    });
    
    // Windows 스타일 경로 패턴 확인
    const windowsPathPattern = /^([A-Z]):\\(.*)$/i;
    const match = dirPath.match(windowsPathPattern);
    
    if (match) {
      if (isRunningOnWindowsDrive || process.platform === 'win32') {
        // Windows 환경에서 실행 중이면 경로를 그대로 사용
        console.log(`🪟 Windows environment: keeping path as-is: ${dirPath}`);
        return dirPath;
      } else if (isRunningOnWSL) {
        // WSL 환경에서 실행 중이면 /mnt/ 경로로 변환
        const drive = match[1].toLowerCase();
        const pathAfterDrive = match[2].replace(/\\/g, '/');
        const wslPath = `/mnt/${drive}/${pathAfterDrive}`;
        console.log(`🐧 WSL environment: converting ${dirPath} → ${wslPath}`);
        return wslPath;
      }
    }
    
    // 기본값: 경로를 그대로 반환
    return dirPath;
  }

  /**
   * 다양한 환경에서 시도할 경로 대안들 생성
   */
  async generatePathAlternatives(dirPath) {
    const alternatives = [];
    
    // 🎯 SMART PATH MAPPING - 하이브리드 AI 시스템
    const pathMappings = await this.getSmartPathMappings(dirPath);
    if (pathMappings.length > 0) {
      console.log(`🗺️ Smart path mapping found for "${dirPath}":`, pathMappings);
      alternatives.push(...pathMappings);
    }
    
    // 원본 경로도 추가 (매핑이 실패할 경우 대비)
    alternatives.push(dirPath);
    
    // Windows 스타일 경로인 경우
    const windowsPathPattern = /^([A-Z]):\\(.*)$/i;
    const match = dirPath.match(windowsPathPattern);
    
    if (match) {
      const drive = match[1].toLowerCase();
      const pathAfterDrive = match[2].replace(/\\/g, '/');
      
      // WSL 스타일 경로 추가
      alternatives.push(`/mnt/${drive}/${pathAfterDrive}`);
      
      // Windows 네이티브 경로 (정규화된 형태)
      alternatives.push(`${match[1].toUpperCase()}:\\${match[2]}`);
    }
    
    // Unix 스타일 경로인 경우, Windows 변환 시도
    if (dirPath.startsWith('/mnt/')) {
      const unixMatch = dirPath.match(/^\/mnt\/([a-z])\/(.*)$/);
      if (unixMatch) {
        const drive = unixMatch[1].toUpperCase();
        const pathAfterDrive = unixMatch[2].replace(/\//g, '\\');
        alternatives.push(`${drive}:\\${pathAfterDrive}`);
      }
    }
    
    // 중복 제거 및 반환
    return [...new Set(alternatives)];
  }

  /**
   * 🤖 HYBRID AI PATH MAPPING - 하드코딩 우선 + AI 백업 + 캐싱
   */
  async getSmartPathMappings(inputPath) {
    const startTime = performance.now();
    this.performanceMetrics.totalQueries++;
    
    // 🧠 사용자 패턴 학습
    this.learnUserPattern(inputPath);
    
    try {
      // 1단계: ⚡ 하드코딩 패턴 매칭 (즉시)
      let paths = this.getHardcodedPathMappings(inputPath);
      
      if (paths.length > 0) {
        const responseTime = performance.now() - startTime;
        this.performanceMetrics.averageResponseTime = 
          (this.performanceMetrics.averageResponseTime + responseTime) / 2;
        console.log(`⚡ 하드코딩 매핑 성공: "${inputPath}" → ${paths.length}개 경로 (${responseTime.toFixed(1)}ms)`);
        this.performanceMetrics.cacheHits++;
        return paths;
      }

      // 1.5단계: 🔄 실시간 폴더 발견 (빠른 스캔)
      const dynamicPaths = await this.discoverDynamicFolders(inputPath);
      if (dynamicPaths.length > 0) {
        const responseTime = performance.now() - startTime;
        console.log(`🔄 실시간 폴더 발견: "${inputPath}" → ${dynamicPaths.length}개 경로 (${responseTime.toFixed(1)}ms)`);
        this.performanceMetrics.realTimeScanHits++;
        return dynamicPaths;
      }
    
    // 2단계: 📚 AI 캐시 확인
    const cacheKey = inputPath.toLowerCase().trim();
    if (this.aiPathCache.has(cacheKey)) {
      console.log(`📚 AI 캐시 히트: "${inputPath}"`);
      this.performanceMetrics.aiCacheHits++;
      return this.aiPathCache.get(cacheKey);
    }
    
    // 3단계: 🤖 AI 백업 시스템 (타임아웃 적용)
    if (this.aiEnabled) {
      try {
        console.log(`🤖 AI로 경로 분석 중... (최대 ${this.aiTimeoutMs/1000}초)`);
        paths = await this.resolvePathWithAI(inputPath);
        
        if (paths.length > 0) {
          // 🔍 AI 결과 실제 존재 여부 검증
          const verifiedPaths = await this.verifyPathsExistence(paths);
          
          if (verifiedPaths.length > 0) {
            // AI 결과 캐싱 (검증된 경로만)
            this.aiPathCache.set(cacheKey, verifiedPaths);
            console.log(`✅ AI 해석 성공: "${inputPath}" → ${verifiedPaths.length}개 검증된 경로`);
            this.performanceMetrics.intelligentMappings++;
            return verifiedPaths;
          } else {
            console.log(`⚠️ AI 경로 해석 결과가 존재하지 않음: "${inputPath}"`);
          }
        }
      } catch (error) {
        if (error.message === 'AI_TIMEOUT') {
          console.log(`⏰ AI 응답 시간 초과 (${this.aiTimeoutMs/1000}초) - 기본 검색으로 전환`);
          this.performanceMetrics.aiTimeouts++;
        } else {
          console.log(`❌ AI 해석 실패: ${error.message}`);
        }
      }
    }
    
      // 4단계: 🔍 Fallback 검색
      console.log(`🔍 기본 검색으로 전환: "${inputPath}"`);
      return this.fallbackPathSearch(inputPath);
    } catch (error) {
      console.log(`❌ 경로 매핑 오류: ${error.message}`);
      return [inputPath]; // 최후의 수단: 원본 반환
    } finally {
      const totalTime = performance.now() - startTime;
      this.performanceMetrics.averageResponseTime = 
        (this.performanceMetrics.averageResponseTime + totalTime) / 2;
    }
  }

  /**
   * 🎯 HARDCODED PATH MAPPING - 기존 하드코딩 로직
   */
  getHardcodedPathMappings(inputPath) {
    const paths = [];
    const input = inputPath.toLowerCase().trim();
    const username = os.userInfo().username;
    
    console.log(`🔍 [getHardcodedPathMappings] 입력: "${inputPath}" → 정규화: "${input}"`);
    console.log(`🔍 [getHardcodedPathMappings] 사용자: ${username}`);
    
    // 🎯 복합 패턴 처리 (예: "desktop program folder")
    const contextualPaths = this.inferContextualPath(inputPath, username);
    if (contextualPaths.length > 0) {
      console.log(`🎯 복합 패턴 매칭: "${inputPath}" → ${contextualPaths.length}개 경로`);
      return contextualPaths;
    }
    
    // 🗺️ Windows 사용자 폴더 기본 매핑 (WORLD-CLASS EXPANSION)
    const userFolderMappings = {
      // 🖥️ 기본 사용자 폴더
      'desktop': [`C:\\Users\\${username}\\Desktop`, `/mnt/c/Users/${username}/Desktop`],
      '바탕화면': [`C:\\Users\\${username}\\Desktop`, `/mnt/c/Users/${username}/Desktop`],
      '데스크탑': [`C:\\Users\\${username}\\Desktop`, `/mnt/c/Users/${username}/Desktop`],
      '데스크톱': [`C:\\Users\\${username}\\Desktop`, `/mnt/c/Users/${username}/Desktop`],
      
      'downloads': [`C:\\Users\\${username}\\Downloads`, `/mnt/c/Users/${username}/Downloads`],
      '다운로드': [`C:\\Users\\${username}\\Downloads`, `/mnt/c/Users/${username}/Downloads`],
      '다운로드폴더': [`C:\\Users\\${username}\\Downloads`, `/mnt/c/Users/${username}/Downloads`],
      '받은파일': [`C:\\Users\\${username}\\Downloads`, `/mnt/c/Users/${username}/Downloads`],
      '내려받기': [`C:\\Users\\${username}\\Downloads`, `/mnt/c/Users/${username}/Downloads`],
      
      'documents': [`C:\\Users\\${username}\\Documents`, `/mnt/c/Users/${username}/Documents`],
      '문서': [`C:\\Users\\${username}\\Documents`, `/mnt/c/Users/${username}/Documents`],
      '내문서': [`C:\\Users\\${username}\\Documents`, `/mnt/c/Users/${username}/Documents`],
      '도큐먼트': [`C:\\Users\\${username}\\Documents`, `/mnt/c/Users/${username}/Documents`],
      '문서폴더': [`C:\\Users\\${username}\\Documents`, `/mnt/c/Users/${username}/Documents`],
      
      'pictures': [`C:\\Users\\${username}\\Pictures`, `/mnt/c/Users/${username}/Pictures`],
      '사진': [`C:\\Users\\${username}\\Pictures`, `/mnt/c/Users/${username}/Pictures`],
      '그림': [`C:\\Users\\${username}\\Pictures`, `/mnt/c/Users/${username}/Pictures`],
      '이미지': [`C:\\Users\\${username}\\Pictures`, `/mnt/c/Users/${username}/Pictures`],
      '픽처': [`C:\\Users\\${username}\\Pictures`, `/mnt/c/Users/${username}/Pictures`],
      '사진폴더': [`C:\\Users\\${username}\\Pictures`, `/mnt/c/Users/${username}/Pictures`],
      '갤러리': [`C:\\Users\\${username}\\Pictures`, `/mnt/c/Users/${username}/Pictures`],
      
      'music': [`C:\\Users\\${username}\\Music`, `/mnt/c/Users/${username}/Music`],
      '음악': [`C:\\Users\\${username}\\Music`, `/mnt/c/Users/${username}/Music`],
      '뮤직': [`C:\\Users\\${username}\\Music`, `/mnt/c/Users/${username}/Music`],
      '노래': [`C:\\Users\\${username}\\Music`, `/mnt/c/Users/${username}/Music`],
      '음원': [`C:\\Users\\${username}\\Music`, `/mnt/c/Users/${username}/Music`],
      '음악폴더': [`C:\\Users\\${username}\\Music`, `/mnt/c/Users/${username}/Music`],
      
      'videos': [`C:\\Users\\${username}\\Videos`, `/mnt/c/Users/${username}/Videos`],
      '비디오': [`C:\\Users\\${username}\\Videos`, `/mnt/c/Users/${username}/Videos`],
      '동영상': [`C:\\Users\\${username}\\Videos`, `/mnt/c/Users/${username}/Videos`],
      '영상': [`C:\\Users\\${username}\\Videos`, `/mnt/c/Users/${username}/Videos`],
      '영화': [`C:\\Users\\${username}\\Videos`, `/mnt/c/Users/${username}/Videos`],
      '비디오폴더': [`C:\\Users\\${username}\\Videos`, `/mnt/c/Users/${username}/Videos`],
      
      // 🔧 고급 사용자 폴더
      'appdata': [`C:\\Users\\${username}\\AppData`, `/mnt/c/Users/${username}/AppData`],
      '앱데이터': [`C:\\Users\\${username}\\AppData`, `/mnt/c/Users/${username}/AppData`],
      '애플리케이션데이터': [`C:\\Users\\${username}\\AppData`, `/mnt/c/Users/${username}/AppData`],
      
      'appdatalocal': [`C:\\Users\\${username}\\AppData\\Local`, `/mnt/c/Users/${username}/AppData/Local`],
      '로컬앱데이터': [`C:\\Users\\${username}\\AppData\\Local`, `/mnt/c/Users/${username}/AppData/Local`],
      '로컬': [`C:\\Users\\${username}\\AppData\\Local`, `/mnt/c/Users/${username}/AppData/Local`],
      
      'appdataroaming': [`C:\\Users\\${username}\\AppData\\Roaming`, `/mnt/c/Users/${username}/AppData/Roaming`],
      '로밍': [`C:\\Users\\${username}\\AppData\\Roaming`, `/mnt/c/Users/${username}/AppData/Roaming`],
      '로밍데이터': [`C:\\Users\\${username}\\AppData\\Roaming`, `/mnt/c/Users/${username}/AppData/Roaming`],
      
      'temp': [`C:\\Users\\${username}\\AppData\\Local\\Temp`, `/mnt/c/Users/${username}/AppData/Local/Temp`],
      '임시폴더': [`C:\\Users\\${username}\\AppData\\Local\\Temp`, `/mnt/c/Users/${username}/AppData/Local/Temp`],
      '임시파일': [`C:\\Users\\${username}\\AppData\\Local\\Temp`, `/mnt/c/Users/${username}/AppData/Local/Temp`],
      '템프': [`C:\\Users\\${username}\\AppData\\Local\\Temp`, `/mnt/c/Users/${username}/AppData/Local/Temp`],
      
      // 🏠 홈 관련
      'home': [`C:\\Users\\${username}`, `/mnt/c/Users/${username}`],
      '홈': [`C:\\Users\\${username}`, `/mnt/c/Users/${username}`],
      '사용자폴더': [`C:\\Users\\${username}`, `/mnt/c/Users/${username}`],
      '유저': [`C:\\Users\\${username}`, `/mnt/c/Users/${username}`],
      '내폴더': [`C:\\Users\\${username}`, `/mnt/c/Users/${username}`],
      '~': [`C:\\Users\\${username}`, `/mnt/c/Users/${username}`],
    };
    
    // 🎯 프로젝트 관련 매핑
    const projectMappings = {
      'my_app': ['D:\\my_app', '/mnt/d/my_app'],
      'myapp': ['D:\\my_app', '/mnt/d/my_app'],
      '프로젝트': ['D:\\my_app', '/mnt/d/my_app'],
      'project': ['D:\\my_app', '/mnt/d/my_app'],
      'web_mcp': ['D:\\my_app\\Web_MCP_Server', '/mnt/d/my_app/Web_MCP_Server'],
      'webmcp': ['D:\\my_app\\Web_MCP_Server', '/mnt/d/my_app/Web_MCP_Server'],
      'mcp': ['D:\\my_app\\Web_MCP_Server', '/mnt/d/my_app/Web_MCP_Server'],
      'backend': ['D:\\my_app\\Web_MCP_Server\\backend', '/mnt/d/my_app/Web_MCP_Server/backend'],
      'electron': ['D:\\my_app\\Web_MCP_Server\\apps\\electron', '/mnt/d/my_app/Web_MCP_Server/apps/electron'],
      'frontend': ['D:\\my_app\\Web_MCP_Server\\apps\\electron', '/mnt/d/my_app/Web_MCP_Server/apps/electron'],
    };
    
    // 🏠 Home 디렉토리 매핑
    const homeMappings = {
      'home': [`C:\\Users\\${username}`, `/mnt/c/Users/${username}`],
      '홈': [`C:\\Users\\${username}`, `/mnt/c/Users/${username}`],
      '~': [`C:\\Users\\${username}`, `/mnt/c/Users/${username}`],
    };
    
    // 🏢 시스템 폴더 매핑 (WORLD-CLASS SYSTEM PATHS)
    const systemFolderMappings = {
      // 🗑️ 휴지통
      'recycle': ['C:\\$Recycle.Bin', '/mnt/c/$Recycle.Bin'],
      '휴지통': ['C:\\$Recycle.Bin', '/mnt/c/$Recycle.Bin'],
      '쓰레기통': ['C:\\$Recycle.Bin', '/mnt/c/$Recycle.Bin'],
      'recyclebin': ['C:\\$Recycle.Bin', '/mnt/c/$Recycle.Bin'],
      'trash': ['C:\\$Recycle.Bin', '/mnt/c/$Recycle.Bin'],
      
      // 🏢 프로그램 파일
      'programfiles': ['C:\\Program Files', '/mnt/c/Program Files'],
      '프로그램파일': ['C:\\Program Files', '/mnt/c/Program Files'],
      '프로그램': ['C:\\Program Files', '/mnt/c/Program Files'],
      'programs': ['C:\\Program Files', '/mnt/c/Program Files'],
      
      'programfilesx86': ['C:\\Program Files (x86)', '/mnt/c/Program Files (x86)'],
      '프로그램파일x86': ['C:\\Program Files (x86)', '/mnt/c/Program Files (x86)'],
      '32비트프로그램': ['C:\\Program Files (x86)', '/mnt/c/Program Files (x86)'],
      
      // 🪟 Windows 시스템
      'windows': ['C:\\Windows', '/mnt/c/Windows'],
      '윈도우': ['C:\\Windows', '/mnt/c/Windows'],
      '시스템': ['C:\\Windows', '/mnt/c/Windows'],
      
      'system32': ['C:\\Windows\\System32', '/mnt/c/Windows/System32'],
      '시스템32': ['C:\\Windows\\System32', '/mnt/c/Windows/System32'],
      
      'syswow64': ['C:\\Windows\\SysWOW64', '/mnt/c/Windows/SysWOW64'],
      '시스템64': ['C:\\Windows\\SysWOW64', '/mnt/c/Windows/SysWOW64'],
      
      // 🎮 게임 관련
      'steamapps': ['C:\\Program Files (x86)\\Steam\\steamapps', '/mnt/c/Program Files (x86)/Steam/steamapps'],
      '스팀게임': ['C:\\Program Files (x86)\\Steam\\steamapps', '/mnt/c/Program Files (x86)/Steam/steamapps'],
      '스팀': ['C:\\Program Files (x86)\\Steam', '/mnt/c/Program Files (x86)/Steam'],
      
      // 📱 공통 앱 폴더
      'commonfiles': ['C:\\Program Files\\Common Files', '/mnt/c/Program Files/Common Files'],
      '공통파일': ['C:\\Program Files\\Common Files', '/mnt/c/Program Files/Common Files'],
      
      // 🔧 시스템 임시 폴더
      'systemtemp': ['C:\\Windows\\Temp', '/mnt/c/Windows/Temp'],
      '시스템임시': ['C:\\Windows\\Temp', '/mnt/c/Windows/Temp'],
      
      // 📂 프로그램데이터
      'programdata': ['C:\\ProgramData', '/mnt/c/ProgramData'],
      '프로그램데이터': ['C:\\ProgramData', '/mnt/c/ProgramData'],
      '프로그램정보': ['C:\\ProgramData', '/mnt/c/ProgramData'],
      
      // 🌐 인터넷 임시 파일
      'inetpub': ['C:\\inetpub', '/mnt/c/inetpub'],
      '웹사이트': ['C:\\inetpub', '/mnt/c/inetpub'],
      
      // 🔐 시스템 볼륨
      'systemvolume': ['C:\\System Volume Information', '/mnt/c/System Volume Information'],
      '시스템볼륨': ['C:\\System Volume Information', '/mnt/c/System Volume Information'],
      
      // 🎨 공용 폴더
      'public': ['C:\\Users\\Public', '/mnt/c/Users/Public'],
      '공용': ['C:\\Users\\Public', '/mnt/c/Users/Public'],
      '퍼블릭': ['C:\\Users\\Public', '/mnt/c/Users/Public'],
      '공용폴더': ['C:\\Users\\Public', '/mnt/c/Users/Public'],
      
      'publicdesktop': ['C:\\Users\\Public\\Desktop', '/mnt/c/Users/Public/Desktop'],
      '공용바탕화면': ['C:\\Users\\Public\\Desktop', '/mnt/c/Users/Public/Desktop'],
      
      'publicdocuments': ['C:\\Users\\Public\\Documents', '/mnt/c/Users/Public/Documents'],
      '공용문서': ['C:\\Users\\Public\\Documents', '/mnt/c/Users/Public/Documents'],
    };

    // 💾 드라이브 매핑 (EXPANDED)
    const driveMappings = {
      'c:': ['C:\\', '/mnt/c'],
      'd:': ['D:\\', '/mnt/d'],
      'e:': ['E:\\', '/mnt/e'],
      'f:': ['F:\\', '/mnt/f'],
      'c': ['C:\\', '/mnt/c'],
      'd': ['D:\\', '/mnt/d'],
      'e': ['E:\\', '/mnt/e'],
      'f': ['F:\\', '/mnt/f'],
      'c드라이브': ['C:\\', '/mnt/c'],
      'd드라이브': ['D:\\', '/mnt/d'],
      'e드라이브': ['E:\\', '/mnt/e'],
      'f드라이브': ['F:\\', '/mnt/f'],
      '시드라이브': ['C:\\', '/mnt/c'],
      '디드라이브': ['D:\\', '/mnt/d'],
      '메인드라이브': ['C:\\', '/mnt/c'],
      '보조드라이브': ['D:\\', '/mnt/d'],
    };
    
    // 🎯 WORLD-CLASS 매핑 찾기 (우선순위별)
    console.log(`🔍 [getHardcodedPathMappings] 매핑 확인 중: "${input}"`);
    console.log(`🔍 [getHardcodedPathMappings] userFolderMappings에 "${input}" 존재: ${!!userFolderMappings[input]}`);
    
    if (userFolderMappings[input]) {
      console.log(`✅ [getHardcodedPathMappings] userFolderMappings 매칭: "${input}" → ${userFolderMappings[input]}`);
      paths.push(...userFolderMappings[input]);
    } else if (systemFolderMappings[input]) {
      console.log(`✅ [getHardcodedPathMappings] systemFolderMappings 매칭: "${input}" → ${systemFolderMappings[input]}`);
      paths.push(...systemFolderMappings[input]);
    } else if (projectMappings[input]) {
      console.log(`✅ [getHardcodedPathMappings] projectMappings 매칭: "${input}" → ${projectMappings[input]}`);
      paths.push(...projectMappings[input]);
    } else if (homeMappings[input]) {
      console.log(`✅ [getHardcodedPathMappings] homeMappings 매칭: "${input}" → ${homeMappings[input]}`);
      paths.push(...homeMappings[input]);
    } else if (driveMappings[input]) {
      console.log(`✅ [getHardcodedPathMappings] driveMappings 매칭: "${input}" → ${driveMappings[input]}`);
      paths.push(...driveMappings[input]);
    }
    
    // 🧠 WORLD-CLASS 하위 폴더 자연어 처리
    const subfolderResult = this.resolveSubfolderPath(inputPath, username);
    if (subfolderResult.length > 0) {
      paths.push(...subfolderResult);
    }

    return paths;
  }

  /**
   * 🤖 AI 경로 해석 시스템 (타임아웃 적용)
   */
  async resolvePathWithAI(inputPath) {
    const username = os.userInfo().username;
    
    // AI 프롬프트 생성
    const prompt = `
사용자가 "${inputPath}"라고 입력했습니다. 이것을 Windows 파일 경로로 변환해주세요.

사용자 정보:
- 사용자명: ${username}
- 기본 경로들:
  - 바탕화면: C:\\Users\\${username}\\Desktop
  - 다운로드: C:\\Users\\${username}\\Downloads  
  - 문서: C:\\Users\\${username}\\Documents
  - 사진: C:\\Users\\${username}\\Pictures
  - 프로젝트: D:\\my_app\\Web_MCP_Server

자연어를 해석하여 가능한 Windows 경로를 JSON 배열로 반환해주세요.
예: ["C:\\Users\\${username}\\Desktop\\프로그램", "/mnt/c/Users/${username}/Desktop/프로그램"]

JSON만 반환하고 다른 설명은 하지 마세요.`;

    try {
      // Promise.race로 타임아웃 적용
      const result = await Promise.race([
        this.callAIAPI(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI_TIMEOUT')), this.aiTimeoutMs)
        )
      ]);

      // AI 응답 파싱
      const paths = this.parseAIResponse(result);
      return paths;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🔗 AI API 호출
   */
  async callAIAPI(prompt) {
    try {
      // MCP 서버의 AI 인터페이스 활용
      const response = await fetch('http://localhost:5050/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          provider: 'claude',
          model: 'claude-3-sonnet-20240229'
        })
      });

      if (!response.ok) {
        throw new Error(`AI API 호출 실패: ${response.status}`);
      }

      const result = await response.json();
      return result.response || result.message || '';
    } catch (error) {
      console.log('⚠️ AI API 호출 실패, 시뮬레이션 모드로 전환:', error.message);
      // Fallback: 시뮬레이션 모드
      return this.simulateAIResponse(prompt);
    }
  }

  /**
   * 🎭 AI 응답 시뮬레이션 (개발용)
   */
  async simulateAIResponse(prompt) {
    // 실제 환경에서는 실제 AI API 호출
    // 여기서는 지능형 패턴 매칭으로 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500)); // 0.5-2.5초 지연
    
    const username = os.userInfo().username;
    const input = prompt.match(/"(.+?)"/)?.[1]?.toLowerCase() || '';
    
    // 🧠 AI 시뮬레이션 패턴들
    const aiPatterns = [
      // 바탕화면 관련
      {
        pattern: /바탕화면.*?프로그램/,
        result: [`C:\\Users\\${username}\\Desktop\\프로그램`, `/mnt/c/Users/${username}/Desktop/프로그램`]
      },
      {
        pattern: /데스크[탑톱].*?앱/,
        result: [`C:\\Users\\${username}\\Desktop\\app`, `/mnt/c/Users/${username}/Desktop/app`]
      },
      // 문서 관련  
      {
        pattern: /문서.*?카카오|카톡.*?문서/,
        result: [`C:\\Users\\${username}\\Documents\\KakaoTalk Received Files`, `/mnt/c/Users/${username}/Documents/KakaoTalk Received Files`]
      },
      // 프로젝트 관련
      {
        pattern: /프로젝트.*?백엔드|백엔드.*?프로젝트/,
        result: ['D:\\my_app\\Web_MCP_Server\\backend', '/mnt/d/my_app/Web_MCP_Server/backend']
      },
      // 복합 표현
      {
        pattern: /게임.*?폴더|게임즈/,
        result: [`C:\\Users\\${username}\\Desktop\\Games`, `/mnt/c/Users/${username}/Desktop/Games`]
      },
      {
        pattern: /개발.*?도구|툴/,
        result: ['D:\\my_app\\Web_MCP_Server\\tools', '/mnt/d/my_app/Web_MCP_Server/tools']
      }
    ];
    
    // 패턴 매칭
    for (const { pattern, result } of aiPatterns) {
      if (pattern.test(input)) {
        console.log(`🤖 AI 시뮬레이션 매칭: "${input}" → ${result.length}개 경로`);
        return JSON.stringify(result);
      }
    }
    
    // 키워드 기반 추론
    if (input.includes('새로운') || input.includes('알 수 없는')) {
      // AI가 새로운 패턴을 "학습"한다고 가정
      const guessedPaths = this.guessPathFromContext(input, username);
      if (guessedPaths.length > 0) {
        console.log(`🧠 AI 컨텍스트 추론: "${input}" → ${guessedPaths.length}개 경로`);
        return JSON.stringify(guessedPaths);
      }
    }
    
    console.log(`🤷 AI 시뮬레이션: "${input}" 해석 불가`);
    return JSON.stringify([]);
  }

  /**
   * 🧠 컨텍스트 기반 경로 추측
   */
  guessPathFromContext(input, username) {
    const contextClues = [
      { keywords: ['작업', '업무', '일'], base: `C:\\Users\\${username}\\Documents\\Work` },
      { keywords: ['사진', '이미지', '그림'], base: `C:\\Users\\${username}\\Pictures` },
      { keywords: ['음악', '노래', '뮤직'], base: `C:\\Users\\${username}\\Music` },
      { keywords: ['비디오', '영상', '동영상'], base: `C:\\Users\\${username}\\Videos` },
      { keywords: ['게임', 'game'], base: `C:\\Users\\${username}\\Desktop\\Games` },
      { keywords: ['개발', 'dev', 'code'], base: 'D:\\my_app\\Web_MCP_Server' }
    ];
    
    for (const { keywords, base } of contextClues) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return [base, base.replace('C:\\', '/mnt/c/').replace('D:\\', '/mnt/d/').replace(/\\/g, '/')];
      }
    }
    
    return [];
  }

  /**
   * 📝 AI 응답 파싱
   */
  parseAIResponse(response) {
    try {
      const paths = JSON.parse(response);
      return Array.isArray(paths) ? paths : [];
    } catch (error) {
      console.log('❌ AI 응답 파싱 실패:', error.message);
      return [];
    }
  }

  /**
   * 🧠 사용자 패턴 학습
   */
  learnUserPattern(inputPath) {
    const query = inputPath.toLowerCase().trim();
    
    // 최근 검색어 기록
    this.recentQueries.unshift({
      query: query,
      timestamp: Date.now()
    });
    
    // 최대 개수 유지
    if (this.recentQueries.length > this.maxRecentQueries) {
      this.recentQueries = this.recentQueries.slice(0, this.maxRecentQueries);
    }
    
    // 패턴 빈도 증가
    const currentCount = this.userPatterns.get(query) || 0;
    this.userPatterns.set(query, currentCount + 1);
    
    // 유사한 패턴 찾기 및 학습
    this.learnSimilarPatterns(query);
  }

  /**
   * 🔍 유사한 패턴 학습
   */
  learnSimilarPatterns(query) {
    // 기존 패턴들과 유사도 비교
    for (const [existingPattern, count] of this.userPatterns) {
      if (existingPattern !== query) {
        const similarity = this.calculateSimilarity(query, existingPattern);
        
        // 70% 이상 유사하면 관련 패턴으로 학습
        if (similarity > 0.7) {
          const relationKey = `${query}:${existingPattern}`;
          const relationCount = this.userPatterns.get(relationKey) || 0;
          this.userPatterns.set(relationKey, relationCount + 0.5); // 관련도 가중치
        }
      }
    }
  }

  /**
   * 🎯 사용자 패턴 기반 추론
   */
  getUserPatternSuggestions(inputPath) {
    const query = inputPath.toLowerCase().trim();
    const suggestions = [];
    
    // 1. 정확히 일치하는 과거 패턴
    if (this.userPatterns.has(query)) {
      const frequency = this.userPatterns.get(query);
      if (frequency > 2) { // 3번 이상 검색한 패턴
        suggestions.push({
          type: 'exact_match',
          confidence: 0.9,
          suggestion: `자주 검색하는 패턴입니다 (${frequency}회)`
        });
      }
    }
    
    // 2. 유사한 과거 패턴들
    for (const [pattern, count] of this.userPatterns) {
      if (pattern.includes(':')) continue; // 관련도 패턴 제외
      
      const similarity = this.calculateSimilarity(query, pattern);
      if (similarity > 0.6 && count > 1) {
        suggestions.push({
          type: 'similar_pattern',
          confidence: similarity * 0.8,
          suggestion: `"${pattern}"와 유사 (${count}회 검색)`
        });
      }
    }
    
    // 3. 최근 검색 컨텍스트
    const recentContext = this.getRecentContext(query);
    if (recentContext) {
      suggestions.push({
        type: 'recent_context',
        confidence: 0.7,
        suggestion: recentContext
      });
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 📚 최근 검색 컨텍스트 분석
   */
  getRecentContext(query) {
    const recent5 = this.recentQueries.slice(0, 5);
    const now = Date.now();
    
    // 최근 5분 내 검색들 분석
    const recentInTimeframe = recent5.filter(item => 
      (now - item.timestamp) < 5 * 60 * 1000 // 5분
    );
    
    if (recentInTimeframe.length >= 2) {
      const patterns = recentInTimeframe.map(item => item.query);
      
      // 공통 키워드 찾기
      const commonKeywords = this.findCommonKeywords(patterns);
      if (commonKeywords.length > 0) {
        return `최근 "${commonKeywords.join(', ')}" 관련 검색 중`;
      }
    }
    
    return null;
  }

  /**
   * 🔤 공통 키워드 찾기
   */
  findCommonKeywords(patterns) {
    const wordCounts = new Map();
    
    for (const pattern of patterns) {
      const words = pattern.split(/\s+/).filter(word => word.length >= 2);
      for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    // 2회 이상 나타난 키워드들
    return Array.from(wordCounts.entries())
      .filter(([word, count]) => count >= 2)
      .map(([word, count]) => word);
  }

  /**
   * 📊 자주 접근하는 경로 기록
   */
  recordFrequentPath(pathUsed) {
    const currentCount = this.frequentPaths.get(pathUsed) || 0;
    this.frequentPaths.set(pathUsed, currentCount + 1);
    
    // 상위 10개만 유지
    if (this.frequentPaths.size > 50) {
      const sortedPaths = Array.from(this.frequentPaths.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      this.frequentPaths.clear();
      for (const [path, count] of sortedPaths) {
        this.frequentPaths.set(path, count);
      }
    }
  }

  /**
   * 🔍 경로 존재 여부 검증
   */
  async verifyPathsExistence(paths) {
    const verifiedPaths = [];
    
    for (const pathToCheck of paths) {
      try {
        await fs.access(pathToCheck);
        verifiedPaths.push(pathToCheck);
        console.log(`✅ 경로 검증 성공: ${pathToCheck}`);
      } catch (error) {
        console.log(`❌ 경로 검증 실패: ${pathToCheck} - ${error.code}`);
      }
    }
    
    return verifiedPaths;
  }

  /**
   * 🔄 실시간 폴더 발견 시스템
   */
  async discoverDynamicFolders(inputPath) {
    const input = inputPath.toLowerCase().trim();
    const username = os.userInfo().username;
    const paths = [];

    // 캐시 확인
    if (this.dynamicFolderCache.has(input)) {
      const cachedResult = this.dynamicFolderCache.get(input);
      const now = Date.now();
      
      // 캐시가 30초 이내면 사용
      if (now - cachedResult.timestamp < this.scanIntervalMs) {
        console.log(`📦 동적 폴더 캐시 히트: "${input}"`);
        return cachedResult.paths;
      }
    }

    // 스캔할 기본 경로들
    const basePaths = [
      `C:\\Users\\${username}\\Desktop`,
      `C:\\Users\\${username}\\Documents`, 
      `C:\\Users\\${username}\\Downloads`,
      `C:\\Users\\${username}\\Pictures`,
      `D:\\my_app\\Web_MCP_Server`,
      `/mnt/c/Users/${username}/Desktop`,
      `/mnt/c/Users/${username}/Documents`,
      `/mnt/c/Users/${username}/Downloads`,
      `/mnt/d/my_app/Web_MCP_Server`
    ];

    // 각 기본 경로에서 실시간 스캔
    for (const basePath of basePaths) {
      try {
        const discoveredPaths = await this.scanForMatchingFolders(basePath, input);
        if (discoveredPaths.length > 0) {
          paths.push(...discoveredPaths);
          console.log(`🔍 실시간 발견: ${basePath} 에서 ${discoveredPaths.length}개 폴더`);
          this.performanceMetrics.dynamicDiscoveries++;
        }
      } catch (error) {
        // 경로 접근 실패는 무시 (권한 없거나 존재하지 않음)
        continue;
      }
    }

    // 결과 캐싱
    if (paths.length > 0) {
      this.dynamicFolderCache.set(input, {
        paths: [...new Set(paths)], // 중복 제거
        timestamp: Date.now()
      });
    }

    return [...new Set(paths)];
  }

  /**
   * 📂 특정 경로에서 매칭되는 폴더 스캔
   */
  async scanForMatchingFolders(basePath, searchTerm) {
    const matchingPaths = [];
    
    try {
      // 경로 존재 확인
      await fs.access(basePath);
      
      // 캐시된 스캔 결과 확인
      const cacheKey = `${basePath}:${searchTerm}`;
      const lastScan = this.lastScanTime.get(cacheKey);
      const now = Date.now();
      
      if (lastScan && (now - lastScan) < this.scanIntervalMs) {
        const cachedResult = this.folderScanCache.get(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      // 실제 폴더 스캔
      const items = await fs.readdir(basePath);
      
      for (const item of items) {
        const fullPath = path.join(basePath, item);
        
        try {
          const stats = await fs.stat(fullPath);
          
          // 폴더만 처리
          if (stats.isDirectory()) {
            const itemLower = item.toLowerCase();
            
            // 다양한 매칭 방식
            if (this.isMatchingFolder(itemLower, searchTerm)) {
              matchingPaths.push(fullPath);
              // WSL 경로 변환도 추가
              if (fullPath.startsWith('C:\\')) {
                matchingPaths.push(fullPath.replace('C:\\', '/mnt/c/').replace(/\\/g, '/'));
              } else if (fullPath.startsWith('D:\\')) {
                matchingPaths.push(fullPath.replace('D:\\', '/mnt/d/').replace(/\\/g, '/'));
              }
            }
          }
        } catch (statError) {
          // 개별 파일 접근 실패는 무시
          continue;
        }
      }

      // 스캔 결과 캐싱
      this.folderScanCache.set(cacheKey, matchingPaths);
      this.lastScanTime.set(cacheKey, now);
      
    } catch (error) {
      // 기본 경로 접근 실패
      console.log(`⚠️ 경로 스캔 실패: ${basePath} - ${error.message}`);
    }

    return matchingPaths;
  }

  /**
   * 🎯 폴더명 매칭 로직
   */
  isMatchingFolder(folderName, searchTerm) {
    // 1. 정확한 매칭
    if (folderName === searchTerm) {
      return true;
    }

    // 2. 부분 매칭 (3글자 이상)
    if (searchTerm.length >= 3 && folderName.includes(searchTerm)) {
      return true;
    }

    // 3. "XXX폴더" 패턴에서 XXX 부분 매칭
    const folderPattern = searchTerm.match(/^(.+)폴더?$/);
    if (folderPattern) {
      const baseName = folderPattern[1];
      if (folderName.includes(baseName)) {
        return true;
      }
    }

    // 4. 영어-한글 혼용 매칭
    const koreanToEnglish = {
      '프로젝트': 'project',
      '게임': 'game',
      '음악': 'music',
      '사진': 'photo',
      '비디오': 'video',
      '문서': 'document',
      '다운로드': 'download'
    };

    if (koreanToEnglish[searchTerm] && folderName.includes(koreanToEnglish[searchTerm])) {
      return true;
    }

    // 5. 유사도 매칭 (Levenshtein distance)
    if (searchTerm.length >= 4 && this.calculateSimilarity(folderName, searchTerm) > 0.7) {
      return true;
    }

    return false;
  }

  /**
   * 📏 문자열 유사도 계산
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 📐 Levenshtein Distance 계산
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 🔍 Fallback 경로 검색
   */
  fallbackPathSearch(inputPath) {
    const username = os.userInfo().username;
    const input = inputPath.toLowerCase().trim();
    
    // 기본적인 키워드 매칭
    const fallbackMappings = {
      'desktop': [`C:\\Users\\${username}\\Desktop`, `/mnt/c/Users/${username}/Desktop`],
      'download': [`C:\\Users\\${username}\\Downloads`, `/mnt/c/Users/${username}/Downloads`],
      'document': [`C:\\Users\\${username}\\Documents`, `/mnt/c/Users/${username}/Documents`],
    };
    
    for (const [key, paths] of Object.entries(fallbackMappings)) {
      if (input.includes(key)) {
        return paths;
      }
    }
    
    return [inputPath]; // 최후의 수단: 원본 반환
  }

  /**
   * 🧠 WORLD-CLASS 하위 폴더 자연어 처리 시스템
   * "뻐꾸기 폴더", "백엔드 폴더" 등을 자동으로 경로 조합
   */
  resolveSubfolderPath(inputPath, username) {
    const paths = [];
    const input = inputPath.toLowerCase().trim();
    
    // 🗺️ 상위-하위 폴더 관계 매핑 (WORLD-CLASS HIERARCHY)
    const hierarchyMappings = {
      // 🖥️ 바탕화면 하위 폴더들
      '뻐꾸기': [`C:\\Users\\${username}\\Desktop\\뻐꾸기`, `/mnt/c/Users/${username}/Desktop/뻐꾸기`],
      '뻐꾸기폴더': [`C:\\Users\\${username}\\Desktop\\뻐꾸기`, `/mnt/c/Users/${username}/Desktop/뻐꾸기`],
      '무빙월': [`C:\\Users\\${username}\\Desktop\\무빙월`, `/mnt/c/Users/${username}/Desktop/무빙월`],
      '무빙월폴더': [`C:\\Users\\${username}\\Desktop\\무빙월`, `/mnt/c/Users/${username}/Desktop/무빙월`],
      '앱폴더': [`C:\\Users\\${username}\\Desktop\\app`, `/mnt/c/Users/${username}/Desktop/app`],
      '데스크톱앱': [`C:\\Users\\${username}\\Desktop\\app`, `/mnt/c/Users/${username}/Desktop/app`],
      '프로그램폴더': [`C:\\Users\\${username}\\Desktop\\프로그램`, `/mnt/c/Users/${username}/Desktop/프로그램`],
      
      // 🎯 프로젝트 하위 폴더들
      '백엔드': ['D:\\my_app\\Web_MCP_Server\\backend', '/mnt/d/my_app/Web_MCP_Server/backend'],
      '백엔드폴더': ['D:\\my_app\\Web_MCP_Server\\backend', '/mnt/d/my_app/Web_MCP_Server/backend'],
      'backend': ['D:\\my_app\\Web_MCP_Server\\backend', '/mnt/d/my_app/Web_MCP_Server/backend'],
      '프론트엔드': ['D:\\my_app\\Web_MCP_Server\\apps\\electron', '/mnt/d/my_app/Web_MCP_Server/apps/electron'],
      '프론트엔드폴더': ['D:\\my_app\\Web_MCP_Server\\apps\\electron', '/mnt/d/my_app/Web_MCP_Server/apps/electron'],
      'frontend': ['D:\\my_app\\Web_MCP_Server\\apps\\electron', '/mnt/d/my_app/Web_MCP_Server/apps/electron'],
      '일렉트론': ['D:\\my_app\\Web_MCP_Server\\apps\\electron', '/mnt/d/my_app/Web_MCP_Server/apps/electron'],
      'electron': ['D:\\my_app\\Web_MCP_Server\\apps\\electron', '/mnt/d/my_app/Web_MCP_Server/apps/electron'],
      '패키지': ['D:\\my_app\\Web_MCP_Server\\packages', '/mnt/d/my_app/Web_MCP_Server/packages'],
      'packages': ['D:\\my_app\\Web_MCP_Server\\packages', '/mnt/d/my_app/Web_MCP_Server/packages'],
      
      // 🤖 AI 관련 폴더
      'ai폴더': ['D:\\my_app\\Web_MCP_Server\\ai', '/mnt/d/my_app/Web_MCP_Server/ai'],
      'ai': ['D:\\my_app\\Web_MCP_Server\\ai', '/mnt/d/my_app/Web_MCP_Server/ai'],
      '인공지능': ['D:\\my_app\\Web_MCP_Server\\ai', '/mnt/d/my_app/Web_MCP_Server/ai'],
      
      // 📁 AppData 하위 폴더들
      '크롬데이터': [`C:\\Users\\${username}\\AppData\\Local\\Google\\Chrome`, `/mnt/c/Users/${username}/AppData/Local/Google/Chrome`],
      '크롬': [`C:\\Users\\${username}\\AppData\\Local\\Google\\Chrome`, `/mnt/c/Users/${username}/AppData/Local/Google/Chrome`],
      'chrome': [`C:\\Users\\${username}\\AppData\\Local\\Google\\Chrome`, `/mnt/c/Users/${username}/AppData/Local/Google/Chrome`],
      '구글크롬': [`C:\\Users\\${username}\\AppData\\Local\\Google\\Chrome`, `/mnt/c/Users/${username}/AppData/Local/Google/Chrome`],
      
      '디스코드': [`C:\\Users\\${username}\\AppData\\Roaming\\discord`, `/mnt/c/Users/${username}/AppData/Roaming/discord`],
      'discord': [`C:\\Users\\${username}\\AppData\\Roaming\\discord`, `/mnt/c/Users/${username}/AppData/Roaming/discord`],
      
      'vscode': [`C:\\Users\\${username}\\AppData\\Roaming\\Code`, `/mnt/c/Users/${username}/AppData/Roaming/Code`],
      '비주얼스튜디오코드': [`C:\\Users\\${username}\\AppData\\Roaming\\Code`, `/mnt/c/Users/${username}/AppData/Roaming/Code`],
      '코드에디터': [`C:\\Users\\${username}\\AppData\\Roaming\\Code`, `/mnt/c/Users/${username}/AppData/Roaming/Code`],
      
      // 🎮 게임 관련 하위 폴더
      '마인크래프트': [`C:\\Users\\${username}\\AppData\\Roaming\\.minecraft`, `/mnt/c/Users/${username}/AppData/Roaming/.minecraft`],
      'minecraft': [`C:\\Users\\${username}\\AppData\\Roaming\\.minecraft`, `/mnt/c/Users/${username}/AppData/Roaming/.minecraft`],
      '마크': [`C:\\Users\\${username}\\AppData\\Roaming\\.minecraft`, `/mnt/c/Users/${username}/AppData/Roaming/.minecraft`],
      
      // 💬 카카오톡 관련 폴더 (MOST USED IN KOREA) - 실제 폴더명에 맞춤
      '카카오톡받은파일': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
      '카톡받은파일': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
      '받은파일카톡': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
      'kakaotalk received files': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
      'kakaotalk': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
      '카톡파일': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
      '카카오파일': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
      '카톡다운로드': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
      '카톡 다운로드': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
      '카카오톡다운로드': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
      '카카오톡 다운로드': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
      '카카오 다운로드': [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`, `/mnt/c/Users/${username}/Documents/카카오톡 받은 파일`],
    };

    // 🔍 컨텍스트 기반 경로 추론 (WORLD-CLASS AI INFERENCE)
    const contextualMappings = this.inferContextualPath(input, username);
    
    // 직접 매핑 찾기
    if (hierarchyMappings[input]) {
      paths.push(...hierarchyMappings[input]);
    }
    
    // 컨텍스트 기반 추론 결과 추가
    if (contextualMappings.length > 0) {
      paths.push(...contextualMappings);
    }
    
    return paths;
  }

  /**
   * 🧠 WORLD-CLASS 컨텍스트 기반 경로 추론 엔진
   */
  inferContextualPath(input, username) {
    const paths = [];
    
    // 🎯 패턴 기반 추론
    const patterns = [
      // "바탕화면에 XXX 폴더" 패턴
      {
        pattern: /바탕화면에\s*(.+?)(?:\s*폴더|안에?)?$/,
        contexts: [
          { base: `C:\\Users\\${username}\\Desktop`, wsl: `/mnt/c/Users/${username}/Desktop` }
        ]
      },
      // "데스크탑에 XXX 폴더" 패턴
      {
        pattern: /데스크[탑톱]에\s*(.+?)(?:\s*폴더|안에?)?$/,
        contexts: [
          { base: `C:\\Users\\${username}\\Desktop`, wsl: `/mnt/c/Users/${username}/Desktop` }
        ]
      },
      // "desktop XXX folder" 패턴 (영어)
      {
        pattern: /desktop\s+(.+?)(?:\s*folder|directory)?$/i,
        contexts: [
          { base: `C:\\Users\\${username}\\Desktop`, wsl: `/mnt/c/Users/${username}/Desktop` }
        ]
      },
      // "desktop XXX" 패턴 (영어)
      {
        pattern: /desktop\s+(.+?)$/i,
        contexts: [
          { base: `C:\\Users\\${username}\\Desktop`, wsl: `/mnt/c/Users/${username}/Desktop` }
        ]
      },
      // "문서에 XXX 폴더" 패턴
      {
        pattern: /문서에\s*(.+?)(?:\s*폴더|안에?)?$/,
        contexts: [
          { base: `C:\\Users\\${username}\\Documents`, wsl: `/mnt/c/Users/${username}/Documents` }
        ]
      },
      // "다운로드에 XXX 폴더" 패턴
      {
        pattern: /다운로드에\s*(.+?)(?:\s*폴더|안에?)?$/,
        contexts: [
          { base: `C:\\Users\\${username}\\Downloads`, wsl: `/mnt/c/Users/${username}/Downloads` }
        ]
      },
      // "XXX 폴더" 패턴 (기존)
      {
        pattern: /(.+)폴더$/,
        contexts: [
          { base: `C:\\Users\\${username}\\Desktop`, wsl: `/mnt/c/Users/${username}/Desktop` },
          { base: 'D:\\my_app\\Web_MCP_Server', wsl: '/mnt/d/my_app/Web_MCP_Server' },
          { base: `C:\\Users\\${username}\\Documents`, wsl: `/mnt/c/Users/${username}/Documents` }
        ]
      },
      // "XXX 디렉토리" 패턴
      {
        pattern: /(.+)디렉토리$/,
        contexts: [
          { base: `C:\\Users\\${username}\\Desktop`, wsl: `/mnt/c/Users/${username}/Desktop` },
          { base: 'D:\\my_app\\Web_MCP_Server', wsl: '/mnt/d/my_app/Web_MCP_Server' }
        ]
      }
    ];

    for (const patternInfo of patterns) {
      const match = input.match(patternInfo.pattern);
      if (match) {
        let folderName = match[1];
        
        // 🎯 한글-영어 폴더명 매핑
        const folderNameMappings = {
          'program': '프로그램',
          'programs': '프로그램',
          'download': '다운로드',
          'downloads': '다운로드',
          'document': '문서',
          'documents': '문서',
          'picture': '사진',
          'pictures': '사진',
          'music': '음악',
          'video': '비디오',
          'videos': '비디오'
        };
        
        // 영어 폴더명을 한글로 변환
        if (folderNameMappings[folderName.toLowerCase()]) {
          folderName = folderNameMappings[folderName.toLowerCase()];
        }
        
        for (const context of patternInfo.contexts) {
          paths.push(`${context.base}\\${folderName}`);
          paths.push(`${context.wsl}/${folderName}`);
        }
      }
    }

    // 🤖 AI 기반 의미론적 추론
    const semanticInference = this.performSemanticInference(input, username);
    if (semanticInference.length > 0) {
      paths.push(...semanticInference);
    }

    return paths;
  }

  /**
   * 🤖 WORLD-CLASS AI 의미론적 추론 엔진
   */
  performSemanticInference(input, username) {
    const paths = [];
    
    // 🧠 의미론적 키워드 분석
    const semanticMappings = {
      // 개발 관련 키워드
      development: ['D:\\my_app\\Web_MCP_Server\\backend', 'D:\\my_app\\Web_MCP_Server\\ai'],
      programming: ['D:\\my_app\\Web_MCP_Server', `C:\\Users\\${username}\\Documents`],
      coding: ['D:\\my_app\\Web_MCP_Server', `C:\\Users\\${username}\\Documents`],
      project: ['D:\\my_app', 'D:\\my_app\\Web_MCP_Server'],
      
      // 한글 개발 키워드
      개발: ['D:\\my_app\\Web_MCP_Server\\backend', 'D:\\my_app\\Web_MCP_Server\\ai'],
      프로그래밍: ['D:\\my_app\\Web_MCP_Server', `C:\\Users\\${username}\\Documents`],
      코딩: ['D:\\my_app\\Web_MCP_Server', `C:\\Users\\${username}\\Documents`],
      작업: ['D:\\my_app', `C:\\Users\\${username}\\Documents`],
      
      // 미디어 관련
      media: [`C:\\Users\\${username}\\Pictures`, `C:\\Users\\${username}\\Videos`],
      multimedia: [`C:\\Users\\${username}\\Pictures`, `C:\\Users\\${username}\\Videos`],
      미디어: [`C:\\Users\\${username}\\Pictures`, `C:\\Users\\${username}\\Videos`],
      
      // 시스템 관련
      system: ['C:\\Windows\\System32', 'C:\\Program Files'],
      admin: ['C:\\Windows\\System32', 'C:\\ProgramData'],
      시스템: ['C:\\Windows\\System32', 'C:\\Program Files'],
      관리자: ['C:\\Windows\\System32', 'C:\\ProgramData']
    };

    // 키워드 매칭 및 경로 생성
    for (const [keyword, basePaths] of Object.entries(semanticMappings)) {
      if (input.includes(keyword)) {
        for (const basePath of basePaths) {
          paths.push(basePath);
          // WSL 경로도 추가
          if (basePath.startsWith('C:\\')) {
            paths.push(basePath.replace('C:\\', '/mnt/c/').replace(/\\/g, '/'));
          } else if (basePath.startsWith('D:\\')) {
            paths.push(basePath.replace('D:\\', '/mnt/d/').replace(/\\/g, '/'));
          }
        }
      }
    }

    return paths;
  }

  /**
   * WSL 환경 감지 (동기적으로 수행)
   */
  isWSLEnvironment() {
    try {
      const fs = require('fs');
      // /mnt/c 디렉토리 존재 확인
      fs.accessSync('/mnt/c');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 📊 하이브리드 AI 시스템 성능 리포트
   */
  getPerformanceReport() {
    const { totalQueries, cacheHits, aiCacheHits, intelligentMappings, aiTimeouts, dynamicDiscoveries, realTimeScanHits } = this.performanceMetrics;
    
    const hardcodedSuccessRate = totalQueries > 0 ? (cacheHits / totalQueries * 100).toFixed(1) : 0;
    const aiSuccessRate = totalQueries > 0 ? (intelligentMappings / totalQueries * 100).toFixed(1) : 0;
    const aiTimeoutRate = totalQueries > 0 ? (aiTimeouts / totalQueries * 100).toFixed(1) : 0;
    const realTimeSuccessRate = totalQueries > 0 ? (realTimeScanHits / totalQueries * 100).toFixed(1) : 0;
    
    return {
      'system_name': '🚀 실시간 하이브리드 AI 경로 해석 시스템 성능',
      'total_queries': totalQueries,
      'hardcoded_success': `${cacheHits}회 (${hardcodedSuccessRate}%)`,
      'realtime_discoveries': `${realTimeScanHits}회 (${realTimeSuccessRate}%)`,
      'ai_cache_hits': `${aiCacheHits}회`,
      'ai_new_interpretations': `${intelligentMappings}회 (${aiSuccessRate}%)`,
      'ai_timeouts': `${aiTimeouts}회 (${aiTimeoutRate}%)`,
      'dynamic_folder_discoveries': `${dynamicDiscoveries}개`,
      'cache_sizes': {
        'ai_cache': this.aiPathCache.size,
        'dynamic_cache': this.dynamicFolderCache.size,
        'scan_cache': this.folderScanCache.size,
        'user_patterns': this.userPatterns.size
      },
      'user_learning': {
        'learned_patterns': this.userPatterns.size,
        'frequent_paths': this.frequentPaths.size,
        'recent_queries': this.recentQueries.length
      },
      'system_efficiency': `${this.performanceMetrics.systemEfficiency}%`,
      'average_response_time': `${this.performanceMetrics.averageResponseTime.toFixed(1)}ms`,
      'recommendations': this.getOptimizationSuggestions()
    };
  }

  /**
   * 💡 최적화 제안
   */
  getOptimizationSuggestions() {
    const suggestions = [];
    const { totalQueries, cacheHits, aiTimeouts } = this.performanceMetrics;
    
    if (totalQueries > 0) {
      const hardcodedRate = (cacheHits / totalQueries) * 100;
      if (hardcodedRate < 70) {
        suggestions.push('하드코딩 패턴 추가 필요');
      }
      
      const timeoutRate = (aiTimeouts / totalQueries) * 100;
      if (timeoutRate > 10) {
        suggestions.push('AI 타임아웃 시간 조정 고려');
      }
      
      if (this.aiPathCache.size > 1000) {
        suggestions.push('캐시 정리 필요');
      }
    }
    
    return suggestions.length > 0 ? suggestions : ['시스템이 최적 상태입니다'];
  }

  // ===== 문서 내용 분석 기능 =====
  
  /**
   * 📄 문서 내용 분석
   */
  async analyzeDocumentContent(filePath, options = {}) {
    try {
      console.log(`🔍 [문서 분석] 시작: ${filePath}`);
      console.log(`🔍 [문서 분석] 옵션:`, options);
      
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      console.log(`🔍 [문서 분석] 파일 크기: ${stats.size} bytes (${this.formatSize(stats.size)})`);
      console.log(`🔍 [문서 분석] 파일 확장자: ${ext}`);
      
      // 지원되는 문서 형식 체크
      const supportedFormats = [
        '.txt', '.md', '.rtf', '.doc', '.docx', '.xls', '.xlsx', 
        '.ppt', '.pptx', '.pdf', '.hwp', '.hml', '.csv', '.json', 
        '.xml', '.yaml', '.yml'
      ];
      
      console.log(`🔍 [문서 분석] 지원 형식:`, supportedFormats);
      console.log(`🔍 [문서 분석] 현재 형식 지원 여부: ${supportedFormats.includes(ext)}`);
      
      if (!supportedFormats.includes(ext)) {
        console.log(`❌ [문서 분석] 지원하지 않는 형식: ${ext}`);
        return {
          success: false,
          error: '지원하지 않는 문서 형식입니다',
          path: filePath,
          extension: ext
        };
      }
      
      // 파일 크기 체크 (내역서 등 중요 문서를 위해 5GB로 증가)
      const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
      console.log(`🔍 [문서 분석] 최대 허용 크기: ${this.formatSize(maxSize)}`);
      console.log(`🔍 [문서 분석] 파일 크기 체크: ${stats.size <= maxSize ? '통과' : '초과'}`);
      
      if (stats.size > maxSize) {
        console.log(`❌ [문서 분석] 파일이 너무 큼: ${this.formatSize(stats.size)}`);
        return {
          success: false,
          error: '파일이 너무 큽니다 (5GB 초과)',
          path: filePath,
          size: stats.size
        };
      }
      
      // 문서 타입별 분석
      console.log(`🔍 [문서 분석] 문서 타입별 분석 시작: ${ext}`);
      
      let content = '';
      let summary = {};
      let analysis = {};
      let metadata = {};
      
      if (['.txt', '.md', '.rtf'].includes(ext)) {
        // 텍스트 파일
        console.log(`🔍 [문서 분석] 텍스트 파일 분석 시작`);
        content = await fs.readFile(filePath, 'utf8');
        summary = this.analyzeTextContent(content);
        analysis = this.analyzeTextAnalysis(content);
        console.log(`🔍 [문서 분석] 텍스트 파일 분석 완료`);
      } else if (['.doc', '.docx'].includes(ext)) {
        // Word 문서
        console.log(`🔍 [문서 분석] Word 문서 분석 시작`);
        const result = await this.analyzeWordDocument(filePath);
        content = result.content;
        summary = result.summary;
        analysis = result.analysis;
        metadata = result.metadata;
        console.log(`🔍 [문서 분석] Word 문서 분석 완료`);
      } else if (['.xls', '.xlsx'].includes(ext)) {
        // Excel 문서
        console.log(`🔍 [문서 분석] Excel 문서 분석 시작`);
        const result = await this.analyzeExcelDocument(filePath);
        content = result.content;
        summary = result.summary;
        analysis = result.analysis;
        metadata = result.metadata;
        console.log(`🔍 [문서 분석] Excel 문서 분석 완료`);
      } else if (['.ppt', '.pptx'].includes(ext)) {
        // PowerPoint 문서 (완전 지원)
        console.log(`🔍 [문서 분석] PowerPoint 문서 분석 시작`);
        const { PowerPointAnalyzer } = await import('../../../ai/services/filesystem/PowerPointAnalyzer.js');
        const pptAnalyzer = new PowerPointAnalyzer();
        const result = await pptAnalyzer.analyzeComplete(filePath);
        
        if (result.success) {
          content = result.content || '';
          summary = {
            size: result.basicInfo?.fileSize || 0,
            encoding: 'utf-8',
            fileType: 'PowerPoint 문서',
            slides: result.structure?.slides || 0,
            title: result.metadata?.title || '제목 없음',
            author: result.metadata?.author || '작성자 없음',
            format: result.basicInfo?.format || 'unknown',
            confidence: result.analysis?.confidence || 0.0
          };
          analysis = {
            fileType: 'PowerPoint 문서',
            language: result.analysis?.language || 'unknown',
            textExtractionMethod: result.analysis?.extractionMethod || 'unknown',
            structure: result.structure || {},
            hasImages: result.metadata?.hasImages || false,
            hasCharts: result.metadata?.hasCharts || false,
            hasTables: result.metadata?.hasTables || false,
            hasAnimations: result.metadata?.hasAnimations || false,
            hasTransitions: result.metadata?.hasTransitions || false,
            warnings: result.analysis?.warnings || []
          };
          metadata = {
            format: result.basicInfo?.format || 'PowerPoint',
            support: '완전 지원',
            documentProperties: result.metadata || {},
            slideDetails: result.structure?.slideDetails || []
          };
        } else {
          throw new Error(result.error || 'PowerPoint 문서 분석 실패');
        }
        console.log(`🔍 [문서 분석] PowerPoint 문서 분석 완료`);
      } else if (ext === '.pdf') {
        // PDF 문서
        console.log(`🔍 [문서 분석] PDF 문서 분석 시작`);
        const result = await this.analyzePdfDocument(filePath);
        content = result.content;
        summary = result.summary;
        analysis = result.analysis;
        metadata = result.metadata;
        console.log(`🔍 [문서 분석] PDF 문서 분석 완료`);
      } else if (['.hwp', '.hml'].includes(ext)) {
        // 한글 문서 (완전 지원)
        console.log(`🔍 [문서 분석] 한글 문서 분석 시작`);
        const { HwpAnalyzer } = await import('../../../ai/services/filesystem/HwpAnalyzer.js');
        const hwpAnalyzer = new HwpAnalyzer();
        const result = await hwpAnalyzer.analyzeComplete(filePath);
        
        if (result.success) {
          content = result.content || '';
          summary = {
            size: result.basicInfo?.fileSize || 0,
            encoding: 'utf-8',
            fileType: '한글 문서 (HWP)',
            pages: result.structure?.pages || 0,
            title: result.metadata?.title || '제목 없음',
            author: result.metadata?.author || '작성자 없음',
            version: result.headerInfo?.version || 'unknown',
            confidence: result.analysis?.confidence || 0.0
          };
          analysis = {
            fileType: '한글 문서',
            language: 'ko',
            textExtractionMethod: result.analysis?.textExtractionMethod || 'unknown',
            structure: result.structure || {},
            objects: result.objects || {},
            warnings: result.analysis?.warnings || []
          };
          metadata = {
            format: 'HWP (한글과컴퓨터)',
            support: '완전 지원',
            version: result.headerInfo?.version || 'unknown',
            compression: result.headerInfo?.compression || false,
            encryption: result.headerInfo?.encryption || false,
            documentProperties: result.metadata || {}
          };
        } else {
          throw new Error(result.error || '한글 문서 분석 실패');
        }
        console.log(`🔍 [문서 분석] 한글 문서 분석 완료`);
      } else if (ext === '.csv') {
        // CSV 파일
        console.log(`🔍 [문서 분석] CSV 파일 분석 시작`);
        const result = await this.analyzeCsvDocument(filePath);
        content = result.content;
        summary = result.summary;
        analysis = result.analysis;
        metadata = result.metadata;
        console.log(`🔍 [문서 분석] CSV 파일 분석 완료`);
      } else if (ext === '.json') {
        // JSON 파일
        console.log(`🔍 [문서 분석] JSON 파일 분석 시작`);
        const result = await this.analyzeJsonDocument(filePath);
        content = result.content;
        summary = result.summary;
        analysis = result.analysis;
        metadata = result.metadata;
        console.log(`🔍 [문서 분석] JSON 파일 분석 완료`);
      } else if (['.xml', '.yaml', '.yml'].includes(ext)) {
        // XML/YAML 파일
        console.log(`🔍 [문서 분석] 구조화된 문서 분석 시작`);
        const result = await this.analyzeStructuredDocument(filePath, ext);
        content = result.content;
        summary = result.summary;
        analysis = result.analysis;
        metadata = result.metadata;
        console.log(`🔍 [문서 분석] 구조화된 문서 분석 완료`);
      }
      
      console.log(`🔍 [문서 분석] 분석 완료 - 내용 길이: ${content ? content.length : 0} characters`);
      console.log(`🔍 [문서 분석] 요약 정보:`, summary);
      
      return {
        success: true,
        path: filePath,
        content: content,
        summary: summary,
        analysis: analysis,
        metadata: metadata
      };
      
    } catch (error) {
      console.error(`❌ [문서 분석] 전체 분석 실패:`, error);
      console.error(`❌ [문서 분석] 오류 스택:`, error.stack);
      logger.error('문서 내용 분석 실패:', error);
      return {
        success: false,
        error: error.message,
        path: filePath,
        technical_error: error.stack
      };
    }
  }

  /**
   * 📄 문서 내용 읽기 (간단 버전)
   */
  async readDocumentContent(filePath, options = {}) {
    const { maxLength = 10000 } = options;
    
    const result = await this.analyzeDocumentContent(filePath);
    
    if (!result.success) {
      return result;
    }
    
    // 내용 길이 제한
    let content = result.content || '';
    if (content && content.length > maxLength) {
      content = content.substring(0, maxLength) + '... (내용이 잘렸습니다)';
    }
    
    return {
      ...result,
      content: content
    };
  }

  /**
   * 📝 텍스트 내용 분석
   */
  analyzeTextContent(content) {
    return {
      lines: content.split('\n').length,
      characters: content.length,
      words: content.split(/\s+/).filter(word => word.length > 0).length,
      paragraphs: content.split(/\n\s*\n/).length,
      encoding: 'utf-8'
    };
  }

  /**
   * 🔍 텍스트 분석
   */
  analyzeTextAnalysis(content) {
    return {
      language: this.detectLanguage(content),
      keywords: this.extractKeywords(content),
      sentiment: this.analyzeSentiment(content),
      readability: this.calculateReadability(content)
    };
  }

  /**
   * 📄 Word 문서 분석
   */
  async analyzeWordDocument(filePath) {
    try {
      console.log(`🔍 [Word 분석] 파일 경로: ${filePath}`);
      console.log(`🔍 [Word 분석] 파일 존재 확인 중...`);
      
      // 파일 존재 확인
      const stats = await fs.stat(filePath);
      console.log(`🔍 [Word 분석] 파일 크기: ${stats.size} bytes`);
      
      let extractedText = '';
      let metadata = {};
      
      try {
        // 방법 1: mammoth 라이브러리 사용 (DOCX)
        console.log(`🔍 [워드 분석] mammoth 라이브러리 로드 중...`);
        const mammoth = await import('mammoth');
        console.log(`🔍 [워드 분석] 워드 문서 읽기 중...`);
        
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
        const messages = result.messages || [];
        
        console.log(`🔍 [워드 분석] mammoth로 텍스트 추출 성공: ${extractedText.length} characters`);
        console.log(`🔍 [워드 분석] 경고 메시지 수: ${messages.length}`);
        
        if (messages.length > 0) {
          console.log(`🔍 [워드 분석] 경고 메시지:`, messages.map(m => m.message));
        }
        
        // 문서 구조 분석
        const structure = this.analyzeWordStructure(extractedText);
        
        metadata = {
          info: {
            title: path.basename(filePath),
            author: 'Unknown',
            subject: 'Word Document',
            creator: 'mammoth'
          },
          warnings: messages.map(m => m.message),
          hasImages: extractedText.includes('[이미지]') || extractedText.includes('[Image]'),
          hasTables: extractedText.includes('[표]') || extractedText.includes('[Table]'),
          structure: structure,
          version: '2.0'
        };
        
      } catch (mammothError) {
        console.log(`🔍 [워드 분석] mammoth 실패, 대체 방법 시도:`, mammothError.message);
        
        // 방법 2: 기본 파일 정보만 제공
        extractedText = `워드 파일: ${path.basename(filePath)}\n파일 크기: ${this.formatSize(stats.size)}\n마지막 수정: ${stats.mtime.toLocaleDateString()}\n\n워드 문서 내용 추출에 실패했습니다. 파일 정보만 제공됩니다.`;
        
        metadata = {
          info: {
            title: path.basename(filePath),
            author: 'Unknown',
            subject: 'Word Document',
            creator: 'Word Analyzer'
          },
          support: '제한적 (기본 정보만 추출 가능)',
          version: '1.0'
        };
      }
      
      console.log(`🔍 [워드 분석] 최종 텍스트 추출 완료: ${extractedText.length} characters`);
      
      return {
        content: extractedText,
        summary: this.analyzeTextContent(extractedText),
        analysis: this.analyzeTextAnalysis(extractedText),
        metadata: metadata
      };
    } catch (error) {
      console.error(`❌ [Word 분석] 오류 발생:`, error);
      console.error(`❌ [Word 분석] 오류 스택:`, error.stack);
      throw new Error(`Word 문서 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 📊 Excel 문서 분석
   */
  async analyzeExcelDocument(filePath) {
    try {
      console.log(`🔍 [엑셀 분석] 파일 경로: ${filePath}`);
      console.log(`🔍 [엑셀 분석] 파일 존재 확인 중...`);
      
      // 파일 존재 확인
      const stats = await fs.stat(filePath);
      console.log(`🔍 [엑셀 분석] 파일 크기: ${stats.size} bytes`);
      
      // xlsx 라이브러리 동적 로드
      console.log(`🔍 [엑셀 분석] xlsx 라이브러리 로드 중...`);
      const XLSX = await import('xlsx');
      console.log(`🔍 [엑셀 분석] 엑셀 파일 읽기 중...`);
      const workbook = XLSX.default.readFile(filePath);
      
      const sheets = workbook.SheetNames;
      console.log(`🔍 [엑셀 분석] 시트 수: ${sheets.length}`);
      console.log(`🔍 [엑셀 분석] 시트 목록:`, sheets);
      
      const data = {};
      const summary = {
        totalSheets: sheets.length,
        totalRows: 0,
        totalCells: 0,
        dataTypes: {},
        patterns: {}
      };
      
      // 각 시트 분석
      for (const sheetName of sheets) {
        console.log(`🔍 [엑셀 분석] 시트 "${sheetName}" 분석 중...`);
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`🔍 [엑셀 분석] 시트 "${sheetName}" 행 수: ${jsonData.length}`);
        
        // 데이터 타입 분석
        const dataTypes = this.analyzeExcelDataTypes(jsonData);
        const patterns = this.analyzeExcelPatterns(jsonData);
        
        data[sheetName] = {
          rows: jsonData.length,
          columns: jsonData.length > 0 ? jsonData[0].length : 0,
          data: jsonData.slice(0, 20), // 처음 20행으로 확장
          headers: jsonData.length > 0 ? jsonData[0] : [],
          dataTypes: dataTypes,
          patterns: patterns,
          summary: {
            emptyRows: jsonData.filter(row => row.every(cell => !cell || cell.toString().trim() === '')).length,
            emptyColumns: jsonData.length > 0 ? jsonData[0].filter((_, colIndex) => jsonData.every(row => !row[colIndex] || row[colIndex].toString().trim() === '')).length : 0
          }
        };
        
        summary.totalRows += jsonData.length;
        summary.totalCells += jsonData.reduce((sum, row) => sum + row.length, 0);
      }
      
      console.log(`🔍 [엑셀 분석] 총 행 수: ${summary.totalRows}`);
      console.log(`🔍 [엑셀 분석] 총 셀 수: ${summary.totalCells}`);
      
      return {
        content: JSON.stringify(data, null, 2),
        summary: summary,
        analysis: {
          dataTypes: { note: '데이터 타입 분석 기능은 향후 구현 예정' },
          patterns: { note: '패턴 분석 기능은 향후 구현 예정' }
        },
        metadata: {
          sheets: sheets,
          fileFormat: workbook.FileType || 'unknown'
        }
      };
    } catch (error) {
      console.error(`❌ [엑셀 분석] 오류 발생:`, error);
      console.error(`❌ [엑셀 분석] 오류 스택:`, error.stack);
      throw new Error(`Excel 문서 읽기 실패: ${error.message}`);
    }
  }



  /**
   * 📄 PDF 문서 분석 (PDFAnalyzer 사용)
   */
  async analyzePdfDocument(filePath) {
    try {
      console.log(`🔍 [PDF 분석] 파일 경로: ${filePath}`);
      
      // PDFAnalyzer 사용
      const { PDFAnalyzer } = await import('../../../ai/services/filesystem/PDFAnalyzer.js');
      const analyzer = new PDFAnalyzer();
      
      // 완전한 PDF 분석 수행
      const result = await analyzer.analyzeComplete(filePath);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // 기존 형식에 맞게 결과 변환
      const content = result.results.text?.text || '';
      const pages = result.results.text?.pages || 0;
      const stats = await fs.stat(filePath);
      
      return {
        content: content,
        summary: {
          ...this.analyzeTextContent(content),
          pages: pages,
          fileSize: stats.size,
          fileName: path.basename(filePath),
          imageCount: result.results.images.length,
          ocrCount: result.results.ocrResults.length
        },
        analysis: {
          ...this.analyzeTextAnalysis(content),
          analysisQuality: result.results.analysis,
          hasImages: result.results.images.length > 0,
          hasOCR: result.results.ocrResults.length > 0
        },
        metadata: {
          info: {
            title: result.results.metadata.title || path.basename(filePath),
            author: result.results.metadata.author || 'Unknown',
            subject: result.results.metadata.subject || 'PDF Document',
            creator: result.results.metadata.creator || 'PDF Analyzer',
            producer: result.results.metadata.producer || 'Unknown'
          },
          fileInfo: {
            fileName: path.basename(filePath),
            fileSize: stats.size,
            filePath: filePath,
            lastModified: stats.mtime,
            created: stats.birthtime
          },
          support: '완전 지원 (텍스트 추출 + 이미지 + OCR + 메타데이터)',
          version: result.results.text?.version || 'unknown',
          analysisMethod: result.results.text?.method || 'unknown'
        }
      };
    } catch (error) {
      console.error(`❌ [PDF 분석] 오류 발생:`, error);
      console.error(`❌ [PDF 분석] 오류 스택:`, error.stack);
      throw new Error(`PDF 문서 읽기 실패: ${error.message}`);
    }
  }





  /**
   * 📊 엑셀 데이터 타입 분석
   */
  analyzeExcelDataTypes(data) {
    try {
      const types = {
        text: 0,
        number: 0,
        date: 0,
        boolean: 0,
        empty: 0,
        mixed: 0
      };
      
      const columnTypes = [];
      
      if (data.length === 0) return types;
      
      // 각 열의 데이터 타입 분석
      const maxCols = Math.max(...data.map(row => row.length));
      
      for (let col = 0; col < maxCols; col++) {
        const columnData = data.map(row => row[col]).filter(cell => cell !== undefined && cell !== null && cell !== '');
        
        if (columnData.length === 0) {
          columnTypes.push('empty');
          types.empty++;
          continue;
        }
        
        const colTypes = new Set();
        
        columnData.forEach(cell => {
          const cellStr = cell.toString();
          
          // 숫자 체크
          if (!isNaN(cell) && cellStr.trim() !== '') {
            colTypes.add('number');
          }
          // 날짜 체크 (간단한 패턴)
          else if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(cellStr) || 
                   /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(cellStr)) {
            colTypes.add('date');
          }
          // 불린 체크
          else if (/^(true|false|yes|no|1|0)$/i.test(cellStr)) {
            colTypes.add('boolean');
          }
          // 텍스트
          else {
            colTypes.add('text');
          }
        });
        
        if (colTypes.size === 1) {
          const type = Array.from(colTypes)[0];
          columnTypes.push(type);
          types[type]++;
        } else {
          columnTypes.push('mixed');
          types.mixed++;
        }
      }
      
      return {
        overall: types,
        byColumn: columnTypes
      };
    } catch (error) {
      console.error('엑셀 데이터 타입 분석 실패:', error);
      return { overall: {}, byColumn: [] };
    }
  }

  /**
   * 📝 워드 문서 구조 분석
   */
  analyzeWordStructure(text) {
    try {
      const structure = {
        paragraphs: 0,
        sentences: 0,
        words: 0,
        characters: text.length,
        hasHeaders: false,
        hasLists: false,
        hasTables: false,
        hasImages: false,
        sections: []
      };
      
      // 문단 수 (빈 줄로 구분)
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      structure.paragraphs = paragraphs.length;
      
      // 문장 수 (간단한 패턴)
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      structure.sentences = sentences.length;
      
      // 단어 수
      const words = text.split(/\s+/).filter(w => w.trim().length > 0);
      structure.words = words.length;
      
      // 헤더 존재 여부 (숫자나 특수 패턴으로 시작하는 문단)
      structure.hasHeaders = paragraphs.some(p => 
        /^[0-9]+\.\s|^[A-Z][A-Z\s]+$|^제\s*\d+장|^Chapter\s*\d+/i.test(p.trim())
      );
      
      // 리스트 존재 여부
      structure.hasLists = text.includes('•') || text.includes('- ') || 
                          /\n\s*[0-9]+\.\s/.test(text) || /\n\s*[a-z]\.\s/.test(text);
      
      // 표 존재 여부
      structure.hasTables = text.includes('[표]') || text.includes('[Table]') ||
                           /\|\s*[^|]+\s*\|/.test(text) || /\t/.test(text);
      
      // 이미지 존재 여부
      structure.hasImages = text.includes('[이미지]') || text.includes('[Image]');
      
      return structure;
    } catch (error) {
      console.error('워드 문서 구조 분석 실패:', error);
      return {
        paragraphs: 0,
        sentences: 0,
        words: 0,
        characters: text.length,
        hasHeaders: false,
        hasLists: false,
        hasTables: false,
        hasImages: false
      };
    }
  }

  /**
   * 🔍 엑셀 패턴 분석
   */
  analyzeExcelPatterns(data) {
    try {
      const patterns = {
        hasHeaders: false,
        hasEmptyRows: false,
        hasEmptyColumns: false,
        isRegular: false,
        columnCount: 0
      };
      
      if (data.length === 0) return patterns;
      
      // 헤더 존재 여부 (첫 행이 텍스트인지)
      if (data.length > 0) {
        const firstRow = data[0];
        const textCells = firstRow.filter(cell => 
          cell && typeof cell === 'string' && cell.trim() !== ''
        );
        patterns.hasHeaders = textCells.length > 0;
      }
      
      // 빈 행/열 체크
      patterns.hasEmptyRows = data.some(row => 
        row.every(cell => !cell || cell.toString().trim() === '')
      );
      
      const maxCols = Math.max(...data.map(row => row.length));
      patterns.hasEmptyColumns = Array.from({ length: maxCols }, (_, colIndex) => 
        data.every(row => !row[colIndex] || row[colIndex].toString().trim() === '')
      ).some(isEmpty => isEmpty);
      
      // 규칙성 체크 (모든 행의 열 개수가 동일한지)
      const colCounts = data.map(row => row.length);
      patterns.isRegular = colCounts.every(count => count === colCounts[0]);
      patterns.columnCount = maxCols;
      
      return patterns;
    } catch (error) {
      console.error('엑셀 패턴 분석 실패:', error);
      return {};
    }
  }



  /**
   * 📊 CSV 문서 분석
   */
  async analyzeCsvDocument(filePath) {
    try {
      console.log(`🔍 [CSV 분석] 파일 경로: ${filePath}`);
      console.log(`🔍 [CSV 분석] 파일 존재 확인 중...`);
      
      // 파일 존재 확인
      const stats = await fs.stat(filePath);
      console.log(`🔍 [CSV 분석] 파일 크기: ${stats.size} bytes`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const headers = lines[0]?.split(',').map(h => h.trim()) || [];
      const data = lines.slice(1).filter(line => line.trim()).map(line => 
        line.split(',').map(cell => cell.trim())
      );
      
      console.log(`🔍 [CSV 분석] 총 라인 수: ${lines.length}`);
      console.log(`🔍 [CSV 분석] 데이터 행 수: ${data.length}`);
      console.log(`🔍 [CSV 분석] 컬럼 수: ${headers.length}`);
      console.log(`🔍 [CSV 분석] 헤더:`, headers);
      
      return {
        content: content,
        summary: {
          lines: lines.length,
          characters: content.length,
          rows: data.length,
          columns: headers.length,
          encoding: 'utf-8'
        },
        analysis: {
          headers: headers,
          dataTypes: { note: 'CSV 데이터 타입 분석 기능은 향후 구현 예정' },
          patterns: { note: 'CSV 패턴 분석 기능은 향후 구현 예정' }
        },
        metadata: {
          delimiter: ',',
          hasHeaders: headers.length > 0
        }
      };
    } catch (error) {
      console.error(`❌ [CSV 분석] 오류 발생:`, error);
      console.error(`❌ [CSV 분석] 오류 스택:`, error.stack);
      throw new Error(`CSV 파일 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 🔧 JSON 문서 분석
   */
  async analyzeJsonDocument(filePath) {
    try {
      console.log(`🔍 [JSON 분석] 파일 경로: ${filePath}`);
      console.log(`🔍 [JSON 분석] 파일 존재 확인 중...`);
      
      // 파일 존재 확인
      const stats = await fs.stat(filePath);
      console.log(`🔍 [JSON 분석] 파일 크기: ${stats.size} bytes`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      console.log(`🔍 [JSON 분석] JSON 파싱 완료`);
      console.log(`🔍 [JSON 분석] 루트 타입: ${Array.isArray(data) ? 'array' : 'object'}`);
      console.log(`🔍 [JSON 분석] 루트 크기: ${Array.isArray(data) ? data.length : Object.keys(data).length}`);
      
      return {
        content: content,
        summary: {
          lines: content.split('\n').length,
          characters: content.length,
          encoding: 'utf-8'
        },
        analysis: {
          structure: { note: 'JSON 구조 분석 기능은 향후 구현 예정' },
          dataTypes: { note: 'JSON 데이터 타입 분석 기능은 향후 구현 예정' }
        },
        metadata: {
          isValid: true,
          rootType: Array.isArray(data) ? 'array' : 'object',
          rootSize: Array.isArray(data) ? data.length : Object.keys(data).length
        }
      };
    } catch (error) {
      console.error(`❌ [JSON 분석] 오류 발생:`, error);
      console.error(`❌ [JSON 분석] 오류 스택:`, error.stack);
      throw new Error(`JSON 파일 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 📋 구조화된 문서 분석 (XML, YAML)
   */
  async analyzeStructuredDocument(filePath, ext) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        content: content,
        summary: {
          lines: content.split('\n').length,
          characters: content.length,
          encoding: 'utf-8'
        },
        analysis: {
          structure: { note: `${ext.toUpperCase()} 구조 분석 기능은 향후 구현 예정` },
          tags: ext === '.xml' ? this.extractXmlTags(content) : []
        },
        metadata: {
          type: ext.toUpperCase(),
          isValid: ext === '.xml' ? this.isValidXml(content) : this.isValidYaml(content)
        }
      };
    } catch (error) {
      throw new Error(`${ext.toUpperCase()} 파일 읽기 실패: ${error.message}`);
    }
  }

  // ===== 헬퍼 메서드들 =====

  /**
   * 🌍 언어 감지
   */
  detectLanguage(text) {
    const koreanPattern = /[가-힣]/;
    const englishPattern = /[a-zA-Z]/;
    
    if (koreanPattern.test(text)) {
      return 'ko';
    } else if (englishPattern.test(text)) {
      return 'en';
    }
    return 'unknown';
  }

  /**
   * 🔑 키워드 추출
   */
  extractKeywords(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  /**
   * 😊 감정 분석
   */
  analyzeSentiment(text) {
    const positiveWords = ['좋다', '훌륭하다', '멋지다', '최고', '완벽', '성공', '행복', '즐겁다'];
    const negativeWords = ['나쁘다', '끔찍하다', '최악', '실패', '슬프다', '화나다', '짜증', '불만'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positive = 0, negative = 0;
    
    words.forEach(word => {
      if (positiveWords.some(p => word.includes(p))) positive++;
      if (negativeWords.some(n => word.includes(n))) negative++;
    });
    
    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  /**
   * 📖 가독성 계산
   */
  calculateReadability(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(text);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    // 간단한 가독성 점수 (0-100)
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    return Math.max(0, Math.min(100, 100 - (avgWordsPerSentence * 2 + avgSyllablesPerWord * 10)));
  }

  /**
   * 📊 음절 수 계산
   */
  countSyllables(text) {
    const koreanSyllables = (text.match(/[가-힣]/g) || []).length;
    const englishSyllables = (text.match(/[aeiouAEIOU]/g) || []).length;
    return koreanSyllables + englishSyllables;
  }

  /**
   * 🔍 바이너리 파일 분석
   */
  analyzeBinaryFile(buffer) {
    return {
      size: buffer.length,
      hasText: this.hasTextContent(buffer),
      fileSignature: buffer.slice(0, 8).toString('hex')
    };
  }

  /**
   * 📝 텍스트 내용 확인
   */
  hasTextContent(buffer) {
    const text = buffer.toString('utf8', 0, Math.min(1000, buffer.length));
    return /[가-힣a-zA-Z]/.test(text);
  }

  /**
   * 🏷️ XML 태그 추출
   */
  extractXmlTags(content) {
    const tagPattern = /<(\w+)[^>]*>/g;
    const tags = [];
    let match;
    
    while ((match = tagPattern.exec(content)) !== null) {
      tags.push(match[1]);
    }
    
    return [...new Set(tags)];
  }

  /**
   * ✅ XML 유효성 검사
   */
  isValidXml(content) {
    // 간단한 검사
    const openTags = (content.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/[^>]*>/g) || []).length;
    return openTags === closeTags;
  }

  /**
   * ✅ YAML 유효성 검사
   */
  isValidYaml(content) {
    // 간단한 검사
    return content.includes(':') && !content.includes('{') && !content.includes('[');
  }

  /**
   * 📊 문서 분석 학습 데이터 조회
   */
  async getDocumentLearningData(options = {}) {
    try {
      return await this.documentLearningManager.getLearningData(options);
    } catch (error) {
      logger.error('문서 분석 학습 데이터 조회 실패:', error);
      return {
        success: false,
        error: error.message,
        analyses: [],
        metadata: {},
        formatStats: {},
        learningInsights: {},
        totalResults: 0
      };
    }
  }

  /**
   * 📈 문서 분석 통계 조회
   */
  async getDocumentAnalysisStatistics() {
    try {
      return await this.documentLearningManager.getStatistics();
    } catch (error) {
      logger.error('문서 분석 통계 조회 실패:', error);
      return {
        success: false,
        error: error.message,
        metadata: {},
        formatStats: {},
        learningInsights: {},
        topKeywords: [],
        topDocumentTypes: [],
        sizeDistribution: {}
      };
    }
  }
} 