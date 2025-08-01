import express from 'express';
const router = express.Router();

// 컬렉션 목록 조회
router.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});

// 컬렉션 생성
router.post('/', (req, res) => {
  res.json({ success: true, data: { _id: 'collection', ...req.body } });
});

// 컬렉션 수정
router.put('/:id', (req, res) => {
  res.json({ success: true, data: { _id: req.params.id, ...req.body } });
});

// 컬렉션 삭제
router.delete('/:id', (req, res) => {
  res.json({ success: true, message: '삭제됨', id: req.params.id });
});

// 컬렉션에 노트 추가
router.post('/:id/add', (req, res) => {
  res.json({ success: true, message: '노트 추가됨', id: req.params.id });
});

// 컬렉션에서 노트 제거
router.post('/:id/remove', (req, res) => {
  res.json({ success: true, message: '노트 제거됨', id: req.params.id });
});

export default router; 