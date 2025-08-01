/**
 * Tool 실행 엔드포인트 - 5단계
 * 구독 체크, 스키마 검증, Tool 실행 관리
 */

import express from 'express';
import { getSubscriptionService } from '../services/subscriptionService.js';
import { getToolSchemaRegistry } from '../middleware/toolSchemaRegistry.js';
import { toolLogger } from '../middleware/toolLogger.js';
import { FileSystemTools } from '../tools/fileSystem.js';
// PathResolver는 현재 사용되지 않으므로 주석 처리
// import { PathResolver } from '../../../ai/services/filesystem/PathResolver.js';
import { ToolExecutionManager, getToolExecutionManager } from '../utils/toolExecution.js';

const router = express.Router();

// 파일시스템 도구 인스턴스 (전역)
let fileSystemTools = null;

// Tool Execution Manager 인스턴스
// let toolExecutionManager = null;

// 파일시스템 도구 초기화
async function getFileSystemTools() {
  if (!fileSystemTools) {
    fileSystemTools = new FileSystemTools();
    await fileSystemTools.initialize();
  }
  return fileSystemTools;
}

// 경로 해석기는 현재 사용되지 않음
// async function getPathResolver() {
//   if (!pathResolver) {
//     pathResolver = new PathResolver();
//     await pathResolver.initialize();
//   }
//   return pathResolver;
// }

/**
 * POST /api/tools/execute
 * Tool 실행 엔드포인트
 */
router.post('/execute', toolLogger, async (req, res) => {
  try {
    // Claude API와 frontend 두 형식 모두 지원
    const tool_name = req.body.tool_name || req.body.tool;
    const parameters = req.body.parameters;
    const user_id = req.body.user_id || 'anonymous';
    
    // 1. 입력 유효성 검증
    if (!tool_name || !parameters) {
      return res.status(400).json({
        success: false,
        error: 'missing_required_fields',
        message: 'tool_name/tool, parameters가 필요합니다.',
        required_fields: ['tool_name (또는 tool)', 'parameters'],
        received: {
          tool_name: req.body.tool_name,
          tool: req.body.tool,
          parameters: req.body.parameters,
          user_id: req.body.user_id
        }
      });
    }

    console.log(`🔧 Tool 실행 요청: ${tool_name} (사용자: ${user_id})`);

    // 개선: tool_name이 'filesystem'으로 시작하면 모두 직접 실행
    if (tool_name && tool_name.startsWith('filesystem')) {
      return await executeFileSystemToolDirect(parameters, user_id, res);
    }

    // 3. ToolExecutionManager를 통한 실행
    const executionManager = await getToolExecutionManager();
    
    // 4. 구독 상태 확인 (개발 모드가 아닐 때만)
    if (process.env.SUBSCRIPTION_MODE !== 'development') {
      const subscriptionService = await getSubscriptionService();
      const isSubscribed = await subscriptionService.checkUserSubscription(user_id, tool_name);
      if (!isSubscribed) {
        const subscriptionMessage = await subscriptionService.getSubscriptionRequiredMessage(tool_name, user_id);
        
        return res.status(403).json({
          success: false,
          error: 'subscription_required',
          message: `${tool_name} Tool을 사용하려면 구독이 필요합니다.`,
          subscription_info: subscriptionMessage,
          tool_name: tool_name,
          user_id: user_id
        });
      }

      // 5. 사용량 제한 확인
      const usageCheck = await subscriptionService.checkDailyUsageLimit(user_id, tool_name);
      if (!usageCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: 'usage_limit_exceeded',
          message: usageCheck.reason === 'daily_limit_exceeded' 
            ? `일일 사용량 한도에 도달했습니다. (${usageCheck.currentUsage}/${usageCheck.dailyLimit})`
            : '사용량 제한에 도달했습니다.',
          usage_info: usageCheck,
          tool_name: tool_name,
          user_id: user_id
        });
      }
    }
    
    const result = await executionManager.executeToolSafely(tool_name, parameters, user_id);

    // 6. 사용량 기록
    const subscriptionService = await getSubscriptionService();
    await subscriptionService.recordUsage(user_id, tool_name);

    // 7. 성공 응답
    const response = {
      success: result.success,
      tool_name: tool_name,
      user_id: user_id,
      result: result.result,
      execution_info: {
        timestamp: result.timestamp,
        execution_time: result.execution_time,
        operation: result.operation || null
      }
    };

    if (!result.success) {
      response.error = result.error;
      response.message = result.error;
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Tool 실행 실패:', error);
    
    res.status(500).json({
      success: false,
      error: 'execution_error',
      message: 'Tool 실행 중 오류가 발생했습니다.',
      error_details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 파일시스템 도구 직접 실행
 */
async function executeFileSystemToolDirect(parameters, userId, res) {
  let startTime = Date.now();
  try {
    // action 파라미터 추출
    const { action, ...params } = parameters;
    console.log('[DEBUG] 파일시스템 도구 실행 요청:', { action, params, userId });

    // 한글 경로를 실제 OS 경로로 임시 변환
    if (params.path && typeof params.path === 'string') {
      // 인코딩 문제로 "????"로 변환된 경우 처리
      if (params.path === '????') {
        console.log('[DEBUG] 인코딩 문제 감지: "????" → "바탕화면"으로 추정');
        params.path = '바탕화면';
      }
      
      const pathMap = {
        '바탕화면': 'C:/Users/hki/Desktop',
        '내문서': 'C:/Users/hki/Documents',
        '다운로드': 'C:/Users/hki/Downloads',
        '문서': 'C:/Users/hki/Documents',
        '사진': 'C:/Users/hki/Pictures',
        '음악': 'C:/Users/hki/Music',
        '비디오': 'C:/Users/hki/Videos'
      };
      
      // 복합 경로 처리 (예: "바탕화면/test", "문서/D5 Render")
      let transformedPath = params.path;
      
      // "????"를 "바탕화면"으로 변환 (인코딩 문제 해결)
      if (transformedPath.startsWith('????')) {
        transformedPath = transformedPath.replace('????', '바탕화면');
        console.log(`[DEBUG] 인코딩 문제 해결: '${params.path}' → '${transformedPath}'`);
      }
      
      for (const [koreanPath, realPath] of Object.entries(pathMap)) {
        if (transformedPath.startsWith(koreanPath + '/') || transformedPath.startsWith(koreanPath + '\\')) {
          const subPath = transformedPath.substring(koreanPath.length);
          transformedPath = realPath + subPath;
          console.log(`[DEBUG] 복합 경로 변환: '${params.path}' → '${transformedPath}'`);
          break;
        } else if (transformedPath === koreanPath) {
          transformedPath = realPath;
          console.log(`[DEBUG] 단순 경로 변환: '${params.path}' → '${transformedPath}'`);
          break;
        }
      }
      
      // 직접 경로가 이미 올바른 형식인 경우 (예: "C:\Users\hki\Documents\D5 Render")
      if (transformedPath === params.path && (transformedPath.includes(':\\') || transformedPath.includes(':/'))) {
        console.log(`[DEBUG] 직접 경로 감지: '${params.path}'`);
        // 백슬래시를 슬래시로 변환
        transformedPath = transformedPath.replace(/\\/g, '/');
      }
      
      params.path = transformedPath;
      console.log(`[DEBUG] 최종 경로: '${params.path}'`);
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'missing_action',
        message: '파일시스템 도구 실행을 위해 action 파라미터가 필요합니다.',
        example: {
          tool_name: "filesystem",
          parameters: {
            action: "list_files",
            path: "D:\\"
          },
          user_id: "testuser"
        }
      });
    }
    console.log(`🔧 파일시스템 도구 실행: ${action}`, { params });
    
    // 🧠 AI-powered 경로 해석 (현재 비활성화)
    // if (params.path && typeof params.path === 'string') {
    //   const resolver = await getPathResolver();
    //   const resolvedPath = await resolver.resolvePath(params.path, 'filesystem_operation', { userId });
    //   if (resolvedPath && resolvedPath !== params.path) {
    //     console.log(`🧠 경로 해석: "${params.path}" → "${resolvedPath}"`);
    //     params.path = resolvedPath;
    //   }
    // }
    
    // 🔧 AI 파라미터 자동 보정 (확장자 검색)
    console.log(`🔍 [DEBUG] 보정 전 파라미터:`, JSON.stringify(params, null, 2));
    
    if (action === 'search_files') {
      console.log(`🔍 [DEBUG] search_files 액션 감지 - query: ${params.query}, pattern: ${params.pattern}`);
      
      if (params.query && !params.pattern) {
        const originalQuery = params.query;
        console.log(`🔍 [DEBUG] query가 있고 pattern이 없음. query: "${originalQuery}"`);
        
        // .pdf, pdf, PDF 등 확장자 검색을 pattern으로 자동 변환 (대소문자, 점 유무 모두 지원)
        const extMatch = originalQuery.match(/^\.?([a-z0-9]{2,5})$/i);
        if (extMatch) {
          const ext = extMatch[1].toLowerCase();
          params.pattern = `*.${ext}`;
          delete params.query;
          console.log(`🔧 AI 파라미터 보정 완료: query: "${originalQuery}" → pattern: "*.${ext}"`);
        }
        // fileTypes 옵션이 있으면서 query가 확장자인 경우도 보정
        if (params.options && params.options.fileTypes && params.options.fileTypes.length === 1) {
          const fileType = params.options.fileTypes[0];
          if (originalQuery === `.${fileType}` || originalQuery === fileType) {
            params.pattern = `*.${fileType}`;
            delete params.query;
            console.log(`🔧 AI 파라미터 보정 완료 (fileTypes): query: "${originalQuery}" → pattern: "*.${fileType}"`);
          }
        }
      }
    }
    
    console.log(`🔍 [DEBUG] 보정 후 파라미터:`, JSON.stringify(params, null, 2));
    
    // 파일시스템 도구 가져오기  
    const fsTools = await getFileSystemTools();
    // 파일시스템 도구 실행
    const result = await fsTools.executeTool(action, params);
    const executionTime = Date.now() - startTime;
    console.log(`✅ 파일시스템 도구 실행 완료: ${action} (${executionTime}ms)`);
    // 성공 응답
    const response = {
      success: true,
      tool_name: 'filesystem',
      user_id: userId,
      result: result,
      execution_info: {
        timestamp: new Date().toISOString(),
        execution_time_ms: executionTime,
        operation: action
      }
    };
    res.json(response);
  } catch (error) {
    console.error('[ERROR] 파일시스템 도구 실행 중 예외:', error);
    return res.status(500).json({
      success: false,
      error: 'execution_error',
      message: 'Tool 실행 중 오류가 발생했습니다.',
      error_details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * GET /api/tools/search-by-extension
 * 확장자 기반 파일 검색
 */
router.get('/search-by-extension', async (req, res) => {
  try {
    const { extension, searchPaths, recursive = 'false', limit = '100' } = req.query;
    
    if (!extension) {
      return res.status(400).json({
        success: false,
        error: 'missing_extension',
        message: 'extension 파라미터가 필요합니다.'
      });
    }
    
    console.log(`🔍 확장자 검색 요청: ${extension}`);
    
    const fsTools = await getFileSystemTools();
    
    const params = {
      action: 'search_by_extension',
      extension: extension,
      searchPaths: searchPaths ? searchPaths.split(',') : [],
      recursive: recursive === 'true',
      limit: parseInt(limit)
    };
    
    const result = await fsTools.executeTool('search_by_extension', params);
    
    const response = {
      success: true,
      extension: extension,
      result: result,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ 확장자 검색 실패:', error);
    
    res.status(500).json({
      success: false,
      error: 'extension_search_error',
      message: '확장자 검색 중 오류가 발생했습니다.',
      error_details: error.message
    });
  }
});

/**
 * GET /api/tools/list
 * 사용자별 사용 가능한 Tool 목록 조회
 */
router.get('/list', async (req, res) => {
  try {
    const { user_id, include_unsubscribed = 'false' } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'missing_user_id',
        message: 'user_id 파라미터가 필요합니다.'
      });
    }

    console.log(`📋 Tool 목록 요청: 사용자 ${user_id}`);
    console.log('🔍 ToolExecutionManager 인스턴스 가져오기 전');
    const executionManager = await getToolExecutionManager();
    console.log('🔍 ToolExecutionManager 인스턴스 가져옴');
    const includeUnsubscribed = include_unsubscribed === 'true';
    console.log('🔍 getAvailableTools 호출 전');
    const tools = await executionManager.getAvailableTools(user_id, includeUnsubscribed);
    console.log('🔍 getAvailableTools 호출 완료');
    // tools 배열을 그대로 반환 (임시 디버깅)
    const response = {
      success: true,
      user_id: user_id,
      tools: tools,
      summary: {
        total_tools: (tools || []).length,
        subscribed_tools: (tools || []).filter(t => t && t.subscription && typeof t.subscription.subscribed !== 'undefined' && t.subscription.subscribed).length,
        available_tools: (tools || []).filter(t => t && t.available && t.usage && t.usage.allowed).length
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Tool 목록 조회 실패:', error);
    
    res.status(500).json({
      success: false,
      error: 'list_error',
      message: 'Tool 목록 조회 중 오류가 발생했습니다.',
      error_details: error.message
    });
  }
});

/**
 * GET /api/tools/:tool_name/info
 * 특정 Tool 정보 조회
 */
router.get('/:tool_name/info', async (req, res) => {
  try {
    const { tool_name } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'missing_user_id',
        message: 'user_id 파라미터가 필요합니다.'
      });
    }

    console.log(`ℹ️ Tool 정보 요청: ${tool_name} (사용자: ${user_id})`);

    // 서비스 인스턴스 가져오기
    const subscriptionService = await getSubscriptionService();
    const toolSchemaRegistry = getToolSchemaRegistry();

    // Tool 존재 확인
    const toolSchema = toolSchemaRegistry.getToolSchema(tool_name);
    if (!toolSchema) {
      return res.status(404).json({
        success: false,
        error: 'tool_not_found',
        message: `Tool '${tool_name}'을 찾을 수 없습니다.`,
        tool_name: tool_name
      });
    }

    // 구독 및 사용량 정보
    const isSubscribed = await subscriptionService.checkUserSubscription(user_id, tool_name);
    const subscriptionTier = await subscriptionService.getUserSubscriptionTier(user_id, tool_name);
    const usageInfo = await subscriptionService.checkDailyUsageLimit(user_id, tool_name);

    const toolInfo = {
      name: tool_name,
      schema: toolSchema.schema,
      version: toolSchema.version,
      registered_at: toolSchema.registeredAt,
      available: isSubscribed && usageInfo.allowed,
      subscription: {
        subscribed: isSubscribed,
        tier: subscriptionTier,
        required: !isSubscribed
      },
      usage: {
        allowed: usageInfo.allowed,
        current: usageInfo.currentUsage || 0,
        limit: usageInfo.dailyLimit || -1,
        remaining: usageInfo.remaining || -1,
        reason: usageInfo.reason || null
      }
    };

    // 구독 안내 정보
    if (!isSubscribed) {
      const subscriptionMessage = await subscriptionService.getSubscriptionRequiredMessage(tool_name, user_id);
      toolInfo.subscription.upgrade_info = subscriptionMessage;
    }

    res.json({
      success: true,
      user_id: user_id,
      tool: toolInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Tool 정보 조회 실패:', error);
    
    res.status(500).json({
      success: false,
      error: 'info_error',
      message: 'Tool 정보 조회 중 오류가 발생했습니다.',
      error_details: error.message
    });
  }
});

export default router;