/**
 * 템플릿 관리 Hook
 * 
 * @description 템플릿 데이터 관리, CRUD 작업, 상태 관리를 위한 커스텀 훅
 * @author AI Assistant
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';

export const useTemplates = () => {
  // 상태 관리
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  /**
   * 템플릿 목록 로드
   */
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: 실제 API 호출로 교체
      // const response = await fetch('/api/templates');
      // const data = await response.json();
      
      // Mock 데이터 - 다양한 카테고리별 템플릿
      const mockTemplates = [
        // 문서 카테고리
        {
          _id: 'template-1',
          name: '회의록 템플릿',
          description: '팀 회의록 작성을 위한 표준 템플릿',
          category: 'document',
          type: 'markdown',
          isShared: false,
          tags: ['회의', '업무', '문서'],
          content: `# 회의록\n\n## 회의 정보\n- **일시**: \n- **장소**: \n- **참석자**: \n- **회의 목적**: \n\n## 안건\n1. \n2. \n3. \n\n## 논의 내용\n\n## 결정 사항\n\n## 향후 계획`,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          createdBy: 'user1',
          usageCount: 25
        },
        {
          _id: 'template-2',
          name: '프로젝트 제안서',
          description: '새로운 프로젝트 제안을 위한 종합 템플릿',
          category: 'document',
          type: 'markdown',
          isShared: true,
          tags: ['프로젝트', '제안서', '기획'],
          content: `# 프로젝트 제안서\n\n## 프로젝트 개요\n- **프로젝트명**: \n- **제안자**: \n- **예상 기간**: \n- **예산**: \n\n## 프로젝트 목표\n\n## 주요 기능\n\n## 일정 계획\n\n## 리소스 요구사항\n\n## 기대 효과`,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18'),
          createdBy: 'user2',
          usageCount: 18
        },
        {
          _id: 'template-3',
          name: '사업 계획서',
          description: '창업 및 신사업을 위한 종합 사업계획서',
          category: 'document',
          type: 'markdown',
          isShared: true,
          tags: ['사업계획', '창업', '기획'],
          content: `# 사업 계획서\n\n## 요약\n### 사업 개요\n- **사업명**: \n- **사업 형태**: \n- **업종**: \n\n## 시장 분석\n\n## 제품/서비스\n\n## 마케팅 전략\n\n## 재무 계획`,
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-25'),
          createdBy: 'user1',
          usageCount: 12
        },
        {
          _id: 'template-4',
          name: '기술 명세서',
          description: '시스템 개발을 위한 기술 명세서 템플릿',
          category: 'document',
          type: 'markdown',
          isShared: false,
          tags: ['기술문서', '개발', '명세서'],
          content: `# 기술 명세서\n\n## 문서 정보\n- **프로젝트**: \n- **버전**: v1.0\n- **작성일**: \n\n## 시스템 아키텍처\n\n## 기술 요구사항\n\n## API 명세\n\n## 데이터베이스 설계`,
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-22'),
          createdBy: 'user3',
          usageCount: 8
        },
        {
          _id: 'template-5',
          name: '사용자 매뉴얼',
          description: '제품 사용자를 위한 상세 가이드',
          category: 'document',
          type: 'markdown',
          isShared: true,
          tags: ['매뉴얼', '가이드', '사용법'],
          content: `# 사용자 매뉴얼\n\n## 문서 정보\n- **제품명**: \n- **버전**: v1.0\n- **대상 사용자**: \n\n## 시작하기\n\n## 기본 기능\n\n## 고급 기능\n\n## 문제 해결\n\n## FAQ`,
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-20'),
          createdBy: 'user2',
          usageCount: 15
        },

        // 양식 카테고리
        {
          _id: 'template-6',
          name: '일일 업무 체크리스트',
          description: '매일 수행할 업무 체크리스트 양식',
          category: 'form',
          type: 'checklist',
          isShared: false,
          tags: ['체크리스트', '업무', '일일'],
          content: `# 일일 업무 체크리스트\n\n**날짜**: \n**작성자**: \n\n## 오늘의 목표\n- [ ] \n- [ ] \n- [ ] \n\n## 우선순위 업무\n- [ ] \n- [ ] \n- [ ] \n\n## 정기 업무\n- [ ] 이메일 확인\n- [ ] 진행 상황 보고\n- [ ] 일정 점검`,
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-22'),
          createdBy: 'user1',
          usageCount: 35
        },
        {
          _id: 'template-7',
          name: '직원 평가서',
          description: '직원 성과 평가를 위한 종합 평가 양식',
          category: 'form',
          type: 'form',
          isShared: true,
          tags: ['평가', '인사', 'HR'],
          content: `# 직원 평가서\n\n## 기본 정보\n- **평가 대상자**: \n- **사번**: \n- **부서**: \n- **평가자**: \n- **평가 기간**: \n\n## 성과 평가\n\n## 업무 품질 평가\n\n## 협업 및 리더십\n\n## 종합 평가`,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
          createdBy: 'user2',
          usageCount: 22
        },
        {
          _id: 'template-8',
          name: '프로젝트 진행 현황',
          description: '프로젝트 상태 추적 및 보고 양식',
          category: 'form',
          type: 'form',
          isShared: false,
          tags: ['프로젝트', '진행현황', '추적'],
          content: `# 프로젝트 진행 현황\n\n## 프로젝트 정보\n- **프로젝트명**: \n- **PM**: \n- **보고 기간**: \n\n## 진행 상황\n- **전체 진행률**: %\n- **주요 마일스톤**: \n\n## 이슈 및 위험요소\n\n## 다음 주 계획`,
          createdAt: new Date('2024-01-07'),
          updatedAt: new Date('2024-01-21'),
          createdBy: 'user1',
          usageCount: 19
        },
        {
          _id: 'template-9',
          name: '고객 피드백 수집',
          description: '고객 만족도 및 피드백 수집 양식',
          category: 'form',
          type: 'form',
          isShared: true,
          tags: ['고객', '피드백', '만족도'],
          content: `# 고객 피드백 수집\n\n## 고객 정보\n- **고객명**: \n- **회사명**: \n- **연락처**: \n\n## 제품/서비스 평가\n- **만족도**: \n- **추천 의향**: \n\n## 개선 사항\n\n## 추가 의견`,
          createdAt: new Date('2024-01-04'),
          updatedAt: new Date('2024-01-18'),
          createdBy: 'user3',
          usageCount: 14
        },
        {
          _id: 'template-10',
          name: '교육 계획서',
          description: '직원 교육 및 개발 계획 수립 양식',
          category: 'form',
          type: 'form',
          isShared: false,
          tags: ['교육', '개발', '계획'],
          content: `# 교육 계획서\n\n## 교육 개요\n- **교육명**: \n- **대상자**: \n- **기간**: \n- **담당자**: \n\n## 교육 목표\n\n## 교육 내용\n\n## 평가 방법\n\n## 예산 및 리소스`,
          createdAt: new Date('2024-01-09'),
          updatedAt: new Date('2024-01-23'),
          createdBy: 'user2',
          usageCount: 11
        },

        // 이메일 카테고리  
        {
          _id: 'template-11',
          name: '고객 문의 답변 이메일',
          description: '고객 문의에 대한 표준 답변 이메일 템플릿',
          category: 'email',
          type: 'email',
          isShared: true,
          tags: ['이메일', '고객', '답변'],
          content: `**제목**: Re: [고객 문의 제목]\n\n안녕하세요, [고객명]님.\n\n[회사명]을 이용해 주셔서 감사합니다.\n문의해 주신 내용에 대해 답변드리겠습니다.\n\n## 답변 내용\n[구체적인 답변]\n\n추가 문의사항이 있으시면 언제든지 연락 주시기 바랍니다.\n\n감사합니다.\n\n[담당자명]\n[연락처]`,
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-16'),
          createdBy: 'user3',
          usageCount: 28
        },
        {
          _id: 'template-12',
          name: '회의 초대 이메일',
          description: '회의 참석 요청을 위한 공식 초대 이메일',
          category: 'email',
          type: 'email',
          isShared: false,
          tags: ['회의', '초대', '일정'],
          content: `**제목**: [회의명] 회의 참석 요청\n\n안녕하세요.\n\n아래와 같이 회의를 개최하오니 참석 부탁드립니다.\n\n## 회의 정보\n- **일시**: [날짜] [시간]\n- **장소**: [회의실/온라인]\n- **참석자**: [참석자 목록]\n- **목적**: [회의 목적]\n\n## 안건\n1. [안건1]\n2. [안건2]\n\n참석 가능 여부를 [날짜]까지 회신 부탁드립니다.\n\n감사합니다.`,
          createdAt: new Date('2024-01-11'),
          updatedAt: new Date('2024-01-19'),
          createdBy: 'user1',
          usageCount: 16
        },
        {
          _id: 'template-13',
          name: '프로젝트 상태 보고',
          description: '프로젝트 진행 상황 공유를 위한 이메일',
          category: 'email',
          type: 'email',
          isShared: true,
          tags: ['프로젝트', '보고', '상태'],
          content: `**제목**: [프로젝트명] 주간 진행 보고\n\n안녕하세요.\n\n[프로젝트명]의 이번 주 진행 상황을 보고드립니다.\n\n## 주요 성과\n- [성과1]\n- [성과2]\n\n## 진행률\n- **전체**: [%] 완료\n- **이번 주**: [%] 진행\n\n## 이슈 사항\n[이슈 내용]\n\n## 다음 주 계획\n[계획 내용]\n\n감사합니다.`,
          createdAt: new Date('2024-01-06'),
          updatedAt: new Date('2024-01-17'),
          createdBy: 'user2',
          usageCount: 21
        },
        {
          _id: 'template-14',
          name: '신제품 출시 안내',
          description: '고객 대상 신제품 출시 공지 이메일',
          category: 'email',
          type: 'email',
          isShared: false,
          tags: ['신제품', '출시', '마케팅'],
          content: `**제목**: 🎉 [제품명] 출시 안내\n\n안녕하세요, [고객명]님!\n\n오랜 기다림 끝에 새로운 제품을 출시하게 되었습니다.\n\n## 새로운 기능\n- [기능1]\n- [기능2]\n- [기능3]\n\n## 특별 혜택\n- **얼리버드 할인**: [할인율]% (~ [날짜]까지)\n- **무료 체험**: [기간]\n\n지금 바로 체험해보세요!\n[링크]\n\n감사합니다.`,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-14'),
          createdBy: 'user3',
          usageCount: 9
        },
        {
          _id: 'template-15',
          name: '감사 인사 메일',
          description: '고객, 파트너, 직원에게 보내는 감사 메일',
          category: 'email',
          type: 'email',
          isShared: true,
          tags: ['감사', '인사', '관계'],
          content: `**제목**: 진심어린 감사의 말씀\n\n안녕하세요, [수신자명]님.\n\n바쁘신 중에도 [관련 내용]에 대해 도움을 주셔서 진심으로 감사드립니다.\n\n덕분에 [구체적인 결과나 성과]를 달성할 수 있었습니다.\n\n앞으로도 좋은 관계를 이어나가길 희망하며,\n다시 한번 깊은 감사의 말씀을 전합니다.\n\n감사합니다.\n\n[발신자명]`,
          createdAt: new Date('2024-01-13'),
          updatedAt: new Date('2024-01-24'),
          createdBy: 'user1',
          usageCount: 7
        }
      ];
      
      setTemplates(mockTemplates);
      
      // 템플릿 로드 후 stats 자동 업데이트
      const mockStats = {
        totalTemplates: mockTemplates.length,
        personalTemplates: mockTemplates.filter(t => !t.isShared).length,
        sharedTemplates: mockTemplates.filter(t => t.isShared).length,
        totalUsage: mockTemplates.reduce((sum, t) => sum + (t.usageCount || 0), 0)
      };
      setStats(mockStats);
    } catch (err) {
      setError('템플릿을 불러오는데 실패했습니다.');
      console.error('Load templates error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 카테고리 목록 로드
   */
  const loadCategories = useCallback(async () => {
    try {
      // TODO: 실제 API 호출로 교체
      const mockCategories = [
        { id: 'document', name: '문서', icon: '📄', color: 'blue' },
        { id: 'form', name: '양식', icon: '📋', color: 'green' },
        { id: 'email', name: '이메일', icon: '📧', color: 'purple' },
        { id: 'report', name: '보고서', icon: '📊', color: 'orange' }
      ];
      
      setCategories(mockCategories);
    } catch (err) {
      console.error('Load categories error:', err);
    }
  }, []);

  /**
   * 템플릿 생성
   */
  const createTemplate = useCallback(async (templateData) => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: 실제 API 호출로 교체
      const newTemplate = {
        _id: `template-${Date.now()}`,
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      };
      
      setTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    } catch (err) {
      setError('템플릿 생성에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 템플릿 업데이트
   */
  const updateTemplate = useCallback(async (templateId, templateData) => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: 실제 API 호출로 교체
      setTemplates(prev => prev.map(template => 
        template._id === templateId 
          ? { ...template, ...templateData, updatedAt: new Date() }
          : template
      ));
    } catch (err) {
      setError('템플릿 업데이트에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 템플릿 삭제
   */
  const deleteTemplate = useCallback(async (templateId) => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: 실제 API 호출로 교체
      setTemplates(prev => prev.filter(template => template._id !== templateId));
    } catch (err) {
      setError('템플릿 삭제에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 템플릿 복제
   */
  const duplicateTemplate = useCallback(async (templateId) => {
    setLoading(true);
    setError(null);
    
    try {
      const originalTemplate = templates.find(t => t._id === templateId);
      if (!originalTemplate) {
        throw new Error('템플릿을 찾을 수 없습니다.');
      }

      const duplicatedTemplate = {
        ...originalTemplate,
        _id: `template-${Date.now()}`,
        name: `${originalTemplate.name} (복사본)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      };
      
      setTemplates(prev => [duplicatedTemplate, ...prev]);
      return duplicatedTemplate;
    } catch (err) {
      setError('템플릿 복제에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [templates]);

  /**
   * 템플릿 목록 새로고침
   */
  const refreshTemplates = useCallback(async () => {
    await loadTemplates();
    // loadTemplates에서 이미 stats가 업데이트되므로 별도 호출 불필요
  }, [loadTemplates]);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 상태
    templates,
    categories,
    stats,
    loading,
    error,
    selectedTemplate,
    
    // 액션
    loadTemplates,
    loadCategories,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setSelectedTemplate,
    clearError,
    refreshTemplates
  };
};