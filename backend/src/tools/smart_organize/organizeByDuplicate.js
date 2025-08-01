import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * 지정한 디렉토리 내 중복 파일을 감지하고 정리합니다.
 * @param {string} targetDir - 정리할 디렉토리 경로
 * @param {Object} options - 옵션 (recursive: 하위 폴더 포함 여부)
 */
export async function organizeByDuplicate(targetDir, options = { recursive: false }) {
  try {
    console.log('🔍 중복 파일 정리 시작:', { targetDir, options });
    
    if (options.recursive) {
      console.log('📁 하위 폴더 포함 모드: 모든 폴더의 파일을 대상으로 중복 감지...');
      // 하위 폴더 포함 시: 모든 폴더의 파일을 대상으로 중복 감지
      await detectAndOrganizeDuplicatesRecursive(targetDir);
    } else {
      console.log('🔍 현재 폴더만 중복 감지 중...');
      // 현재 폴더만 중복 감지
      await detectAndOrganizeDuplicates(targetDir);
    }
    
    console.log('✅ 중복 파일 정리 완료');
    return { success: true };
  } catch (error) {
    console.error('❌ 중복 파일 정리 중 오류:', error);
    throw error;
  }
}

/**
 * 재귀적으로 모든 파일 경로 수집
 * @param {string} dir - 디렉토리 경로
 * @returns {Promise<string[]>} 모든 파일 경로 배열
 */
async function getAllFilesRecursively(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const subFiles = await getAllFilesRecursively(fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * 중복 파일 감지 및 정리 (현재 폴더만)
 * @param {string} targetDir - 대상 폴더 경로
 */
async function detectAndOrganizeDuplicates(targetDir) {
  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  const files = [];
  
  // 파일 목록 수집 (폴더는 제외)
  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name);
    if (!entry.isDirectory()) {
      files.push(fullPath);
    }
  }
  
  console.log(`📋 ${files.length}개 파일에서 중복 감지 시작`);
  
  // 1단계: 파일명 + 크기로 그룹화
  const sizeGroups = await groupBySize(files);
  console.log(`📊 크기별 그룹: ${Object.keys(sizeGroups).length}개 그룹`);
  
  // 2단계: 각 그룹에서 해시 비교
  const duplicates = await findDuplicatesByHash(sizeGroups);
  console.log(`🔍 중복 파일 그룹: ${duplicates.length}개 그룹 발견`);
  
  // 3단계: 중복 파일들을 정리 폴더로 이동
  if (duplicates.length > 0) {
    await organizeDuplicates(targetDir, duplicates);
  } else {
    console.log('✅ 중복 파일이 없습니다.');
  }
}

/**
 * 중복 파일 감지 및 정리 (하위 폴더 포함, 폴더 구조 유지)
 * @param {string} targetDir - 대상 폴더 경로
 */
async function detectAndOrganizeDuplicatesRecursive(targetDir) {
  // 1단계: 모든 파일 경로 수집 (폴더 구조 유지)
  const allFiles = await getAllFilesRecursively(targetDir);
  console.log(`📋 총 ${allFiles.length}개 파일에서 중복 감지 시작`);
  
  // 2단계: 파일명 + 크기로 그룹화
  const sizeGroups = await groupBySize(allFiles);
  console.log(`📊 크기별 그룹: ${Object.keys(sizeGroups).length}개 그룹`);
  
  // 3단계: 각 그룹에서 해시 비교
  const duplicates = await findDuplicatesByHash(sizeGroups);
  console.log(`🔍 중복 파일 그룹: ${duplicates.length}개 그룹 발견`);
  
  // 4단계: 중복 파일들을 정리 폴더로 이동 (폴더 구조 유지)
  if (duplicates.length > 0) {
    await organizeDuplicatesRecursive(targetDir, duplicates);
  } else {
    console.log('✅ 중복 파일이 없습니다.');
  }
}

/**
 * 파일들을 크기별로 그룹화
 * @param {string[]} files - 파일 경로 배열
 * @returns {Promise<Object>} 크기별 그룹화된 파일들
 */
async function groupBySize(files) {
  const sizeGroups = {};
  
  for (const filePath of files) {
    try {
      const stat = await fs.stat(filePath);
      const size = stat.size;
      
      if (!sizeGroups[size]) {
        sizeGroups[size] = [];
      }
      sizeGroups[size].push(filePath);
    } catch (error) {
      console.warn(`⚠️ 파일 정보 읽기 실패: ${filePath}`, error.message);
    }
  }
  
  // 크기가 1개인 그룹은 제거 (중복 가능성 없음)
  Object.keys(sizeGroups).forEach(size => {
    if (sizeGroups[size].length === 1) {
      delete sizeGroups[size];
    }
  });
  
  return sizeGroups;
}

/**
 * 크기별 그룹에서 해시를 비교하여 중복 찾기
 * @param {Object} sizeGroups - 크기별 그룹화된 파일들
 * @returns {Promise<Array>} 중복 파일 그룹들
 */
async function findDuplicatesByHash(sizeGroups) {
  const duplicates = [];
  
  for (const size in sizeGroups) {
    const files = sizeGroups[size];
    const hashGroups = {};
    
    // 각 파일의 해시 계산
    for (const filePath of files) {
      try {
        const hash = await calculateFileHash(filePath);
        
        if (!hashGroups[hash]) {
          hashGroups[hash] = [];
        }
        hashGroups[hash].push(filePath);
      } catch (error) {
        console.warn(`⚠️ 해시 계산 실패: ${filePath}`, error.message);
      }
    }
    
    // 해시가 2개 이상인 그룹만 중복으로 처리
    Object.values(hashGroups).forEach(group => {
      if (group.length > 1) {
        duplicates.push(group);
      }
    });
  }
  
  return duplicates;
}

/**
 * 파일의 MD5 해시 계산
 * @param {string} filePath - 파일 경로
 * @returns {Promise<string>} MD5 해시값
 */
async function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fsSync.createReadStream(filePath);
    
    stream.on('data', (data) => {
      hash.update(data);
    });
    
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 중복 파일들을 정리 폴더로 이동 (현재 폴더만)
 * @param {string} targetDir - 대상 폴더 경로
 * @param {Array} duplicates - 중복 파일 그룹들
 */
async function organizeDuplicates(targetDir, duplicates) {
  const duplicatesDir = path.join(targetDir, '_duplicates_to_review');
  await fs.mkdir(duplicatesDir, { recursive: true });
  
  let totalMoved = 0;
  
  for (const group of duplicates) {
    // 첫 번째 파일은 원본으로 유지, 나머지는 중복 폴더로 이동
    const [original, ...duplicates] = group;
    
    for (let i = 0; i < duplicates.length; i++) {
      const duplicatePath = duplicates[i];
      const fileName = path.basename(duplicatePath);
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      
      // 중복 폴더로 이동 (파일명에 _duplicate 추가)
      const destPath = path.join(duplicatesDir, `${nameWithoutExt}_duplicate${i + 1}${ext}`);
      
      try {
        await fs.rename(duplicatePath, destPath);
        console.log(`📦 중복 파일 이동: ${duplicatePath} → ${destPath}`);
        totalMoved++;
      } catch (error) {
        console.warn(`⚠️ 중복 파일 이동 실패: ${duplicatePath}`, error.message);
      }
    }
  }
  
  console.log(`📦 총 ${totalMoved}개 중복 파일을 ${duplicatesDir}로 이동 완료`);
}

/**
 * 중복 파일들을 정리 폴더로 이동 (하위 폴더 포함, 폴더 구조 유지)
 * @param {string} targetDir - 대상 폴더 경로
 * @param {Array} duplicates - 중복 파일 그룹들
 */
async function organizeDuplicatesRecursive(targetDir, duplicates) {
  const duplicatesDir = path.join(targetDir, '_duplicates_to_review');
  await fs.mkdir(duplicatesDir, { recursive: true });
  
  let totalMoved = 0;
  
  for (const group of duplicates) {
    // 첫 번째 파일은 원본으로 유지, 나머지는 중복 폴더로 이동
    const [original, ...duplicates] = group;
    
    for (let i = 0; i < duplicates.length; i++) {
      const duplicatePath = duplicates[i];
      const fileName = path.basename(duplicatePath);
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      
      // 중복 파일의 상대 경로 계산
      const relativePath = path.relative(targetDir, path.dirname(duplicatePath));
      const sourceFolder = relativePath === '' ? 'root' : relativePath.replace(/[\\/]/g, '_');
      
      // 중복 폴더로 이동 (폴더 정보 포함)
      const destPath = path.join(duplicatesDir, `${sourceFolder}_${nameWithoutExt}_duplicate${i + 1}${ext}`);
      
      try {
        await fs.rename(duplicatePath, destPath);
        console.log(`📦 중복 파일 이동: ${duplicatePath} → ${destPath}`);
        totalMoved++;
      } catch (error) {
        console.warn(`⚠️ 중복 파일 이동 실패: ${duplicatePath}`, error.message);
      }
    }
  }
  
  console.log(`📦 총 ${totalMoved}개 중복 파일을 ${duplicatesDir}로 이동 완료`);
}

/**
 * 파일 존재 여부 확인
 * @param {string} filePath - 파일 경로
 * @returns {Promise<boolean>} 파일 존재 여부
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
} 