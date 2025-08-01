import express from 'express';
import path from 'path';
import { buildIndex, getIndex, getIndexedPaths, getPathMetadata, saveAllData, loadAllData, removePathsFromIndex, pauseIndexing, resumeIndexing, cancelIndexing, getIndexingStatus } from './indexer.js';
import { searchFiles } from './searchEngine.js';
import { startWatching, startWatchingAll, stopWatching, stopAllWatching, getWatchedPaths, isWatching } from './watcher.js';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 서버 시작 시 기존 인덱스 로드 및 감시 시작
loadAllData();
startWatchingAll();

/**
 * @route POST /tools/ultra-fast-search/index
 * @desc 지정 경로 인덱싱 + 실시간 감시 시작
 * @body { rootDir }
 */
router.post('/index', async (req, res) => {
  const { rootDir } = req.body;
  console.log(`🚀🚀🚀 인덱싱 API 호출됨!!! ${rootDir}`);
  
  if (!rootDir) {
    return res.status(400).json({ success: false, message: 'rootDir 파라미터 필요' });
  }
  try {
    console.log(`🔥🔥🔥 buildIndex 호출 직전!!!`);
    
    // 비동기로 인덱싱 실행 (백그라운드에서)
    buildIndex(rootDir).then(() => {
      console.log(`✅✅✅ 인덱싱 완료: ${rootDir}`);
    }).catch((error) => {
      console.error(`❌❌❌ 인덱싱 에러: ${rootDir}`, error);
    });
    
    startWatching(rootDir);
    
    // 즉시 응답 (인덱싱은 백그라운드에서 계속)
    res.json({ 
      success: true, 
      message: '인덱싱 및 감시 시작', 
      total: getIndex().length,
      indexedPaths: getIndexedPaths().length
    });
    
    console.log(`✅✅✅ API 응답 완료, 인덱싱은 백그라운드에서 진행 중`);
  } catch (e) {
    console.error(`❌❌❌ 인덱싱 시작 에러:`, e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @route GET /tools/ultra-fast-search/info
 * @desc 인덱스 정보 조회 (경로별 통계)
 */
router.get('/info', (req, res) => {
  try {
    const index = getIndex();
    const indexedPaths = getIndexedPaths();
    const pathMetadata = getPathMetadata();
    const watchedPaths = getWatchedPaths();

    if (indexedPaths.length === 0) {
      return res.json({
        success: true,
        indexedPaths: [],
        totalFiles: 0,
        totalSize: '0 B',
        watchedPaths: []
      });
    }

    // 경로별 정보를 배열로 변환 (객체 배열)
    const pathsInfo = indexedPaths.map((path, index) => {
      const metadata = pathMetadata[path] || {};
      return {
        id: path, // path를 id로 사용
        path: path,
        fileCount: metadata.fileCount || 0,
        size: formatBytes(metadata.totalSize || 0),
        lastUpdated: metadata.lastUpdated || new Date().toISOString(),
        status: metadata.status || 'active',
        isWatching: isWatching(path)
      };
    });

    // 전체 통계 계산
    const totalFiles = index.length;
    const totalSize = formatBytes(index.reduce((sum, file) => sum + file.size, 0));

    res.json({
      success: true,
      indexedPaths: pathsInfo, // 반드시 객체 배열로 내려줌
      totalFiles,
      totalSize,
      watchedPaths
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @route DELETE /tools/ultra-fast-search/remove
 * @desc 특정 경로의 인덱스 삭제
 * @body { paths: [경로1, 경로2, ...] }
 */
router.delete('/remove', (req, res) => {
  const { paths } = req.body;
  if (!paths || !Array.isArray(paths)) {
    return res.status(400).json({ success: false, message: 'paths 배열 필요' });
  }

  try {
    const originalCount = getIndex().length;
    
    // 감시 중지
    paths.forEach(path => stopWatching(path));
    
    // 실제 인덱스에서 삭제
    removePathsFromIndex(paths);
    
    const newCount = getIndex().length;
    res.json({ 
      success: true, 
      message: `${paths.length}개 경로의 인덱스가 삭제되었습니다.`,
      removedCount: originalCount - newCount
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @route POST /tools/ultra-fast-search/save
 * @desc 인덱스 파일로 저장
 */
router.post('/save', (req, res) => {
  try {
    saveAllData();
    res.json({ success: true, message: '인덱스 파일 저장 완료' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @route POST /tools/ultra-fast-search/load
 * @desc 인덱스 파일에서 불러오기 + 감시 재시작
 */
router.post('/load', (req, res) => {
  try {
    const success = loadAllData();
    if (!success) {
      return res.status(404).json({ success: false, message: '인덱스 파일 없음' });
    }
    
    // 모든 경로에 대해 감시 재시작
    startWatchingAll();
    
    res.json({ 
      success: true, 
      message: '인덱스 파일 불러오기 및 감시 시작', 
      total: getIndex().length,
      indexedPaths: getIndexedPaths().length
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @route GET /tools/ultra-fast-search
 * @desc 파일 초고속 검색 (이름, 확장자, 날짜 등)
 * @query name, ext, from, to 등
 */
router.get('/', async (req, res) => {
  if (!getIndex().length) {
    return res.status(400).json({ success: false, message: '먼저 인덱싱을 수행하세요.' });
  }
  const results = searchFiles(req.query);
  res.json({
    success: true,
    total: results.length,
    results
  });
});

/**
 * @route POST /tools/ultra-fast-search/watch/start
 * @desc 특정 경로 감시 시작
 * @body { path }
 */
router.post('/watch/start', (req, res) => {
  const { path } = req.body;
  if (!path) {
    return res.status(400).json({ success: false, message: 'path 파라미터 필요' });
  }
  
  try {
    if (!getIndexedPaths().includes(path)) {
      return res.status(400).json({ success: false, message: '인덱싱되지 않은 경로입니다.' });
    }
    
    startWatching(path);
    res.json({ success: true, message: '감시 시작됨' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @route POST /tools/ultra-fast-search/watch/stop
 * @desc 특정 경로 감시 중지
 * @body { path }
 */
router.post('/watch/stop', (req, res) => {
  const { path } = req.body;
  if (!path) {
    return res.status(400).json({ success: false, message: 'path 파라미터 필요' });
  }
  
  try {
    stopWatching(path);
    res.json({ success: true, message: '감시 중지됨' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @route GET /tools/ultra-fast-search/watch/status
 * @desc 감시 상태 조회
 */
router.get('/watch/status', (req, res) => {
  try {
    const indexedPaths = getIndexedPaths();
    const watchedPaths = getWatchedPaths();
    
    const status = indexedPaths.map(path => ({
      path,
      isWatching: isWatching(path)
    }));
    
    res.json({
      success: true,
      status,
      totalIndexed: indexedPaths.length,
      totalWatched: watchedPaths.length
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @route POST /tools/ultra-fast-search/pause
 * @desc 인덱싱 일시정지
 */
router.post('/pause', (req, res) => {
  try {
    const success = pauseIndexing();
    if (success) {
      res.json({ success: true, message: '인덱싱이 일시정지되었습니다.' });
    } else {
      res.status(400).json({ success: false, message: '진행 중인 인덱싱이 없습니다.' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @route POST /tools/ultra-fast-search/resume
 * @desc 인덱싱 재개
 */
router.post('/resume', (req, res) => {
  try {
    const success = resumeIndexing();
    if (success) {
      res.json({ success: true, message: '인덱싱이 재개되었습니다.' });
    } else {
      res.status(400).json({ success: false, message: '일시정지된 인덱싱이 없습니다.' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @route POST /tools/ultra-fast-search/cancel
 * @desc 인덱싱 취소
 */
router.post('/cancel', (req, res) => {
  try {
    const success = cancelIndexing();
    if (success) {
      res.json({ success: true, message: '인덱싱이 취소되었습니다.' });
    } else {
      res.status(400).json({ success: false, message: '진행 중인 인덱싱이 없습니다.' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @route GET /tools/ultra-fast-search/status
 * @desc 인덱싱 상태 조회
 */
router.get('/status', (req, res) => {
  try {
    const status = getIndexingStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 유틸 함수
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default router; 