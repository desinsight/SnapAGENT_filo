import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * 대용량 파일 정리 (지정 용량 이상 파일을 ZIP으로 압축, 원본은 별도 폴더로 이동)
 * @param {string} targetDir - 정리할 디렉토리 경로
 * @param {Object} options - 옵션 (recursive: 하위 폴더 포함, sizeThreshold: 바이트)
 */
export async function organizeBySize(targetDir, options = { recursive: false, sizeThreshold: 100 * 1024 * 1024 }) {
  try {
    const { recursive, sizeThreshold } = options;
    // 1. 대용량 파일 목록 수집
    const largeFiles = await findLargeFiles(targetDir, recursive, sizeThreshold);
    if (largeFiles.length === 0) {
      console.log('✅ 대용량 파일 없음');
      return { success: true, zipped: 0 };
    }
    // 2. ZIP 파일 생성
    const zipName = `LargeFiles_${getNowString()}.zip`;
    const zipPath = path.join(targetDir, zipName);
    await zipFiles(largeFiles, zipPath);
    console.log(`✅ ZIP 파일 생성: ${zipPath}`);
    // 3. 원본 파일 이동
    const reviewDir = path.join(targetDir, '_large_files_to_review');
    await fs.mkdir(reviewDir, { recursive: true });
    let moved = 0;
    for (const filePath of largeFiles) {
      const fileName = path.basename(filePath);
      let destPath = path.join(reviewDir, fileName);
      let counter = 1;
      while (await fileExists(destPath)) {
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        destPath = path.join(reviewDir, `${nameWithoutExt}_${counter}${ext}`);
        counter++;
      }
      await fs.rename(filePath, destPath);
      moved++;
      console.log(`📦 대용량 파일 이동: ${filePath} → ${destPath}`);
    }
    return { success: true, zipped: largeFiles.length, zipPath };
  } catch (error) {
    console.error('❌ 대용량 파일 정리 오류:', error);
    throw error;
  }
}

/**
 * 대용량 파일 찾기
 */
async function findLargeFiles(dir, recursive, sizeThreshold) {
  let largeFiles = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        largeFiles = largeFiles.concat(await findLargeFiles(fullPath, true, sizeThreshold));
      }
      continue;
    }
    try {
      const stat = await fs.stat(fullPath);
      if (stat.size >= sizeThreshold) {
        largeFiles.push(fullPath);
      }
    } catch {}
  }
  return largeFiles;
}

/**
 * 파일들을 ZIP으로 압축
 */
async function zipFiles(filePaths, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fsSync.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    for (const filePath of filePaths) {
      archive.file(filePath, { name: path.basename(filePath) });
    }
    archive.finalize();
  });
}

function getNowString() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
} 