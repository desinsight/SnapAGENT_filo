import { logger } from '../utils/logger.js';
import { LocalCache } from '../utils/LocalCache.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * 지능형 파일 분석 및 추천 시스템
 * AI 기반 파일 내용 분석, 중복 탐지, 자동 분류, 최적화 제안
 */
export class IntelligentFileAnalyzer {
  constructor() {
    this.cache = new LocalCache('file-analyzer');
    this.analysisHistory = new Map();
    this.contentSignatures = new Map();
    this.similarityIndex = new Map();
    
    // 분석 설정
    this.config = {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      chunkSize: 64 * 1024, // 64KB
      similarityThreshold: 0.85,
      duplicateThreshold: 0.98,
      maxConcurrentAnalysis: 5,
      analysisTimeout: 30000
    };
    
    // 파일 타입별 분석 전략
    this.analysisStrategies = {
      text: ['content', 'structure', 'quality', 'similarity'],
      code: ['syntax', 'quality', 'dependencies', 'patterns'],
      image: ['metadata', 'quality', 'similarity', 'optimization'],
      document: ['content', 'structure', 'metadata', 'accessibility'],
      data: ['format', 'quality', 'schema', 'relationships'],
      archive: ['contents', 'compression', 'structure']
    };
    
    this.initializeAnalyzer();
  }

  async initializeAnalyzer() {
    try {
      logger.info('지능형 파일 분석기 초기화 중...');
      
      // 분석 히스토리 로드
      await this.loadAnalysisHistory();
      
      // 컨텐츠 시그니처 인덱스 로드
      await this.loadContentSignatures();
      
      // 유사성 인덱스 로드
      await this.loadSimilarityIndex();
      
      logger.info('지능형 파일 분석기 초기화 완료');
    } catch (error) {
      logger.error('파일 분석기 초기화 실패:', error);
    }
  }

  /**
   * 포괄적 파일 분석 수행
   */
  async analyzeFiles(filePaths, options = {}) {
    try {
      const analysisResults = {
        summary: {
          totalFiles: filePaths.length,
          analyzedFiles: 0,
          skippedFiles: 0,
          totalSize: 0,
          analysisTime: 0
        },
        fileAnalysis: [],
        duplicates: [],
        similarities: [],
        categories: {},
        recommendations: [],
        optimizations: []
      };

      const startTime = Date.now();
      const semaphore = new Semaphore(this.config.maxConcurrentAnalysis);

      // 병렬 분석 수행
      const analysisPromises = filePaths.map(async (filePath) => {
        await semaphore.acquire();
        try {
          return await this.analyzeSingleFile(filePath, options);
        } finally {
          semaphore.release();
        }
      });

      const fileResults = await Promise.allSettled(analysisPromises);

      // 결과 집계
      fileResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          analysisResults.fileAnalysis.push(result.value);
          analysisResults.summary.analyzedFiles++;
          analysisResults.summary.totalSize += result.value.size || 0;
        } else {
          analysisResults.summary.skippedFiles++;
          logger.warn(`파일 분석 실패: ${filePaths[index]}`, result.reason);
        }
      });

      analysisResults.summary.analysisTime = Date.now() - startTime;

      // 고급 분석 수행
      await this.performAdvancedAnalysis(analysisResults);

      // 분석 결과 캐싱
      await this.cacheAnalysisResults(analysisResults);

      return analysisResults;

    } catch (error) {
      logger.error('파일 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 단일 파일 심층 분석
   */
  async analyzeSingleFile(filePath, options = {}) {
    try {
      const stats = await fs.stat(filePath);
      
      // 파일이 너무 크면 스킵
      if (stats.size > this.config.maxFileSize) {
        return null;
      }

      const analysis = {
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath).toLowerCase(),
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        type: this.detectFileType(filePath),
        contentHash: null,
        analysis: {},
        metadata: {},
        quality: {},
        suggestions: []
      };

      // 파일 타입별 분석 전략 선택
      const strategies = this.getAnalysisStrategies(analysis.type, analysis.extension);
      
      // 각 전략별 분석 수행
      for (const strategy of strategies) {
        try {
          const strategyResult = await this.executeAnalysisStrategy(filePath, strategy, analysis);
          analysis.analysis[strategy] = strategyResult;
        } catch (error) {
          logger.warn(`${strategy} 분석 실패 (${filePath}):`, error.message);
        }
      }

      // 컨텐츠 해시 생성
      analysis.contentHash = await this.generateContentHash(filePath);

      // 품질 점수 계산
      analysis.quality = await this.calculateQualityScore(analysis);

      // 개선 제안 생성
      analysis.suggestions = await this.generateImprovementSuggestions(analysis);

      return analysis;

    } catch (error) {
      logger.error(`단일 파일 분석 실패 (${filePath}):`, error);
      return null;
    }
  }

  /**
   * 파일 타입 감지
   */
  detectFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath).toLowerCase();

    const typeMap = {
      text: ['.txt', '.md', '.readme', '.log', '.csv', '.tsv', '.json', '.xml', '.yaml', '.yml'],
      code: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt'],
      style: ['.css', '.scss', '.sass', '.less', '.styl'],
      markup: ['.html', '.htm', '.xml', '.svg'],
      config: ['.config', '.conf', '.ini', '.env', '.properties'],
      image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', '.webp', '.tiff'],
      video: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
      audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
      document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp'],
      archive: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
      data: ['.db', '.sqlite', '.sqlite3', '.mdb', '.accdb'],
      font: ['.ttf', '.otf', '.woff', '.woff2', '.eot']
    };

    for (const [type, extensions] of Object.entries(typeMap)) {
      if (extensions.includes(ext)) {
        return type;
      }
    }

    // 특수 파일명 패턴 확인
    if (name.includes('package.json')) return 'config';
    if (name.includes('dockerfile')) return 'config';
    if (name.includes('makefile')) return 'config';
    if (name.includes('readme')) return 'text';

    return 'unknown';
  }

  /**
   * 분석 전략 선택
   */
  getAnalysisStrategies(fileType, extension) {
    const strategies = this.analysisStrategies[fileType] || ['basic'];
    
    // 확장자별 특수 전략 추가
    const extensionStrategies = {
      '.json': ['syntax', 'structure', 'validation'],
      '.js': ['syntax', 'quality', 'dependencies', 'security'],
      '.py': ['syntax', 'quality', 'imports', 'pep8'],
      '.md': ['structure', 'links', 'formatting'],
      '.css': ['syntax', 'optimization', 'compatibility'],
      '.html': ['validation', 'accessibility', 'performance']
    };

    if (extensionStrategies[extension]) {
      strategies.push(...extensionStrategies[extension]);
    }

    return [...new Set(strategies)]; // 중복 제거
  }

  /**
   * 분석 전략 실행
   */
  async executeAnalysisStrategy(filePath, strategy, fileInfo) {
    switch (strategy) {
      case 'content':
        return await this.analyzeContent(filePath, fileInfo);
      case 'structure':
        return await this.analyzeStructure(filePath, fileInfo);
      case 'quality':
        return await this.analyzeQuality(filePath, fileInfo);
      case 'similarity':
        return await this.analyzeSimilarity(filePath, fileInfo);
      case 'syntax':
        return await this.analyzeSyntax(filePath, fileInfo);
      case 'dependencies':
        return await this.analyzeDependencies(filePath, fileInfo);
      case 'security':
        return await this.analyzeSecurity(filePath, fileInfo);
      case 'metadata':
        return await this.analyzeMetadata(filePath, fileInfo);
      case 'optimization':
        return await this.analyzeOptimization(filePath, fileInfo);
      default:
        return await this.performBasicAnalysis(filePath, fileInfo);
    }
  }

  /**
   * 컨텐츠 분석
   */
  async analyzeContent(filePath, fileInfo) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      const analysis = {
        lines: content.split('\n').length,
        characters: content.length,
        words: content.split(/\s+/).filter(word => word.length > 0).length,
        encoding: 'utf-8',
        language: null,
        sentiment: null,
        topics: [],
        keywords: []
      };

      // 언어 감지
      analysis.language = this.detectLanguage(content);

      // 키워드 추출
      analysis.keywords = this.extractKeywords(content);

      // 주제 분석 (간단한 버전)
      analysis.topics = this.extractTopics(content, fileInfo.extension);

      // 감정 분석 (텍스트 파일의 경우)
      if (fileInfo.type === 'text') {
        analysis.sentiment = this.analyzeSentiment(content);
      }

      return analysis;

    } catch (error) {
      if (error.code === 'EISDIR') return { error: 'directory' };
      logger.warn(`컨텐츠 분석 실패 (${filePath}):`, error.message);
      return { error: 'failed_to_read' };
    }
  }

  /**
   * 구조 분석
   */
  async analyzeStructure(filePath, fileInfo) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      const structure = {
        indentation: this.analyzeIndentation(content),
        hierarchy: null,
        sections: [],
        patterns: []
      };

      // 파일 타입별 구조 분석
      switch (fileInfo.extension) {
        case '.json':
          structure.hierarchy = this.analyzeJsonStructure(content);
          break;
        case '.md':
          structure.sections = this.analyzeMarkdownStructure(content);
          break;
        case '.html':
          structure.hierarchy = this.analyzeHtmlStructure(content);
          break;
        case '.css':
          structure.sections = this.analyzeCssStructure(content);
          break;
        default:
          structure.patterns = this.analyzeGeneralPatterns(content);
      }

      return structure;

    } catch (error) {
      return { error: 'structure_analysis_failed' };
    }
  }

  /**
   * 품질 분석
   */
  async analyzeQuality(filePath, fileInfo) {
    try {
      const quality = {
        readability: 0,
        maintainability: 0,
        consistency: 0,
        complexity: 0,
        documentation: 0,
        issues: [],
        score: 0
      };

      const content = await fs.readFile(filePath, 'utf-8');

      // 가독성 분석
      quality.readability = this.calculateReadability(content, fileInfo.type);

      // 유지보수성 분석
      quality.maintainability = this.calculateMaintainability(content, fileInfo.extension);

      // 일관성 분석
      quality.consistency = this.calculateConsistency(content);

      // 복잡성 분석
      quality.complexity = this.calculateComplexity(content, fileInfo.type);

      // 문서화 수준 분석
      quality.documentation = this.calculateDocumentation(content, fileInfo.type);

      // 이슈 감지
      quality.issues = this.detectQualityIssues(content, fileInfo);

      // 전체 품질 점수
      quality.score = (quality.readability + quality.maintainability + 
                      quality.consistency + quality.documentation) / 4;

      return quality;

    } catch (error) {
      return { error: 'quality_analysis_failed' };
    }
  }

  /**
   * 유사성 분석
   */
  async analyzeSimilarity(filePath, fileInfo) {
    try {
      const contentHash = await this.generateContentHash(filePath);
      const similarity = {
        duplicates: [],
        similarFiles: [],
        uniquenessScore: 1.0,
        contentSignature: contentHash
      };

      // 기존 파일들과 비교
      for (const [existingPath, existingHash] of this.contentSignatures.entries()) {
        if (existingPath !== filePath) {
          const similarityScore = await this.calculateSimilarity(filePath, existingPath);
          
          if (similarityScore >= this.config.duplicateThreshold) {
            similarity.duplicates.push({
              path: existingPath,
              similarity: similarityScore
            });
          } else if (similarityScore >= this.config.similarityThreshold) {
            similarity.similarFiles.push({
              path: existingPath,
              similarity: similarityScore
            });
          }
        }
      }

      // 유니크성 점수 계산
      similarity.uniquenessScore = Math.max(0, 1 - (similarity.duplicates.length * 0.5 + similarity.similarFiles.length * 0.1));

      // 시그니처 저장
      this.contentSignatures.set(filePath, contentHash);

      return similarity;

    } catch (error) {
      return { error: 'similarity_analysis_failed' };
    }
  }

  /**
   * 문법 분석
   */
  async analyzeSyntax(filePath, fileInfo) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const syntax = {
        valid: true,
        errors: [],
        warnings: [],
        style: {},
        metrics: {}
      };

      // 확장자별 문법 검사
      switch (fileInfo.extension) {
        case '.json':
          syntax = { ...syntax, ...this.validateJson(content) };
          break;
        case '.js':
        case '.jsx':
          syntax = { ...syntax, ...this.validateJavaScript(content) };
          break;
        case '.css':
          syntax = { ...syntax, ...this.validateCss(content) };
          break;
        case '.html':
          syntax = { ...syntax, ...this.validateHtml(content) };
          break;
        case '.md':
          syntax = { ...syntax, ...this.validateMarkdown(content) };
          break;
      }

      return syntax;

    } catch (error) {
      return { error: 'syntax_analysis_failed' };
    }
  }

  /**
   * 의존성 분석
   */
  async analyzeDependencies(filePath, fileInfo) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const dependencies = {
        imports: [],
        exports: [],
        external: [],
        internal: [],
        unused: [],
        circular: []
      };

      // 언어별 의존성 추출
      switch (fileInfo.extension) {
        case '.js':
        case '.jsx':
        case '.ts':
        case '.tsx':
          dependencies = { ...dependencies, ...this.extractJsDependencies(content) };
          break;
        case '.py':
          dependencies = { ...dependencies, ...this.extractPythonDependencies(content) };
          break;
        case '.java':
          dependencies = { ...dependencies, ...this.extractJavaDependencies(content) };
          break;
      }

      return dependencies;

    } catch (error) {
      return { error: 'dependency_analysis_failed' };
    }
  }

  /**
   * 보안 분석
   */
  async analyzeSecurity(filePath, fileInfo) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const security = {
        vulnerabilities: [],
        sensitiveData: [],
        securityScore: 10,
        recommendations: []
      };

      // 민감한 데이터 패턴 검사
      const sensitivePatterns = [
        { pattern: /password\s*[=:]\s*['"][^'"]+['"]/gi, type: 'password' },
        { pattern: /api[_-]?key\s*[=:]\s*['"][^'"]+['"]/gi, type: 'api_key' },
        { pattern: /secret\s*[=:]\s*['"][^'"]+['"]/gi, type: 'secret' },
        { pattern: /token\s*[=:]\s*['"][^'"]+['"]/gi, type: 'token' },
        { pattern: /(?:\d{4}[-.\s]){3}\d{4}/g, type: 'credit_card' },
        { pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g, type: 'ssn' }
      ];

      sensitivePatterns.forEach(({ pattern, type }) => {
        const matches = content.match(pattern);
        if (matches) {
          security.sensitiveData.push({
            type,
            count: matches.length,
            severity: this.getSeverity(type)
          });
          security.securityScore -= this.getSeverity(type) * matches.length;
        }
      });

      // 코드 보안 이슈 검사
      if (fileInfo.type === 'code') {
        security.vulnerabilities = this.detectCodeVulnerabilities(content, fileInfo.extension);
      }

      // 보안 점수 정규화
      security.securityScore = Math.max(0, Math.min(10, security.securityScore));

      // 보안 추천사항 생성
      security.recommendations = this.generateSecurityRecommendations(security);

      return security;

    } catch (error) {
      return { error: 'security_analysis_failed' };
    }
  }

  /**
   * 메타데이터 분석
   */
  async analyzeMetadata(filePath, fileInfo) {
    try {
      const metadata = {
        system: {},
        custom: {},
        extracted: {}
      };

      // 시스템 메타데이터
      const stats = await fs.stat(filePath);
      metadata.system = {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        permissions: stats.mode & parseInt('777', 8)
      };

      // 파일 타입별 메타데이터 추출
      if (fileInfo.type === 'image') {
        metadata.extracted = await this.extractImageMetadata(filePath);
      } else if (fileInfo.type === 'document') {
        metadata.extracted = await this.extractDocumentMetadata(filePath);
      } else if (fileInfo.extension === '.json') {
        metadata.extracted = await this.extractJsonMetadata(filePath);
      }

      return metadata;

    } catch (error) {
      return { error: 'metadata_analysis_failed' };
    }
  }

  /**
   * 최적화 분석
   */
  async analyzeOptimization(filePath, fileInfo) {
    try {
      const optimization = {
        compressionPotential: 0,
        redundancy: 0,
        optimization: [],
        savings: {
          size: 0,
          percentage: 0
        }
      };

      const content = await fs.readFile(filePath);
      
      // 압축 가능성 분석
      optimization.compressionPotential = this.calculateCompressionPotential(content);

      // 중복성 분석
      optimization.redundancy = this.calculateRedundancy(content, fileInfo.type);

      // 최적화 제안 생성
      optimization.optimization = this.generateOptimizationSuggestions(fileInfo, content);

      // 절약 예상치 계산
      optimization.savings = this.calculatePotentialSavings(fileInfo, optimization);

      return optimization;

    } catch (error) {
      return { error: 'optimization_analysis_failed' };
    }
  }

  /**
   * 고급 분석 수행
   */
  async performAdvancedAnalysis(analysisResults) {
    // 중복 파일 통합 분석
    analysisResults.duplicates = this.consolidateDuplicates(analysisResults.fileAnalysis);

    // 유사 파일 그룹화
    analysisResults.similarities = this.groupSimilarFiles(analysisResults.fileAnalysis);

    // 자동 카테고리 분류
    analysisResults.categories = this.categorizeFiles(analysisResults.fileAnalysis);

    // 전체적인 추천사항 생성
    analysisResults.recommendations = await this.generateGlobalRecommendations(analysisResults);

    // 최적화 제안 통합
    analysisResults.optimizations = this.consolidateOptimizations(analysisResults.fileAnalysis);
  }

  /**
   * 유틸리티 메서드들
   */
  async generateContentHash(filePath) {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  async calculateSimilarity(file1, file2) {
    try {
      const content1 = await fs.readFile(file1, 'utf-8');
      const content2 = await fs.readFile(file2, 'utf-8');
      
      // 간단한 유사도 계산 (Jaccard similarity)
      const set1 = new Set(content1.split(/\s+/));
      const set2 = new Set(content2.split(/\s+/));
      
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      
      return intersection.size / union.size;
    } catch (error) {
      return 0;
    }
  }

  detectLanguage(content) {
    const langPatterns = {
      ko: /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/,
      en: /[a-zA-Z]/,
      ja: /[ひらがなカタカナ]/,
      zh: /[\u4e00-\u9fff]/
    };

    let maxScore = 0;
    let detectedLang = 'en';

    for (const [lang, pattern] of Object.entries(langPatterns)) {
      const matches = content.match(pattern);
      const score = matches ? matches.length : 0;
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }

  extractKeywords(content) {
    // 간단한 키워드 추출
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, freq]) => ({ word, frequency: freq }));
  }

  extractTopics(content, extension) {
    const topics = [];
    
    // 확장자별 주제 추출
    if (extension === '.md') {
      const headers = content.match(/#{1,6}\s+(.+)/g);
      if (headers) {
        topics.push(...headers.map(h => h.replace(/#{1,6}\s+/, '')));
      }
    }

    return topics.slice(0, 5);
  }

  analyzeSentiment(content) {
    // 간단한 감정 분석
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', '좋은', '훌륭한', '멋진'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', '나쁜', '끔찍한', '최악'];
    
    const words = content.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pos => word.includes(pos))) positiveCount++;
      if (negativeWords.some(neg => word.includes(neg))) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return 'neutral';
    
    const sentiment = (positiveCount - negativeCount) / total;
    if (sentiment > 0.1) return 'positive';
    if (sentiment < -0.1) return 'negative';
    return 'neutral';
  }

  // 추가 분석 메서드들을 간략화하여 구현
  analyzeIndentation(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const indents = lines.map(line => {
      const match = line.match(/^(\s*)/);
      return match ? match[1].length : 0;
    });

    const avgIndent = indents.reduce((sum, indent) => sum + indent, 0) / indents.length;
    const hasTabsConsistency = content.split('\n').every(line => !line.startsWith(' ') || !line.startsWith('\t'));
    
    return {
      average: avgIndent,
      consistent: hasTabsConsistency,
      type: content.includes('\t') ? 'tabs' : 'spaces'
    };
  }

  calculateReadability(content, fileType) {
    // 간단한 가독성 점수
    const lines = content.split('\n');
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const complexity = content.split(/[{}()[\]]/).length / lines.length;
    
    let score = 10;
    if (avgLineLength > 120) score -= 2;
    if (complexity > 5) score -= 2;
    if (lines.length > 1000) score -= 1;
    
    return Math.max(0, Math.min(10, score));
  }

  calculateMaintainability(content, extension) {
    let score = 10;
    
    // 함수 길이 체크
    if (extension === '.js' || extension === '.py') {
      const functions = content.match(/function\s+\w+|def\s+\w+/g) || [];
      const avgFunctionLength = content.split('\n').length / Math.max(functions.length, 1);
      if (avgFunctionLength > 50) score -= 2;
    }
    
    // 주석 비율 체크
    const commentLines = content.split('\n').filter(line => 
      line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('/*')
    ).length;
    const totalLines = content.split('\n').length;
    const commentRatio = commentLines / totalLines;
    
    if (commentRatio < 0.1) score -= 1;
    else if (commentRatio > 0.3) score += 1;
    
    return Math.max(0, Math.min(10, score));
  }

  calculateConsistency(content) {
    const lines = content.split('\n');
    let consistencyScore = 10;
    
    // 들여쓰기 일관성
    const indentPattern = /^(\s*)/;
    const indentTypes = new Set();
    lines.forEach(line => {
      const match = line.match(indentPattern);
      if (match && match[1]) {
        if (match[1].includes('\t')) indentTypes.add('tab');
        if (match[1].includes(' ')) indentTypes.add('space');
      }
    });
    
    if (indentTypes.size > 1) consistencyScore -= 2;
    
    return Math.max(0, Math.min(10, consistencyScore));
  }

  calculateComplexity(content, fileType) {
    if (fileType !== 'code') return 0;
    
    // 간단한 복잡도 계산
    const controlStructures = content.match(/\b(if|for|while|switch|case|catch|try)\b/g) || [];
    const nestingLevel = Math.max(...content.split('\n').map(line => {
      const indent = line.match(/^(\s*)/);
      return indent ? indent[1].length / 2 : 0;
    }));
    
    const complexity = controlStructures.length + nestingLevel;
    return Math.min(10, complexity);
  }

  calculateDocumentation(content, fileType) {
    if (fileType !== 'code' && fileType !== 'text') return 5;
    
    const docPatterns = [
      /\/\*\*[\s\S]*?\*\//g, // JSDoc
      /"""[\s\S]*?"""/g,     // Python docstring
      /#\s+\w+/g,            // Markdown headers
      /\/\/\s+\w+/g          // Single line comments
    ];
    
    let docScore = 0;
    docPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) docScore += matches.length;
    });
    
    const lines = content.split('\n').length;
    const docRatio = docScore / Math.max(lines / 10, 1);
    
    return Math.min(10, docRatio * 2);
  }

  detectQualityIssues(content, fileInfo) {
    const issues = [];
    
    // 긴 줄 감지
    const longLines = content.split('\n').filter(line => line.length > 120);
    if (longLines.length > 0) {
      issues.push({
        type: 'long_lines',
        severity: 'low',
        count: longLines.length,
        description: '120자 이상의 긴 줄이 감지되었습니다'
      });
    }
    
    // 빈 줄 과다 감지
    const emptyLines = content.split('\n').filter(line => line.trim() === '');
    const totalLines = content.split('\n').length;
    if (emptyLines.length / totalLines > 0.3) {
      issues.push({
        type: 'excessive_empty_lines',
        severity: 'low',
        description: '빈 줄이 과도하게 많습니다'
      });
    }
    
    // TODO/FIXME 주석 감지
    const todoComments = content.match(/(TODO|FIXME|HACK):/gi);
    if (todoComments) {
      issues.push({
        type: 'todo_comments',
        severity: 'medium',
        count: todoComments.length,
        description: '미완성 작업이나 수정이 필요한 부분이 있습니다'
      });
    }
    
    return issues;
  }

  getSeverity(type) {
    const severityMap = {
      password: 5,
      api_key: 4,
      secret: 5,
      token: 3,
      credit_card: 5,
      ssn: 5
    };
    return severityMap[type] || 1;
  }

  detectCodeVulnerabilities(content, extension) {
    const vulnerabilities = [];
    
    // SQL 인젝션 패턴
    if (content.match(/query.*\+.*req\.|SELECT.*\+|INSERT.*\+/gi)) {
      vulnerabilities.push({
        type: 'sql_injection',
        severity: 'high',
        description: 'SQL 인젝션 가능성이 있는 코드가 감지되었습니다'
      });
    }
    
    // eval 사용
    if (content.match(/eval\s*\(/gi)) {
      vulnerabilities.push({
        type: 'code_injection',
        severity: 'high',
        description: 'eval 함수 사용으로 인한 코드 인젝션 위험이 있습니다'
      });
    }
    
    return vulnerabilities;
  }

  generateSecurityRecommendations(security) {
    const recommendations = [];
    
    if (security.sensitiveData.length > 0) {
      recommendations.push('민감한 데이터를 환경변수나 별도의 설정 파일로 분리하세요');
    }
    
    if (security.vulnerabilities.length > 0) {
      recommendations.push('보안 취약점을 수정하고 코드 리뷰를 실시하세요');
    }
    
    if (security.securityScore < 7) {
      recommendations.push('전반적인 보안 수준을 향상시키는 것을 권장합니다');
    }
    
    return recommendations;
  }

  async loadAnalysisHistory() {
    try {
      const history = await this.cache.get('analysis-history') || {};
      Object.entries(history).forEach(([path, analysis]) => {
        this.analysisHistory.set(path, analysis);
      });
    } catch (error) {
      logger.warn('분석 히스토리 로드 실패:', error);
    }
  }

  async loadContentSignatures() {
    try {
      const signatures = await this.cache.get('content-signatures') || {};
      Object.entries(signatures).forEach(([path, signature]) => {
        this.contentSignatures.set(path, signature);
      });
    } catch (error) {
      logger.warn('컨텐츠 시그니처 로드 실패:', error);
    }
  }

  async loadSimilarityIndex() {
    try {
      const index = await this.cache.get('similarity-index') || {};
      Object.entries(index).forEach(([path, similarity]) => {
        this.similarityIndex.set(path, similarity);
      });
    } catch (error) {
      logger.warn('유사성 인덱스 로드 실패:', error);
    }
  }

  async cacheAnalysisResults(results) {
    try {
      // 분석 결과를 캐시에 저장
      await this.cache.set('last-analysis-results', results, 3600);
      
      // 개별 파일 분석 결과 저장
      results.fileAnalysis.forEach(async (analysis) => {
        if (analysis.contentHash) {
          this.contentSignatures.set(analysis.path, analysis.contentHash);
        }
      });
      
      // 시그니처 캐시 저장
      const signatures = Object.fromEntries(this.contentSignatures.entries());
      await this.cache.set('content-signatures', signatures, 86400);
      
    } catch (error) {
      logger.error('분석 결과 캐싱 실패:', error);
    }
  }

  consolidateDuplicates(fileAnalysis) {
    const duplicateGroups = [];
    const processed = new Set();

    fileAnalysis.forEach(file => {
      if (processed.has(file.path)) return;
      
      const duplicates = fileAnalysis.filter(other => 
        other.path !== file.path && 
        other.contentHash === file.contentHash
      );

      if (duplicates.length > 0) {
        const group = [file, ...duplicates];
        duplicateGroups.push({
          files: group.map(f => f.path),
          size: file.size,
          totalWaste: file.size * (group.length - 1),
          hash: file.contentHash
        });
        
        group.forEach(f => processed.add(f.path));
      }
    });

    return duplicateGroups;
  }

  groupSimilarFiles(fileAnalysis) {
    // 유사 파일 그룹화 로직
    return [];
  }

  categorizeFiles(fileAnalysis) {
    const categories = {};
    
    fileAnalysis.forEach(file => {
      const category = this.determineCategory(file);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(file.path);
    });
    
    return categories;
  }

  determineCategory(file) {
    if (file.type === 'code') return 'source_code';
    if (file.type === 'image') return 'images';
    if (file.type === 'document') return 'documents';
    if (file.extension === '.md') return 'documentation';
    if (file.extension === '.json') return 'configuration';
    return 'others';
  }

  async generateGlobalRecommendations(analysisResults) {
    const recommendations = [];
    
    // 중복 파일 정리 추천
    if (analysisResults.duplicates.length > 0) {
      const totalWaste = analysisResults.duplicates.reduce((sum, dup) => sum + dup.totalWaste, 0);
      recommendations.push({
        type: 'cleanup',
        priority: 'high',
        description: `${analysisResults.duplicates.length}개의 중복 파일 그룹으로 ${this.formatFileSize(totalWaste)} 절약 가능`,
        action: 'remove_duplicates'
      });
    }
    
    // 대용량 파일 정리 추천
    const largeFiles = analysisResults.fileAnalysis.filter(f => f.size > 100 * 1024 * 1024);
    if (largeFiles.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        description: `${largeFiles.length}개의 대용량 파일 검토 필요`,
        action: 'review_large_files'
      });
    }
    
    return recommendations;
  }

  consolidateOptimizations(fileAnalysis) {
    const optimizations = [];
    
    fileAnalysis.forEach(file => {
      if (file.analysis.optimization) {
        optimizations.push({
          file: file.path,
          suggestions: file.analysis.optimization.optimization,
          savings: file.analysis.optimization.savings
        });
      }
    });
    
    return optimizations;
  }

  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  async calculateQualityScore(analysis) {
    const scores = analysis.analysis;
    const weights = {
      content: 0.2,
      structure: 0.2,
      quality: 0.4,
      syntax: 0.2
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([key, weight]) => {
      if (scores[key] && scores[key].score) {
        totalScore += scores[key].score * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 5;
  }

  async generateImprovementSuggestions(analysis) {
    const suggestions = [];
    
    // 품질 기반 제안
    if (analysis.quality && analysis.quality.score < 6) {
      suggestions.push({
        type: 'quality',
        priority: 'medium',
        description: '파일 품질 개선이 필요합니다',
        specific: analysis.quality.issues || []
      });
    }
    
    // 보안 기반 제안
    if (analysis.analysis.security && analysis.analysis.security.securityScore < 7) {
      suggestions.push({
        type: 'security',
        priority: 'high',
        description: '보안 검토가 필요합니다',
        specific: analysis.analysis.security.recommendations || []
      });
    }
    
    return suggestions;
  }

  async performBasicAnalysis(filePath, fileInfo) {
    return {
      analyzed: true,
      type: 'basic',
      timestamp: Date.now()
    };
  }

  // 간략화된 검증 메서드들
  validateJson(content) {
    try {
      JSON.parse(content);
      return { valid: true, errors: [] };
    } catch (error) {
      return { valid: false, errors: [{ message: error.message, type: 'syntax' }] };
    }
  }

  validateJavaScript(content) {
    // 간단한 JavaScript 검증
    const errors = [];
    
    // 기본적인 구문 오류 감지
    const unclosedBraces = (content.match(/{/g) || []).length - (content.match(/}/g) || []).length;
    if (unclosedBraces !== 0) {
      errors.push({ message: '중괄호가 맞지 않습니다', type: 'syntax' });
    }
    
    return { valid: errors.length === 0, errors };
  }

  validateCss(content) {
    const errors = [];
    
    // 기본적인 CSS 검증
    const unclosedBraces = (content.match(/{/g) || []).length - (content.match(/}/g) || []).length;
    if (unclosedBraces !== 0) {
      errors.push({ message: 'CSS 중괄호가 맞지 않습니다', type: 'syntax' });
    }
    
    return { valid: errors.length === 0, errors };
  }

  validateHtml(content) {
    // 간단한 HTML 검증
    const errors = [];
    
    // 닫히지 않은 태그 검사 (매우 기본적)
    const openTags = content.match(/<[a-zA-Z][^>]*>/g) || [];
    const closeTags = content.match(/<\/[a-zA-Z][^>]*>/g) || [];
    
    if (openTags.length !== closeTags.length) {
      errors.push({ message: 'HTML 태그가 올바르게 닫히지 않았을 수 있습니다', type: 'structure' });
    }
    
    return { valid: errors.length === 0, errors };
  }

  validateMarkdown(content) {
    // 마크다운 검증
    const warnings = [];
    
    // 링크 검사
    const brokenLinks = content.match(/\[([^\]]+)\]\(\)/g);
    if (brokenLinks) {
      warnings.push({ message: '빈 링크가 발견되었습니다', type: 'content' });
    }
    
    return { valid: true, warnings };
  }

  extractJsDependencies(content) {
    const imports = [];
    const exports = [];
    
    // import 문 추출
    const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const moduleMatch = match.match(/from\s+['"]([^'"]+)['"]/);
        if (moduleMatch) {
          imports.push(moduleMatch[1]);
        }
      });
    }
    
    // export 문 추출
    const exportMatches = content.match(/export\s+(default\s+)?/g);
    if (exportMatches) {
      exports.push(...exportMatches);
    }
    
    return { imports, exports };
  }

  extractPythonDependencies(content) {
    const imports = [];
    
    // import 문 추출
    const importMatches = content.match(/^(import|from)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm);
    if (importMatches) {
      importMatches.forEach(match => {
        const moduleMatch = match.match(/(?:import|from)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (moduleMatch) {
          imports.push(moduleMatch[1]);
        }
      });
    }
    
    return { imports };
  }

  extractJavaDependencies(content) {
    const imports = [];
    
    // import 문 추출
    const importMatches = content.match(/import\s+([a-zA-Z_][a-zA-Z0-9_.]*);/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const moduleMatch = match.match(/import\s+([a-zA-Z_][a-zA-Z0-9_.]*);/);
        if (moduleMatch) {
          imports.push(moduleMatch[1]);
        }
      });
    }
    
    return { imports };
  }

  calculateCompressionPotential(content) {
    // 간단한 압축 가능성 계산
    const originalSize = content.length;
    const uniqueChars = new Set(content).size;
    
    // 문자 다양성이 낮을수록 압축 가능성이 높음
    const diversity = uniqueChars / 256; // ASCII 기준
    return Math.max(0, 1 - diversity);
  }

  calculateRedundancy(content, fileType) {
    // 중복성 계산
    const lines = content.toString().split('\n');
    const uniqueLines = new Set(lines.map(line => line.trim())).size;
    
    return lines.length > 0 ? 1 - (uniqueLines / lines.length) : 0;
  }

  generateOptimizationSuggestions(fileInfo, content) {
    const suggestions = [];
    
    if (fileInfo.type === 'image') {
      suggestions.push({
        type: 'compression',
        description: '이미지 압축으로 용량 절약 가능',
        tool: 'image_optimizer'
      });
    }
    
    if (fileInfo.extension === '.js' && content.length > 100000) {
      suggestions.push({
        type: 'minification',
        description: 'JavaScript 압축으로 용량 절약 가능',
        tool: 'js_minifier'
      });
    }
    
    return suggestions;
  }

  calculatePotentialSavings(fileInfo, optimization) {
    let savings = 0;
    
    // 압축 가능성에 따른 절약 계산
    if (optimization.compressionPotential > 0.5) {
      savings = fileInfo.size * optimization.compressionPotential * 0.5;
    }
    
    return {
      size: Math.round(savings),
      percentage: Math.round((savings / fileInfo.size) * 100)
    };
  }

  analyzeJsonStructure(content) {
    try {
      const parsed = JSON.parse(content);
      return {
        type: Array.isArray(parsed) ? 'array' : 'object',
        depth: this.calculateObjectDepth(parsed),
        keys: Object.keys(parsed).length
      };
    } catch {
      return { error: 'invalid_json' };
    }
  }

  calculateObjectDepth(obj, depth = 0) {
    if (typeof obj !== 'object' || obj === null) return depth;
    
    let maxDepth = depth;
    for (const value of Object.values(obj)) {
      const valueDepth = this.calculateObjectDepth(value, depth + 1);
      maxDepth = Math.max(maxDepth, valueDepth);
    }
    
    return maxDepth;
  }

  analyzeMarkdownStructure(content) {
    const sections = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        sections.push({
          level: headerMatch[1].length,
          title: headerMatch[2],
          line: index + 1
        });
      }
    });
    
    return sections;
  }

  analyzeHtmlStructure(content) {
    // 간단한 HTML 구조 분석
    const tags = content.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g) || [];
    const tagCounts = {};
    
    tags.forEach(tag => {
      const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9]*)/);
      if (tagName) {
        const name = tagName[1].toLowerCase();
        tagCounts[name] = (tagCounts[name] || 0) + 1;
      }
    });
    
    return {
      totalTags: tags.length,
      uniqueTags: Object.keys(tagCounts).length,
      tagDistribution: tagCounts
    };
  }

  analyzeCssStructure(content) {
    const sections = [];
    
    // CSS 규칙 추출
    const rules = content.match(/[^{}]+\{[^{}]*\}/g) || [];
    
    rules.forEach((rule, index) => {
      const selectorMatch = rule.match(/^([^{]+)\{/);
      if (selectorMatch) {
        sections.push({
          selector: selectorMatch[1].trim(),
          index: index
        });
      }
    });
    
    return sections;
  }

  analyzeGeneralPatterns(content) {
    const patterns = [];
    
    // 반복되는 패턴 감지
    const lines = content.split('\n');
    const linePatterns = {};
    
    lines.forEach(line => {
      const pattern = line.replace(/\d+/g, '#').replace(/\w+/g, 'WORD');
      linePatterns[pattern] = (linePatterns[pattern] || 0) + 1;
    });
    
    Object.entries(linePatterns)
      .filter(([pattern, count]) => count > 2 && pattern.length > 10)
      .forEach(([pattern, count]) => {
        patterns.push({
          pattern,
          occurrences: count,
          type: 'line_repetition'
        });
      });
    
    return patterns;
  }

  async extractImageMetadata(filePath) {
    // 이미지 메타데이터 추출 (간단한 버전)
    try {
      const stats = await fs.stat(filePath);
      return {
        fileSize: stats.size,
        // 실제 구현에서는 EXIF 데이터 등을 추출
        format: path.extname(filePath).slice(1).toUpperCase()
      };
    } catch {
      return {};
    }
  }

  async extractDocumentMetadata(filePath) {
    // 문서 메타데이터 추출
    return {
      format: path.extname(filePath).slice(1).toUpperCase()
    };
  }

  async extractJsonMetadata(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      
      return {
        type: Array.isArray(parsed) ? 'array' : 'object',
        size: Object.keys(parsed).length,
        hasNested: typeof Object.values(parsed)[0] === 'object'
      };
    } catch {
      return {};
    }
  }
}

// 세마포어 클래스 (동시 실행 제한용)
class Semaphore {
  constructor(permits) {
    this.permits = permits;
    this.waitQueue = [];
  }

  async acquire() {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release() {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      this.permits--;
      resolve();
    }
  }
}

export default IntelligentFileAnalyzer;