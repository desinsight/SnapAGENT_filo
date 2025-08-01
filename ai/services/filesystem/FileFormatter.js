/**
 * 📝 FILE FORMATTER - 파일 포맷팅 및 표현 엔진
 * 역할: 파일 내용을 다양한 형식으로 변환하고 스타일링
 * 기능: 파일 형식 변환, 내용 포맷팅, 다중 형식 출력, 실시간 감지
 * 특징: 형식 변환, 스타일링, 다중 출력, 성능 최적화
 */

/**
 * 🌟 World-Class File Formatter Class
 */
export class FileFormatter {
  constructor() {
    this.initialized = false;
    this.formatCache = new Map();
  }

  async initialize() {
    try {
      console.log('🎨 FileFormatter 초기화 중...');
      this.initialized = true;
      console.log('✅ FileFormatter 초기화 완료');
    } catch (error) {
      console.error('❌ FileFormatter 초기화 실패:', error);
    }
  }

  async cleanup() {
    try {
      console.log('🎨 FileFormatter 정리 중...');
      this.formatCache.clear();
      this.initialized = false;
      console.log('✅ FileFormatter 정리 완료');
    } catch (error) {
      console.error('❌ FileFormatter 정리 실패:', error);
    }
  }

  /**
   * 초기화 상태 확인 메서드
   */
  isReady() {
    return this.initialized;
  }

  /**
 * 파일/폴더 목록을 받아서 자연어로 요약합니다.
 * @param {Array} files - 파일/폴더 객체 배열 [{name, type, isDirectory, size, ...}]
 * @param {Object} [options] - 옵션 (예: 경로, 언어 등)
 * @returns {string} - 자연어 요약
 */
  formatFileListResult(files, options = {}) {
  if (!Array.isArray(files)) return '⚠️ 파일 목록 정보를 불러올 수 없습니다.';
  if (files.length === 0) return '이 폴더는 비어 있습니다.';

  const folders = files.filter(f => f.isDirectory || f.type === 'directory');
  const regularFiles = files.filter(f => !f.isDirectory && f.type !== 'directory');

  let summary = `총 ${files.length}개 항목이 있습니다.`;
  if (folders.length > 0) summary += `\n- 폴더: ${folders.length}개 (${folders.map(f => f.name).join(', ')})`;
  if (regularFiles.length > 0) summary += `\n- 파일: ${regularFiles.length}개 (${regularFiles.map(f => f.name).join(', ')})`;

  return summary;
}

/**
 * 파일 검색 결과를 받아서 자연어로 요약합니다.
 * @param {Array} results - 검색 결과 객체 배열
 * @param {Object} [options] - 옵션
 * @returns {string}
 */
  formatFileSearchResult(results, options = {}) {
  if (!Array.isArray(results)) return '⚠️ 파일 검색 결과를 불러올 수 없습니다.';
  if (results.length === 0) return '검색 결과가 없습니다.';
  return `총 ${results.length}개 결과:\n` + results.map(r => `- ${r.name} (${r.path || r.fullPath || ''})`).join('\n');
}

/**
 * 파일 읽기 결과를 자연어로 요약합니다.
 * @param {string|object} content
 * @param {Object} [options]
 * @returns {string}
 */
  formatFileReadResult(content, options = {}) {
  if (!content) return '⚠️ 파일 내용을 불러올 수 없습니다.';
  if (typeof content === 'string') {
    if (content.length === 0) return '이 파일은 비어 있습니다.';
    if (content.length > 500) return `파일 내용(요약):\n${content.slice(0, 500)}... (이하 생략)`;
    return `파일 내용:\n${content}`;
  }
  return `파일 내용: ${JSON.stringify(content)}`;
}

/**
 * 파일 쓰기 결과를 자연어로 요약합니다.
 * @param {object} result
 * @returns {string}
 */
  formatFileWriteResult(result) {
  if (!result || !result.success) return '⚠️ 파일 쓰기에 실패했습니다.';
  return `파일이 성공적으로 저장되었습니다. (경로: ${result.path}, 크기: ${result.size}바이트)`;
}

/**
 * 파일 삭제 결과를 자연어로 요약합니다.
 * @param {object} result
 * @returns {string}
 */
  formatFileDeleteResult(result) {
  if (!result || !result.success) return '⚠️ 파일 삭제에 실패했습니다.';
  return `파일이 성공적으로 삭제되었습니다. (경로: ${result.path})`;
}

/**
 * 파일 복사 결과를 자연어로 요약합니다.
 * @param {object} result
 * @returns {string}
 */
  formatFileCopyResult(result) {
  if (!result || !result.success) return '⚠️ 파일 복사에 실패했습니다.';
  return `파일이 성공적으로 복사되었습니다. (원본: ${result.sourcePath} → 대상: ${result.destPath})`;
}

/**
 * 파일 이동 결과를 자연어로 요약합니다.
 * @param {object} result
 * @returns {string}
 */
  formatFileMoveResult(result) {
  if (!result || !result.success) return '⚠️ 파일 이동에 실패했습니다.';
  return `파일이 성공적으로 이동되었습니다. (원본: ${result.sourcePath} → 대상: ${result.destPath})`;
}

/**
 * 경로 검증 결과를 자연어로 요약합니다.
 * @param {object} result
 * @returns {string}
 */
  formatPathValidationResult(result) {
  if (!result) return '⚠️ 경로 검증 결과를 알 수 없습니다.';
  if (result.valid) return `경로가 유효합니다: ${result.path}`;
  return `경로가 유효하지 않습니다: ${result.path || ''}`;
}

/**
 * 디렉토리 분석 결과를 자연어로 요약 (간단)
 */
  formatDirectoryAnalysisSimple(analysis, path) {
  if (!analysis) return `분석 결과를 불러올 수 없습니다.`;
  return `${path} 폴더에는 총 ${analysis.total}개 항목이 있습니다. 폴더: ${analysis.folders}개, 파일: ${analysis.files}개.`;
}

/**
 * 디렉토리 분석 결과를 표 형태로 반환
 */
  formatDirectoryAnalysisTable(analysis, path) {
  if (!analysis) return `분석 결과를 불러올 수 없습니다.`;
  let table = `| 구분 | 개수 |\n|---|---|\n| 폴더 | ${analysis.folders} |\n| 파일 | ${analysis.files} |\n| 전체 | ${analysis.total} |`;
  if (analysis.byExtension) {
    table += '\n| 확장자별 | |';
    Object.entries(analysis.byExtension).forEach(([ext, cnt]) => {
      table += `\n| .${ext} | ${cnt} |`;
    });
  }
  return table;
}

/**
 * 파일 추천 결과를 자연어로 요약
 */
  formatFileRecommendations(recommendations, options = {}) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) return '추천 파일이 없습니다.';
  return `AI가 추천하는 파일: ${recommendations.map(f => f.name).join(', ')}`;
}

/**
 * 보안 인사이트를 자연어로 요약
 */
  formatSecurityStatus(insights, path) {
  if (!insights) return '보안 인사이트를 불러올 수 없습니다.';
  if (insights.risk === 0) return `${path} 폴더는 보안 위험이 없습니다.`;
  return `${path} 폴더에서 ${insights.riskCount}건의 보안 위험이 감지되었습니다.`;
}

/**
 * 성능 인사이트를 자연어로 요약
 */
  formatPerformanceReport(perf, path) {
  if (!perf) return '성능 정보를 불러올 수 없습니다.';
  return `${path} 폴더의 평균 응답속도는 ${perf.avgResponseTime}ms, 캐시 적중률은 ${perf.cacheHitRate}%입니다.`;
}

/**
 * 실시간 모니터링 상태를 자연어로 요약
 */
  formatRealtimeMonitoringStatus(status, path) {
  if (!status) return '모니터링 정보를 불러올 수 없습니다.';
  return `${path} 폴더는 실시간 변경 감지 중입니다. 최근 10분간 ${status.changeCount}건 변경.`;
}

/**
 * 트렌드 요약
 */
  formatTrendSummary(trend, path) {
  if (!trend) return '트렌드 정보를 불러올 수 없습니다.';
  return `${path} 폴더는 최근 ${trend.period} 동안 ${trend.accessCount}회 접근, ${trend.editCount}회 수정.`;
}

/**
 * AI 해설/추천 문구
 */
  formatAIInsights(ai, path) {
  if (!ai) return 'AI 인사이트를 불러올 수 없습니다.';
  return `AI 분석 결과: ${ai.summary}`;
}

/**
 * 배치 작업 결과 요약
 */
  formatBatchOperationSummary(results) {
  if (!results) return '배치 작업 결과를 불러올 수 없습니다.';
  return `총 ${results.total}개 작업 중 ${results.success}개 성공, ${results.fail}개 실패.`;
}

/**
 * 다양한 경고/알림 메시지
 */
  formatAlertMessage(type, message) {
  const icons = { warning: '⚠️', info: 'ℹ️', success: '✅', error: '❌' };
  return `${icons[type] || ''} ${message}`;
}

/**
 * 폴더/파일 개수, 이름, 통계 등 실제 데이터 기반으로 절대 오답 없는 자연어 요약
 */
  formatFileListAccurate(files, options = {}) {
  if (!Array.isArray(files)) return '⚠️ 파일 목록 정보를 불러올 수 없습니다.';
  if (files.length === 0) return '이 폴더는 비어 있습니다.';
  const folders = files.filter(f => f.isDirectory || f.type === 'directory');
  const regularFiles = files.filter(f => !f.isDirectory && f.type !== 'directory');
  let msg = `총 ${files.length}개 항목이 있습니다.`;
  if (folders.length > 0) msg += `\n- 폴더: ${folders.length}개 (${folders.map(f => f.name).join(', ')})`;
  if (regularFiles.length > 0) msg += `\n- 파일: ${regularFiles.length}개 (${regularFiles.map(f => f.name).join(', ')})`;
  return msg;
}

/**
 * 폴더/파일 개수, 이름, 통계 등 실제 데이터 기반으로 절대 오답 없는 구조화 JSON 반환
 */
  getFileListAccurateJSON(files) {
  if (!Array.isArray(files)) return { error: '파일 목록 정보를 불러올 수 없습니다.' };
  const folders = files.filter(f => f.isDirectory || f.type === 'directory');
  const regularFiles = files.filter(f => !f.isDirectory && f.type !== 'directory');
  return {
    total: files.length,
    folders: folders.map(f => f.name),
    files: regularFiles.map(f => f.name),
    folderCount: folders.length,
    fileCount: regularFiles.length
  };
}

/**
 * 예외/오류/권한/빈폴더 등 모든 상황을 커버하는 절대 오답 없는 안내
 */
  formatFileListRobust(files, error, options = {}) {
  if (error) {
    if (error.code === 'EACCES' || error.message?.includes('권한')) return '⚠️ 해당 폴더/파일에 접근 권한이 없습니다.';
      if (error.code === 'ENOENT' || error.message?.includes('찾을 수 없음')) return '⚠️ 해당 경로를 찾을 수 없습니다.';
      if (error.code === 'ENOTDIR' || error.message?.includes('디렉토리가 아님')) return '⚠️ 해당 경로는 폴더가 아닙니다.';
      return `⚠️ 오류가 발생했습니다: ${error.message}`;
  }
    
  if (!Array.isArray(files)) return '⚠️ 파일 목록 정보를 불러올 수 없습니다.';
  if (files.length === 0) return '이 폴더는 비어 있습니다.';
    return this.formatFileListAccurate(files, options);
}

/**
 * AI가 오답을 내지 않도록, 실제 데이터와 함께 자연어+구조화 JSON을 동시에 반환
 */
  formatFileListHybrid(files, error, options = {}) {
  return {
      summary: this.formatFileListRobust(files, error, options),
      data: this.getFileListAccurateJSON(files)
  };
}

/**
 * 대용량 폴더(수천~수만 개 파일) 요약 (샘플링)
 */
  formatLargeDirectorySummary(files, options = {}) {
  if (!Array.isArray(files)) return '⚠️ 폴더 정보를 불러올 수 없습니다.';
  if (files.length === 0) return '이 폴더는 비어 있습니다.';
  let msg = `총 ${files.length}개 항목이 있습니다.`;
  if (files.length > 1000) {
    msg += `\n(샘플 10개: ${files.slice(0, 10).map(f => f.name).join(', ')} ...)`;
  } else {
    msg += `\n항목: ${files.map(f => f.name).join(', ')}`;
  }
  return msg;
}

/**
 * 파일/폴더 이름 패턴별(날짜, 버전, 백업 등) 그룹화 요약
 */
  formatPatternGroupSummary(files, pattern, options = {}) {
  if (!Array.isArray(files)) return '⚠️ 파일 정보를 불러올 수 없습니다.';
  const groups = {};
  files.forEach(f => {
    const match = f.name.match(pattern);
    const key = match ? match[0] : '기타';
    groups[key] = groups[key] || [];
    groups[key].push(f.name);
  });
  return Object.entries(groups).map(([k, v]) => `${k}: ${v.length}개`).join(' | ');
}

/**
 * 최근 변경/접근/수정/삭제/생성/이동/복사/동기화 내역 요약
 */
  formatRecentActivitySummary(activityLog, options = {}) {
  if (!Array.isArray(activityLog) || activityLog.length === 0) return '최근 활동 내역이 없습니다.';
  return activityLog.slice(0, 10).map(a => `${a.type} - ${a.name} (${a.time})`).join('\n');
}

/**
 * 파일/폴더 권한별, 소유자별, 그룹별, 태그별 요약
 */
  formatPermissionOwnerGroupTagSummary(files, options = {}) {
  if (!Array.isArray(files)) return '⚠️ 파일 정보를 불러올 수 없습니다.';
  const byOwner = {}, byGroup = {}, byTag = {};
  files.forEach(f => {
    byOwner[f.owner] = (byOwner[f.owner] || 0) + 1;
    byGroup[f.group] = (byGroup[f.group] || 0) + 1;
    (f.tags || []).forEach(tag => { byTag[tag] = (byTag[tag] || 0) + 1; });
  });
  return `소유자별: ${JSON.stringify(byOwner)} | 그룹별: ${JSON.stringify(byGroup)} | 태그별: ${JSON.stringify(byTag)}`;
}

/**
 * 파일/폴더별 AI 추천 작업 요약
 */
  formatAIRecommendedActions(files, aiActions, options = {}) {
  if (!Array.isArray(files) || !aiActions) return '추천 작업 정보가 없습니다.';
  return files.map(f => `${f.name}: ${aiActions[f.name] || '추천 없음'}`).join('\n');
}

/**
 * 파일/폴더별 AI 위험도/중요도/우선순위 평가 요약
 */
  formatAIRiskPrioritySummary(files, aiRisk, options = {}) {
  if (!Array.isArray(files) || !aiRisk) return '위험도/우선순위 정보가 없습니다.';
  return files.map(f => `${f.name}: 위험도 ${aiRisk[f.name]?.risk || 'N/A'}, 우선순위 ${aiRisk[f.name]?.priority || 'N/A'}`).join('\n');
}

/**
 * 파일/폴더별 히스토리/버전/변경 로그 요약
 */
  formatFileHistorySummary(history, options = {}) {
  if (!Array.isArray(history) || history.length === 0) return '변경 이력이 없습니다.';
  return history.slice(0, 10).map(h => `${h.version || h.id}: ${h.action} (${h.time})`).join('\n');
}

/**
 * 파일/폴더별 연관성/관계/의존성/유사도 분석 요약
 */
  formatFileRelationshipSummary(relationships, options = {}) {
  if (!Array.isArray(relationships) || relationships.length === 0) return '연관성 정보가 없습니다.';
  return relationships.map(r => `${r.source} ↔ ${r.target} (${r.type})`).join('\n');
}

/**
 * 실시간 모니터링/알림/이벤트/트리거/자동화 상태 요약
 */
  formatRealtimeEventSummary(events, options = {}) {
  if (!Array.isArray(events) || events.length === 0) return '실시간 이벤트가 없습니다.';
  return events.slice(0, 10).map(e => `${e.type}: ${e.detail} (${e.time})`).join('\n');
}

/**
 * 동기화/백업/복구/이중화/재해복구 상태 요약
 */
  formatSyncBackupStatus(status, options = {}) {
  if (!status) return '동기화/백업 상태 정보를 불러올 수 없습니다.';
  return `동기화: ${status.sync}, 백업: ${status.backup}, 복구: ${status.restore}, 이중화: ${status.ha}, 재해복구: ${status.dr}`;
}

/**
 * 파일/폴더별 AI 기반 자연어 설명/튜토리얼/가이드/FAQ
 */
  formatAIGuideFAQ(files, aiGuide, options = {}) {
  if (!Array.isArray(files) || !aiGuide) return '가이드 정보가 없습니다.';
  return files.map(f => `${f.name}: ${aiGuide[f.name] || '설명 없음'}`).join('\n');
}

/**
 * 사용자별/그룹별/역할별 맞춤 안내/추천/경고/통계
 */
  formatUserGroupRoleSummary(users, userStats, options = {}) {
  if (!Array.isArray(users) || !userStats) return '사용자 정보가 없습니다.';
  return users.map(u => `${u.name}(${u.role}): 최근 활동 ${userStats[u.name]?.activity || 0}회, 경고 ${userStats[u.name]?.warnings || 0}회`).join('\n');
}

/**
 * 파일/폴더별 메타데이터/커스텀 속성/확장 정보 요약
 */
  formatFileMetadataSummary(files, options = {}) {
  if (!Array.isArray(files)) return '메타데이터 정보가 없습니다.';
  return files.map(f => `${f.name}: ${JSON.stringify(f.metadata || {})}`).join('\n');
}

/**
 * 파일/폴더별 AI 기반 "다음 행동 추천"/자동화 제안
 */
  formatAINextActionSuggestion(files, aiNext, options = {}) {
  if (!Array.isArray(files) || !aiNext) return '추천 정보가 없습니다.';
  return files.map(f => `${f.name}: ${aiNext[f.name] || '추천 없음'}`).join('\n');
}

/**
 * 파일/폴더별 "이상 탐지"/비정상 패턴"/보안 위협" 안내
 */
  formatAnomalyDetectionSummary(anomalies, options = {}) {
  if (!Array.isArray(anomalies) || anomalies.length === 0) return '이상 탐지 정보가 없습니다.';
  return anomalies.map(a => `${a.target}: ${a.type} (${a.detail})`).join('\n');
}

/**
 * 파일/폴더별 "비용/용량/성능/트래픽/리소스" 분석 요약
 */
  formatResourceUsageSummary(files, resourceStats, options = {}) {
  if (!Array.isArray(files) || !resourceStats) return '리소스 정보가 없습니다.';
  return files.map(f => `${f.name}: 용량 ${resourceStats[f.name]?.size || 0}B, 트래픽 ${resourceStats[f.name]?.traffic || 0}B, 성능 ${resourceStats[f.name]?.perf || 'N/A'}`).join('\n');
}

/**
 * 파일/폴더별 "AI 기반 미래 예측/트렌드/패턴" 안내
 */
  formatAIFutureTrendSummary(files, aiTrend, options = {}) {
  if (!Array.isArray(files) || !aiTrend) return '트렌드 정보가 없습니다.';
  return files.map(f => `${f.name}: ${aiTrend[f.name] || '예측 없음'}`).join('\n');
}

/**
 * 파일/폴더별 "AI 기반 자연어 질의 응답" 결과 포맷팅
 */
  formatAIQnAResult(files, aiQnA, options = {}) {
  if (!Array.isArray(files) || !aiQnA) return 'QnA 정보가 없습니다.';
  return files.map(f => `${f.name}: ${aiQnA[f.name] || '답변 없음'}`).join('\n');
}

/**
 * 파일/폴더별 "AI 기반 요약/번역/분류/태깅/정제" 결과 포맷팅
 */
  formatAISummaryTagging(files, aiSummary, options = {}) {
  if (!Array.isArray(files) || !aiSummary) return '요약/태깅 정보가 없습니다.';
  return files.map(f => `${f.name}: ${aiSummary[f.name] || '정보 없음'}`).join('\n');
}
} 