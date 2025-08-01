import express from 'express';
const router = express.Router();

/**
 * 노트 통계 조회
 * GET /api/notes/analytics
 */
router.get('/', async (req, res) => {
  // TODO: 실제 통계 로직 구현
  res.json({
    success: true,
    data: {
      totalNotes: 0,
      sharedNotes: 0,
      favoriteNotes: 0,
      recentNotes: 0
    }
  });
});

export default router; 