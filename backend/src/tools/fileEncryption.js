import fs from 'fs/promises';
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

export class FileEncryption {
  constructor(options = {}) {
    this.options = {
      algorithm: options.algorithm || 'aes-256-gcm',
      keyLength: options.keyLength || 32,
      ivLength: options.ivLength || 16,
      saltLength: options.saltLength || 64,
      iterations: options.iterations || 100000,
      ...options
    };
  }

  async encryptFile(filePath, password) {
    try {
      // 파일 읽기
      const fileContent = await fs.readFile(filePath);
      
      // 암호화 키 생성
      const salt = crypto.randomBytes(this.options.saltLength);
      const key = await this.deriveKey(password, salt);
      
      // IV 생성
      const iv = crypto.randomBytes(this.options.ivLength);
      
      // 암호화
      const cipher = crypto.createCipheriv(
        this.options.algorithm,
        key,
        iv
      );
      
      const encryptedContent = Buffer.concat([
        cipher.update(fileContent),
        cipher.final()
      ]);
      
      // 인증 태그
      const authTag = cipher.getAuthTag();
      
      // 암호화된 데이터 구성
      const encryptedData = Buffer.concat([
        salt,
        iv,
        authTag,
        encryptedContent
      ]);
      
      // 암호화된 파일 저장
      const encryptedFilePath = `${filePath}.enc`;
      await fs.writeFile(encryptedFilePath, encryptedData);
      
      return {
        success: true,
        originalPath: filePath,
        encryptedPath: encryptedFilePath,
        metadata: {
          algorithm: this.options.algorithm,
          saltLength: this.options.saltLength,
          ivLength: this.options.ivLength,
          iterations: this.options.iterations
        }
      };
    } catch (error) {
      logger.error('파일 암호화 실패:', error);
      throw error;
    }
  }

  async decryptFile(encryptedFilePath, password) {
    try {
      // 암호화된 파일 읽기
      const encryptedData = await fs.readFile(encryptedFilePath);
      
      // 메타데이터 추출
      const salt = encryptedData.slice(0, this.options.saltLength);
      const iv = encryptedData.slice(
        this.options.saltLength,
        this.options.saltLength + this.options.ivLength
      );
      const authTag = encryptedData.slice(
        this.options.saltLength + this.options.ivLength,
        this.options.saltLength + this.options.ivLength + 16
      );
      const encryptedContent = encryptedData.slice(
        this.options.saltLength + this.options.ivLength + 16
      );
      
      // 키 생성
      const key = await this.deriveKey(password, salt);
      
      // 복호화
      const decipher = crypto.createDecipheriv(
        this.options.algorithm,
        key,
        iv
      );
      
      decipher.setAuthTag(authTag);
      
      const decryptedContent = Buffer.concat([
        decipher.update(encryptedContent),
        decipher.final()
      ]);
      
      // 복호화된 파일 저장
      const decryptedFilePath = encryptedFilePath.replace('.enc', '');
      await fs.writeFile(decryptedFilePath, decryptedContent);
      
      return {
        success: true,
        encryptedPath: encryptedFilePath,
        decryptedPath: decryptedFilePath
      };
    } catch (error) {
      logger.error('파일 복호화 실패:', error);
      throw error;
    }
  }

  async deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        this.options.iterations,
        this.options.keyLength,
        'sha512',
        (err, key) => {
          if (err) reject(err);
          else resolve(key);
        }
      );
    });
  }

  async encryptDirectory(directoryPath, password) {
    try {
      const files = await this.getAllFiles(directoryPath);
      const results = [];
      
      for (const file of files) {
        try {
          const result = await this.encryptFile(file, password);
          results.push(result);
        } catch (error) {
          logger.error(`파일 암호화 실패 (${file}):`, error);
          results.push({
            success: false,
            file,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        directory: directoryPath,
        results
      };
    } catch (error) {
      logger.error('디렉토리 암호화 실패:', error);
      throw error;
    }
  }

  async decryptDirectory(directoryPath, password) {
    try {
      const files = await this.getAllFiles(directoryPath);
      const results = [];
      
      for (const file of files) {
        if (file.endsWith('.enc')) {
          try {
            const result = await this.decryptFile(file, password);
            results.push(result);
          } catch (error) {
            logger.error(`파일 복호화 실패 (${file}):`, error);
            results.push({
              success: false,
              file,
              error: error.message
            });
          }
        }
      }
      
      return {
        success: true,
        directory: directoryPath,
        results
      };
    } catch (error) {
      logger.error('디렉토리 복호화 실패:', error);
      throw error;
    }
  }

  async getAllFiles(directory) {
    const files = [];
    
    async function scan(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }
    
    await scan(directory);
    return files;
  }

  async searchEncryptedFiles(directory, searchTerm) {
    try {
      const files = await this.getAllFiles(directory);
      const results = [];
      
      for (const file of files) {
        if (file.endsWith('.enc')) {
          try {
            // 파일 이름에서 검색
            if (file.toLowerCase().includes(searchTerm.toLowerCase())) {
              results.push({
                file,
                matchType: 'filename'
              });
              continue;
            }
            
            // 파일 내용에서 검색 (복호화 후)
            const tempPassword = 'temp'; // 임시 비밀번호
            const decryptedContent = await this.decryptFile(file, tempPassword);
            
            if (decryptedContent.toString().toLowerCase().includes(searchTerm.toLowerCase())) {
              results.push({
                file,
                matchType: 'content'
              });
            }
            
            // 임시 파일 삭제
            await fs.unlink(decryptedContent.decryptedPath);
          } catch (error) {
            logger.error(`암호화된 파일 검색 실패 (${file}):`, error);
          }
        }
      }
      
      return {
        success: true,
        searchTerm,
        results
      };
    } catch (error) {
      logger.error('암호화된 파일 검색 실패:', error);
      throw error;
    }
  }

  async executeTool(toolName, params = {}) {
    try {
      console.log(`파일 암호화 도구 실행: ${toolName}`, { params });
      
      switch (toolName) {
        case 'encryptFile':
        case 'encrypt_file':
          return await this.encryptFile(params.filePath, params.password, params.options);
        
        case 'decryptFile':
        case 'decrypt_file':
          return await this.decryptFile(params.filePath, params.password, params.options);
        
        case 'encryptDirectory':
        case 'encrypt_directory':
          return await this.encryptDirectory(params.directoryPath, params.password, params.options);
        
        case 'decryptDirectory':
        case 'decrypt_directory':
          return await this.decryptDirectory(params.directoryPath, params.password, params.options);
        
        case 'generateKey':
        case 'generate_key':
          return await this.generateKey(params.keySize);
        
        case 'verifyEncryption':
        case 'verify_encryption':
          return await this.verifyEncryption(params.filePath);
        
        default:
          throw new Error(`알 수 없는 파일 암호화 도구: ${toolName}`);
      }
    } catch (error) {
      console.error(`파일 암호화 도구 실행 실패 (${toolName}):`, error);
      throw error;
    }
  }

  async cleanup() {
    console.log('파일 암호화 도구 정리 완료');
  }
} 