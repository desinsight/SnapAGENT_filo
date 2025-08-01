import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * 파일 내용 인덱싱 및 검색 엔진
 * @class ContentIndexer
 */
export class ContentIndexer {
  constructor() {
    this.index = new Map(); // filePath -> { content, metadata, lastModified }
    this.contentCache = new Map(); // filePath -> content
    this.maxCacheSize = 1000;
    this.supportedExtensions = [
      // 텍스트 파일
      '.txt', '.md', '.json', '.xml', '.yaml', '.yml', '.ini', '.conf', '.config',
      '.log', '.csv', '.tsv', '.sql', '.html', '.htm', '.css', '.js', '.jsx',
      '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php',
      '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.r', '.m', '.pl', '.sh',
      '.bat', '.ps1', '.vbs', '.lua', '.scm', '.clj', '.hs', '.ml', '.fs',
      '.dart', '.elm', '.purs', '.nim', '.zig', '.v', '.f90', '.f95',
      // 문서 파일 (텍스트 추출 가능)
      '.doc', '.docx', '.pdf', '.rtf', '.odt', '.pages',
      '.xls', '.xlsx', '.ods', '.numbers',
      '.ppt', '.pptx', '.odp', '.keynote'
    ];
    
    this.initialize();
  }

  /**
   * 인덱서 초기화
   */
  async initialize() {
    try {
      const indexPath = path.join(process.cwd(), 'data', 'content-index.json');
      try {
        const data = await fs.readFile(indexPath, 'utf-8');
        const indexData = JSON.parse(data);
        
        // 인덱스 복원
        for (const [filePath, indexInfo] of Object.entries(indexData)) {
          this.index.set(filePath, {
            ...indexInfo,
            lastModified: new Date(indexInfo.lastModified)
          });
        }
        
        logger.info(`콘텐츠 인덱스 로드 완료: ${this.index.size}개 파일`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        logger.info('콘텐츠 인덱스 파일이 없습니다. 새로 생성합니다.');
      }
    } catch (error) {
      logger.error('콘텐츠 인덱서 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 인덱스 저장
   */
  async saveIndex() {
    try {
      const indexPath = path.join(process.cwd(), 'data', 'content-index.json');
      await fs.mkdir(path.dirname(indexPath), { recursive: true });
      
      // Date 객체를 문자열로 변환
      const indexData = {};
      for (const [filePath, indexInfo] of this.index.entries()) {
        indexData[filePath] = {
          ...indexInfo,
          lastModified: indexInfo.lastModified.toISOString()
        };
      }
      
      const data = JSON.stringify(indexData, null, 2);
      await fs.writeFile(indexPath, data, 'utf-8');
      
      logger.info(`콘텐츠 인덱스 저장 완료: ${this.index.size}개 파일`);
    } catch (error) {
      logger.error('콘텐츠 인덱스 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 인덱싱
   * @param {string} filePath - 파일 경로
   * @param {Object} options - 옵션
   */
  async indexFile(filePath, options = {}) {
    try {
      const normalizedPath = path.normalize(filePath);
      
      // 파일 존재 확인
      const stats = await fs.stat(normalizedPath);
      if (!stats.isFile()) {
        logger.warn(`파일이 아닙니다: ${normalizedPath}`);
        return false;
      }

      // 확장자 확인
      const ext = path.extname(normalizedPath).toLowerCase();
      if (!this.supportedExtensions.includes(ext)) {
        logger.debug(`지원하지 않는 확장자: ${ext} (${normalizedPath})`);
        return false;
      }

      // 기존 인덱스 확인
      const existingIndex = this.index.get(normalizedPath);
      if (existingIndex && existingIndex.lastModified.getTime() === stats.mtime.getTime()) {
        logger.debug(`파일이 변경되지 않음: ${normalizedPath}`);
        return true;
      }

      // 파일 내용 읽기
      const content = await this.extractFileContent(normalizedPath, ext);
      if (!content) {
        logger.warn(`파일 내용을 읽을 수 없음: ${normalizedPath}`);
        return false;
      }

      // 메타데이터 생성
      const metadata = {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        extension: ext,
        wordCount: this.countWords(content),
        lineCount: content.split('\n').length,
        hash: this.calculateContentHash(content)
      };

      // 인덱스 업데이트
      this.index.set(normalizedPath, {
        content: content.substring(0, 10000), // 최대 10KB만 저장
        metadata,
        lastModified: stats.mtime
      });

      // 캐시 업데이트
      this.updateCache(normalizedPath, content);

      logger.info(`파일 인덱싱 완료: ${normalizedPath} (${metadata.wordCount}단어)`);
      return true;

    } catch (error) {
      logger.error(`파일 인덱싱 실패: ${filePath}`, error);
      return false;
    }
  }

  /**
   * 파일 내용 추출
   * @private
   */
  async extractFileContent(filePath, extension) {
    try {
      // 텍스트 파일은 직접 읽기
      if (['.txt', '.md', '.json', '.xml', '.yaml', '.yml', '.ini', '.conf', '.config',
           '.log', '.csv', '.tsv', '.sql', '.html', '.htm', '.css', '.js', '.jsx',
           '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php',
           '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.r', '.m', '.pl', '.sh',
           '.bat', '.ps1', '.vbs', '.lua', '.scm', '.clj', '.hs', '.ml', '.fs',
           '.dart', '.elm', '.purs', '.nim', '.zig', '.v', '.f90', '.f95'].includes(extension)) {
        
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
      }

      // 바이너리 파일은 건너뛰기 (나중에 확장)
      logger.debug(`바이너리 파일은 현재 지원하지 않음: ${extension}`);
      return null;

    } catch (error) {
      logger.error(`파일 내용 추출 실패: ${filePath}`, error);
      return null;
    }
  }

  /**
   * 단어 수 계산
   * @private
   */
  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * 내용 해시 계산
   * @private
   */
  calculateContentHash(content) {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * 캐시 업데이트
   * @private
   */
  updateCache(filePath, content) {
    this.contentCache.set(filePath, content);
    
    // 캐시 크기 제한
    if (this.contentCache.size > this.maxCacheSize) {
      const firstKey = this.contentCache.keys().next().value;
      this.contentCache.delete(firstKey);
    }
  }

  /**
   * 내용 검색
   * @param {string} query - 검색어
   * @param {Object} options - 검색 옵션
   */
  async searchContent(query, options = {}) {
    try {
      const {
        directory = null,
        caseSensitive = false,
        wholeWord = false,
        maxResults = 100,
        fileTypes = null,
        minWordCount = 0,
        maxWordCount = null
      } = options;

      const searchTerms = this.tokenize(query, caseSensitive);
      const results = [];

      for (const [filePath, indexInfo] of this.index.entries()) {
        // 디렉토리 필터
        if (directory && !filePath.startsWith(directory)) {
          continue;
        }

        // 파일 타입 필터
        if (fileTypes && !fileTypes.includes(indexInfo.metadata.extension)) {
          continue;
        }

        // 단어 수 필터
        if (indexInfo.metadata.wordCount < minWordCount) {
          continue;
        }
        if (maxWordCount && indexInfo.metadata.wordCount > maxWordCount) {
          continue;
        }

        // 내용 검색
        const content = this.contentCache.get(filePath) || indexInfo.content;
        const score = this.calculateContentScore(content, searchTerms, caseSensitive, wholeWord);
        
        if (score > 0) {
          const matches = this.findContentMatches(content, searchTerms, caseSensitive, wholeWord);
          
          results.push({
            path: filePath,
            score: score,
            matches: matches,
            metadata: indexInfo.metadata,
            snippet: this.generateSnippet(content, matches[0]?.index || 0)
          });
        }
      }

      // 점수순 정렬 및 결과 제한
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

    } catch (error) {
      logger.error('내용 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 토큰화
   * @private
   */
  tokenize(text, caseSensitive = false) {
    const processed = caseSensitive ? text : text.toLowerCase();
    return processed
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * 내용 점수 계산
   * @private
   */
  calculateContentScore(content, searchTerms, caseSensitive, wholeWord) {
    let score = 0;
    const processedContent = caseSensitive ? content : content.toLowerCase();
    
    for (const term of searchTerms) {
      if (wholeWord) {
        const wordPattern = new RegExp(`\\b${term}\\b`, caseSensitive ? 'g' : 'gi');
        const matches = processedContent.match(wordPattern);
        score += matches ? matches.length : 0;
      } else {
        const matches = processedContent.match(new RegExp(term, caseSensitive ? 'g' : 'gi'));
        score += matches ? matches.length : 0;
      }
    }
    
    return score;
  }

  /**
   * 내용 매치 찾기
   * @private
   */
  findContentMatches(content, searchTerms, caseSensitive, wholeWord) {
    const matches = [];
    const processedContent = caseSensitive ? content : content.toLowerCase();
    
    for (const term of searchTerms) {
      if (wholeWord) {
        const wordPattern = new RegExp(`\\b${term}\\b`, caseSensitive ? 'g' : 'gi');
        let match;
        while ((match = wordPattern.exec(processedContent)) !== null) {
          matches.push({
            term: term,
            index: match.index,
            text: match[0]
          });
        }
      } else {
        const pattern = new RegExp(term, caseSensitive ? 'g' : 'gi');
        let match;
        while ((match = pattern.exec(processedContent)) !== null) {
          matches.push({
            term: term,
            index: match.index,
            text: match[0]
          });
        }
      }
    }
    
    return matches.sort((a, b) => a.index - b.index);
  }

  /**
   * 스니펫 생성
   * @private
   */
  generateSnippet(content, matchIndex, length = 200) {
    const start = Math.max(0, matchIndex - length / 2);
    const end = Math.min(content.length, start + length);
    let snippet = content.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  }

  /**
   * 인덱스에서 파일 제거
   */
  async removeFromIndex(filePath) {
    try {
      const normalizedPath = path.normalize(filePath);
      this.index.delete(normalizedPath);
      this.contentCache.delete(normalizedPath);
      await this.saveIndex();
      
      logger.info(`인덱스에서 파일 제거됨: ${normalizedPath}`);
      return true;
    } catch (error) {
      logger.error(`인덱스에서 파일 제거 실패: ${filePath}`, error);
      return false;
    }
  }

  /**
   * 인덱스에서 파일 이름 변경
   */
  async renameInIndex(oldPath, newPath) {
    try {
      const normalizedOldPath = path.normalize(oldPath);
      const normalizedNewPath = path.normalize(newPath);
      
      const indexInfo = this.index.get(normalizedOldPath);
      if (indexInfo) {
        this.index.delete(normalizedOldPath);
        this.index.set(normalizedNewPath, indexInfo);
        
        // 캐시도 업데이트
        const content = this.contentCache.get(normalizedOldPath);
        if (content) {
          this.contentCache.delete(normalizedOldPath);
          this.contentCache.set(normalizedNewPath, content);
        }
        
        await this.saveIndex();
        logger.info(`인덱스에서 파일 이름 변경됨: ${normalizedOldPath} -> ${normalizedNewPath}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`인덱스에서 파일 이름 변경 실패: ${oldPath} -> ${newPath}`, error);
      return false;
    }
  }

  /**
   * 인덱스 통계
   */
  getStats() {
    const stats = {
      totalFiles: this.index.size,
      totalWords: 0,
      totalLines: 0,
      totalSize: 0,
      extensions: {},
      lastUpdated: null
    };

    for (const [filePath, indexInfo] of this.index.entries()) {
      stats.totalWords += indexInfo.metadata.wordCount;
      stats.totalLines += indexInfo.metadata.lineCount;
      stats.totalSize += indexInfo.metadata.size;
      
      const ext = indexInfo.metadata.extension;
      stats.extensions[ext] = (stats.extensions[ext] || 0) + 1;
      
      if (!stats.lastUpdated || indexInfo.lastModified > stats.lastUpdated) {
        stats.lastUpdated = indexInfo.lastModified;
      }
    }

    return stats;
  }

  /**
   * 인덱스 재구성
   */
  async rebuildIndex(targetPath = '.') {
    try {
      logger.info(`콘텐츠 인덱스 재구성 시작: ${targetPath}`);
      
      const processDirectory = async (dirPath) => {
        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
              await processDirectory(fullPath);
            } else if (entry.isFile()) {
              await this.indexFile(fullPath);
            }
          }
        } catch (error) {
          logger.error(`디렉토리 처리 실패: ${dirPath}`, error);
        }
      };

      await processDirectory(targetPath);
      await this.saveIndex();
      
      const stats = this.getStats();
      logger.info(`콘텐츠 인덱스 재구성 완료: ${stats.totalFiles}개 파일, ${stats.totalWords}단어`);
      
      return stats;
    } catch (error) {
      logger.error('콘텐츠 인덱스 재구성 실패:', error);
      throw error;
    }
  }
} 