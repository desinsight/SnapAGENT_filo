import fetch from 'node-fetch';

async function testMongoDBConnection() {
  try {
    console.log('🧪 MongoDB 연결 상태 테스트 시작...');
    
    // 1. 노트 목록 조회 (MongoDB 연결 확인)
    console.log('📋 노트 목록 조회 중...');
    const notesResponse = await fetch('http://localhost:5000/api/notes?userId=test-user-789');
    
    console.log('📋 응답 상태:', notesResponse.status);
    const notesResult = await notesResponse.json();
    console.log('📋 응답 내용:', JSON.stringify(notesResult, null, 2));
    
    if (notesResponse.ok) {
      console.log('✅ 노트 API 정상 작동!');
      console.log('📊 노트 개수:', notesResult.data?.length || 0);
      
      if (notesResult.data && notesResult.data.length > 0) {
        console.log('📝 첫 번째 노트:', {
          id: notesResult.data[0]._id,
          title: notesResult.data[0].title,
          userId: notesResult.data[0].userId
        });
      }
    } else {
      console.log('❌ 노트 API 실패');
    }
    
    // 2. 노트 생성 테스트 (MongoDB 쓰기 확인)
    console.log('\n📝 노트 생성 테스트 중...');
    const createResponse = await fetch('http://localhost:5000/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'MongoDB 연결 테스트 노트',
        content: '이 노트는 MongoDB 연결을 테스트하기 위해 생성되었습니다.',
        userId: 'test-user-789'
      })
    });
    
    console.log('📝 생성 응답 상태:', createResponse.status);
    const createResult = await createResponse.json();
    console.log('📝 생성 응답:', JSON.stringify(createResult, null, 2));
    
    if (createResponse.ok) {
      console.log('✅ 노트 생성 성공! MongoDB 연결 정상!');
    } else {
      console.log('❌ 노트 생성 실패');
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testMongoDBConnection(); 