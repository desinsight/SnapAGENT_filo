/**
 * Legacy AI API 라우트 (사용 중단 예정)
 * ⚠️ 이 파일의 모든 엔드포인트는 레거시입니다
 * 실제 AI 기능은 /api/ai/chat-direct 엔드포인트를 사용하세요
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tool Orchestrator import (새로운 구조) - Windows ESM 호환성
const aiPath = path.resolve(__dirname, '../../../ai/core/AIOrchestrator.js');
const aiPathUrl = `file://${aiPath.replace(/\\/g, '/')}`;

let toolOrchestrator = null;

// Tool Orchestrator 동적 import
async function initializeToolOrchestrator() {
  try {
    console.log('🔄 Tool Orchestrator 시스템 초기화 시작...');
    console.log('📍 Tool 경로:', aiPath);
    
    // ToolOrchestrator import - Windows ESM 호환성
    const { ToolOrchestrator } = await import(aiPathUrl);
    console.log('📦 ToolOrchestrator 모듈 로드됨');
    
    // ToolOrchestrator 인스턴스 생성
    toolOrchestrator = new ToolOrchestrator();
    
    // Tool 시스템 초기화
    await toolOrchestrator.initialize();
    console.log('✅ Tool Orchestrator 백엔드 연결 완료');
    return true;
  } catch (error) {
    console.error('❌ Tool Orchestrator 초기화 실패:', error);
    console.error('상세 오류:', error.stack);
    return false;
  }
}

// Tool Orchestrator 상태 확인
router.get('/status', async (req, res) => {
  try {
    if (!toolOrchestrator) {
      await initializeToolOrchestrator();
    }

    if (!toolOrchestrator) {
      return res.status(503).json({
        success: false,
        status: 'unavailable',
        message: 'Tool Orchestrator 시스템을 초기화할 수 없습니다.'
      });
    }

    const status = toolOrchestrator.getSystemStatus();
    res.json({
      success: true,
      status: 'ready',
      data: status,
      message: 'Tool Orchestrator 시스템이 정상 작동 중입니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
});

// 🚫 레거시 엔드포인트 (사용 중단 예정)
// 실제 AI 채팅은 /chat-direct 엔드포인트 사용
router.post('/chat', async (req, res) => {
  console.log('⚠️ [LEGACY] POST /api/ai/chat 요청 받음 (레거시 엔드포인트)');
  
  res.status(410).json({
    success: false,
    error: 'legacy_endpoint_deprecated',
    message: '이 엔드포인트는 더 이상 사용되지 않습니다.',
    recommended_endpoint: '/api/ai/chat-direct',
    migration_guide: {
      old_endpoint: '/api/ai/chat',
      new_endpoint: '/api/ai/chat-direct',
      changes: [
        'AI 처리는 Claude API로 직접 연결됩니다',
        'Tool Calling이 지원됩니다',
        '자연스러운 대화가 가능합니다'
      ]
    }
  });
});

// 🔧 도구 직접 실행 엔드포인트 (새로 추가)
router.post('/execute-tool', async (req, res) => {
  console.log('🔧 [Tool] POST /api/ai/execute-tool 요청 받음');
  console.log('📋 [Tool] 요청 데이터:', JSON.stringify(req.body, null, 2));
  
  try {
    if (!toolOrchestrator) {
      console.log('🔄 [Tool] ToolOrchestrator 초기화 시작...');
      await initializeToolOrchestrator();
      console.log('✅ [Tool] ToolOrchestrator 초기화 완료');
    }

    if (!toolOrchestrator) {
      return res.status(503).json({
        success: false,
        error: 'Tool Orchestrator 시스템을 사용할 수 없습니다.'
      });
    }

    const { tool_name, parameters, user_id = 'anonymous' } = req.body;

    if (!tool_name) {
      return res.status(400).json({
        success: false,
        error: '도구 이름이 필요합니다.'
      });
    }

    if (!parameters) {
      return res.status(400).json({
        success: false,
        error: '도구 파라미터가 필요합니다.'
      });
    }

    console.log('🔧 [Tool] 도구 실행 시작:', tool_name);
    
    const result = await toolOrchestrator.executeToolRequest(tool_name, parameters, user_id);
    
    console.log('✅ [Tool] 도구 실행 완료');
    console.log('📤 [Tool] 응답 내용:', JSON.stringify(result, null, 2));
    
    res.json(result);

  } catch (error) {
    console.error('❌ [Tool] 오류 발생:', error);
    console.error('📋 [Tool] 오류 스택:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 📋 사용 가능한 도구 목록
router.get('/available-tools', async (req, res) => {
  try {
    if (!toolOrchestrator) {
      await initializeToolOrchestrator();
    }

    if (!toolOrchestrator) {
      return res.status(503).json({
        success: false,
        error: 'Tool Orchestrator 시스템을 사용할 수 없습니다.'
      });
    }

    const userId = req.headers['x-user-id'] || 'anonymous';
    const subscribedServices = await toolOrchestrator.getSubscribedServicesForUser(userId);

    res.json({
      success: true,
      data: {
        tools: subscribedServices.map(service => ({
          name: service.function.name,
          description: service.function.description,
          category: service.function.category || 'general',
          subscription_tier: service.function.subscription_info?.tier || 'basic'
        }))
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🚫 모든 레거시 엔드포인트들 (사용 중단)
const legacyEndpoints = [
  '/chat/stream',
  '/switch-service', 
  '/providers',
  '/summary',
  '/plan',
  '/analyze',
  '/search-analysis',
  '/organize'
];

legacyEndpoints.forEach(endpoint => {
  router.all(endpoint, (req, res) => {
    res.status(410).json({
      success: false,
      error: 'legacy_endpoint_deprecated',
      message: `${endpoint} 엔드포인트는 더 이상 사용되지 않습니다.`,
      recommended_endpoint: '/api/ai/chat-direct',
      note: 'AI 기능은 Claude API로 직접 처리됩니다.'
    });
  });
});

export default router;