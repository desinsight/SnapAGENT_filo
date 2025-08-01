/**
 * 🧾 Receipt Routes
 * 
 * 영수증 관리 API 라우터
 * OCR 처리, 자동 분류, 증빙 관리 등의 기능
 * 
 * @author Web MCP Server Team
 * @version 1.0.0
 */

import express from 'express';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { requirePermission } from '../middlewares/auth.js';
import { logReceiptRequest } from '../middlewares/requestLogger.js';
import ReceiptController from '../controllers/ReceiptController.js';

const router = express.Router();

/**
 * @swagger
 * /api/receipts/upload:
 *   post:
 *     summary: 영수증 업로드 및 OCR 처리
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 영수증 이미지 파일
 *               category:
 *                 type: string
 *                 description: 영수증 카테고리 (선택사항)
 *     responses:
 *       201:
 *         description: 영수증 업로드 및 OCR 처리 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/upload',
  requirePermission(['receipts:create']),
  logReceiptRequest,
  asyncHandler(ReceiptController.uploadReceipt)
);

/**
 * @swagger
 * /api/receipts:
 *   get:
 *     summary: 영수증 목록 조회
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 영수증 카테고리
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
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: 최소 금액
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: 최대 금액
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processed, verified, rejected]
 *         description: 처리 상태
 *     responses:
 *       200:
 *         description: 영수증 목록 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/',
  requirePermission(['receipts:read']),
  logReceiptRequest,
  asyncHandler(ReceiptController.getReceipts)
);

/**
 * @swagger
 * /api/receipts/{id}:
 *   get:
 *     summary: 영수증 상세 조회
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영수증 ID
 *     responses:
 *       200:
 *         description: 영수증 상세 조회 성공
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/:id',
  requirePermission(['receipts:read']),
  logReceiptRequest,
  asyncHandler(ReceiptController.getReceipt)
);

/**
 * @swagger
 * /api/receipts/{id}/classify:
 *   put:
 *     summary: 영수증 수동 분류
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영수증 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: 영수증 카테고리
 *               accountCode:
 *                 type: string
 *                 description: 계정과목 코드
 *               description:
 *                 type: string
 *                 description: 설명
 *     responses:
 *       200:
 *         description: 영수증 분류 성공
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.put('/:id/classify',
  requirePermission(['receipts:update']),
  logReceiptRequest,
  asyncHandler(ReceiptController.classifyReceipt)
);

/**
 * @swagger
 * /api/receipts/{id}/review:
 *   put:
 *     summary: 영수증 검토
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영수증 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, pending]
 *                 description: 검토 상태
 *               note:
 *                 type: string
 *                 description: 검토 노트
 *     responses:
 *       200:
 *         description: 영수증 검토 성공
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.put('/:id/review',
  requirePermission(['receipts:review']),
  logReceiptRequest,
  asyncHandler(ReceiptController.reviewReceipt)
);

/**
 * @swagger
 * /api/receipts/{id}/transaction:
 *   post:
 *     summary: 영수증에서 회계 전표 생성
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영수증 ID
 *     responses:
 *       201:
 *         description: 회계 전표 생성 성공
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/:id/transaction',
  requirePermission(['receipts:create', 'accounting:create']),
  logReceiptRequest,
  asyncHandler(ReceiptController.createTransactionFromReceipt)
);

/**
 * @swagger
 * /api/receipts/batch:
 *   post:
 *     summary: 영수증 일괄 처리
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiptIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 영수증 ID 목록
 *               action:
 *                 type: string
 *                 enum: [classify, review, create_transaction]
 *                 description: 수행할 작업
 *               options:
 *                 type: object
 *                 description: 작업 옵션
 *     responses:
 *       200:
 *         description: 영수증 일괄 처리 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/batch',
  requirePermission(['receipts:update']),
  logReceiptRequest,
  asyncHandler(ReceiptController.processReceiptsBatch)
);

/**
 * @swagger
 * /api/receipts/{id}:
 *   delete:
 *     summary: 영수증 삭제
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영수증 ID
 *     responses:
 *       200:
 *         description: 영수증 삭제 성공
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.delete('/:id',
  requirePermission(['receipts:delete']),
  logReceiptRequest,
  asyncHandler(ReceiptController.deleteReceipt)
);

/**
 * @swagger
 * /api/receipts/unprocessed:
 *   get:
 *     summary: 미처리 영수증 조회
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: 미처리 영수증 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/unprocessed',
  requirePermission(['receipts:read']),
  logReceiptRequest,
  asyncHandler(ReceiptController.getUnprocessedReceipts)
);

/**
 * @swagger
 * /api/receipts/unclassified:
 *   get:
 *     summary: 미분류 영수증 조회
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: 미분류 영수증 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/unclassified',
  requirePermission(['receipts:read']),
  logReceiptRequest,
  asyncHandler(ReceiptController.getUnclassifiedReceipts)
);

/**
 * @swagger
 * /api/receipts/unjournalized:
 *   get:
 *     summary: 미전표 영수증 조회
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: 미전표 영수증 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/unjournalized',
  requirePermission(['receipts:read']),
  logReceiptRequest,
  asyncHandler(ReceiptController.getUnjournalizedReceipts)
);

/**
 * @swagger
 * /api/receipts/stats:
 *   get:
 *     summary: 영수증 통계 조회
 *     tags: [Receipts]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: 영수증 카테고리
 *     responses:
 *       200:
 *         description: 영수증 통계 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/stats',
  requirePermission(['receipts:read']),
  logReceiptRequest,
  asyncHandler(ReceiptController.getReceiptStats)
);

/**
 * @swagger
 * /api/receipts/{id}/image:
 *   get:
 *     summary: 영수증 이미지 다운로드
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영수증 ID
 *     responses:
 *       200:
 *         description: 영수증 이미지 다운로드 성공
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/:id/image',
  requirePermission(['receipts:read']),
  logReceiptRequest,
  asyncHandler(ReceiptController.downloadReceiptImage)
);

/**
 * @swagger
 * /api/receipts/{id}/reprocess:
 *   post:
 *     summary: 영수증 재처리 (OCR 재실행)
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영수증 ID
 *     responses:
 *       200:
 *         description: 영수증 재처리 성공
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/:id/reprocess',
  requirePermission(['receipts:update']),
  logReceiptRequest,
  asyncHandler(ReceiptController.reprocessReceipt)
 *         description: 영수증 상세 조회 성공
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/:id',
  requirePermission(['receipts:read']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 요청 로깅
    logReceiptRequest(req, id);
    
    // TODO: 영수증 상세 조회 로직 구현
    const receipt = {
      id,
      originalName: 'receipt1.jpg',
      fileName: 'receipt_1705312225000.jpg',
      filePath: '/uploads/receipts/',
      fileSize: 1024000,
      mimeType: 'image/jpeg',
      category: 'food',
      ocrResult: {
        merchant: '스타벅스 강남점',
        address: '서울시 강남구 테헤란로 123',
        date: '2024-01-15',
        time: '14:30:25',
        totalAmount: 8500,
        items: [
          { name: '아메리카노', quantity: 1, price: 4500 },
          { name: '카페라떼', quantity: 1, price: 4000 }
        ],
        taxAmount: 850,
        paymentMethod: '카드',
        cardNumber: '1234-****-****-5678'
      },
      status: 'verified',
      uploadedBy: userId,
      uploadedAt: new Date('2024-01-15'),
      processedAt: new Date('2024-01-15'),
      verifiedAt: new Date('2024-01-15')
    };
    
    res.json({
      success: true,
      data: receipt,
      message: '영수증을 성공적으로 조회했습니다.'
    });
  })
);

/**
 * @swagger
 * /api/receipts/{id}:
 *   put:
 *     summary: 영수증 정보 수정
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영수증 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: 영수증 카테고리
 *               merchant:
 *                 type: string
 *                 description: 상점명
 *               date:
 *                 type: string
 *                 format: date
 *                 description: 영수증 날짜
 *               totalAmount:
 *                 type: number
 *                 description: 총 금액
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: 상품 목록
 *     responses:
 *       200:
 *         description: 영수증 정보 수정 성공
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.put('/:id',
  requirePermission(['receipts:update']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { category, merchant, date, totalAmount, items } = req.body;
    const userId = req.user.id;
    
    // 요청 로깅
    logReceiptRequest(req, id, totalAmount);
    
    // TODO: 영수증 정보 수정 로직 구현
    const receipt = {
      id,
      category,
      merchant,
      date,
      totalAmount,
      items,
      status: 'verified',
      updatedBy: userId,
      updatedAt: new Date()
    };
    
    res.json({
      success: true,
      data: receipt,
      message: '영수증 정보가 성공적으로 수정되었습니다.'
    });
  })
);

/**
 * @swagger
 * /api/receipts/{id}/verify:
 *   post:
 *     summary: 영수증 검증
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영수증 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - verified
 *             properties:
 *               verified:
 *                 type: boolean
 *                 description: 검증 여부
 *               notes:
 *                 type: string
 *                 description: 검증 노트
 *     responses:
 *       200:
 *         description: 영수증 검증 성공
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/:id/verify',
  requirePermission(['receipts:verify']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { verified, notes } = req.body;
    const userId = req.user.id;
    
    // 요청 로깅
    logReceiptRequest(req, id);
    
    // TODO: 영수증 검증 로직 구현
    const verification = {
      receiptId: id,
      verified,
      notes,
      verifiedBy: userId,
      verifiedAt: new Date()
    };
    
    res.json({
      success: true,
      data: verification,
      message: `영수증이 성공적으로 ${verified ? '검증' : '반려'}되었습니다.`
    });
  })
);

/**
 * @swagger
 * /api/receipts/categories:
 *   get:
 *     summary: 영수증 카테고리 목록 조회
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 카테고리 목록 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/categories',
  requirePermission(['receipts:read']),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // 요청 로깅
    logReceiptRequest(req, 'list_categories');
    
    // TODO: 영수증 카테고리 목록 조회 로직 구현
    const categories = [
      { id: 'food', name: '식비', description: '음식점, 카페 등' },
      { id: 'transport', name: '교통비', description: '대중교통, 택시 등' },
      { id: 'office', name: '사무용품', description: '문구, 사무용품 등' },
      { id: 'entertainment', name: '문화생활', description: '영화, 공연 등' },
      { id: 'medical', name: '의료비', description: '병원, 약국 등' },
      { id: 'other', name: '기타', description: '기타 비용' }
    ];
    
    res.json({
      success: true,
      data: categories,
      message: '영수증 카테고리 목록을 성공적으로 조회했습니다.'
    });
  })
);

/**
 * @swagger
 * /api/receipts/statistics:
 *   get:
 *     summary: 영수증 통계 조회
 *     tags: [Receipts]
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
 *         description: 영수증 통계 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/statistics',
  requirePermission(['receipts:read']),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    // 요청 로깅
    logReceiptRequest(req, 'get_statistics');
    
    // TODO: 영수증 통계 조회 로직 구현
    const statistics = {
      period: {
        startDate: startDate || '2024-01-01',
        endDate: endDate || '2024-12-31'
      },
      totalReceipts: 150,
      totalAmount: 2500000,
      averageAmount: 16667,
      byCategory: [
        { category: 'food', count: 80, amount: 1200000 },
        { category: 'transport', count: 40, amount: 80000 },
        { category: 'office', count: 20, amount: 500000 },
        { category: 'entertainment', count: 10, amount: 720000 }
      ],
      byStatus: [
        { status: 'verified', count: 120 },
        { status: 'processed', count: 20 },
        { status: 'pending', count: 10 }
      ]
    };
    
    res.json({
      success: true,
      data: statistics,
      message: '영수증 통계를 성공적으로 조회했습니다.'
    });
  })
);

export default router; 