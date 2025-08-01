const { contextBridge, ipcRenderer } = require('electron');

// 일렉트론 API를 안전하게 노출
contextBridge.exposeInMainWorld('electronAPI', {
  // 파일 시스템 API
  listDrives: () => ipcRenderer.invoke('list-drives'),
  listFiles: (path) => ipcRenderer.invoke('list-files', path),
  getFileIcon: (path) => ipcRenderer.invoke('get-file-icon', path),
  deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
  openFile: (path) => ipcRenderer.invoke('open-file', path),
  showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),
  moveFile: (sourcePath, destinationPath) => ipcRenderer.invoke('move-file', sourcePath, destinationPath),
  copyFile: (sourcePath, destinationPath) => ipcRenderer.invoke('copy-file', sourcePath, destinationPath),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  
  // 즐겨찾기 API
  addFavorite: (favoriteData) => ipcRenderer.invoke('add-favorite', favoriteData),
  removeFavorite: (path) => ipcRenderer.invoke('remove-favorite', path),
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  
  // 다이얼로그 API
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // 앱 정보
  isElectronApp: () => ipcRenderer.invoke('is-electron-app'),
  
  // 사용자 디렉토리 API
  getHomeDirectory: () => ipcRenderer.invoke('get-home-directory'),
  getUserDirectories: () => ipcRenderer.invoke('get-user-directories'),
  
  // 최근 파일 기록 API
  addToRecentFiles: (filePath) => ipcRenderer.send('add-to-recent-files', filePath),
  
  // 플랫폼 정보
  platform: process.platform,
  
  // 버전 정보
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});