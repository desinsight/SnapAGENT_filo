import React from 'react';
import { 
  FiFileText, FiImage, FiVideo, FiMusic, FiArchive, FiCode, 
  FiFile, FiFolder, FiDatabase, FiSettings, FiLayers
} from 'react-icons/fi';

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 포맷팅
 * @param {number} bytes - 바이트 단위 크기
 * @returns {string} 포맷된 크기 문자열
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  if (i === 0) return `${bytes} B`;
  
  const size = (bytes / Math.pow(1024, i)).toFixed(1);
  return `${size} ${sizes[i]}`;
};

/**
 * 날짜를 사람이 읽기 쉬운 형태로 포맷팅
 * @param {string|Date} date - 날짜
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatDate = (date) => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '-';
  
  const now = new Date();
  const diff = now - dateObj;
  
  // 오늘
  if (diff < 86400000 && now.toDateString() === dateObj.toDateString()) {
    return dateObj.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // 어제
  const yesterday = new Date(now.getTime() - 86400000);
  if (yesterday.toDateString() === dateObj.toDateString()) {
    return `어제 ${dateObj.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  }
  
  // 이번 주
  if (diff < 604800000) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return `${weekdays[dateObj.getDay()]}요일 ${dateObj.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  }
  
  // 이번 년도
  if (dateObj.getFullYear() === now.getFullYear()) {
    return dateObj.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // 다른 년도
  return dateObj.toLocaleDateString('ko-KR', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * 파일 확장자에 따른 아이콘 반환
 * @param {string} extension - 파일 확장자
 * @param {string} size - 아이콘 크기 ('small', 'medium', 'large')
 * @returns {JSX.Element} 아이콘 컴포넌트
 */
export const getFileIcon = (extension, size = 'medium') => {
  const sizeMap = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-8 h-8'
  };
  
  const iconSize = sizeMap[size];
  const ext = extension?.toLowerCase();
  
  // 이미지 파일
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(ext)) {
    return <FiImage className={`${iconSize} text-green-600`} />;
  }
  
  // 비디오 파일
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v'].includes(ext)) {
    return <FiVideo className={`${iconSize} text-red-600`} />;
  }
  
  // 오디오 파일
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext)) {
    return <FiMusic className={`${iconSize} text-purple-600`} />;
  }
  
  // 압축 파일
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
    return <FiArchive className={`${iconSize} text-yellow-600`} />;
  }
  
  // 문서 파일
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'].includes(ext)) {
    return <FiFileText className={`${iconSize} text-blue-600`} />;
  }
  
  // 코드 파일
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'php', 'rb', 'go', 'rs', 'swift'].includes(ext)) {
    return <FiCode className={`${iconSize} text-indigo-600`} />;
  }
  
  // 데이터베이스 파일
  if (['sql', 'db', 'sqlite', 'mdb'].includes(ext)) {
    return <FiDatabase className={`${iconSize} text-orange-600`} />;
  }
  
  // 설정 파일
  if (['json', 'xml', 'yaml', 'yml', 'ini', 'cfg', 'conf'].includes(ext)) {
    return <FiSettings className={`${iconSize} text-gray-600`} />;
  }
  
  // 디자인 파일
  if (['psd', 'ai', 'sketch', 'fig', 'xd'].includes(ext)) {
    return <FiLayers className={`${iconSize} text-pink-600`} />;
  }
  
  // 폴더 (확장자가 없는 경우)
  if (!ext) {
    return <FiFolder className={`${iconSize} text-blue-500`} />;
  }
  
  // 기본 파일
  return <FiFile className={`${iconSize} text-gray-500`} />;
};

/**
 * 파일 타입별 카테고리 반환
 * @param {string} extension - 파일 확장자
 * @returns {string} 파일 카테고리
 */
export const getFileCategory = (extension) => {
  const ext = extension?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(ext)) {
    return 'image';
  }
  
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v'].includes(ext)) {
    return 'video';
  }
  
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext)) {
    return 'audio';
  }
  
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
    return 'archive';
  }
  
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'].includes(ext)) {
    return 'document';
  }
  
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'php', 'rb', 'go', 'rs', 'swift'].includes(ext)) {
    return 'code';
  }
  
  return 'other';
};

/**
 * 파일 경로에서 파일명 추출
 * @param {string} path - 전체 경로
 * @returns {string} 파일명
 */
export const getFileName = (path) => {
  if (!path) return '';
  return path.split(/[\\/]/).pop() || '';
};

/**
 * 파일 경로에서 디렉토리 추출
 * @param {string} path - 전체 경로
 * @returns {string} 디렉토리 경로
 */
export const getDirectory = (path) => {
  if (!path) return '';
  const parts = path.split(/[\\/]/);
  return parts.slice(0, -1).join('/');
};

/**
 * 파일 확장자 추출
 * @param {string} filename - 파일명
 * @returns {string} 확장자 (점 제외)
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot + 1).toLowerCase();
};

/**
 * 검색 키워드 하이라이트
 * @param {string} text - 원본 텍스트
 * @param {string} keyword - 검색 키워드
 * @returns {JSX.Element} 하이라이트된 텍스트
 */
export const highlightSearchKeyword = (text, keyword) => {
  if (!keyword || !text) return text;
  
  const regex = new RegExp(`(${keyword})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.toLowerCase() === keyword.toLowerCase()) {
      return (
        <span key={index} className="bg-yellow-200 text-yellow-800 px-1 rounded">
          {part}
        </span>
      );
    }
    return part;
  });
};

/**
 * 바이트 단위 변환
 * @param {number} bytes - 바이트
 * @param {number} decimals - 소수점 자리수
 * @returns {Object} 변환된 크기 정보
 */
export const convertBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return { value: 0, unit: 'B' };
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return {
    value: parseFloat((bytes / Math.pow(k, i)).toFixed(dm)),
    unit: sizes[i]
  };
};

/**
 * 파일 경로를 상대 경로로 변환
 * @param {string} fullPath - 전체 경로
 * @param {string} basePath - 기준 경로
 * @returns {string} 상대 경로
 */
export const getRelativePath = (fullPath, basePath) => {
  if (!fullPath || !basePath) return fullPath;
  
  const normalizedFull = fullPath.replace(/\\/g, '/');
  const normalizedBase = basePath.replace(/\\/g, '/');
  
  if (normalizedFull.startsWith(normalizedBase)) {
    return normalizedFull.slice(normalizedBase.length).replace(/^\//, '');
  }
  
  return fullPath;
};