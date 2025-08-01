/**
 * 파일 확장자 상수 정의
 * 파일 타입별로 그룹화하여 관리
 */

// 문서 파일 확장자
export const DOCUMENT_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages',
  'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'md', 'tex'
];

// 이미지 파일 확장자
export const IMAGE_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico',
  'tiff', 'tif', 'raw', 'heic', 'heif', 'avif'
];

// 비디오 파일 확장자
export const VIDEO_EXTENSIONS = [
  'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v',
  'mpg', 'mpeg', '3gp', 'ogv', 'mxf', 'f4v'
];

// 오디오 파일 확장자
export const AUDIO_EXTENSIONS = [
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma',
  'opus', 'ape', 'ac3', 'dts', 'amr'
];

// 압축 파일 확장자
export const ARCHIVE_EXTENSIONS = [
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz',
  'dmg', 'iso', 'img', 'cab', 'deb', 'rpm'
];

// 코드/프로그래밍 파일 확장자
export const CODE_EXTENSIONS = [
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h',
  'css', 'scss', 'sass', 'less', 'html', 'htm', 'php', 'rb',
  'go', 'rs', 'swift', 'kt', 'scala', 'clj', 'sh', 'bat',
  'ps1', 'vb', 'vbs', 'pl', 'r', 'mat', 'sql'
];

// 데이터베이스 파일 확장자
export const DATABASE_EXTENSIONS = [
  'sql', 'db', 'sqlite', 'sqlite3', 'mdb', 'accdb',
  'dbf', 'fdb', 'gdb', 'nsf'
];

// 설정/구성 파일 확장자
export const CONFIG_EXTENSIONS = [
  'json', 'xml', 'yaml', 'yml', 'ini', 'cfg', 'conf',
  'toml', 'properties', 'env', 'config', 'plist'
];

// 디자인 파일 확장자
export const DESIGN_EXTENSIONS = [
  'psd', 'ai', 'sketch', 'fig', 'xd', 'indd', 'eps',
  'cdr', 'dwg', 'dxf', 'blend', 'max', 'maya'
];

// 폰트 파일 확장자
export const FONT_EXTENSIONS = [
  'ttf', 'otf', 'woff', 'woff2', 'eot', 'pfb', 'pfm'
];

// 전자책 파일 확장자
export const EBOOK_EXTENSIONS = [
  'epub', 'mobi', 'azw', 'azw3', 'fb2', 'lit', 'prc'
];

// 실행 파일 확장자
export const EXECUTABLE_EXTENSIONS = [
  'exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'app',
  'jar', 'apk', 'ipa', 'com', 'scr'
];

// 로그 파일 확장자
export const LOG_EXTENSIONS = [
  'log', 'txt', 'out', 'err', 'trace', 'debug'
];

// 백업 파일 확장자
export const BACKUP_EXTENSIONS = [
  'bak', 'backup', 'old', 'orig', 'tmp', 'temp', 'cache'
];

// 모든 확장자를 카테고리별로 그룹화
export const FILE_EXTENSIONS = {
  documents: DOCUMENT_EXTENSIONS,
  images: IMAGE_EXTENSIONS,
  videos: VIDEO_EXTENSIONS,
  audio: AUDIO_EXTENSIONS,
  archives: ARCHIVE_EXTENSIONS,
  code: CODE_EXTENSIONS,
  databases: DATABASE_EXTENSIONS,
  config: CONFIG_EXTENSIONS,
  design: DESIGN_EXTENSIONS,
  fonts: FONT_EXTENSIONS,
  ebooks: EBOOK_EXTENSIONS,
  executables: EXECUTABLE_EXTENSIONS,
  logs: LOG_EXTENSIONS,
  backups: BACKUP_EXTENSIONS,
};

// 카테고리별 한국어 이름
export const CATEGORY_NAMES = {
  documents: '문서',
  images: '이미지',
  videos: '비디오',
  audio: '오디오',
  archives: '압축 파일',
  code: '코드',
  databases: '데이터베이스',
  config: '설정',
  design: '디자인',
  fonts: '폰트',
  ebooks: '전자책',
  executables: '실행 파일',
  logs: '로그',
  backups: '백업',
};

// 카테고리별 색상 (Tailwind CSS 클래스)
export const CATEGORY_COLORS = {
  documents: 'text-blue-600',
  images: 'text-green-600',
  videos: 'text-red-600',
  audio: 'text-purple-600',
  archives: 'text-yellow-600',
  code: 'text-indigo-600',
  databases: 'text-orange-600',
  config: 'text-gray-600',
  design: 'text-pink-600',
  fonts: 'text-teal-600',
  ebooks: 'text-amber-600',
  executables: 'text-red-700',
  logs: 'text-gray-500',
  backups: 'text-gray-400',
};

// 자주 사용되는 확장자 (검색 필터에서 우선 표시)
export const POPULAR_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx',
  'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mp3', 'wav',
  'zip', 'rar', '7z', 'js', 'html', 'css', 'py', 'java'
];

// 확장자로 카테고리 찾기
export const getCategoryByExtension = (extension) => {
  const ext = extension?.toLowerCase();
  
  for (const [category, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }
  
  return 'other';
};

// 카테고리별 확장자 가져오기
export const getExtensionsByCategory = (category) => {
  return FILE_EXTENSIONS[category] || [];
};

// 모든 확장자 리스트 (중복 제거)
export const ALL_EXTENSIONS = [
  ...new Set([
    ...DOCUMENT_EXTENSIONS,
    ...IMAGE_EXTENSIONS,
    ...VIDEO_EXTENSIONS,
    ...AUDIO_EXTENSIONS,
    ...ARCHIVE_EXTENSIONS,
    ...CODE_EXTENSIONS,
    ...DATABASE_EXTENSIONS,
    ...CONFIG_EXTENSIONS,
    ...DESIGN_EXTENSIONS,
    ...FONT_EXTENSIONS,
    ...EBOOK_EXTENSIONS,
    ...EXECUTABLE_EXTENSIONS,
    ...LOG_EXTENSIONS,
    ...BACKUP_EXTENSIONS,
  ])
].sort();

// 검색 최적화를 위한 확장자 인덱스
export const EXTENSION_INDEX = ALL_EXTENSIONS.reduce((index, ext) => {
  index[ext] = getCategoryByExtension(ext);
  return index;
}, {});

export default FILE_EXTENSIONS;