const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const auth = require('../middlewares/auth');
const { validateModule } = require('../middlewares/validation');

/**
 * 모듈 라우트
 * 분야별 맞춤 모듈 및 관리자 기능
 */

// 모든 모듈 API에 인증 적용
router.use(auth.authenticate);

/**
 * @route   POST /api/modules
 * @desc    모듈 생성
 * @access  Private (Admin)
 */
router.post('/', 
  validateModule, 
  moduleController.createModule
);

/**
 * @route   GET /api/modules
 * @desc    모듈 목록 조회
 * @access  Private
 */
router.get('/', moduleController.getModules);

/**
 * @route   GET /api/modules/:id
 * @desc    모듈 상세 조회
 * @access  Private
 */
router.get('/:id', moduleController.getModule);

/**
 * @route   PUT /api/modules/:id
 * @desc    모듈 수정
 * @access  Private (Admin)
 */
router.put('/:id', 
  validateModule, 
  moduleController.updateModule
);

/**
 * @route   DELETE /api/modules/:id
 * @desc    모듈 삭제
 * @access  Private (Admin)
 */
router.delete('/:id', moduleController.deleteModule);

/**
 * @route   PATCH /api/modules/:id/toggle
 * @desc    모듈 활성화/비활성화
 * @access  Private (Admin)
 */
router.patch('/:id/toggle', moduleController.toggleModule);

/**
 * @route   POST /api/modules/:id/install
 * @desc    모듈 설치
 * @access  Private
 */
router.post('/:id/install', moduleController.installModule);

/**
 * @route   POST /api/modules/:id/uninstall
 * @desc    모듈 제거
 * @access  Private
 */
router.post('/:id/uninstall', moduleController.uninstallModule);

/**
 * @route   POST /api/modules/:id/rate
 * @desc    모듈 평가
 * @access  Private
 */
router.post('/:id/rate', moduleController.rateModule);

/**
 * @route   GET /api/modules/category/:category
 * @desc    카테고리별 모듈 조회
 * @access  Private
 */
router.get('/category/:category', moduleController.getModulesByCategory);

/**
 * @route   GET /api/modules/public
 * @desc    공개 모듈 조회
 * @access  Private
 */
router.get('/public', moduleController.getPublicModules);

/**
 * @route   GET /api/modules/popular
 * @desc    인기 모듈 조회
 * @access  Private
 */
router.get('/popular', moduleController.getPopularModules);

/**
 * @route   GET /api/modules/:id/stats
 * @desc    모듈 통계 조회
 * @access  Private (Admin)
 */
router.get('/:id/stats', moduleController.getModuleStats);

/**
 * @route   GET /api/modules/templates
 * @desc    모듈 템플릿 조회
 * @access  Private
 */
router.get('/templates', moduleController.getModuleTemplates);

/**
 * @route   POST /api/modules/validate
 * @desc    모듈 검증
 * @access  Private (Admin)
 */
router.post('/validate', moduleController.validateModule);

module.exports = router; 