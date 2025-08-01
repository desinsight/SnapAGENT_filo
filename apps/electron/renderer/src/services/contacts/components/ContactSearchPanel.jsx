/**
 * 연락처 찾기 패널 (외부 전문가 검색)
 * 리멤버 스타일의 비즈니스 네트워킹 기능
 */

import React, { useState } from 'react';
import ExpertCard from './ExpertCard';
import ContactRequestModal from './ContactRequestModal';

const ContactSearchPanel = ({ activePanel, onNotification }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    jobTitle: '',
    industry: '',
    company: '',
    experience: '',
    location: ''
  });
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // 모의 외부 전문가 데이터
  const mockExperts = [
    {
      id: 1,
      name: '김개발',
      jobTitle: 'Senior Frontend Developer',
      company: 'Naver',
      industry: 'IT/소프트웨어',
      experience: '8년',
      location: '서울, 한국',
      bio: 'React, Vue.js 전문가. 10만+ 사용자 서비스 개발 경험',
      skills: ['React', 'Vue.js', 'TypeScript', 'Node.js'],
      avatar: null,
      connectionCount: 234,
      mutualConnections: 5,
      verified: true,
      responseRate: 95
    },
    {
      id: 2,
      name: '이디자인',
      jobTitle: 'UX Design Lead',
      company: 'Kakao',
      industry: 'IT/소프트웨어',
      experience: '6년',
      location: '서울, 한국',
      bio: 'B2C 서비스 UX 디자인 전문가. 사용자 중심 디자인 철학',
      skills: ['Figma', 'Sketch', 'User Research', 'Prototyping'],
      avatar: null,
      connectionCount: 189,
      mutualConnections: 8,
      verified: true,
      responseRate: 88
    },
    {
      id: 3,
      name: '박마케팅',
      jobTitle: 'Growth Marketing Manager',
      company: 'Coupang',
      industry: '이커머스',
      experience: '5년',
      location: '서울, 한국',
      bio: '데이터 기반 성장 마케팅 전문가. MAU 300% 증가 달성',
      skills: ['Growth Hacking', 'Google Analytics', 'A/B Testing', 'SQL'],
      avatar: null,
      connectionCount: 156,
      mutualConnections: 3,
      verified: true,
      responseRate: 92
    },
    {
      id: 4,
      name: '정데이터',
      jobTitle: 'Data Scientist',
      company: 'Line',
      industry: 'IT/소프트웨어',
      experience: '7년',
      location: '서울, 한국',
      bio: 'AI/ML 기반 추천 시스템 개발 및 빅데이터 분석 전문가',
      skills: ['Python', 'TensorFlow', 'Spark', 'Machine Learning'],
      avatar: null,
      connectionCount: 278,
      mutualConnections: 12,
      verified: true,
      responseRate: 89
    },
    {
      id: 5,
      name: '최세일즈',
      jobTitle: 'Enterprise Sales Director',
      company: 'Salesforce',
      industry: 'SaaS/클라우드',
      experience: '12년',
      location: '서울, 한국',
      bio: '엔터프라이즈 B2B 세일즈 전문가. 연매출 100억 달성',
      skills: ['B2B Sales', 'CRM', 'Enterprise Solutions', 'Account Management'],
      avatar: null,
      connectionCount: 445,
      mutualConnections: 7,
      verified: true,
      responseRate: 94
    }
  ];

  // 직무 필터 옵션
  const jobTitleOptions = [
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'UX Designer', 'UI Designer', 'Product Designer',
    'Product Manager', 'Project Manager', 'Scrum Master',
    'Data Scientist', 'Data Analyst', 'ML Engineer',
    'Marketing Manager', 'Growth Marketer', 'Digital Marketer',
    'Sales Manager', 'Business Development', 'Account Manager'
  ];

  // 산업 필터 옵션
  const industryOptions = [
    'IT/소프트웨어', '이커머스', '핀테크', '게임',
    'SaaS/클라우드', '헬스케어', '에듀테크', '푸드테크',
    '모빌리티', '부동산테크', '미디어/콘텐츠', '광고/마케팅'
  ];

  // 경력 필터 옵션
  const experienceOptions = [
    '1-2년', '3-5년', '6-10년', '10년 이상'
  ];

  // 지역 필터 옵션
  const locationOptions = [
    '서울', '경기도', '부산', '대구', '인천', '기타'
  ];

  // 필터 변경 핸들러
  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // 필터 초기화
  const resetFilters = () => {
    setSelectedFilters({
      jobTitle: '',
      industry: '',
      company: '',
      experience: '',
      location: ''
    });
    setSearchQuery('');
  };

  // 검색 및 필터링된 전문가 목록
  const filteredExperts = mockExperts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesJobTitle = !selectedFilters.jobTitle || 
                           expert.jobTitle.toLowerCase().includes(selectedFilters.jobTitle.toLowerCase());
    const matchesIndustry = !selectedFilters.industry || expert.industry === selectedFilters.industry;
    const matchesCompany = !selectedFilters.company || 
                          expert.company.toLowerCase().includes(selectedFilters.company.toLowerCase());
    const matchesExperience = !selectedFilters.experience || expert.experience.includes(selectedFilters.experience.split('-')[0]);
    const matchesLocation = !selectedFilters.location || expert.location.includes(selectedFilters.location);

    return matchesSearch && matchesJobTitle && matchesIndustry && matchesCompany && matchesExperience && matchesLocation;
  });

  // 연결 요청 핸들러
  const handleContactRequest = (expert) => {
    setSelectedExpert(expert);
    setIsContactModalOpen(true);
  };

  // 연결 요청 전송
  const handleSendContactRequest = (message) => {
    onNotification?.(`${selectedExpert.name}님에게 연결 요청을 보냈습니다.`, 'success');
    setIsContactModalOpen(false);
    setSelectedExpert(null);
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">연락처 찾기</h1>
            <p className="text-sm text-gray-600">
              {filteredExperts.length}명의 전문가가 검색되었습니다
            </p>
          </div>
          
          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            필터 초기화
          </button>
        </div>

        {/* 검색 바 */}
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="이름, 직무, 회사, 스킬로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 필터 옵션 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <select
            value={selectedFilters.jobTitle}
            onChange={(e) => handleFilterChange('jobTitle', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">직무 전체</option>
            {jobTitleOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select
            value={selectedFilters.industry}
            onChange={(e) => handleFilterChange('industry', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">산업 전체</option>
            {industryOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="회사명"
            value={selectedFilters.company}
            onChange={(e) => handleFilterChange('company', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <select
            value={selectedFilters.experience}
            onChange={(e) => handleFilterChange('experience', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">경력 전체</option>
            {experienceOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select
            value={selectedFilters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">지역 전체</option>
            {locationOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 전문가 목록 */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredExperts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-600">다른 검색어나 필터를 시도해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                onContactRequest={() => handleContactRequest(expert)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 연결 요청 모달 */}
      {isContactModalOpen && selectedExpert && (
        <ContactRequestModal
          expert={selectedExpert}
          onClose={() => {
            setIsContactModalOpen(false);
            setSelectedExpert(null);
          }}
          onSend={handleSendContactRequest}
        />
      )}
    </div>
  );
};

export default ContactSearchPanel;