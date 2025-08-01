// Electron API wrapper for renderer process

class ElectronAPI {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;
  }

  // Check if running in electron environment
  isElectronApp() {
    return this.isElectron;
  }

  // File system operations
  async listFiles(path) {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.listFiles(path);
  }

  async listDrives() {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.listDrives();
  }

  async getFileIcon(filePath) {
    if (!this.isElectron) {
      return '📄'; // Default icon for web
    }
    return await window.electronAPI.getFileIcon(filePath);
  }

  async deleteFile(filePath) {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.deleteFile(filePath);
  }

  async openFile(filePath) {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.openFile(filePath);
  }

  async moveFile(sourcePath, destinationPath) {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.moveFile(sourcePath, destinationPath);
  }

  async copyFile(sourcePath, destinationPath) {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.copyFile(sourcePath, destinationPath);
  }

  async renameFile(oldPath, newPath) {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.renameFile(oldPath, newPath);
  }

  // 즐겨찾기 관련 함수들
  async addFavorite(favoriteData) {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.addFavorite(favoriteData);
  }

  async removeFavorite(path) {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.removeFavorite(path);
  }

  async getFavorites() {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.getFavorites();
  }

  // Dialog operations
  async showSaveDialog(options = {}) {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.showSaveDialog(options);
  }

  async showOpenDialog(options = {}) {
    if (!this.isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return await window.electronAPI.showOpenDialog(options);
  }

  // System information
  async getHomeDirectory() {
    if (!this.isElectron) {
      return '/'; // Default for web
    }
    return await window.electronAPI.getHomeDirectory();
  }

  async getUserDirectories() {
    if (!this.isElectron) {
      return {
        home: '/',
        desktop: '/desktop',
        documents: '/documents',
        downloads: '/downloads',
        pictures: '/pictures',
        music: '/music',
        videos: '/videos'
      };
    }
    return await window.electronAPI.getUserDirectories();
  }

  // Event listeners
  on(event, callback) {
    if (!this.isElectron) {
      console.warn('Event listeners not available in web environment');
      return;
    }
    window.electronAPI.on(event, callback);
  }

  off(event, callback) {
    if (!this.isElectron) {
      console.warn('Event listeners not available in web environment');
      return;
    }
    window.electronAPI.off(event, callback);
  }

  // Send events to main process
  send(channel, ...args) {
    if (!this.isElectron) {
      console.warn('IPC not available in web environment');
      return;
    }
    window.electronAPI.send(channel, ...args);
  }

  // Invoke methods in main process
  async invoke(channel, ...args) {
    if (!this.isElectron) {
      throw new Error('IPC not available in web environment');
    }
    return await window.electronAPI.invoke(channel, ...args);
  }
}

// Create and export singleton instance
const electronAPI = new ElectronAPI();
export default electronAPI;