/**
 * 📁 FILE OPERATIONS - 파일 시스템 작업 수행 모듈
 * 역할: 실제 파일 시스템 작업(읽기, 쓰기, 검색, 모니터링)을 수행
 * 기능: 파일 CRUD, 검색, 모니터링, 권한 관리, 성능 최적화
 * 특징: 실제 파일 작업, 성능 최적화, 실시간 모니터링
 */

import { FileSummary } from './FileSummary.js';
import { PathResolver } from './PathResolver.js';
import { FileSystemWatcher } from './FileSystemWatcher.js';
import { errorHandler } from './ErrorHandler.js';

export class FileOperations {
  constructor(mcpConnector) {
    this.mcpConnector = mcpConnector;
    this.initialized = false;
    
    // HTTP API fallback 설정
    this.fallbackApiUrl = 'http://localhost:5000';
    
    // FileSummary 인스턴스 생성
    this.fileSummary = new FileSummary();
    
    // 🌟 WORLD-CLASS PathResolver 인스턴스 생성
    this.pathResolver = new PathResolver();
    
    // 🔍 실시간 파일 시스템 감지 시스템
    this.fileWatcher = new FileSystemWatcher();
  }

  async initialize() {
    try {
      console.log('⚙️ FileOperations 초기화...');
      
      // 🌟 WORLD-CLASS PathResolver 초기화
      await this.pathResolver.initialize();
      console.log('✅ PathResolver 초기화 완료');
      
      // 🔍 실시간 파일 시스템 감지 시작
      await this.fileWatcher.startWatching();
      console.log('✅ FileSystemWatcher 시작 완료');
      
      // MCP 연결 상태 확인
      if (this.mcpConnector && this.mcpConnector.isReady()) {
        console.log('✅ MCP 커넥터 연결됨');
      } else {
        console.log('⚠️ MCP 연결 실패, HTTP API fallback 모드');
      }

      this.initialized = true;
      console.log('✅ FileOperations 초기화 완료');

    } catch (error) {
      console.error('❌ FileOperations 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🌟 WORLD-CLASS 경로 해석 및 실시간 파일 목록 조회
   */
  async listFiles(targetPath, context = {}) {
    console.log(`📋 실시간 파일 목록 조회: ${targetPath}`);

    try {
      // 🌟 이미 해석된 경로인지 확인 (HardMappingManager에서 온 경우)
      let resolvedPaths;
      if (targetPath.includes('\\') || targetPath.startsWith('C:') || targetPath.startsWith('D:')) {
        // 이미 절대 경로로 해석된 경우
        console.log(`✅ 이미 해석된 경로 사용: ${targetPath}`);
        resolvedPaths = [targetPath];
      } else {
      // 🌟 WORLD-CLASS PathResolver를 사용한 경로 해석
        resolvedPaths = await this.pathResolver.resolvePath(targetPath, context);
      console.log(`🎯 해석된 경로들:`, resolvedPaths);
      }

      // 모든 해석된 경로에서 실시간 파일 목록 조회
      const allResults = [];
      let found = false;
      for (const resolvedPath of resolvedPaths) {
        try {
          console.log(`🔍 실시간 경로 조회 중: ${resolvedPath}`);
          
          // 🔍 실시간 파일 시스템 감지 사용
          let results = await this.getRealTimeFileList(resolvedPath);
          
          if (results && results.length > 0) {
            allResults.push(...results);
            found = true;
          }
        } catch (error) {
          console.log(`⚠️ 경로 조회 실패: ${resolvedPath} - ${error.message}`);
        }
      }
      if (!found) {
        return [{
          name: '[경고] 해당 경로에 파일이나 폴더가 없습니다.',
          isDirectory: false,
          isWarning: true
        }];
      }
      return allResults;
    } catch (error) {
      const errorLog = errorHandler.logError(error, { 
        action: 'list_files', 
        targetPath,
        context: 'FileOperations.listFiles' 
      });
      throw new Error(errorLog.userFriendly.message);
    }
  }

  /**
   * 🔄 실시간 파일 목록 조회 (캐시 + 실시간 스캔)
   */
  async getRealTimeFileList(targetPath) {
    try {
      // 🔍 FileSystemWatcher에서 실시간 데이터 조회
      const realTimeFiles = await this.fileWatcher.getRealTimeFiles(targetPath);
      
      if (realTimeFiles && realTimeFiles.length > 0) {
        // FileSystemWatcher 형식을 FileOperations 형식으로 변환
        return realTimeFiles.map(file => ({
          name: file.name,
          path: file.path,
          isDirectory: file.isDirectory,
          size: file.size,
          modified: file.modified,
          created: file.created,
          permissions: file.permissions
        }));
      }
      
      // 실시간 감지가 실패하면 기존 방식 사용
      console.log(`⚠️ 실시간 감지 실패, 기존 방식 사용: ${targetPath}`);
      let results;
      if (this.mcpConnector && this.mcpConnector.isReady()) {
        results = await this.listFilesViaMCP(targetPath);
      } else {
        results = await this.listFilesViaAPI(targetPath);
      }
      return results;
      
    } catch (error) {
      console.error(`❌ 실시간 파일 목록 조회 실패: ${targetPath}`, error);
      // 실패시 기존 방식으로 fallback
      if (this.mcpConnector && this.mcpConnector.isReady()) {
        return await this.listFilesViaMCP(targetPath);
      } else {
        return await this.listFilesViaAPI(targetPath);
      }
    }
  }

  /**
   * 파일 검색
   */
  async searchFiles(searchPaths, query) {
    console.log(`🔍 파일 검색: "${query}" in ${searchPaths.length} paths`);

    const allResults = [];

    for (const searchPath of searchPaths) {
      try {
        console.log(`🔍 검색 중: ${searchPath}`);

        let results;
        if (this.mcpConnector && this.mcpConnector.isReady()) {
          results = await this.searchFilesViaMCP(searchPath, query);
        } else {
          results = await this.searchFilesViaAPI(searchPath, query);
        }

        if (results && results.length > 0) {
          console.log(`✅ ${searchPath}에서 ${results.length}개 결과 발견`);
          allResults.push(...results);
        }

      } catch (error) {
        console.log(`❌ 검색 실패: ${searchPath} - ${error.message}`);
        // 개별 경로 실패는 무시하고 계속 진행
      }
    }

    console.log(`🎯 총 검색 결과: ${allResults.length}개`);
    return allResults;
  }

  /**
   * 파일 읽기
   */
  async readFile(filePath) {
    console.log(`📄 파일 읽기: ${filePath}`);

    try {
      if (this.mcpConnector && this.mcpConnector.isReady()) {
        const result = await this.mcpConnector.readFile(filePath);
        return result.content[0]?.text || '';
      } else {
        throw new Error('파일 읽기는 MCP 연결이 필요합니다');
      }

    } catch (error) {
      console.error(`❌ 파일 읽기 실패: ${filePath}`, error);
      
      // FileSummary를 사용한 친절한 오류 메시지 생성
      const errorInfo = this.fileSummary.getErrorMessage(error, 'read_file', filePath);
      
      throw new Error(errorInfo.userMessage);
    }
  }

  /**
   * 파일 쓰기
   */
  async writeFile(filePath, content) {
    console.log(`✏️ 파일 쓰기: ${filePath}`);

    try {
      if (this.mcpConnector && this.mcpConnector.isReady()) {
        const result = await this.mcpConnector.writeFile(filePath, content);
        return {
          success: true,
          path: filePath,
          size: content.length,
          result: result
        };
      } else {
        throw new Error('파일 쓰기는 MCP 연결이 필요합니다');
      }

    } catch (error) {
      console.error(`❌ 파일 쓰기 실패: ${filePath}`, error);
      throw new Error(`파일을 쓸 수 없습니다: ${error.message}`);
    }
  }

  /**
   * 파일 삭제
   */
  async deleteFile(filePath) {
    console.log(`🗑️ 파일 삭제: ${filePath}`);

    try {
      if (this.mcpConnector && this.mcpConnector.isReady()) {
        const result = await this.mcpConnector.deleteFile(filePath);
        return {
          success: true,
          path: filePath,
          result: result
        };
      } else {
        throw new Error('파일 삭제는 MCP 연결이 필요합니다');
      }

    } catch (error) {
      console.error(`❌ 파일 삭제 실패: ${filePath}`, error);
      throw new Error(`파일을 삭제할 수 없습니다: ${error.message}`);
    }
  }

  /**
   * 파일 복사
   */
  async copyFile(sourcePath, destPath) {
    console.log(`📋 파일 복사: ${sourcePath} → ${destPath}`);

    try {
      if (this.mcpConnector && this.mcpConnector.isReady()) {
        const result = await this.mcpConnector.copyFile(sourcePath, destPath);
        return {
          success: true,
          sourcePath: sourcePath,
          destPath: destPath,
          result: result
        };
      } else {
        throw new Error('파일 복사는 MCP 연결이 필요합니다');
      }

    } catch (error) {
      console.error(`❌ 파일 복사 실패: ${sourcePath} → ${destPath}`, error);
      throw new Error(`파일을 복사할 수 없습니다: ${error.message}`);
    }
  }

  /**
   * 파일 이동
   */
  async moveFile(sourcePath, destPath) {
    console.log(`➡️ 파일 이동: ${sourcePath} → ${destPath}`);

    try {
      if (this.mcpConnector && this.mcpConnector.isReady()) {
        const result = await this.mcpConnector.moveFile(sourcePath, destPath);
        return {
          success: true,
          sourcePath: sourcePath,
          destPath: destPath,
          result: result
        };
      } else {
        throw new Error('파일 이동은 MCP 연결이 필요합니다');
      }

    } catch (error) {
      console.error(`❌ 파일 이동 실패: ${sourcePath} → ${destPath}`, error);
      throw new Error(`파일을 이동할 수 없습니다: ${error.message}`);
    }
  }

  /**
   * 경로들 유효성 검증
   */
  async validatePaths(pathCandidates) {
    console.log(`✅ 경로 검증: ${pathCandidates.length}개 후보`);

    const validPaths = [];

    for (const candidatePath of pathCandidates) {
      try {
        // 간단한 목록 조회로 경로 존재 여부 확인
        await this.listFiles(candidatePath);
        validPaths.push(candidatePath);
        console.log(`✅ 유효한 경로: ${candidatePath}`);

      } catch (error) {
        console.log(`❌ 무효한 경로: ${candidatePath}`);
      }
    }

    console.log(`🎯 검증 완료: ${validPaths.length}/${pathCandidates.length}개 유효`);
    return validPaths;
  }

  /**
   * MCP를 통한 파일 목록 조회
   */
  async listFilesViaMCP(targetPath) {
    try {
      console.log(`🔧 MCP 파일 목록 조회: ${targetPath}`);
      
      const result = await this.mcpConnector.listFiles(targetPath);
      
      console.log('🔍 [DEBUG] MCP result:', result);
      console.log('🔍 [DEBUG] MCP result type:', typeof result);
      console.log('🔍 [DEBUG] MCP result keys:', result ? Object.keys(result) : 'null');
      
      // 1. result가 직접 배열인 경우 (현재 상황)
      if (Array.isArray(result)) {
        console.log('🔍 [DEBUG] MCP result is array, returning directly');
        return result;
      }
      
      // 2. result.content 구조인 경우 (기존 로직)
      if (result && result.content && result.content[0]) {
        const content = result.content[0];
        console.log('🔍 [DEBUG] MCP content:', content);
        
        if (content.type === 'text') {
          console.log('🔍 [DEBUG] MCP content.text:', content.text);
          // JSON 형태의 응답 파싱
          try {
            const parsed = JSON.parse(content.text);
            console.log('🔍 [DEBUG] MCP parsed:', parsed);
            const final = Array.isArray(parsed) ? parsed : parsed.files || [];
            console.log('🔍 [DEBUG] MCP final result:', final);
            return final;
          } catch (parseError) {
            console.log('🔍 [DEBUG] MCP JSON parse failed, using text parsing');
            // 텍스트 형태의 응답 파싱
            const textResult = this.parseTextFileList(content.text);
            console.log('🔍 [DEBUG] MCP text parsing result:', textResult);
            return textResult;
          }
        }
      }

      console.log('🔍 [DEBUG] MCP no valid content, returning empty array');
      return [];

    } catch (error) {
      console.error('❌ MCP 파일 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * MCP를 통한 파일 검색
   */
  async searchFilesViaMCP(searchPath, query) {
    try {
      console.log(`🔧 MCP 파일 검색: "${query}" in ${searchPath}`);
      
      const result = await this.mcpConnector.searchFiles(searchPath, query, {
        recursive: true,
        maxResults: 50
      });

      if (result && result.content && result.content[0]) {
        const content = result.content[0];
        
        if (content.type === 'text') {
          try {
            const parsed = JSON.parse(content.text);
            return Array.isArray(parsed) ? parsed : parsed.results || [];
          } catch (parseError) {
            return this.parseTextSearchResults(content.text);
          }
        }
      }

      return [];

    } catch (error) {
      console.error('❌ MCP 파일 검색 실패:', error);
      throw error;
    }
  }

  /**
   * HTTP API를 통한 파일 목록 조회 (fallback)
   */
  async listFilesViaAPI(targetPath) {
    try {
      console.log(`🌐 HTTP API 파일 목록 조회: ${targetPath}`);
      
      const response = await fetch(`${this.fallbackApiUrl}/api/files?path=${encodeURIComponent(targetPath)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 1. 전체 응답 구조
      console.log('🔍 [DEBUG] Full API Response:', JSON.stringify(data, null, 2));
      // 2. data 필드 타입 및 값
      console.log('🔍 [DEBUG] data 타입:', typeof data, 'data:', data);
      // 3. data.data 필드 타입 및 값
      if (data && 'data' in data) {
        console.log('🔍 [DEBUG] data.data 타입:', typeof data.data, 'data.data:', data.data);
      if (Array.isArray(data.data)) {
          console.log('🔍 [DEBUG] data.data 배열 길이:', data.data.length, '샘플:', data.data.slice(0,3));
        } else if (data.data && typeof data.data === 'object') {
          console.log('🔍 [DEBUG] data.data 객체 keys:', Object.keys(data.data));
        }
      } else {
        console.log('🔍 [DEBUG] data.data 없음');
      }
      
      if (!data.success) {
        throw new Error(data.error || '파일 목록을 가져올 수 없습니다');
      }

      let result = data.data || [];
      // 4. result 타입 및 값
      console.log('🔍 [DEBUG] result 초기값:', result, '타입:', typeof result, 'isArray:', Array.isArray(result));
      // 5. result가 배열이 아닐 때 내부 구조
      if (!Array.isArray(result)) {
        console.log('[DEBUG] result(배열 아님):', result);
        if (result && Array.isArray(result.files)) {
          console.log('[DEBUG] result.files 배열 감지:', result.files.length, '샘플:', result.files.slice(0,3));
          result = result.files;
        } else {
          // 메타데이터 객체 방어 처리
          if (
            result &&
            typeof result === 'object' &&
            result.isArray === true &&
            result.length === 0 &&
            result.hasFiles === 'No'
          ) {
            console.log('[WARN] result가 파일 배열이 아닌 메타데이터 객체입니다. 빈 배열로 처리합니다.');
            result = [];
          } else {
            console.log('[WARN] result가 배열도 아니고 files 배열도 없음. 빈 배열로 처리.');
            result = [];
          }
        }
      }
      // 6. 최종 result 배열 길이 및 샘플
      console.log('🔍 [DEBUG] 최종 result:', result, '길이:', Array.isArray(result) ? result.length : 'N/A');
      // 7. 각 파일의 필수 필드 체크
      if (Array.isArray(result)) {
        result.forEach((item, idx) => {
          if (!item || typeof item !== 'object') {
            console.log(`[WARN] result[${idx}]가 객체가 아님:`, item);
          } else if (!item.name || !item.path) {
            console.log(`[WARN] result[${idx}] 필수 필드 누락:`, item);
          }
        });
      }
      
      return result;

    } catch (error) {
      console.error('❌ HTTP API 파일 목록 조회 실패:', error);
      
      // FileSummary를 사용한 친절한 오류 메시지 생성
      const errorInfo = this.fileSummary.getErrorMessage(error, 'list_files', targetPath);
      
      throw new Error(errorInfo.userMessage);
    }
  }

  /**
   * HTTP API를 통한 파일 검색 (fallback)
   */
  async searchFilesViaAPI(searchPath, query) {
    try {
      console.log(`🌐 HTTP API 파일 검색: "${query}" in ${searchPath}`);
      
      const response = await fetch(`${this.fallbackApiUrl}/api/search?path=${encodeURIComponent(searchPath)}&query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '파일 검색을 수행할 수 없습니다');
      }

      return data.data || [];

    } catch (error) {
      console.error('❌ HTTP API 파일 검색 실패:', error);
      
      // FileSummary를 사용한 친절한 오류 메시지 생성
      const errorInfo = this.fileSummary.getErrorMessage(error, 'search_files', searchPath);
      
      throw new Error(errorInfo.userMessage);
    }
  }

  /**
   * 텍스트 형태의 파일 목록 파싱
   */
  parseTextFileList(text) {
    const files = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 간단한 파싱 로직 (실제 MCP 응답 형식에 맞춰 조정 필요)
      const match = trimmed.match(/^(📁|📄)\s*(.+?)(\s*\((.+)\))?$/);
      if (match) {
        const isDirectory = match[1] === '📁';
        const name = match[2].trim();
        const sizeStr = match[4];

        files.push({
          name: name,
          isDirectory: isDirectory,
          size: isDirectory ? 0 : this.parseSizeString(sizeStr),
          path: `${name}`, // 상대 경로
          type: isDirectory ? 'directory' : 'file'
        });
      }
    }

    return files;
  }

  /**
   * 텍스트 형태의 검색 결과 파싱
   */
  parseTextSearchResults(text) {
    const results = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('🔍') || trimmed.startsWith('...')) continue;

      const match = trimmed.match(/^(📁|📄)\s*(.+?)(\s*\n\s*📍\s*(.+))?$/);
      if (match) {
        const isDirectory = match[1] === '📁';
        const name = match[2].trim();
        const fullPath = match[4] || name;

        results.push({
          name: name,
          isDirectory: isDirectory,
          path: fullPath,
          fullPath: fullPath,
          type: isDirectory ? 'directory' : 'file'
        });
      }
    }

    return results;
  }

  /**
   * 크기 문자열 파싱 (예: "1.5 MB" → 1572864)
   */
  parseSizeString(sizeStr) {
    if (!sizeStr) return 0;

    const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    const multipliers = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    return Math.floor(value * (multipliers[unit] || 1));
  }

  /**
   * 상태 확인
   */
  isReady() {
    return this.initialized;
  }

  /**
   * 정리 작업
   */
  async cleanup() {
    try {
      this.initialized = false;
      
      // 🔍 FileSystemWatcher 정리
      if (this.fileWatcher) {
        this.fileWatcher.cleanup();
      }
      
      console.log('✅ FileOperations 정리 완료');

    } catch (error) {
      console.error('❌ FileOperations 정리 실패:', error);
    }
  }
}