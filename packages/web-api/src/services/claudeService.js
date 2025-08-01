import axios from 'axios';
import fs from 'fs';
import path from 'path';

// 환경변수에서 API 키 읽기
function getClaudeApiKey() {
  return process.env.ANTHROPIC_API_KEY;
}

export async function callClaude(prompt) {
  const apiKey = getClaudeApiKey();
  
  if (!apiKey) {
    throw new Error('Claude API 키가 설정되지 않았습니다. .env 파일에 ANTHROPIC_API_KEY를 설정해주세요.');
  }

  console.log('🔄 Claude API 호출 시작...');
  console.log('프롬프트:', prompt.slice(0, 200) + '...');

  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022', // Claude 4 Sonnet으로 업그레이드
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: 30000 // 30초 타임아웃
    });

    const content = response.data?.content?.[0]?.text || '';
    console.log('✅ Claude 응답 성공');
    
    return content;

  } catch (error) {
    console.error('❌ Claude API 호출 실패:');
    console.error('오류 타입:', error.constructor.name);
    console.error('오류 메시지:', error.message);
    
    if (error.response) {
      console.error('HTTP 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
      throw new Error(`Claude API 오류 (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error('Claude API 네트워크 오류: 응답을 받지 못했습니다.');
    } else {
      throw new Error(`Claude API 설정 오류: ${error.message}`);
    }
  }
}
