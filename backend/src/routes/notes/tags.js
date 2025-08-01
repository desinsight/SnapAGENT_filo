/**
 * 태그 API 라우트
 * 태그 관리 기능
 * 
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * 태그 목록 조회
 * GET /api/v1/tags
 */
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.query.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID가 필요합니다'
    });
  }

  const { Note } = await import('../models/Note.js');
  const notes = await Note.find({
    $or: [
      { userId },
      { 'collaborators.userId': userId }
    ],
    deletedAt: null
  }).select('tags');

  const allTags = notes.reduce((tags, note) => {
    return tags.concat(note.tags || []);
  }, []);

  const uniqueTags = [...new Set(allTags)].sort();

  res.json({
    success: true,
    data: uniqueTags,
    total: uniqueTags.length
  });
}));

// GET /api/tags
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: ['프로젝트', '개인', '중요', '회의', '학습', '아이디어']
  });
});

export default router; 