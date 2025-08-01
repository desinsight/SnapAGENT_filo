import { PdfAnalyzer } from './PdfAnalyzer.js';
import { ExcelAnalyzer } from './ExcelAnalyzer.js';
import { nanoid } from 'nanoid';

/**
 * 문서 분석기 통합 관리자
 */
export class DocumentAnalyzer {
  /**
   * 파일 확장자에 따라 적절한 분석기를 선택하고 블록으로 변환
   * @param {Object} analysisResult - 분석 결과 객체
   * @returns {Array} 블록 배열
   */
  static convertToBlocks(analysisResult) {
    const filename = analysisResult.file.name;
    
    try {
      // PDF 파일
      if (PdfAnalyzer.isPdfFile(filename)) {
        return PdfAnalyzer.convertToBlocks(analysisResult);
      }
      
      // Excel 파일
      if (ExcelAnalyzer.isExcelFile(filename)) {
        return ExcelAnalyzer.convertToBlocks(analysisResult);
      }
      
      // 지원하지 않는 파일 형식
      return this.createUnsupportedFileBlock(analysisResult);
      
    } catch (error) {
      console.error('문서 분석 결과를 블록으로 변환 중 오류:', error);
      return this.createErrorBlock(analysisResult, error);
    }
  }
  
  /**
   * 지원하지 않는 파일 형식에 대한 기본 블록 생성
   * @param {Object} analysisResult - 분석 결과 객체
   * @returns {Array} 블록 배열
   */
  static createUnsupportedFileBlock(analysisResult) {
    
    return [
      {
        id: nanoid(),
        type: 'heading1',
        content: `📄 ${analysisResult.file.name} 분석 결과`,
        focused: false
      },
      {
        id: nanoid(),
        type: 'text',
        content: `⚠️ 이 파일 형식은 현재 블록 변환을 지원하지 않습니다.`,
        focused: false
      },
      {
        id: nanoid(),
        type: 'text',
        content: `파일명: ${analysisResult.file.name}`,
        focused: false
      },
      {
        id: nanoid(),
        type: 'text',
        content: `분석 시간: ${analysisResult.timestamp.toLocaleString()}`,
        focused: false
      }
    ];
  }
  
  /**
   * 오류 발생 시 기본 블록 생성
   * @param {Object} analysisResult - 분석 결과 객체
   * @param {Error} error - 오류 객체
   * @returns {Array} 블록 배열
   */
  static createErrorBlock(analysisResult, error) {
    
    return [
      {
        id: nanoid(),
        type: 'heading1',
        content: `❌ ${analysisResult.file.name} 분석 오류`,
        focused: false
      },
      {
        id: nanoid(),
        type: 'text',
        content: `블록 변환 중 오류가 발생했습니다: ${error.message}`,
        focused: false
      },
      {
        id: nanoid(),
        type: 'code',
        content: `오류 상세:\n${error.stack || '스택 트레이스 없음'}`,
        focused: false
      }
    ];
  }
  
  /**
   * 지원하는 파일 형식 목록 반환
   * @returns {Array} 지원 파일 형식 배열
   */
  static getSupportedFormats() {
    return [
      { name: 'PDF', extensions: ['.pdf'], analyzer: 'PdfAnalyzer' },
      { name: 'Excel', extensions: ['.xls', '.xlsx', '.xlsm', '.xlsb'], analyzer: 'ExcelAnalyzer' }
    ];
  }
  
  /**
   * 파일이 지원되는 형식인지 확인
   * @param {string} filename - 파일명
   * @returns {boolean} 지원 여부
   */
  static isSupported(filename) {
    const supportedFormats = this.getSupportedFormats();
    const extension = filename.toLowerCase();
    
    return supportedFormats.some(format => 
      format.extensions.some(ext => extension.endsWith(ext))
    );
  }
}

// 개별 분석기도 export
export { PdfAnalyzer } from './PdfAnalyzer.js';
export { ExcelAnalyzer } from './ExcelAnalyzer.js'; 