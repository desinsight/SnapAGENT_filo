import express from 'express';
const router = express.Router();

// 즐겨찾기 목록 조회
router.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});

// 즐겨찾기 추가
router.post('/', (req, res) => {
  res.json({ success: true, data: { _id: 'sample', ...req.body } });
});

// 즐겨찾기 삭제
router.delete('/:id', (req, res) => {
  res.json({ success: true, message: '삭제됨', id: req.params.id });
});

export default router; 