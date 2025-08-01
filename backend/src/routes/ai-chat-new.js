/**
 * AI 채팅 API (새로운 AIOrchestrator 구조)
 * AIOrchestrator를 사용한 진정한 AI-MCP 연결
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

// ToolOrchestrator 임포트
import { ToolOrchestrator } from '../../../ai/core/AIOrchestrator.js';
import { ServiceRegistry } from '../../../ai/core/ServiceRegistry.js';
import { MCPConnector } from '../../../ai/core/MCPConnector.js';
import { getSubscriptionService } from '../services/subscriptionService.js';
import { HardMappingManager } from '../../../ai/services/filesystem/HardMappingManager.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NewAIChatHandler {
  constructor() {
    this.toolOrchestrator = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.hardMappingManager = new HardMappingManager();
  }

  /**
   * AIOrchestrator 초기화 (지연 초기화)
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  async _doInitialize() {
    try {
      console.log('🚀 ToolOrchestrator 초기화 시작...');

      // 1. MCP 커넥터 생성 및 초기화
      const mcpConnector = new MCPConnector();
      await mcpConnector.initialize();

      // 2. 구독 서비스 가져오기
      const subscriptionService = await getSubscriptionService();

      // 3. 서비스 레지스트리 생성 및 초기화
      const serviceRegistry = new ServiceRegistry(subscriptionService);
      // MCP 커넥터를 서비스 레지스트리에 수동으로 설정
      serviceRegistry.mcpConnector = mcpConnector;
      await serviceRegistry.initialize();

      // 4. AI 오케스트레이터 생성 및 초기화
      this.toolOrchestrator = new ToolOrchestrator(serviceRegistry, subscriptionService);
      await this.toolOrchestrator.initialize();

      // 5. HardMappingManager 초기화
      await this.hardMappingManager.initialize();

      this.isInitialized = true;
      console.log('✅ ToolOrchestrator 초기화 완료');

    } catch (error) {
      console.error('❌ ToolOrchestrator 초기화 실패:', error);
      // 초기화 실패해도 계속 동작하도록 (graceful degradation)
      this.toolOrchestrator = null;
      this.isInitialized = false;
      // 에러를 다시 던지지 않음 - fallback 모드로 동작
    }
  }

  /**
   * 메인 채팅 처리 - ToolOrchestrator 사용 (레거시)
   */
  async processChat(message, context = {}) {
    try {
      console.log(`🤖 새로운 AI 채팅 요청: "${message}"`);

      // 확장자 검색 요청 확인
      const extensionSearchInfo = this.isExtensionSearchRequest(message);
      console.log('🔍 확장자 검색 감지 결과:', extensionSearchInfo);
      
      if (extensionSearchInfo.isExtensionSearch) {
        console.log('🔍 확장자 검색 요청 감지 - 직접 처리');
        return await this.handleExtensionSearch(extensionSearchInfo, context);
      }

      // ToolOrchestrator 초기화 확인
      await this.initialize();

      // ToolOrchestrator가 준비되었으면 사용
      if (this.toolOrchestrator && this.isInitialized) {
        console.log('🎯 ToolOrchestrator를 통한 처리 시작');
        
        const result = await this.toolOrchestrator.executeToolRequest('deprecated', {message}, 'legacy');
        
        if (result && result.response) {
          console.log('✅ ToolOrchestrator 처리 성공');
          
          // 확장자 검색 요청인 경우 frontendAction 추가
          const extensionSearchInfo = this.isExtensionSearchRequest(message);
          let frontendAction = null;
          
          if (extensionSearchInfo.isExtensionSearch) {
            const folderInfo = this.extractFolderFromMessage(message);
            frontendAction = {
              type: 'navigate_to_extension_search',
              extensions: extensionSearchInfo.extensions,
              searchPaths: folderInfo.paths
            };
            console.log('🎯 frontendAction 추가:', frontendAction);
          }
          
          return {
            response: result.response,
            service: result.serviceUsed || 'ai-orchestrator',
            timestamp: new Date().toISOString(),
            mode: 'orchestrator',
            data: frontendAction ? { frontendAction } : undefined
          };
        }
      }

      // ToolOrchestrator 실패시 fallback 모드
      console.log('⚠️ ToolOrchestrator 사용 불가, fallback 모드');
      return await this.fallbackProcessing(message, context);

    } catch (error) {
      console.error('💥 AI 채팅 처리 중 오류:', error);
      console.error('💥 오류 스택:', error.stack);
      
      // 에러 발생시에도 fallback 시도
      return await this.fallbackProcessing(message, context);
    }
  }

  /**
   * Fallback 처리 (기존 방식)
   */
  async fallbackProcessing(message, context) {
    try {
      console.log('🔄 Fallback 모드로 처리');

      // 간단한 파일 관련 키워드 감지
      const isFileRequest = this.isFileRequest(message);
      
      if (isFileRequest) {
        // 기존 백엔드 API 호출 (HTTP)
        const fileData = await this.getFileListViaHTTP(message, context);
        
        if (fileData) {
          return {
            response: `요청하신 정보를 확인했습니다:\n\n${fileData}`,
            service: 'fallback-http',
            timestamp: new Date().toISOString(),
            mode: 'fallback'
          };
        }
      }

      // 최종 fallback 응답
      return {
        response: '현재 AI 시스템이 준비 중입니다. 잠시 후 다시 시도해주세요.',
        service: 'fallback-simple',
        timestamp: new Date().toISOString(),
        mode: 'fallback'
      };

    } catch (error) {
      console.error('❌ Fallback 처리도 실패:', error);
      
      return {
        response: '죄송합니다. 현재 시스템에 일시적인 문제가 있습니다.',
        service: 'fallback-error',
        timestamp: new Date().toISOString(),
        mode: 'error'
      };
    }
  }

  /**
   * 파일 관련 요청 감지 (간단 버전)
   */
  isFileRequest(message) {
    const fileKeywords = [
      '파일', '폴더', '디렉토리', '바탕화면', '문서', 
      '찾아', '검색', '목록', '뭐가 있', '보여',
      '.pdf', '.jpg', '.png', '.txt', '.doc',
      'C:', 'D:', '/mnt/', '프로젝트', 'my_app'
    ];
    
    return fileKeywords.some(keyword => message.includes(keyword));
  }
  
  /**
   * 확장자 검색 요청 감지
   */
  isExtensionSearchRequest(message) {
    // 확장자 패턴 감지
    const extensionPattern = /\.(\w+)/g;
    const extensions = message.match(extensionPattern);
    
    if (extensions && extensions.length > 0) {
      return {
        isExtensionSearch: true,
        extensions: extensions.map(ext => ext.toLowerCase()),
        message: message
      };
    }
    
    // 확장자 키워드 감지
    const extensionKeywords = [
      'pdf', 'jpg', 'png', 'txt', 'doc', 'docx', 'xls', 'xlsx',
      'zip', 'rar', 'mp3', 'mp4', 'avi', 'mov', 'js', 'py',
      'skp', 'dwg', 'dxf', '3ds', 'max', 'blend', 'obj', 'fbx',
      'PDF', 'JPG', 'PNG', 'TXT', 'DOC', 'DOCX', 'XLS', 'XLSX',
      'SKP', 'DWG', 'DXF', '3DS', 'MAX', 'BLEND', 'OBJ', 'FBX'
    ];
    
    const foundExtensions = extensionKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (foundExtensions.length > 0) {
      return {
        isExtensionSearch: true,
        extensions: foundExtensions.map(ext => `.${ext.toLowerCase()}`),
        message: message
      };
    }
    
    return { isExtensionSearch: false };
  }

  /**
   * 확장자 검색 처리
   */
  async handleExtensionSearch(extensionInfo, context) {
    try {
      console.log(`🔍 확장자 검색 처리: ${extensionInfo.extensions.join(', ')}`);
      
      // 사용자 메시지에서 폴더 정보 추출 (HardMappingManager 사용)
      const folderInfo = this.extractFolderFromMessage(extensionInfo.message);
      console.log(`📁 추출된 폴더 정보:`, folderInfo);
      
      const results = [];
      
      for (const extension of extensionInfo.extensions) {
        // FileSystemService를 통한 확장자 검색
        const searchResult = await this.searchFilesByExtension(extension, context);
        results.push({
          extension: extension,
          result: searchResult
        });
      }
      
      // 결과 포맷팅
      const formattedResponse = this.formatExtensionSearchResponse(results, extensionInfo.message);
      
      return {
        response: formattedResponse,
        service: 'extension-search',
        timestamp: new Date().toISOString(),
        mode: 'extension-search',
        data: {
          extensions: extensionInfo.extensions,
          results: results,
          frontendAction: {
            type: 'navigate_to_extension_search',
            extensions: extensionInfo.extensions,
            searchPaths: folderInfo.paths // HardMappingManager에서 추출된 정확한 경로 사용
          }
        }
      };
      
    } catch (error) {
      console.error('❌ 확장자 검색 처리 실패:', error);
      
      return {
        response: `확장자 검색 중 오류가 발생했습니다: ${error.message}`,
        service: 'extension-search-error',
        timestamp: new Date().toISOString(),
        mode: 'error'
      };
    }
  }
  
  /**
   * FileSystemService를 통한 확장자 검색
   */
  async searchFilesByExtension(extension, context) {
    try {
      console.log(`🔍 확장자 검색 실행: ${extension}`);
      
      // 직접 search_by_extension API 호출
      const params = new URLSearchParams({
        extension: extension.replace('.', ''),
        searchPaths: 'C:\\Users\\hki\\Downloads,C:\\Users\\hki\\Desktop,C:\\Users\\hki\\Documents'
      });
      
      const response = await fetch(`http://localhost:5000/api/tools/search-by-extension?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ 확장자 검색 완료: ${extension}`, result.success ? `${result.result.files?.length || 0}개 파일` : '실패');
      
      return result;
      
    } catch (error) {
      console.error(`❌ 확장자 검색 실패: ${extension}`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 확장자 검색 결과 포맷팅
   */
  formatExtensionSearchResponse(results, originalMessage) {
    let response = `🔍 확장자 검색 결과:\n\n`;
    
    let totalFiles = 0;
    const foundExtensions = [];
    
    for (const result of results) {
      if (result.result.success && result.result.files && result.result.files.length > 0) {
        foundExtensions.push(result.extension);
        totalFiles += result.result.files.length;
        
        response += `📄 ${result.extension.toUpperCase()} 파일 ${result.result.files.length}개:\n`;
        
        // 최대 5개 파일만 표시
        const displayFiles = result.result.files.slice(0, 5);
        displayFiles.forEach(file => {
          const size = this.formatFileSize(file.size || 0);
          const date = new Date(file.modified).toLocaleDateString('ko-KR');
          response += `  • ${file.name} (${size}, ${date})\n`;
        });
        
        if (result.result.files.length > 5) {
          response += `  ... 외 ${result.result.files.length - 5}개 파일\n`;
        }
        response += '\n';
      }
    }
    
    if (foundExtensions.length === 0) {
      response = `🔍 요청하신 확장자 파일을 찾을 수 없습니다.\n\n`;
      response += `검색된 확장자: ${results.map(r => r.extension).join(', ')}\n`;
      response += `검색 경로: 바탕화면, 문서, 다운로드 폴더`;
    } else {
      response += `📊 총 ${totalFiles}개 파일을 찾았습니다.\n\n`;
      response += `💡 파일 탐색기에서 해당 폴더로 이동하여 확장자 필터를 적용할 수 있습니다.`;
    }
    
    return response;
  }
  
  /**
   * 📁 사용자 메시지에서 폴더 정보 추출 (HardMappingManager 재활용)
   */
  extractFolderFromMessage(message) {
    try {
      // HardMappingManager를 사용해서 경로 해석
      const resolvedPaths = this.hardMappingManager.resolvePath(message);
      
      if (resolvedPaths && resolvedPaths.length > 0) {
        console.log(`✅ HardMappingManager 경로 해석: "${message}" → ${resolvedPaths}`);
        return {
          paths: resolvedPaths,
          found: true
        };
      }
      
      // 기본 경로들 반환
      const userProfile = os.homedir();
      console.log(`⚠️ HardMappingManager에서 경로를 찾을 수 없음, 기본 경로 사용`);
      return {
        paths: [`${userProfile}\\Desktop`, `${userProfile}\\Documents`, `${userProfile}\\Downloads`],
        found: false
      };
      
    } catch (error) {
      console.error('❌ HardMappingManager 경로 해석 실패:', error);
      
      // 에러 시 기본 경로들 반환
      const userProfile = os.homedir();
      return {
        paths: [`${userProfile}\\Desktop`, `${userProfile}\\Documents`, `${userProfile}\\Downloads`],
        found: false
      };
    }
  }
  
  /**
   * 파일 크기 포맷팅
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * HTTP API를 통한 파일 목록 조회 (fallback)
   */
  async getFileListViaHTTP(message, context) {
    try {
      // 경로 추출 (간단 버전)
      let path = '/mnt/d';
      
      if (message.includes('my_app') || message.includes('프로젝트')) {
        path = '/mnt/d/my_app';
      }

      const response = await fetch(`http://localhost:5000/api/files?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data)) {
        const files = data.data.slice(0, 10); // 최대 10개만
        
        let fileListText = `📁 ${path}\n`;
        files.forEach(file => {
          const icon = file.isDirectory ? '📁' : '📄';
          fileListText += `${icon} ${file.name}\n`;
        });
        
        return fileListText;
      }

      return null;

    } catch (error) {
      console.error('HTTP API 호출 실패:', error);
      return null;
    }
  }

  /**
   * 상태 확인
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      orchestratorReady: this.aiOrchestrator !== null,
      mode: this.isInitialized ? 'orchestrator' : 'fallback'
    };
  }

  /**
   * 정리 작업
   */
  async cleanup() {
    try {
      if (this.aiOrchestrator) {
        await this.aiOrchestrator.cleanup();
      }
      
      this.toolOrchestrator = null;
      this.isInitialized = false;
      this.initializationPromise = null;
      
      console.log('✅ NewAIChatHandler 정리 완료');

    } catch (error) {
      console.error('❌ NewAIChatHandler 정리 실패:', error);
    }
  }
}

// 전역 AI 채팅 핸들러 인스턴스
const newAIChatHandler = new NewAIChatHandler();

/**
 * POST /api/ai/chat
 * 새로운 AI 채팅 엔드포인트
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, service, context } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: '메시지가 필요합니다'
      });
    }

    console.log(`🚀 새로운 AI 채팅 API 호출: "${message}"`);
    console.log('📍 컨텍스트:', context);

    // AI 처리
    const result = await newAIChatHandler.processChat(message.trim(), context || {});

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('새로운 AI 채팅 에러:', error);
    
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/status
 * AI 시스템 상태 확인
 */
router.get('/status', async (req, res) => {
  try {
    const status = newAIChatHandler.getStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('AI 상태 확인 에러:', error);
    
    res.status(500).json({
      success: false,
      error: '상태 확인 중 오류가 발생했습니다'
    });
  }
});

export default router;