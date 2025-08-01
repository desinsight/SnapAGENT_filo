import { parentPort, workerData } from 'worker_threads';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';

// 워커 메시지 처리
parentPort.on('message', async (message) => {
  try {
    const { type, data } = message;
    let result;

    switch (type) {
      case 'read_file':
        result = await readFile(data);
        break;
      case 'write_file':
        result = await writeFile(data);
        break;
      case 'copy_file':
        result = await copyFile(data);
        break;
      case 'move_file':
        result = await moveFile(data);
        break;
      case 'delete_file':
        result = await deleteFile(data);
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

// 파일 읽기
async function readFile({ path, encoding = 'utf8' }) {
  const content = await fs.readFile(path, encoding);
  const stats = await fs.stat(path);
  return {
    content,
    size: stats.size,
    modified: stats.mtime.toISOString()
  };
}

// 파일 쓰기
async function writeFile({ path, content, encoding = 'utf8' }) {
  await fs.writeFile(path, content, encoding);
  const stats = await fs.stat(path);
  return {
    size: stats.size,
    modified: stats.mtime.toISOString()
  };
}

// 파일 복사
async function copyFile({ source, target }) {
  await fs.copyFile(source, target);
  const stats = await fs.stat(target);
  return {
    size: stats.size,
    modified: stats.mtime.toISOString()
  };
}

// 파일 이동
async function moveFile({ source, target }) {
  await fs.rename(source, target);
  const stats = await fs.stat(target);
  return {
    size: stats.size,
    modified: stats.mtime.toISOString()
  };
}

// 파일 삭제
async function deleteFile({ path }) {
  await fs.unlink(path);
  return { success: true };
}

// 파일 해시 계산
async function calculateHash({ path }) {
  const hash = createHash('sha256');
  const stream = fs.createReadStream(path);
  
  return new Promise((resolve, reject) => {
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
} 