/**
 * 중복 파일 감지 유틸리티
 */

/**
 * 파일 그룹별로 중복을 감지합니다
 * @param {Array} files - 파일 배열
 * @returns {Object} 중복 정보가 포함된 객체
 */
export const detectDuplicates = (files) => {
  if (!files || files.length === 0) {
    return {
      duplicateGroups: [],
      duplicateFiles: new Set(),
      duplicateCount: 0
    };
  }

  // 폴더는 제외하고 파일만 처리
  const filesOnly = files.filter(file => !file.isDirectory);
  
  console.log('🔍 [Duplicate Detection] Processing files:', filesOnly.length);
  
  // 1단계: 파일명 기반 그룹핑 (더 관대한 조건)
  const nameGroups = new Map();
  
  filesOnly.forEach(file => {
    // 파일명에서 확장자 제거하고 비교 (더 관대하게)
    const baseName = file.name.toLowerCase().replace(/\.[^/.]+$/, '');
    if (!nameGroups.has(baseName)) {
      nameGroups.set(baseName, []);
    }
    nameGroups.get(baseName).push(file);
  });

  console.log('🔍 [Duplicate Detection] Name groups:', nameGroups.size);

  // 2단계: 크기 기반 세분화 (같은 이름 + 같은 크기)
  const sizeGroups = new Map();
  
  nameGroups.forEach((fileList, fileName) => {
    if (fileList.length > 1) {
      // 테스트: 같은 베이스명이면 크기 상관없이 중복으로 간주
      sizeGroups.set(fileName, fileList);
      
      /* 원래 로직 (주석 처리)
      // 같은 이름의 파일들을 크기별로 그룹핑
      const sizeMap = new Map();
      fileList.forEach(file => {
        const key = `${fileName}_${file.size || 0}`;
        if (!sizeMap.has(key)) {
          sizeMap.set(key, []);
        }
        sizeMap.get(key).push(file);
      });
      
      // 크기별로 2개 이상인 것만 중복으로 판단
      sizeMap.forEach((files, key) => {
        if (files.length > 1) {
          sizeGroups.set(key, files);
        }
      });
      */
    }
  });

  // 3단계: 확장자별 추가 검증
  const duplicateGroups = [];
  const duplicateFiles = new Set();

  sizeGroups.forEach((fileGroup, key) => {
    // 확장자가 다르면 다른 파일로 간주 (선택적)
    const extGroups = new Map();
    
    fileGroup.forEach(file => {
      const ext = file.extension?.toLowerCase() || 'no-ext';
      if (!extGroups.has(ext)) {
        extGroups.set(ext, []);
      }
      extGroups.get(ext).push(file);
    });

    extGroups.forEach((files, ext) => {
      if (files.length > 1) {
        // 중복 그룹 생성
        const group = {
          id: `${key}_${ext}`,
          name: files[0].name,
          extension: ext === 'no-ext' ? null : ext,
          size: files[0].size || 0,
          count: files.length,
          files: files.map(file => ({
            ...file,
            isDuplicate: true
          }))
        };

        duplicateGroups.push(group);
        
        // 중복 파일들을 Set에 추가
        files.forEach(file => {
          duplicateFiles.add(file.path);
        });
      }
    });
  });

  console.log('🔍 [Duplicate Detection] Final results:', {
    groups: duplicateGroups.length,
    totalDuplicates: duplicateFiles.size,
    duplicateGroups: duplicateGroups.map(g => ({ name: g.name, count: g.count }))
  });

  return {
    duplicateGroups,
    duplicateFiles,
    duplicateCount: duplicateFiles.size
  };
};

/**
 * 파일이 중복인지 확인합니다
 * @param {Object} file - 확인할 파일
 * @param {Set} duplicateFiles - 중복 파일 경로 Set
 * @returns {boolean} 중복 여부
 */
export const isDuplicateFile = (file, duplicateFiles) => {
  return duplicateFiles.has(file.path);
};

/**
 * 중복 파일 그룹에서 원본과 복사본을 구분합니다
 * @param {Array} duplicateGroup - 중복 파일 그룹
 * @returns {Object} 원본과 복사본 정보
 */
export const categorizeVersions = (duplicateGroup) => {
  if (!duplicateGroup || duplicateGroup.length === 0) {
    return { original: null, copies: [] };
  }

  // 가장 오래된 파일을 원본으로 간주
  const sortedByDate = [...duplicateGroup].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.modifiedAt);
    const dateB = new Date(b.createdAt || b.modifiedAt);
    return dateA - dateB;
  });

  return {
    original: sortedByDate[0],
    copies: sortedByDate.slice(1)
  };
};

/**
 * 중복 파일 통계를 계산합니다
 * @param {Array} duplicateGroups - 중복 그룹 배열
 * @returns {Object} 통계 정보
 */
export const getDuplicateStats = (duplicateGroups) => {
  if (!duplicateGroups || duplicateGroups.length === 0) {
    return {
      totalGroups: 0,
      totalFiles: 0,
      totalSize: 0,
      wastedSpace: 0
    };
  }

  let totalFiles = 0;
  let totalSize = 0;
  let wastedSpace = 0;

  duplicateGroups.forEach(group => {
    totalFiles += group.count;
    const groupSize = (group.size || 0) * group.count;
    totalSize += groupSize;
    // 낭비된 공간 = (복사본 수) × 파일 크기
    wastedSpace += (group.count - 1) * (group.size || 0);
  });

  return {
    totalGroups: duplicateGroups.length,
    totalFiles,
    totalSize,
    wastedSpace
  };
};