import React, { useState } from 'react';

const PricingPanel = ({ onNotification }) => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: '개인 사용자를 위한 기본 플랜',
      price: { monthly: 0, yearly: 0 },
      features: [
        '파일 저장 용량 5GB',
        '기본 AI 기능 제한적 사용',
        '최대 3개 서비스 이용',
        '이메일 지원',
        '광고 포함'
      ],
      color: 'from-gray-500 to-gray-600',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      description: '전문가를 위한 고급 플랜',
      price: { monthly: 19000, yearly: 190000 },
      features: [
        '파일 저장 용량 100GB',
        '모든 AI 기능 무제한 사용',
        '모든 서비스 이용 가능',
        '우선 지원',
        '광고 없음',
        '고급 분석 및 리포트',
        '팀 협업 기능'
      ],
      color: 'from-blue-500 to-indigo-600',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: '기업을 위한 맞춤형 솔루션',
      price: { monthly: 49000, yearly: 490000 },
      features: [
        '무제한 파일 저장',
        'AI 기능 + 커스텀 모델',
        '모든 서비스 + 기업용 기능',
        '24/7 전담 지원',
        '온프레미스 배포 가능',
        '고급 보안 및 관리',
        'API 및 통합 지원',
        '맞춤형 교육 제공'
      ],
      color: 'from-purple-500 to-pink-600',
      popular: false
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">요금제</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            필요에 맞는 플랜을 선택하세요
          </p>
          
          {/* 빌링 사이클 토글 */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
              월간 결제
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                billingCycle === 'yearly' ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
              연간 결제
            </span>
            {billingCycle === 'yearly' && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                2개월 무료!
              </span>
            )}
          </div>
        </div>

        {/* 요금제 카드들 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden ${
                plan.popular ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center py-2 text-sm font-semibold">
                  가장 인기 있는 플랜
                </div>
              )}
              
              <div className={`p-8 ${plan.popular ? 'pt-14' : ''}`}>
                {/* 플랜 헤더 */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{plan.description}</p>
                  
                  {/* 가격 */}
                  <div className="mb-6">
                    {plan.price[billingCycle] === 0 ? (
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">무료</div>
                    ) : (
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          ₩{formatPrice(plan.price[billingCycle])}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          / {billingCycle === 'monthly' ? '월' : '년'}
                        </div>
                        {billingCycle === 'yearly' && plan.price.monthly > 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            월 ₩{formatPrice(Math.round(plan.price.yearly / 12))} (월간 대비 17% 절약)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 기능 목록 */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* 버튼 */}
                <button
                  onClick={() => onNotification(`${plan.name} 플랜 선택됨`, 'success')}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.id === 'free' ? '시작하기' : '구독하기'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">자주 묻는 질문</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">언제든지 플랜을 변경할 수 있나요?</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 변경사항은 다음 결제 주기부터 적용됩니다.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">무료 체험 기간이 있나요?</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Pro 플랜과 Enterprise 플랜은 14일 무료 체험을 제공합니다. 신용카드 정보 없이도 체험 가능합니다.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">환불 정책은 어떻게 되나요?</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                30일 환불 보장 정책을 제공합니다. 서비스에 만족하지 않으시면 전액 환불해드립니다.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">기업용 맞춤 상담이 가능한가요?</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                네, Enterprise 플랜의 경우 전담 컨설턴트가 맞춤형 상담을 제공하며, 특별 할인도 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPanel;