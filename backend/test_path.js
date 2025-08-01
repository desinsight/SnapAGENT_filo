import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Index path:', path.join(__dirname, 'data', 'ultra-fast-search', 'index.json'));

// indexer.js의 경로 시뮬레이션 (수정된 버전)
const indexerDir = path.join(__dirname, 'src', 'tools', 'ultraFastFileSearch');
const indexerIndexPath = path.join(indexerDir, '..', '..', '..', 'data', 'ultra-fast-search', 'index.json');
console.log('Indexer dir:', indexerDir);
console.log('Indexer index path:', indexerIndexPath);
console.log('Indexer index path (resolved):', path.resolve(indexerIndexPath)); 