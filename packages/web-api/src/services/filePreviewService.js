import { promises as fs } from 'fs';
import path from 'path';
import { callClaude } from './claudeService.js';

class FilePreviewService {
  constructor() {
    this.supportedTextExtensions = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml', '.csv', '.log'];
    this.supportedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    this.supportedDocumentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    this.supportedAudioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg'];
    this.supportedVideoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv'];
  }

  async getFilePreview(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath);
      
      const preview = {
        fileName,
        filePath,
        size: stats.size,
        modifiedDate: stats.mtime,
        createdDate: stats.birthtime,
        extension: ext,
        type: this.getFileType(ext),
        preview: null,
        aiSummary: null,
        metadata: {}
      };

      // 파일 타입별 미리보기 생성
      if (this.supportedTextExtensions.includes(ext)) {
        preview.preview = await this.getTextPreview(filePath);
        preview.aiSummary = await this.getTextAISummary(filePath, preview.preview);
      } else if (this.supportedImageExtensions.includes(ext)) {
        preview.preview = await this.getImagePreview(filePath);
        preview.aiSummary = await this.getImageAISummary(filePath);
      } else if (this.supportedDocumentExtensions.includes(ext)) {
        preview.preview = await this.getDocumentPreview(filePath);
        preview.aiSummary = await this.getDocumentAISummary(filePath);
      } else if (this.supportedAudioExtensions.includes(ext)) {
        preview.preview = await this.getAudioPreview(filePath);
        preview.aiSummary = await this.getAudioAISummary(filePath);
      } else if (this.supportedVideoExtensions.includes(ext)) {
        preview.preview = await this.getVideoPreview(filePath);
        preview.aiSummary = await this.getVideoAISummary(filePath);
      } else {
        preview.preview = await this.getBinaryPreview(filePath);
        preview.aiSummary = await this.getBinaryAISummary(filePath);
      }

      // 메타데이터 추출
      preview.metadata = await this.extractMetadata(filePath, stats);

      return preview;
    } catch (error) {
      throw new Error(`파일 미리보기 생성 실패: ${error.message}`);
    }
  }

  getFileType(extension) {
    if (this.supportedTextExtensions.includes(extension)) return 'text';
    if (this.supportedImageExtensions.includes(extension)) return 'image';
    if (this.supportedDocumentExtensions.includes(extension)) return 'document';
    if (this.supportedAudioExtensions.includes(extension)) return 'audio';
    if (this.supportedVideoExtensions.includes(extension)) return 'video';
    return 'binary';
  }

  async getTextPreview(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const previewLines = lines.slice(0, 50); // 처음 50줄만
      
      return {
        type: 'text',
        content: previewLines.join('\n'),
        totalLines: lines.length,
        totalCharacters: content.length,
        encoding: 'utf-8',
        hasMore: lines.length > 50
      };
    } catch (error) {
      return { type: 'text', error: '텍스트 읽기 실패', content: '' };
    }
  }

  async getImagePreview(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        type: 'image',
        size: stats.size,
        dimensions: '이미지 분석 필요', // 실제로는 sharp 라이브러리로 분석 가능
        format: path.extname(filePath).substring(1).toUpperCase(),
        previewUrl: `/api/preview/image/${encodeURIComponent(filePath)}`
      };
    } catch (error) {
      return { type: 'image', error: '이미지 분석 실패' };
    }
  }

  async getDocumentPreview(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        type: 'document',
        size: stats.size,
        format: path.extname(filePath).substring(1).toUpperCase(),
        pages: '문서 분석 필요', // 실제로는 pdf-lib 등으로 분석 가능
        previewUrl: `/api/preview/document/${encodeURIComponent(filePath)}`
      };
    } catch (error) {
      return { type: 'document', error: '문서 분석 실패' };
    }
  }

  async getAudioPreview(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        type: 'audio',
        size: stats.size,
        format: path.extname(filePath).substring(1).toUpperCase(),
        duration: '오디오 분석 필요', // 실제로는 ffmpeg 등으로 분석 가능
        previewUrl: `/api/preview/audio/${encodeURIComponent(filePath)}`
      };
    } catch (error) {
      return { type: 'audio', error: '오디오 분석 실패' };
    }
  }

  async getVideoPreview(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        type: 'video',
        size: stats.size,
        format: path.extname(filePath).substring(1).toUpperCase(),
        duration: '비디오 분석 필요', // 실제로는 ffmpeg 등으로 분석 가능
        resolution: '비디오 분석 필요',
        previewUrl: `/api/preview/video/${encodeURIComponent(filePath)}`
      };
    } catch (error) {
      return { type: 'video', error: '비디오 분석 실패' };
    }
  }

  async getBinaryPreview(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);
      const hexPreview = buffer.slice(0, 256).toString('hex');
      
      return {
        type: 'binary',
        size: stats.size,
        hexPreview: hexPreview,
        isExecutable: this.isExecutable(filePath),
        fileSignature: this.getFileSignature(buffer)
      };
    } catch (error) {
      return { type: 'binary', error: '바이너리 분석 실패' };
    }
  }

  isExecutable(filePath) {
    const executableExtensions = ['.exe', '.bat', '.cmd', '.com', '.msi', '.app', '.sh', '.py', '.js'];
    return executableExtensions.includes(path.extname(filePath).toLowerCase());
  }

  getFileSignature(buffer) {
    const signatures = {
      '89504E47': 'PNG',
      '47494638': 'GIF',
      'FFD8FF': 'JPEG',
      '25504446': 'PDF',
      '504B0304': 'ZIP/DOCX/XLSX',
      '7F454C46': 'ELF',
      '4D5A9000': 'EXE'
    };

    const hex = buffer.slice(0, 8).toString('hex').toUpperCase();
    for (const [sig, type] of Object.entries(signatures)) {
      if (hex.startsWith(sig)) return type;
    }
    return 'Unknown';
  }

  async extractMetadata(filePath, stats) {
    const metadata = {
      fileName: path.basename(filePath),
      filePath: filePath,
      size: stats.size,
      sizeFormatted: this.formatFileSize(stats.size),
      modifiedDate: stats.mtime,
      createdDate: stats.birthtime,
      isDirectory: stats.isDirectory(),
      permissions: stats.mode.toString(8),
      extension: path.extname(filePath),
      nameWithoutExt: path.basename(filePath, path.extname(filePath))
    };

    // 파일 크기별 카테고리
    if (stats.size < 1024) metadata.sizeCategory = 'tiny';
    else if (stats.size < 1024 * 1024) metadata.sizeCategory = 'small';
    else if (stats.size < 10 * 1024 * 1024) metadata.sizeCategory = 'medium';
    else if (stats.size < 100 * 1024 * 1024) metadata.sizeCategory = 'large';
    else metadata.sizeCategory = 'huge';

    // 수정일 기준 카테고리
    const now = new Date();
    const modifiedDays = Math.floor((now - stats.mtime) / (1000 * 60 * 60 * 24));
    if (modifiedDays < 1) metadata.ageCategory = 'today';
    else if (modifiedDays < 7) metadata.ageCategory = 'recent';
    else if (modifiedDays < 30) metadata.ageCategory = 'month';
    else if (modifiedDays < 365) metadata.ageCategory = 'year';
    else metadata.ageCategory = 'old';

    return metadata;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // AI 분석 메서드들
  async getTextAISummary(filePath, preview) {
    try {
      const prompt = `다음 텍스트 파일의 내용을 분석하고 요약해주세요:

파일명: ${path.basename(filePath)}
내용 미리보기:
${preview.content}

다음 형식으로 분석해주세요:
1. 파일 유형 (코드, 문서, 로그 등)
2. 주요 내용 요약 (3-4줄)
3. 주요 키워드 (5-10개)
4. 파일의 목적/용도
5. 중요도 평가 (1-5점)

친근하고 간결하게 답변해주세요.`;

      const response = await callClaude(prompt);
      return response;
    } catch (error) {
      return 'AI 분석을 수행할 수 없습니다.';
    }
  }

  async getImageAISummary(filePath) {
    try {
      const prompt = `이미지 파일을 분석해주세요:

파일명: ${path.basename(filePath)}
파일 경로: ${filePath}

이미지 파일의 특성을 분석해주세요:
1. 이미지 유형 (사진, 일러스트, 스크린샷 등)
2. 추정 내용 (인물, 풍경, 문서 등)
3. 파일 크기 및 형식 특성
4. 용도 추정 (개인용, 업무용, 아카이브 등)

친근하고 간결하게 답변해주세요.`;

      const response = await callClaude(prompt);
      return response;
    } catch (error) {
      return 'AI 분석을 수행할 수 없습니다.';
    }
  }

  async getDocumentAISummary(filePath) {
    try {
      const prompt = `문서 파일을 분석해주세요:

파일명: ${path.basename(filePath)}
파일 경로: ${filePath}

문서 파일의 특성을 분석해주세요:
1. 문서 유형 (보고서, 계약서, 프레젠테이션 등)
2. 추정 내용 및 목적
3. 파일 크기 및 복잡도
4. 중요도 평가 (1-5점)

친근하고 간결하게 답변해주세요.`;

      const response = await callClaude(prompt);
      return response;
    } catch (error) {
      return 'AI 분석을 수행할 수 없습니다.';
    }
  }

  async getAudioAISummary(filePath) {
    try {
      const prompt = `오디오 파일을 분석해주세요:

파일명: ${path.basename(filePath)}
파일 경로: ${filePath}

오디오 파일의 특성을 분석해주세요:
1. 오디오 유형 (음악, 음성, 효과음 등)
2. 추정 내용 및 용도
3. 파일 크기 및 품질 추정
4. 중요도 평가 (1-5점)

친근하고 간결하게 답변해주세요.`;

      const response = await callClaude(prompt);
      return response;
    } catch (error) {
      return 'AI 분석을 수행할 수 없습니다.';
    }
  }

  async getVideoAISummary(filePath) {
    try {
      const prompt = `비디오 파일을 분석해주세요:

파일명: ${path.basename(filePath)}
파일 경로: ${filePath}

비디오 파일의 특성을 분석해주세요:
1. 비디오 유형 (영화, 강의, 게임 녹화 등)
2. 추정 내용 및 용도
3. 파일 크기 및 품질 추정
4. 중요도 평가 (1-5점)

친근하고 간결하게 답변해주세요.`;

      const response = await callClaude(prompt);
      return response;
    } catch (error) {
      return 'AI 분석을 수행할 수 없습니다.';
    }
  }

  async getBinaryAISummary(filePath) {
    try {
      const prompt = `바이너리 파일을 분석해주세요:

파일명: ${path.basename(filePath)}
파일 경로: ${filePath}

바이너리 파일의 특성을 분석해주세요:
1. 파일 유형 (실행파일, 라이브러리, 데이터 등)
2. 추정 용도 및 위험도
3. 파일 크기 및 복잡도
4. 보안 주의사항

친근하고 간결하게 답변해주세요.`;

      const response = await callClaude(prompt);
      return response;
    } catch (error) {
      return 'AI 분석을 수행할 수 없습니다.';
    }
  }
}

export default new FilePreviewService(); 