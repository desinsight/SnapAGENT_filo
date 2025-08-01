/**
 * 공용노트 서비스 목업 데이터
 * 
 * @description 공용노트 및 협업 기능 개발용 목업 데이터
 * @author AI Assistant
 * @version 1.0.0
 * @todo 실제 API 연결 시 이 파일 삭제
 */

import { NOTE_CATEGORIES } from '../constants/noteConfig';

/**
 * 목업 사용자 데이터
 */
export const MOCK_USERS = [
  {
    id: 'user-1',
    name: '김철수',
    email: 'kimcs@company.com',
    avatar: null,
    role: 'designer',
    department: '디자인팀',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'user-2',
    name: '박영희',
    email: 'parkhy@company.com',
    avatar: null,
    role: 'developer',
    department: '개발팀',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'user-3',
    name: '이민수',
    email: 'leems@company.com',
    avatar: null,
    role: 'pm',
    department: '기획팀',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30분 전
  },
  {
    id: 'user-4',
    name: '정수진',
    email: 'jungsj@company.com',
    avatar: null,
    role: 'marketer',
    department: '마케팅팀',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'user-5',
    name: '최동욱',
    email: 'choidw@company.com',
    avatar: null,
    role: 'analyst',
    department: '분석팀',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2시간 전
  }
];

/**
 * 랜덤 협업자 생성
 */
const getRandomCollaborators = () => {
  const collaboratorCount = Math.floor(Math.random() * 4) + 1; // 1-4명의 협업자
  const roles = ['viewer', 'editor', 'admin'];
  const selectedUsers = MOCK_USERS.sort(() => 0.5 - Math.random()).slice(0, collaboratorCount);
  
  return selectedUsers.map(user => ({
    userId: user.id,
    user: user,
    role: roles[Math.floor(Math.random() * roles.length)],
    addedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
  }));
};

/**
 * 랜덤 협업 히스토리 생성
 */
const getRandomCollaborationHistory = () => {
  const actions = [
    'created', 'edited', 'commented', 'shared', 'joined', 'left', 
    'updated_title', 'updated_content', 'added_collaborator', 'removed_collaborator'
  ];
  
  const historyCount = Math.floor(Math.random() * 10) + 5; // 5-15개의 히스토리
  const history = [];
  
  for (let i = 0; i < historyCount; i++) {
    const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    history.push({
      id: `history-${i + 1}`,
      userId: user.id,
      user: user,
      action: action,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      details: getActionDetails(action)
    });
  }
  
  return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * 액션 세부사항 생성
 */
const getActionDetails = (action) => {
  const details = {
    'created': '노트를 생성했습니다.',
    'edited': '노트 내용을 수정했습니다.',
    'commented': '댓글을 추가했습니다.',
    'shared': '노트를 공유했습니다.',
    'joined': '협업에 참여했습니다.',
    'left': '협업을 종료했습니다.',
    'updated_title': '제목을 변경했습니다.',
    'updated_content': '내용을 대폭 수정했습니다.',
    'added_collaborator': '새로운 협업자를 추가했습니다.',
    'removed_collaborator': '협업자를 제거했습니다.'
  };
  
  return details[action] || '알 수 없는 작업을 수행했습니다.';
};

/**
 * 공용노트 컨텐츠 템플릿
 */
const sharedNoteContents = [
  `# 📋 팀 프로젝트 기획서

## 프로젝트 개요
새로운 웹 애플리케이션 개발을 위한 종합 기획 문서입니다.

### 목표
- 사용자 경험 개선
- 성능 최적화
- 접근성 향상

### 주요 기능
1. **사용자 인증 시스템**
   - 소셜 로그인 연동
   - 2단계 인증
   - 권한 관리

2. **대시보드**
   - 실시간 데이터 시각화
   - 맞춤형 위젯
   - 반응형 레이아웃

3. **협업 도구**
   - 실시간 채팅
   - 파일 공유
   - 작업 관리

## 개발 일정
- **1주차**: 기본 구조 설계
- **2주차**: 백엔드 API 개발
- **3주차**: 프론트엔드 구현
- **4주차**: 테스트 및 배포

---
**담당자**: 김철수, 박영희, 이민수
**마감일**: 2024-07-15`,

  `# 🎯 마케팅 전략 회의록

## 회의 정보
- **날짜**: 2024년 6월 28일
- **시간**: 오후 2:00 - 4:00
- **참석자**: 정수진, 최동욱, 김철수
- **장소**: 회의실 A

## 주요 안건

### 1. Q3 마케팅 캠페인 계획
- 타겟 고객층 분석
- 채널별 전략 수립
- 예산 배분

### 2. 브랜드 인지도 개선 방안
- SNS 마케팅 강화
- 인플루언서 협업
- 콘텐츠 마케팅

### 3. 성과 측정 지표
- KPI 설정
- 분석 도구 활용
- 정기 리포트 체계

## 결정사항
1. 인스타그램 광고 예산 30% 증액
2. 유튜브 채널 개설 추진
3. 월간 성과 리포트 도입

## 액션 아이템
- [ ] 인플루언서 리스트 작성 (정수진, 7/5)
- [ ] 유튜브 채널 컨셉 기획 (김철수, 7/10)
- [ ] 분석 대시보드 구축 (최동욱, 7/15)

---
**다음 회의**: 2024년 7월 12일 (금) 오후 3:00`,

  `# 💡 신규 서비스 아이디어

## 서비스 컨셉
**"스마트 업무 도우미"** - AI 기반 업무 자동화 플랫폼

### 핵심 기능
1. **일정 관리**
   - 스마트 스케줄링
   - 회의실 자동 예약
   - 참석자 알림

2. **문서 관리**
   - 자동 분류 및 태깅
   - 버전 관리
   - 협업 편집

3. **커뮤니케이션**
   - 통합 메신저
   - 화상 회의
   - 프로젝트 채널

## 기술 스택
- **프론트엔드**: React, TypeScript
- **백엔드**: Node.js, Express
- **데이터베이스**: MongoDB
- **AI/ML**: TensorFlow, OpenAI API

## 시장 분석
### 경쟁사 현황
- Slack: 커뮤니케이션 중심
- Notion: 문서 관리 특화
- Asana: 프로젝트 관리

### 차별화 포인트
- AI 기반 자동화
- 한국어 최적화
- 중소기업 친화적 가격

## 개발 로드맵
**Phase 1**: MVP 개발 (3개월)
**Phase 2**: 베타 테스트 (2개월)
**Phase 3**: 정식 런칭 (1개월)

---
**아이디어 제안자**: 이민수
**검토 요청**: 전체 팀`,

  `# 📊 분기별 성과 분석 보고서

## 분석 개요
2024년 2분기 주요 성과 지표 분석 결과입니다.

### 핵심 지표
- **매출**: 전년 동기 대비 15% 증가
- **사용자 수**: 월 활성 사용자 25% 증가
- **고객 만족도**: 4.2/5.0 (전분기 대비 0.3 상승)

## 상세 분석

### 1. 매출 성과
- Q2 총매출: 1,250만원
- 주요 성장 동력: 신규 고객 유입
- 지역별 매출 분포
  - 서울: 45%
  - 부산: 20%
  - 대구: 15%
  - 기타: 20%

### 2. 사용자 행동 분석
- 평균 세션 시간: 12분 (전분기 대비 2분 증가)
- 이탈률: 35% (5% 개선)
- 재방문율: 68% (8% 증가)

### 3. 마케팅 효과
- 광고 ROI: 3.2배
- 최고 성과 채널: 네이버 검색 광고
- 브랜드 인지도: 전년 대비 40% 상승

## 개선 방안
1. **모바일 최적화** 강화
2. **개인화 추천** 시스템 도입
3. **고객 지원** 채널 다양화

## 3분기 목표
- 매출 20% 증가
- 신규 사용자 30% 증가
- 고객 만족도 4.5/5.0 달성

---
**작성자**: 최동욱
**검토자**: 전체 팀`,

  `# 🔧 개발팀 기술 공유

## 이번 주 학습 내용

### React 18 새로운 기능들
- **Concurrent Features**: 동시성 렌더링
- **Automatic Batching**: 자동 배치 처리
- **Suspense 개선**: 데이터 로딩 최적화

### 성능 최적화 팁
1. **메모이제이션 활용**
   \`\`\`javascript
   const MemoizedComponent = React.memo(Component);
   const memoizedValue = useMemo(() => computeValue(a, b), [a, b]);
   \`\`\`

2. **코드 스플리팅**
   \`\`\`javascript
   const LazyComponent = React.lazy(() => import('./LazyComponent'));
   \`\`\`

3. **Virtual DOM 최적화**
   - Key 속성 올바른 사용
   - 불필요한 리렌더링 방지

### 새로운 개발 도구
- **Vite**: 빠른 번들러
- **Vitest**: 단위 테스트 프레임워크
- **Playwright**: E2E 테스트

## 프로젝트 적용 계획
1. 기존 웹팩을 Vite로 마이그레이션
2. 테스트 커버리지 80% 달성
3. 성능 모니터링 도구 도입

### 학습 자료
- [React 18 공식 문서](https://react.dev/)
- [성능 최적화 가이드](https://web.dev/react/)
- [현대적 프론트엔드 개발](https://frontendmasters.com/)

---
**공유자**: 박영희
**참여자**: 개발팀 전체`,

  `# 📈 고객 피드백 분석

## 수집 현황
- **조사 기간**: 2024년 6월 1일 - 30일
- **응답자 수**: 1,247명
- **응답률**: 23.4%

## 주요 피드백

### 긍정적 의견 (78%)
- **사용 편의성**: "직관적이고 사용하기 쉬워요"
- **디자인**: "깔끔하고 모던한 인터페이스"
- **기능성**: "필요한 기능들이 잘 구현되어 있음"

### 개선 요청 (22%)
- **속도**: "로딩 시간이 조금 길어요"
- **모바일**: "모바일 버전 개선 필요"
- **알림**: "알림 기능 개선 요청"

## 상세 분석

### 1. 기능별 만족도
- 검색 기능: 4.1/5.0
- 사용자 인터페이스: 4.3/5.0
- 성능: 3.7/5.0
- 고객 지원: 4.0/5.0

### 2. 사용자 세그먼트별 분석
- **신규 사용자**: 전반적으로 만족
- **기존 사용자**: 새 기능에 대한 긍정적 반응
- **파워 유저**: 고급 기능 추가 요청

### 3. 경쟁사 비교
- 우리 서비스 강점: 사용 편의성, 디자인
- 개선 필요 영역: 성능, 모바일 경험

## 액션 플랜
1. **성능 최적화**: 3분기 최우선 과제
2. **모바일 앱 개선**: 전담 팀 구성
3. **알림 시스템**: 개인화 알림 도입

---
**분석 담당**: 정수진
**리뷰 필요**: 기획팀, 개발팀`
];

/**
 * 공용노트 목업 데이터 생성
 */
const generateSharedNotes = () => {
  return Array.from({ length: 30 }, (_, index) => {
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // 최근 30일
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000); // 생성 후 1주일 내
    const owner = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
    const collaborators = getRandomCollaborators();
    const visibility = ['private', 'shared', 'public'][Math.floor(Math.random() * 3)];
    
    return {
      _id: `shared-note-${index + 1}`,
      id: `shared-note-${index + 1}`,
      title: `${['팀 프로젝트', '회의록', '아이디어', '분석 보고서', '기술 공유', '고객 피드백'][Math.floor(Math.random() * 6)]} ${index + 1}`,
      content: sharedNoteContents[Math.floor(Math.random() * sharedNoteContents.length)],
      summary: `공유 노트 ${index + 1}의 요약 내용입니다. 팀 협업을 통해 작성된 문서입니다.`,
      category: ['work', 'idea', 'project', 'meeting'][Math.floor(Math.random() * 4)],
      tags: ['협업', '팀워크', '프로젝트', '회의', '기획', '개발', '마케팅', '분석'].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1),
      
      // 공유 관련 정보
      isShared: true,
      visibility: visibility,
      owner: owner,
      ownerId: owner.id,
      collaborators: collaborators,
      
      // 협업 상태
      isCollaborating: Math.random() > 0.7, // 30% 확률로 협업 중
      activeCollaborators: collaborators.filter(c => c.user.isOnline && Math.random() > 0.5),
      lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      
      // 통계
      viewCount: Math.floor(Math.random() * 500) + 50,
      editCount: Math.floor(Math.random() * 50) + 5,
      commentCount: Math.floor(Math.random() * 20),
      shareCount: Math.floor(Math.random() * 10),
      
      // 권한 및 설정
      permissions: {
        canEdit: collaborators.some(c => ['editor', 'admin'].includes(c.role)),
        canComment: true,
        canShare: collaborators.some(c => c.role === 'admin') || visibility === 'public',
        canDelete: false // 소유자만 가능
      },
      
      // 협업 히스토리
      collaborationHistory: getRandomCollaborationHistory(),
      
      // 메타데이터
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      deletedAt: null,
      
      // 첨부파일
      attachments: Math.random() > 0.6 ? [{
        id: `attachment-${index + 1}`,
        name: `문서_${index + 1}.pdf`,
        size: Math.floor(Math.random() * 10) * 1024 * 1024, // 0-10MB
        type: 'application/pdf',
        uploadedBy: owner.id,
        uploadedAt: updatedAt.toISOString()
      }] : [],
      
      // 댓글 (간단한 구조)
      comments: Math.random() > 0.4 ? Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
        id: `comment-${index + 1}-${i + 1}`,
        content: `댓글 내용 ${i + 1}`,
        author: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        replies: []
      })) : [],
      
      // 알림 설정
      notifications: {
        onEdit: true,
        onComment: true,
        onShare: false,
        onMention: true
      }
    };
  });
};

/**
 * 공용노트 목업 데이터
 */
export const MOCK_SHARED_NOTES = generateSharedNotes();

/**
 * 페이지네이션 응답 생성
 */
export const generateSharedNotePaginationResponse = (notes, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedNotes = notes.slice(startIndex, endIndex);
  
  return {
    data: paginatedNotes,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(notes.length / limit),
      totalCount: notes.length,
      pageSize: limit,
      hasNextPage: endIndex < notes.length,
      hasPrevPage: page > 1
    }
  };
};

/**
 * 검색 응답 생성
 */
export const generateSharedNoteSearchResponse = (notes, query, page = 1, limit = 10) => {
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(query.toLowerCase()) ||
    note.content.toLowerCase().includes(query.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );
  
  return generateSharedNotePaginationResponse(filteredNotes, page, limit);
};

/**
 * 협업 세션 목업 데이터
 */
export const MOCK_COLLABORATION_SESSIONS = MOCK_SHARED_NOTES
  .filter(note => note.isCollaborating)
  .map(note => ({
    noteId: note._id,
    sessionId: `session-${note._id}`,
    participants: note.activeCollaborators.map(c => ({
      userId: c.userId,
      user: c.user,
      role: c.role,
      joinedAt: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(), // 1시간 내
      lastActivity: new Date().toISOString(),
      cursorPosition: {
        line: Math.floor(Math.random() * 100),
        character: Math.floor(Math.random() * 80)
      },
      isTyping: Math.random() > 0.7
    })),
    createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date().toISOString(),
    status: 'active'
  }));

/**
 * 초대 목업 데이터
 */
export const MOCK_INVITATIONS = Array.from({ length: 5 }, (_, index) => ({
  id: `invitation-${index + 1}`,
  noteId: MOCK_SHARED_NOTES[index]._id,
  note: MOCK_SHARED_NOTES[index],
  inviter: MOCK_USERS[0],
  invitee: MOCK_USERS[index + 1],
  role: ['viewer', 'editor'][Math.floor(Math.random() * 2)],
  status: ['pending', 'accepted', 'declined'][Math.floor(Math.random() * 3)],
  message: `${MOCK_SHARED_NOTES[index].title} 문서에 협업 초대드립니다.`,
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
}));

/**
 * 목업 데이터 사용 플래그
 */
export const USE_SHARED_NOTE_MOCK_DATA = false;