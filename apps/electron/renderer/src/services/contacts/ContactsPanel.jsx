/**
 * 연락처 서비스 메인 패널
 * 명함 스타일의 카드형 디자인
 */

import React, { useState } from 'react';
import ContactCard from './components/ContactCard';
import ContactDetailModal from './components/ContactDetailModal';
import ContactGroupPanel from './components/ContactGroupPanel';
import ContactSearchPanel from './components/ContactSearchPanel';

const ContactsPanel = ({ activePanel, onNotification }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // 모의 연락처 데이터 (실제로는 props나 context에서 받아옴)
  const mockContacts = [
    {
      id: 1,
      name: '김철수',
      position: 'Frontend Developer',
      company: 'Samsung Electronics',
      department: 'IT 개발팀',
      email: 'kim.chulsoo@samsung.com',
      phone: '010-1234-5678',
      avatar: null,
      tags: ['개발자', 'React', 'JavaScript'],
      location: '서울, 대한민국',
      joinDate: '2021-03-15',
      lastContact: '2024-01-15',
      status: 'active',
      backgroundColor: '#4285f4'
    },
    {
      id: 2,
      name: '이영희',
      position: 'UI/UX Designer',
      company: 'Naver Corporation',
      department: '디자인팀',
      email: 'lee.younghee@naver.com',
      phone: '010-2345-6789',
      avatar: null,
      tags: ['디자이너', 'Figma', 'UI/UX'],
      location: '경기도 성남시',
      joinDate: '2020-11-22',
      lastContact: '2024-01-10',
      status: 'active',
      backgroundColor: '#34a853'
    },
    {
      id: 3,
      name: '박민수',
      position: 'Product Manager',
      company: 'Kakao Corp',
      department: '프로덕트팀',
      email: 'park.minsu@kakao.com',
      phone: '010-3456-7890',
      avatar: null,
      tags: ['PM', '기획', 'Strategy'],
      location: '제주도',
      joinDate: '2019-08-10',
      lastContact: '2024-01-08',
      status: 'active',
      backgroundColor: '#fbbc04'
    },
    {
      id: 4,
      name: '최지혜',
      position: 'Backend Engineer',
      company: 'Coupang',
      department: '플랫폼개발팀',
      email: 'choi.jihye@coupang.com',
      phone: '010-4567-8901',
      avatar: null,
      tags: ['백엔드', 'Java', 'Spring'],
      location: '서울, 대한민국',
      joinDate: '2022-01-20',
      lastContact: '2024-01-05',
      status: 'active',
      backgroundColor: '#ea4335'
    },
    {
      id: 5,
      name: '정현우',
      position: 'DevOps Engineer',
      company: 'Line Plus',
      department: '인프라팀',
      email: 'jung.hyunwoo@linecorp.com',
      phone: '010-5678-9012',
      avatar: null,
      tags: ['DevOps', 'AWS', 'Docker'],
      location: '서울, 대한민국',
      joinDate: '2023-05-15',
      lastContact: '2024-01-03',
      status: 'active',
      backgroundColor: '#673ab7'
    },
    {
      id: 6,
      name: '송미라',
      position: 'Data Scientist',
      company: 'Baemin',
      department: '데이터팀',
      email: 'song.mira@woowahan.com',
      phone: '010-6789-0123',
      avatar: null,
      tags: ['데이터', 'Python', 'ML'],
      location: '서울, 대한민국',
      joinDate: '2021-09-30',
      lastContact: '2023-12-28',
      status: 'active',
      backgroundColor: '#ff6d00'
    }
  ];

  // 검색 필터링
  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 연락처 카드 클릭 핸들러
  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setIsDetailModalOpen(true);
  };

  // 연락처 액션 핸들러
  const handleContactAction = (action, contact) => {
    switch (action) {
      case 'call':
        window.open(`tel:${contact.phone}`);
        onNotification?.('전화 앱을 실행합니다.', 'info');
        break;
      case 'email':
        window.open(`mailto:${contact.email}`);
        onNotification?.('이메일 앱을 실행합니다.', 'info');
        break;
      case 'message':
        window.open(`sms:${contact.phone}`);
        onNotification?.('메시지 앱을 실행합니다.', 'info');
        break;
      case 'edit':
        onNotification?.('편집 기능은 준비 중입니다.', 'info');
        break;
      default:
        break;
    }
  };

  // 그룹 관리 패널 렌더링
  if (activePanel === 'groups') {
    return (
      <ContactGroupPanel
        activePanel={activePanel}
        onNotification={onNotification}
      />
    );
  }

  // 연락처 찾기 패널 렌더링
  if (activePanel === 'recent') {
    return (
      <ContactSearchPanel
        activePanel={activePanel}
        onNotification={onNotification}
      />
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">연락처</h1>
            <p className="text-sm text-gray-600">
              {filteredContacts.length}명의 연락처
            </p>
          </div>
          
          {/* 뷰 모드 전환 */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새 연락처
            </button>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="이름, 회사, 직책으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      {/* 연락처 목록 */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">연락처가 없습니다</h3>
            <p className="mt-2 text-gray-500">
              {searchQuery ? '검색 조건에 맞는 연락처가 없습니다.' : '새 연락처를 추가해보세요.'}
            </p>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }`}>
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                viewMode={viewMode}
                onClick={() => handleContactClick(contact)}
                onAction={(action) => handleContactAction(action, contact)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 연락처 상세보기 모달 */}
      <ContactDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        contact={selectedContact}
        onAction={handleContactAction}
      />
    </div>
  );
};

export default ContactsPanel;