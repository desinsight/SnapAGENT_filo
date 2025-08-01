// 이벤트 생성/수정 폼 컴포넌트
import React, { useState, useEffect } from 'react';
import { formatDate, formatTime } from '../../utils/dateHelpers';
import { CALENDAR_CONFIG } from '../../constants/calendarConfig';

const EventForm = ({
  isOpen,
  onClose,
  onSubmit,
  event = null, // 수정시에는 기존 이벤트 데이터
  calendars,
  selectedCalendar,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    calendarId: selectedCalendar || (calendars[0]?.id || ''),
    allDay: false,
    priority: 'normal',
    category: 'personal',
    status: 'confirmed',
    visibility: 'public',
    location: {
      name: '',
      address: ''
    },
    attendees: [],
    recurrence: {
      enabled: false,
      frequency: 'daily',
      interval: 1,
      endDate: '',
      count: null
    },
    reminders: [
      { method: 'popup', minutes: 15 }
    ],
    tags: []
  });

  const [currentAttendee, setCurrentAttendee] = useState({ name: '', email: '' });
  const [currentTag, setCurrentTag] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 폼 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && event) {
        // 수정 모드: 기존 이벤트 데이터로 초기화
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        setFormData({
          title: event.title || '',
          description: event.description || '',
          startDate: formatDate(startDate, 'YYYY-MM-DD'),
          startTime: event.allDay ? '' : formatTime(startDate),
          endDate: formatDate(endDate, 'YYYY-MM-DD'),
          endTime: event.allDay ? '' : formatTime(endDate),
          calendarId: event.calendarId || selectedCalendar || (calendars[0]?.id || ''),
          allDay: event.allDay || false,
          priority: event.priority || 'normal',
          category: event.category || 'personal',
          status: event.status || 'confirmed',
          visibility: event.visibility || 'public',
          location: {
            name: event.location?.name || '',
            address: event.location?.address || ''
          },
          attendees: event.attendees || [],
          recurrence: {
            enabled: !!event.recurrence,
            frequency: event.recurrence?.frequency || 'daily',
            interval: event.recurrence?.interval || 1,
            endDate: event.recurrence?.endDate ? formatDate(new Date(event.recurrence.endDate), 'YYYY-MM-DD') : '',
            count: event.recurrence?.count || null
          },
          reminders: event.reminders || [{ method: 'popup', minutes: 15 }],
          tags: event.tags || []
        });
      } else {
        // 생성 모드: 기본값으로 초기화
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        
        setFormData({
          title: '',
          description: '',
          startDate: formatDate(now, 'YYYY-MM-DD'),
          startTime: formatTime(now),
          endDate: formatDate(oneHourLater, 'YYYY-MM-DD'),
          endTime: formatTime(oneHourLater),
          calendarId: selectedCalendar || (calendars[0]?.id || ''),
          allDay: false,
          priority: 'normal',
          category: 'personal',
          status: 'confirmed',
          visibility: 'public',
          location: { name: '', address: '' },
          attendees: [],
          recurrence: {
            enabled: false,
            frequency: 'daily',
            interval: 1,
            endDate: '',
            count: null
          },
          reminders: [{ method: 'popup', minutes: 15 }],
          tags: []
        });
      }
    }
  }, [isOpen, event, mode, selectedCalendar, calendars]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 기본 유효성 검증
    if (!formData.title.trim()) {
      alert('일정 제목을 입력해주세요.');
      return;
    }

    // 날짜/시간 유효성 검증
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime || '23:59'}`);

    if (endDateTime <= startDateTime) {
      alert('종료 시간이 시작 시간보다 늦어야 합니다.');
      return;
    }

    // 이벤트 데이터 구성
    const eventData = {
      ...formData,
      start: formData.allDay ? formData.startDate : startDateTime.toISOString(),
      end: formData.allDay ? formData.endDate : endDateTime.toISOString(),
      location: formData.location.name ? formData.location : null,
      recurrence: formData.recurrence.enabled ? formData.recurrence : null
    };

    // 수정 모드인 경우 ID 추가
    if (mode === 'edit' && event) {
      eventData.id = event.id;
    }

    onSubmit(eventData);
    handleClose();
  };

  const handleClose = () => {
    setCurrentAttendee({ name: '', email: '' });
    setCurrentTag('');
    setShowAdvanced(false);
    onClose();
  };

  const addAttendee = () => {
    if (currentAttendee.name && currentAttendee.email) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, { ...currentAttendee, status: 'pending' }]
      }));
      setCurrentAttendee({ name: '', email: '' });
    }
  };

  const removeAttendee = (index) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addReminder = () => {
    setFormData(prev => ({
      ...prev,
      reminders: [...prev.reminders, { method: 'popup', minutes: 15 }]
    }));
  };

  const updateReminder = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.map((reminder, i) => 
        i === index ? { ...reminder, [field]: value } : reminder
      )
    }));
  };

  const removeReminder = (index) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? '일정 수정' : '새 일정'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                일정 제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="일정 제목을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                캘린더
              </label>
              <select
                value={formData.calendarId}
                onChange={(e) => handleInputChange('calendarId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {calendars.map(calendar => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.allDay}
                onChange={(e) => handleInputChange('allDay', e.target.checked)}
                className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
                전체 일정
              </label>
            </div>
          </div>

          {/* 날짜 및 시간 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {!formData.allDay && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 시간
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 시간
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="일정에 대한 설명을 입력하세요"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 고급 설정 토글 */}
          <div className="border-t pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <svg
                className={`w-4 h-4 mr-2 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              고급 설정
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-6">
              {/* 우선순위, 카테고리, 상태 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    우선순위
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">낮음</option>
                    <option value="normal">보통</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                    <option value="critical">매우 중요</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="personal">개인</option>
                    <option value="business">비즈니스</option>
                    <option value="health">건강</option>
                    <option value="team">팀</option>
                    <option value="other">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="confirmed">확정</option>
                    <option value="tentative">임시</option>
                    <option value="cancelled">취소</option>
                    <option value="pending">대기</option>
                  </select>
                </div>
              </div>

              {/* 위치 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    위치명
                  </label>
                  <input
                    type="text"
                    value={formData.location.name}
                    onChange={(e) => handleInputChange('location.name', e.target.value)}
                    placeholder="위치명을 입력하세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소
                  </label>
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => handleInputChange('location.address', e.target.value)}
                    placeholder="주소를 입력하세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  태그
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="태그를 입력하세요"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              {mode === 'edit' ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;