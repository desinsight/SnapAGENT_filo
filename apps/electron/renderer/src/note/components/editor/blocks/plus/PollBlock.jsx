import React, { useState, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';

/**
 * PollBlock - 미니멀한 투표 블록
 * @description 깔끔하고 현대적인 투표 시스템
 */
const PollBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  placeholder = "질문을 입력하세요", 
  isEditing, 
  onEditingChange 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [title, setTitle] = useState(block.content?.title || '');
  const [options, setOptions] = useState(block.content?.options || [
    { id: nanoid(), text: '', votes: 0 },
    { id: nanoid(), text: '', votes: 0 }
  ]);
  const [totalVotes, setTotalVotes] = useState(block.content?.totalVotes || 0);
  const [userVoted, setUserVoted] = useState(block.content?.userVoted || false);
  const [selectedOption, setSelectedOption] = useState(block.content?.selectedOption || null);
  const [showResults, setShowResults] = useState(block.content?.showResults || false);
  const [allowMultiple, setAllowMultiple] = useState(block.content?.allowMultiple || false);

  const containerRef = useRef(null);

  // 콘텐츠 업데이트
  const updateContent = useCallback(() => {
    onUpdate({
      content: {
        title,
        options,
        totalVotes,
        userVoted,
        selectedOption,
        showResults,
        allowMultiple
      }
    });
  }, [title, options, totalVotes, userVoted, selectedOption, showResults, allowMultiple, onUpdate]);

  // 제목 변경
  const handleTitleChange = useCallback((content) => {
    setTitle(content);
    setTimeout(updateContent, 0);
  }, [updateContent]);

  // 옵션 추가
  const addOption = useCallback(() => {
    const newOption = { id: nanoid(), text: '', votes: 0 };
    setOptions(prev => [...prev, newOption]);
    setTimeout(updateContent, 0);
  }, [updateContent]);

  // 옵션 제거
  const removeOption = useCallback((optionId) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter(opt => opt.id !== optionId));
    setTimeout(updateContent, 0);
  }, [options.length, updateContent]);

  // 옵션 텍스트 변경
  const handleOptionChange = useCallback((optionId, content) => {
    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, text: content } : opt
    ));
    setTimeout(updateContent, 0);
  }, [updateContent]);

  // 투표하기
  const handleVote = useCallback((optionId) => {
    if (readOnly || userVoted) return;

    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    ));
    setTotalVotes(prev => prev + 1);
    setUserVoted(true);
    setSelectedOption(optionId);
    setShowResults(true);
    setTimeout(updateContent, 0);
  }, [readOnly, userVoted, updateContent]);

  // 투표 리셋
  const resetPoll = useCallback(() => {
    setOptions(prev => prev.map(opt => ({ ...opt, votes: 0 })));
    setTotalVotes(0);
    setUserVoted(false);
    setSelectedOption(null);
    setShowResults(false);
    setTimeout(updateContent, 0);
  }, [updateContent]);

  // 결과 보기/숨기기
  const toggleResults = useCallback(() => {
    setShowResults(prev => !prev);
    setTimeout(updateContent, 0);
  }, [updateContent]);

  // 투표율 계산
  const getPercentage = useCallback((votes) => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  }, [totalVotes]);

  return (
    <div 
      ref={containerRef}
      className="group relative w-full py-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onFocus}
    >
      {/* 메인 컨테이너 */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg">
        
        {/* 타이틀 */}
        <div className="px-4 py-3">
          <ProseMirrorTextEditor
            content={title}
            onChange={handleTitleChange}
            placeholder={placeholder}
            readOnly={readOnly}
            blockId={`${block.id}-title`}
            blockType="poll-title"
            className="text-base font-medium text-gray-900 dark:text-gray-100"
            style={{
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '1.5'
            }}
          />
        </div>

        {/* 옵션 리스트 */}
        <div className="px-4 py-3 space-y-2">
          {options.map((option, index) => {
            const percentage = getPercentage(option.votes);
            const isSelected = selectedOption === option.id;
            const showBar = showResults && totalVotes > 0;

            return (
              <div key={option.id} className="group/option relative">
                <div className="flex items-center space-x-3 relative">
                  {/* 투표 버튼 */}
                  {!showResults && (
                    <button
                      onClick={() => handleVote(option.id)}
                      disabled={readOnly || userVoted}
                      className={`
                        flex-shrink-0 w-4 h-4 rounded-full border transition-all duration-200
                        ${userVoted && isSelected 
                          ? 'border-gray-800 dark:border-gray-200 bg-gray-800 dark:bg-gray-200' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400'
                        }
                        ${readOnly || userVoted ? 'cursor-default' : 'cursor-pointer'}
                      `}
                    >
                      {userVoted && isSelected && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white dark:bg-gray-900 rounded-full"></div>
                        </div>
                      )}
                    </button>
                  )}

                  {/* 결과 모드 인덱스 */}
                  {showResults && (
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center justify-center">
                      {index + 1}
                    </div>
                  )}

                  {/* 옵션 텍스트 */}
                  <div className="flex-1 relative min-h-[24px]">
                    {/* 진행률 바 배경 */}
                    {showBar && (
                      <div 
                        className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                    
                    <div className="relative z-10">
                      <ProseMirrorTextEditor
                        content={option.text}
                        onChange={(content) => handleOptionChange(option.id, content)}
                        placeholder={`옵션 ${index + 1}`}
                        readOnly={readOnly}
                        blockId={`${block.id}-option-${option.id}`}
                        blockType="poll-option"
                        className="text-sm text-gray-800 dark:text-gray-200"
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }}
                      />
                    </div>
                  </div>

                  {/* 결과 표시 */}
                  {showResults && (
                    <div className="flex-shrink-0 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{option.votes}</span>
                      <span className="text-gray-400 dark:text-gray-500">({percentage}%)</span>
                    </div>
                  )}

                  {/* 선택된 옵션 표시 */}
                  {isSelected && userVoted && showResults && (
                    <div className="flex-shrink-0">
                      <div className="w-1.5 h-1.5 bg-gray-800 dark:bg-gray-200 rounded-full"></div>
                    </div>
                  )}

                  {/* 옵션 삭제 버튼 */}
                  {!readOnly && options.length > 2 && isHovered && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(option.id);
                      }}
                      className="flex-shrink-0 w-4 h-4 opacity-0 group-hover/option:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 컨트롤 바 */}
        {!readOnly && isHovered && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={addOption}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 flex items-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>옵션 추가</span>
                </button>

                {totalVotes > 0 && (
                  <button
                    onClick={toggleResults}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                  >
                    {showResults ? '투표 모드' : '결과 보기'}
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {totalVotes > 0 && (
                  <>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {totalVotes}표
                    </span>
                    <button
                      onClick={resetPoll}
                      className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200"
                    >
                      초기화
                    </button>
                  </>
                )}

                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowMultiple}
                    onChange={(e) => {
                      setAllowMultiple(e.target.checked);
                      setTimeout(updateContent, 0);
                    }}
                    className="w-3 h-3 text-gray-600 bg-white border-gray-300 rounded focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">복수선택</span>
                </label>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 최소한의 상태 표시 */}
      {userVoted && !isHovered && (
        <div className="mt-2 flex items-center justify-center">
          <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>투표 완료</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollBlock;