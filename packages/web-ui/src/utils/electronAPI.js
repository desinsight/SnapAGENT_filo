// Electron API 래퍼
class ElectronAPI {
  constructor() {
    this.isElectron = window.require && window.require('electron');
    this.ipcRenderer = this.isElectron ? window.require('electron').ipcRenderer : null;
  }

  // Electron 환경인지 확인
  isElectronApp() {
    return !!this.isElectron;
  }

  // 드라이브 목록 조회
  async listDrives() {
    if (!this.ipcRenderer) {
      throw new Error('Electron 환경이 아닙니다.');
    }
    return await this.ipcRenderer.invoke('file-system:list-drives');
  }

  // 파일 목록 조회
  async listFiles(dirPath) {
    if (!this.ipcRenderer) {
      throw new Error('Electron 환경이 아닙니다.');
    }
    const result = await this.ipcRenderer.invoke('file-system:list-files', dirPath);
    if (Array.isArray(result)) return result;
    if (result && result.files) return result;
    return [];
  }

  // 파일 읽기
  async readFile(filePath) {
    if (!this.ipcRenderer) {
      throw new Error('Electron 환경이 아닙니다.');
    }
    return await this.ipcRenderer.invoke('file-system:read-file', filePath);
  }

  // 파일 쓰기
  async writeFile(filePath, content) {
    if (!this.ipcRenderer) {
      throw new Error('Electron 환경이 아닙니다.');
    }
    return await this.ipcRenderer.invoke('file-system:write-file', filePath, content);
  }

  // 디렉토리 생성
  async createDirectory(dirPath) {
    if (!this.ipcRenderer) {
      throw new Error('Electron 환경이 아닙니다.');
    }
    return await this.ipcRenderer.invoke('file-system:create-directory', dirPath);
  }

  // 파일/디렉토리 삭제
  async deleteFile(filePath) {
    if (!this.ipcRenderer) {
      throw new Error('Electron 환경이 아닙니다.');
    }
    return await this.ipcRenderer.invoke('file-system:delete-file', filePath);
  }

  // 파일 크기 포맷팅
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 날짜 포맷팅
  formatDate(date) {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 폴더 선택 다이얼로그
  async selectFolder() {
    if (!this.ipcRenderer) {
      throw new Error('Electron 환경이 아닙니다.');
    }
    return await this.ipcRenderer.invoke('dialog:select-folder');
  }

  // 파일 시스템 기본 프로그램으로 열기
  async openFile(filePath) {
    if (!this.ipcRenderer) {
      throw new Error('Electron 환경이 아닙니다.');
    }
    return await this.ipcRenderer.invoke('shell:open-path', filePath);
  }

  // 파일 아이콘 가져오기
  async getFileIcon(filePath) {
    if (!this.ipcRenderer) {
      return null;
    }
    return await this.ipcRenderer.invoke('get-file-icon', filePath);
  }

  // 재귀적 파일 탐색 (무제한 깊이)
  async recursiveSearch(dirPath, options = {}) {
    if (!this.ipcRenderer) {
      throw new Error('Electron 환경이 아닙니다.');
    }
    return await this.ipcRenderer.invoke('file-system:recursive-search', dirPath, options);
  }

  // shell API 엑세스
  get shell() {
    return {
      openPath: (path) => {
        if (!this.ipcRenderer) {
          throw new Error('Electron 환경이 아닙니다.');
        }
        return this.ipcRenderer.invoke('shell:open-path', path);
      }
    };
  }
}

// 싱글톤 인스턴스 생성
const electronAPI = new ElectronAPI();

export default electronAPI; 