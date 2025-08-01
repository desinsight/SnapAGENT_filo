async function testAPI() {
  try {
    console.log('API 테스트 시작...');
    
    // 1. 현재 인덱스 정보 조회
    console.log('\n1. 현재 인덱스 정보 조회:');
    const infoResponse = await fetch('http://localhost:5000/api/tools/ultra-fast-search/info');
    const infoData = await infoResponse.json();
    console.log('응답:', JSON.stringify(infoData, null, 2));
    
    // 2. 새로운 경로 인덱싱
    console.log('\n2. 새로운 경로 인덱싱:');
    const currentDir = process.cwd();
    const testPath = `${currentDir}/test_index`;
    
    const indexResponse = await fetch('http://localhost:5000/api/tools/ultra-fast-search/index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rootDir: testPath }),
    });
    const indexData = await indexResponse.json();
    console.log('인덱싱 응답:', JSON.stringify(indexData, null, 2));
    
    // 3. 인덱싱 후 정보 다시 조회
    console.log('\n3. 인덱싱 후 정보 조회:');
    const infoResponse2 = await fetch('http://localhost:5000/api/tools/ultra-fast-search/info');
    const infoData2 = await infoResponse2.json();
    console.log('응답:', JSON.stringify(infoData2, null, 2));
    
  } catch (error) {
    console.error('API 테스트 오류:', error.message);
  }
}

testAPI(); 