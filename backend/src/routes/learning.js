/**
 * 🧠 백엔드 학습 시스템 API 라우트
 * 학습 데이터 조회, 설정 관리, 분석 결과 제공
 */

import express from 'express';
import {
  initializeBackendLearning,
  getAnalysis,
  getUserAnalysis,
  getEndpointAnalysis,
  exportData,
  resetData,
  updateConfig,
  getSystemStatus,
  shutdownLearningSystem
} from '../learning/index.js';

const router = express.Router();

/**
 * 학습 시스템 초기화
 * POST /api/learning/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    const config = req.body.config || {};
    const manager = initializeBackendLearning(config);
    
    res.json({
      success: true,
      message: '백엔드 학습 시스템이 초기화되었습니다.',
      config: manager.config
    });
  } catch (error) {
    console.error('❌ 학습 시스템 초기화 실패:', error);
    res.status(500).json({
      success: false,
      error: '학습 시스템 초기화 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 시스템 상태 확인
 * GET /api/learning/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = getSystemStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('❌ 시스템 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '시스템 상태 확인 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 종합 분석 결과 조회
 * GET /api/learning/analysis
 */
router.get('/analysis', async (req, res) => {
  try {
    const analysis = getAnalysis();
    
    if (analysis.error) {
      return res.status(500).json({
        success: false,
        error: analysis.error
      });
    }
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('❌ 분석 결과 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '분석 결과 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 사용자별 분석 조회
 * GET /api/learning/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const analysis = getUserAnalysis(userId);
    
    if (analysis.error) {
      return res.status(500).json({
        success: false,
        error: analysis.error
      });
    }
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('❌ 사용자 분석 실패:', error);
    res.status(500).json({
      success: false,
      error: '사용자 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 엔드포인트별 분석 조회
 * GET /api/learning/endpoint
 */
router.get('/endpoint', async (req, res) => {
  try {
    const { endpoint, method } = req.query;
    
    if (!endpoint || !method) {
      return res.status(400).json({
        success: false,
        error: 'endpoint와 method 파라미터가 필요합니다.'
      });
    }
    
    const analysis = getEndpointAnalysis(endpoint, method);
    
    if (analysis.error) {
      return res.status(500).json({
        success: false,
        error: analysis.error
      });
    }
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('❌ 엔드포인트 분석 실패:', error);
    res.status(500).json({
      success: false,
      error: '엔드포인트 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 학습 데이터 내보내기
 * GET /api/learning/export
 */
router.get('/export', async (req, res) => {
  try {
    const data = exportData();
    
    if (data.error) {
      return res.status(500).json({
        success: false,
        error: data.error
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ 데이터 내보내기 실패:', error);
    res.status(500).json({
      success: false,
      error: '데이터 내보내기 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 학습 데이터 초기화
 * POST /api/learning/reset
 */
router.post('/reset', async (req, res) => {
  try {
    const result = resetData();
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('❌ 데이터 초기화 실패:', error);
    res.status(500).json({
      success: false,
      error: '데이터 초기화 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 학습 시스템 설정 업데이트
 * PUT /api/learning/config
 */
router.put('/config', async (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'config 객체가 필요합니다.'
      });
    }
    
    const result = updateConfig(config);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      message: '설정이 업데이트되었습니다.',
      config: result.config
    });
  } catch (error) {
    console.error('❌ 설정 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: '설정 업데이트 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 학습 시스템 종료
 * POST /api/learning/shutdown
 */
router.post('/shutdown', async (req, res) => {
  try {
    const result = shutdownLearningSystem();
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('❌ 학습 시스템 종료 실패:', error);
    res.status(500).json({
      success: false,
      error: '학습 시스템 종료 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * API 패턴 분석 조회
 * GET /api/learning/patterns/api
 */
router.get('/patterns/api', async (req, res) => {
  try {
    const analysis = getAnalysis();
    
    if (analysis.error) {
      return res.status(500).json({
        success: false,
        error: analysis.error
      });
    }
    
    res.json({
      success: true,
      apiPatterns: analysis.apiAnalysis
    });
  } catch (error) {
    console.error('❌ API 패턴 분석 실패:', error);
    res.status(500).json({
      success: false,
      error: 'API 패턴 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 보안 패턴 분석 조회
 * GET /api/learning/patterns/security
 */
router.get('/patterns/security', async (req, res) => {
  try {
    const analysis = getAnalysis();
    
    if (analysis.error) {
      return res.status(500).json({
        success: false,
        error: analysis.error
      });
    }
    
    res.json({
      success: true,
      securityPatterns: analysis.securityAnalysis
    });
  } catch (error) {
    console.error('❌ 보안 패턴 분석 실패:', error);
    res.status(500).json({
      success: false,
      error: '보안 패턴 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 성능 패턴 분석 조회
 * GET /api/learning/patterns/performance
 */
router.get('/patterns/performance', async (req, res) => {
  try {
    const analysis = getAnalysis();
    
    if (analysis.error) {
      return res.status(500).json({
        success: false,
        error: analysis.error
      });
    }
    
    res.json({
      success: true,
      performancePatterns: analysis.performanceAnalysis
    });
  } catch (error) {
    console.error('❌ 성능 패턴 분석 실패:', error);
    res.status(500).json({
      success: false,
      error: '성능 패턴 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 시스템 건강도 조회
 * GET /api/learning/health
 */
router.get('/health', async (req, res) => {
  try {
    const analysis = getAnalysis();
    
    if (analysis.error) {
      return res.status(500).json({
        success: false,
        error: analysis.error
      });
    }
    
    res.json({
      success: true,
      systemHealth: analysis.systemHealth
    });
  } catch (error) {
    console.error('❌ 시스템 건강도 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '시스템 건강도 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * 권장사항 조회
 * GET /api/learning/recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    const analysis = getAnalysis();
    
    if (analysis.error) {
      return res.status(500).json({
        success: false,
        error: analysis.error
      });
    }
    
    res.json({
      success: true,
      recommendations: analysis.recommendations
    });
  } catch (error) {
    console.error('❌ 권장사항 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '권장사항 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

export default router; 