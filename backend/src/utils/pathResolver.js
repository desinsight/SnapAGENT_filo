import os from 'os';
import path from 'path';
import fs from 'fs';

/**
 * 크로스 플랫폼 동적 사용자 경로 감지 시스템
 * 모든 운영체제와 사용자 환경에서 올바른 경로를 동적으로 감지
 */
export class DynamicPathResolver {
  constructor() {
    this.platform = os.platform();
    this.userInfo = os.userInfo();
    this.homeDir = os.homedir();
    
    // 캐시된 경로들
    this.pathCache = new Map();
    this.validatedPaths = new Set();
    
    console.log('🔍 PathResolver 초기화:', {
      platform: this.platform,
      username: this.userInfo.username,
      homeDir: this.homeDir
    });
  }

  /**
   * 플랫폼별 기본 사용자 폴더들을 동적으로 감지
   */
  async getUserDirectories() {
    const cacheKey = 'userDirectories';
    if (this.pathCache.has(cacheKey)) {
      return this.pathCache.get(cacheKey);
    }

    let userDirs = {};

    try {
      switch (this.platform) {
        case 'win32':
          userDirs = await this.getWindowsUserDirectories();
          break;
        case 'darwin':
          userDirs = await this.getMacUserDirectories();
          break;
        case 'linux':
        default:
          userDirs = await this.getLinuxUserDirectories();
          break;
      }
      
      // 실제 존재하는 폴더만 필터링
      const validatedDirs = {};
      for (const [key, dirPath] of Object.entries(userDirs)) {
        if (await this.pathExists(dirPath)) {
          validatedDirs[key] = dirPath;
          this.validatedPaths.add(dirPath);
        }
      }
      
      this.pathCache.set(cacheKey, validatedDirs);
      console.log('✅ 사용자 디렉토리 감지 완료:', validatedDirs);
      
      return validatedDirs;
    } catch (error) {
      console.error('❌ 사용자 디렉토리 감지 실패:', error);
      return this.getFallbackDirectories();
    }
  }

  /**
   * Windows 사용자 디렉토리 감지
   */
  async getWindowsUserDirectories() {
    const username = this.userInfo.username;
    const userProfile = process.env.USERPROFILE || this.homeDir;
    
    // 다양한 Windows 환경 지원 (일반 사용자, 도메인 사용자, 로컬 계정 등)
    const possiblePaths = {
      documents: [
        path.join(userProfile, 'Documents'),
        path.join(userProfile, '내 문서'),
        path.join(userProfile, 'My Documents'),
        `C:\\Users\\${username}\\Documents`,
        path.join(this.homeDir, 'Documents')
      ],
      downloads: [
        path.join(userProfile, 'Downloads'),
        path.join(userProfile, '다운로드'),
        `C:\\Users\\${username}\\Downloads`,
        path.join(this.homeDir, 'Downloads')
      ],
      desktop: [
        path.join(userProfile, 'Desktop'),
        path.join(userProfile, '바탕 화면'),
        `C:\\Users\\${username}\\Desktop`,
        path.join(this.homeDir, 'Desktop')
      ],
      pictures: [
        path.join(userProfile, 'Pictures'),
        path.join(userProfile, '사진'),
        `C:\\Users\\${username}\\Pictures`,
        path.join(this.homeDir, 'Pictures')
      ],
      music: [
        path.join(userProfile, 'Music'),
        path.join(userProfile, '음악'),
        `C:\\Users\\${username}\\Music`,
        path.join(this.homeDir, 'Music')
      ],
      videos: [
        path.join(userProfile, 'Videos'),
        path.join(userProfile, '비디오'),
        `C:\\Users\\${username}\\Videos`,
        path.join(this.homeDir, 'Videos')
      ]
    };

    // 실제 존재하는 첫 번째 경로 선택
    const validatedPaths = {};
    for (const [key, paths] of Object.entries(possiblePaths)) {
      for (const dirPath of paths) {
        if (await this.pathExists(dirPath)) {
          validatedPaths[key] = dirPath;
          break;
        }
      }
      // 아무것도 없으면 첫 번째 경로를 기본값으로
      if (!validatedPaths[key]) {
        validatedPaths[key] = paths[0];
      }
    }

    return validatedPaths;
  }

  /**
   * macOS 사용자 디렉토리 감지
   */
  async getMacUserDirectories() {
    return {
      documents: path.join(this.homeDir, 'Documents'),
      downloads: path.join(this.homeDir, 'Downloads'),
      desktop: path.join(this.homeDir, 'Desktop'),
      pictures: path.join(this.homeDir, 'Pictures'),
      music: path.join(this.homeDir, 'Music'),
      videos: path.join(this.homeDir, 'Movies')
    };
  }

  /**
   * Linux 사용자 디렉토리 감지 (XDG 표준 포함)
   */
  async getLinuxUserDirectories() {
    // XDG 사용자 디렉토리 먼저 확인
    const xdgConfigFile = path.join(this.homeDir, '.config/user-dirs.dirs');
    let xdgDirs = {};
    
    if (await this.pathExists(xdgConfigFile)) {
      try {
        const content = await fs.promises.readFile(xdgConfigFile, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('XDG_')) {
            const [key, value] = line.split('=');
            if (value) {
              const cleanValue = value.replace(/"/g, '').replace('$HOME', this.homeDir);
              const dirType = key.toLowerCase().replace('xdg_', '').replace('_dir', '');
              xdgDirs[dirType] = cleanValue;
            }
          }
        }
      } catch (error) {
        console.warn('XDG 설정 파일 읽기 실패:', error.message);
      }
    }

    // 기본 디렉토리와 XDG 디렉토리 결합
    return {
      documents: xdgDirs.documents || path.join(this.homeDir, 'Documents'),
      downloads: xdgDirs.download || path.join(this.homeDir, 'Downloads'),
      desktop: xdgDirs.desktop || path.join(this.homeDir, 'Desktop'),
      pictures: xdgDirs.pictures || path.join(this.homeDir, 'Pictures'),
      music: xdgDirs.music || path.join(this.homeDir, 'Music'),
      videos: xdgDirs.videos || path.join(this.homeDir, 'Videos')
    };
  }

  /**
   * 폴백 디렉토리 (모든 것이 실패했을 때)
   */
  getFallbackDirectories() {
    console.warn('⚠️  폴백 디렉토리 사용');
    return {
      documents: this.homeDir,
      downloads: this.homeDir,
      desktop: this.homeDir,
      pictures: this.homeDir,
      music: this.homeDir,
      videos: this.homeDir
    };
  }

  /**
   * 드라이브 목록 동적 감지
   */
  async getAvailableDrives() {
    const cacheKey = 'availableDrives';
    if (this.pathCache.has(cacheKey)) {
      return this.pathCache.get(cacheKey);
    }

    let drives = [];

    try {
      if (this.platform === 'win32') {
        // Windows: A-Z 드라이브 체크
        for (let i = 65; i <= 90; i++) {
          const drive = String.fromCharCode(i) + ':\\';
          if (await this.pathExists(drive)) {
            drives.push({
              path: drive,
              label: `${String.fromCharCode(i)} 드라이브`,
              type: 'drive'
            });
          }
        }
      } else {
        // Unix 계열: 마운트 포인트 확인
        drives.push({
          path: '/',
          label: '루트',
          type: 'root'
        });

        // 일반적인 마운트 포인트들
        const commonMounts = ['/mnt', '/media', '/Volumes'];
        for (const mount of commonMounts) {
          if (await this.pathExists(mount)) {
            try {
              const items = await fs.promises.readdir(mount);
              for (const item of items) {
                const mountPath = path.join(mount, item);
                if (await this.isDirectory(mountPath)) {
                  drives.push({
                    path: mountPath,
                    label: item,
                    type: 'mount'
                  });
                }
              }
            } catch (error) {
              // 마운트 포인트 읽기 실패는 무시
            }
          }
        }
      }

      this.pathCache.set(cacheKey, drives);
      console.log('💾 사용 가능한 드라이브:', drives);
      
      return drives;
    } catch (error) {
      console.error('❌ 드라이브 감지 실패:', error);
      return [{ path: this.homeDir, label: '홈', type: 'fallback' }];
    }
  }

  /**
   * 프로젝트 관련 경로들 감지
   */
  async getProjectPaths() {
    const projectPaths = [];
    
    // 현재 프로젝트 경로
    const currentProject = process.cwd();
    projectPaths.push({
      path: currentProject,
      label: 'Current Project',
      type: 'current'
    });

    // 일반적인 개발 폴더들
    const commonDevPaths = [
      path.join(this.homeDir, 'Projects'),
      path.join(this.homeDir, 'Development'),
      path.join(this.homeDir, 'Code'),
      path.join(this.homeDir, 'workspace'),
      path.join(this.homeDir, 'Documents', 'Projects'),
      'D:\\my_app', // 당신의 현재 프로젝트 경로
      'C:\\Projects',
      'C:\\Dev'
    ];

    for (const devPath of commonDevPaths) {
      if (await this.pathExists(devPath)) {
        projectPaths.push({
          path: devPath,
          label: path.basename(devPath),
          type: 'development'
        });
      }
    }

    return projectPaths;
  }

  /**
   * 경로 존재 여부 확인 (비동기)
   */
  async pathExists(targetPath) {
    try {
      await fs.promises.access(targetPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 디렉토리 여부 확인
   */
  async isDirectory(targetPath) {
    try {
      const stat = await fs.promises.stat(targetPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 안전한 경로 생성 (보안 검사 포함)
   */
  async createSafePath(...pathSegments) {
    const targetPath = path.resolve(...pathSegments);
    
    // 경로 순회 공격 방지
    if (targetPath.includes('..') || targetPath.includes('~')) {
      throw new Error('위험한 경로가 감지되었습니다');
    }

    // 시스템 중요 경로 접근 방지
    const dangerousPaths = ['/etc', '/bin', '/sbin', 'C:\\Windows\\System32'];
    for (const dangerous of dangerousPaths) {
      if (targetPath.startsWith(dangerous)) {
        throw new Error('시스템 경로에 접근할 수 없습니다');
      }
    }

    return targetPath;
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    this.pathCache.clear();
    this.validatedPaths.clear();
    console.log('🧹 경로 캐시 클리어됨');
  }

  /**
   * 시스템 정보 반환
   */
  getSystemInfo() {
    return {
      platform: this.platform,
      username: this.userInfo.username,
      homeDir: this.homeDir,
      validatedPathsCount: this.validatedPaths.size,
      cacheSize: this.pathCache.size
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const pathResolver = new DynamicPathResolver();