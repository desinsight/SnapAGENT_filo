import { nanoid } from 'nanoid';

/**
 * Excel 분석 결과를 블록으로 변환하는 분석기
 */
export class ExcelAnalyzer {
  /**
   * Excel 분석 결과를 블록으로 변환
   * @param {Object} analysisResult - 분석 결과 객체
   * @returns {Array} 블록 배열
   */
  static convertToBlocks(analysisResult) {
    const blocks = [];
    
    try {
      // 1. 제목 블록
      blocks.push({
        id: nanoid(),
        type: 'heading1',
        content: `📊 ${analysisResult.file.name} 분석 결과`,
        focused: false
      });
      
      // 2. 기본 정보
      const basicInfo = analysisResult.result.data?.summary || {};
      const metadata = analysisResult.result.data?.metadata || {};
      
      // 3. 시트 정보
      if (basicInfo.sheets) {
        blocks.push({
          id: nanoid(),
          type: 'text',
          content: `📋 총 시트 수: ${basicInfo.sheets}개`,
          focused: false
        });
      }
      
      // 4. 데이터 범위
      if (basicInfo.totalRows && basicInfo.totalColumns) {
        blocks.push({
          id: nanoid(),
          type: 'text',
          content: `📈 데이터 범위: ${basicInfo.totalRows.toLocaleString()}행 × ${basicInfo.totalColumns}열`,
          focused: false
        });
      }
      
      // 5. 셀 정보
      if (basicInfo.totalCells) {
        blocks.push({
          id: nanoid(),
          type: 'text',
          content: `📝 총 셀 수: ${basicInfo.totalCells.toLocaleString()}개`,
          focused: false
        });
      }
      
      // 6. 구분선
      blocks.push({
        id: nanoid(),
        type: 'divider',
        content: '',
        focused: false
      });
      
      // 7. 시트별 분석 (토글 블록)
      const sheets = analysisResult.result.data?.analysis?.sheets;
      if (sheets && sheets.length > 0) {
        sheets.forEach((sheet, index) => {
          const sheetContent = `📊 ${sheet.name}\n\n` +
            `행 수: ${sheet.rows}행\n` +
            `열 수: ${sheet.columns}열\n` +
            `데이터 셀: ${sheet.dataCells}개\n` +
            `빈 셀: ${sheet.emptyCells}개\n` +
            `데이터 밀도: ${((sheet.dataCells / (sheet.rows * sheet.columns)) * 100).toFixed(1)}%`;
          
          blocks.push({
            id: nanoid(),
            type: 'toggle',
            content: sheetContent,
            focused: false
          });
        });
      }
      
      // 8. 데이터 타입 분석
      const dataTypes = analysisResult.result.data?.analysis?.dataTypes;
      if (dataTypes) {
        const typeContent = Object.entries(dataTypes)
          .map(([type, count]) => `${type}: ${count}개`)
          .join('\n');
        
        blocks.push({
          id: nanoid(),
          type: 'text',
          content: `🔢 데이터 타입 분석:\n${typeContent}`,
          focused: false
        });
      }
      
      // 9. 통계 정보
      const statistics = analysisResult.result.data?.analysis?.statistics;
      if (statistics) {
        const statsContent = Object.entries(statistics)
          .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toLocaleString() : value}`)
          .join('\n');
        
        blocks.push({
          id: nanoid(),
          type: 'code',
          content: `📊 통계 정보:\n${statsContent}`,
          focused: false
        });
      }
      
      // 10. 수식 정보
      const formulas = analysisResult.result.data?.analysis?.formulas;
      if (formulas && formulas.length > 0) {
        blocks.push({
          id: nanoid(),
          type: 'text',
          content: `🧮 수식 개수: ${formulas.length}개`,
          focused: false
        });
        
        // 상위 5개 수식만 표시
        const topFormulas = formulas.slice(0, 5);
        topFormulas.forEach((formula, index) => {
          blocks.push({
            id: nanoid(),
            type: 'code',
            content: `수식 ${index + 1}: ${formula.cell} = ${formula.formula}`,
            focused: false
          });
        });
      }
      
      // 11. 차트 정보
      const charts = analysisResult.result.data?.analysis?.charts;
      if (charts && charts.length > 0) {
        blocks.push({
          id: nanoid(),
          type: 'text',
          content: `📈 차트 개수: ${charts.length}개`,
          focused: false
        });
        
        charts.forEach((chart, index) => {
          blocks.push({
            id: nanoid(),
            type: 'text',
            content: `차트 ${index + 1}: ${chart.type} (${chart.sheet})`,
            focused: false
          });
        });
      }
      
      // 12. 샘플 데이터 (테이블 블록)
      const sampleData = analysisResult.result.data?.analysis?.sampleData;
      if (sampleData && sampleData.length > 0) {
        const tableContent = sampleData.map(row => row.join(' | ')).join('\n');
        
        blocks.push({
          id: nanoid(),
          type: 'table',
          content: `📋 샘플 데이터:\n\n${tableContent}`,
          focused: false
        });
      }
      
    } catch (error) {
      console.error('Excel 분석 결과를 블록으로 변환 중 오류:', error);
      blocks.push({
        id: nanoid(),
        type: 'text',
        content: `❌ 블록 변환 중 오류가 발생했습니다: ${error.message}`,
        focused: false
      });
    }
    
    return blocks;
  }
  
  /**
   * 파일 확장자가 Excel인지 확인
   * @param {string} filename - 파일명
   * @returns {boolean} Excel 여부
   */
  static isExcelFile(filename) {
    const excelExtensions = ['.xls', '.xlsx', '.xlsm', '.xlsb'];
    const extension = filename.toLowerCase();
    return excelExtensions.some(ext => extension.endsWith(ext));
  }
} 