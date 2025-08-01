import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import winston from 'winston';

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

export class VersionControl {
  constructor(baseDir = '.versions') {
    this.baseDir = baseDir;
    this.ensureVersionDir();
  }

  async ensureVersionDir() {
    try {
      await fs.access(this.baseDir);
    } catch {
      await fs.mkdir(this.baseDir, { recursive: true });
    }
  }

  async createVersion(filePath, metadata = {}) {
    try {
      const fileContent = await fs.readFile(filePath);
      const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
      const versionDir = path.join(this.baseDir, fileHash);
      
      // 버전 디렉토리 생성
      await fs.mkdir(versionDir, { recursive: true });
      
      // 파일 복사
      const versionPath = path.join(versionDir, path.basename(filePath));
      await fs.copyFile(filePath, versionPath);
      
      // 메타데이터 저장
      const versionInfo = {
        timestamp: new Date().toISOString(),
        originalPath: filePath,
        hash: fileHash,
        size: fileContent.length,
        metadata: {
          ...metadata,
          comment: metadata.comment || '자동 버전 생성'
        }
      };
      
      await fs.writeFile(
        path.join(versionDir, 'version.json'),
        JSON.stringify(versionInfo, null, 2)
      );
      
      return versionInfo;
    } catch (error) {
      logger.error('버전 생성 실패:', error);
      throw error;
    }
  }

  async getVersionHistory(filePath) {
    try {
      const versions = [];
      const versionDirs = await fs.readdir(this.baseDir);
      
      for (const dir of versionDirs) {
        const versionDir = path.join(this.baseDir, dir);
        const versionInfoPath = path.join(versionDir, 'version.json');
        
        try {
          const versionInfo = JSON.parse(
            await fs.readFile(versionInfoPath, 'utf8')
          );
          
          if (versionInfo.originalPath === filePath) {
            versions.push(versionInfo);
          }
        } catch (e) {
          // 버전 정보 파일이 없거나 손상된 경우 무시
          continue;
        }
      }
      
      return versions.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
    } catch (error) {
      logger.error('버전 히스토리 조회 실패:', error);
      throw error;
    }
  }

  async restoreVersion(versionHash) {
    try {
      const versionDir = path.join(this.baseDir, versionHash);
      const versionInfo = JSON.parse(
        await fs.readFile(path.join(versionDir, 'version.json'), 'utf8')
      );
      
      const versionFile = path.join(
        versionDir,
        path.basename(versionInfo.originalPath)
      );
      
      // 현재 파일 백업
      const backupPath = `${versionInfo.originalPath}.bak`;
      await fs.copyFile(versionInfo.originalPath, backupPath);
      
      // 버전 복원
      await fs.copyFile(versionFile, versionInfo.originalPath);
      
      return {
        ...versionInfo,
        backupPath
      };
    } catch (error) {
      logger.error('버전 복원 실패:', error);
      throw error;
    }
  }

  async compareVersions(versionHash1, versionHash2) {
    try {
      const [version1, version2] = await Promise.all([
        this.getVersionContent(versionHash1),
        this.getVersionContent(versionHash2)
      ]);
      
      return {
        version1: {
          hash: versionHash1,
          content: version1
        },
        version2: {
          hash: versionHash2,
          content: version2
        },
        differences: this.findDifferences(version1, version2)
      };
    } catch (error) {
      logger.error('버전 비교 실패:', error);
      throw error;
    }
  }

  async getVersionContent(versionHash) {
    const versionDir = path.join(this.baseDir, versionHash);
    const versionInfo = JSON.parse(
      await fs.readFile(path.join(versionDir, 'version.json'), 'utf8')
    );
    
    const versionFile = path.join(
      versionDir,
      path.basename(versionInfo.originalPath)
    );
    
    return fs.readFile(versionFile, 'utf8');
  }

  findDifferences(content1, content2) {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const differences = [];
    
    const maxLength = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (lines1[i] !== lines2[i]) {
        differences.push({
          line: i + 1,
          version1: lines1[i] || '',
          version2: lines2[i] || ''
        });
      }
    }
    
    return differences;
  }

  async addVersionTag(versionHash, tag) {
    try {
      const versionDir = path.join(this.baseDir, versionHash);
      const versionInfoPath = path.join(versionDir, 'version.json');
      
      const versionInfo = JSON.parse(
        await fs.readFile(versionInfoPath, 'utf8')
      );
      
      versionInfo.metadata.tags = versionInfo.metadata.tags || [];
      if (!versionInfo.metadata.tags.includes(tag)) {
        versionInfo.metadata.tags.push(tag);
      }
      
      await fs.writeFile(
        versionInfoPath,
        JSON.stringify(versionInfo, null, 2)
      );
      
      return versionInfo;
    } catch (error) {
      logger.error('버전 태그 추가 실패:', error);
      throw error;
    }
  }

  async executeTool(toolName, params = {}) {
    try {
      console.log(`버전 관리 도구 실행: ${toolName}`, { params });
      
      switch (toolName) {
        case 'checkVersion':
        case 'check_version':
          return await this.checkVersion(params.filePath);
        
        case 'createVersion':
        case 'create_version':
          return await this.createVersion(params.filePath, params.message);
        
        case 'restoreVersion':
        case 'restore_version':
          return await this.restoreVersion(params.filePath, params.versionId);
        
        case 'listVersions':
        case 'list_versions':
          return await this.listVersions(params.filePath);
        
        case 'compareVersions':
        case 'compare_versions':
          return await this.compareVersions(params.filePath, params.version1, params.version2);
        
        case 'deleteVersion':
        case 'delete_version':
          return await this.deleteVersion(params.filePath, params.versionId);
        
        case 'getVersionHistory':
        case 'get_version_history':
          return await this.getVersionHistory(params.filePath);
        
        default:
          throw new Error(`알 수 없는 버전 관리 도구: ${toolName}`);
      }
    } catch (error) {
      console.error(`버전 관리 도구 실행 실패 (${toolName}):`, error);
      throw error;
    }
  }

  async cleanup() {
    console.log('버전 관리 도구 정리 완료');
  }
} 