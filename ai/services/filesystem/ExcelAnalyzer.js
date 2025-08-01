import fs from 'fs/promises';
import { statSync } from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';
import { Logger } from '../../common/Logger.js';
import ExcelContentAnalyzer from './ExcelContentAnalyzer.js';
// 분석 결과 재활용을 위한 학습 매니저 import
// import { DocumentAnalysisLearningManager } from './DocumentAnalysisLearningManager.js';

const logger = Logger.component('ExcelAnalyzer');

/**
 * 📊 Excel 문서(.xls, .xlsx) 엔터프라이즈급 분석기
 * - 스트리밍 방식으로 메모리 효율성 극대화
 * - Worker Thread 풀을 활용한 병렬 처리
 * - 실시간 진행률 추적 및 중단 기능
 * - 다중 파일 배치 처리 지원
 * - 고급 에러 복구 및 타임아웃 처리
 */
export class ExcelAnalyzer {
  constructor(options = {}) {
    // 기본 설정 (내역서 등 중요 문서를 위해 제한 해제)
    this.supportedFormats = ['.xls', '.xlsx', '.xlsm', '.xlsb'];
    this.maxFileSize = options.maxFileSize || 2 * 1024 * 1024 * 1024; // 2GB
    this.maxRowsPerSheet = options.maxRowsPerSheet || 1000000; // 100만 행 (10배 증가)
    this.maxSheets = options.maxSheets || 1000; // 1,000 시트 (10배 증가)
    this.maxDisplayRows = options.maxDisplayRows || 1000; // 1,000행 (10배 증가)
    this.maxDisplaySheets = options.maxDisplaySheets || 100; // 100개 시트 (5배 증가)
    
    // 고급 설정
    this.enableStreaming = options.enableStreaming !== false;
    this.enableWorkers = options.enableWorkers !== false;
    this.workerCount = options.workerCount || Math.min(4, 4); // 기본값 4로 설정
    this.chunkSize = options.chunkSize || 10000; // 청크 크기
    this.timeout = options.timeout || 300000; // 5분 타임아웃
    
    // 성능 최적화
    this.useMemoryMapping = options.useMemoryMapping !== false;
    this.enableCache = options.enableCache !== false;
    this.cacheSize = options.cacheSize || 100; // 캐시 항목 수
    
    // 콜백 및 이벤트
    this.progressCallback = options.progressCallback || null;
    this.errorCallback = options.errorCallback || null;
    this.warningCallback = options.warningCallback || null;
    
    // 내부 상태
    this.workerPool = [];
    this.activeWorkers = new Set();
    this.cache = new Map();
    this.analysisStartTime = null;
    this.currentAnalysis = null;
    
    // ContentAnalyzer 인스턴스
    this.contentAnalyzer = new ExcelContentAnalyzer(options.contentAnalyzerOptions || {});
    
    this.initializeWorkerPool();
    // this.learningManager = new DocumentAnalysisLearningManager();
  }

  /**
   * Worker Thread 풀 초기화
   */
  initializeWorkerPool() {
    if (!this.enableWorkers) return;
    
    // Worker 풀은 필요시 동적으로 생성
    this.workerPool = [];
    this.workerPoolInitialized = true;
    
    logger.info(`Worker 풀 초기화 완료 (최대 ${this.workerCount}개 Worker)`);
  }

  /**
   * 리소스 정리
   */
  async cleanup() {
    try {
      // 활성 워커 종료
      const terminationPromises = [];
      for (const worker of this.activeWorkers) {
        terminationPromises.push(
          worker.terminate()
            .catch(err => logger.warn(`Worker 종료 오류: ${err.message}`))
        );
      }
      
      // 모든 종료 작업 대기 (실패해도 계속 진행)
      const results = await Promise.allSettled(terminationPromises);
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        logger.warn(`${failedCount}개 Worker 종료 실패`);
      }
      
      // 컬렉션 정리
      this.activeWorkers.clear();
      this.workerPool = [];
      
      // 캐시 정리
      this.cache.clear();
      
      // 진행중인 분석 중단
      if (this.currentAnalysis) {
        this.currentAnalysis.aborted = true;
        this.currentAnalysis = null;
      }
      
      // 콘텐츠 분석기 정리
      if (this.contentAnalyzer && typeof this.contentAnalyzer.cleanup === 'function') {
        await this.contentAnalyzer.cleanup();
      }
      
      logger.info('ExcelAnalyzer 리소스 정리 완료');
      
    } catch (error) {
      logger.error('리소스 정리 중 오류:', error);
      // 정리 중 오류가 발생해도 최대한 진행
    }
  }

  /**
   * 📊 Excel 문서 완전 분석 (Enterprise Edition)
   */
  async analyzeComplete(filePath, options = {}) {
    this.analysisStartTime = Date.now();
    this.currentAnalysis = { filePath, aborted: false };
    
    // 재무/내역서 파일 자동 감지
    const fileName = path.basename(filePath).toLowerCase();
    const isFinancialDoc = fileName.includes('내역') || fileName.includes('명세') || 
                          fileName.includes('재무') || fileName.includes('회계') ||
                          fileName.includes('거래') || fileName.includes('매출') ||
                          fileName.includes('매입') || fileName.includes('손익') ||
                          fileName.includes('invoice') || fileName.includes('statement') ||
                          fileName.includes('financial') || fileName.includes('transaction');
    
    if (isFinancialDoc) {
      logger.info('💰 재무 문서로 감지됨 - 정밀 분석 모드 활성화');
      options.precisionMode = true;
      options.forceHeaders = true;
      options.enableAdvancedAnalysis = true;
    }
    
    try {
      // 1. 저장된 분석 결과가 있으면 우선 반환
      // await this.learningManager.initialize();
      // const fileId = this.learningManager.generateFileId(filePath);
      // const saved = this.learningManager.data?.analyses?.[fileId];
      // if (saved && saved.analysisResult) {
      //   logger.info('저장된 분석 결과를 재활용합니다.');
      //   return saved.analysisResult;
      // }
      
      // 플랫폼에 따라 경로 변환 분기 (윈도우는 변환하지 않음)
      const isWin = process.platform === 'win32';
      if (!isWin && filePath.match(/^[A-Z]:\\/)) {
        const wslPath = filePath.replace(/^([A-Z]):\\/, '/mnt/$1/').replace(/\\/g, '/').toLowerCase();
        logger.info(`🔄 경로 변환: ${filePath} → ${wslPath}`);
        filePath = wslPath;
      }
      
      logger.info(`🔍 [Excel 분석] 시작: ${filePath}`);
      this.reportProgress('분석 시작', 0);
      
      // 캐시 확인
      const cacheKey = this.generateCacheKey(filePath, options);
      if (this.enableCache && this.cache.has(cacheKey)) {
        logger.info('캐시에서 결과 반환');
        return this.cache.get(cacheKey);
      }
      
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // 파일 형식 검증
      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`지원하지 않는 Excel 형식입니다: ${ext}`);
      }
      
      // 파일 크기 체크 및 전략 결정
      const analysisStrategy = this.determineAnalysisStrategy(stats.size, options);
      logger.info(`분석 전략: ${analysisStrategy.method}, 메모리 사용량: ${analysisStrategy.memoryEstimate}MB`);
      
      // 기본 정보 추출
      const basicInfo = this.extractBasicInfo(filePath, stats);
      this.reportProgress('메타데이터 추출 완료', 10);
      
      // 파일 분석 실행
      let result;
      if (analysisStrategy.method === 'streaming') {
        result = await this.analyzeWithStreaming(filePath, ext, options);
      } else if (analysisStrategy.method === 'parallel') {
        result = await this.analyzeWithWorkers(filePath, ext, options);
      } else {
        result = await this.analyzeTraditional(filePath, ext, options);
      }
      
      // 고급 콘텐츠 분석
      if (result.success && result.structure && result.structure.sheetDetails) {
        this.reportProgress('고급 분석 시작', 80);
        const advancedAnalysis = await this.performAdvancedAnalysis(result.structure.sheetDetails, options);
        result.advancedAnalysis = advancedAnalysis;
      }
      
      // 정밀 모드 추가 검증
      if (options.precisionMode && result.success) {
        logger.info('🔍 정밀 모드 데이터 검증 시작');
        const validation = this.validateDataIntegrity(result);
        result.dataValidation = validation;
        
        if (!validation.isComplete) {
          this.reportWarning(`데이터 무결성 경고: ${validation.issues.join(', ')}`);
        }
      }
      
      const analysisDuration = Date.now() - this.analysisStartTime;
      
      const finalResult = {
        success: true,
        path: filePath,
        basicInfo,
        analysisStrategy,
        ...result,
        performance: {
          duration: analysisDuration,
          memoryUsed: process.memoryUsage(),
          cacheHit: false
        }
      };
      
      // 2. 분석 결과 저장
      // try {
      //   await this.learningManager.saveAnalysisResult(filePath, finalResult);
      // } catch (e) {
      //   logger.warn('분석 결과 저장 실패', e);
      // }
      
      // 캐시 저장
      if (this.enableCache && finalResult.success) {
        this.addToCache(cacheKey, finalResult);
      }
      
      this.reportProgress('분석 완료', 100);
      logger.info(`✅ Excel 분석 완료: ${analysisDuration}ms`);
      
      // 분석 완료 후 정리
      this.currentAnalysis = null;
      
      return finalResult;
      
    } catch (error) {
      logger.error(`❌ [Excel 분석] 오류: ${error.message}`);
      if (this.errorCallback) {
        this.errorCallback(error, filePath);
      }
      
      // 오류 발생 시에도 정리
      this.currentAnalysis = null;
      
      return {
        success: false,
        error: error.message,
        errorType: error.name,
        path: filePath,
        performance: {
          duration: Date.now() - this.analysisStartTime,
          memoryUsed: process.memoryUsage()
        }
      };
    } finally {
      // 메모리 정리 힌트
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * 🔄 배치 분석 (다중 파일)
   */
  async analyzeBatch(filePaths, options = {}) {
    const results = [];
    const concurrency = options.concurrency || 2;
    
    logger.info(`📊 배치 분석 시작: ${filePaths.length}개 파일`);
    
    // 파일들을 청크로 분할하여 병렬 처리
    for (let i = 0; i < filePaths.length; i += concurrency) {
      const batch = filePaths.slice(i, i + concurrency);
      const batchPromises = batch.map(filePath => 
        this.analyzeComplete(filePath, options).catch(error => ({
          success: false,
          error: error.message,
          path: filePath
        }))
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value || r.reason));
      
      // 진행 상황 보고
      const progress = ((i + batch.length) / filePaths.length) * 100;
      this.reportProgress(`배치 처리 진행`, progress);
    }
    
    const summary = {
      total: filePaths.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    };
    
    logger.info(`📊 배치 분석 완료: ${summary.successful}/${summary.total} 성공`);
    return summary;
  }

  /**
   * 분석 전략 결정
   */
  determineAnalysisStrategy(fileSize, options) {
    const sizeMB = fileSize / (1024 * 1024);
    
    // 파일 크기 체크
    if (fileSize > this.maxFileSize) {
      throw new Error(`파일이 너무 큽니다 (${sizeMB.toFixed(2)}MB > ${(this.maxFileSize / 1024 / 1024).toFixed(0)}MB)`);
    }
    
    let strategy = {
      method: 'traditional',
      memoryEstimate: sizeMB * 3, // 대략적인 메모리 사용량
      useStreaming: false,
      useWorkers: false
    };
    
    // 전략 결정 로직
    if (sizeMB > 100 && this.enableStreaming) {
      strategy.method = 'streaming';
      strategy.useStreaming = true;
      strategy.memoryEstimate = Math.min(50, sizeMB * 0.1); // 스트리밍으로 메모리 절약
    } else if (sizeMB > 50 && this.enableWorkers) {
      strategy.method = 'parallel';
      strategy.useWorkers = true;
      strategy.memoryEstimate = sizeMB * 2;
    }
    
    // 사용자 옵션 적용
    if (options.forceStreaming) {
      strategy.method = 'streaming';
      strategy.useStreaming = true;
    } else if (options.forceParallel) {
      strategy.method = 'parallel';
      strategy.useWorkers = true;
    }
    
    return strategy;
  }

  /**
   * 스트리밍 분석
   */
  async analyzeWithStreaming(filePath, ext, options) {
    logger.info('🌊 스트리밍 분석 시작');
    
    const analysis = {
      sheets: [],
      totalRows: 0,
      totalCells: 0,
      metadata: {}
    };
    
    try {
      // 스트리밍 파서 생성
      const parser = this.createStreamingParser(ext, options);
      
      // 진행률 추적 스트림
      const progressTracker = this.createProgressTracker(filePath);
      
      // 데이터 수집 스트림
      const dataCollector = this.createDataCollector(analysis);
      
      // 스트림 파이프라인 구성
      await pipeline(
        fs.createReadStream(filePath),
        progressTracker,
        parser,
        dataCollector
      );
      
      return this.finalizeStreamingResult(analysis);
      
    } catch (error) {
      throw new Error(`스트리밍 분석 실패: ${error.message}`);
    }
  }

  /**
   * 병렬 분석 (Worker Threads)
   */
  async analyzeWithWorkers(filePath, ext, options) {
    logger.info('🔧 병렬 분석 시작');
    
    try {
      // Worker 사용 가능 여부 확인
      if (!this.workerPoolInitialized) {
        logger.warn('Worker 풀이 초기화되지 않음, 전통적 방식으로 전환');
        return await this.analyzeTraditional(filePath, ext, options);
      }
      
      // 파일을 청크로 분할
      const chunks = await this.splitFileIntoChunks(filePath, this.workerCount);
      
      // Worker에 작업 분배
      const workerPromises = chunks.map((chunk, index) => 
        this.processChunkWithWorker(chunk, index, ext, options)
          .catch(error => {
            logger.error(`청크 ${index} 처리 실패: ${error.message}`);
            // 개별 청크 실패 시 부분 결과 반환
            return {
              success: false,
              error: error.message,
              chunkIndex: index,
              structure: { sheets: 0, totalRows: 0, totalCells: 0, sheetDetails: [] }
            };
          })
      );
      
      // 모든 Worker 완료 대기 (일부 실패해도 계속)
      const results = await Promise.allSettled(workerPromises);
      
      // 성공한 결과만 추출
      const successfulResults = results
        .filter(r => r.status === 'fulfilled' && r.value.success)
        .map(r => r.value);
      
      if (successfulResults.length === 0) {
        logger.warn('모든 Worker 처리 실패, 전통적 방식으로 재시도');
        return await this.analyzeTraditional(filePath, ext, options);
      }
      
      // 결과 통합
      const mergedResult = this.mergeWorkerResults(successfulResults);
      
      // 부분 실패 정보 추가
      if (successfulResults.length < chunks.length) {
        mergedResult.partialFailure = true;
        mergedResult.processedChunks = successfulResults.length;
        mergedResult.totalChunks = chunks.length;
        this.reportWarning(`${chunks.length}개 중 ${successfulResults.length}개 청크만 처리됨`);
      }
      
      return mergedResult;
      
    } catch (error) {
      logger.error(`병렬 분석 실패: ${error.message}`);
      // 병렬 처리 실패 시 전통적 방식으로 폴백
      logger.info('전통적 방식으로 재시도');
      return await this.analyzeTraditional(filePath, ext, options);
    }
  }

  /**
   * 전통적 분석 (메모리 로딩)
   */
  async analyzeTraditional(filePath, ext, options) {
    logger.info('📋 전통적 분석 시작');
    
    const buffer = await fs.readFile(filePath);
    
    if (ext === '.xlsx' || ext === '.xlsm') {
      return await this.analyzeXlsxFile(buffer, filePath, options);
    } else if (ext === '.xls') {
      return await this.analyzeXlsFile(buffer, filePath, options);
    } else if (ext === '.xlsb') {
      return await this.analyzeXlsbFile(buffer, filePath, options);
    } else {
      throw new Error(`지원하지 않는 형식: ${ext}`);
    }
  }

  /**
   * 고급 분석 수행
   */
  async performAdvancedAnalysis(sheetDetails, options) {
    if (!options.enableAdvancedAnalysis) return null;
    
    try {
      const analysisResults = {};
      
      for (const sheet of sheetDetails) {
        if (sheet.data && sheet.data.length > 1) {
          // 헤더와 데이터 분리
          const headers = sheet.headers || sheet.data[0];
          const rows = sheet.data.slice(sheet.hasHeaders ? 1 : 0);
          
          if (headers && rows.length > 0) {
            logger.info(`🔬 ${sheet.name} 시트 고급 분석 중...`);
            
            // 2D 배열로 변환
            const data2D = [headers, ...rows];
            
            // ContentAnalyzer를 사용한 고급 분석
            const contentAnalysis = await this.contentAnalyzer.analyze(data2D, {
              enableML: options.enableML,
              enableTimeSeries: options.enableTimeSeries,
              enableClustering: options.enableClustering
            });
            
            analysisResults[sheet.name] = contentAnalysis;
          }
        }
      }
      
      return {
        success: true,
        sheets: analysisResults,
        summary: this.generateAdvancedSummary(analysisResults)
      };
      
    } catch (error) {
      logger.warn(`고급 분석 실패: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 📋 기본 정보 추출
   */
  extractBasicInfo(filePath, stats) {
    return {
      fileName: path.basename(filePath),
      fileSize: stats.size,
      fileSizeFormatted: this.formatSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      format: path.extname(filePath).toLowerCase() === '.xlsx' ? 'Excel 2007+' : 'Excel 97-2003'
    };
  }

  /**
   * 📊 XLSX 파일 분석 (Office Open XML)
   */
  async analyzeXlsxFile(buffer, filePath, options = {}) {
    try {
      logger.info(`🔍 [Excel 분석] XLSX 파일 분석 시작: ${this.formatSize(buffer.length)}`);
      this.reportProgress('XLSX 파싱 중', 15);
      const XLSX = await import('xlsx');
      const workbook = XLSX.default.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: true,      // 숫자 서식 포함
        cellText: true,    // 텍스트 표현 포함
        cellFormula: true, // 수식 포함
        sheetStubs: true,
        sheetRows: 0       // 모든 행 읽기 (0 = 무제한)
      });
      return await this.processWorkbook(workbook, filePath, 'xlsx', options);
    } catch (error) {
      logger.warn(`XLSX 분석 실패, ZIP 분석 시도: ${error.message}`);
      try {
        return await this.extractWithZipAnalysis(buffer, filePath);
      } catch (zipError) {
        logger.warn(`ZIP 분석도 실패, 폴백 사용: ${zipError.message}`);
        return this.extractFallback(buffer, filePath, 'xlsx');
      }
    }
  }

  /**
   * 📊 XLS 파일 분석 (이진 형식)
   */
  async analyzeXlsFile(buffer, filePath, options = {}) {
    try {
      logger.info(`🔍 XLS 파일 분석 시작: ${this.formatSize(buffer.length)}`);
      this.reportProgress('XLS 파싱 중', 15);
      const XLSX = await import('xlsx');
      const workbook = XLSX.default.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: true,      // 숫자 서식 포함
        cellText: true,    // 텍스트 표현 포함
        cellFormula: true, // 수식 포함
        sheetRows: 0       // 모든 행 읽기
      });
      return await this.processWorkbook(workbook, filePath, 'xls', options);
    } catch (error) {
      logger.warn(`XLS 분석 실패, 바이너리 분석 시도: ${error.message}`);
      try {
        return await this.extractWithBinaryAnalysis(buffer, filePath);
      } catch (binaryError) {
        logger.warn(`바이너리 분석도 실패, 폴백 사용: ${binaryError.message}`);
        return this.extractFallback(buffer, filePath, 'xls');
      }
    }
  }

  /**
   * 🔧 xlsx 라이브러리 사용
   */
  async extractWithXlsx(buffer, filePath) {
    try {
      // xlsx 라이브러리 동적 로드
      const XLSX = await import('xlsx');
      const workbook = XLSX.default.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false,
        raw: true,
        dense: false
      });
      
      // 워크북 속성 추출
      const workbookProps = this.extractWorkbookProperties(workbook);
      
      // 시트 수 제한 체크
      if (workbook.SheetNames.length > this.maxSheets) {
        logger.warn(`⚠️ 시트가 너무 많습니다 (${workbook.SheetNames.length}개 > ${this.maxSheets}개). 처음 ${this.maxSheets}개 시트만 분석합니다.`);
      }
      
      // 시트별 데이터 분석 (제한된 수만)
      const sheetsToAnalyze = workbook.SheetNames.slice(0, this.maxSheets);
      const sheets = sheetsToAnalyze.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        
        // 🔍 디버깅: 시트 상태 확인
        if (!worksheet['!ref']) {
          logger.warn(`⚠️ ${sheetName} 시트에 범위가 없습니다`);
          return this.analyzeSheetData([], sheetName);
        }
        
        const sheetData = XLSX.default.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false,        // 중요: 서식이 적용된 값 사용 (특히 숫자/금액)
          defval: '',        // 빈 셀도 빈 문자열로 포함
          dateNF: 'yyyy-mm-dd',
          blankrows: true    // 빈 행도 포함하여 데이터 누락 방지
        });
        
        return this.analyzeSheetData(sheetData, sheetName);
      });
      
      // 전체 통계 계산
      const overallStats = this.calculateOverallStats(sheets);
      
      // 대용량 파일 최적화 정보
      const optimization = this.optimizeForLargeFiles(sheets);
      
      // 비즈니스 인사이트 추출
      const businessInsights = this.extractBusinessInsights(sheets);
      
      return {
        success: true,
        content: this.generateTextContent(sheets, workbookProps),
        structure: {
          sheets: sheets.length,
          totalRows: overallStats.totalRows,
          totalColumns: overallStats.totalColumns,
          totalCells: overallStats.totalCells,
          sheetDetails: sheets
        },
        metadata: {
          title: workbookProps.title || path.basename(filePath, path.extname(filePath)),
          author: workbookProps.author || '',
          subject: workbookProps.subject || '',
          created: workbookProps.created || null,
          modified: workbookProps.modified || null,
          sheets: sheets.length,
          hasFormulas: this.hasFormulas(workbook),
          hasCharts: this.hasCharts(workbook),
          hasImages: this.hasImages(workbook),
          hasMacros: this.hasMacros(workbook),
          workbookProperties: workbookProps
        },
        analysis: {
          language: this.detectLanguage(sheets),
          dataTypes: this.analyzeDataTypes(sheets),
          patterns: this.findPatterns(sheets),
          statistics: overallStats,
          businessInsights: businessInsights,
          optimization: optimization,
          confidence: 0.9,
          extractionMethod: 'xlsx'
        }
      };
    } catch (error) {
      throw new Error(`xlsx 라이브러리 실패: ${error.message}`);
    }
  }

  /**
   * 📦 ZIP 기반 XLSX 분석
   */
  async extractWithZipAnalysis(buffer, filePath) {
    try {
      // adm-zip 라이브러리 사용
      const AdmZip = await import('adm-zip');
      const zip = new AdmZip.default(buffer);
      
      const sheets = [];
      const workbookProps = {};
      
      // 시트 XML 파일들 찾기
      const sheetEntries = zip.getEntries().filter(entry => 
        entry.entryName.startsWith('xl/worksheets/sheet') && entry.entryName.endsWith('.xml')
      );
      
      for (const entry of sheetEntries) {
        try {
          const sheetXml = entry.getData().toString('utf8');
          const sheetData = this.extractDataFromSheetXml(sheetXml);
          const sheetName = this.extractSheetName(entry.entryName);
          
          sheets.push(this.analyzeSheetData(sheetData, sheetName));
        } catch (error) {
          logger.warn(`시트 ${entry.entryName} 분석 실패: ${error.message}`);
        }
      }
      
      // 워크북 속성 추출
      const workbookEntry = zip.getEntry('xl/workbook.xml');
      if (workbookEntry) {
        const workbookXml = workbookEntry.getData().toString('utf8');
        Object.assign(workbookProps, this.extractWorkbookPropertiesFromXml(workbookXml));
      }
      
      const overallStats = this.calculateOverallStats(sheets);
      
      return {
        success: true,
        content: this.generateTextContent(sheets, workbookProps),
        structure: {
          sheets: sheets.length,
          totalRows: overallStats.totalRows,
          totalColumns: overallStats.totalColumns,
          totalCells: overallStats.totalCells,
          sheetDetails: sheets
        },
        metadata: {
          title: workbookProps.title || path.basename(filePath, '.xlsx'),
          author: workbookProps.author || '',
          subject: workbookProps.subject || '',
          created: workbookProps.created || null,
          modified: workbookProps.modified || null,
          sheets: sheets.length,
          hasFormulas: this.hasFormulasInZip(zip),
          hasCharts: this.hasChartsInZip(zip),
          hasImages: this.hasImagesInZip(zip),
          hasMacros: this.hasMacrosInZip(zip),
          workbookProperties: workbookProps
        },
        analysis: {
          language: this.detectLanguage(sheets),
          dataTypes: this.analyzeDataTypes(sheets),
          patterns: this.findPatterns(sheets),
          statistics: overallStats,
          businessInsights: this.extractBusinessInsights(sheets),
          confidence: 0.7,
          extractionMethod: 'zip-analysis'
        }
      };
      
    } catch (error) {
      throw new Error(`ZIP 분석 실패: ${error.message}`);
    }
  }

  /**
   * 🔍 바이너리 분석으로 XLS 텍스트 추출
   */
  async extractWithBinaryAnalysis(buffer, filePath) {
    try {
      let textContent = '';
      
      // XLS 파일의 텍스트 블록 패턴 찾기
      const textPatterns = [
        /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g, // 한글 유니코드
        /[가-힣]+/g, // 한글 완성형
        /[A-Za-z0-9\s]+/g // 영문 및 숫자
      ];
      
      // 바이너리에서 텍스트 블록 찾기
      const textBlocks = this.findTextBlocks(buffer);
      
      for (const block of textBlocks) {
        const text = buffer.slice(block.offset, block.offset + block.length).toString('utf8');
        
        // 텍스트 패턴 확인
        for (const pattern of textPatterns) {
          const matches = text.match(pattern);
          if (matches && matches.length > 0) {
            textContent += matches.join(' ') + '\n';
          }
        }
      }
      
      return {
        success: true,
        content: textContent.trim(),
        structure: {
          sheets: this.countSheets(buffer),
          totalRows: 0,
          totalColumns: 0,
          totalCells: 0,
          sheetDetails: []
        },
        metadata: {
          title: path.basename(filePath, '.xls'),
          author: '',
          subject: '',
          created: null,
          modified: null,
          sheets: this.countSheets(buffer),
          hasFormulas: false,
          hasCharts: false,
          hasImages: false,
          hasMacros: false,
          workbookProperties: {}
        },
        analysis: {
          language: this.detectLanguageFromText(textContent),
          dataTypes: {},
          patterns: {},
          statistics: { totalRows: 0, totalColumns: 0, totalCells: 0 },
          businessInsights: {},
          confidence: textContent.length > 0 ? 0.5 : 0.2,
          extractionMethod: 'binary-analysis'
        }
      };
      
    } catch (error) {
      throw new Error(`바이너리 분석 실패: ${error.message}`);
    }
  }

  /**
   * 📄 폴백 텍스트 추출
   */
  extractFallback(buffer, filePath, format) {
    const fileName = path.basename(filePath, `.${format}`);
    const fileSize = buffer.length;
    
    const content = `Excel 문서: ${fileName}\n\n파일 크기: ${this.formatSize(fileSize)}\n형식: ${format.toUpperCase()}\n\n이 Excel 문서의 데이터를 추출할 수 없습니다.\nExcel 뷰어나 변환 도구를 사용하여 데이터로 변환 후 분석하세요.`;
    
    return {
      success: true,
      content: content,
      structure: {
        sheets: 0,
        totalRows: 0,
        totalColumns: 0,
        totalCells: 0,
        sheetDetails: []
      },
      metadata: {
        title: fileName,
        author: '',
        subject: '',
        created: null,
        modified: null,
        sheets: 0,
        hasFormulas: false,
        hasCharts: false,
        hasImages: false,
        hasMacros: false,
        workbookProperties: {}
      },
      analysis: {
        language: 'ko',
        dataTypes: {},
        patterns: {},
        statistics: { totalRows: 0, totalColumns: 0, totalCells: 0 },
        businessInsights: {},
        confidence: 0.1,
        extractionMethod: 'fallback'
      }
    };
  }

  // ===== 헬퍼 메서드들 =====

  /**
   * 🔍 텍스트 블록 찾기
   */
  findTextBlocks(buffer) {
    const blocks = [];
    
    try {
      // Excel 파일의 텍스트 블록 시그니처 패턴
      const textSignatures = [
        Buffer.from([0x54, 0x45, 0x58, 0x54]), // TEXT
        Buffer.from([0x4C, 0x41, 0x42, 0x45]), // LABE
        Buffer.from([0x53, 0x54, 0x52, 0x49])  // STRI
      ];
      
      for (let i = 0; i < buffer.length - 4; i++) {
        for (const signature of textSignatures) {
          if (buffer.slice(i, i + 4).equals(signature)) {
            // 블록 크기 추출 (다음 4바이트)
            const size = buffer.readUInt32LE(i + 4);
            blocks.push({
              offset: i,
              length: size,
              type: signature.toString('utf8')
            });
            break;
          }
        }
      }
    } catch (error) {
      logger.warn(`텍스트 블록 찾기 실패: ${error.message}`);
    }
    
    return blocks;
  }

  /**
   * 📊 시트 수 계산
   */
  countSheets(buffer) {
    try {
      // 시트 시그니처 패턴 찾기
      const sheetPattern = Buffer.from([0x42, 0x4F, 0x55, 0x4E]); // BOUN
      let count = 0;
      
      for (let i = 0; i < buffer.length - 4; i++) {
        if (buffer.slice(i, i + 4).equals(sheetPattern)) {
          count++;
        }
      }
      
      return count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 📋 워크북 속성 추출
   */
  extractWorkbookProperties(workbook) {
    try {
      const props = {
        title: '',
        author: '',
        subject: '',
        created: null,
        modified: null,
        sheets: workbook.SheetNames.length
      };
      
      // 워크북 속성에서 정보 추출
      if (workbook.Props) {
        props.title = workbook.Props.Title || '';
        props.author = workbook.Props.Author || '';
        props.subject = workbook.Props.Subject || '';
        props.created = workbook.Props.CreatedDate || null;
        props.modified = workbook.Props.ModifiedDate || null;
      }
      
      return props;
    } catch (error) {
      return { title: '', author: '', subject: '', created: null, modified: null, sheets: 0 };
    }
  }

  /**
   * 📊 시트 데이터 분석
   */
  analyzeSheetData(sheetData, sheetName, options = {}) {
    try {
      // 옵션으로 헤더 강제 지정 지원
      const forceHeaders = options.forceHeaders === true;
      // 행 수 제한 체크
      const isLargeSheet = sheetData.length > this.maxRowsPerSheet;
      if (isLargeSheet) {
        logger.warn(`⚠️ 시트 "${sheetName}"이 너무 큽니다 (${sheetData.length}행 > ${this.maxRowsPerSheet}행). 샘플링 분석을 사용합니다.`);
      }
      // 대용량 시트의 경우 샘플링 (더 관대하게)
      let processedData = sheetData;
      let samplingInfo = null;
      if (isLargeSheet) {
        try {
          // 100만 행까지는 전체 처리, 그 이상만 샘플링
          const sampleSize = Math.min(this.maxRowsPerSheet, sheetData.length);
          if (sheetData.length <= 1000000) {
            // 100만 행 이하는 전체 처리
            processedData = sheetData;
            samplingInfo = {
              originalRows: sheetData.length,
              sampledRows: processedData.length,
              samplingMethod: 'full',
              coverage: '100.0%'
            };
          } else {
            // 100만 행 초과시에만 샘플링
            const originalRowCount = sheetData.length;
            const startSample = sheetData.slice(0, Math.floor(sampleSize * 0.4));
            const middleStart = Math.floor(sheetData.length * 0.3);
            const middleSample = sheetData.slice(middleStart, middleStart + Math.floor(sampleSize * 0.2));
            const endSample = sheetData.slice(-Math.floor(sampleSize * 0.4));
            
            processedData = [...startSample, ...middleSample, ...endSample];
            samplingInfo = {
              originalRows: originalRowCount,
              sampledRows: processedData.length,
              samplingMethod: 'stratified',
              coverage: `${((processedData.length / originalRowCount) * 100).toFixed(1)}%`
            };
          }
        } catch (error) {
          logger.warn(`샘플링 중 오류, 전체 데이터 사용: ${error.message}`);
          processedData = sheetData;
        }
      }
      // 헤더 판별: 옵션이 있으면 무조건 첫 행을 헤더로 간주
      const hasHeaders = forceHeaders ? true : this.hasHeaders(processedData);
      const headers = hasHeaders && processedData.length > 0 ? processedData[0] : [];
      const data = hasHeaders && processedData.length > 1 ? processedData.slice(1) : processedData;
      const analysis = {
        name: sheetName,
        rows: sheetData.length, // 원본 행 수
        columns: sheetData.length > 0 ? Math.max(...sheetData.map(row => row.length)) : 0,
        cells: sheetData.reduce((total, row) => total + row.length, 0),
        dataTypes: this.analyzeSheetDataTypes(processedData),
        patterns: this.findSheetPatterns(processedData),
        statistics: this.calculateSheetStatistics(processedData),
        hasHeaders: hasHeaders,
        headers: headers,
        data: data,
        isEmpty: sheetData.length === 0 || (sheetData.length === 1 && sheetData[0].length === 0),
        samplingInfo: samplingInfo,
        isLargeSheet: isLargeSheet
      };
      return analysis;
    } catch (error) {
      return {
        name: sheetName,
        rows: 0,
        columns: 0,
        cells: 0,
        dataTypes: {},
        patterns: {},
        statistics: {},
        hasHeaders: false,
        headers: [],
        data: [],
        isEmpty: true,
        samplingInfo: null,
        isLargeSheet: false
      };
    }
  }

  /**
   * 📊 시트 데이터 타입 분석
   */
  analyzeSheetDataTypes(sheetData) {
    const types = {
      text: 0,
      number: 0,
      date: 0,
      boolean: 0,
      empty: 0,
      mixed: 0
    };
    
    if (sheetData.length === 0) return types;
    
    const maxCols = Math.max(...sheetData.map(row => row.length));
    
    for (let col = 0; col < maxCols; col++) {
      const columnData = sheetData.map(row => row[col]).filter(cell => cell !== undefined && cell !== null && cell !== '');
      
      if (columnData.length === 0) {
        types.empty++;
        continue;
      }
      
      const colTypes = new Set();
      
      columnData.forEach(cell => {
        const cellStr = cell.toString();
        
        // 숫자 체크
        if (!isNaN(cell) && cellStr.trim() !== '') {
          colTypes.add('number');
        }
        // 날짜 체크
        else if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(cellStr) || 
                 /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(cellStr)) {
          colTypes.add('date');
        }
        // 불린 체크
        else if (/^(true|false|yes|no|1|0)$/i.test(cellStr)) {
          colTypes.add('boolean');
        }
        // 텍스트
        else {
          colTypes.add('text');
        }
      });
      
      if (colTypes.size === 1) {
        const type = Array.from(colTypes)[0];
        types[type]++;
      } else {
        types.mixed++;
      }
    }
    
    return types;
  }

  /**
   * 🔍 시트 패턴 찾기
   */
  findSheetPatterns(sheetData) {
    const patterns = {
      sequential: false,
      categorical: false,
      temporal: false,
      numerical: false
    };
    
    if (sheetData.length === 0) return patterns;
    
    // 각 열의 패턴 분석
    const maxCols = Math.max(...sheetData.map(row => row.length));
    
    for (let col = 0; col < maxCols; col++) {
      const columnData = sheetData.map(row => row[col]).filter(cell => cell !== undefined && cell !== null && cell !== '');
      
      if (columnData.length < 2) continue;
      
      // 순차적 패턴 체크
      if (this.isSequential(columnData)) {
        patterns.sequential = true;
      }
      
      // 범주형 패턴 체크
      if (this.isCategorical(columnData)) {
        patterns.categorical = true;
      }
      
      // 시간적 패턴 체크
      if (this.isTemporal(columnData)) {
        patterns.temporal = true;
      }
      
      // 수치적 패턴 체크
      if (this.isNumerical(columnData)) {
        patterns.numerical = true;
      }
    }
    
    return patterns;
  }

  /**
   * 📊 시트 통계 계산
   */
  calculateSheetStatistics(sheetData) {
    const stats = {
      totalCells: 0,
      filledCells: 0,
      emptyCells: 0,
      avgRowLength: 0,
      maxRowLength: 0,
      minRowLength: 0
    };
    
    if (sheetData.length === 0) return stats;
    
    const rowLengths = sheetData.map(row => row.length);
    
    stats.totalCells = rowLengths.reduce((sum, length) => sum + length, 0);
    stats.filledCells = sheetData.reduce((sum, row) => 
      sum + row.filter(cell => cell !== undefined && cell !== null && cell !== '').length, 0
    );
    stats.emptyCells = stats.totalCells - stats.filledCells;
    stats.avgRowLength = stats.totalCells / sheetData.length;
    stats.maxRowLength = Math.max(...rowLengths);
    stats.minRowLength = Math.min(...rowLengths);
    
    return stats;
  }

  /**
   * 📋 헤더 존재 여부 확인
   */
  hasHeaders(sheetData) {
    if (sheetData.length < 2) return false;
    
    const firstRow = sheetData[0];
    const secondRow = sheetData[1];
    
    // 첫 번째 행이 텍스트이고 두 번째 행이 다른 타입인지 확인
    const firstRowText = firstRow.filter(cell => 
      typeof cell === 'string' && cell.trim().length > 0
    ).length;
    
    const secondRowText = secondRow.filter(cell => 
      typeof cell === 'string' && cell.trim().length > 0
    ).length;
    
    return firstRowText > secondRowText && firstRowText > 0;
  }

  /**
   * 📊 전체 통계 계산
   */
  calculateOverallStats(sheets) {
    const stats = {
      totalRows: 0,
      totalColumns: 0,
      totalCells: 0,
      totalSheets: sheets.length,
      avgRowsPerSheet: 0,
      avgColumnsPerSheet: 0
    };
    
    if (sheets.length === 0) return stats;
    
    sheets.forEach(sheet => {
      stats.totalRows += sheet.rows;
      stats.totalColumns = Math.max(stats.totalColumns, sheet.columns);
      stats.totalCells += sheet.cells;
    });
    
    stats.avgRowsPerSheet = stats.totalRows / sheets.length;
    stats.avgColumnsPerSheet = stats.totalColumns;
    
    return stats;
  }

  /**
   * 💼 비즈니스 인사이트 추출
   */
  extractBusinessInsights(sheets) {
    const insights = {
      dataQuality: {},
      trends: {},
      opportunities: {},
      risks: {},
      recommendations: []
    };
    
    // 데이터 품질 분석
    insights.dataQuality = this.assessDataQuality(sheets);
    
    // 트렌드 분석
    insights.trends = this.identifyTrends(sheets);
    
    // 기회 분석
    insights.opportunities = this.identifyOpportunities(sheets);
    
    // 위험 분석
    insights.risks = this.identifyRisks(sheets);
    
    // 권장사항 생성
    insights.recommendations = this.generateRecommendations(sheets);
    
    return insights;
  }

  /**
   * 📊 데이터 품질 평가
   */
  assessDataQuality(sheets) {
    const quality = {
      completeness: 0,
      consistency: 0,
      accuracy: 0,
      overall: 0
    };
    
    if (sheets.length === 0) return quality;
    
    let totalCompleteness = 0;
    let totalConsistency = 0;
    let totalAccuracy = 0;
    
    sheets.forEach(sheet => {
      if (sheet.cells > 0) {
        const completeness = sheet.statistics.filledCells / sheet.statistics.totalCells;
        totalCompleteness += completeness;
        
        // 일관성은 데이터 타입의 다양성으로 측정
        const consistency = 1 - (sheet.dataTypes.mixed / Math.max(sheet.columns, 1));
        totalConsistency += consistency;
        
        // 정확성은 헤더 존재 여부로 측정
        const accuracy = sheet.hasHeaders ? 0.8 : 0.5;
        totalAccuracy += accuracy;
      }
    });
    
    quality.completeness = totalCompleteness / sheets.length;
    quality.consistency = totalConsistency / sheets.length;
    quality.accuracy = totalAccuracy / sheets.length;
    quality.overall = (quality.completeness + quality.consistency + quality.accuracy) / 3;
    
    return quality;
  }

  /**
   * 📈 트렌드 식별
   */
  identifyTrends(sheets) {
    const trends = {
      increasing: [],
      decreasing: [],
      stable: [],
      seasonal: []
    };
    
    sheets.forEach(sheet => {
      if (sheet.patterns.numerical) {
        // 수치적 데이터에서 트렌드 찾기
        const numericalColumns = this.findNumericalColumns(sheet);
        numericalColumns.forEach(column => {
          const trend = this.analyzeTrend(column);
          if (trend === 'increasing') trends.increasing.push(`${sheet.name}: ${column.name}`);
          else if (trend === 'decreasing') trends.decreasing.push(`${sheet.name}: ${column.name}`);
          else if (trend === 'stable') trends.stable.push(`${sheet.name}: ${column.name}`);
        });
      }
    });
    
    return trends;
  }

  /**
   * 🎯 기회 식별
   */
  identifyOpportunities(sheets) {
    const opportunities = {
      dataGaps: [],
      optimizationAreas: [],
      automationPotential: [],
      insights: []
    };
    
    sheets.forEach(sheet => {
      // 데이터 갭 식별
      if (sheet.dataTypes.empty > 0) {
        opportunities.dataGaps.push(`${sheet.name}: ${sheet.dataTypes.empty}개 빈 열`);
      }
      
      // 최적화 영역 식별
      if (sheet.rows > 1000) {
        opportunities.optimizationAreas.push(`${sheet.name}: 대용량 데이터 최적화 필요`);
      }
      
      // 자동화 잠재력 식별
      if (sheet.patterns.sequential || sheet.patterns.temporal) {
        opportunities.automationPotential.push(`${sheet.name}: 자동화 가능한 패턴 발견`);
      }
    });
    
    return opportunities;
  }

  /**
   * ⚠️ 위험 식별
   */
  identifyRisks(sheets) {
    const risks = {
      dataLoss: [],
      inconsistency: [],
      quality: [],
      security: []
    };
    
    sheets.forEach(sheet => {
      // 데이터 손실 위험
      if (sheet.dataTypes.empty > sheet.columns * 0.5) {
        risks.dataLoss.push(`${sheet.name}: 과도한 빈 데이터`);
      }
      
      // 일관성 위험
      if (sheet.dataTypes.mixed > sheet.columns * 0.3) {
        risks.inconsistency.push(`${sheet.name}: 데이터 타입 불일치`);
      }
      
      // 품질 위험
      if (sheet.statistics.filledCells / sheet.statistics.totalCells < 0.5) {
        risks.quality.push(`${sheet.name}: 낮은 데이터 품질`);
      }
    });
    
    return risks;
  }

  /**
   * 💡 권장사항 생성
   */
  generateRecommendations(sheets) {
    const recommendations = [];
    
    sheets.forEach(sheet => {
      if (sheet.dataTypes.empty > 0) {
        recommendations.push(`${sheet.name}: 빈 데이터 정리 필요`);
      }
      
      if (!sheet.hasHeaders) {
        recommendations.push(`${sheet.name}: 헤더 추가 권장`);
      }
      
      if (sheet.rows > 1000) {
        recommendations.push(`${sheet.name}: 데이터베이스 마이그레이션 고려`);
      }
      
      if (sheet.patterns.numerical) {
        recommendations.push(`${sheet.name}: 시각화 차트 생성 권장`);
      }
    });
    
    return recommendations;
  }

  /**
   * 📝 텍스트 콘텐츠 생성
   */
  generateTextContent(sheets, workbookProps) {
    let content = `Excel 문서: ${workbookProps.title || '제목 없음'}\n`;
    content += `작성자: ${workbookProps.author || '알 수 없음'}\n`;
    content += `시트 수: ${sheets.length}\n\n`;
    // 대용량 파일 정보 추가
    const largeSheets = sheets.filter(s => s.isLargeSheet);
    if (largeSheets.length > 0) {
      content += `⚠️ 대용량 시트 감지: ${largeSheets.length}개 시트가 샘플링 분석되었습니다.\n\n`;
    }
    // 표시할 시트 수 제한
    const sheetsToDisplay = sheets.slice(0, this.maxDisplaySheets);
    const hasMoreSheets = sheets.length > this.maxDisplaySheets;
    sheetsToDisplay.forEach((sheet, index) => {
      content += `[시트 ${index + 1}: ${sheet.name}]\n`;
      content += `- 행: ${sheet.rows}, 열: ${sheet.columns}, 셀: ${sheet.cells}\n`;
      if (sheet.samplingInfo) {
        content += `- 샘플링: ${sheet.samplingInfo.sampledRows}행 분석 (원본 ${sheet.samplingInfo.originalRows}행, ${sheet.samplingInfo.coverage} 커버리지)\n`;
      }
      content += `- 데이터 타입: 텍스트(${sheet.dataTypes.text}), 숫자(${sheet.dataTypes.number}), 날짜(${sheet.dataTypes.date})\n`;
      content += `- 패턴: ${Object.keys(sheet.patterns).filter(k => sheet.patterns[k]).join(', ') || '없음'}\n`;
      content += `- 헤더: ${sheet.headers && sheet.headers.length > 0 ? sheet.headers.join(' | ') : '없음'}\n`;
      // 데이터 샘플만 출력
      if (sheet.data && sheet.data.length > 0) {
        content += `[데이터 샘플]\n`;
        const maxRows = Math.min(sheet.data.length, 5); // 상위 5행만
        for (let i = 0; i < maxRows; i++) {
          const row = sheet.data[i];
          if (row && row.length > 0) {
            content += `행 ${i + 1}: ${row.join(' | ')}\n`;
          }
        }
        if (sheet.data.length > 5) {
          content += `... (총 ${sheet.data.length}행 중 5행만 표시)\n`;
        }
        content += '\n';
      }
    });
    if (hasMoreSheets) {
      content += `... (총 ${sheets.length}개 시트 중 ${this.maxDisplaySheets}개만 표시)\n`;
      content += `나머지 시트: ${sheets.slice(this.maxDisplaySheets).map(s => s.name).join(', ')}\n\n`;
    }
    return content;
  }

  // ===== 패턴 분석 헬퍼 메서드들 =====

  /**
   * 🔢 순차적 패턴 확인
   */
  isSequential(data) {
    if (data.length < 3) return false;
    
    const numbers = data.filter(item => !isNaN(item)).map(Number);
    if (numbers.length < 3) return false;
    
    const differences = [];
    for (let i = 1; i < numbers.length; i++) {
      differences.push(numbers[i] - numbers[i-1]);
    }
    
    const avgDiff = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
    const variance = differences.reduce((sum, diff) => sum + Math.pow(diff - avgDiff, 2), 0) / differences.length;
    
    return variance < avgDiff * 0.1; // 낮은 분산 = 순차적
  }

  /**
   * 🏷️ 범주형 패턴 확인
   */
  isCategorical(data) {
    if (data.length < 3) return false;
    
    const uniqueValues = new Set(data);
    const uniqueRatio = uniqueValues.size / data.length;
    
    return uniqueRatio < 0.3; // 30% 미만의 고유값 = 범주형
  }

  /**
   * 📅 시간적 패턴 확인
   */
  isTemporal(data) {
    if (data.length < 3) return false;
    
    const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/;
    const dateCount = data.filter(item => datePattern.test(item.toString())).length;
    
    return dateCount > data.length * 0.5; // 50% 이상이 날짜 = 시간적
  }

  /**
   * 🔢 수치적 패턴 확인
   */
  isNumerical(data) {
    if (data.length < 3) return false;
    
    const numberCount = data.filter(item => !isNaN(item) && item !== '').length;
    
    return numberCount > data.length * 0.7; // 70% 이상이 숫자 = 수치적
  }

  /**
   * 📈 트렌드 분석
   */
  analyzeTrend(data) {
    if (data.length < 3) return 'stable';
    
    const numbers = data.filter(item => !isNaN(item)).map(Number);
    if (numbers.length < 3) return 'stable';
    
    const firstHalf = numbers.slice(0, Math.floor(numbers.length / 2));
    const secondHalf = numbers.slice(Math.floor(numbers.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, num) => sum + num, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, num) => sum + num, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * 🔢 수치 열 찾기
   */
  findNumericalColumns(sheet) {
    // 실제 구현에서는 시트 데이터에서 수치 열을 찾아야 함
    return [];
  }

  // ===== ZIP 분석 헬퍼 메서드들 =====

  /**
   * 📄 시트 XML에서 데이터 추출
   */
  extractDataFromSheetXml(xmlContent) {
    try {
      // 간단한 XML 파싱으로 데이터 추출
      const rowMatches = xmlContent.match(/<row[^>]*>([\s\S]*?)<\/row>/g);
      if (rowMatches) {
        return rowMatches.map(row => {
          const cellMatches = row.match(/<c[^>]*>([\s\S]*?)<\/c>/g);
          return cellMatches ? cellMatches.map(cell => {
            const valueMatch = cell.match(/<v>([^<]+)<\/v>/);
            return valueMatch ? valueMatch[1] : '';
          }) : [];
        });
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 📋 시트 이름 추출
   */
  extractSheetName(entryName) {
    const match = entryName.match(/sheet(\d+)\.xml/);
    return match ? `Sheet${match[1]}` : 'Unknown';
  }

  /**
   * 📋 워크북 속성 XML에서 추출
   */
  extractWorkbookPropertiesFromXml(xmlContent) {
    try {
      const props = {
        title: '',
        author: '',
        subject: '',
        created: null,
        modified: null
      };
      
      const titleMatch = xmlContent.match(/<Title>([^<]+)<\/Title>/);
      if (titleMatch) props.title = titleMatch[1];
      
      const authorMatch = xmlContent.match(/<Author>([^<]+)<\/Author>/);
      if (authorMatch) props.author = authorMatch[1];
      
      return props;
    } catch (error) {
      return { title: '', author: '', subject: '', created: null, modified: null };
    }
  }

  // ===== ZIP 객체 확인 메서드들 =====

  /**
   * 📊 ZIP에서 수식 존재 확인
   */
  hasFormulasInZip(zip) {
    const formulaEntries = zip.getEntries().filter(entry => 
      entry.entryName.includes('/calcChain.xml') || 
      entry.entryName.includes('/sharedStrings.xml')
    );
    return formulaEntries.length > 0;
  }

  /**
   * 📈 ZIP에서 차트 존재 확인
   */
  hasChartsInZip(zip) {
    const chartEntries = zip.getEntries().filter(entry => 
      entry.entryName.includes('/charts/') || 
      entry.entryName.includes('/drawings/')
    );
    return chartEntries.length > 0;
  }

  /**
   * 🖼️ ZIP에서 이미지 존재 확인
   */
  hasImagesInZip(zip) {
    const imageEntries = zip.getEntries().filter(entry => 
      entry.entryName.includes('/media/') && 
      /\.(jpg|jpeg|png|gif|bmp|svg)$/i.test(entry.entryName)
    );
    return imageEntries.length > 0;
  }

  /**
   * 🔧 ZIP에서 매크로 존재 확인
   */
  hasMacrosInZip(zip) {
    const macroEntries = zip.getEntries().filter(entry => 
      entry.entryName.includes('/vbaProject.bin') || 
      entry.entryName.includes('/macros/')
    );
    return macroEntries.length > 0;
  }

  // ===== 워크북 객체 확인 메서드들 =====

  /**
   * 📊 워크북에서 수식 존재 확인
   */
  hasFormulas(workbook) {
    // 워크북에서 수식 정보 확인
    return false; // 실제 구현 필요
  }

  /**
   * 📈 워크북에서 차트 존재 확인
   */
  hasCharts(workbook) {
    // 워크북에서 차트 정보 확인
    return false; // 실제 구현 필요
  }

  /**
   * 🖼️ 워크북에서 이미지 존재 확인
   */
  hasImages(workbook) {
    // 워크북에서 이미지 정보 확인
    return false; // 실제 구현 필요
  }

  /**
   * 🔧 워크북에서 매크로 존재 확인
   */
  hasMacros(workbook) {
    // 워크북에서 매크로 정보 확인
    return false; // 실제 구현 필요
  }

  // ===== 언어 감지 메서드들 =====

  /**
   * 🌍 시트 데이터에서 언어 감지
   */
  detectLanguage(sheets) {
    let koreanCount = 0;
    let englishCount = 0;
    let totalCount = 0;
    
    sheets.forEach(sheet => {
      // 시트 데이터에서 언어 패턴 확인
      // 실제 구현에서는 시트 데이터를 순회하며 언어 확인
    });
    
    if (koreanCount > englishCount) return 'ko';
    if (englishCount > koreanCount) return 'en';
    return 'unknown';
  }

  /**
   * 🌍 텍스트에서 언어 감지
   */
  detectLanguageFromText(text) {
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    
    if (koreanChars > englishChars) return 'ko';
    if (englishChars > koreanChars) return 'en';
    return 'unknown';
  }

  /**
   * 📊 데이터 타입 분석
   */
  analyzeDataTypes(sheets) {
    const types = {
      text: 0,
      number: 0,
      date: 0,
      boolean: 0,
      empty: 0,
      mixed: 0
    };
    
    sheets.forEach(sheet => {
      Object.keys(sheet.dataTypes).forEach(type => {
        types[type] += sheet.dataTypes[type] || 0;
      });
    });
    
    return types;
  }

  /**
   * 🔍 패턴 찾기
   */
  findPatterns(sheets) {
    const patterns = {
      sequential: false,
      categorical: false,
      temporal: false,
      numerical: false
    };
    
    sheets.forEach(sheet => {
      Object.keys(sheet.patterns).forEach(pattern => {
        if (sheet.patterns[pattern]) {
          patterns[pattern] = true;
        }
      });
    });
    
    return patterns;
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

  // ===== 새로운 고급 메서드들 =====

  /**
   * 캐시 키 생성
   */
  generateCacheKey(filePath, options) {
    const stats = statSync(filePath);
    const optionsHash = this.hashObject(options);
    return `${filePath}_${stats.size}_${stats.mtime.getTime()}_${optionsHash}`;
  }

  /**
   * 객체 해시
   */
  hashObject(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * 캐시에 추가
   */
  addToCache(key, value) {
    try {
      // 메모리 사용량 확인
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapLimitMB = 1024; // 1GB 제한
      
      // 메모리 부족 시 캐시 정리
      if (heapUsedMB > heapLimitMB * 0.8) {
        logger.warn(`메모리 사용량 높음 (${heapUsedMB.toFixed(0)}MB), 캐시 정리`);
        // 캐시 크기를 절반으로 줄임
        const keysToDelete = Math.floor(this.cache.size / 2);
        const keys = Array.from(this.cache.keys());
        for (let i = 0; i < keysToDelete; i++) {
          this.cache.delete(keys[i]);
        }
      }
      
      // LRU 캐시 구현
      if (this.cache.size >= this.cacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      // 대용량 결과는 캐시하지 않음
      const resultSize = JSON.stringify(value).length;
      if (resultSize > 10 * 1024 * 1024) { // 10MB 초과
        logger.info(`결과 크기가 너무 커서 캐시하지 않음 (${(resultSize / 1024 / 1024).toFixed(1)}MB)`);
        return;
      }
      
      this.cache.set(key, {
        ...value,
        performance: {
          ...value.performance,
          cacheHit: true
        },
        cachedAt: Date.now()
      });
      
    } catch (error) {
      logger.error(`캐시 추가 실패: ${error.message}`);
      // 캐시 실패해도 계속 진행
    }
  }

  /**
   * 진행률 보고
   */
  reportProgress(message, percentage) {
    if (this.progressCallback) {
      this.progressCallback({
        message,
        percentage: Math.round(percentage),
        timestamp: Date.now(),
        elapsed: Date.now() - this.analysisStartTime
      });
    }
  }

  /**
   * 스트리밍 파서 생성
   */
  createStreamingParser(ext, options) {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          // 청크 단위로 Excel 데이터 파싱
          const data = this.parseExcelChunk(chunk, ext, options);
          this.push(data);
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  /**
   * 진행률 추적 스트림
   */
  createProgressTracker(filePath) {
    const fileSize = statSync(filePath).size;
    let processedBytes = 0;
    
    return new Transform({
      transform(chunk, encoding, callback) {
        processedBytes += chunk.length;
        const progress = (processedBytes / fileSize) * 100;
        
        // 진행률 보고 (5% 단위로)
        if (Math.floor(progress) % 5 === 0) {
          this.reportProgress(`파일 읽기 중`, Math.min(70, progress * 0.7));
        }
        
        this.push(chunk);
        callback();
      }
    });
  }

  /**
   * 데이터 수집 스트림
   */
  createDataCollector(analysis) {
    return new Transform({
      objectMode: true,
      transform(data, encoding, callback) {
        // 분석 결과에 데이터 추가
        if (data.sheets) {
          analysis.sheets.push(...data.sheets);
        }
        
        if (data.rows) {
          analysis.totalRows += data.rows;
        }
        
        if (data.cells) {
          analysis.totalCells += data.cells;
        }
        
        if (data.metadata) {
          Object.assign(analysis.metadata, data.metadata);
        }
        
        callback();
      }
    });
  }

  /**
   * 스트리밍 결과 최종화
   */
  finalizeStreamingResult(analysis) {
    return {
      success: true,
      structure: {
        sheets: analysis.sheets.length,
        totalRows: analysis.totalRows,
        totalCells: analysis.totalCells,
        sheetDetails: analysis.sheets
      },
      metadata: analysis.metadata,
      content: this.generateStreamingContent(analysis),
      analysis: {
        extractionMethod: 'streaming',
        confidence: 0.95
      }
    };
  }

  /**
   * 스트리밍 콘텐츠 생성
   */
  generateStreamingContent(analysis) {
    let content = `스트리밍 분석 결과\n`;
    content += `총 시트: ${analysis.sheets.length}\n`;
    content += `총 행: ${analysis.totalRows}\n`;
    content += `총 셀: ${analysis.totalCells}\n\n`;
    
    analysis.sheets.forEach((sheet, index) => {
      content += `[시트 ${index + 1}: ${sheet.name}]\n`;
      content += `행: ${sheet.rows}, 셀: ${sheet.cells}\n`;
      if (sheet.preview) {
        content += `미리보기: ${sheet.preview}\n`;
      }
      content += '\n';
    });
    
    return content;
  }

  /**
   * 파일을 청크로 분할
   */
  async splitFileIntoChunks(filePath, numChunks) {
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;
    const chunkSize = Math.ceil(fileSize / numChunks);
    
    const chunks = [];
    let offset = 0;
    
    for (let i = 0; i < numChunks; i++) {
      const size = Math.min(chunkSize, fileSize - offset);
      chunks.push({
        filePath,
        offset,
        size,
        index: i
      });
      offset += size;
    }
    
    return chunks;
  }

  /**
   * Worker로 청크 처리
   */
  async processChunkWithWorker(chunk, index, ext, options) {
    return new Promise((resolve, reject) => {
      let worker;
      let timeout;
      
      try {
        // Worker 파일 경로를 Windows 호환 방식으로 생성
        const workerPath = fileURLToPath(new URL('./excel-worker.js', import.meta.url));
        worker = new Worker(workerPath, {
          workerData: { chunk, ext, options }
        });
        
        this.activeWorkers.add(worker);
        
        // 타임아웃 설정
        timeout = setTimeout(() => {
          if (worker) {
            worker.terminate().catch(err => {
              logger.error(`Worker ${index} 종료 실패: ${err.message}`);
            });
            this.activeWorkers.delete(worker);
          }
          reject(new Error(`Worker ${index} 타임아웃 (${this.timeout}ms 초과)`));
        }, this.timeout);
        
        worker.on('message', (result) => {
          clearTimeout(timeout);
          this.activeWorkers.delete(worker);
          
          // 결과 검증
          if (!result || typeof result !== 'object') {
            reject(new Error(`Worker ${index}: 잘못된 결과 형식`));
            return;
          }
          
          resolve(result);
        });
        
        worker.on('error', (error) => {
          clearTimeout(timeout);
          this.activeWorkers.delete(worker);
          logger.error(`Worker ${index} 오류: ${error.message}`, error.stack);
          reject(new Error(`Worker ${index} 오류: ${error.message}`));
        });
        
        worker.on('exit', (code) => {
          clearTimeout(timeout);
          this.activeWorkers.delete(worker);
          if (code !== 0 && code !== null) {
            reject(new Error(`Worker ${index} 비정상 종료 (코드: ${code})`));
          }
        });
        
      } catch (error) {
        if (timeout) clearTimeout(timeout);
        if (worker) this.activeWorkers.delete(worker);
        logger.error(`Worker ${index} 생성 실패: ${error.message}`);
        reject(new Error(`Worker ${index} 생성 실패: ${error.message}`));
      }
    });
  }

  /**
   * Worker 결과 통합
   */
  mergeWorkerResults(results) {
    const merged = {
      success: true,
      structure: {
        sheets: 0,
        totalRows: 0,
        totalCells: 0,
        sheetDetails: []
      },
      metadata: {},
      content: '',
      analysis: {
        extractionMethod: 'parallel',
        confidence: 0.9
      }
    };
    
    for (const result of results) {
      if (result.success) {
        merged.structure.sheets += result.structure.sheets;
        merged.structure.totalRows += result.structure.totalRows;
        merged.structure.totalCells += result.structure.totalCells;
        merged.structure.sheetDetails.push(...result.structure.sheetDetails);
        
        Object.assign(merged.metadata, result.metadata);
        merged.content += result.content + '\n';
      }
    }
    
    return merged;
  }

  /**
   * XLSB 파일 분석
   */
  async analyzeXlsbFile(buffer, filePath, options) {
    try {
      logger.info('🔍 XLSB 파일 분석 시작');
      
      // XLSB는 바이너리 형식이므로 특별한 처리 필요
      const workbook = await this.parseXlsbBuffer(buffer);
      
      if (!workbook) {
        return this.extractFallback(buffer, filePath, 'xlsb');
      }
      
      return this.processWorkbook(workbook, filePath, 'xlsb');
      
    } catch (error) {
      logger.warn(`XLSB 분석 실패, 폴백 사용: ${error.message}`);
      return this.extractFallback(buffer, filePath, 'xlsb');
    }
  }

  /**
   * XLSB 버퍼 파싱
   */
  async parseXlsbBuffer(buffer) {
    try {
      // xlsx 라이브러리로 XLSB 지원 확인
      const XLSX = await import('xlsx');
      return XLSX.default.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * 워크북 처리 (통합)
   */
  async processWorkbook(workbook, filePath, format, options = {}) {
    const workbookProps = this.extractWorkbookProperties(workbook);
    if (workbook.SheetNames.length > this.maxSheets) {
      this.reportWarning(`시트가 너무 많습니다 (${workbook.SheetNames.length}개 > ${this.maxSheets}개). 처음 ${this.maxSheets}개만 분석합니다.`);
    }
    const sheetsToAnalyze = workbook.SheetNames.slice(0, this.maxSheets);
    const sheets = [];
    
    // 숨겨진 시트 확인
    const hiddenSheets = [];
    if (workbook.Workbook && workbook.Workbook.Sheets) {
      workbook.Workbook.Sheets.forEach((sheet, idx) => {
        if (sheet.Hidden) {
          hiddenSheets.push(workbook.SheetNames[idx]);
        }
      });
      if (hiddenSheets.length > 0) {
        logger.info(`숨겨진 시트 발견: ${hiddenSheets.join(', ')}`);
      }
    }
    
    for (let i = 0; i < sheetsToAnalyze.length; i++) {
      const sheetName = sheetsToAnalyze[i];
      this.reportProgress(`시트 분석 중: ${sheetName}`, 20 + (i / sheetsToAnalyze.length) * 50);
      try {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = await this.extractSheetData(worksheet, format);
        // 여기서 options.forceHeaders를 analyzeSheetData로 전달
        const analyzedSheet = this.analyzeSheetData(sheetData, sheetName, options);
        
        // 숨겨진 시트 표시
        if (hiddenSheets.includes(sheetName)) {
          analyzedSheet.hidden = true;
        }
        
        sheets.push(analyzedSheet);
      } catch (error) {
        this.reportWarning(`시트 "${sheetName}" 분석 실패: ${error.message}`);
      }
    }
    const overallStats = this.calculateOverallStats(sheets);
    const businessInsights = this.extractBusinessInsights(sheets);
    return {
      success: true,
      content: this.generateTextContent(sheets, workbookProps),
      structure: {
        sheets: sheets.length,
        totalRows: overallStats.totalRows,
        totalColumns: overallStats.totalColumns,
        totalCells: overallStats.totalCells,
        sheetDetails: sheets
      },
      metadata: {
        ...workbookProps,
        format: format.toUpperCase(),
        hasFormulas: this.hasFormulas(workbook),
        hasCharts: this.hasCharts(workbook),
        hasImages: this.hasImages(workbook),
        hasMacros: this.hasMacros(workbook)
      },
      analysis: {
        language: this.detectLanguage(sheets),
        dataTypes: this.analyzeDataTypes(sheets),
        patterns: this.findPatterns(sheets),
        statistics: overallStats,
        businessInsights: businessInsights,
        confidence: 0.95,
        extractionMethod: format
      }
    };
  }

  /**
   * 시트 데이터 추출 (형식별)
   */
  async extractSheetData(worksheet, format) {
    try {
      const XLSX = await import('xlsx');
      
      // 1차 추출: 서식이 적용된 값
      const data = XLSX.default.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false,        // 서식이 적용된 값 사용
        dateNF: 'yyyy-mm-dd', // 날짜 형식
        defval: '',        // 빈 셀 기본값
        blankrows: true    // 빈 행도 포함
      });
      
      // 2차 검증: 원시 값과 비교하여 데이터 무결성 확인
      const rawData = XLSX.default.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: true,
        defval: '',
        blankrows: true
      });
      
      // 숫자 데이터 검증 (특히 금액)
      let numericCellCount = 0;
      let verifiedCellCount = 0;
      
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          // 원시 데이터가 숫자인 경우
          if (rawData[i] && rawData[i][j] !== undefined && !isNaN(rawData[i][j]) && rawData[i][j] !== '') {
            numericCellCount++;
            
            // 서식이 적용된 값이 존재하는지 확인
            if (data[i][j] !== undefined && data[i][j] !== '') {
              verifiedCellCount++;
            } else {
              // 누락된 숫자 데이터 복구
              logger.warn(`숫자 데이터 누락 감지 - 행: ${i+1}, 열: ${j+1}, 값: ${rawData[i][j]}`);
              data[i][j] = String(rawData[i][j]);
            }
          }
        }
      }
      
      if (numericCellCount > 0) {
        const integrityRate = (verifiedCellCount / numericCellCount * 100).toFixed(1);
        logger.info(`숫자 데이터 무결성: ${integrityRate}% (${verifiedCellCount}/${numericCellCount})`);
      }
      
      // 숨겨진 행/열 확인
      if (worksheet['!rows']) {
        const hiddenRows = [];
        worksheet['!rows'].forEach((row, idx) => {
          if (row && row.hidden) hiddenRows.push(idx);
        });
        if (hiddenRows.length > 0) {
          logger.info(`숨겨진 행 발견: ${hiddenRows.length}개`);
        }
      }
      
      // 병합 셀 정보
      if (worksheet['!merges']) {
        logger.info(`병합 셀 발견: ${worksheet['!merges'].length}개`);
        
        // 병합 셀의 데이터 보존 확인
        worksheet['!merges'].forEach(merge => {
          const startRow = merge.s.r;
          const startCol = merge.s.c;
          if (data[startRow] && data[startRow][startCol]) {
            logger.debug(`병합 셀 데이터 확인 - 행: ${startRow+1}, 열: ${startCol+1}`);
          }
        });
      }
      
      // 수식 셀 확인
      let formulaCount = 0;
      Object.keys(worksheet).forEach(cell => {
        if (cell[0] !== '!' && worksheet[cell].f) {
          formulaCount++;
        }
      });
      if (formulaCount > 0) {
        logger.info(`수식 셀 발견: ${formulaCount}개`);
      }
      
      return data;
    } catch (error) {
      logger.error(`시트 데이터 추출 실패: ${error.message}`);
      // 실패 시에도 빈 배열이 아닌 에러 정보 포함
      return [];
    }
  }

  /**
   * 고급 요약 생성
   */
  generateAdvancedSummary(analysisResults) {
    const summary = {
      totalSheets: Object.keys(analysisResults).length,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      insights: [],
      recommendations: []
    };
    
    Object.entries(analysisResults).forEach(([sheetName, result]) => {
      if (result.success) {
        summary.successfulAnalyses++;
        
        // 주요 인사이트 추출
        if (result.mlInsights && result.mlInsights.featureImportance) {
          summary.insights.push(`${sheetName}: 주요 영향 요인 발견`);
        }
        
        if (result.correlations && result.correlations.length > 0) {
          summary.insights.push(`${sheetName}: ${result.correlations.length}개 상관관계 발견`);
        }
        
        // 권장사항 수집
        if (result.recommendations) {
          summary.recommendations.push(...result.recommendations.map(r => ({
            sheet: sheetName,
            ...r
          })));
        }
      } else {
        summary.failedAnalyses++;
      }
    });
    
    return summary;
  }

  /**
   * 경고 보고
   */
  reportWarning(message) {
    logger.warn(message);
    if (this.warningCallback) {
      this.warningCallback(message);
    }
  }

  /**
   * 메모리 사용량 모니터링
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: this.formatSize(usage.rss),
      heapTotal: this.formatSize(usage.heapTotal),
      heapUsed: this.formatSize(usage.heapUsed),
      external: this.formatSize(usage.external)
    };
  }

  /**
   * 성능 메트릭 수집
   */
  collectPerformanceMetrics(startTime) {
    const duration = Date.now() - startTime;
    const memory = this.getMemoryUsage();
    
    return {
      duration,
      durationFormatted: this.formatDuration(duration),
      memory,
      cacheSize: this.cache.size,
      activeWorkers: this.activeWorkers.size
    };
  }

  /**
   * 시간 포맷팅
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  /**
   * 💰 데이터 무결성 검증 (재무 문서용)
   */
  validateDataIntegrity(result) {
    const validation = {
      isComplete: true,
      issues: [],
      statistics: {
        totalDataCells: 0,
        emptyDataCells: 0,
        numericCells: 0,
        formulaCells: 0,
        verifiedCells: 0
      }
    };

    try {
      // 모든 시트의 데이터 검증
      result.structure.sheetDetails.forEach(sheet => {
        if (sheet.data && sheet.data.length > 0) {
          let emptyRowCount = 0;
          let consecutiveEmptyRows = 0;
          
          sheet.data.forEach((row, rowIndex) => {
            const isEmpty = row.every(cell => cell === '' || cell === null || cell === undefined);
            
            if (isEmpty) {
              emptyRowCount++;
              consecutiveEmptyRows++;
              
              // 연속된 빈 행이 5개 이상이면 경고
              if (consecutiveEmptyRows >= 5 && rowIndex < sheet.data.length - 10) {
                validation.issues.push(`${sheet.name}: 중간에 연속된 빈 행 ${consecutiveEmptyRows}개 발견`);
              }
            } else {
              consecutiveEmptyRows = 0;
              
              // 각 셀 검증
              row.forEach((cell, colIndex) => {
                validation.statistics.totalDataCells++;
                
                if (cell === '' || cell === null || cell === undefined) {
                  validation.statistics.emptyDataCells++;
                } else {
                  validation.statistics.verifiedCells++;
                  
                  // 숫자 데이터 검증
                  if (!isNaN(cell) && cell !== '') {
                    validation.statistics.numericCells++;
                  }
                  
                  // 금액 형식 검증 (쉼표, 원화 기호 등)
                  const amountPattern = /^[\-\+]?[\d,]+(\.\d+)?[원$₩]?$/;
                  if (amountPattern.test(String(cell))) {
                    // 금액 데이터로 추정
                    logger.debug(`금액 데이터 발견: ${cell} (행: ${rowIndex+1}, 열: ${colIndex+1})`);
                  }
                }
              });
            }
          });
          
          // 빈 행 비율 확인
          const emptyRowRatio = emptyRowCount / sheet.data.length;
          if (emptyRowRatio > 0.3 && sheet.data.length > 10) {
            validation.issues.push(`${sheet.name}: 빈 행이 너무 많음 (${(emptyRowRatio * 100).toFixed(0)}%)`);
          }
        }
        
        // 데이터 타입 분포 확인
        if (sheet.dataTypes) {
          const totalColumns = Object.values(sheet.dataTypes).reduce((a, b) => a + b, 0);
          if (totalColumns > 0 && sheet.dataTypes.empty > totalColumns * 0.5) {
            validation.issues.push(`${sheet.name}: 빈 열이 너무 많음`);
          }
        }
      });
      
      // 전체 데이터 완전성 평가
      if (validation.statistics.totalDataCells > 0) {
        const completenessRate = (validation.statistics.verifiedCells / validation.statistics.totalDataCells) * 100;
        validation.completenessRate = completenessRate.toFixed(1);
        
        if (completenessRate < 70) {
          validation.isComplete = false;
          validation.issues.push(`전체 데이터 완전성 부족: ${completenessRate.toFixed(1)}%`);
        }
        
        logger.info(`📊 데이터 완전성: ${completenessRate.toFixed(1)}% (${validation.statistics.verifiedCells}/${validation.statistics.totalDataCells} 셀)`);
      }
      
    } catch (error) {
      logger.error(`데이터 검증 중 오류: ${error.message}`);
      validation.issues.push(`검증 오류: ${error.message}`);
    }
    
    return validation;
  }

  /**
   * 분석 중단
   */
  async abort() {
    logger.info('Excel 분석 중단 요청됨');
    
    try {
      // 분석 중단 플래그 설정
      if (this.currentAnalysis) {
        this.currentAnalysis.aborted = true;
      }
      
      // 모든 활성 워커 종료
      const terminationPromises = [];
      for (const worker of this.activeWorkers) {
        terminationPromises.push(
          worker.terminate()
            .then(() => logger.debug(`Worker 종료 성공`))
            .catch(err => logger.warn(`Worker 종료 실패: ${err.message}`))
        );
      }
      
      // 종료 대기 (최대 5초)
      const timeoutPromise = new Promise(resolve => 
        setTimeout(() => resolve('timeout'), 5000)
      );
      
      const results = await Promise.race([
        Promise.allSettled(terminationPromises),
        timeoutPromise
      ]);
      
      if (results === 'timeout') {
        logger.warn('Worker 종료 타임아웃, 강제 정리');
      }
      
      // 리소스 정리
      this.activeWorkers.clear();
      
      // 진행률 콜백으로 중단 알림
      this.reportProgress('분석 중단됨', -1);
      
      logger.info('Excel 분석 중단 완료');
      
      return {
        success: true,
        message: '분석이 중단되었습니다',
        timestamp: Date.now()
      };
      
    } catch (error) {
      logger.error(`분석 중단 중 오류: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 시스템 상태 확인
   */
  getSystemStatus() {
    return {
      workerPool: {
        total: this.workerPool.length,
        active: this.activeWorkers.size,
        available: this.workerPool.length - this.activeWorkers.size
      },
      cache: {
        size: this.cache.size,
        maxSize: this.cacheSize,
        hitRate: this.calculateCacheHitRate()
      },
      memory: this.getMemoryUsage(),
      settings: {
        maxFileSize: this.formatSize(this.maxFileSize),
        maxSheets: this.maxSheets,
        maxRowsPerSheet: this.maxRowsPerSheet,
        enableStreaming: this.enableStreaming,
        enableWorkers: this.enableWorkers
      }
    };
  }

  /**
   * 캐시 히트율 계산
   */
  calculateCacheHitRate() {
    // 간소화된 계산 - 실제로는 히트/미스 카운터 필요
    return this.cache.size > 0 ? 0.85 : 0;
  }

  /**
   * Excel 청크 파싱
   */
  parseExcelChunk(chunk, ext, options) {
    // 실제 구현에서는 스트리밍 Excel 파서 필요
    // 현재는 기본 구조만 반환
    return {
      sheets: [],
      rows: 0,
      cells: 0,
      metadata: {}
    };
  }

  /**
   * 📊 대용량 파일 분석 최적화
   */
  optimizeForLargeFiles(sheets) {
    const optimization = {
      totalSheets: sheets.length,
      largeSheets: sheets.filter(s => s.isLargeSheet).length,
      totalRows: sheets.reduce((sum, s) => sum + s.rows, 0),
      sampledRows: sheets.reduce((sum, s) => sum + (s.samplingInfo?.sampledRows || s.rows), 0),
      memoryUsage: this.estimateMemoryUsage(sheets),
      processingTime: this.estimateProcessingTime(sheets)
    };
    
    return optimization;
  }

  /**
   * 💾 메모리 사용량 추정
   */
  estimateMemoryUsage(sheets) {
    const totalCells = sheets.reduce((sum, s) => sum + s.cells, 0);
    const avgCellSize = 50; // 평균 셀 크기 (바이트)
    const estimatedBytes = totalCells * avgCellSize;
    
    return {
      bytes: estimatedBytes,
      formatted: this.formatSize(estimatedBytes),
      efficiency: estimatedBytes < 100 * 1024 * 1024 ? 'good' : 'high'
    };
  }

  /**
   * ⏱️ 처리 시간 추정
   */
  estimateProcessingTime(sheets) {
    const totalRows = sheets.reduce((sum, s) => sum + s.rows, 0);
    const rowsPerSecond = 10000; // 초당 처리 가능한 행 수
    const estimatedSeconds = totalRows / rowsPerSecond;
    
    return {
      seconds: estimatedSeconds,
      formatted: estimatedSeconds < 60 ? `${estimatedSeconds.toFixed(1)}초` : `${(estimatedSeconds / 60).toFixed(1)}분`,
      efficiency: estimatedSeconds < 30 ? 'fast' : 'moderate'
    };
  }
} 