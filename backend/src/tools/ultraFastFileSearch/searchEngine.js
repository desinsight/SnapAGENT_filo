import { getIndex } from './indexer.js';

/**
 * 인덱스에서 조건에 맞는 파일을 초고속으로 검색
 * @param {Object} query - { name, ext, from, to, drive }
 * @returns {Array} 검색 결과
 */
function searchFiles(query) {
  const { name, ext, from, to, drive } = query;
  let results = getIndex();

  // 드라이브 필터 (가장 먼저 적용하여 성능 최적화)
  if (drive) {
    console.log(`🔍 드라이브 필터 적용: ${drive}`);
    results = results.filter(f => f.path.startsWith(drive));
    console.log(`📁 드라이브 필터 결과: ${results.length}개 파일`);
  }

  if (name) {
    results = results.filter(f => f.name.toLowerCase().includes(name.toLowerCase()));
  }
  if (ext) {
    results = results.filter(f => f.ext.toLowerCase() === ext.toLowerCase());
  }
  if (from) {
    const fromDate = new Date(from);
    results = results.filter(f => new Date(f.mtime) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    results = results.filter(f => new Date(f.mtime) <= toDate);
  }

  return results;
}

export { searchFiles }; 