import { useState, useCallback } from 'react';

const useAnalytics = (organizationId = null, teamId = null, projectId = null) => {
  const [analytics, setAnalytics] = useState({
    total_tasks: 156,
    completed_tasks: 98,
    in_progress_tasks: 35,
    pending_tasks: 23,
    overdue_tasks: 8,
    completion_rate: 62.8,
    average_completion_time: 3.2, // days
    productivity_score: 85
  });

  const [productivity, setProductivity] = useState({
    daily_completed: [5, 8, 6, 12, 9, 7, 10],
    weekly_trend: 15.2, // percentage increase
    best_day: 'Tuesday',
    peak_hours: ['09:00-11:00', '14:00-16:00']
  });

  const [teamPerformance, setTeamPerformance] = useState({
    individual_scores: [
      { user: '김개발', score: 92, tasks_completed: 28 },
      { user: '박디비', score: 78, tasks_completed: 19 },
      { user: '이디자인', score: 85, tasks_completed: 15 }
    ],
    collaboration_score: 87,
    communication_frequency: 'High'
  });

  const [projectProgress, setProjectProgress] = useState({
    milestones_completed: 3,
    milestones_total: 8,
    budget_used: 65000000,
    budget_total: 100000000,
    timeline_status: 'On Track',
    risk_level: 'Low'
  });

  const [loading, setLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 실제로는 API에서 분석 데이터를 가져옴
      // 컨텍스트에 따라 다른 데이터를 로드
      if (projectId) {
        // 프로젝트별 분석 데이터
      } else if (teamId) {
        // 팀별 분석 데이터
      } else if (organizationId) {
        // 조직별 분석 데이터
      }
      
    } catch (error) {
      console.error('분석 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, teamId, projectId]);

  const generateReport = useCallback(async (reportType, dateRange) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reportData = {
        type: reportType,
        date_range: dateRange,
        generated_at: new Date().toISOString(),
        data: {
          summary: analytics,
          details: {
            productivity,
            teamPerformance,
            projectProgress
          }
        }
      };
      
      return reportData;
    } catch (error) {
      console.error('리포트 생성 실패:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [analytics, productivity, teamPerformance, projectProgress]);

  const exportData = useCallback(async (format = 'json') => {
    try {
      const exportData = {
        analytics,
        productivity,
        teamPerformance,
        projectProgress,
        exported_at: new Date().toISOString(),
        format
      };
      
      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else if (format === 'csv') {
        // CSV 형태로 변환 (간단한 구현)
        return 'type,value\ntotal_tasks,' + analytics.total_tasks + '\ncompleted_tasks,' + analytics.completed_tasks;
      }
      
      return exportData;
    } catch (error) {
      console.error('데이터 내보내기 실패:', error);
      throw error;
    }
  }, [analytics, productivity, teamPerformance, projectProgress]);

  return {
    analytics,
    productivity,
    teamPerformance,
    projectProgress,
    loading,
    loadAnalytics,
    generateReport,
    exportData
  };
};

export default useAnalytics;