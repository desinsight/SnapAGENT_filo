import fs from 'fs/promises';
import path from 'path';

/**
 * 지정한 디렉토리 내 파일을 확장자별로 폴더를 만들어 정리합니다.
 * @param {string} targetDir - 정리할 디렉토리 경로
 * @param {Object} options - 옵션 (recursive: 하위 폴더 포함 여부)
 */
export async function organizeByExtension(targetDir, options = { recursive: false }) {
  try {
    console.log('🔧 확장자별 정리 시작:', { targetDir, options });
    
    if (options.recursive) {
      console.log('📁 하위 폴더 포함 모드: 모든 파일을 루트로 수집 중...');
      // 하위 폴더 포함 시: 모든 파일을 현재 폴더로 이동
      await collectAllFilesToRoot(targetDir);
      console.log('✅ 파일 수집 완료');
    }
    
    console.log('📂 확장자별 정리 시작...');
    // 현재 폴더의 파일들을 확장자별로 정리
    await organizeFilesByExtension(targetDir);
    console.log('✅ 확장자별 정리 완료');
    
    return { success: true };
  } catch (error) {
    console.error('❌ 확장자별 정리 중 오류:', error);
    throw error;
  }
}

/**
 * 모든 하위 폴더의 파일들을 루트 폴더로 수집
 * @param {string} rootDir - 루트 폴더 경로
 */
async function collectAllFilesToRoot(rootDir) {
  console.log('📁 모든 파일 수집 시작:', rootDir);
  
  // 1단계: 모든 파일 경로 수집
  const allFiles = await getAllFilesRecursively(rootDir);
  console.log(`📋 총 ${allFiles.length}개 파일 발견`);
  
  // 2단계: 루트 폴더가 아닌 파일들을 루트로 이동
  let movedCount = 0;
  for (const filePath of allFiles) {
    if (path.dirname(filePath) !== rootDir) {
      console.log(`📦 파일 이동: ${filePath} → ${rootDir}`);
      await moveFileToRoot(filePath, rootDir);
      movedCount++;
    }
  }
  console.log(`📦 총 ${movedCount}개 파일 이동 완료`);
  
  // 3단계: 빈 하위 폴더들 삭제
  console.log('🗑️ 빈 폴더 삭제 중...');
  await removeEmptyDirectories(rootDir);
  console.log('✅ 빈 폴더 삭제 완료');
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
 * 파일을 루트 폴더로 이동 (중복 시 이름 변경)
 * @param {string} filePath - 파일 경로
 * @param {string} rootDir - 루트 폴더 경로
 */
async function moveFileToRoot(filePath, rootDir) {
  const fileName = path.basename(filePath);
  let destPath = path.join(rootDir, fileName);
  let counter = 1;
  
  // 파일명 중복 시 숫자 추가
  while (await fileExists(destPath)) {
    const ext = path.extname(fileName);
    const nameWithoutExt = path.basename(fileName, ext);
    destPath = path.join(rootDir, `${nameWithoutExt}_${counter}${ext}`);
    counter++;
  }
  
  await fs.rename(filePath, destPath);
}

/**
 * 빈 디렉토리들 삭제
 * @param {string} dir - 디렉토리 경로
 */
async function removeEmptyDirectories(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // 재귀적으로 하위 폴더 처리
      await removeEmptyDirectories(fullPath);
      
      // 빈 폴더 삭제
      try {
        await fs.rmdir(fullPath);
      } catch (error) {
        // 폴더가 비어있지 않으면 무시
      }
    }
  }
}

/**
 * 현재 폴더의 파일들을 확장자별로 정리
 * @param {string} targetDir - 대상 폴더 경로
 */
async function organizeFilesByExtension(targetDir) {
  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  const filesToMove = [];
  
  // 파일 목록 수집 (폴더는 제외)
  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name);
    if (!entry.isDirectory()) {
      filesToMove.push(fullPath);
    }
  }
  
  // 파일들을 확장자별로 이동
  for (const filePath of filesToMove) {
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).slice(1).toLowerCase() || 'no_extension';
    const destDir = path.join(targetDir, ext);
    await fs.mkdir(destDir, { recursive: true });
    const destPath = path.join(destDir, fileName);
    await fs.rename(filePath, destPath);
  }
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