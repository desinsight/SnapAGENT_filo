import fs from 'fs/promises';
import path from 'path';

// 기본 임시파일 확장자/패턴 목록
const TEMP_EXTENSIONS = [
  'tmp', 'temp', 'bak', 'old', 'log', 'swp', 'swo', 'dmp', 'cache', 'ds_store', 'thumbs.db',
  'crdownload', 'part', 'tempfile'
];
const TEMP_PREFIXES = ['~$', '~'];

/**
 * 임시파일 정리 (임시파일을 _temp_files_to_review 폴더로 이동)
 * @param {string} targetDir - 정리할 디렉토리 경로
 * @param {Object} options - 옵션 (recursive: 하위 폴더 포함 여부)
 */
export async function organizeByTemp(targetDir, options = { recursive: false }) {
  try {
    const tempFiles = await findTempFiles(targetDir, options.recursive);
    if (tempFiles.length === 0) {
      console.log('✅ 임시파일 없음');
      return { success: true, moved: 0 };
    }
    const tempDir = path.join(targetDir, '_temp_files_to_review');
    await fs.mkdir(tempDir, { recursive: true });
    let moved = 0;
    for (const filePath of tempFiles) {
      const fileName = path.basename(filePath);
      let destPath = path.join(tempDir, fileName);
      let counter = 1;
      while (await fileExists(destPath)) {
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        destPath = path.join(tempDir, `${nameWithoutExt}_${counter}${ext}`);
        counter++;
      }
      await fs.rename(filePath, destPath);
      moved++;
      console.log(`📦 임시파일 이동: ${filePath} → ${destPath}`);
    }
    return { success: true, moved };
  } catch (error) {
    console.error('❌ 임시파일 정리 오류:', error);
    throw error;
  }
}

/**
 * 임시파일 찾기
 * @param {string} dir - 탐색할 폴더
 * @param {boolean} recursive - 하위 폴더 포함 여부
 * @returns {Promise<string[]>} 임시파일 경로 배열
 */
async function findTempFiles(dir, recursive = false) {
  let tempFiles = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        tempFiles = tempFiles.concat(await findTempFiles(fullPath, true));
      }
      continue;
    }
    if (isTempFile(entry.name)) {
      tempFiles.push(fullPath);
    }
  }
  return tempFiles;
}

/**
 * 임시파일 여부 판별
 * @param {string} fileName - 파일명
 * @returns {boolean}
 */
function isTempFile(fileName) {
  const lower = fileName.toLowerCase();
  // 확장자 체크
  for (const ext of TEMP_EXTENSIONS) {
    if (lower.endsWith('.' + ext)) return true;
  }
  // 접두사 체크
  for (const prefix of TEMP_PREFIXES) {
    if (lower.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * 파일 존재 여부 확인
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
} 