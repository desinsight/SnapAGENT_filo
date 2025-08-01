import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import winston from 'winston';
import { FileSystemTools } from './tools/fileSystem.js';
import { FilePreviewTools } from './tools/filePreview.js';
import { FileOptimizerTools } from './tools/fileOptimizer.js';
import { FileSyncTools } from './tools/fileSync.js';
import { BackupSystem } from './tools/backupSystem.js';
import { FileEncryption } from './tools/fileEncryption.js';
import { VersionControl } from './tools/versionControl.js';
import { AdvancedSearch } from './tools/advancedSearch.js';
import { MCPService } from './services/mcpService.js';
import { DataSyncService } from './services/dataSync.js';
import aiRoutes from './routes/ai.js';
import aiChatRoutes from './routes/ai-chat-new.js';
import aiChatDirectRoutes from './routes/ai-chat-direct.js';
import toolsRoutes from './routes/tools.js';
import learningRoutes from './routes/learning.js';
import notesRoutes from './routes/notes/notes.js';
import tagsRoutes from './routes/notes/tags.js';
import sharedNotesRoutes from './routes/notes/sharedNotes.js';
import { pathResolver } from './utils/pathResolver.js';
import { toolLogger } from './middleware/toolLogger.js';
import { getToolExecutionManager } from './utils/toolExecution.js';
import { 
  initializeBackendLearning, 
  createLearningMiddleware 
} from './learning/index.js';
import { connectNotesDB } from './config/notes.js';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ultraFastFileSearchRouter from './tools/ultraFastFileSearch/index.js';
import { buildIndex, saveAllData, loadAllData } from './tools/ultraFastFileSearch/indexer.js';
import { startWatching, startWatchingAll } from './tools/ultraFastFileSearch/watcher.js';
import child_process from 'child_process';
import smartOrganizeRoutes from './routes/smart_organize.js';
// service_note 라우트 import
// import bookmarksRouter from '../../service_note/src/routes/bookmarks.js';
// import bookmarkCollectionsRouter from '../../service_note/src/routes/bookmarkCollections.js';
// import quickAccessRouter from '../../service_note/src/routes/quickAccess.js';
import analyticsRouter from './routes/notes/analytics.js';
import sharedNotesRouter from './routes/notes/sharedNotes.js';
import { errorHandler } from './middleware/errorHandler.js';

// .env 파일 로드 (루트 디렉토리에서)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');
dotenv.config({ path: join(rootDir, '.env') });

// 환경 변수 확인
console.log('🔑 환경 변수 확인:');
console.log('  ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'sk-ant-api...' : 'NOT SET');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'sk-proj-v9...' : 'NOT SET');
console.log('  DEFAULT_AI_PROVIDER:', process.env.DEFAULT_AI_PROVIDER || 'claude');

// API 키 확인
console.log('🔑 환경 변수 확인:');
console.log('  ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? `${process.env.ANTHROPIC_API_KEY.substring(0, 10)}...` : '❌ 없음');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : '❌ 없음');
console.log('  DEFAULT_AI_PROVIDER:', process.env.DEFAULT_AI_PROVIDER || '❌ 없음');

// Tool Execution Manager 전역 인스턴스
let toolExecutionManager = null;

(async () => {
  try {
    console.log('🔧 Tool Execution Manager 초기화 중...');
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    const subscriptionService = await getSubscriptionService();
    toolExecutionManager = await getToolExecutionManager(subscriptionService);
    console.log('✅ Tool Execution Manager 초기화 완료');
  } catch (error) {
    console.error('❌ Tool Execution Manager 초기화 실패:', error);
  }
})();

// 🧠 백엔드 학습 시스템 초기화
(async () => {
  try {
    console.log('🧠 백엔드 학습 시스템 초기화 중...');
    initializeBackendLearning({
      learningEnabled: true,
      autoCleanup: true,
      cleanupInterval: 24 * 60 * 60 * 1000, // 24시간
      maxLearningData: 10000,
      learningRate: 0.1
    });
    console.log('✅ 백엔드 학습 시스템 초기화 완료');
  } catch (error) {
    console.error('❌ 백엔드 학습 시스템 초기화 실패:', error);
  }
})();

// 로거 설정
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const fileSystem = new FileSystemTools();
const filePreview = new FilePreviewTools();
const fileOptimizer = new FileOptimizerTools();
const fileSync = new FileSyncTools();
const backupSystem = new BackupSystem();
const fileEncryption = new FileEncryption();
const versionControl = new VersionControl();
const advancedSearch = new AdvancedSearch();
const mcpService = new MCPService();
const dataSyncService = new DataSyncService(mcpService);

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 🧠 백엔드 학습 미들웨어 적용 (모든 API 요청/응답 자동 학습)
app.use(createLearningMiddleware());

// 🚨 Body 디버깅 미들웨어 (express.json() 이후)
app.use((req, res, next) => {
  if (req.path.includes('/api/') && req.method === 'POST') {
    console.log('📝 [BODY DEBUG] 요청:', req.method, req.path);
    console.log('📝 [BODY DEBUG] Content-Type:', req.headers['content-type']);
    console.log('📝 [BODY DEBUG] Body 타입:', typeof req.body);
    console.log('📝 [BODY DEBUG] Body 내용:', JSON.stringify(req.body, null, 2));
    console.log('📝 [BODY DEBUG] Body keys:', Object.keys(req.body || {}));
  }
  next();
});

// 🚨 모든 API 요청 추적 (디버깅용)
app.use((req, res, next) => {
  if (req.path.includes('/api/')) {
    console.log('🔍 [ALL] 요청:', req.method, req.path);
    if (req.path.includes('/ai/')) {
      console.log('🚨 [AI] AI 관련 요청 감지!');
    }
  }
  next();
});

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 간단한 사용자 인증 미들웨어 (개발용)
app.use((req, res, next) => {
  // X-User-Id 헤더가 있으면 사용자 정보 설정
  const userId = req.headers['x-user-id'] || req.headers['X-User-Id'];
  if (userId) {
    req.user = { id: userId };
  } else {
    // 기본 테스트 사용자
    req.user = { id: 'anonymous' };
  }
  next();
});

// 🧠 백엔드 학습 API 라우트 연결
app.use('/api/learning', learningRoutes);

// AI API 라우트 연결
// 모든 AI 요청 로깅
app.use('/api/ai', (req, res, next) => {
  console.log('🚨 [DEBUG] AI 요청 감지:', req.method, req.path);
  console.log('🚨 [DEBUG] 요청 본문:', req.body);
  next();
});

app.use('/api/ai', aiRoutes);
app.use('/api/ai', aiChatRoutes); // AI 채팅 라우트 추가
app.use('/api/ai', aiChatDirectRoutes); // AI Direct API (Tool Calling)
app.use('/api/tools/ultra-fast-search', ultraFastFileSearchRouter); // ultraFastFileSearch 라우트 분리 mount (tools보다 먼저)
app.use('/api/tools/smart_organize', smartOrganizeRoutes);
app.use('/api/tools', toolsRoutes); // Tool 실행 라우트 (구체적인 라우트들 이후에)

// 노트 서비스 라우트 추가
app.use('/api/notes', notesRoutes);

// Claude API 라우트 추가 (임시 라우트로 기존 요청 처리)
app.post('/api/claude/plan', async (req, res) => {
  console.log('📥 [Claude Route] POST /api/claude/plan 요청 받음');
  console.log('📋 [Claude Route] 요청 데이터:', JSON.stringify(req.body, null, 2));
  
  try {
    const { userInput } = req.body;
    
    // MCP 서버로 요청 전달
    const response = await fetch(`http://localhost:5050/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `파일 관리 요청: ${userInput}`,
        context: { service: 'file-manager' },
        service: 'file-manager'
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`);
    }
    
    const aiResponse = await response.json();
    
    console.log('✅ [Claude Route] AI 응답 완료');
    console.log('📤 [Claude Route] 응답 내용:', aiResponse);
    
    // Claude 형식으로 응답 변환
    res.json({
      plan: {
        action: 'searchFiles',
        targetDirectory: '/home',
        filters: [userInput],
        description: aiResponse.data?.response || '파일 관리 작업'
      },
      success: true
    });
    
  } catch (error) {
    console.error('❌ [Claude Route] 오류:', error);
    res.status(500).json({
      error: error.message,
      plan: {
        action: 'invalid',
        targetDirectory: '',
        filters: [],
        description: '명령을 처리할 수 없습니다.'
      }
    });
  }
});

app.post('/api/claude/summary', async (req, res) => {
  console.log('📥 [Claude Route] POST /api/claude/summary 요청 받음');
  console.log('📋 [Claude Route] 요청 데이터:', JSON.stringify(req.body, null, 2));
  
  try {
    const { resultData } = req.body;
    
    // MCP 서버로 요청 전달
    const response = await fetch(`http://localhost:5050/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `결과 요약 요청: ${JSON.stringify(resultData)}`,
        context: { service: 'file-manager' },
        service: 'file-manager'
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`);
    }
    
    const aiResponse = await response.json();
    
    console.log('✅ [Claude Route] AI 응답 완료');
    console.log('📤 [Claude Route] 응답 내용:', aiResponse);
    
    res.json({
      summary: aiResponse.data?.response || '결과를 요약했습니다.',
      success: true
    });
    
  } catch (error) {
    console.error('❌ [Claude Route] 오류:', error);
    res.status(500).json({
      error: error.message,
      summary: '요약을 생성할 수 없습니다.'
    });
  }
});

app.post('/api/claude/name-search', async (req, res) => {
  console.log('📥 [Claude Route] POST /api/claude/name-search 요청 받음');
  console.log('📋 [Claude Route] 요청 데이터:', JSON.stringify(req.body, null, 2));
  
  try {
    const { userInput, searchPath } = req.body;
    
    // MCP 서버로 요청 전달
    const response = await fetch(`http://localhost:5050/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `파일 검색 요청: ${userInput} (경로: ${searchPath || 'default'})`,
        context: { 
          service: 'file-manager',
          searchPath: searchPath 
        },
        service: 'file-manager'
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`);
    }
    
    const aiResponse = await response.json();
    
    console.log('✅ [Claude Route] AI 응답 완료');
    console.log('📤 [Claude Route] 응답 내용:', aiResponse);
    
    res.json({
      success: true,
      query: userInput,
      nameQuery: userInput,
      results: [],
      totalCount: 0,
      searchPath: searchPath || '/home',
      message: aiResponse.data?.response || '검색을 수행했습니다.'
    });
    
  } catch (error) {
    console.error('❌ [Claude Route] 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      query: req.body.userInput || ''
    });
  }
});

// ==========================================
// 🔧 Tool 실행 API 엔드포인트 (5단계)
// ==========================================

import { 
  authenticateUser, 
  authorizeToolExecution 
} from './utils/toolExecution.js';

// Tool 실행 엔드포인트
app.post('/api/tools/execute',
  toolLogger,                                    // 도구 실행 로깅
  authenticateUser,                              // 사용자 인증
  authorizeToolExecution(),  // Tool 실행 권한 검증
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { tool, parameters } = req.body;
      const userId = req.user.id;
      
      console.log(`🚀 [TOOL-EXEC] Tool 실행 요청: ${tool} (사용자: ${userId})`);
      console.log(`📋 [TOOL-EXEC] 파라미터:`, JSON.stringify(parameters, null, 2));
      
      // Tool Execution Manager가 초기화되지 않은 경우 대기
      if (!toolExecutionManager) {
        return res.status(503).json({
          error: 'service_unavailable',
          message: 'Tool 실행 서비스가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.'
        });
      }
      
      // 1. 구독 상태 확인
      const subscriptionCheck = await toolExecutionManager.checkSubscription(userId, tool);
      if (!subscriptionCheck.hasSubscription) {
        const subscriptionMessage = await toolExecutionManager.getSubscriptionRequiredMessage(tool, userId);
        console.log(`🚫 [TOOL-EXEC] 구독 필요: ${tool} (사용자: ${userId})`);
        return res.status(403).json(subscriptionMessage);
      }
      
      console.log(`✅ [TOOL-EXEC] 구독 확인 완료: ${tool} (등급: ${subscriptionCheck.tier})`);
      
      // 2. Schema 검증
      const validation = await toolExecutionManager.validateToolInput(tool, parameters);
      if (!validation.valid) {
        console.log(`❌ [TOOL-EXEC] Schema 검증 실패: ${tool}`, validation.errors);
        return res.status(400).json({
          error: 'validation_failed',
          message: 'Tool 입력 파라미터가 유효하지 않습니다.',
          validation_errors: validation.errors
        });
      }
      
      console.log(`✅ [TOOL-EXEC] Schema 검증 완료: ${tool}`);
      
      // 3. Tool 실행
      const result = await toolExecutionManager.executeToolSafely(tool, parameters, userId);
      const totalTime = Date.now() - startTime;
      
      if (result.success) {
        console.log(`✅ [TOOL-EXEC] 실행 완료: ${tool} (총 ${totalTime}ms)`);
        res.json({
          success: true,
          data: result,
          total_time: `${totalTime}ms`,
          subscription_tier: subscriptionCheck.tier,
          usage_info: req.usageInfo
        });
      } else {
        console.log(`❌ [TOOL-EXEC] 실행 실패: ${tool} (${totalTime}ms)`, result.error);
        res.status(500).json({
          success: false,
          error: 'tool_execution_failed',
          message: result.error,
          tool: tool,
          total_time: `${totalTime}ms`
        });
      }
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ [TOOL-EXEC] 예외 발생 (${totalTime}ms):`, error);
      res.status(500).json({
        success: false,
        error: 'internal_error',
        message: '도구 실행 중 예기치 않은 오류가 발생했습니다.',
        total_time: `${totalTime}ms`
      });
    }
  }
);

// Tool 목록 조회 엔드포인트 (구독 상태 포함)
app.get('/api/tools/list',
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const includeUnsubscribed = req.query.includeUnsubscribed === 'true';
      
      console.log(`📋 [TOOL-LIST] Tool 목록 요청 (사용자: ${userId}, 미구독 포함: ${includeUnsubscribed})`);
      
      if (!toolExecutionManager) {
        return res.status(503).json({
          error: 'service_unavailable',
          message: 'Tool 목록 서비스가 초기화되지 않았습니다.'
        });
      }
      
      const tools = await toolExecutionManager.getAvailableTools(userId, includeUnsubscribed);
      const subscribedCount = tools.filter(t => t.subscription_info?.subscribed).length;
      const unsubscribedCount = tools.length - subscribedCount;
      
      console.log(`✅ [TOOL-LIST] Tool 목록 조회 완료: ${tools.length}개 (구독: ${subscribedCount}, 미구독: ${unsubscribedCount})`);
      
      // 6단계 요구사항에 맞는 응답 형식
      const formattedTools = tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        subscribed: tool.subscription_info.subscribed,
        subscription_tier: tool.subscription_tier,
        input_schema: tool.input_schema,
        // 미구독 도구에 추가 정보 포함
        ...(tool.subscription_info.subscribed ? {} : {
          subscription_required: true,
          trial_available: true, // TODO: 실제 trial 정보로 교체
          subscription_message: tool.subscription_info.message || '이 도구를 사용하려면 구독이 필요합니다.'
        }),
        // 추가 메타데이터
        version: tool.version,
        category: tool.category
      }));
      
      res.json({
        tools: formattedTools,
        stats: {
          total: tools.length,
          subscribed: subscribedCount,
          unsubscribed: unsubscribedCount
        },
        user_id: userId,
        include_unsubscribed: includeUnsubscribed,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [TOOL-LIST] Tool 목록 조회 실패:', error);
      res.status(500).json({
        error: 'tool_list_failed',
        message: 'Tool 목록을 가져오는 중 오류가 발생했습니다.'
      });
    }
  }
);

// Tool 메트릭 조회 엔드포인트
app.get('/api/tools/metrics',
  authenticateUser,
  async (req, res) => {
    try {
      console.log(`📊 [TOOL-METRICS] 메트릭 요청 (사용자: ${req.user.id})`);
      
      if (!toolExecutionManager) {
        return res.status(503).json({
          error: 'service_unavailable',
          message: 'Tool 메트릭 서비스가 초기화되지 않았습니다.'
        });
      }
      
      const metrics = toolExecutionManager.getMetrics();
      
      console.log(`✅ [TOOL-METRICS] 메트릭 조회 완료`);
      
      res.json({
        success: true,
        metrics: metrics,
        timestamp: new Date().toISOString(),
        user_id: req.user.id
      });
      
    } catch (error) {
      console.error('❌ [TOOL-METRICS] 메트릭 조회 실패:', error);
      res.status(500).json({
        error: 'metrics_failed',
        message: '메트릭을 가져오는 중 오류가 발생했습니다.'
      });
    }
  }
);

console.log('🔧 Tool 실행 API 엔드포인트 추가됨:');
console.log('   POST /api/tools/execute - Tool 실행 (구독 체크 + Schema 검증 + 로깅)');
console.log('   GET  /api/tools/list - Tool 목록 조회 (구독 상태 포함)');
console.log('   GET  /api/tools/metrics - Tool 실행 메트릭 조회');

// ==========================================

// 정적 파일 서빙
app.use('/api/files', express.static(path.join(process.cwd(), 'files')));

// 시스템 초기화
let mcpReady = false;
let pathResolverReady = false;

// PathResolver 초기화 (비동기적으로 실행)
(async () => {
  try {
    console.log('🔍 동적 경로 시스템 초기화 중...');
    await pathResolver.getUserDirectories(); // 캐시 워밍업
    await pathResolver.getAvailableDrives();
    pathResolverReady = true;
    console.log('✅ 동적 경로 시스템 초기화 완료');
    console.log('🚨🚨🚨 [CRITICAL DEBUG] 서버 파일이 수정되었습니다! 이 메시지가 보이면 성공!');
  } catch (error) {
    console.error('❌ 동적 경로 시스템 초기화 실패:', error);
    // PathResolver 실패해도 서버는 계속 동작
  }
})();

// MCP 서비스 초기화
mcpService.initialize().then(async () => {
  mcpReady = true;
  logger.info('MCP Service 초기화 완료');
  
  // 데이터 동기화 서비스 시작 (동적 경로 사용)
  try {
    const syncPaths = ['/'];
    
    // PathResolver가 준비되었으면 사용자 디렉토리도 추가
    if (pathResolverReady) {
      const userDirs = await pathResolver.getUserDirectories();
      syncPaths.push(...Object.values(userDirs).slice(0, 3)); // 최대 3개만
    }
    
    await dataSyncService.startRealtimeSync(syncPaths);
    logger.info('데이터 동기화 서비스 시작 완료', { paths: syncPaths });
  } catch (error) {
    logger.error('데이터 동기화 서비스 시작 실패:', error);
  }
}).catch((error) => {
  logger.error('MCP Service 초기화 실패:', error);
});

// 기본 상태 확인
app.get('/api/status', async (req, res) => {
  try {
    const systemInfo = pathResolverReady ? pathResolver.getSystemInfo() : null;
    
    res.json({ 
      status: 'ok', 
      message: 'MCP 통합 백엔드 서버 실행 중',
      services: {
        mcp: mcpReady,
        pathResolver: pathResolverReady,
        fileSystem: true
      },
      systemInfo,
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });
  } catch (error) {
    res.json({ 
      status: 'ok', 
      message: 'MCP 통합 백엔드 서버 실행 중 (기본 모드)',
      services: {
        mcp: mcpReady,
        pathResolver: false,
        fileSystem: true
      },
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });
  }
});

// 즐겨찾기 API - 동적 사용자 경로 시스템 연동
app.get('/api/favorites', async (req, res) => {
  try {
    // 동적으로 사용자 디렉토리 감지
    const userDirectories = await pathResolver.getUserDirectories();
    const availableDrives = await pathResolver.getAvailableDrives();
    const projectPaths = await pathResolver.getProjectPaths();
    
    const favorites = [];
    
    // 사용자 폴더들 추가 - 로컬 파일 시스템 우선 사용
    for (const [key, folderPath] of Object.entries(userDirectories)) {
      try {
        // 로컬 파일 시스템으로 폴더 존재 확인
        const exists = await pathResolver.pathExists(folderPath);
        if (exists) {
          favorites.push({
            path: folderPath,
            name: `${key.charAt(0).toUpperCase() + key.slice(1)}`,
            modifiedAt: new Date().toISOString(),
            type: 'user-folder',
            category: 'user'
          });
        }
      } catch (error) {
        logger.warn(`즐겨찾기 폴더 확인 실패: ${folderPath}`, error.message);
      }
    }

    // 드라이브들 추가 - 로컬 파일 시스템 우선 사용
    for (const drive of availableDrives) {
      try {
        const exists = await pathResolver.pathExists(drive.path);
        if (exists) {
          favorites.push({
            path: drive.path,
            name: drive.label,
            modifiedAt: new Date().toISOString(),
            type: 'drive',
            category: 'system'
          });
        }
      } catch (error) {
        logger.warn(`드라이브 확인 실패: ${drive.path}`, error.message);
      }
    }

    // 프로젝트 폴더들 추가
    for (const project of projectPaths.slice(0, 3)) { // 최대 3개만
      try {
        if (await pathResolver.pathExists(project.path)) {
          favorites.push({
            path: project.path,
            name: project.label,
            modifiedAt: new Date().toISOString(),
            type: 'project',
            category: 'development'
          });
        }
      } catch (error) {
        logger.warn(`프로젝트 폴더 확인 실패: ${project.path}`, error.message);
      }
    }
    
    // 시스템 정보도 함께 반환
    const systemInfo = pathResolver.getSystemInfo();
    
    res.json({ 
      success: true, 
      favorites, 
      systemInfo,
      source: 'local', // 로컬 파일 시스템 사용
      detectedPlatform: systemInfo.platform
    });
  } catch (error) {
    logger.error('즐겨찾기 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 최근 파일 API - 동적 사용자 경로 시스템 연동  
app.get('/api/recent-files', async (req, res) => {
  try {
    // 동적으로 사용자 디렉토리 감지
    const userDirectories = await pathResolver.getUserDirectories();
    const projectPaths = await pathResolver.getProjectPaths();
    
    // 검색할 경로들 구성 (사용자 폴더 + 프로젝트 폴더)
    const searchPaths = [
      ...Object.values(userDirectories),
      ...projectPaths.map(p => p.path).slice(0, 2) // 프로젝트는 최대 2개만
    ];
    
    const recentFiles = [];
    
    for (const dirPath of searchPaths) {
      try {
        // 경로 존재 여부 먼저 확인
        if (!(await pathResolver.pathExists(dirPath))) {
          continue;
        }

        let files = [];
        
        if (mcpReady) {
          const result = await mcpService.client.listFiles(dirPath);
          files = result?.content || [];
        } else {
          files = await fileSystem.listDirectory(dirPath);
        }
        
        // 파일만 필터링하고 최근 수정일 기준 정렬
        const fileItems = files
          .filter(item => item.type === 'file' || !item.isDirectory)
          .filter(item => {
            // 파일 크기나 확장자로 유효한 파일인지 확인
            const name = item.name || path.basename(item.path || '');
            return name && !name.startsWith('.') && name.includes('.');
          })
          .sort((a, b) => {
            const dateA = new Date(a.modifiedAt || a.modified || 0);
            const dateB = new Date(b.modifiedAt || b.modified || 0);
            return dateB - dateA;
          })
          .slice(0, 3) // 폴더당 최근 3개
          .map(item => ({
            ...item,
            sourceDir: dirPath,
            sourceName: path.basename(dirPath)
          }));
          
        recentFiles.push(...fileItems);
      } catch (error) {
        logger.warn(`최근 파일 조회 실패: ${dirPath}`, error.message);
      }
    }
    
    // 전체에서 최근 10개 선택
    const finalRecentFiles = recentFiles
      .sort((a, b) => {
        const dateA = new Date(a.modifiedAt || a.modified || 0);
        const dateB = new Date(b.modifiedAt || b.modified || 0);
        return dateB - dateA;
      })
      .slice(0, 10);
    
    // 시스템 정보 포함
    const systemInfo = pathResolver.getSystemInfo();
    
    res.json({ 
      success: true, 
      recentFiles: finalRecentFiles,
      searchedPaths: searchPaths.length,
      systemInfo,
      source: mcpReady ? 'mcp' : 'fileSystem'
    });
  } catch (error) {
    logger.error('최근 파일 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 드라이브 목록 API - 동적 드라이브 감지
app.get('/api/drives', async (req, res) => {
  try {
    // 동적으로 사용 가능한 드라이브 감지
    const availableDrives = await pathResolver.getAvailableDrives();
    
    // 추가 정보와 함께 드라이브 정보 보강
    const enrichedDrives = [];
    
    for (const drive of availableDrives) {
      try {
        // 기본 정보
        const driveInfo = {
          path: drive.path,
          label: drive.label,
          type: drive.type,
          available: true
        };

        // 가능하면 용량 정보도 추가
        if (await pathResolver.pathExists(drive.path)) {
          try {
            const stats = await fs.promises.stat(drive.path);
            driveInfo.accessible = true;
            driveInfo.lastAccessed = stats.atime;
          } catch (error) {
            driveInfo.accessible = false;
            driveInfo.error = 'Access denied';
          }
        }

        enrichedDrives.push(driveInfo);
      } catch (error) {
        logger.warn(`드라이브 정보 수집 실패: ${drive.path}`, error.message);
      }
    }

    // 시스템 정보 포함
    const systemInfo = pathResolver.getSystemInfo();
    
    res.json({ 
      success: true, 
      data: enrichedDrives,
      systemInfo,
      source: 'dynamic-detection',
      platform: systemInfo.platform
    });
  } catch (error) {
    logger.error('드라이브 목록 조회 실패:', error);
    
    // 폴백: 기존 파일 시스템 사용
    try {
      const drives = await fileSystem.getDrives();
      res.json({ 
        success: true, 
        data: drives, 
        source: 'filesystem-fallback',
        warning: 'Used fallback method due to path resolver error'
      });
    } catch (fallbackError) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// 파일 목록 API
app.get('/api/files', async (req, res) => {
  try {
    const { path: dirPath, enhanced } = req.query;
    if (!dirPath) {
      return res.status(400).json({ success: false, error: '경로가 필요합니다.' });
    }
    
    // 🔍 DEBUG: AI가 전달한 경로 로깅
    console.log(`🔍 [DEBUG] AI가 요청한 경로: "${dirPath}"`);
    console.log(`🔍 [DEBUG] 요청 시간: ${new Date().toISOString()}`);
    
    // 🎯 경로 매핑 직접 처리
    let resolvedPath = dirPath;
    const username = os.userInfo().username;
    
    // "desktop program folder" 패턴 처리
    const desktopProgramPattern = /desktop\s+program\s*folder?/i;
    if (desktopProgramPattern.test(dirPath)) {
      resolvedPath = `C:\\Users\\${username}\\Desktop\\프로그램`;
      console.log(`🎯 경로 매핑: "${dirPath}" → "${resolvedPath}"`);
    }
    
    // 항상 파일 시스템 직접 사용
    const files = await fileSystem.listDirectory(resolvedPath);
    
    console.log(`🔍 [DEBUG] listDirectory 결과: ${Array.isArray(files) ? files.length + '개 파일' : '오류 발생'}`);
    
    res.json({ success: true, data: files, source: 'filesystem' });
  } catch (error) {
    logger.error('파일 목록 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 검색 API
app.get('/api/search', async (req, res) => {
  try {
    const { path: basePath, query, fileTypes, caseSensitive, advanced } = req.query;
    if (!basePath || !query) {
      return res.status(400).json({ 
        success: false, 
        error: '경로와 검색어가 필요합니다.' 
      });
    }
    
    // 항상 파일 시스템 직접 사용
    const results = await fileSystem.searchFiles(basePath, query, {
      fileTypes: fileTypes ? fileTypes.split(',') : [],
      caseSensitive: caseSensitive === 'true'
    });
    res.json({ success: true, data: results, source: 'filesystem' });
  } catch (error) {
    logger.error('파일 검색 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 경로 해석 API
app.get('/api/find', async (req, res) => {
  try {
    const { query, intent, basePath } = req.query;
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: '검색어가 필요합니다.' 
      });
    }
    
    // 파일 시스템의 findPath 기능 사용
    const result = await fileSystem.findPath(query, basePath || process.cwd());
    res.json({ success: true, data: result, source: 'filesystem' });
  } catch (error) {
    logger.error('경로 해석 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 파일 정리 API
app.post('/api/organize', async (req, res) => {
  try {
    const { path: dirPath, criteria } = req.body;
    if (!dirPath) {
      return res.status(400).json({ 
        success: false, 
        error: '경로가 필요합니다.' 
      });
    }
    const organized = await fileSystem.organizeFiles(dirPath, criteria);
    res.json({ success: true, data: organized });
  } catch (error) {
    logger.error('파일 정리 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 파일 미리보기 API =====
app.get('/api/preview', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({ 
        success: false, 
        error: '파일 경로가 필요합니다.' 
      });
    }

    const preview = await filePreview.getPreview(filePath);
    res.json({ success: true, data: preview });
  } catch (error) {
    logger.error('파일 미리보기 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/preview/image', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    const preview = await filePreview.generateImagePreview(filePath);
    res.json({ success: true, data: preview });
  } catch (error) {
    logger.error('이미지 미리보기 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/preview/text', async (req, res) => {
  try {
    const { path: filePath, lines } = req.query;
    const preview = await filePreview.generateTextPreview(filePath, { maxLines: parseInt(lines) || 50 });
    res.json({ success: true, data: preview });
  } catch (error) {
    logger.error('텍스트 미리보기 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/preview/media', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    const preview = await filePreview.generateMediaPreview(filePath);
    res.json({ success: true, data: preview });
  } catch (error) {
    logger.error('미디어 미리보기 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 파일 최적화 API =====
app.post('/api/optimize/duplicates', async (req, res) => {
  try {
    const { path: dirPath, action } = req.body;
    if (!dirPath) {
      return res.status(400).json({ success: false, error: '경로가 필요합니다.' });
    }
    
    let result;
    if (action === 'remove') {
      result = await fileOptimizer.removeDuplicates(dirPath);
    } else {
      result = await fileOptimizer.findDuplicates(dirPath);
    }
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('중복 파일 처리 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/optimize/cleanup', async (req, res) => {
  try {
    const { path: dirPath, options } = req.body;
    const result = await fileOptimizer.cleanupDirectory(dirPath, options);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('디렉토리 정리 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/optimize/compress', async (req, res) => {
  try {
    const { files, outputPath, compressionLevel } = req.body;
    const result = await fileOptimizer.compressFiles(files, outputPath, { compressionLevel });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('파일 압축 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 파일 동기화 API =====
app.get('/api/sync/conflicts', async (req, res) => {
  try {
    const conflicts = await fileSync.getConflicts();
    res.json({ success: true, data: conflicts });
  } catch (error) {
    logger.error('충돌 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sync/resolve', async (req, res) => {
  try {
    const { conflictId, resolution } = req.body;
    const result = await fileSync.resolveConflict(conflictId, resolution);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('충돌 해결 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sync/start', async (req, res) => {
  try {
    const { sourcePath, targetPath, options } = req.body;
    const result = await fileSync.startSync(sourcePath, targetPath, options);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('동기화 시작 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 백업 시스템 API =====
app.post('/api/backup/create', async (req, res) => {
  try {
    const { sourcePath, options } = req.body;
    const result = await backupSystem.createBackup(sourcePath, options);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('백업 생성 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/backup/restore', async (req, res) => {
  try {
    const { backupPath, targetPath } = req.body;
    const result = await backupSystem.restoreBackup(backupPath, targetPath);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('백업 복원 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/backup/list', async (req, res) => {
  try {
    const backups = await backupSystem.getAllBackups();
    res.json({ success: true, data: backups });
  } catch (error) {
    logger.error('백업 목록 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/backup/:backupId', async (req, res) => {
  try {
    const { backupId } = req.params;
    const result = await backupSystem.deleteBackup(backupId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('백업 삭제 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 파일 암호화 API =====
app.post('/api/encrypt/file', async (req, res) => {
  try {
    const { filePath, password } = req.body;
    const result = await fileEncryption.encryptFile(filePath, password);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('파일 암호화 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/encrypt/decrypt', async (req, res) => {
  try {
    const { filePath, password } = req.body;
    const result = await fileEncryption.decryptFile(filePath, password);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('파일 복호화 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/encrypt/directory', async (req, res) => {
  try {
    const { directoryPath, password } = req.body;
    const result = await fileEncryption.encryptDirectory(directoryPath, password);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('디렉토리 암호화 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 버전 관리 API =====
app.post('/api/version/create', async (req, res) => {
  try {
    const { filePath, metadata } = req.body;
    const result = await versionControl.createVersion(filePath, metadata);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('버전 생성 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/version/history', async (req, res) => {
  try {
    const { filePath } = req.query;
    const history = await versionControl.getVersionHistory(filePath);
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('버전 히스토리 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/version/restore', async (req, res) => {
  try {
    const { versionHash } = req.body;
    const result = await versionControl.restoreVersion(versionHash);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('버전 복원 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/version/compare', async (req, res) => {
  try {
    const { versionHash1, versionHash2 } = req.body;
    const comparison = await versionControl.compareVersions(versionHash1, versionHash2);
    res.json({ success: true, data: comparison });
  } catch (error) {
    logger.error('버전 비교 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 고급 검색 API =====
app.post('/api/search/advanced', async (req, res) => {
  try {
    const { directory, searchOptions } = req.body;
    const results = await advancedSearch.searchFiles(directory, searchOptions);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('고급 검색 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/search/history', async (req, res) => {
  try {
    const history = advancedSearch.getSearchHistory();
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('검색 히스토리 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/search/save-query', async (req, res) => {
  try {
    const { name, searchOptions } = req.body;
    const result = await advancedSearch.saveSearchQuery(name, searchOptions);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('검색 쿼리 저장 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 파일 쓰기 API =====
app.post('/api/files/write', async (req, res) => {
  try {
    const { filePath, content, options } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: '파일 경로와 내용이 필요합니다.' 
      });
    }
    
    const result = await fileSystem.writeFile(filePath, content, options);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('파일 쓰기 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/files/create-directory', async (req, res) => {
  try {
    const { dirPath } = req.body;
    const result = await fileSystem.createDirectory(dirPath);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('디렉토리 생성 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/files', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    const result = await fileSystem.deleteFile(filePath);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('파일 삭제 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/files/move', async (req, res) => {
  try {
    const { sourcePath, targetPath } = req.body;
    const result = await fileSystem.moveFile(sourcePath, targetPath);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('파일 이동 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/files/copy', async (req, res) => {
  try {
    const { sourcePath, targetPath } = req.body;
    const result = await fileSystem.copyFile(sourcePath, targetPath);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('파일 복사 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 파일 분석 API =====
app.get('/api/analyze/file', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    const analysis = await fileSystem.analyzeFile(filePath);
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('파일 분석 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 문서 분석 학습 데이터 조회 API
app.get('/api/analyze/learning-data', async (req, res) => {
  try {
    const { 
      format, 
      startDate, 
      endDate, 
      minSize, 
      maxSize, 
      keywords,
      limit = 100 
    } = req.query;

    const options = {
      format,
      dateRange: startDate || endDate ? {
        start: startDate ? new Date(startDate).getTime() : null,
        end: endDate ? new Date(endDate).getTime() : null
      } : null,
      minSize: minSize ? parseInt(minSize) : null,
      maxSize: maxSize ? parseInt(maxSize) : null,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : null,
      limit: parseInt(limit)
    };

    const learningData = await fileSystem.getDocumentLearningData(options);
    res.json({ success: true, data: learningData });
  } catch (error) {
    logger.error('학습 데이터 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 문서 분석 통계 API
app.get('/api/analyze/statistics', async (req, res) => {
  try {
    const statistics = await fileSystem.getDocumentAnalysisStatistics();
    res.json({ success: true, data: statistics });
  } catch (error) {
    logger.error('통계 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/analyze/directory', async (req, res) => {
  try {
    const { path: dirPath } = req.query;
    const analysis = await fileSystem.analyzeDirectory(dirPath);
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('디렉토리 분석 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 파일 검토 API =====
app.post('/api/review/validate', async (req, res) => {
  try {
    const { filePath, rules } = req.body;
    const validation = await fileSystem.validateFile(filePath, rules);
    res.json({ success: true, data: validation });
  } catch (error) {
    logger.error('파일 검증 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/review/report', async (req, res) => {
  try {
    const { path: dirPath } = req.query;
    const report = await fileSystem.generateReport(dirPath);
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('리포트 생성 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// MCP 전용 성능 최적화 엔드포인트
app.post('/api/mcp/batch-operations', async (req, res) => {
  try {
    const { operations } = req.body;
    if (!mcpReady) {
      return res.status(503).json({ success: false, error: 'MCP 서비스가 준비되지 않았습니다.' });
    }
    
    const results = await mcpService.batchFileOperations(operations);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('배치 작업 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/mcp/status', async (req, res) => {
  try {
    const status = await mcpService.getSystemStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('시스템 상태 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 고성능 파일 작업 엔드포인트
app.post('/api/mcp/file-operation', async (req, res) => {
  try {
    const { operation, args } = req.body;
    if (!mcpReady) {
      return res.status(503).json({ success: false, error: 'MCP 서비스가 준비되지 않았습니다.' });
    }
    
    const result = await mcpService.optimizeFileOperation(operation, ...args);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('파일 작업 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 데이터 동기화 API 엔드포인트
app.get('/api/sync/status', async (req, res) => {
  try {
    const syncStats = dataSyncService.getSyncStats();
    res.json({ success: true, data: syncStats });
  } catch (error) {
    logger.error('동기화 상태 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sync/force', async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ success: false, error: '경로가 필요합니다.' });
    }
    
    const result = await dataSyncService.forceSyncPath(path);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('강제 동기화 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket 연결 처리
wss.on('connection', (ws) => {
  logger.info('새로운 WebSocket 연결이 생성되었습니다.');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      logger.info('메시지 수신:', data);
      
      let response;
      switch (data.type) {
        case 'list_directory':
          response = await fileSystem.listDirectory(data.params.path);
          break;
        case 'search_files':
          response = await fileSystem.searchFiles(
            data.params.path,
            data.params.query,
            data.params.options
          );
          break;
        case 'organize_files':
          response = await fileSystem.organizeFiles(
            data.params.path,
            data.params.criteria
          );
          break;
        case 'get_preview':
          response = await filePreview.getPreview(data.params.path);
          break;
        default:
          throw new Error(`지원하지 않는 요청 타입: ${data.type}`);
      }
      
      ws.send(JSON.stringify({ 
        status: 'success',
        data: response
      }));
    } catch (error) {
      logger.error('메시지 처리 중 오류:', error);
      ws.send(JSON.stringify({ 
        status: 'error',
        message: error.message 
      }));
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket 연결이 종료되었습니다.');
  });
});

// 서버 시작
// ==========================================
// 🧪 1단계 테스트: Tool Logger 미들웨어 테스트
// ==========================================

// 테스트용 사용자 인증 미들웨어 (임시)
const mockAuthMiddleware = (req, res, next) => {
  req.user = {
    id: 'test-user-001',
    name: 'Test User'
  };
  req.subscriptionCheck = {
    status: 'active',
    tier: 'premium'
  };
  next();
};

// Tool Logger 테스트 엔드포인트
app.post('/api/test/tool-logger', 
  mockAuthMiddleware,
  toolLogger,
  async (req, res) => {
    try {
      console.log('🧪 [TEST] Tool Logger 테스트 실행');
      
      // 가상의 도구 실행 시뮬레이션
      const { tool, parameters } = req.body;
      
      // 잠시 대기 (실제 도구 실행 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
      
      if (tool === 'error-test') {
        return res.status(500).json({
          error: 'Test error for logging',
          tool: tool
        });
      }
      
      res.json({
        success: true,
        message: `Tool ${tool} executed successfully`,
        parameters: parameters,
        timestamp: new Date().toISOString(),
        logEntry: req.toolLogEntry?.requestId
      });
      
    } catch (error) {
      console.error('❌ [TEST] Tool Logger 테스트 실패:', error);
      res.status(500).json({
        error: error.message
      });
    }
  }
);

// 로그 조회 테스트 엔드포인트
app.get('/api/test/logs', async (req, res) => {
  try {
    const { getToolLogs } = await import('./middleware/toolLogger.js');
    const logs = await getToolLogs(req.query);
    
    res.json({
      success: true,
      count: logs.length,
      logs: logs.slice(0, 10) // 최근 10개만 반환
    });
    
  } catch (error) {
    console.error('❌ [TEST] 로그 조회 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

console.log('🧪 Tool Logger 테스트 엔드포인트 추가됨:');
console.log('   POST /api/test/tool-logger - Tool 실행 테스트');
console.log('   GET  /api/test/logs - 로그 조회 테스트');

// ==========================================
// 🧪 2단계 테스트: 구독 관리 시스템 테스트
// ==========================================

// 구독 상태 확인 테스트
app.get('/api/test/subscription/:userId/:serviceName', async (req, res) => {
  try {
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    const subscriptionService = await getSubscriptionService();
    
    const { userId, serviceName } = req.params;
    
    const isSubscribed = await subscriptionService.checkUserSubscription(userId, serviceName);
    const tier = await subscriptionService.getUserSubscriptionTier(userId, serviceName);
    const usageCheck = await subscriptionService.checkDailyUsageLimit(userId, serviceName);
    
    res.json({
      success: true,
      userId,
      serviceName,
      subscribed: isSubscribed,
      tier,
      usage: usageCheck
    });
    
  } catch (error) {
    console.error('❌ [TEST] 구독 상태 확인 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 구독 필요 메시지 테스트
app.get('/api/test/subscription-message/:serviceName', async (req, res) => {
  try {
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    const subscriptionService = await getSubscriptionService();
    
    const { serviceName } = req.params;
    const userId = req.query.userId || null;
    
    const message = await subscriptionService.getSubscriptionRequiredMessage(serviceName, userId);
    
    res.json({
      success: true,
      message
    });
    
  } catch (error) {
    console.error('❌ [TEST] 구독 메시지 생성 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 테스트 구독 추가
app.post('/api/test/add-subscription', async (req, res) => {
  try {
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    const subscriptionService = await getSubscriptionService();
    
    const { userId, serviceName, tier = 'premium', duration = 30 } = req.body;
    
    const success = await subscriptionService.addTestSubscription(userId, serviceName, tier, duration);
    
    if (success) {
      res.json({
        success: true,
        message: `${userId}에게 ${serviceName} ${tier} 구독 추가됨 (${duration}일)`
      });
    } else {
      res.status(500).json({
        success: false,
        error: '구독 추가 실패'
      });
    }
    
  } catch (error) {
    console.error('❌ [TEST] 구독 추가 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 모든 서비스 목록 조회
app.get('/api/test/services', async (req, res) => {
  try {
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    const subscriptionService = await getSubscriptionService();
    
    const services = subscriptionService.getAllServices();
    
    res.json({
      success: true,
      count: services.length,
      services
    });
    
  } catch (error) {
    console.error('❌ [TEST] 서비스 목록 조회 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 사용량 기록 테스트
app.post('/api/test/record-usage', async (req, res) => {
  try {
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    const subscriptionService = await getSubscriptionService();
    
    const { userId, serviceName } = req.body;
    
    await subscriptionService.recordUsage(userId, serviceName);
    
    const usageCheck = await subscriptionService.checkDailyUsageLimit(userId, serviceName);
    
    res.json({
      success: true,
      message: '사용량 기록됨',
      usage: usageCheck
    });
    
  } catch (error) {
    console.error('❌ [TEST] 사용량 기록 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

console.log('🧪 구독 시스템 테스트 엔드포인트 추가됨:');
console.log('   GET  /api/test/subscription/:userId/:serviceName - 구독 상태 확인');
console.log('   GET  /api/test/subscription-message/:serviceName - 구독 메시지 생성');
console.log('   POST /api/test/add-subscription - 테스트 구독 추가');
console.log('   GET  /api/test/services - 서비스 목록 조회');
console.log('   POST /api/test/record-usage - 사용량 기록');

// ==========================================
// 🧪 3단계 테스트: ServiceRegistry 구독 통합 테스트
// ==========================================

// ServiceRegistry의 구독 기반 서비스 목록 테스트
app.get('/api/test/registry/services/:userId', async (req, res) => {
  try {
    const { ServiceRegistry } = await import('../../ai/core/ServiceRegistry.js');
    
    const { userId } = req.params;
    const { includeUnsubscribed = 'false' } = req.query;
    
    // 구독 서비스 먼저 로드
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    const subscriptionService = await getSubscriptionService();
    
    // ServiceRegistry 인스턴스 생성 및 초기화 (의존성 주입)
    const registry = new ServiceRegistry(subscriptionService);
    await registry.initialize();
    
    // 사용자별 서비스 목록 가져오기
    const services = await registry.getServicesForAI(
      userId, 
      includeUnsubscribed === 'true'
    );
    
    // 통계 계산
    const stats = {
      totalServices: services.length,
      subscribedServices: services.filter(s => s.function.subscription_info?.subscribed).length,
      unsubscribedServices: services.filter(s => s.function.subscription_info && !s.function.subscription_info.subscribed).length
    };
    
    res.json({
      success: true,
      userId,
      includeUnsubscribed: includeUnsubscribed === 'true',
      stats,
      services: services.map(s => ({
        name: s.function.name,
        description: s.function.description,
        subscribed: s.function.subscription_info?.subscribed || false,
        tier: s.function.subscription_info?.tier || null,
        subscription_required: s.function.subscription_info?.subscription_required || false
      }))
    });
    
  } catch (error) {
    console.error('❌ [TEST] ServiceRegistry 테스트 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ServiceRegistry 캐시 테스트
app.get('/api/test/registry/cache/:userId', async (req, res) => {
  try {
    const { ServiceRegistry } = await import('../../ai/core/ServiceRegistry.js');
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    
    const { userId } = req.params;
    
    const subscriptionService = await getSubscriptionService();
    const registry = new ServiceRegistry(subscriptionService);
    await registry.initialize();
    
    // 첫 번째 호출 (캐시 생성)
    const start1 = Date.now();
    const services1 = await registry.getServicesForAI(userId);
    const time1 = Date.now() - start1;
    
    // 두 번째 호출 (캐시 사용)
    const start2 = Date.now();
    const services2 = await registry.getServicesForAI(userId);
    const time2 = Date.now() - start2;
    
    res.json({
      success: true,
      userId,
      cacheTest: {
        firstCall: {
          time: `${time1}ms`,
          servicesCount: services1.length
        },
        secondCall: {
          time: `${time2}ms`,
          servicesCount: services2.length,
          wasCached: time2 < time1 / 2
        },
        speedup: time1 > 0 ? Math.round(time1 / Math.max(time2, 1)) + 'x' : 'N/A'
      }
    });
    
  } catch (error) {
    console.error('❌ [TEST] ServiceRegistry 캐시 테스트 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ServiceRegistry와 구독 시스템 통합 테스트
app.post('/api/test/registry/integration', async (req, res) => {
  try {
    const { ServiceRegistry } = await import('../../ai/core/ServiceRegistry.js');
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    
    const { userId, serviceName, addSubscription = false } = req.body;
    
    const subscriptionService = await getSubscriptionService();
    const registry = new ServiceRegistry(subscriptionService);
    await registry.initialize();
    
    // 구독 전 상태
    const servicesBefore = await registry.getServicesForAI(userId, true);
    const beforeStats = {
      total: servicesBefore.length,
      subscribed: servicesBefore.filter(s => s.function.subscription_info?.subscribed).length
    };
    
    let subscriptionAdded = false;
    if (addSubscription) {
      // 테스트 구독 추가
      subscriptionAdded = await subscriptionService.addTestSubscription(userId, serviceName, 'premium', 30);
      
      // 캐시 무효화
      registry.invalidateUserCache(userId);
    }
    
    // 구독 후 상태
    const servicesAfter = await registry.getServicesForAI(userId, true);
    const afterStats = {
      total: servicesAfter.length,
      subscribed: servicesAfter.filter(s => s.function.subscription_info?.subscribed).length
    };
    
    res.json({
      success: true,
      test: {
        userId,
        serviceName,
        subscriptionAdded
      },
      before: beforeStats,
      after: afterStats,
      changes: {
        subscriptionIncrease: afterStats.subscribed - beforeStats.subscribed
      },
      targetService: {
        before: servicesBefore.find(s => s.function.name === serviceName)?.function.subscription_info,
        after: servicesAfter.find(s => s.function.name === serviceName)?.function.subscription_info
      }
    });
    
  } catch (error) {
    console.error('❌ [TEST] ServiceRegistry 통합 테스트 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

console.log('🧪 ServiceRegistry 통합 테스트 엔드포인트 추가됨:');
console.log('   GET  /api/test/registry/services/:userId - 사용자별 서비스 목록');
console.log('   GET  /api/test/registry/cache/:userId - 캐시 성능 테스트');
console.log('   POST /api/test/registry/integration - 통합 테스트');

// ==========================================
// 🧪 개발용 구독 시스템 제어
// ==========================================

// 개발 모드 상태 확인
app.get('/api/dev/subscription-mode', async (req, res) => {
  try {
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    const subscriptionService = await getSubscriptionService();
    
    res.json({
      success: true,
      mode: subscriptionService.subscriptionMode,
      bypassSubscription: subscriptionService.bypassSubscription,
      defaultDevTier: subscriptionService.defaultDevTier,
      environment: process.env.NODE_ENV,
      message: subscriptionService.bypassSubscription 
        ? '⚠️ 구독 시스템이 우회되어 모든 서비스가 활성화됩니다.'
        : '✅ 구독 시스템이 정상적으로 작동합니다.'
    });
    
  } catch (error) {
    console.error('❌ [DEV] 개발 모드 상태 확인 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 개발 모드 토글 (런타임)
app.post('/api/dev/toggle-bypass', async (req, res) => {
  try {
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    const subscriptionService = await getSubscriptionService();
    
    const { bypass } = req.body;
    
    // 런타임에서 구독 우회 토글
    subscriptionService.bypassSubscription = bypass === true;
    
    console.log(`🧪 [DEV] 구독 우회 ${subscriptionService.bypassSubscription ? '활성화' : '비활성화'}`);
    
    res.json({
      success: true,
      bypassSubscription: subscriptionService.bypassSubscription,
      message: subscriptionService.bypassSubscription 
        ? '🧪 개발 모드: 모든 서비스가 활성화되었습니다.'
        : '✅ 프로덕션 모드: 구독 시스템이 활성화되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ [DEV] 구독 우회 토글 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 개발자용 전체 서비스 활성화 (특정 사용자)
app.post('/api/dev/enable-all-services/:userId', async (req, res) => {
  try {
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    const subscriptionService = await getSubscriptionService();
    
    const { userId } = req.params;
    const { duration = 365 } = req.body; // 기본 1년
    
    const allServices = Object.keys(subscriptionService.serviceDefinitions);
    const results = [];
    
    for (const serviceName of allServices) {
      const success = await subscriptionService.addTestSubscription(
        userId, 
        serviceName, 
        'premium', 
        duration
      );
      results.push({ serviceName, success });
    }
    
    res.json({
      success: true,
      userId,
      duration: `${duration}일`,
      results,
      message: `${userId}에게 모든 서비스 프리미엄 구독을 추가했습니다.`
    });
    
  } catch (error) {
    console.error('❌ [DEV] 전체 서비스 활성화 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

console.log('🧪 개발용 구독 제어 엔드포인트 추가됨:');
console.log('   GET  /api/dev/subscription-mode - 개발 모드 상태 확인');
console.log('   POST /api/dev/toggle-bypass - 구독 우회 토글');
console.log('   POST /api/dev/enable-all-services/:userId - 사용자 전체 서비스 활성화');

// ==========================================
// 🧪 Tool Schema Registry 테스트
// ==========================================

// Tool Schema Registry 초기화 테스트
app.get('/api/test/schema-registry/init', async (req, res) => {
  try {
    const { default: ToolSchemaRegistry } = await import('../../ai/core/ToolSchemaRegistry.js');
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    
    const subscriptionService = await getSubscriptionService();
    const schemaRegistry = new ToolSchemaRegistry(subscriptionService);
    
    const startTime = Date.now();
    await schemaRegistry.initialize();
    const initTime = Date.now() - startTime;
    
    const metrics = schemaRegistry.getMetrics();
    const allTools = schemaRegistry.getAllTools();
    
    res.json({
      success: true,
      initialization_time: `${initTime}ms`,
      schemas_loaded: metrics.schemasCount,
      validators_created: metrics.validatorsCount,
      tools: allTools.map(tool => ({
        name: tool.name,
        version: tool.version,
        category: tool.category,
        subscription_tier: tool.subscription_tier
      })),
      metrics
    });
    
  } catch (error) {
    console.error('❌ [TEST] Tool Schema Registry 초기화 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Tool 입력 검증 테스트
app.post('/api/test/schema-registry/validate', async (req, res) => {
  try {
    const { default: ToolSchemaRegistry } = await import('../../ai/core/ToolSchemaRegistry.js');
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    
    const { tool, input } = req.body;
    
    if (!tool || !input) {
      return res.status(400).json({
        error: 'tool과 input 필드가 필요합니다'
      });
    }
    
    const subscriptionService = await getSubscriptionService();
    const schemaRegistry = new ToolSchemaRegistry(subscriptionService);
    await schemaRegistry.initialize();
    
    const startTime = Date.now();
    const validation = await schemaRegistry.validateToolInput(tool, input);
    const validationTime = Date.now() - startTime;
    
    res.json({
      success: true,
      tool,
      input,
      validation,
      validation_time: `${validationTime}ms`,
      metrics: schemaRegistry.getMetrics()
    });
    
  } catch (error) {
    console.error('❌ [TEST] Tool 입력 검증 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 사용자별 Tool 목록 테스트
app.get('/api/test/schema-registry/tools/:userId', async (req, res) => {
  try {
    const { default: ToolSchemaRegistry } = await import('../../ai/core/ToolSchemaRegistry.js');
    const { getSubscriptionService } = await import('./services/subscriptionService.js');
    
    const { userId } = req.params;
    const { includeUnsubscribed = 'false' } = req.query;
    
    const subscriptionService = await getSubscriptionService();
    const schemaRegistry = new ToolSchemaRegistry(subscriptionService);
    await schemaRegistry.initialize();
    
    const startTime = Date.now();
    const tools = await schemaRegistry.getToolsForUser(userId, includeUnsubscribed === 'true');
    const queryTime = Date.now() - startTime;
    
    const subscribedCount = tools.filter(t => t.subscription_info.subscribed).length;
    const unsubscribedCount = tools.length - subscribedCount;
    
    res.json({
      success: true,
      userId,
      includeUnsubscribed: includeUnsubscribed === 'true',
      query_time: `${queryTime}ms`,
      stats: {
        total_tools: tools.length,
        subscribed: subscribedCount,
        unsubscribed: unsubscribedCount
      },
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        version: tool.version,
        category: tool.category,
        subscription_tier: tool.subscription_tier,
        subscribed: tool.subscription_info.subscribed,
        current_tier: tool.subscription_info.current_tier,
        required_tier: tool.subscription_info.required_tier
      }))
    });
    
  } catch (error) {
    console.error('❌ [TEST] 사용자별 Tool 목록 조회 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Tool Schema 상세 조회
app.get('/api/test/schema-registry/schema/:toolName', async (req, res) => {
  try {
    const { default: ToolSchemaRegistry } = await import('../../ai/core/ToolSchemaRegistry.js');
    
    const { toolName } = req.params;
    
    const schemaRegistry = new ToolSchemaRegistry();
    await schemaRegistry.initialize();
    
    const schema = schemaRegistry.getToolSchema(toolName);
    
    if (!schema) {
      return res.status(404).json({
        error: `Tool schema not found: ${toolName}`
      });
    }
    
    res.json({
      success: true,
      tool: toolName,
      schema
    });
    
  } catch (error) {
    console.error('❌ [TEST] Tool Schema 조회 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

console.log('🧪 Tool Schema Registry 테스트 엔드포인트 추가됨:');
console.log('   GET  /api/test/schema-registry/init - Schema Registry 초기화 테스트');
console.log('   POST /api/test/schema-registry/validate - Tool 입력 검증 테스트');
console.log('   GET  /api/test/schema-registry/tools/:userId - 사용자별 Tool 목록');
console.log('   GET  /api/test/schema-registry/schema/:toolName - Tool Schema 상세 조회');

// ==========================================
// 🧪 Tool 실행 엔드포인트 테스트
// ==========================================

// Tool 실행 테스트 (인증 없이)
app.post('/api/test/tools/execute', async (req, res) => {
  try {
    const { tool, parameters, userId = 'test-user-tool-exec' } = req.body;
    
    if (!tool || !parameters) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'tool과 parameters 필드가 필요합니다.'
      });
    }
    
    console.log(`🧪 [TEST] Tool 실행 테스트: ${tool} (사용자: ${userId})`);
    
    // 직접 Tool Execution Manager 사용
    if (!toolExecutionManager) {
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'Tool Execution Manager가 초기화되지 않았습니다.'
      });
    }
    
    const startTime = Date.now();
    
    // 1. 구독 상태 확인
    const subscriptionCheck = await toolExecutionManager.checkSubscription(userId, tool);
    console.log(`   구독 상태: ${subscriptionCheck.hasSubscription ? '✅' : '❌'} (${subscriptionCheck.tier})`);
    
    // 2. Schema 검증
    const validation = await toolExecutionManager.validateToolInput(tool, parameters);
    console.log(`   Schema 검증: ${validation.valid ? '✅' : '❌'}`);
    if (!validation.valid) {
      console.log(`   검증 오류:`, validation.errors);
    }
    
    // 3. 사용량 제한 확인
    const usageCheck = await toolExecutionManager.checkUsageLimit(userId, tool);
    console.log(`   사용량 제한: ${usageCheck.allowed ? '✅' : '❌'}`);
    
    // 4. Tool 실행 (구독 체크 우회)
    const result = await toolExecutionManager.executeToolSafely(tool, parameters, userId);
    const totalTime = Date.now() - startTime;
    
    console.log(`   실행 결과: ${result.success ? '✅' : '❌'} (${totalTime}ms)`);
    
    res.json({
      success: true,
      test_results: {
        tool,
        user_id: userId,
        subscription_check: subscriptionCheck,
        validation,
        usage_check: usageCheck,
        execution_result: result,
        total_time: `${totalTime}ms`
      },
      parameters_used: parameters
    });
    
  } catch (error) {
    console.error('❌ [TEST] Tool 실행 테스트 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Tool 목록 조회 테스트
app.get('/api/test/tools/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { includeUnsubscribed = 'true' } = req.query;
    
    console.log(`🧪 [TEST] Tool 목록 조회 테스트 (사용자: ${userId})`);
    
    if (!toolExecutionManager) {
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'Tool Execution Manager가 초기화되지 않았습니다.'
      });
    }
    
    const startTime = Date.now();
    const tools = await toolExecutionManager.getAvailableTools(userId, includeUnsubscribed === 'true');
    const queryTime = Date.now() - startTime;
    
    const subscribedCount = tools.filter(t => t.subscription_info?.subscribed).length;
    const unsubscribedCount = tools.length - subscribedCount;
    
    console.log(`   조회 완료: ${tools.length}개 (구독: ${subscribedCount}, 미구독: ${unsubscribedCount}) - ${queryTime}ms`);
    
    res.json({
      success: true,
      user_id: userId,
      include_unsubscribed: includeUnsubscribed === 'true',
      query_time: `${queryTime}ms`,
      stats: {
        total_tools: tools.length,
        subscribed: subscribedCount,
        unsubscribed: unsubscribedCount
      },
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        version: tool.version,
        category: tool.category,
        subscription_tier: tool.subscription_tier,
        subscribed: tool.subscription_info?.subscribed || false,
        current_tier: tool.subscription_info?.current_tier,
        required_tier: tool.subscription_info?.required_tier
      }))
    });
    
  } catch (error) {
    console.error('❌ [TEST] Tool 목록 조회 테스트 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Tool 실행 플로우 통합 테스트
app.post('/api/test/tools/integration', async (req, res) => {
  try {
    const { userId = 'test-integration-user' } = req.body;
    
    console.log(`🧪 [TEST] Tool 실행 통합 테스트 시작 (사용자: ${userId})`);
    
    if (!toolExecutionManager) {
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'Tool Execution Manager가 초기화되지 않았습니다.'
      });
    }
    
    const testResults = [];
    const startTime = Date.now();
    
    // 테스트 1: Tool 목록 조회
    console.log('   1️⃣ Tool 목록 조회 테스트');
    const tools = await toolExecutionManager.getAvailableTools(userId, true);
    testResults.push({
      test: 'tool_list_query',
      success: true,
      result: `${tools.length}개 Tool 조회 완료`
    });
    
    // 테스트 2: 유효한 Tool 실행 (filesystem)
    console.log('   2️⃣ 유효한 Tool 실행 테스트 (filesystem)');
    const validExecution = await toolExecutionManager.executeToolSafely('filesystem', {
      action: 'list_files',
      path: '/mnt/d'
    }, userId);
    testResults.push({
      test: 'valid_tool_execution',
      success: validExecution.success,
      result: validExecution.success ? 'filesystem Tool 실행 성공' : validExecution.error
    });
    
    // 테스트 3: 잘못된 파라미터로 Tool 실행
    console.log('   3️⃣ 잘못된 파라미터 테스트');
    const invalidValidation = await toolExecutionManager.validateToolInput('filesystem', {
      // action 필드 누락
      path: '/test'
    });
    testResults.push({
      test: 'invalid_parameters',
      success: !invalidValidation.valid,
      result: !invalidValidation.valid ? '검증 실패 정상 감지' : '검증이 통과되어서는 안됨'
    });
    
    // 테스트 4: 존재하지 않는 Tool 실행
    console.log('   4️⃣ 존재하지 않는 Tool 테스트');
    const unknownExecution = await toolExecutionManager.executeToolSafely('unknown_tool', {
      test: 'param'
    }, userId);
    testResults.push({
      test: 'unknown_tool',
      success: !unknownExecution.success,
      result: !unknownExecution.success ? '알 수 없는 Tool 오류 정상 감지' : '알려지지 않은 Tool이 실행되어서는 안됨'
    });
    
    // 테스트 5: 메트릭 조회
    console.log('   5️⃣ 메트릭 조회 테스트');
    const metrics = toolExecutionManager.getMetrics();
    testResults.push({
      test: 'metrics_query',
      success: !!metrics,
      result: `메트릭 조회 완료 (스키마: ${metrics.schema_registry?.schemasCount || 0}개)`
    });
    
    const totalTime = Date.now() - startTime;
    const successCount = testResults.filter(t => t.success).length;
    
    console.log(`   통합 테스트 완료: ${successCount}/${testResults.length} 성공 (${totalTime}ms)`);
    
    res.json({
      success: true,
      user_id: userId,
      total_time: `${totalTime}ms`,
      test_summary: {
        total_tests: testResults.length,
        passed: successCount,
        failed: testResults.length - successCount,
        success_rate: `${((successCount / testResults.length) * 100).toFixed(1)}%`
      },
      test_results: testResults,
      metrics: metrics
    });
    
  } catch (error) {
    console.error('❌ [TEST] Tool 실행 통합 테스트 실패:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

console.log('🧪 Tool 실행 테스트 엔드포인트 추가됨:');
console.log('   POST /api/test/tools/execute - Tool 실행 테스트 (인증 우회)');
console.log('   GET  /api/test/tools/list/:userId - Tool 목록 조회 테스트');
console.log('   POST /api/test/tools/integration - Tool 실행 통합 테스트');

// ==========================================

function getAllDrives() {
  try {
    const stdout = child_process.execSync('wmic logicaldisk get name').toString();
    return stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => /^[A-Z]:$/i.test(line));
  } catch (e) {
    console.error('드라이브 자동 감지 실패:', e);
    return [];
  }
}

async function indexDrivesSequentially(drives) {
  for (const drive of drives) {
    console.log(`${drive}/ 인덱싱 시작...`);
    buildIndex(drive + '/');
    startWatching(drive + '/');
    console.log(`${drive}/ 인덱싱 및 실시간 감지 완료!`);
    // 다음 드라이브는 3초 쉬고 시작
    await new Promise(res => setTimeout(res, 3000));
  }
}

// 서버 listen 이후에 자동 인덱싱/감지 실행
const PORT = process.env.PORT || 5001;
const ENABLE_AUTO_INDEXING = process.env.ENABLE_AUTO_INDEXING === 'true';

server.listen(PORT, async () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중`);
  
  // 노트 서비스 데이터베이스 연결
  try {
    await connectNotesDB();
    console.log('✅ 노트 서비스 MongoDB 연결 완료');
  } catch (error) {
    console.error('❌ 노트 서비스 MongoDB 연결 실패:', error);
  }
  
  if (ENABLE_AUTO_INDEXING) {
    setTimeout(() => {
      try {
        const drives = getAllDrives();
        indexDrivesSequentially(drives);
      } catch (e) {
        console.error('자동 인덱싱/감지 중 에러:', e);
      }
    }, 10000);
  } else {
    console.log('개발 모드: 자동 인덱싱/감지 비활성화됨');
  }
});

// 서버 종료 시 모든 서비스 정리
process.on('SIGTERM', async () => {
  logger.info('서버 종료 신호 받음');
  await dataSyncService.shutdown();
  await mcpService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('서버 중단 신호 받음');
  await dataSyncService.shutdown();
  await mcpService.shutdown();
  process.exit(0);
});

// 문서 내용 분석 API 엔드포인트 추가 (새로운 포맷터 사용)
app.get('/api/analyze/document/:filePath(*)', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const { maxLength = 10000, saveDir } = req.query;
    const userId = req.user?.id || 'anonymous';
    
    logger.info(`📄 문서 내용 분석 요청: ${filePath}`);
    if (saveDir) logger.info(`📁 사용자 지정 저장 경로: ${saveDir}`);
    
    // DocumentContentAnalyzer 사용 (새로운 포맷터 포함)
    const { DocumentContentAnalyzer } = await import('file:///D:/my_app/Web_MCP_Server/ai/services/filesystem/DocumentContentAnalyzer.js');
    const documentAnalyzer = new DocumentContentAnalyzer();
    
    // 문서 분석 실행 (saveDir 옵션 전달)
    const result = await documentAnalyzer.analyzeDocument(filePath, { saveDir });
    
    // 새로운 포맷터를 사용하여 표준화된 JSON 응답 생성
    const context = {
      userId: userId,
      subscriptionTier: 'premium' // 개발 모드에서는 premium으로 설정
    };
    
    const formattedResponse = documentAnalyzer.formatJsonResponse(result, 'analyze_document', context);
    
    // 응답 전송
    res.json(formattedResponse);
    
  } catch (error) {
    logger.error('문서 내용 분석 실패:', error);
    
         // 오류 시에도 포맷터 사용
     try {
       const { DocumentContentAnalyzer } = await import('file:///D:/my_app/Web_MCP_Server/ai/services/filesystem/DocumentContentAnalyzer.js');
      const documentAnalyzer = new DocumentContentAnalyzer();
      
      const errorResult = {
        success: false,
        error: '문서 내용 분석 중 오류가 발생했습니다',
        technical_error: error.message,
        path: decodeURIComponent(req.params.filePath)
      };
      
      const formattedErrorResponse = documentAnalyzer.formatJsonResponse(errorResult, 'analyze_document', {
        userId: req.user?.id || 'anonymous',
        subscriptionTier: 'premium'
      });
      
      res.status(500).json(formattedErrorResponse);
    } catch (formatError) {
      // 포맷터 자체에 오류가 있는 경우 기본 응답
      res.status(500).json({
        success: false,
        error: '문서 내용 분석 중 오류가 발생했습니다',
        technical_error: error.message
      });
    }
  }
});

// 문서 내용 읽기 API 엔드포인트 추가
app.get('/api/read/document/:filePath(*)', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const { maxLength = 10000 } = req.query;
    
    logger.info(`📄 문서 내용 읽기 요청: ${filePath}`);
    
    // FileSystemTools의 문서 읽기 기능 사용
    const result = await fileSystem.readDocumentContent(filePath, { maxLength });
    
    if (result.success) {
      res.json({
        success: true,
        path: filePath,
        content: result.content,
        summary: result.summary,
        analysis: result.analysis,
        metadata: result.metadata,
        performance: result.performance
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        path: filePath
      });
    }
  } catch (error) {
    logger.error('문서 내용 읽기 실패:', error);
    res.status(500).json({
      success: false,
      error: '문서 내용 읽기 중 오류가 발생했습니다',
      technical_error: error.message
    });
  }
});

// service_note 라우트 등록
// app.use('/api/v1/bookmarks', bookmarksRouter);
// app.use('/api/v1/bookmark-collections', bookmarkCollectionsRouter);
// app.use('/api/v1/quick-access', quickAccessRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/shared-notes', sharedNotesRouter);
app.use('/api/shared-notes', sharedNotesRouter);
app.use('/api/notes/analytics', analyticsRouter);

// 모든 라우트 및 미들웨어 등록 후 마지막에 에러 핸들러 추가
app.use(errorHandler);