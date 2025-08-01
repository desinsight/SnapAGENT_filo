import fs from 'fs/promises';
import path from 'path';
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

export class FilePreviewTools {
  async getPreview(filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const stats = await fs.stat(filePath);

      // 파일 크기 제한 (10MB)
      if (stats.size > 10 * 1024 * 1024) {
        throw new Error('파일이 너무 큽니다.');
      }

      switch (ext) {
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
          return this.getImagePreview(filePath);
        case '.txt':
        case '.md':
        case '.json':
        case '.js':
        case '.css':
        case '.html':
          return this.getTextPreview(filePath);
        case '.pdf':
          return this.getPdfPreview(filePath);
        case '.mp4':
        case '.avi':
        case '.mov':
          return this.getVideoPreview(filePath);
        case '.mp3':
        case '.wav':
          return this.getAudioPreview(filePath);
        default:
          throw new Error('지원하지 않는 파일 형식입니다.');
      }
    } catch (error) {
      logger.error('파일 미리보기 실패:', error);
      throw error;
    }
  }

  async getImagePreview(filePath) {
    const buffer = await fs.readFile(filePath);
    const base64 = buffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase().substring(1);
    return {
      type: 'image',
      data: `data:image/${ext};base64,${base64}`
    };
  }

  async getTextPreview(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return {
      type: 'text',
      data: content
    };
  }

  async getPdfPreview(filePath) {
    // PDF 미리보기는 클라이언트에서 직접 처리
    return {
      type: 'pdf',
      data: `http://localhost:3000/api/files/${encodeURIComponent(filePath)}`
    };
  }

  async getVideoPreview(filePath) {
    // 비디오 미리보기는 클라이언트에서 직접 처리
    return {
      type: 'video',
      data: `http://localhost:3000/api/files/${encodeURIComponent(filePath)}`
    };
  }

  async getAudioPreview(filePath) {
    // 오디오 미리보기는 클라이언트에서 직접 처리
    return {
      type: 'audio',
      data: `http://localhost:3000/api/files/${encodeURIComponent(filePath)}`
    };
  }

  async executeTool(toolName, params = {}) {
    try {
      console.log(`파일 미리보기 도구 실행: ${toolName}`, { params });
      
      switch (toolName) {
        case 'generatePreview':
        case 'generate_preview':
          return await this.generatePreview(params.filePath, params.options);
        
        case 'getPreviewInfo':
        case 'get_preview_info':
          return await this.getPreviewInfo(params.filePath);
        
        case 'createThumbnail':
        case 'create_thumbnail':
          return await this.createThumbnail(params.filePath, params.size);
        
        case 'extractText':
        case 'extract_text':
          return await this.extractTextFromFile(params.filePath);
        
        case 'getMetadata':
        case 'get_metadata':
          return await this.getMetadata(params.filePath);
        
        case 'batchPreview':
        case 'batch_preview':
          return await this.batchPreview(params.fileList, params.options);
        
        default:
          throw new Error(`알 수 없는 파일 미리보기 도구: ${toolName}`);
      }
    } catch (error) {
      console.error(`파일 미리보기 도구 실행 실패 (${toolName}):`, error);
      throw error;
    }
  }

  async extractTextFromFile(filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.pdf') {
        // PDF는 PDFAnalyzer 사용
        const { PDFAnalyzer } = await import('../../../ai/services/filesystem/PDFAnalyzer.js');
        const analyzer = new PDFAnalyzer();
        const result = await analyzer.extractText(filePath);
        return result;
      } else {
        // 일반 텍스트 파일
        const content = await fs.readFile(filePath, 'utf8');
        return {
          text: content,
          type: 'text',
          method: 'file-read'
        };
      }
    } catch (error) {
      logger.error('텍스트 추출 실패:', error);
      throw error;
    }
  }

  async cleanup() {
    console.log('파일 미리보기 도구 정리 완료');
  }
} 