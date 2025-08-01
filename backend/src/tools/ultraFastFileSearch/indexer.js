import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 인덱스 저장용 (메모리)
let fileIndex = [];
let indexedPaths = []; // 인덱싱된 경로들 관리
let indexMetadata = {}; // 경로별 메타데이터

// 인덱싱 상태 제어
let indexingState = {
  isIndexing: false,
  isPaused: false,
  isCanceled: false,
  currentPath: null,
  processedFiles: 0,
  totalFiles: 0
};

// 절대 경로로 설정 (backend 폴더 기준)
const INDEX_FILE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'ultra-fast-search', 'index.json');
const PATHS_FILE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'ultra-fast-search', 'indexed-paths.json');
const METADATA_FILE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'ultra-fast-search', 'metadata.json');

// 디렉토리 생성
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 지정한 폴더(및 하위 폴더) 전체를 스캔하여 파일 메타데이터 인덱싱
 * @param {string} rootDir - 시작 폴더 경로
 */
async function buildIndex(rootDir) {
  console.log(`🔍 인덱싱 시작: ${rootDir}`);
  console.log(`📍 경로 존재 여부: ${fs.existsSync(rootDir)}`);
  
  // 인덱싱 상태 초기화
  indexingState.isIndexing = true;
  indexingState.isPaused = false;
  indexingState.isCanceled = false;
  indexingState.currentPath = rootDir;
  indexingState.processedFiles = 0;
  indexingState.totalFiles = 0;
  
  console.log(`🚀 인덱싱 상태 설정 완료:`, indexingState);
  
  try {
    // 기존 인덱스에 추가 (덮어쓰지 않음)
    const newFiles = [];
    await scanDirAsync(rootDir, newFiles);
    
    // 취소된 경우에도 현재까지 처리된 것들 저장 후 중단
    if (indexingState.isCanceled) {
      console.log(`❌ 인덱싱 취소됨: ${rootDir}, 현재까지 처리된 ${newFiles.length}개 파일 저장 중...`);
      
      if (newFiles.length > 0) {
        // 기존 파일 중 같은 경로의 파일들 제거
        const beforeCount = fileIndex.length;
        fileIndex = fileIndex.filter(file => !file.path.startsWith(rootDir));
        
        // 현재까지 처리된 파일들 추가
        fileIndex.push(...newFiles);
        
        // 경로 정보 업데이트
        if (!indexedPaths.includes(rootDir)) {
          indexedPaths.push(rootDir);
        }
        
        // 메타데이터 업데이트 (부분 완료)
        updatePathMetadata(rootDir, newFiles.length);
        
        // 파일에 저장
        saveAllData();
        console.log(`💾 취소 시 부분 저장 완료: ${newFiles.length}개 파일`);
      }
      
      return false;
    }
    
    console.log(`📁 스캔 완료: ${newFiles.length}개 파일 발견`);
    
    // 기존 파일 중 같은 경로의 파일들 제거
    const beforeCount = fileIndex.length;
    fileIndex = fileIndex.filter(file => !file.path.startsWith(rootDir));
    console.log(`🗑️ 기존 파일 제거: ${beforeCount - fileIndex.length}개`);
    
    // 새 파일들 추가
    fileIndex.push(...newFiles);
    console.log(`✅ 새 파일 추가: ${newFiles.length}개, 전체: ${fileIndex.length}개`);
    
    // 경로 정보 업데이트
    if (!indexedPaths.includes(rootDir)) {
      indexedPaths.push(rootDir);
      console.log(`📌 새 경로 추가: ${rootDir}`);
    }
    
    // 메타데이터 업데이트
    updatePathMetadata(rootDir, newFiles.length);
    console.log(`📊 메타데이터 업데이트 완료`);
    
    // 파일에 저장
    saveAllData();
    console.log(`💾 데이터 저장 완료`);
    
    return true;
  } catch (error) {
    console.error(`❌ 인덱싱 중 오류 발생:`, error);
    throw error;
  } finally {
    // 인덱싱 완료 상태로 변경
    indexingState.isIndexing = false;
    indexingState.currentPath = null;
    console.log(`🏁 인덱싱 완료, 상태 초기화:`, indexingState);
  }
}

async function scanDirAsync(dir, fileList = []) {
  // 취소 또는 일시정지 체크
  while (indexingState.isPaused && !indexingState.isCanceled) {
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 대기
  }
  
  if (indexingState.isCanceled) {
    return; // 취소됨
  }
  
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
    console.log(`📂 디렉토리 스캔: ${dir} (${entries.length}개 항목)`);
  } catch (e) {
    console.warn(`⚠️ 디렉토리 접근 실패: ${dir} - ${e.message}`);
    return;
  }
  
  let fileCount = 0;
  let dirCount = 0;
  let batchFiles = []; // 배치 처리용 임시 배열
  
  for (const entry of entries) {
    // 매 파일마다 취소/일시정지 체크
    if (indexingState.isCanceled) {
      return;
    }
    
    while (indexingState.isPaused && !indexingState.isCanceled) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      dirCount++;
      await scanDirAsync(fullPath, fileList);
    } else if (entry.isFile()) {
      let stat;
      try {
        stat = fs.statSync(fullPath);
        batchFiles.push(makeFileMeta(fullPath, entry.name, stat));
        fileCount++;
        indexingState.processedFiles++;
        
        // 현재 경로 업데이트
        indexingState.currentPath = fullPath;
        
        // 100개 파일마다 배치 처리하여 성능 최적화
        if (batchFiles.length >= 100) {
          fileList.push(...batchFiles);
          batchFiles = [];
          
          // 1000개 파일마다 중간 저장 (데이터 보호)
          if (indexingState.processedFiles % 1000 === 0) {
            try {
              // 현재까지 처리된 파일들을 메인 인덱스에 임시 추가하여 저장
              const currentFiles = [...fileList]; // 현재까지 처리된 파일들
              
              // 기존 같은 경로 파일들 제거하고 새로운 파일들 추가
              const filteredIndex = fileIndex.filter(file => !file.path.startsWith(rootDir));
              const tempIndex = [...filteredIndex, ...currentFiles];
              
              // 임시로 인덱스 교체하여 저장
              const originalIndex = fileIndex;
              fileIndex = tempIndex;
              
              saveAllData();
              console.log(`💾 중간 저장 완료: ${indexingState.processedFiles}개 파일 처리됨`);
              
              // 원래 인덱스로 복원 (인덱싱 완료 후 최종 저장)
              fileIndex = originalIndex;
              
            } catch (error) {
              console.warn(`⚠️ 중간 저장 실패:`, error);
            }
          }
          
          // 이벤트 루프에 양보하여 다른 작업 처리 허용
          await new Promise(resolve => setImmediate(resolve));
        }
        
        // 1000개 파일마다 로그 (로깅 빈도 줄임)
        if (indexingState.processedFiles % 1000 === 0) {
          console.log(`📈 진행 상황: ${indexingState.processedFiles}개 파일 처리됨`);
        }
      } catch (e) {
        console.warn(`⚠️ 파일 접근 실패: ${fullPath} - ${e.message}`);
        continue;
      }
    }
  }
  
  // 남은 파일들 처리
  if (batchFiles.length > 0) {
    fileList.push(...batchFiles);
  }
  
  if (fileCount > 0 || dirCount > 0) {
    console.log(`📁 ${dir}: ${fileCount}개 파일, ${dirCount}개 하위 디렉토리`);
  }
}

function makeFileMeta(fullPath, name, stat) {
  return {
    name,
    ext: path.extname(name).slice(1),
    path: fullPath,
    size: stat.size,
    mtime: stat.mtime
  };
}

/**
 * 경로별 메타데이터 업데이트
 */
function updatePathMetadata(rootDir, fileCount) {
  const totalSize = fileIndex
    .filter(file => file.path.startsWith(rootDir))
    .reduce((sum, file) => sum + file.size, 0);
    
  indexMetadata[rootDir] = {
    path: rootDir,
    fileCount,
    totalSize,
    lastUpdated: new Date().toISOString(),
    status: 'active'
  };
}

/**
 * 인덱스 반환
 */
function getIndex() {
  return fileIndex;
}

/**
 * 인덱싱된 경로들 반환
 */
function getIndexedPaths() {
  return indexedPaths;
}

/**
 * 경로별 메타데이터 반환
 */
function getPathMetadata() {
  return indexMetadata;
}

/**
 * 파일 추가(Watch용)
 */
function addFileToIndex(filePath, stat) {
  const name = path.basename(filePath);
  // 이미 있으면 무시
  if (fileIndex.find(f => f.path === filePath)) return;
  
  const fileMeta = makeFileMeta(filePath, name, stat);
  fileIndex.push(fileMeta);
  
  // 해당 경로의 메타데이터 업데이트
  const rootDir = findRootDirectory(filePath);
  if (rootDir && indexMetadata[rootDir]) {
    indexMetadata[rootDir].fileCount++;
    indexMetadata[rootDir].totalSize += fileMeta.size;
    indexMetadata[rootDir].lastUpdated = new Date().toISOString();
  }
}

/**
 * 파일 삭제(Watch용)
 */
function removeFileFromIndex(filePath) {
  const file = fileIndex.find(f => f.path === filePath);
  if (file) {
    fileIndex = fileIndex.filter(f => f.path !== filePath);
    
    // 해당 경로의 메타데이터 업데이트
    const rootDir = findRootDirectory(filePath);
    if (rootDir && indexMetadata[rootDir]) {
      indexMetadata[rootDir].fileCount--;
      indexMetadata[rootDir].totalSize -= file.size;
      indexMetadata[rootDir].lastUpdated = new Date().toISOString();
    }
  }
}

/**
 * 파일 갱신(Watch용)
 */
function updateFileInIndex(filePath, stat) {
  const idx = fileIndex.findIndex(f => f.path === filePath);
  if (idx !== -1) {
    const oldFile = fileIndex[idx];
    const newFile = makeFileMeta(filePath, path.basename(filePath), stat);
    
    // 크기 차이 계산
    const sizeDiff = newFile.size - oldFile.size;
    
    fileIndex[idx] = newFile;
    
    // 해당 경로의 메타데이터 업데이트
    const rootDir = findRootDirectory(filePath);
    if (rootDir && indexMetadata[rootDir]) {
      indexMetadata[rootDir].totalSize += sizeDiff;
      indexMetadata[rootDir].lastUpdated = new Date().toISOString();
    }
  }
}

/**
 * 파일 경로에서 루트 디렉토리 찾기
 */
function findRootDirectory(filePath) {
  return indexedPaths.find(rootDir => filePath.startsWith(rootDir));
}

/**
 * 특정 경로의 인덱스 삭제
 * @param {Array} paths - 삭제할 경로 배열
 */
function removePathsFromIndex(paths) {
  // 파일 인덱스에서 제거
  fileIndex = fileIndex.filter(file => {
    return !paths.some(pathToRemove => file.path.startsWith(pathToRemove));
  });
  
  // 인덱싱된 경로에서 제거
  indexedPaths = indexedPaths.filter(path => !paths.includes(path));
  
  // 메타데이터에서 제거
  paths.forEach(pathToRemove => {
    delete indexMetadata[pathToRemove];
  });
  
  // 파일에 저장
  saveAllData();
}

/**
 * 모든 데이터를 파일에 저장
 */
function saveAllData() {
  ensureDirectoryExists(INDEX_FILE_PATH);

  // 인덱스 파일 저장
  fs.writeFileSync(INDEX_FILE_PATH, JSON.stringify(fileIndex, null, 2), 'utf-8');

  // 경로 정보 저장 (없으면 빈 배열로라도 생성)
  if (!Array.isArray(indexedPaths)) indexedPaths = [];
  fs.writeFileSync(PATHS_FILE_PATH, JSON.stringify(indexedPaths, null, 2), 'utf-8');

  // 메타데이터 저장 (없으면 빈 객체로라도 생성)
  if (typeof indexMetadata !== 'object' || !indexMetadata) indexMetadata = {};
  fs.writeFileSync(METADATA_FILE_PATH, JSON.stringify(indexMetadata, null, 2), 'utf-8');
}

/**
 * 모든 데이터를 파일에서 불러오기
 */
function loadAllData() {
  try {
    // 인덱스 파일 불러오기
    if (fs.existsSync(INDEX_FILE_PATH)) {
      const data = fs.readFileSync(INDEX_FILE_PATH, 'utf-8');
      fileIndex = JSON.parse(data);
    }
    
    // 경로 정보 불러오기
    if (fs.existsSync(PATHS_FILE_PATH)) {
      const data = fs.readFileSync(PATHS_FILE_PATH, 'utf-8');
      indexedPaths = JSON.parse(data);
    }
    
    // 메타데이터 불러오기
    if (fs.existsSync(METADATA_FILE_PATH)) {
      const data = fs.readFileSync(METADATA_FILE_PATH, 'utf-8');
      indexMetadata = JSON.parse(data);
    }
    
    return true;
  } catch (error) {
    console.error('데이터 불러오기 오류:', error);
    return false;
  }
}

/**
 * 인덱싱 일시정지
 */
function pauseIndexing() {
  if (indexingState.isIndexing) {
    indexingState.isPaused = true;
    console.log('⏸️ 인덱싱 일시정지됨');
    return true;
  }
  return false;
}

/**
 * 인덱싱 재개
 */
function resumeIndexing() {
  if (indexingState.isIndexing && indexingState.isPaused) {
    indexingState.isPaused = false;
    console.log('▶️ 인덱싱 재개됨');
    return true;
  }
  return false;
}

/**
 * 인덱싱 취소
 */
function cancelIndexing() {
  if (indexingState.isIndexing) {
    indexingState.isCanceled = true;
    indexingState.isPaused = false;
    console.log('❌ 인덱싱 취소됨');
    return true;
  }
  return false;
}

/**
 * 인덱싱 상태 조회
 */
function getIndexingStatus() {
  const status = {
    ...indexingState,
    progress: indexingState.totalFiles > 0 ? 
      Math.round((indexingState.processedFiles / indexingState.totalFiles) * 100) : 0
  };
  
  console.log(`🔍 인덱싱 상태 조회:`, status);
  return status;
}

/**
 * 서버 시작 시 자동으로 데이터 로드
 */
loadAllData();

export {
  buildIndex,
  getIndex,
  getIndexedPaths,
  getPathMetadata,
  addFileToIndex,
  removeFileFromIndex,
  updateFileInIndex,
  saveAllData,
  loadAllData,
  removePathsFromIndex,
  pauseIndexing,
  resumeIndexing,
  cancelIndexing,
  getIndexingStatus
};