import React, { useState, useEffect } from 'react';

const ExternalSyncPanel = ({
  isOpen,
  onClose,
  onSync,
  onDisconnect,
  connectedProviders = [],
  syncHistory = []
}) => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [credentials, setCredentials] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('providers');

  const providers = [
    {
      id: 'google',
      name: 'Google Calendar',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V2l-1.5 1.5zM19 19H9V9h10v10z"/>
          <path d="M11 11h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4 0h2v2h-2z"/>
        </svg>
      ),
      color: 'bg-blue-500',
      description: '구글 캘린더와 양방향 동기화',
      requiresAuth: true,
      authFields: ['email', 'refreshToken']
    },
    {
      id: 'outlook',
      name: 'Outlook Calendar',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10c0 5.5 3.9 10.7 9 12 5.1-1.3 9-6.5 9-12V7l-10-5z"/>
        </svg>
      ),
      color: 'bg-blue-600',
      description: 'Microsoft Outlook과 실시간 연동',
      requiresAuth: true,
      authFields: ['email', 'password']
    },
    {
      id: 'apple',
      name: 'Apple Calendar',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83"/>
        </svg>
      ),
      color: 'bg-gray-800',
      description: 'iCloud 캘린더 동기화',
      requiresAuth: true,
      authFields: ['appleId', 'appPassword']
    },
    {
      id: 'caldav',
      name: 'CalDAV',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2"/>
          <line x1="9" y1="9" x2="15" y2="9" strokeWidth="2"/>
          <line x1="9" y1="13" x2="15" y2="13" strokeWidth="2"/>
        </svg>
      ),
      color: 'bg-green-600',
      description: '표준 CalDAV 프로토콜 지원',
      requiresAuth: true,
      authFields: ['serverUrl', 'username', 'password']
    }
  ];

  const handleConnect = async () => {
    if (!selectedProvider || isConnecting) return;

    setIsConnecting(true);
    try {
      await onSync(selectedProvider, credentials);
      setCredentials({});
      setSelectedProvider('');
    } catch (error) {
      console.error('연결 실패:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (providerId) => {
    if (window.confirm('정말로 연결을 해제하시겠습니까?')) {
      await onDisconnect(providerId);
    }
  };

  const getProviderById = (id) => providers.find(p => p.id === id);

  const formatSyncTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">외부 캘린더 연동</h2>
              <p className="text-indigo-100 mt-1">다양한 캘린더 서비스와 동기화하세요</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('providers')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'providers' 
                  ? 'border-b-2 border-indigo-600 text-indigo-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              연동 서비스
            </button>
            <button
              onClick={() => setActiveTab('connected')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'connected' 
                  ? 'border-b-2 border-indigo-600 text-indigo-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              연결된 캘린더
              {connectedProviders.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-sm">
                  {connectedProviders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'history' 
                  ? 'border-b-2 border-indigo-600 text-indigo-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              동기화 기록
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* 연동 서비스 탭 */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedProvider === provider.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`${provider.color} text-white p-3 rounded-lg`}>
                        {provider.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{provider.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{provider.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 인증 폼 */}
              {selectedProvider && (
                <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-4">
                    {getProviderById(selectedProvider)?.name} 연결 설정
                  </h4>
                  <div className="space-y-4">
                    {getProviderById(selectedProvider)?.authFields.map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field === 'email' && '이메일'}
                          {field === 'password' && '비밀번호'}
                          {field === 'refreshToken' && '리프레시 토큰'}
                          {field === 'appleId' && 'Apple ID'}
                          {field === 'appPassword' && '앱 비밀번호'}
                          {field === 'serverUrl' && '서버 URL'}
                          {field === 'username' && '사용자명'}
                        </label>
                        <input
                          type={field.includes('password') || field.includes('Token') ? 'password' : 'text'}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder={`${field}를 입력하세요`}
                          value={credentials[field] || ''}
                          onChange={(e) => setCredentials({
                            ...credentials,
                            [field]: e.target.value
                          })}
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium"
                    >
                      {isConnecting ? '연결 중...' : '연결하기'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 연결된 캘린더 탭 */}
          {activeTab === 'connected' && (
            <div className="space-y-4">
              {connectedProviders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="mt-4 text-gray-500">연결된 캘린더가 없습니다</p>
                  <button
                    onClick={() => setActiveTab('providers')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    캘린더 연동하기
                  </button>
                </div>
              ) : (
                connectedProviders.map((connection) => {
                  const provider = getProviderById(connection.providerId);
                  return (
                    <div key={connection.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`${provider?.color || 'bg-gray-500'} text-white p-3 rounded-lg`}>
                            {provider?.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{provider?.name}</h4>
                            <p className="text-gray-600">
                              마지막 동기화: {formatSyncTime(connection.lastSync)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            connection.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {connection.status === 'active' ? '활성' : '비활성'}
                          </span>
                          <button
                            onClick={() => handleDisconnect(connection.providerId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 동기화 기록 탭 */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {syncHistory.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-gray-500">동기화 기록이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">서비스</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">작업</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">상태</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">시간</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">세부사항</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncHistory.map((history) => (
                        <tr key={history.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`${getProviderById(history.providerId)?.color || 'bg-gray-500'} text-white p-1.5 rounded`}>
                                {React.cloneElement(getProviderById(history.providerId)?.icon || <div/>, {
                                  className: 'w-4 h-4'
                                })}
                              </div>
                              <span className="font-medium">{getProviderById(history.providerId)?.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{history.action}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              history.status === 'success' 
                                ? 'bg-green-100 text-green-700'
                                : history.status === 'error'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {history.status === 'success' ? '성공' : history.status === 'error' ? '실패' : '진행중'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{formatSyncTime(history.timestamp)}</td>
                          <td className="py-3 px-4 text-gray-600 text-sm">{history.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExternalSyncPanel;