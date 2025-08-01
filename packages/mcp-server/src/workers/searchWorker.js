import { parentPort, workerData } from 'worker_threads';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';
import pLimit from 'p-limit';

// 워커 메시지 처리
parentPort.on('message', async (message) => {
  try {
    const { type, data } = message;
    let result;

    switch (type) {
      case 'search_files':
        result = await searchFiles(data);
        break;
      case 'search_content':
        result = await searchContent(data);
        break;
      case 'find_duplicates':
        result = await findDuplicates(data);
        break;
      case 'find_empty':
        result = await findEmpty(data);
        break;
      case 'calculate_hash':
        result = await calculateHash(data);
        break;
      default:
        throw new Error(`알 수 없는 작업 유형: ${type}`);
    }

    parentPort.postMessage({ success: true, result });
  } catch (error) {
    logger.error('워커 작업 실패:', error);
    parentPort.postMessage({ success: false, error: error.message });
  }
});

// 동시성 제한: 한 번에 8개 파일/폴더만 처리
const limit = pLimit(8);

// 파일 검색
async function searchFiles({ query, options = {} }) {
  const {
    path = '.',
    recursive = true,
    caseSensitive = false,
    useRegex = false,
    fileTypes = [],
    minSize,
    maxSize,
    modifiedAfter,
    modifiedBefore
  } = options;

  const results = [];
  const searchRegex = useRegex ? new RegExp(query, caseSensitive ? '' : 'i') : null;
  const searchPattern = caseSensitive ? query : query.toLowerCase();

  const processDirectory = async (dirPath) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    await Promise.all(entries.map(entry => limit(async () => {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const stats = await fs.stat(fullPath);
        // 파일 타입 필터링
        if (fileTypes.length > 0) {
          const ext = path.extname(entry.name).toLowerCase().slice(1);
          if (!fileTypes.includes(ext)) return;
        }
        // 크기 필터링
        if (minSize && stats.size < minSize) return;
        if (maxSize && stats.size > maxSize) return;
        // 수정 날짜 필터링
        if (modifiedAfter && stats.mtime < new Date(modifiedAfter)) return;
        if (modifiedBefore && stats.mtime > new Date(modifiedBefore)) return;
        // 이름 매칭
        const fileName = caseSensitive ? entry.name : entry.name.toLowerCase();
        const matches = useRegex ? searchRegex.test(fileName) : fileName.includes(searchPattern);
        if (matches) {
          results.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: stats.size,
            modified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString()
          });
        }
        if (recursive && entry.isDirectory()) {
          await processDirectory(fullPath);
        }
      } catch (e) {
        logger.warn(`파일 검색 실패: ${fullPath}`, e);
      }
    })));
  };

  await processDirectory(path);
  return results;
}

// 파일 내용 검색
async function searchContent({ query, options = {} }) {
  const {
    path = '.',
    recursive = true,
    caseSensitive = false,
    useRegex = false,
    fileTypes = ['txt', 'md', 'json', 'js', 'html', 'css'],
    encoding = 'utf8'
  } = options;

  const results = [];
  const searchRegex = useRegex ? new RegExp(query, caseSensitive ? '' : 'i') : null;
  const searchPattern = caseSensitive ? query : query.toLowerCase();

  const processFile = async (filePath) => {
    try {
      const content = await fs.readFile(filePath, encoding);
      const fileContent = caseSensitive ? content : content.toLowerCase();
      
      const matches = useRegex ? searchRegex.test(fileContent) : fileContent.includes(searchPattern);
      
      if (matches) {
        const stats = await fs.stat(filePath);
        results.push({
          name: path.basename(filePath),
          path: filePath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          matches: useRegex ? 
            [...fileContent.matchAll(searchRegex)].map(m => m[0]) :
            [query]
        });
      }
    } catch (e) {
      logger.warn(`파일 내용 검색 실패: ${filePath}`, e);
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
        const ext = path.extname(entry.name).toLowerCase().slice(1);
        if (fileTypes.includes(ext)) {
          await processFile(fullPath);
        }
      }
    }
  };

  await processDirectory(path);
  return results;
}

// 중복 파일 검색
async function findDuplicates({ path, options = {} }) {
  const {
    recursive = true,
    minSize = 1024, // 1KB
    algorithm = 'sha256'
  } = options;

  const fileHashes = new Map();
  const duplicates = new Map();

  const processFile = async (filePath) => {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size < minSize) return;

      const hash = await calculateHash({ path: filePath, algorithm });
      if (fileHashes.has(hash)) {
        if (!duplicates.has(hash)) {
          duplicates.set(hash, [fileHashes.get(filePath)]);
        }
        duplicates.get(hash).push(filePath);
      } else {
        fileHashes.set(hash, filePath);
      }
    } catch (e) {
      logger.warn(`중복 파일 검색 실패: ${filePath}`, e);
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

  return Array.from(duplicates.entries()).map(([hash, files]) => ({
    hash,
    files: files.map(file => ({
      path: file,
      size: fs.statSync(file).size
    }))
  }));
}

// 빈 파일/폴더 검색
async function findEmpty({ path }) {
  const emptyFiles = [];
  const emptyDirs = [];

  const processDirectory = async (dirPath) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    if (entries.length === 0) {
      emptyDirs.push(dirPath);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        if (stats.size === 0) {
          emptyFiles.push(fullPath);
        }
      }
    }
  };

  await processDirectory(path);

  return {
    emptyFiles,
    emptyDirs
  };
}

// 파일 해시 계산
async function calculateHash({ path, algorithm = 'sha256' }) {
  const hash = createHash(algorithm);
  const stream = fs.createReadStream(path);
  
  return new Promise((resolve, reject) => {
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
} 