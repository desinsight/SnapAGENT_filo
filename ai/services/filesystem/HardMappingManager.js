/**
 * 🗺️ HARD MAPPING MANAGER - 하드코딩된 경로 매핑 관리자
 * 역할: 사용자 입력을 실제 파일 시스템 경로로 빠르게 변환하는 하드 매핑 시스템
 * 기능: 바탕화면, 문서, 카카오톡 등 자주 사용되는 경로들을 미리 정의하여 즉시 해석
 * 특징: 가장 빠른 경로 해석, 166개 매핑, 다국어 지원, 별칭/동의어 지원
 */

import os from 'os';
import path from 'path';

export class HardMappingManager {
  constructor() {
    this.isInitialized = false;
    this.platform = process.platform;
    this.username = os.userInfo().username;
    this.userProfile = os.homedir();
    
    // 🌟 World-Class Features
    this.version = '1.0.0-WorldClass';
    this.name = 'world_class_hard_mapping_manager';
    this.description = '🗺️ 방대하고 포괄적인 하드 매핑 시스템 - 모든 사용자 표현을 커버하는 단순하고 빠른 경로 해석기';
    
    // 🎯 Performance & Analytics
    this.performanceMetrics = {
      totalMappings: 0,
      successfulResolutions: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      lastOptimization: Date.now()
    };
    
    // 🔍 검색 최적화
    this.searchCache = new Map();
    this.cacheTimeout = 300000; // 5분
    
    // 🌍 다국어 지원
    this.currentLanguage = 'ko';
    
    // 🗺️ 방대한 매핑 저장소
    this.mappings = {};
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🌟 World-Class HardMappingManager 초기화 중...');
      
      // 🚀 방대한 매핑 초기화
      await this.initializeComprehensiveMappings();
      
      // 🎯 성능 최적화
      await this.optimizeSearchPerformance();
      
      // 🧠 검색 캐시 초기화
      this.initializeSearchCache();
      
      this.isInitialized = true;
      console.log('✅ World-Class HardMappingManager 초기화 완료');
      console.log(`🗺️ 총 매핑 수: ${this.performanceMetrics.totalMappings}개`);
      
    } catch (error) {
      console.error('❌ HardMappingManager 초기화 실패:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 🗺️ 방대한 매핑 초기화 - 모든 가능한 경로와 표현 포함
   */
  async initializeComprehensiveMappings() {
    const userProfile = this.userProfile;
    const username = this.username;
    
    // 🖥️ 시스템 기본 경로
    const systemPaths = {
      home: userProfile,
      temp: os.tmpdir(),
      root: this.platform === 'win32' ? 'C:\\' : '/',
      system32: this.platform === 'win32' ? 'C:\\Windows\\System32' : '/usr/bin',
      programFiles: this.platform === 'win32' ? 'C:\\Program Files' : '/usr',
      programData: this.platform === 'win32' ? 'C:\\ProgramData' : '/var',
      windows: this.platform === 'win32' ? 'C:\\Windows' : '/etc'
    };

    // 🗺️ 방대한 사용자 폴더 매핑
    this.mappings = {
      // 🖥️ 바탕화면/데스크톱 (기본 + 확장)
      '바탕화면': `${userProfile}\\Desktop`,
      '바탕 화면': `${userProfile}\\Desktop`,
      '데스크탑': `${userProfile}\\Desktop`,
      '데스크톱': `${userProfile}\\Desktop`,
      '화면': `${userProfile}\\Desktop`,
      '바탕': `${userProfile}\\Desktop`,
      'desktop': `${userProfile}\\Desktop`,
      'Desktop': `${userProfile}\\Desktop`,
      'screen': `${userProfile}\\Desktop`,
      'デスクトップ': `${userProfile}\\Desktop`,
      '桌面': `${userProfile}\\Desktop`,
      
      // 📁 문서 (기본 + 확장)
      '문서': `${userProfile}\\Documents`,
      '내 문서': `${userProfile}\\Documents`,
      '내문서': `${userProfile}\\Documents`,
      '도큐먼트': `${userProfile}\\Documents`,
      '자료': `${userProfile}\\Documents`,
      'documents': `${userProfile}\\Documents`,
      'Documents': `${userProfile}\\Documents`,
      'docs': `${userProfile}\\Documents`,
      'document': `${userProfile}\\Documents`,
      'doc': `${userProfile}\\Documents`,
      '資料': `${userProfile}\\Documents`,
      '文档': `${userProfile}\\Documents`,
      
      // 💾 다운로드 (기본 + 확장)
      '다운로드': `${userProfile}\\Downloads`,
      '다운로드폴더': `${userProfile}\\Downloads`,
      '다운로드 폴더': `${userProfile}\\Downloads`,
      'downloads': `${userProfile}\\Downloads`,
      'Downloads': `${userProfile}\\Downloads`,
      'download': `${userProfile}\\Downloads`,
      'ダウンロード': `${userProfile}\\Downloads`,
      '下载': `${userProfile}\\Downloads`,
      
      // 📸 사진 (기본 + 확장)
      '사진': `${userProfile}\\Pictures`,
      '그림': `${userProfile}\\Pictures`,
      '이미지': `${userProfile}\\Pictures`,
      'pictures': `${userProfile}\\Pictures`,
      'Pictures': `${userProfile}\\Pictures`,
      'images': `${userProfile}\\Pictures`,
      'image': `${userProfile}\\Pictures`,
      'img': `${userProfile}\\Pictures`,
      '写真': `${userProfile}\\Pictures`,
      '图片': `${userProfile}\\Pictures`,
      
      // 🎵 음악 (기본 + 확장)
      '음악': `${userProfile}\\Music`,
      '음악파일': `${userProfile}\\Music`,
      'music': `${userProfile}\\Music`,
      'Music': `${userProfile}\\Music`,
      'songs': `${userProfile}\\Music`,
      'song': `${userProfile}\\Music`,
      '音楽': `${userProfile}\\Music`,
      '音乐': `${userProfile}\\Music`,
      
      // 🎬 비디오 (기본 + 확장)
      '비디오': `${userProfile}\\Videos`,
      '동영상': `${userProfile}\\Videos`,
      '영상': `${userProfile}\\Videos`,
      'videos': `${userProfile}\\Videos`,
      'Videos': `${userProfile}\\Videos`,
      'video': `${userProfile}\\Videos`,
      'movie': `${userProfile}\\Videos`,
      'movies': `${userProfile}\\Videos`,
      '動画': `${userProfile}\\Videos`,
      '视频': `${userProfile}\\Videos`,
      
      // 💬 카카오톡 (방대한 별칭 포함)
      '카카오톡받은파일': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카톡받은파일': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카카오톡 받은 파일': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카톡 받은 파일': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '받은파일카톡': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카톡파일': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카카오파일': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카톡다운로드': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카톡 다운로드': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카카오톡다운로드': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카카오톡 다운로드': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카카오 다운로드': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      'kakaotalk received files': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      'kakaotalk': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      'kakao': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카카오톡 받은 폴더': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카톡 받은 폴더': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카카오톡에 사진': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카톡에 사진': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카카오톡에 뭐있어': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카톡에 뭐있어': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카카오톡 파일': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카톡 파일': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카카오톡폴더': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      '카톡폴더': `${userProfile}\\Documents\\카카오톡 받은 파일`,
      
      // 📱 기타 메신저/앱
      '라인받은파일': `${userProfile}\\Documents\\LINE Received Files`,
      '라인 받은 파일': `${userProfile}\\Documents\\LINE Received Files`,
      'line received files': `${userProfile}\\Documents\\LINE Received Files`,
      'line': `${userProfile}\\Documents\\LINE Received Files`,
      
      '텔레그램받은파일': `${userProfile}\\Documents\\Telegram Desktop`,
      '텔레그램 받은 파일': `${userProfile}\\Documents\\Telegram Desktop`,
      'telegram received files': `${userProfile}\\Documents\\Telegram Desktop`,
      'telegram': `${userProfile}\\Documents\\Telegram Desktop`,
      
      // ☁️ 클라우드 스토리지
      '원드라이브': `${userProfile}\\OneDrive`,
      'onedrive': `${userProfile}\\OneDrive`,
      'OneDrive': `${userProfile}\\OneDrive`,
      '구글드라이브': `${userProfile}\\Google Drive`,
      'google drive': `${userProfile}\\Google Drive`,
      'Google Drive': `${userProfile}\\Google Drive`,
      '드롭박스': `${userProfile}\\Dropbox`,
      'dropbox': `${userProfile}\\Dropbox`,
      'Dropbox': `${userProfile}\\Dropbox`,
      
      // 💻 드라이브 매핑 (Windows)
      'c드라이브': 'C:\\',
      'c 드라이브': 'C:\\',
      'c:': 'C:\\',
      'C:': 'C:\\',
      'd드라이브': 'D:\\',
      'd 드라이브': 'D:\\',
      'd:': 'D:\\',
      'D:': 'D:\\',
      'e드라이브': 'E:\\',
      'e 드라이브': 'E:\\',
      'e:': 'E:\\',
      'E:': 'E:\\',
      
      // 📂 프로젝트/작업 폴더
      '프로젝트': `${userProfile}\\Documents\\Projects`,
      'project': `${userProfile}\\Documents\\Projects`,
      'Project': `${userProfile}\\Documents\\Projects`,
      '작업': `${userProfile}\\Documents\\Work`,
      'work': `${userProfile}\\Documents\\Work`,
      'Work': `${userProfile}\\Documents\\Work`,
      '업무': `${userProfile}\\Documents\\Work`,
      '회사': `${userProfile}\\Documents\\Work`,
      'company': `${userProfile}\\Documents\\Work`,
      'Company': `${userProfile}\\Documents\\Work`,
      
      // 🛠️ 개발 프로젝트 (PathMappings에서 추가)
      'my_app': 'D:\\my_app',
      'myapp': 'D:\\my_app',
      'web_mcp': 'D:\\my_app\\Web_MCP_Server',
      'webmcp': 'D:\\my_app\\Web_MCP_Server',
      'mcp': 'D:\\my_app\\Web_MCP_Server',
      'backend': 'D:\\my_app\\Web_MCP_Server\\backend',
      'electron': 'D:\\my_app\\Web_MCP_Server\\apps\\electron',
      'frontend': 'D:\\my_app\\Web_MCP_Server\\apps\\electron',
      '작업폴더': 'D:\\',
      
      // 🎵 미디어 관련 (PathResolver에서 추가)
      '미디어': `${userProfile}\\Pictures`,
      'media': `${userProfile}\\Pictures`,
      
      // 💾 백업 관련 (PathResolver에서 추가)
      '백업': `${userProfile}\\Documents`,
      'backup': `${userProfile}\\Documents`,
      
      // 🎬 동영상 (PathMappings에서 추가)
      '동영상': `${userProfile}\\Videos`,
      
      // 🖼️ 그림 (PathMappings에서 추가)
      '그림': `${userProfile}\\Pictures`,
      
      // 🎓 학습/교육
      '학습': `${userProfile}\\Documents\\Study`,
      'study': `${userProfile}\\Documents\\Study`,
      'Study': `${userProfile}\\Documents\\Study`,
      '교육': `${userProfile}\\Documents\\Education`,
      'education': `${userProfile}\\Documents\\Education`,
      'Education': `${userProfile}\\Documents\\Education`,
      '강의': `${userProfile}\\Documents\\Lectures`,
      'lectures': `${userProfile}\\Documents\\Lectures`,
      'Lectures': `${userProfile}\\Documents\\Lectures`,
      
      // 🏠 개인/가족
      '개인': `${userProfile}\\Documents\\Personal`,
      'personal': `${userProfile}\\Documents\\Personal`,
      'Personal': `${userProfile}\\Documents\\Personal`,
      '가족': `${userProfile}\\Documents\\Family`,
      'family': `${userProfile}\\Documents\\Family`,
      'Family': `${userProfile}\\Documents\\Family`,
      '사진첩': `${userProfile}\\Pictures\\Album`,
      'album': `${userProfile}\\Pictures\\Album`,
      'Album': `${userProfile}\\Pictures\\Album`,
      
      // 📊 시스템 폴더
      '시스템': systemPaths.system32,
      'system': systemPaths.system32,
      'System': systemPaths.system32,
      '프로그램': systemPaths.programFiles,
      'program': systemPaths.programFiles,
      'Program': systemPaths.programFiles,
      '임시': systemPaths.temp,
      'temp': systemPaths.temp,
      'Temp': systemPaths.temp,
      '루트': systemPaths.root,
      'root': systemPaths.root,
      'Root': systemPaths.root
    };

    // 📊 매핑 수 업데이트
    this.performanceMetrics.totalMappings = Object.keys(this.mappings).length;
    
    console.log(`🗺️ 방대한 매핑 초기화 완료: ${this.performanceMetrics.totalMappings}개 매핑`);
  }

  /**
   * 🎯 빠른 하드 매핑 검색
   */
  resolvePath(input, context = {}) {
    if (!this.isInitialized) {
      console.warn('⚠️ HardMappingManager가 초기화되지 않았습니다.');
      return null;
    }

    const startTime = performance.now();
    
    try {
      // 🔍 입력 정규화
      const normalizedInput = this.normalizeInput(input);
      
      // 🗺️ 직접 매핑 검색
      let result = this.mappings[normalizedInput];
      
      // 🔄 대소문자 무관 검색
      if (!result) {
        result = this.searchCaseInsensitive(normalizedInput);
      }
      
      // 🧠 부분 매칭 검색
      if (!result) {
        result = this.searchPartialMatch(normalizedInput);
      }
      
      // 📊 성능 메트릭 업데이트
      const executionTime = performance.now() - startTime;
      this.updateMetrics(executionTime, !!result);
      
      if (result) {
        this.performanceMetrics.successfulResolutions++;
        console.log(`✅ 하드 매핑 성공: "${input}" → "${result}" (${executionTime.toFixed(2)}ms)`);
        return result;
      } else {
        console.log(`❌ 하드 매핑 실패: "${input}" (${executionTime.toFixed(2)}ms)`);
        return null;
      }
      
    } catch (error) {
      console.error('❌ 하드 매핑 오류:', error);
      return null;
    }
  }

  /**
   * 🔍 입력 정규화
   */
  normalizeInput(input) {
    if (!input || typeof input !== 'string') return '';
    
    // 원본 입력 보존 (디버깅용)
    const originalInput = input;
    
    const normalized = input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '') // 공백 제거
      .replace(/[^\w가-힣]/g, ''); // 특수문자 제거
    
    // 디버깅 로그 (개발 중에만)
    if (originalInput.includes('카카오톡') || originalInput.includes('카톡')) {
      console.log(`🔍 카카오톡 입력 정규화: "${originalInput}" → "${normalized}"`);
    }
    
    return normalized;
  }

  /**
   * 🔄 대소문자 무관 검색
   */
  searchCaseInsensitive(input) {
    const inputLower = input.toLowerCase();
    
    for (const [key, value] of Object.entries(this.mappings)) {
      if (key.toLowerCase() === inputLower) {
        return value;
      }
    }
    
    return null;
  }

  /**
   * 🧠 부분 매칭 검색
   */
  searchPartialMatch(input) {
    const inputLower = input.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [key, value] of Object.entries(this.mappings)) {
      const keyLower = key.toLowerCase();
      
      // 정확한 포함 관계
      if (keyLower.includes(inputLower) || inputLower.includes(keyLower)) {
        const score = Math.max(keyLower.length, inputLower.length) - Math.abs(keyLower.length - inputLower.length);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = value;
        }
      }
    }
    
    // 최소 점수 기준 (50% 이상 일치)
    if (bestScore >= Math.max(input.length, 3) * 0.5) {
      return bestMatch;
    }
    
    return null;
  }

  /**
   * 🎯 성능 최적화
   */
  async optimizeSearchPerformance() {
    // 🔍 검색 인덱스 생성
    this.searchIndex = new Map();
    
    for (const [key, value] of Object.entries(this.mappings)) {
      const normalizedKey = this.normalizeInput(key);
      this.searchIndex.set(normalizedKey, value);
    }
    
    console.log(`🎯 검색 인덱스 생성 완료: ${this.searchIndex.size}개 항목`);
  }

  /**
   * 🧠 검색 캐시 초기화
   */
  initializeSearchCache() {
    // 캐시 정리 스케줄러
    setInterval(() => {
      this.cleanCache();
    }, this.cacheTimeout);
    
    console.log('🧠 검색 캐시 초기화 완료');
  }

  /**
   * 🧹 캐시 정리
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, entry] of this.searchCache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.searchCache.delete(key);
      }
    }
  }

  /**
   * 📊 성능 메트릭 업데이트
   */
  updateMetrics(executionTime, success) {
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime + executionTime) / 2;
    
    if (success) {
      this.performanceMetrics.successfulResolutions++;
    }
  }

  /**
   * 📈 성능 통계 조회
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      cacheSize: this.searchCache.size,
      isInitialized: this.isInitialized,
      totalMappings: Object.keys(this.mappings).length
    };
  }

  /**
   * 🗺️ 모든 매핑 조회
   */
  getAllMappings() {
    return { ...this.mappings };
  }

  /**
   * 🔍 매핑 존재 여부 확인
   */
  hasMapping(input) {
    const normalizedInput = this.normalizeInput(input);
    return this.mappings.hasOwnProperty(normalizedInput) || 
           this.searchCaseInsensitive(normalizedInput) !== null;
  }

  /**
   * ✅ 시스템 준비 상태 확인
   */
  isReady() {
    return this.isInitialized && Object.keys(this.mappings).length > 0;
  }

  /**
   * 🧹 리소스 정리
   */
  async cleanup() {
    try {
      this.searchCache.clear();
      this.searchIndex.clear();
      this.isInitialized = false;
      console.log('🧹 HardMappingManager 리소스 정리 완료');
    } catch (error) {
      console.error('❌ HardMappingManager 정리 오류:', error);
    }
  }
}

export default HardMappingManager; 