import fs from 'fs/promises';
import path from 'path';

/**
 * 지정한 디렉토리 내 파일을 수정일(혹은 생성일) 기준으로 연-월별 폴더를 만들어 정리합니다.
 * @param {string} targetDir - 정리할 디렉토리 경로
 * @param {Object} options - 옵션 (recursive: 하위 폴더 포함 여부)
 */
export async function organizeByDate(targetDir, options = { recursive: false }) {
  try {
    if (options.recursive) {
      // 하위 폴더 포함 시: 모든 파일을 현재 폴더로 이동
      await collectAllFilesToRoot(targetDir);
    }
    
    // 현재 폴더의 파일들을 날짜별로 정리
    await organizeFilesByDate(targetDir);
    
    return { success: true };
  } catch (error) {
    throw error;
  }
}

/**
 * 모든 하위 폴더의 파일들을 루트 폴더로 수집
 * @param {string} rootDir - 루트 폴더 경로
 */
async function collectAllFilesToRoot(rootDir) {
  // 1단계: 모든 파일 경로 수집
  const allFiles = await getAllFilesRecursively(rootDir);
  
  // 2단계: 루트 폴더가 아닌 파일들을 루트로 이동
  for (const filePath of allFiles) {
    if (path.dirname(filePath) !== rootDir) {
      await moveFileToRoot(filePath, rootDir);
    }
  }
  
  // 3단계: 빈 하위 폴더들 삭제
  await removeEmptyDirectories(rootDir);
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
 * 현재 폴더의 파일들을 날짜별로 정리
 * @param {string} targetDir - 대상 폴더 경로
 */
async function organizeFilesByDate(targetDir) {
  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  const filesToMove = [];
  
  // 파일 목록 수집 (폴더는 제외)
  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name);
    if (!entry.isDirectory()) {
      filesToMove.push(fullPath);
    }
  }
  
  // 파일들을 날짜별로 이동
  for (const filePath of filesToMove) {
    const fileName = path.basename(filePath);
    // 파일의 수정일(없으면 생성일) 기준 연-월 폴더명 생성
    const stat = await fs.stat(filePath);
    const date = stat.mtime || stat.ctime;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const destDir = path.join(targetDir, `${year}-${month}`);
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