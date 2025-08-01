const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';
const os = require('os');

// 메인 윈도우 객체
let mainWindow;

// 고도 규모 파일 시스템 작업을 위한 설정
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.UV_THREADPOOL_SIZE = 32; // 비동기 작업 스레드 풀 확장
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// 관리자 권한 요청 및 설정
function requestAdminPrivileges() {
  if (process.platform === 'win32') {
    try {
      const { execSync } = require('child_process');
      // 현재 프로세스가 관리자 권한으로 실행되고 있는지 확인
      const isAdmin = execSync('net session 2>nul', { encoding: 'utf8' });
      console.log('관리자 권한이 확인되었습니다.');
    } catch (error) {
      console.log('관리자 권한이 필요합니다.');
      // UAC 프롬프트를 통해 관리자 권한 요청
      const { spawn } = require('child_process');
      try {
        spawn('powershell', [
          'Start-Process',
          `"${process.execPath}"`,
          '-Verb', 'RunAs',
          '-ArgumentList', process.argv.slice(1).join(' ')
        ], { detached: true, stdio: 'ignore' });
        app.quit();
        return false;
      } catch (elevateError) {
        console.warn('권한 상승 실패:', elevateError.message);
      }
    }
  }
  return true;
}

function createWindow() {
  // 브라우저 윈도우 생성 (최대 권한)
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false, // 로컬 파일 접근 허용
      allowRunningInsecureContent: true, // 보안 콘텐츠 허용
      experimentalFeatures: true, // 실험적 기능 허용
      sandbox: false, // 샌드박스 비활성화
      nodeIntegrationInWorker: true, // 워커에서 Node.js 통합
      nodeIntegrationInSubFrames: true // 서브프레임에서 Node.js 통합
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // 개발 모드에서는 로컬 서버, 프로덕션에서는 빌드된 파일
  const startUrl = isDev 
    ? 'http://localhost:5174' 
    : `file://${path.join(__dirname, '../packages/web-ui/dist/index.html')}`;

  console.log('isDev:', isDev, 'startUrl:', startUrl);
  mainWindow.loadURL(startUrl);

  // 윈도우가 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 개발 모드에서 개발자 도구 열기
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 윈도우가 닫힐 때 앱 종료
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 메뉴 설정
  createMenu();
}

// 메뉴 생성
function createMenu() {
  const template = [
    {
      label: '파일',
      submenu: [
        {
          label: '새로고침',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: '개발자 도구',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: '종료',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: '보기',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '도움말',
      submenu: [
        {
          label: 'Filo AI File Manager 정보',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Filo AI File Manager',
              message: 'Filo AI File Manager',
              detail: 'AI 기반 지능형 파일 관리 시스템\n버전: 1.0.0\n\nClaude AI와 연동하여 파일을 지능적으로 관리합니다.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 향상된 재귀적 디렉토리 탐색 IPC 핸들러
ipcMain.handle('file-system:recursive-search', async (event, dirPath, maxDepth = 10, currentDepth = 0) => {
  const results = [];
  
  if (currentDepth > maxDepth) {
    return results;
  }
  
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      try {
        const fullPath = path.join(dirPath, item.name);
        
        // 시스템 폴더 및 숨김 파일 필터링
        if (item.name.startsWith('.') || item.name.startsWith('$') || 
            ['System Volume Information', '$Recycle.Bin', 'Windows', 'Program Files', 'ProgramData'].includes(item.name)) {
          continue;
        }
        
        const stat = await fs.promises.stat(fullPath);
        
        if (item.isDirectory()) {
          // 디렉토리 정보 추가
          results.push({
            name: item.name,
            path: fullPath,
            isDirectory: true,
            size: 0,
            modified: stat.mtime,
            depth: currentDepth
          });
          
          // 재귀적으로 하위 디렉토리 탐색
          if (currentDepth < maxDepth) {
            try {
              const subResults = await module.exports.recursiveSearch(fullPath, maxDepth, currentDepth + 1);
              results.push(...subResults);
            } catch (subError) {
              console.warn(`하위 디렉토리 접근 실패: ${fullPath}`, subError.message);
            }
          }
        } else {
          // 파일 정보 추가
          results.push({
            name: item.name,
            path: fullPath,
            isDirectory: false,
            size: stat.size,
            modified: stat.mtime,
            depth: currentDepth
          });
        }
      } catch (itemError) {
        console.warn(`항목 처리 오류: ${item.name}`, itemError.message);
        continue;
      }
    }
  } catch (error) {
    console.warn(`디렉토리 읽기 오류: ${dirPath}`, error.message);
  }
  
  return results;
});

// 외부에서 사용할 수 있도록 내보내기
module.exports = {
  recursiveSearch: async (dirPath, maxDepth = 10, currentDepth = 0) => {
    return ipcMain.handle('file-system:recursive-search', null, dirPath, maxDepth, currentDepth);
  }
};

// IPC 핸들러 - 렌더러 프로세스와 통신
ipcMain.handle('file-system:list-drives', async () => {
  try {
    // Windows에서는 드라이브 목록 가져오기
    if (process.platform === 'win32') {
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec('wmic logicaldisk get size,freespace,caption', (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }
          
          const drives = stdout.trim().split('\n').slice(1).map(line => {
            const [caption, freeSpace, size] = line.trim().split(/\s+/);
            return {
              name: caption,
              freeSpace: parseInt(freeSpace) || 0,
              size: parseInt(size) || 0
            };
          });
          
          resolve(drives);
        });
      });
    } else {
      // macOS/Linux에서는 루트 디렉토리 반환
      return [{ name: '/', freeSpace: 0, size: 0 }];
    }
  } catch (error) {
    console.error('드라이브 목록 조회 실패:', error);
    throw error;
  }
});

// 향상된 파일 목록 조회 IPC 핸들러
ipcMain.handle('file-system:list-files', async (event, dirPath) => {
  try {
    let targetPath = dirPath;
    
    // 경로 유효성 검사
    if (!targetPath || targetPath.trim() === '') {
      return { error: '빈 경로입니다.', files: [] };
    }
    
    // 경로 정규화
    targetPath = path.resolve(targetPath);
    
    // 경로 존재 여부 확인
    try {
      await fs.promises.access(targetPath, fs.constants.F_OK);
    } catch (accessError) {
      return { error: `경로에 접근할 수 없습니다: ${targetPath}`, files: [] };
    }
    
    // 디렉토리인지 확인
    const targetStat = await fs.promises.stat(targetPath);
    if (!targetStat.isDirectory()) {
      return { error: `디렉토리가 아닙니다: ${targetPath}`, files: [] };
    }
    
    // 디렉토리 읽기 시도 (권한 확인 포함)
    let files;
    try {
      files = await fs.promises.readdir(targetPath, { withFileTypes: true });
    } catch (readError) {
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      
      switch (readError.code) {
        case 'EACCES':
          errorMessage = '접근 권한이 거부되었습니다. 관리자 권한이 필요할 수 있습니다.';
          break;
        case 'ENOENT':
          errorMessage = '경로를 찾을 수 없습니다.';
          break;
        case 'ENOTDIR':
          errorMessage = '디렉토리가 아닙니다.';
          break;
        case 'EMFILE':
        case 'ENFILE':
          errorMessage = '시스템에서 너무 많은 파일이 열려 있습니다.';
          break;
        default:
          errorMessage = readError.message;
      }
      
      return { error: errorMessage, files: [], code: readError.code };
    }
    
    // 파일 정보 수집 (병렬 처리)
    const processedFiles = await Promise.allSettled(
      files.map(async (file) => {
        try {
          const filePath = path.join(targetPath, file.name);
          let stat = null;
          
          try {
            stat = await fs.promises.stat(filePath);
          } catch (statError) {
            // 개별 파일 오류는 무시하고 기본 정보만 반환
            return {
              name: file.name,
              isDirectory: file.isDirectory(),
              path: filePath,
              size: 0,
              modified: null,
              error: statError.code,
              accessible: false
            };
          }
          
          return {
            name: file.name,
            isDirectory: file.isDirectory(),
            path: filePath,
            size: file.isFile() ? stat.size : 0,
            modified: stat.mtime,
            accessible: true
          };
        } catch (fileError) {
          console.warn(`파일 처리 오류: ${file.name}`, fileError);
          return {
            name: file.name,
            isDirectory: file.isDirectory(),
            path: path.join(targetPath, file.name),
            size: 0,
            modified: null,
            error: fileError.code || 'UNKNOWN',
            accessible: false
          };
        }
      })
    );
    
    // 성공한 결과만 필터링
    const validFiles = processedFiles
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
    
    return { 
      files: validFiles, 
      success: true, 
      path: targetPath,
      totalFiles: validFiles.length 
    };
    
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    
    switch (error.code) {
      case 'EACCES':
        errorMessage = '접근 권한이 거부되었습니다. 관리자 권한으로 실행해주세요.';
        break;
      case 'ENOENT':
        errorMessage = '경로를 찾을 수 없습니다.';
        break;
      case 'ENOTDIR':
        errorMessage = '디렉토리가 아닙니다.';
        break;
      case 'EMFILE':
      case 'ENFILE':
        errorMessage = '시스템에서 너무 많은 파일이 열려 있습니다.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    return { 
      error: errorMessage, 
      files: [], 
      code: error.code,
      path: dirPath 
    };
  }
});

ipcMain.handle('file-system:read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, path: filePath };
  } catch (error) {
    console.error('파일 읽기 실패:', error);
    throw error;
  }
});

ipcMain.handle('file-system:write-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true, path: filePath };
  } catch (error) {
    console.error('파일 쓰기 실패:', error);
    throw error;
  }
});

ipcMain.handle('file-system:create-directory', async (event, dirPath) => {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    return { success: true, path: dirPath };
  } catch (error) {
    console.error('디렉토리 생성 실패:', error);
    throw error;
  }
});

ipcMain.handle('file-system:delete-file', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      fs.rmdirSync(filePath, { recursive: true });
    } else {
      fs.unlinkSync(filePath);
    }
    return { success: true, path: filePath };
  } catch (error) {
    console.error('파일 삭제 실패:', error);
    throw error;
  }
});

ipcMain.handle('dialog:select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// 파일을 시스템 기본 프로그램으로 열기
ipcMain.handle('shell:open-path', async (event, filePath) => {
  try {
    const result = await shell.openPath(filePath);
    if (result) {
      console.error('파일 열기 오류:', result);
      throw new Error(result);
    }
    return { success: true, path: filePath };
  } catch (error) {
    console.error('파일 열기 실패:', error);
    throw error;
  }
});

// 파일 아이콘 추출 IPC 핸들러
ipcMain.handle('get-file-icon', async (event, filePath) => {
  try {
    const icon = await app.getFileIcon(filePath, { size: 'large' });
    return icon.toDataURL();
  } catch (e) {
    return null;
  }
});

// 앱 이벤트 핸들러
app.whenReady().then(() => {
  // 관리자 권한 요청
  if (requestAdminPrivileges()) {
    createWindow();
  }
});

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