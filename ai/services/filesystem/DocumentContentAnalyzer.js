import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../../common/Logger.js';
import { DocumentAnalysisLearningManager } from './DocumentAnalysisLearningManager.js';
import { PDFAnalyzer } from './PDFAnalyzer.js';
import { HwpAnalyzer } from './HwpAnalyzer.js';
import { PowerPointAnalyzer } from './PowerPointAnalyzer.js';
import { ExcelAnalyzer } from './ExcelAnalyzer.js';
import { WordAnalyzer } from './WordAnalyzer.js';

const logger = Logger.component('DocumentContentAnalyzer');

/**
 * 📄 문서 내용 분석기
 * 한글(.hwp), 엑셀(.xlsx), 워드(.docx), PDF 등 다양한 문서 형식의 내용을 분석
 */
class DocumentContentAnalyzer {
  constructor() {
    this.supportedFormats = {
      // 텍스트 문서
      '.txt': 'analyzeTextFile',
      '.md': 'analyzeTextFile',
      '.rtf': 'analyzeTextFile',
      
      // Microsoft Office 문서
      '.doc': 'analyzeWordFile',
      '.docx': 'analyzeWordFile',
      '.xls': 'analyzeExcelFile',
      '.xlsx': 'analyzeExcelFile',
      '.ppt': 'analyzePowerPointFile',
      '.pptx': 'analyzePowerPointFile',
      
      // PDF 문서
      '.pdf': 'analyzePdfFile',
      
      // 한글 문서 (제한적 지원)
      '.hwp': 'analyzeHwpFile',
      '.hml': 'analyzeHwpFile',
      
      // 기타 문서
      '.csv': 'analyzeCsvFile',
      '.json': 'analyzeJsonFile',
      '.xml': 'analyzeXmlFile',
      '.yaml': 'analyzeYamlFile',
      '.yml': 'analyzeYamlFile'
    };
    
    this.maxFileSize = 5 * 1024 * 1024 * 1024; // 5GB (내역서 등 중요 문서를 위해)
    
    // 학습 관리자 초기화
    this.learningManager = new DocumentAnalysisLearningManager();
    
    // PDF 분석기 초기화
    this.pdfAnalyzer = new PDFAnalyzer();
    
    // 한글 분석기 초기화
    this.hwpAnalyzer = new HwpAnalyzer();
    
    // PowerPoint 분석기 초기화
    this.powerPointAnalyzer = new PowerPointAnalyzer();
    
    // Excel 분석기 초기화
    this.excelAnalyzer = new ExcelAnalyzer();
    
    // Word 분석기 초기화
    this.wordAnalyzer = new WordAnalyzer();
  }

  /**
   * 📏 파일 크기 포맷팅
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 📄 문서 내용 분석 메인 함수
   */
  async analyzeDocument(filePath, options = {}) {
    const startTime = Date.now();
    
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // 파일 크기 체크
      if (stats.size > this.maxFileSize) {
        return {
          success: false,
          error: '파일이 너무 큽니다 (100MB 초과)',
          path: filePath,
          size: stats.size
        };
      }
      
      // 지원 형식 체크
      if (!this.supportedFormats[ext]) {
        return {
          success: false,
          error: '지원하지 않는 문서 형식입니다',
          path: filePath,
          extension: ext
        };
      }
      
      // 분석 실행
      const methodName = this.supportedFormats[ext];
      const analyzer = this[methodName];
      const result = await analyzer.call(this, filePath, stats);
      
      const analysisDuration = Date.now() - startTime;
      
      // 분석 결과 구성
      const analysisResult = {
        success: true,
        path: filePath,
        extension: ext,
        size: stats.size,
        modified: stats.mtime,
        analysis: result,
        fileInfo: {
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime
        },
        analysisDuration,
        content: result.content || '',
        keywords: result.analysis?.keywords || [],
        documentType: result.type || 'unknown',
        contentCategory: this.categorizeContent(result.content || ''),
        language: result.analysis?.language || 'unknown',
        sentiment: result.analysis?.sentiment || 'neutral',
        readability: result.analysis?.readability || 0
      };
      
      // 학습 데이터에 저장
      try {
        await this.learningManager.saveAnalysisResult(filePath, analysisResult);
        logger.success(`문서 분석 결과가 학습 데이터에 저장되었습니다: ${filePath}`);
      } catch (learningError) {
        logger.warn(`학습 데이터 저장 실패 (분석은 성공): ${learningError.message}`);
      }
      
      // 분석 결과 자동 저장 (AI용)
      try {
        const saveResult = await this.saveAnalysisResult(filePath, analysisResult, options.saveDir);
        
        if (saveResult.success) {
          logger.success(`💾 분석 결과 자동 저장 완료: ${saveResult.savedPath}`);
        } else {
          logger.warn(`⚠️ 분석 결과 자동 저장 실패: ${saveResult.error}`);
        }
      } catch (saveError) {
        logger.warn(`⚠️ 분석 결과 자동 저장 중 오류: ${saveError.message}`);
      }
      
      return analysisResult;
      
    } catch (error) {
      logger.error(`문서 분석 실패: ${filePath}`, error);
      return {
        success: false,
        error: error.message,
        path: filePath,
        technical_error: error.stack
      };
    }
  }

  /**
   * 📝 텍스트 파일 분석
   */
  async analyzeTextFile(filePath, stats) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        type: 'text',
        content: content,
        summary: {
          lines: content.split('\n').length,
          characters: content.length,
          words: content.split(/\s+/).filter(word => word.length > 0).length,
          paragraphs: content.split(/\n\s*\n/).length,
          encoding: 'utf-8'
        },
        analysis: {
          language: this.detectLanguage(content),
          keywords: this.extractKeywords(content),
          sentiment: this.analyzeSentiment(content),
          readability: this.calculateReadability(content)
        }
      };
    } catch (error) {
      throw new Error(`텍스트 파일 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 📄 Word 문서 분석
   */
  async analyzeWordFile(filePath, stats) {
    try {
      logger.info(`🔍 [Word 분석] 시작: ${filePath}`);
      
      // WordAnalyzer를 사용하여 완전한 분석 수행
      const result = await this.wordAnalyzer.analyzeComplete(filePath);
      
      if (!result.success) {
        throw new Error(result.error || 'Word 문서 분석 실패');
      }
      
      // 분석 결과를 표준 형식으로 변환
      const content = result.content || '';
      const structure = result.structure || {};
      const metadata = result.metadata || {};
      
      return {
        type: 'word',
        content: content,
        summary: {
          lines: content.split('\n').length,
          characters: content.length,
          words: structure.words || content.split(/\s+/).filter(word => word.length > 0).length,
          paragraphs: structure.paragraphs || content.split(/\n\s*\n/).length,
          encoding: 'utf-8',
          fileSize: stats.size,
          fileSizeFormatted: this.formatSize(stats.size),
          title: metadata.title || path.basename(filePath, path.extname(filePath)),
          author: metadata.author || '',
          format: result.basicInfo?.format || 'unknown'
        },
        analysis: {
          language: result.analysis?.language || this.detectLanguage(content),
          keywords: result.analysis?.keywords || this.extractKeywords(content),
          sentiment: result.analysis?.sentiment || this.analyzeSentiment(content),
          readability: result.analysis?.readability || this.calculateReadability(content),
          structure: structure,
          statistics: result.analysis?.statistics || {},
          confidence: result.analysis?.confidence || 0.0,
          extractionMethod: result.analysis?.extractionMethod || 'unknown'
        },
        metadata: {
          warnings: result.analysis?.warnings || [],
          hasImages: structure.hasImages || content.includes('[이미지]') || content.includes('[Image]'),
          hasTables: structure.hasTables || content.includes('[표]') || content.includes('[Table]'),
          hasHeaders: structure.hasHeaders || false,
          hasLists: structure.hasLists || false,
          hasMacros: metadata.hasMacros || false,
          hasEmbeddedObjects: metadata.hasEmbeddedObjects || false,
          sections: structure.sections || [],
          headings: structure.headings || [],
          documentProperties: metadata.documentProperties || {},
          extractedAt: new Date().toISOString(),
          analysisVersion: '3.0-premium'
        }
      };
    } catch (error) {
      logger.error(`❌ [Word 분석] 오류: ${error.message}`);
      throw new Error(`Word 문서 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 📊 콘텐츠 분류
   */
  categorizeContent(content) {
    // content가 문자열이 아닌 경우 안전하게 처리
    if (typeof content !== 'string') {
      return 'general';
    }
    
    const text = content.toLowerCase();
    
    // 기술 문서
    if (text.includes('api') || text.includes('function') || text.includes('class') || 
        text.includes('method') || text.includes('parameter') || text.includes('return')) {
      return 'technical';
    }
    
    // 비즈니스 문서
    if (text.includes('business') || text.includes('marketing') || text.includes('sales') ||
        text.includes('revenue') || text.includes('profit') || text.includes('customer')) {
      return 'business';
    }
    
    // 학술 문서
    if (text.includes('research') || text.includes('study') || text.includes('analysis') ||
        text.includes('data') || text.includes('result') || text.includes('conclusion')) {
      return 'academic';
    }
    
    // 개인 문서
    if (text.includes('personal') || text.includes('diary') || text.includes('note') ||
        text.includes('memo') || text.includes('todo') || text.includes('reminder')) {
      return 'personal';
    }
    
    // 뉴스/미디어
    if (text.includes('news') || text.includes('article') || text.includes('report') ||
        text.includes('media') || text.includes('press') || text.includes('announcement')) {
      return 'news';
    }
    
    return 'general';
  }

  /**
   * 📊 Excel 문서 분석 (국내 최고급으로 업그레이드)
   */
  async analyzeExcelFile(filePath, stats) {
    try {
      logger.info(`🔍 [Excel 분석] 시작: ${filePath}`);
      
      // ExcelAnalyzer를 사용하여 완전한 분석 수행 (고급 분석 활성화)
      const result = await this.excelAnalyzer.analyzeComplete(filePath, {
        enableAdvancedAnalysis: true,
        enableML: true,
        enableTimeSeries: true,
        enableClustering: true
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Excel 문서 분석 실패');
      }
      
      // 분석 결과를 표준 형식으로 변환
      const content = result.content || '';
      const structure = result.structure || {};
      const metadata = result.metadata || {};
      
      return {
        type: 'excel',
        content: content,
        summary: {
          totalSheets: structure.sheets || 0,
          totalRows: structure.totalRows || 0,
          totalCells: structure.totalCells || 0,
          hasFormulas: metadata.hasFormulas || false,
          hasCharts: metadata.hasCharts || false,
          fileFormat: result.basicInfo?.format || 'unknown',
          workbookProperties: metadata.workbookProperties || {},
          fileSize: stats.size,
          fileSizeFormatted: this.formatSize(stats.size)
        },
        analysis: {
          dataTypes: result.analysis?.dataTypes || {},
          patterns: result.analysis?.patterns || {},
          statistics: result.analysis?.statistics || {},
          insights: result.analysis?.businessInsights || {},
          language: result.analysis?.language || 'unknown',
          confidence: result.analysis?.confidence || 0.0,
          extractionMethod: result.analysis?.extractionMethod || 'unknown'
        },
        metadata: {
          sheets: structure.sheetDetails?.map(sheet => sheet.name) || [],
          fileFormat: result.basicInfo?.format || 'unknown',
          extractedAt: new Date().toISOString(),
          analysisVersion: '3.0-premium',
          title: metadata.title || path.basename(filePath, path.extname(filePath)),
          author: metadata.author || '',
          subject: metadata.subject || '',
          created: metadata.created || stats.birthtime,
          modified: metadata.modified || stats.mtime,
          hasImages: metadata.hasImages || false,
          hasMacros: metadata.hasMacros || false,
          structure: structure,
          sheetDetails: structure.sheetDetails || []
        }
      };
    } catch (error) {
      logger.error(`❌ [Excel 분석] 오류: ${error.message}`);
      throw new Error(`Excel 문서 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 📋 워크북 속성 추출
   */
  extractWorkbookProperties(workbook) {
    try {
      const props = workbook.Props || workbook.Workbook?.Props || {};
      return {
        title: props.Title || null,
        subject: props.Subject || null,
        author: props.Author || null,
        manager: props.Manager || null,
        company: props.Company || null,
        category: props.Category || null,
        keywords: props.Keywords || null,
        comments: props.Comments || null,
        created: props.CreatedDate || null,
        modified: props.ModifiedDate || null,
        lastAuthor: props.LastAuthor || null,
        revision: props.Revision || null,
        application: props.Application || null
      };
    } catch (error) {
      // 속성 추출 실패 시 기본값 반환
      return {
        title: null,
        subject: null,
        author: null,
        manager: null,
        company: null,
        category: null,
        keywords: null,
        comments: null,
        created: null,
        modified: null,
        lastAuthor: null,
        revision: null,
        application: null
      };
    }
  }

  /**
   * 💡 비즈니스 인사이트 추출 (ExcelAnalyzer로 대체됨)
   * @deprecated ExcelAnalyzer를 사용하세요
   */
  extractBusinessInsights(data) {
    console.warn('⚠️ extractBusinessInsights는 더 이상 사용되지 않습니다. ExcelAnalyzer를 사용하세요.');
    return {};
  }

  /**
   * 📊 핵심 지표 추출 (ExcelAnalyzer로 대체됨)
   * @deprecated ExcelAnalyzer를 사용하세요
   */
  extractKeyMetrics(sheetData) {
    console.warn('⚠️ extractKeyMetrics는 더 이상 사용되지 않습니다. ExcelAnalyzer를 사용하세요.');
    return {};
  }

  /**
   * 📈 트렌드 식별 (ExcelAnalyzer로 대체됨)
   * @deprecated ExcelAnalyzer를 사용하세요
   */
  identifyTrends(sheetData) {
    console.warn('⚠️ identifyTrends는 더 이상 사용되지 않습니다. ExcelAnalyzer를 사용하세요.');
    return [];
  }

  /**
   * 🔍 트렌드 분석
   */
  analyzeTrend(numbers) {
    const n = numbers.length;
    const x = Array.from({length: n}, (_, i) => i + 1);
    
    // 선형 회귀를 통한 트렌드 분석
    const sumX = x.reduce((acc, val) => acc + val, 0);
    const sumY = numbers.reduce((acc, val) => acc + val, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * numbers[i], 0);
    const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // R-squared 계산
    const yMean = sumY / n;
    const ssRes = numbers.reduce((acc, val, i) => acc + Math.pow(val - (slope * x[i] + intercept), 2), 0);
    const ssTot = numbers.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    // 트렌드 방향 및 강도 결정
    let direction = 'stable';
    let strength = 'weak';
    
    if (Math.abs(slope) > 0.01) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
      
      if (rSquared > 0.8) strength = 'strong';
      else if (rSquared > 0.5) strength = 'moderate';
      else strength = 'weak';
    }
    
    return {
      direction,
      strength,
      slope: Math.round(slope * 1000) / 1000,
      confidence: Math.round(rSquared * 100) / 100
    };
  }

  /**
   * 📈 성장률 계산
   */
  calculateGrowthRate(numbers) {
    if (numbers.length < 2) return null;
    
    const first = numbers[0];
    const last = numbers[numbers.length - 1];
    
    if (first === 0) return null;
    
    const growthRate = ((last - first) / first) * 100;
    return Math.round(growthRate * 100) / 100;
  }

  /**
   * ⚠️ 이상치 탐지
   */
  detectOutliers(data) {
    const outliers = {};
    
    for (const [sheetName, sheetData] of Object.entries(data)) {
      if (!sheetData.data || sheetData.data.length === 0) continue;
      
      outliers[sheetName] = {};
      
      if (!sheetData.headers) continue;
      
      for (let colIndex = 0; colIndex < sheetData.headers.length; colIndex++) {
        const columnName = sheetData.headers[colIndex];
        const columnValues = sheetData.data.slice(1).map(row => row[colIndex]).filter(val => val !== null && val !== undefined);
        
        const numericValues = columnValues.filter(val => {
          const num = parseFloat(val);
          return !isNaN(num) && isFinite(num);
        });
        
        if (numericValues.length >= 5) {
          const numbers = numericValues.map(val => parseFloat(val));
          const detectedOutliers = this.findOutliers(numbers);
          
          if (detectedOutliers.length > 0) {
            outliers[sheetName][columnName] = {
              outliers: detectedOutliers,
              count: detectedOutliers.length,
              percentage: Math.round((detectedOutliers.length / numbers.length) * 100 * 100) / 100
            };
          }
        }
      }
    }
    
    return outliers;
  }

  /**
   * 🔍 이상치 탐지 (별칭)
   */
  detectAnomalies(sheetData) {
    return this.detectOutliers({ 'sheet': sheetData })['sheet'] || {};
  }

  /**
   * 💡 기회 요소 식별
   */
  identifyOpportunities(sheetData) {
    const opportunities = [];
    
    if (!sheetData.headers || !sheetData.data || sheetData.data.length < 2) return opportunities;
    
    // 성장 추세가 있는 컬럼 찾기
    for (let colIndex = 0; colIndex < sheetData.headers.length; colIndex++) {
      const columnName = sheetData.headers[colIndex];
      const columnValues = sheetData.data.slice(1).map(row => row[colIndex]).filter(val => val !== null && val !== undefined);
      
      const numericValues = columnValues.filter(val => {
        const num = parseFloat(val);
        return !isNaN(num) && isFinite(num);
      });
      
      if (numericValues.length >= 3) {
        const numbers = numericValues.map(val => parseFloat(val));
        const trend = this.analyzeTrend(numbers);
        
        if (trend.direction === 'increasing' && trend.strength === 'strong') {
          opportunities.push({
            type: 'growth_trend',
            column: columnName,
            description: `${columnName} 컬럼에서 강한 상승 추세가 발견되었습니다`,
            confidence: trend.confidence,
            growthRate: this.calculateGrowthRate(numbers)
          });
        }
      }
    }
    
    return opportunities;
  }

  /**
   * ⚠️ 위험 요소 식별
   */
  identifyRisks(sheetData) {
    const risks = [];
    
    if (!sheetData.headers || !sheetData.data || sheetData.data.length < 2) return risks;
    
    // 감소 추세가 있는 컬럼 찾기
    for (let colIndex = 0; colIndex < sheetData.headers.length; colIndex++) {
      const columnName = sheetData.headers[colIndex];
      const columnValues = sheetData.data.slice(1).map(row => row[colIndex]).filter(val => val !== null && val !== undefined);
      
      const numericValues = columnValues.filter(val => {
        const num = parseFloat(val);
        return !isNaN(num) && isFinite(num);
      });
      
      if (numericValues.length >= 3) {
        const numbers = numericValues.map(val => parseFloat(val));
        const trend = this.analyzeTrend(numbers);
        
        if (trend.direction === 'decreasing' && trend.strength === 'strong') {
          risks.push({
            type: 'declining_trend',
            column: columnName,
            description: `${columnName} 컬럼에서 강한 하락 추세가 발견되었습니다`,
            confidence: trend.confidence,
            declineRate: Math.abs(this.calculateGrowthRate(numbers))
          });
        }
        
        // 이상치가 많은 경우
        const outliers = this.findOutliers(numbers);
        if (outliers.length > numbers.length * 0.1) { // 10% 이상이 이상치
          risks.push({
            type: 'high_outliers',
            column: columnName,
            description: `${columnName} 컬럼에서 많은 이상치가 발견되었습니다 (${outliers.length}개, ${Math.round((outliers.length / numbers.length) * 100)}%)`,
            outlierCount: outliers.length,
            outlierPercentage: Math.round((outliers.length / numbers.length) * 100)
          });
        }
      }
    }
    
    return risks;
  }

  /**
   * 🔍 이상치 찾기 (IQR 방법)
   */
  findOutliers(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const q1 = this.calculateQuartile(sorted, 0.25);
    const q3 = this.calculateQuartile(sorted, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return numbers.filter(num => num < lowerBound || num > upperBound);
  }

  /**
   * 📊 사분위수 계산
   */
  calculateQuartile(sorted, percentile) {
    const index = (percentile * (sorted.length - 1));
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (upper === lower) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * 📊 시각화용 데이터 준비
   */
  prepareVisualizationData(data) {
    const visualization = {};
    
    for (const [sheetName, sheetData] of Object.entries(data)) {
      if (!sheetData.data || sheetData.data.length === 0) continue;
      
      visualization[sheetName] = {
        charts: this.suggestCharts(sheetData),
        dataForCharts: this.prepareChartData(sheetData),
        summary: this.createVisualizationSummary(sheetData)
      };
    }
    
    return visualization;
  }

  /**
   * 📈 차트 제안
   */
  suggestCharts(sheetData) {
    const suggestions = [];
    
    if (!sheetData.headers) return suggestions;
    
    const numericColumns = [];
    const categoricalColumns = [];
    const dateColumns = [];
    
    // 컬럼 분류
    for (let colIndex = 0; colIndex < sheetData.headers.length; colIndex++) {
      const columnName = sheetData.headers[colIndex];
      const columnValues = sheetData.data.slice(1).map(row => row[colIndex]).filter(val => val !== null && val !== undefined);
      
      const numericValues = columnValues.filter(val => {
        const num = parseFloat(val);
        return !isNaN(num) && isFinite(num);
      });
      
      const dateValues = columnValues.filter(val => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date.toString() !== 'Invalid Date';
      });
      
      if (numericValues.length > columnValues.length * 0.7) {
        numericColumns.push({ index: colIndex, name: columnName });
      } else if (dateValues.length > columnValues.length * 0.7) {
        dateColumns.push({ index: colIndex, name: columnName });
      } else {
        categoricalColumns.push({ index: colIndex, name: columnName });
      }
    }
    
    // 차트 제안 로직
    if (numericColumns.length >= 2) {
      suggestions.push({
        type: 'scatter',
        title: '산점도 분석',
        description: '두 변수 간의 관계를 시각화',
        columns: numericColumns.slice(0, 2).map(col => col.name)
      });
    }
    
    if (numericColumns.length >= 1 && categoricalColumns.length >= 1) {
      suggestions.push({
        type: 'bar',
        title: '막대 차트',
        description: '범주별 수치 비교',
        columns: [categoricalColumns[0].name, numericColumns[0].name]
      });
    }
    
    if (dateColumns.length >= 1 && numericColumns.length >= 1) {
      suggestions.push({
        type: 'line',
        title: '시계열 차트',
        description: '시간에 따른 변화 추이',
        columns: [dateColumns[0].name, numericColumns[0].name]
      });
    }
    
    if (numericColumns.length >= 1) {
      suggestions.push({
        type: 'histogram',
        title: '히스토그램',
        description: '데이터 분포 분석',
        columns: [numericColumns[0].name]
      });
    }
    
    return suggestions;
  }

  /**
   * 📊 차트용 데이터 준비
   */
  prepareChartData(sheetData) {
    const chartData = {};
    
    if (!sheetData.headers) return chartData;
    
    // 기본 통계 데이터
    chartData.summary = {
      totalRows: sheetData.data.length,
      totalColumns: sheetData.headers.length,
      columnNames: sheetData.headers
    };
    
    // 컬럼별 요약 데이터
    chartData.columns = {};
    for (let colIndex = 0; colIndex < sheetData.headers.length; colIndex++) {
      const columnName = sheetData.headers[colIndex];
      const columnValues = sheetData.data.slice(1).map(row => row[colIndex]).filter(val => val !== null && val !== undefined);
      
      chartData.columns[columnName] = {
        count: columnValues.length,
        uniqueCount: new Set(columnValues).size,
        nullCount: sheetData.data.length - columnValues.length - 1 // 헤더 제외
      };
      
      // 숫자형 데이터인 경우 추가 통계
      const numericValues = columnValues.filter(val => {
        const num = parseFloat(val);
        return !isNaN(num) && isFinite(num);
      });
      
      if (numericValues.length > 0) {
        const numbers = numericValues.map(val => parseFloat(val));
        chartData.columns[columnName].numeric = {
          min: Math.min(...numbers),
          max: Math.max(...numbers),
          avg: numbers.reduce((sum, num) => sum + num, 0) / numbers.length,
          sum: numbers.reduce((sum, num) => sum + num, 0)
        };
      }
    }
    
    return chartData;
  }

  /**
   * 📋 시각화 요약 생성
   */
  createVisualizationSummary(sheetData, sheetName = 'Sheet1') {
    return {
      recommendedCharts: this.suggestCharts(sheetData).length,
      dataQuality: this.assessDataQuality({ [sheetName]: sheetData }).overall,
      insights: this.extractBusinessInsights({ [sheetName]: sheetData })
    };
  }

  /**
   * 📊 데이터 품질 평가
   */
  assessDataQuality(data) {
    const quality = {
      overall: 0,
      sheets: {}
    };
    
    let totalScore = 0;
    let sheetCount = 0;
    
    for (const [sheetName, sheetData] of Object.entries(data)) {
      if (!sheetData.data || sheetData.data.length === 0) continue;
      
      const sheetQuality = this.calculateDataQuality(sheetData);
      quality.sheets[sheetName] = sheetQuality;
      
      totalScore += sheetQuality.overall;
      sheetCount++;
    }
    
    quality.overall = sheetCount > 0 ? Math.round((totalScore / sheetCount) * 100) / 100 : 0;
    
    return quality;
  }

  /**
   * 💡 추천사항 생성
   */
  generateRecommendations(data) {
    const recommendations = [];
    
    for (const [sheetName, sheetData] of Object.entries(data)) {
      if (!sheetData.data || sheetData.data.length === 0) continue;
      
      const quality = this.calculateDataQuality(sheetData);
      
      // 데이터 품질 기반 추천
      if (quality.completeness < 0.8) {
        recommendations.push({
          type: 'data_quality',
          priority: 'high',
          message: `${sheetName} 시트에 누락 데이터가 많습니다. 데이터 완성도를 높이는 것을 권장합니다.`,
          action: 'clean_missing_data'
        });
      }
      
      if (quality.consistency < 0.9) {
        recommendations.push({
          type: 'data_structure',
          priority: 'medium',
          message: `${sheetName} 시트의 데이터 구조가 일관되지 않습니다. 표 형식을 정리하는 것을 권장합니다.`,
          action: 'standardize_structure'
        });
      }
      
      // 이상치 기반 추천
      const outliers = this.detectOutliers({ [sheetName]: sheetData });
      if (outliers[sheetName]) {
        const outlierColumns = Object.keys(outliers[sheetName]);
        if (outlierColumns.length > 0) {
          recommendations.push({
            type: 'outliers',
            priority: 'medium',
            message: `${sheetName} 시트의 ${outlierColumns.join(', ')} 컬럼에 이상치가 발견되었습니다. 검토가 필요합니다.`,
            action: 'review_outliers'
          });
        }
      }
      
      // 트렌드 기반 추천
      const trends = this.identifyTrends(sheetData);
      if (trends.length > 0) {
        const strongTrends = trends.filter(t => t.strength === 'strong');
        if (strongTrends.length > 0) {
          recommendations.push({
            type: 'trends',
            priority: 'low',
            message: `${sheetName} 시트에서 강한 트렌드가 발견되었습니다. 추가 분석을 권장합니다.`,
            action: 'analyze_trends'
          });
        }
      }
    }
    
    return recommendations;
  }

  /**
   * 📊 Excel 데이터 타입 분석 (국내 최고급)
   */
  analyzeExcelDataTypes(data) {
    const dataTypes = {};
    
    for (const [sheetName, sheetData] of Object.entries(data)) {
      if (!sheetData.data || sheetData.data.length === 0) continue;
      
      const headers = sheetData.headers || [];
      const rows = sheetData.data.slice(1); // 헤더 제외
      
      dataTypes[sheetName] = {};
      
      // 각 컬럼별 데이터 타입 분석
      for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const columnValues = rows.map(row => row[colIndex]).filter(val => val !== undefined && val !== null && val !== '');
        const columnName = headers[colIndex] || `Column${colIndex + 1}`;
        
        if (columnValues.length === 0) {
          dataTypes[sheetName][columnName] = { type: 'empty', confidence: 1.0 };
          continue;
        }
        
        const typeAnalysis = this.analyzeColumnDataType(columnValues, columnName);
        dataTypes[sheetName][columnName] = typeAnalysis;
      }
    }
    
    return dataTypes;
  }

  /**
   * 🔍 컬럼별 데이터 타입 분석
   */
  analyzeColumnDataType(values, columnName) {
    const sampleSize = Math.min(values.length, 1000); // 성능을 위해 샘플링
    const sampleValues = values.slice(0, sampleSize);
    
    // 숫자 타입 체크
    const numericValues = sampleValues.filter(val => {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num);
    });
    
    // 날짜 타입 체크
    const dateValues = sampleValues.filter(val => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date.toString() !== 'Invalid Date';
    });
    
    // 불린 타입 체크
    const booleanValues = sampleValues.filter(val => {
      const lowerVal = String(val).toLowerCase();
      return ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(lowerVal);
    });
    
    // 이메일 타입 체크
    const emailValues = sampleValues.filter(val => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(String(val));
    });
    
    // URL 타입 체크
    const urlValues = sampleValues.filter(val => {
      try {
        new URL(String(val));
        return true;
      } catch {
        return false;
      }
    });
    
    // 전화번호 타입 체크
    const phoneValues = sampleValues.filter(val => {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
      return phoneRegex.test(String(val));
    });
    
    // 한국어 이름 타입 체크
    const koreanNameValues = sampleValues.filter(val => {
      const koreanNameRegex = /^[가-힣]{2,4}$/;
      return koreanNameRegex.test(String(val));
    });
    
    // 계산 타입별 신뢰도
    const totalValues = sampleValues.length;
    const numericRatio = numericValues.length / totalValues;
    const dateRatio = dateValues.length / totalValues;
    const booleanRatio = booleanValues.length / totalValues;
    const emailRatio = emailValues.length / totalValues;
    const urlRatio = urlValues.length / totalValues;
    const phoneRatio = phoneValues.length / totalValues;
    const koreanNameRatio = koreanNameValues.length / totalValues;
    
    // 타입 결정 (가장 높은 비율의 타입 선택)
    let detectedType = 'string';
    let confidence = 0.0;
    
    if (numericRatio > 0.8) {
      detectedType = 'number';
      confidence = numericRatio;
    } else if (dateRatio > 0.7) {
      detectedType = 'date';
      confidence = dateRatio;
    } else if (booleanRatio > 0.8) {
      detectedType = 'boolean';
      confidence = booleanRatio;
    } else if (emailRatio > 0.7) {
      detectedType = 'email';
      confidence = emailRatio;
    } else if (urlRatio > 0.7) {
      detectedType = 'url';
      confidence = urlRatio;
    } else if (phoneRatio > 0.7) {
      detectedType = 'phone';
      confidence = phoneRatio;
    } else if (koreanNameRatio > 0.7) {
      detectedType = 'korean_name';
      confidence = koreanNameRatio;
    } else {
      detectedType = 'string';
      confidence = 1.0 - Math.max(numericRatio, dateRatio, booleanRatio, emailRatio, urlRatio, phoneRatio, koreanNameRatio);
    }
    
    // 추가 메타데이터
    const metadata = {
      uniqueValues: new Set(values).size,
      nullCount: values.filter(val => val === null || val === undefined || val === '').length,
      minLength: Math.min(...values.map(val => String(val).length)),
      maxLength: Math.max(...values.map(val => String(val).length)),
      avgLength: values.reduce((sum, val) => sum + String(val).length, 0) / values.length
    };
    
    if (detectedType === 'number') {
      const numbers = numericValues.map(val => parseFloat(val));
      metadata.min = Math.min(...numbers);
      metadata.max = Math.max(...numbers);
      metadata.avg = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
      metadata.isInteger = numbers.every(num => Number.isInteger(num));
    }
    
    return {
      type: detectedType,
      confidence: Math.round(confidence * 100) / 100,
      sampleCount: sampleSize,
      totalCount: values.length,
      metadata: metadata
    };
  }

  /**
   * 🔍 Excel 패턴 찾기 (국내 최고급)
   */
  findExcelPatterns(data) {
    const patterns = {};
    
    for (const [sheetName, sheetData] of Object.entries(data)) {
      if (!sheetData.data || sheetData.data.length === 0) continue;
      
      patterns[sheetName] = {
        structural: this.findStructuralPatterns(sheetData),
        data: this.findDataPatterns(sheetData),
        temporal: this.findTemporalPatterns(sheetData),
        categorical: this.findCategoricalPatterns(sheetData)
      };
    }
    
    return patterns;
  }

  /**
   * 🏗️ 구조적 패턴 찾기
   */
  findStructuralPatterns(sheetData) {
    const patterns = {
      hasHeaders: false,
      isRegularGrid: false,
      hasMergedCells: false,
      hasFormulas: false,
      hasConditionalFormatting: false
    };
    
    if (sheetData.headers && sheetData.headers.length > 0) {
      patterns.hasHeaders = true;
    }
    
    // 정규 그리드 체크 (모든 행이 같은 열 수를 가지는지)
    if (sheetData.data.length > 1) {
      const firstRowLength = sheetData.data[0].length;
      patterns.isRegularGrid = sheetData.data.every(row => row.length === firstRowLength);
    }
    
    return patterns;
  }

  /**
   * 📊 데이터 패턴 찾기
   */
  findDataPatterns(sheetData) {
    const patterns = {
      hasSequentialData: false,
      hasRepeatingPatterns: false,
      hasOutliers: false,
      hasMissingData: false,
      dataDistribution: 'unknown'
    };
    
    // 누락 데이터 체크
    const totalCells = sheetData.data.reduce((sum, row) => sum + row.length, 0);
    const emptyCells = sheetData.data.reduce((sum, row) => 
      sum + row.filter(cell => cell === null || cell === undefined || cell === '').length, 0);
    
    if (emptyCells > 0) {
      patterns.hasMissingData = true;
      patterns.missingDataRatio = emptyCells / totalCells;
    }
    
    // 순차 데이터 체크 (ID, 날짜 등)
    if (sheetData.data.length > 2) {
      const firstColumn = sheetData.data.map(row => row[0]).filter(val => val !== null && val !== undefined);
      if (this.isSequential(firstColumn)) {
        patterns.hasSequentialData = true;
      }
    }
    
    return patterns;
  }

  /**
   * ⏰ 시간적 패턴 찾기
   */
  findTemporalPatterns(sheetData) {
    const patterns = {
      hasDateColumns: false,
      hasTimeColumns: false,
      isTimeSeries: false,
      dateRange: null
    };
    
    // 날짜 컬럼 찾기
    const dateColumns = [];
    for (let colIndex = 0; colIndex < sheetData.headers.length; colIndex++) {
      const columnValues = sheetData.data.map(row => row[colIndex]).filter(val => val !== null && val !== undefined);
      const dateValues = columnValues.filter(val => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date.toString() !== 'Invalid Date';
      });
      
      if (dateValues.length > columnValues.length * 0.7) {
        dateColumns.push({
          columnIndex: colIndex,
          columnName: sheetData.headers[colIndex],
          dateCount: dateValues.length,
          totalCount: columnValues.length
        });
      }
    }
    
    if (dateColumns.length > 0) {
      patterns.hasDateColumns = true;
      patterns.dateColumns = dateColumns;
    }
    
    return patterns;
  }

  /**
   * 🏷️ 범주형 패턴 찾기
   */
  findCategoricalPatterns(sheetData) {
    const patterns = {
      hasCategoricalData: false,
      categoricalColumns: []
    };
    
    for (let colIndex = 0; colIndex < sheetData.headers.length; colIndex++) {
      const columnValues = sheetData.data.map(row => row[colIndex]).filter(val => val !== null && val !== undefined);
      const uniqueValues = new Set(columnValues);
      
      // 범주형 데이터 체크 (고유값이 전체의 50% 이하이고, 2개 이상)
      if (uniqueValues.size > 1 && uniqueValues.size <= columnValues.length * 0.5) {
        patterns.hasCategoricalData = true;
        patterns.categoricalColumns.push({
          columnIndex: colIndex,
          columnName: sheetData.headers[colIndex],
          uniqueCount: uniqueValues.size,
          totalCount: columnValues.length,
          categories: Array.from(uniqueValues)
        });
      }
    }
    
    return patterns;
  }

  /**
   * 📈 Excel 통계 계산 (국내 최고급)
   */
  calculateExcelStatistics(data) {
    const statistics = {};
    
    for (const [sheetName, sheetData] of Object.entries(data)) {
      if (!sheetData.data || sheetData.data.length === 0) continue;
      
      statistics[sheetName] = {
        basic: this.calculateBasicStatistics(sheetData),
        columnStats: this.calculateColumnStatistics(sheetData),
        correlation: this.calculateCorrelations(sheetData),
        quality: this.calculateDataQuality(sheetData)
      };
    }
    
    return statistics;
  }

  /**
   * 📊 기본 통계 계산
   */
  calculateBasicStatistics(sheetData) {
    // 행(row)이 배열(엑셀) 또는 객체(CSV) 모두 지원
    const dataRows = sheetData.data || [];
    let totalCells = 0;
    let emptyCells = 0;
    dataRows.forEach(row => {
      const values = Array.isArray(row) ? row : Object.values(row);
      totalCells += values.length;
      emptyCells += values.filter(cell => cell === null || cell === undefined || cell === '').length;
    });
    return {
      totalRows: dataRows.length,
      totalCells,
      emptyCells
    };
  }

  /**
   * 📈 컬럼별 통계 계산
   */
  calculateColumnStatistics(sheetData) {
    // 행(row)이 배열(엑셀) 또는 객체(CSV) 모두 지원
    const dataRows = sheetData.data || [];
    const headers = sheetData.headers || (dataRows[0] ? (Array.isArray(dataRows[0]) ? dataRows[0] : Object.keys(dataRows[0])) : []);
    const stats = {};
    headers.forEach((header, colIndex) => {
      const values = dataRows.map(row => Array.isArray(row) ? row[colIndex] : row[header]).filter(val => val !== null && val !== undefined && val !== '');
      const numericValues = values.map(val => Number(val)).filter(val => !isNaN(val));
      if (numericValues.length > 0) {
        const sum = numericValues.reduce((a, b) => a + b, 0);
        const avg = sum / numericValues.length;
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        stats[header] = { count: numericValues.length, sum, avg, min, max };
      } else {
        stats[header] = { count: values.length };
      }
    });
    return stats;
  }

  /**
   * 🔗 상관관계 계산
   */
  calculateCorrelations(sheetData) {
    const correlations = {};
    
    if (!sheetData.headers || sheetData.data.length < 2) return correlations;
    
    // 숫자형 컬럼들 찾기
    const numericColumns = [];
    for (let colIndex = 0; colIndex < sheetData.headers.length; colIndex++) {
      const columnValues = sheetData.data.map(row => row[colIndex]).filter(val => val !== null && val !== undefined);
      const numericValues = columnValues.filter(val => {
        const num = parseFloat(val);
        return !isNaN(num) && isFinite(num);
      });
      
      if (numericValues.length > columnValues.length * 0.7) {
        numericColumns.push({
          index: colIndex,
          name: sheetData.headers[colIndex],
          values: numericValues.map(val => parseFloat(val))
        });
      }
    }
    
    // 상관관계 계산 (2개 이상의 숫자형 컬럼이 있는 경우)
    if (numericColumns.length >= 2) {
      for (let i = 0; i < numericColumns.length; i++) {
        for (let j = i + 1; j < numericColumns.length; j++) {
          const col1 = numericColumns[i];
          const col2 = numericColumns[j];
          
          const correlation = this.calculatePearsonCorrelation(col1.values, col2.values);
          
          if (Math.abs(correlation) > 0.3) { // 의미있는 상관관계만 저장
            correlations[`${col1.name}_vs_${col2.name}`] = {
              correlation: Math.round(correlation * 1000) / 1000,
              strength: this.getCorrelationStrength(correlation),
              col1: col1.name,
              col2: col2.name
            };
          }
        }
      }
    }
    
    return correlations;
  }

  /**
   * 📊 데이터 품질 계산
   */
  calculateDataQuality(sheetData) {
    // 행(row)이 배열(엑셀) 또는 객체(CSV) 모두 지원
    const dataRows = sheetData.data || [];
    let totalCells = 0;
    let emptyCells = 0;
    dataRows.forEach(row => {
      const values = Array.isArray(row) ? row : Object.values(row);
      totalCells += values.length;
      emptyCells += values.filter(cell => cell === null || cell === undefined || cell === '').length;
    });
    const quality = totalCells === 0 ? 0 : ((totalCells - emptyCells) / totalCells) * 100;
    return { totalCells, emptyCells, quality: Math.round(quality) };
  }

  /**
   * 🔢 피어슨 상관계수 계산
   */
  calculatePearsonCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 💪 상관관계 강도 판별
   */
  getCorrelationStrength(correlation) {
    const absCorr = Math.abs(correlation);
    if (absCorr >= 0.8) return 'very_strong';
    if (absCorr >= 0.6) return 'strong';
    if (absCorr >= 0.4) return 'moderate';
    if (absCorr >= 0.2) return 'weak';
    return 'very_weak';
  }

  /**
   * 🔢 순차 데이터 체크
   */
  isSequential(values) {
    if (values.length < 2) return false;
    
    // 숫자 순차 체크
    const numericValues = values.filter(val => {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num);
    });
    
    if (numericValues.length === values.length) {
      const numbers = numericValues.map(val => parseFloat(val));
      const differences = [];
      for (let i = 1; i < numbers.length; i++) {
        differences.push(numbers[i] - numbers[i - 1]);
      }
      
      // 모든 차이가 동일한지 체크
      const firstDiff = differences[0];
      return differences.every(diff => Math.abs(diff - firstDiff) < 0.001);
    }
    
    return false;
  }

  /**
   * 📊 CSV 데이터 타입 분석
   */
  analyzeCsvDataTypes(data, headers) {
    const types = {};
    headers.forEach(header => {
      const values = data.map(row => row[header]);
      let numCount = 0, dateCount = 0, strCount = 0;
      values.forEach(val => {
        if (val === undefined || val === null || val === '') return;
        if (!isNaN(Number(val))) numCount++;
        else if (!isNaN(Date.parse(val))) dateCount++;
        else strCount++;
      });
      if (numCount > dateCount && numCount > strCount) types[header] = 'number';
      else if (dateCount > numCount && dateCount > strCount) types[header] = 'date';
      else types[header] = 'string';
    });
    return types;
  }

  findCsvPatterns(data) {
    const patterns = {};
    if (data.length === 0) return patterns;
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
      const values = data.map(row => row[header]);
      const unique = [...new Set(values.filter(v => v !== undefined && v !== null && v !== ''))];
      patterns[header] = {
        uniqueCount: unique.length,
        mostFrequent: this._mostFrequent(values),
        emptyCount: values.filter(v => v === undefined || v === null || v === '').length
      };
    });
    return patterns;
  }

  _mostFrequent(arr) {
    const freq = {};
    arr.forEach(v => {
      if (v === undefined || v === null || v === '') return;
      freq[v] = (freq[v] || 0) + 1;
    });
    let max = 0, val = null;
    Object.entries(freq).forEach(([k, v]) => {
      if (v > max) { max = v; val = k; }
    });
    return val;
  }

  calculateCsvStatistics(data, headers) {
    const stats = {};
    headers.forEach(header => {
      const values = data.map(row => Number(row[header])).filter(v => !isNaN(v));
      if (values.length === 0) {
        stats[header] = { count: 0 };
        return;
      }
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      stats[header] = { count: values.length, sum, avg, min, max };
    });
    return stats;
  }

  /**
   * 🔧 JSON 구조 분석
   */
  analyzeJsonStructure(data) {
    // 구현 예정
    return { note: 'JSON 구조 분석 기능은 향후 구현 예정' };
  }

  /**
   * 📊 JSON 데이터 타입 분석
   */
  analyzeJsonDataTypes(data) {
    // 구현 예정
    return { note: 'JSON 데이터 타입 분석 기능은 향후 구현 예정' };
  }

  /**
   * 📏 JSON 깊이 계산
   */
  calculateJsonDepth(data) {
    // 구현 예정
    return 0;
  }

  /**
   * 📋 XML 구조 분석
   */
  analyzeXmlStructure(content) {
    // 구현 예정
    return { note: 'XML 구조 분석 기능은 향후 구현 예정' };
  }

  /**
   * 🏷️ XML 태그 추출
   */
  extractXmlTags(content) {
    const tagPattern = /<(\w+)[^>]*>/g;
    const tags = [];
    let match;
    
    while ((match = tagPattern.exec(content)) !== null) {
      tags.push(match[1]);
    }
    
    return [...new Set(tags)];
  }

  /**
   * 🔧 XML 속성 추출
   */
  extractXmlAttributes(content) {
    // 구현 예정
    return { note: 'XML 속성 추출 기능은 향후 구현 예정' };
  }

  /**
   * ✅ XML 유효성 검사
   */
  isValidXml(content) {
    // 간단한 검사
    const openTags = (content.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/[^>]*>/g) || []).length;
    return openTags === closeTags;
  }

  /**
   * 🏠 XML 루트 요소 찾기
   */
  getXmlRootElement(content) {
    const match = content.match(/<(\w+)[^>]*>/);
    return match ? match[1] : null;
  }

  /**
   * ⚙️ YAML 구조 분석
   */
  analyzeYamlStructure(content) {
    // 구현 예정
    return { note: 'YAML 구조 분석 기능은 향후 구현 예정' };
  }

  /**
   * 🔑 YAML 키 추출
   */
  extractYamlKeys(content) {
    const keyPattern = /^(\s*)(\w+):/gm;
    const keys = [];
    let match;
    
    while ((match = keyPattern.exec(content)) !== null) {
      keys.push(match[2]);
    }
    
    return [...new Set(keys)];
  }

  /**
   * 📊 YAML 데이터 타입 분석
   */
  analyzeYamlDataTypes(content) {
    // 구현 예정
    return { note: 'YAML 데이터 타입 분석 기능은 향후 구현 예정' };
  }

  /**
   * ✅ YAML 유효성 검사
   */
  isValidYaml(content) {
    // 간단한 검사
    return content.includes(':') && !content.includes('{') && !content.includes('[');
  }

  /**
   * 📏 YAML 들여쓰기 감지
   */
  detectYamlIndentation(content) {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith(' ')) {
        const spaces = line.match(/^(\s*)/)[1].length;
        return spaces;
      }
    }
    return 2; // 기본값
  }

  /**
   * 📄 PDF 문서 분석 (완전한 분석)
   */
  async analyzePdfFile(filePath, stats) {
    try {
      logger.info(`🔍 PDF 완전 분석 시작: ${filePath}`);
      
      // PDF 분석기 사용
      const result = await this.pdfAnalyzer.analyzeComplete(filePath);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // 기존 형식에 맞게 결과 변환
      const content = result.results.text?.text || '';
      const pages = result.results.text?.pages || 0;
      
      // 메타데이터 구성
      const metadata = {
        title: result.results.metadata.title || null,
        author: result.results.metadata.author || null,
        subject: result.results.metadata.subject || null,
        creator: result.results.metadata.creator || null,
        producer: result.results.metadata.producer || null,
        creationDate: result.results.metadata.created || null,
        modDate: result.results.metadata.modified || null,
        keywords: null,
        hasImages: result.results.images.length > 0,
        hasTables: content.includes('[표]') || content.includes('[Table]'),
        textExtraction: result.results.text ? 'success' : 'failed',
        version: result.results.text?.version || null,
        pageCount: pages,
        // 추가 정보
        imageCount: result.results.images.length,
        ocrCount: result.results.ocrResults.length,
        analysisQuality: result.results.analysis
      };
      
      // OCR 결과를 텍스트에 추가
      let fullContent = content;
      if (result.results.ocrResults.length > 0) {
        const ocrTexts = result.results.ocrResults
          .map(ocr => `[OCR 결과 - ${ocr.type}]: ${ocr.text}`)
          .join('\n\n');
        fullContent += '\n\n' + ocrTexts;
      }
      
      return {
        type: 'pdf',
        content: fullContent,
        summary: {
          pages: pages,
          lines: fullContent.split('\n').length,
          characters: fullContent.length,
          words: fullContent.split(/\s+/).filter(word => word.length > 0).length,
          paragraphs: fullContent.split(/\n\s*\n/).length,
          encoding: 'utf-8',
          // 추가 정보
          imageCount: result.results.images.length,
          ocrCount: result.results.ocrResults.length,
          analysisDuration: result.duration
        },
        analysis: {
          language: this.detectLanguage(fullContent),
          keywords: this.extractKeywords(fullContent),
          sentiment: this.analyzeSentiment(fullContent),
          readability: this.calculateReadability(fullContent),
          // 추가 분석
          textQuality: result.results.analysis.textQuality,
          imageQuality: result.results.analysis.imageQuality,
          ocrQuality: result.results.analysis.ocrQuality
        },
        metadata: metadata,
        // 완전한 분석 결과
        completeAnalysis: result
      };
    } catch (error) {
      logger.error(`❌ PDF 분석 실패: ${error.message}`);
      throw new Error(`PDF 문서 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 📄 한글 문서 분석 (완전 지원)
   */
  async analyzeHwpFile(filePath, stats) {
    try {
      logger.info(`🔍 [한글 분석] 시작: ${filePath}`);
      
      // HwpAnalyzer를 사용하여 완전한 분석 수행
      const result = await this.hwpAnalyzer.analyzeComplete(filePath);
      
      if (!result.success) {
        throw new Error(result.error || '한글 문서 분석 실패');
      }
      
      // 분석 결과를 표준 형식으로 변환
      const content = result.content || '';
      const structure = result.structure || {};
      const metadata = result.metadata || {};
      const objects = result.objects || {};
      
      return {
        type: 'hwp',
        content: content,
        summary: {
          pages: structure.pages || 0,
          lines: content.split('\n').length,
          characters: content.length,
          words: content.split(/\s+/).filter(word => word.length > 0).length,
          paragraphs: structure.paragraphs || 0,
          encoding: 'utf-8',
          fileSize: stats.size,
          fileSizeFormatted: this.formatSize(stats.size)
        },
        analysis: {
          language: 'ko',
          keywords: this.extractKeywords(content),
          sentiment: this.analyzeSentiment(content),
          readability: this.calculateReadability(content),
          confidence: result.analysis?.confidence || 0.0,
          extractionMethod: result.analysis?.textExtractionMethod || 'unknown'
        },
        metadata: {
          documentProperties: {
            title: metadata.title || path.basename(filePath, '.hwp'),
            author: metadata.author || '',
            subject: metadata.subject || '',
            created: metadata.created || stats.birthtime,
            modified: metadata.modified || stats.mtime,
            size: stats.size
          },
          hasImages: objects.images && objects.images.length > 0,
          hasTables: objects.tables && objects.tables.length > 0,
          hasCharts: objects.charts && objects.charts.length > 0,
          textExtraction: result.analysis?.textExtractionMethod || 'limited',
          structure: structure,
          objects: objects,
          warnings: result.analysis?.warnings || [],
          version: result.headerInfo?.version || 'unknown',
          compression: result.headerInfo?.compression || false,
          encryption: result.headerInfo?.encryption || false
        }
      };
    } catch (error) {
      logger.error(`❌ [한글 분석] 오류: ${error.message}`);
      throw new Error(`한글 문서 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 📊 CSV 파일 분석 (국내 최고급)
   */
  async analyzeCsvFile(filePath, stats) {
    try {
      const fs = await import('fs');
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      // CSV 파싱
      const lines = content.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0] ? lines[0].split(',').map(h => h.trim().replace(/"/g, '')) : [];
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      
      // 데이터 타입 분석
      const dataTypes = this.analyzeCsvDataTypes(data, headers);
      const patterns = this.findCsvPatterns(data);
      const statistics = this.calculateCsvStatistics(data, headers);
      const quality = this.assessDataQuality({ 'CSV': { data: data, headers: headers } });
      
      const metadata = {
        encoding: 'utf-8',
        delimiter: ',',
        hasQuotes: content.includes('"'),
        rows: data.length,
        columns: headers.length
      };
      
      return {
        type: 'csv',
        content: content,
        summary: {
          rows: data.length,
          columns: headers.length,
          characters: content.length,
          encoding: 'utf-8'
        },
        analysis: {
          headers: headers,
          dataTypes: dataTypes,
          patterns: patterns,
          statistics: statistics,
          quality: quality,
          language: this.detectLanguage(content),
          keywords: this.extractKeywords(content)
        },
        metadata: metadata
      };
    } catch (error) {
      throw new Error(`CSV 파일 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 📄 JSON 파일 분석 (국내 최고급)
   */
  async analyzeJsonFile(filePath, stats) {
    try {
      const fs = await import('fs');
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      let jsonData;
      let isValid = false;
      
      try {
        jsonData = JSON.parse(content);
        isValid = true;
      } catch (parseError) {
        jsonData = null;
      }
      
      const structure = this.analyzeJsonStructure(jsonData);
      const dataTypes = this.analyzeJsonDataTypes(jsonData);
      const depth = this.calculateJsonDepth(jsonData);
      
      const metadata = {
        isValid: isValid,
        rootType: Array.isArray(jsonData) ? 'array' : typeof jsonData,
        rootSize: Array.isArray(jsonData) ? jsonData.length : Object.keys(jsonData || {}).length,
        encoding: 'utf-8',
        formatting: {
          hasPrettyPrint: content.includes('\n'),
          hasComments: false // JSON은 주석을 지원하지 않음
        }
      };
      
      return {
        type: 'json',
        content: content,
        summary: {
          lines: content.split('\n').length,
          characters: content.length,
          encoding: 'utf-8'
        },
        analysis: {
          structure: structure,
          dataTypes: dataTypes,
          depth: depth,
          language: 'json',
          keywords: this.extractKeywords(JSON.stringify(jsonData))
        },
        metadata: metadata
      };
    } catch (error) {
      throw new Error(`JSON 파일 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 📄 XML 파일 분석 (국내 최고급)
   */
  async analyzeXmlFile(filePath, stats) {
    try {
      const fs = await import('fs');
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      const tags = this.extractXmlTags(content);
      const attributes = this.extractXmlAttributes(content);
      const isValid = this.isValidXml(content);
      const rootElement = this.getXmlRootElement(content);
      const structure = this.analyzeXmlStructure(content);
      
      const metadata = {
        isValid: isValid,
        rootElement: rootElement,
        encoding: 'utf-8',
        namespace: content.includes('xmlns=') ? 'detected' : null,
        dtd: content.includes('<!DOCTYPE') ? 'detected' : null
      };
      
      return {
        type: 'xml',
        content: content,
        summary: {
          lines: content.split('\n').length,
          characters: content.length,
          encoding: 'utf-8'
        },
        analysis: {
          tags: tags,
          attributes: attributes,
          structure: structure,
          depth: this.calculateXmlDepth(content),
          language: 'xml',
          keywords: this.extractKeywords(content)
        },
        metadata: metadata
      };
    } catch (error) {
      throw new Error(`XML 파일 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 📄 YAML 파일 분석 (국내 최고급)
   */
  async analyzeYamlFile(filePath, stats) {
    try {
      const fs = await import('fs');
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      const keys = this.extractYamlKeys(content);
      const dataTypes = this.analyzeYamlDataTypes(content);
      const depth = this.calculateYamlDepth(content);
      const isValid = this.isValidYaml(content);
      const indentation = this.detectYamlIndentation(content);
      const structure = this.analyzeYamlStructure(content);
      
      const metadata = {
        isValid: isValid,
        indentation: indentation,
        encoding: 'utf-8'
      };
      
      return {
        type: 'yaml',
        content: content,
        summary: {
          lines: content.split('\n').length,
          characters: content.length,
          encoding: 'utf-8'
        },
        analysis: {
          keys: keys,
          dataTypes: dataTypes,
          depth: depth,
          structure: structure,
          language: 'yaml',
          keywords: this.extractKeywords(content)
        },
        metadata: metadata
      };
    } catch (error) {
      throw new Error(`YAML 파일 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 📄 PowerPoint 파일 분석 (완전 지원)
   */
  async analyzePowerPointFile(filePath, stats) {
    try {
      logger.info(`🔍 [PowerPoint 분석] 시작: ${filePath}`);
      
      // PowerPointAnalyzer를 사용하여 완전한 분석 수행
      const result = await this.powerPointAnalyzer.analyzeComplete(filePath);
      
      if (!result.success) {
        throw new Error(result.error || 'PowerPoint 문서 분석 실패');
      }
      
      // 분석 결과를 표준 형식으로 변환
      const content = result.content || '';
      const structure = result.structure || {};
      const metadata = result.metadata || {};
      
      return {
        type: 'powerpoint',
        content: content,
        summary: {
          slides: structure.slides || 0,
          lines: content.split('\n').length,
          characters: content.length,
          words: content.split(/\s+/).filter(word => word.length > 0).length,
          paragraphs: structure.paragraphs || 0,
          encoding: 'utf-8',
          fileSize: stats.size,
          fileSizeFormatted: this.formatSize(stats.size)
        },
        analysis: {
          language: result.analysis?.language || 'unknown',
          keywords: this.extractKeywords(content),
          sentiment: this.analyzeSentiment(content),
          readability: this.calculateReadability(content),
          confidence: result.analysis?.confidence || 0.0,
          extractionMethod: result.analysis?.extractionMethod || 'unknown'
        },
        metadata: {
          documentProperties: {
            title: metadata.title || path.basename(filePath, path.extname(filePath)),
            author: metadata.author || '',
            subject: metadata.subject || '',
            created: metadata.created || stats.birthtime,
            modified: metadata.modified || stats.mtime,
            size: stats.size
          },
          hasImages: metadata.hasImages || false,
          hasCharts: metadata.hasCharts || false,
          hasTables: metadata.hasTables || false,
          hasAnimations: metadata.hasAnimations || false,
          hasTransitions: metadata.hasTransitions || false,
          textExtraction: result.analysis?.extractionMethod || 'limited',
          structure: structure,
          slideDetails: structure.slideDetails || [],
          warnings: result.analysis?.warnings || []
        }
      };
    } catch (error) {
      logger.error(`❌ [PowerPoint 분석] 오류: ${error.message}`);
      throw new Error(`PowerPoint 문서 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 🔍 언어 감지
   */
  detectLanguage(content) {
    if (typeof content !== 'string') return 'unknown';
    
    const koreanChars = (content.match(/[가-힣]/g) || []).length;
    const englishChars = (content.match(/[a-zA-Z]/g) || []).length;
    const totalChars = content.length;
    
    if (koreanChars > totalChars * 0.1) return 'ko';
    if (englishChars > totalChars * 0.5) return 'en';
    return 'unknown';
  }

  /**
   * 🔑 키워드 추출
   */
  extractKeywords(content) {
    if (typeof content !== 'string') return [];
    
    const words = content.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * 😊 감정 분석
   */
  analyzeSentiment(content) {
    if (typeof content !== 'string') return 'neutral';
    
    const positiveWords = ['좋다', '훌륭하다', '완벽하다', '성공', '행복', '좋은', 'great', 'excellent', 'perfect', 'success', 'happy'];
    const negativeWords = ['나쁘다', '실패', '문제', '어렵다', '불만', 'bad', 'fail', 'problem', 'difficult', 'complaint'];
    
    const text = content.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * 📖 가독성 계산
   */
  calculateReadability(content) {
    if (typeof content !== 'string') return 0;
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const syllables = content.match(/[aeiou가-힣]/gi)?.length || 0;
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // 간단한 가독성 점수 (0-100)
    const score = Math.max(0, 100 - (avgSentenceLength * 2) - (avgSyllablesPerWord * 10));
    return Math.round(score);
  }

  /**
   * 📊 XML 깊이 계산
   */
  calculateXmlDepth(content) {
    if (typeof content !== 'string') return 0;
    
    const lines = content.split('\n');
    let maxDepth = 0;
    let currentDepth = 0;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('</')) {
        currentDepth--;
      } else if (trimmed.startsWith('<') && !trimmed.startsWith('<?') && !trimmed.startsWith('<!')) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
    });
    
    return maxDepth;
  }

  /**
   * 📊 YAML 깊이 계산
   */
  calculateYamlDepth(content) {
    if (typeof content !== 'string') return 0;
    
    const lines = content.split('\n');
    let maxDepth = 0;
    
    lines.forEach(line => {
      if (line.startsWith(' ')) {
        const spaces = line.match(/^(\s*)/)[1].length;
        const depth = Math.floor(spaces / 2);
        maxDepth = Math.max(maxDepth, depth);
      }
    });
    
    return maxDepth;
  }

  /**
   * 🎯 순수 JSON 응답 포맷팅 (8단계: 표준화)
   * 문서 분석 결과를 AI에게 전달하기 위한 표준화된 JSON 구조로 변환
   */
  formatJsonResponse(result, action, context = {}) {
    try {
      logger.info(`📄 [DocumentContentAnalyzer] formatJsonResponse 시작 - action: ${action}`);
      
      // 오류 상황 처리
      const isError = result.success === false || result.error;
      
      // 기본 메타데이터 구성
      const metadata = {
        service: 'document-analysis',
        version: '2.0-premium',
        subscription_tier: context.subscriptionTier || 'free',
        timestamp: new Date().toISOString(),
        user_id: context.userId || null,
        document_type: result.documentType || result.analysis?.type || 'unknown',
        file_info: {
          path: result.path,
          extension: result.extension,
          size: result.size,
          modified: result.modified,
          created: result.created || null,
          permissions: result.permissions || null,
          checksum: result.checksum || null
        },
        analysis_info: {
          total_analysis_time: result.analysisDuration || null,
          analysis_steps: result.analysisSteps || [],
          confidence_score: result.confidenceScore || null,
          quality_score: result.qualityScore || null
        },
        system_info: {
          node_version: process.version,
          platform: process.platform,
          memory_usage: process.memoryUsage(),
          uptime: process.uptime()
        }
      };

      // 성능 정보 구성
      const performance = {
        execution_time: result.analysisDuration || null,
        cached: false,
        analysis_version: result.analysis?.metadata?.analysisVersion || '2.0',
        memory_usage: result.performance?.memory_usage || null,
        cpu_usage: result.performance?.cpu_usage || null,
        file_size_processed: result.size || null
      };

      // 문서별 특화 데이터 구성
      let documentData = {};
      
      if (result.success !== false) {
        documentData = {
          content: result.content || '',
          summary: result.summary || {},
          analysis: result.analysis || {},
          metadata: result.metadata || {},
          keywords: result.keywords || [],
          language: result.language || 'unknown',
          sentiment: result.sentiment || 'neutral',
          readability: result.readability || 0,
          contentCategory: result.contentCategory || 'general'
        };

        // 엑셀 파일 특화 데이터
        if (result.documentType === 'excel' || result.extension === '.xlsx' || result.extension === '.xls') {
          documentData.excelSpecific = {
            sheets: result.analysis?.metadata?.sheets || [],
            totalSheets: result.summary?.totalSheets || 0,
            totalRows: result.summary?.totalRows || 0,
            totalCells: result.summary?.totalCells || 0,
            dataTypes: result.analysis?.dataTypes || {},
            patterns: result.analysis?.patterns || {},
            statistics: result.analysis?.statistics || {},
            insights: result.analysis?.insights || {},
            outliers: result.analysis?.outliers || {},
            visualization: result.analysis?.visualization || {},
            quality: result.analysis?.quality || {},
            recommendations: result.analysis?.recommendations || {}
          };
        }

        // PDF 파일 특화 데이터
        if (result.documentType === 'pdf' || result.extension === '.pdf') {
          documentData.pdfSpecific = {
            pages: result.summary?.pages || 0,
            hasImages: result.metadata?.hasImages || false,
            hasTables: result.metadata?.hasTables || false,
            textExtraction: result.metadata?.textExtraction || 'success'
          };
        }

        // 워드 파일 특화 데이터
        if (result.documentType === 'word' || result.extension === '.docx' || result.extension === '.doc') {
          documentData.wordSpecific = {
            hasImages: result.metadata?.hasImages || false,
            hasTables: result.metadata?.hasTables || false,
            warnings: result.metadata?.warnings || [],
            structure: result.metadata?.structure || {},
            documentProperties: result.metadata?.documentProperties || {},
            formatting: result.metadata?.formatting || {}
          };
        }

        // 한글 파일 특화 데이터
        if (result.documentType === 'hwp' || result.extension === '.hwp' || result.extension === '.hml') {
          documentData.hwpSpecific = {
            pages: result.summary?.pages || 0,
            hasImages: result.metadata?.hasImages || false,
            hasTables: result.metadata?.hasTables || false,
            hasCharts: result.metadata?.hasCharts || false,
            textExtraction: result.metadata?.textExtraction || 'success',
            documentProperties: result.metadata?.documentProperties || {},
            structure: result.metadata?.structure || {},
            warnings: result.metadata?.warnings || []
          };
        }

        // PowerPoint 파일 특화 데이터
        if (result.documentType === 'powerpoint' || result.extension === '.ppt' || result.extension === '.pptx') {
          documentData.powerpointSpecific = {
            slides: result.summary?.slides || 0,
            hasImages: result.metadata?.hasImages || false,
            hasCharts: result.metadata?.hasCharts || false,
            hasAnimations: result.metadata?.hasAnimations || false,
            hasTransitions: result.metadata?.hasTransitions || false,
            textExtraction: result.metadata?.textExtraction || 'limited',
            slideNotes: result.metadata?.slideNotes || [],
            documentProperties: result.metadata?.documentProperties || {},
            warnings: result.metadata?.warnings || []
          };
        }

        // CSV 파일 특화 데이터
        if (result.documentType === 'csv' || result.extension === '.csv') {
          documentData.csvSpecific = {
            rows: result.summary?.rows || 0,
            columns: result.summary?.columns || 0,
            headers: result.analysis?.headers || [],
            dataTypes: result.analysis?.dataTypes || {},
            patterns: result.analysis?.patterns || {},
            statistics: result.analysis?.statistics || {},
            quality: result.analysis?.quality || {},
            encoding: result.metadata?.encoding || 'utf-8',
            delimiter: result.metadata?.delimiter || ',',
            hasQuotes: result.metadata?.hasQuotes || false
          };
        }

        // JSON 파일 특화 데이터
        if (result.documentType === 'json' || result.extension === '.json') {
          documentData.jsonSpecific = {
            structure: result.analysis?.structure || {},
            dataTypes: result.analysis?.dataTypes || {},
            depth: result.analysis?.depth || 0,
            isValid: result.metadata?.isValid || false,
            rootType: result.metadata?.rootType || 'unknown',
            rootSize: result.metadata?.rootSize || 0,
            encoding: result.metadata?.encoding || 'utf-8',
            formatting: result.metadata?.formatting || {}
          };
        }

        // XML 파일 특화 데이터
        if (result.documentType === 'xml' || result.extension === '.xml') {
          documentData.xmlSpecific = {
            tags: result.analysis?.tags || [],
            attributes: result.analysis?.attributes || {},
            isValid: result.metadata?.isValid || false,
            rootElement: result.metadata?.rootElement || null,
            depth: result.analysis?.depth || 0,
            encoding: result.metadata?.encoding || 'utf-8',
            namespace: result.metadata?.namespace || null,
            dtd: result.metadata?.dtd || null
          };
        }

        // YAML 파일 특화 데이터
        if (result.documentType === 'yaml' || result.extension === '.yaml' || result.extension === '.yml') {
          documentData.yamlSpecific = {
            keys: result.analysis?.keys || [],
            dataTypes: result.analysis?.dataTypes || {},
            depth: result.analysis?.depth || 0,
            isValid: result.metadata?.isValid || false,
            indentation: result.metadata?.indentation || 2,
            encoding: result.metadata?.encoding || 'utf-8',
            structure: result.analysis?.structure || {}
          };
        }

        // 텍스트 파일 특화 데이터
        if (result.documentType === 'text' || ['.txt', '.md', '.rtf'].includes(result.extension)) {
          documentData.textSpecific = {
            encoding: result.metadata?.encoding || 'utf-8',
            lineEndings: result.metadata?.lineEndings || 'unix',
            hasMarkdown: result.extension === '.md',
            hasRichText: result.extension === '.rtf',
            formatting: result.metadata?.formatting || {},
            structure: result.metadata?.structure || {}
          };
        }
      }

      // 최종 표준화된 JSON 응답 구성
      const formattedResponse = {
        success: isError ? false : true,
        action: action,
        data: isError ? result : documentData,
        error: isError ? result.error : undefined,
        technical_error: isError ? result.technical_error : undefined,
        error_code: isError ? result.error_code : undefined,
        suggestions: isError ? result.suggestions : undefined,
        metadata: metadata,
        performance: performance,
        // 추가 정보
        ai_ready: true,
        format_version: '2.0',
        compatibility: {
          claude: true,
          openai: true,
          gemini: true
        }
      };

      logger.success(`📄 [DocumentContentAnalyzer] formatJsonResponse 완료 - success: ${formattedResponse.success}`);
      
      return formattedResponse;

    } catch (error) {
      logger.error(`📄 [DocumentContentAnalyzer] formatJsonResponse 오류:`, error);
      
      // 오류 발생 시 기본 구조로 반환
      return {
        success: false,
        action: action,
        error: 'JSON 포맷팅 중 오류가 발생했습니다',
        technical_error: error.message,
        metadata: {
          service: 'document-analysis',
          version: '2.0-premium',
          timestamp: new Date().toISOString(),
          user_id: context.userId || null
        },
        performance: {
          execution_time: null,
          cached: false
        }
      };
    }
  }

  /**
   * 💾 분석 결과 자동 저장
   * 분석 완료 후 원시데이터를 개별 JSON 파일로 저장
   */
  async saveAnalysisResult(filePath, result, saveDir) {
    try {
      logger.info(`💾 분석 결과 저장 시작: ${filePath}`);
      
      const fs = await import('fs');
      const path = await import('path');
      
      // 저장 디렉토리 설정 (사용자 지정 경로 우선, 없으면 기본값)
      let finalSaveDir = saveDir;
      if (!finalSaveDir) {
        finalSaveDir = path.join('D:', 'my_app', 'Web_MCP_Server', 'ai', 'data', 'ai_learning', 'analyses');
      }
      logger.info(`📁 저장 디렉토리: ${finalSaveDir}`);
      
      // 디렉토리가 없으면 생성
      try {
        await fs.promises.mkdir(finalSaveDir, { recursive: true });
      } catch (mkdirError) {
        logger.warn(`📁 디렉토리 생성 실패 (이미 존재할 수 있음): ${mkdirError.message}`);
      }
      
      // 안전한 파일명 생성
      const fileName = this.generateSafeFileName(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const saveFileName = `${fileName}_${timestamp}.json`;
      const savePath = path.join(finalSaveDir, saveFileName);
      
      // 저장할 데이터 구성
      const saveData = {
        filePath: filePath,
        fileName: path.basename(filePath),
        analysisResult: result,
        timestamp: new Date().toISOString(),
        fileSize: result.size || 0,
        documentType: result.documentType || 'unknown'
      };
      
      // JSON 파일로 저장
      await fs.promises.writeFile(savePath, JSON.stringify(saveData, null, 2), 'utf-8');
      
      // 인덱스 파일 업데이트
      await this.updateAnalysisIndex(finalSaveDir, saveFileName, saveData);
      
      logger.success(`💾 분석 결과 저장 완료: ${savePath}`);
      
      return {
        success: true,
        savedPath: savePath,
        fileName: saveFileName,
        fileSize: saveData.fileSize
      };
      
    } catch (error) {
      logger.error(`❌ 분석 결과 저장 실패: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🔧 안전한 파일명 생성
   */
  generateSafeFileName(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // 특수문자 제거 및 안전한 문자로 변환
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_')  // Windows에서 사용할 수 없는 문자
      .replace(/\s+/g, '_')           // 공백을 언더스코어로
      .replace(/[^\w\-_]/g, '')       // 알파벳, 숫자, 언더스코어, 하이픈만 허용
      .substring(0, 50);              // 길이 제한
  }

  /**
   * 📋 분석 인덱스 업데이트
   */
  async updateAnalysisIndex(saveDir, fileName, saveData) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const indexPath = path.join(saveDir, 'index.json');
      let index = { analyses: {}, lastUpdated: new Date().toISOString() };
      
      // 기존 인덱스 파일이 있으면 읽기
      try {
        const existingIndex = await fs.promises.readFile(indexPath, 'utf-8');
        index = JSON.parse(existingIndex);
      } catch (readError) {
        // 파일이 없으면 새로 생성
        logger.info(`📋 새로운 분석 인덱스 생성`);
      }
      
      // 새 분석 정보 추가
      index.analyses[fileName] = {
        filePath: saveData.filePath,
        fileName: saveData.fileName,
        timestamp: saveData.timestamp,
        fileSize: saveData.fileSize,
        documentType: saveData.documentType
      };
      
      // 마지막 업데이트 시간 갱신
      index.lastUpdated = new Date().toISOString();
      
      // 인덱스 파일 저장
      await fs.promises.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
      
      logger.info(`📋 분석 인덱스 업데이트 완료: ${fileName}`);
      
    } catch (error) {
      logger.error(`❌ 분석 인덱스 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 📖 저장된 분석 결과 읽기
   */
  async loadAnalysisResult(fileName) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const saveDir = path.join('D:', 'my_app', 'Web_MCP_Server', 'ai', 'data', 'ai_learning', 'analyses');
      const filePath = path.join(saveDir, fileName);
      
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      logger.error(`❌ 저장된 분석 결과 읽기 실패: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 📋 저장된 분석 목록 조회
   */
  async getAnalysisList() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const saveDir = path.join('D:', 'my_app', 'Web_MCP_Server', 'ai', 'data', 'ai_learning', 'analyses');
      const indexPath = path.join(saveDir, 'index.json');
      
      const content = await fs.promises.readFile(indexPath, 'utf-8');
      const index = JSON.parse(content);
      
      return {
        success: true,
        analyses: index.analyses,
        lastUpdated: index.lastUpdated
      };
      
    } catch (error) {
      logger.error(`❌ 분석 목록 조회 실패: ${error.message}`);
      return {
        success: false,
        error: error.message,
        analyses: {}
      };
    }
  }
}

export { DocumentContentAnalyzer }; 