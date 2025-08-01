/**
 * 🔍 자동 경로 감지 시스템
 * 설치 시 및 초기화 시 모든 가능한 경로를 자동으로 감지하고 매핑
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';

export class AutoPathDetector extends EventEmitter {
  constructor() {
    super();
    
    this.userProfile = os.homedir();
    this.username = os.userInfo().username;
    this.platform = os.platform();
    
    // 감지된 경로 저장소
    this.detectedPaths = new Map();
    
    // 감지 우선순위
    this.detectionPriority = [
      'desktop', 'documents', 'downloads', 'pictures', 'music', 'videos',
      'onedrive', 'kakao', 'dropbox', 'google_drive'
    ];
    
    // 한국어/영어 매핑
    this.languageMappings = {
      ko: {
        desktop: ['바탕 화면', '바탕화면', '데스크탑', '데스크톱'],
        documents: ['문서', '내 문서', '도큐먼트'],
        downloads: ['다운로드', '받은 파일', '내려받기'],
        pictures: ['사진', '그림', '이미지'],
        music: ['음악', '뮤직', '노래'],
        videos: ['비디오', '동영상', '영상']
      },
      en: {
        desktop: ['Desktop'],
        documents: ['Documents'],
        downloads: ['Downloads'],
        pictures: ['Pictures'],
        music: ['Music'],
        videos: ['Videos']
      }
    };
  }

  /**
   * 🚀 자동 경로 감지 시작
   */
  async startDetection() {
    console.log('🔍 자동 경로 감지 시작...');
    
    try {
      // 1. 기본 사용자 폴더 감지
      await this.detectUserFolders();
      
      // 2. OneDrive 경로 감지
      await this.detectOneDrivePaths();
      
      // 3. 카카오톡 경로 감지
      await this.detectKakaoPaths();
      
      // 4. 기타 클라우드 서비스 감지
      await this.detectCloudServices();
      
      // 5. 결과 정리 및 저장
      await this.saveDetectionResults();
      
      console.log('✅ 자동 경로 감지 완료');
      this.emit('detectionComplete', this.detectedPaths);
      
    } catch (error) {
      console.error('❌ 자동 경로 감지 실패:', error);
      this.emit('detectionError', error);
    }
  }

  /**
   * 👤 기본 사용자 폴더 감지
   */
  async detectUserFolders() {
    console.log('👤 기본 사용자 폴더 감지 중...');
    
    const basePaths = [
      this.userProfile,
      `C:\\Users\\${this.username}`,
      `/Users/${this.username}`,
      `/home/${this.username}`
    ];

    for (const basePath of basePaths) {
      if (await this.pathExists(basePath)) {
        await this.scanForStandardFolders(basePath);
      }
    }
  }

  /**
   * 📁 표준 폴더 스캔
   */
  async scanForStandardFolders(basePath) {
    const standardFolders = [
      'Desktop', 'Documents', 'Downloads', 'Pictures', 'Music', 'Videos',
      '바탕 화면', '문서', '다운로드', '사진', '음악', '비디오'
    ];

    for (const folder of standardFolders) {
      const fullPath = path.join(basePath, folder);
      if (await this.pathExists(fullPath)) {
        this.addDetectedPath(folder.toLowerCase(), fullPath, 'standard');
      }
    }
  }

  /**
   * ☁️ OneDrive 경로 감지
   */
  async detectOneDrivePaths() {
    console.log('☁️ OneDrive 경로 감지 중...');
    
    const oneDrivePaths = [
      path.join(this.userProfile, 'OneDrive'),
      path.join(this.userProfile, 'OneDrive - 개인용'),
      path.join(this.userProfile, 'OneDrive - Personal'),
      path.join(this.userProfile, 'OneDrive - 個人用'),
      path.join(this.userProfile, 'OneDrive - 个人')
    ];

    for (const oneDrivePath of oneDrivePaths) {
      if (await this.pathExists(oneDrivePath)) {
        await this.scanOneDriveFolders(oneDrivePath);
      }
    }
  }

  /**
   * 📂 OneDrive 폴더 스캔
   */
  async scanOneDriveFolders(oneDrivePath) {
    try {
      const entries = await fs.readdir(oneDrivePath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const folderPath = path.join(oneDrivePath, entry.name);
          const folderType = this.mapFolderType(entry.name);
          
          if (folderType) {
            this.addDetectedPath(folderType, folderPath, 'onedrive');
          }
        }
      }
    } catch (error) {
      console.warn(`OneDrive 폴더 스캔 실패: ${oneDrivePath}`, error.message);
    }
  }

  /**
   * 💬 카카오톡 경로 감지
   */
  async detectKakaoPaths() {
    console.log('💬 카카오톡 경로 감지 중...');
    
    const kakaoPaths = [
      path.join(this.userProfile, 'Documents', '카카오톡 받은 파일'),
      path.join(this.userProfile, 'Documents', 'KakaoTalk Received Files'),
      path.join(this.userProfile, 'OneDrive', 'Documents', '카카오톡 받은 파일'),
      path.join(this.userProfile, 'OneDrive', 'Documents', 'KakaoTalk Received Files')
    ];

    for (const kakaoPath of kakaoPaths) {
      if (await this.pathExists(kakaoPath)) {
        this.addDetectedPath('kakao_received', kakaoPath, 'kakao');
      }
    }
  }

  /**
   * ☁️ 기타 클라우드 서비스 감지
   */
  async detectCloudServices() {
    console.log('☁️ 기타 클라우드 서비스 감지 중...');
    
    const cloudServices = [
      { name: 'dropbox', paths: [path.join(this.userProfile, 'Dropbox')] },
      { name: 'google_drive', paths: [path.join(this.userProfile, 'Google Drive')] },
      { name: 'icloud', paths: [path.join(this.userProfile, 'iCloud Drive')] }
    ];

    for (const service of cloudServices) {
      for (const servicePath of service.paths) {
        if (await this.pathExists(servicePath)) {
          this.addDetectedPath(service.name, servicePath, 'cloud');
        }
      }
    }
  }

  /**
   * 📝 감지된 경로 추가
   */
  addDetectedPath(type, path, source) {
    if (!this.detectedPaths.has(type)) {
      this.detectedPaths.set(type, []);
    }
    
    const paths = this.detectedPaths.get(type);
    if (!paths.find(p => p.path === path)) {
      paths.push({
        path,
        source,
        detectedAt: Date.now(),
        language: this.detectLanguage(path)
      });
    }
  }

  /**
   * 🌍 언어 감지
   */
  detectLanguage(path) {
    const koreanPattern = /[가-힣]/;
    const englishPattern = /[a-zA-Z]/;
    
    if (koreanPattern.test(path)) {
      return 'ko';
    } else if (englishPattern.test(path)) {
      return 'en';
    }
    return 'unknown';
  }

  /**
   * 🗂️ 폴더 타입 매핑
   */
  mapFolderType(folderName) {
    const mappings = {
      'Desktop': 'desktop',
      'Documents': 'documents', 
      'Downloads': 'downloads',
      'Pictures': 'pictures',
      'Music': 'music',
      'Videos': 'videos',
      '바탕 화면': 'desktop',
      '문서': 'documents',
      '다운로드': 'downloads',
      '사진': 'pictures',
      '음악': 'music',
      '비디오': 'videos'
    };
    
    return mappings[folderName] || null;
  }

  /**
   * 💾 감지 결과 저장
   */
  async saveDetectionResults() {
    console.log('💾 감지 결과 저장 중...');
    
    const results = {
      detectedAt: Date.now(),
      platform: this.platform,
      username: this.username,
      paths: Object.fromEntries(this.detectedPaths),
      summary: this.generateSummary()
    };

    // 데이터 디렉토리 생성
    await this.ensureDataDirectory();

    // 결과를 파일로 저장
    const configPath = path.join(process.cwd(), 'data', 'detected_paths.json');
    await fs.writeFile(configPath, JSON.stringify(results, null, 2));
    
    console.log(`📊 감지된 경로: ${this.generateSummary()}`);
  }

  /**
   * 📁 데이터 디렉토리 생성
   */
  async ensureDataDirectory() {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      console.warn('데이터 디렉토리 생성 실패:', error.message);
    }
  }

  /**
   * 📊 요약 생성
   */
  generateSummary() {
    const summary = {};
    for (const [type, paths] of this.detectedPaths) {
      summary[type] = {
        count: paths.length,
        languages: [...new Set(paths.map(p => p.language))],
        sources: [...new Set(paths.map(p => p.source))]
      };
    }
    return summary;
  }

  /**
   * ✅ 경로 존재 확인
   */
  async pathExists(path) {
    try {
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 📋 감지된 경로 조회
   */
  getDetectedPaths(type = null) {
    if (type) {
      return this.detectedPaths.get(type) || [];
    }
    return Object.fromEntries(this.detectedPaths);
  }

  /**
   * 🔄 감지 결과 리로드
   */
  async reloadDetectionResults() {
    try {
      const configPath = path.join(process.cwd(), 'data', 'detected_paths.json');
      const data = await fs.readFile(configPath, 'utf8');
      const results = JSON.parse(data);
      
      this.detectedPaths = new Map(Object.entries(results.paths));
      return results;
    } catch (error) {
      console.warn('감지 결과 리로드 실패:', error.message);
      return null;
    }
  }

  /**
   * 🧹 메모리 정리
   */
  cleanup() {
    this.detectedPaths.clear();
    this.removeAllListeners();
  }
} 