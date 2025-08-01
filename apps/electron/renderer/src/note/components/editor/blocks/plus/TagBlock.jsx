import React, { useState, useRef, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';

/**
 * TagBlock - 현대적인 태그 관리 블록 (완전 재설계)
 * @description 노션 스타일의 우아하고 미니멀한 태그 시스템
 */
const TagBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  placeholder = "태그를 입력하세요", 
  isEditing, 
  onEditingChange 
}) => {
  const [tags, setTags] = useState(block.content?.tags || []);
  const [newTagText, setNewTagText] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [editingTagId, setEditingTagId] = useState(null);
  const [editingText, setEditingText] = useState('');
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // 태그 색상 팔레트 (부드러운 파스텔 톤)
  const tagColors = [
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
    { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', hover: 'hover:bg-green-100' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:bg-orange-100' },
    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', hover: 'hover:bg-pink-100' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', hover: 'hover:bg-cyan-100' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', hover: 'hover:bg-indigo-100' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', hover: 'hover:bg-teal-100' },
  ];

  // 추천 태그 목록 (업무 관련 영어/한글)
  const suggestionTags = [
    // 기존 업무/개발/일정 태그
    // 업무 상태
    'Important', '중요', 'Urgent', '긴급', 'Review', '검토', 'Draft', '초안', 
    'Completed', '완료', 'In Progress', '진행중', 'Pending', '대기', 'Hold', '보류',
    'Priority', '우선순위', 'Todo', '할일', 'Done', '완료됨', 'Cancelled', '취소',
    
    // 업무 유형
    'Meeting', '회의', 'Project', '프로젝트', 'Task', '업무', 'Work', '작업',
    'Planning', '계획', 'Research', '조사', 'Analysis', '분석', 'Report', '보고서',
    'Presentation', '발표', 'Document', '문서', 'Proposal', '제안서',
    
    // 개발 관련
    'Development', '개발', 'Design', '디자인', 'Testing', '테스트', 'Bug', '버그',
    'Feature', '기능', 'Fix', '수정', 'Enhancement', '개선', 'Release', '릴리스',
    'Deploy', '배포', 'Code Review', '코드리뷰', 'Database', '데이터베이스',
    'API', 'Frontend', '프론트엔드', 'Backend', '백엔드', 'Mobile', '모바일',
    
    // 업무 분야
    'Marketing', '마케팅', 'Sales', '영업', 'Finance', '재무', 'HR', '인사',
    'Legal', '법무', 'Operations', '운영', 'Support', '지원', 'Training', '교육',
    'Quality', '품질', 'Security', '보안', 'Compliance', '컴플라이언스',
    
    // 업무 성격
    'Personal', '개인', 'Team', '팀', 'Client', '고객', 'Internal', '내부',
    'External', '외부', 'Feedback', '피드백', 'Discussion', '논의',
    'Decision', '결정', 'Approval', '승인', 'Budget', '예산',
    
    // 시간 관련
    'Daily', '일일', 'Weekly', '주간', 'Monthly', '월간', 'Quarterly', '분기',
    'Annual', '연간', 'Deadline', '마감일', 'Schedule', '일정', 'Timeline', '타임라인',
    
    // 기타 업무
    'Ideas', '아이디어', 'Notes', '노트', 'Reference', '참고', 'Resource', '자료',
    'Archive', '보관', 'Template', '템플릿', 'Checklist', '체크리스트',
    'Issue', '이슈', 'Risk', '위험', 'Opportunity', '기회', 'Goal', '목표',
    // --- 방대한 태그 추가 ---
    // 트렌드/소셜
    'Hot', 'Trending', 'Viral', 'SNS', 'Instagram', 'YouTube', 'TikTok', 'Twitter', 'Facebook', 'Blog', '커뮤니티', '이슈', '실시간', '인플루언서',
    // IT/기술
    'AI', '인공지능', 'ChatGPT', 'OpenAI', '클라우드', 'AWS', 'Azure', 'GCP', 'DevOps', 'Docker', 'Kubernetes', '블록체인', 'NFT', 'Web3', 'VR', 'AR', 'IoT', '빅데이터', '머신러닝', '딥러닝',
    // 라이프스타일/취미
    '여행', '맛집', '카페', '운동', '헬스', '요가', '러닝', '독서', '영화', '음악', '공연', '전시', '취미', '게임', '캠핑', '등산', '반려동물', '고양이', '강아지',
    // 감정/상태
    '행복', '기쁨', '슬픔', '분노', '피곤', '스트레스', '힐링', '감사', '설렘', '우울', '불안', '집중', '동기부여', '성장', '자기계발',
    // 지역/장소
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '경기', '강원', '충청', '전라', '경상', '제주', '해외', '일본', '미국', '유럽', '중국', '동남아',
    // 기타/이벤트
    '이벤트', '공지', '업데이트', 'FAQ', '문의', '고객센터', '리뷰', '추천', '베스트', '신상품', '할인', '쿠폰', '무료', '체험', '모집', '채용', '공모전', '세미나', '웨비나', '컨퍼런스',
    // 추가 카테고리
    '환경', '기후', '에너지', '재생에너지', '탄소중립', '친환경', '사회공헌', '봉사', '기부', '교육', '학습', '자격증', '시험', '입시', '졸업', '입학', '동아리', '동문', '멘토링', '멘티',
    '연애', '결혼', '육아', '가족', '친구', '관계', '소통', '커뮤니케이션', '리더십', '협업', '네트워킹', '창업', '스타트업', '투자', '재테크', '부동산', '주식', '코인', '보험', '연금',
    '건강', '의료', '병원', '약국', '치료', '예방', '운동', '다이어트', '영양', '식단', '요리', '레시피', '베이킹', '카페', '바리스타', '와인', '커피', '차', '음식', '디저트',
    '패션', '뷰티', '화장품', '헤어', '네일', '쇼핑', '브랜드', '명품', '아트', '디자인', '사진', '그림', '일러스트', '영상', '촬영', '편집', '유튜버', '크리에이터',
    '스포츠', '축구', '야구', '농구', '배구', '골프', '테니스', '수영', '스키', '보드', '마라톤', '사이클', 'e스포츠', '피트니스', '필라테스', '클라이밍',
    '자동차', '운전', '교통', '여객', '물류', '항공', '철도', '선박', '우주', '로켓', '위성', '드론', '로봇', '기계', '전자', '반도체', '부품', '제조', '생산',
    '정치', '경제', '사회', '문화', '역사', '철학', '종교', '예술', '문학', '언어', '심리', '과학', '수학', '물리', '화학', '생물', '지구과학', '천문',
    '뉴스', '속보', '칼럼', '사설', '논평', '인터뷰', '리포트', '분석', '통계', '데이터', '시사', '트렌드', '이슈', '핫이슈', '실검', '랭킹', '차트',
    // --- 일/업무/비즈니스 관련 태그 대량 추가 ---
    '직무', '직책', '직급', '사원', '대리', '과장', '차장', '부장', '임원', 'CEO', 'CTO', 'COO', 'CFO', 'CMO', 'CSO', 'CXO',
    '신입', '경력', '인턴', '프리랜서', '계약직', '정규직', '파트타임', '원격근무', '재택근무', '하이브리드', '출근', '퇴근',
    '출근길', '퇴근길', '야근', '주말근무', '교대근무', '유연근무', '워라밸', '직장문화', '사내정치', '팀워크', '조직문화', '사내동호회',
    '성과', '목표', 'KPI', 'OKR', '성과평가', '인사평가', '보상', '승진', '이직', '이직준비', '커리어', '경력관리', '멘토링', '멘티',
    '네트워킹', '협업', '콜라보', '파트너십', '외주', '프로젝트관리', 'PM', 'PO', 'Scrum', 'Agile', 'Kanban', '스프린트', '데일리',
    '회의', '미팅', '보고', '보고서', '업무일지', '업무보고', '주간보고', '월간보고', '결재', '승인', '지시', '피드백', '의사결정',
    '브레인스토밍', '아이디어회의', '문제해결', '이슈관리', '리스크관리', '위기관리', '컨설팅', '자문', '교육', '연수', '세미나', '워크샵',
    '산업', '제조업', '서비스업', 'IT', '금융', '보험', '유통', '물류', '건설', '부동산', '헬스케어', '바이오', '에너지', '환경', '공공', '정부',
    '리더십', '경영', '전략', '비전', '미션', '가치', '혁신', '창의', '동기부여', '자기계발', '성장', '목표관리', '시간관리', '생산성', '집중',
    '프레젠테이션', '스피치', '커뮤니케이션', '문서작성', '엑셀', '파워포인트', '워드', '보고서작성', '자료조사', '분석', '통계', '데이터분석',
    '고객', 'CS', 'VOC', '불만', '클레임', '고객만족', 'CRM', '마케팅', '세일즈', '영업', '프로모션', '브랜딩', '광고', 'PR', '홍보',
    '계약', '거래', '납품', '구매', '발주', '공급', '재고', '관리', '운영', '지원', '총무', '회계', '세무', '재무', '자금', '투자', 'IR',
    '채용', '인사', '복지', '급여', '연봉', '성과급', '보너스', '퇴직금', '노무', '노사', '노동', '노조', '근로', '근태', '출결',
    '법무', '계약서', '특허', '상표', '저작권', '소송', '분쟁', '규정', '컴플라이언스', '윤리', '보안', '정보보호', '개인정보', 'GDPR',
    '해외사업', '글로벌', '수출', '수입', '무역', '현지화', '번역', '통역', '출장', '해외지사', '현장', '공장', '지점', '본사', '지사',
    '벤처', '스타트업', '엑셀러레이터', 'VC', '엔젤', '투자자', '펀딩', '크라우드펀딩', 'IPO', '상장', 'M&A', '인수합병', '스톡옵션',
    // ... 필요시 더 추가 가능 ...

    // 3D 모델링 및 CAD(캐드) 관련 태그
    '3D', '3D모델링', '3D프린팅', '3D디자인', '3D렌더링', '3D스캔', '3D애니메이션', '3D그래픽', '3D아트', '3D엔진',
    'CAD', '캐드', 'AutoCAD', '오토캐드', 'SolidWorks', '솔리드웍스', 'Fusion360', '퓨전360', 'CATIA', '카티아',
    'Inventor', '인벤터', 'Rhino', '라이노', 'SketchUp', '스케치업', 'TinkerCAD', '틴커캐드', 'Revit', '레빗', 'BIM',
    'V-Ray', 'Vray', '브이레이', // vray 관련 태그 추가
    'STL', 'OBJ', 'STEP', 'IGES', '도면', '설계', '모델링', '도면작성', '기계설계', '건축설계', '전기설계', '구조설계',

    // 인테리어 관련 태그
    '인테리어', 'Interior', '실내디자인', '인테리어디자인', '홈스타일링', '리모델링', '리노베이션', '공간디자인', '공간연출',
    '가구', '가구디자인', '조명', '조명디자인', '소품', '소품디자인', '데코', '데코레이션', '벽지', '페인트', '마감재',
    '바닥재', '타일', '우드', '목재', '대리석', '세라믹', '유리', '금속', '패브릭', '커튼', '블라인드', '러그',
    '주방', '키친', '욕실', '화장실', '거실', '침실', '안방', '아이방', '서재', '드레스룸', '현관', '베란다', '발코니',
    '카페', '상업공간', '오피스', '사무실', '매장', '상가', '식당', '레스토랑', '호텔', '펜션', '리조트', '모텔',
    '카페인테리어', '상업인테리어', '주거인테리어', '빌라', '아파트', '오피스텔', '단독주택', '타운하우스', '전원주택',
    '미니멀', '모던', '북유럽', '내추럴', '클래식', '엔틱', '빈티지', '프로방스', '로맨틱', '인더스트리얼', '유니크',
    '럭셔리', '아트', '아트월', '포인트월', '컬러', '트렌드', '컨셉', '스타일링', '플랜테리어', '그린인테리어',
    '셀프인테리어', 'DIY', '홈카페', '홈오피스', '홈짐', '홈시네마', '홈테라스', '홈가드닝', '홈파티',
    '인테리어소품', '인테리어트렌드', '인테리어공사', '인테리어견적', '인테리어업체', '인테리어시공', '인테리어포트폴리오',
    '3D인테리어', 'VR인테리어', 'AR인테리어', '인테리어컨설팅', '인테리어디자이너', '인테리어플래너',
  ];

  // 태그 색상 할당 (해시 기반으로 일관성 있게)
  const getTagColor = useCallback((tagText) => {
    const hash = tagText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return tagColors[hash % tagColors.length];
  }, []);

  // 콘텐츠 업데이트
  const updateContent = useCallback(() => {
    onUpdate({
      content: {
        tags: tags.map(tag => ({
          id: tag.id || nanoid(),
          text: tag.text,
          color: tag.color || getTagColor(tag.text),
          createdAt: tag.createdAt || new Date().toISOString()
        }))
      }
    });
  }, [tags, onUpdate, getTagColor]);

  // 입력 필드 초기화
  const clearInput = useCallback(() => {
    setNewTagText('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 태그 추가
  const addTag = useCallback((tagText) => {
    const trimmedText = tagText.trim();
    if (!trimmedText || tags.some(tag => tag.text.toLowerCase() === trimmedText.toLowerCase())) {
      return;
    }

    const newTag = {
      id: nanoid(),
      text: trimmedText,
      color: getTagColor(trimmedText),
      createdAt: new Date().toISOString()
    };

    setTags(prev => [...prev, newTag]);
    clearInput();
    setTimeout(updateContent, 0);
  }, [tags, getTagColor, updateContent, clearInput]);

  // 태그 삭제
  const removeTag = useCallback((tagId) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
    setTimeout(updateContent, 0);
  }, [updateContent]);

  // 태그 편집 시작
  const startEditTag = useCallback((tagId, currentText) => {
    setEditingTagId(tagId);
    setEditingText(currentText);
  }, []);

  // 태그 편집 완료
  const finishEditTag = useCallback(() => {
    if (editingTagId && editingText.trim()) {
      const trimmedText = editingText.trim();
      // 중복 체크 (현재 편집 중인 태그 제외)
      const isDuplicate = tags.some(tag => 
        tag.id !== editingTagId && 
        tag.text.toLowerCase() === trimmedText.toLowerCase()
      );
      
      if (!isDuplicate) {
        setTags(prev => prev.map(tag => 
          tag.id === editingTagId 
            ? { ...tag, text: trimmedText, color: getTagColor(trimmedText) }
            : tag
        ));
        setTimeout(updateContent, 0);
      }
    }
    setEditingTagId(null);
    setEditingText('');
  }, [editingTagId, editingText, tags, getTagColor, updateContent]);

  // 태그 편집 취소
  const cancelEditTag = useCallback(() => {
    setEditingTagId(null);
    setEditingText('');
  }, []);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        const filteredSuggestions = suggestionTags.filter(suggestion =>
          suggestion.toLowerCase().includes(newTagText.toLowerCase()) &&
          !tags.some(tag => tag.text.toLowerCase() === suggestion.toLowerCase())
        );
        if (filteredSuggestions[selectedSuggestionIndex]) {
          addTag(filteredSuggestions[selectedSuggestionIndex]);
        }
      } else if (newTagText.trim()) {
        addTag(newTagText);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const filteredSuggestions = suggestionTags.filter(suggestion =>
        suggestion.toLowerCase().includes(newTagText.toLowerCase()) &&
        !tags.some(tag => tag.text.toLowerCase() === suggestion.toLowerCase())
      );
      setSelectedSuggestionIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const filteredSuggestions = suggestionTags.filter(suggestion =>
        suggestion.toLowerCase().includes(newTagText.toLowerCase()) &&
        !tags.some(tag => tag.text.toLowerCase() === suggestion.toLowerCase())
      );
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === 'Backspace' && !newTagText && tags.length > 0) {
      // 백스페이스로 마지막 태그 삭제
      removeTag(tags[tags.length - 1].id);
    }
  }, [newTagText, selectedSuggestionIndex, tags, addTag, removeTag]);

  // 추천 태그 클릭
  const handleSuggestionClick = useCallback((suggestion) => {
    addTag(suggestion);
  }, [addTag]);

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 필터된 추천 태그
  const filteredSuggestions = suggestionTags.filter(suggestion =>
    suggestion.toLowerCase().includes(newTagText.toLowerCase()) &&
    !tags.some(tag => tag.text.toLowerCase() === suggestion.toLowerCase())
  );

  return (
    <div 
      ref={containerRef}
      className="group relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onFocus}
    >
      <div className="space-y-3">
        
        {/* 태그 컨테이너 */}
        <div className="relative min-h-[48px] p-3">
          
          {/* 태그들과 입력 필드 */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* 기존 태그들 */}
            {tags.map((tag, index) => {
              const colorConfig = tag.color || getTagColor(tag.text);
              const isEditing = editingTagId === tag.id;
              
              return (
                <div
                  key={tag.id}
                  className={`
                    group/tag relative inline-flex items-center px-3 py-1.5 rounded-lg border
                    ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border} ${colorConfig.hover}
                    transition-all duration-200 transform hover:scale-105 animate-in fade-in duration-300
                    ${isEditing ? 'ring-2 ring-blue-300' : ''}
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {isEditing ? (
                    /* 편집 모드 */
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          finishEditTag();
                        } else if (e.key === 'Escape') {
                          e.stopPropagation();
                          cancelEditTag();
                        }
                      }}
                      onBlur={finishEditTag}
                      autoFocus
                      className={`
                        bg-transparent text-sm font-medium outline-none border-none
                        ${colorConfig.text} min-w-[60px] w-full
                      `}
                      style={{ width: `${Math.max(editingText.length * 8 + 20, 60)}px` }}
                    />
                  ) : (
                    /* 일반 모드 */
                    <>
                      <span 
                        className="text-sm font-medium cursor-pointer"
                        onDoubleClick={() => !readOnly && startEditTag(tag.id, tag.text)}
                      >
                        #{tag.text}
                      </span>
                      
                      {/* 태그 삭제 버튼만 */}
                      {!readOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTag(tag.id);
                          }}
                          className={`
                            ml-2 w-4 h-4 flex items-center justify-center rounded-full
                            ${colorConfig.text} opacity-0 group-hover/tag:opacity-100 
                            hover:bg-red-100 hover:text-red-600 transition-all duration-200
                          `}
                          title="삭제"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* 입력 필드 - 호버 또는 포커스 시에만 표시 */}
            {!readOnly && (isHovered || isInputFocused) && (
              <div className="flex-1 min-w-[120px] relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTagText}
                  onChange={(e) => {
                    setNewTagText(e.target.value);
                    
                    // 추천 태그 필터링
                    if (e.target.value.length > 0) {
                      const filteredSuggestions = suggestionTags.filter(suggestion =>
                        suggestion.toLowerCase().includes(e.target.value.toLowerCase()) &&
                        !tags.some(tag => tag.text.toLowerCase() === suggestion.toLowerCase())
                      );
                      setShowSuggestions(filteredSuggestions.length > 0);
                    } else {
                      setShowSuggestions(false);
                      setSelectedSuggestionIndex(-1);
                    }
                  }}
                  placeholder={tags.length === 0 ? placeholder : "새 태그 추가..."}
                  className="w-full bg-transparent text-gray-700 dark:text-gray-300 text-sm font-medium outline-none border-none placeholder-gray-400 dark:placeholder-gray-500"
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.4',
                    fontWeight: '500'
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => {
                    setIsInputFocused(false);
                    setTimeout(() => {
                      if (!containerRef.current?.contains(document.activeElement)) {
                        setShowSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      }
                    }, 100);
                  }}
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}
          </div>

          {/* 플레이스홀더 (태그가 없을 때) */}
          {tags.length === 0 && readOnly && (
            <div className="text-gray-400 dark:text-gray-500 text-sm italic">
              태그가 없습니다
            </div>
          )}
        </div>

        {/* 추천 태그 드롭다운 */}
        {!readOnly && showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">추천 태그</div>
              <div className="max-h-32 overflow-y-auto">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`
                      w-full text-left px-3 py-2 rounded text-sm transition-colors duration-150
                      ${index === selectedSuggestionIndex 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    #{suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 편의 기능 버튼들 (호버 시 표시) */}
        {!readOnly && isHovered && (
                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-2 animate-in fade-in duration-300">
            <div className="flex items-center space-x-3">
              <span>{tags.length}개의 태그</span>
              
              {/* 추천 태그 추가 버튼 - 기존 태그가 모두 추천 태그 목록에 있을 때만 표시 */}
              {tags.length > 0 && 
               tags.every(tag => suggestionTags.some(suggestion => 
                 suggestion.toLowerCase() === tag.text.toLowerCase()
               )) && (
                <button
                  onClick={() => {
                    // 추천 태그에서 미사용 태그들 추가
                    const unusedSuggestions = suggestionTags.filter(suggestion =>
                      !tags.some(tag => tag.text.toLowerCase() === suggestion.toLowerCase())
                    ).slice(0, 3);
                    
                    if (unusedSuggestions.length > 0) {
                      const newTags = unusedSuggestions.map(suggestion => ({
                        id: nanoid(),
                        text: suggestion,
                        color: getTagColor(suggestion),
                        createdAt: new Date().toISOString()
                      }));
                      
                      setTags(prev => [...prev, ...newTags]);
                      setTimeout(updateContent, 0);
                    }
                  }}
                  className="hover:text-blue-500 transition-colors duration-200"
                >
                  추천 태그 추가
                </button>
              )}
            </div>
            
            {tags.length > 0 && (
              <button
                onClick={() => {
                  setTags([]);
                  setTimeout(updateContent, 0);
                }}
                className="hover:text-red-500 transition-colors duration-200"
              >
                모두 삭제
              </button>
            )}
          </div>
        )}
      </div>

      {/* 커스텀 CSS 애니메이션 - CSS-in-JS 대신 Tailwind 클래스 사용 */}
    </div>
  );
};

export default TagBlock;