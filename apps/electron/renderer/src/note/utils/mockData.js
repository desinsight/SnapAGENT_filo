/**
 * 노트 서비스 목업 데이터
 * 
 * @description 개발 및 테스트용 목업 데이터 - 나중에 삭제 예정
 * @author AI Assistant
 * @version 1.0.0
 * @todo 실제 API 연결 시 이 파일 삭제
 */

import { NOTE_CATEGORIES } from '../constants/noteConfig';

/**
 * 랜덤 카테고리 선택
 */
const getRandomCategory = () => {
  const categories = NOTE_CATEGORIES.map(cat => cat.id);
  return categories[Math.floor(Math.random() * categories.length)];
};

/**
 * 랜덤 태그 생성
 */
const getRandomTags = () => {
  const allTags = [
    '중요', '업무', '개인', '아이디어', '프로젝트', '회의', '할일', '메모',
    '학습', '책', '영화', '음악', '여행', '건강', '운동', '요리',
    '개발', '디자인', '마케팅', '기획', '분석', '리서치', '트렌드',
    '일정', '계획', '목표', '성과', '피드백', '개선', '혁신'
  ];
  
  const tagCount = Math.floor(Math.random() * 4) + 1; // 1-4개 태그
  const selectedTags = [];
  
  for (let i = 0; i < tagCount; i++) {
    const randomTag = allTags[Math.floor(Math.random() * allTags.length)];
    if (!selectedTags.includes(randomTag)) {
      selectedTags.push(randomTag);
    }
  }
  
  return selectedTags;
};

/**
 * 랜덤 날짜 생성 (최근 30일 내)
 */
const getRandomDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const randomDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  return randomDate;
};

/**
 * 랜덤 노트 내용 생성
 */
const getRandomContent = (index) => {
  const contents = [
    `오늘 진행한 프로젝트에 대한 회고를 작성해보려고 합니다.

## 진행 상황
- 주요 기능 구현 완료
- 테스트 케이스 작성 중
- 코드 리뷰 진행 예정

## 배운 점
새로운 기술 스택을 도입하면서 많은 것을 배웠습니다. 특히 React의 새로운 훅 시스템이 매우 유용했습니다.

## 다음 단계
- 성능 최적화 진행
- 사용자 피드백 수집
- 배포 준비`,

    `📚 **독서 노트**

방금 읽은 책에서 인상 깊었던 부분을 정리해보겠습니다.

> "성공은 준비된 자에게 찾아오는 기회다"

### 주요 인사이트
1. **지속적인 학습의 중요성**
   - 변화하는 세상에 적응하기 위해서는 끊임없이 배워야 함
   - 새로운 기술과 트렌드에 대한 관심 필요

2. **실행력의 중요성**
   - 아이디어만으로는 부족함
   - 구체적인 실행 계획과 실천이 필요

### 적용 방안
- 매일 30분씩 새로운 기술 학습
- 주간 목표 설정 및 점검`,

    `🎯 **프로젝트 기획서**

새로운 서비스 개발을 위한 기획 내용을 정리합니다.

## 서비스 개요
사용자의 일상을 더 편리하게 만들어주는 개인 맞춤형 서비스

### 핵심 기능
- **개인화 대시보드**
  - 사용자별 맞춤 정보 제공
  - 실시간 업데이트
  - 직관적인 UI/UX

- **스마트 알림**
  - AI 기반 중요도 판단
  - 맞춤형 알림 시간 설정
  - 다양한 알림 채널 지원

### 기술 스택
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, MongoDB
- AI: OpenAI API, 자연어 처리

### 일정
- Week 1-2: 기초 설계 및 프로토타입
- Week 3-4: 핵심 기능 개발
- Week 5-6: 테스트 및 최적화`,

    `💡 **아이디어 메모**

오늘 브레인스토밍 세션에서 나온 아이디어들을 정리해보겠습니다.

## 새로운 기능 아이디어
1. **음성 인식 노트 작성**
   - 음성으로 노트 내용 입력
   - 실시간 텍스트 변환
   - 다국어 지원

2. **협업 기능 강화**
   - 실시간 공동 편집
   - 코멘트 및 피드백 시스템
   - 버전 관리 기능

3. **AI 자동 정리**
   - 노트 내용 자동 요약
   - 키워드 추출
   - 관련 노트 추천

## 우선순위
High: 음성 인식 기능
Medium: 협업 기능
Low: AI 자동 정리

각 기능별로 구체적인 개발 계획을 세워야 할 것 같습니다.`,

    `📈 **주간 업무 보고**

이번 주 주요 업무 내용과 성과를 정리합니다.

## 완료된 업무
✅ 프로젝트 A 1차 개발 완료
✅ 클라이언트 미팅 3건 진행
✅ 팀 회의 자료 준비 및 발표
✅ 버그 수정 및 코드 리뷰

## 진행 중인 업무
🔄 프로젝트 B 기획 단계
🔄 신규 팀원 온보딩 지원
🔄 기술 문서 작성

## 다음 주 계획
📋 프로젝트 A 2차 개발 시작
📋 프로젝트 B 개발 팀 구성
📋 분기별 성과 보고서 작성

### 이슈 및 개선점
- 커뮤니케이션 프로세스 개선 필요
- 개발 도구 업데이트 예정
- 팀 워크샵 계획 수립`,

    `🍳 **레시피 노트**

오늘 만든 요리 레시피를 기록해두겠습니다.

## 파스타 알리오 올리오
**재료 (2인분)**
- 스파게티 면 200g
- 마늘 4쪽
- 올리브오일 4큰술
- 고추 1개
- 파슬리 적당량
- 소금, 후추 약간

**조리 방법**
1. 끓는 물에 소금을 넣고 면을 삶는다
2. 팬에 올리브오일을 두르고 마늘을 볶는다
3. 고추를 넣고 함께 볶는다
4. 삶은 면을 넣고 볶는다
5. 파슬리를 넣고 마무리

**포인트**
- 마늘이 타지 않도록 약불에서 천천히
- 면수를 조금 넣으면 더 맛있음
- 파슬리는 마지막에 넣어야 향이 살아남

다음에는 베이컨을 추가해서 만들어봐야겠습니다.`,

    `🎵 **음악 감상 노트**

최근 들은 음악들에 대한 감상을 정리해보겠습니다.

## 이번 주 플레이리스트
1. **아티스트 A - 신곡**
   - 멜로디가 매우 인상적
   - 가사가 철학적이고 깊이 있음
   - 편곡이 섬세하고 완성도 높음

2. **아티스트 B - 앨범**
   - 전체적으로 일관된 테마
   - 다양한 장르의 실험적 시도
   - 개인적으로 3번 트랙이 가장 좋음

3. **클래식 - 베토벤 9번**
   - 오케스트라 연주로 감상
   - 4악장 환상의 선율이 인상적
   - 집중력 향상에 도움됨

### 발견한 신인 아티스트
- 독특한 보컬 톤
- 자작곡 실력이 뛰어남
- 앞으로 주목해볼 만함

음악은 정말 일상에 큰 영향을 미치는 것 같습니다.`,

    `💪 **운동 기록**

오늘 헬스장에서 진행한 운동 내용을 기록합니다.

## 오늘의 운동 (상체)
### 가슴 운동
- 벤치프레스: 70kg × 10회 × 3세트
- 인클라인 덤벨프레스: 25kg × 12회 × 3세트
- 딥스: 체중 × 15회 × 3세트

### 어깨 운동
- 숄더프레스: 20kg × 12회 × 3세트
- 사이드레터럴레이즈: 12kg × 15회 × 3세트
- 리어델트플라이: 10kg × 15회 × 3세트

### 팔 운동
- 바벨컬: 30kg × 12회 × 3세트
- 트라이셉스딥: 체중 × 12회 × 3세트

## 오늘의 컨디션
- 전반적으로 좋은 컨디션
- 어깨 부위 약간의 뻐근함
- 수분 섭취 충분히 함

## 다음 목표
- 벤치프레스 중량 5kg 증가
- 운동 시간 10분 단축
- 새로운 운동 루틴 추가`,

    `🌍 **여행 계획**

다음 달 여행을 위한 계획을 세워보겠습니다.

## 여행 정보
- **목적지**: 부산
- **기간**: 2박 3일
- **동행**: 친구 2명
- **예산**: 1인당 30만원

## 일정 계획
### Day 1
- 오전: KTX로 부산 출발
- 점심: 자갈치시장 회 맛집
- 오후: 감천문화마을 관광
- 저녁: 광안리 해변 산책

### Day 2
- 오전: 해운대 해수욕장
- 점심: 밀면 맛집 투어
- 오후: 태종대 자연공원
- 저녁: 센텀시티 쇼핑

### Day 3
- 오전: 용두산공원, 부산타워
- 점심: 국제시장 먹거리
- 오후: 서면 쇼핑 후 귀경

## 준비물
- 편한 신발 (많이 걸을 예정)
- 카메라 (인생샷 찍기)
- 선크림 (바다 근처)
- 여행용 가방

정말 기대됩니다! 맛있는 음식도 많이 먹고 좋은 추억 만들어야겠어요.`
  ];
  
  return contents[index % contents.length];
};

/**
 * 단일 목업 노트 생성
 */
const generateMockNote = (index) => {
  const createdAt = getRandomDate();
  const updatedAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
  
  return {
    _id: `mock-note-${index + 1}`,
    id: `mock-note-${index + 1}`,
    title: `${['📝', '💡', '📚', '🎯', '⚡', '🔥', '✨', '🚀'][Math.floor(Math.random() * 8)]} ${[
      '프로젝트 회고록', '아이디어 메모', '독서 노트', '업무 일지', '학습 기록',
      '회의 내용', '기획 문서', '개발 노트', '디자인 가이드', '마케팅 전략',
      '성과 보고서', '피드백 정리', '트렌드 분석', '경쟁사 분석', '사용자 리서치',
      '기술 문서', '매뉴얼', '체크리스트', '일정 계획', '목표 설정'
    ][Math.floor(Math.random() * 20)]} ${index + 1}`,
    
    content: getRandomContent(index),
    
    summary: [
      '중요한 프로젝트 진행 상황과 다음 단계 계획을 정리했습니다.',
      '새로운 아이디어와 실행 방안에 대해 브레인스토밍한 내용입니다.',
      '최근 학습한 내용과 적용 방안을 구체적으로 기록했습니다.',
      '팀 미팅에서 논의된 주요 안건들을 요약 정리했습니다.',
      '개인 목표 달성을 위한 세부 계획을 수립했습니다.',
      '고객 피드백을 바탕으로 개선 사항을 도출했습니다.'
    ][Math.floor(Math.random() * 6)],
    
    category: getRandomCategory(),
    tags: getRandomTags(),
    
    // 메타데이터
    isFavorite: Math.random() > 0.7, // 30% 확률로 즐겨찾기
    isShared: Math.random() > 0.8, // 20% 확률로 공유
    isEncrypted: Math.random() > 0.9, // 10% 확률로 암호화
    aiGenerated: Math.random() > 0.85, // 15% 확률로 AI 생성
    
    // 통계
    viewCount: Math.floor(Math.random() * 50) + 1,
    editCount: Math.floor(Math.random() * 10) + 1,
    version: Math.floor(Math.random() * 5) + 1,
    
    // 상태
    status: 'published',
    visibility: Math.random() > 0.7 ? 'shared' : 'private',
    
    // 첨부파일 (일부만)
    attachments: Math.random() > 0.8 ? [
      {
        filename: `attachment-${index + 1}.pdf`,
        originalName: `첨부파일_${index + 1}.pdf`,
        mimeType: 'application/pdf',
        size: Math.floor(Math.random() * 1000000) + 100000,
        url: `/attachments/mock-${index + 1}.pdf`,
        uploadedAt: createdAt
      }
    ] : [],
    
    // 협업자 (공유 노트인 경우)
    collaborators: Math.random() > 0.8 ? [
      {
        userId: 'user-1',
        role: 'editor',
        addedAt: createdAt
      },
      {
        userId: 'user-2',
        role: 'viewer',
        addedAt: createdAt
      }
    ] : [],
    
    // 날짜
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    deletedAt: null,
    
    // 검색 키워드 (자동 생성)
    searchKeywords: []
  };
};

/**
 * 목업 노트 목록 생성
 */
export const generateMockNotes = (count = 50) => {
  const notes = [];
  
  for (let i = 0; i < count; i++) {
    notes.push(generateMockNote(i));
  }
  
  // 최신 순으로 정렬
  return notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

/**
 * 목업 페이지네이션 응답 생성
 */
export const generateMockPaginationResponse = (notes, page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedNotes = notes.slice(startIndex, endIndex);
  
  return {
    data: paginatedNotes,
    currentPage: page,
    totalPages: Math.ceil(notes.length / limit),
    totalCount: notes.length,
    pageSize: limit,
    hasNext: endIndex < notes.length,
    hasPrev: page > 1
  };
};

/**
 * 목업 검색 응답 생성
 */
export const generateMockSearchResponse = (notes, query, limit = 20) => {
  const searchResults = notes.filter(note => 
    note.title.toLowerCase().includes(query.toLowerCase()) ||
    note.content.toLowerCase().includes(query.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );
  
  return {
    data: searchResults.slice(0, limit),
    totalCount: searchResults.length,
    query,
    limit
  };
};

/**
 * 목업 통계 응답 생성
 */
export const generateMockStatsResponse = (notes) => {
  const categories = {};
  const tags = {};
  
  notes.forEach(note => {
    // 카테고리 통계
    categories[note.category] = (categories[note.category] || 0) + 1;
    
    // 태그 통계
    note.tags.forEach(tag => {
      tags[tag] = (tags[tag] || 0) + 1;
    });
  });
  
  return {
    totalNotes: notes.length,
    totalViews: notes.reduce((sum, note) => sum + note.viewCount, 0),
    totalEdits: notes.reduce((sum, note) => sum + note.editCount, 0),
    favoriteCount: notes.filter(note => note.isFavorite).length,
    sharedCount: notes.filter(note => note.isShared).length,
    categories,
    tags,
    recentActivity: notes.slice(0, 10).map(note => ({
      type: 'edit',
      noteId: note._id,
      noteTitle: note.title,
      timestamp: note.updatedAt
    }))
  };
};

// 기본 목업 데이터 (50개 노트)
export const MOCK_NOTES = generateMockNotes(50);

// 개발용 플래그 (실제 배포 시 false로 변경)
export const USE_MOCK_DATA = false;