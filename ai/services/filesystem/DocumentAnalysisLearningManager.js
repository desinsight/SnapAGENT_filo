/**
 * DocumentAnalysisLearningManager.js
 * 문서 분석 결과를 영구적으로 저장하고 학습 데이터로 활용하는 관리자
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Logger } from '../../common/Logger.js';

const logger = Logger.component('DocumentAnalysisLearningManager');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class DocumentAnalysisLearningManager {
  constructor() {
    // 항상 프로젝트 루트(ai/data/ai_learning/...) 기준으로 경로 고정
    this.dataPath = path.join(__dirname, '../../data/ai_learning/document_analysis_history.json');
    this.data = null;
    this.isInitialized = false;
  }

  /**
   * 학습 데이터 초기화
   */
  async initialize() {
    try {
      await this.loadData();
      this.isInitialized = true;
      logger.success('문서 분석 학습 관리자 초기화 완료');
    } catch (error) {
      logger.error('문서 분석 학습 관리자 초기화 실패', error);
      throw error;
    }
  }

  /**
   * 데이터 로드
   */
  async loadData() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      this.data = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 파일이 없으면 기본 구조 생성
        this.data = {
          metadata: {
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            totalAnalyses: 0,
            totalFiles: 0,
            supportedFormats: ['txt', 'docx', 'xlsx', 'pptx', 'pdf', 'hwp', 'csv', 'json', 'xml', 'yaml']
          },
          analyses: {},
          filePatterns: {},
          contentPatterns: {},
          formatStats: {
            txt: { count: 0, totalSize: 0, avgSize: 0 },
            docx: { count: 0, totalSize: 0, avgSize: 0 },
            xlsx: { count: 0, totalSize: 0, avgSize: 0 },
            pptx: { count: 0, totalSize: 0, avgSize: 0 },
            pdf: { count: 0, totalSize: 0, avgSize: 0 },
            hwp: { count: 0, totalSize: 0, avgSize: 0 },
            csv: { count: 0, totalSize: 0, avgSize: 0 },
            json: { count: 0, totalSize: 0, avgSize: 0 },
            xml: { count: 0, totalSize: 0, avgSize: 0 },
            yaml: { count: 0, totalSize: 0, avgSize: 0 }
          },
          learningInsights: {
            commonKeywords: {},
            documentTypes: {},
            sizePatterns: {},
            contentCategories: {}
          }
        };
        await this.saveData();
      } else {
        throw error;
      }
    }
  }

  /**
   * 데이터 저장
   */
  async saveData() {
    try {
      this.data.metadata.lastUpdated = Date.now();
      await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      logger.error('문서 분석 학습 데이터 저장 실패', error);
      throw error;
    }
  }

  /**
   * 문서 분석 결과 저장
   */
  async saveAnalysisResult(filePath, analysisResult) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const fileId = this.generateFileId(filePath);
      const fileExt = path.extname(filePath).toLowerCase().slice(1);
      const fileSize = analysisResult.fileInfo?.size || 0;

      // 분석 결과 저장
      this.data.analyses[fileId] = {
        filePath,
        fileExt,
        fileSize,
        analysisResult,
        analyzedAt: Date.now(),
        analysisDuration: analysisResult.analysisDuration || 0
      };

      // 통계 업데이트
      this.updateFormatStats(fileExt, fileSize);
      this.updateLearningInsights(analysisResult);
      this.updateFilePatterns(filePath, fileExt);

      // 메타데이터 업데이트
      this.data.metadata.totalAnalyses++;
      this.data.metadata.totalFiles = Object.keys(this.data.analyses).length;

      await this.saveData();
      logger.success(`문서 분석 결과 저장 완료: ${filePath}`);
      
      return {
        success: true,
        fileId,
        message: '분석 결과가 학습 데이터에 저장되었습니다.'
      };
    } catch (error) {
      logger.error('문서 분석 결과 저장 실패', error);
      throw error;
    }
  }

  /**
   * 파일 ID 생성
   */
  generateFileId(filePath) {
    const hash = crypto.createHash('md5').update(filePath).digest('hex');
    return `file_${hash}_${Date.now()}`;
  }

  /**
   * 포맷별 통계 업데이트
   */
  updateFormatStats(fileExt, fileSize) {
    if (this.data.formatStats[fileExt]) {
      const stats = this.data.formatStats[fileExt];
      stats.count++;
      stats.totalSize += fileSize;
      stats.avgSize = Math.round(stats.totalSize / stats.count);
    }
  }

  /**
   * 학습 인사이트 업데이트
   */
  updateLearningInsights(analysisResult) {
    const { content, keywords, documentType, contentCategory } = analysisResult;

    // 키워드 빈도 업데이트
    if (keywords && Array.isArray(keywords)) {
      keywords.forEach(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        this.data.learningInsights.commonKeywords[lowerKeyword] = 
          (this.data.learningInsights.commonKeywords[lowerKeyword] || 0) + 1;
      });
    }

    // 문서 타입 분류
    if (documentType) {
      this.data.learningInsights.documentTypes[documentType] = 
        (this.data.learningInsights.documentTypes[documentType] || 0) + 1;
    }

    // 콘텐츠 카테고리
    if (contentCategory) {
      this.data.learningInsights.contentCategories[contentCategory] = 
        (this.data.learningInsights.contentCategories[contentCategory] || 0) + 1;
    }

    // 크기 패턴 (KB 단위로 그룹화)
    const sizeKB = Math.floor((analysisResult.fileInfo?.size || 0) / 1024);
    const sizeGroup = sizeKB < 10 ? 'small' : sizeKB < 100 ? 'medium' : 'large';
    this.data.learningInsights.sizePatterns[sizeGroup] = 
      (this.data.learningInsights.sizePatterns[sizeGroup] || 0) + 1;
  }

  /**
   * 파일 패턴 업데이트
   */
  updateFilePatterns(filePath, fileExt) {
    const dirPath = path.dirname(filePath);
    if (!this.data.filePatterns[dirPath]) {
      this.data.filePatterns[dirPath] = {};
    }
    this.data.filePatterns[dirPath][fileExt] = 
      (this.data.filePatterns[dirPath][fileExt] || 0) + 1;
  }

  /**
   * 학습 데이터 조회
   */
  async getLearningData(options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { 
      format, 
      dateRange, 
      minSize, 
      maxSize, 
      keywords,
      limit = 100 
    } = options;

    let filteredAnalyses = Object.values(this.data.analyses);

    // 포맷 필터
    if (format) {
      filteredAnalyses = filteredAnalyses.filter(analysis => 
        analysis.fileExt === format.toLowerCase()
      );
    }

    // 날짜 범위 필터
    if (dateRange) {
      const { start, end } = dateRange;
      filteredAnalyses = filteredAnalyses.filter(analysis => {
        const analyzedAt = analysis.analyzedAt;
        return (!start || analyzedAt >= start) && (!end || analyzedAt <= end);
      });
    }

    // 크기 필터
    if (minSize || maxSize) {
      filteredAnalyses = filteredAnalyses.filter(analysis => {
        const size = analysis.fileSize;
        return (!minSize || size >= minSize) && (!maxSize || size <= maxSize);
      });
    }

    // 키워드 필터
    if (keywords && Array.isArray(keywords)) {
      filteredAnalyses = filteredAnalyses.filter(analysis => {
        const content = analysis.analysisResult.content || '';
        const analysisKeywords = analysis.analysisResult.keywords || [];
        return keywords.some(keyword => 
          content.toLowerCase().includes(keyword.toLowerCase()) ||
          analysisKeywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
        );
      });
    }

    // 정렬 및 제한
    filteredAnalyses.sort((a, b) => b.analyzedAt - a.analyzedAt);
    filteredAnalyses = filteredAnalyses.slice(0, limit);

    return {
      analyses: filteredAnalyses,
      metadata: this.data.metadata,
      formatStats: this.data.formatStats,
      learningInsights: this.data.learningInsights,
      totalResults: filteredAnalyses.length
    };
  }

  /**
   * 통계 정보 조회
   */
  async getStatistics() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return {
      metadata: this.data.metadata,
      formatStats: this.data.formatStats,
      learningInsights: this.data.learningInsights,
      topKeywords: this.getTopKeywords(10),
      topDocumentTypes: this.getTopDocumentTypes(10),
      sizeDistribution: this.data.learningInsights.sizePatterns
    };
  }

  /**
   * 상위 키워드 조회
   */
  getTopKeywords(limit = 10) {
    return Object.entries(this.data.learningInsights.commonKeywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([keyword, count]) => ({ keyword, count }));
  }

  /**
   * 상위 문서 타입 조회
   */
  getTopDocumentTypes(limit = 10) {
    return Object.entries(this.data.learningInsights.documentTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * 특정 파일의 분석 이력 조회
   */
  async getFileAnalysisHistory(filePath) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return Object.values(this.data.analyses)
      .filter(analysis => analysis.filePath === filePath)
      .sort((a, b) => b.analyzedAt - a.analyzedAt);
  }

  /**
   * 학습 데이터 백업
   */
  async backup() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const backupPath = path.join(
        process.cwd(), 
        'ai', 
        'data', 
        'ai_learning', 
        'backups',
        `document_analysis_backup_${Date.now()}.json`
      );
      
      await fs.writeFile(backupPath, JSON.stringify(this.data, null, 2), 'utf8');
      logger.success(`문서 분석 학습 데이터 백업 완료: ${backupPath}`);
      
      return { success: true, backupPath };
    } catch (error) {
      logger.error('문서 분석 학습 데이터 백업 실패', error);
      throw error;
    }
  }
} 