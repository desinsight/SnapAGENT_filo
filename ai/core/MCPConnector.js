/**
 * MCPConnector.js
 * 백엔드 API를 통해 MCP 서비스에 연결하는 커넥터
 * 모든 서비스들이 공유해서 사용
 */

export class MCPConnector {
  constructor() {
    this.backendUrl = 'http://localhost:5000';
    this.isConnected = false;
    this.availableTools = [];
  }

  async initialize() {
    try {
      console.log('🔗 MCP 커넥터 초기화 중 (백엔드 경유)...');

      // 백엔드 상태 확인
      const response = await fetch(`${this.backendUrl}/api/status`);
      if (!response.ok) {
        throw new Error('백엔드 서버에 연결할 수 없습니다');
      }

      const status = await response.json();
      this.isConnected = status.services?.mcp || false;
      
      console.log('✅ 백엔드를 통한 MCP 연결 성공');
      console.log('🔧 MCP 서비스 상태:', this.isConnected ? '연결됨' : '대기 중');

    } catch (error) {
      console.error('❌ MCP 커넥터 초기화 실패:', error);
      // MCP 없이도 동작하도록 (graceful degradation)
      this.isConnected = false;
    }
  }

  /**
   * 백엔드 API 호출
   */
  async callAPI(endpoint, method = 'GET', data = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const url = method === 'GET' && data 
        ? `${this.backendUrl}${endpoint}?${new URLSearchParams(data)}`
        : `${this.backendUrl}${endpoint}`;

      console.log(`🌐 백엔드 API 호출: ${method} ${endpoint}`);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ 백엔드 API 호출 성공: ${endpoint}`);
      
      return result;

    } catch (error) {
      console.error(`❌ 백엔드 API 호출 실패: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * 파일 목록 조회
   */
  async listFiles(path) {
    const result = await this.callAPI('/api/files', 'GET', { path });
    return result.data;
  }

  /**
   * 파일 검색
   */
  async searchFiles(basePath, query, options = {}) {
    const searchParams = {
      path: basePath,
      query,
      ...options
    };
    
    const result = await this.callAPI('/api/search', 'GET', searchParams);
    return result.data;
  }

  /**
   * 파일 읽기 - 백엔드 API로 구현 필요시 추가
   */
  async readFile(path) {
    // 백엔드에 파일 읽기 API가 있다면 사용
    throw new Error('파일 읽기는 현재 백엔드 API에서 지원하지 않습니다');
  }

  /**
   * 파일 쓰기
   */
  async writeFile(filePath, content, options = {}) {
    const result = await this.callAPI('/api/files/write', 'POST', {
      filePath,
      content,
      options
    });
    return result.data;
  }

  /**
   * 파일 삭제
   */
  async deleteFile(path) {
    const result = await this.callAPI('/api/files', 'DELETE', { path });
    return result.data;
  }

  /**
   * 파일 복사
   */
  async copyFile(sourcePath, targetPath) {
    const result = await this.callAPI('/api/files/copy', 'POST', {
      sourcePath,
      targetPath
    });
    return result.data;
  }

  /**
   * 파일 이동
   */
  async moveFile(sourcePath, targetPath) {
    const result = await this.callAPI('/api/files/move', 'POST', {
      sourcePath,
      targetPath
    });
    return result.data;
  }

  /**
   * 연결 상태 확인
   */
  isReady() {
    return this.isConnected;
  }

  /**
   * 사용 가능한 도구들 목록
   */
  getAvailableTools() {
    return this.availableTools;
  }

  /**
   * 백엔드 상태 조회
   */
  async getBackendStatus() {
    try {
      const result = await this.callAPI('/api/status');
      return result;
    } catch (error) {
      console.error('백엔드 상태 조회 실패:', error);
      return null;
    }
  }

  /**
   * 정리 작업
   */
  async cleanup() {
    try {
      console.log('🔗 MCP 커넥터 정리 중...');
      this.isConnected = false;
      this.availableTools = [];
      console.log('✅ MCP 커넥터 정리 완료');

    } catch (error) {
      console.error('❌ MCP 커넥터 정리 실패:', error);
    }
  }
}