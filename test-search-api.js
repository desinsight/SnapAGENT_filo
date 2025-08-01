import fetch from 'node-fetch';

async function testSearchAPI() {
  try {
    console.log('🧪 노트 검색 API 테스트 시작...');
    
    // 검색 테스트
    const searchResponse = await fetch('http://localhost:5000/api/notes/search?q=테스트&userId=test-user-789');
    
    console.log('🔍 검색 응답 상태:', searchResponse.status);
    const searchResult = await searchResponse.json();
    console.log('🔍 검색 응답:', JSON.stringify(searchResult, null, 2));
    
    if (searchResponse.ok) {
      console.log('✅ 검색 API 성공!');
      console.log('📊 검색 결과 수:', searchResult.data?.length || 0);
    } else {
      console.log('❌ 검색 API 실패');
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testSearchAPI(); 