import React, { useState, useEffect, useMemo } from 'react';

const AttendeeStatsPanel = ({
  isOpen,
  onClose,
  event,
  attendees = [],
  attendanceHistory = [],
  onUpdateAttendance,
  onExportAttendanceReport,
  onSendAttendanceReminder,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState('stats');
  const [selectedAttendees, setSelectedAttendees] = useState(new Set());
  const [filterPeriod, setFilterPeriod] = useState('thisMonth');
  const [showQRCode, setShowQRCode] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState('all');

  // 참석자 통계 계산
  const attendeeStats = useMemo(() => {
    const stats = {
      total: attendees.length,
      responded: 0,
      accepted: 0,
      declined: 0,
      tentative: 0,
      pending: 0,
      attended: 0,
      noShow: 0,
      late: 0,
      responseRate: 0,
      attendanceRate: 0
    };

    attendees.forEach(attendee => {
      // RSVP 통계
      if (attendee.rsvp?.status) {
        stats.responded++;
        stats[attendee.rsvp.status]++;
      } else {
        stats.pending++;
      }

      // 실제 출석 통계
      if (attendee.attendance?.status) {
        switch (attendee.attendance.status) {
          case 'present':
            stats.attended++;
            break;
          case 'absent':
            stats.noShow++;
            break;
          case 'late':
            stats.late++;
            stats.attended++; // 늦어도 참석함
            break;
        }
      }
    });

    stats.responseRate = stats.total > 0 ? (stats.responded / stats.total * 100).toFixed(1) : 0;
    stats.attendanceRate = stats.total > 0 ? (stats.attended / stats.total * 100).toFixed(1) : 0;

    return stats;
  }, [attendees]);

  // 부서별 통계
  const departmentStats = useMemo(() => {
    const stats = {};
    attendees.forEach(attendee => {
      const dept = attendee.department || '미분류';
      if (!stats[dept]) {
        stats[dept] = { total: 0, accepted: 0, attended: 0 };
      }
      stats[dept].total++;
      if (attendee.rsvp?.status === 'accepted') stats[dept].accepted++;
      if (attendee.attendance?.status === 'present' || attendee.attendance?.status === 'late') stats[dept].attended++;
    });
    return stats;
  }, [attendees]);

  // 시간별 출석 통계 (체크인 시간 분석)
  const timeStats = useMemo(() => {
    const hourlyData = {};
    attendees.forEach(attendee => {
      if (attendee.attendance?.checkedInAt) {
        const hour = new Date(attendee.attendance.checkedInAt).getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
      }
    });
    return hourlyData;
  }, [attendees]);

  const handleBulkAttendanceUpdate = async (status) => {
    if (selectedAttendees.size === 0) return;
    
    const attendeeIds = Array.from(selectedAttendees);
    for (const attendeeId of attendeeIds) {
      await onUpdateAttendance(attendeeId, {
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.id
      });
    }
    setSelectedAttendees(new Set());
  };

  const generateQRCode = () => {
    // QR 코드 생성 로직 (실제로는 QR 라이브러리 사용)
    const checkInUrl = `${window.location.origin}/checkin/${event.id}`;
    return checkInUrl;
  };

  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'absent': return 'bg-red-100 text-red-700';
      case 'late': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRSVPStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'declined': return 'bg-red-100 text-red-700';
      case 'tentative': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">참석자 통계 & 출석 관리</h2>
              <p className="text-teal-100 mt-1">{event?.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQRCode(true)}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                QR 체크인
              </button>
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
        </div>

        {/* 탭 메뉴 */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'stats' 
                  ? 'border-b-2 border-teal-600 text-teal-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              통계 대시보드
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'attendance' 
                  ? 'border-b-2 border-teal-600 text-teal-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              출석 관리
              {selectedAttendees.size > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-teal-100 text-teal-600 rounded-full text-sm">
                  {selectedAttendees.size}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'reports' 
                  ? 'border-b-2 border-teal-600 text-teal-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              리포트
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* 통계 대시보드 탭 */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* 주요 지표 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{attendeeStats.total}</p>
                      <p className="text-sm text-blue-700">총 참석자</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900">{attendeeStats.responseRate}%</p>
                      <p className="text-sm text-green-700">응답률</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900">{attendeeStats.attended}</p>
                      <p className="text-sm text-purple-700">실제 참석</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-900">{attendeeStats.attendanceRate}%</p>
                      <p className="text-sm text-orange-700">출석률</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RSVP 상태 분포 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">RSVP 응답 분포</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-green-600">{attendeeStats.accepted}</span>
                    </div>
                    <p className="text-sm text-gray-600">참석</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-red-600">{attendeeStats.declined}</span>
                    </div>
                    <p className="text-sm text-gray-600">불참</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-yellow-600">{attendeeStats.tentative}</span>
                    </div>
                    <p className="text-sm text-gray-600">미정</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-gray-600">{attendeeStats.pending}</span>
                    </div>
                    <p className="text-sm text-gray-600">미응답</p>
                  </div>
                </div>
              </div>

              {/* 부서별 통계 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">부서별 참석 현황</h3>
                <div className="space-y-3">
                  {Object.entries(departmentStats).map(([dept, stats]) => (
                    <div key={dept} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{dept}</h4>
                        <p className="text-sm text-gray-600">
                          총 {stats.total}명 | 응답 {stats.accepted}명 | 출석 {stats.attended}명
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">응답률</p>
                          <p className="font-semibold text-green-600">
                            {stats.total > 0 ? Math.round(stats.accepted / stats.total * 100) : 0}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">출석률</p>
                          <p className="font-semibold text-blue-600">
                            {stats.total > 0 ? Math.round(stats.attended / stats.total * 100) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 출석 관리 탭 */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* 일괄 작업 도구 */}
              {selectedAttendees.size > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-teal-800">
                      {selectedAttendees.size}명 선택됨
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBulkAttendanceUpdate('present')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        출석 처리
                      </button>
                      <button
                        onClick={() => handleBulkAttendanceUpdate('absent')}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        결석 처리
                      </button>
                      <button
                        onClick={() => handleBulkAttendanceUpdate('late')}
                        className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                      >
                        지각 처리
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 필터 */}
              <div className="flex items-center gap-4">
                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">전체</option>
                  <option value="present">출석</option>
                  <option value="absent">결석</option>
                  <option value="late">지각</option>
                  <option value="pending">미처리</option>
                </select>
              </div>

              {/* 참석자 목록 */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedAttendees.size === attendees.length && attendees.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAttendees(new Set(attendees.map(a => a.id)));
                              } else {
                                setSelectedAttendees(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          참석자
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          RSVP
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          출석 상태
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          체크인 시간
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendees
                        .filter(attendee => {
                          if (attendanceFilter === 'all') return true;
                          if (attendanceFilter === 'pending') return !attendee.attendance?.status;
                          return attendee.attendance?.status === attendanceFilter;
                        })
                        .map(attendee => (
                        <tr key={attendee.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedAttendees.has(attendee.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedAttendees);
                                if (e.target.checked) {
                                  newSelected.add(attendee.id);
                                } else {
                                  newSelected.delete(attendee.id);
                                }
                                setSelectedAttendees(newSelected);
                              }}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-gray-700">
                                  {attendee.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{attendee.name}</p>
                                <p className="text-sm text-gray-600">{attendee.email}</p>
                                {attendee.department && (
                                  <p className="text-xs text-gray-500">{attendee.department}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              getRSVPStatusColor(attendee.rsvp?.status)
                            }`}>
                              {attendee.rsvp?.status === 'accepted' ? '참석' :
                               attendee.rsvp?.status === 'declined' ? '불참' :
                               attendee.rsvp?.status === 'tentative' ? '미정' : '미응답'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              getAttendanceStatusColor(attendee.attendance?.status)
                            }`}>
                              {attendee.attendance?.status === 'present' ? '출석' :
                               attendee.attendance?.status === 'absent' ? '결석' :
                               attendee.attendance?.status === 'late' ? '지각' : '미처리'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {attendee.attendance?.checkedInAt ? 
                              new Date(attendee.attendance.checkedInAt).toLocaleTimeString() : 
                              '-'
                            }
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={attendee.attendance?.status || ''}
                                onChange={(e) => onUpdateAttendance(attendee.id, {
                                  status: e.target.value,
                                  updatedAt: new Date().toISOString(),
                                  updatedBy: currentUser.id
                                })}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="">선택</option>
                                <option value="present">출석</option>
                                <option value="absent">결석</option>
                                <option value="late">지각</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 리포트 탭 */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">출석 리포트 내보내기</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">리포트 형식</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                      <option value="excel">Excel (.xlsx)</option>
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">포함할 데이터</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">RSVP 응답</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">실제 출석</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">체크인 시간</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">부서별 통계</span>
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onExportAttendanceReport}
                  className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  리포트 내보내기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* QR 코드 모달 */}
        {showQRCode && (
          <QRCodeModal
            event={event}
            checkInUrl={generateQRCode()}
            onClose={() => setShowQRCode(false)}
          />
        )}
      </div>
    </div>
  );
};

// QR 코드 모달 컴포넌트
const QRCodeModal = ({ event, checkInUrl, onClose }) => {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">QR 체크인 코드</h3>
          
          {/* QR 코드 영역 (실제로는 QR 라이브러리 사용) */}
          <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-sm text-gray-600">QR 코드</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            참석자들이 이 QR 코드를 스캔하여 체크인할 수 있습니다.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">체크인 URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={checkInUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded"
              />
              <button
                onClick={() => navigator.clipboard.writeText(checkInUrl)}
                className="px-3 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 transition-colors"
              >
                복사
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendeeStatsPanel;