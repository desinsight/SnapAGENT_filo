/**
 * 🛣️ Contact Routes
 * 
 * 연락처 API 라우트 정의
 * 
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  checkDuplicate,
  mergeContacts,
  getContactStats,
  importContacts,
  exportContacts
} from '../controllers/contactController.js';
import { auth } from '../middleware/auth.js';
import { validateContact } from '../middleware/validation.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: 연락처 이름
 *         firstName:
 *           type: string
 *           description: 이름
 *         lastName:
 *           type: string
 *           description: 성
 *         company:
 *           type: string
 *           description: 회사명
 *         position:
 *           type: string
 *           description: 직책
 *         industry:
 *           type: string
 *           description: 업계
 *         emails:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               label:
 *                 type: string
 *                 enum: [personal, work, mobile, home, other]
 *               isPrimary:
 *                 type: boolean
 *         phones:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               label:
 *                 type: string
 *                 enum: [personal, work, mobile, home, other]
 *               isPrimary:
 *                 type: boolean
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *             enum: [client, vendor, partner, employee, friend, family, other]
 *         isPublic:
 *           type: boolean
 *           description: 공개 여부
 *         notes:
 *           type: string
 *           description: 메모
 */

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: 연락처 생성
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Contact'
 *     responses:
 *       201:
 *         description: 연락처 생성 성공
 *       400:
 *         description: 유효성 검사 실패
 *       409:
 *         description: 중복 연락처
 */
router.post('/', auth, validateContact, createContact);

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: 연락처 목록 조회
 *     tags: [Contacts]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: 업계 필터
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: 회사 필터
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 태그 필터 (쉼표로 구분)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 카테고리 필터
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, company, industry, createdAt, updatedAt]
 *           default: name
 *         description: 정렬 기준
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: 정렬 순서
 *     responses:
 *       200:
 *         description: 연락처 목록 조회 성공
 */
router.get('/', auth, getContacts);

/**
 * @swagger
 * /api/contacts/stats:
 *   get:
 *     summary: 연락처 통계 조회
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 통계 조회 성공
 */
router.get('/stats', auth, getContactStats);

/**
 * @swagger
 * /api/contacts/export:
 *   get:
 *     summary: 연락처 내보내기
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, vcf]
 *           default: json
 *         description: 내보내기 형식
 *     responses:
 *       200:
 *         description: 내보내기 성공
 */
router.get('/export', auth, exportContacts);

/**
 * @swagger
 * /api/contacts/import:
 *   post:
 *     summary: 연락처 가져오기
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contacts:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Contact'
 *               options:
 *                 type: object
 *                 properties:
 *                   overwrite:
 *                     type: boolean
 *                     default: false
 *     responses:
 *       200:
 *         description: 가져오기 성공
 */
router.post('/import', auth, importContacts);

/**
 * @swagger
 * /api/contacts/merge:
 *   post:
 *     summary: 연락처 병합
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - primaryId
 *               - secondaryIds
 *             properties:
 *               primaryId:
 *                 type: string
 *                 description: 주 연락처 ID
 *               secondaryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 병합할 연락처 ID 목록
 *               mergeOptions:
 *                 type: object
 *                 properties:
 *                   emails:
 *                     type: boolean
 *                     default: true
 *                   phones:
 *                     type: boolean
 *                     default: true
 *                   addresses:
 *                     type: boolean
 *                     default: true
 *                   tags:
 *                     type: boolean
 *                     default: true
 *                   projects:
 *                     type: boolean
 *                     default: true
 *                   notes:
 *                     type: boolean
 *                     default: true
 *     responses:
 *       200:
 *         description: 병합 성공
 */
router.post('/merge', auth, mergeContacts);

/**
 * @swagger
 * /api/contacts/{id}:
 *   get:
 *     summary: 연락처 상세 조회
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 연락처 ID
 *     responses:
 *       200:
 *         description: 연락처 조회 성공
 *       404:
 *         description: 연락처를 찾을 수 없음
 */
router.get('/:id', auth, getContact);

/**
 * @swagger
 * /api/contacts/{id}:
 *   put:
 *     summary: 연락처 수정
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 연락처 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Contact'
 *     responses:
 *       200:
 *         description: 연락처 수정 성공
 *       404:
 *         description: 연락처를 찾을 수 없음
 */
router.put('/:id', auth, validateContact, updateContact);

/**
 * @swagger
 * /api/contacts/{id}:
 *   delete:
 *     summary: 연락처 삭제 (아카이브)
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 연락처 ID
 *     responses:
 *       200:
 *         description: 연락처 아카이브 성공
 *       404:
 *         description: 연락처를 찾을 수 없음
 */
router.delete('/:id', auth, deleteContact);

/**
 * @swagger
 * /api/contacts/{id}/duplicate-check:
 *   post:
 *     summary: 중복 연락처 확인
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 연락처 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: string
 *               phones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: string
 *               name:
 *                 type: string
 *               company:
 *                 type: string
 *     responses:
 *       200:
 *         description: 중복 확인 완료
 */
router.post('/:id/duplicate-check', auth, checkDuplicate);

export default router; 