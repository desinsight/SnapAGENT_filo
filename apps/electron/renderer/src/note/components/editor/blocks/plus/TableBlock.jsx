import React, { useState, useRef, useEffect } from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';

/**
 * Enhanced TableBlock - Notion-style table component
 * @description 노션 스타일의 고급 표 컴포넌트. 헤더, 열 크기 조정, 호버 효과 등 지원
 */

const defaultRows = 3;
const defaultCols = 3;

const createEmptyTable = (rows = defaultRows, cols = defaultCols) => {
  const tableData = Array.from({ length: rows }, () => 
    Array.from({ length: cols }, () => ({
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }]
    }))
  );
  
  return tableData;
};

const TableBlock = ({ block, onUpdate, onFocus, readOnly = false, placeholder = "텍스트 입력", isEditing, onEditingChange }) => {
  const [table, setTable] = useState(block.content || createEmptyTable());
  const [editingCell, setEditingCell] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredCol, setHoveredCol] = useState(null);
  const [hasHeader, setHasHeader] = useState(block.metadata?.hasHeader ?? true);
  const [headerType, setHeaderType] = useState(block.metadata?.headerType || 'top'); // 'top', 'left', 'none'
  const [columnWidths, setColumnWidths] = useState(block.metadata?.columnWidths || {});
  const [isResizing, setIsResizing] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(block.metadata?.theme || 0);
  const tableRef = useRef(null);

  // 색상 테마 정의
  const colorThemes = [
    { name: '기본', colors: { background: 'white', header: '#f9fafb' } }, // 기본 색상
    { name: '파란색', colors: { background: '#f0f9ff', header: '#dbeafe' } },
    { name: '초록색', colors: { background: '#f0fdf4', header: '#dcfce7' } },
    { name: '보라색', colors: { background: '#fdf4ff', header: '#f3e8ff' } },
    { name: '노란색', colors: { background: '#fefce8', header: '#fef3c7' } }
  ];

  // 전역 클릭 및 키보드 이벤트 처리
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // 테이블 영역 외부 클릭 시 편집 상태 해제
      if (tableRef.current && !tableRef.current.contains(e.target)) {
        setEditingCell(null);
        setHoveredRow(null);
        setHoveredCol(null);
      }
    };

    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        setEditingCell(null);
        setHoveredRow(null);
        setHoveredCol(null);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // 테이블 데이터 업데이트
  const updateTable = (newTable, metadata = {}) => {
    setTable(newTable);
    onUpdate({ 
      content: newTable,
      metadata: { 
        hasHeader, 
        headerType,
        columnWidths,
        theme: currentTheme,
        ...block.metadata, 
        ...metadata 
      }
    });
  };

  const handleCellClick = (rowIdx, colIdx) => {
    if (readOnly || isResizing) return; // 리사이즈 중이면 무시
    setEditingCell({ row: rowIdx, col: colIdx });
    // 새로운 셀 편집 시 선택 상태 초기화
  };

  const handleCellChange = (json, rowIdx, colIdx) => {
    const newTable = table.map((row, r) =>
      row.map((cell, c) => (r === rowIdx && c === colIdx ? json : cell))
    );
    updateTable(newTable);
  };

  const handleKeyDown = (e, rowIdx, colIdx) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;
      const nextRow = rowIdx;
      
      if (nextCol >= 0 && nextCol < table[0].length) {
        setEditingCell({ row: nextRow, col: nextCol });
      } else if (!e.shiftKey && colIdx === table[0].length - 1) {
        // 마지막 열에서 Tab을 누르면 다음 행의 첫 번째 열로
        if (nextRow + 1 < table.length) {
          setEditingCell({ row: nextRow + 1, col: 0 });
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIdx + 1 < table.length) {
        setEditingCell({ row: rowIdx + 1, col: colIdx });
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleAddRow = (insertAt = table.length) => {
    const newRow = Array(table[0].length).fill(null).map(() => ({
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }]
    }));
    const newTable = [...table.slice(0, insertAt), newRow, ...table.slice(insertAt)];
    updateTable(newTable);
  };

  const handleAddCol = (insertAt = table[0].length) => {
    const newTable = table.map(row => [...row.slice(0, insertAt), {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }]
    }, ...row.slice(insertAt)]);
    updateTable(newTable);
  };

  const handleDeleteRow = (rowIdx) => {
    if (table.length <= 1) return;
    const newTable = table.filter((_, r) => r !== rowIdx);
    updateTable(newTable);
    setEditingCell(null);
  };

  const handleDeleteCol = (colIdx) => {
    if (table[0].length <= 1) return;
    const newTable = table.map(row => row.filter((_, c) => c !== colIdx));
    updateTable(newTable);
    setEditingCell(null);
  };

  const toggleHeader = () => {
    const newHasHeader = !hasHeader;
    const newHeaderType = newHasHeader ? 'top' : 'none';
    setHasHeader(newHasHeader);
    setHeaderType(newHeaderType);
    updateTable(table, { hasHeader: newHasHeader, headerType: newHeaderType });
  };

  const cycleHeaderType = () => {
    let newHeaderType;
    let newHasHeader;
    
    switch (headerType) {
      case 'none':
        newHeaderType = 'top';
        newHasHeader = true;
        break;
      case 'top':
        newHeaderType = 'left';
        newHasHeader = true;
        break;
      case 'left':
        newHeaderType = 'none';
        newHasHeader = false;
        break;
      default:
        newHeaderType = 'top';
        newHasHeader = true;
    }
    
    setHeaderType(newHeaderType);
    setHasHeader(newHasHeader);
    updateTable(table, { hasHeader: newHasHeader, headerType: newHeaderType });
  };

  const getHeaderTypeLabel = () => {
    switch (headerType) {
      case 'top':
        return '상단 헤더';
      case 'left':
        return '좌측 헤더';
      case 'none':
        return '헤더 없음';
      default:
        return '헤더 없음';
    }
  };

  // 열 크기 자동 맞춤
  const handleAutoFitColumns = () => {
    if (!tableRef.current || table.length === 0) return;
    
    const tableElement = tableRef.current;
    const totalWidth = tableElement.offsetWidth;
    const colCount = table[0].length;
    const equalWidth = Math.max(120, Math.floor(totalWidth / colCount)); // 최소 120px
    
    const newColumnWidths = {};
    for (let i = 0; i < colCount; i++) {
      newColumnWidths[i] = equalWidth;
    }
    
    setColumnWidths(newColumnWidths);
    updateTable(table, { columnWidths: newColumnWidths });
  };

  // 열 크기 내용에 맞게 자동 조정
  const handleAutoFitContent = () => {
    if (!tableRef.current || table.length === 0) return;
    
    const newColumnWidths = {};
    
    // 각 열의 내용을 기준으로 최적 너비 계산
    for (let colIdx = 0; colIdx < table[0].length; colIdx++) {
      let maxLength = 0;
      
      // 해당 열의 모든 행을 확인하여 최대 텍스트 길이 찾기
      for (let rowIdx = 0; rowIdx < table.length; rowIdx++) {
        const cellContent = table[rowIdx][colIdx] || '';
        maxLength = Math.max(maxLength, cellContent.length);
      }
      
      // 텍스트 길이를 기반으로 너비 계산 (최소 120px, 최대 300px)
      const calculatedWidth = Math.max(120, Math.min(300, maxLength * 8 + 60));
      newColumnWidths[colIdx] = calculatedWidth;
    }
    
    setColumnWidths(newColumnWidths);
    updateTable(table, { columnWidths: newColumnWidths });
  };

  // 열 크기 초기화
  const handleResetColumns = () => {
    setColumnWidths({});
    updateTable(table, { columnWidths: {} });
  };

  // 블록 크기에 맞춤
  const handleFitToBlock = () => {
    if (!tableRef.current || table.length === 0) return;
    
    // 컨테이너의 실제 너비를 가져옴
    const containerElement = tableRef.current.parentElement;
    const containerWidth = containerElement.clientWidth; // clientWidth 사용으로 스크롤바 제외
    const colCount = table[0].length;
    
    // 테두리, 패딩 등을 고려한 여백 (각 셀의 border 1px * 2 + 여유 공간)
    const totalBorderWidth = (colCount + 1) * 1; // 모든 border 너비
    const safetyMargin = 10; // 안전 여백
    const availableWidth = containerWidth - totalBorderWidth - safetyMargin;
    
    // 사용 가능한 너비를 열 개수로 나누어 균등 분배
    const equalWidth = Math.floor(availableWidth / colCount);
    
    const newColumnWidths = {};
    for (let i = 0; i < colCount; i++) {
      newColumnWidths[i] = equalWidth;
    }
    
    setColumnWidths(newColumnWidths);
    updateTable(table, { columnWidths: newColumnWidths });
  };

  // 색상 테마 전환
  const handleThemeChange = () => {
    const nextTheme = (currentTheme + 1) % colorThemes.length;
    setCurrentTheme(nextTheme);
    updateTable(table, { theme: nextTheme });
  };

  return (
    <div 
      className="table-block py-3 group" 
      onClick={(e) => {
        // 테이블 외부 클릭 시 편집 상태 해제
        if (e.target === e.currentTarget) {
          setEditingCell(null);
          setHoveredRow(null);
          setHoveredCol(null);
        }
        onFocus();
      }}
    >
      {/* 테이블 옵션 바 - 호버 시에만 표시 */}
      {!readOnly && (
        <div className="flex items-center gap-2 mb-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={cycleHeaderType}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
              hasHeader 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            } hover:scale-105`}
          >
            {/* 헤더 타입 아이콘 */}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {headerType === 'top' && (
                <>
                  <rect x="3" y="3" width="18" height="4" strokeWidth="2"/>
                  <rect x="3" y="9" width="18" height="12" strokeWidth="1" opacity="0.5"/>
                </>
              )}
              {headerType === 'left' && (
                <>
                  <rect x="3" y="3" width="4" height="18" strokeWidth="2"/>
                  <rect x="9" y="3" width="12" height="18" strokeWidth="1" opacity="0.5"/>
                </>
              )}
              {headerType === 'none' && (
                <rect x="3" y="3" width="18" height="18" strokeWidth="1" opacity="0.5"/>
              )}
            </svg>
            {getHeaderTypeLabel()}
          </button>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
          <button
            onClick={() => handleAddRow()}
            className="px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md text-xs font-medium hover:bg-green-200 dark:hover:bg-green-800/30 transition-all hover:scale-105"
          >
            + 행
          </button>
          <button
            onClick={() => handleAddCol()}
            className="px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md text-xs font-medium hover:bg-green-200 dark:hover:bg-green-800/30 transition-all hover:scale-105"
          >
            + 열
          </button>
          {/* 행 삭제 버튼 */}
          {table.length > 1 && (
            <button
              onClick={() => {
                // 마지막 행 삭제
                const newTable = table.slice(0, -1);
                updateTable(newTable);
                setEditingCell(null);
              }}
              className="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800/30 transition-all hover:scale-105"
              title="마지막 행 삭제"
            >
              - 행
            </button>
          )}
          {/* 열 삭제 버튼 */}
          {table[0] && table[0].length > 1 && (
            <button
              onClick={() => {
                // 마지막 열 삭제
                const newTable = table.map(row => row.slice(0, -1));
                updateTable(newTable);
                setEditingCell(null);
              }}
              className="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800/30 transition-all hover:scale-105"
              title="마지막 열 삭제"
            >
              - 열
            </button>
          )}
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
          
          {/* 표 맞춤 버튼들 */}
          <button
            onClick={handleAutoFitColumns}
            className="px-3 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded-md text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-all hover:scale-105 flex items-center gap-1"
            title="모든 열을 동일한 크기로 맞춤"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5"/>
              <line x1="9" y1="4" x2="9" y2="20" strokeWidth="1.5"/>
              <line x1="15" y1="4" x2="15" y2="20" strokeWidth="1.5"/>
            </svg>
            균등 맞춤
          </button>
          <button
            onClick={handleAutoFitContent}
            className="px-3 py-1.5 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded-md text-xs font-medium hover:bg-orange-200 dark:hover:bg-orange-800/30 transition-all hover:scale-105 flex items-center gap-1"
            title="내용에 맞게 열 크기 자동 조정"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5"/>
              <line x1="8" y1="4" x2="8" y2="20" strokeWidth="1.5"/>
              <line x1="16" y1="4" x2="16" y2="20" strokeWidth="1.5"/>
              <path d="M6 12h4M14 12h4" strokeWidth="1"/>
            </svg>
            내용 맞춤
          </button>
          <button
            onClick={handleFitToBlock}
            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-md text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800/30 transition-all hover:scale-105 flex items-center gap-1"
            title="블록 너비에 맞게 표 크기 조정"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5"/>
              <path d="M3 12h18" strokeWidth="1.5"/>
              <path d="M7 8v8M17 8v8" strokeWidth="1.5" strokeDasharray="2 2"/>
            </svg>
            블록 맞춤
          </button>
          <button
            onClick={handleResetColumns}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-md text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all hover:scale-105 flex items-center gap-1"
            title="열 크기를 기본값으로 초기화"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            초기화
          </button>
          <button
            onClick={handleThemeChange}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 flex items-center gap-1 ${
              currentTheme === 0 
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' 
                : 'bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-purple-400'
            }`}
            title={`현재: ${colorThemes[currentTheme].name}`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="6" />
            </svg>
            색상 테마
          </button>
        </div>
      )}

      {/* 테이블 컨테이너 */}
      <div 
        className="overflow-x-auto overflow-y-auto max-h-96 w-full custom-scrollbar"
        style={{ 
          cursor: 'default',
          maxWidth: '100%'
        }}
        onClick={(e) => {
          // 테이블 컨테이너 배경 클릭 시 편집 상태 해제
          if (e.target === e.currentTarget) {
            setEditingCell(null);
            setHoveredRow(null);
            setHoveredCol(null);
          }
        }}
      >
        <table 
          ref={tableRef}
          className="min-w-[400px] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          style={{ 
            tableLayout: 'fixed', 
            width: table.length > 0 ? 
              Object.keys(columnWidths).length > 0 ? 
                Object.values(columnWidths).reduce((sum, width) => sum + width, 0) + 'px' :
                (table[0].length * 120) + 'px' : 
              '100%',
            backgroundColor: colorThemes[currentTheme].colors.background || 'white',
            borderCollapse: 'separate',
            borderSpacing: '0'
          }}
          onMouseLeave={() => {
            setHoveredRow(null);
            setHoveredCol(null);
          }}
        >
          <colgroup>
            {table[0].map((_, colIdx) => (
              <col key={colIdx} style={{ width: (columnWidths[colIdx] || 120) + 'px' }} />
            ))}
          </colgroup>
          <tbody>
            {table.map((row, rowIdx) => (
              <tr 
                key={rowIdx}
                className="group"
                style={{
                  backgroundColor: (headerType === 'top' && rowIdx === 0) 
                    ? colorThemes[currentTheme].colors.header 
                    : undefined
                }}
                onMouseEnter={() => setHoveredRow(rowIdx)}
              >
                {row.map((cell, colIdx) => (
                  <td 
                    key={colIdx} 
                    className={`border-r border-b border-gray-200 dark:border-gray-700 relative group/cell ${
                      (headerType === 'top' && rowIdx === 0) || (headerType === 'left' && colIdx === 0) 
                        ? 'font-semibold' : ''
                    } ${
                      // 모서리 셀에 rounded 적용
                      rowIdx === 0 && colIdx === 0 ? 'rounded-tl-lg' : ''
                    } ${
                      rowIdx === 0 && colIdx === row.length - 1 ? 'rounded-tr-lg' : ''
                    } ${
                      rowIdx === table.length - 1 && colIdx === 0 ? 'rounded-bl-lg' : ''
                    } ${
                      rowIdx === table.length - 1 && colIdx === row.length - 1 ? 'rounded-br-lg' : ''
                    }`}
                    style={{ 
                      backgroundColor: (headerType === 'left' && colIdx === 0) 
                        ? colorThemes[currentTheme].colors.header 
                        : undefined
                    }}
                    onMouseEnter={() => setHoveredCol(colIdx)}
                  >
                    {/* 셀 내용 */}
                    <div className="px-3 py-2 min-h-[32px]">
                      {editingCell?.row === rowIdx && editingCell?.col === colIdx ? (
                        <ProseMirrorTextEditor
                          content={cell}
                          onChange={(json) => handleCellChange(json, rowIdx, colIdx)}
                          placeholder={(headerType === 'top' && rowIdx === 0) 
                            ? '열 제목' 
                            : (headerType === 'left' && colIdx === 0) 
                              ? '행 제목' 
                              : placeholder}
                          readOnly={readOnly}
                          blockId={`table-cell-${block.id}-${rowIdx}-${colIdx}`}
                          blockType="table-cell"
                          className="w-full text-sm outline-none min-h-[20px]"
                          style={{ 
                            fontSize: '14px',
                            lineHeight: '1.5',
                            fontFamily: 'inherit',
                            fontWeight: 'inherit',
                            fontStyle: 'normal',
                            textAlign: 'left',
                            color: 'inherit',
                            backgroundColor: 'transparent'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab' || e.key === 'Enter') {
                              handleKeyDown(e, rowIdx, colIdx);
                            }
                          }}
                          onBlur={() => setEditingCell(null)}
                          autoFocus={true}
                        />
                      ) : (
                        <div
                          className="w-full min-h-[20px] text-sm cursor-text"
                          onClick={(e) => {
                            if (isResizing) return;
                            e.stopPropagation();
                            handleCellClick(rowIdx, colIdx);
                          }}
                        >
                          <ProseMirrorTextEditor
                            content={cell}
                            onChange={() => {}}
                            placeholder={(headerType === 'top' && rowIdx === 0) 
                              ? '열 제목' 
                              : (headerType === 'left' && colIdx === 0) 
                                ? '행 제목' 
                                : placeholder}
                            readOnly={true}
                            blockId={`table-cell-view-${block.id}-${rowIdx}-${colIdx}`}
                            blockType="table-cell-view"
                            className="w-full text-sm pointer-events-none"
                            style={{ 
                              fontSize: '14px',
                              lineHeight: '1.5',
                              fontFamily: 'inherit',
                              fontWeight: 'inherit',
                              fontStyle: 'normal',
                              textAlign: 'left',
                              color: 'inherit',
                              backgroundColor: 'transparent'
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {/* 열 크기 조정 핸들 */}
                    {!readOnly && (
                      <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors z-10"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation(); // 셀 클릭 이벤트 전파 방지
                          setIsResizing(true);
                          const startX = e.clientX;
                          const startWidth = columnWidths[colIdx] || 120;
                          const colIndex = colIdx;
                          
                          // 모든 열의 현재 너비를 고정하여 다른 열이 영향받지 않도록 함
                          const currentWidths = { ...columnWidths };
                          for (let i = 0; i < table[0].length; i++) {
                            if (!currentWidths[i]) {
                              currentWidths[i] = 120;
                            }
                          }
                          setColumnWidths(currentWidths);
                          
                          const handleMouseMove = (moveEvent) => {
                            const diff = moveEvent.clientX - startX;
                            const newWidth = Math.max(80, startWidth + diff);
                            
                            setColumnWidths(prev => ({
                              ...prev,
                              [colIndex]: newWidth
                            }));
                          };
                          
                          const handleMouseUp = () => {
                            setIsResizing(false);
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                            updateTable(table, { columnWidths: { ...columnWidths } });
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
};

export default TableBlock; 