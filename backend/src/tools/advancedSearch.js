import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import winston from 'winston';
// import { createWorker } from 'tesseract.js';
// import { Image } from 'image-js';
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

export class AdvancedSearch {
  constructor(options = {}) {
    this.options = {
      maxFileSize: options.maxFileSize || 100 * 1024 * 1024, // 100MB
      supportedImageFormats: options.supportedImageFormats || ['.jpg', '.jpeg', '.png', '.bmp'],
      supportedAudioFormats: options.supportedAudioFormats || ['.mp3', '.wav', '.ogg'],
      ...options
    };
    
    this.ocrWorker = null;
    this.searchHistory = [];
  }

  async initialize() {
    // OCR 기능은 현재 비활성화 (createWorker 의존성 문제)
    // if (!this.ocrWorker) {
    //   this.ocrWorker = await createWorker('kor');
    // }
    console.log('🔧 AdvancedSearch 초기화 완료 (OCR 비활성화)');
  }

  async cleanup() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }

  async searchFiles(directory, searchOptions) {
    try {
      const {
        text,
        fileType,
        minSize,
        maxSize,
        dateRange,
        contentSearch = false,
        imageSearch = false,
        audioSearch = false,
        ocrSearch = false
      } = searchOptions;

      const results = [];
      const files = await this.getAllFiles(directory);

      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          
          // 파일 크기 필터링
          if (minSize && stats.size < minSize) continue;
          if (maxSize && stats.size > maxSize) continue;
          
          // 날짜 범위 필터링
          if (dateRange) {
            const fileDate = stats.mtime;
            if (dateRange.start && fileDate < dateRange.start) continue;
            if (dateRange.end && fileDate > dateRange.end) continue;
          }
          
          // 파일 타입 필터링
          if (fileType && !file.toLowerCase().endsWith(fileType.toLowerCase())) {
            continue;
          }

          const fileInfo = {
            path: file,
            name: path.basename(file),
            size: stats.size,
            modified: stats.mtime,
            type: path.extname(file).toLowerCase()
          };

          // 텍스트 검색
          if (text) {
            if (await this.searchInFile(file, text, contentSearch)) {
              fileInfo.matchType = 'text';
              results.push(fileInfo);
              continue;
            }
          }

          // 이미지 검색
          if (imageSearch && this.isImageFile(file)) {
            if (await this.searchInImage(file, text)) {
              fileInfo.matchType = 'image';
              results.push(fileInfo);
              continue;
            }
          }

          // OCR 검색
          if (ocrSearch && this.isImageFile(file)) {
            if (await this.searchWithOCR(file, text)) {
              fileInfo.matchType = 'ocr';
              results.push(fileInfo);
              continue;
            }
          }

          // 오디오 검색
          if (audioSearch && this.isAudioFile(file)) {
            if (await this.searchInAudio(file, text)) {
              fileInfo.matchType = 'audio';
              results.push(fileInfo);
              continue;
            }
          }
        } catch (error) {
          logger.error(`파일 검색 실패 (${file}):`, error);
        }
      }

      // 검색 히스토리 저장
      this.addToSearchHistory(searchOptions);

      return {
        success: true,
        results,
        total: results.length,
        searchOptions
      };
    } catch (error) {
      logger.error('고급 검색 실패:', error);
      throw error;
    }
  }

  async searchInFile(filePath, searchTerm, contentSearch) {
    try {
      // 파일 이름 검색
      if (path.basename(filePath).toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }

      // 파일 내용 검색
      if (contentSearch) {
        const content = await fs.readFile(filePath, 'utf8');
        return content.toLowerCase().includes(searchTerm.toLowerCase());
      }

      return false;
    } catch (error) {
      logger.error(`파일 내용 검색 실패 (${filePath}):`, error);
      return false;
    }
  }

  async searchInImage(imagePath, searchTerm) {
    try {
      const image = await Image.load(imagePath);
      
      // 이미지 메타데이터 검색
      const metadata = image.metadata;
      if (JSON.stringify(metadata).toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }

      // 이미지 유사도 검색 (간단한 구현)
      const hash = await this.calculateImageHash(image);
      // TODO: 이미지 유사도 검색 로직 구현

      return false;
    } catch (error) {
      logger.error(`이미지 검색 실패 (${imagePath}):`, error);
      return false;
    }
  }

  async searchWithOCR(imagePath, searchTerm) {
    try {
      // OCR 기능은 현재 비활성화
      console.log(`🔧 OCR 검색 요청됨: ${imagePath} (기능 비활성화)`);
      return false;
    } catch (error) {
      logger.error(`OCR 검색 실패 (${imagePath}):`, error);
      return false;
    }
  }

  async searchInAudio(audioPath, searchTerm) {
    try {
      // 음성 파일을 텍스트로 변환 (예: Whisper API 사용)
      const { stdout } = await execAsync(`whisper "${audioPath}" --language Korean`);
      return stdout.toLowerCase().includes(searchTerm.toLowerCase());
    } catch (error) {
      logger.error(`오디오 검색 실패 (${audioPath}):`, error);
      return false;
    }
  }

  async calculateImageHash(image) {
    // 이미지 해시 계산 (간단한 구현)
    const resized = image.resize({ width: 8, height: 8 });
    const grayscale = resized.grey();
    const pixels = grayscale.data;
    
    let hash = 0;
    for (let i = 0; i < pixels.length; i++) {
      hash = (hash << 1) | (pixels[i] > 128 ? 1 : 0);
    }
    
    return hash.toString(16);
  }

  isImageFile(filePath) {
    return this.options.supportedImageFormats.includes(
      path.extname(filePath).toLowerCase()
    );
  }

  isAudioFile(filePath) {
    return this.options.supportedAudioFormats.includes(
      path.extname(filePath).toLowerCase()
    );
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

  addToSearchHistory(searchOptions) {
    this.searchHistory.push({
      timestamp: new Date().toISOString(),
      ...searchOptions
    });
    
    // 최대 100개의 검색 기록 유지
    if (this.searchHistory.length > 100) {
      this.searchHistory.shift();
    }
  }

  getSearchHistory() {
    return this.searchHistory;
  }

  async saveSearchQuery(name, searchOptions) {
    try {
      const savedQueries = await this.getSavedQueries();
      
      savedQueries.push({
        name,
        ...searchOptions,
        createdAt: new Date().toISOString()
      });
      
      await fs.writeFile(
        'saved_queries.json',
        JSON.stringify(savedQueries, null, 2)
      );
      
      return {
        success: true,
        name,
        searchOptions
      };
    } catch (error) {
      logger.error('검색 쿼리 저장 실패:', error);
      throw error;
    }
  }

  async getSavedQueries() {
    try {
      const data = await fs.readFile('saved_queries.json', 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  // 메인 실행 메서드 - ToolExecutionManager에서 호출
  async executeTool(toolName, params = {}) {
    try {
      logger.info(`고급 검색 도구 실행: ${toolName}`, { params });
      
      switch (toolName) {
        case 'searchFiles':
        case 'search_files':
        case 'search':
          return await this.searchFiles(params.directory || process.cwd(), params);
        
        case 'searchInFile':
        case 'search_in_file':
          const { filePath, searchTerm, contentSearch } = params;
          return await this.searchInFile(filePath, searchTerm, contentSearch);
        
        case 'searchInImage':
        case 'search_in_image':
          const { imagePath, searchTerm: imageSearchTerm } = params;
          return await this.searchInImage(imagePath, imageSearchTerm);
        
        case 'searchWithOCR':
        case 'search_with_ocr':
          const { imagePath: ocrImagePath, searchTerm: ocrSearchTerm } = params;
          return await this.searchWithOCR(ocrImagePath, ocrSearchTerm);
        
        case 'searchInAudio':
        case 'search_in_audio':
          const { audioPath, searchTerm: audioSearchTerm } = params;
          return await this.searchInAudio(audioPath, audioSearchTerm);
        
        case 'getSearchHistory':
        case 'get_search_history':
          return this.getSearchHistory();
        
        case 'saveSearchQuery':
        case 'save_search_query':
          const { name, searchOptions } = params;
          return await this.saveSearchQuery(name, searchOptions);
        
        case 'getSavedQueries':
        case 'get_saved_queries':
          return await this.getSavedQueries();
        
        case 'calculateImageHash':
        case 'calculate_image_hash':
          const { imagePath: hashImagePath } = params;
          const { Image } = await import('image-js');
          const image = await Image.load(hashImagePath);
          return await this.calculateImageHash(image);
        
        default:
          throw new Error(`알 수 없는 고급 검색 도구: ${toolName}`);
      }
    } catch (error) {
      logger.error(`고급 검색 도구 실행 실패 (${toolName}):`, error);
      throw error;
    }
  }
} 