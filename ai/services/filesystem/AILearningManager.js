/**
 * 🧠 AI 학습 데이터 관리 시스템
 * 학습 데이터의 저장, 분석, 백업, 복원 기능 제공
 */

import fs from 'fs/promises';
import path from 'path';

export class AILearningManager {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'ai_learning');
    this.backupDir = path.join(process.cwd(), 'data', 'ai_learning', 'backups');
  }

  /**
   * 📊 학습 데이터 통계 조회
   */
  async getLearningStats() {
    try {
      const stats = {
        userPatterns: await this.getFileStats('user_patterns.json'),
        conversationHistory: await this.getFileStats('conversation_history.json'),
        feedbackData: await this.getFileStats('feedback_data.json'),
        globalStats: await this.getFileStats('global_stats.json'),
        totalSize: 0,
        lastBackup: null,
        backupCount: 0
      };

      // 전체 크기 계산
      const files = ['user_patterns.json', 'conversation_history.json', 'feedback_data.json', 'global_stats.json'];
      for (const file of files) {
        if (stats[file.replace('.json', '')]) {
          stats.totalSize += stats[file.replace('.json', '')].size;
        }
      }

      // 백업 정보
      try {
        const backupFiles = await fs.readdir(this.backupDir);
        stats.backupCount = backupFiles.length;
        if (backupFiles.length > 0) {
          const latestBackup = backupFiles.sort().pop();
          const backupPath = path.join(this.backupDir, latestBackup);
          const backupStat = await fs.stat(backupPath);
          stats.lastBackup = backupStat.mtime;
        }
      } catch {
        // 백업 디렉토리가 없으면 무시
      }

      return stats;
    } catch (error) {
      console.error('❌ 학습 데이터 통계 조회 실패:', error);
      return null;
    }
  }

  /**
   * 📁 파일 통계 조회
   */
  async getFileStats(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      const stat = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      return {
        exists: true,
        size: stat.size,
        modified: stat.mtime,
        records: this.countRecords(data),
        format: 'json'
      };
    } catch {
      return {
        exists: false,
        size: 0,
        modified: null,
        records: 0,
        format: 'json'
      };
    }
  }

  /**
   * 📈 레코드 수 계산
   */
  countRecords(data) {
    if (Array.isArray(data)) {
      return data.length;
    } else if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length;
    }
    return 0;
  }

  /**
   * 💾 학습 데이터 백업
   */
  async createBackup(description = '') {
    try {
      // 백업 디렉토리 생성
      await fs.mkdir(this.backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${timestamp}${description ? '_' + description : ''}`;
      const backupPath = path.join(this.backupDir, backupName);
      
      await fs.mkdir(backupPath, { recursive: true });

      // 모든 학습 데이터 파일 복사
      const files = ['user_patterns.json', 'conversation_history.json', 'feedback_data.json', 'global_stats.json'];
      
      for (const file of files) {
        const sourcePath = path.join(this.dataDir, file);
        const destPath = path.join(backupPath, file);
        
        try {
          await fs.copyFile(sourcePath, destPath);
        } catch {
          // 파일이 없으면 무시
        }
      }

      // 백업 메타데이터 생성
      const metadata = {
        timestamp: new Date().toISOString(),
        description: description,
        files: files.filter(async (file) => {
          try {
            await fs.access(path.join(backupPath, file));
            return true;
          } catch {
            return false;
          }
        }),
        version: '1.0.0'
      };

      await fs.writeFile(
        path.join(backupPath, 'backup_metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`💾 AI 학습 데이터 백업 완료: ${backupName}`);
      return backupName;

    } catch (error) {
      console.error('❌ 백업 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 🔄 학습 데이터 복원
   */
  async restoreBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      
      // 백업 존재 확인
      await fs.access(backupPath);
      
      // 현재 데이터 백업 (안전장치)
      await this.createBackup('before_restore');
      
      // 백업에서 파일 복원
      const files = ['user_patterns.json', 'conversation_history.json', 'feedback_data.json', 'global_stats.json'];
      
      for (const file of files) {
        const sourcePath = path.join(backupPath, file);
        const destPath = path.join(this.dataDir, file);
        
        try {
          await fs.copyFile(sourcePath, destPath);
        } catch {
          // 백업에 파일이 없으면 무시
        }
      }

      console.log(`🔄 AI 학습 데이터 복원 완료: ${backupName}`);
      return true;

    } catch (error) {
      console.error('❌ 백업 복원 실패:', error);
      throw error;
    }
  }

  /**
   * 📋 백업 목록 조회
   */
  async listBackups() {
    try {
      await fs.access(this.backupDir);
      const files = await fs.readdir(this.backupDir);
      
      const backups = [];
      for (const file of files) {
        const backupPath = path.join(this.backupDir, file);
        const stat = await fs.stat(backupPath);
        
        let metadata = null;
        try {
          const metadataPath = path.join(backupPath, 'backup_metadata.json');
          const metadataContent = await fs.readFile(metadataPath, 'utf8');
          metadata = JSON.parse(metadataContent);
        } catch {
          // 메타데이터가 없으면 기본 정보만
        }

        backups.push({
          name: file,
          created: stat.birthtime,
          modified: stat.mtime,
          size: stat.size,
          description: metadata?.description || '',
          files: metadata?.files || []
        });
      }

      return backups.sort((a, b) => b.modified - a.modified);

    } catch {
      return [];
    }
  }

  /**
   * 🗑️ 학습 데이터 정리
   */
  async cleanupData(options = {}) {
    const {
      maxConversationHistory = 5000,  // 사용자당 최대 대화 기록 (100 → 5000으로 증가)
      maxFeedbackAge = 30 * 24 * 60 * 60 * 1000,  // 30일
      removeInactiveUsers = true,
      inactiveThreshold = 90 * 24 * 60 * 60 * 1000  // 90일
    } = options;

    try {
      console.log('🧹 AI 학습 데이터 정리 시작...');

      // 1. 대화 기록 정리
      await this.cleanupConversationHistory(maxConversationHistory);

      // 2. 오래된 피드백 정리
      await this.cleanupOldFeedback(maxFeedbackAge);

      // 3. 비활성 사용자 정리
      if (removeInactiveUsers) {
        await this.cleanupInactiveUsers(inactiveThreshold);
      }

      console.log('✅ AI 학습 데이터 정리 완료');

    } catch (error) {
      console.error('❌ 데이터 정리 실패:', error);
      throw error;
    }
  }

  /**
   * 💬 대화 기록 정리
   */
  async cleanupConversationHistory(maxHistory) {
    try {
      const historyPath = path.join(this.dataDir, 'conversation_history.json');
      const data = await fs.readFile(historyPath, 'utf8');
      const history = JSON.parse(data);

      let cleanedCount = 0;
      for (const [userId, conversations] of Object.entries(history)) {
        if (conversations.length > maxHistory) {
          const originalLength = conversations.length;
          history[userId] = conversations.slice(-maxHistory);
          cleanedCount += originalLength - maxHistory;
        }
      }

      await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
      console.log(`💬 대화 기록 정리: ${cleanedCount}개 레코드 제거`);

    } catch (error) {
      console.log('💬 대화 기록 파일 없음');
    }
  }

  /**
   * 📝 오래된 피드백 정리
   */
  async cleanupOldFeedback(maxAge) {
    try {
      const feedbackPath = path.join(this.dataDir, 'feedback_data.json');
      const data = await fs.readFile(feedbackPath, 'utf8');
      const feedback = JSON.parse(data);

      const now = Date.now();
      let cleanedCount = 0;

      for (const [userId, userFeedback] of Object.entries(feedback)) {
        for (const [intent, feedbackData] of Object.entries(userFeedback)) {
          if (now - feedbackData.timestamp > maxAge) {
            delete userFeedback[intent];
            cleanedCount++;
          }
        }
      }

      await fs.writeFile(feedbackPath, JSON.stringify(feedback, null, 2));
      console.log(`📝 피드백 정리: ${cleanedCount}개 레코드 제거`);

    } catch (error) {
      console.log('📝 피드백 파일 없음');
    }
  }

  /**
   * 👤 비활성 사용자 정리
   */
  async cleanupInactiveUsers(threshold) {
    try {
      const historyPath = path.join(this.dataDir, 'conversation_history.json');
      const feedbackPath = path.join(this.dataDir, 'feedback_data.json');
      const patternsPath = path.join(this.dataDir, 'user_patterns.json');

      const now = Date.now();
      let cleanedUsers = 0;

      // 대화 기록에서 비활성 사용자 찾기
      const history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
      const feedback = JSON.parse(await fs.readFile(feedbackPath, 'utf8'));
      const patterns = JSON.parse(await fs.readFile(patternsPath, 'utf8'));

      const inactiveUsers = new Set();

      for (const [userId, conversations] of Object.entries(history)) {
        if (conversations.length > 0) {
          const lastActivity = conversations[conversations.length - 1].timestamp;
          if (now - lastActivity > threshold) {
            inactiveUsers.add(userId);
          }
        }
      }

      // 비활성 사용자 데이터 제거
      for (const userId of inactiveUsers) {
        delete history[userId];
        delete feedback[userId];
        delete patterns[userId];
        cleanedUsers++;
      }

      await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
      await fs.writeFile(feedbackPath, JSON.stringify(feedback, null, 2));
      await fs.writeFile(patternsPath, JSON.stringify(patterns, null, 2));

      console.log(`👤 비활성 사용자 정리: ${cleanedUsers}명 제거`);

    } catch (error) {
      console.log('👤 사용자 데이터 파일 없음');
    }
  }

  /**
   * 📊 학습 데이터 분석 리포트
   */
  async generateReport() {
    try {
      const stats = await this.getLearningStats();
      const backups = await this.listBackups();

      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalSize: stats.totalSize,
          totalUsers: stats.userPatterns.records,
          totalConversations: stats.conversationHistory.records,
          totalFeedback: stats.feedbackData.records,
          backupCount: backups.length
        },
        details: stats,
        backups: backups.slice(0, 5), // 최근 5개만
        recommendations: this.generateRecommendations(stats)
      };

      return report;

    } catch (error) {
      console.error('❌ 리포트 생성 실패:', error);
      return null;
    }
  }

  /**
   * 💡 권장사항 생성
   */
  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.totalSize > 10 * 1024 * 1024) { // 10MB
      recommendations.push('📦 학습 데이터가 큽니다. 정리 작업을 권장합니다.');
    }

    if (stats.backupCount === 0) {
      recommendations.push('💾 백업이 없습니다. 정기적인 백업을 권장합니다.');
    }

    if (stats.totalUsers > 100) {
      recommendations.push('👥 사용자가 많습니다. 비활성 사용자 정리를 권장합니다.');
    }

    return recommendations;
  }

  /**
   * 🧹 메모리 정리 및 자동 저장 중지
   */
  async cleanup() {
    try {
      console.log('🧠 AILearningManager 정리 중...');
      
      // 자동 저장 중지
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = null;
      }
      
      // 마지막 데이터 저장
      await this.saveAllData();
      
      // 메모리 정리
      this.userPatterns.clear();
      this.conversationHistory.clear();
      this.feedbackData.clear();
      this.globalStats = {};
      
      console.log('✅ AILearningManager 정리 완료');
      
    } catch (error) {
      console.error('❌ AILearningManager 정리 실패:', error);
    }
  }
} 