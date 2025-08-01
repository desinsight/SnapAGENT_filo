import fs from 'fs/promises';
import * as fsSync from 'fs';
import { Worker } from 'worker_threads';
import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { ContentIndexer } from './ContentIndexer.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SearchEngine {
  constructor() {
    this.workers = new Map();
    this.index = new Map();
    this.cache = new Map();
    this.contentIndexer = new ContentIndexer();
    this.initialize();
  }

  async initialize() {
    try {
      const indexPath = path.join(process.cwd(), 'data', 'search-index.json');
      try {
        const data = await fs.readFile(indexPath, 'utf-8');
        this.index = new Map(Object.entries(JSON.parse(data)));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    } catch (error) {
      logger.error('검색 엔진 초기화 실패:', error);
      throw error;
    }

    // 워커 풀 초기화
    for (let i = 0; i < config.worker.poolSize; i++) {
      const workerPath = path.join(__dirname, '../workers/searchWorker.js');
      const worker = new Worker(workerPath);
      this.workers.set(i, worker);
    }

    // 인덱스 초기화
    await this.rebuildIndex({ targetPath: '.' });
  }

  async saveIndex() {
    try {
      const indexPath = path.join(process.cwd(), 'data', 'search-index.json');
      await fs.mkdir(path.dirname(indexPath), { recursive: true });
      const data = JSON.stringify(Object.fromEntries(this.index), null, 2);
      await fs.writeFile(indexPath, data, 'utf-8');
    } catch (error) {
      logger.error('검색 인덱스 저장 실패:', error);
      throw error;
    }
  }

  async indexFile(filePath, content) {
    try {
      const normalizedPath = path.normalize(filePath);
      const words = this.tokenize(content);
      this.index.set(normalizedPath, words);
      await this.saveIndex();
      logger.info(`파일 인덱싱 완료: ${normalizedPath}`);
    } catch (error) {
      logger.error('파일 인덱싱 실패:', error);
      throw error;
    }
  }

  async removeFromIndex(filePath) {
    try {
      const normalizedPath = path.normalize(filePath);
      this.index.delete(normalizedPath);
      await this.saveIndex();
      logger.info(`인덱스에서 파일 제거됨: ${normalizedPath}`);
    } catch (error) {
      logger.error('인덱스에서 파일 제거 실패:', error);
      throw error;
    }
  }

  async search(query, directory = null) {
    try {
      const searchTerms = this.tokenize(query);
      const results = [];

      for (const [filePath, words] of this.index.entries()) {
        if (directory && !filePath.startsWith(directory)) {
          continue;
        }

        const score = this.calculateRelevance(words, searchTerms);
        if (score > 0) {
          results.push({
            path: filePath,
            score: score,
            matches: this.findMatches(words, searchTerms)
          });
        }
      }

      return results.sort((a, b) => b.score - a.score);
    } catch (error) {
      logger.error('검색 실패:', error);
      throw error;
    }
  }

  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  calculateRelevance(words, searchTerms) {
    let score = 0;
    for (const term of searchTerms) {
      const count = words.filter(word => word.includes(term)).length;
      score += count;
    }
    return score;
  }

  findMatches(words, searchTerms) {
    const matches = new Set();
    for (const term of searchTerms) {
      words.forEach(word => {
        if (word.includes(term)) {
          matches.add(word);
        }
      });
    }
    return Array.from(matches);
  }

  async updateIndex(filePath, content) {
    try {
      await this.indexFile(filePath, content);
    } catch (error) {
      logger.error('인덱스 업데이트 실패:', error);
      throw error;
    }
  }

  async renameInIndex(oldPath, newPath) {
    try {
      const normalizedOldPath = path.normalize(oldPath);
      const normalizedNewPath = path.normalize(newPath);
      const words = this.index.get(normalizedOldPath);
      if (words) {
        this.index.delete(normalizedOldPath);
        this.index.set(normalizedNewPath, words);
        await this.saveIndex();
        logger.info(`인덱스에서 파일 이름 변경됨: ${normalizedOldPath} -> ${normalizedNewPath}`);
      }
    } catch (error) {
      logger.error('인덱스에서 파일 이름 변경 실패:', error);
      throw error;
    }
  }

  async getTools() {
    return [
      {
        name: 'search_files',
        description: '파일을 검색합니다.',
        parameters: {
          query: { type: 'string', description: '검색어' },
          options: { type: 'object', description: '검색 옵션' }
        },
        execute: this.searchFiles.bind(this)
      },
      {
        name: 'search_content',
        description: '파일 내용을 검색합니다.',
        parameters: {
          query: { type: 'string', description: '검색어' },
          options: { type: 'object', description: '검색 옵션' }
        },
        execute: this.searchContent.bind(this)
      },
      {
        name: 'find_duplicates',
        description: '중복 파일을 찾습니다.',
        parameters: {
          path: { type: 'string', description: '검색 경로' },
          options: { type: 'object', description: '검색 옵션' }
        },
        execute: this.findDuplicates.bind(this)
      },
      {
        name: 'find_empty',
        description: '빈 파일/폴더를 찾습니다.',
        parameters: {
          path: { type: 'string', description: '검색 경로' }
        },
        execute: this.findEmpty.bind(this)
      },
      {
        name: 'rebuild_index',
        description: '검색 인덱스를 재구성합니다.',
        parameters: {
          targetPath: { type: 'string', description: '인덱싱할 경로' }
        },
        execute: this.rebuildIndex.bind(this)
      }
    ];
  }

  async searchFiles({ query, options = {} }) {
    try {
      const {
        path: searchPath = '.',
        recursive = true,
        caseSensitive = false,
        useRegex = false,
        fileTypes = [],
        minSize,
        maxSize,
        modifiedAfter,
        modifiedBefore,
        searchInName = true,
        nameQuery = query
      } = options;

      const results = [];
      const searchRegex = useRegex ? new RegExp(nameQuery, caseSensitive ? '' : 'i') : null;
      const searchPattern = caseSensitive ? nameQuery : nameQuery.toLowerCase();
      
      // 이름 검색용 패턴 (더 유연한 검색을 위해)
      const nameSearchPattern = caseSensitive ? nameQuery : nameQuery.toLowerCase();
      const nameSearchWords = nameSearchPattern.split(/\s+/).filter(word => word.length > 0);

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          try {
            const stats = await fs.stat(fullPath);
            
            // 파일 타입 필터링
            if (fileTypes.length > 0) {
              const ext = path.extname(entry.name).toLowerCase().slice(1);
              if (!fileTypes.includes(ext)) continue;
            }

            // 크기 필터링
            if (minSize && stats.size < minSize) continue;
            if (maxSize && stats.size > maxSize) continue;

            // 수정 날짜 필터링
            if (modifiedAfter && stats.mtime < new Date(modifiedAfter)) continue;
            if (modifiedBefore && stats.mtime > new Date(modifiedBefore)) continue;

            // 이름 매칭 (개선된 로직)
            const fileName = caseSensitive ? entry.name : entry.name.toLowerCase();
            let matches = false;
            
            if (searchInName) {
              if (useRegex) {
                matches = searchRegex.test(fileName);
              } else {
                // 부분 매칭: 모든 키워드가 포함되어야 함
                if (nameSearchWords.length > 0) {
                  matches = nameSearchWords.every(word => fileName.includes(word));
                } else {
                  matches = fileName.includes(searchPattern);
                }
              }
            }

            if (matches) {
              results.push({
                name: entry.name,
                path: fullPath,
                isDirectory: entry.isDirectory(),
                size: stats.size,
                modified: stats.mtime.toISOString(),
                created: stats.birthtime.toISOString()
              });
            }

            if (recursive && entry.isDirectory()) {
              await processDirectory(fullPath);
            }
          } catch (e) {
            logger.warn(`파일 검색 실패: ${fullPath}`, e);
          }
        }
      };

      await processDirectory(searchPath);
      return results;
    } catch (error) {
      logger.error('파일 검색 실패:', error);
      throw error;
    }
  }

  async searchContent({ query, options = {} }) {
    try {
      const {
        path: searchPath2 = '.',
        recursive = true,
        caseSensitive = false,
        useRegex = false,
        fileTypes = ['txt', 'md', 'json', 'js', 'html', 'css'],
        encoding = 'utf8'
      } = options;

      const results = [];
      const searchRegex = useRegex ? new RegExp(query, caseSensitive ? '' : 'i') : null;
      const searchPattern = caseSensitive ? query : query.toLowerCase();

      const processFile = async (filePath) => {
        try {
          const content = await fs.readFile(filePath, encoding);
          const fileContent = caseSensitive ? content : content.toLowerCase();
          
          const matches = useRegex ? searchRegex.test(fileContent) : fileContent.includes(searchPattern);
          
          if (matches) {
            const stats = await fs.stat(filePath);
            results.push({
              name: path.basename(filePath),
              path: filePath,
              size: stats.size,
              modified: stats.mtime.toISOString(),
              matches: useRegex ? 
                [...fileContent.matchAll(searchRegex)].map(m => m[0]) :
                [query]
            });
          }
        } catch (e) {
          logger.warn(`파일 내용 검색 실패: ${filePath}`, e);
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            const ext = path.extname(entry.name).toLowerCase().slice(1);
            if (fileTypes.includes(ext)) {
              await processFile(fullPath);
            }
          }
        }
      };

      await processDirectory(searchPath2);
      return results;
    } catch (error) {
      logger.error('파일 내용 검색 실패:', error);
      throw error;
    }
  }

  async findDuplicates({ path: searchPath, options = {} }) {
    try {
      const {
        recursive = true,
        minSize = 1024, // 1KB
        algorithm = 'sha256'
      } = options;

      const fileHashes = new Map();
      const duplicates = new Map();

      const processFile = async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          if (stats.size < minSize) return;

          const hash = await this.calculateFileHash(filePath, algorithm);
          if (fileHashes.has(hash)) {
            if (!duplicates.has(hash)) {
              duplicates.set(hash, [fileHashes.get(hash)]);
            }
            duplicates.get(hash).push(filePath);
          } else {
            fileHashes.set(hash, filePath);
          }
        } catch (e) {
          logger.warn(`중복 파일 검색 실패: ${filePath}`, e);
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(searchPath);

      return Array.from(duplicates.entries()).map(([hash, files]) => ({
        hash,
        files: files.map(file => ({
          path: file,
          size: fs.statSync(file).size
        }))
      }));
    } catch (error) {
      logger.error('중복 파일 검색 실패:', error);
      throw error;
    }
  }

  async findEmpty({ path: searchPath }) {
    try {
      const emptyFiles = [];
      const emptyDirs = [];

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        if (entries.length === 0) {
          emptyDirs.push(dirPath);
          return;
        }

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            await processDirectory(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            if (stats.size === 0) {
              emptyFiles.push(fullPath);
            }
          }
        }
      };

      await processDirectory(searchPath);

      return {
        emptyFiles,
        emptyDirs
      };
    } catch (error) {
      logger.error('빈 파일/폴더 검색 실패:', error);
      throw error;
    }
  }

  async rebuildIndex({ targetPath = '.' }) {
    try {
      this.index.clear();
      const processFile = async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          const hash = await this.calculateFileHash(filePath);
          this.index.set(filePath, {
            name: path.basename(filePath),
            size: stats.size,
            modified: stats.mtime.toISOString(),
            hash
          });
        } catch (e) {
          logger.warn(`파일 인덱싱 실패: ${filePath}`, e);
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            await processDirectory(fullPath);
          } else {
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(targetPath);
      return { success: true, indexedFiles: this.index.size };
    } catch (error) {
      logger.error('인덱스 재구성 실패:', error);
      throw error;
    }
  }

  async calculateFileHash(filePath, algorithm = 'sha256') {
    try {
      const hash = createHash(algorithm);
      const stream = fsSync.createReadStream(filePath);
      
      return new Promise((resolve, reject) => {
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('파일 해시 계산 실패:', error);
      throw error;
    }
  }

  /**
   * 고급 검색 (AI 명령 플랜 기반)
   * @param {Object} commandPlan - AI 명령 파서에서 생성된 플랜
   * @param {Object} options - 추가 옵션
   */
  async advancedSearch(commandPlan, options = {}) {
    try {
      const results = {
        files: [],
        content: [],
        duplicates: [],
        analysis: {
          totalFiles: 0,
          totalSize: 0,
          fileTypes: {},
          suggestions: []
        }
      };

      // 1. 파일명/경로 검색
      if (commandPlan.targets.length > 0 || commandPlan.conditions.이름) {
        const fileResults = await this.searchByTargets(commandPlan, options);
        results.files = fileResults;
      }

      // 2. 내용 검색
      if (commandPlan.conditions.내용 || commandPlan.suggestedQueries.some(q => q.includes('내용'))) {
        const contentResults = await this.contentIndexer.searchContent(
          commandPlan.originalCommand,
          {
            directory: options.directory,
            caseSensitive: commandPlan.options.caseSensitive,
            wholeWord: false,
            maxResults: commandPlan.options.maxResults || 50,
            fileTypes: commandPlan.targets.flatMap(t => t.extensions || [])
          }
        );
        results.content = contentResults;
      }

      // 3. 중복 파일 검색
      if (commandPlan.conditions.중복) {
        const duplicateResults = await this.findDuplicates({
          path: options.directory || '.',
          options: {
            recursive: commandPlan.options.recursive,
            minSize: 1024
          }
        });
        results.duplicates = duplicateResults;
      }

      // 4. 분석 정보 생성
      results.analysis = this.generateAnalysis(results, commandPlan);

      return results;
    } catch (error) {
      logger.error('고급 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 타겟 기반 검색
   * @private
   */
  async searchByTargets(commandPlan, options) {
    const results = [];
    const searchQueries = commandPlan.suggestedQueries.length > 0 ? 
      commandPlan.suggestedQueries : [commandPlan.originalCommand];

    for (const query of searchQueries) {
      const fileResults = await this.searchFiles({
        query: query,
        options: {
          path: options.directory || '.',
          recursive: commandPlan.options.recursive,
          caseSensitive: commandPlan.options.caseSensitive,
          fileTypes: commandPlan.targets.flatMap(t => t.extensions || []).map(ext => ext.slice(1)),
          minSize: commandPlan.conditions.size?.value,
          maxSize: commandPlan.conditions.size?.value,
          modifiedAfter: this.parseDateCondition(commandPlan.conditions.date),
          modifiedBefore: null
        }
      });
      results.push(...fileResults);
    }

    return results;
  }

  /**
   * 날짜 조건 파싱
   * @private
   */
  parseDateCondition(dateCondition) {
    if (!dateCondition) return null;

    const now = new Date();
    
    switch (dateCondition.type) {
      case 'relative':
        if (dateCondition.pattern.includes('일 전')) {
          const days = parseInt(dateCondition.pattern.match(/(\d+)일/)[1]);
          return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        }
        if (dateCondition.pattern.includes('주 전')) {
          const weeks = parseInt(dateCondition.pattern.match(/(\d+)주/)[1]);
          return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
        }
        if (dateCondition.pattern.includes('개월 전')) {
          const months = parseInt(dateCondition.pattern.match(/(\d+)개월/)[1]);
          return new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
        }
        if (dateCondition.pattern === '오늘') {
          return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        if (dateCondition.pattern === '어제') {
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        }
        break;
      case 'absolute':
        // 절대 날짜 파싱 (예: 2024년 1월 15일)
        const match = dateCondition.pattern.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
        if (match) {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        }
        break;
    }
    
    return null;
  }

  /**
   * 분석 정보 생성
   * @private
   */
  generateAnalysis(results, commandPlan) {
    const analysis = {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {},
      suggestions: []
    };

    // 파일 통계
    const allFiles = [...results.files, ...results.content, ...results.duplicates.flat()];
    analysis.totalFiles = allFiles.length;

    for (const file of allFiles) {
      analysis.totalSize += file.size || 0;
      const ext = path.extname(file.path || file.name).toLowerCase();
      analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
    }

    // 제안 생성
    if (commandPlan.confidence < 0.7) {
      analysis.suggestions.push('검색 조건을 더 구체적으로 지정해보세요.');
    }

    if (results.files.length === 0 && results.content.length === 0) {
      analysis.suggestions.push('검색 결과가 없습니다. 다른 키워드로 시도해보세요.');
    }

    if (results.duplicates.length > 0) {
      analysis.suggestions.push('중복 파일이 발견되었습니다. 정리 기능을 사용해보세요.');
    }

    return analysis;
  }

  /**
   * 스마트 검색 (자동 모드 선택)
   */
  async smartSearch(query, options = {}) {
    try {
      // 쿼리 분석
      const isContentSearch = this.isContentSearchQuery(query);
      const isFileSearch = this.isFileSearchQuery(query);
      const isDuplicateSearch = this.isDuplicateSearchQuery(query);

      let results = {};

      if (isContentSearch) {
        results.content = await this.contentIndexer.searchContent(query, options);
      }

      if (isFileSearch) {
        results.files = await this.searchFiles({ query, options });
      }

      if (isDuplicateSearch) {
        results.duplicates = await this.findDuplicates({ path: options.directory || '.', options });
      }

      // 모든 모드로 검색
      if (!isContentSearch && !isFileSearch && !isDuplicateSearch) {
        results = {
          files: await this.searchFiles({ query, options }),
          content: await this.contentIndexer.searchContent(query, options),
          duplicates: await this.findDuplicates({ path: options.directory || '.', options })
        };
      }

      return results;
    } catch (error) {
      logger.error('스마트 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 내용 검색 쿼리 판별
   * @private
   */
  isContentSearchQuery(query) {
    const contentKeywords = ['내용', '텍스트', 'body', 'content', 'text', '안에', '포함'];
    return contentKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  /**
   * 파일 검색 쿼리 판별
   * @private
   */
  isFileSearchQuery(query) {
    const fileKeywords = ['파일', 'file', '이름', 'name', '확장자', 'extension'];
    return fileKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  /**
   * 중복 검색 쿼리 판별
   * @private
   */
  isDuplicateSearchQuery(query) {
    const duplicateKeywords = ['중복', 'duplicate', '같은', 'same', '복사', 'copy'];
    return duplicateKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }
} 