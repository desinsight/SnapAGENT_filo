import { parentPort, workerData } from 'worker_threads';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';

// 메시지 핸들러 설정
parentPort.on('message', async (message) => {
  try {
    let result;
    
    switch (message.type) {
      case 'organize_by_type':
        result = await organizeByType(message.data);
        break;
      case 'organize_by_date':
        result = await organizeByDate(message.data);
        break;
      case 'clean_duplicates':
        result = await cleanDuplicates(message.data);
        break;
      case 'clean_temporary':
        result = await cleanTemporary(message.data);
        break;
      case 'archive_old':
        result = await archiveOld(message.data);
        break;
      case 'rename_files':
        result = await renameFiles(message.data);
        break;
      default:
        throw new Error(`알 수 없는 작업 유형: ${message.type}`);
    }

    parentPort.postMessage({ success: true, result });
  } catch (error) {
    logger.error('작업 처리 실패:', error);
    parentPort.postMessage({ success: false, error: error.message });
  }
});

async function organizeByType({ path, options = {} }) {
  const {
    recursive = true,
    createFolders = true,
    moveFiles = true,
    fileTypes = []
  } = options;

  const stats = {
    processed: 0,
    moved: 0,
    errors: 0
  };

  const processFile = async (filePath) => {
    try {
      const ext = path.extname(filePath).toLowerCase().slice(1);
      if (!fileTypes.includes(ext)) return;

      const targetDir = path.join(path, ext.toUpperCase());
      if (createFolders) {
        await fs.mkdir(targetDir, { recursive: true });
      }

      if (moveFiles) {
        const fileName = path.basename(filePath);
        const targetPath = path.join(targetDir, fileName);
        await fs.rename(filePath, targetPath);
        stats.moved++;
      }

      stats.processed++;
    } catch (e) {
      logger.warn(`파일 정리 실패: ${filePath}`, e);
      stats.errors++;
    }
  };

  const processDirectory = async (dirPath) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (recursive) {
          await processDirectory(fullPath);
        }
      } else {
        await processFile(fullPath);
      }
    }
  };

  await processDirectory(path);
  return stats;
}

async function organizeByDate({ path, options = {} }) {
  const {
    recursive = true,
    createFolders = true,
    moveFiles = true,
    format = 'YYYY-MM'
  } = options;

  const stats = {
    processed: 0,
    moved: 0,
    errors: 0
  };

  const processFile = async (filePath) => {
    try {
      const stats = await fs.stat(filePath);
      const date = new Date(stats.mtime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      const targetDir = path.join(path, `${year}-${month}`);
      if (createFolders) {
        await fs.mkdir(targetDir, { recursive: true });
      }

      if (moveFiles) {
        const fileName = path.basename(filePath);
        const targetPath = path.join(targetDir, fileName);
        await fs.rename(filePath, targetPath);
        stats.moved++;
      }

      stats.processed++;
    } catch (e) {
      logger.warn(`파일 정리 실패: ${filePath}`, e);
      stats.errors++;
    }
  };

  const processDirectory = async (dirPath) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (recursive) {
          await processDirectory(fullPath);
        }
      } else {
        await processFile(fullPath);
      }
    }
  };

  await processDirectory(path);
  return stats;
}

async function cleanDuplicates({ path, options = {} }) {
  const {
    recursive = true,
    minSize = 1024,
    algorithm = 'sha256',
    keepNewest = true
  } = options;

  const stats = {
    processed: 0,
    removed: 0,
    errors: 0
  };

  const fileHashes = new Map();
  const duplicates = new Map();

  const processFile = async (filePath) => {
    try {
      const fileStats = await fs.stat(filePath);
      if (fileStats.size < minSize) return;

      const hash = await calculateHash(filePath, algorithm);
      if (fileHashes.has(hash)) {
        if (!duplicates.has(hash)) {
          duplicates.set(hash, [fileHashes.get(hash)]);
        }
        duplicates.get(hash).push(filePath);
      } else {
        fileHashes.set(hash, filePath);
      }

      stats.processed++;
    } catch (e) {
      logger.warn(`중복 파일 검색 실패: ${filePath}`, e);
      stats.errors++;
    }
  };

  const processDirectory = async (dirPath) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (recursive) {
          await processDirectory(fullPath);
        }
      } else {
        await processFile(fullPath);
      }
    }
  };

  await processDirectory(path);

  // 중복 파일 정리
  for (const [hash, files] of duplicates.entries()) {
    if (keepNewest) {
      // 가장 최근 파일만 유지
      const sortedFiles = await Promise.all(
        files.map(async file => ({
          file,
          mtime: (await fs.stat(file)).mtime
        }))
      );
      sortedFiles.sort((a, b) => b.mtime - a.mtime);
      
      for (let i = 1; i < sortedFiles.length; i++) {
        await fs.unlink(sortedFiles[i].file);
        stats.removed++;
      }
    } else {
      // 가장 오래된 파일만 유지
      const sortedFiles = await Promise.all(
        files.map(async file => ({
          file,
          mtime: (await fs.stat(file)).mtime
        }))
      );
      sortedFiles.sort((a, b) => a.mtime - b.mtime);
      
      for (let i = 1; i < sortedFiles.length; i++) {
        await fs.unlink(sortedFiles[i].file);
        stats.removed++;
      }
    }
  }

  return stats;
}

async function cleanTemporary({ path, options = {} }) {
  const {
    recursive = true,
    patterns = [
      '*.tmp', '*.temp', '*.bak', '*.old',
      '~*', '*.swp', '*.swo', '*.log'
    ],
    minAge = 7 * 24 * 60 * 60 * 1000 // 7일
  } = options;

  const stats = {
    processed: 0,
    removed: 0,
    errors: 0
  };

  const processFile = async (filePath) => {
    try {
      const stats = await fs.stat(filePath);
      const age = Date.now() - stats.mtime.getTime();
      
      if (age < minAge) return;

      const fileName = path.basename(filePath);
      const shouldRemove = patterns.some(pattern => {
        if (pattern.startsWith('*')) {
          return fileName.endsWith(pattern.slice(1));
        } else if (pattern.endsWith('*')) {
          return fileName.startsWith(pattern.slice(0, -1));
        } else {
          return fileName === pattern;
        }
      });

      if (shouldRemove) {
        await fs.unlink(filePath);
        stats.removed++;
      }

      stats.processed++;
    } catch (e) {
      logger.warn(`임시 파일 정리 실패: ${filePath}`, e);
      stats.errors++;
    }
  };

  const processDirectory = async (dirPath) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (recursive) {
          await processDirectory(fullPath);
        }
      } else {
        await processFile(fullPath);
      }
    }
  };

  await processDirectory(path);
  return stats;
}

async function archiveOld({ path, options = {} }) {
  const {
    recursive = true,
    minAge = 30 * 24 * 60 * 60 * 1000, // 30일
    archiveDir = 'archive',
    compress = true
  } = options;

  const stats = {
    processed: 0,
    archived: 0,
    errors: 0
  };

  const processFile = async (filePath) => {
    try {
      const stats = await fs.stat(filePath);
      const age = Date.now() - stats.mtime.getTime();
      
      if (age < minAge) return;

      const archivePath = path.join(path, archiveDir);
      await fs.mkdir(archivePath, { recursive: true });

      const fileName = path.basename(filePath);
      const targetPath = path.join(archivePath, fileName);

      if (compress) {
        // TODO: 파일 압축 구현
        await fs.rename(filePath, targetPath);
      } else {
        await fs.rename(filePath, targetPath);
      }

      stats.archived++;
      stats.processed++;
    } catch (e) {
      logger.warn(`파일 아카이빙 실패: ${filePath}`, e);
      stats.errors++;
    }
  };

  const processDirectory = async (dirPath) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (recursive) {
          await processDirectory(fullPath);
        }
      } else {
        await processFile(fullPath);
      }
    }
  };

  await processDirectory(path);
  return stats;
}

async function renameFiles({ path, pattern, options = {} }) {
  const {
    recursive = true,
    useRegex = false,
    caseSensitive = false
  } = options;

  const stats = {
    processed: 0,
    renamed: 0,
    errors: 0
  };

  const processFile = async (filePath) => {
    try {
      const fileName = path.basename(filePath);
      const dirName = path.dirname(filePath);
      
      let newName;
      if (useRegex) {
        const regex = new RegExp(pattern, caseSensitive ? '' : 'i');
        newName = fileName.replace(regex, '');
      } else {
        newName = fileName.replace(pattern, '');
      }

      if (newName !== fileName) {
        const newPath = path.join(dirName, newName);
        await fs.rename(filePath, newPath);
        stats.renamed++;
      }

      stats.processed++;
    } catch (e) {
      logger.warn(`파일명 변경 실패: ${filePath}`, e);
      stats.errors++;
    }
  };

  const processDirectory = async (dirPath) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (recursive) {
          await processDirectory(fullPath);
        }
      } else {
        await processFile(fullPath);
      }
    }
  };

  await processDirectory(path);
  return stats;
}

async function calculateHash(filePath, algorithm = 'sha256') {
  try {
    const hash = createHash(algorithm);
    const stream = fs.createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  } catch (error) {
    logger.error('파일 해시 계산 실패:', error);
    throw error;
  }
} 