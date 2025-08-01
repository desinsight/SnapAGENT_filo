/**
 * 노트 API 라우트
 * 노트 CRUD 작업 처리
 * 
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import mongoose from 'mongoose';

// 개발 모드에서는 Note 모델 사용 안함
let Note = null;
let getNotesConnectionStatus = null;

if (process.env.NODE_ENV !== 'development') {
  const { default: NoteModel } = await import('../models/Note.js');
  const { getNotesConnectionStatus: getStatus } = await import('../config/notes.js');
  Note = NoteModel;
  getNotesConnectionStatus = getStatus;
}

const router = express.Router();

// 연결 상태 캐싱 (5초간 유효)
let connectionStatusCache = null;
let lastConnectionCheck = 0;
const CONNECTION_CACHE_DURATION = 10000; // 5초 → 10초로 연장

// 캐시된 연결 상태 확인 함수 - 개발 모드에서는 항상 목업 사용
const getCachedConnectionStatus = async () => {
  const now = Date.now();
  if (!connectionStatusCache || (now - lastConnectionCheck) > CONNECTION_CACHE_DURATION) {
    try {
      // 실제 MongoDB 연결 상태 확인
      if (process.env.NODE_ENV === 'development') {
        // 개발 모드에서는 MongoDB 연결을 시도해보고, 실패하면 목업 사용
        connectionStatusCache = await getNotesConnectionStatus();
        lastConnectionCheck = now;
      } else {
        // 프로덕션 모드에서는 항상 실제 연결 상태 확인
        connectionStatusCache = await getNotesConnectionStatus();
        lastConnectionCheck = now;
      }
    } catch (error) {
      console.log('⚠️ MongoDB 연결 상태 확인 실패, 목업 데이터 사용:', error.message);
      connectionStatusCache = { connected: false };
      lastConnectionCheck = now;
    }
  }
  return connectionStatusCache;
};

// 목업 데이터 (MongoDB 연결이 없을 때 사용)
const MOCK_NOTES = [
  {
    _id: new mongoose.Types.ObjectId().toString(),
    title: '환영합니다!',
    content: '노트 서비스에 오신 것을 환영합니다. 이 노트를 편집해보세요.',
    category: '개인',
    tags: ['환영', '시작'],
    userId: 'test',
    isShared: false,
    isFavorite: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    viewCount: 1,
    editCount: 0
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    title: '개발 노트',
    content: '이것은 개발 중인 노트입니다. MongoDB 연결 없이도 작동합니다.',
    category: '업무',
    tags: ['개발', '테스트'],
    userId: 'test',
    isShared: false,
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    viewCount: 2,
    editCount: 1
  }
];

/**
 * 노트 목록 조회
 * GET /api/notes
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId; // 임시로 쿼리에서 가져옴
    const { category, tags, isShared, isFavorite, recent, search, limit, offset, page, sort } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    // 무조건 목업 데이터 사용
    let mockNotes = MOCK_NOTES.filter(note => note.userId === userId);
    // 필터 적용
    if (category && category !== 'all') {
      mockNotes = mockNotes.filter(note => note.category === category);
    }
    if (isFavorite === 'true') {
      mockNotes = mockNotes.filter(note => note.isFavorite === true);
    }
    if (recent === 'true') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      mockNotes = mockNotes.filter(note => new Date(note.updatedAt) >= sevenDaysAgo);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      mockNotes = mockNotes.filter(note => 
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
      );
    }
    // 페이지네이션 계산
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offsetNum = (pageNum - 1) * limitNum;
    const totalPages = Math.ceil(mockNotes.length / limitNum);
    const paginatedNotes = mockNotes.slice(offsetNum, offsetNum + limitNum);
    res.json({
      success: true,
      data: paginatedNotes,
      totalCount: mockNotes.length,
      totalPages: totalPages,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasMore: pageNum < totalPages
      },
      mode: 'mock'
    });
  } catch (error) {
    console.error('노트 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '노트 목록을 가져오는 중 오류가 발생했습니다'
    });
  }
});

/**
 * 노트 생성
 * POST /api/notes
 */
router.post('/', async (req, res) => {
  try {
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

    // 카테고리 검증 및 정규화
    const validCategories = ['개인', '업무', '학습', '아이디어', '할일', '기타'];
    const fixedCategory = validCategories.includes(category) ? category : '개인';

    // MongoDB 연결 상태 확인
    const dbStatus = await getCachedConnectionStatus();
    if (!dbStatus.connected) {
      console.log('📝 MongoDB 연결 없음 - 목업 데이터로 노트 생성');
      
      const newNote = {
        _id: new mongoose.Types.ObjectId().toString(),
        title,
        content,
        category: fixedCategory,
        tags: tags || [],
        isShared: isShared || false,
        isFavorite: false,
        visibility: visibility || 'private',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
        editCount: 0,
        version: 1,
        status: 'draft'
      };

      // 목업 데이터에 추가
      MOCK_NOTES.push(newNote);

      res.status(201).json({
        success: true,
        data: newNote,
        message: '노트가 성공적으로 생성되었습니다',
        mode: 'mock'
      });
      return;
    }

    const noteData = {
      title,
      content,
      category: fixedCategory,
      tags: tags || [],
      isShared: isShared || false,
      visibility: visibility || 'private',
      userId
    };

    const note = new Note(noteData);
    const savedNote = await note.save();

    res.status(201).json({
      success: true,
      data: savedNote,
      message: '노트가 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('노트 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '노트 생성 중 오류가 발생했습니다'
    });
  }
});

/**
 * 노트 상세 조회
 * GET /api/notes/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user?.id || req.query.userId; // 임시로 쿼리에서 가져옴

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    // MongoDB 연결 상태 확인
    const dbStatus = await getCachedConnectionStatus();
    if (!dbStatus.connected) {
      console.log('📝 MongoDB 연결 없음 - 목업 데이터에서 노트 조회');
      const mockNote = MOCK_NOTES.find(note => note._id === noteId && note.userId === userId);
      
      if (!mockNote) {
        return res.status(404).json({
          success: false,
          error: '노트를 찾을 수 없습니다'
        });
      }

      // 조회수 증가
      mockNote.viewCount = (mockNote.viewCount || 0) + 1;

      res.json({
        success: true,
        data: mockNote,
        mode: 'mock'
      });
      return;
    }

    const note = await Note.findOne({
      _id: noteId,
      $or: [
        { userId },
        { isShared: true, visibility: { $in: ['shared', 'public'] } }
      ],
      deletedAt: null
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: '노트를 찾을 수 없습니다'
      });
    }

    // 조회수 증가
    await note.incrementViewCount();

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('노트 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '노트를 가져오는 중 오류가 발생했습니다'
    });
  }
});

/**
 * 노트 수정
 * PUT /api/notes/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user?.id || req.body.userId; // 임시로 body에서 가져옴
    const updateData = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    // MongoDB 연결 상태 확인
    const dbStatus = await getCachedConnectionStatus();
    if (!dbStatus.connected) {
      console.log('📝 MongoDB 연결 없음 - 목업 데이터로 노트 수정');
      const mockNoteIndex = MOCK_NOTES.findIndex(note => note._id === noteId && note.userId === userId);
      
      if (mockNoteIndex === -1) {
        return res.status(404).json({
          success: false,
          error: '노트를 찾을 수 없습니다'
        });
      }

      // 목업 데이터 업데이트
      const mockNote = MOCK_NOTES[mockNoteIndex];
      Object.keys(updateData).forEach(key => {
        if (['title', 'content', 'category', 'tags', 'isShared', 'visibility', 'isFavorite', 'isBookmarked'].includes(key)) {
          mockNote[key] = updateData[key];
        }
      });

      mockNote.version = (mockNote.version || 1) + 1;
      mockNote.updatedAt = new Date();
      mockNote.editCount = (mockNote.editCount || 0) + 1;

      res.json({
        success: true,
        data: mockNote,
        message: '노트가 성공적으로 수정되었습니다',
        mode: 'mock'
      });
      return;
    }

    const note = await Note.findOne({
      _id: noteId,
      userId,
      deletedAt: null
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: '노트를 찾을 수 없습니다'
      });
    }

    // 업데이트할 필드들만 설정
    Object.keys(updateData).forEach(key => {
      if (['title', 'content', 'category', 'tags', 'isShared', 'visibility', 'isFavorite', 'isBookmarked'].includes(key)) {
        note[key] = updateData[key];
      }
    });

    note.version += 1;
    const updatedNote = await note.save();

    res.json({
      success: true,
      data: updatedNote,
      message: '노트가 성공적으로 수정되었습니다'
    });
  } catch (error) {
    console.error('노트 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '노트 수정 중 오류가 발생했습니다'
    });
  }
});

/**
 * 노트 삭제
 * DELETE /api/notes/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user?.id || req.query.userId; // 임시로 쿼리에서 가져옴
    const { permanent } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    // MongoDB 연결 상태 확인
    const dbStatus = await getCachedConnectionStatus();
    if (!dbStatus.connected) {
      console.log('📝 MongoDB 연결 없음 - 목업 데이터로 노트 삭제');
      const mockNoteIndex = MOCK_NOTES.findIndex(note => note._id === noteId && note.userId === userId);
      
      if (mockNoteIndex === -1) {
        return res.status(404).json({
          success: false,
          error: '노트를 찾을 수 없습니다'
        });
      }

      if (permanent === 'true') {
        // 영구 삭제
        MOCK_NOTES.splice(mockNoteIndex, 1);
        res.json({
          success: true,
          message: '노트가 영구적으로 삭제되었습니다',
          mode: 'mock'
        });
      } else {
        // 소프트 삭제
        MOCK_NOTES[mockNoteIndex].deletedAt = new Date();
        res.json({
          success: true,
          message: '노트가 휴지통으로 이동되었습니다',
          mode: 'mock'
        });
      }
      return;
    }

    const note = await Note.findOne({
      _id: noteId,
      userId,
      deletedAt: null
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: '노트를 찾을 수 없습니다'
      });
    }

    if (permanent === 'true') {
      // 영구 삭제
      await Note.findByIdAndDelete(noteId);
      res.json({
        success: true,
        message: '노트가 영구적으로 삭제되었습니다'
      });
    } else {
      // 소프트 삭제
      await note.softDelete();
      res.json({
        success: true,
        message: '노트가 휴지통으로 이동되었습니다'
      });
    }
  } catch (error) {
    console.error('노트 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '노트 삭제 중 오류가 발생했습니다'
    });
  }
});

/**
 * 노트 검색
 * GET /api/notes/search
 */
router.get('/search', async (req, res) => {
  try {
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
      skip: parseInt(offset) || 0
    };

    const notes = await Note.search(q, userId, options);
    const total = await Note.countDocuments({
      $and: [
        { deletedAt: null },
        {
          $or: [
            { userId },
            { isShared: true, visibility: { $in: ['shared', 'public'] } }
          ]
        },
        {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { content: { $regex: q, $options: 'i' } },
            { tags: { $in: [new RegExp(q, 'i')] } },
            { searchKeywords: { $in: [new RegExp(q, 'i')] } }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: notes,
      total,
      query: q,
      fromElasticsearch: false
    });
  } catch (error) {
    console.error('노트 검색 오류:', error);
    res.status(500).json({
      success: false,
      error: '노트 검색 중 오류가 발생했습니다'
    });
  }
});

/**
 * 노트 통계
 * GET /api/notes/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    const stats = await Note.aggregate([
      { $match: { userId, deletedAt: null } },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalEdits: { $sum: '$editCount' },
          sharedNotes: {
            $sum: { $cond: ['$isShared', 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Note.aggregate([
      { $match: { userId, deletedAt: null } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const tagStats = await Note.aggregate([
      { $match: { userId, deletedAt: null } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalNotes: 0,
          totalViews: 0,
          totalEdits: 0,
          sharedNotes: 0
        },
        categories: categoryStats,
        topTags: tagStats
      }
    });
  } catch (error) {
    console.error('노트 통계 오류:', error);
    res.status(500).json({
      success: false,
      error: '노트 통계를 가져오는 중 오류가 발생했습니다'
    });
  }
});

// 즐겨찾기(북마크) 토글 (PATCH /api/notes/:id/favorite) - 목업
router.patch('/:id/favorite', (req, res) => {
  res.json({
    success: true,
    message: '즐겨찾기 상태가 변경되었습니다 (목업)'
  });
});

export default router; 