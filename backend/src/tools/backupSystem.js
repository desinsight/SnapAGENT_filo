import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import winston from 'winston';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

export class BackupSystem {
  constructor(options = {}) {
    this.options = {
      backupDir: options.backupDir || '.backups',
      maxBackups: options.maxBackups || 10,
      compressionLevel: options.compressionLevel || 9,
      verifyBackups: options.verifyBackups !== false,
      ...options
    };
    
    this.ensureBackupDir();
  }

  async ensureBackupDir() {
    try {
      await fs.access(this.options.backupDir);
    } catch {
      await fs.mkdir(this.options.backupDir, { recursive: true });
    }
  }

  async createBackup(sourcePath, options = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${path.basename(sourcePath)}_${timestamp}`;
      const backupPath = path.join(this.options.backupDir, backupName);
      
      // 백업 메타데이터
      const metadata = {
        timestamp,
        sourcePath,
        backupPath,
        options: {
          ...this.options,
          ...options
        }
      };
      
      // 파일/디렉토리 백업
      if ((await fs.stat(sourcePath)).isDirectory()) {
        await this.backupDirectory(sourcePath, backupPath, metadata);
      } else {
        await this.backupFile(sourcePath, backupPath, metadata);
      }
      
      // 백업 검증
      if (this.options.verifyBackups) {
        await this.verifyBackup(backupPath);
      }
      
      // 오래된 백업 정리
      await this.cleanupOldBackups();
      
      return {
        success: true,
        backupPath,
        metadata
      };
    } catch (error) {
      logger.error('백업 생성 실패:', error);
      throw error;
    }
  }

  async backupDirectory(sourcePath, backupPath, metadata) {
    try {
      // 디렉토리 압축
      const archivePath = `${backupPath}.tar.gz`;
      await execAsync(`tar -czf "${archivePath}" -C "${path.dirname(sourcePath)}" "${path.basename(sourcePath)}"`);
      
      // 메타데이터 저장
      metadata.archivePath = archivePath;
      await this.saveBackupMetadata(backupPath, metadata);
      
      return {
        success: true,
        archivePath,
        metadata
      };
    } catch (error) {
      logger.error('디렉토리 백업 실패:', error);
      throw error;
    }
  }

  async backupFile(sourcePath, backupPath, metadata) {
    try {
      // 파일 압축
      const archivePath = `${backupPath}.gz`;
      
      await pipeline(
        createReadStream(sourcePath),
        createGzip({ level: this.options.compressionLevel }),
        createWriteStream(archivePath)
      );
      
      // 메타데이터 저장
      metadata.archivePath = archivePath;
      await this.saveBackupMetadata(backupPath, metadata);
      
      return {
        success: true,
        archivePath,
        metadata
      };
    } catch (error) {
      logger.error('파일 백업 실패:', error);
      throw error;
    }
  }

  async saveBackupMetadata(backupPath, metadata) {
    const metadataPath = `${backupPath}.json`;
    await fs.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2)
    );
  }

  async verifyBackup(backupPath) {
    try {
      const metadata = await this.getBackupMetadata(backupPath);
      
      if (metadata.archivePath.endsWith('.tar.gz')) {
        // 디렉토리 백업 검증
        const { stdout } = await execAsync(`tar -tzf "${metadata.archivePath}"`);
        if (!stdout.trim()) {
          throw new Error('백업 아카이브가 비어있습니다.');
        }
      } else {
        // 파일 백업 검증
        const stats = await fs.stat(metadata.archivePath);
        if (stats.size === 0) {
          throw new Error('백업 파일이 비어있습니다.');
        }
      }
      
      return {
        success: true,
        backupPath,
        metadata
      };
    } catch (error) {
      logger.error('백업 검증 실패:', error);
      throw error;
    }
  }

  async restoreBackup(backupPath, targetPath) {
    try {
      const metadata = await this.getBackupMetadata(backupPath);
      
      // 대상 경로가 존재하는 경우 백업
      try {
        await fs.access(targetPath);
        const tempBackup = await this.createBackup(targetPath, {
          isTempBackup: true
        });
        metadata.tempBackup = tempBackup;
      } catch {
        // 대상 경로가 존재하지 않는 경우 무시
      }
      
      // 백업 복원
      if (metadata.archivePath.endsWith('.tar.gz')) {
        // 디렉토리 복원
        await execAsync(`tar -xzf "${metadata.archivePath}" -C "${path.dirname(targetPath)}"`);
      } else {
        // 파일 복원
        await pipeline(
          createReadStream(metadata.archivePath),
          createGzip({ level: this.options.compressionLevel }),
          createWriteStream(targetPath)
        );
      }
      
      return {
        success: true,
        targetPath,
        metadata
      };
    } catch (error) {
      logger.error('백업 복원 실패:', error);
      throw error;
    }
  }

  async getBackupMetadata(backupPath) {
    const metadataPath = `${backupPath}.json`;
    const data = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(data);
  }

  async cleanupOldBackups() {
    try {
      const backups = await this.getAllBackups();
      
      if (backups.length > this.options.maxBackups) {
        const toDelete = backups
          .sort((a, b) => new Date(b.metadata.timestamp) - new Date(a.metadata.timestamp))
          .slice(this.options.maxBackups);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.path);
        }
      }
    } catch (error) {
      logger.error('오래된 백업 정리 실패:', error);
      throw error;
    }
  }

  async getAllBackups() {
    try {
      const backups = [];
      const entries = await fs.readdir(this.options.backupDir);
      
      for (const entry of entries) {
        if (entry.endsWith('.json')) {
          const backupPath = path.join(this.options.backupDir, entry.replace('.json', ''));
          const metadata = await this.getBackupMetadata(backupPath);
          backups.push({
            path: backupPath,
            metadata
          });
        }
      }
      
      return backups;
    } catch (error) {
      logger.error('백업 목록 조회 실패:', error);
      throw error;
    }
  }

  async deleteBackup(backupPath) {
    try {
      const metadata = await this.getBackupMetadata(backupPath);
      
      // 아카이브 파일 삭제
      if (metadata.archivePath) {
        await fs.unlink(metadata.archivePath);
      }
      
      // 메타데이터 파일 삭제
      await fs.unlink(`${backupPath}.json`);
      
      return {
        success: true,
        backupPath
      };
    } catch (error) {
      logger.error('백업 삭제 실패:', error);
      throw error;
    }
  }

  async scheduleBackup(sourcePath, schedule) {
    try {
      const { cron } = schedule;
      
      // 백업 작업 스케줄링
      const job = {
        sourcePath,
        schedule: cron,
        lastRun: null,
        nextRun: this.calculateNextRun(cron)
      };
      
      // 스케줄 저장
      await this.saveSchedule(job);
      
      return {
        success: true,
        job
      };
    } catch (error) {
      logger.error('백업 스케줄링 실패:', error);
      throw error;
    }
  }

  calculateNextRun(cron) {
    // TODO: cron 표현식에 따른 다음 실행 시간 계산
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // 임시로 24시간 후로 설정
  }

  async saveSchedule(job) {
    try {
      const schedules = await this.getSchedules();
      schedules.push(job);
      
      await fs.writeFile(
        'backup_schedules.json',
        JSON.stringify(schedules, null, 2)
      );
    } catch (error) {
      logger.error('스케줄 저장 실패:', error);
      throw error;
    }
  }

  async getSchedules() {
    try {
      const data = await fs.readFile('backup_schedules.json', 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async executeTool(toolName, params = {}) {
    try {
      console.log(`백업 시스템 도구 실행: ${toolName}`, { params });
      
      switch (toolName) {
        case 'createBackup':
        case 'create_backup':
          return await this.createBackup(params.sourcePath, params.options);
        
        case 'restoreBackup':
        case 'restore_backup':
          return await this.restoreBackup(params.backupPath, params.targetPath);
        
        case 'listBackups':
        case 'list_backups':
          return await this.listBackups(params.backupDirectory);
        
        case 'deleteBackup':
        case 'delete_backup':
          return await this.deleteBackup(params.backupPath);
        
        case 'verifyBackup':
        case 'verify_backup':
          return await this.verifyBackup(params.backupPath);
        
        default:
          throw new Error(`알 수 없는 백업 시스템 도구: ${toolName}`);
      }
    } catch (error) {
      console.error(`백업 시스템 도구 실행 실패 (${toolName}):`, error);
      throw error;
    }
  }

  async cleanup() {
    console.log('백업 시스템 도구 정리 완료');
  }
} 