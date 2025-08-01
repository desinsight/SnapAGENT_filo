/**
 * 👁️ FILE SYSTEM WATCHER - 실시간 파일 시스템 모니터링 엔진
 * 역할: 파일 시스템의 실시간 변경 감지 및 이벤트 처리
 * 기능: 실시간 감지, 이벤트 처리, 크로스 플랫폼 모니터링, 성능 최적화
 * 특징: 실시간 감지, 이벤트 필터링, 성능 최적화, 보안 제어
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import os from 'os';
import { PathResolver } from './PathResolver.js';

export class FileSystemWatcher extends EventEmitter {
  constructor() {
    super();
    
    // 🔍 감시 중인 경로들
    this.watchedPaths = new Map();
    
    // 📊 캐시된 파일 목록
    this.fileCache = new Map();
    
    // ⏱️ 디바운스 설정
    this.debounceTimers = new Map();
    this.debounceDelay = 1000; // 1초
    
    // 🎯 중요 경로 키 (PathResolver 매핑 활용)
    this.importantKeys = [
      'desktop', 'documents', 'downloads', 'pictures', 'music', 'videos'
    ];
    
    // PathResolver 인스턴스 (경로 후보 생성용)
    this.pathResolver = new PathResolver();
    
    console.log('🔍 FileSystemWatcher 초기화 완료');
  }

  /**
   * 🚀 감시 시스템 시작
   */
  async startWatching() {
    try {
      console.log('🔍 파일 시스템 감시 시작...');
      
      // PathResolver 초기화 (경로 후보 생성용)
      await this.pathResolver.initialize();
      
      // 중요 경로들 자동 감시 시작
      await this.watchImportantPaths();
      
      console.log('✅ 파일 시스템 감시 시작 완료');
      
    } catch (error) {
      console.error('❌ 파일 시스템 감시 시작 실패:', error);
    }
  }

  /**
   * 🎯 중요 경로들 자동 감시 (존재하는 경로만)
   */
  async watchImportantPaths() {
    const userProfile = os.homedir();
    for (const key of this.importantKeys) {
      // 기본 경로들 직접 설정 (PathResolver 의존성 제거)
      const basePaths = {
        desktop: [`${userProfile}\\Desktop`, `${userProfile}\\바탕 화면`],
        documents: [`${userProfile}\\Documents`, `${userProfile}\\내 문서`],
        downloads: [`${userProfile}\\Downloads`, `${userProfile}\\다운로드`],
        pictures: [`${userProfile}\\Pictures`, `${userProfile}\\사진`],
        music: [`${userProfile}\\Music`, `${userProfile}\\음악`],
        videos: [`${userProfile}\\Videos`, `${userProfile}\\비디오`]
      };
      
      const candidates = basePaths[key] || [];
      let watched = false;
      
      for (const folderPath of candidates) {
        try {
          await fs.promises.access(folderPath);
          await this.watchPath(folderPath, { autoWatch: true });
          console.log(`👁️ 자동 감시 시작: ${folderPath}`);
          watched = true;
          break; // 첫 번째로 존재하는 경로만 감시
        } catch {
          // 폴더가 없으면 무시
        }
      }
      
      if (!watched) {
        console.log(`⚠️ 감시할 수 있는 경로 없음: ${key}`);
      }
    }
  }

  /**
   * 👁️ 특정 경로 감시 시작
   */
  async watchPath(targetPath, options = {}) {
    const {
      recursive = true,
      autoWatch = false,
      cacheResults = true
    } = options;

    try {
      // 경로 정규화
      const normalizedPath = path.resolve(targetPath);
      
      // 경로 존재 확인 (Promise 기반)
      try {
        await fs.promises.access(normalizedPath);
      } catch {
        throw new Error(`경로가 존재하지 않습니다: ${normalizedPath}`);
      }
      
      // 이미 감시 중인지 확인
      if (this.watchedPaths.has(normalizedPath)) {
        return this.watchedPaths.get(normalizedPath);
      }

      // 초기 파일 목록 캐시
      if (cacheResults) {
        await this.updateCache(normalizedPath);
      }

      // 파일 시스템 감시 시작
      const watcher = fs.watch(normalizedPath, { recursive }, (eventType, filename) => {
        this.handleFileChange(normalizedPath, eventType, filename);
      });

      // 감시 정보 저장
      const watchInfo = {
        path: normalizedPath,
        watcher,
        recursive,
        autoWatch,
        lastUpdate: Date.now(),
        changeCount: 0
      };

      this.watchedPaths.set(normalizedPath, watchInfo);
      
      console.log(`👁️ 감시 시작: ${normalizedPath}`);
      
      return watchInfo;

    } catch (error) {
      console.error(`❌ 경로 감시 실패: ${targetPath}`, error);
      throw error;
    }
  }

  /**
   * 📝 파일 변화 처리
   */
  handleFileChange(watchedPath, eventType, filename) {
    const watchInfo = this.watchedPaths.get(watchedPath);
    if (!watchInfo) return;

    // 변화 카운트 증가
    watchInfo.changeCount++;
    watchInfo.lastUpdate = Date.now();

    // 이벤트 발생
    this.emit('fileChange', {
      path: watchedPath,
      eventType,
      filename,
      timestamp: Date.now()
    });

    // 디바운스된 캐시 업데이트
    this.debouncedCacheUpdate(watchedPath);

    console.log(`📝 파일 변화 감지: ${watchedPath} - ${eventType} - ${filename}`);
  }

  /**
   * ⏱️ 디바운스된 캐시 업데이트
   */
  debouncedCacheUpdate(path) {
    // 기존 타이머 취소
    if (this.debounceTimers.has(path)) {
      clearTimeout(this.debounceTimers.get(path));
    }

    // 새 타이머 설정
    const timer = setTimeout(async () => {
      try {
        await this.updateCache(path);
        this.debounceTimers.delete(path);
        
        // 캐시 업데이트 이벤트 발생
        this.emit('cacheUpdated', {
          path,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error(`❌ 캐시 업데이트 실패: ${path}`, error);
      }
    }, this.debounceDelay);

    this.debounceTimers.set(path, timer);
  }

  /**
   * 📊 캐시 업데이트
   */
  async updateCache(targetPath) {
    try {
      const files = await this.scanDirectory(targetPath);
      
      this.fileCache.set(targetPath, {
        files,
        lastScan: Date.now(),
        fileCount: files.length,
        totalSize: this.calculateTotalSize(files)
      });

      console.log(`📊 캐시 업데이트: ${targetPath} (${files.length}개 파일)`);
      
    } catch (error) {
      console.error(`❌ 캐시 업데이트 실패: ${targetPath}`, error);
    }
  }

  /**
   * 📁 디렉토리 스캔
   */
  async scanDirectory(dirPath) {
    const files = [];
    
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          const stat = await fs.promises.stat(fullPath);
          
          files.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: stat.size,
            modified: stat.mtime,
            created: stat.birthtime,
            permissions: stat.mode
          });
        } catch {
          // 접근 권한이 없거나 파일이 삭제된 경우 무시
        }
      }
      
      // 이름순 정렬
      files.sort((a, b) => {
        // 폴더 먼저, 그 다음 파일
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      
    } catch (error) {
      console.error(`❌ 디렉토리 스캔 실패: ${dirPath}`, error);
    }
    
    return files;
  }

  /**
   * 📏 전체 크기 계산
   */
  calculateTotalSize(files) {
    return files.reduce((total, file) => {
      return total + (file.isDirectory ? 0 : file.size);
    }, 0);
  }

  /**
   * 📋 캐시된 파일 목록 조회
   */
  getCachedFiles(targetPath) {
    const normalizedPath = path.resolve(targetPath);
    const cache = this.fileCache.get(normalizedPath);
    
    if (!cache) {
      return null;
    }

    // 캐시가 오래되었으면 업데이트
    const cacheAge = Date.now() - cache.lastScan;
    if (cacheAge > 30000) { // 30초 이상 지났으면
      this.updateCache(normalizedPath);
    }

    return cache.files;
  }

  /**
   * 🔄 실시간 파일 목록 조회 (캐시 + 실시간 스캔)
   */
  async getRealTimeFiles(targetPath) {
    const normalizedPath = path.resolve(targetPath);
    
    try {
      console.log(`🔍 FileSystemWatcher.getRealTimeFiles 시작: ${targetPath} → ${normalizedPath}`);
      
      // 경로 존재 확인
      try {
      await fs.promises.access(normalizedPath);
        console.log(`✅ 경로 접근 가능: ${normalizedPath}`);
      } catch (accessError) {
        console.log(`⚠️ 경로 접근 실패: ${normalizedPath} - ${accessError.message}`);
        // 접근 실패해도 계속 진행 (권한 문제일 수 있음)
      }
      
      // 감시 중이 아니면 감시 시작
      if (!this.watchedPaths.has(normalizedPath)) {
        console.log(`👁️ 감시 시작: ${normalizedPath}`);
        await this.watchPath(normalizedPath, { cacheResults: true });
      }

      // 실시간 스캔 실행
      console.log(`📊 캐시 업데이트 시작: ${normalizedPath}`);
      await this.updateCache(normalizedPath);
      
      const cachedFiles = this.getCachedFiles(normalizedPath);
      console.log(`📋 캐시된 파일 수: ${cachedFiles ? cachedFiles.length : 0}`);
      
      return cachedFiles;
    } catch (error) {
      console.error(`❌ 실시간 파일 목록 조회 실패: ${targetPath}`, error);
      
      // 실패 시에도 직접 스캔 시도
      try {
        console.log(`🔄 직접 스캔 시도: ${normalizedPath}`);
        const directScan = await this.scanDirectory(normalizedPath);
        console.log(`📋 직접 스캔 결과: ${directScan.length}개 파일`);
        return directScan;
      } catch (scanError) {
        console.error(`❌ 직접 스캔도 실패: ${normalizedPath}`, scanError);
      return null;
      }
    }
  }

  /**
   * 📊 감시 상태 조회
   */
  getWatchStatus() {
    const status = {
      totalWatched: this.watchedPaths.size,
      totalCached: this.fileCache.size,
      activeTimers: this.debounceTimers.size,
      watchedPaths: []
    };

    for (const [path, info] of this.watchedPaths) {
      status.watchedPaths.push({
        path,
        recursive: info.recursive,
        autoWatch: info.autoWatch,
        changeCount: info.changeCount,
        lastUpdate: info.lastUpdate
      });
    }

    return status;
  }

  /**
   * 🛑 특정 경로 감시 중지
   */
  stopWatching(targetPath) {
    const normalizedPath = path.resolve(targetPath);
    const watchInfo = this.watchedPaths.get(normalizedPath);
    
    if (watchInfo) {
      watchInfo.watcher.close();
      this.watchedPaths.delete(normalizedPath);
      this.fileCache.delete(normalizedPath);
      
      // 디바운스 타이머 정리
      if (this.debounceTimers.has(normalizedPath)) {
        clearTimeout(this.debounceTimers.get(normalizedPath));
        this.debounceTimers.delete(normalizedPath);
      }
      
      console.log(`🛑 감시 중지: ${normalizedPath}`);
    }
  }

  /**
   * 🛑 모든 감시 중지
   */
  stopAllWatching() {
    console.log('🛑 모든 파일 시스템 감시 중지...');
    
    for (const [path, watchInfo] of this.watchedPaths) {
      watchInfo.watcher.close();
    }
    
    this.watchedPaths.clear();
    this.fileCache.clear();
    
    // 모든 디바운스 타이머 정리
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    
    console.log('✅ 모든 감시 중지 완료');
  }

  /**
   * 🧹 메모리 정리
   */
  cleanup() {
    this.stopAllWatching();
    this.removeAllListeners();
  }
} 