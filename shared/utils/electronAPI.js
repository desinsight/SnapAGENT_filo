// 일렉트론 API 래퍼
// 웹 환경에서는 폴백 API 제공

const electronAPI = {
  // 앱 타입 확인
  isElectronApp: () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.isElectronApp();
    }
    return Promise.resolve(false);
  },

  // 드라이브 목록 조회
  listDrives: () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.listDrives();
    }
    // 웹 환경에서는 API 호출
    return fetch('/api/drives').then(res => res.json());
  },

  // 파일 목록 조회
  listFiles: (path) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.listFiles(path);
    }
    // 웹 환경에서는 API 호출
    return fetch(`/api/files?path=${encodeURIComponent(path)}`).then(res => res.json());
  },

  // 파일 아이콘 조회
  getFileIcon: (path) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.getFileIcon(path);
    }
    // 웹 환경에서는 확장자 기반 아이콘 반환
    return Promise.resolve(getWebFileIcon(path));
  },

  // 파일 삭제
  deleteFile: (path) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.deleteFile(path);
    }
    // 웹 환경에서는 API 호출
    return fetch('/api/files', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    }).then(res => res.json());
  },

  // 저장 다이얼로그
  showSaveDialog: (options) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.showSaveDialog(options);
    }
    // 웹 환경에서는 브라우저 다운로드 사용
    return Promise.resolve({ canceled: true });
  },

  // 열기 다이얼로그
  showOpenDialog: (options) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.showOpenDialog(options);
    }
    // 웹 환경에서는 파일 입력 사용
    return Promise.resolve({ canceled: true });
  },

  // 플랫폼 정보
  platform: typeof window !== 'undefined' && window.electronAPI 
    ? window.electronAPI.platform 
    : navigator.platform,

  // 사용자 홈 디렉토리 조회
  getHomeDirectory: () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.getHomeDirectory();
    }
    // 웹 환경에서는 기본값 반환
    return Promise.resolve('/');
  },

  // 사용자별 기본 폴더 경로 조회
  getUserDirectories: () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.getUserDirectories();
    }
    // 웹 환경에서는 기본값 반환
    return Promise.resolve({
      home: '/',
      desktop: '/Desktop',
      documents: '/Documents',
      downloads: '/Downloads',
      pictures: '/Pictures',
      music: '/Music',
      videos: '/Videos'
    });
  }
};

// 웹 환경용 파일 아이콘 함수
function getWebFileIcon(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const iconMap = {
    'pdf': '📄',
    'doc': '📝',
    'docx': '📝',
    'txt': '📄',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'mp4': '🎬',
    'mp3': '🎵',
    'zip': '📦',
    'rar': '📦'
  };
  
  return iconMap[ext] || '📄';
}

export default electronAPI;