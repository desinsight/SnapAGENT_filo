import winston from 'winston';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export class MCPService {
  constructor() {
    this.isReady = false;
    this.mcpProcess = null;
    this.client = null;
            // 절대 경로로 MCP 서버 경로 설정
        const rootDir = path.resolve(__dirname, '../../../');
        this.mcpServerPath = path.join(rootDir, 'packages/mcp-server/src/index.js');
    // 경로 디버깅
    logger.info('MCP Server Path:', this.mcpServerPath);
    logger.info('Path exists:', fs.existsSync(this.mcpServerPath));
    console.log('🔍 MCP Server Path:', this.mcpServerPath);
    console.log('🔍 Path exists:', fs.existsSync(this.mcpServerPath));
  }

  async initialize() {
    try {
      // MCP 서버 프로세스 시작
      await this.startMCPServer();
      
      // MCP 클라이언트 초기화
      await this.initializeClient();
      
      this.isReady = true;
      logger.info('MCP Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize MCP Service:', error);
      this.isReady = false;
      throw error;
    }
  }

  async startMCPServer() {
    return new Promise((resolve, reject) => {
      try {
        console.log('🚀 MCP 서버 시작 시도...');
        console.log('🚀 MCP Server Path:', this.mcpServerPath);
        console.log('🚀 명령어:', 'node', [this.mcpServerPath, '--http']);
        console.log('🚀 현재 작업 디렉토리:', process.cwd());
        
        // MCP 서버를 HTTP 모드로 시작
        const mcpServerDir = path.dirname(this.mcpServerPath);
        console.log('🚀 MCP Server Directory:', mcpServerDir);
        
        // 절대 경로로 MCP 서버 실행
        console.log('🚀 실제 실행 명령어:', 'node', this.mcpServerPath, '--http');
        console.log('🚀 작업 디렉토리:', mcpServerDir);
        
        // 절대 경로로 node 실행 (Windows 경로 문제 해결)
        const nodePath = process.execPath; // Node.js 실행 파일의 절대 경로
        console.log('🚀 Node.js 경로:', nodePath);
        
        // Windows에서 경로 문제 해결을 위해 절대 경로 사용
        this.mcpProcess = spawn(nodePath, [this.mcpServerPath, '--http'], {
          env: { ...process.env, NODE_ENV: 'production' },
          cwd: mcpServerDir, // 작업 디렉토리 설정
          shell: false // shell: false로 변경하여 직접 실행
        });

        this.mcpProcess.stdout.on('data', (data) => {
          const output = data.toString();
          logger.info('MCP Server stdout:', output);
          console.log('🔍 MCP Server stdout:', output);
          
          // 서버가 준비되었는지 확인
          if (output.includes('HTTP server started') || 
              output.includes('ready') || 
              output.includes('포트 5050에서 시작') ||
              output.includes('HTTP 서버가 포트 5050에서 시작되었습니다') ||
              output.includes('웹 서버가 포트 5050에서 시작되었습니다')) {
            logger.info('MCP Server 준비 완료 감지');
            console.log('✅ MCP Server 준비 완료 감지');
            resolve();
          }
        });

        this.mcpProcess.stderr.on('data', (data) => {
          const errorOutput = data.toString();
          logger.error('MCP Server Error:', errorOutput);
          console.log('❌ MCP Server stderr:', errorOutput);
        });

        this.mcpProcess.on('error', (error) => {
          logger.error('MCP Server process error:', error);
          console.log('❌ MCP Server process error:', error);
          reject(error);
        });

        this.mcpProcess.on('exit', (code, signal) => {
          logger.info('MCP Server process exited:', { code, signal });
          console.log('🔄 MCP Server process exited:', { code, signal });
        });

        // 10초 타임아웃
        setTimeout(() => {
          if (!this.isReady) {
            reject(new Error('MCP Server startup timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  async initializeClient() {
    // MCP HTTP 클라이언트 초기화
    this.client = {
      listFiles: async (path) => {
        try {
          const response = await fetch(`http://localhost:5050/api/files?path=${encodeURIComponent(path)}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return await response.json();
        } catch (error) {
          logger.error('MCP listFiles failed:', error);
          throw error;
        }
      },
      
      searchFiles: async (query, searchPath = '.') => {
        try {
          const response = await fetch(`http://localhost:5050/api/search?query=${encodeURIComponent(query)}&path=${encodeURIComponent(searchPath)}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return await response.json();
        } catch (error) {
          logger.error('MCP searchFiles failed:', error);
          throw error;
        }
      },
      
      readFile: async (path) => {
        try {
          const response = await fetch(`http://localhost:5050/api/files/read?path=${encodeURIComponent(path)}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return await response.json();
        } catch (error) {
          logger.error('MCP readFile failed:', error);
          throw error;
        }
      }
    };
  }

  async handleReconnect() {
    logger.info('Attempting to reconnect to MCP server...');
    try {
      await this.initialize();
      logger.info('MCP reconnection successful');
    } catch (error) {
      logger.error('MCP reconnection failed:', error);
      throw error;
    }
  }

  async checkReady() {
    if (!this.isReady) {
      throw new Error('MCP Service is not ready');
    }
  }

  // 고성능 파일 시스템 API
  async getEnhancedFileList(path, options = {}) {
    await this.checkReady();
    
    try {
      const result = await this.client.listFiles(path);
      
      // 추가 메타데이터 수집
      if (options.includeMetadata && result.content) {
        for (const file of result.content) {
          if (!file.isDirectory) {
            file.metadata = await this.getFileMetadata(file.path);
          }
        }
      }

      logger.info(`Enhanced file list for ${path}: ${result.content?.length || 0} items`);
      
      return result;
    } catch (error) {
      logger.error('Failed to get enhanced file list:', error);
      throw error;
    }
  }

  async performAdvancedSearch(query, path, options = {}) {
    await this.checkReady();
    
    try {
      const result = await this.client.searchFiles(query, path);
      
      logger.info(`Advanced search for "${query}" in ${path}: ${result.content?.length || 0} results`);
      
      return result;
    } catch (error) {
      logger.error('Advanced search failed:', error);
      throw error;
    }
  }

  async getFileMetadata(filePath) {
    try {
      const ext = filePath.split('.').pop()?.toLowerCase();
      const metadata = { extension: ext };

      if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
        metadata.type = 'image';
      } else if (['mp4', 'avi', 'mkv', 'mov'].includes(ext)) {
        metadata.type = 'video';
      } else if (['mp3', 'wav', 'flac', 'm4a'].includes(ext)) {
        metadata.type = 'audio';
      } else if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
        metadata.type = 'document';
      }

      return metadata;
    } catch (error) {
      logger.error('Failed to get file metadata:', error);
      return { extension: 'unknown' };
    }
  }

  async optimizeFileOperation(operation, ...args) {
    await this.checkReady();
    
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (operation) {
        case 'copy':
          const [sourcePath, targetPath] = args;
          const copyResponse = await fetch(`http://localhost:5050/api/files/copy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourcePath, targetPath })
          });
          if (!copyResponse.ok) {
            throw new Error(`Copy failed: ${copyResponse.statusText}`);
          }
          result = await copyResponse.json();
          break;
        case 'move':
          const [moveSource, moveTarget] = args;
          const moveResponse = await fetch(`http://localhost:5050/api/files/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourcePath: moveSource, targetPath: moveTarget })
          });
          if (!moveResponse.ok) {
            throw new Error(`Move failed: ${moveResponse.statusText}`);
          }
          result = await moveResponse.json();
          break;
        case 'delete':
          const [deletePath] = args;
          const deleteResponse = await fetch(`http://localhost:5050/api/files`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: deletePath })
          });
          if (!deleteResponse.ok) {
            throw new Error(`Delete failed: ${deleteResponse.statusText}`);
          }
          result = await deleteResponse.json();
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      const duration = Date.now() - startTime;
      logger.info(`Optimized ${operation} operation completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      logger.error(`Optimized ${operation} operation failed:`, error);
      throw error;
    }
  }

  async batchFileOperations(operations) {
    await this.checkReady();
    
    const results = [];
    const startTime = Date.now();
    
    try {
      for (const operation of operations) {
        const result = await this.optimizeFileOperation(
          operation.type,
          ...operation.args
        );
        results.push({ ...operation, result, success: true });
      }
      
      const duration = Date.now() - startTime;
      logger.info(`Batch operations completed: ${operations.length} operations in ${duration}ms`);
      
      return results;
    } catch (error) {
      logger.error('Batch operations failed:', error);
      throw error;
    }
  }

  async getSystemStatus() {
    return {
      isReady: this.isReady,
      mcpProcess: this.mcpProcess ? 'running' : 'stopped',
      client: this.client ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    };
  }

  async shutdown() {
    try {
      if (this.mcpProcess) {
        this.mcpProcess.kill();
        this.mcpProcess = null;
      }
      this.isReady = false;
      this.client = null;
      logger.info('MCP Service shutdown completed');
    } catch (error) {
      logger.error('MCP Service shutdown error:', error);
    }
  }
}