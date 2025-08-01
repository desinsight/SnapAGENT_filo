import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../../common/Logger.js';

const logger = Logger.component('PowerPointAnalyzer');

/**
 * 📊 PowerPoint 문서(.ppt, .pptx) 고도화된 완전 분석기
 * Microsoft PowerPoint 파일을 분석하여 텍스트, 구조, 메타데이터, 스타일, 레이아웃을 추출
 * 
 * 🚀 새로운 기능:
 * - 고급 텍스트 추출 및 정제
 * - 스타일 및 포맷팅 분석
 * - 슬라이드 레이아웃 분석
 * - 이미지 및 미디어 메타데이터 추출
 * - 성능 최적화 및 캐싱
 * - 병렬 처리 지원
 * - 상세한 분석 리포트
 */
export class PowerPointAnalyzer {
  constructor(options = {}) {
    this.supportedFormats = ['.ppt', '.pptx'];
    this.maxFileSize = options.maxFileSize || 500 * 1024 * 1024; // 500MB
    this.enableCache = options.enableCache !== false;
    this.cache = new Map();
    this.analysisCache = new Map();
    this.parallelProcessing = options.parallelProcessing !== false;
    this.maxWorkers = options.maxWorkers || 4;
    
    // 고급 분석 옵션
    this.extractStyles = options.extractStyles !== false;
    this.extractLayouts = options.extractLayouts !== false;
    this.extractMediaMetadata = options.extractMediaMetadata !== false;
    this.detectLanguage = options.detectLanguage !== false;
    this.analyzeSentiment = options.analyzeSentiment !== false;
    this.generateSummary = options.generateSummary !== false;
    
    // 성능 모니터링
    this.performanceMetrics = {
      totalAnalyses: 0,
      averageTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    // 의존성 캐싱
    this._jszip = null;
    this._officegen = null;
  }

  /**
   * 📦 JSZip 인스턴스 가져오기 (싱글톤 패턴)
   */
  async getJSZip() {
    if (!this._jszip) {
      const JSZip = await import('jszip');
      this._jszip = JSZip.default;
    }
    return this._jszip;
  }

  /**
   * 🔧 Officegen 인스턴스 가져오기 (싱글톤 패턴)
   */
  async getOfficegen() {
    if (!this._officegen) {
      this._officegen = await import('officegen');
    }
    return this._officegen;
  }

  /**
   * 📊 PowerPoint 문서 완전 분석 (고도화된 버전)
   */
  async analyzeComplete(filePath, options = {}) {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId(filePath);
    
    try {
      logger.info(`🔍 [PowerPoint 분석] 시작: ${filePath} (ID: ${analysisId})`);
      
      // 캐시 확인
      if (this.enableCache && this.cache.has(analysisId)) {
        this.performanceMetrics.cacheHits++;
        logger.info(`⚡ [PowerPoint 분석] 캐시 히트: ${analysisId}`);
        return this.cache.get(analysisId);
      }
      
      this.performanceMetrics.cacheMisses++;
      
      // 파일 검증
      const fileValidation = await this.validateFile(filePath);
      if (!fileValidation.valid) {
        throw new Error(fileValidation.error);
      }
      
      const { stats, buffer, ext } = fileValidation;
      
      // 기본 정보 추출
      const basicInfo = this.extractBasicInfo(filePath, stats);
      
      // 파일 형식별 분석
      let result;
      if (ext === '.pptx') {
        result = await this.analyzePptxFileAdvanced(buffer, filePath, options);
      } else if (ext === '.ppt') {
        result = await this.analyzePptFileAdvanced(buffer, filePath, options);
      } else {
        throw new Error('지원하지 않는 PowerPoint 형식입니다');
      }
      
      const analysisDuration = Date.now() - startTime;
      
      // 성능 메트릭 업데이트
      this.updatePerformanceMetrics(analysisDuration);
      
      // 고급 분석 결과 구성
      const advancedResult = {
        success: true,
        analysisId,
        path: filePath,
        basicInfo,
        ...result,
        analysis: {
          ...result.analysis,
          duration: analysisDuration,
          performance: {
            duration: analysisDuration,
            memoryUsage: process.memoryUsage(),
            cacheHit: false
          }
        },
        metadata: {
          ...result.metadata,
          analysisTimestamp: new Date().toISOString(),
          analyzerVersion: '2.0.0',
          analysisOptions: options
        }
      };
      
      // 캐시 저장
      if (this.enableCache) {
        this.cache.set(analysisId, advancedResult);
        this.cleanupCache();
      }
      
      logger.info(`✅ [PowerPoint 분석] 완료: ${filePath} (${analysisDuration}ms)`);
      
      return advancedResult;
      
    } catch (error) {
      logger.error(`❌ [PowerPoint 분석] 오류: ${error.message}`, { stack: error.stack });
      return {
        success: false,
        analysisId,
        error: error.message,
        path: filePath,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 🔍 파일 검증
   */
  async validateFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // 파일 크기 체크
      if (stats.size > this.maxFileSize) {
        return {
          valid: false,
          error: `파일이 너무 큽니다 (${(stats.size / 1024 / 1024).toFixed(2)}MB > ${(this.maxFileSize / 1024 / 1024).toFixed(2)}MB)`
        };
      }
      
      // 파일 형식 검증
      if (!this.supportedFormats.includes(ext)) {
        return {
          valid: false,
          error: `지원하지 않는 파일 형식: ${ext}`
        };
      }
      
      // 파일 시그니처 검증
      const isValidSignature = this.validateFileSignature(buffer, ext);
      if (!isValidSignature) {
        return {
          valid: false,
          error: `잘못된 파일 시그니처: ${ext}`
        };
      }
      
      return { valid: true, stats, buffer, ext };
    } catch (error) {
      return {
        valid: false,
        error: `파일 검증 실패: ${error.message}`
      };
    }
  }

  /**
   * 🔍 파일 시그니처 검증
   */
  validateFileSignature(buffer, ext) {
    try {
      if (ext === '.pptx') {
        // PPTX는 ZIP 파일 시그니처 (PK)
        const zipSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
        return buffer.slice(0, 4).equals(zipSignature);
      } else if (ext === '.ppt') {
        // PPT는 OLE 파일 시그니처
        const oleSignature = Buffer.from([0xD0, 0xCF, 0x11, 0xE0]);
        return buffer.slice(0, 4).equals(oleSignature);
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 📊 PPTX 파일 고도화 분석
   */
  async analyzePptxFileAdvanced(buffer, filePath, options) {
    try {
      logger.info(`🔍 [PowerPoint 분석] PPTX 고도화 분석 시작`);
      
      // 병렬 처리를 위한 워커 생성
      const workers = this.parallelProcessing ? this.createWorkers() : null;
      
      // 방법 1: 고도화된 ZIP 분석
      try {
        const result = await this.extractWithAdvancedZipAnalysis(buffer, filePath, options, workers);
        if (result.success) {
          return result;
        }
      } catch (error) {
        logger.warn(`⚠️ 고도화된 ZIP 분석 실패: ${error.message}`);
      }
      
      // 방법 2: officegen 라이브러리 사용
      try {
        const result = await this.extractWithOfficegenAdvanced(buffer, filePath, options);
        if (result.success) {
          return result;
        }
      } catch (error) {
        logger.warn(`⚠️ officegen 실패: ${error.message}`);
      }
      
      // 방법 3: 폴백
      return this.extractFallbackAdvanced(buffer, filePath, 'pptx', options);
      
    } catch (error) {
      throw new Error(`PPTX 고도화 분석 실패: ${error.message}`);
    }
  }

  /**
   * 📊 PPT 파일 고도화 분석
   */
  async analyzePptFileAdvanced(buffer, filePath, options) {
    try {
      logger.info(`🔍 [PowerPoint 분석] PPT 고도화 분석 시작`);
      
      // 방법 1: 고도화된 바이너리 분석
      try {
        const result = await this.extractWithAdvancedBinaryAnalysis(buffer, filePath, options);
        if (result.success) {
          return result;
        }
      } catch (error) {
        logger.warn(`⚠️ 고도화된 바이너리 분석 실패: ${error.message}`);
      }
      
      // 방법 2: officegen 라이브러리 사용
      try {
        const result = await this.extractWithOfficegenAdvanced(buffer, filePath, options);
        if (result.success) {
          return result;
        }
      } catch (error) {
        logger.warn(`⚠️ officegen 실패: ${error.message}`);
      }
      
      // 방법 3: 폴백
      return this.extractFallbackAdvanced(buffer, filePath, 'ppt', options);
      
    } catch (error) {
      throw new Error(`PPT 고도화 분석 실패: ${error.message}`);
    }
  }

  /**
   * 📦 고도화된 ZIP 기반 PPTX 분석
   */
  async extractWithAdvancedZipAnalysis(buffer, filePath, options, workers) {
    try {
      logger.info(`🔍 [PowerPoint 분석] 고도화된 ZIP 분석 시작`);
      
      const JSZip = await this.getJSZip();
      const zip = new JSZip();
      
      // ZIP 파일 로드
      await zip.loadAsync(buffer);
      
      // 병렬 처리를 위한 작업 분할
      const tasks = this.createZipAnalysisTasks(zip, options);
      
      let results;
      if (workers && this.parallelProcessing) {
        results = await this.processTasksInParallel(tasks, workers, zip);
      } else {
        results = await this.processTasksSequentially(tasks, zip);
      }
      
      // 결과 통합
      const integratedResult = this.integrateZipAnalysisResults(results, filePath);
      
      // 고급 분석 수행
      if (this.extractStyles) {
        integratedResult.styles = await this.extractStylesFromZip(zip);
      }
      
      if (this.extractLayouts) {
        integratedResult.layouts = await this.extractLayoutsFromZip(zip);
      }
      
      if (this.extractMediaMetadata) {
        integratedResult.mediaMetadata = await this.extractMediaMetadataFromZip(zip);
      }
      
      // 요약 생성
      if (this.generateSummary) {
        integratedResult.summary = this.generateDocumentSummary(integratedResult);
      }
      
      logger.info(`✅ [PowerPoint 분석] 고도화된 ZIP 분석 완료`);
      
      return integratedResult;
      
    } catch (error) {
      logger.error(`❌ [PowerPoint 분석] 고도화된 ZIP 분석 실패: ${error.message}`);
      throw new Error(`고도화된 ZIP 분석 실패: ${error.message}`);
    }
  }

  /**
   * 🔧 ZIP 분석 작업 생성
   */
  createZipAnalysisTasks(zip, options) {
    const tasks = [];
    
    // 슬라이드 분석 작업
    const slideFiles = Object.keys(zip.files).filter(fileName => 
      fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')
    );
    
    for (const fileName of slideFiles) {
      tasks.push({
        type: 'slide',
        fileName,
        options
      });
    }
    
    // 노트 분석 작업
    const noteFiles = Object.keys(zip.files).filter(fileName => 
      fileName.startsWith('ppt/notesSlides/notesSlide') && fileName.endsWith('.xml')
    );
    
    for (const fileName of noteFiles) {
      tasks.push({
        type: 'note',
        fileName,
        options
      });
    }
    
    // 메타데이터 분석 작업
    tasks.push({
      type: 'metadata',
      options
    });
    
    return tasks;
  }

  /**
   * 🔄 병렬 작업 처리
   */
  async processTasksInParallel(tasks, workers, zip) {
    const results = [];
    const chunkSize = Math.ceil(tasks.length / workers.length);
    
    const promises = workers.map(async (worker, workerIndex) => {
      const start = workerIndex * chunkSize;
      const end = Math.min(start + chunkSize, tasks.length);
      const workerTasks = tasks.slice(start, end);
      
      return await this.processWorkerTasks(workerTasks, worker, zip);
    });
    
    const workerResults = await Promise.all(promises);
    return workerResults.flat();
  }

  /**
   * 📋 순차 작업 처리
   */
  async processTasksSequentially(tasks, zip) {
    const results = [];
    
    for (const task of tasks) {
      try {
        const result = await this.processTask(task, zip);
        results.push(result);
      } catch (error) {
        logger.warn(`⚠️ 작업 처리 실패: ${error.message}`);
        results.push({ success: false, error: error.message, task });
      }
    }
    
    return results;
  }

  /**
   * 🔧 개별 작업 처리
   */
  async processTask(task, zip) {
    try {
      switch (task.type) {
        case 'slide':
          return await this.processSlideTask(task, zip);
        case 'note':
          return await this.processNoteTask(task, zip);
        case 'metadata':
          return await this.processMetadataTask(task, zip);
        default:
          throw new Error(`알 수 없는 작업 타입: ${task.type}`);
      }
    } catch (error) {
      throw new Error(`작업 처리 실패: ${error.message}`);
    }
  }

  /**
   * 📊 슬라이드 작업 처리
   */
  async processSlideTask(task, zip) {
    try {
      const slideXml = await this.getZipFileContent(zip, task.fileName);
      const slideText = this.extractTextFromSlideXmlAdvanced(slideXml);
      const slideNumber = this.extractSlideNumber(task.fileName);
      
      const slideAnalysis = {
        slideNumber,
        text: slideText,
        fileName: task.fileName,
        wordCount: slideText.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: slideText.length,
        hasImages: slideXml.includes('<a:pic>') || slideXml.includes('<p:pic>'),
        hasCharts: slideXml.includes('<c:chart>') || slideXml.includes('<p:chart>'),
        hasTables: slideXml.includes('<a:tbl>') || slideXml.includes('<p:tbl>'),
        hasShapes: slideXml.includes('<a:sp>') || slideXml.includes('<p:sp>'),
        hasAnimations: slideXml.includes('<p:anim>') || slideXml.includes('<p:timing>')
      };
      
      return {
        success: true,
        type: 'slide',
        data: slideAnalysis
      };
    } catch (error) {
      throw new Error(`슬라이드 작업 처리 실패: ${error.message}`);
    }
  }

  /**
   * 📝 노트 작업 처리
   */
  async processNoteTask(task, zip) {
    try {
      const noteXml = await this.getZipFileContent(zip, task.fileName);
      const noteText = this.extractTextFromSlideXmlAdvanced(noteXml);
      
      const noteAnalysis = {
        fileName: task.fileName,
        text: noteText,
        wordCount: noteText.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: noteText.length
      };
      
      return {
        success: true,
        type: 'note',
        data: noteAnalysis
      };
    } catch (error) {
      throw new Error(`노트 작업 처리 실패: ${error.message}`);
    }
  }

  /**
   * 📋 메타데이터 작업 처리
   */
  async processMetadataTask(task, zip) {
    try {
      const metadata = await this.extractAdvancedPresentationProperties(zip);
      
      return {
        success: true,
        type: 'metadata',
        data: metadata
      };
    } catch (error) {
      throw new Error(`메타데이터 작업 처리 실패: ${error.message}`);
    }
  }

  /**
   * 🔄 ZIP 분석 결과 통합
   */
  integrateZipAnalysisResults(results, filePath) {
    const slides = results.filter(r => r.type === 'slide' && r.success).map(r => r.data);
    const notes = results.filter(r => r.type === 'note' && r.success).map(r => r.data);
    const metadata = results.find(r => r.type === 'metadata' && r.success)?.data || {};
    
    // 텍스트 콘텐츠 통합
    let textContent = '';
    slides.forEach(slide => {
      textContent += `[슬라이드 ${slide.slideNumber}]\n${slide.text}\n\n`;
    });
    
    notes.forEach(note => {
      if (note.text.trim()) {
        textContent += `[노트]\n${note.text}\n\n`;
      }
    });
    
    // 통계 계산
    const totalWords = slides.reduce((sum, slide) => sum + slide.wordCount, 0);
    const totalCharacters = slides.reduce((sum, slide) => sum + slide.characterCount, 0);
    const hasImages = slides.some(slide => slide.hasImages);
    const hasCharts = slides.some(slide => slide.hasCharts);
    const hasTables = slides.some(slide => slide.hasTables);
    const hasAnimations = slides.some(slide => slide.hasAnimations);
    
    return {
      success: true,
      content: textContent.trim(),
      structure: {
        slides: slides.length,
        sections: 0,
        paragraphs: textContent.split(/\n\s*\n/).length,
        lines: textContent.split('\n').length,
        characters: totalCharacters,
        words: totalWords,
        slideDetails: slides,
        noteDetails: notes
      },
      metadata: {
        title: metadata.title || path.basename(filePath, '.pptx'),
        author: metadata.author || '',
        subject: metadata.subject || '',
        created: metadata.created || null,
        modified: metadata.modified || null,
        slides: slides.length,
        hasImages,
        hasCharts,
        hasTables,
        hasAnimations,
        hasTransitions: false,
        ...metadata
      },
      analysis: {
        language: this.detectLanguageAdvanced(textContent),
        keywords: this.extractKeywordsAdvanced(textContent),
        sentiment: this.analyzeSentimentAdvanced(textContent),
        readability: this.calculateReadabilityAdvanced(textContent),
        confidence: textContent.length > 0 ? 0.9 : 0.3,
        extractionMethod: 'advanced-zip-analysis',
        slideStatistics: this.calculateSlideStatistics(slides)
      }
    };
  }

  /**
   * 🎨 스타일 추출
   */
  async extractStylesFromZip(zip) {
    try {
      const styles = {
        themes: [],
        fonts: new Set(),
        colors: new Set(),
        effects: []
      };
      
      // 테마 파일 분석
      const themeFiles = Object.keys(zip.files).filter(fileName => 
        fileName.includes('/theme/') && fileName.endsWith('.xml')
      );
      
      for (const fileName of themeFiles) {
        try {
          const themeXml = await this.getZipFileContent(zip, fileName);
          const themeData = this.extractThemeData(themeXml);
          styles.themes.push(themeData);
        } catch (error) {
          logger.warn(`⚠️ 테마 분석 실패: ${fileName}`);
        }
      }
      
      // 폰트 정보 추출
      const fontFiles = Object.keys(zip.files).filter(fileName => 
        fileName.includes('/fonts/') || fileName.includes('/embeddings/')
      );
      
      styles.fonts = Array.from(styles.fonts);
      styles.colors = Array.from(styles.colors);
      
      return styles;
    } catch (error) {
      logger.warn(`⚠️ 스타일 추출 실패: ${error.message}`);
      return { themes: [], fonts: [], colors: [], effects: [] };
    }
  }

  /**
   * 📐 레이아웃 추출
   */
  async extractLayoutsFromZip(zip) {
    try {
      const layouts = [];
      
      // 레이아웃 파일 분석
      const layoutFiles = Object.keys(zip.files).filter(fileName => 
        fileName.includes('/slideLayouts/') && fileName.endsWith('.xml')
      );
      
      for (const fileName of layoutFiles) {
        try {
          const layoutXml = await this.getZipFileContent(zip, fileName);
          const layoutData = this.extractLayoutData(layoutXml);
          layouts.push(layoutData);
        } catch (error) {
          logger.warn(`⚠️ 레이아웃 분석 실패: ${fileName}`);
        }
      }
      
      return layouts;
    } catch (error) {
      logger.warn(`⚠️ 레이아웃 추출 실패: ${error.message}`);
      return [];
    }
  }

  /**
   * 🖼️ 미디어 메타데이터 추출
   */
  async extractMediaMetadataFromZip(zip) {
    try {
      const mediaMetadata = {
        images: [],
        videos: [],
        audio: [],
        charts: []
      };
      
      // 이미지 파일 분석
      const imageFiles = Object.keys(zip.files).filter(fileName => 
        fileName.includes('/media/') && /\.(jpg|jpeg|png|gif|bmp|svg)$/i.test(fileName)
      );
      
      for (const fileName of imageFiles) {
        try {
          const imageData = await this.extractImageMetadata(zip, fileName);
          mediaMetadata.images.push(imageData);
        } catch (error) {
          logger.warn(`⚠️ 이미지 메타데이터 추출 실패: ${fileName}`);
        }
      }
      
      // 차트 파일 분석
      const chartFiles = Object.keys(zip.files).filter(fileName => 
        fileName.includes('/charts/') && fileName.endsWith('.xml')
      );
      
      for (const fileName of chartFiles) {
        try {
          const chartData = await this.extractChartMetadata(zip, fileName);
          mediaMetadata.charts.push(chartData);
        } catch (error) {
          logger.warn(`⚠️ 차트 메타데이터 추출 실패: ${fileName}`);
        }
      }
      
      return mediaMetadata;
    } catch (error) {
      logger.warn(`⚠️ 미디어 메타데이터 추출 실패: ${error.message}`);
      return { images: [], videos: [], audio: [], charts: [] };
    }
  }

  /**
   * 📝 고도화된 슬라이드 XML 텍스트 추출 (최종 개선)
   */
  extractTextFromSlideXmlAdvanced(xmlContent) {
    try {
      let textContent = '';
      
      // PowerPoint XML의 모든 텍스트 요소를 추출하는 정교한 패턴
      const textPatterns = [
        // 기본 텍스트 요소들
        /<a:t[^>]*>([^<]+)<\/a:t>/g,  // 기본 텍스트
        /<a:p[^>]*>([^<]+)<\/a:p>/g,  // 단락
        /<a:r[^>]*>([^<]+)<\/a:r>/g,  // 실행
        
        // 텍스트 본문 컨테이너
        /<a:txBody[^>]*>([^<]+)<\/a:txBody>/g,  // 텍스트 본문
        /<p:txBody[^>]*>([^<]+)<\/p:txBody>/g,  // 프레젠테이션 텍스트 본문
        
        // 제목 및 헤더
        /<a:title[^>]*>([^<]+)<\/a:title>/g,  // 제목
        /<a:subtitle[^>]*>([^<]+)<\/a:subtitle>/g,  // 부제목
        
        // 리스트 항목
        /<a:lstStyle[^>]*>([^<]+)<\/a:lstStyle>/g,  // 리스트 스타일
        /<a:lvl[^>]*>([^<]+)<\/a:lvl>/g,  // 리스트 레벨
        
        // 각주 및 주석
        /<a:footnote[^>]*>([^<]+)<\/a:footnote>/g,  // 각주
        /<a:comment[^>]*>([^<]+)<\/a:comment>/g,  // 주석
        
        // 하이퍼링크 텍스트
        /<a:hlinkClick[^>]*>([^<]+)<\/a:hlinkClick>/g,  // 클릭 하이퍼링크
        /<a:hlinkHover[^>]*>([^<]+)<\/a:hlinkHover>/g,  // 호버 하이퍼링크
        
        // 필드 텍스트
        /<a:fld[^>]*>([^<]+)<\/a:fld>/g,  // 필드
        /<a:instrText[^>]*>([^<]+)<\/a:instrText>/g,  // 명령 텍스트
        
        // 특수 텍스트 요소
        /<a:defRPr[^>]*>([^<]+)<\/a:defRPr>/g,  // 기본 실행 속성
        /<a:ln[^>]*>([^<]+)<\/a:ln>/g,  // 선
        /<a:solidFill[^>]*>([^<]+)<\/a:solidFill>/g,  // 채우기
        
        // 추가 텍스트 패턴들
        /<a:bodyPr[^>]*>([^<]+)<\/a:bodyPr>/g,  // 본문 속성
        /<a:normAutofit[^>]*>([^<]+)<\/a:normAutofit>/g,  // 자동 맞춤
        /<a:spAutoFit[^>]*>([^<]+)<\/a:spAutoFit>/g,  // 도형 자동 맞춤
      ];
      
      // 모든 패턴에서 텍스트 추출
      for (const pattern of textPatterns) {
        const matches = xmlContent.match(pattern);
        if (matches) {
          const extractedText = matches
            .map(match => {
              // 태그 제거 및 텍스트 정제
              let text = match.replace(/<[^>]+>/g, '');
              // 연속된 공백 정리
              text = text.replace(/\s+/g, ' ');
              return text.trim();
            })
            .filter(text => text.length > 0) // 빈 문자열 제거
            .join(' ');
          
          if (extractedText) {
            textContent += extractedText + ' ';
          }
        }
      }
      
      // 추가: 직접 텍스트 노드 추출 (더 정확한 방법)
      const directTextMatches = xmlContent.match(/>([^<]+)</g);
      if (directTextMatches) {
        const directText = directTextMatches
          .map(match => match.slice(1, -1)) // > < 제거
          .filter(text => text.trim().length > 0)
          .join(' ');
        
        if (directText) {
          textContent += directText + ' ';
        }
      }
      
      // HTML 엔티티 디코딩 (확장)
      textContent = this.decodeHtmlEntities(textContent);
      
      // 텍스트 정제 및 정규화
      textContent = this.cleanTextContent(textContent);
      
      // 중복 제거 및 최종 정리
      textContent = this.removeDuplicates(textContent);
      
      return textContent;
    } catch (error) {
      logger.warn(`⚠️ 고도화된 XML 텍스트 추출 실패: ${error.message}`);
      return '';
    }
  }

  /**
   * 🔧 HTML 엔티티 디코딩 (최종 개선)
   */
  decodeHtmlEntities(text) {
    const entities = {
      // 기본 HTML 엔티티
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&apos;': "'",
      
      // 따옴표
      '&ldquo;': '"',
      '&rdquo;': '"',
      '&lsquo;': "'",
      '&rsquo;': "'",
      '&laquo;': '«',
      '&raquo;': '»',
      
      // 대시 및 하이픈
      '&hellip;': '...',
      '&mdash;': '—',
      '&ndash;': '–',
      '&minus;': '−',
      
      // 수학 기호
      '&plusmn;': '±',
      '&times;': '×',
      '&divide;': '÷',
      '&deg;': '°',
      
      // 통화 기호
      '&cent;': '¢',
      '&pound;': '£',
      '&euro;': '€',
      '&yen;': '¥',
      
      // 저작권 및 상표
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
      
      // 화살표
      '&larr;': '←',
      '&rarr;': '→',
      '&uarr;': '↑',
      '&darr;': '↓',
      
      // 분수
      '&frac12;': '½',
      '&frac14;': '¼',
      '&frac34;': '¾',
      
      // 기타 특수 문자
      '&alpha;': 'α',
      '&beta;': 'β',
      '&gamma;': 'γ',
      '&delta;': 'δ',
      '&epsilon;': 'ε',
      '&theta;': 'θ',
      '&lambda;': 'λ',
      '&mu;': 'μ',
      '&pi;': 'π',
      '&sigma;': 'σ',
      '&phi;': 'φ',
      '&omega;': 'ω',
      
      // 숫자 엔티티 (일반적인 것들)
      '&#160;': ' ',
      '&#161;': '¡',
      '&#162;': '¢',
      '&#163;': '£',
      '&#164;': '¤',
      '&#165;': '¥',
      '&#166;': '¦',
      '&#167;': '§',
      '&#168;': '¨',
      '&#169;': '©',
      '&#170;': 'ª',
      '&#171;': '«',
      '&#172;': '¬',
      '&#173;': '­',
      '&#174;': '®',
      '&#175;': '¯',
      '&#176;': '°',
      '&#177;': '±',
      '&#178;': '²',
      '&#179;': '³',
      '&#180;': '´',
      '&#181;': 'µ',
      '&#182;': '¶',
      '&#183;': '·',
      '&#184;': '¸',
      '&#185;': '¹',
      '&#186;': 'º',
      '&#187;': '»',
      '&#188;': '¼',
      '&#189;': '½',
      '&#190;': '¾',
      '&#191;': '¿'
    };
    
    // 정규식으로 모든 HTML 엔티티 찾기 및 변환
    return text.replace(/&[#\w]+;/g, entity => {
      // 숫자 엔티티 처리 (&#123; 형태)
      if (entity.startsWith('&#x')) {
        const hex = entity.slice(3, -1);
        return String.fromCharCode(parseInt(hex, 16));
      } else if (entity.startsWith('&#')) {
        const num = entity.slice(2, -1);
        return String.fromCharCode(parseInt(num, 10));
      }
      
      // 명명된 엔티티 처리
      return entities[entity] || entity;
    });
  }

  /**
   * 🧹 텍스트 콘텐츠 정제 (최종 개선)
   */
  cleanTextContent(text) {
    return text
      // 연속된 공백 제거
      .replace(/\s+/g, ' ')
      // 빈 줄 정리
      .replace(/\n\s*\n/g, '\n')
      // 앞뒤 공백 제거
      .replace(/^\s+|\s+$/g, '')
      // 제어 문자 제거 (ASCII 0-31, 127)
      .replace(/[\x00-\x1F\x7F]/g, '')
      // 유니코드 제어 문자 제거
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // 특수문자 정리 (더 포괄적)
      .replace(/[^\w\s가-힣\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\uF900-\uFAFF\u2F800-\u2FA1F.,!?;:()[\]{}"'\-–—…@#$%^&*+=|\\/<>~`]/g, '')
      // 연속된 구두점 정리
      .replace(/([.,!?;:])\1+/g, '$1')
      // 불필요한 공백 정리
      .replace(/\s+([.,!?;:])/g, '$1')
      .trim();
  }

  /**
   * 🔄 중복 텍스트 제거
   */
  removeDuplicates(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const uniqueSentences = [...new Set(sentences)];
    return uniqueSentences.join('. ').trim();
  }

  /**
   * 🌍 고도화된 언어 감지
   */
  detectLanguageAdvanced(text) {
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
    
    const total = koreanChars + englishChars + chineseChars + japaneseChars;
    
    if (total === 0) return 'unknown';
    
    const koreanRatio = koreanChars / total;
    const englishRatio = englishChars / total;
    const chineseRatio = chineseChars / total;
    const japaneseRatio = japaneseChars / total;
    
    if (koreanRatio > 0.3) return 'ko';
    if (englishRatio > 0.5) return 'en';
    if (chineseRatio > 0.3) return 'zh';
    if (japaneseRatio > 0.3) return 'ja';
    
    return 'mixed';
  }

  /**
   * 🔑 고도화된 키워드 추출
   */
  extractKeywordsAdvanced(text) {
    // 불용어 목록
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      '이', '그', '저', '것', '수', '등', '및', '또는', '그리고', '하지만', '그러나', '때문에',
      '위해', '통해', '의해', '에서', '으로', '에게', '에게서', '부터', '까지', '까지도'
    ]);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s가-힣]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
    
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // TF-IDF 스타일 가중치 적용
    const totalWords = words.length;
    const weightedWords = Object.entries(wordCount).map(([word, count]) => ({
      word,
      count,
      weight: count / totalWords
    }));
    
    return weightedWords
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15)
      .map(item => item.word);
  }

  /**
   * 😊 고도화된 감정 분석
   */
  analyzeSentimentAdvanced(text) {
    const positiveWords = [
      '좋은', '훌륭한', '멋진', '완벽', '최고', '최상', '우수', '탁월', '뛰어난', '훌륭',
      'excellent', 'great', 'amazing', 'perfect', 'outstanding', 'superb', 'wonderful', 'fantastic'
    ];
    
    const negativeWords = [
      '나쁜', '끔찍한', '최악', '실패', '문제', '어려운', '힘든', '불량', '부족', '미흡',
      'terrible', 'awful', 'horrible', 'bad', 'poor', 'worst', 'failure', 'problem', 'difficult'
    ];
    
    const neutralWords = [
      '일반', '보통', '평균', '중간', '적당', '보통',
      'normal', 'average', 'ordinary', 'usual', 'standard', 'moderate'
    ];
    
    const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.toLowerCase().includes(word)).length;
    const neutralCount = neutralWords.filter(word => text.toLowerCase().includes(word)).length;
    
    const total = positiveCount + negativeCount + neutralCount;
    
    if (total === 0) return { sentiment: 'neutral', confidence: 0, scores: { positive: 0, negative: 0, neutral: 0 } };
    
    const positiveScore = positiveCount / total;
    const negativeScore = negativeCount / total;
    const neutralScore = neutralCount / total;
    
    let sentiment = 'neutral';
    let confidence = Math.max(positiveScore, negativeScore, neutralScore);
    
    if (positiveScore > negativeScore && positiveScore > neutralScore) {
      sentiment = 'positive';
    } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
      sentiment = 'negative';
    }
    
    return {
      sentiment,
      confidence,
      scores: { positive: positiveScore, negative: negativeScore, neutral: neutralScore }
    };
  }

  /**
   * 📖 고도화된 가독성 계산
   */
  calculateReadabilityAdvanced(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    const characters = text.length;
    const syllables = this.countSyllables(text);
    
    if (sentences === 0 || words === 0) return { score: 0, level: 'unknown', metrics: {} };
    
    const avgWordsPerSentence = words / sentences;
    const avgCharsPerWord = characters / words;
    const avgSyllablesPerWord = syllables / words;
    
    // Flesch Reading Ease Score
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    // Flesch-Kincaid Grade Level
    const gradeLevel = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;
    
    // 가독성 레벨 결정
    let level = 'unknown';
    if (fleschScore >= 90) level = 'very_easy';
    else if (fleschScore >= 80) level = 'easy';
    else if (fleschScore >= 70) level = 'fairly_easy';
    else if (fleschScore >= 60) level = 'standard';
    else if (fleschScore >= 50) level = 'fairly_difficult';
    else if (fleschScore >= 30) level = 'difficult';
    else level = 'very_difficult';
    
    return {
      score: Math.max(0, Math.min(100, fleschScore)),
      level,
      gradeLevel: Math.max(0, gradeLevel),
      metrics: {
        sentences,
        words,
        characters,
        syllables,
        avgWordsPerSentence,
        avgCharsPerWord,
        avgSyllablesPerWord
      }
    };
  }

  /**
   * 🔢 음절 수 계산
   */
  countSyllables(text) {
    // 간단한 음절 계산 (영어 기준)
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;
    
    words.forEach(word => {
      word = word.replace(/[^a-z]/g, '');
      if (word.length <= 3) {
        totalSyllables += 1;
      } else {
        const syllables = word.match(/[aeiouy]+/g);
        totalSyllables += syllables ? syllables.length : 1;
      }
    });
    
    return totalSyllables;
  }

  /**
   * 📊 슬라이드 통계 계산
   */
  calculateSlideStatistics(slides) {
    if (slides.length === 0) return {};
    
    const wordCounts = slides.map(slide => slide.wordCount);
    const charCounts = slides.map(slide => slide.characterCount);
    
    return {
      totalSlides: slides.length,
      averageWordsPerSlide: wordCounts.reduce((a, b) => a + b, 0) / slides.length,
      averageCharsPerSlide: charCounts.reduce((a, b) => a + b, 0) / slides.length,
      maxWordsInSlide: Math.max(...wordCounts),
      minWordsInSlide: Math.min(...wordCounts),
      slidesWithImages: slides.filter(slide => slide.hasImages).length,
      slidesWithCharts: slides.filter(slide => slide.hasCharts).length,
      slidesWithTables: slides.filter(slide => slide.hasTables).length,
      slidesWithAnimations: slides.filter(slide => slide.hasAnimations).length
    };
  }

  /**
   * 📝 문서 요약 생성
   */
  generateDocumentSummary(result) {
    const { content, structure, metadata, analysis } = result;
    
    const summary = {
      title: metadata.title,
      slideCount: structure.slides,
      totalWords: structure.words,
      totalCharacters: structure.characters,
      mainLanguage: analysis.language,
      sentiment: analysis.sentiment,
      readability: analysis.readability.level,
      keyFeatures: [],
      estimatedReadingTime: Math.ceil(structure.words / 200), // 분당 200단어 기준
      complexity: this.assessComplexity(analysis.readability.score, structure.slides)
    };
    
    // 주요 특징 식별
    if (metadata.hasImages) summary.keyFeatures.push('이미지 포함');
    if (metadata.hasCharts) summary.keyFeatures.push('차트 포함');
    if (metadata.hasTables) summary.keyFeatures.push('표 포함');
    if (metadata.hasAnimations) summary.keyFeatures.push('애니메이션 포함');
    
    // 키워드 기반 주제 추정
    if (analysis.keywords.length > 0) {
      summary.estimatedTopics = analysis.keywords.slice(0, 5);
    }
    
    return summary;
  }

  /**
   * 📊 복잡도 평가
   */
  assessComplexity(readabilityScore, slideCount) {
    let complexity = 'simple';
    
    if (readabilityScore < 30 || slideCount > 50) {
      complexity = 'complex';
    } else if (readabilityScore < 60 || slideCount > 20) {
      complexity = 'moderate';
    }
    
    return complexity;
  }

  // ===== 유틸리티 메서드들 =====

  /**
   * 🆔 분석 ID 생성
   */
  generateAnalysisId(filePath) {
    // 간단한 해시 함수로 ID 생성
    let hash = 0;
    const str = filePath + Date.now();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    
    return Math.abs(hash).toString(16).substring(0, 8);
  }

  /**
   * 📋 기본 정보 추출 (개선된 버전)
   */
  extractBasicInfo(filePath, stats) {
    return {
      fileName: path.basename(filePath),
      fileNameWithoutExt: path.basename(filePath, path.extname(filePath)),
      fileSize: stats.size,
      fileSizeFormatted: this.formatSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      format: path.extname(filePath).toLowerCase() === '.pptx' ? 'PowerPoint 2007+' : 'PowerPoint 97-2003',
      path: filePath,
      directory: path.dirname(filePath)
    };
  }

  /**
   * 📏 파일 크기 포맷팅 (개선된 버전)
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * ⚡ 성능 메트릭 업데이트
   */
  updatePerformanceMetrics(duration) {
    this.performanceMetrics.totalAnalyses++;
    this.performanceMetrics.averageTime = 
      (this.performanceMetrics.averageTime * (this.performanceMetrics.totalAnalyses - 1) + duration) / 
      this.performanceMetrics.totalAnalyses;
  }

  /**
   * 🧹 캐시 정리 (수정된 버전)
   */
  cleanupCache() {
    const maxCacheSize = 100;
    if (this.cache.size > maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => {
        const timestampA = a[1].metadata?.analysisTimestamp || 0;
        const timestampB = b[1].metadata?.analysisTimestamp || 0;
        return new Date(timestampA) - new Date(timestampB);
      });
      
      const toDelete = entries.slice(0, this.cache.size - maxCacheSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
      
      logger.info(`🧹 [PowerPoint 분석] 캐시 정리: ${toDelete.length}개 항목 제거`);
    }
  }

  /**
   * 📊 성능 통계 조회
   */
  getPerformanceStats() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.totalAnalyses > 0 ? 
        this.performanceMetrics.cacheHits / this.performanceMetrics.totalAnalyses : 0
    };
  }

  /**
   * 🔄 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
    this.analysisCache.clear();
    logger.info(`🧹 [PowerPoint 분석] 캐시 초기화 완료`);
  }

  // ===== 누락된 메서드들 추가 =====

  /**
   * 🔧 워커 생성
   */
  createWorkers() {
    const workers = [];
    for (let i = 0; i < this.maxWorkers; i++) {
      workers.push({
        id: i,
        busy: false
      });
    }
    return workers;
  }

  /**
   * 🔄 워커 작업 처리
   */
  async processWorkerTasks(tasks, worker, zip) {
    const results = [];
    for (const task of tasks) {
      try {
        const result = await this.processTask(task, zip);
        results.push(result);
      } catch (error) {
        logger.warn(`⚠️ 워커 ${worker.id} 작업 처리 실패: ${error.message}`);
        results.push({ success: false, error: error.message, task });
      }
    }
    return results;
  }

  /**
   * 📦 ZIP 파일 내용 가져오기 (수정된 버전)
   */
  async getZipFileContent(zip, fileName) {
    try {
      const file = zip.file(fileName);
      if (file) {
        return await file.async('string');
      }
      throw new Error(`파일을 찾을 수 없음: ${fileName}`);
    } catch (error) {
      throw new Error(`ZIP 파일 내용 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 🔢 슬라이드 번호 추출
   */
  extractSlideNumber(entryName) {
    const match = entryName.match(/slide(\d+)\.xml/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * 📋 고급 프레젠테이션 속성 추출 (수정된 버전)
   */
  async extractAdvancedPresentationProperties(zip) {
    try {
      const props = {
        title: '',
        author: '',
        subject: '',
        created: null,
        modified: null,
        category: '',
        keywords: [],
        comments: '',
        template: '',
        application: 'Microsoft PowerPoint'
      };

      // app.xml에서 속성 추출
      try {
        const appXml = await this.getZipFileContent(zip, 'docProps/app.xml');
        const titleMatch = appXml.match(/<Title>([^<]+)<\/Title>/);
        if (titleMatch) props.title = titleMatch[1];
        
        const subjectMatch = appXml.match(/<Subject>([^<]+)<\/Subject>/);
        if (subjectMatch) props.subject = subjectMatch[1];
        
        const categoryMatch = appXml.match(/<Category>([^<]+)<\/Category>/);
        if (categoryMatch) props.category = categoryMatch[1];
        
        const templateMatch = appXml.match(/<Template>([^<]+)<\/Template>/);
        if (templateMatch) props.template = templateMatch[1];
      } catch (error) {
        logger.warn(`⚠️ app.xml 속성 추출 실패: ${error.message}`);
      }

      // core.xml에서 속성 추출
      try {
        const coreXml = await this.getZipFileContent(zip, 'docProps/core.xml');
        const authorMatch = coreXml.match(/<dc:creator>([^<]+)<\/dc:creator>/);
        if (authorMatch) props.author = authorMatch[1];
        
        const createdMatch = coreXml.match(/<dcterms:created>([^<]+)<\/dcterms:created>/);
        if (createdMatch) props.created = new Date(createdMatch[1]);
        
        const modifiedMatch = coreXml.match(/<dcterms:modified>([^<]+)<\/dcterms:modified>/);
        if (modifiedMatch) props.modified = new Date(modifiedMatch[1]);
        
        const keywordsMatch = coreXml.match(/<cp:keywords>([^<]+)<\/cp:keywords>/);
        if (keywordsMatch) props.keywords = keywordsMatch[1].split(',').map(k => k.trim());
      } catch (error) {
        logger.warn(`⚠️ core.xml 속성 추출 실패: ${error.message}`);
      }

      return props;
    } catch (error) {
      logger.warn(`⚠️ 프레젠테이션 속성 추출 실패: ${error.message}`);
      return { title: '', author: '', subject: '', created: null, modified: null };
    }
  }

  /**
   * 🎨 테마 데이터 추출
   */
  extractThemeData(themeXml) {
    try {
      const themeData = {
        name: '',
        colors: [],
        fonts: [],
        effects: []
      };

      // 테마 이름 추출
      const nameMatch = themeXml.match(/<a:themeName[^>]*>([^<]+)<\/a:themeName>/);
      if (nameMatch) themeData.name = nameMatch[1];

      // 색상 팔레트 추출
      const colorMatches = themeXml.match(/<a:srgbClr[^>]*val="([^"]+)"/g);
      if (colorMatches) {
        themeData.colors = colorMatches.map(match => {
          const valMatch = match.match(/val="([^"]+)"/);
          return valMatch ? valMatch[1] : '';
        }).filter(color => color);
      }

      // 폰트 정보 추출
      const fontMatches = themeXml.match(/<a:latin[^>]*typeface="([^"]+)"/g);
      if (fontMatches) {
        themeData.fonts = fontMatches.map(match => {
          const typefaceMatch = match.match(/typeface="([^"]+)"/);
          return typefaceMatch ? typefaceMatch[1] : '';
        }).filter(font => font);
      }

      return themeData;
    } catch (error) {
      logger.warn(`⚠️ 테마 데이터 추출 실패: ${error.message}`);
      return { name: '', colors: [], fonts: [], effects: [] };
    }
  }

  /**
   * 📐 레이아웃 데이터 추출
   */
  extractLayoutData(layoutXml) {
    try {
      const layoutData = {
        type: '',
        name: '',
        elements: [],
        background: ''
      };

      // 레이아웃 타입 추출
      const typeMatch = layoutXml.match(/<p:sldLayoutId[^>]*type="([^"]+)"/);
      if (typeMatch) layoutData.type = typeMatch[1];

      // 레이아웃 이름 추출
      const nameMatch = layoutXml.match(/<p:cSld[^>]*name="([^"]+)"/);
      if (nameMatch) layoutData.name = nameMatch[1];

      // 배경 정보 추출
      const bgMatch = layoutXml.match(/<p:bg[^>]*>([^<]+)<\/p:bg>/);
      if (bgMatch) layoutData.background = bgMatch[1];

      return layoutData;
    } catch (error) {
      logger.warn(`⚠️ 레이아웃 데이터 추출 실패: ${error.message}`);
      return { type: '', name: '', elements: [], background: '' };
    }
  }

  /**
   * 🖼️ 이미지 메타데이터 추출
   */
  async extractImageMetadata(zip, fileName) {
    try {
      const imageData = {
        fileName,
        size: 0,
        type: '',
        dimensions: { width: 0, height: 0 },
        compression: '',
        colorSpace: ''
      };

      const file = zip.file(fileName);
      if (file) {
        imageData.size = file._data.uncompressedSize;
        imageData.type = path.extname(fileName).toLowerCase();
      }

      return imageData;
    } catch (error) {
      logger.warn(`⚠️ 이미지 메타데이터 추출 실패: ${fileName} - ${error.message}`);
      return { fileName, size: 0, type: '', dimensions: { width: 0, height: 0 } };
    }
  }

  /**
   * 📈 차트 메타데이터 추출
   */
  async extractChartMetadata(zip, fileName) {
    try {
      const chartData = {
        fileName,
        type: '',
        title: '',
        series: [],
        categories: []
      };

      const chartXml = await this.getZipFileContent(zip, fileName);
      
      // 차트 타입 추출
      const typeMatch = chartXml.match(/<c:chart[^>]*>([^<]+)<\/c:chart>/);
      if (typeMatch) chartData.type = typeMatch[1];

      // 차트 제목 추출
      const titleMatch = chartXml.match(/<c:title[^>]*>([^<]+)<\/c:title>/);
      if (titleMatch) chartData.title = titleMatch[1];

      return chartData;
    } catch (error) {
      logger.warn(`⚠️ 차트 메타데이터 추출 실패: ${fileName} - ${error.message}`);
      return { fileName, type: '', title: '', series: [], categories: [] };
    }
  }

  /**
   * 🔧 officegen 고도화 분석 (수정된 버전)
   */
  async extractWithOfficegenAdvanced(buffer, filePath, options) {
    try {
      // officegen 라이브러리 동적 로드 시도
      const officegen = await this.getOfficegen();
      const pptx = officegen('pptx');
      
      // 파일에서 텍스트 추출
      const textContent = await this.extractTextFromPptxAdvanced(buffer);
      
      return {
        success: true,
        content: textContent,
        structure: {
          slides: this.countSlidesAdvanced(buffer),
          sections: 0,
          paragraphs: textContent.split(/\n\s*\n/).length,
          lines: textContent.split('\n').length,
          characters: textContent.length,
          words: textContent.split(/\s+/).filter(word => word.length > 0).length
        },
        metadata: {
          title: path.basename(filePath, path.extname(filePath)),
          author: '',
          subject: '',
          created: null,
          modified: null,
          slides: this.countSlidesAdvanced(buffer),
          hasImages: textContent.includes('[이미지]') || textContent.includes('[Image]'),
          hasCharts: textContent.includes('[차트]') || textContent.includes('[Chart]'),
          hasTables: textContent.includes('[표]') || textContent.includes('[Table]'),
          hasAnimations: false,
          hasTransitions: false
        },
        analysis: {
          language: this.detectLanguageAdvanced(textContent),
          keywords: this.extractKeywordsAdvanced(textContent),
          sentiment: this.analyzeSentimentAdvanced(textContent),
          readability: this.calculateReadabilityAdvanced(textContent),
          confidence: 0.8,
          extractionMethod: 'officegen-advanced'
        }
      };
    } catch (error) {
      throw new Error(`officegen 고도화 분석 실패: ${error.message}`);
    }
  }

  /**
   * 🔍 고도화된 바이너리 분석 (최종 개선)
   */
  async extractWithAdvancedBinaryAnalysis(buffer, filePath, options) {
    try {
      let textContent = '';
      
      // PPT 파일의 텍스트 블록 패턴 찾기 (확장)
      const textPatterns = [
        // 한글 패턴들
        /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g, // 한글 유니코드
        /[가-힣]+/g, // 한글 완성형
        /[ㄱ-ㅎㅏ-ㅣ]+/g, // 한글 자모
        
        // 영문 및 숫자 패턴들
        /[A-Za-z0-9\s]+/g, // 영문 및 숫자
        /[A-Za-z]+/g, // 영문만
        /[0-9]+/g, // 숫자만
        
        // 특수 문자 포함 패턴
        /[A-Za-z0-9\s가-힣\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F.,!?;:()[\]{}"'\-–—…]+/g,
        
        // 일본어 패턴
        /[\u3040-\u309F\u30A0-\u30FF]+/g, // 히라가나, 카타카나
        
        // 중국어 패턴
        /[\u4E00-\u9FAF\u3400-\u4DBF]+/g, // 한자
      ];
      
      // 바이너리에서 텍스트 블록 찾기
      const textBlocks = this.findTextBlocksAdvanced(buffer);
      
      // 각 블록에서 텍스트 추출
      for (const block of textBlocks) {
        try {
          const text = buffer.slice(block.offset, block.offset + block.length).toString('utf8');
          
          // 텍스트 패턴 확인
          for (const pattern of textPatterns) {
            const matches = text.match(pattern);
            if (matches && matches.length > 0) {
              const cleanMatches = matches
                .filter(match => match.trim().length > 1) // 1글자 이하 제거
                .map(match => match.trim());
              
              if (cleanMatches.length > 0) {
                textContent += cleanMatches.join(' ') + '\n';
              }
            }
          }
        } catch (error) {
          logger.warn(`⚠️ 텍스트 블록 처리 실패: ${error.message}`);
        }
      }
      
      // 추가: 전체 버퍼에서 직접 텍스트 추출 시도
      const directText = this.extractDirectTextFromBuffer(buffer);
      if (directText) {
        textContent += directText + '\n';
      }
      
      // 텍스트 정제
      textContent = this.cleanTextContent(textContent);
      textContent = this.removeDuplicates(textContent);
      
      return {
        success: true,
        content: textContent.trim(),
        structure: {
          slides: this.countSlidesAdvanced(buffer),
          sections: 0,
          paragraphs: textContent.split(/\n\s*\n/).length,
          lines: textContent.split('\n').length,
          characters: textContent.length,
          words: textContent.split(/\s+/).filter(word => word.length > 0).length
        },
        metadata: {
          title: path.basename(filePath, '.ppt'),
          author: '',
          subject: '',
          created: null,
          modified: null,
          slides: this.countSlidesAdvanced(buffer),
          hasImages: false,
          hasCharts: false,
          hasTables: false,
          hasAnimations: false,
          hasTransitions: false
        },
        analysis: {
          language: this.detectLanguageAdvanced(textContent),
          keywords: this.extractKeywordsAdvanced(textContent),
          sentiment: this.analyzeSentimentAdvanced(textContent),
          readability: this.calculateReadabilityAdvanced(textContent),
          confidence: textContent.length > 0 ? 0.6 : 0.2,
          extractionMethod: 'advanced-binary-analysis'
        }
      };
      
    } catch (error) {
      throw new Error(`고도화된 바이너리 분석 실패: ${error.message}`);
    }
  }

  /**
   * 📝 버퍼에서 직접 텍스트 추출
   */
  extractDirectTextFromBuffer(buffer) {
    try {
      let textContent = '';
      
      // 다양한 인코딩으로 시도
      const encodings = ['utf8', 'utf16le', 'latin1', 'ascii'];
      
      for (const encoding of encodings) {
        try {
          const decoded = buffer.toString(encoding);
          
          // 의미 있는 텍스트 패턴 찾기
          const meaningfulText = decoded.match(/[A-Za-z가-힣\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]{3,}/g);
          
          if (meaningfulText && meaningfulText.length > 0) {
            const cleanText = meaningfulText
              .filter(text => text.length > 2)
              .join(' ');
            
            if (cleanText.length > 10) { // 최소 길이 확인
              textContent += cleanText + ' ';
            }
          }
        } catch (error) {
          // 인코딩 실패 시 다음 인코딩 시도
          continue;
        }
      }
      
      return textContent.trim();
    } catch (error) {
      logger.warn(`⚠️ 직접 텍스트 추출 실패: ${error.message}`);
      return '';
    }
  }

  /**
   * 📄 고도화된 폴백 텍스트 추출
   */
  extractFallbackAdvanced(buffer, filePath, format, options) {
    const fileName = path.basename(filePath, `.${format}`);
    const fileSize = buffer.length;
    
    const content = `PowerPoint 문서: ${fileName}\n\n파일 크기: ${this.formatSize(fileSize)}\n형식: ${format.toUpperCase()}\n\n이 PowerPoint 문서의 텍스트 내용을 추출할 수 없습니다.\nPowerPoint 뷰어나 변환 도구를 사용하여 텍스트로 변환 후 분석하세요.`;
    
    return {
      success: true,
      content: content,
      structure: {
        slides: 0,
        sections: 0,
        paragraphs: content.split(/\n\s*\n/).length,
        lines: content.split('\n').length,
        characters: content.length,
        words: content.split(/\s+/).filter(word => word.length > 0).length
      },
      metadata: {
        title: fileName,
        author: '',
        subject: '',
        created: null,
        modified: null,
        slides: 0,
        hasImages: false,
        hasCharts: false,
        hasTables: false,
        hasAnimations: false,
        hasTransitions: false
      },
      analysis: {
        language: 'ko',
        keywords: this.extractKeywordsAdvanced(content),
        sentiment: this.analyzeSentimentAdvanced(content),
        readability: this.calculateReadabilityAdvanced(content),
        confidence: 0.1,
        extractionMethod: 'fallback-advanced'
      }
    };
  }

  /**
   * 🔍 고도화된 텍스트 블록 찾기 (최종 개선)
   */
  findTextBlocksAdvanced(buffer) {
    const blocks = [];
    
    try {
      // PowerPoint 파일의 텍스트 블록 시그니처 패턴 (확장)
      const textSignatures = [
        // 기본 텍스트 시그니처
        { sig: Buffer.from([0x54, 0x45, 0x58, 0x54]), name: 'TEXT' }, // TEXT
        { sig: Buffer.from([0x54, 0x58, 0x54, 0x00]), name: 'TXT' }, // TXT\0
        { sig: Buffer.from([0x54, 0x69, 0x74, 0x6C]), name: 'TITLE' }, // Titl
        { sig: Buffer.from([0x48, 0x65, 0x61, 0x64]), name: 'HEAD' }, // Head
        { sig: Buffer.from([0x42, 0x6F, 0x64, 0x79]), name: 'BODY' }, // Body
        
        // 추가 텍스트 시그니처
        { sig: Buffer.from([0x4E, 0x6F, 0x74, 0x65]), name: 'NOTE' }, // Note
        { sig: Buffer.from([0x43, 0x6F, 0x6D, 0x6D]), name: 'COMM' }, // Comm
        { sig: Buffer.from([0x4C, 0x69, 0x73, 0x74]), name: 'LIST' }, // List
        { sig: Buffer.from([0x49, 0x74, 0x65, 0x6D]), name: 'ITEM' }, // Item
        { sig: Buffer.from([0x4C, 0x61, 0x62, 0x65]), name: 'LABEL' }, // Labe
        
        // 한글 관련 시그니처
        { sig: Buffer.from([0xEA, 0xB0, 0x80, 0x00]), name: 'KOREAN' }, // 가
        { sig: Buffer.from([0xED, 0x95, 0x9C, 0x00]), name: 'HANGUL' }, // 한
        { sig: Buffer.from([0xEA, 0xB8, 0x80, 0x00]), name: 'GUL' }, // 글
      ];
      
      // 시그니처 검색
      for (let i = 0; i < buffer.length - 4; i++) {
        for (const signature of textSignatures) {
          if (buffer.slice(i, i + 4).equals(signature.sig)) {
            try {
              // 블록 크기 추출 (다음 4바이트)
              const size = buffer.readUInt32LE(i + 4);
              
              // 유효한 크기인지 확인 (1KB ~ 1MB)
              if (size > 1024 && size < 1024 * 1024) {
                blocks.push({
                  offset: i,
                  length: size,
                  type: signature.name,
                  confidence: 0.8
                });
              }
            } catch (error) {
              // 크기 읽기 실패 시 무시
              continue;
            }
            break;
          }
        }
      }
      
      // 추가: 텍스트 패턴 기반 블록 찾기
      const textPatternBlocks = this.findTextPatternBlocks(buffer);
      blocks.push(...textPatternBlocks);
      
      // 중복 제거 및 정렬
      const uniqueBlocks = this.removeDuplicateBlocks(blocks);
      
      return uniqueBlocks;
    } catch (error) {
      logger.warn(`고도화된 텍스트 블록 찾기 실패: ${error.message}`);
    }
    
    return blocks;
  }

  /**
   * 📝 텍스트 패턴 기반 블록 찾기
   */
  findTextPatternBlocks(buffer) {
    const blocks = [];
    
    try {
      // 텍스트 패턴으로 블록 경계 찾기
      const textPattern = /[A-Za-z가-힣\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]{3,}/g;
      const bufferStr = buffer.toString('utf8', 0, Math.min(buffer.length, 1024 * 1024)); // 1MB까지만 검색
      
      let match;
      while ((match = textPattern.exec(bufferStr)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        
        // 블록 크기 계산
        const blockSize = Math.min(end - start + 100, 1024); // 최대 1KB
        
        blocks.push({
          offset: start,
          length: blockSize,
          type: 'PATTERN',
          confidence: 0.6,
          text: match[0]
        });
      }
    } catch (error) {
      logger.warn(`텍스트 패턴 블록 찾기 실패: ${error.message}`);
    }
    
    return blocks;
  }

  /**
   * 🔄 중복 블록 제거
   */
  removeDuplicateBlocks(blocks) {
    const uniqueBlocks = [];
    const seen = new Set();
    
    for (const block of blocks) {
      const key = `${block.offset}-${block.length}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBlocks.push(block);
      }
    }
    
    // 오프셋 순으로 정렬
    return uniqueBlocks.sort((a, b) => a.offset - b.offset);
  }

  /**
   * 📊 고도화된 슬라이드 수 계산
   */
  countSlidesAdvanced(buffer) {
    try {
      // 슬라이드 시그니처 패턴 찾기
      const slidePatterns = [
        Buffer.from([0x53, 0x4C, 0x49, 0x44]), // SLID
        Buffer.from([0x53, 0x6C, 0x69, 0x64]), // Slid
        Buffer.from([0x73, 0x6C, 0x69, 0x64])  // slid
      ];
      
      let count = 0;
      
      for (let i = 0; i < buffer.length - 4; i++) {
        for (const pattern of slidePatterns) {
          if (buffer.slice(i, i + 4).equals(pattern)) {
            count++;
            break;
          }
        }
      }
      
      return count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 📝 고도화된 PPTX 텍스트 추출 (수정된 버전)
   */
  async extractTextFromPptxAdvanced(buffer) {
    try {
      const JSZip = await this.getJSZip();
      const zip = new JSZip();
      
      // ZIP 파일 로드
      await zip.loadAsync(buffer);
      
      let textContent = '';
      
      // 슬라이드 XML 파일들에서 텍스트 추출
      const slideFiles = Object.keys(zip.files).filter(fileName => 
        fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')
      );
      
      for (const fileName of slideFiles) {
        try {
          const slideXml = await this.getZipFileContent(zip, fileName);
          const slideText = this.extractTextFromSlideXmlAdvanced(slideXml);
          const slideNumber = this.extractSlideNumber(fileName);
          
          if (slideText.trim()) {
            textContent += `[슬라이드 ${slideNumber}]\n${slideText}\n\n`;
          }
        } catch (error) {
          logger.warn(`⚠️ 슬라이드 ${fileName} 텍스트 추출 실패: ${error.message}`);
        }
      }
      
      // 노트 텍스트도 추출
      const noteFiles = Object.keys(zip.files).filter(fileName => 
        fileName.startsWith('ppt/notesSlides/notesSlide') && fileName.endsWith('.xml')
      );
      
      for (const fileName of noteFiles) {
        try {
          const noteXml = await this.getZipFileContent(zip, fileName);
          const noteText = this.extractTextFromSlideXmlAdvanced(noteXml);
          if (noteText.trim()) {
            textContent += `[노트]\n${noteText}\n\n`;
          }
        } catch (error) {
          logger.warn(`⚠️ 노트 ${fileName} 텍스트 추출 실패: ${error.message}`);
        }
      }
      
      return textContent.trim();
    } catch (error) {
      logger.error(`❌ 고도화된 PPTX 텍스트 추출 실패: ${error.message}`);
      return '';
    }
  }
} 