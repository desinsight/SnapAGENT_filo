import fetch from 'node-fetch';

async function testAIOrganize() {
  console.log('🤖 AI 추천 정리 기능 테스트 시작...');

  try {
    // 1. 테스트용 액션 실행 (AI 없이)
    console.log('\n📋 1. 테스트용 액션 실행 테스트...');
    const testResponse = await fetch('http://localhost:5000/api/tools/smart_organize/test-actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actions: [
          {
            type: 'move',
            src: 'C:\\Users\\hki\\Desktop\\test\\duplicates_to_review\\ai-test-file.txt',
            dest: 'C:\\Users\\hki\\Desktop\\test\\duplicates_to_review\\moved-ai-test-file.txt'
          }
        ]
      })
    });

    const raw = await testResponse.text();
    console.log('RAW 응답:', raw);

    // JSON 파싱 시도
    try {
      const testResult = JSON.parse(raw);
      console.log('✅ 테스트 액션 결과:', testResult);
    } catch (e) {
      console.error('❌ JSON 파싱 실패:', e.message);
    }

    // 2. AI 추천 정리 테스트
    console.log('\n🤖 2. AI 추천 정리 테스트...');
    const aiResponse = await fetch('http://localhost:5000/api/tools/smart_organize/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetPath: 'C:\\Users\\hki\\Desktop\\test\\duplicates_to_review',
        includeSubfolders: false,
        userRequest: 'ai-test-file.txt 파일을 moved-ai-test-file.txt로 이름을 바꿔줘'
      })
    });

    const aiRaw = await aiResponse.text();
    console.log('AI RAW 응답:', aiRaw);
    try {
      const aiResult = JSON.parse(aiRaw);
      console.log('✅ AI 추천 정리 결과:', aiResult);
    } catch (e) {
      console.error('❌ AI JSON 파싱 실패:', e.message);
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

testAIOrganize(); 