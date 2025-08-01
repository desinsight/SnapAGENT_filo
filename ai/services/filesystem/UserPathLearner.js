/**
 * 🧠 사용자 경로 학습 시스템
 * 개인별 폴더 구조 학습 및 맞춤형 경로 매핑
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';

export class UserPathLearner extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.userProfile = os.homedir();
    this.username = os.userInfo().username;
    
    // 사용자별 학습 데이터
    this.userData = new Map();
    
    // 전역 학습 데이터
    this.globalData = {
      commonPatterns: new Map(),
      popularPaths: new Map(),
      userPreferences: new Map()
    };
    
    // 학습 설정
    this.learningConfig = {
      maxUserDataSize: options.maxUserDataSize || 1000,
      learningRate: options.learningRate || 0.1,
      decayRate: options.decayRate || 0.95,
      minConfidence: options.minConfidence || 0.3
    };
    
    // 데이터 파일 경로
    this.dataPath = path.join(process.cwd(), 'data', 'user_learning');
    
    // 자동 저장 설정
    this.autoSaveInterval = options.autoSaveInterval || 60000; // 1분
    this.autoSaveTimer = null;
  }

  /**
   * 🚀 학습 시스템 초기화
   */
  async initialize() {
    console.log('🧠 사용자 경로 학습 시스템 초기화...');
    
    try {
      // 데이터 디렉토리 생성
      await this.ensureDataDirectory();
      
      // 기존 학습 데이터 로드
      await this.loadLearningData();
      
      // 자동 저장 시작
      this.startAutoSave();
      
      console.log('✅ 사용자 경로 학습 시스템 초기화 완료');
      this.emit('initialized');
      
    } catch (error) {
      console.error('❌ 학습 시스템 초기화 실패:', error);
      this.emit('initializationError', error);
    }
  }

  /**
   * 📝 사용자 경로 학습
   */
  async learnUserPath(userId, input, resolvedPath, success = true) {
    if (!this.userData.has(userId)) {
      this.userData.set(userId, {
        paths: new Map(),
        patterns: new Map(),
        preferences: new Map(),
        history: [],
        lastActivity: Date.now()
      });
    }

    const userData = this.userData.get(userId);
    
    // 경로 사용 빈도 업데이트
    this.updatePathUsage(userData.paths, resolvedPath, success);
    
    // 패턴 학습
    this.learnPattern(userData.patterns, input, resolvedPath, success);
    
    // 사용자 선호도 학습
    this.learnPreference(userData.preferences, input, resolvedPath, success);
    
    // 히스토리 기록
    this.recordHistory(userData.history, {
      input,
      resolvedPath,
      success,
      timestamp: Date.now()
    });
    
    // 전역 데이터 업데이트
    this.updateGlobalData(input, resolvedPath, success);
    
    this.emit('pathLearned', { userId, input, resolvedPath, success });
  }

  /**
   * 🎯 사용자 맞춤 경로 예측
   */
  async predictUserPath(userId, input, context = {}) {
    const userData = this.userData.get(userId);
    if (!userData) {
      return { confidence: 0, paths: [] };
    }

    const predictions = [];
    
    // 1. 사용자 개인 패턴 기반 예측
    const userPatternMatch = this.matchUserPattern(userData.patterns, input);
    if (userPatternMatch) {
      predictions.push({
        path: userPatternMatch.path,
        confidence: userPatternMatch.confidence * 1.2, // 개인 패턴 가중치
        source: 'user_pattern'
      });
    }
    
    // 2. 사용자 선호도 기반 예측
    const userPreferenceMatch = this.matchUserPreference(userData.preferences, input);
    if (userPreferenceMatch) {
      predictions.push({
        path: userPreferenceMatch.path,
        confidence: userPreferenceMatch.confidence,
        source: 'user_preference'
      });
    }
    
    // 3. 전역 패턴 기반 예측
    const globalPatternMatch = this.matchGlobalPattern(input);
    if (globalPatternMatch) {
      predictions.push({
        path: globalPatternMatch.path,
        confidence: globalPatternMatch.confidence * 0.8, // 전역 패턴 가중치
        source: 'global_pattern'
      });
    }
    
    // 4. 자주 사용하는 경로 기반 예측
    const frequentPathMatch = this.matchFrequentPath(userData.paths, input);
    if (frequentPathMatch) {
      predictions.push({
        path: frequentPathMatch.path,
        confidence: frequentPathMatch.confidence,
        source: 'frequent_path'
      });
    }
    
    // 예측 결과 정렬 및 필터링
    const sortedPredictions = predictions
      .sort((a, b) => b.confidence - a.confidence)
      .filter(p => p.confidence >= this.learningConfig.minConfidence);
    
    return {
      confidence: sortedPredictions.length > 0 ? sortedPredictions[0].confidence : 0,
      paths: sortedPredictions.map(p => p.path),
      sources: sortedPredictions.map(p => p.source)
    };
  }

  /**
   * 📊 경로 사용 빈도 업데이트
   */
  updatePathUsage(pathsMap, path, success) {
    if (!pathsMap.has(path)) {
      pathsMap.set(path, {
        count: 0,
        successCount: 0,
        lastUsed: 0,
        confidence: 0
      });
    }
    
    const pathData = pathsMap.get(path);
    pathData.count++;
    pathData.lastUsed = Date.now();
    
    if (success) {
      pathData.successCount++;
    }
    
    // 신뢰도 계산
    pathData.confidence = pathData.successCount / pathData.count;
    
    // 시간에 따른 감쇠 적용
    const timeDecay = Math.pow(this.learningConfig.decayRate, 
      (Date.now() - pathData.lastUsed) / (24 * 60 * 60 * 1000)); // 일 단위
    pathData.confidence *= timeDecay;
  }

  /**
   * 🧩 패턴 학습
   */
  learnPattern(patternsMap, input, resolvedPath, success) {
    const pattern = this.extractPattern(input);
    
    if (!patternsMap.has(pattern)) {
      patternsMap.set(pattern, {
        paths: new Map(),
        count: 0,
        successCount: 0
      });
    }
    
    const patternData = patternsMap.get(pattern);
    patternData.count++;
    
    if (success) {
      patternData.successCount++;
    }
    
    // 패턴별 경로 매핑 업데이트
    if (!patternData.paths.has(resolvedPath)) {
      patternData.paths.set(resolvedPath, 0);
    }
    patternData.paths.set(resolvedPath, patternData.paths.get(resolvedPath) + 1);
  }

  /**
   * ⭐ 사용자 선호도 학습
   */
  learnPreference(preferencesMap, input, resolvedPath, success) {
    const preference = this.extractPreference(input);
    
    if (!preferencesMap.has(preference)) {
      preferencesMap.set(preference, {
        paths: new Map(),
        count: 0
      });
    }
    
    const preferenceData = preferencesMap.get(preference);
    preferenceData.count++;
    
    if (!preferenceData.paths.has(resolvedPath)) {
      preferenceData.paths.set(resolvedPath, 0);
    }
    preferenceData.paths.set(resolvedPath, preferenceData.paths.get(resolvedPath) + 1);
  }

  /**
   * 📝 히스토리 기록
   */
  recordHistory(history, record) {
    history.push(record);
    
    // 히스토리 크기 제한
    if (history.length > this.learningConfig.maxUserDataSize) {
      history.splice(0, history.length - this.learningConfig.maxUserDataSize);
    }
  }

  /**
   * 🌍 전역 데이터 업데이트
   */
  updateGlobalData(input, resolvedPath, success) {
    // 전역 패턴 업데이트
    const globalPattern = this.extractPattern(input);
    if (!this.globalData.commonPatterns.has(globalPattern)) {
      this.globalData.commonPatterns.set(globalPattern, new Map());
    }
    
    const patternMap = this.globalData.commonPatterns.get(globalPattern);
    if (!patternMap.has(resolvedPath)) {
      patternMap.set(resolvedPath, 0);
    }
    patternMap.set(resolvedPath, patternMap.get(resolvedPath) + 1);
    
    // 인기 경로 업데이트
    if (!this.globalData.popularPaths.has(resolvedPath)) {
      this.globalData.popularPaths.set(resolvedPath, 0);
    }
    this.globalData.popularPaths.set(resolvedPath, 
      this.globalData.popularPaths.get(resolvedPath) + 1);
  }

  /**
   * 🎯 패턴 매칭
   */
  matchUserPattern(patternsMap, input) {
    const pattern = this.extractPattern(input);
    const patternData = patternsMap.get(pattern);
    
    if (!patternData || patternData.paths.size === 0) {
      return null;
    }
    
    // 가장 많이 사용된 경로 반환
    const sortedPaths = Array.from(patternData.paths.entries())
      .sort((a, b) => b[1] - a[1]);
    
    return {
      path: sortedPaths[0][0],
      confidence: patternData.successCount / patternData.count
    };
  }

  /**
   * ⭐ 선호도 매칭
   */
  matchUserPreference(preferencesMap, input) {
    const preference = this.extractPreference(input);
    const preferenceData = preferencesMap.get(preference);
    
    if (!preferenceData || preferenceData.paths.size === 0) {
      return null;
    }
    
    // 가장 선호하는 경로 반환
    const sortedPaths = Array.from(preferenceData.paths.entries())
      .sort((a, b) => b[1] - a[1]);
    
    return {
      path: sortedPaths[0][0],
      confidence: sortedPaths[0][1] / preferenceData.count
    };
  }

  /**
   * 🌍 전역 패턴 매칭
   */
  matchGlobalPattern(input) {
    const pattern = this.extractPattern(input);
    const patternMap = this.globalData.commonPatterns.get(pattern);
    
    if (!patternMap || patternMap.size === 0) {
      return null;
    }
    
    // 가장 인기 있는 경로 반환
    const sortedPaths = Array.from(patternMap.entries())
      .sort((a, b) => b[1] - a[1]);
    
    return {
      path: sortedPaths[0][0],
      confidence: sortedPaths[0][1] / Array.from(patternMap.values()).reduce((a, b) => a + b, 0)
    };
  }

  /**
   * 📊 자주 사용하는 경로 매칭
   */
  matchFrequentPath(pathsMap, input) {
    if (pathsMap.size === 0) {
      return null;
    }
    
    // 가장 자주 사용하는 경로 반환
    const sortedPaths = Array.from(pathsMap.entries())
      .sort((a, b) => b[1].count - a[1].count);
    
    return {
      path: sortedPaths[0][0],
      confidence: sortedPaths[0][1].confidence
    };
  }

  /**
   * 🔍 패턴 추출
   */
  extractPattern(input) {
    // 입력에서 키워드 추출
    const keywords = input.toLowerCase()
      .replace(/[^\w\s가-힣]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    return keywords.join('_');
  }

  /**
   * ⭐ 선호도 추출
   */
  extractPreference(input) {
    // 사용자 선호도 키워드 추출
    const preferenceKeywords = [
      '바탕화면', '데스크탑', '문서', '다운로드', '사진', '음악', '비디오',
      '카카오톡', 'onedrive', 'dropbox', 'google'
    ];
    
    const found = preferenceKeywords.filter(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return found.length > 0 ? found[0] : 'general';
  }

  /**
   * 📊 사용자 학습 통계
   */
  getUserStats(userId) {
    const userData = this.userData.get(userId);
    if (!userData) {
      return {
        totalPaths: 0,
        totalPatterns: 0,
        totalHistory: 0,
        lastActivity: null,
        confidence: 0
      };
    }
    
    return {
      totalPaths: userData.paths.size,
      totalPatterns: userData.patterns.size,
      totalHistory: userData.history.length,
      lastActivity: userData.lastActivity,
      confidence: this.calculateUserConfidence(userData)
    };
  }

  /**
   * 📈 사용자 신뢰도 계산
   */
  calculateUserConfidence(userData) {
    if (userData.history.length === 0) {
      return 0;
    }
    
    const successCount = userData.history.filter(h => h.success).length;
    return successCount / userData.history.length;
  }

  /**
   * 💾 학습 데이터 저장
   */
  async saveLearningData() {
    try {
      const data = {
        userData: Object.fromEntries(this.userData),
        globalData: {
          commonPatterns: Object.fromEntries(this.globalData.commonPatterns),
          popularPaths: Object.fromEntries(this.globalData.popularPaths),
          userPreferences: Object.fromEntries(this.globalData.userPreferences)
        },
        timestamp: Date.now()
      };
      
      const filePath = path.join(this.dataPath, 'learning_data.json');
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      
      console.log('💾 학습 데이터 저장 완료');
      
    } catch (error) {
      console.error('❌ 학습 데이터 저장 실패:', error);
    }
  }

  /**
   * 📥 학습 데이터 로드
   */
  async loadLearningData() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      // 항상 Map 인스턴스 보장
      this.pathsMap = new Map(Object.entries(parsed.pathsMap || {}));
    } catch (error) {
      this.pathsMap = new Map();
    }
  }

  /**
   * 📁 데이터 디렉토리 생성
   */
  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
    } catch (error) {
      console.warn('데이터 디렉토리 생성 실패:', error.message);
    }
  }

  /**
   * 🔄 자동 저장 시작
   */
  startAutoSave() {
    this.autoSaveTimer = setInterval(() => {
      this.saveLearningData();
    }, this.autoSaveInterval);
  }

  /**
   * 🛑 자동 저장 중지
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 🧹 메모리 정리
   */
  cleanup() {
    this.stopAutoSave();
    this.saveLearningData();
    this.userData.clear();
    this.globalData.commonPatterns.clear();
    this.globalData.popularPaths.clear();
    this.globalData.userPreferences.clear();
    this.removeAllListeners();
  }
} 