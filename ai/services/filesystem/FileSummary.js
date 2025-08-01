/**
 * 📊 FILE SUMMARY - 파일 분석 및 요약 시스템
 * 역할: 파일 내용 분석, 메타데이터 추출, 파일 분류 및 태깅
 * 기능: 파일 내용 분석, 메타데이터 추출, 지능형 분류, 성능 최적화
 * 특징: 파일 분석, 지능형 분류, 메타데이터 처리, 성능 최적화
 */

/**
 * FileSummary 클래스
 * 오류 메시지 생성 및 파일 분석을 위한 통합 클래스
 */
export class FileSummary {
  constructor() {
    this.errorMessages = {
      EACCES: '⚠️ 해당 폴더/파일에 접근 권한이 없습니다. 관리자 권한으로 실행하거나 파일 속성을 확인해주세요.',
      ENOENT: '⚠️ 해당 파일이 존재하지 않습니다. 파일 경로를 다시 확인해주세요.',
      ENOSPC: '⚠️ 디스크 공간이 부족합니다. 불필요한 파일을 정리하고 다시 시도해주세요.',
      EBUSY: '⚠️ 파일이 다른 프로그램에서 사용 중입니다. 해당 프로그램을 종료하고 다시 시도해주세요.',
      EISDIR: '⚠️ 디렉토리는 읽을 수 없습니다. 파일을 선택해주세요.',
      EFBIG: '⚠️ 파일이 너무 큽니다. 더 작은 파일을 선택하거나 파일을 분할해주세요.',
      EILSEQ: '⚠️ 파일 인코딩에 문제가 있습니다. 다른 인코딩으로 시도해주세요.',
      EROFS: '⚠️ 읽기 전용 파일시스템입니다. 쓰기 권한이 있는 위치를 선택해주세요.',
      ENOTEMPTY: '⚠️ 디렉토리가 비어있지 않습니다. 먼저 내부 파일들을 삭제해주세요.',
      ETIMEDOUT: '⚠️ 작업 시간이 초과되었습니다. 다시 시도해주세요.',
      ENOTFOUND: '⚠️ 네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.'
    };
    
    this.initialized = false;
  }

  /**
   * 초기화 메서드 - FileSystemService에서 호출됨
   */
  async initialize() {
    try {
      console.log('📊 FileSummary 초기화 중...');
      
      // 기본 초기화 작업
      this.initialized = true;
      
      console.log('✅ FileSummary 초기화 완료');
    } catch (error) {
      console.error('❌ FileSummary 초기화 실패:', error);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * 초기화 상태 확인 메서드
   */
  isReady() {
    return this.initialized;
  }

  /**
   * 오류 메시지를 생성합니다.
   * @param {Error} error - 오류 객체
   * @param {string} action - 수행하려던 작업
   * @param {string} path - 대상 경로
   * @returns {Object} - { userMessage, technicalError, errorCode, suggestions }
   */
  getErrorMessage(error, action, path) {
    if (!error) {
      return {
        userMessage: '⚠️ 알 수 없는 오류가 발생했습니다.',
        technicalError: 'Unknown error',
        errorCode: 'UNKNOWN',
        suggestions: ['작업을 다시 시도해보세요']
      };
    }

    // 오류 코드별 메시지
    const userMessage = this.errorMessages[error.code] || 
                       this.getGenericErrorMessage(error, action);
    
    const technicalError = error.message || error.toString();
    const errorCode = error.code || 'UNKNOWN';
    
    // 작업별 제안사항
    const suggestions = this.getSuggestionsByAction(action, error.code);

    return {
      userMessage,
      technicalError,
      errorCode,
      suggestions
    };
  }

  /**
   * 일반적인 오류 메시지를 생성합니다.
   */
  getGenericErrorMessage(error, action) {
    const actionNames = {
      'read_file': '파일 읽기',
      'write_file': '파일 쓰기',
      'delete_file': '파일 삭제',
      'list_files': '파일 목록 조회',
      'analyze_directory': '디렉토리 분석',
      'search_files': '파일 검색'
    };

    const actionName = actionNames[action] || '작업';
    return `⚠️ ${actionName} 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`;
  }

  /**
   * 작업별 제안사항을 반환합니다.
   */
  getSuggestionsByAction(action, errorCode) {
    const suggestions = {
      'read_file': [
        '파일 경로가 정확한지 확인하세요',
        '파일이 다른 프로그램에서 사용 중인지 확인하세요',
        '관리자 권한으로 프로그램을 실행해보세요'
      ],
      'write_file': [
        '디렉토리 권한을 확인하세요',
        '디스크 공간이 충분한지 확인하세요',
        '관리자 권한으로 프로그램을 실행해보세요'
      ],
      'delete_file': [
        '파일이 다른 프로그램에서 사용 중인지 확인하세요',
        '파일 권한을 확인하세요',
        '관리자 권한으로 프로그램을 실행해보세요'
      ],
      'list_files': [
        '폴더 경로가 정확한지 확인하세요',
        '폴더 접근 권한을 확인하세요',
        '관리자 권한으로 프로그램을 실행해보세요'
      ],
      'analyze_directory': [
        '폴더 경로가 정확한지 확인하세요',
        '폴더 접근 권한을 확인하세요',
        '관리자 권한으로 프로그램을 실행해보세요'
      ],
      'search_files': [
        '검색 경로가 정확한지 확인하세요',
        '검색 권한을 확인하세요',
        '관리자 권한으로 프로그램을 실행해보세요'
      ]
    };

    return suggestions[action] || ['작업을 다시 시도해보세요', '관리자 권한으로 프로그램을 실행해보세요'];
  }

  /**
   * 파일/폴더 목록의 통계 정보를 반환합니다.
   * @param {Array} files
   * @returns {Object} - { total, folders, files, byExtension, totalSize, lastModified }
   */
  analyzeFileListStats(files) {
    if (!Array.isArray(files)) return {};
    const stats = {
      total: files.length,
      folders: 0,
      files: 0,
      byExtension: {},
      totalSize: 0,
      lastModified: null
    };
    files.forEach(f => {
      if (f.isDirectory || f.type === 'directory') {
        stats.folders++;
      } else {
        stats.files++;
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (ext) stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;
        if (typeof f.size === 'number') stats.totalSize += f.size;
        if (f.mtime && (!stats.lastModified || f.mtime > stats.lastModified)) stats.lastModified = f.mtime;
      }
    });
    return stats;
  }

  /**
   * 디렉토리 분석 JSON을 반환합니다.
   * @param {Array} files
   * @returns {Object}
   */
  getDirectoryAnalysisJSON(files) {
    if (!Array.isArray(files)) return {};
    
    const analysis = {
      fileTypes: {},
      sizeRanges: {
        small: 0,    // < 1MB
        medium: 0,   // 1MB - 10MB
        large: 0     // > 10MB
      },
      recentFiles: 0,
      oldFiles: 0,
      averageSize: 0
    };

    let totalSize = 0;
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);

    files.forEach(f => {
      if (!f.isDirectory) {
        // 파일 타입 분석
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (ext) analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;

        // 크기 분석
        const size = f.size || 0;
        totalSize += size;
        if (size < 1024 * 1024) analysis.sizeRanges.small++;
        else if (size < 10 * 1024 * 1024) analysis.sizeRanges.medium++;
        else analysis.sizeRanges.large++;

        // 날짜 분석
        if (f.mtime) {
          const fileTime = new Date(f.mtime).getTime();
          if (fileTime > oneWeekAgo) analysis.recentFiles++;
          if (fileTime < oneYearAgo) analysis.oldFiles++;
        }
      }
    });

    analysis.averageSize = files.length > 0 ? totalSize / files.length : 0;
    return analysis;
  }

  /**
   * 📊 대용량 디렉토리 통계
   */
  getLargeDirectoryStats(files) {
    if (!Array.isArray(files)) return { error: '파일 정보를 불러올 수 없습니다.' };
    const byType = {};
    files.forEach(f => {
      const type = f.isDirectory ? 'Directories' : 'Files';
      byType[type] = (byType[type] || 0) + 1;
    });
    return {
      total: files.length,
      byType,
      isLarge: files.length > 1000
    };
  }

  /**
   * 🧹 메모리 정리
   */
  async cleanup() {
    try {
      console.log('📊 FileSummary 정리 중...');
      
      // 메모리 정리 (FileSummary는 주로 정적 함수들이므로 특별한 정리 작업 없음)
      console.log('✅ FileSummary 정리 완료');
      
    } catch (error) {
      console.error('❌ FileSummary 정리 실패:', error);
    }
  }
}

/**
 * 파일/폴더 목록의 통계 정보(확장자별, 용량, 최종 수정일 등)를 반환합니다.
 * @param {Array} files
 * @returns {Object} - { total, folders, files, byExtension, totalSize, lastModified }
 */
function analyzeFileListStats(files) {
  if (!Array.isArray(files)) return {};
  const stats = {
    total: files.length,
    folders: 0,
    files: 0,
    byExtension: {},
    totalSize: 0,
    lastModified: null
  };
  files.forEach(f => {
    if (f.isDirectory || f.type === 'directory') {
      stats.folders++;
    } else {
      stats.files++;
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (ext) stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;
      if (typeof f.size === 'number') stats.totalSize += f.size;
      if (f.mtime && (!stats.lastModified || f.mtime > stats.lastModified)) stats.lastModified = f.mtime;
    }
  });
  return stats;
}

/**
 * 오류/권한 문제 등 예외 상황을 자연어로 요약합니다.
 * @param {Object} error
 * @returns {string}
 */
function summarizeFileError(error) {
  if (!error) return '';
  
  // 권한 오류
  if (error.code === 'EACCES' || error.message?.includes('권한') || error.message?.includes('permission')) {
    return '⚠️ 해당 폴더/파일에 접근 권한이 없습니다. 관리자 권한으로 실행하거나 파일 속성을 확인해주세요.';
  }
  
  // 파일/폴더 존재하지 않음
  if (error.code === 'ENOENT' || error.message?.includes('없음') || error.message?.includes('no such file')) {
    return '⚠️ 해당 경로에 폴더/파일이 존재하지 않습니다. 경로를 다시 확인해주세요.';
  }
  
  // 디스크 공간 부족
  if (error.code === 'ENOSPC' || error.message?.includes('공간') || error.message?.includes('space')) {
    return '⚠️ 디스크 공간이 부족합니다. 불필요한 파일을 정리하고 다시 시도해주세요.';
  }
  
  // 파일이 사용 중
  if (error.code === 'EBUSY' || error.message?.includes('사용 중') || error.message?.includes('busy')) {
    return '⚠️ 파일이 다른 프로그램에서 사용 중입니다. 해당 프로그램을 종료하고 다시 시도해주세요.';
  }
  
  // 네트워크 오류
  if (error.code === 'ENOTFOUND' || error.message?.includes('네트워크') || error.message?.includes('network')) {
    return '⚠️ 네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
  }
  
  // 타임아웃
  if (error.code === 'ETIMEDOUT' || error.message?.includes('시간 초과') || error.message?.includes('timeout')) {
    return '⚠️ 작업 시간이 초과되었습니다. 다시 시도해주세요.';
  }
  
  // 기타 오류
  return `⚠️ 오류 발생: ${error.message || JSON.stringify(error)}`;
}

/**
 * 파일 읽기 오류를 자연어로 요약합니다.
 * @param {object} error
 * @returns {string}
 */
function summarizeFileReadError(error) {
  if (!error) return '';
  
  // 권한 오류
  if (error.code === 'EACCES' || error.message?.includes('권한') || error.message?.includes('permission')) {
    return '⚠️ 파일 읽기 권한이 없습니다. 관리자 권한으로 실행하거나 파일 속성을 확인해주세요.';
  }
  
  // 파일 존재하지 않음
  if (error.code === 'ENOENT' || error.message?.includes('없음') || error.message?.includes('no such file')) {
    return '⚠️ 해당 파일이 존재하지 않습니다. 파일 경로를 다시 확인해주세요.';
  }
  
  // 파일이 사용 중
  if (error.code === 'EBUSY' || error.message?.includes('사용 중') || error.message?.includes('busy')) {
    return '⚠️ 파일이 다른 프로그램에서 사용 중입니다. 해당 프로그램을 종료하고 다시 시도해주세요.';
  }
  
  // 파일이 디렉토리
  if (error.code === 'EISDIR' || error.message?.includes('디렉토리') || error.message?.includes('directory')) {
    return '⚠️ 디렉토리는 읽을 수 없습니다. 파일을 선택해주세요.';
  }
  
  // 파일이 너무 큼
  if (error.code === 'EFBIG' || error.message?.includes('너무 큼') || error.message?.includes('too large')) {
    return '⚠️ 파일이 너무 큽니다. 더 작은 파일을 선택하거나 파일을 분할해주세요.';
  }
  
  // 인코딩 오류
  if (error.code === 'EILSEQ' || error.message?.includes('인코딩') || error.message?.includes('encoding')) {
    return '⚠️ 파일 인코딩에 문제가 있습니다. 다른 인코딩으로 시도해주세요.';
  }
  
  // 기타 오류
  return `⚠️ 파일 읽기 오류: ${error.message || JSON.stringify(error)}`;
}

/**
 * 파일 쓰기 오류를 자연어로 요약합니다.
 * @param {object} error
 * @returns {string}
 */
function summarizeFileWriteError(error) {
  if (!error) return '';
  
  // 권한 오류
  if (error.code === 'EACCES' || error.message?.includes('권한') || error.message?.includes('permission')) {
    return '⚠️ 파일 쓰기 권한이 없습니다. 관리자 권한으로 실행하거나 파일 속성을 확인해주세요.';
  }
  
  // 디스크 공간 부족
  if (error.code === 'ENOSPC' || error.message?.includes('공간') || error.message?.includes('space')) {
    return '⚠️ 디스크 공간이 부족합니다. 불필요한 파일을 정리하고 다시 시도해주세요.';
  }
  
  // 파일이 사용 중
  if (error.code === 'EBUSY' || error.message?.includes('사용 중') || error.message?.includes('busy')) {
    return '⚠️ 파일이 다른 프로그램에서 사용 중입니다. 해당 프로그램을 종료하고 다시 시도해주세요.';
  }
  
  // 디렉토리가 존재하지 않음
  if (error.code === 'ENOENT' || error.message?.includes('없음') || error.message?.includes('no such file')) {
    return '⚠️ 대상 디렉토리가 존재하지 않습니다. 디렉토리를 먼저 생성해주세요.';
  }
  
  // 읽기 전용 파일시스템
  if (error.code === 'EROFS' || error.message?.includes('읽기 전용') || error.message?.includes('read-only')) {
    return '⚠️ 읽기 전용 파일시스템입니다. 쓰기 권한이 있는 위치를 선택해주세요.';
  }
  
  // 파일이 너무 큼
  if (error.code === 'EFBIG' || error.message?.includes('너무 큼') || error.message?.includes('too large')) {
    return '⚠️ 파일이 너무 큽니다. 더 작은 파일로 분할해주세요.';
  }
  
  // 기타 오류
  return `⚠️ 파일 쓰기 오류: ${error.message || JSON.stringify(error)}`;
}

/**
 * 파일 삭제 오류를 자연어로 요약합니다.
 * @param {object} error
 * @returns {string}
 */
function summarizeFileDeleteError(error) {
  if (!error) return '';
  
  // 권한 오류
  if (error.code === 'EACCES' || error.message?.includes('권한') || error.message?.includes('permission')) {
    return '⚠️ 파일 삭제 권한이 없습니다. 관리자 권한으로 실행하거나 파일 속성을 확인해주세요.';
  }
  
  // 파일이 사용 중
  if (error.code === 'EBUSY' || error.message?.includes('사용 중') || error.message?.includes('busy')) {
    return '⚠️ 파일이 다른 프로그램에서 사용 중입니다. 해당 프로그램을 종료하고 다시 시도해주세요.';
  }
  
  // 파일 존재하지 않음
  if (error.code === 'ENOENT' || error.message?.includes('없음') || error.message?.includes('no such file')) {
    return '⚠️ 삭제할 파일이 존재하지 않습니다. 파일 경로를 다시 확인해주세요.';
  }
  
  // 디렉토리가 비어있지 않음
  if (error.code === 'ENOTEMPTY' || error.message?.includes('비어있지 않음') || error.message?.includes('not empty')) {
    return '⚠️ 디렉토리가 비어있지 않습니다. 먼저 내부 파일들을 삭제해주세요.';
  }
  
  // 읽기 전용 파일시스템
  if (error.code === 'EROFS' || error.message?.includes('읽기 전용') || error.message?.includes('read-only')) {
    return '⚠️ 읽기 전용 파일시스템입니다. 삭제할 수 없습니다.';
  }
  
  // 기타 오류
  return `⚠️ 파일 삭제 오류: ${error.message || JSON.stringify(error)}`;
}

/**
 * 파일 복사 오류를 자연어로 요약합니다.
 * @param {object} error
 * @returns {string}
 */
function summarizeFileCopyError(error) {
  if (!error) return '';
  
  // 권한 오류
  if (error.code === 'EACCES' || error.message?.includes('권한') || error.message?.includes('permission')) {
    return '⚠️ 파일 복사 권한이 없습니다. 관리자 권한으로 실행하거나 파일 속성을 확인해주세요.';
  }
  
  // 원본 파일 존재하지 않음
  if (error.code === 'ENOENT' || error.message?.includes('없음') || error.message?.includes('no such file')) {
    return '⚠️ 복사할 원본 파일이 존재하지 않습니다. 파일 경로를 다시 확인해주세요.';
  }
  
  // 디스크 공간 부족
  if (error.code === 'ENOSPC' || error.message?.includes('공간') || error.message?.includes('space')) {
    return '⚠️ 디스크 공간이 부족합니다. 불필요한 파일을 정리하고 다시 시도해주세요.';
  }
  
  // 파일이 사용 중
  if (error.code === 'EBUSY' || error.message?.includes('사용 중') || error.message?.includes('busy')) {
    return '⚠️ 파일이 다른 프로그램에서 사용 중입니다. 해당 프로그램을 종료하고 다시 시도해주세요.';
  }
  
  // 대상 디렉토리가 존재하지 않음
  if (error.message?.includes('directory') || error.message?.includes('디렉토리')) {
    return '⚠️ 대상 디렉토리가 존재하지 않습니다. 디렉토리를 먼저 생성해주세요.';
  }
  
  // 읽기 전용 파일시스템
  if (error.code === 'EROFS' || error.message?.includes('읽기 전용') || error.message?.includes('read-only')) {
    return '⚠️ 읽기 전용 파일시스템입니다. 쓰기 권한이 있는 위치를 선택해주세요.';
  }
  
  // 기타 오류
  return `⚠️ 파일 복사 오류: ${error.message || JSON.stringify(error)}`;
}

/**
 * 파일 이동 오류를 자연어로 요약합니다.
 * @param {object} error
 * @returns {string}
 */
function summarizeFileMoveError(error) {
  if (!error) return '';
  
  // 권한 오류
  if (error.code === 'EACCES' || error.message?.includes('권한') || error.message?.includes('permission')) {
    return '⚠️ 파일 이동 권한이 없습니다. 관리자 권한으로 실행하거나 파일 속성을 확인해주세요.';
  }
  
  // 원본 파일 존재하지 않음
  if (error.code === 'ENOENT' || error.message?.includes('없음') || error.message?.includes('no such file')) {
    return '⚠️ 이동할 원본 파일이 존재하지 않습니다. 파일 경로를 다시 확인해주세요.';
  }
  
  // 파일이 사용 중
  if (error.code === 'EBUSY' || error.message?.includes('사용 중') || error.message?.includes('busy')) {
    return '⚠️ 파일이 다른 프로그램에서 사용 중입니다. 해당 프로그램을 종료하고 다시 시도해주세요.';
  }
  
  // 대상 디렉토리가 존재하지 않음
  if (error.message?.includes('directory') || error.message?.includes('디렉토리')) {
    return '⚠️ 대상 디렉토리가 존재하지 않습니다. 디렉토리를 먼저 생성해주세요.';
  }
  
  // 디스크 공간 부족
  if (error.code === 'ENOSPC' || error.message?.includes('공간') || error.message?.includes('space')) {
    return '⚠️ 디스크 공간이 부족합니다. 불필요한 파일을 정리하고 다시 시도해주세요.';
  }
  
  // 읽기 전용 파일시스템
  if (error.code === 'EROFS' || error.message?.includes('읽기 전용') || error.message?.includes('read-only')) {
    return '⚠️ 읽기 전용 파일시스템입니다. 쓰기 권한이 있는 위치를 선택해주세요.';
  }
  
  // 기타 오류
  return `⚠️ 파일 이동 오류: ${error.message || JSON.stringify(error)}`;
}

/**
 * 경로 검증 오류를 자연어로 요약합니다.
 * @param {object} error
 * @returns {string}
 */
function summarizePathValidationError(error) {
  if (!error) return '';
  
  // 경로가 너무 김
  if (error.code === 'ENAMETOOLONG' || error.message?.includes('너무 김') || error.message?.includes('too long')) {
    return '⚠️ 경로가 너무 깁니다. 더 짧은 경로를 사용해주세요.';
  }
  
  // 잘못된 문자 포함
  if (error.code === 'EINVAL' || error.message?.includes('잘못된') || error.message?.includes('invalid')) {
    return '⚠️ 경로에 잘못된 문자가 포함되어 있습니다. 특수문자를 제거해주세요.';
  }
  
  // 권한 오류
  if (error.code === 'EACCES' || error.message?.includes('권한') || error.message?.includes('permission')) {
    return '⚠️ 경로에 접근 권한이 없습니다. 관리자 권한으로 실행해주세요.';
  }
  
  // 경로 존재하지 않음
  if (error.code === 'ENOENT' || error.message?.includes('없음') || error.message?.includes('no such file')) {
    return '⚠️ 지정된 경로가 존재하지 않습니다. 경로를 다시 확인해주세요.';
  }
  
  // 기타 오류
  return `⚠️ 경로 검증 오류: ${error.message || JSON.stringify(error)}`;
}

/**
 * 파일 추천 결과를 구조화된 JSON으로 반환
 */
function getFileRecommendationsJSON(recommendations) {
  if (!Array.isArray(recommendations)) return { recommendations: [] };
  return {
    recommendations: recommendations.map(f => ({ name: f.name, path: f.path, score: f.score || null }))
  };
}

/**
 * 보안 인사이트를 구조화된 JSON으로 반환
 */
function getSecurityInsightsJSON(insights) {
  if (!insights) return { risk: null };
  return {
    risk: insights.risk,
    riskCount: insights.riskCount,
    details: insights.details || []
  };
}

/**
 * 성능 인사이트를 구조화된 JSON으로 반환
 */
function getPerformanceReportJSON(perf) {
  if (!perf) return { error: '정보 없음' };
  return {
    avgResponseTime: perf.avgResponseTime,
    cacheHitRate: perf.cacheHitRate,
    lastOptimization: perf.lastOptimization
  };
}

/**
 * 실시간 모니터링 상태를 구조화된 JSON으로 반환
 */
function getRealtimeMonitoringStatusJSON(status) {
  if (!status) return { error: '정보 없음' };
  return {
    changeCount: status.changeCount,
    lastChange: status.lastChange
  };
}

/**
 * 트렌드 정보를 구조화된 JSON으로 반환
 */
function getTrendSummaryJSON(trend) {
  if (!trend) return { error: '정보 없음' };
  return {
    period: trend.period,
    accessCount: trend.accessCount,
    editCount: trend.editCount
  };
}

/**
 * AI 인사이트를 구조화된 JSON으로 반환
 */
function getAIInsightsJSON(ai) {
  if (!ai) return { summary: null };
  return {
    summary: ai.summary,
    details: ai.details || []
  };
}

/**
 * 배치 작업 결과를 구조화된 JSON으로 반환
 */
function getBatchOperationSummaryJSON(results) {
  if (!results) return { error: '정보 없음' };
  return {
    total: results.total,
    success: results.success,
    fail: results.fail,
    details: results.details || []
  };
}

/**
 * 파일/폴더별 히스토리/버전/변경 로그 통계
 */
function getFileHistoryStats(history) {
  if (!Array.isArray(history)) return { error: '변경 이력이 없습니다.' };
  const byAction = {};
  history.forEach(h => { byAction[h.action] = (byAction[h.action] || 0) + 1; });
  return { total: history.length, byAction };
}

/**
 * 연관성/관계/의존성/유사도 분석 통계
 */
function getFileRelationshipStats(relationships) {
  if (!Array.isArray(relationships)) return { error: '연관성 정보가 없습니다.' };
  const byType = {};
  relationships.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });
  return { total: relationships.length, byType };
}

/**
 * 실시간 모니터링/알림/이벤트/트리거/자동화 상태 통계
 */
function getRealtimeEventStats(events) {
  if (!Array.isArray(events)) return { error: '이벤트 정보가 없습니다.' };
  const byType = {};
  events.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1; });
  return { total: events.length, byType };
}

/**
 * 동기화/백업/복구/이중화/재해복구 상태 통계
 */
function getSyncBackupStats(status) {
  if (!status) return { error: '상태 정보가 없습니다.' };
  return {
    sync: status.sync,
    backup: status.backup,
    restore: status.restore,
    ha: status.ha,
    dr: status.dr
  };
}

/**
 * 사용자/그룹/역할별 활동/경고/통계
 */
function getUserGroupRoleStats(users, userStats) {
  if (!Array.isArray(users) || !userStats) return { error: '사용자 정보가 없습니다.' };
  return users.map(u => ({
    name: u.name,
    role: u.role,
    activity: userStats[u.name]?.activity || 0,
    warnings: userStats[u.name]?.warnings || 0
  }));
}

/**
 * 파일/폴더별 메타데이터/커스텀 속성/확장 정보 통계
 */
function getFileMetadataStats(files) {
  if (!Array.isArray(files)) return { error: '메타데이터 정보가 없습니다.' };
  return files.map(f => ({ name: f.name, metadata: f.metadata || {} }));
}

/**
 * 리소스/비용/용량/성능/트래픽 통계
 */
function getResourceUsageStats(files, resourceStats) {
  if (!Array.isArray(files) || !resourceStats) return { error: '리소스 정보가 없습니다.' };
  return files.map(f => ({
    name: f.name,
    size: resourceStats[f.name]?.size || 0,
    traffic: resourceStats[f.name]?.traffic || 0,
    perf: resourceStats[f.name]?.perf || null
  }));
}

/**
 * AI 기반 미래 예측/트렌드/패턴 통계
 */
function getAIFutureTrendStats(files, aiTrend) {
  if (!Array.isArray(files) || !aiTrend) return { error: '트렌드 정보가 없습니다.' };
  return files.map(f => ({ name: f.name, trend: aiTrend[f.name] || null }));
}

/**
 * 컴플라이언스/정책/감사/보안/권한/로그 통계
 */
function getComplianceAuditStats(files, compliance) {
  if (!Array.isArray(files) || !compliance) return { error: '컴플라이언스 정보가 없습니다.' };
  return files.map(f => ({
    name: f.name,
    compliance: compliance[f.name] || null
  }));
}

/**
 * 대용량 일괄 작업/배치 처리/결과 요약
 */
function getBatchOperationStats(results) {
  if (!results) return { error: '배치 작업 정보가 없습니다.' };
  return {
    total: results.total,
    success: results.success,
    fail: results.fail,
    details: results.details || []
  };
}

export {
  analyzeFileListStats,
  summarizeFileError,
  summarizeFileReadError,
  summarizeFileWriteError,
  summarizeFileDeleteError,
  summarizeFileCopyError,
  summarizeFileMoveError,
  summarizePathValidationError,
  getFileRecommendationsJSON,
  getSecurityInsightsJSON,
  getPerformanceReportJSON,
  getRealtimeMonitoringStatusJSON,
  getTrendSummaryJSON,
  getAIInsightsJSON,
  getBatchOperationSummaryJSON,
  getFileHistoryStats,
  getFileRelationshipStats,
  getRealtimeEventStats,
  getSyncBackupStats,
  getUserGroupRoleStats,
  getFileMetadataStats,
  getResourceUsageStats,
  getAIFutureTrendStats,
  getComplianceAuditStats,
  getBatchOperationStats
}; 