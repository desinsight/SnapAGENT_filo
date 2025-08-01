import { useState, useEffect } from 'react';
import { generateSystemStats, generatePerformanceData } from '../data/mockData';

export const useSystemStats = () => {
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    storage: 0,
  });
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    // 초기 데이터 로드
    setSystemStats(generateSystemStats());
    setPerformanceData(generatePerformanceData());

    // 5초마다 시스템 통계 업데이트
    const updateStats = () => {
      const newStats = generateSystemStats();
      setSystemStats(newStats);

      // 성능 데이터 업데이트 (최근 10개만 유지)
      setPerformanceData(prev => {
        const newData = [...prev, {
          time: new Date().toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          cpu: newStats.cpu,
          memory: newStats.memory,
        }].slice(-10);
        return newData;
      });
    };

    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return { systemStats, performanceData };
};