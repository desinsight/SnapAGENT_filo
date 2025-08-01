import express from 'express';
const router = express.Router();

// 즐겨찾기 통계 조회
router.get('/', (req, res) => {
  res.json({ success: true, data: { totalBookmarks: 0, personalBookmarks: 0, sharedBookmarks: 0 } });
});

export default router; 