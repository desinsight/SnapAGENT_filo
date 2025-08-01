import fetch from 'node-fetch';

async function testNoteAPI() {
  try {
    console.log('🧪 노트 API 테스트 시작...');
    
    // 노트 생성 테스트
    const createResponse = await fetch('http://localhost:5000/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'API 테스트 노트',
        content: '이것은 API 테스트를 위한 노트입니다.',
        userId: 'test-user-789'
      })
    });
    
    console.log('📝 생성 응답 상태:', createResponse.status);
    const createResult = await createResponse.json();
    console.log('📝 생성 응답:', JSON.stringify(createResult, null, 2));
    
    if (createResponse.ok) {
      // 노트 목록 조회 테스트
      const listResponse = await fetch('http://localhost:5000/api/notes?userId=test-user-789');
      console.log('📋 목록 응답 상태:', listResponse.status);
      const listResult = await listResponse.json();
      console.log('📋 목록 응답:', JSON.stringify(listResult, null, 2));
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

testNoteAPI(); 