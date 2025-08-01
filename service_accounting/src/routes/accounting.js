/**
 * 📊 Accounting Routes
 * 
 * 회계 관리 API 라우터
 * 복식부기, 전표 관리, 결산 등의 기능
 * 
 * @author Web MCP Server Team
 * @version 1.0.0
 */

import express from 'express';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { requireRole, requirePermission } from '../middlewares/auth.js';
import { logAccountingRequest } from '../middlewares/requestLogger.js';
import AccountingController from '../controllers/AccountingController.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AccountingEntry:
 *       type: object
 *       required:
 *         - date
 *         - description
 *         - debitAccount
 *         - creditAccount
 *         - amount
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: 전표 날짜
 *         description:
 *           type: string
 *           description: 전표 설명
 *         debitAccount:
 *           type: string
 *           description: 차변 계정과목
 *         creditAccount:
 *           type: string
 *           description: 대변 계정과목
 *         amount:
 *           type: number
 *           description: 금액
 *         reference:
 *           type: string
 *           description: 참조 번호
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: 첨부파일 ID 목록
 */

/**
 * @swagger
 * /api/accounting/entries:
 *   post:
 *     summary: 회계 전표 생성
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountingEntry'
 *     responses:
 *       201:
 *         description: 전표 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/entries', 
  requirePermission(['accounting:create']),
  logAccountingRequest,
  asyncHandler(AccountingController.createTransaction)
);

/**
 * @swagger
 * /api/accounting/entries:
 *   get:
 *     summary: 회계 전표 목록 조회
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: account
 *         schema:
 *           type: string
 *         description: 계정과목
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 전표 목록 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/entries',
  requirePermission(['accounting:read']),
  logAccountingRequest,
  asyncHandler(AccountingController.getTransactions)
);

/**
 * @swagger
 * /api/accounting/entries/{id}:
 *   get:
 *     summary: 회계 전표 상세 조회
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 전표 ID
 *     responses:
 *       200:
 *         description: 전표 상세 조회 성공
 *       404:
 *         description: 전표를 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/entries/:id',
  requirePermission(['accounting:read']),
  logAccountingRequest,
  asyncHandler(AccountingController.getTransaction)
);

/**
 * @swagger
 * /api/accounting/entries/{id}:
 *   put:
 *     summary: 회계 전표 수정
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 전표 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountingEntry'
 *     responses:
 *       200:
 *         description: 전표 수정 성공
 *       404:
 *         description: 전표를 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.put('/entries/:id',
  requirePermission(['accounting:update']),
  logAccountingRequest,
  asyncHandler(AccountingController.updateTransaction)
);

/**
 * @swagger
 * /api/accounting/entries/{id}:
 *   delete:
 *     summary: 회계 전표 삭제
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 전표 ID
 *     responses:
 *       200:
 *         description: 전표 삭제 성공
 *       404:
 *         description: 전표를 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.delete('/entries/:id',
  requirePermission(['accounting:delete']),
  logAccountingRequest,
  asyncHandler(AccountingController.cancelTransaction)
);

/**
 * @swagger
 * /api/accounting/balance:
 *   get:
 *     summary: 계정과목별 잔액 조회
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 기준 날짜
 *       - in: query
 *         name: account
 *         schema:
 *           type: string
 *         description: 특정 계정과목
 *     responses:
 *       200:
 *         description: 잔액 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/balance',
  requirePermission(['accounting:read']),
  logAccountingRequest,
  asyncHandler(AccountingController.getAccountBalance)
);

/**
 * @swagger
 * /api/accounting/reports/trial-balance:
 *   get:
 *     summary: 시산표 조회
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 기준 날짜
 *     responses:
 *       200:
 *         description: 시산표 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/reports/trial-balance',
  requirePermission(['accounting:read']),
  logAccountingRequest,
  asyncHandler(AccountingController.getGeneralLedger)
);

/**
 * @swagger
 * /api/accounting/reports/income-statement:
 *   get:
 *     summary: 손익계산서 조회
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: 손익계산서 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/reports/income-statement',
  requirePermission(['accounting:read']),
  logAccountingRequest,
  asyncHandler(AccountingController.generateIncomeStatement)
);

/**
 * @swagger
 * /api/accounting/reports/balance-sheet:
 *   get:
 *     summary: 재무상태표 조회
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 기준 날짜
 *     responses:
 *       200:
 *         description: 재무상태표 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/reports/balance-sheet',
  requirePermission(['accounting:read']),
  logAccountingRequest,
  asyncHandler(AccountingController.generateBalanceSheet)
);

/**
 * @swagger
 * /api/accounting/entries/{id}/approve:
 *   post:
 *     summary: 회계 전표 승인
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 전표 ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: 승인 노트
 *     responses:
 *       200:
 *         description: 전표 승인 성공
 *       404:
 *         description: 전표를 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/entries/:id/approve',
  requirePermission(['accounting:approve']),
  logAccountingRequest,
  asyncHandler(AccountingController.approveTransaction)
);

/**
 * @swagger
 * /api/accounting/accounts:
 *   get:
 *     summary: 계정과목 목록 조회
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 계정과목 분류
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: 계정과목 상태
 *     responses:
 *       200:
 *         description: 계정과목 목록 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/accounts',
  requirePermission(['accounting:read']),
  logAccountingRequest,
  asyncHandler(AccountingController.getAccounts)
);

/**
 * @swagger
 * /api/accounting/accounts/{id}:
 *   get:
 *     summary: 계정과목 상세 조회
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 계정과목 ID
 *     responses:
 *       200:
 *         description: 계정과목 상세 조회 성공
 *       404:
 *         description: 계정과목을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/accounts/:id',
  requirePermission(['accounting:read']),
  logAccountingRequest,
  asyncHandler(AccountingController.getAccount)
);

/**
 * @swagger
 * /api/accounting/stats:
 *   get:
 *     summary: 회계 통계 조회
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: 회계 통계 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/stats',
  requirePermission(['accounting:read']),
  logAccountingRequest,
  asyncHandler(AccountingController.getAccountingStats)
);

export default router; 