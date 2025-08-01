import React, { useState } from 'react';

// 아이콘 컴포넌트들
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const DatabaseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

/**
 * SmartOrganizeModal - 스마트 정리 모달 컴포넌트
 * 
 * 기능:
 * - 6가지 파일 정리 옵션 제공
 * - 각 정리 옵션별 설명 및 아이콘
 * - 로딩 상태 표시
 * - 정리 진행률 표시
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 표시 여부
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {Function} props.onOrganize - 정리 실행 함수
 * @param {string} props.currentPath - 현재 경로
 */
const SmartOrganizeModal = ({ 
  isOpen, 
  onClose, 
  onOrganize, 
  currentPath 
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [includeSubfolders, setIncludeSubfolders] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [sizeThreshold, setSizeThreshold] = useState('100');
  const [sizeUnit, setSizeUnit] = useState('MB');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiRequest, setAiRequest] = useState('');

  // 정리 옵션들
  const organizeOptions = [
    {
      id: 'extension',
      title: '확장자별 정리',
      description: '파일을 확장자별로 폴더에 분류합니다',
      icon: <FileTextIcon />,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      id: 'date',
      title: '날짜별 정리',
      description: '파일을 생성/수정 날짜별로 폴더에 분류합니다',
      icon: <CalendarIcon />,
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      id: 'duplicate',
      title: '중복 파일 정리',
      description: '중복된 파일을 찾아서 정리하고 용량을 절약합니다',
      icon: <CopyIcon />,
      iconColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      id: 'temp',
      title: '임시/불필요 파일 정리',
      description: '임시 파일, 캐시, 로그 파일 등 불필요한 파일을 정리합니다',
      icon: <TrashIcon />,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      id: 'size',
      title: '대용량 파일 정리',
      description: '크기가 큰 파일들을 별도 폴더로 분류하여 관리합니다',
      icon: <DatabaseIcon />,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      id: 'ai',
      title: 'AI 추천 기반 정리',
      description: 'AI가 파일 내용을 분석하여 스마트하게 분류합니다',
      icon: <SparklesIcon />,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
    }
  ];

  // 정리 실행 핸들러
  const handleOrganize = async (optionId) => {
    // 대용량 파일 정리인 경우 용량 입력 모달을 먼저 표시
    if (optionId === 'size') {
      setShowSizeModal(true);
      return;
    }

    // AI 추천 정리인 경우 요청 입력 모달을 먼저 표시
    if (optionId === 'ai') {
      setShowAiModal(true);
      return;
    }

    setSelectedOption(optionId);
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep('분석 중...');

    try {
      // 시뮬레이션된 진행률 업데이트
      const steps = [
        { step: '파일 스캔 중...', progress: 20 },
        { step: '분석 중...', progress: 40 },
        { step: '정리 중...', progress: 70 },
        { step: '완료 중...', progress: 100 }
      ];

      for (const { step, progress: stepProgress } of steps) {
        setCurrentStep(step);
        setProgress(stepProgress);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 실제 정리 함수 호출
      await onOrganize(optionId, currentPath, includeSubfolders);

      // 성공 알림
      setCurrentStep('정리 완료!');
      setTimeout(() => {
        setIsProcessing(false);
        setSelectedOption(null);
        setProgress(0);
        setCurrentStep('');
        onClose();
      }, 1500);

    } catch (error) {
      console.error('정리 실행 중 오류:', error);
      setCurrentStep('오류가 발생했습니다');
      setTimeout(() => {
        setIsProcessing(false);
        setSelectedOption(null);
        setProgress(0);
        setCurrentStep('');
      }, 2000);
    }
  };

  // 대용량 파일 정리 실행
  const handleSizeOrganize = async () => {
    setShowSizeModal(false);
    setSelectedOption('size');
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep('분석 중...');

    try {
      // 시뮬레이션된 진행률 업데이트
      const steps = [
        { step: '파일 스캔 중...', progress: 20 },
        { step: '크기 분석 중...', progress: 40 },
        { step: 'ZIP 압축 중...', progress: 70 },
        { step: '완료 중...', progress: 100 }
      ];

      for (const { step, progress: stepProgress } of steps) {
        setCurrentStep(step);
        setProgress(stepProgress);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 용량 정보와 함께 정리 함수 호출
      const sizeInBytes = convertToBytes(sizeThreshold, sizeUnit);
      await onOrganize('size', currentPath, includeSubfolders, { sizeThreshold: sizeInBytes });

      // 성공 알림
      setCurrentStep('정리 완료!');
      setTimeout(() => {
        setIsProcessing(false);
        setSelectedOption(null);
        setProgress(0);
        setCurrentStep('');
        onClose();
      }, 1500);

    } catch (error) {
      console.error('대용량 파일 정리 중 오류:', error);
      setCurrentStep('오류가 발생했습니다');
      setTimeout(() => {
        setIsProcessing(false);
        setSelectedOption(null);
        setProgress(0);
        setCurrentStep('');
      }, 2000);
    }
  };

  // 용량 단위를 바이트로 변환
  const convertToBytes = (size, unit) => {
    const sizeNum = parseFloat(size);
    switch (unit) {
      case 'KB': return sizeNum * 1024;
      case 'MB': return sizeNum * 1024 * 1024;
      case 'GB': return sizeNum * 1024 * 1024 * 1024;
      default: return sizeNum;
    }
  };

  // AI 정리 실행
  const handleAiOrganize = async () => {
    setShowAiModal(false);
    setSelectedOption('ai');
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep('AI 분석 중...');

    try {
      // 시뮬레이션된 진행률 업데이트
      const steps = [
        { step: 'AI 분석 중...', progress: 20 },
        { step: '파일 분류 중...', progress: 40 },
        { step: '최적화 중...', progress: 70 },
        { step: '정리 완료!', progress: 100 }
      ];

      for (const { step, progress: stepProgress } of steps) {
        setCurrentStep(step);
        setProgress(stepProgress);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // AI 요청과 함께 정리 함수 호출
      await onOrganize('ai', currentPath, includeSubfolders, { aiRequest });

      // 성공 알림
      setCurrentStep('정리 완료!');
      setTimeout(() => {
        setIsProcessing(false);
        setSelectedOption(null);
        setProgress(0);
        setCurrentStep('');
        onClose();
      }, 1500);

    } catch (error) {
      console.error('AI 정리 중 오류:', error);
      setCurrentStep('오류가 발생했습니다');
      setTimeout(() => {
        setIsProcessing(false);
        setSelectedOption(null);
        setProgress(0);
        setCurrentStep('');
      }, 2000);
    }
  };

  // 모달이 열릴 때 상태 초기화
  React.useEffect(() => {
    if (isOpen) {
      setSelectedOption(null);
      setIsProcessing(false);
      setProgress(0);
      setCurrentStep('');
      setIncludeSubfolders(false);
      setShowSizeModal(false);
      setSizeThreshold('100');
      setSizeUnit('MB');
      setShowAiModal(false);
      setAiRequest('');
    }
  }, [isOpen]);

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              스마트 정리
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {currentPath}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          {!isProcessing ? (
            <>
              {/* 옵션 그리드 */}
              <div className="grid grid-cols-2 gap-3">
                {organizeOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleOrganize(option.id)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-md ${option.bgColor} ${option.iconColor}`}>
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {option.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 하위 폴더 포함 옵션 */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={includeSubfolders}
                      onChange={(e) => setIncludeSubfolders(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      includeSubfolders 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500'
                    }`}>
                      {includeSubfolders && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      하위 폴더 포함
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      하위 폴더의 파일들도 함께 정리합니다
                    </p>
                  </div>
                </label>
              </div>

              {/* 도움말 */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                  사용 팁
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 정리하기 전에 중요한 파일들을 백업해주세요</li>
                  <li>• AI 추천 정리는 파일 내용을 분석하여 더 정확한 분류를 제공합니다</li>
                  <li>• 중복 파일 정리는 원본을 보존하고 복사본만 정리합니다</li>
                </ul>
              </div>
            </>
          ) : (
            /* 처리 중 화면 */
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4">
                <div className={`p-4 rounded-lg ${organizeOptions.find(opt => opt.id === selectedOption)?.bgColor} ${organizeOptions.find(opt => opt.id === selectedOption)?.iconColor}`}>
                  {organizeOptions.find(opt => opt.id === selectedOption)?.icon}
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {organizeOptions.find(opt => opt.id === selectedOption)?.title}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {currentStep}
              </p>

              {/* 진행률 바 */}
              <div className="w-full max-w-xs mb-4">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span>진행률</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gray-600 dark:bg-gray-300 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                <LoadingSpinner />
                <span>처리 중입니다...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 용량 입력 모달 */}
      {showSizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                대용량 파일 정리
              </h3>
              <button
                onClick={() => setShowSizeModal(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {/* 내용 */}
            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                지정한 용량 이상의 파일들을 ZIP으로 압축하여 정리합니다.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    용량 기준
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={sizeThreshold}
                      onChange={(e) => setSizeThreshold(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="100"
                      min="1"
                    />
                    <select
                      value={sizeUnit}
                      onChange={(e) => setSizeUnit(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                      <option value="GB">GB</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    이 용량보다 큰 파일들을 ZIP으로 압축합니다
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1 text-sm">
                    정리 방식
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• {sizeThreshold}{sizeUnit} 이상의 파일을 찾습니다</li>
                    <li>• 파일들을 "LargeFiles_날짜.zip"으로 압축합니다</li>
                    <li>• 원본 파일은 안전하게 보관됩니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowSizeModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSizeOrganize}
                disabled={!sizeThreshold || isNaN(parseFloat(sizeThreshold))}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                정리 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 요청 입력 모달 */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI 추천 기반 정리
              </h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {/* 내용 */}
            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                AI가 파일을 어떻게 정리하길 원하는지 간단히 설명해주세요.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    정리 요청
                  </label>
                  <textarea
                    value={aiRequest}
                    onChange={(e) => setAiRequest(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="예: 이미지는 년도별로, 문서는 프로젝트별로 정리해줘"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    구체적으로 설명할수록 더 정확한 정리가 가능합니다
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1 text-sm">
                    AI 정리 예시
                  </h4>
                  <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                    <li>• "사진은 촬영일자별로 폴더 생성"</li>
                    <li>• "비슷한 파일명끼리 그룹화"</li>
                    <li>• "용량별로 대/중/소 폴더 분류"</li>
                    <li>• "작업 중인 파일만 따로 정리"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAiOrganize}
                disabled={!aiRequest.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                AI 정리 시작
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartOrganizeModal;