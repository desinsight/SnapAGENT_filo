/**
 * AI Direct Chat API - Tool Calling 방식
 * 외부 AI API(Claude/GPT)를 직접 호출하고 Tool Calling을 처리
 */

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getSubscriptionService } from '../services/subscriptionService.js';
import { getToolSchemaRegistry } from '../middleware/toolSchemaRegistry.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// AI 클라이언트를 동적으로 초기화하는 함수들
let anthropic = null;
let openai = null;

function getAnthropicClient() {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    console.log('🔧 Anthropic 클라이언트 동적 초기화');
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    console.log('🔧 OpenAI 클라이언트 동적 초기화');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Tool Schema Registry 인스턴스 (초기화됨)
let toolSchemaRegistry = null;

// ToolOrchestrator 연결
let toolOrchestrator = null;
const toolOrchestratorPath = path.resolve(__dirname, '../../../ai/core/AIOrchestrator.js');
const toolOrchestratorUrl = `file://${toolOrchestratorPath.replace(/\\/g, '/')}`;

// ToolSchemaRegistry 초기화 함수
async function initializeToolSchemaRegistry() {
  if (!toolSchemaRegistry) {
    console.log('🔧 ToolSchemaRegistry 초기화 중...');
    toolSchemaRegistry = getToolSchemaRegistry();
    
    // ToolOrchestrator에서 도구들을 가져와서 등록
    try {
      await initializeToolOrchestrator();
      if (toolOrchestrator) {
        const tools = await toolOrchestrator.getAvailableTools();
        console.log(`🔧 ToolOrchestrator에서 ${tools.length}개 도구 발견`);
        
        // 각 도구를 ToolSchemaRegistry에 등록 (Claude API 형식)
        for (const tool of tools) {
          const success = toolSchemaRegistry.registerToolSchema(tool.name, {
            name: tool.name,
            description: tool.description,
            input_schema: tool.input_schema || {
              type: 'object',
              properties: {},
              required: []
            }
          });
          console.log(`🔧 도구 등록 ${tool.name}: ${success ? '성공' : '실패'}`);
        }
        console.log(`✅ ${tools.length}개 도구가 ToolSchemaRegistry에 등록됨`);
      }
    } catch (error) {
      console.error('❌ ToolOrchestrator 도구 등록 실패:', error);
    }
    
    console.log('✅ ToolSchemaRegistry 초기화 완료');
  }
  return toolSchemaRegistry;
}

// ToolOrchestrator 초기화 함수
async function initializeToolOrchestrator() {
  if (!toolOrchestrator) {
    try {
      console.log('🔧 ToolOrchestrator 초기화 중...');
      const { ToolOrchestrator } = await import(toolOrchestratorUrl);
      toolOrchestrator = new ToolOrchestrator();
      await toolOrchestrator.initialize();
      console.log('✅ ToolOrchestrator 초기화 완료');
    } catch (error) {
      console.error('❌ ToolOrchestrator 초기화 실패:', error);
      throw error;
    }
  }
  return toolOrchestrator;
}

/**
 * 사용자별 구독된 도구 목록 가져오기
 */
async function getSubscribedTools(userId) {
  try {
    // 타임아웃 설정 (10초)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getSubscribedTools timeout')), 10000)
    );
    
    const mainPromise = async () => {
      const subscriptionService = await getSubscriptionService();
      const registry = await initializeToolSchemaRegistry();
      const allTools = registry.getAllTools();
      
      console.log(`🔍 도구 개수: ${allTools.length}`);
      
      // 개발 모드에서는 구독 체크 우회
      if (process.env.BYPASS_SUBSCRIPTION === 'true') {
        console.log('🚫 구독 체크 우회 - 모든 도구 허용');
        return allTools.map(toolSchema => ({
          name: toolSchema.name,
          description: toolSchema.description,
          input_schema: toolSchema.input_schema
        }));
      }
      
      const subscribedTools = [];
      
      // 병렬 처리로 성능 개선
      const subscriptionChecks = await Promise.allSettled(
        allTools.map(async (toolSchema) => {
          try {
            const isSubscribed = await Promise.race([
              subscriptionService.checkUserSubscription(userId, toolSchema.name),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Subscription check timeout')), 3000))
            ]);
            
            return { toolName: toolSchema.name, toolSchema, isSubscribed };
          } catch (error) {
            console.warn(`⚠️ 구독 체크 실패 (${toolSchema.name}):`, error.message);
            return { toolName: toolSchema.name, toolSchema, isSubscribed: true }; // 실패시 기본 허용
          }
        })
      );
      
      subscriptionChecks.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.isSubscribed) {
          const { toolName, toolSchema } = result.value;
          subscribedTools.push({
            name: toolName,
            description: toolSchema.description,
            input_schema: toolSchema.input_schema
          });
        }
      });
      
      return subscribedTools;
    };
    
    const subscribedTools = await Promise.race([mainPromise(), timeoutPromise]);
    console.log(`✅ 구독된 도구 수: ${subscribedTools.length}`);
    return subscribedTools;
    
  } catch (error) {
    console.error('❌ getSubscribedTools 오류:', error.message);
    // 에러 발생시 기본 도구들만 반환
    return [{
      name: 'filesystem',
      description: '파일 시스템 관리 도구 (기본)',
      input_schema: { type: 'object', properties: { action: { type: 'string' }}}
    }];
  }
}

/**
 * POST /api/ai/chat-direct
 * AI와 직접 대화 (Tool Calling 지원)
 */
router.post('/chat-direct', async (req, res) => {
  try {
    console.log('🔍 [DETAIL] 전체 req.body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 [DETAIL] Content-Type:', req.headers['content-type']);
    console.log('🔍 [DETAIL] req.body 타입:', typeof req.body);
    
    const { message, provider = 'claude', conversationHistory = [] } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    // content가 없는 메시지 필터링
    const filteredHistory = Array.isArray(conversationHistory)
      ? conversationHistory.filter(msg => msg && typeof msg.content === 'string' && msg.content.trim() !== '')
      : [];
    
    console.log('🔍 [DETAIL] 추출된 값들:');
    console.log('  - message:', JSON.stringify(message));
    console.log('  - provider:', JSON.stringify(provider));
    console.log('  - conversationHistory:', JSON.stringify(filteredHistory));
    
    if (!message || !message.trim()) {
      console.log('❌ [DETAIL] 메시지 검증 실패 - message:', JSON.stringify(message));
      return res.status(400).json({
        success: false,
        error: '메시지가 필요합니다',
        debug: {
          receivedBody: req.body,
          messageValue: message,
          messageType: typeof message
        }
      });
    }
    
    console.log(`🤖 AI Direct Chat: ${provider} - "${message}"`);
    
    // 사용자별 구독된 도구 목록 가져오기
    const subscribedTools = await getSubscribedTools(userId);
    console.log(`📋 구독된 도구 수: ${subscribedTools.length}`);
    
    // 토큰 초과 재시도용 함수
    async function tryAIRequestWithHistory(historySlice) {
      let response;
      if (provider === 'claude') {
        const anthropicClient = getAnthropicClient();
        if (!anthropicClient) throw new Error('Claude API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
        const systemPrompt = `당신은 세계 최고 수준의 AI 어시스턴트입니다. 사용자의 모든 요청에 대해 다음과 같은 원칙을 철저히 지켜 응답하세요:

## 🧠 **핵심 역량 및 원칙**

### **1. 정확성과 신뢰성 (Accuracy & Reliability)**
- 모든 정보는 최신이고 정확해야 합니다
- 불확실한 정보는 "확인 필요"라고 명시하세요
- 수치나 날짜는 정확하게 제공하세요
- 오류 가능성이 있는 내용은 신중하게 표현하세요

### **2. 맥락 이해와 지능적 판단 (Context Understanding)**
- 사용자의 의도를 정확히 파악하세요
- 이전 대화 맥락을 고려하세요
- 암묵적 의미까지 이해하고 응답하세요
- 사용자의 수준과 배경을 고려한 맞춤형 답변을 제공하세요

### **3. 실용성과 실행 가능성 (Practicality & Actionability)**
- 구체적이고 실행 가능한 조언을 제공하세요
- 단계별 가이드와 예시를 포함하세요
- 실제 적용 가능한 솔루션을 제시하세요
- 위험 요소나 주의사항을 미리 안내하세요

### **4. 창의성과 혁신성 (Creativity & Innovation)**
- 기존 방법 외에 새로운 관점을 제시하세요
- 효율적이고 혁신적인 해결책을 제안하세요
- 사용자의 창의적 사고를 자극하는 아이디어를 제공하세요
- 예상치 못한 유용한 정보를 추가로 제공하세요

## 🎯 **응답 품질 기준**

### **1. 구조화된 정보 제공**
응답 구조:
- ### 📋 핵심 요약: 2-3줄로 핵심 내용 요약
- ### 🔍 상세 분석: 구체적인 설명과 분석
- ### 💡 실용적 조언: 실행 가능한 구체적 방법
- ### ⚠️ 주의사항: 잠재적 위험이나 고려사항
- ### 🚀 다음 단계: 추가 액션 아이템 2-3개

### **2. 전문성과 깊이**
- 표면적 답변을 피하고 깊이 있는 분석 제공
- 업계 모범 사례와 최신 트렌드 반영
- 다양한 관점과 대안 제시
- 전문 용어는 쉬운 설명과 함께 제공

### **3. 개인화된 경험**
- 사용자의 상황과 목표에 맞춘 맞춤형 답변
- 사용자의 수준에 적합한 설명 제공
- 개인적 경험과 선호도를 고려한 제안
- 지속적인 학습과 개선을 위한 피드백 제공

## 🛠️ **도구 사용 전략**

### **도구 사용하지 않는 경우 (직접 응답):**
- 일반적인 질문, 농담, 잡담
- 지식 기반 질문 (역사, 과학, 문화, 철학 등)
- 창작 요청 (시, 글, 이야기, 시나리오 등)
- 감정적 대화, 위로, 격려, 상담
- 추상적인 질문이나 토론
- 개인적 조언이나 라이프스타일 제안
- 학습, 교육, 설명 요청
- 분석, 리뷰, 평가 요청

### **도구 사용하는 경우 (실제 작업):**
- 파일 시스템 작업 (파일 조회, 정리, 이동, 삭제, 분석, 백업)
- 일정 관리 (일정 추가, 수정, 확인, 알림 설정)
- 연락처 관리 (연락처 추가, 검색, 수정, 그룹 관리)
- 메시지 전송 (실제 SMS/이메일 발송, 예약)
- 노트 작성 및 관리 (노트 생성, 편집, 태그, 검색)
- 할 일 목록 관리 (작업 추가, 우선순위, 완료 체크)

### **중요한 판단 기준:**
1. **실제 시스템 조작이 필요한가?** → 도구 사용
2. **정보 제공이나 창작이 필요한가?** → 직접 응답
3. **사용자가 구체적인 작업을 요청했는가?** → 도구 사용
4. **일반적인 대화나 질문인가?** → 직접 응답

## 🎨 **응답 스타일 가이드**

### **1. 친근하면서도 전문적인 톤**
- 따뜻하고 격려하는 말투 사용
- 전문성과 신뢰감을 동시에 전달
- 사용자의 시도를 인정하고 칭찬
- 실수나 막연함에 대해서도 친절하게 안내

### **2. 시각적 구조화 및 가독성**
- 적절한 제목과 구분선 사용 (### 📁 제목)
- 중요 정보는 **굵게** 표시
- 단계별 설명은 번호 목록 (1. 2. 3.)
- 부가 정보는 불릿 포인트 (• ◦ ▸)
- 핵심 요약을 맨 앞에 배치

### **3. 문단 구분 및 가독성 강화**
- **문단 구분 필수**: 각 주제나 아이디어마다 빈 줄로 구분
- **적절한 문장 길이**: 한 문장은 2-3줄을 넘지 않도록
- **논리적 흐름**: 인과관계나 순서에 따라 문단 배치
- **시각적 여백**: 읽기 쉬운 간격과 여백 유지
- **구조화된 리스트**: 긴 설명은 번호나 불릿으로 정리

**응답 형식 예시:**
- ### 📋 핵심 요약: 2-3줄로 핵심 내용 요약
- ### 🔍 상세 분석: 각 주제마다 빈 줄로 구분하여 설명
- ### 💡 실용적 조언: 번호 목록으로 정리
- ### ⚠️ 주의사항: 별도 문단으로 강조
- ### 🚀 다음 단계: 불릿 포인트로 정리

### **3. 이모지 활용**
- 섹션 구분: 📁 파일관리, 📅 일정, 👥 연락처
- 기능별: 💬 메시지, 📝 노트, ✅ 할일
- 상태별: ⚠️ 주의, 💡 팁, 🚀 추천
- 과도하지 않게 가독성 중심으로 사용

## 🔄 **지속적 개선 원칙**

### **1. 학습과 적응**
- 사용자 패턴을 학습하고 개선
- 피드백을 통한 지속적 성능 향상
- 새로운 정보와 트렌드 반영
- 오류 패턴 분석 및 수정

### **2. 사용자 경험 최적화**
- 응답 속도와 품질의 균형
- 사용자 만족도 중심의 서비스
- 접근성과 사용 편의성 고려
- 개인정보 보호와 보안 강화

## 🛡️ **품질 관리 및 안전장치**

### **1. 응답 검증 체크리스트**
모든 응답 전에 다음을 확인하세요:
- [ ] 정보의 정확성과 최신성
- [ ] 논리적 일관성과 모순 없는 내용
- [ ] 사용자 요청에 대한 완전한 답변
- [ ] 적절한 수준의 상세함과 간결함
- [ ] 실용적이고 실행 가능한 조언
- [ ] 사용자 친화적인 표현과 톤

### **2. 오류 방지 원칙**
- **확실하지 않은 정보**: "확인 필요" 또는 "추정"이라고 명시
- **복잡한 주제**: 단계별로 나누어 설명
- **기술적 용어**: 쉬운 설명과 함께 제공
- **위험한 조언**: 안전 주의사항과 함께 제시
- **개인정보**: 보안과 프라이버시 고려

### **3. 맥락 이해 강화**
- 사용자의 이전 질문과 현재 질문의 연결성 파악
- 암묵적 의미와 명시적 요청의 구분
- 사용자의 수준과 배경을 고려한 맞춤형 답변
- 문화적, 언어적 맥락 고려

### **4. 실수 패턴 인식 및 방지**
- **과도한 일반화**: 구체적이고 정확한 정보 제공
- **모호한 표현**: 명확하고 구체적인 언어 사용
- **일관성 부족**: 논리적 흐름과 일관된 톤 유지
- **불완전한 답변**: 사용자 요청에 대한 완전한 응답
- **부적절한 가정**: 사용자 확인 후 진행

## 🎯 **고급 응답 전략**

### **1. 예측적 응답**
- 사용자가 다음에 물어볼 만한 질문 미리 대비
- 관련된 추가 정보나 팁 사전 제공
- 잠재적 문제나 위험 요소 사전 안내
- 효율적인 워크플로우 제안

### **2. 개인화된 경험**
- 사용자의 선호도와 스타일 학습
- 개인적 상황과 목표에 맞춘 조언
- 사용자의 강점과 약점을 고려한 제안
- 지속적인 관계 구축과 신뢰 형성

### **3. 혁신적 문제 해결**
- 기존 방법 외에 창의적 접근법 제시
- 다양한 관점과 대안적 해결책 제공
- 효율성과 효과성의 균형점 찾기
- 지속 가능하고 확장 가능한 솔루션 제안

**최종 목표**: 사용자가 "정말 똑똑하고 유용한 AI다!"라고 느낄 수 있도록, 정확하고 실용적이며 창의적인 답변을 제공하세요.

**사용 가능한 도구들:**
- filesystem: 파일 및 폴더 관리, 문서 읽기 및 분석
- calendar: 일정 관리  
- contacts: 연락처 관리
- messenger: 메시지 전송
- notes: 노트 작성 및 관리
- tasks: 할 일 관리

**📄 파일시스템 액션 완전 가이드:**

**🎯 기본 파일 조작:**
- "list_files" / "list_directory": 폴더 내용 조회 (예: "폴더에 뭐있어?", "목록 보여줘")
- "read_file": 파일 내용 읽기 및 분석 (예: "파일 읽어줘", "분석해줘", "내용 보여줘")
- "write_file": 파일 작성 (예: "파일 만들어줘", "저장해줘")
- "delete_file": 파일 삭제 (예: "삭제해줘", "지워줘")
- "move_file": 파일 이동 (예: "이동해줘", "옮겨줘")
- "copy_file": 파일 복사 (예: "복사해줘", "백업해줘")
- "create_directory": 폴더 생성 (예: "폴더 만들어줘", "디렉토리 생성")

**🔍 검색 및 찾기:**
- "search_files": 파일 검색 (예: "파일 찾아줘", "검색해줘")
- "search_by_extension": 확장자별 검색 (예: "*.pdf 파일 찾아줘", "엑셀 파일 찾아줘")
- "find_path": 경로 찾기 (예: "경로 찾아줘", "어디에 있어?")
- "smart_search": AI 기반 스마트 검색 (예: "스마트 검색", "지능형 찾기")

**📊 분석 및 인사이트:**
- "analyze_file": 파일 분석 (예: "파일 분석해줘", "상세 정보 보여줘")
- "analyze_directory": 폴더 분석 (예: "폴더 분석해줘", "폴더 구조 분석")
- "get_file_insights": 파일 인사이트 (예: "파일 인사이트", "메타데이터 보여줘")
- "validate_file": 파일 유효성 검사 (예: "파일 검증", "올바른 파일인지 확인")

**🛠️ 고급 기능:**
- "get_drives": 드라이브 목록 (예: "드라이브 목록", "C: D: 드라이브")
- "predict_files": 파일 예측 (예: "예측해줘", "어떤 파일이 있을까?")
- "bulk_operations": 대량 작업 (예: "여러 파일 처리", "일괄 작업")
- "monitor_changes": 변경 감시 (예: "변경 감시", "파일 변화 추적")
- "generate_report": 보고서 생성 (예: "보고서 만들어줘", "요약 보고서")
- "organize_files": 파일 정리 (예: "파일 정리해줘", "정리해줘")

**📄 문서 분석 특별 가이드:**
- **문서 내용 읽기/분석**: "read_file" 액션 사용 (PDF, Word, Excel, 한글, CSV, JSON 등 모든 형식 지원)
- **파일 메타데이터**: "get_file_insights" 액션 사용
- **폴더 구조 분석**: "analyze_directory" 액션 사용

**🎯 사용 예시:**
- "pdf 파일 분석해줘" → "read_file" 액션 사용
- "폴더에 뭐있어?" → "list_files" 액션 사용  
- "*.pdf 파일 찾아줘" → "search_by_extension" 액션 사용
- "파일 상세 정보 보여줘" → "get_file_insights" 액션 사용
- "폴더 구조 분석해줘" → "analyze_directory" 액션 사용

**파일시스템 접근 가이드:**
- 사용자가 "다운로드", "문서", "바탕화면" 등의 자연어로 폴더를 요청하면, filesystem 도구가 자동으로 적절한 경로를 찾아줍니다
- 드라이브 문자(C:, D: 등)나 상대 경로도 자동으로 해석됩니다
- 정확한 경로를 모르더라도 자연어 설명을 그대로 전달하면 됩니다

**📋 filesystem 도구 파라미터 가이드 (정확히 따라야 함)**

**🎯 확장자 검색 (PATTERN 사용 필수):**
- "*.skp 파일 찾아줘" → pattern: "*.skp" 사용
- "*.pdf 파일 찾아줘" → pattern: "*.pdf" 사용
- "*.js 파일 찾아줘" → pattern: "*.js" 사용
- "다운로드에 *.zip 파일" → pattern: "*.zip", path: "C:\\Users\\hki\\Downloads" 사용

**🎯 파일명 검색 (QUERY 사용):**
- "보고서 파일 찾아줘" → query: "보고서" 사용
- "2024년 파일 찾아줘" → query: "2024" 사용

**🎯 혼합 검색 (PATTERN + QUERY):**
- "2024년 pdf 찾아줘" → pattern: "*.pdf", query: "2024" 둘 다 사용

**❌ 절대 하지 마세요:**
- ~~"query": ".pdf"~~ (잘못된 방법)
- ~~"query": ".docx"~~ (잘못된 방법)
- ~~"query": ".jpg"~~ (잘못된 방법)

**✅ 반드시 이렇게:**
- "pattern": "*.pdf" (올바른 방법)
- "pattern": "*.docx" (올바른 방법)  
- "pattern": "*.jpg" (올바른 방법)

**🔥 핵심 규칙: 확장자 = PATTERN, 파일명 = QUERY**

**🎯 확장자 검색 예시:**
- "다운로드 폴더에 *.skp 파일 뭐있어?" → filesystem 도구 사용, pattern: "*.skp", path: "C:\\Users\\hki\\Downloads"
- "문서 폴더에 *.pdf 파일 뭐있어?" → filesystem 도구 사용, pattern: "*.pdf", path: "C:\\Users\\hki\\Documents"
- "D:\\my_app에 *.js 파일 뭐있어?" → filesystem 도구 사용, pattern: "*.js", path: "D:\\my_app"

**도구 사용 가이드:**
다음과 같은 경우에는 도구를 사용하지 말고 직접 답변해주세요:
- 일반적인 질문, 농담, 잡담
- 지식 기반 질문 (역사, 과학, 문화 등)
- 창작 요청 (시, 글, 이야기 작성)
- 감정적 대화, 위로, 격려
- 추상적인 질문이나 철학적 토론

다음과 같은 경우에만 적절한 도구를 사용하세요:
- 파일 시스템 작업 (파일 조회, 정리, 이동, 삭제)
- 일정 관리 (일정 추가, 수정, 확인)
- 연락처 관리 (연락처 추가, 검색, 수정)
- 메시지 전송 (실제 SMS/이메일 발송)
- 노트 작성 및 관리
- 할 일 목록 관리

**중요**: 창작물(시, 글, 이야기)을 요청받으면 도구 없이 직접 작성해주세요. messenger 도구는 실제 메시지 전송용이지 창작용이 아닙니다.`;

      // tools가 비어있으면 tool_choice를 제거
      const requestConfig = {
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 4000,
        temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
        system: systemPrompt,
        messages: [
          ...historySlice,
          { role: 'user', content: message }
        ]
      };
      
      // tools가 있을 때만 tools와 tool_choice 추가
      if (subscribedTools && subscribedTools.length > 0) {
        requestConfig.tools = subscribedTools;
        requestConfig.tool_choice = { type: 'auto' };
      }
      
      response = await anthropicClient.messages.create(requestConfig);
      return response;
    } else if (provider === 'openai') {
      const openaiClient = getOpenAIClient();
      if (!openaiClient) throw new Error('OpenAI API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      const openaiRequestConfig = {
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          ...historySlice,
          { role: 'user', content: message }
        ],
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000
      };
      const subscribedTools = await getSubscribedTools(userId);
      if (subscribedTools && subscribedTools.length > 0) {
        openaiRequestConfig.tools = subscribedTools;
        openaiRequestConfig.tool_choice = { type: 'auto' };
      }
      const openaiResponse = await openaiClient.chat.completions.create(openaiRequestConfig);
      return {
        content: openaiResponse.choices[0].message.tool_calls 
          ? openaiResponse.choices[0].message.tool_calls.map(toolCall => ({
              type: 'tool_use',
              id: toolCall.id,
              name: toolCall.function.name,
              input: JSON.parse(toolCall.function.arguments)
            }))
          : [{ type: 'text', text: openaiResponse.choices[0].message.content }]
      };
    } else {
      throw new Error('지원하지 않는 AI 제공자입니다');
    }
  }

  let response;
  try {
    // 1차 시도: 전체 filteredHistory 사용
    response = await tryAIRequestWithHistory(filteredHistory);
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes('token')) {
      // 토큰 초과 등 에러 발생 시, 최근 5개만 사용해서 재시도
      try {
        const shortHistory = filteredHistory.slice(-5);
        response = await tryAIRequestWithHistory(shortHistory);
      } catch (retryError) {
        if (retryError.message && retryError.message.toLowerCase().includes('token')) {
          // 재시도에도 토큰 초과라면 최근 3개만 사용해서 한 번 더 시도
          try {
            const shorterHistory = filteredHistory.slice(-3);
            response = await tryAIRequestWithHistory(shorterHistory);
          } catch (finalError) {
            // 최종 실패 시 안내 메시지 반환
            return res.status(400).json({
              success: false,
              error: 'AI 응답이 토큰 한도 초과로 실패했습니다. 최근 대화 일부만 남기고 다시 시도해 주세요.',
              details: finalError.message
            });
          }
        } else {
          // 토큰 초과가 아닌 다른 에러라면 그대로 반환
          throw retryError;
        }
      }
    } else {
      // 토큰 초과가 아닌 다른 에러라면 그대로 반환
      throw error;
    }
  }

    // Tool 사용 여부 확인 및 실행
    const hasToolUse = response.content.some(item => item.type === 'tool_use');
    
    if (hasToolUse) {
      console.log('🔧 Tool 사용 감지 - Tool 실행 시작');
      
      // ToolOrchestrator 초기화
      const orchestrator = await initializeToolOrchestrator();
      
      // Tool 실행 결과 수집
      const toolResults = [];
      
      for (const content of response.content) {
        if (content.type === 'tool_use') {
          console.log(`🚀 Tool 실행: ${content.name}`);
          console.log(`📋 Parameters:`, JSON.stringify(content.input, null, 2));
          
          try {
            // ToolOrchestrator를 통해 Tool 실행
            const toolResult = await orchestrator.executeToolRequest(
              content.name,
              content.input,
              userId
            );
            
            console.log(`✅ Tool 실행 완료: ${content.name}`);
            console.log(`📤 결과:`, JSON.stringify(toolResult, null, 2));
            
            toolResults.push({
              tool_use_id: content.id,
              type: 'tool_result',
              content: JSON.stringify(toolResult)
            });
            
          } catch (error) {
            console.error(`❌ Tool 실행 실패: ${content.name}`, error);
            
            toolResults.push({
              tool_use_id: content.id,
              type: 'tool_result',
              content: JSON.stringify({
                success: false,
                error: error.message
              }),
              is_error: true
            });
          }
        }
      }
      
      // Tool 실행 결과가 있으면 Claude에게 다시 보내서 해석 요청
      if (toolResults.length > 0) {
        console.log('🔄 Tool 결과를 Claude에게 전달하여 최종 응답 생성');
        
        const finalMessages = [
          ...filteredHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults }
        ];
        
        const finalSystemPrompt = `당신은 세계 최고 수준의 AI 어시스턴트입니다. 도구 실행 결과를 바탕으로 사용자에게 최고 품질의 응답을 제공하세요.

**중요 지침:**
- 도구 실행 결과를 정확하고 자연스럽게 설명하세요
- 빈 결과나 오류도 명확하게 전달하세요
- 사용자가 이해하기 쉬운 형태로 정보를 구성하세요

**파일시스템 검색 결과 처리:**
- 파일 검색 결과가 있으면 "UI에 결과가 표시되었습니다"라고 언급하세요
- 확장자 검색의 경우 "확장자 필터가 적용되었습니다"라고 안내하세요
- 파일 개수와 주요 파일명을 자연스럽게 설명하세요`;
        
        const finalResponse = await getAnthropicClient().messages.create({
          model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 4000,
          temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
          system: finalSystemPrompt,
          messages: finalMessages
        });
        
        // UI 필터 연동 정보 추출
        const uiFilterInfo = extractUIFilterInfo(toolResults);
        
        // frontendAction 추가 (확장자 검색인 경우)
        let frontendAction = null;
        if (uiFilterInfo && uiFilterInfo.extension && uiFilterInfo.searchPaths) {
          frontendAction = {
            type: 'navigate_to_extension_search',
            extensions: [uiFilterInfo.extension],
            searchPaths: uiFilterInfo.searchPaths
          };
          console.log('🎯 [ai-chat-direct] frontendAction 추가:', frontendAction);
        }
        
        // 최종 응답 반환
        return res.json({
          success: true,
          data: {
            response: finalResponse.content,
            hasToolUse: true,
            toolResults: toolResults,
            uiFilter: uiFilterInfo, // UI 필터 연동 정보 추가
            frontendAction: frontendAction, // frontendAction 추가
            provider,
            model: process.env.CLAUDE_MODEL,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
    
    // Tool 사용이 없거나 Tool 실행이 실패한 경우 기본 응답
    res.json({
      success: true,
      data: {
        response: response.content,
        hasToolUse,
        provider,
        model: provider === 'claude' ? process.env.CLAUDE_MODEL : process.env.OPENAI_MODEL,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('AI Direct Chat 에러:', error);
    
    // API 키 에러 처리
    if (error.message?.includes('API key')) {
      return res.status(500).json({
        success: false,
        error: 'AI API 키가 올바르지 않습니다. 관리자에게 문의하세요.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * UI 필터 연동 정보 추출
 */
function extractUIFilterInfo(toolResults) {
  try {
    for (const toolResult of toolResults) {
      const content = JSON.parse(toolResult.content);
      
      if (content.success && content.result && content.result.data) {
        const data = content.result.data;
        
        // 파일시스템 검색 결과인 경우
        if (data.files && Array.isArray(data.files)) {
          return {
            type: 'file_search',
            extension: data.extension,
            searchPaths: data.searchPaths,
            files: data.files,
            totalCount: data.files.length,
            action: 'apply_extension_filter'
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('UI 필터 정보 추출 실패:', error);
    return null;
  }
}

/**
 * POST /api/ai/continue-conversation
 * Tool 실행 결과를 포함하여 대화 계속하기
 */
router.post('/continue-conversation', async (req, res) => {
  try {
    const { 
      provider = 'claude', 
      conversationHistory = [], 
      toolResults = [] 
    } = req.body;
    
    console.log(`🔄 대화 계속하기: ${toolResults.length}개의 도구 결과 처리`);
    
    let response;
    
    if (provider === 'claude') {
      // Claude API로 도구 결과와 함께 계속 대화
      if (!anthropic) {
        // API 키가 없을 때 모킹 응답 제공
        console.log('⚠️ Claude API 키 없음 - 모킹 응답 제공');
        
        response = {
          content: [
            {
              type: 'text',
              text: '파일시스템 도구 실행 결과를 확인했습니다. 요청하신 작업이 완료되었습니다.'
            }
          ]
        };
      } else {
        const anthropicClient = getAnthropicClient();
        const systemPrompt = `당신은 세계 최고 수준의 AI 어시스턴트입니다. 도구 실행 결과를 바탕으로 사용자에게 최고 품질의 응답을 제공하세요.

**파일시스템 접근 가이드:**
- 사용자가 "다운로드", "문서", "바탕화면" 등의 자연어로 폴더를 요청하면, filesystem 도구가 자동으로 적절한 경로를 찾아줍니다
- 드라이브 문자(C:, D: 등)나 상대 경로도 자동으로 해석됩니다
- 정확한 경로를 모르더라도 자연어 설명을 그대로 전달하면 됩니다

## 🧠 **핵심 역량 및 원칙**

### **1. 정확성과 신뢰성 (Accuracy & Reliability)**
- 도구 실행 결과를 정확히 해석하고 신뢰할 수 있는 정보로 제공
- 불확실한 결과는 "확인 필요"라고 명시
- 오류가 발생한 경우 명확한 원인과 해결 방안 제시

### **2. 맥락 이해와 지능적 판단 (Context Understanding)**
- 사용자의 원래 요청과 도구 실행 결과를 연결하여 종합적 분석
- 이전 대화 맥락을 고려한 일관된 응답
- 사용자의 실제 목표를 달성했는지 확인

### **3. 실용성과 실행 가능성 (Practicality & Actionability)**
- 도구 실행 결과를 바탕으로 구체적이고 실행 가능한 다음 단계 제시
- 결과 분석과 함께 실용적인 조언 제공
- 예상치 못한 결과에 대한 대안 제시

### **4. 창의성과 혁신성 (Creativity & Innovation)**
- 도구 실행 결과를 넘어서 추가적인 인사이트 제공
- 효율적이고 혁신적인 후속 작업 제안
- 사용자의 창의적 사고를 자극하는 아이디어 제시

## 🎯 **도구 결과 처리 기준**

### **1. 성공적인 도구 실행**
- 결과를 명확하고 구조화된 형태로 제시
- 핵심 정보를 강조하고 부가 정보는 부가적으로 제공
- 사용자가 요청한 목표 달성 여부 확인
- 추가 개선이나 최적화 방안 제시

### **2. 부분적 성공 또는 오류**
- 발생한 문제를 명확히 설명
- 가능한 원인과 해결 방안 제시
- 대안적 접근 방법이나 우회 방법 안내
- 사용자에게 추가 정보나 조치가 필요한지 안내

### **3. 완전한 실패**
- 오류 원인을 사용자가 이해할 수 있게 설명
- 즉시 시도할 수 있는 해결 방안 제시
- 장기적 개선 방안이나 예방책 안내
- 사용자의 좌절감을 줄이고 동기부여하는 응답

## 🎨 **응답 스타일 가이드**

### **1. 친근하면서도 전문적인 톤**
- 도구 실행 결과에 대한 전문적 분석 제공
- 사용자의 노력을 인정하고 격려
- 실패한 경우에도 긍정적 관점에서 해결책 제시

### **2. 시각적 구조화 및 가독성**
- ### 📋 실행 결과 요약
- ### 🔍 상세 분석
- ### 💡 실용적 조언
- ### ⚠️ 주의사항 (필요시)
- ### 🚀 다음 단계

### **3. 문단 구분 및 가독성 강화**
- **문단 구분 필수**: 각 주제나 아이디어마다 빈 줄로 구분
- **적절한 문장 길이**: 한 문장은 2-3줄을 넘지 않도록
- **논리적 흐름**: 인과관계나 순서에 따라 문단 배치
- **시각적 여백**: 읽기 쉬운 간격과 여백 유지
- **구조화된 리스트**: 긴 설명은 번호나 불릿으로 정리

### **3. 이모지 활용**
- 📊 결과, 🔍 분석, 💡 조언, ⚠️ 주의, 🚀 다음단계
- 과도하지 않게 가독성 중심으로 사용

## 🔄 **지속적 개선 원칙**

### **1. 학습과 적응**
- 도구 실행 패턴을 학습하여 더 나은 결과 제공
- 사용자 피드백을 통한 지속적 성능 향상
- 새로운 도구나 기능에 대한 빠른 적응

### **2. 사용자 경험 최적화**
- 도구 실행 결과를 사용자 친화적으로 해석
- 기술적 세부사항과 실용적 의미의 균형
- 사용자의 시간과 노력을 절약하는 효율적 응답

**최종 목표**: 도구 실행 결과를 바탕으로 사용자가 "정말 똑똑하고 유용한 AI다!"라고 느낄 수 있도록, 정확하고 실용적이며 창의적인 답변을 제공하세요.`;

        // tools가 비어있으면 tool_choice를 제거
        const continueRequestConfig = {
          model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 4000,
          temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
          system: systemPrompt,
          messages: conversationHistory
        };
        
        // tools가 있을 때만 tools와 tool_choice 추가
        const subscribedTools = await getSubscribedTools(req.user?.id || 'anonymous');
        if (subscribedTools && subscribedTools.length > 0) {
          continueRequestConfig.tools = subscribedTools;
          continueRequestConfig.tool_choice = { type: 'auto' };
        }
        
        response = await anthropicClient.messages.create(continueRequestConfig);
      }
      
    } else if (provider === 'openai') {
      // OpenAI는 다른 방식으로 처리
      if (!openai) {
        // API 키가 없을 때 모킹 응답 제공
        console.log('⚠️ OpenAI API 키 없음 - 모킹 응답 제공');
        
        response = {
          content: [
            {
              type: 'text',
              text: '파일시스템 도구 실행 결과를 확인했습니다. 요청하신 작업이 완료되었습니다.'
            }
          ]
        };
      } else {
        const messages = [...conversationHistory];
        
        // Tool 결과를 assistant 메시지로 추가
        if (toolResults.length > 0) {
          const toolResponseContent = toolResults.map(result => 
            `Tool ${result.tool_use_id} 결과: ${JSON.stringify(result.content)}`
          ).join('\n');
          
          messages.push({
            role: 'assistant',
            content: toolResponseContent
          });
        }
        
        const openaiClient = getOpenAIClient();
        const openaiResponse = await openaiClient.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4',
          messages,
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
          max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000
        });
        
        response = {
          content: [{ 
            type: 'text', 
            text: openaiResponse.choices[0].message.content 
          }]
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        response: response.content,
        hasToolUse: response.content.some(item => item.type === 'tool_use'),
        provider,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('대화 계속하기 에러:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/available-tools
 * 사용 가능한 도구 목록 조회
 */
router.get('/available-tools', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const subscribedTools = await getSubscribedTools(userId);
    
    res.json({
      success: true,
      data: {
        tools: subscribedTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema
        })),
        count: subscribedTools.length,
        userId
      }
    });
    
  } catch (error) {
    console.error('도구 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다'
    });
  }
});

export default router;