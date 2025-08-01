// 파일 관련 유틸리티 함수들
import React from 'react';

/**
 * 파일 크기를 읽기 쉬운 형태로 포맷
 * @param {number} bytes - 바이트 크기
 * @param {number} decimals - 소수점 자릿수
 * @returns {string} 포맷된 파일 크기
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * 파일 확장자 추출
 * @param {string} filename - 파일명
 * @returns {string} 확장자
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
};

/**
 * MIME 타입으로 파일 타입 확인
 * @param {string} mimeType - MIME 타입
 * @returns {boolean} 이미지 파일 여부
 */
export const isImageFile = (mimeType) => {
  return mimeType?.startsWith('image/');
};

/**
 * MIME 타입으로 비디오 파일 확인
 * @param {string} mimeType - MIME 타입
 * @returns {boolean} 비디오 파일 여부
 */
export const isVideoFile = (mimeType) => {
  return mimeType?.startsWith('video/');
};

/**
 * MIME 타입으로 오디오 파일 확인
 * @param {string} mimeType - MIME 타입
 * @returns {boolean} 오디오 파일 여부
 */
export const isAudioFile = (mimeType) => {
  return mimeType?.startsWith('audio/');
};

/**
 * MIME 타입으로 문서 파일 확인
 * @param {string} mimeType - MIME 타입
 * @returns {boolean} 문서 파일 여부
 */
export const isDocumentFile = (mimeType) => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf'
  ];
  return documentTypes.includes(mimeType);
};

/**
 * MIME 타입으로 압축 파일 확인
 * @param {string} mimeType - MIME 타입
 * @returns {boolean} 압축 파일 여부
 */
export const isArchiveFile = (mimeType) => {
  const archiveTypes = [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'application/x-tar'
  ];
  return archiveTypes.includes(mimeType);
};

/**
 * 파일 타입에 따른 아이콘 반환
 * @param {string} mimeType - MIME 타입
 * @param {string} filename - 파일명 (옵션)
 * @returns {React.Element} 파일 아이콘
 */
export const getFileIcon = (mimeType, filename = '') => {
  // 이미지 파일
  if (isImageFile(mimeType)) {
    return (
      <svg className="w-full h-full text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    );
  }

  // 비디오 파일
  if (isVideoFile(mimeType)) {
    return (
      <svg className="w-full h-full text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM5 8a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1V8z" />
      </svg>
    );
  }

  // 오디오 파일
  if (isAudioFile(mimeType)) {
    return (
      <svg className="w-full h-full text-purple-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
      </svg>
    );
  }

  // PDF 파일
  if (mimeType === 'application/pdf') {
    return (
      <svg className="w-full h-full text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // Word 문서
  if (mimeType?.includes('word') || mimeType?.includes('document')) {
    return (
      <svg className="w-full h-full text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  }

  // Excel 스프레드시트
  if (mimeType?.includes('excel') || mimeType?.includes('sheet')) {
    return (
      <svg className="w-full h-full text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
      </svg>
    );
  }

  // PowerPoint 프레젠테이션
  if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) {
    return (
      <svg className="w-full h-full text-orange-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
      </svg>
    );
  }

  // 텍스트 파일
  if (mimeType?.startsWith('text/')) {
    return (
      <svg className="w-full h-full text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // 압축 파일
  if (isArchiveFile(mimeType)) {
    return (
      <svg className="w-full h-full text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    );
  }

  // 기본 파일 아이콘
  return (
    <svg className="w-full h-full text-gray-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  );
};

/**
 * 파일 타입 이름 반환
 * @param {string} mimeType - MIME 타입
 * @returns {string} 파일 타입 이름
 */
export const getFileTypeName = (mimeType) => {
  if (isImageFile(mimeType)) return '이미지';
  if (isVideoFile(mimeType)) return '동영상';
  if (isAudioFile(mimeType)) return '오디오';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType?.includes('word') || mimeType?.includes('document')) return 'Word 문서';
  if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return 'Excel 스프레드시트';
  if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return 'PowerPoint 프레젠테이션';
  if (mimeType?.startsWith('text/')) return '텍스트';
  if (isArchiveFile(mimeType)) return '압축 파일';
  return '파일';
};

/**
 * 파일 URL에서 썸네일 생성 (이미지용)
 * @param {File|Blob} file - 파일 객체
 * @param {number} maxWidth - 최대 너비
 * @param {number} maxHeight - 최대 높이
 * @returns {Promise<string>} 썸네일 data URL
 */
export const generateThumbnail = (file, maxWidth = 200, maxHeight = 200) => {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file.type)) {
      reject(new Error('이미지 파일이 아닙니다.'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 비율 유지하면서 크기 조정
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.onerror = () => {
      reject(new Error('이미지 로드 실패'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 파일 유효성 검사
 * @param {File} file - 파일 객체
 * @param {Object} options - 검사 옵션
 * @returns {Object} 검사 결과
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB
    allowedTypes = [],
    minSize = 0
  } = options;

  const errors = [];

  // 파일 크기 검사
  if (file.size > maxSize) {
    errors.push(`파일 크기가 최대 허용 크기(${formatFileSize(maxSize)})를 초과합니다.`);
  }

  if (file.size < minSize) {
    errors.push(`파일 크기가 최소 크기(${formatFileSize(minSize)})보다 작습니다.`);
  }

  // 파일 타입 검사
  if (allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      errors.push('지원되지 않는 파일 형식입니다.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 파일 해시 생성 (중복 검사용)
 * @param {File} file - 파일 객체
 * @returns {Promise<string>} 파일 해시
 */
export const generateFileHash = async (file) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * 드래그 중인 파일 수 계산
 * @param {DragEvent} event - 드래그 이벤트
 * @returns {number} 파일 수
 */
export const getDropFileCount = (event) => {
  if (event.dataTransfer.items) {
    return Array.from(event.dataTransfer.items).filter(
      item => item.kind === 'file'
    ).length;
  }
  return event.dataTransfer.files.length;
};

/**
 * 파일명에서 안전하지 않은 문자 제거
 * @param {string} filename - 파일명
 * @returns {string} 안전한 파일명
 */
export const sanitizeFilename = (filename) => {
  // 윈도우/리눅스에서 허용되지 않는 문자 제거
  return filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
};

/**
 * 파일 공유 권한 레벨 정의
 */
export const FILE_PERMISSION_LEVELS = {
  NONE: 'none',
  VIEW: 'view',
  DOWNLOAD: 'download',
  EDIT: 'edit',
  ADMIN: 'admin'
};

/**
 * 권한 레벨에 따른 설명 반환
 * @param {string} level - 권한 레벨
 * @returns {string} 권한 설명
 */
export const getPermissionDescription = (level) => {
  const descriptions = {
    [FILE_PERMISSION_LEVELS.NONE]: '접근 불가',
    [FILE_PERMISSION_LEVELS.VIEW]: '보기만 가능',
    [FILE_PERMISSION_LEVELS.DOWNLOAD]: '보기 및 다운로드 가능',
    [FILE_PERMISSION_LEVELS.EDIT]: '편집 가능',
    [FILE_PERMISSION_LEVELS.ADMIN]: '전체 관리 권한'
  };
  return descriptions[level] || '알 수 없음';
};