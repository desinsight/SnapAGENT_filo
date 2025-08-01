/**
 * 🔍 PATH RESOLVER - 범용 경로 해석 엔진
 * 역할: 모든 플랫폼에서 경로를 해석하고 정규화하는 범용 시스템
 * 기능: 경로 정규화, 검증, 캐싱, 플랫폼 간 호환성
 * 특징: 범용 해석, 정규화, 검증, 캐싱 (AI 기능은 PathMappings로 이전됨)
 */

import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { PathMappings } from './PathMappings.js';
import { FormatHelper } from './FormatHelper.js';
import { normalizeFolderSuffix, normalizeExtension, correctTypo } from './FormatHelper.js';
import { UserIntentLearner } from './UserIntentLearner.js';
import { errorHandler } from './ErrorHandler.js';

export class PathResolver {
  constructor() {
    this.isInitialized = false;
    this.platform = process.platform;
    this.username = os.userInfo().username;
    this.homeDir = os.homedir();
    
    // 🌍 Multi-Language Path Mappings - PathMappings 클래스 사용
    this.pathMappingsInstance = new PathMappings();
    
    // 🧠 AI-Enhanced Context Patterns
    this.contextPatterns = this.initializeContextPatterns();
    
    // 🎯 Advanced Search Patterns
    this.searchPatterns = this.initializeSearchPatterns();
    
    // 🔄 Dynamic Path Cache
    this.pathCache = new Map();
    this.cacheTimeout = 300000; // 5분
    
    // 📊 Performance Metrics
    this.metrics = {
      totalResolutions: 0,
      cacheHits: 0,
      aiInferences: 0,
      fallbackUses: 0,
      averageResponseTime: 0
    };
    
    // 🧠 사용자별 AI 의도 학습 시스템
    this.userIntentLearner = new UserIntentLearner();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🚀 PathResolver 초기화 시작...');
      
      // 🌍 PathMappings 초기화
      await this.pathMappingsInstance.initialize();
      
      // 🧠 AI 학습 시스템 초기화
      await this.userIntentLearner.initialize();
      
      // 사용자별 경로 검증 및 최적화
      await this.validateAndOptimizePaths();
      
      // WSL 환경 감지
      this.isWSL = await this.detectWSLEnvironment();
      
      // 플랫폼별 특화 설정
      await this.setupPlatformSpecificPaths();
      
      this.isInitialized = true;
      console.log('✅ PathResolver 초기화 완료');
      console.log(`🎯 패턴 수: ${this.contextPatterns.length}개`);
      console.log(`🔍 검색 패턴: ${this.searchPatterns.length}개`);
      
    } catch (error) {
      console.error('❌ PathResolver 초기화 실패:', error);
      // 기본 모드로 계속 동작
      this.isInitialized = true;
    }
  }

  /**
   * 🌍 방대한 다국어 경로 매핑 초기화 (세계 최고 수준 확장)
   */
  initializePathMappings() {
    const userProfile = this.homeDir;
    const username = this.username;
    
    return {
      // 🗺️ 기본 시스템 경로
      system: {
        home: userProfile,
        temp: os.tmpdir(),
        root: this.platform === 'win32' ? 'C:\\' : '/',
        system32: this.platform === 'win32' ? 'C:\\Windows\\System32' : '/usr/bin',
        programFiles: this.platform === 'win32' ? 'C:\\Program Files' : '/usr',
        programData: this.platform === 'win32' ? 'C:\\ProgramData' : '/var',
        windows: this.platform === 'win32' ? 'C:\\Windows' : '/etc'
      },

      // 👤 사용자 폴더 (다국어 지원 + OneDrive + 확장 경로)
      userFolders: {
        // 🖥️ 바탕화면/데스크톱
        desktop: {
          ko: [
            `${userProfile}\\Desktop`, 
            `${userProfile}\\바탕 화면`, 
            `C:\\Users\\${username}\\Desktop`,
            `${userProfile}\\OneDrive\\Desktop`,
            `${userProfile}\\OneDrive\\바탕 화면`,
            `${userProfile}\\OneDrive - 개인용\\Desktop`,
            `${userProfile}\\OneDrive - 개인용\\바탕 화면`
          ],
          en: [
            `${userProfile}\\Desktop`, 
            `C:\\Users\\${username}\\Desktop`,
            `${userProfile}\\OneDrive\\Desktop`,
            `${userProfile}\\OneDrive - Personal\\Desktop`
          ],
          ja: [
            `${userProfile}\\Desktop`, 
            `C:\\Users\\${username}\\Desktop`,
            `${userProfile}\\OneDrive\\Desktop`,
            `${userProfile}\\OneDrive - 個人用\\Desktop`
          ],
          zh: [
            `${userProfile}\\Desktop`, 
            `C:\\Users\\${username}\\Desktop`,
            `${userProfile}\\OneDrive\\Desktop`,
            `${userProfile}\\OneDrive - 个人\\Desktop`
          ],
          aliases: ['바탕화면', '데스크탑', '데스크톱', '화면', '바탕', 'desktop', 'screen', 'デスクトップ', '桌面']
        },
        
        // 📁 문서
        documents: {
          ko: [
            `${userProfile}\\Documents`, 
            `${userProfile}\\내 문서`, 
            `C:\\Users\\${username}\\Documents`,
            `${userProfile}\\OneDrive\\Documents`,
            `${userProfile}\\OneDrive\\내 문서`,
            `${userProfile}\\OneDrive - 개인용\\Documents`,
            `${userProfile}\\OneDrive - 개인용\\내 문서`
          ],
          en: [
            `${userProfile}\\Documents`, 
            `C:\\Users\\${username}\\Documents`,
            `${userProfile}\\OneDrive\\Documents`,
            `${userProfile}\\OneDrive - Personal\\Documents`
          ],
          ja: [
            `${userProfile}\\Documents`, 
            `C:\\Users\\${username}\\Documents`,
            `${userProfile}\\OneDrive\\Documents`,
            `${userProfile}\\OneDrive - 個人用\\Documents`
          ],
          zh: [
            `${userProfile}\\Documents`, 
            `C:\\Users\\${username}\\Documents`,
            `${userProfile}\\OneDrive\\Documents`,
            `${userProfile}\\OneDrive - 个人\\Documents`
          ],
          aliases: ['문서', '내문서', '도큐먼트', '자료', 'documents', 'docs', 'document', 'doc', '資料', '文档']
        },
        
        // 💾 다운로드
        downloads: {
          ko: [
            `${userProfile}\\Downloads`, 
            `${userProfile}\\다운로드`, 
            `C:\\Users\\${username}\\Downloads`,
            `${userProfile}\\OneDrive\\Downloads`,
            `${userProfile}\\OneDrive\\다운로드`,
            `${userProfile}\\OneDrive - 개인용\\Downloads`,
            `${userProfile}\\OneDrive - 개인용\\다운로드`
          ],
          en: [
            `${userProfile}\\Downloads`, 
            `C:\\Users\\${username}\\Downloads`,
            `${userProfile}\\OneDrive\\Downloads`,
            `${userProfile}\\OneDrive - Personal\\Downloads`
          ],
          ja: [
            `${userProfile}\\Downloads`, 
            `C:\\Users\\${username}\\Downloads`,
            `${userProfile}\\OneDrive\\Downloads`,
            `${userProfile}\\OneDrive - 個人用\\Downloads`
          ],
          zh: [
            `${userProfile}\\Downloads`, 
            `C:\\Users\\${username}\\Downloads`,
            `${userProfile}\\OneDrive\\Downloads`,
            `${userProfile}\\OneDrive - 个人\\Downloads`
          ],
          aliases: ['다운로드', '다운로드폴더', '받은파일', '내려받기', '저장폴더', 'downloads', 'download', 'saved', 'ダウンロード', '下载']
        },
        
        // 🖼️ 사진/그림
        pictures: {
          ko: [`${userProfile}\\Pictures`, `${userProfile}\\사진`, `C:\\Users\\${username}\\Pictures`],
          en: [`${userProfile}\\Pictures`, `C:\\Users\\${username}\\Pictures`],
          ja: [`${userProfile}\\Pictures`, `C:\\Users\\${username}\\Pictures`],
          zh: [`${userProfile}\\Pictures`, `C:\\Users\\${username}\\Pictures`],
          aliases: ['사진', '그림', '이미지', '포토', 'pictures', 'photos', 'images', 'photo', 'img', '写真', '图片']
        },
        
        // 🎵 음악
        music: {
          ko: [`${userProfile}\\Music`, `${userProfile}\\음악`, `C:\\Users\\${username}\\Music`],
          en: [`${userProfile}\\Music`, `C:\\Users\\${username}\\Music`],
          ja: [`${userProfile}\\Music`, `C:\\Users\\${username}\\Music`],
          zh: [`${userProfile}\\Music`, `C:\\Users\\${username}\\Music`],
          aliases: ['음악', '뮤직', '노래', '음원', 'music', 'songs', 'audio', 'tracks', '音楽', '音乐']
        },
        
        // 🎬 비디오/동영상
        videos: {
          ko: [`${userProfile}\\Videos`, `${userProfile}\\비디오`, `C:\\Users\\${username}\\Videos`],
          en: [`${userProfile}\\Videos`, `C:\\Users\\${username}\\Videos`],
          ja: [`${userProfile}\\Videos`, `C:\\Users\\${username}\\Videos`],
          zh: [`${userProfile}\\Videos`, `C:\\Users\\${username}\\Videos`],
          aliases: ['비디오', '동영상', '영상', '영화', 'videos', 'video', 'movies', 'films', '動画', '视频']
        }
      },

      // 🎮 게임 및 엔터테인먼트
      entertainment: {
        games: {
          ko: ['C:\\Program Files\\', 'C:\\Program Files (x86)\\', 'D:\\Games\\'],
          en: ['C:\\Program Files\\', 'C:\\Program Files (x86)\\', 'D:\\Games\\'],
          aliases: ['게임', '게임즈', '놀이', '오락', 'games', 'game', 'gaming', 'play', 'entertainment']
        },
        steam: {
          ko: ['C:\\Program Files (x86)\\Steam\\steamapps', 'D:\\Steam\\steamapps'],
          en: ['C:\\Program Files (x86)\\Steam\\steamapps', 'D:\\Steam\\steamapps'],
          aliases: ['스팀', 'steam', 'steamapps', 'steam games']
        },
        epic: {
          ko: ['C:\\Program Files\\Epic Games', 'D:\\Epic Games'],
          en: ['C:\\Program Files\\Epic Games', 'D:\\Epic Games'],
          aliases: ['에픽', 'epic', 'epicgames', 'epic games']
        }
      },

      // 💼 업무 및 개발
      work: {
        projects: {
          ko: ['D:\\my_app', 'D:\\projects', 'C:\\Users\\' + username + '\\Projects'],
          en: ['D:\\my_app', 'D:\\projects', 'C:\\Users\\' + username + '\\Projects'],
          aliases: ['프로젝트', '작업', '개발', '코딩', 'projects', 'work', 'development', 'coding', 'dev']
        },
        workspace: {
          ko: ['D:\\my_app\\Web_MCP_Server', 'D:\\workspace', 'C:\\Users\\' + username + '\\Workspace'],
          en: ['D:\\my_app\\Web_MCP_Server', 'D:\\workspace', 'C:\\Users\\' + username + '\\Workspace'],
          aliases: ['워크스페이스', '작업공간', 'workspace', 'working directory', 'work area']
        }
      },

      // 📱 모바일 및 클라우드
      mobile: {
        onedrive: {
          ko: [`${userProfile}\\OneDrive`, 'C:\\Users\\' + username + '\\OneDrive'],
          en: [`${userProfile}\\OneDrive`, 'C:\\Users\\' + username + '\\OneDrive'],
          aliases: ['원드라이브', 'onedrive', 'one drive', 'cloud', '클라우드']
        },
        dropbox: {
          ko: [`${userProfile}\\Dropbox`, 'C:\\Users\\' + username + '\\Dropbox'],
          en: [`${userProfile}\\Dropbox`, 'C:\\Users\\' + username + '\\Dropbox'],
          aliases: ['드롭박스', 'dropbox', 'drop box']
        },
        googleDrive: {
          ko: [`${userProfile}\\Google Drive`, 'C:\\Users\\' + username + '\\Google Drive'],
          en: [`${userProfile}\\Google Drive`, 'C:\\Users\\' + username + '\\Google Drive'],
          aliases: ['구글드라이브', 'google drive', 'google', '구글']
        }
      },

      // 💬 카카오톡 관련 (한국 사용자 필수)
      kakao: {
        kakaoTalkReceived: {
          ko: [`${userProfile}\\Documents\\카카오톡 받은 파일`, 'C:\\Users\\' + username + '\\Documents\\카카오톡 받은 파일'],
          en: [`${userProfile}\\Documents\\KakaoTalk Received Files`, 'C:\\Users\\' + username + '\\Documents\\KakaoTalk Received Files'],
          aliases: [
            '카카오톡받은파일', '카톡받은파일', '받은파일카톡', '카톡파일', '카카오파일',
            '카톡다운로드', '카톡 다운로드', '카카오톡다운로드', '카카오톡 다운로드', '카카오 다운로드',
            'kakaotalk received files', 'kakaotalk', 'kakao', '카카오톡 받은 폴더', '카톡 받은 폴더'
          ]
        }
      },

      // 🗂️ 특수 폴더
      special: {
        recycleBin: {
          ko: ['C:\\$Recycle.Bin', 'C:\\Users\\' + username + '\\$Recycle.Bin'],
          en: ['C:\\$Recycle.Bin', 'C:\\Users\\' + username + '\\$Recycle.Bin'],
          aliases: ['휴지통', '쓰레기통', 'recycle bin', 'trash', 'bin', '휴지통폴더']
        },
        recent: {
          ko: ['C:\\Users\\' + username + '\\AppData\\Roaming\\Microsoft\\Windows\\Recent'],
          en: ['C:\\Users\\' + username + '\\AppData\\Roaming\\Microsoft\\Windows\\Recent'],
          aliases: ['최근', '최근문서', 'recent', 'recent documents', '최근 사용']
        },
        favorites: {
          ko: ['C:\\Users\\' + username + '\\Favorites', 'C:\\Users\\' + username + '\\Links'],
          en: ['C:\\Users\\' + username + '\\Favorites', 'C:\\Users\\' + username + '\\Links'],
          aliases: ['즐겨찾기', '즐겨찾기폴더', 'favorites', 'favorite', 'bookmarks', '북마크']
        }
      }
    };
  }

  /**
   * 🧠 컨텍스트 패턴 초기화
   */
  initializeContextPatterns() {
    return [
      // 🎯 복합 패턴 (예: "바탕화면에 프로그램 폴더")
      {
        pattern: /(바탕화면|데스크탑|desktop)\s*(에|에서|의|에?서)\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'desktop',
        extractSubfolder: true
      },
      {
        pattern: /(문서|documents)\s*(에|에서|의|에?서)\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'documents',
        extractSubfolder: true
      },
      {
        pattern: /(다운로드|downloads)\s*(에|에서|의|에?서)\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'downloads',
        extractSubfolder: true
      },
      {
        pattern: /(사진|pictures)\s*(에|에서|의|에?서)\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'pictures',
        extractSubfolder: true
      },
      {
        pattern: /(음악|music)\s*(에|에서|의|에?서)\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'music',
        extractSubfolder: true
      },
      {
        pattern: /(비디오|videos)\s*(에|에서|의|에?서)\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'videos',
        extractSubfolder: true
      },
      
      // 🎮 게임 관련 패턴
      {
        pattern: /(게임|games)\s*(에|에서|의|에?서)\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'games',
        extractSubfolder: true
      },
      {
        pattern: /(스팀|steam)\s*(에|에서|의|에?서)\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'steam',
        extractSubfolder: true
      },
      
      // 💼 업무 관련 패턴
      {
        pattern: /(프로젝트|projects)\s*(에|에서|의|에?서)\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'projects',
        extractSubfolder: true
      },
      {
        pattern: /(작업|work)\s*(에|에서|의|에?서)\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'work',
        extractSubfolder: true
      },
      // 💬 카카오톡 관련 패턴
      {
        pattern: /(카카오톡|카톡)\s*(받은|받은파일|파일|다운로드)\s*(폴더|안에?|에서)?$/i,
        baseType: 'kakaoTalkReceived',
        extractSubfolder: false
      },
      {
        pattern: /(카카오톡|카톡)\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'kakaoTalkReceived',
        extractSubfolder: true
      },
      
      // 🧪 테스트 폴더 패턴 (우선순위 높음)
      {
        pattern: /(test|테스트)\s*(folder|폴더)?\s*(.+?)(?:\s*폴더|안에?|에서)?$/i,
        baseType: 'desktop',
        extractSubfolder: true
      },
      {
        pattern: /(.+?)\s*(test|테스트)\s*(folder|폴더)?$/i,
        baseType: 'desktop',
        extractSubfolder: true
      }
    ];
  }

  /**
   * 🔍 검색 패턴 초기화
   */
  initializeSearchPatterns() {
    return [
      // 📁 파일 타입 기반 검색
      {
        pattern: /(.+?)\s*(파일|file)s?$/i,
        type: 'fileType',
        extractQuery: true
      },
      {
        pattern: /(.+?)\s*(폴더|folder|directory)$/i,
        type: 'folder',
        extractQuery: true
      },
      {
        pattern: /(.+?)\s*(이미지|image|사진|photo)s?$/i,
        type: 'image',
        extractQuery: true
      },
      {
        pattern: /(.+?)\s*(문서|document)s?$/i,
        type: 'document',
        extractQuery: true
      },
      {
        pattern: /(.+?)\s*(음악|music|노래|song)s?$/i,
        type: 'music',
        extractQuery: true
      },
      {
        pattern: /(.+?)\s*(비디오|video|동영상|movie)s?$/i,
        type: 'video',
        extractQuery: true
      },
      {
        pattern: /(.+?)\s*(게임|game)s?$/i,
        type: 'game',
        extractQuery: true
      },
      {
        pattern: /(.+?)\s*(압축|zip|rar|7z)s?$/i,
        type: 'archive',
        extractQuery: true
      }
    ];
  }

  /**
   * 🎯 메인 경로 해석 메서드
   */
  async resolvePath(input, context = {}) {
    const startTime = performance.now();
    const userId = context.userId || 'anonymous';
    
    try {
      // 1. 캐시 확인
      const cacheKey = this.generateCacheKey(input, context);
      if (this.pathCache.has(cacheKey)) {
        const cached = this.pathCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          this.metrics.cacheHits++;
          return cached.paths;
        }
      }

      // 0. 입력값이 절대 경로이거나 실제로 존재하는 경로라면 바로 반환
      if (typeof input === 'string' && (path.isAbsolute(input) || await this.pathExists(input))) {
        return [input];
      }
      if (Array.isArray(input)) {
        // 배열이면 실제로 존재하는 경로만 반환
        const filtered = [];
        for (const p of input) {
          if (typeof p === 'string' && (path.isAbsolute(p) || await this.pathExists(p))) {
            filtered.push(p);
          }
        }
        if (filtered.length > 0) return filtered;
      }

      // 🧠 1. 사용자별 AI 의도 학습 시스템 우선 시도
      const userIntent = await this.userIntentLearner.analyzeUserIntent(input, userId, context);
      if (userIntent.confidence > 0.6) {
        console.log(`🧠 사용자별 AI 의도 감지: ${userIntent.intent} (신뢰도: ${userIntent.confidence})`);
        this.metrics.aiInferences++;
        this.cacheResult(cacheKey, userIntent.paths);
        return userIntent.paths;
      }

      // 2. 복합 패턴 매칭
      const contextualPaths = await this.resolveContextualPath(input, context);
      if (contextualPaths.length > 0) {
        this.cacheResult(cacheKey, contextualPaths);
        return contextualPaths;
      }

      // 3. 직접 매핑
      const directPaths = await this.resolveDirectMapping(input, context);
      if (directPaths.length > 0) {
        this.cacheResult(cacheKey, directPaths);
        return directPaths;
      }

      // 4. AI 기반 추론
      const aiPaths = await this.resolveWithAI(input, context);
      if (aiPaths.length > 0) {
        this.cacheResult(cacheKey, aiPaths);
        return aiPaths;
      }

      // 5. 폴백 처리
      const fallbackPaths = this.resolveFallback(input, context);
      this.cacheResult(cacheKey, fallbackPaths);
      
      const executionTime = performance.now() - startTime;
      this.updateMetrics(executionTime, true);
      
      return fallbackPaths;

    } catch (error) {
      console.error('❌ PathResolver.resolvePath 실패:', error);
      this.updateMetrics(performance.now() - startTime, false);
      return [input]; // 최후의 수단: 원본 반환
    }
  }

  /**
   * 🧠 컨텍스트 기반 경로 해석
   */
  async resolveContextualPath(input, context) {
    const paths = [];
    for (const pattern of this.contextPatterns) {
      const match = input.match(pattern.pattern);
      if (match) {
        const baseType = pattern.baseType;
        const basePaths = this.getBasePaths(baseType, context.language || 'ko');
        if (pattern.extractSubfolder && match[3]) {
          const subfolder = cleanSubfolderName(match[3]);
          for (const basePath of basePaths) {
            if (isValidPath(subfolder)) {
              paths.push(path.join(basePath, subfolder));
            } else {
              paths.push(basePath);
            }
          }
        } else {
          paths.push(...basePaths);
        }
      }
    }
    return paths;
  }

  /**
   * 🎯 직접 매핑 해석
   */
  /**
   * 🎯 직접 매핑 해석 (가장 빠른 방법)
   * ⚠️ DEPRECATED: HardMappingManager로 이전됨
   */
  async resolveDirectMapping(input, context) {
    console.warn('⚠️ PathResolver.resolveDirectMapping는 HardMappingManager로 이전되었습니다.');
    return [];
  }

  /**
   * 🤖 AI 기반 의도 파악 및 경로 추론
   */
  async resolveWithAI(input, context) {
    // 🧠 AI 기반 의미론적 의도 파악
    const intent = await this.analyzeIntent(input, context);
    console.log('🧠 AI 의도 분석 결과:', intent);
    
    if (intent.confidence > 0.7) {
      return intent.paths;
    }
    
    // 기존 의미론적 추론 (fallback)
    const semanticMappings = {
      '개발': ['D:\\my_app', 'D:\\projects'],
      '코딩': ['D:\\my_app', 'D:\\projects'],
      '프로그래밍': ['D:\\my_app', 'D:\\projects'],
      'development': ['D:\\my_app', 'D:\\projects'],
      'coding': ['D:\\my_app', 'D:\\projects'],
      'programming': ['D:\\my_app', 'D:\\projects'],
      
      '미디어': [path.join(this.homeDir, 'Pictures'), path.join(this.homeDir, 'Videos')],
      'media': [path.join(this.homeDir, 'Pictures'), path.join(this.homeDir, 'Videos')],
      
      '백업': [path.join(this.homeDir, 'Documents'), path.join(this.homeDir, 'Downloads')],
      'backup': [path.join(this.homeDir, 'Documents'), path.join(this.homeDir, 'Downloads')],
      
      '임시': [os.tmpdir(), path.join(this.homeDir, 'Downloads')],
      'temp': [os.tmpdir(), path.join(this.homeDir, 'Downloads')],
      'temporary': [os.tmpdir(), path.join(this.homeDir, 'Downloads')]
    };
    
    const inputLower = input.toLowerCase();
    for (const [keyword, paths] of Object.entries(semanticMappings)) {
      if (inputLower.includes(keyword.toLowerCase())) {
        return paths;
      }
    }
    
    return [];
  }

  /**
   * 🧠 AI 의도 분석 시스템
   */
  async analyzeIntent(input, context) {
    const inputLower = input.toLowerCase();
    const username = this.username;
    
    // 🎯 의도 패턴 매칭
    const intentPatterns = [
      // 카카오톡 관련 의도 (높은 우선순위)
      {
        pattern: /카카오톡.*(받은|파일|다운로드)/i,
        intent: 'kakao_received_files',
        confidence: 0.95,
        paths: [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`]
      },
      {
        pattern: /카톡.*(받은|파일|다운로드)/i,
        intent: 'kakao_received_files',
        confidence: 0.90,
        paths: [`C:\\Users\\${username}\\Documents\\카카오톡 받은 파일`]
      },
      {
        pattern: /kakaotalk.*(received|files|download)/i,
        intent: 'kakao_received_files',
        confidence: 0.90,
        paths: [`C:\\Users\\${username}\\Documents\\KakaoTalk Received Files`]
      },
      
      // 일반적인 "받은 파일" 의도 (낮은 우선순위)
      {
        pattern: /받은.*파일/i,
        intent: 'received_files',
        confidence: 0.60,
        paths: [path.join(this.homeDir, 'Downloads')]
      },
      {
        pattern: /received.*files/i,
        intent: 'received_files',
        confidence: 0.60,
        paths: [path.join(this.homeDir, 'Downloads')]
      },
      
      // 다운로드 의도
      {
        pattern: /다운로드/i,
        intent: 'downloads',
        confidence: 0.85,
        paths: [path.join(this.homeDir, 'Downloads')]
      },
      {
        pattern: /download/i,
        intent: 'downloads',
        confidence: 0.85,
        paths: [path.join(this.homeDir, 'Downloads')]
      }
    ];
    
    // 🎯 패턴 매칭 및 신뢰도 계산
    let bestMatch = { confidence: 0, paths: [] };
    
    for (const pattern of intentPatterns) {
      if (pattern.pattern.test(input)) {
        console.log(`🎯 의도 패턴 매칭: ${pattern.intent} (신뢰도: ${pattern.confidence})`);
        
        if (pattern.confidence > bestMatch.confidence) {
          bestMatch = {
            intent: pattern.intent,
            confidence: pattern.confidence,
            paths: pattern.paths
          };
        }
      }
    }
    
    // 🧠 컨텍스트 기반 신뢰도 조정
    if (bestMatch.confidence > 0) {
      // 카카오톡 키워드가 있으면 신뢰도 증가
      if (inputLower.includes('카카오톡') || inputLower.includes('카톡') || inputLower.includes('kakao')) {
        if (bestMatch.intent === 'kakao_received_files') {
          bestMatch.confidence = Math.min(0.98, bestMatch.confidence + 0.1);
        } else {
          bestMatch.confidence = Math.max(0.3, bestMatch.confidence - 0.2);
        }
      }
      
      // "받은 파일"이지만 카카오톡 컨텍스트가 없으면 신뢰도 감소
      if (bestMatch.intent === 'received_files' && 
          !inputLower.includes('카카오톡') && 
          !inputLower.includes('카톡') && 
          !inputLower.includes('kakao')) {
        bestMatch.confidence = Math.max(0.4, bestMatch.confidence - 0.1);
      }
    }
    
    return bestMatch;
  }

  /**
   * 🔄 폴백 처리
   */
  resolveFallback(input, context) {
    // 절대 경로인지 확인
    if (path.isAbsolute(input)) {
      return [input];
    }
    
    // 상대 경로인 경우 현재 작업 디렉토리 기준
    return [path.resolve(input)];
  }

  /**
   * 🎯 검색 경로 결정
   */
  async determineSearchPaths(query, basePath, intent, context) {
    const paths = [];
    
    // 1. 기본 경로가 제공된 경우
    if (basePath) {
      const resolvedBasePaths = await this.resolvePath(basePath, context);
      paths.push(...resolvedBasePaths);
    }
    
    // 2. 쿼리에서 경로 추출
    const queryPaths = await this.resolvePath(query, context);
    paths.push(...queryPaths);
    
    // 3. 의도 기반 경로 추가
    if (intent) {
      const intentPaths = await this.resolvePath(intent, context);
      paths.push(...intentPaths);
    }
    
    // 4. 기본 검색 경로 추가 (중복 제거)
    const defaultPaths = [
      path.join(this.homeDir, 'Downloads'),
      path.join(this.homeDir, 'Documents'),
      path.join(this.homeDir, 'Desktop')
    ];
    
    for (const defaultPath of defaultPaths) {
      if (!paths.includes(defaultPath)) {
        paths.push(defaultPath);
      }
    }
    
    return [...new Set(paths)]; // 중복 제거
  }

  /**
   * 🛠️ 유틸리티 메서드들
   */
  getBasePaths(baseType, language = 'ko') {
    // 사용자 폴더
    const userFolders = this.pathMappingsInstance.mappings?.userFolders;
    if (userFolders && userFolders[baseType]) {
      return userFolders[baseType][language] || userFolders[baseType].ko;
    }
    
    // 카카오톡 관련
    const kakao = this.pathMappingsInstance.mappings?.kakao;
    if (kakao && kakao[baseType]) {
      return kakao[baseType][language] || kakao[baseType].ko;
    }
    
    return [];
  }

  generateCacheKey(input, context) {
    return `${input}_${context.language || 'ko'}_${JSON.stringify(context)}`;
  }

  cacheResult(key, paths) {
    this.pathCache.set(key, {
      paths,
      timestamp: Date.now()
    });
  }

  async validateAndOptimizePaths() {
    // 경로 유효성 검증 및 최적화 (최대 5개만 확인)
    console.log('🔍 경로 유효성 검증 중...');
    let checkedCount = 0;
    const maxChecks = 5; // 최대 5개만 확인
    
    const mappings = this.pathMappingsInstance.mappings;
    if (!mappings) {
      console.log('⚠️ PathMappings가 초기화되지 않음');
      return;
    }
    
    for (const [category, categoryMappings] of Object.entries(mappings)) {
      if (category === 'userFolders' && checkedCount < maxChecks) {
        for (const [folderType, folderData] of Object.entries(categoryMappings)) {
          if (checkedCount >= maxChecks) break;
          
          for (const [lang, paths] of Object.entries(folderData)) {
            if (lang !== 'aliases' && checkedCount < maxChecks) {
              const validPaths = [];
              for (const path of paths) {
                if (checkedCount >= maxChecks) break;
                
                try {
                  await fs.promises.access(path);
                  validPaths.push(path);
                  checkedCount++;
                } catch (error) {
                  // 경로 접근 불가 시 무시 (로그 제거)
                  checkedCount++;
                }
              }
              folderData[lang] = validPaths;
            }
          }
        }
      }
    }
    console.log(`✅ 경로 유효성 검증 완료 (${checkedCount}개 확인)`);
  }

  async detectWSLEnvironment() {
    try {
      await fs.promises.access('/mnt/c');
      return true;
    } catch {
      return false;
    }
  }

  async setupPlatformSpecificPaths() {
    if (this.isWSL) {
      // WSL 환경에서 Windows 경로 추가
      const mappings = this.pathMappingsInstance.mappings;
      if (!mappings || !mappings.userFolders) {
        console.log('⚠️ PathMappings userFolders가 초기화되지 않음');
        return;
      }
      
      for (const [folderType, folderData] of Object.entries(mappings.userFolders)) {
        for (const [lang, paths] of Object.entries(folderData)) {
          if (lang !== 'aliases') {
            const wslPaths = paths.map(p => p.replace('C:\\', '/mnt/c/').replace(/\\/g, '/'));
            folderData[lang] = [...paths, ...wslPaths];
          }
        }
      }
    }
  }

  updateMetrics(executionTime, success) {
    this.metrics.totalResolutions++;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalResolutions - 1) + executionTime) / this.metrics.totalResolutions;
    
    if (!success) {
      this.metrics.fallbackUses++;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.pathCache.size,
      isInitialized: this.isInitialized,
      platform: this.platform,
      isWSL: this.isWSL
    };
  }

  isReady() {
    return this.isInitialized;
  }

  async pathExists(p) {
    try {
      await fs.promises.access(p);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 📝 사용자 피드백 수집 (AI 학습용)
   */
  recordUserFeedback(userId, originalInput, originalPaths, correctPath) {
    this.userIntentLearner.recordUserFeedback(userId, {
      intent: 'user_correction',
      paths: originalPaths
    }, correctPath);
    
    console.log(`📝 사용자 피드백 기록: "${originalInput}" → ${correctPath}`);
  }

  /**
   * 💾 대화 기록 저장 (AI 학습용)
   */
  recordConversation(userId, input, intent, result) {
    this.userIntentLearner.recordConversation(userId, input, intent, result);
  }

  /**
   * 📊 사용자별 AI 학습 통계
   */
  getUserLearningStats(userId) {
    return this.userIntentLearner.getUserStats(userId);
  }

  /**
   * 🗺️ Resolve Hardcoded Path with Enhanced Context (PathMappings에서 이전)
   */
  async resolveHardcodedPath(input, context = {}) {
    try {
      const inputLower = input.toLowerCase().trim();
      
      // Direct mapping lookup
      const allMappings = this.pathMappingsInstance.getAllMappings();
      
      for (const [key, path] of Object.entries(allMappings)) {
        const keyLower = key.toLowerCase();
        
        // Exact match
        if (keyLower === inputLower) {
          console.log(`🎯 Exact mapping found: ${input} → ${path}`);
          return path;
        }
        
        // Partial match with high similarity
        const similarity = this.calculateBasicSimilarity(keyLower, inputLower);
        if (similarity > 0.8) {
          console.log(`🎯 Partial mapping found: ${input} → ${path} (${(similarity * 100).toFixed(1)}% match)`);
          return path;
        }
      }
      
      // Language-specific matching
      const languageResult = this.resolveWithLanguageMapping(input, context);
      if (languageResult) {
        return languageResult;
      }
      
      console.log(`❌ No hardcoded mapping found for: ${input}`);
      return null;
      
    } catch (error) {
      console.error('❌ Hardcoded path resolution failed:', error);
      return null;
    }
  }

  /**
   * 📁 Get Files by Extension - 실제 파일 검색 (UI 필터와 동일한 로직)
   */
  async getPathsForFileType(extension, options = {}) {
    try {
      console.log(`🔍 확장자 검색 시작: ${extension}`);
      
      // 확장자 정규화
      const targetExtension = extension.toLowerCase().startsWith('.') 
        ? extension.toLowerCase() 
        : `.${extension.toLowerCase()}`;
      
      // 검색할 경로들 결정
      let searchPaths = [];
      
      if (options.searchPaths && options.searchPaths.length > 0) {
        // 특정 경로에서만 검색
        searchPaths = options.searchPaths;
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
        
        searchPaths = commonPaths[targetExtension] || [
          os.homedir() + '\\Desktop',
          os.homedir() + '\\Documents', 
          os.homedir() + '\\Downloads'
        ];
      }
      
      // 실제 파일 검색
      const allFiles = [];
      
      for (const searchPath of searchPaths) {
        try {
          const files = await this.scanDirectoryForExtension(searchPath, targetExtension, options);
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
      
      console.log(`✅ 확장자 검색 완료: ${targetExtension} - ${sortedFiles.length}개 파일 발견`);
      
      return sortedFiles;
      
    } catch (error) {
      console.error(`❌ 확장자 검색 실패: ${extension}`, error);
      return [];
    }
  }

  /**
   * 🌐 Language-Specific Path Resolution (PathMappings에서 이전)
   */
  resolveWithLanguageMapping(input, context) {
    const lang = context.language || 'ko';
    const localization = {
      'ko': {
        desktop: '바탕화면',
        downloads: '다운로드',
        documents: '문서',
        pictures: '사진',
        music: '음악',
        videos: '비디오',
        project: '프로젝트',
        work: '작업'
      },
      'en': {
        desktop: 'Desktop',
        downloads: 'Downloads', 
        documents: 'Documents',
        pictures: 'Pictures',
        music: 'Music',
        videos: 'Videos',
        project: 'Project',
        work: 'Work'
      }
    };
    
    const langLocalization = localization[lang];
    if (!langLocalization) return null;
    
    const inputLower = input.toLowerCase();
    
    // Check localized folder names
    for (const [englishName, localName] of Object.entries(langLocalization)) {
      if (inputLower.includes(localName.toLowerCase()) || inputLower.includes(englishName.toLowerCase())) {
        // Return appropriate path for the folder type
        const folderPaths = {
          'desktop': os.homedir() + '\\Desktop',
          'downloads': os.homedir() + '\\Downloads',
          'documents': os.homedir() + '\\Documents',
          'pictures': os.homedir() + '\\Pictures',
          'music': os.homedir() + '\\Music',
          'videos': os.homedir() + '\\Videos',
          'project': 'D:\\my_app',
          'work': 'D:\\my_app'
        };
        
        return folderPaths[englishName] || null;
      }
    }
    
    return null;
  }

  /**
   * 🔍 Find Partial Matches (PathMappings에서 이전)
   */
  findPartialMatches(input, options = {}) {
    const matches = [];
    const inputLower = input.toLowerCase();
    
    // Search through all mapped paths
    const allPaths = this.pathMappingsInstance.getAllMappedPaths();
    
    allPaths.forEach(path => {
      if (path.toLowerCase().includes(inputLower)) {
        matches.push(path);
      }
    });
    
    // Sort by relevance
    matches.sort((a, b) => {
      const aRelevance = this.calculateRelevance(a, input);
      const bRelevance = this.calculateRelevance(b, input);
      return bRelevance - aRelevance;
    });
    
    return matches.slice(0, 10); // Return top 10 matches
  }

  /**
   * 🔧 Calculate Basic Similarity (PathMappings에서 이전)
   */
  calculateBasicSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * 📊 Calculate Relevance Score (PathMappings에서 이전)
   */
  calculateRelevance(key, keyword) {
    const keyLower = key.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    
    // Exact match gets highest score
    if (keyLower === keywordLower) return 100;
    
    // Starts with keyword gets high score
    if (keyLower.startsWith(keywordLower)) return 90;
    
    // Contains keyword gets medium score
    if (keyLower.includes(keywordLower)) return 70;
    
    // Partial match gets lower score
    const similarity = this.calculateBasicSimilarity(keyLower, keywordLower);
    return similarity * 50;
  }

  /**
   * 🔤 Levenshtein Distance (PathMappings에서 이전)
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
   * 메모리 정리
   */
  async cleanup() {
    try {
      console.log('🎯 PathResolver 정리 중...');
      
      // 캐시 정리
      if (this.pathCache) this.pathCache.clear();
      
      // AI 학습 시스템 정리
      if (this.userIntentLearner) {
        await this.userIntentLearner.cleanup();
      }
      
      // 이벤트 리스너 정리
      if (this.removeAllListeners) this.removeAllListeners();
      
      console.log('✅ PathResolver 정리 완료');
      
    } catch (error) {
      console.error('❌ PathResolver 정리 실패:', error);
    }
  }
}

// 사용자의 입력에서 실제 경로만 추출 (모든 전처리/정규화/오타/유사어/확장자/케이스/이모지/한글-영문/줄임말/관용구/붙여쓰기/띄어쓰기/AI 실수 보정 포함)
function extractRealPath(userInput) {
  let str = userInput;
  str = correctTypo(str);
  str = normalizeExtension(str);
  str = str.replace(/[\u{1F600}-\u{1F6FF}]/gu, ''); // 이모지 제거
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, ''); // 제로폭 문자 제거
  str = str.replace(/\s+/g, ' ');
  str = str.replace(/(좀|주세요|보여줘|찾아줘|열어줘|띄워줘|목록|파일|폴더|디렉토리|디렉|폴디|폴다|폴더임|폴더야|폴더좀|폴더에|폴더폴더|폴더폴더폴더)/g, '');
  str = str.trim();
  // 경로 패턴만 남기기 (예: D:\, /home/, ~/ 등)
  const pathMatch = str.match(/([A-Za-z]:\\[^\s]+|\/[^\s]+|~\/[^\s]+)/);
  return pathMatch ? pathMatch[0] : str;
}

// 파일명에서 표준 확장자만 추출 (오타/유사어/혼용/대소문자/이모지 등 보정)
function extractFileExtension(filename) {
  return normalizeExtension(filename.split('.').pop());
}

// 하위 폴더명 정제 함수 (파일 상단에 추가)
function cleanSubfolderName(raw) {
  if (!raw) return '';
  let sub = raw;
  while (true) {
    const before = sub;
    sub = sub
      .replace(/(폴더|안에|에서|에|의|folder|in|on|at|directory|dir)$/gi, '')
      .replace(/^[\\\/\s]+|[\\\/\s]+$/g, '') // 앞뒤 슬래시/공백 제거
      .replace(/[\\\/]+/g, require('path').sep)
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*\\\s*/g, require('path').sep)
      .replace(/\s*\/\s*/g, require('path').sep);
    if (sub === before) break;
  }
  return sub;
}

// 경로 유효성 검사 함수 (파일 상단에 추가)
function isValidPath(p) {
  return typeof p === 'string' && p.length > 0 && !p.match(/[<>:"|?*]/);
}