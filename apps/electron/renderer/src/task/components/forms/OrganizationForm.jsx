import React, { useState, useCallback } from 'react';
import {
  XMarkIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  UserGroupIcon,
  CogIcon,
  CloudArrowUpIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG } from '../../constants/taskConfig';

/**
 * 조직 생성/편집 폼 컴포넌트
 * Microsoft Teams 스타일의 모던한 기업용 UI로 구현
 * 
 * 주요 기능:
 * - 조직 기본 정보 입력 (이름, 설명, 타입, 산업군)
 * - 로고 업로드 및 미리보기
 * - 조직 설정 (타임존, 언어, 근무시간)
 * - 실시간 유효성 검사
 * - 단계별 진행 표시
 * - 반응형 디자인
 */
const OrganizationForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  isEditing = false 
}) => {
  // 현재 단계 관리 (다단계 폼)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // 폼 데이터 상태 관리
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || TASK_CONFIG.ORGANIZATION_TYPES.COMPANY,
    industry: initialData?.industry || '',
    website: initialData?.website || '',
    location: initialData?.location || '',
    size: initialData?.size || 'small',
    timezone: initialData?.timezone || 'Asia/Seoul',
    language: initialData?.language || 'ko',
    logo: initialData?.logo || null,
    settings: {
      work_hours: {
        start: initialData?.settings?.work_hours?.start || '09:00',
        end: initialData?.settings?.work_hours?.end || '18:00',
        timezone: initialData?.settings?.work_hours?.timezone || 'Asia/Seoul'
      },
      notification_preferences: {
        email: initialData?.settings?.notification_preferences?.email ?? true,
        slack: initialData?.settings?.notification_preferences?.slack ?? false,
        in_app: initialData?.settings?.notification_preferences?.in_app ?? true
      },
      security: {
        two_factor_required: initialData?.settings?.security?.two_factor_required ?? false,
        password_policy: initialData?.settings?.security?.password_policy ?? 'medium',
        session_timeout: initialData?.settings?.security?.session_timeout ?? 480
      }
    }
  });

  // 폼 유효성 검사 상태
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState(initialData?.logo || null);

  // 조직 타입 옵션 정의
  const organizationTypes = [
    { value: TASK_CONFIG.ORGANIZATION_TYPES.COMPANY, label: '기업', icon: BuildingOffice2Icon, desc: '일반 기업 및 대기업' },
    { value: TASK_CONFIG.ORGANIZATION_TYPES.STARTUP, label: '스타트업', icon: GlobeAltIcon, desc: '신생 기업 및 벤처' },
    { value: TASK_CONFIG.ORGANIZATION_TYPES.AGENCY, label: '에이전시', icon: UserGroupIcon, desc: '서비스 에이전시' },
    { value: TASK_CONFIG.ORGANIZATION_TYPES.NONPROFIT, label: '비영리', icon: InformationCircleIcon, desc: '비영리 단체' },
    { value: TASK_CONFIG.ORGANIZATION_TYPES.PERSONAL, label: '개인', icon: CogIcon, desc: '개인 프로젝트' }
  ];

  // 조직 규모 옵션
  const organizationSizes = [
    { value: 'small', label: '소규모 (1-10명)', desc: '작은 팀이나 스타트업' },
    { value: 'medium', label: '중규모 (11-50명)', desc: '성장하는 기업' },
    { value: 'large', label: '대규모 (51-200명)', desc: '중견기업' },
    { value: 'enterprise', label: '기업 (200명+)', desc: '대기업 및 엔터프라이즈' }
  ];

  // 산업군 옵션
  const industries = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
    'Retail', 'Marketing', 'Design', 'Consulting', 'Real Estate',
    'Media', 'Government', 'Non-profit', 'Other'
  ];

  // 입력값 변경 핸들러
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  // 중첩 객체 업데이트 핸들러
  const handleNestedChange = useCallback((path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  }, []);

  // 로고 업로드 핸들러
  const handleLogoUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      // 파일 크기 검사 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: '로고 파일은 5MB 이하여야 합니다.'
        }));
        return;
      }

      // 파일 타입 검사
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          logo: '이미지 파일만 업로드 가능합니다.'
        }));
        return;
      }

      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
        setFormData(prev => ({
          ...prev,
          logo: file
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // 폼 유효성 검사
  const validateForm = useCallback(() => {
    const newErrors = {};

    // 1단계 유효성 검사
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = '조직 이름을 입력해주세요.';
      } else if (formData.name.length < 2) {
        newErrors.name = '조직 이름은 2자 이상이어야 합니다.';
      } else if (formData.name.length > 50) {
        newErrors.name = '조직 이름은 50자 이하여야 합니다.';
      }

      if (!formData.description.trim()) {
        newErrors.description = '조직 설명을 입력해주세요.';
      } else if (formData.description.length > 200) {
        newErrors.description = '조직 설명은 200자 이하여야 합니다.';
      }

      if (!formData.type) {
        newErrors.type = '조직 타입을 선택해주세요.';
      }
    }

    // 2단계 유효성 검사
    if (currentStep === 2) {
      if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
        newErrors.website = '올바른 웹사이트 URL을 입력해주세요.';
      }

      if (!formData.location.trim()) {
        newErrors.location = '조직 위치를 입력해주세요.';
      }

      if (!formData.industry) {
        newErrors.industry = '산업군을 선택해주세요.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, currentStep]);

  // 다음 단계로 이동
  const handleNext = useCallback(() => {
    if (validateForm()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  }, [validateForm, totalSteps]);

  // 이전 단계로 이동
  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
      onClose();
    } catch (error) {
      console.error('조직 저장 실패:', error);
      setErrors({ submit: '조직 저장 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, onClose]);

  // 단계별 진행 표시 컴포넌트
  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step <= currentStep 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}>
            {step < currentStep ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              step
            )}
          </div>
          {step < 3 && (
            <div className={`w-16 h-1 mx-2 ${
              step < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <BuildingOffice2Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? '조직 편집' : '새 조직 만들기'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentStep === 1 && '기본 정보를 입력해주세요'}
                {currentStep === 2 && '세부 정보를 입력해주세요'}
                {currentStep === 3 && '설정을 완료해주세요'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 컨텐츠 */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <StepIndicator />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1단계: 기본 정보 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    조직 기본 정보
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    조직의 기본적인 정보를 입력해주세요.
                  </p>
                </div>

                {/* 조직 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    조직 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="예: TechCorp, 디자인 스튜디오"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    maxLength={50}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* 조직 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    조직 설명 *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="조직의 목적과 역할을 간단히 설명해주세요."
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                      errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    maxLength={200}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description ? (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.description}
                      </p>
                    ) : (
                      <div />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.description.length}/200
                    </span>
                  </div>
                </div>

                {/* 조직 타입 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    조직 타입 *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {organizationTypes.map(({ value, label, icon: Icon, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleInputChange('type', value)}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          formData.type === value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <div>
                            <p className="font-medium">{label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {errors.type}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 2단계: 세부 정보 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    세부 정보
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    조직의 세부 정보를 입력해주세요.
                  </p>
                </div>

                {/* 로고 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    조직 로고
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <CloudArrowUpIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      >
                        <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                        로고 업로드
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PNG, JPG (최대 5MB)
                      </p>
                    </div>
                  </div>
                  {errors.logo && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {errors.logo}
                    </p>
                  )}
                </div>

                {/* 웹사이트 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    웹사이트
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.website ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.website && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {errors.website}
                    </p>
                  )}
                </div>

                {/* 위치 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    위치 *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="예: 서울, 대한민국"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {errors.location}
                    </p>
                  )}
                </div>

                {/* 산업군 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    산업군 *
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.industry ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">산업군을 선택하세요</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {errors.industry}
                    </p>
                  )}
                </div>

                {/* 조직 규모 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    조직 규모
                  </label>
                  <div className="space-y-2">
                    {organizationSizes.map(({ value, label, desc }) => (
                      <label key={value} className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="size"
                          value={value}
                          checked={formData.size === value}
                          onChange={(e) => handleInputChange('size', e.target.value)}
                          className="border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3단계: 설정 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    조직 설정
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    조직의 기본 설정을 구성해주세요.
                  </p>
                </div>

                {/* 타임존 및 언어 설정 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      타임존
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="Asia/Seoul">Asia/Seoul (UTC+9)</option>
                      <option value="America/New_York">America/New_York (UTC-5)</option>
                      <option value="Europe/London">Europe/London (UTC+0)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      언어
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="ko">한국어</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                </div>

                {/* 근무 시간 설정 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    근무 시간
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">시작 시간</label>
                      <input
                        type="time"
                        value={formData.settings.work_hours.start}
                        onChange={(e) => handleNestedChange('settings.work_hours.start', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">종료 시간</label>
                      <input
                        type="time"
                        value={formData.settings.work_hours.end}
                        onChange={(e) => handleNestedChange('settings.work_hours.end', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* 알림 설정 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    알림 설정
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.notification_preferences.email}
                        onChange={(e) => handleNestedChange('settings.notification_preferences.email', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">이메일 알림 활성화</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.notification_preferences.slack}
                        onChange={(e) => handleNestedChange('settings.notification_preferences.slack', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Slack 알림 활성화</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.notification_preferences.in_app}
                        onChange={(e) => handleNestedChange('settings.notification_preferences.in_app', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">앱 내 알림 활성화</span>
                    </label>
                  </div>
                </div>

                {/* 보안 설정 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    보안 설정
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.security.two_factor_required}
                        onChange={(e) => handleNestedChange('settings.security.two_factor_required', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">2FA 인증 필수</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 에러 메시지 */}
            {errors.submit && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                  {errors.submit}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              단계 {currentStep} / {totalSteps}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                이전
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              취소
            </button>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                다음
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>저장 중...</span>
                  </>
                ) : (
                  <span>{isEditing ? '업데이트' : '조직 만들기'}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationForm;