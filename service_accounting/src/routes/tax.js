/**
 * 🧾 Tax Routes
 * 
 * 세무 신고 API 라우터
 * 부가세, 소득세, 법인세, 원천세 등의 기능
 * 
 * @author Web MCP Server Team
 * @version 1.0.0
 */

import express from 'express';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { requirePermission } from '../middlewares/auth.js';
import { logTaxRequest } from '../middlewares/requestLogger.js';
import TaxController from '../controllers/TaxController.js';

const router = express.Router();

/**
 * @swagger
 * /api/tax/vat:
 *   post:
 *     summary: 부가가치세 신고서 생성
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - period
 *             properties:
 *               period:
 *                 type: string
 *                 description: 신고 기간 (YYYY-MM)
 *     responses:
 *       201:
 *         description: 부가세 신고서 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/vat',
  requirePermission(['tax:create']),
  logTaxRequest,
  asyncHandler(TaxController.createVatReturn)
);

/**
 * @swagger
 * /api/tax/income:
 *   post:
 *     summary: 종합소득세 신고서 생성
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - taxpayerId
 *             properties:
 *               year:
 *                 type: string
 *                 description: 신고 연도
 *               taxpayerId:
 *                 type: string
 *                 description: 납세자 번호
 *     responses:
 *       201:
 *         description: 소득세 신고서 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/income',
  requirePermission(['tax:create']),
  logTaxRequest,
  asyncHandler(TaxController.createIncomeTaxReturn)
);

/**
 * @swagger
 * /api/tax/corporate:
 *   post:
 *     summary: 법인세 신고서 생성
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - corporateId
 *             properties:
 *               year:
 *                 type: string
 *                 description: 신고 연도
 *               corporateId:
 *                 type: string
 *                 description: 법인등록번호
 *     responses:
 *       201:
 *         description: 법인세 신고서 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/corporate',
  requirePermission(['tax:create']),
  logTaxRequest,
  asyncHandler(TaxController.createCorporateTaxReturn)
);

/**
 * @swagger
 * /api/tax/withholding:
 *   post:
 *     summary: 원천세 신고서 생성
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - period
 *               - type
 *             properties:
 *               period:
 *                 type: string
 *                 description: 신고 기간 (YYYY-MM)
 *               type:
 *                 type: string
 *                 enum: [salary, service, interest, dividend]
 *                 description: 원천세 유형
 *     responses:
 *       201:
 *         description: 원천세 신고서 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/withholding',
  requirePermission(['tax:create']),
  logTaxRequest,
  asyncHandler(TaxController.createWithholdingTaxReturn)
);

/**
 * @swagger
 * /api/tax/reports:
 *   get:
 *     summary: 세무 신고서 목록 조회
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [vat, income, corporate, withholding]
 *         description: 세무 신고서 유형
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, rejected]
 *         description: 신고서 상태
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작 날짜
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료 날짜
 *     responses:
 *       200:
 *         description: 세무 신고서 목록 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/reports',
  requirePermission(['tax:read']),
  logTaxRequest,
  asyncHandler(TaxController.getTaxReturns)
);

/**
 * @swagger
 * /api/tax/reports/{id}:
 *   get:
 *     summary: 세무 신고서 상세 조회
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 신고서 ID
 *     responses:
 *       200:
 *         description: 세무 신고서 상세 조회 성공
 *       404:
 *         description: 신고서를 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/reports/:id',
  requirePermission(['tax:read']),
  logTaxRequest,
  asyncHandler(TaxController.getTaxReturn)
);

/**
 * @swagger
 * /api/tax/reports/{id}/submit:
 *   post:
 *     summary: 세무 신고서 제출
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 신고서 ID
 *     responses:
 *       200:
 *         description: 세무 신고서 제출 성공
 *       404:
 *         description: 신고서를 찾을 수 없음
 *       400:
 *         description: 제출할 수 없는 상태
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/reports/:id/submit',
  requirePermission(['tax:submit']),
  logTaxRequest,
  asyncHandler(TaxController.submitTaxReturn)
);

/**
 * @swagger
 * /api/tax/reports/{id}:
 *   put:
 *     summary: 세무 신고서 수정
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 신고서 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 세무 신고서 수정 성공
 *       404:
 *         description: 신고서를 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.put('/reports/:id',
  requirePermission(['tax:update']),
  logTaxRequest,
  asyncHandler(TaxController.updateTaxReturn)
);

/**
 * @swagger
 * /api/tax/reports/{id}:
 *   delete:
 *     summary: 세무 신고서 삭제
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 신고서 ID
 *     responses:
 *       200:
 *         description: 세무 신고서 삭제 성공
 *       404:
 *         description: 신고서를 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.delete('/reports/:id',
  requirePermission(['tax:delete']),
  logTaxRequest,
  asyncHandler(TaxController.deleteTaxReturn)
);

/**
 * @swagger
 * /api/tax/reports/{id}/validate:
 *   post:
 *     summary: 세무 신고서 검증
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 신고서 ID
 *     responses:
 *       200:
 *         description: 세무 신고서 검증 성공
 *       404:
 *         description: 신고서를 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/reports/:id/validate',
  requirePermission(['tax:validate']),
  logTaxRequest,
  asyncHandler(TaxController.validateTaxReturn)
);

/**
 * @swagger
 * /api/tax/reports/{id}/calculate:
 *   post:
 *     summary: 세무 신고서 계산
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 신고서 ID
 *     responses:
 *       200:
 *         description: 세무 신고서 계산 성공
 *       404:
 *         description: 신고서를 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/reports/:id/calculate',
  requirePermission(['tax:calculate']),
  logTaxRequest,
  asyncHandler(TaxController.calculateTaxReturn)
);

/**
 * @swagger
 * /api/tax/stats:
 *   get:
 *     summary: 세무 신고서 통계 조회
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: 연도
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [vat, income, corporate, withholding]
 *         description: 세무 신고서 유형
 *     responses:
 *       200:
 *         description: 세무 신고서 통계 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/stats',
  requirePermission(['tax:read']),
  logTaxRequest,
  asyncHandler(TaxController.getTaxReturnStats)
);

/**
 * @swagger
 * /api/tax/overdue:
 *   get:
 *     summary: 기한 경과 신고서 조회
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [vat, income, corporate, withholding]
 *         description: 세무 신고서 유형
 *     responses:
 *       200:
 *         description: 기한 경과 신고서 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/overdue',
  requirePermission(['tax:read']),
  logTaxRequest,
  asyncHandler(TaxController.getOverdueTaxReturns)
    
    res.json({
      success: true,
      message: '세무 신고서가 성공적으로 제출되었습니다.',
      submissionId: `sub_${Date.now()}`
    });
  })
);

export default router; 