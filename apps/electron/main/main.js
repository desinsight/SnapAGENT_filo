import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import os from 'os';
// import * as fileIcon from 'file-icon'; // macOS 전용이므로 제거

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: 'SnapCodex Platform',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    show: false
  });

  // 개발 환경에서는 vite 서버, 프로덕션에서는 빌드된 파일
  const startUrl = isDev 
    ? 'http://localhost:5174' 
    : `file://${path.join(__dirname, '../renderer/dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 파일 시스템 API
ipcMain.handle('list-drives', async () => {
  try {
    const drives = [];
    
    if (process.platform === 'win32') {
      // Windows 드라이브 목록
      for (let i = 65; i <= 90; i++) {
        const drive = String.fromCharCode(i) + ':';
        try {
          await fs.access(drive + '\\');
          drives.push({
            name: `${drive}\\`,
            path: drive + '\\',
            type: 'drive'
          });
        } catch (error) {
          // 드라이브가 존재하지 않으면 무시
        }
      }
    } else if (process.platform === 'darwin') {
      // macOS 드라이브 및 마운트된 볼륨
      // 루트 디렉토리
      drives.push({
        name: 'Macintosh HD',
        path: '/',
        type: 'drive'
      });
      
      // /Volumes 디렉토리의 모든 마운트된 볼륨 (외장 드라이브, 네트워크 드라이브 등)
      try {
        const volumes = await fs.readdir('/Volumes');
        for (const volume of volumes) {
          const volumePath = path.join('/Volumes', volume);
          try {
            const stats = await fs.stat(volumePath);
            if (stats.isDirectory()) {
              drives.push({
                name: volume,
                path: volumePath,
                type: 'drive'
              });
            }
          } catch (error) {
            console.warn(`볼륨 접근 실패: ${volume}`, error.message);
          }
        }
      } catch (error) {
        console.error('/Volumes 디렉토리 읽기 실패:', error);
      }
      
      // 사용자 홈 디렉토리
      const homeDir = os.homedir();
      drives.push({
        name: '홈',
        path: homeDir,
        type: 'folder'
      });
      
      // iCloud Drive (사용자가 iCloud를 사용하는 경우)
      const iCloudPath = path.join(homeDir, 'Library/Mobile Documents/com~apple~CloudDocs');
      try {
        await fs.access(iCloudPath);
        drives.push({
          name: 'iCloud Drive',
          path: iCloudPath,
          type: 'cloud'
        });
      } catch (error) {
        // iCloud Drive가 없으면 무시
      }
    } else {
      // Linux 루트 디렉토리
      drives.push({
        name: '/',
        path: '/',
        type: 'drive'
      });
      
      // 사용자 홈 디렉토리
      const homeDir = os.homedir();
      drives.push({
        name: '홈',
        path: homeDir,
        type: 'folder'
      });
    }
    
    return drives;
  } catch (error) {
    console.error('드라이브 목록 조회 실패:', error);
    return [];
  }
});

ipcMain.handle('list-files', async (event, dirPath) => {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];
    
    for (const item of items) {
      try {
        const fullPath = path.join(dirPath, item.name);
        const stats = await fs.stat(fullPath);
        
        files.push({
          name: item.name,
          path: fullPath,
          isDirectory: item.isDirectory(),
          size: item.isDirectory() ? 0 : stats.size,
          modifiedAt: stats.mtime.toISOString(),
          createdAt: stats.birthtime.toISOString(),
          extension: item.isDirectory() ? null : path.extname(item.name)
        });
      } catch (error) {
        // 접근 권한이 없는 파일은 무시
        console.warn(`파일 정보 조회 실패: ${item.name}`, error.message);
      }
    }
    
    return files;
  } catch (error) {
    console.error('파일 목록 조회 실패:', error);
    throw error;
  }
});

ipcMain.handle('get-file-icon', async (event, filePath) => {
  try {
    // 파일 존재 여부 확인
    try {
      await fs.access(filePath);
    } catch (error) {
      // 파일이 존재하지 않으면 null 반환
      return null;
    }
    
    // Option 1: 단순하고 표준적인 방식
    const icon = await app.getFileIcon(filePath, { size: 'large' });
    const resized = icon.resize({ width: 48, height: 48, quality: 'best' });
    const dataURL = resized.toDataURL();
    
    return dataURL;
  } catch (error) {
    // 에러 로깅 제거하여 콘솔 오염 방지
    return null;
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    // 🛡️ 보안: 경로 검증 및 제한
    // 절대 경로로 변환
    const absolutePath = path.resolve(filePath);
    
    // 위험한 경로 차단 (정확한 경로만)
    const dangerousPaths = [
      path.parse(process.cwd()).root, // 루트 디렉토리 (C:\ 또는 /)
      process.env.SYSTEMROOT || 'C:\\Windows', // Windows 시스템 폴더
      'C:\\Program Files',
      'C:\\Program Files (x86)',
      '/System', '/bin', '/sbin', '/usr', '/etc' // Unix 시스템 폴더
    ];
    
    // 홈 디렉토리 자체는 차단하지만 하위 폴더는 허용
    const homeDir = os.homedir();
    
    const isDangerous = dangerousPaths.some(dangerousPath => {
      const resolved = path.resolve(dangerousPath);
      return absolutePath === resolved || absolutePath.startsWith(resolved + path.sep);
    }) || absolutePath === homeDir; // 홈 디렉토리 자체만 차단
    
    if (isDangerous) {
      throw new Error('시스템 파일 및 중요 디렉토리는 삭제할 수 없습니다.');
    }
    
    // 파일/폴더 존재 확인
    const stats = await fs.stat(absolutePath);
    
    if (stats.isDirectory()) {
      // fs.rmdir → fs.rm으로 변경 (Node.js 14+)
      await fs.rm(absolutePath, { recursive: true, force: true });
    } else {
      await fs.unlink(absolutePath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('파일 삭제 실패:', error);
    throw error;
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('open-file', async (event, filePath) => {
  try {
    // 경로 검증
    const absolutePath = path.resolve(filePath);
    
    // 파일 존재 확인
    const stats = await fs.stat(absolutePath);
    
    if (stats.isDirectory()) {
      // 폴더는 파일 탐색기에서 열기
      await shell.openPath(absolutePath);
    } else {
      // 파일은 기본 앱으로 열기
      await shell.openPath(absolutePath);
    }
    
    console.log('파일 열기 성공:', absolutePath);
    return { success: true };
  } catch (error) {
    console.error('파일 열기 실패:', error);
    throw error;
  }
});

// 파일이 위치한 폴더를 탐색기에서 열고 파일 선택
ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  try {
    // 경로 검증
    const absolutePath = path.resolve(filePath);
    
    // 파일 존재 확인
    const stats = await fs.stat(absolutePath);
    
    // shell.showItemInFolder를 사용하여 파일이 있는 폴더를 열고 파일 선택
    shell.showItemInFolder(absolutePath);
    
    console.log('폴더에서 파일 선택하여 열기 성공:', absolutePath);
    return { success: true };
  } catch (error) {
    console.error('폴더에서 파일 열기 실패:', error);
    throw error;
  }
});

ipcMain.handle('move-file', async (event, sourcePath, destinationPath) => {
  try {
    // 경로 검증
    const absoluteSource = path.resolve(sourcePath);
    const absoluteDestination = path.resolve(destinationPath);
    
    // 소스 파일 존재 확인
    await fs.access(absoluteSource);
    
    // 대상 디렉토리가 폴더인지 확인
    const destStats = await fs.stat(absoluteDestination);
    if (!destStats.isDirectory()) {
      throw new Error('대상 경로가 폴더가 아닙니다.');
    }
    
    // 새로운 파일 경로 생성
    const fileName = path.basename(absoluteSource);
    const newPath = path.join(absoluteDestination, fileName);
    
    // 파일 이동
    await fs.rename(absoluteSource, newPath);
    
    console.log('파일 이동 성공:', absoluteSource, '->', newPath);
    return { success: true, newPath };
  } catch (error) {
    console.error('파일 이동 실패:', error);
    throw error;
  }
});

ipcMain.handle('copy-file', async (event, sourcePath, destinationPath) => {
  try {
    // 경로 검증
    const absoluteSource = path.resolve(sourcePath);
    const absoluteDestination = path.resolve(destinationPath);
    
    // 소스 파일 존재 확인
    await fs.access(absoluteSource);
    
    // 대상이 폴더인지 파일인지 확인
    let targetPath = absoluteDestination;
    try {
      const destStats = await fs.stat(absoluteDestination);
      if (destStats.isDirectory()) {
        // 대상이 폴더면 소스 파일명을 유지하여 복사
        const fileName = path.basename(absoluteSource);
        let baseName = path.parse(fileName).name;
        const extension = path.parse(fileName).ext;
        
        // 중복 파일명 처리
        let finalFileName = fileName;
        let counter = 1;
        let proposedPath = path.join(absoluteDestination, finalFileName);
        
        while (true) {
          try {
            await fs.access(proposedPath);
            // 파일이 존재하면 번호를 붙여서 다시 시도
            finalFileName = `${baseName} (${counter})${extension}`;
            proposedPath = path.join(absoluteDestination, finalFileName);
            counter++;
          } catch (error) {
            // 파일이 존재하지 않으면 이 이름을 사용
            break;
          }
        }
        
        targetPath = proposedPath;
      }
    } catch (error) {
      // 대상 파일이 없으면 그대로 복사
    }
    
    // 파일/폴더 복사
    const sourceStats = await fs.stat(absoluteSource);
    if (sourceStats.isDirectory()) {
      await fs.cp(absoluteSource, targetPath, { recursive: true });
    } else {
      await fs.copyFile(absoluteSource, targetPath);
    }
    
    console.log('파일 복사 성공:', absoluteSource, '->', targetPath);
    return { success: true, newPath: targetPath };
  } catch (error) {
    console.error('파일 복사 실패:', error);
    throw error;
  }
});

ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
  try {
    // 경로 검증
    const absoluteOldPath = path.resolve(oldPath);
    const absoluteNewPath = path.resolve(newPath);
    
    // 소스 파일 존재 확인
    await fs.access(absoluteOldPath);
    
    // 새 경로가 이미 존재하는지 확인
    try {
      await fs.access(absoluteNewPath);
      throw new Error('같은 이름의 파일이 이미 존재합니다.');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    // 파일 이름 변경
    await fs.rename(absoluteOldPath, absoluteNewPath);
    
    console.log('파일 이름 변경 성공:', absoluteOldPath, '->', absoluteNewPath);
    return { success: true, newPath: absoluteNewPath };
  } catch (error) {
    console.error('파일 이름 변경 실패:', error);
    throw error;
  }
});

// 앱이 일렉트론인지 확인
ipcMain.handle('is-electron-app', () => {
  return true;
});

// 사용자 홈 디렉토리 조회
ipcMain.handle('get-home-directory', () => {
  return os.homedir();
});

// 사용자별 기본 폴더 경로 조회
ipcMain.handle('get-user-directories', () => {
  const homeDir = os.homedir();
  
  return {
    home: homeDir,
    desktop: path.join(homeDir, 'Desktop'),
    documents: path.join(homeDir, 'Documents'),
    downloads: path.join(homeDir, 'Downloads'),
    pictures: path.join(homeDir, 'Pictures'),
    music: path.join(homeDir, 'Music'),
    videos: path.join(homeDir, 'Videos')
  };
});

// 즐겨찾기 데이터 파일 경로
const getFavoritesFilePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'favorites.json');
};

// 즐겨찾기 추가
ipcMain.handle('add-favorite', async (event, favoriteData) => {
  try {
    const favoritesPath = getFavoritesFilePath();
    let favorites = [];
    
    // 기존 즐겨찾기 로드
    try {
      const data = await fs.readFile(favoritesPath, 'utf8');
      favorites = JSON.parse(data);
    } catch (error) {
      // 파일이 없으면 빈 배열로 시작
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    // 중복 체크
    if (!favorites.find(fav => fav.path === favoriteData.path)) {
      favorites.push({
        ...favoriteData,
        addedAt: new Date().toISOString()
      });
      
      // 파일 저장
      await fs.writeFile(favoritesPath, JSON.stringify(favorites, null, 2));
    }
    
    return { success: true };
  } catch (error) {
    console.error('즐겨찾기 추가 실패:', error);
    throw error;
  }
});

// 즐겨찾기 제거
ipcMain.handle('remove-favorite', async (event, filePath) => {
  try {
    const favoritesPath = getFavoritesFilePath();
    let favorites = [];
    
    // 기존 즐겨찾기 로드
    try {
      const data = await fs.readFile(favoritesPath, 'utf8');
      favorites = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    // 해당 경로 제거
    favorites = favorites.filter(fav => fav.path !== filePath);
    
    // 파일 저장
    await fs.writeFile(favoritesPath, JSON.stringify(favorites, null, 2));
    
    return { success: true };
  } catch (error) {
    console.error('즐겨찾기 제거 실패:', error);
    throw error;
  }
});

// 즐겨찾기 목록 조회
ipcMain.handle('get-favorites', async () => {
  try {
    const favoritesPath = getFavoritesFilePath();
    
    try {
      const data = await fs.readFile(favoritesPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // 파일이 없으면 빈 배열 반환
      }
      throw error;
    }
  } catch (error) {
    console.error('즐겨찾기 조회 실패:', error);
    return [];
  }
});

ipcMain.on('add-to-recent-files', (event, filePath) => {
  console.log('[Electron] 최근 파일 추가 요청:', filePath);
  // TODO: 실제 최근 파일 관리 로직 구현 (예: 파일 저장, 상태 관리 등)
});