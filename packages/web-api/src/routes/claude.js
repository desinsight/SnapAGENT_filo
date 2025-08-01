import express from 'express';
import { callClaude } from '../services/claudeService.js';
import { SearchEngine } from '../../../mcp-server/src/search/SearchEngine.js';
import { NaturalLanguageProcessor } from '../../../mcp-server/src/ai-copilot/NaturalLanguageProcessor.js';
import os from 'os';
import fs from 'fs';

const router = express.Router();
const searchEngine = new SearchEngine();
const nlpProcessor = new NaturalLanguageProcessor();

// 실제 사용자 계정명 및 OS별 경로 자동 인식
const userName = process.env.USERNAME || process.env.USER || os.userInfo().username;
const homeDir = os.homedir();
const isWin = process.platform === 'win32';

// Windows와 Unix 계열의 경로 차이 처리
const userBase = homeDir;

console.log('🔍 경로 매핑 정보:', {
  userName,
  isWin,
  userBase,
  processEnv: {
    USERNAME: process.env.USERNAME,
    USER: process.env.USER
  }
});

// 경로 존재 여부 확인 함수
const getValidPath = (path) => {
  try {
    if (fs.existsSync(path)) {
      console.log(`✅ 경로 존재: ${path}`);
      return path;
    }
    console.log(`❌ 경로 없음: ${path}`);
    // 대안 경로들 시도
    const alternatives = [
      path.replace(/\\/g, '/'),
      path.replace(/\//g, '\\'),
      path.toLowerCase(),
      path.toUpperCase()
    ];
    for (const alt of alternatives) {
      if (fs.existsSync(alt)) {
        console.log(`✅ 대안 경로 발견: ${alt}`);
        return alt;
      }
    }
    return null;
  } catch (error) {
    console.log(`❌ 경로 확인 오류: ${path}`, error.message);
    return null;
  }
};

// 동적으로 시스템 폴더 경로 생성
const folderAliasMap = {
  '다운로드': getValidPath(`${userBase}/Downloads`) || getValidPath(`${userBase}/downloads`) || `${userBase}/Downloads`,
  'download': getValidPath(`${userBase}/Downloads`) || getValidPath(`${userBase}/downloads`) || `${userBase}/Downloads`,
  'downloads': getValidPath(`${userBase}/Downloads`) || getValidPath(`${userBase}/downloads`) || `${userBase}/Downloads`,
  '문서': getValidPath(`${userBase}/Documents`) || getValidPath(`${userBase}/문서`) || `${userBase}/Documents`,
  'documents': getValidPath(`${userBase}/Documents`) || getValidPath(`${userBase}/문서`) || `${userBase}/Documents`,
  '바탕화면': getValidPath(`${userBase}/Desktop`) || getValidPath(`${userBase}/바탕 화면`) || `${userBase}/Desktop`,
  'desktop': getValidPath(`${userBase}/Desktop`) || getValidPath(`${userBase}/바탕 화면`) || `${userBase}/Desktop`,
  '사진': getValidPath(`${userBase}/Pictures`) || getValidPath(`${userBase}/사진`) || `${userBase}/Pictures`,
  'pictures': getValidPath(`${userBase}/Pictures`) || getValidPath(`${userBase}/사진`) || `${userBase}/Pictures`,
  '음악': getValidPath(`${userBase}/Music`) || getValidPath(`${userBase}/음악`) || `${userBase}/Music`,
  'music': getValidPath(`${userBase}/Music`) || getValidPath(`${userBase}/음악`) || `${userBase}/Music`,
  '동영상': getValidPath(`${userBase}/Videos`) || getValidPath(`${userBase}/비디오`) || `${userBase}/Videos`,
  'videos': getValidPath(`${userBase}/Videos`) || getValidPath(`${userBase}/비디오`) || `${userBase}/Videos`,
  'video': getValidPath(`${userBase}/Videos`) || getValidPath(`${userBase}/비디오`) || `${userBase}/Videos`,
  '비디오': getValidPath(`${userBase}/Videos`) || getValidPath(`${userBase}/비디오`) || `${userBase}/Videos`,
  // 추가 별칭
  'temp': getValidPath(os.tmpdir()) || os.tmpdir(),
  'tmp': getValidPath(os.tmpdir()) || os.tmpdir(),
  '임시': getValidPath(os.tmpdir()) || os.tmpdir(),
  'home': homeDir,
  '홈': homeDir,
  'c드라이브': 'C:/',
  'd드라이브': 'D:/',
  'c': 'C:/',
  'd': 'D:/'
};

console.log('📁 폴더별칭 매핑:', folderAliasMap);

// 각 경로의 존재 여부 확인
console.log('📍 경로 존재 여부 확인:');
Object.entries(folderAliasMap).forEach(([alias, path]) => {
  const exists = fs.existsSync(path);
  console.log(`  ${alias}: ${path} ${exists ? '✅' : '❌'}`);
});

// API 키 테스트 엔드포인트
router.get('/test', (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey.length > 10) {
    res.json({ 
      status: 'success', 
      message: 'API 키가 정상적으로 로드되었습니다',
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 10) + '...'
    });
  } else {
    res.status(500).json({ 
      status: 'error', 
      message: 'API 키가 로드되지 않았습니다',
      apiKey: apiKey || 'undefined'
    });
  }
});

// 실행 결과 요약/리포트 API
router.post('/summary', async (req, res) => {
  try {
    const { resultData } = req.body;
    
    // 검색 결과가 없는 경우 체크
    const isNoResults = resultData?.noResults === true || 
                       (resultData?.searchResults?.noResults === true) ||
                       (resultData?.totalCount === 0) ||
                       (resultData?.searchResults?.totalCount === 0) ||
                       (Array.isArray(resultData?.files) && resultData.files.length === 0) ||
                       (Array.isArray(resultData?.searchResults?.files) && resultData.searchResults.files.length === 0);
    
    let prompt;
    
    if (isNoResults) {
      // 검색 결과가 없을 때의 프롬프트
      prompt = `
사용자가 파일을 검색했는데 결과가 없었어. 아래 정보를 바탕으로 친절하고 도움이 되는 안내 메시지를 만들어줘.
- 너무 격식 없이, 자연스럽고 대화하듯 간단명료하게.
- "고객님", "저는", "AI입니다" 같은 딱딱한 표현은 쓰지 마.
- 실망하지 않도록 격려하면서 대안을 제시해줘.
- 이모지 1-2개 정도 사용해도 좋아.

검색 정보:
${typeof resultData === 'string' ? resultData : JSON.stringify(resultData)}
`;
    } else {
      // 일반적인 결과 요약 프롬프트
      prompt = `
아래 파일 작업 결과를 사용자에게 너무 격식 없이, 자연스럽고 대화하듯 간단명료하게 설명해줘.
- "고객님", "저는", "AI입니다" 같은 딱딱한 표현은 쓰지 마.
- 핵심만 짧고 명확하게, 불필요한 상세 설명은 생략.
- 친근한 존댓말로, 마치 친구에게 말하듯 자연스럽게.
- 예시: "PDF 파일 2개를 찾았어요: ...", "총 3개 파일이 있습니다: ..." 등

파일 작업 결과:
${typeof resultData === 'string' ? resultData : JSON.stringify(resultData)}
`;
    }
    
    const summary = await callClaude(prompt);
    res.json({ summary, isNoResults });
  } catch (e) {
    console.error('Claude summary 오류:', e);
    res.status(500).json({ error: e.message });
  }
});

// 명령 해석(실행 플랜 생성) API
router.post('/plan', async (req, res) => {
  try {
    const { userInput } = req.body;
    console.log('📝 사용자 입력:', userInput);

    // 동적 경로 매핑 정보를 프롬프트에 포함
    const availableFolders = Object.keys(folderAliasMap).join(', ');
    
    // 프롬프트 강화: 다양한 예시, 폴더명/별칭 매핑 안내, 복합 조건, 되묻기 안내
    const prompt = `사용자의 파일 관련 명령을 분석해서 JSON 형식으로 응답해주세요.

사용자 명령: "${userInput}"

중요: targetDirectory는 반드시 아래 폴더 별칭만 사용하세요:
사용 가능한 폴더 별칭: ${availableFolders}

아래 JSON 형식으로만 응답하세요. 다른 설명은 하지 마세요:
{
  "action": "listFiles|searchFiles|createFolder|deleteFiles|moveFiles|copyFiles|invalid",
  "targetDirectory": "다운로드",
  "filters": ["확장자", "키워드", "태그", "날짜", "중복"],
  "description": "수행할 작업 설명"
}

예시 (반드시 별칭만 사용):
- "D드라이브 파일 보여줘" → {"action":"listFiles","targetDirectory":"d","filters":[],"description":"D드라이브의 모든 파일 목록 표시"}
- "문서 폴더에서 PDF 찾아줘" → {"action":"searchFiles","targetDirectory":"문서","filters":["pdf"],"description":"문서 폴더에서 PDF 파일 검색"}
- "다운로드 폴더 vray만" → {"action":"searchFiles","targetDirectory":"다운로드","filters":["vray"],"description":"다운로드 폴더에서 vray 키워드 포함 파일 검색"}
- "오늘 만든 한글문서만" → {"action":"searchFiles","targetDirectory":"문서","filters":["hwp","오늘"],"description":"문서 폴더에서 오늘 만든 한글문서 검색"}
- "중복된 사진만" → {"action":"searchFiles","targetDirectory":"사진","filters":["중복","사진"],"description":"사진 폴더에서 중복된 사진 검색"}

주의사항:
- targetDirectory는 절대 "C:\\Users\\user\\..." 같은 하드코딩된 경로를 사용하지 마세요
- 반드시 위의 폴더 별칭 중 하나만 사용하세요
- 명령이 불명확하면 action을 'invalid'로 하고 되물어보세요

JSON만 응답하세요:`;

    console.log('🔄 Claude에게 전송할 프롬프트:', prompt);
    const planText = await callClaude(prompt);
    console.log('📥 Claude 응답 원본:', planText);

    let plan;
    try {
      // JSON 블록 제거 및 정리
      const cleanedText = planText
        .replace(/^```json\s*/, '')
        .replace(/```\s*$/, '')
        .replace(/^```\s*/, '')
        .trim();
      console.log('🧹 정리된 텍스트:', cleanedText);
      plan = JSON.parse(cleanedText);

      // 폴더명/별칭 매핑 적용 (대소문자 무관, 다양한 변형 처리)
      if (plan.targetDirectory) {
        const normalizedTarget = plan.targetDirectory.toLowerCase().trim();
        
        // 직접 매핑 확인
        if (folderAliasMap[normalizedTarget]) {
          plan.targetDirectory = folderAliasMap[normalizedTarget];
        }
        // 부분 매치 확인 (다운로드, download, downloads 등)
        else {
          for (const [alias, actualPath] of Object.entries(folderAliasMap)) {
            if (normalizedTarget.includes(alias) || alias.includes(normalizedTarget)) {
              plan.targetDirectory = actualPath;
              break;
            }
          }
        }
        
        console.log(`📁 경로 매핑: "${userInput}" → "${plan.targetDirectory}"`);
      }

      // 경로 존재 여부 확인 및 안내
      if (plan.targetDirectory && !fs.existsSync(plan.targetDirectory)) {
        const availablePaths = Object.entries(folderAliasMap)
          .filter(([_, path]) => fs.existsSync(path))
          .map(([alias, path]) => `${alias}: ${path}`)
          .join(', ');
        
        return res.json({
          success: false,
          error: `지정된 경로 '${plan.targetDirectory}'가 존재하지 않습니다.`,
          availablePaths: availablePaths ? `사용 가능한 경로: ${availablePaths}` : '사용 가능한 경로가 없습니다.',
          suggestion: '다른 경로를 지정하거나, 전체 경로를 직접 입력해주세요.'
        });
      }

      // 기본값 설정 (동적 경로 사용)
      plan.action = plan.action || 'listFiles';
      plan.targetDirectory = plan.targetDirectory || homeDir; // 홈 디렉토리를 기본값으로
      plan.filters = plan.filters || [];
      plan.description = plan.description || '파일 작업 수행';

      // plan.action이 searchFiles, listFiles 등일 때만 실제 검색 수행
      if (['searchFiles', 'listFiles'].includes(plan.action)) {
        console.log('🔄 검색 실행 시작:', { action: plan.action, directory: plan.targetDirectory, filters: plan.filters });
        
        try {
          // 간단한 키워드 추출
          let searchKeyword = userInput;
          
          // 필터에서 파일 확장자 추출
          let fileTypes = [];
          const typeKeywords = ['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'png', 'mp4', 'mp3'];
          for (const type of typeKeywords) {
            if (userInput.toLowerCase().includes(type)) {
              fileTypes.push(type);
            }
          }
          
          // 한국어 패턴에서 키워드 추출
          const patterns = [
            /(.+?)(?:이|가|을|를)?\s*(?:포함|포함된|포함하는|들어간|들어있는|담긴|담고있는)\s*(?:파일|폴더|디렉토리)/,
            /(.+?)\s*(?:찾아|검색|보여줘)/,
            /(.+?)\s*(?:파일|폴더)/,
            /(.+?)\s*(?:만|only)/
          ];
          
          let extracted = false;
          for (const pattern of patterns) {
            const match = userInput.match(pattern);
            if (match && match[1]) {
              searchKeyword = match[1].trim();
              extracted = true;
              console.log('📝 패턴 매칭:', match[1]);
              break;
            }
          }
          
          // 패턴 매칭 실패시 불용어 제거
          if (!extracted) {
            searchKeyword = userInput
              .replace(/을|를|이|가|에서|에|찾아|검색|찾기|보여줘|나타내|발견|어디|있나|있지|있어|파일|폴더|디렉토리|만|only/gi, '')
              .trim();
          }
          
          console.log('🎯 최종 검색 키워드:', searchKeyword);
          console.log('📁 검색 경로:', plan.targetDirectory);
          console.log('🏷️ 파일 타입:', fileTypes);
          
          // 직접 searchFiles 사용
          const searchResults = await searchEngine.searchFiles({
            query: searchKeyword,
            options: {
              path: plan.targetDirectory,
              recursive: true,
              caseSensitive: false,
              searchInName: true,
              nameQuery: searchKeyword,
              fileTypes: fileTypes
            }
          });
          
          console.log(`✅ 검색 완료: ${searchResults.length}개 결과`);
          
          // 검색 결과가 없을 때 친절한 안내
          if (searchResults.length === 0) {
            const suggestions = [];
            
            // 검색 제안 생성
            if (searchKeyword) {
              suggestions.push(`"${searchKeyword}"와 비슷한 이름의 파일을 찾아보세요`);
              suggestions.push(`다른 폴더에서 검색해보세요`);
              suggestions.push(`파일 확장자를 함께 검색해보세요 (예: "${searchKeyword} pdf")`);
            }
            
            return res.json({ 
              plan, 
              searchResults: {
                files: [],
                totalCount: 0,
                query: searchKeyword,
                noResults: true,
                message: `"${searchKeyword}"가 포함된 파일을 찾을 수 없습니다.`,
                suggestions: suggestions,
                searchPath: plan.targetDirectory
              }
            });
          }
          
          return res.json({ 
            plan, 
            searchResults: {
              files: searchResults,
              totalCount: searchResults.length,
              query: searchKeyword,
              noResults: false,
              searchPath: plan.targetDirectory
            }
          });
          
        } catch (searchError) {
          console.error('❌ 검색 실행 오류:', searchError);
          return res.json({ 
            plan, 
            searchResults: { files: [], error: searchError.message },
            error: '검색 중 오류가 발생했습니다: ' + searchError.message
          });
        }
      }
      // invalid 등은 안내만 반환
      if (plan.action === 'invalid') {
        return res.json({ plan, followUp: plan.description || '어떤 폴더에서 어떤 파일을 찾으시나요?' });
      }

      console.log('✅ 파싱 성공:', plan);
    } catch (parseError) {
      console.error('❌ Claude 응답 파싱 오류:', parseError.message);
      console.error('원본 응답:', planText);
      // 파싱 실패 시 기본 플랜 제공
      plan = {
        action: 'invalid',
        targetDirectory: '',
        filters: [],
        description: `명령을 이해하지 못했습니다. 예시: "문서 폴더에서 PDF만 보여줘"`
      };
      return res.json({
        plan,
        followUp: plan.description
      });
    }
    res.json({ plan });
  } catch (e) {
    console.error('❌ Claude plan API 전체 오류:', e);
    res.status(500).json({ 
      error: e.message,
      plan: {
        action: 'invalid',
        targetDirectory: '',
        filters: [],
        description: '명령을 이해하지 못했습니다. 예시: "문서 폴더에서 PDF만 보여줘"'
      },
      followUp: '어떤 폴더에서 어떤 파일을 찾으시나요? 예시: "문서 폴더에서 PDF만 보여줘"'
    });
  }
});

// 이름 포함 검색 API (간단한 버전)
router.post('/name-search', async (req, res) => {
  try {
    const { userInput, searchPath = homeDir } = req.body;
    console.log('🔍 이름 포함 검색 요청:', userInput, 'in', searchPath);

    // 간단한 키워드 추출 (복잡한 NLP 대신)
    let searchKeyword = userInput;
    
    // 한국어 패턴에서 키워드 추출
    const koreanPatterns = [
      /(.+?)(?:이|가|을|를)?\s*(?:포함|포함된|포함하는|들어간|들어있는|담긴|담고있는)\s*(?:파일|폴더|디렉토리)/,
      /(?:이름|제목|파일명|폴더명)(?:이|에|에서)?\s*(.+?)(?:이|가|을|를)?\s*(?:포함|들어간|있는)/,
      /(.+?)(?:이|가|을|를)?\s*(?:이름|제목|파일명|폴더명)(?:에|으로)?\s*(?:포함|들어간|있는)/,
      /(.+?)\s*(?:찾아|검색|보여줘)/,
      /(.+?)\s*(?:파일|폴더)/
    ];
    
    // 영어 패턴
    const englishPatterns = [
      /(?:files?|folders?|directories)\s*(?:with|containing|including|named|called)\s*(.+)/i,
      /(?:containing|including|with|named)\s*(.+)/i,
      /find.*?(.+)/i
    ];
    
    let extracted = false;
    
    // 한국어 패턴 시도
    for (const pattern of koreanPatterns) {
      const match = userInput.match(pattern);
      if (match && match[1]) {
        searchKeyword = match[1].trim();
        extracted = true;
        console.log('📝 한국어 패턴 매칭:', match[1]);
        break;
      }
    }
    
    // 영어 패턴 시도
    if (!extracted) {
      for (const pattern of englishPatterns) {
        const match = userInput.match(pattern);
        if (match && match[1]) {
          searchKeyword = match[1].trim();
          extracted = true;
          console.log('📝 영어 패턴 매칭:', match[1]);
          break;
        }
      }
    }
    
    // 패턴 매칭 실패시 불용어 제거
    if (!extracted) {
      searchKeyword = userInput
        .replace(/을|를|이|가|에서|에|찾아|검색|찾기|보여줘|나타내|발견|어디|있나|있지|있어|find|search|locate|show|display|파일|폴더|디렉토리|file|folder|directory/gi, '')
        .trim();
    }
    
    console.log('🎯 최종 검색 키워드:', searchKeyword);

    // 검색 실행
    const searchResults = await searchEngine.searchFiles({
      query: searchKeyword,
      options: {
        path: searchPath,
        recursive: true,
        caseSensitive: false,
        searchInName: true,
        nameQuery: searchKeyword
      }
    });

    console.log(`✅ 검색 완료: ${searchResults.length}개 결과`);

    // 검색 결과가 없을 때 친절한 안내
    if (searchResults.length === 0) {
      const suggestions = [];
      
      // 맞춤형 검색 제안 생성
      if (searchKeyword) {
        suggestions.push(`"${searchKeyword}"의 철자를 확인해보세요`);
        suggestions.push(`다른 키워드로 검색해보세요`);
        suggestions.push(`전체 이름이 아닌 일부만 입력해보세요`);
        suggestions.push(`다른 폴더에서 검색해보세요`);
        
        // 파일 확장자 제안
        const commonExtensions = ['pdf', 'doc', 'txt', 'jpg', 'png', 'mp4', 'zip'];
        const hasExtension = commonExtensions.some(ext => searchKeyword.toLowerCase().includes(ext));
        if (!hasExtension) {
          suggestions.push(`파일 확장자를 함께 검색해보세요 (예: "${searchKeyword} pdf")`);
        }
      }
      
      return res.json({
        success: true,
        query: userInput,
        nameQuery: searchKeyword,
        results: [],
        totalCount: 0,
        noResults: true,
        message: `😔 "${searchKeyword}"가 포함된 파일을 찾을 수 없습니다.`,
        suggestions: suggestions,
        searchPath: searchPath,
        tip: "💡 검색 팁: 파일명의 일부만 입력하거나 다른 키워드를 시도해보세요!"
      });
    }

    res.json({
      success: true,
      query: userInput,
      nameQuery: searchKeyword,
      results: searchResults,
      totalCount: searchResults.length,
      noResults: false,
      searchPath: searchPath
    });

  } catch (error) {
    console.error('❌ 이름 포함 검색 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      query: req.body.userInput || ''
    });
  }
});

export default router;
