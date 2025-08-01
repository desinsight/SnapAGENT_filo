import fetch from 'node-fetch';

async function testFavoriteAPI() {
  try {
    console.log('🧪 즐겨찾기 API 테스트 시작...');
    
    // 먼저 노트 목록을 가져와서 테스트할 노트 ID를 확인
    const listResponse = await fetch('http://localhost:5000/api/notes?userId=test-user-789');
    const listResult = await listResponse.json();
    
    console.log('📋 노트 목록:', listResult);
    
    if (!listResult.data || listResult.data.length === 0) {
      console.log('❌ 테스트할 노트가 없습니다. 먼저 노트를 생성해주세요.');
      return;
    }
    
    const testNote = listResult.data[0];
    console.log('🎯 테스트할 노트:', testNote._id);
    
    // 즐겨찾기 토글 테스트
    const favoriteResponse = await fetch(`http://localhost:5000/api/notes/${testNote._id}/favorite`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        isFavorite: true,
        userId: 'test-user-789'
      })
    });
    
    console.log('⭐ 즐겨찾기 응답 상태:', favoriteResponse.status);
    const favoriteResult = await favoriteResponse.json();
    console.log('⭐ 즐겨찾기 응답:', JSON.stringify(favoriteResult, null, 2));
    
    if (favoriteResponse.ok) {
      console.log('✅ 즐겨찾기 토글 성공!');
    } else {
      console.log('❌ 즐겨찾기 토글 실패');
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testFavoriteAPI(); 