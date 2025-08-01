// 기본 API 테스트 (supertest + jest)
// 실제 엔드포인트/로직에 맞게 확장 필요

const request = require('supertest');
const app = require('../index'); // 실제 app 객체 경로에 맞게 수정

describe('Service Messenger API 기본 테스트', () => {
  it('헬스체크 API는 200을 반환해야 한다', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });

  // TODO: 인증/채팅/게시판 등 주요 엔드포인트 테스트 추가
}); 