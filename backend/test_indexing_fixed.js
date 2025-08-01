import fetch from 'node-fetch';

async function testIndexing() {
  try {
    console.log('인덱싱 테스트 시작...');
    
    // 인덱싱 요청
    const response = await fetch('http://localhost:5050/tools/ultra-fast-search/index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rootDir: 'D:\\my_app\\Web_MCP_Server\\backend'
      })
    });
    
    const result = await response.json();
    console.log('인덱싱 결과:', result);
    
    if (result.success) {
      // 인덱스 정보 조회
      const infoResponse = await fetch('http://localhost:5050/tools/ultra-fast-search/info');
      const infoResult = await infoResponse.json();
      console.log('인덱스 정보:', infoResult);
    }
    
  } catch (error) {
    console.error('오류:', error.message);
  }
}

testIndexing(); 