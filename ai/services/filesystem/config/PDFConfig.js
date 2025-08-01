/**
 * 📄 PDF 분석 설정
 * 하드코딩된 값들을 분리하여 관리
 */

export const PDF_CONFIG = {
  // 파일 제한 (내역서 등 중요 문서를 위해 제한 해제)
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB (거의 무제한)
  maxPages: 10000, // 10,000페이지 (거의 무제한)
  
  // 지원 형식
  supportedFormats: ['.pdf'],
  
  // OCR 설정 (더 정확한 분석을 위해 신뢰도 낮춤)
  ocrLanguages: ['kor', 'eng'],
  ocrConfidence: 0.3, // 30%로 낮춰서 더 많은 텍스트 추출
  
  // 이미지 변환 설정 (이미지는 제한 유지)
  imageQuality: 300, // DPI
  imageFormat: 'png',
  imageWidth: 2480,
  imageHeight: 3508,
  
  // 임시 파일 설정
  tempDir: './temp_images',
  tempFilePrefix: 'page',
  
  // 성능 설정 (더 많은 동시 처리)
  maxConcurrentOCR: 10, // OCR 동시 처리 증가
  maxConcurrentImageConversion: 2, // 이미지는 제한 유지
  
  // 품질 기준 (더 관대하게 설정)
  qualityThresholds: {
    text: {
      excellent: 100, // 기준 낮춤
      good: 10, // 기준 낮춤
      poor: 1 // 기준 낮춤
    },
    ocr: {
      good: 10, // 기준 낮춤
      poor: 1 // 기준 낮춤
    }
  },
  
  // 에러 처리 (더 관대하게)
  errorHandling: {
    continueOnError: true,
    logWarnings: true,
    maxRetries: 5 // 재시도 횟수 증가
  }
};

export const PDF_ERROR_MESSAGES = {
  FILE_TOO_LARGE: '파일이 너무 큽니다',
  INVALID_FORMAT: '유효하지 않은 PDF 파일 형식입니다',
  TEXT_EXTRACTION_FAILED: '텍스트 추출에 실패했습니다',
  IMAGE_EXTRACTION_FAILED: '이미지 추출에 실패했습니다',
  OCR_FAILED: 'OCR 처리에 실패했습니다',
  PAGE_CONVERSION_FAILED: '페이지 변환에 실패했습니다',
  METADATA_EXTRACTION_FAILED: '메타데이터 추출에 실패했습니다'
}; 