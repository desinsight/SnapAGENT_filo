/**
 * File Manager Service Types
 * 
 * 이 폴더에는 파일 매니저 서비스 전용 타입 정의들이 포함됩니다:
 */

// JavaScript에서는 JSDoc 주석으로 타입 정의 제공
/**
 * @typedef {Object} FileItem
 * @property {string} name - 파일명
 * @property {string} path - 파일 경로
 * @property {number} size - 파일 크기 (bytes)
 * @property {string} type - 파일 타입
 * @property {Date} modifiedAt - 수정 시간
 * @property {boolean} isDirectory - 디렉토리 여부
 */

/**
 * @typedef {Object} DriveInfo
 * @property {string} name - 드라이브명
 * @property {string} path - 드라이브 경로
 * @property {number} totalSpace - 전체 용량
 * @property {number} freeSpace - 사용 가능 용량
 */

/**
 * @typedef {Object} SearchFilter
 * @property {string} query - 검색어
 * @property {string} fileType - 파일 타입 필터
 * @property {Date} dateFrom - 시작 날짜
 * @property {Date} dateTo - 종료 날짜
 * @property {number} sizeMin - 최소 크기
 * @property {number} sizeMax - 최대 크기
 */