// 게시판/게시글/댓글 API 테스트
// supertest, jest 활용 예시

const request = require('supertest');
const app = require('../src/index'); // 실제 서버 인스턴스 필요시 수정

// TODO: 테스트용 JWT 토큰 준비(플랫폼 연동)
const TEST_TOKEN = 'test.jwt.token';

describe('Board API', () => {
  let boardId, postId, commentId;

  it('게시판 생성', async () => {
    const res = await request(app)
      .post('/api/board/boards')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ boardType: 'free', name: '테스트게시판' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    boardId = res.body._id;
  });

  it('게시판 목록 조회', async () => {
    const res = await request(app)
      .get('/api/board/boards')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('게시글 작성', async () => {
    const res = await request(app)
      .post(`/api/board/boards/${boardId}/posts`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ title: '테스트글', content: '내용', isNotice: false });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    postId = res.body._id;
  });

  it('게시글 목록 조회', async () => {
    const res = await request(app)
      .get(`/api/board/boards/${boardId}/posts`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('댓글 작성', async () => {
    const res = await request(app)
      .post(`/api/board/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ content: '댓글내용' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    commentId = res.body._id;
  });

  it('댓글 목록 조회', async () => {
    const res = await request(app)
      .get(`/api/board/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
}); 