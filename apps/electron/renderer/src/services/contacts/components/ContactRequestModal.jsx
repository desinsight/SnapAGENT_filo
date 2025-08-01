/**
 * 연결 요청 모달 컴포넌트
 */

import React, { useState } from 'react';

const ContactRequestModal = ({ expert, onClose, onSend }) => {
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState('connect'); // 'connect' | 'question' | 'collaboration'
  const [errors, setErrors] = useState({});

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const requestTypes = [
    {
      id: 'connect',
      label: '네트워킹',
      description: '새로운 인맥을 만들어 정보를 교환하고 싶습니다',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'question',
      label: '질문/조언',
      description: '업무나 커리어에 대한 질문이 있습니다',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'collaboration',
      label: '협업 제안',
      description: '프로젝트나 비즈니스 협업을 제안하고 싶습니다',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
        </svg>
      )
    }
  ];

  const messageTemplates = {
    connect: `안녕하세요 ${expert.name}님,\n\n저는 [본인 소개]이고, ${expert.company}에서 ${expert.jobTitle}로 활동하고 계신 것을 보고 연락드렸습니다.\n\n[연결 요청 이유를 간단히 설명해주세요]\n\n좋은 인연이 되었으면 좋겠습니다. 감사합니다.`,
    question: `안녕하세요 ${expert.name}님,\n\n${expert.jobTitle} 분야에서 경험이 풍부하신 것을 보고 연락드렸습니다.\n\n[구체적인 질문이나 조언을 구하고 싶은 내용을 작성해주세요]\n\n바쁘신 중에도 시간을 내어 답변해주시면 정말 감사하겠습니다.`,
    collaboration: `안녕하세요 ${expert.name}님,\n\n${expert.company}에서의 ${expert.jobTitle} 경험을 보고 연락드렸습니다.\n\n[협업 제안 내용을 구체적으로 설명해주세요]\n\n관심이 있으시다면 자세한 내용을 논의해보면 좋겠습니다.`
  };

  const handleRequestTypeChange = (type) => {
    setRequestType(type);
    setMessage(messageTemplates[type]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!message.trim()) {
      newErrors.message = '메시지를 입력해주세요.';
    } else if (message.trim().length < 10) {
      newErrors.message = '메시지는 최소 10자 이상 입력해주세요.';
    } else if (message.trim().length > 1000) {
      newErrors.message = '메시지는 1000자 이하로 입력해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSend(message.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">연결 요청</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 전문가 정보 */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
              {getInitials(expert.name)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-lg font-semibold text-gray-900">{expert.name}</h4>
                {expert.verified && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-600">{expert.jobTitle}</p>
              <p className="text-sm text-gray-500">{expert.company} • {expert.industry}</p>
            </div>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* 요청 유형 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                연결 요청 유형
              </label>
              <div className="space-y-3">
                {requestTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      requestType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requestType"
                      value={type.id}
                      checked={requestType === type.id}
                      onChange={() => handleRequestTypeChange(type.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`${requestType === type.id ? 'text-blue-600' : 'text-gray-400'}`}>
                          {type.icon}
                        </span>
                        <span className="font-medium text-gray-900">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 메시지 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메시지 *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="개인적이고 진정성 있는 메시지를 작성해주세요..."
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">{errors.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {message.length}/1000자
              </p>
            </div>

            {/* 팁 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h5 className="text-sm font-medium text-blue-900">연결 요청 팁</h5>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• 본인을 간단히 소개해주세요</li>
                    <li>• 연결을 원하는 구체적인 이유를 설명해주세요</li>
                    <li>• 상대방에게 도움이 될 수 있는 부분을 언급해주세요</li>
                    <li>• 정중하고 진정성 있는 톤으로 작성해주세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              연결 요청 보내기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactRequestModal;