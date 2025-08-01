/**
 * File Manager Service Utilities
 * 
 * 이 폴더에는 파일 매니저 서비스 전용 유틸리티 함수들이 포함됩니다:
 * - api.js - 파일 관련 API 통신
 * - electronAPI.js - Electron API 래퍼
 */

// 현재 유틸리티들 export  
export * from './api';
export { default as electronAPI } from './electronAPI';