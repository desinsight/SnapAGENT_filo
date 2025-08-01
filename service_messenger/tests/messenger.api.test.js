// 메신저(채팅방/메시지) API 테스트
// supertest, jest 활용 예시

const request = require('supertest');
const app = require('../src/index'); // 실제 서버 인스턴스 필요시 수정

// TODO: 테스트용 JWT 토큰 준비(플랫폼 연동)
const TEST_TOKEN = 'test.jwt.token';

describe('Messenger API', () => {
  let roomId;

  it('채팅방 생성', async () => {
    const res = await request(app)
      .post('/api/messenger/rooms')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ roomType: 'group', name: '테스트방', members: [{ userId: 'user1' }] });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    roomId = res.body._id;
  });

  it('채팅방 목록 조회', async () => {
    const res = await request(app)
      .get('/api/messenger/rooms')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('메시지 전송', async () => {
    const res = await request(app)
      .post(`/api/messenger/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ content: '테스트 메시지', type: 'text' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });

  it('메시지 목록 조회', async () => {
    const res = await request(app)
      .get(`/api/messenger/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
}); 