import express from 'express';
import * as fs from 'fs/promises';
import path from 'path';
import { organizeByExtension } from '../tools/smart_organize/organizeByExtension.js';
import { organizeByDate } from '../tools/smart_organize/organizeByDate.js';
import { organizeByDuplicate } from '../tools/smart_organize/organizeByDuplicate.js';
import { organizeByTemp } from '../tools/smart_organize/organizeByTemp.js';
import { organizeBySize } from '../tools/smart_organize/organizeBySize.js';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
// 루트 디렉토리에서 .env 파일 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');
dotenv.config({ path: join(rootDir, '.env') });

const router = express.Router();

// Anthropic 클라이언트 초기화
let anthropic = null;

function getAnthropicClient() {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    console.log('🔧 Anthropic 클라이언트 초기화');
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

// 확장자별 정리 엔드포인트
router.post('/extension', async (req, res) => {
  const { targetPath, includeSubfolders = false } = req.body;
  console.log('🔧 확장자별 정리 요청:', { targetPath, includeSubfolders });
  
  if (!targetPath) {
    return res.status(400).json({ success: false, error: 'targetPath is required' });
  }
  try {
    await organizeByExtension(targetPath, { recursive: includeSubfolders });
    console.log('✅ 확장자별 정리 완료:', { targetPath, includeSubfolders });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ 확장자별 정리 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 날짜별 정리 엔드포인트
router.post('/date', async (req, res) => {
  const { targetPath, includeSubfolders = false } = req.body;
  console.log('🔧 날짜별 정리 요청:', { targetPath, includeSubfolders });
  
  if (!targetPath) {
    return res.status(400).json({ success: false, error: 'targetPath is required' });
  }
  try {
    await organizeByDate(targetPath, { recursive: includeSubfolders });
    console.log('✅ 날짜별 정리 완료:', { targetPath, includeSubfolders });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ 날짜별 정리 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 중복 파일 정리 엔드포인트
router.post('/duplicate', async (req, res) => {
  const { targetPath, includeSubfolders = false } = req.body;
  console.log('🔧 중복 파일 정리 요청:', { targetPath, includeSubfolders });
  
  if (!targetPath) {
    return res.status(400).json({ success: false, error: 'targetPath is required' });
  }
  try {
    await organizeByDuplicate(targetPath, { recursive: includeSubfolders });
    console.log('✅ 중복 파일 정리 완료:', { targetPath, includeSubfolders });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ 중복 파일 정리 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 임시파일 정리 엔드포인트
router.post('/temp', async (req, res) => {
  const { targetPath, includeSubfolders = false } = req.body;
  console.log('🔧 임시파일 정리 요청:', { targetPath, includeSubfolders });
  if (!targetPath) {
    return res.status(400).json({ success: false, error: 'targetPath is required' });
  }
  try {
    await organizeByTemp(targetPath, { recursive: includeSubfolders });
    console.log('✅ 임시파일 정리 완료:', { targetPath, includeSubfolders });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ 임시파일 정리 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 대용량 파일 정리 엔드포인트
router.post('/size', async (req, res) => {
  const { targetPath, includeSubfolders = false, sizeThreshold } = req.body;
  console.log('🔧 대용량 파일 정리 요청:', { targetPath, includeSubfolders, sizeThreshold });
  if (!targetPath) {
    return res.status(400).json({ success: false, error: 'targetPath is required' });
  }
  try {
    await organizeBySize(targetPath, { recursive: includeSubfolders, sizeThreshold });
    console.log('✅ 대용량 파일 정리 완료:', { targetPath, includeSubfolders, sizeThreshold });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ 대용량 파일 정리 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI 추천 기반 정리 엔드포인트
router.post('/ai', async (req, res) => {
  const { targetPath, includeSubfolders = false, userRequest } = req.body;
  console.log('🤖 AI 추천 정리 요청:', { targetPath, includeSubfolders, userRequest });

  if (!targetPath || !userRequest) {
    console.log('❌ 필수 파라미터 누락:', { targetPath: !!targetPath, userRequest: !!userRequest });
    return res.status(400).json({ success: false, error: 'targetPath와 userRequest가 필요합니다.' });
  }
  try {
    // 1. 파일 목록 수집 (하위 폴더 포함 옵션 지원)
    console.log('📁 파일 목록 수집 시작...');
    const fileList = await getAllFilesWithMeta(targetPath, includeSubfolders);
    console.log('📁 파일 목록 수집 완료:', { count: fileList.length, files: fileList.slice(0, 3).map(f => f.name) });
    
    if (!fileList || fileList.length === 0) {
      console.log('❌ 정리할 파일이 없음');
      throw new Error('정리할 파일이 없습니다.');
    }

    // 2. AI 프롬프트 생성
    console.log('🧠 AI 프롬프트 생성 시작...');
    const prompt = buildAIPrompt(userRequest, fileList);
    console.log('🧠 AI 프롬프트 생성 완료:', { promptLength: prompt.length, promptPreview: prompt.substring(0, 200) + '...' });

    // 3. AI API 호출
    console.log('🚀 AI API 호출 시작...');
    const aiResult = await callAISmartOrganizePrompt(prompt);
    console.log('🚀 AI API 호출 완료:', { aiResultType: typeof aiResult, aiResult: aiResult });
    
    if (!aiResult || !Array.isArray(aiResult.actions)) {
      console.log('❌ AI 응답이 올바르지 않음:', { aiResult });
      throw new Error('AI가 올바른 정리안을 반환하지 않았습니다.');
    }

    // 4. 액션 검증
    console.log('✅ 액션 검증 시작...');
    const filePathSet = new Set(fileList.map(f => f.path));
    const validActions = aiResult.actions.filter(act => validateAction(act, filePathSet, targetPath));
    console.log('✅ 액션 검증 완료:', { total: aiResult.actions.length, valid: validActions.length });

    if (validActions.length === 0) {
      console.log('❌ 유효한 액션이 없음');
      throw new Error('실행할 수 있는 유효한 정리 작업이 없습니다.');
    }

    // 5. 액션 실행 전에 경로 보정 (AI 추천 기반 정리)
    for (const action of validActions) {
      if (action.src && !path.isAbsolute(action.src)) {
        action.src = path.join(targetPath, action.src);
      }
      if (action.dest && !path.isAbsolute(action.dest)) {
        action.dest = path.join(targetPath, action.dest);
      }
      if (action.newName && action.type === 'rename') {
        // newName은 파일명만 들어오므로 dest는 따로 처리하지 않음
      }
    }
    // 5. 액션 실행
    console.log('⚡ 액션 실행 시작...');
    const results = [];
    for (const action of validActions) {
      try {
        console.log('⚡ 액션 실행 중:', action);
        if (action.type === 'move') {
          // dest가 폴더만 있으면 파일명을 자동으로 붙임
          let finalDest = action.dest;
          if (finalDest.endsWith('/') || finalDest.endsWith('\\')) {
            finalDest = path.join(finalDest, path.basename(action.src));
          }
          await fs.mkdir(path.dirname(finalDest), { recursive: true });
          await fs.rename(action.src, finalDest);
          results.push({ type: 'move', src: action.src, dest: finalDest, success: true });
        } else if (action.type === 'copy') {
          // dest가 폴더만 있으면 파일명을 자동으로 붙임
          let finalDest = action.dest;
          if (finalDest.endsWith('/') || finalDest.endsWith('\\')) {
            finalDest = path.join(finalDest, path.basename(action.src));
          }
          await fs.mkdir(path.dirname(finalDest), { recursive: true });
          await fs.copyFile(action.src, finalDest);
          results.push({ type: 'copy', src: action.src, dest: finalDest, success: true });
        } else if (action.type === 'rename') {
          const dir = path.dirname(action.src);
          const newPath = path.join(dir, action.newName);
          await fs.rename(action.src, newPath);
          results.push({ type: 'rename', src: action.src, newName: action.newName, success: true });
        } else if (action.type === 'write') {
          await fs.mkdir(path.dirname(action.dest), { recursive: true });
          await fs.writeFile(action.dest, action.content || '');
          results.push({ type: 'write', dest: action.dest, success: true });
        } else if (action.type === 'modify') {
          await fs.writeFile(action.src, action.content || '');
          results.push({ type: 'modify', src: action.src, success: true });
        } else if (action.type === 'analyze') {
          // 분석 로직(예: 요약, 메타데이터 추출 등) - 필요시 구현
          results.push({ type: 'analyze', src: action.src, success: true, info: '분석 기능은 추후 확장' });
        } else if (action.type === 'mkdir') {
          await fs.mkdir(action.dest, { recursive: true });
          results.push({ type: 'mkdir', dest: action.dest, success: true });
        } else {
          results.push({ type: action.type, src: action.src, success: false, error: '지원하지 않는 타입' });
        }
        console.log('✅ 액션 실행 성공:', action);
      } catch (e) {
        console.log('❌ 액션 실행 실패:', { action, error: e.message });
        results.push({ type: action.type, src: action.src, success: false, error: e.message });
      }
    }
    console.log('⚡ 액션 실행 완료:', { results });

    // 6. 응답 반환
    const successCount = results.filter(r => r.success).length;
    console.log('🎉 AI 추천 정리 완료:', { total: results.length, success: successCount });
    res.json({ 
      success: true, 
      results,
      summary: `총 ${results.length}개 작업 중 ${successCount}개 성공`
    });

  } catch (error) {
    console.log('❌ AI 추천 정리 실패:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI 프롬프트 생성 함수
function buildAIPrompt(userRequest, fileList) {
  const fileListSample = fileList.slice(0, 30).map(f => `- ${f.name} (${f.ext}, ${f.size} bytes, ${f.mtime.toISOString()})`).join('\n');
  const more = fileList.length > 30 ? `\n...외 ${fileList.length - 30}개 파일` : '';
  
  return `당신은 파일 정리 전문가입니다. 사용자의 요청을 분석하여 가장 적절한 방법으로 파일을 정리하세요.

🚫 절대 금지사항:
1. JSON 외의 모든 텍스트 금지 (설명, 안내, 사과, 인사, 코드블록, 주석, 추가 텍스트)
2. "죄송합니다", "안내:", "참고:", "주의:" 등 모든 안내문 금지
3. JSON 앞뒤에 아무것도 붙이지 마세요
4. 정리할 파일이 없어도 반드시 { "actions": [] }만 반환
5. delete 액션은 절대 사용하지 마세요 (파일 삭제 금지)

✅ 반드시 지켜야 할 것:
1. JSON만 반환: { "actions": [...] }
2. 정리할 파일이 없으면: { "actions": [] }
3. JSON 뒤에 아무것도 붙이지 마세요
4. move/copy의 dest는 반드시 "폴더경로/파일명" 형태로 지정

🧠 당신의 판단 기준:
- 파일 확장자, 이름, 크기, 날짜를 종합적으로 분석
- 사용자 요청의 의도를 파악하여 최적의 정리 방법 선택
- 직관적이고 체계적인 폴더 구조 제안
- 파일명의 의미를 고려한 적절한 이름 변경
- 중복, 버전, 임시 파일 등을 식별하여 처리

[지원 액션 타입]
- move: 파일 이동 (src, dest 필수) - dest는 "폴더/파일명" 형태
- copy: 파일 복사 (src, dest 필수) - dest는 "폴더/파일명" 형태
- rename: 파일 이름 변경 (src, newName 필수)
- mkdir: 폴더 생성 (dest 필수)

[사용자 요청]
${userRequest}

[파일 목록]
${fileListSample}${more}

위 파일들을 분석하여 사용자 요청에 가장 적합한 방법으로 정리하는 actions 배열만 JSON으로 반환하세요.
당신의 전문성을 발휘하여 최적의 정리 방안을 제시해주세요.`;
}

// AI API 호출 함수 (Claude 직접 호출)
async function callAISmartOrganizePrompt(prompt) {
  console.log('🔍 callAISmartOrganizePrompt 시작...');
  try {
    const anthropicClient = getAnthropicClient();
    if (!anthropicClient) {
      throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
    }
    
    const systemPrompt = '너는 파일 정리 전문가야. 반드시 JSON(actions)만 반환해.';
    console.log('🔍 Anthropic API 호출 시작...');
    
    const message = await anthropicClient.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    let result = message.content[0].text;
    console.log('🔍 Anthropic API 호출 완료:', { resultType: typeof result, result: result });
    
    // === JSON 후처리: 정규식으로 JSON만 추출 ===
    const jsonMatch = result.match(/{[\s\S]*}/);
    if (jsonMatch) {
      result = jsonMatch[0];
    }
    // AI 응답에서 JSON 파싱 시도
    let parsedResult;
    if (typeof result === 'string') {
      console.log('🔍 문자열 응답을 JSON으로 파싱 시도...');
      try {
        parsedResult = JSON.parse(result);
        console.log('🔍 JSON 파싱 성공:', parsedResult);
      } catch (parseError) {
        console.log('❌ JSON 파싱 실패:', parseError.message);
        console.log('🔍 원본 응답:', result);
        throw new Error('AI 응답을 JSON으로 파싱할 수 없습니다: ' + parseError.message);
      }
    } else {
      console.log('🔍 객체 응답 사용:', result);
      parsedResult = result;
    }
    
    console.log('🔍 callAISmartOrganizePrompt 완료:', parsedResult);
    return parsedResult;
  } catch (error) {
    console.log('❌ callAISmartOrganizePrompt 실패:', error.message);
    throw error;
  }
}

// AI 응답 검증/포맷터
function validateAIOrganizeActions(aiResult, fileList) {
  if (!aiResult || !Array.isArray(aiResult.actions)) return [];
  // 실제 파일 경로만 허용
  const filePathSet = new Set(fileList.map(f => f.path));
  return aiResult.actions.filter(act => {
    if (!act || typeof act.type !== 'string') return false;
    if (act.type === 'move' || act.type === 'copy') {
      if (!act.src || !act.dest) return false;
      if (!filePathSet.has(act.src)) return false;
      if (typeof act.dest !== 'string' || act.dest.length < 3) return false;
      return true;
    } else if (act.type === 'delete' || act.type === 'analyze' || act.type === 'modify') {
      if (!act.src) return false;
      if (!filePathSet.has(act.src)) return false;
      if (act.type === 'modify' && typeof act.content !== 'string') return false;
      return true;
    } else if (act.type === 'write') {
      if (!act.dest || typeof act.content !== 'string') return false;
      if (typeof act.dest !== 'string' || act.dest.length < 3) return false;
      return true;
    } else if (act.type === 'rename') {
      if (!act.src || typeof act.newName !== 'string') return false;
      if (!filePathSet.has(act.src)) return false;
      if (typeof act.newName !== 'string' || act.newName.length < 1) return false;
      return true;
    }
    return false;
  });
}

// 폴더 및 파일 정리 액션 검증 함수 (최고급)
function validateAction(act, filePathSet, targetPath) {
  if (!act || typeof act.type !== 'string') return false;
  // src/dest를 절대경로로 변환
  const absSrc = act.src && !path.isAbsolute(act.src) ? path.join(targetPath, act.src) : act.src;
  const absDest = act.dest && !path.isAbsolute(act.dest) ? path.join(targetPath, act.dest) : act.dest;

  if (act.type === 'move' || act.type === 'copy') {
    if (!absSrc || !absDest) return false;
    if (!filePathSet.has(absSrc)) {
      try {
        const files = require('fs').readdirSync(targetPath);
        console.warn('❌ 파일 없음:', absSrc, '\n폴더 내 실제 파일:', files);
      } catch (e) {
        console.warn('❌ 파일 없음:', absSrc, '(폴더 목록 조회 실패)');
      }
      return false;
    }
    if (typeof absDest !== 'string' || absDest.length < 3) return false;
    return true;
  } else if (act.type === 'analyze' || act.type === 'modify') {
    if (!absSrc) return false;
    if (!filePathSet.has(absSrc)) {
      try {
        const files = require('fs').readdirSync(targetPath);
        console.warn('❌ 파일 없음:', absSrc, '\n폴더 내 실제 파일:', files);
      } catch (e) {
        console.warn('❌ 파일 없음:', absSrc, '(폴더 목록 조회 실패)');
      }
      return false;
    }
    if (act.type === 'modify' && typeof act.content !== 'string') return false;
    return true;
  } else if (act.type === 'write') {
    if (!absDest || typeof act.content !== 'string') return false;
    if (typeof absDest !== 'string' || absDest.length < 3) return false;
    return true;
  } else if (act.type === 'rename') {
    if (!absSrc || typeof act.newName !== 'string') return false;
    if (!filePathSet.has(absSrc)) {
      try {
        const files = require('fs').readdirSync(targetPath);
        console.warn('❌ 파일 없음:', absSrc, '\n폴더 내 실제 파일:', files);
      } catch (e) {
        console.warn('❌ 파일 없음:', absSrc, '(폴더 목록 조회 실패)');
      }
      return false;
    }
    if (typeof act.newName !== 'string' || act.newName.length < 1) return false;
    return true;
  } else if (act.type === 'mkdir') {
    if (!absDest || typeof absDest !== 'string' || absDest.length < 3) return false;
    return true;
  }
  return false;
}

// 파일 목록+메타데이터 수집 함수 (재귀/비재귀)
async function getAllFilesWithMeta(dir, recursive = false) {
  let files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        files = files.concat(await getAllFilesWithMeta(fullPath, true));
      }
    } else {
      const stat = await fs.stat(fullPath);
      files.push({
        path: fullPath,
        name: entry.name,
        size: stat.size,
        mtime: stat.mtime,
        ctime: stat.ctime,
        ext: path.extname(entry.name)
      });
    }
  }
  return files;
}

// 정리안(actions) 실제 실행 함수 (모든 액션 지원)
async function executeOrganizeActions(actions) {
  for (const act of actions) {
    try {
      if (act.type === 'move') {
        // dest가 폴더만 있으면 파일명을 자동으로 붙임
        let finalDest = act.dest;
        if (finalDest.endsWith('/') || finalDest.endsWith('\\')) {
          finalDest = path.join(finalDest, path.basename(act.src));
        }
        await fs.mkdir(path.dirname(finalDest), { recursive: true });
        await fs.rename(act.src, finalDest);
      } else if (act.type === 'copy') {
        // dest가 폴더만 있으면 파일명을 자동으로 붙임
        let finalDest = act.dest;
        if (finalDest.endsWith('/') || finalDest.endsWith('\\')) {
          finalDest = path.join(finalDest, path.basename(act.src));
        }
        await fs.mkdir(path.dirname(finalDest), { recursive: true });
        await fs.copyFile(act.src, finalDest);
      } else if (act.type === 'write') {
        await fs.mkdir(path.dirname(act.dest), { recursive: true });
        await fs.writeFile(act.dest, act.content || '');
      } else if (act.type === 'modify') {
        await fs.writeFile(act.src, act.content || '');
      } else if (act.type === 'analyze') {
        // 분석 로직(예: 요약, 메타데이터 추출 등) - 필요시 구현
        // 예시: const stat = await fs.stat(act.src);
        //       console.log('분석:', act.src, stat);
      } else if (act.type === 'rename') {
        // 파일/폴더 이름 변경
        const srcPath = act.src;
        const dir = path.dirname(srcPath);
        const newPath = path.join(dir, act.newName);
        await fs.rename(srcPath, newPath);
      }
    } catch (e) {
      console.error(`❌ 액션 실행 오류:`, act, e);
      // 개별 액션 실패는 전체 실패로 간주하지 않음
    }
  }
}

// [테스트용] AI 없이 actions 배열만 받아 실제 정리 로직만 실행하는 엔드포인트
router.post('/test-actions', async (req, res) => {
  const { actions } = req.body;
  if (!Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({ success: false, error: 'actions 배열이 필요합니다.' });
  }
  try {
    // 기존 액션 실행 로직 재사용
    const fileList = [];
    const filePathSet = new Set();
    // actions의 src 경로만 filePathSet에 추가 (검증용)
    for (const act of actions) {
      if (act.src) filePathSet.add(act.src);
    }
    // 액션 검증 및 실행 (AI 없이)
    const results = [];
    for (const action of actions) {
      try {
        if (action.type === 'move') {
          // dest가 폴더만 있으면 파일명을 자동으로 붙임
          let finalDest = action.dest;
          if (finalDest.endsWith('/') || finalDest.endsWith('\\')) {
            finalDest = path.join(finalDest, path.basename(action.src));
          }
          await fs.rename(action.src, finalDest);
          results.push({ type: 'move', src: action.src, dest: finalDest, success: true });
        } else if (action.type === 'copy') {
          // dest가 폴더만 있으면 파일명을 자동으로 붙임
          let finalDest = action.dest;
          if (finalDest.endsWith('/') || finalDest.endsWith('\\')) {
            finalDest = path.join(finalDest, path.basename(action.src));
          }
          await fs.copyFile(action.src, finalDest);
          results.push({ type: 'copy', src: action.src, dest: finalDest, success: true });
        } else if (action.type === 'rename') {
          const dir = path.dirname(action.src);
          const newPath = path.join(dir, action.newName);
          await fs.rename(action.src, newPath);
          results.push({ type: 'rename', src: action.src, newName: action.newName, success: true });
        } else {
          results.push({ type: action.type, src: action.src, success: false, error: '지원하지 않는 타입' });
        }
      } catch (e) {
        results.push({ type: action.type, src: action.src, success: false, error: e.message });
      }
    }
    res.json({ success: true, results });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router; 