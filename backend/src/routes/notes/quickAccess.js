import express from 'express';
const router = express.Router();

// 퀵액세스 목록 조회
router.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});

// 퀵액세스 추가/수정
router.post('/', (req, res) => {
  res.json({ success: true, data: { ...req.body } });
});

export default router; 