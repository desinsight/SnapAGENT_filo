/**
 * 게시판 기능 통합 테스트
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Board = require('../src/models/Board');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');

// 테스트용 JWT 토큰 생성
const jwt = require('jsonwebtoken');

const createTestToken = (userData = {}) => {
  const defaultUser = {
    id: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    name: '테스트 사용자',
    roles: ['user'],
    ...userData
  };
  
  return jwt.sign(defaultUser, process.env.JWT_SECRET || 'test-secret');
};

describe('게시판 API 테스트', () => {
  let testBoard, testPost, testComment;
  let adminToken, userToken, memberToken;
  
  beforeAll(async () => {
    // 테스트용 토큰 생성
    adminToken = createTestToken({ roles: ['admin'] });
    userToken = createTestToken({ roles: ['user'] });
    memberToken = createTestToken({ 
      id: new mongoose.Types.ObjectId(),
      roles: ['user'] 
    });
  });
  
  beforeEach(async () => {
    // 테스트 데이터 초기화
    await Board.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
  });
  
  afterAll(async () => {
    await mongoose.connection.close();
  });
  
  describe('게시판 생성', () => {
    test('관리자가 게시판을 생성할 수 있어야 함', async () => {
      const boardData = {
        name: '테스트 게시판',
        type: 'general',
        description: '테스트용 게시판입니다.',
        isPublic: true
      };
      
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(boardData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(boardData.name);
      expect(response.body.data.type).toBe(boardData.type);
    });
    
    test('일반 사용자는 게시판을 생성할 수 없어야 함', async () => {
      const boardData = {
        name: '테스트 게시판',
        type: 'general'
      };
      
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${userToken}`)
        .send(boardData);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
    
    test('중복된 게시판명으로 생성할 수 없어야 함', async () => {
      // 첫 번째 게시판 생성
      const boardData = {
        name: '중복 테스트 게시판',
        type: 'general'
      };
      
      await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(boardData);
      
      // 중복된 이름으로 두 번째 게시판 생성 시도
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(boardData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('게시판 목록 조회', () => {
    beforeEach(async () => {
      // 테스트용 게시판들 생성
      await Board.create([
        {
          name: '공개 게시판 1',
          type: 'general',
          isPublic: true,
          createdBy: new mongoose.Types.ObjectId()
        },
        {
          name: '공개 게시판 2',
          type: 'notice',
          isPublic: true,
          createdBy: new mongoose.Types.ObjectId()
        },
        {
          name: '비공개 게시판',
          type: 'general',
          isPublic: false,
          members: [new mongoose.Types.ObjectId()],
          createdBy: new mongoose.Types.ObjectId()
        }
      ]);
    });
    
    test('공개 게시판 목록을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/boards')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.boards).toHaveLength(2); // 공개 게시판만
    });
    
    test('관리자는 모든 게시판을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/boards')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.boards).toHaveLength(3); // 모든 게시판
    });
    
    test('페이징이 정상적으로 작동해야 함', async () => {
      const response = await request(app)
        .get('/api/boards?page=1&limit=1')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.boards).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });
  
  describe('게시글 작성', () => {
    beforeEach(async () => {
      // 테스트용 게시판 생성
      testBoard = await Board.create({
        name: '테스트 게시판',
        type: 'general',
        isPublic: true,
        createdBy: new mongoose.Types.ObjectId()
      });
    });
    
    test('공개 게시판에 게시글을 작성할 수 있어야 함', async () => {
      const postData = {
        title: '테스트 게시글',
        content: '테스트 내용입니다.'
      };
      
      const response = await request(app)
        .post(`/api/boards/${testBoard._id}/posts`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(postData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(postData.title);
      expect(response.body.data.content).toBe(postData.content);
    });
    
    test('필수 필드가 없으면 에러가 발생해야 함', async () => {
      const postData = {
        title: '제목만 있는 게시글'
        // content 없음
      };
      
      const response = await request(app)
        .post(`/api/boards/${testBoard._id}/posts`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(postData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('존재하지 않는 게시판에 글을 작성할 수 없어야 함', async () => {
      const postData = {
        title: '테스트 게시글',
        content: '테스트 내용입니다.'
      };
      
      const fakeBoardId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/boards/${fakeBoardId}/posts`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(postData);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('게시글 목록 조회', () => {
    beforeEach(async () => {
      // 테스트용 게시판과 게시글들 생성
      testBoard = await Board.create({
        name: '테스트 게시판',
        type: 'general',
        isPublic: true,
        createdBy: new mongoose.Types.ObjectId()
      });
      
      await Post.create([
        {
          title: '첫 번째 게시글',
          content: '첫 번째 내용',
          board: testBoard._id,
          author: new mongoose.Types.ObjectId()
        },
        {
          title: '두 번째 게시글',
          content: '두 번째 내용',
          board: testBoard._id,
          author: new mongoose.Types.ObjectId()
        }
      ]);
    });
    
    test('게시판의 게시글 목록을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}/posts`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(2);
    });
    
    test('검색 기능이 정상적으로 작동해야 함', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}/posts?search=첫 번째`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.posts[0].title).toBe('첫 번째 게시글');
    });
  });
  
  describe('댓글 작성', () => {
    beforeEach(async () => {
      // 테스트용 게시판과 게시글 생성
      testBoard = await Board.create({
        name: '테스트 게시판',
        type: 'general',
        isPublic: true,
        createdBy: new mongoose.Types.ObjectId()
      });
      
      testPost = await Post.create({
        title: '테스트 게시글',
        content: '테스트 내용',
        board: testBoard._id,
        author: new mongoose.Types.ObjectId()
      });
    });
    
    test('게시글에 댓글을 작성할 수 있어야 함', async () => {
      const commentData = {
        content: '테스트 댓글입니다.'
      };
      
      const response = await request(app)
        .post(`/api/posts/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(commentData.content);
    });
    
    test('댓글 내용이 없으면 에러가 발생해야 함', async () => {
      const commentData = {
        content: ''
      };
      
      const response = await request(app)
        .post(`/api/posts/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('게시글 검색', () => {
    beforeEach(async () => {
      // 테스트용 게시판과 게시글들 생성
      testBoard = await Board.create({
        name: '테스트 게시판',
        type: 'general',
        isPublic: true,
        createdBy: new mongoose.Types.ObjectId()
      });
      
      await Post.create([
        {
          title: '검색 테스트 게시글',
          content: '검색할 내용입니다.',
          board: testBoard._id,
          author: new mongoose.Types.ObjectId()
        },
        {
          title: '다른 게시글',
          content: '다른 내용입니다.',
          board: testBoard._id,
          author: new mongoose.Types.ObjectId()
        }
      ]);
    });
    
    test('키워드로 게시글을 검색할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/search/posts?keyword=검색')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.posts[0].title).toBe('검색 테스트 게시글');
    });
  });
}); 