const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { createClient } = require('redis');
const crypto = require('crypto');

class FileService {
  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    // 업로드 디렉토리 설정
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB
    this.allowedFileTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif'
    ];

    this.initializeUploadDirectory();
  }

  /**
   * 업로드 디렉토리 초기화
   */
  async initializeUploadDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info(`업로드 디렉토리 초기화됨: ${this.uploadDir}`);
    } catch (error) {
      logger.error('업로드 디렉토리 초기화 실패:', error);
    }
  }

  /**
   * Multer 설정
   */
  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const uploadPath = path.join(this.uploadDir, String(year), month, day);
        
        try {
          await fs.mkdir(uploadPath, { recursive: true });
          cb(null, uploadPath);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req, file, cb) => {
      const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
      
      if (this.allowedFileTypes.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error(`지원하지 않는 파일 형식입니다: ${fileExtension}`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: parseInt(process.env.MAX_FILES_PER_REQUEST) || 10
      }
    });
  }

  /**
   * 파일 업로드 처리
   */
  async uploadFile(file, userId, documentId = null) {
    try {
      // 파일 정보 검증
      if (!file) {
        throw new Error('업로드된 파일이 없습니다.');
      }

      // 파일 크기 검증
      if (file.size > this.maxFileSize) {
        throw new Error(`파일 크기가 제한을 초과했습니다. (최대: ${this.maxFileSize / 1024 / 1024}MB)`);
      }

      // 파일 해시 계산
      const fileHash = await this.calculateFileHash(file.path);

      // 바이러스 검사 (실제 구현에서는 외부 서비스 사용)
      const isSafe = await this.scanForVirus(file.path);
      if (!isSafe) {
        await this.deleteFile(file.path);
        throw new Error('보안 검사를 통과하지 못했습니다.');
      }

      // 파일 메타데이터 생성
      const fileMetadata = {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        extension: path.extname(file.originalname).toLowerCase(),
        hash: fileHash,
        uploadedBy: userId,
        uploadedAt: new Date(),
        documentId: documentId,
        isSafe: true
      };

      // Redis에 파일 메타데이터 저장
      await this.saveFileMetadata(fileMetadata);

      logger.info(`파일 업로드 완료: ${file.originalname} by user: ${userId}`);
      return fileMetadata;
    } catch (error) {
      logger.error('파일 업로드 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 다운로드 처리
   */
  async downloadFile(fileId, userId) {
    try {
      // 파일 메타데이터 조회
      const fileMetadata = await this.getFileMetadata(fileId);
      if (!fileMetadata) {
        throw new Error('파일을 찾을 수 없습니다.');
      }

      // 권한 검증
      const hasAccess = await this.checkFileAccess(fileMetadata, userId);
      if (!hasAccess) {
        throw new Error('파일에 접근할 권한이 없습니다.');
      }

      // 파일 존재 확인
      const fileExists = await this.fileExists(fileMetadata.path);
      if (!fileExists) {
        throw new Error('파일이 서버에 존재하지 않습니다.');
      }

      // 다운로드 통계 업데이트
      await this.updateDownloadStats(fileId, userId);

      logger.info(`파일 다운로드: ${fileMetadata.originalName} by user: ${userId}`);
      return fileMetadata;
    } catch (error) {
      logger.error('파일 다운로드 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 삭제 처리
   */
  async deleteFile(fileId, userId) {
    try {
      // 파일 메타데이터 조회
      const fileMetadata = await this.getFileMetadata(fileId);
      if (!fileMetadata) {
        throw new Error('파일을 찾을 수 없습니다.');
      }

      // 권한 검증
      const hasDeleteAccess = await this.checkDeleteAccess(fileMetadata, userId);
      if (!hasDeleteAccess) {
        throw new Error('파일을 삭제할 권한이 없습니다.');
      }

      // 실제 파일 삭제
      await this.deletePhysicalFile(fileMetadata.path);

      // 메타데이터 삭제
      await this.removeFileMetadata(fileId);

      logger.info(`파일 삭제됨: ${fileMetadata.originalName} by user: ${userId}`);
      return { success: true, message: '파일이 삭제되었습니다.' };
    } catch (error) {
      logger.error('파일 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 목록 조회
   */
  async getFiles(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'uploadedAt',
        sortOrder = 'desc',
        documentId,
        uploadedBy,
        fileType
      } = options;

      // Redis에서 파일 메타데이터 조회 (실제로는 데이터베이스 사용 권장)
      const allFiles = await this.getAllFileMetadata();
      
      let filteredFiles = allFiles;

      // 필터 적용
      if (documentId) {
        filteredFiles = filteredFiles.filter(file => file.documentId === documentId);
      }
      if (uploadedBy) {
        filteredFiles = filteredFiles.filter(file => file.uploadedBy === uploadedBy);
      }
      if (fileType) {
        filteredFiles = filteredFiles.filter(file => file.extension === fileType);
      }

      // 정렬
      filteredFiles.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

      // 페이징
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

      return {
        files: paginatedFiles,
        pagination: {
          page,
          limit,
          total: filteredFiles.length,
          pages: Math.ceil(filteredFiles.length / limit)
        }
      };
    } catch (error) {
      logger.error('파일 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 해시 계산
   */
  async calculateFileHash(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      return hash.digest('hex');
    } catch (error) {
      logger.error('파일 해시 계산 실패:', error);
      throw error;
    }
  }

  /**
   * 바이러스 검사 (모의 구현)
   */
  async scanForVirus(filePath) {
    try {
      // 실제 구현에서는 ClamAV, VirusTotal API 등을 사용
      // 여기서는 모의 검사로 항상 안전하다고 가정
      await new Promise(resolve => setTimeout(resolve, 100)); // 검사 시간 시뮬레이션
      
      // 파일 크기가 0이면 의심스러움
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('바이러스 검사 실패:', error);
      return false;
    }
  }

  /**
   * 파일 존재 확인
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 실제 파일 삭제
   */
  async deletePhysicalFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`실제 파일 삭제됨: ${filePath}`);
    } catch (error) {
      logger.error('실제 파일 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 접근 권한 확인
   */
  async checkFileAccess(fileMetadata, userId) {
    // 파일 업로더 확인
    if (fileMetadata.uploadedBy === userId) {
      return true;
    }

    // 문서 소유자 확인 (문서에 첨부된 파일인 경우)
    if (fileMetadata.documentId) {
      // Document 모델을 사용하여 문서 권한 확인
      // const document = await Document.findById(fileMetadata.documentId);
      // if (document && document.createdBy.toString() === userId) {
      //   return true;
      // }
    }

    return false;
  }

  /**
   * 파일 삭제 권한 확인
   */
  async checkDeleteAccess(fileMetadata, userId) {
    // 파일 업로더만 삭제 가능
    return fileMetadata.uploadedBy === userId;
  }

  /**
   * Redis에 파일 메타데이터 저장
   */
  async saveFileMetadata(fileMetadata) {
    try {
      const fileId = uuidv4();
      await this.redis.setex(
        `file:${fileId}`,
        86400 * 30, // 30일 캐시
        JSON.stringify({ ...fileMetadata, id: fileId })
      );
      return fileId;
    } catch (error) {
      logger.error('파일 메타데이터 저장 실패:', error);
      throw error;
    }
  }

  /**
   * Redis에서 파일 메타데이터 조회
   */
  async getFileMetadata(fileId) {
    try {
      const metadata = await this.redis.get(`file:${fileId}`);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      logger.error('파일 메타데이터 조회 실패:', error);
      return null;
    }
  }

  /**
   * 모든 파일 메타데이터 조회
   */
  async getAllFileMetadata() {
    try {
      const keys = await this.redis.keys('file:*');
      const files = [];
      
      for (const key of keys) {
        const metadata = await this.redis.get(key);
        if (metadata) {
          files.push(JSON.parse(metadata));
        }
      }
      
      return files;
    } catch (error) {
      logger.error('모든 파일 메타데이터 조회 실패:', error);
      return [];
    }
  }

  /**
   * Redis에서 파일 메타데이터 삭제
   */
  async removeFileMetadata(fileId) {
    try {
      await this.redis.del(`file:${fileId}`);
    } catch (error) {
      logger.error('파일 메타데이터 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 다운로드 통계 업데이트
   */
  async updateDownloadStats(fileId, userId) {
    try {
      const downloadKey = `download:${fileId}`;
      await this.redis.incr(downloadKey);
      await this.redis.expire(downloadKey, 86400 * 365); // 1년간 보관
      
      // 다운로드 히스토리 저장
      const historyKey = `download_history:${fileId}`;
      const downloadRecord = {
        userId,
        downloadedAt: new Date().toISOString()
      };
      
      await this.redis.lpush(historyKey, JSON.stringify(downloadRecord));
      await this.redis.ltrim(historyKey, 0, 999); // 최근 1000개만 유지
      await this.redis.expire(historyKey, 86400 * 365);
    } catch (error) {
      logger.error('다운로드 통계 업데이트 실패:', error);
    }
  }

  /**
   * 파일 크기 제한 확인
   */
  checkFileSize(fileSize) {
    return fileSize <= this.maxFileSize;
  }

  /**
   * 허용된 파일 타입 확인
   */
  isAllowedFileType(fileExtension) {
    return this.allowedFileTypes.includes(fileExtension.toLowerCase());
  }

  /**
   * 업로드 디렉토리 정리 (오래된 파일 삭제)
   */
  async cleanupOldFiles(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const allFiles = await this.getAllFileMetadata();
      const filesToDelete = allFiles.filter(file => {
        const fileDate = new Date(file.uploadedAt);
        return fileDate < cutoffDate;
      });

      for (const file of filesToDelete) {
        try {
          await this.deletePhysicalFile(file.path);
          await this.removeFileMetadata(file.id);
          logger.info(`오래된 파일 정리됨: ${file.originalName}`);
        } catch (error) {
          logger.error(`오래된 파일 정리 실패: ${file.originalName}`, error);
        }
      }

      logger.info(`파일 정리 완료: ${filesToDelete.length}개 파일 삭제됨`);
    } catch (error) {
      logger.error('파일 정리 실패:', error);
    }
  }
}

module.exports = new FileService(); 