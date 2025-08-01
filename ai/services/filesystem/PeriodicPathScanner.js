/**
 * 🔄 주기적 경로 스캐너
 * 백그라운드에서 주기적으로 새로운 경로를 감지하고 업데이트
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';

export class PeriodicPathScanner extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.scanInterval = options.scanInterval || 30000; // 30초
    this.maxScanTime = options.maxScanTime || 10000; // 10초
    this.isRunning = false;
    this.scanTimer = null;
    this.lastScanTime = 0;
    
    this.userProfile = os.homedir();
    this.username = os.userInfo().username;
    
    // 스캔 대상 경로들
    this.scanTargets = new Set();
    
    // 이전 스캔 결과
    this.previousScan = new Map();
    
    // 새로운 경로 감지
    this.newPaths = new Map();
    
    // 변경된 경로
    this.changedPaths = new Map();
    
    // 삭제된 경로
    this.deletedPaths = new Map();
  }

  /**
   * 🚀 주기적 스캔 시작
   */
  async startPeriodicScan() {
    if (this.isRunning) {
      console.log('⚠️ 주기적 스캔이 이미 실행 중입니다.');
      return;
    }

    console.log('🔄 주기적 경로 스캔 시작...');
    this.isRunning = true;

    // 초기 스캔 실행
    await this.performScan();

    // 주기적 스캔 설정
    this.scanTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.performScan();
      }
    }, this.scanInterval);

    this.emit('scanStarted', { interval: this.scanInterval });
  }

  /**
   * 🛑 주기적 스캔 중지
   */
  stopPeriodicScan() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 주기적 경로 스캔 중지...');
    this.isRunning = false;

    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }

    this.emit('scanStopped');
  }

  /**
   * 🔍 스캔 수행
   */
  async performScan() {
    const startTime = Date.now();
    
    try {
      console.log('🔍 경로 스캔 수행 중...');
      
      // 스캔 대상 경로 설정
      await this.setupScanTargets();
      
      // 현재 스캔 결과 수집
      const currentScan = new Map();
      
      for (const targetPath of this.scanTargets) {
        if (Date.now() - startTime > this.maxScanTime) {
          console.log('⏰ 스캔 시간 초과, 중단합니다.');
          break;
        }
        
        const paths = await this.scanDirectory(targetPath);
        currentScan.set(targetPath, paths);
      }
      
      // 변화 감지
      await this.detectChanges(currentScan);
      
      // 이전 스캔 결과 업데이트
      this.previousScan = currentScan;
      this.lastScanTime = Date.now();
      
      // 이벤트 발생
      this.emit('scanCompleted', {
        newPaths: this.newPaths,
        changedPaths: this.changedPaths,
        deletedPaths: this.deletedPaths,
        scanTime: Date.now() - startTime
      });
      
      console.log(`✅ 스캔 완료 (${Date.now() - startTime}ms)`);
      
    } catch (error) {
      console.error('❌ 스캔 수행 실패:', error);
      this.emit('scanError', error);
    }
  }

  /**
   * 🎯 스캔 대상 설정
   */
  async setupScanTargets() {
    this.scanTargets.clear();
    
    // 기본 사용자 폴더들
    const baseFolders = [
      'Desktop', 'Documents', 'Downloads', 'Pictures', 'Music', 'Videos',
      '바탕 화면', '문서', '다운로드', '사진', '음악', '비디오'
    ];

    for (const folder of baseFolders) {
      const folderPath = path.join(this.userProfile, folder);
      if (await this.pathExists(folderPath)) {
        this.scanTargets.add(folderPath);
      }
    }

    // OneDrive 폴더들
    const oneDrivePaths = [
      path.join(this.userProfile, 'OneDrive'),
      path.join(this.userProfile, 'OneDrive - 개인용'),
      path.join(this.userProfile, 'OneDrive - Personal')
    ];

    for (const oneDrivePath of oneDrivePaths) {
      if (await this.pathExists(oneDrivePath)) {
        this.scanTargets.add(oneDrivePath);
        
        // OneDrive 내부 폴더들도 스캔
        try {
          const entries = await fs.readdir(oneDrivePath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const subPath = path.join(oneDrivePath, entry.name);
              this.scanTargets.add(subPath);
            }
          }
        } catch (error) {
          console.warn(`OneDrive 스캔 실패: ${oneDrivePath}`, error.message);
        }
      }
    }

    // 카카오톡 경로
    const kakaoPaths = [
      path.join(this.userProfile, 'Documents', '카카오톡 받은 파일'),
      path.join(this.userProfile, 'Documents', 'KakaoTalk Received Files')
    ];

    for (const kakaoPath of kakaoPaths) {
      if (await this.pathExists(kakaoPath)) {
        this.scanTargets.add(kakaoPath);
      }
    }
  }

  /**
   * 📁 디렉토리 스캔
   */
  async scanDirectory(dirPath) {
    const paths = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          const stat = await fs.stat(fullPath);
          
          paths.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: stat.size,
            modified: stat.mtime,
            created: stat.birthtime
          });
        } catch (error) {
          // 접근 권한이 없거나 파일이 삭제된 경우 무시
          continue;
        }
      }
      
    } catch (error) {
      console.warn(`디렉토리 스캔 실패: ${dirPath}`, error.message);
    }
    
    return paths;
  }

  /**
   * 🔍 변화 감지
   */
  async detectChanges(currentScan) {
    this.newPaths.clear();
    this.changedPaths.clear();
    this.deletedPaths.clear();

    // 새로운 경로와 변경된 경로 감지
    for (const [targetPath, currentPaths] of currentScan) {
      const previousPaths = this.previousScan.get(targetPath) || [];
      
      // 새로운 경로 감지
      const newPaths = currentPaths.filter(current => 
        !previousPaths.find(prev => prev.path === current.path)
      );
      
      if (newPaths.length > 0) {
        this.newPaths.set(targetPath, newPaths);
      }
      
      // 변경된 경로 감지
      const changedPaths = currentPaths.filter(current => {
        const previous = previousPaths.find(prev => prev.path === current.path);
        return previous && (
          previous.size !== current.size ||
          previous.modified.getTime() !== current.modified.getTime()
        );
      });
      
      if (changedPaths.length > 0) {
        this.changedPaths.set(targetPath, changedPaths);
      }
    }

    // 삭제된 경로 감지
    for (const [targetPath, previousPaths] of this.previousScan) {
      const currentPaths = currentScan.get(targetPath) || [];
      
      const deletedPaths = previousPaths.filter(previous => 
        !currentPaths.find(current => current.path === previous.path)
      );
      
      if (deletedPaths.length > 0) {
        this.deletedPaths.set(targetPath, deletedPaths);
      }
    }

    // 변화가 있으면 이벤트 발생
    if (this.newPaths.size > 0 || this.changedPaths.size > 0 || this.deletedPaths.size > 0) {
      this.emit('pathsChanged', {
        newPaths: this.newPaths,
        changedPaths: this.changedPaths,
        deletedPaths: this.deletedPaths
      });
    }
  }

  /**
   * 📊 스캔 상태 조회
   */
  getScanStatus() {
    return {
      isRunning: this.isRunning,
      scanInterval: this.scanInterval,
      lastScanTime: this.lastScanTime,
      scanTargetsCount: this.scanTargets.size,
      newPathsCount: this.newPaths.size,
      changedPathsCount: this.changedPaths.size,
      deletedPathsCount: this.deletedPaths.size
    };
  }

  /**
   * 🎯 특정 경로 스캔 대상 추가
   */
  addScanTarget(targetPath) {
    this.scanTargets.add(targetPath);
    console.log(`🎯 스캔 대상 추가: ${targetPath}`);
  }

  /**
   * 🚫 특정 경로 스캔 대상 제거
   */
  removeScanTarget(targetPath) {
    this.scanTargets.delete(targetPath);
    console.log(`🚫 스캔 대상 제거: ${targetPath}`);
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
   * 🧹 메모리 정리
   */
  cleanup() {
    this.stopPeriodicScan();
    this.scanTargets.clear();
    this.previousScan.clear();
    this.newPaths.clear();
    this.changedPaths.clear();
    this.deletedPaths.clear();
    this.removeAllListeners();
  }

  /**
   * 시스템 초기화
   */
  async initialize() {
    // 필요한 초기화 로직이 있으면 여기에 작성
    this.initialized = true;
  }
} 