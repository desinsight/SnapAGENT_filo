import { parentPort, workerData } from 'worker_threads';
import fs from 'fs/promises';
import { Logger } from '../../common/Logger.js';

const logger = Logger.component('ExcelWorker');

/**
 * Excel 파일 청크 처리를 위한 Worker Thread
 * 병렬 처리로 대용량 파일 분석 성능 향상
 */
class ExcelChunkProcessor {
  constructor(chunk, ext, options) {
    this.chunk = chunk;
    this.ext = ext;
    this.options = options;
    this.XLSX = null;
  }

  async process() {
    try {
      logger.info(`Worker ${this.chunk.index}: 청크 처리 시작 (offset: ${this.chunk.offset}, size: ${this.chunk.size})`);
      
      // xlsx 라이브러리 동적 로드
      this.XLSX = await import('xlsx');
      
      // 청크 데이터 읽기
      const buffer = await this.readChunk();
      
      // 청크 파싱 및 분석
      const result = await this.analyzeChunk(buffer);
      
      logger.info(`Worker ${this.chunk.index}: 청크 처리 완료`);
      return result;
      
    } catch (error) {
      logger.error(`Worker ${this.chunk.index} 오류: ${error.message}`);
      throw error;
    }
  }

  async readChunk() {
    const fileHandle = await fs.open(this.chunk.filePath, 'r');
    try {
      const buffer = Buffer.alloc(this.chunk.size);
      await fileHandle.read(buffer, 0, this.chunk.size, this.chunk.offset);
      return buffer;
    } finally {
      await fileHandle.close();
    }
  }

  async analyzeChunk(buffer) {
    const result = {
      success: true,
      chunkIndex: this.chunk.index,
      structure: {
        sheets: 0,
        totalRows: 0,
        totalCells: 0,
        sheetDetails: []
      },
      metadata: {},
      content: ''
    };

    try {
      // 청크가 완전한 Excel 파일인지 확인
      if (this.isCompleteExcelFile(buffer)) {
        // 완전한 파일로 처리
        const workbook = this.XLSX.default.read(buffer, { 
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false
        });
        
        result.structure.sheets = workbook.SheetNames.length;
        
        // 각 시트 분석
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const sheetData = this.XLSX.default.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: true,
            defval: null
          });
          
          const sheetInfo = {
            name: sheetName,
            rows: sheetData.length,
            columns: sheetData.length > 0 ? Math.max(...sheetData.map(row => row.length)) : 0,
            cells: sheetData.reduce((total, row) => total + row.length, 0)
          };
          
          result.structure.sheetDetails.push(sheetInfo);
          result.structure.totalRows += sheetInfo.rows;
          result.structure.totalCells += sheetInfo.cells;
          
          // 샘플 데이터 추출
          if (sheetData.length > 0) {
            const sampleRows = sheetData.slice(0, 5);
            result.content += `[${sheetName}]\n`;
            sampleRows.forEach((row, idx) => {
              result.content += `행 ${idx + 1}: ${row.join(' | ')}\n`;
            });
            result.content += '\n';
          }
        }
      } else {
        // 부분 청크로 처리 - 텍스트 추출만
        result.content = this.extractTextFromPartialChunk(buffer);
      }
      
    } catch (error) {
      logger.warn(`청크 ${this.chunk.index} 분석 중 오류: ${error.message}`);
      result.success = false;
      result.error = error.message;
    }
    
    return result;
  }

  isCompleteExcelFile(buffer) {
    // Excel 파일 시그니처 확인
    if (buffer.length < 8) return false;
    
    // XLSX (ZIP) 시그니처: 50 4B 03 04
    const xlsxSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
    
    // XLS (BIFF) 시그니처: D0 CF 11 E0 A1 B1 1A E1
    const xlsSignature = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
    
    return buffer.slice(0, 4).equals(xlsxSignature) || 
           buffer.slice(0, 8).equals(xlsSignature);
  }

  extractTextFromPartialChunk(buffer) {
    let text = '';
    
    try {
      // UTF-8 텍스트 추출 시도
      const utf8Text = buffer.toString('utf8');
      
      // 한글 패턴
      const koreanMatches = utf8Text.match(/[가-힣]+/g);
      if (koreanMatches) {
        text += koreanMatches.join(' ') + '\n';
      }
      
      // 영숫자 패턴
      const alphaNumMatches = utf8Text.match(/[A-Za-z0-9]{3,}/g);
      if (alphaNumMatches) {
        text += alphaNumMatches.join(' ') + '\n';
      }
      
      // UTF-16LE 시도 (Excel이 종종 사용)
      const utf16Text = buffer.toString('utf16le');
      const utf16KoreanMatches = utf16Text.match(/[가-힣]+/g);
      if (utf16KoreanMatches && utf16KoreanMatches.length > koreanMatches?.length) {
        text = utf16KoreanMatches.join(' ') + '\n';
      }
      
    } catch (error) {
      logger.warn(`텍스트 추출 오류: ${error.message}`);
    }
    
    return text;
  }

  // 메모리 사용량 모니터링
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external
    };
  }
}

// Worker 메인 로직
(async () => {
  try {
    const { chunk, ext, options } = workerData;
    
    const processor = new ExcelChunkProcessor(chunk, ext, options);
    const result = await processor.process();
    
    // 메모리 사용량 포함
    result.memoryUsage = processor.getMemoryUsage();
    
    // 부모 스레드로 결과 전송
    parentPort.postMessage(result);
    
  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message,
      chunkIndex: workerData.chunk.index
    });
  }
})();