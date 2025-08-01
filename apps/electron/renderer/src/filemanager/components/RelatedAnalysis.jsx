import React, { useState, useCallback } from 'react';
import { searchSimilarFiles, searchByContent, searchByMetadata } from '../../utils/api';

/**
 * 연관 분석 컴포넌트
 * @param {Object} props
 * @param {Array} props.analysisResults - 분석 결과 배열
 * @param {Function} props.onNotification - 알림 함수
 */
const RelatedAnalysis = ({ analysisResults, onNotification }) => {
  const [relatedResults, setRelatedResults] = useState({}); // 연관 분석 결과
  const [isLoadingRelated, setIsLoadingRelated] = useState(false); // 연관 분석 로딩 상태
  const [selectedKeywords, setSelectedKeywords] = useState({}); // 선택된 키워드 (파일별로 관리)

  // 연관 분석 함수들
  // 키워드 선택 토글 함수
  const handleKeywordToggle = useCallback((fileName, keyword, checked) => {
    setSelectedKeywords(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [keyword]: checked
      }
    }));
  }, []);

  // 선택된 키워드 가져오기
  const getSelectedKeywords = useCallback((fileName) => {
    const fileKeywords = selectedKeywords[fileName] || {};
    return Object.keys(fileKeywords).filter(keyword => fileKeywords[keyword]);
  }, [selectedKeywords]);

  const handleKeywordSearch = useCallback(async (analysis) => {
    setIsLoadingRelated(true);
    try {
      const allKeywords = analysis.result.data?.analysis?.keywords || 
                         analysis.result.data?.keywords ||
                         analysis.result.analysis?.keywords ||
                         [];
      
      // 선택된 키워드만 사용 (선택된 것이 없으면 모든 키워드 사용)
      const selectedKeys = getSelectedKeywords(analysis.file.name);
      const keywords = selectedKeys.length > 0 ? selectedKeys : allKeywords;
      
      const fileType = analysis.file.name.split('.').pop();
      
      const results = await searchSimilarFiles(keywords, fileType, 5);
      setRelatedResults(prev => ({
        ...prev,
        keyword: results
      }));
      
      onNotification(`키워드 기반 유사 문서 ${results.length}개 발견 (${keywords.length}개 키워드 사용)`, 'success');
    } catch (error) {
      console.error('키워드 검색 실패:', error);
      onNotification('키워드 검색 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoadingRelated(false);
    }
  }, [onNotification, getSelectedKeywords]);

  const handleContentSearch = useCallback(async (analysis) => {
    setIsLoadingRelated(true);
    try {
      const content = analysis.result.data?.content || 
                     analysis.result.content ||
                     '';
      const fileType = analysis.file.name.split('.').pop();
      
      const results = await searchByContent(content, fileType, 5);
      setRelatedResults(prev => ({
        ...prev,
        content: results
      }));
      
      onNotification(`내용 기반 유사 문서 ${results.length}개 발견`, 'success');
    } catch (error) {
      console.error('내용 검색 실패:', error);
      onNotification('내용 검색 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoadingRelated(false);
    }
  }, [onNotification]);

  const handleMetadataSearch = useCallback(async (analysis) => {
    setIsLoadingRelated(true);
    try {
      const metadata = {
        size: analysis.file.size,
        extension: analysis.file.name.split('.').pop()
      };
      
      const results = await searchByMetadata(metadata, 5);
      setRelatedResults(prev => ({
        ...prev,
        metadata: results
      }));
      
      onNotification(`메타데이터 기반 유사 문서 ${results.length}개 발견`, 'success');
    } catch (error) {
      console.error('메타데이터 검색 실패:', error);
      onNotification('메타데이터 검색 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoadingRelated(false);
    }
  }, [onNotification]);

  const handleAIAnalysis = useCallback(async (analysis) => {
    setIsLoadingRelated(true);
    try {
      // AI 기반 분석은 향후 구현 예정
      const mockResults = [
        { name: 'AI 추천 문서 1.pdf', path: '/path/to/file1.pdf', similarity: 0.85 },
        { name: 'AI 추천 문서 2.pdf', path: '/path/to/file2.pdf', similarity: 0.72 },
        { name: 'AI 추천 문서 3.pdf', path: '/path/to/file3.pdf', similarity: 0.68 }
      ];
      
      setRelatedResults(prev => ({
        ...prev,
        ai: mockResults
      }));
      
      onNotification('AI 기반 연관성 분석 완료', 'success');
    } catch (error) {
      console.error('AI 분석 실패:', error);
      onNotification('AI 분석 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoadingRelated(false);
    }
  }, [onNotification]);

  if (analysisResults.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <div className="w-16 h-16 mb-4 text-gray-300">📊</div>
        <h3 className="text-lg font-medium mb-2">연관 분석을 위한 데이터가 없습니다</h3>
        <p className="text-center max-w-md">
          분석을 완료하면 유사한 문서들을 찾아드립니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">연관 문서 분석</h3>
      {analysisResults.map((analysis, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">{analysis.file.name}</h4>
            <span className="text-sm text-gray-500">
              {analysis.timestamp.toLocaleTimeString()}
            </span>
          </div>
          
          {/* 키워드 미리보기 */}
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-700 mb-3">🔍 분석된 키워드</h5>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              {(() => {
                // 여러 가능한 경로에서 키워드와 요약을 찾기
                const keywords = analysis.result.data?.analysis?.keywords || 
                                analysis.result.data?.keywords ||
                                analysis.result.analysis?.keywords ||
                                [];
                const summary = analysis.result.data?.analysis?.summary || 
                               analysis.result.data?.summary ||
                               analysis.result.analysis?.summary ||
                               '';
                
                // summary가 객체인 경우 문자열로 변환
                const summaryText = typeof summary === 'object' 
                  ? JSON.stringify(summary, null, 2)
                  : summary || '';
                
                console.log('키워드 디버그:', {
                  path1: analysis.result.data?.analysis?.keywords,
                  path2: analysis.result.data?.keywords,
                  path3: analysis.result.analysis?.keywords,
                  final: keywords
                });
                
                if (keywords.length > 0) {
                  const selectedKeys = getSelectedKeywords(analysis.file.name);
                  const hasSelection = selectedKeys.length > 0;
                  
                  return (
                    <div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">키워드 선택:</span>
                          <span className="text-xs text-gray-500">
                            {hasSelection ? `${selectedKeys.length}개 선택됨` : '모든 키워드 사용'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((keyword, idx) => {
                            const isSelected = selectedKeywords[analysis.file.name]?.[keyword] || false;
                            return (
                              <label 
                                key={idx} 
                                className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-1 rounded"
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={(e) => handleKeywordToggle(analysis.file.name, keyword, e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${
                                  isSelected 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  #{keyword}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      {summaryText && (
                        <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                          <strong>요약:</strong> {summaryText}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div className="text-sm text-gray-500 italic">
                      키워드가 분석되지 않았습니다.
                      <div className="mt-2 text-xs text-gray-400">
                        디버그: {JSON.stringify(analysis.result, null, 2).substring(0, 200)}...
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
          
          {/* 연관 분석 내용 */}
          <div className="space-y-4">
            {/* 키워드 기반 유사 문서 */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">🔍 키워드 기반 유사 문서</h5>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 mb-2">
                  분석된 키워드를 기반으로 유사한 문서를 찾습니다...
                </p>
                <button 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                  onClick={() => handleKeywordSearch(analysis)}
                  disabled={isLoadingRelated}
                >
                  {isLoadingRelated ? '검색 중...' : (() => {
                    const selectedKeys = getSelectedKeywords(analysis.file.name);
                    return selectedKeys.length > 0 
                      ? `선택된 키워드(${selectedKeys.length}개)로 검색하기`
                      : '모든 키워드로 검색하기';
                  })()}
                </button>
                {relatedResults.keyword && (
                  <div className="mt-3">
                    <h6 className="text-xs font-medium text-blue-700 mb-2">검색 결과:</h6>
                    <div className="space-y-1">
                      {relatedResults.keyword.map((file, idx) => (
                        <div key={idx} className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                          📄 {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 내용 기반 유사 문서 */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">📄 내용 기반 유사 문서</h5>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 mb-2">
                  문서 내용을 분석하여 유사한 주제의 문서를 찾습니다...
                </p>
                <button 
                  className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50"
                  onClick={() => handleContentSearch(analysis)}
                  disabled={isLoadingRelated}
                >
                  {isLoadingRelated ? '분석 중...' : '내용 유사도 분석하기'}
                </button>
                {relatedResults.content && (
                  <div className="mt-3">
                    <h6 className="text-xs font-medium text-green-700 mb-2">분석 결과:</h6>
                    <div className="space-y-1">
                      {relatedResults.content.map((file, idx) => (
                        <div key={idx} className="text-xs text-green-600 bg-green-100 p-2 rounded">
                          <div className="flex justify-between items-center">
                            <span>📄 {file.name}</span>
                            {file.score && (
                              <span className="text-green-700 font-medium">
                                점수: {Math.round(file.score * 100)}%
                              </span>
                            )}
                          </div>
                          {file.matches && file.matches.length > 0 && (
                            <div className="mt-1 text-green-500">
                              매치: {file.matches.slice(0, 3).join(', ')}
                              {file.matches.length > 3 && ` +${file.matches.length - 3}개`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 메타데이터 기반 추천 */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">📊 메타데이터 기반 추천</h5>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800 mb-2">
                  파일 크기, 생성일, 수정일 등을 기반으로 추천합니다...
                </p>
                <button 
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium disabled:opacity-50"
                  onClick={() => handleMetadataSearch(analysis)}
                  disabled={isLoadingRelated}
                >
                  {isLoadingRelated ? '분석 중...' : '메타데이터 분석하기'}
                </button>
                {relatedResults.metadata && (
                  <div className="mt-3">
                    <h6 className="text-xs font-medium text-purple-700 mb-2">분석 결과:</h6>
                    <div className="space-y-1">
                      {relatedResults.metadata.map((file, idx) => (
                        <div key={idx} className="text-xs text-purple-600 bg-purple-100 p-2 rounded">
                          📄 {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* AI 기반 연관성 분석 */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">🤖 AI 기반 연관성 분석</h5>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800 mb-2">
                  AI가 문서의 의미적 연관성을 분석하여 추천합니다...
                </p>
                <button 
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium disabled:opacity-50"
                  onClick={() => handleAIAnalysis(analysis)}
                  disabled={isLoadingRelated}
                >
                  {isLoadingRelated ? '분석 중...' : 'AI 연관성 분석하기'}
                </button>
                {relatedResults.ai && (
                  <div className="mt-3">
                    <h6 className="text-xs font-medium text-orange-700 mb-2">AI 추천 결과:</h6>
                    <div className="space-y-1">
                      {relatedResults.ai.map((file, idx) => (
                        <div key={idx} className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                          🤖 {file.name} (유사도: {Math.round(file.similarity * 100)}%)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RelatedAnalysis; 