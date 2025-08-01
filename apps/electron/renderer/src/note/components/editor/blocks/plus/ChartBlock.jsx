import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * ChartBlock - 노션 스타일의 고급 차트 블록
 * @description 다양한 차트 유형과 실시간 데이터 편집을 지원하는 차트 블록
 */

// 차트 타입 정의
const CHART_TYPES = [
  { 
    type: 'bar', 
    label: '막대', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="12" width="4" height="8" strokeWidth="2"/>
        <rect x="10" y="8" width="4" height="12" strokeWidth="2"/>
        <rect x="16" y="4" width="4" height="16" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    type: 'line', 
    label: '꺾은선', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l3-8 4 6 4-10" />
      </svg>
    )
  },
  { 
    type: 'pie', 
    label: '원형', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" strokeWidth="2"/>
        <path d="M12 4v8l6 4" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    type: 'doughnut', 
    label: '도넛', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" strokeWidth="2"/>
        <circle cx="12" cy="12" r="4" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    type: 'area', 
    label: '영역', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l3-8 4 6 4-10" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 20H4V6l3 10 4-6 4 6 5-10v14z" fill="currentColor" opacity="0.2"/>
      </svg>
    )
  },
  { 
    type: 'radar', 
    label: '레이더', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <polygon points="12,4 19,8 19,16 12,20 5,16 5,8" strokeWidth="2"/>
        <polygon points="12,8 16,10 16,14 12,16 8,14 8,10" strokeWidth="1"/>
      </svg>
    )
  },
  { 
    type: 'polarArea', 
    label: '극좌표', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" strokeWidth="2"/>
        <path d="M12 12L12 4M12 12L19 12M12 12L17 17" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    type: 'horizontalBar', 
    label: '가로 막대', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="4" width="8" height="4" strokeWidth="2"/>
        <rect x="4" y="10" width="12" height="4" strokeWidth="2"/>
        <rect x="4" y="16" width="16" height="4" strokeWidth="2"/>
      </svg>
    )
  }
];

// 색상 테마 (원형/도넛 차트를 위한 풍부한 색상 팔레트)
const COLOR_THEMES = {
  default: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'],
  pastel: ['#93c5fd', '#86efac', '#fcd34d', '#fca5a5', '#c4b5fd', '#f9a8d4', '#67e8f9', '#bef264', '#fdba74', '#c7d2fe'],
  dark: ['#1e40af', '#047857', '#b45309', '#b91c1c', '#6b21a8', '#be185d', '#0e7490', '#4d7c0f', '#c2410c', '#4338ca'],
  neon: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#22d3ee', '#a3e635', '#fb7185', '#818cf8'],
  ocean: ['#0891b2', '#0e7490', '#155e75', '#164e63', '#115e59', '#134e4a', '#14532d', '#052e16', '#065f46', '#0f766e'],
  warm: ['#f97316', '#ea580c', '#dc2626', '#b91c1c', '#f59e0b', '#d97706', '#fbbf24', '#fcd34d', '#fb923c', '#fed7aa']
};

// 그라데이션 색상 생성 헬퍼 함수
const createGradient = (ctx, color1, color2) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  return gradient;
};

// 색상 밝기 조절 함수
const lightenColor = (color, percent) => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const factor = 1 + (percent / 100);
  return `rgb(${Math.min(255, Math.floor(rgb.r * factor))}, ${Math.min(255, Math.floor(rgb.g * factor))}, ${Math.min(255, Math.floor(rgb.b * factor))})`;
};

// 색상 어둡게 조절 함수
const darkenColor = (color, percent) => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const factor = 1 - (percent / 100);
  return `rgb(${Math.floor(rgb.r * factor)}, ${Math.floor(rgb.g * factor)}, ${Math.floor(rgb.b * factor)})`;
};

const defaultData = {
  labels: ['1월', '2월', '3월', '4월', '5월'],
  datasets: [{
    label: '데이터셋 1',
    data: [65, 59, 80, 81, 56]
  }]
};

// 헬퍼 함수: hex 색상을 rgb로 변환
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const ChartBlock = ({ block, onUpdate, onFocus, readOnly = false, isEditing, onEditingChange }) => {
  const [chartType, setChartType] = useState(block.metadata?.chartType || 'bar');
  const [chartData, setChartData] = useState(block.content || defaultData);
  const [showDataTable, setShowDataTable] = useState(false);
  const [colorTheme, setColorTheme] = useState(block.metadata?.colorTheme || 'default');
  const [showLegend, setShowLegend] = useState(block.metadata?.showLegend ?? true);
  const [showGrid, setShowGrid] = useState(block.metadata?.showGrid ?? true);
  const [editingCell, setEditingCell] = useState(null);
  const [csvInput, setCsvInput] = useState('');
  const [showCsvImport, setShowCsvImport] = useState(false);
  const chartRef = useRef(null);

  // 차트 타입 변경
  const handleChartTypeChange = (type) => {
    setChartType(type);
    onUpdate({ 
      content: chartData,
      metadata: { 
        ...block.metadata, 
        chartType: type,
        colorTheme,
        showLegend,
        showGrid
      } 
    });
  };

  // 데이터 업데이트
  const updateChartData = (newData) => {
    setChartData(newData);
    onUpdate({ 
      content: newData,
      metadata: { 
        ...block.metadata, 
        chartType,
        colorTheme,
        showLegend,
        showGrid
      } 
    });
  };

  // 라벨 변경
  const handleLabelChange = (index, value) => {
    const newData = { ...chartData };
    newData.labels[index] = value;
    updateChartData(newData);
  };

  // 데이터 값 변경
  const handleDataChange = (datasetIndex, dataIndex, value) => {
    const newData = { ...chartData };
    const numValue = parseFloat(value) || 0;
    newData.datasets[datasetIndex].data[dataIndex] = numValue;
    updateChartData(newData);
  };

  // 라벨 추가
  const addLabel = () => {
    const newData = { ...chartData };
    newData.labels.push(`라벨 ${newData.labels.length + 1}`);
    newData.datasets.forEach(dataset => {
      dataset.data.push(0);
    });
    updateChartData(newData);
  };

  // 라벨 삭제
  const removeLabel = (index) => {
    if (chartData.labels.length <= 1) return;
    const newData = { ...chartData };
    newData.labels.splice(index, 1);
    newData.datasets.forEach(dataset => {
      dataset.data.splice(index, 1);
    });
    updateChartData(newData);
  };

  // 데이터셋 추가
  const addDataset = () => {
    const newData = { ...chartData };
    const datasetNumber = newData.datasets.length + 1;
    newData.datasets.push({
      label: `데이터셋 ${datasetNumber}`,
      data: new Array(newData.labels.length).fill(0)
    });
    updateChartData(newData);
  };

  // 데이터셋 삭제
  const removeDataset = (index) => {
    if (chartData.datasets.length <= 1) return;
    const newData = { ...chartData };
    newData.datasets.splice(index, 1);
    updateChartData(newData);
  };

  // 데이터셋 라벨 변경
  const handleDatasetLabelChange = (index, value) => {
    const newData = { ...chartData };
    newData.datasets[index].label = value;
    updateChartData(newData);
  };

  // 색상 테마 변경
  const handleColorThemeChange = (theme) => {
    setColorTheme(theme);
    onUpdate({ 
      content: chartData,
      metadata: { 
        ...block.metadata, 
        chartType,
        colorTheme: theme,
        showLegend,
        showGrid
      } 
    });
  };

  // 차트 옵션 생성
  const getChartOptions = () => {
    const isHorizontal = chartType === 'horizontalBar';
    const isPieChart = ['pie', 'doughnut', 'polarArea'].includes(chartType);
    const isRadarChart = chartType === 'radar';
    
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: isHorizontal ? 'y' : 'x',
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      },
      plugins: {
        legend: {
          display: ['pie', 'doughnut'].includes(chartType) ? false : showLegend,
          position: isPieChart ? 'right' : 'top',
          labels: {
            usePointStyle: true,
            padding: 12,
            font: {
              size: 12,
              family: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 13,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          animation: {
            duration: 200
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    };

    // 파이/도넛/극좌표 차트 설정
    if (isPieChart) {
      baseOptions.scales = {};
      
      // 툴팁에 퍼센티지 표시
      baseOptions.plugins.tooltip.callbacks = {
        label: function(context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((context.parsed / total) * 100).toFixed(1);
          return `${context.label}: ${context.parsed} (${percentage}%)`;
        }
      };
      
      // 애니메이션 설정
      baseOptions.animation = {
        animateRotate: true,
        animateScale: false,
        duration: 800,
        easing: 'easeInOutQuart'
      };
      
      // 12시 방향부터 시작
      baseOptions.rotation = -Math.PI / 2;
      
      // 도넛 차트 중심 구멍 설정
      if (chartType === 'doughnut') {
        baseOptions.cutout = '60%';
      }
      
      // 극좌표 차트 스케일 설정
      if (chartType === 'polarArea') {
        baseOptions.scales = {
          r: {
            beginAtZero: true,
            grid: {
              display: showGrid,
              color: 'rgba(0, 0, 0, 0.1)',
              lineWidth: 1
            },
            angleLines: {
              display: true,
              color: 'rgba(0, 0, 0, 0.1)'
            },
            pointLabels: {
              font: {
                size: 11,
                family: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              },
              color: '#6b7280'
            },
            ticks: {
              display: true,
              color: '#9ca3af',
              font: {
                size: 10
              },
              backdropColor: 'rgba(255, 255, 255, 0.8)',
              backdropPadding: 2
            }
          }
        };
      }
    } else if (isRadarChart) {
      baseOptions.scales = {
        r: {
          grid: {
            display: showGrid,
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1
          },
          angleLines: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1
          },
          pointLabels: {
            display: true,
            centerPointLabels: false,
            font: {
              size: 12,
              family: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            },
            color: '#374151'
          },
          ticks: {
            display: true,
            color: '#6b7280',
            font: {
              size: 10
            },
            backdropColor: 'rgba(255, 255, 255, 0.8)',
            backdropPadding: 2,
            count: 5,
            stepSize: undefined,
            beginAtZero: true
          },
          beginAtZero: true,
          min: 0
        }
      };
    } else {
      baseOptions.scales = {
        x: {
          grid: {
            display: showGrid,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: {
              size: 11
            },
            padding: 5
          }
        },
        y: {
          grid: {
            display: showGrid,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: {
              size: 11
            },
            padding: 5
          },
          beginAtZero: true
        }
      };
    }

    return baseOptions;
  };

  // 차트 데이터 포맷
  const getFormattedChartData = () => {
    const colors = COLOR_THEMES[colorTheme];
    const formattedData = { ...chartData };
    const isPieChart = ['pie', 'doughnut', 'polarArea'].includes(chartType);
    const isRadarChart = chartType === 'radar';
    
    formattedData.datasets = formattedData.datasets.map((dataset, index) => {
      const color = colors[index % colors.length];
      const baseDataset = {
        ...dataset,
        borderColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3
      };

      if (isPieChart) {
        // 원형/도넛/극좌표 차트: 각 데이터 포인트에 다른 색상 적용
        const segmentColors = dataset.data.map((_, dataIndex) => {
          return colors[dataIndex % colors.length];
        });
        
        baseDataset.backgroundColor = segmentColors;
        baseDataset.borderColor = '#ffffff';
        baseDataset.borderWidth = 2;
        
        // 호버 효과
        baseDataset.hoverBackgroundColor = segmentColors.map(color => lightenColor(color, 10));
        baseDataset.hoverBorderColor = '#ffffff';
        baseDataset.hoverBorderWidth = 3;
        
        // 차트 타입별 특별 설정
        if (chartType === 'pie') {
          baseDataset.hoverOffset = 8;
        } else if (chartType === 'doughnut') {
          baseDataset.hoverOffset = 4;
        } else if (chartType === 'polarArea') {
          baseDataset.borderWidth = 1;
          baseDataset.borderColor = segmentColors.map(color => darkenColor(color, 15));
          baseDataset.hoverOffset = 0;
        }
      } else if (isRadarChart) {
        // 레이더 차트: 배경색을 반투명으로, 선 색상을 선명하게
        baseDataset.backgroundColor = `${color}20`;
        baseDataset.borderColor = color;
        baseDataset.borderWidth = 2;
        baseDataset.pointBackgroundColor = color;
        baseDataset.pointRadius = 6;
        baseDataset.pointHoverRadius = 8;
        baseDataset.fill = true;
      } else if (chartType === 'line' || chartType === 'area') {
        // 라인/영역 차트
        baseDataset.backgroundColor = chartType === 'area' ? `${color}20` : `${color}10`;
        baseDataset.borderWidth = 2;
        baseDataset.pointBackgroundColor = color;
        if (chartType === 'area') {
          baseDataset.fill = true;
        }
      } else {
        // 막대 차트 등 기타
        baseDataset.backgroundColor = color;
        baseDataset.borderWidth = 1;
      }

      return baseDataset;
    });

    return formattedData;
  };

  // 차트 타입에 따른 실제 타입 반환
  const getActualChartType = () => {
    switch (chartType) {
      case 'horizontalBar':
        return 'bar';
      case 'area':
        return 'line';
      default:
        return chartType;
    }
  };

  // 차트 이미지 다운로드
  const downloadChart = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = 'chart.png';
      link.href = url;
      link.click();
    }
  };

  // CSV 데이터 파싱 및 임포트
  const handleCsvImport = () => {
    try {
      const lines = csvInput.trim().split('\n');
      if (lines.length < 2) return;

      // 첫 번째 행을 라벨로
      const labels = lines[0].split(',').map(l => l.trim());
      
      // 나머지 행들을 데이터셋으로
      const datasets = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const datasetLabel = values[0];
        const data = values.slice(1).map(v => parseFloat(v) || 0);
        
        datasets.push({
          label: datasetLabel,
          data: data
        });
      }

      const newData = {
        labels: labels.slice(1), // 첫 번째 열은 데이터셋 라벨이므로 제외
        datasets: datasets
      };

      updateChartData(newData);
      setShowCsvImport(false);
      setCsvInput('');
    } catch (error) {
      console.error('CSV 파싱 오류:', error);
    }
  };

  return (
    <div className="chart-block group py-3">
      {/* 상단 툴바 - 호버 시에만 표시 */}
      <div className="flex items-center justify-between mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* 차트 타입 선택 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CHART_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => handleChartTypeChange(type)}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center
                ${chartType === type 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm' 
                  : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              disabled={readOnly}
            >
              <span className="mr-2 text-gray-500 flex-shrink-0">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* 옵션 버튼들 */}
        <div className="flex items-center gap-2">
          {/* 데이터 테이블 토글 */}
          <button
            onClick={() => setShowDataTable(!showDataTable)}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5
              ${showDataTable 
                ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              } hover:bg-gray-200 dark:hover:bg-gray-700
            `}
            disabled={readOnly}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
              <line x1="3" y1="9" x2="21" y2="9" strokeWidth="2"/>
              <line x1="3" y1="15" x2="21" y2="15" strokeWidth="2"/>
              <line x1="9" y1="3" x2="9" y2="21" strokeWidth="2"/>
              <line x1="15" y1="3" x2="15" y2="21" strokeWidth="2"/>
            </svg>
            데이터 편집
          </button>

          {/* CSV 임포트 버튼 */}
          <button
            onClick={() => setShowCsvImport(!showCsvImport)}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-xs font-medium transition-all flex items-center gap-1.5"
            disabled={readOnly}
            title="CSV 데이터 임포트"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            CSV
          </button>

          {/* 차트 다운로드 */}
          <button
            onClick={downloadChart}
            className="p-1.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-xs transition-all"
            title="차트 이미지 다운로드"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
              />
            </svg>
          </button>

          {/* 범례 토글 */}
          <button
            onClick={() => {
              setShowLegend(!showLegend);
              handleColorThemeChange(colorTheme);
            }}
            className={`
              p-1.5 rounded-md text-xs transition-all
              ${showLegend 
                ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
              }
            `}
            title="범례 표시/숨기기"
            disabled={readOnly}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zM13 19v-9a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2h2a2 2 0 002-2zM21 19v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2z" 
              />
            </svg>
          </button>

          {/* 그리드 토글 */}
          <button
            onClick={() => {
              setShowGrid(!showGrid);
              handleColorThemeChange(colorTheme);
            }}
            className={`
              p-1.5 rounded-md text-xs transition-all
              ${showGrid 
                ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
              }
            `}
            title="그리드 표시/숨기기"
            disabled={readOnly}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
              <line x1="3" y1="9" x2="21" y2="9" strokeWidth="1"/>
              <line x1="3" y1="15" x2="21" y2="15" strokeWidth="1"/>
              <line x1="9" y1="3" x2="9" y2="21" strokeWidth="1"/>
              <line x1="15" y1="3" x2="15" y2="21" strokeWidth="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 색상 테마 선택 - 호버 시에만 표시 */}
      <div className="flex items-center gap-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-xs text-gray-500">색상:</span>
        {Object.keys(COLOR_THEMES).map((theme) => (
          <button
            key={theme}
            onClick={() => handleColorThemeChange(theme)}
            className={`
              flex items-center gap-0.5 px-2 py-1 rounded-md transition-all
              ${colorTheme === theme 
                ? 'ring-2 ring-blue-500 ring-offset-1' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
            disabled={readOnly}
          >
            {COLOR_THEMES[theme].slice(0, 4).map((color, idx) => (
              <div
                key={idx}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </button>
        ))}
      </div>

      {/* CSV 임포트 UI */}
      {showCsvImport && !readOnly && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium mb-2">CSV 데이터 임포트</h4>
          <p className="text-xs text-gray-500 mb-2">
            형식: 첫 행은 헤더(,월,화,수...), 다음 행부터 데이터(데이터명,값1,값2,값3...)
          </p>
          <textarea
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder={`,1월,2월,3월,4월,5월
매출,100,120,140,180,200
비용,80,90,100,120,140`}
            className="w-full h-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 resize-none font-mono"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCsvImport}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
            >
              임포트
            </button>
            <button
              onClick={() => {
                setShowCsvImport(false);
                setCsvInput('');
              }}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 차트 렌더링 */}
      <div 
        className={`relative rounded-lg p-4 transition-all duration-200 ${
          ['pie', 'doughnut', 'polarArea'].includes(chartType) 
            ? 'bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800' 
            : 'bg-gray-50 dark:bg-gray-800/50'
        }`} 
        style={{ minHeight: '320px' }}
      >
        {/* 원형/도넛 차트용 레이아웃 */}
        {['pie', 'doughnut'].includes(chartType) ? (
          <div className="flex items-center justify-center gap-8">
            {/* 차트 영역 */}
            <div className="flex-shrink-0 relative" style={{ width: '280px', height: '280px' }}>
              <Chart
                ref={chartRef}
                type={getActualChartType()}
                data={getFormattedChartData()}
                options={getChartOptions()}
              />
              
              {/* 도넛 차트 중앙 텍스트 */}
              {chartType === 'doughnut' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      {chartData.datasets[0]?.data?.reduce((a, b) => a + b, 0) || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      총합
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 우측 정보 패널 */}
            <div className="flex-shrink-0" style={{ width: '280px' }}>
              {/* 차트 제목 및 총합 */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {chartData.datasets[0]?.label || '데이터 분석'}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs flex-shrink-0">
                    {CHART_TYPES.find(t => t.type === chartType)?.label}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  총 {chartData.datasets[0]?.data?.reduce((a, b) => a + b, 0) || 0}
                </div>
              </div>

              {/* 데이터 항목별 상세 정보 */}
              <div className="space-y-2">
                {chartData.labels?.map((label, index) => {
                  const value = chartData.datasets[0]?.data[index] || 0;
                  const total = chartData.datasets[0]?.data?.reduce((a, b) => a + b, 0) || 1;
                  const percentage = ((value / total) * 100).toFixed(1);
                  const color = COLOR_THEMES[colorTheme][index % COLOR_THEMES[colorTheme].length];
                  
                  return (
                    <div key={index} className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                            {label}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: color 
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-10 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 추가 통계 정보 */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {chartData.labels?.length || 0}
                    </div>
                    <div className="text-xs text-blue-500 dark:text-blue-400">카테고리</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      {Math.max(...(chartData.datasets[0]?.data || [0]))}
                    </div>
                    <div className="text-xs text-green-500 dark:text-green-400">최대값</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 기존 차트 레이아웃 (극좌표, 레이더 등) */
          <div className="relative" style={{ height: '300px' }}>
            <Chart
              ref={chartRef}
              type={getActualChartType()}
              data={getFormattedChartData()}
              options={getChartOptions()}
            />
          </div>
        )}
        
        {/* 호버 시 나타나는 차트 타입 라벨 (기존 차트용) */}
        {!['pie', 'doughnut'].includes(chartType) && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-gray-700">
              {CHART_TYPES.find(t => t.type === chartType)?.label}
            </span>
          </div>
        )}
      </div>

      {/* 데이터 테이블 */}
      {showDataTable && !readOnly && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                    라벨
                  </th>
                  {chartData.datasets.map((dataset, idx) => (
                    <th key={idx} className="text-center py-2 px-3">
                      <input
                        type="text"
                        value={dataset.label}
                        onChange={(e) => handleDatasetLabelChange(idx, e.target.value)}
                        className="w-full text-center font-medium text-gray-700 dark:text-gray-300 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                        placeholder="데이터셋 이름"
                      />
                    </th>
                  ))}
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {chartData.labels.map((label, labelIdx) => (
                  <tr key={labelIdx} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => handleLabelChange(labelIdx, e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                        placeholder="라벨"
                      />
                    </td>
                    {chartData.datasets.map((dataset, datasetIdx) => (
                      <td key={datasetIdx} className="text-center py-2 px-3">
                        <input
                          type="number"
                          value={dataset.data[labelIdx]}
                          onChange={(e) => handleDataChange(datasetIdx, labelIdx, e.target.value)}
                          onFocus={() => setEditingCell({ dataset: datasetIdx, label: labelIdx })}
                          onBlur={() => setEditingCell(null)}
                          className={`
                            w-20 text-center bg-transparent border rounded px-2 py-1 focus:outline-none transition-all
                            ${editingCell?.dataset === datasetIdx && editingCell?.label === labelIdx
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }
                          `}
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className="text-center">
                      <button
                        onClick={() => removeLabel(labelIdx)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="행 삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 추가 버튼들 */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={addLabel}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium transition-colors"
            >
              + 행 추가
            </button>
            <button
              onClick={addDataset}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium transition-colors"
            >
              + 데이터셋 추가
            </button>
            {chartData.datasets.length > 1 && (
              <button
                onClick={() => removeDataset(chartData.datasets.length - 1)}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-xs font-medium transition-colors"
              >
                - 데이터셋 삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartBlock;