import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { Logger } from '../../common/Logger.js';

const gunzip = promisify(zlib.gunzip);
const inflate = promisify(zlib.inflate);
const logger = Logger.component('HwpAnalyzer');

/**
 * HWP 분석 관련 에러 클래스들
 */
class HwpAnalysisError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'HwpAnalysisError';
    this.cause = options.cause;
    this.filePath = options.filePath;
    this.operation = options.operation;
    this.code = options.code || 'HWP_ANALYSIS_FAILED';
  }
}

class SecurityError extends HwpAnalysisError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'SecurityError';
    this.code = 'SECURITY_VIOLATION';
  }
}

class MemoryError extends HwpAnalysisError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'MemoryError';
    this.code = 'MEMORY_LIMIT_EXCEEDED';
  }
}

/**
 * 동시성 제어를 위한 세마포어
 */
class Semaphore {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    this.currentCount = 0;
    this.queue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.currentCount < this.maxConcurrency) {
        this.currentCount++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    this.currentCount--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.currentCount++;
      next();
    }
  }

  async execute(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * 🇰🇷 한글 문서(.hwp) 완전 분석기
 * 한글과컴퓨터의 HWP 파일을 분석하여 텍스트, 구조, 메타데이터를 추출
 */
export class HwpAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // 기본 설정
    this.supportedVersions = ['HWP 2.1', 'HWP 3.0', 'HWP 5.0', 'HWP 2002', 'HWP 2004', 'HWP 2005', 'HWP 2007', 'HWP 2010', 'HWP 2014', 'HWP 2018', 'HWP 2022'];
    this.maxFileSize = options.maxFileSize || (50 * 1024 * 1024); // 50MB로 축소
    this.maxMemoryUsage = options.maxMemoryUsage || (100 * 1024 * 1024); // 100MB
    this.chunkSize = options.chunkSize || (64 * 1024); // 64KB 청크
    this.maxConcurrency = options.maxConcurrency || 2;
    this.timeout = options.timeout || 30000; // 30초 타임아웃
    
    // 동시성 제어
    this.semaphore = new Semaphore(this.maxConcurrency);
    
    // 메트릭 수집
    this.metrics = {
      totalAnalyzed: 0,
      totalErrors: 0,
      averageTime: 0,
      memoryPeaks: []
    };
    
    // 의존성 캐시
    this.dependencyCache = new Map();
    
    // 정리 작업을 위한 리소스 추적
    this.activeResources = new Set();
    
    // 프로세스 종료 시 정리 작업 등록
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }
  
  /**
   * 리소스 정리
   */
  cleanup() {
    try {
      // 활성 리소스 정리
      for (const resource of this.activeResources) {
        if (resource && typeof resource.destroy === 'function') {
          resource.destroy();
        }
      }
      this.activeResources.clear();
      
      // 의존성 캐시 정리
      this.dependencyCache.clear();
      
      logger.info('HwpAnalyzer 리소스 정리 완료');
    } catch (error) {
      logger.error('리소스 정리 중 오류:', error);
    }
  }

  /**
   * 📄 한글 문서 완전 분석 (보안 강화 버전)
   */
  async analyzeComplete(filePath) {
    return this.semaphore.execute(async () => {
      const startTime = Date.now();
      const operationId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        logger.info(`🔍 [한글 분석] 시작: ${filePath} (ID: ${operationId})`);
        
        // 1. 파일 존재 및 권한 확인
        await this.validateFileAccess(filePath);
        
        // 2. 파일 정보 사전 확인 (크기, 형식)
        const stats = await fs.stat(filePath);
        await this.validateFileSize(stats.size, filePath);
        
        // 3. 파일 시그니처 사전 검증
        await this.validateFileSignature(filePath);
        
        // 4. 안전한 파일 읽기 (스트림 기반)
        const buffer = await this.readFileSafely(filePath, stats.size, operationId);
        
        // 5. 메모리 사용량 모니터링 시작
        this.startMemoryMonitoring(operationId);
      
        // 6. 메모리 제한 하에서 분석 수행
        const analysisResult = await this.performAnalysisWithMemoryLimit(buffer, stats, filePath, operationId);
        
        const analysisDuration = Date.now() - startTime;
        
        // 7. 메트릭 업데이트
        this.updateMetrics(analysisDuration, true);
        
        // 8. 성공 이벤트 발생
        this.emit('analysisComplete', {
          filePath,
          duration: analysisDuration,
          operationId,
          success: true
        });
        
        logger.info(`✅ [한글 분석] 완료: ${filePath} (${analysisDuration}ms)`);
        
        return {
          ...analysisResult,
          operationId,
          analysis: {
            ...analysisResult.analysis,
            duration: analysisDuration,
            memoryPeak: this.getMemoryPeak(operationId)
          }
        };
      
      } catch (error) {
        const analysisDuration = Date.now() - startTime;
        
        // 메트릭 업데이트 (실패)
        this.updateMetrics(analysisDuration, false);
        
        // 에러 분류 및 처리
        const classifiedError = this.classifyError(error, filePath, 'analyzeComplete');
        
        // 실패 이벤트 발생
        this.emit('analysisError', {
          filePath,
          duration: analysisDuration,
          operationId,
          error: classifiedError
        });
        
        logger.error(`❌ [한글 분석] 오류: ${filePath}`, {
          error: classifiedError.message,
          code: classifiedError.code,
          duration: analysisDuration,
          operationId
        });
        
        return {
          success: false,
          error: classifiedError.message,
          errorCode: classifiedError.code,
          path: filePath,
          operationId,
          duration: analysisDuration
        };
      } finally {
        // 메모리 모니터링 정지 및 정리
        this.stopMemoryMonitoring(operationId);
        
        // 버퍼 강제 해제
        if (typeof global.gc === 'function') {
          global.gc();
        }
      }
    });
  }

  // ===== 새로 추가된 보안 및 안정성 메서드들 =====
  
  /**
   * 🔒 파일 접근 권한 검증
   */
  async validateFileAccess(filePath) {
    try {
      await fs.access(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new SecurityError(`파일 접근 권한이 없습니다: ${filePath}`, {
        cause: error,
        filePath,
        operation: 'validateFileAccess'
      });
    }
  }
  
  /**
   * 📏 파일 크기 검증
   */
  async validateFileSize(fileSize, filePath) {
    if (fileSize > this.maxFileSize) {
      throw new SecurityError(
        `파일 크기가 제한을 초과합니다: ${this.formatSize(fileSize)} > ${this.formatSize(this.maxFileSize)}`,
        {
          filePath,
          operation: 'validateFileSize',
          code: 'FILE_SIZE_EXCEEDED'
        }
      );
    }
    
    if (fileSize === 0) {
      throw new HwpAnalysisError('빈 파일입니다', {
        filePath,
        operation: 'validateFileSize',
        code: 'EMPTY_FILE'
      });
    }
  }
  
  /**
   * 🔍 파일 시그니처 사전 검증
   */
  async validateFileSignature(filePath) {
    const headerBuffer = Buffer.alloc(512);
    let fileHandle;
    
    try {
      fileHandle = await fs.open(filePath, 'r');
      const { bytesRead } = await fileHandle.read(headerBuffer, 0, 512, 0);
      
      if (bytesRead < 4) {
        throw new HwpAnalysisError('파일이 너무 작습니다', {
          filePath,
          operation: 'validateFileSignature',
          code: 'FILE_TOO_SMALL'
        });
      }
      
      // HWP 시그니처 확인
      const signature = headerBuffer.slice(0, 4).toString('utf8');
      const oleSignature = headerBuffer.slice(0, 8);
      const olePattern = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
      
      const isHwpSignature = signature === 'HWP ';
      const isOleSignature = oleSignature.equals(olePattern);
      
      if (!isHwpSignature && !isOleSignature) {
        throw new HwpAnalysisError('유효하지 않은 HWP 파일 시그니처', {
          filePath,
          operation: 'validateFileSignature',
          code: 'INVALID_SIGNATURE'
        });
      }
      
      // 악성 패턴 검사
      await this.checkMaliciousPatterns(headerBuffer, filePath);
      
    } finally {
      if (fileHandle) {
        await fileHandle.close();
      }
    }
  }
  
  /**
   * 🛡️ 악성 패턴 검사
   */
  async checkMaliciousPatterns(buffer, filePath) {
    const suspiciousPatterns = [
      // 실행 파일 시그니처
      Buffer.from([0x4D, 0x5A]), // MZ (PE)
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF
      // 스크립트 패턴
      Buffer.from('javascript:', 'utf8'),
      Buffer.from('vbscript:', 'utf8'),
      // 매크로 패턴
      Buffer.from('AutoExec', 'utf8'),
      Buffer.from('AutoOpen', 'utf8')
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (buffer.indexOf(pattern) !== -1) {
        throw new SecurityError('의심스러운 패턴이 감지되었습니다', {
          filePath,
          operation: 'checkMaliciousPatterns',
          code: 'MALICIOUS_PATTERN_DETECTED'
        });
      }
    }
  }
  
  /**
   * 📁 안전한 파일 읽기 (스트림 기반)
   */
  async readFileSafely(filePath, fileSize, operationId) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let totalSize = 0;
      let timeoutId;
      
      const stream = createReadStream(filePath, {
        highWaterMark: this.chunkSize,
        encoding: null
      });
      
      // 리소스 추적에 추가
      this.activeResources.add(stream);
      
      // 타임아웃 설정
      timeoutId = setTimeout(() => {
        stream.destroy();
        reject(new HwpAnalysisError('파일 읽기 타임아웃', {
          filePath,
          operation: 'readFileSafely',
          code: 'READ_TIMEOUT'
        }));
      }, this.timeout);
      
      stream.on('data', (chunk) => {
        totalSize += chunk.length;
        
        // 메모리 사용량 체크
        if (totalSize > this.maxMemoryUsage) {
          stream.destroy();
          clearTimeout(timeoutId);
          reject(new MemoryError('메모리 사용량 한계 초과', {
            filePath,
            operation: 'readFileSafely',
            code: 'MEMORY_LIMIT_EXCEEDED'
          }));
          return;
        }
        
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        clearTimeout(timeoutId);
        this.activeResources.delete(stream);
        
        try {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        } catch (error) {
          reject(new MemoryError('버퍼 결합 실패', {
            cause: error,
            filePath,
            operation: 'readFileSafely'
          }));
        }
      });
      
      stream.on('error', (error) => {
        clearTimeout(timeoutId);
        this.activeResources.delete(stream);
        reject(new HwpAnalysisError('파일 읽기 실패', {
          cause: error,
          filePath,
          operation: 'readFileSafely'
        }));
      });
    });
  }
  
  /**
   * 📋 기본 정보 추출
   */
  extractBasicInfo(buffer, stats, filePath) {
    return {
      fileName: path.basename(filePath),
      fileSize: stats.size,
      fileSizeFormatted: this.formatSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isBinary: true,
      format: 'HWP (한글과컴퓨터)'
    };
  }

  /**
   * 🔍 헤더 정보 분석
   */
  analyzeHeader(buffer) {
    try {
      const header = {
        signature: '',
        version: '',
        flags: 0,
        docInfo: {},
        compression: false,
        encryption: false
      };
      
      // OLE 복합 파일 시그니처 확인
      const oleSignature = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
      const isOleFile = buffer.slice(0, 8).equals(oleSignature);
      
      if (isOleFile) {
        header.signature = 'OLE';
        header.version = 'OLE Compound File';
        header.compression = false;
        header.encryption = false;
        logger.info('📦 OLE 복합 파일 감지');
        return header;
      }
      
      // HWP 시그니처 확인 (HWP )
      const signature = buffer.slice(0, 32).toString('utf8', 0, 4);
      header.signature = signature;
      
      if (signature !== 'HWP ') {
        throw new Error('유효하지 않은 한글 파일 시그니처');
      }
      
      // 버전 정보 (바이트 32-35)
      const versionBytes = buffer.slice(32, 36);
      const version = versionBytes.readUInt32LE(0);
      header.version = this.mapVersion(version);
      
      // 플래그 정보 (바이트 36-39)
      const flags = buffer.slice(36, 40).readUInt32LE(0);
      header.flags = flags;
      header.compression = (flags & 0x01) !== 0;
      header.encryption = (flags & 0x02) !== 0;
      
      // 문서 정보 블록 찾기
      header.docInfo = this.findDocumentInfo(buffer);
      
      return header;
      
    } catch (error) {
      logger.warn(`헤더 분석 실패: ${error.message}`);
      return {
        signature: 'unknown',
        version: 'unknown',
        flags: 0,
        docInfo: {},
        compression: false,
        encryption: false
      };
    }
  }

  /**
   * 📝 텍스트 추출 (여러 방법 시도)
   */
  async extractText(buffer, filePath) {
    // 먼저 압축 해제 시도
    const decompressedBuffer = await this.decompressHwpData(buffer);
    const isCompressed = decompressedBuffer !== buffer;
    
    if (isCompressed) {
      logger.info('🗜️ 압축된 HWP 파일 해제 완료');
    }
    
    const methods = [
      { name: 'hwp.js', method: this.extractWithHwpJs },
      { name: 'ole-parser', method: this.extractWithOleParser },
      { name: 'hwp-parser', method: this.extractWithHwpParser },
      { name: 'binary-analysis', method: this.extractWithBinaryAnalysis },
      { name: 'fallback', method: this.extractFallback }
    ];
    
    for (const method of methods) {
      try {
        logger.info(`🔍 [한글 텍스트 추출] ${method.name} 시도 중...`);
        const result = await method.method.call(this, decompressedBuffer, filePath);
        
        if (result && result.content && result.content.trim().length > 0) {
          logger.info(`✅ [한글 텍스트 추출] ${method.name} 성공: ${result.content.length} characters`);
          return {
            content: result.content,
            method: method.name,
            confidence: result.confidence || 0.8,
            warnings: result.warnings || [],
            wasCompressed: isCompressed
          };
        }
      } catch (error) {
        logger.warn(`⚠️ [한글 텍스트 추출] ${method.name} 실패: ${error.message}`);
      }
    }
    
    // 모든 방법 실패 시 기본 정보만 반환
    return {
      content: `한글 문서: ${path.basename(filePath)}\n\n텍스트 추출에 실패했습니다.`,
      method: 'none',
      confidence: 0.0,
      warnings: ['모든 텍스트 추출 방법이 실패했습니다.'],
      wasCompressed: isCompressed
    };
  }

  /**
   * 🔧 hwp.js 라이브러리 사용 (권장)
   */
  async extractWithHwpJs(buffer, filePath) {
    try {
      // hwp.js 라이브러리 동적 로드 시도
      const hwpJs = await import('hwp.js').catch(() => null);
      
      if (!hwpJs) {
        throw new Error('hwp.js 라이브러리가 설치되지 않았습니다');
      }
      
      const doc = hwpJs.parse(buffer);
      let content = '';
      
      // 문서의 모든 섹션에서 텍스트 추출
      if (doc.bodyText && doc.bodyText.sections) {
        content = doc.bodyText.sections.map(section => {
          return this.extractTextFromSection(section);
        }).join('\n\n');
      }
      
      return {
        content: content.trim(),
        confidence: content.length > 100 ? 0.95 : (content.length > 0 ? 0.8 : 0.3),
        warnings: []
      };
    } catch (error) {
      throw new Error(`hwp.js 실패: ${error.message}`);
    }
  }

  /**
   * 🏗️ OLE 복합 파일 파서 사용 (최적화)
   */
  async extractWithOleParser(buffer, filePath) {
    try {
      // cfb 라이브러리 동적 로드 시도
      const cfb = await import('cfb').catch(() => null);
      const pako = await import('pako').catch(() => null);
      
      if (!cfb) {
        throw new Error('cfb 라이브러리가 설치되지 않았습니다');
      }
      
      // OLE 복합 파일 파싱
      const workbook = cfb.read(buffer);
      let extractedText = '';
      
      // BodyText 스트림들 찾기 (Section0, Section1, ...)
      for (let i = 0; i < 100; i++) { // 최대 100개 섹션
        const sectionName = `BodyText/Section${i}`;
        const bodyTextEntry = cfb.find(workbook, sectionName);
        
        if (!bodyTextEntry) {
          if (i === 0) continue; // Section0이 없으면 다른 이름일 수 있음
          break; // 연속된 섹션이 없으면 종료
        }
        
        try {
          let content = bodyTextEntry.content;
          
          // 압축 해제 시도
          if (pako && this.isCompressedData(content)) {
            try {
              content = pako.inflate(content);
              logger.info(`📦 Section${i} 압축 해제 성공`);
            } catch (e) {
              logger.warn(`Section${i} 압축 해제 실패, 원본 사용`);
            }
          }
          
          // HWP 레코드에서 텍스트 추출
          const sectionText = this.parseHwpRecords(content);
          if (sectionText.trim()) {
            extractedText += sectionText + '\n\n';
          }
        } catch (e) {
          logger.warn(`Section${i} 처리 실패: ${e.message}`);
        }
      }
      
      // PrvText (미리보기 텍스트) 스트림도 시도
      if (extractedText.length === 0) {
        const prvText = cfb.find(workbook, 'PrvText');
        if (prvText) {
          extractedText = prvText.content.toString('utf16le').replace(/\0/g, '');
          logger.info('📄 PrvText에서 텍스트 추출');
        }
      }
      
      return {
        content: extractedText.trim(),
        confidence: extractedText.length > 100 ? 0.9 : (extractedText.length > 0 ? 0.7 : 0.2),
        warnings: extractedText.length === 0 ? ['OLE 스트림에서 텍스트를 찾을 수 없습니다'] : []
      };
    } catch (error) {
      throw new Error(`OLE 파싱 실패: ${error.message}`);
    }
  }

  /**
   * 🔧 기존 hwp-parser 라이브러리 사용 (fallback)
   */
  async extractWithHwpParser(buffer, filePath) {
    try {
      // hwp-parser 라이브러리 동적 로드 시도
      const hwpParser = await import('hwp-parser').catch(() => null);
      
      if (!hwpParser) {
        throw new Error('hwp-parser 라이브러리가 설치되지 않았습니다');
      }
      
      const parser = new hwpParser.Parser();
      const result = await parser.parse(buffer);
      
      // 텍스트 내용 추출 및 정리
      let content = '';
      if (result.text) {
        content = result.text;
      } else if (result.sections && Array.isArray(result.sections)) {
        // 섹션별로 텍스트 추출
        content = result.sections.map(section => 
          section.text || section.content || ''
        ).join('\n\n');
      }
      
      return {
        content: content.trim(),
        confidence: content.length > 0 ? 0.8 : 0.4,
        warnings: result.warnings || []
      };
    } catch (error) {
      throw new Error(`hwp-parser 실패: ${error.message}`);
    }
  }

  /**
   * 🔍 바이너리 분석으로 텍스트 추출
   */
  extractWithBinaryAnalysis(buffer) {
    try {
      let extractedText = '';
      const extractedSections = new Set(); // 중복 제거용
      
      // 한글 파일의 텍스트 블록 패턴 찾기
      const textPatterns = [
        /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g, // 한글 유니코드
        /[가-힣]+/g, // 한글 완성형
        /[ㄱ-ㅎㅏ-ㅣ]+/g, // 한글 자모
        /[a-zA-Z0-9\s]+/g, // 영문 및 숫자
        /[\u0020-\u007E]+/g // ASCII 인쇄 가능 문자
      ];
      
      // 바이너리에서 텍스트 블록 찾기
      const textBlocks = this.findTextBlocks(buffer);
      
      // 텍스트 블록이 없으면 전체 버퍼에서 직접 검색
      if (textBlocks.length === 0) {
        // UTF-8, UTF-16LE, UTF-16BE로 디코딩 시도
        const encodings = ['utf8', 'utf16le'];
        
        for (const encoding of encodings) {
          try {
            const text = buffer.toString(encoding);
            
            // 각 패턴에 대해 매칭 시도
            for (const pattern of textPatterns) {
              const matches = text.match(pattern);
              if (matches) {
                matches.forEach(match => {
                  // 의미 있는 텍스트만 추출 (3글자 이상)
                  if (match.trim().length >= 3) {
                    extractedSections.add(match.trim());
                  }
                });
              }
            }
          } catch (e) {
            // 인코딩 실패 시 무시
          }
        }
      } else {
        // 텍스트 블록에서 추출 (개선된 방법)
        for (const block of textBlocks) {
          try {
            const blockData = buffer.slice(block.offset, block.offset + block.length);
            
            // 블록 타입에 따른 처리
            let text = '';
            if (block.type === 'PARA' || block.type === 'TEXT' || block.type === 'CHAR') {
              // HWP 레코드에서 텍스트 추출
              text = this.extractTextFromHwpRecord(blockData);
            } else {
              // 일반적인 디코딩
              text = this.decodeTextWithMultipleEncodings(blockData);
            }
            
            if (text.trim().length >= 3) {
              extractedSections.add(text.trim());
            }
          } catch (e) {
            logger.warn(`블록 처리 실패: ${e.message}`);
          }
        }
      }
      
      // Set을 배열로 변환하고 정렬
      extractedText = Array.from(extractedSections).join('\n');
      
      return {
        content: extractedText.trim(),
        confidence: extractedText.length > 100 ? 0.7 : (extractedText.length > 0 ? 0.5 : 0.3),
        warnings: extractedText.length === 0 ? ['텍스트 블록을 찾을 수 없습니다.'] : []
      };
      
    } catch (error) {
      throw new Error(`바이너리 분석 실패: ${error.message}`);
    }
  }

  /**
   * 📄 폴백 텍스트 추출
   */
  extractFallback(buffer, filePath) {
    // 기본적인 파일 정보만 반환
    const fileName = path.basename(filePath, '.hwp');
    const fileSize = buffer.length;
    
    return {
      content: `한글 문서: ${fileName}\n\n파일 크기: ${this.formatSize(fileSize)}\n\n이 한글 문서의 텍스트 내용을 추출할 수 없습니다.\n한글 뷰어나 변환 도구를 사용하여 텍스트로 변환 후 분석하세요.`,
      confidence: 0.1,
      warnings: ['텍스트 추출이 불가능합니다. 외부 도구 사용을 권장합니다.']
    };
  }

  /**
   * 🗜️ 안전한 압축 해제
   */
  async decompressHwpDataSafely(buffer) {
    return this.decompressHwpData(buffer);
  }
  
  /**
   * 🗜️ 압축된 HWP 파일 해제 (개선된 버전)
   */
  async decompressHwpData(buffer) {
    try {
      // HWP 파일이 압축되어 있는지 확인
      const headerInfo = this.analyzeHeader(buffer);
      
      // OLE 복합 파일인 경우 스트림별 압축 해제는 extractWithOleParser에서 처리
      if (this.isOleCompoundFile(buffer)) {
        logger.info('📦 OLE 복합 파일 감지 - 스트림별 압축 해제 예정');
        return buffer; // OLE 파일은 원본 그대로 반환
      }
      
      if (!headerInfo.compression) {
        return buffer; // 압축되지 않은 경우 원본 반환
      }
      
      logger.info('🗜️ 압축된 HWP 파일 감지, 압축 해제 시도 중...');
      
      // HWP 3.0 이하 버전의 경우 전체 파일 압축
      const headerSize = 256; // HWP 헤더 크기
      const compressedData = buffer.slice(headerSize);
      
      // 여러 압축 방식 시도
      const decompressMethods = [
        { name: 'zlib-inflate', method: () => inflate(compressedData) },
        { name: 'gzip', method: () => gunzip(compressedData) },
        { name: 'raw-inflate', method: () => zlib.inflateRaw(compressedData) }
      ];
      
      for (const { name, method } of decompressMethods) {
        try {
          const decompressed = await method();
          logger.info(`✅ ${name} 압축 해제 성공`);
          return Buffer.concat([buffer.slice(0, headerSize), decompressed]);
        } catch (e) {
          logger.warn(`${name} 압축 해제 실패: ${e.message}`);
        }
      }
      
      logger.warn('모든 압축 해제 방법 실패, 원본 데이터 사용');
      return buffer;
      
    } catch (error) {
      logger.error(`압축 해제 중 오류: ${error.message}`);
      return buffer;
    }
  }

  /**
   * 🗂️ OLE 복합 파일 여부 확인
   */
  isOleCompoundFile(buffer) {
    // OLE 파일 시그니처: 0xD0CF11E0A1B11AE1
    const oleSignature = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
    return buffer.slice(0, 8).equals(oleSignature);
  }

  /**
   * 📦 OLE 복합 파일 압축 해제
   */
  async decompressOleCompound(buffer) {
    try {
      logger.info('📦 OLE 복합 파일 구조 감지');
      
      // OLE 파일 구조 파싱 (간단한 구현)
      // 실제로는 cfb 라이브러리 사용을 권장
      const sectorSize = 512; // 기본 섹터 크기
      const headerSize = 512;
      
      // BodyText 스트림 찾기 (HWP 문서의 본문이 저장된 스트림)
      const bodyTextPattern = Buffer.from('BodyText');
      const bodyTextIndex = buffer.indexOf(bodyTextPattern);
      
      if (bodyTextIndex === -1) {
        logger.warn('BodyText 스트림을 찾을 수 없습니다');
        return buffer;
      }
      
      // BodyText 데이터 추출 및 압축 해제
      // 실제 구현은 더 복잡하지만, 기본적인 접근 방식
      const bodyStart = Math.floor(bodyTextIndex / sectorSize) * sectorSize;
      const bodyData = buffer.slice(bodyStart);
      
      try {
        const decompressed = await inflate(bodyData);
        logger.info('✅ OLE BodyText 압축 해제 성공');
        return decompressed;
      } catch (e) {
        logger.warn('OLE BodyText 압축 해제 실패');
        return buffer;
      }
    } catch (error) {
      logger.error(`OLE 복합 파일 처리 오류: ${error.message}`);
      return buffer;
    }
  }

  /**
   * 🏗️ 문서 구조 분석
   */
  analyzeStructure(buffer, content) {
    try {
      const structure = {
        pages: 0,
        sections: 0,
        paragraphs: 0,
        lines: 0,
        characters: content.length,
        words: 0,
        hasHeaders: false,
        hasFooters: false,
        hasPageNumbers: false,
        hasTableOfContents: false,
        hasIndex: false,
        layout: {
          orientation: 'portrait',
          pageSize: 'A4',
          margins: {}
        }
      };
      
      // 페이지 정보 추출
      const pageInfo = this.extractPageInfo(buffer);
      structure.pages = pageInfo.pageCount || 0;
      structure.layout = pageInfo.layout || structure.layout;
      
      // 섹션 정보 추출
      const sectionInfo = this.extractSectionInfo(buffer);
      structure.sections = sectionInfo.sectionCount || 0;
      
      // 텍스트 구조 분석
      if (content) {
        const lines = content.split('\n');
        structure.lines = lines.length;
        structure.paragraphs = lines.filter(line => line.trim().length > 0).length;
        structure.words = content.split(/\s+/).filter(word => word.length > 0).length;
        
        // 헤더/푸터 패턴 확인
        structure.hasHeaders = /^[0-9]+\.\s|^제\s*\d+장|^Chapter\s*\d+/i.test(content);
        structure.hasFooters = /페이지|page|footer/i.test(content);
        structure.hasPageNumbers = /[0-9]+/g.test(content);
        structure.hasTableOfContents = /목차|차례|table of contents|contents/i.test(content);
        structure.hasIndex = /색인|인덱스|index/i.test(content);
      }
      
      return structure;
      
    } catch (error) {
      logger.warn(`구조 분석 실패: ${error.message}`);
      return {
        pages: 0,
        sections: 0,
        paragraphs: 0,
        lines: 0,
        characters: content.length,
        words: 0,
        hasHeaders: false,
        hasFooters: false,
        hasPageNumbers: false,
        hasTableOfContents: false,
        hasIndex: false,
        layout: {
          orientation: 'portrait',
          pageSize: 'A4',
          margins: {}
        }
      };
    }
  }

  /**
   * 📊 메타데이터 추출
   */
  extractMetadata(buffer, headerInfo) {
    try {
      const metadata = {
        title: '',
        author: '',
        subject: '',
        keywords: [],
        creator: '',
        producer: '',
        created: null,
        modified: null,
        lastSavedBy: '',
        revision: 0,
        category: '',
        comments: '',
        template: '',
        language: 'ko',
        documentProperties: {}
      };
      
      // 문서 속성 블록에서 메타데이터 추출
      const docProps = this.findDocumentProperties(buffer);
      
      if (docProps) {
        metadata.title = docProps.title || '';
        metadata.author = docProps.author || '';
        metadata.subject = docProps.subject || '';
        metadata.keywords = docProps.keywords || [];
        metadata.creator = docProps.creator || '한글과컴퓨터';
        metadata.producer = docProps.producer || '한글과컴퓨터';
        metadata.created = docProps.created || null;
        metadata.modified = docProps.modified || null;
        metadata.lastSavedBy = docProps.lastSavedBy || '';
        metadata.revision = docProps.revision || 0;
        metadata.category = docProps.category || '';
        metadata.comments = docProps.comments || '';
        metadata.template = docProps.template || '';
        metadata.language = docProps.language || 'ko';
        metadata.documentProperties = docProps.properties || {};
      }
      
      return metadata;
      
    } catch (error) {
      logger.warn(`메타데이터 추출 실패: ${error.message}`);
      return {
        title: '',
        author: '',
        subject: '',
        keywords: [],
        creator: '한글과컴퓨터',
        producer: '한글과컴퓨터',
        created: null,
        modified: null,
        lastSavedBy: '',
        revision: 0,
        category: '',
        comments: '',
        template: '',
        language: 'ko',
        documentProperties: {}
      };
    }
  }

  /**
   * 🖼️ 객체 분석 (이미지, 표, 차트 등)
   */
  analyzeObjects(buffer) {
    try {
      const objects = {
        images: [],
        tables: [],
        charts: [],
        shapes: [],
        equations: [],
        controls: [],
        totalObjects: 0
      };
      
      // 이미지 객체 찾기
      const imageBlocks = this.findImageBlocks(buffer);
      objects.images = imageBlocks.map(block => ({
        type: block.format || 'unknown',
        size: block.size || 0,
        offset: block.offset || 0,
        width: block.width || 0,
        height: block.height || 0
      }));
      
      // 표 객체 찾기
      const tableBlocks = this.findTableBlocks(buffer);
      objects.tables = tableBlocks.map(block => ({
        rows: block.rows || 0,
        columns: block.columns || 0,
        offset: block.offset || 0,
        size: block.size || 0
      }));
      
      // 차트 객체 찾기
      const chartBlocks = this.findChartBlocks(buffer);
      objects.charts = chartBlocks.map(block => ({
        type: block.chartType || 'unknown',
        offset: block.offset || 0,
        size: block.size || 0
      }));
      
      // 총 객체 수 계산
      objects.totalObjects = objects.images.length + objects.tables.length + 
                           objects.charts.length + objects.shapes.length + 
                           objects.equations.length + objects.controls.length;
      
      return objects;
      
    } catch (error) {
      logger.warn(`객체 분석 실패: ${error.message}`);
      return {
        images: [],
        tables: [],
        charts: [],
        shapes: [],
        equations: [],
        controls: [],
        totalObjects: 0
      };
    }
  }

  // ===== 헬퍼 메서드들 =====

  /**
   * 🔍 텍스트 블록 찾기 (개선된 버전)
   */
  findTextBlocks(buffer) {
    const blocks = [];
    
    try {
      // HWP 레코드 타입 시그니처 (Little Endian 4바이트)
      const recordSignatures = [
        { type: 0x50415241, name: 'PARA', desc: '단락' },           // 'PARA'
        { type: 0x54455854, name: 'TEXT', desc: '텍스트' },         // 'TEXT' 
        { type: 0x43484152, name: 'CHAR', desc: '문자' },           // 'CHAR'
        { type: 0x4C494E45, name: 'LINE', desc: '줄' },             // 'LINE'
        { type: 0x57524954, name: 'WRIT', desc: '쓰기' }            // 'WRIT'
      ];
      
      // 레코드 헤더 구조: [RecordType(4)] [RecordSize(4)] [RecordData(...)]
      for (let i = 0; i < buffer.length - 8; i++) {
        try {
          const recordType = buffer.readUInt32LE(i);
          const recordSize = buffer.readUInt32LE(i + 4);
          
          // 레코드 타입이 텍스트 관련인지 확인
          const signature = recordSignatures.find(sig => sig.type === recordType);
          if (signature) {
            // 레코드 크기가 유효한지 확인
            if (recordSize > 0 && recordSize < 1024 * 1024 && // 최대 1MB
                i + 8 + recordSize <= buffer.length) {
              blocks.push({
                offset: i + 8, // 데이터 시작 위치
                length: recordSize,
                type: signature.name,
                description: signature.desc,
                recordType: recordType
              });
              
              // 다음 레코드로 점프
              i += 8 + recordSize - 1; // -1은 for문의 i++때문
            }
          }
        } catch (e) {
          // 레코드 읽기 실패 시 다음 바이트로
          continue;
        }
      }
      
      // 레코드 기반으로 찾지 못한 경우 패턴 매칭
      if (blocks.length === 0) {
        logger.info('레코드 기반 검색 실패, 패턴 매칭 시도');
        blocks.push(...this.findTextBlocksByPattern(buffer));
      }
      
      logger.info(`📦 텍스트 블록 ${blocks.length}개 발견 (레코드 기반)`);
    } catch (error) {
      logger.warn(`텍스트 블록 찾기 실패: ${error.message}`);
    }
    
    return blocks;
  }

  /**
   * 🔍 패턴 기반 텍스트 블록 찾기 (fallback)
   */
  findTextBlocksByPattern(buffer) {
    const blocks = [];
    
    // 한글 텍스트가 있을 법한 위치를 휴리스틱으로 찾기
    const chunkSize = 1024; // 1KB씩 검사
    
    for (let i = 0; i < buffer.length - chunkSize; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      
      // UTF-16LE로 디코딩해서 한글이 있는지 확인
      try {
        const text = chunk.toString('utf16le');
        const koreanCount = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
        
        // 한글이 충분히 많으면 텍스트 블록으로 간주
        if (koreanCount > 10) {
          blocks.push({
            offset: i,
            length: chunkSize,
            type: 'PATTERN',
            description: '패턴 매칭'
          });
        }
      } catch (e) {
        // 디코딩 실패 시 무시
      }
    }
    
    return blocks;
  }

  /**
   * 📄 페이지 정보 추출
   */
  extractPageInfo(buffer) {
    try {
      return {
        pageCount: 0,
        layout: {
          orientation: 'portrait',
          pageSize: 'A4',
          margins: {}
        }
      };
    } catch (error) {
      return { pageCount: 0, layout: { orientation: 'portrait', pageSize: 'A4', margins: {} } };
    }
  }

  /**
   * 📑 섹션 정보 추출
   */
  extractSectionInfo(buffer) {
    try {
      return {
        sectionCount: 0
      };
    } catch (error) {
      return { sectionCount: 0 };
    }
  }

  /**
   * 📋 문서 속성 찾기 (OLE 복합 파일 지원)
   */
  async findDocumentProperties(buffer) {
    try {
      const props = {
        title: '',
        author: '',
        subject: '',
        keywords: [],
        creator: '한글과컴퓨터',
        producer: '한글과컴퓨터',
        created: null,
        modified: null,
        lastSavedBy: '',
        revision: 0,
        category: '',
        comments: '',
        template: '',
        language: 'ko',
        properties: {}
      };
      
      // OLE 복합 파일인 경우
      if (this.isOleCompoundFile(buffer)) {
        try {
          const cfb = await import('cfb').catch(() => null);
          if (cfb) {
            const workbook = cfb.read(buffer);
            
            // Summary Information 스트림에서 메타데이터 추출
            const summaryInfo = cfb.find(workbook, '\x05SummaryInformation');
            if (summaryInfo) {
              const summaryProps = this.parseSummaryInformation(summaryInfo.content);
              Object.assign(props, summaryProps);
            }
            
            // DocSummaryInformation 스트림도 확인
            const docSummaryInfo = cfb.find(workbook, '\x05DocumentSummaryInformation');
            if (docSummaryInfo) {
              const docSummaryProps = this.parseDocumentSummaryInformation(docSummaryInfo.content);
              Object.assign(props, docSummaryProps);
            }
            
            return props;
          }
        } catch (e) {
          logger.warn(`OLE 메타데이터 추출 실패: ${e.message}`);
        }
      }
      
      // 기본 패턴 매칭 방식 (fallback)
      const propSignatures = [
        { sig: Buffer.from('HWPML'), name: 'HWPML' },
        { sig: Buffer.from('DocInfo'), name: 'DocInfo' },
        { sig: Buffer.from('\x05SummaryInformation'), name: 'Summary' }
      ];
      
      for (const { sig, name } of propSignatures) {
        const index = buffer.indexOf(sig);
        if (index !== -1) {
          try {
            const propBuffer = buffer.slice(index, Math.min(index + 2048, buffer.length));
            
            // UTF-16LE과 UTF-8 둘 다 시도
            const texts = [
              propBuffer.toString('utf16le'),
              propBuffer.toString('utf8')
            ];
            
            for (const text of texts) {
              // 정규식을 더 관대하게 변경
              const titleMatch = text.match(/(?:title|제목)[\s\x00-\x20:=]*([^\x00\n\r]{1,100})/i);
              if (titleMatch && !props.title) props.title = titleMatch[1].trim();
              
              const authorMatch = text.match(/(?:author|작성자|저자)[\s\x00-\x20:=]*([^\x00\n\r]{1,50})/i);
              if (authorMatch && !props.author) props.author = authorMatch[1].trim();
              
              const subjectMatch = text.match(/(?:subject|주제)[\s\x00-\x20:=]*([^\x00\n\r]{1,100})/i);
              if (subjectMatch && !props.subject) props.subject = subjectMatch[1].trim();
              
              const keywordsMatch = text.match(/(?:keywords|키워드)[\s\x00-\x20:=]*([^\x00\n\r]{1,200})/i);
              if (keywordsMatch && props.keywords.length === 0) {
                props.keywords = keywordsMatch[1].split(/[,;\s]+/).map(k => k.trim()).filter(k => k.length > 0);
              }
            }
          } catch (e) {
            // 속성 추출 실패 시 무시
          }
        }
      }
      
      return props;
    } catch (error) {
      logger.warn(`문서 속성 찾기 실패: ${error.message}`);
      return null;
    }
  }

  /**
   * 📋 문서 정보 찾기
   */
  findDocumentInfo(buffer) {
    try {
      return {
        title: '',
        author: '',
        subject: '',
        created: null,
        modified: null
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * 🖼️ 이미지 블록 찾기
   */
  findImageBlocks(buffer) {
    const blocks = [];
    
    try {
      // 이미지 블록 시그니처 패턴
      const imageSignatures = [
        Buffer.from([0x48, 0x49, 0x4D, 0x47]), // HIMG
        Buffer.from([0x48, 0x49, 0x4D, 0x47])  // HIMG
      ];
      
      for (let i = 0; i < buffer.length - 4; i++) {
        for (const signature of imageSignatures) {
          if (buffer.slice(i, i + 4).equals(signature)) {
            blocks.push({
              offset: i,
              format: 'unknown',
              size: 0,
              width: 0,
              height: 0
            });
            break;
          }
        }
      }
    } catch (error) {
      logger.warn(`이미지 블록 찾기 실패: ${error.message}`);
    }
    
    return blocks;
  }

  /**
   * 📊 표 블록 찾기
   */
  findTableBlocks(buffer) {
    const blocks = [];
    
    try {
      // 표 블록 시그니처 패턴
      const tableSignatures = [
        Buffer.from([0x48, 0x54, 0x41, 0x42])  // HTAB
      ];
      
      for (let i = 0; i < buffer.length - 4; i++) {
        for (const signature of tableSignatures) {
          if (buffer.slice(i, i + 4).equals(signature)) {
            blocks.push({
              offset: i,
              rows: 0,
              columns: 0,
              size: 0
            });
            break;
          }
        }
      }
    } catch (error) {
      logger.warn(`표 블록 찾기 실패: ${error.message}`);
    }
    
    return blocks;
  }

  /**
   * 📈 차트 블록 찾기
   */
  findChartBlocks(buffer) {
    const blocks = [];
    
    try {
      // 차트 블록 시그니처 패턴
      const chartSignatures = [
        Buffer.from([0x48, 0x43, 0x48, 0x54])  // HCHT
      ];
      
      for (let i = 0; i < buffer.length - 4; i++) {
        for (const signature of chartSignatures) {
          if (buffer.slice(i, i + 4).equals(signature)) {
            blocks.push({
              offset: i,
              chartType: 'unknown',
              size: 0
            });
            break;
          }
        }
      }
    } catch (error) {
      logger.warn(`차트 블록 찾기 실패: ${error.message}`);
    }
    
    return blocks;
  }

  /**
   * 🔢 버전 매핑
   */
  mapVersion(version) {
    const versionMap = {
      0x0101: 'HWP 2.1',
      0x0102: 'HWP 3.0',
      0x0103: 'HWP 5.0',
      0x0104: 'HWP 2002',
      0x0105: 'HWP 2004',
      0x0106: 'HWP 2005',
      0x0107: 'HWP 2007',
      0x0108: 'HWP 2010',
      0x0109: 'HWP 2014',
      0x010A: 'HWP 2018',
      0x010B: 'HWP 2022'
    };
    
    return versionMap[version] || `HWP ${version}`;
  }

  /**
   * 🧠 메모리 제한 하에서 분석 수행
   */
  async performAnalysisWithMemoryLimit(buffer, stats, filePath, operationId) {
    const memoryCheckInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed > this.maxMemoryUsage) {
        clearInterval(memoryCheckInterval);
        throw new MemoryError('힙 메모리 사용량 한계 초과', {
          filePath,
          operation: 'performAnalysisWithMemoryLimit',
          memoryUsage: memUsage
        });
      }
    }, 1000); // 1초마다 체크
    
    try {
      // 기본 정보 추출
      const basicInfo = this.extractBasicInfo(buffer, stats, filePath);
      
      // 헤더 정보 분석
      const headerInfo = this.analyzeHeader(buffer);
      
      // 텍스트 추출 (여러 방법 시도)
      const textResult = await this.extractTextSafely(buffer, filePath, operationId);
      
      // 구조 분석
      const structure = this.analyzeStructure(buffer, textResult.content);
      
      // 메타데이터 추출
      const metadata = await this.extractMetadataSafely(buffer, headerInfo);
      
      // 이미지 및 객체 분석
      const objects = this.analyzeObjects(buffer);
      
      return {
        success: true,
        path: filePath,
        basicInfo,
        headerInfo,
        content: textResult.content,
        structure,
        metadata,
        objects,
        analysis: {
          textExtractionMethod: textResult.method,
          confidence: textResult.confidence,
          warnings: textResult.warnings || [],
          wasCompressed: textResult.wasCompressed || false
        }
      };
    } finally {
      clearInterval(memoryCheckInterval);
    }
  }
  
  /**
   * 🔤 안전한 텍스트 추출
   */
  async extractTextSafely(buffer, filePath, operationId) {
    // 먼저 압축 해제 시도
    const decompressedBuffer = await this.decompressHwpDataSafely(buffer);
    const isCompressed = decompressedBuffer !== buffer;
    
    if (isCompressed) {
      logger.info(`🗜️ 압축된 HWP 파일 해제 완료 (${operationId})`);
    }
    
    const methods = [
      { name: 'hwp.js', method: this.extractWithHwpJs },
      { name: 'ole-parser', method: this.extractWithOleParser },
      { name: 'hwp-parser', method: this.extractWithHwpParser },
      { name: 'binary-analysis', method: this.extractWithBinaryAnalysis },
      { name: 'fallback', method: this.extractFallback }
    ];
    
    for (const method of methods) {
      try {
        logger.info(`🔍 [한글 텍스트 추출] ${method.name} 시도 중... (${operationId})`);
        const result = await Promise.race([
          method.method.call(this, decompressedBuffer, filePath),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('텍스트 추출 타임아웃')), 10000)
          )
        ]);
        
        if (result && result.content && result.content.trim().length > 0) {
          logger.info(`✅ [한글 텍스트 추출] ${method.name} 성공: ${result.content.length} characters (${operationId})`);
          return {
            content: result.content,
            method: method.name,
            confidence: result.confidence || 0.8,
            warnings: result.warnings || [],
            wasCompressed: isCompressed
          };
        }
      } catch (error) {
        logger.warn(`⚠️ [한글 텍스트 추출] ${method.name} 실패: ${error.message} (${operationId})`);
      }
    }
    
    // 모든 방법 실패 시 기본 정보만 반환
    return {
      content: `한글 문서: ${path.basename(filePath)}\n\n텍스트 추출에 실패했습니다.`,
      method: 'none',
      confidence: 0.0,
      warnings: ['모든 텍스트 추출 방법이 실패했습니다.'],
      wasCompressed: isCompressed
    };
  }
  
  /**
   * 📊 안전한 메타데이터 추출
   */
  async extractMetadataSafely(buffer, headerInfo) {
    try {
      return await Promise.race([
        this.extractMetadata(buffer, headerInfo),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('메타데이터 추출 타임아웃')), 5000)
        )
      ]);
    } catch (error) {
      logger.warn(`메타데이터 추출 실패: ${error.message}`);
      return this.getDefaultMetadata();
    }
  }
  
  /**
   * 📋 기본 메타데이터 반환
   */
  getDefaultMetadata() {
    return {
      title: '',
      author: '',
      subject: '',
      keywords: [],
      creator: '한글과컴퓨터',
      producer: '한글과컴퓨터',
      created: null,
      modified: null,
      lastSavedBy: '',
      revision: 0,
      category: '',
      comments: '',
      template: '',
      language: 'ko',
      documentProperties: {}
    };
  }
  
  /**
   * 📊 메트릭 업데이트
   */
  updateMetrics(duration, success) {
    this.metrics.totalAnalyzed++;
    if (!success) {
      this.metrics.totalErrors++;
    }
    
    // 평균 시간 계산
    const totalTime = this.metrics.averageTime * (this.metrics.totalAnalyzed - 1) + duration;
    this.metrics.averageTime = totalTime / this.metrics.totalAnalyzed;
  }
  
  /**
   * 🧠 메모리 모니터링 시작
   */
  startMemoryMonitoring(operationId) {
    const startMemory = process.memoryUsage();
    this.metrics.memoryPeaks.push({
      operationId,
      startMemory,
      peakMemory: startMemory,
      startTime: Date.now()
    });
  }
  
  /**
   * 🧠 메모리 모니터링 정지
   */
  stopMemoryMonitoring(operationId) {
    const memoryEntry = this.metrics.memoryPeaks.find(m => m.operationId === operationId);
    if (memoryEntry) {
      memoryEntry.endMemory = process.memoryUsage();
      memoryEntry.endTime = Date.now();
    }
  }
  
  /**
   * 🧠 메모리 피크 조회
   */
  getMemoryPeak(operationId) {
    const memoryEntry = this.metrics.memoryPeaks.find(m => m.operationId === operationId);
    return memoryEntry ? memoryEntry.peakMemory : null;
  }
  
  /**
   * ⚠️ 에러 분류
   */
  classifyError(error, filePath, operation) {
    if (error instanceof SecurityError || error instanceof MemoryError || error instanceof HwpAnalysisError) {
      return error;
    }
    
    // 일반 에러를 HwpAnalysisError로 변환
    return new HwpAnalysisError(error.message, {
      cause: error,
      filePath,
      operation
    });
  }
  
  /**
   * 📏 파일 크기 포맷팅
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ===== 새로 추가된 헬퍼 메서드들 =====

  /**
   * 🔍 압축 데이터 여부 확인
   */
  isCompressedData(buffer) {
    if (buffer.length < 4) return false;
    
    // 일반적인 압축 시그니처들
    const signatures = [
      [0x1f, 0x8b], // gzip
      [0x78, 0x9c], // zlib default
      [0x78, 0x01], // zlib best speed
      [0x78, 0xda], // zlib best compression
      [0x50, 0x4b]  // zip
    ];
    
    for (const sig of signatures) {
      if (buffer.slice(0, sig.length).equals(Buffer.from(sig))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 📄 HWP 레코드에서 텍스트 추출
   */
  extractTextFromHwpRecord(recordData) {
    try {
      // HWP 레코드는 보통 UTF-16LE로 인코딩됨
      let text = recordData.toString('utf16le').replace(/\0/g, '');
      
      // 제어 문자 제거
      text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      
      // 의미있는 텍스트만 필터링
      if (text.trim().length < 2) return '';
      
      return text.trim();
    } catch (e) {
      // UTF-16LE 실패 시 UTF-8 시도
      try {
        return recordData.toString('utf8').replace(/\0/g, '').trim();
      } catch (e2) {
        return '';
      }
    }
  }

  /**
   * 🔤 다중 인코딩으로 텍스트 디코딩
   */
  decodeTextWithMultipleEncodings(buffer) {
    const encodings = ['utf16le', 'utf8', 'latin1'];
    
    for (const encoding of encodings) {
      try {
        const text = buffer.toString(encoding).replace(/\0/g, '');
        
        // 한글이 있거나 의미있는 텍스트인지 확인
        if (this.isValidText(text)) {
          return text.trim();
        }
      } catch (e) {
        continue;
      }
    }
    
    return '';
  }

  /**
   * ✅ 유효한 텍스트인지 확인
   */
  isValidText(text) {
    if (!text || text.trim().length < 2) return false;
    
    // 한글 문자가 있는지 확인
    const hasKorean = /[\uAC00-\uD7AF]/.test(text);
    
    // 영문자가 있는지 확인
    const hasEnglish = /[a-zA-Z]/.test(text);
    
    // 숫자가 있는지 확인
    const hasNumbers = /[0-9]/.test(text);
    
    // 제어 문자가 너무 많은지 확인 (전체의 50% 이상이면 무효)
    const controlChars = (text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || []).length;
    const controlRatio = controlChars / text.length;
    
    return (hasKorean || hasEnglish || hasNumbers) && controlRatio < 0.5;
  }

  /**
   * 📄 섹션에서 텍스트 추출 (hwp.js용)
   */
  extractTextFromSection(section) {
    let text = '';
    
    try {
      if (typeof section === 'string') {
        return section;
      }
      
      if (section.text) {
        text += section.text;
      }
      
      if (section.content) {
        text += section.content;
      }
      
      if (section.paragraphs && Array.isArray(section.paragraphs)) {
        text += section.paragraphs.map(p => 
          typeof p === 'string' ? p : (p.text || p.content || '')
        ).join('\n');
      }
      
      if (section.children && Array.isArray(section.children)) {
        text += section.children.map(child => 
          this.extractTextFromSection(child)
        ).join('\n');
      }
      
      return text.trim();
    } catch (e) {
      logger.warn(`섹션 텍스트 추출 실패: ${e.message}`);
      return '';
    }
  }

  /**
   * 🗂️ HWP 레코드 파싱
   */
  parseHwpRecords(buffer) {
    const texts = [];
    let offset = 0;
    
    while (offset < buffer.length - 8) {
      try {
        // 레코드 헤더 읽기
        const recordType = buffer.readUInt32LE(offset);
        const recordSize = buffer.readUInt32LE(offset + 4);
        
        // 레코드 크기 검증
        if (recordSize <= 0 || recordSize > 1024 * 1024 || offset + 8 + recordSize > buffer.length) {
          offset += 4;
          continue;
        }
        
        // 텍스트 레코드인지 확인
        if (this.isTextRecordType(recordType)) {
          const recordData = buffer.slice(offset + 8, offset + 8 + recordSize);
          const text = this.extractTextFromHwpRecord(recordData);
          
          if (text.trim().length > 0) {
            texts.push(text);
          }
        }
        
        offset += 8 + recordSize;
      } catch (e) {
        offset += 4; // 다음 위치로 이동
      }
    }
    
    return texts.join('\n');
  }

  /**
   * 🔍 텍스트 레코드 타입인지 확인
   */
  isTextRecordType(recordType) {
    const textRecordTypes = [
      0x50415241, // PARA
      0x54455854, // TEXT
      0x43484152, // CHAR
      0x4C494E45, // LINE
      0x57524954  // WRIT
    ];
    
    return textRecordTypes.includes(recordType);
  }
  
  // ===== 새로 추가된 안전한 라이브러리 로딩 메서드들 =====
  
  /**
   * 🔒 안전한 라이브러리 로딩
   */
  async loadLibrarySafely(libraryName) {
    // 캐시 확인
    if (this.dependencyCache.has(libraryName)) {
      return this.dependencyCache.get(libraryName);
    }
    
    try {
      const library = await import(libraryName);
      this.dependencyCache.set(libraryName, library);
      return library;
    } catch (error) {
      this.dependencyCache.set(libraryName, null);
      logger.warn(`라이브러리 로드 실패: ${libraryName} - ${error.message}`);
      return null;
    }
  }
  
  /**
   * 🛡️ 안전한 라이브러리 실행
   */
  async safeLibraryExecution(libraryName, executionFn) {
    const library = await this.loadLibrarySafely(libraryName);
    
    if (!library) {
      throw new HwpAnalysisError(`${libraryName} 라이브러리가 설치되지 않았습니다`, {
        operation: 'safeLibraryExecution',
        code: 'LIBRARY_NOT_FOUND'
      });
    }
    
    // 타임아웃과 함께 실행
    return Promise.race([
      executionFn(library),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`${libraryName} 실행 타임아웃`)), 15000)
      )
    ]);
  }
  
  /**
   * 📊 메트릭 조회
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalAnalyzed > 0 ? 
        ((this.metrics.totalAnalyzed - this.metrics.totalErrors) / this.metrics.totalAnalyzed * 100).toFixed(2) + '%' : 
        'N/A',
      currentMemoryUsage: process.memoryUsage(),
      activeConcurrency: this.maxConcurrency - this.semaphore.currentCount
    };
  }
  
  /**
   * 🔧 설정 업데이트
   */
  updateSettings(newSettings) {
    const allowedSettings = ['maxFileSize', 'maxMemoryUsage', 'chunkSize', 'maxConcurrency', 'timeout'];
    
    for (const [key, value] of Object.entries(newSettings)) {
      if (allowedSettings.includes(key) && typeof value === 'number' && value > 0) {
        this[key] = value;
        logger.info(`설정 업데이트: ${key} = ${value}`);
      } else {
        logger.warn(`유효하지 않은 설정: ${key} = ${value}`);
      }
    }
    
    // 세마포어 동시성 업데이트
    if (newSettings.maxConcurrency) {
      this.semaphore = new Semaphore(this.maxConcurrency);
    }
  }

  /**
   * 📊 Summary Information 파싱
   */
  parseSummaryInformation(buffer) {
    const props = {};
    
    try {
      // OLE Property Set 구조 파싱 (간단한 구현)
      // 실제로는 더 복잡한 구조이지만 기본적인 속성만 추출
      
      const text = buffer.toString('utf16le');
      
      // 기본 패턴 매칭으로 속성 추출
      const patterns = [
        { key: 'title', pattern: /Title[^\x00]*?\x00([^\x00]+)/i },
        { key: 'author', pattern: /Author[^\x00]*?\x00([^\x00]+)/i },
        { key: 'subject', pattern: /Subject[^\x00]*?\x00([^\x00]+)/i },
        { key: 'keywords', pattern: /Keywords[^\x00]*?\x00([^\x00]+)/i }
      ];
      
      for (const { key, pattern } of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          if (key === 'keywords') {
            props[key] = match[1].split(/[,;]/).map(k => k.trim()).filter(k => k);
          } else {
            props[key] = match[1].trim();
          }
        }
      }
    } catch (e) {
      logger.warn(`Summary Information 파싱 실패: ${e.message}`);
    }
    
    return props;
  }

  /**
   * 📋 Document Summary Information 파싱
   */
  parseDocumentSummaryInformation(buffer) {
    const props = {};
    
    try {
      const text = buffer.toString('utf16le');
      
      // 추가 문서 속성 추출
      const categoryMatch = text.match(/Category[^\x00]*?\x00([^\x00]+)/i);
      if (categoryMatch) props.category = categoryMatch[1].trim();
      
      const commentsMatch = text.match(/Comments[^\x00]*?\x00([^\x00]+)/i);
      if (commentsMatch) props.comments = commentsMatch[1].trim();
      
    } catch (e) {
      logger.warn(`Document Summary Information 파싱 실패: ${e.message}`);
    }
    
    return props;
  }

  /**
   * 📊 분석 결과 요약
   */
  generateSummary(analysisResult) {
    if (!analysisResult.success) {
      return {
        summary: '한글 문서 분석 실패',
        details: analysisResult.error || '알 수 없는 오류',
        recommendations: [
          'HWP 파일이 손상되지 않았는지 확인하세요',
          '파일이 암호화되어 있는지 확인하세요',
          '한글 프로그램에서 파일을 열 수 있는지 확인하세요'
        ]
      };
    }

    const { basicInfo, headerInfo, content, structure, metadata, objects, analysis } = analysisResult;
    
    const summary = {
      fileInfo: {
        name: basicInfo.fileName,
        size: basicInfo.fileSizeFormatted,
        version: headerInfo.version,
        encrypted: headerInfo.encryption,
        compressed: headerInfo.compression
      },
      content: {
        extractionMethod: analysis.textExtractionMethod,
        confidence: `${Math.round(analysis.confidence * 100)}%`,
        textLength: content.length,
        preview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
      },
      structure: {
        pages: structure.pages || '알 수 없음',
        paragraphs: structure.paragraphs,
        words: structure.words,
        hasTableOfContents: structure.hasTableOfContents,
        hasIndex: structure.hasIndex
      },
      metadata: {
        title: metadata.title || '제목 없음',
        author: metadata.author || '작성자 없음',
        created: metadata.created,
        modified: metadata.modified,
        keywords: metadata.keywords.length > 0 ? metadata.keywords.join(', ') : '없음'
      },
      objects: {
        totalCount: objects.totalObjects,
        images: objects.images.length,
        tables: objects.tables.length,
        charts: objects.charts.length
      },
      performance: {
        duration: `${analysis.duration}ms`,
        warnings: analysis.warnings
      }
    };

    return {
      summary: '한글 문서 분석 완료',
      details: summary,
      recommendations: this.generateRecommendations(analysisResult)
    };
  }

  /**
   * 💡 권장사항 생성
   */
  generateRecommendations(analysisResult) {
    const recommendations = [];
    const { analysis, content, objects, headerInfo } = analysisResult;

    // 텍스트 추출 관련
    if (analysis.confidence < 0.5) {
      recommendations.push('텍스트 추출 신뢰도가 낮습니다. 한글 프로그램에서 직접 확인을 권장합니다.');
    }

    if (analysis.textExtractionMethod === 'fallback') {
      recommendations.push('기본적인 텍스트 추출만 수행되었습니다. hwp-parser 라이브러리 설치를 권장합니다.');
    }

    // 암호화 관련
    if (headerInfo.encryption) {
      recommendations.push('문서가 암호화되어 있습니다. 암호를 해제한 후 분석하세요.');
    }

    // 객체 관련
    if (objects.totalObjects > 50) {
      recommendations.push('많은 객체가 포함되어 있습니다. 전체 분석에 시간이 걸릴 수 있습니다.');
    }

    if (objects.images.length > 0) {
      recommendations.push(`${objects.images.length}개의 이미지가 포함되어 있습니다. 이미지 추출 기능을 사용하세요.`);
    }

    // 성능 관련
    if (analysis.duration > 5000) {
      recommendations.push('분석 시간이 오래 걸렸습니다. 파일 크기가 크거나 복잡한 구조일 수 있습니다.');
    }

    return recommendations.length > 0 ? recommendations : ['문서 분석이 정상적으로 완료되었습니다.'];
  }

  /**
   * 🔍 빠른 미리보기 (간단한 정보만)
   */
  async quickPreview(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath, { start: 0, end: 1024 }); // 처음 1KB만 읽기
      
      const headerInfo = this.analyzeHeader(buffer);
      
      return {
        success: true,
        fileName: path.basename(filePath),
        fileSize: this.formatSize(stats.size),
        version: headerInfo.version,
        encrypted: headerInfo.encryption,
        compressed: headerInfo.compression,
        isValidHwp: headerInfo.signature === 'HWP '
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 📊 체크섬 및 상태 리포트
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      dependencies: {},
      warnings: []
    };
    
    // 의존성 체크
    const dependencies = ['cfb', 'hwp.js', 'pako', 'hwp-parser'];
    for (const dep of dependencies) {
      const lib = await this.loadLibrarySafely(dep);
      health.dependencies[dep] = lib ? 'available' : 'missing';
      
      if (!lib && ['cfb', 'pako'].includes(dep)) {
        health.warnings.push(`권장 의존성 누락: ${dep}`);
      }
    }
    
    // 메모리 체크
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > this.maxMemoryUsage * 0.8) {
      health.warnings.push('높은 메모리 사용량 감지');
    }
    
    // 에러율 체크
    if (this.metrics.totalAnalyzed > 0) {
      const errorRate = this.metrics.totalErrors / this.metrics.totalAnalyzed;
      if (errorRate > 0.5) {
        health.status = 'degraded';
        health.warnings.push('높은 에러율 감지');
      }
    }
    
    return health;
  }
  
  /**
   * 🛠️ 시스템 리셋
   */
  reset() {
    // 메트릭 초기화
    this.metrics = {
      totalAnalyzed: 0,
      totalErrors: 0,
      averageTime: 0,
      memoryPeaks: []
    };
    
    // 캐시 정리
    this.dependencyCache.clear();
    
    // 리소스 정리
    this.cleanup();
    
    logger.info('HwpAnalyzer 시스템 리셋 완료');
  }
  
  /**
   * 🕰️ 비동기 분석 (이벤트 기반)
   */
  async analyzeAsync(filePath) {
    // 이벤트 리스너 등록 및 즉시 분석 시작
    setImmediate(() => {
      this.analyzeComplete(filePath)
        .then(result => {
          this.emit('asyncAnalysisComplete', result);
        })
        .catch(error => {
          this.emit('asyncAnalysisError', {
            filePath,
            error: this.classifyError(error, filePath, 'analyzeAsync')
          });
        });
    });
    
    return {
      status: 'started',
      message: '비동기 분석이 시작되었습니다. 이벤트를 대기하세요.',
      filePath
    };
  }
  
  /**
   * 📄 여러 파일 동시 분석
   */
  async analyzeBatch(filePaths, options = {}) {
    const results = [];
    const errors = [];
    const batchId = `batch_${Date.now()}`;
    
    logger.info(`📦 배치 분석 시작: ${filePaths.length}개 파일 (${batchId})`);
    
    // 진행률 추적
    let completed = 0;
    
    const promises = filePaths.map(async (filePath, index) => {
      try {
        const result = await this.analyzeComplete(filePath);
        completed++;
        
        if (options.onProgress) {
          options.onProgress({
            completed,
            total: filePaths.length,
            current: filePath,
            batchId
          });
        }
        
        return { index, result, filePath };
      } catch (error) {
        completed++;
        const classifiedError = this.classifyError(error, filePath, 'analyzeBatch');
        
        if (options.onProgress) {
          options.onProgress({
            completed,
            total: filePaths.length,
            current: filePath,
            error: classifiedError,
            batchId
          });
        }
        
        return { index, error: classifiedError, filePath };
      }
    });
    
    const allResults = await Promise.all(promises);
    
    // 결과 분류
    for (const item of allResults) {
      if (item.result) {
        results.push(item.result);
      } else if (item.error) {
        errors.push({
          filePath: item.filePath,
          error: item.error
        });
      }
    }
    
    const batchResult = {
      batchId,
      totalFiles: filePaths.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
      completedAt: new Date().toISOString()
    };
    
    logger.info(`✅ 배치 분석 완료: ${results.length}/${filePaths.length} 성공 (${batchId})`);
    
    this.emit('batchComplete', batchResult);
    
    return batchResult;
  }
} 