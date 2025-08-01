import React, { useState, useEffect, useCallback } from 'react';
import { FiBarChart2, FiFileText, FiTrendingUp, FiActivity, FiPlay, FiPause, FiRefreshCw, FiCheck, FiX, FiFile, FiCopy, FiDownload, FiTrash2, FiExternalLink, FiFolder, FiFolderPlus } from 'react-icons/fi';
import { analyzeDocumentContent, readDocumentContent } from '../utils/api';
import RelatedAnalysis from './components/RelatedAnalysis';
import { BlockEditor } from '../note/components/editor/BlockEditor';
import { SelectionProvider } from '../note/components/editor/selection/context/SelectionContext.jsx';
import { DocumentAnalyzer } from './analyzers/index.js';

/**
 * AnalysisPanel - 파일매니저의 문서 분석 패널
 * 
 * 주요 기능:
 * - 문서 업로드 및 선택
 * - 실시간 분석 진행률 표시
 * - 분석 결과 시각화
 * - 분석 히스토리 관리
 * 
 * @param {Object} props
 * @param {string} props.activePanel - 현재 활성화된 패널
 * @param {Function} props.onNotification - 알림 표시 함수
 * @param {Array} props.selectedFiles - 선택된 파일 목록
 * @param {string} props.currentPath - 현재 경로
 * @param {Array} props.analysisFiles - 분석할 파일 목록
 * @param {Array} props.analysisResults - 분석 결과
 * @param {Function} props.setAnalysisResults - 분석 결과 설정 함수
 * @param {Array} props.analysisHistory - 분석 히스토리
 * @param {Function} props.setAnalysisHistory - 분석 히스토리 설정 함수
 */
const AnalysisPanel = ({ 
  activePanel, 
  onNotification, 
  selectedFiles = [], 
  currentPath = '', 
  analysisFiles = [],
  setAnalysisFiles,
  analysisResults = [],
  setAnalysisResults,
  analysisHistory = [],
  setAnalysisHistory
}) => {
  // UI 상태
  const [isExpanded, setIsExpanded] = useState(true);

  // 분석 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisLogs, setAnalysisLogs] = useState([]);
  const [blockEditorRef, setBlockEditorRef] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [pendingBlocks, setPendingBlocks] = useState(null);
  const [activeTab, setActiveTab] = useState('block'); // 'block', 'raw', 'related'
  const [currentBlocks, setCurrentBlocks] = useState([]); // 현재 블록 상태 저장
  const [saveDir, setSaveDir] = useState(() => {
    const saved = localStorage.getItem('analysisSaveDir');
    return saved || 'D:/my_app/Web_MCP_Server/ai/data/ai_learning/analyses';
  });

  
  const blockEditorRefCallback = useCallback((ref) => {
    console.log('BlockEditor ref 설정:', ref);
    setBlockEditorRef(ref);
  }, []);

  // 복사 함수
  const handleCopyAnalysisResult = useCallback(async (analysisResult) => {
    try {
      const jsonString = JSON.stringify(analysisResult.result, null, 2);
      await navigator.clipboard.writeText(jsonString);
      onNotification('분석 결과가 클립보드에 복사되었습니다.', 'success');
    } catch (error) {
      console.error('복사 실패:', error);
      onNotification('복사에 실패했습니다.', 'error');
    }
  }, [onNotification]);

  // 파일 열기 함수
  const handleOpenFile = useCallback(async (file) => {
    try {
      if (window.electronAPI && window.electronAPI.openFile) {
        await window.electronAPI.openFile(file.path);
        onNotification(`파일을 열었습니다: ${file.name}`, 'success');
      } else {
        // 웹 환경에서는 다운로드 링크 생성
        const link = document.createElement('a');
        link.href = `file://${file.path}`;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onNotification(`파일 다운로드를 시작했습니다: ${file.name}`, 'success');
      }
    } catch (error) {
      console.error('파일 열기 실패:', error);
      onNotification(`파일 열기에 실패했습니다: ${file.name}`, 'error');
    }
  }, [onNotification]);

  // 파일 선택 다이얼로그 열기
  const handleFileSelect = useCallback(async () => {
    try {
      if (window.electronAPI && window.electronAPI.showOpenDialog) {
        const result = await window.electronAPI.showOpenDialog({
          properties: ['openFile', 'multiSelections'],
          filters: [
            { name: '지원되는 파일', extensions: ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt', 'txt', 'md', 'csv'] },
            { name: '모든 파일', extensions: ['*'] }
          ]
        });
        
        if (result && result.filePaths && result.filePaths.length > 0) {
          const newFiles = result.filePaths.map(filePath => {
            const fileName = filePath.split('\\').pop();
            const fileExt = fileName.split('.').pop().toLowerCase();
            
            return {
              name: fileName,
              path: filePath,
              size: 0,
              ext: fileExt,
              mtime: new Date().toISOString()
            };
          });
          
          // 중복 체크
          setAnalysisFiles(prev => {
            const existingPaths = new Set(prev.map(f => f.path));
            const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
            
            if (uniqueNewFiles.length > 0) {
              onNotification(`${uniqueNewFiles.length}개 파일이 분석 목록에 추가되었습니다.`, 'success');
              return [...prev, ...uniqueNewFiles];
            } else {
              onNotification('이미 분석 목록에 있는 파일들입니다.', 'info');
              return prev;
            }
          });
        }
      } else {
        // 웹 환경에서는 input 요소 사용
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.txt,.md,.csv';
        
        input.onchange = (e) => {
          const files = Array.from(e.target.files);
          const newFiles = files.map(file => ({
            name: file.name,
            path: file.name, // 웹에서는 실제 경로를 알 수 없음
            size: file.size,
            ext: file.name.split('.').pop().toLowerCase(),
            mtime: new Date(file.lastModified).toISOString()
          }));
          
          setAnalysisFiles(prev => [...prev, ...newFiles]);
          onNotification(`${newFiles.length}개 파일이 분석 목록에 추가되었습니다.`, 'success');
        };
        
        input.click();
      }
    } catch (error) {
      console.error('파일 선택 실패:', error);
      onNotification('파일 선택에 실패했습니다.', 'error');
    }
  }, [setAnalysisFiles, onNotification]);

  // 드래그 앤 드롭 처리
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const supportedExtensions = ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt', 'txt', 'md', 'csv'];
    
    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return supportedExtensions.includes(ext);
    });
    
    if (validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({
        name: file.name,
        path: file.path || file.name,
        size: file.size,
        ext: file.name.split('.').pop().toLowerCase(),
        mtime: new Date(file.lastModified).toISOString()
      }));
      
      setAnalysisFiles(prev => {
        const existingPaths = new Set(prev.map(f => f.path));
        const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
        
        if (uniqueNewFiles.length > 0) {
          onNotification(`${uniqueNewFiles.length}개 파일이 분석 목록에 추가되었습니다.`, 'success');
          return [...prev, ...uniqueNewFiles];
        } else {
          onNotification('이미 분석 목록에 있는 파일들입니다.', 'info');
          return prev;
        }
      });
    } else {
      onNotification('지원되지 않는 파일 형식입니다.', 'error');
    }
  }, [setAnalysisFiles, onNotification]);

  // 파일 취소 함수
  const handleRemoveFile = useCallback((fileToRemove) => {
    // analysisFiles에서 제거
    setAnalysisFiles(prev => prev.filter(file => file.path !== fileToRemove.path));
    onNotification(`분석 목록에서 제거되었습니다: ${fileToRemove.name}`, 'success');
  }, [setAnalysisFiles, onNotification]);

  // 외부 AI용 다운로드 함수
  const handleDownloadForAI = useCallback(async (analysisResult) => {
    try {
      // 원시 데이터를 JSON 형태로 다운로드
      const jsonString = JSON.stringify(analysisResult.result, null, 2);
      const fileName = analysisResult.file.name.replace(/\.[^/.]+$/, ''); // 확장자 제거
      
      // JSON 파일로 다운로드
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}_원시데이터.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      onNotification('원시 데이터 JSON 파일이 다운로드되었습니다.', 'success');
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      onNotification('파일 다운로드에 실패했습니다.', 'error');
    }
  }, [onNotification]);
  
  // blockEditorRef가 설정되면 대기 중인 블록 적용
  useEffect(() => {
    if (blockEditorRef && pendingBlocks) {
      console.log('대기 중인 블록 적용:', pendingBlocks);
      blockEditorRef.setBlocks(pendingBlocks);
      setCurrentBlocks(pendingBlocks); // 현재 블록 상태도 업데이트
      setPendingBlocks(null);
    }
  }, [blockEditorRef, pendingBlocks]);
  
  // 분석 시작 핸들러
  const handleStartAnalysis = useCallback(async () => {
    // selectedFiles와 analysisFiles를 합쳐서 분석
    const filesToAnalyze = [...selectedFiles, ...analysisFiles];
    
    if (filesToAnalyze.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisLogs([]);
    setAnalysisResults([]); // App.jsx의 상태 초기화
    setCurrentBlocks([]); // 블록 상태도 초기화
    
    try {
      onNotification(`${filesToAnalyze.length}개 파일 분석을 시작합니다.`, 'info');
      
      // 각 파일을 순차적으로 분석
      for (let i = 0; i < filesToAnalyze.length; i++) {
        const file = filesToAnalyze[i];
        const progress = ((i + 1) / filesToAnalyze.length) * 100;
        
        setAnalysisProgress(progress);
        setAnalysisLogs(prev => [...prev, `분석 중: ${file.name}`]);
        
        try {
          // 파일 분석 실행 (내역서 등 중요 문서를 위해 제한 해제)
          const result = await analyzeDocumentContent(file.path, {
            maxLength: 1000000, // 100만자로 증가 (거의 무제한)
            saveDir // 저장 경로 전달
          });
          
          if (result.success) {
            const analysisResult = {
              file: file,
              result: result,
              timestamp: new Date()
            };
            
            setAnalysisResults(prev => [...prev, analysisResult]); // App.jsx의 상태에 저장
            setAnalysisLogs(prev => [...prev, `✅ 완료: ${file.name}`]);
            
            // 지원되는 파일인 경우 블록으로 변환
            console.log('파일 지원 여부 확인:', file.name, DocumentAnalyzer.isSupported(file.name));
            
            if (DocumentAnalyzer.isSupported(file.name)) {
              try {
                console.log('분석 결과:', analysisResult);
                const blocks = DocumentAnalyzer.convertToBlocks(analysisResult);
                console.log('생성된 블록:', blocks);
                
                if (blocks.length > 0) {
                  // 현재 블록 상태 저장
                  setCurrentBlocks(blocks);
                  
                  if (blockEditorRef) {
                    // 기존 블록들을 모두 제거하고 새로운 블록들로 교체
                    blockEditorRef.setBlocks(blocks);
                    setAnalysisLogs(prev => [...prev, `📄 블록 생성 완료: ${file.name} (${blocks.length}개)`]);
                  } else {
                    // blockEditorRef가 아직 없으면 대기 중인 블록으로 저장
                    console.log('blockEditorRef 없음, 대기 중인 블록으로 저장:', blocks);
                    setPendingBlocks(blocks);
                    setAnalysisLogs(prev => [...prev, `📄 블록 대기 중: ${file.name} (${blocks.length}개)`]);
                  }
                } else {
                  console.log('생성된 블록이 없음');
                  setAnalysisLogs(prev => [...prev, `⚠️ 생성된 블록 없음: ${file.name}`]);
                }
              } catch (error) {
                console.error('블록 생성 실패:', error);
                setAnalysisLogs(prev => [...prev, `❌ 블록 생성 실패: ${file.name} - ${error.message}`]);
              }
            } else {
              setAnalysisLogs(prev => [...prev, `⚠️ 지원하지 않는 파일 형식: ${file.name}`]);
            }
          } else {
            setAnalysisLogs(prev => [...prev, `❌ 실패: ${file.name} - ${result.error}`]);
          }
        } catch (error) {
          console.error(`파일 분석 실패: ${file.name}`, error);
          setAnalysisLogs(prev => [...prev, `❌ 오류: ${file.name} - ${error.message}`]);
        }
      }
      
      setAnalysisProgress(100);
      onNotification('문서 분석이 완료되었습니다.', 'success');
      
    } catch (error) {
      console.error('분석 중 오류:', error);
      onNotification('분석 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFiles, analysisFiles, onNotification, setAnalysisResults, saveDir, blockEditorRef]);

  // Electron 폴더 선택 다이얼로그
  const handleSelectSaveDir = useCallback(async () => {
    if (window.electronAPI && window.electronAPI.showOpenDialog) {
      const result = await window.electronAPI.showOpenDialog({
        properties: ['openDirectory']
      });
      if (result && result.filePaths && result.filePaths.length > 0) {
        const newPath = result.filePaths[0];
        setSaveDir(newPath);
        localStorage.setItem('analysisSaveDir', newPath);
        onNotification(`저장 경로가 변경되었습니다: ${newPath}`, 'success');
      }
    } else {
      onNotification('Electron 환경에서만 폴더 선택이 지원됩니다.', 'info');
    }
  }, [onNotification]);

  // 경로 직접 입력 핸들러
  const handleSaveDirChange = useCallback((e) => {
    const newPath = e.target.value;
    setSaveDir(newPath);
    localStorage.setItem('analysisSaveDir', newPath);
  }, []);

  // 패널이 활성화되지 않았으면 숨김 처리 (렌더링은 유지)
  if (activePanel !== 'analysis') {
    return (
      <div className="h-full flex flex-col bg-gray-50" style={{ display: 'none' }}>
        {/* 숨겨진 상태에서도 컴포넌트는 유지됨 */}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 헤더 영역 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiBarChart2 className="w-6 h-6 text-gray-700" />
            <h1 className="text-xl font-semibold text-gray-900">문서 분석</h1>
          </div>
          
          {/* 상태 표시기 */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <FiActivity className="w-4 h-4" />
              <span>분석 준비됨</span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽 패널 - 파일 선택 및 분석 설정 */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* 파일 선택 영역 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">분석할 파일 선택</h2>
            
            {/* 분석 대기 파일 표시 */}
            {(selectedFiles.length > 0 || analysisFiles.length > 0) && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  분석 대기 파일 ({selectedFiles.length + analysisFiles.length}개)
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {/* 선택된 파일들 */}
                  {selectedFiles.map((file, index) => (
                    <div key={`selected-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FiFileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenFile(file)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200 flex-shrink-0"
                          title="파일 열기"
                        >
                          <FiExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveFile(file)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200 flex-shrink-0"
                          title="분석 목록에서 제거"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* 분석 대기 파일들 */}
                  {analysisFiles.map((file, index) => (
                    <div key={`analysis-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FiFileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenFile(file)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200 flex-shrink-0"
                          title="파일 열기"
                        >
                          <FiExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveFile(file)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200 flex-shrink-0"
                          title="분석 목록에서 제거"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 파일 업로드 영역 */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleFileSelect}
            >
              <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">파일을 드래그하여 업로드하거나</p>
              <button 
                className="text-blue-600 hover:text-blue-700 font-medium"
                onClick={e => { e.stopPropagation(); handleFileSelect(); }}
              >
                파일 선택하기
              </button>
            </div>
            {/* 분석 결과 저장 경로 설정 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FiFolder className="w-4 h-4 mr-2" />
                분석 결과 저장 경로
              </h3>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={saveDir}
                  onChange={handleSaveDirChange}
                  placeholder="분석 결과를 저장할 경로를 입력하세요"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSelectSaveDir}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                >
                  <FiFolderPlus className="w-4 h-4 mr-1" />
                  폴더 선택
                </button>
              </div>
              <p className="text-xs text-gray-500">
                💡 분석이 완료되면 지정한 경로에 결과가 JSON 파일로 저장됩니다. 
                경로는 자동으로 저장되어 다음 분석 시에도 유지됩니다.
              </p>
            </div>

            {/* 지원 형식 안내 */}
            <div className="mt-4 text-sm text-gray-500">
              <p className="font-medium mb-2">지원 형식:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span>• Excel (.xlsx, .xls)</span>
                <span>• PDF (.pdf)</span>
                <span>• Word (.docx, .doc)</span>
                <span>• PowerPoint (.pptx, .ppt)</span>
                <span>• 텍스트 (.txt, .md)</span>
                <span>• CSV (.csv)</span>
              </div>
            </div>
          </div>

          {/* 분석 설정 영역 */}
          <div className="p-6 flex-1">
            <h2 className="text-lg font-medium text-gray-900 mb-4">분석 설정</h2>
            
            {/* 분석 옵션들 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  분석 유형
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="auto">자동 감지</option>
                  <option value="excel">Excel 분석</option>
                  <option value="pdf">PDF 분석</option>
                  <option value="word">Word 분석</option>
                  <option value="text">텍스트 분석</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  분석 수준
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="basic">기본 분석</option>
                  <option value="standard">표준 분석</option>
                  <option value="advanced">고급 분석</option>
                </select>
              </div>

              {/* 분석 시작 버튼 */}
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={(selectedFiles.length === 0 && analysisFiles.length === 0) || isAnalyzing}
                onClick={handleStartAnalysis}
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    <span>분석 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <FiPlay className="w-4 h-4" />
                    <span>분석 시작</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 오른쪽 패널 - 분석 결과 및 진행률 */}
        <div className="flex-1 flex flex-col">
          {/* 진행률 표시 영역 */}
          {isAnalyzing && (
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">분석 진행 중</h3>
                <span className="text-sm text-gray-500">{analysisProgress}%</span>
              </div>
              
              {/* 진행률 바 */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
              
              {/* 현재 단계 표시 */}
              <div className="mt-3 text-sm text-gray-600">
                <span>현재 단계: 파일 검증 중...</span>
              </div>
            </div>
          )}

          {/* 분석 결과 영역 */}
          <div className="flex-1 flex flex-col h-0">
            {/* 탭 선택 */}
            <div className="flex border-b border-gray-200">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'block' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('block')}
              >
                블록 뷰
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'raw' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('raw')}
              >
                원시 데이터
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'related' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('related')}
              >
                연관 분석
              </button>
            </div>
            
            {/* 탭 내용 */}
            <div className="flex-1 p-6 overflow-auto min-h-0" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {activeTab === 'block' ? (
                // 블록 뷰
                analysisResults.length === 0 ? (
                  // 빈 상태
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <FiTrendingUp className="w-16 h-16 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">분석 결과가 없습니다</h3>
                    <p className="text-center max-w-md">
                      지원되는 파일을 선택하고 분석을 시작하면 블록 형태로 결과가 표시됩니다.
                    </p>
                    <div className="mt-4 text-xs text-gray-400">
                      <p>지원 형식: PDF, Excel (.xls, .xlsx, .xlsm, .xlsb)</p>
                    </div>
                  </div>
                ) : (
                  // 블록 에디터
                  <div className="w-full">
                    <SelectionProvider>
                      <BlockEditor
                        ref={blockEditorRefCallback}
                        initialBlocks={currentBlocks}
                        readOnly={false}
                        placeholder="분석 결과가 블록 형태로 표시됩니다..."
                        selectedBlocks={selectedBlocks}
                        setSelectedBlocks={setSelectedBlocks}
                      />
                    </SelectionProvider>
                  </div>
                )
                            ) : activeTab === 'related' ? (
                // 연관 분석 뷰
                <RelatedAnalysis 
                  analysisResults={analysisResults}
                  onNotification={onNotification}
                />
              ) : (
                // 원시 데이터 뷰
                analysisResults.length === 0 ? (
                  // 빈 상태
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <FiFile className="w-16 h-16 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">원시 데이터가 없습니다</h3>
                    <p className="text-center max-w-md">
                      분석을 완료하면 원시 데이터를 확인할 수 있습니다.
                    </p>
                  </div>
                ) : (
                  // 원시 데이터 표시
                  <div className="space-y-4 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">원시 분석 데이터 ({analysisResults.length}개)</h3>
                    {analysisResults.map((analysis, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{analysis.file.name}</h4>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDownloadForAI(analysis)}
                              className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
                              title="외부 AI용 다운로드"
                            >
                              <FiDownload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyAnalysisResult(analysis)}
                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                              title="분석 결과 복사"
                            >
                              <FiCopy className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-500">
                              {analysis.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* 원시 데이터 내용 */}
                        <div className="space-y-2 min-w-0">
                          <div className="min-w-0">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">분석 결과</h5>
                            <div className="border border-gray-200 rounded bg-gray-50 max-h-[500px] overflow-auto w-full">
                              <pre className="text-xs text-gray-600 p-2 whitespace-pre-wrap break-all">
                                {JSON.stringify(analysis.result, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
            
            {/* 분석 로그 */}
            {analysisLogs.length > 0 && (
              <div className="border-t border-gray-200 p-2 bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-medium text-gray-700">분석 로그</h3>
                  <span className="text-xs text-gray-500">{analysisLogs.length}개</span>
                </div>
                <div className="max-h-20 overflow-y-auto">
                  {analysisLogs.slice(-5).map((log, index) => (
                    <div key={index} className="text-xs text-gray-600 py-0.5">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel; 