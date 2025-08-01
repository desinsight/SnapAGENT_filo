/**
 * 공용 노트 API 라우트
 * 공용 노트 및 협업 기능
 * 
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
const router = express.Router();

// 목업 데이터
const MOCK_SHARED_NOTES = [
  {
    _id: '1',
    title: '공유 노트 예시',
    content: '이것은 공유 노트 목업입니다.',
    owner: 'test',
    sharedWith: ['user1', 'user2'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 공유 노트 목록 조회 (GET /api/v1/shared-notes)
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: MOCK_SHARED_NOTES,
    total: MOCK_SHARED_NOTES.length,
    totalPages: 1,
    pageSize: MOCK_SHARED_NOTES.length,
    page: 1,
    pagination: {
      page: 1,
      pageSize: MOCK_SHARED_NOTES.length,
      total: MOCK_SHARED_NOTES.length,
      totalPages: 1
    },
    mode: 'mock'
  });
});

// 협업자 추가 (목업)
router.post('/:id/collaborators', (req, res) => {
  res.json({
    success: true,
    message: '협업자가 추가되었습니다 (목업)'
  });
});

// 협업자 제거 (목업)
router.delete('/:id/collaborators/:collaboratorId', (req, res) => {
  res.json({
    success: true,
    message: '협업자가 제거되었습니다 (목업)'
  });
});

export default router; 