import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { addFileToIndex, removeFileFromIndex, updateFileInIndex, getIndexedPaths } from './indexer.js';

let watchers = new Map(); // 경로별 watcher 관리

/**
 * 모든 인덱싱된 경로에 대한 감시 시작
 */
function startWatchingAll() {
  const paths = getIndexedPaths();
  paths.forEach(path => {
    startWatching(path);
  });
}

/**
 * 지정 폴더(및 하위 폴더) 변경 감지 시작
 * @param {string} rootDir
 */
function startWatching(rootDir) {
  // 이미 감시 중인 경로는 중지 후 재시작
  if (watchers.has(rootDir)) {
    stopWatching(rootDir);
  }

  const watcher = chokidar.watch(rootDir, {
    persistent: true,
    ignoreInitial: true,
    depth: Infinity,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', filePath => {
      try {
        const stat = fs.statSync(filePath);
        addFileToIndex(filePath, stat);
        console.log(`파일 추가 감지: ${filePath}`);
      } catch (error) {
        console.warn(`파일 추가 처리 실패: ${filePath}`, error.message);
      }
    })
    .on('unlink', filePath => {
      removeFileFromIndex(filePath);
      console.log(`파일 삭제 감지: ${filePath}`);
    })
    .on('change', filePath => {
      try {
        const stat = fs.statSync(filePath);
        updateFileInIndex(filePath, stat);
        console.log(`파일 변경 감지: ${filePath}`);
      } catch (error) {
        console.warn(`파일 변경 처리 실패: ${filePath}`, error.message);
      }
    })
    .on('addDir', dirPath => {
      console.log(`디렉토리 추가 감지: ${dirPath}`);
    })
    .on('unlinkDir', dirPath => {
      console.log(`디렉토리 삭제 감지: ${dirPath}`);
    })
    .on('error', (error) => {
      console.warn(`Watcher 오류 (${rootDir}):`, error.message);
      // 에러 무시, 서버 다운 방지
    })
    .on('ready', () => {
      console.log(`감시 시작됨: ${rootDir}`);
    });

  watchers.set(rootDir, watcher);
}

/**
 * 특정 경로의 감시 중지
 * @param {string} rootDir
 */
function stopWatching(rootDir) {
  const watcher = watchers.get(rootDir);
  if (watcher) {
    watcher.close();
    watchers.delete(rootDir);
    console.log(`감시 중지됨: ${rootDir}`);
  }
}

/**
 * 모든 감시 중지
 */
function stopAllWatching() {
  watchers.forEach((watcher, path) => {
    watcher.close();
    console.log(`감시 중지됨: ${path}`);
  });
  watchers.clear();
}

/**
 * 현재 감시 중인 경로들 반환
 */
function getWatchedPaths() {
  return Array.from(watchers.keys());
}

/**
 * 감시 상태 확인
 */
function isWatching(path) {
  return watchers.has(path);
}

export {
  startWatching,
  startWatchingAll,
  stopWatching,
  stopAllWatching,
  getWatchedPaths,
  isWatching
}; 