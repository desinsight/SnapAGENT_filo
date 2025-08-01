/**
 * 노트 API 라우트
 * 노트 CRUD 작업 처리
 * 
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { getService } from '../../services/notes/index.js';
import logger from '../../utils/logger.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// 카테고리 허용값
const ALLOWED_CATEGORIES = ['개인', '업무', '학습', '아이디어', '할일', '기타'];

// 입력값 검증 미들웨어
const validateNote = [
  body('title').isString().notEmpty().withMessage('제목은 필수입니다.'),
  body('content').isString().notEmpty().withMessage('내용은 필수입니다.'),
  body('category').optional().isString().isIn(ALLOWED_CATEGORIES).withMessage('유효하지 않은 카테고리입니다.'),
  body('tags').optional().isArray().withMessage('태그는 배열이어야 합니다.'),
  body('isShared').optional().isBoolean(),
  body('visibility').optional().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// 인증 미들웨어 전체 적용
router.use(authenticateJWT);

/**
 * 노트 목록 조회
 * GET /api/v1/notes
 */
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.query.userId; // 임시로 쿼리에서 가져옴
  const { category, tags, isShared, limit, offset } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID가 필요합니다'
    });
  }

  const options = {
    category,
    tags: tags ? tags.split(',') : undefined,
    isShared: isShared === 'true',
    limit: parseInt(limit) || 50,
    skip: parseInt(offset) || 0
  };

  const notesService = getService('notes');
  const result = await notesService.getUserNotes(userId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    pagination: {
      limit: options.limit,
      offset: options.skip,
      hasMore: result.data.length === options.limit
    }
  });
}));

/**
 * 노트 생성
 * POST /api/v1/notes
 */
router.post('/', validateNote, asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.body.userId; // 임시로 body에서 가져옴
  const { title, content, category, tags, isShared, visibility } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID가 필요합니다'
    });
  }

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      error: '제목과 내용은 필수입니다'
    });
  }

  const noteData = {
    title,
    content,
    category: category || '개인',
    tags: tags || [],
    isShared: isShared || false,
    visibility: visibility || 'private'
  };

  const notesService = getService('notes');
  const result = await notesService.createNote(noteData, userId);

  res.status(201).json(result);
}));

/**
 * 노트 검색
 * GET /api/v1/notes/search
 */
router.get('/search', asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.query.userId;
  const { q, category, tags, isShared, limit, offset } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID가 필요합니다'
    });
  }

  if (!q) {
    return res.status(400).json({
      success: false,
      error: '검색어가 필요합니다'
    });
  }

  const options = {
    category,
    tags: tags ? tags.split(',') : undefined,
    isShared: isShared === 'true',
    limit: parseInt(limit) || 20,
    offset: parseInt(offset) || 0
  };

  const notesService = getService('notes');
  const result = await notesService.searchNotes(q, userId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    query: q,
    fromElasticsearch: result.fromElasticsearch
  });
}));

/**
 * 노트 상세 조회
 * GET /api/v1/notes/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const noteId = req.params.id;
  const userId = req.user?.id || req.query.userId; // 임시로 쿼리에서 가져옴

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID가 필요합니다'
    });
  }

  const notesService = getService('notes');
  const result = await notesService.getNote(noteId, userId);

  res.json(result);
}));

/**
 * 노트 수정
 * PUT /api/v1/notes/:id
 */
router.put('/:id', validateNote, asyncHandler(async (req, res) => {
  const noteId = req.params.id;
  const userId = req.user?.id || req.body.userId; // 임시로 body에서 가져옴
  const updateData = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID가 필요합니다'
    });
  }

  const notesService = getService('notes');
  const result = await notesService.updateNote(noteId, updateData, userId);

  res.json(result);
}));

/**
 * 노트 삭제
 * DELETE /api/v1/notes/:id
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const noteId = req.params.id;
  const userId = req.user?.id || req.query.userId; // 임시로 쿼리에서 가져옴
  const { permanent } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID가 필요합니다'
    });
  }

  const notesService = getService('notes');
  const result = await notesService.deleteNote(noteId, userId, permanent === 'true');

  res.json(result);
}));

/**
 * 노트 통계 조회
 * GET /api/notes/stats
 */
router.get('/stats', asyncHandler(async (req, res) => {
  // 임시 목업 통계 데이터
  res.json({
    success: true,
    data: {
      totalNotes: 42,
      sharedNotes: 10,
      favoriteNotes: 7,
      recentNotes: 5,
      tags: ['프로젝트', '개인', '중요'],
      lastCreated: new Date(),
      lastUpdated: new Date()
    }
  });
}));

/**
 * 노트 즐겨찾기 토글
 * PATCH /api/notes/:noteId/favorite
 */
router.patch('/:noteId/favorite', asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { isFavorite } = req.body;
  const userId = req.user?.id || req.body.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID가 필요합니다'
    });
  }

  const notesService = getService('notes');
  const result = await notesService.updateNote(noteId, { isFavorite }, userId);

  res.json({
    success: true,
    data: result.data,
    message: isFavorite ? '즐겨찾기 추가됨' : '즐겨찾기 해제됨'
  });
}));

/**
 * 노트 복원 (휴지통에서)
 * POST /api/v1/notes/:id/restore
 */
router.post('/:id/restore', asyncHandler(async (req, res) => {
  const noteId = req.params.id;
  const userId = req.user?.id || req.body.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID가 필요합니다'
    });
  }

  const { Note } = await import('../models/Note.js');
  const note = await Note.findById(noteId);

  if (!note) {
    return res.status(404).json({
      success: false,
      error: '노트를 찾을 수 없습니다'
    });
  }

  if (note.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: '노트를 복원할 권한이 없습니다'
    });
  }

  note.restore();
  await note.save();

  res.json({
    success: true,
    message: '노트가 성공적으로 복원되었습니다',
    data: note
  });
}));

export default router; 