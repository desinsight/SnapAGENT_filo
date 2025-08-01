import React from 'react';

const DevelopmentPreviewPanel = ({ 
  isOpen, 
  onClose, 
  title = "기능 준비중", 
  description = "해당 기능은 현재 개발 중입니다.",
  expectedFeatures = [],
  comingSoonDate = null,
  category = "general" // notification, location, module, public_link
}) => {
  
  const getCategoryInfo = (category) => {
    switch (category) {
      case 'notification':
        return {
          features: [
            '알림 템플릿 라이브러리',
            '알림 발송 테스트 시스템',
            '상세 발송 통계 및 분석',
            '다채널 알림 통합 관리',
            'A/B 테스트 기능',
            '자동화 워크플로우'
          ]
        };
      case 'location':
        return {
          features: [
            '위치 정보 자동 검증',
            '주소 표준화 및 정규화',
            '실시간 교통 정보 연동',
            '경로 최적화 제안',
            '지역별 날씨 정보',
            '주변 편의시설 정보'
          ]
        };
      case 'module':
        return {
          features: [
            '모듈 평가 및 리뷰 시스템',
            '상세 사용 통계',
            '성능 모니터링',
            'API 사용량 분석',
            '모듈 추천 엔진',
            '개발자 대시보드'
          ]
        };
      case 'public_link':
        return {
          features: [
            '링크 접근 상세 통계',
            '지역별 접근 분석',
            '시간대별 트래픽 분석',
            '보안 강화 옵션',
            '브랜딩 커스터마이징',
            '소셜 미디어 연동'
          ]
        };
      default:
        return {
          features: expectedFeatures
        };
    }
  };

  const categoryInfo = getCategoryInfo(category);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-300">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">{title}</h2>
              <p className="text-gray-600">{description}</p>
              {comingSoonDate && (
                <div className="mt-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-1 text-sm text-gray-700">
                  예상 출시: {comingSoonDate}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6">
          {/* 개발 상태 */}
          <div className="bg-gray-50 border-l-4 border-gray-400 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="font-medium text-gray-900">개발 진행 상황</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 border border-gray-300 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900">기획 완료</p>
                <p className="text-xs text-gray-600 mt-1">UI/UX 설계 완료</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 border border-gray-300 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900">개발 진행중</p>
                <p className="text-xs text-gray-600 mt-1">백엔드 API 구현 중</p>
              </div>
              <div className="text-center opacity-50">
                <div className="w-12 h-12 bg-gray-200 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">테스트 대기</p>
                <p className="text-xs text-gray-400 mt-1">품질 검증 예정</p>
              </div>
            </div>
          </div>

          {/* 예정 기능 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">구현 예정 기능</h3>
            <div className="space-y-2">
              {categoryInfo.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-gray-900">{feature}</p>
                  </div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 개발 로드맵 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">개발 로드맵</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-gray-600 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Phase 1: 핵심 기능 구현</p>
                  <p className="text-sm text-gray-600">기본적인 CRUD 기능 및 사용자 인터페이스</p>
                </div>
                <span className="text-sm text-gray-600">완료</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-gray-400 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Phase 2: 고급 기능 개발</p>
                  <p className="text-sm text-gray-600">통계, 분석, 자동화 기능 추가</p>
                </div>
                <span className="text-sm text-gray-600">진행중</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-gray-300 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Phase 3: AI 및 머신러닝</p>
                  <p className="text-sm text-gray-600">스마트 추천, 예측 분석 기능</p>
                </div>
                <span className="text-sm text-gray-500">예정</span>
              </div>
            </div>
          </div>

          {/* 기술 스택 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">사용 기술</h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'Node.js', 'MongoDB', 'Express.js', 'TailwindCSS', 'JWT', 'Socket.io', 'Redis'].map((tech, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm border border-gray-300">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* 베타 테스트 신청 */}
          <div className="bg-gray-50 p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">베타 테스트에 참여하세요</h3>
            <p className="text-gray-600 mb-4">
              새로운 기능을 가장 먼저 체험하고 피드백을 제공해주세요.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button className="px-6 py-3 bg-gray-800 text-white hover:bg-gray-900">
                베타 테스트 신청
              </button>
              <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                개발 진행 상황 알림받기
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>문의: dev@calendar.com</span>
              <span>Slack: #calendar-dev</span>
            </div>
            <div className="flex items-center gap-2">
              <span>마지막 업데이트:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentPreviewPanel;