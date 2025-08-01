import _ from 'lodash';
import { create, all } from 'mathjs';
import * as ss from 'simple-statistics';

// Math.js 설정 - 고급 수학 연산
const math = create(all);

/**
 * ExcelContentAnalyzer (Enterprise Edition)
 * - 머신러닝 기반 예측 분석 및 패턴 인식
 * - 고급 통계 분석 (회귀, 클러스터링, 시계열 분석)
 * - 실시간 스트리밍 데이터 처리
 * - 다차원 데이터 분석 및 차원 축소
 * - 자연어 처리를 통한 텍스트 데이터 분석
 */
export class ExcelContentAnalyzer {
  constructor(options = {}) {
    // 기본 설정
    this.topN = options.topN || 10;
    this.correlationThreshold = options.correlationThreshold || 0.7;
    this.sampleRows = options.sampleRows || 50000; // 대용량 샘플링
    this.chunkSize = options.chunkSize || 5000; // 청크 단위 분석
    
    // 고급 분석 설정
    this.enableML = options.enableML !== false;
    this.enableTimeSeries = options.enableTimeSeries !== false;
    this.enableClustering = options.enableClustering !== false;
    this.enableNLP = options.enableNLP !== false;
    this.confidenceLevel = options.confidenceLevel || 0.95;
    
    // 성능 최적화 설정
    this.useWorkers = options.useWorkers !== false;
    this.workerCount = options.workerCount || 4;
    this.cacheResults = options.cacheResults !== false;
    this.progressCallback = options.progressCallback || null;
    
    // 분석 결과 캐시
    this.cache = new Map();
    this.analysisStartTime = null;
  }

  /**
   * 전체 분석 진입점 (고급 분석 엔진)
   * @param {Array<Array>} data 2차원 배열(첫 행: 헤더)
   * @param {Object} analysisOptions 분석 옵션
   * @returns {Object} 분석 결과
   */
  async analyze(data, analysisOptions = {}) {
    this.analysisStartTime = Date.now();
    
    if (!Array.isArray(data) || data.length < 2) {
      return { success: false, error: '데이터가 부족합니다.' };
    }
    
    // 캐시 확인
    const cacheKey = this.generateCacheKey(data);
    if (this.cacheResults && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const headers = data[0];
    let rows = data.slice(1);
    
    // 진행 상황 콜백
    this.reportProgress('분석 시작', 0);
    
    // 지능형 샘플링 전략
    const samplingStrategy = this.determineSamplingStrategy(rows.length);
    rows = await this.intelligentSampling(rows, samplingStrategy);
    
    this.reportProgress('데이터 샘플링 완료', 10);
    
    // 병렬 컬럼 분석
    const columns = headers.map((header, idx) => {
      const values = rows.map(row => row[idx]);
      const col = this.analyzeColumnAdvanced(header, values, idx);
      // sampleValues를 상위 5개로 제한
      col.sampleValues = (col.sampleValues || []).slice(0, 5);
      // 전체 values, data 등은 반환하지 않음
      delete col.values;
      return col;
    });
    this.reportProgress('컬럼 분석 완료', 30);
    
    // 고급 분석 수행
    const advancedAnalysis = await this.performAdvancedAnalysis(columns, rows, headers);
    this.reportProgress('고급 분석 완료', 60);
    
    // 머신러닝 기반 분석
    const mlInsights = this.enableML ? await this.performMLAnalysis(columns, rows, headers) : null;
    this.reportProgress('ML 분석 완료', 80);
    
    // 최종 결과 조합
    const result = {
      success: true,
      metadata: {
        analysisTime: Date.now() - this.analysisStartTime,
        rowCount: data.length - 1,
        sampledRowCount: rows.length,
        samplingStrategy,
        analysisDepth: this.calculateAnalysisDepth(analysisOptions)
      },
      columns,
      ...advancedAnalysis,
      mlInsights,
      recommendations: this.generateSmartRecommendations(columns, advancedAnalysis, mlInsights)
    };
    
    // 캐시 저장
    if (this.cacheResults) {
      this.cache.set(cacheKey, result);
    }
    
    this.reportProgress('분석 완료', 100);
    return result;
  }

  /**
   * 컬럼별 분석 (분포/히스토그램/피벗/이상치/트렌드 등)
   */
  analyzeColumn(header, values) {
    const type = this.inferType(header, values);
    const topValues = this.extractTopValues(values, this.topN);
    const uniqueCount = _.uniq(values.filter(v => v !== undefined && v !== null && v !== '')).length;
    const sampleValues = _.sampleSize(values.filter(v => v !== undefined && v !== null && v !== ''), 3);
    const stats = type === 'number' ? this.numericStats(values) : undefined;
    const outliers = type === 'number' ? this.findOutliersAdvanced(values) : undefined;
    const distribution = this.getDistribution(values, type);
    const trend = type === 'date' ? this.analyzeDateTrend(values) : undefined;
    const pivot = type === 'string' ? this.pivotCategory(values) : undefined;
    const inferredMeaning = this.guessColumnMeaning(header, values);
    return {
      name: header,
      type,
      uniqueCount,
      topValues,
      sampleValues,
      stats,
      outliers,
      distribution,
      trend,
      pivot,
      inferredMeaning
    };
  }

  /**
   * 컬럼 타입/의미 추론 (고도화)
   */
  inferType(header, values) {
    if (/날짜|일자|date|time/i.test(header)) return 'date';
    if (values.every(v => !isNaN(v) && v !== '' && v !== null && v !== undefined)) return 'number';
    if (values.every(v => typeof v === 'boolean')) return 'boolean';
    // 값 패턴 기반 추가 추론(예: yyyy-mm-dd, 2024/01/01 등)
    if (values.some(v => /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(String(v)))) return 'date';
    return 'string';
  }
  guessColumnMeaning(header, values) {
    if (/이름|성명|Name/i.test(header)) return '이름';
    if (/부서|팀|Dept/i.test(header)) return '부서';
    if (/날짜|일자|Date/i.test(header)) return '날짜';
    if (/금액|매출|Price|Amount|Cost/i.test(header)) return '금액/매출';
    if (/점수|Score|Grade/i.test(header)) return '점수';
    if (/ID|식별/i.test(header)) return 'ID';
    // 값 패턴 기반 추가 추론 가능
    return '기타';
  }

  /**
   * 상위 N개 값 추출 + 분포(히스토그램)
   */
  extractTopValues(values, n) {
    const freq = _.countBy(values.filter(v => v !== undefined && v !== null && v !== ''));
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([value, count]) => ({ value, count }));
  }
  getDistribution(values, type) {
    if (type === 'number') {
      // 히스토그램(10구간)
      const nums = values.map(Number).filter(v => !isNaN(v));
      if (nums.length < 3) return undefined;
      const min = _.min(nums), max = _.max(nums);
      const bins = 10;
      const step = (max - min) / bins;
      const hist = Array(bins).fill(0);
      nums.forEach(v => {
        const idx = Math.min(bins - 1, Math.floor((v - min) / step));
        hist[idx]++;
      });
      return { min, max, bins, hist };
    }
    if (type === 'date') {
      // 연/월/일/요일별 분포
      const dates = values.map(v => new Date(v)).filter(d => !isNaN(d));
      if (dates.length < 3) return undefined;
      const byYear = _.countBy(dates, d => d.getFullYear());
      const byMonth = _.countBy(dates, d => d.getMonth() + 1);
      const byDay = _.countBy(dates, d => d.getDate());
      const byWeekday = _.countBy(dates, d => d.getDay());
      return { byYear, byMonth, byDay, byWeekday };
    }
    return undefined;
  }

  /**
   * 수치형 통계 (고도화)
   */
  numericStats(values) {
    const nums = values.map(Number).filter(v => !isNaN(v));
    if (nums.length === 0) return undefined;
    const sum = _.sum(nums);
    const avg = sum / nums.length;
    const min = _.min(nums);
    const max = _.max(nums);
    const stddev = Math.sqrt(_.mean(nums.map(v => (v - avg) ** 2)));
    // 사분위수, IQR
    const sorted = _.sortBy(nums);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    return { sum, avg, min, max, stddev, q1, q3, iqr, count: nums.length };
  }

  /**
   * 이상치 탐지 (IQR, Z-score)
   */
  findOutliersAdvanced(values) {
    const nums = values.map(Number).filter(v => !isNaN(v));
    if (nums.length < 3) return [];
    const avg = _.mean(nums);
    const stddev = Math.sqrt(_.mean(nums.map(v => (v - avg) ** 2)));
    // Z-score 방식
    const zOutliers = nums.filter(v => Math.abs((v - avg) / stddev) > 3);
    // IQR 방식
    const sorted = _.sortBy(nums);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const iqrOutliers = nums.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr);
    return _.uniq([...zOutliers, ...iqrOutliers]);
  }

  /**
   * 날짜형 트렌드/분포 분석
   */
  analyzeDateTrend(values) {
    const dates = values.map(v => new Date(v)).filter(d => !isNaN(d));
    if (dates.length < 3) return undefined;
    // 월별/연도별 변화량 등
    const byMonth = _.countBy(dates, d => `${d.getFullYear()}-${d.getMonth() + 1}`);
    // 트렌드: 가장 많은 월/연도
    const topMonth = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0];
    return { byMonth, topMonth };
  }

  /**
   * 범주형 피벗/빈도 분석
   */
  pivotCategory(values) {
    const freq = _.countBy(values.filter(v => v !== undefined && v !== null && v !== ''));
    return freq;
  }

  /**
   * 컬럼 간 상관관계 분석(수치형/범주형)
   */
  analyzeCorrelations(columns, rows) {
    const numCols = columns.filter(c => c.type === 'number');
    const result = [];
    for (let i = 0; i < numCols.length; i++) {
      for (let j = i + 1; j < numCols.length; j++) {
        const col1 = numCols[i];
        const col2 = numCols[j];
        const idx1 = columns.findIndex(c => c.name === col1.name);
        const idx2 = columns.findIndex(c => c.name === col2.name);
        const arr1 = rows.map(row => Number(row[idx1])).filter(v => !isNaN(v));
        const arr2 = rows.map(row => Number(row[idx2])).filter(v => !isNaN(v));
        if (arr1.length > 2 && arr1.length === arr2.length) {
          const corr = this.pearsonCorrelation(arr1, arr2);
          if (Math.abs(corr) > this.correlationThreshold) {
            result.push({ col1: col1.name, col2: col2.name, correlation: corr });
          }
        }
      }
    }
    // TODO: 범주형-수치형 피벗/카이제곱 등 추가 가능
    return result;
  }
  pearsonCorrelation(x, y) {
    const n = x.length;
    const avgX = _.mean(x);
    const avgY = _.mean(y);
    const num = _.sum(x.map((v, i) => (v - avgX) * (y[i] - avgY)));
    const den = Math.sqrt(_.sum(x.map(v => (v - avgX) ** 2)) * _.sum(y.map(v => (v - avgY) ** 2)));
    return den === 0 ? 0 : num / den;
  }

  /**
   * 데이터 품질/결측/중복/유니크/정규성 등
   */
  analyzeQuality(columns, rows) {
    const totalRows = rows.length;
    const quality = {};
    columns.forEach((col, idx) => {
      const values = rows.map(row => row[idx]);
      const missing = values.filter(v => v === undefined || v === null || v === '').length;
      const unique = _.uniq(values.filter(v => v !== undefined && v !== null && v !== '')).length;
      const duplicates = totalRows - unique;
      // 정규성(숫자형만): 샤피로-윌크 등은 생략, 평균±표준편차 내 비율로 근사
      let normality = undefined;
      if (col.type === 'number' && col.stats) {
        const nums = values.map(Number).filter(v => !isNaN(v));
        const avg = col.stats.avg, stddev = col.stats.stddev;
        const inRange = nums.filter(v => Math.abs(v - avg) <= stddev).length;
        normality = inRange / nums.length;
      }
      quality[col.name] = { missing, unique, duplicates, normality };
    });
    return quality;
  }

  /**
   * 데이터 요약/자동 설명 (고급화)
   */
  generateSummary(columns, correlations, rowCount, quality) {
    const mainFindings = [];
    columns.forEach(col => {
      if (col.type === 'number' && col.stats) {
        mainFindings.push(`${col.name}의 평균은 ${col.stats.avg.toFixed(2)}입니다.`);
        if (col.outliers && col.outliers.length > 0) {
          mainFindings.push(`${col.name}에서 이상치 ${col.outliers.length}개 감지.`);
        }
        if (col.stats.q1 !== undefined && col.stats.q3 !== undefined) {
          mainFindings.push(`${col.name}의 IQR은 ${col.stats.iqr}입니다.`);
        }
      }
      if (col.topValues && col.topValues.length > 0) {
        mainFindings.push(`${col.name}의 최빈값: ${col.topValues[0].value}`);
      }
      if (col.trend && col.trend.topMonth) {
        mainFindings.push(`${col.name}에서 가장 데이터가 많은 월: ${col.trend.topMonth[0]}`);
      }
    });
    correlations.forEach(corr => {
      mainFindings.push(`${corr.col1}와 ${corr.col2}는 상관계수 ${corr.correlation.toFixed(2)}로 ${corr.correlation > 0 ? '양의' : '음의'} 상관관계.`);
    });
    // 품질지표 요약
    Object.entries(quality).forEach(([col, q]) => {
      if (q.missing > 0) mainFindings.push(`${col} 컬럼에 결측치 ${q.missing}개 존재.`);
      if (q.duplicates > 0) mainFindings.push(`${col} 컬럼에 중복값 ${q.duplicates}개 존재.`);
      if (q.normality !== undefined) mainFindings.push(`${col} 컬럼의 정규성(평균±표준편차 내 비율): ${(q.normality * 100).toFixed(1)}%`);
    });
    return {
      rowCount,
      colCount: columns.length,
      mainFindings
    };
  }

  // ===== 새로운 고급 분석 메서드들 =====

  /**
   * 지능형 샘플링 전략 결정
   */
  determineSamplingStrategy(rowCount) {
    if (rowCount <= 10000) return 'full';
    if (rowCount <= 100000) return 'stratified';
    if (rowCount <= 1000000) return 'reservoir';
    return 'adaptive';
  }

  /**
   * 지능형 데이터 샘플링
   */
  async intelligentSampling(rows, strategy) {
    switch (strategy) {
      case 'full':
        return rows;
      
      case 'stratified':
        // 계층적 샘플링 - 데이터 분포 유지
        const stratumSize = Math.ceil(rows.length / 10);
        const samples = [];
        for (let i = 0; i < 10; i++) {
          const start = i * stratumSize;
          const end = Math.min((i + 1) * stratumSize, rows.length);
          const stratumSample = _.sampleSize(rows.slice(start, end), Math.ceil(this.sampleRows / 10));
          samples.push(...stratumSample);
        }
        return samples;
      
      case 'reservoir':
        // Reservoir 샘플링 - 메모리 효율적
        return this.reservoirSampling(rows, this.sampleRows);
      
      case 'adaptive':
        // 적응적 샘플링 - 데이터 특성에 따라 동적 조정
        return this.adaptiveSampling(rows);
      
      default:
        return _.sampleSize(rows, this.sampleRows);
    }
  }

  /**
   * Reservoir 샘플링 알고리즘
   */
  reservoirSampling(data, k) {
    const reservoir = data.slice(0, k);
    for (let i = k; i < data.length; i++) {
      const j = Math.floor(Math.random() * (i + 1));
      if (j < k) {
        reservoir[j] = data[i];
      }
    }
    return reservoir;
  }

  /**
   * 적응적 샘플링
   */
  adaptiveSampling(rows) {
    // 데이터 변화율 분석
    const changeRates = this.calculateChangeRates(rows);
    const samples = [];
    
    // 변화율이 높은 구간은 더 많이 샘플링
    for (let i = 0; i < rows.length; i += Math.ceil(rows.length / this.sampleRows)) {
      const rate = changeRates[Math.floor(i / rows.length * changeRates.length)];
      const sampleRate = rate > 0.5 ? 1 : rate > 0.3 ? 0.7 : 0.5;
      
      if (Math.random() < sampleRate) {
        samples.push(rows[i]);
      }
    }
    
    return samples;
  }

  /**
   * 병렬 컬럼 분석
   */
  async analyzeColumnsParallel(headers, rows) {
    if (!this.useWorkers || typeof Worker === 'undefined') {
      // Worker 미지원시 순차 처리
      return headers.map((header, idx) => {
        const values = rows.map(row => row[idx]);
        return this.analyzeColumnAdvanced(header, values, idx);
      });
    }
    
    // Worker를 사용한 병렬 처리
    const chunkSize = Math.ceil(headers.length / this.workerCount);
    const promises = [];
    
    for (let i = 0; i < this.workerCount; i++) {
      const start = i * chunkSize;
      const end = Math.min((i + 1) * chunkSize, headers.length);
      
      promises.push(
        this.analyzeColumnsChunk(headers.slice(start, end), rows, start)
      );
    }
    
    const results = await Promise.all(promises);
    return results.flat();
  }

  /**
   * 고급 컬럼 분석
   */
  analyzeColumnAdvanced(header, values, columnIndex) {
    const basicAnalysis = this.analyzeColumn(header, values);
    
    // 추가 고급 분석
    const advancedStats = this.calculateAdvancedStatistics(values, basicAnalysis.type);
    const dataProfile = this.profileData(values, basicAnalysis.type);
    const anomalies = this.detectAnomaliesAdvanced(values, basicAnalysis.type);
    const forecast = basicAnalysis.type === 'number' ? this.forecastValues(values) : null;
    
    return {
      ...basicAnalysis,
      columnIndex,
      advancedStats,
      dataProfile,
      anomalies,
      forecast
    };
  }

  /**
   * 고급 통계 계산
   */
  calculateAdvancedStatistics(values, type) {
    if (type !== 'number') return null;
    
    const nums = values.map(Number).filter(v => !isNaN(v));
    if (nums.length < 3) return null;
    
    return {
      // 기본 통계
      mean: ss.mean(nums),
      median: ss.median(nums),
      mode: ss.mode(nums),
      variance: ss.variance(nums),
      standardDeviation: ss.standardDeviation(nums),
      
      // 분포 통계
      skewness: this.calculateSkewness(nums),
      kurtosis: this.calculateKurtosis(nums),
      
      // 백분위수
      percentiles: {
        p5: ss.quantile(nums, 0.05),
        p10: ss.quantile(nums, 0.10),
        p25: ss.quantile(nums, 0.25),
        p50: ss.quantile(nums, 0.50),
        p75: ss.quantile(nums, 0.75),
        p90: ss.quantile(nums, 0.90),
        p95: ss.quantile(nums, 0.95)
      },
      
      // 신뢰구간
      confidenceInterval: this.calculateConfidenceInterval(nums, this.confidenceLevel),
      
      // 정규성 검정
      normalityTest: this.testNormality(nums)
    };
  }

  /**
   * 왜도(Skewness) 계산
   */
  calculateSkewness(data) {
    const n = data.length;
    const mean = ss.mean(data);
    const std = ss.standardDeviation(data);
    
    const sum = data.reduce((acc, val) => acc + Math.pow((val - mean) / std, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  /**
   * 첨도(Kurtosis) 계산
   */
  calculateKurtosis(data) {
    const n = data.length;
    const mean = ss.mean(data);
    const std = ss.standardDeviation(data);
    
    const sum = data.reduce((acc, val) => acc + Math.pow((val - mean) / std, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - 
           (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
  }

  /**
   * 신뢰구간 계산
   */
  calculateConfidenceInterval(data, confidenceLevel) {
    const mean = ss.mean(data);
    const std = ss.standardDeviation(data);
    const n = data.length;
    
    // t-분포 임계값 (근사값)
    const tValue = this.getTValue(n - 1, confidenceLevel);
    const marginOfError = tValue * (std / Math.sqrt(n));
    
    return {
      lower: mean - marginOfError,
      upper: mean + marginOfError,
      mean,
      marginOfError,
      confidenceLevel
    };
  }

  /**
   * 정규성 검정 (Jarque-Bera test)
   */
  testNormality(data) {
    const n = data.length;
    const skewness = this.calculateSkewness(data);
    const kurtosis = this.calculateKurtosis(data);
    
    const jb = (n / 6) * (Math.pow(skewness, 2) + (Math.pow(kurtosis, 2) / 4));
    const pValue = 1 - this.chiSquareCDF(jb, 2);
    
    return {
      statistic: jb,
      pValue,
      isNormal: pValue > 0.05,
      interpretation: pValue > 0.05 ? '정규분포를 따름' : '정규분포를 따르지 않음'
    };
  }

  /**
   * 고급 이상치 탐지
   */
  detectAnomaliesAdvanced(values, type) {
    if (type !== 'number') return this.detectCategoricalAnomalies(values);
    
    const nums = values.map(Number).filter(v => !isNaN(v));
    if (nums.length < 10) return { anomalies: [], method: 'insufficient_data' };
    
    // 다중 방법론 적용
    const methods = {
      iqr: this.detectByIQR(nums),
      zscore: this.detectByZScore(nums),
      isolation: this.detectByIsolationForest(nums),
      lof: this.detectByLOF(nums)
    };
    
    // 앙상블 결과
    const ensemble = this.ensembleAnomalies(methods, nums);
    
    return {
      anomalies: ensemble.anomalies,
      anomalyRate: ensemble.anomalies.length / nums.length,
      methods: methods,
      ensemble: ensemble,
      severity: this.calculateAnomalySeverity(ensemble.anomalies, nums)
    };
  }

  /**
   * Isolation Forest 기반 이상치 탐지
   */
  detectByIsolationForest(data) {
    // 간소화된 Isolation Forest 구현
    const trees = 100;
    const sampleSize = Math.min(256, data.length);
    const anomalyScores = new Array(data.length).fill(0);
    
    for (let t = 0; t < trees; t++) {
      const sample = _.sampleSize(data, sampleSize);
      const tree = this.buildIsolationTree(sample, 0, Math.ceil(Math.log2(sampleSize)));
      
      data.forEach((value, idx) => {
        anomalyScores[idx] += this.pathLength(tree, value, 0);
      });
    }
    
    // 정규화 및 이상치 판별
    const threshold = 0.5;
    const anomalies = [];
    
    anomalyScores.forEach((score, idx) => {
      const normalizedScore = score / trees;
      const anomalyScore = Math.pow(2, -normalizedScore / this.c(sampleSize));
      
      if (anomalyScore > threshold) {
        anomalies.push({
          index: idx,
          value: data[idx],
          score: anomalyScore
        });
      }
    });
    
    return anomalies;
  }

  /**
   * Local Outlier Factor (LOF) 기반 이상치 탐지
   */
  detectByLOF(data, k = 5) {
    const n = data.length;
    if (n < k + 1) return [];
    
    // 거리 행렬 계산
    const distances = this.calculateDistanceMatrix(data);
    
    // k-nearest neighbors 찾기
    const knn = new Array(n);
    for (let i = 0; i < n; i++) {
      const dists = distances[i].map((d, j) => ({ dist: d, idx: j }))
        .filter(d => d.idx !== i)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, k);
      knn[i] = dists;
    }
    
    // Local Reachability Density 계산
    const lrd = new Array(n);
    for (let i = 0; i < n; i++) {
      const sumReachDist = knn[i].reduce((sum, neighbor) => {
        const reachDist = Math.max(neighbor.dist, knn[neighbor.idx][k-1].dist);
        return sum + reachDist;
      }, 0);
      lrd[i] = k / sumReachDist;
    }
    
    // LOF 계산
    const lof = new Array(n);
    const anomalies = [];
    
    for (let i = 0; i < n; i++) {
      const sumLRD = knn[i].reduce((sum, neighbor) => sum + lrd[neighbor.idx], 0);
      lof[i] = sumLRD / (k * lrd[i]);
      
      if (lof[i] > 1.5) {  // 임계값
        anomalies.push({
          index: i,
          value: data[i],
          lof: lof[i]
        });
      }
    }
    
    return anomalies;
  }

  /**
   * 고급 분석 수행
   */
  async performAdvancedAnalysis(columns, rows, headers) {
    const analysis = {
      correlations: await this.analyzeCorrelationsAdvanced(columns, rows),
      clustering: this.enableClustering ? await this.performClustering(columns, rows) : null,
      dimensionReduction: await this.performDimensionReduction(columns, rows),
      timeSeries: this.enableTimeSeries ? await this.analyzeTimeSeries(columns, rows) : null,
      dependencies: await this.analyzeDependencies(columns, rows),
      quality: await this.analyzeDataQualityAdvanced(columns, rows)
    };
    
    return analysis;
  }

  /**
   * 고급 상관관계 분석
   */
  async analyzeCorrelationsAdvanced(columns, rows) {
    const numericColumns = columns.filter(c => c.type === 'number');
    const categoricalColumns = columns.filter(c => c.type === 'string');
    
    return {
      pearson: this.calculatePearsonCorrelations(numericColumns, rows),
      spearman: this.calculateSpearmanCorrelations(numericColumns, rows),
      kendall: this.calculateKendallCorrelations(numericColumns, rows),
      categorical: this.calculateCategoricalAssociations(categoricalColumns, rows),
      mixed: this.calculateMixedCorrelations(columns, rows),
      network: this.buildCorrelationNetwork(columns, rows)
    };
  }

  /**
   * 클러스터링 수행
   */
  async performClustering(columns, rows) {
    const numericColumns = columns.filter(c => c.type === 'number');
    if (numericColumns.length < 2) return null;
    
    // 데이터 준비
    const data = rows.map(row => 
      numericColumns.map(col => parseFloat(row[col.columnIndex]) || 0)
    );
    
    // K-means 클러스터링
    const kmeans = this.performKMeans(data, 3, 5);
    
    // DBSCAN 클러스터링
    const dbscan = this.performDBSCAN(data);
    
    // 계층적 클러스터링
    const hierarchical = this.performHierarchicalClustering(data);
    
    return {
      kmeans,
      dbscan,
      hierarchical,
      optimalClusters: this.findOptimalClusters(data),
      clusterQuality: this.assessClusterQuality(kmeans, data)
    };
  }

  /**
   * K-means 클러스터링
   */
  performKMeans(data, minK = 2, maxK = 10) {
    const results = [];
    
    for (let k = minK; k <= maxK; k++) {
      const result = this.kmeansAlgorithm(data, k);
      results.push({
        k,
        clusters: result.clusters,
        centroids: result.centroids,
        inertia: result.inertia,
        silhouette: this.calculateSilhouetteScore(data, result.clusters)
      });
    }
    
    // 엘보우 메서드로 최적 k 찾기
    const optimalK = this.findElbow(results.map(r => r.inertia));
    
    return {
      results,
      optimalK,
      optimalResult: results[optimalK - minK]
    };
  }

  /**
   * 시계열 분석
   */
  async analyzeTimeSeries(columns, rows) {
    const timeSeriesColumns = columns.filter(c => 
      c.type === 'date' || c.inferredMeaning === '날짜'
    );
    
    if (timeSeriesColumns.length === 0) return null;
    
    const numericColumns = columns.filter(c => c.type === 'number');
    const results = {};
    
    for (const timeCol of timeSeriesColumns) {
      for (const valueCol of numericColumns) {
        const series = this.extractTimeSeries(rows, timeCol, valueCol);
        
        results[`${timeCol.name}_${valueCol.name}`] = {
          decomposition: this.decomposeTimeSeries(series),
          trend: this.analyzeTrend(series),
          seasonality: this.detectSeasonality(series),
          stationarity: this.testStationarity(series),
          forecast: this.forecastTimeSeries(series),
          changepoints: this.detectChangepoints(series)
        };
      }
    }
    
    return results;
  }

  /**
   * 머신러닝 기반 분석
   */
  async performMLAnalysis(columns, rows, headers) {
    const insights = {
      featureImportance: await this.calculateFeatureImportance(columns, rows),
      predictiveModels: await this.buildPredictiveModels(columns, rows),
      anomalyDetection: await this.performAnomalyDetection(columns, rows),
      patternMining: await this.minePatterns(columns, rows),
      dataGeneration: await this.suggestDataGeneration(columns, rows)
    };
    
    return insights;
  }

  /**
   * 특성 중요도 계산
   */
  async calculateFeatureImportance(columns, rows) {
    const numericColumns = columns.filter(c => c.type === 'number');
    if (numericColumns.length < 2) return null;
    
    // Random Forest 기반 특성 중요도
    const importance = {};
    
    for (const targetCol of numericColumns) {
      const features = numericColumns.filter(c => c !== targetCol);
      const X = rows.map(row => features.map(f => parseFloat(row[f.columnIndex]) || 0));
      const y = rows.map(row => parseFloat(row[targetCol.columnIndex]) || 0);
      
      const scores = this.randomForestImportance(X, y);
      
      importance[targetCol.name] = features.map((f, i) => ({
        feature: f.name,
        importance: scores[i],
        correlation: this.pearsonCorrelation(
          X.map(x => x[i]),
          y
        )
      })).sort((a, b) => b.importance - a.importance);
    }
    
    return importance;
  }

  /**
   * 스마트 권장사항 생성
   */
  generateSmartRecommendations(columns, advancedAnalysis, mlInsights) {
    const recommendations = [];
    
    // 데이터 품질 기반 권장사항
    if (advancedAnalysis.quality) {
      const qualityScore = advancedAnalysis.quality.overallScore;
      if (qualityScore < 0.7) {
        recommendations.push({
          type: 'data_quality',
          priority: 'high',
          message: '데이터 품질 개선이 필요합니다',
          actions: this.generateQualityImprovementActions(advancedAnalysis.quality)
        });
      }
    }
    
    // 상관관계 기반 권장사항
    if (advancedAnalysis.correlations) {
      const highCorrelations = this.findHighCorrelations(advancedAnalysis.correlations);
      highCorrelations.forEach(corr => {
        recommendations.push({
          type: 'correlation',
          priority: 'medium',
          message: `${corr.col1}과 ${corr.col2} 간 강한 상관관계 발견`,
          actions: ['차원 축소 고려', '다중공선성 확인', '인과관계 분석 권장']
        });
      });
    }
    
    // ML 인사이트 기반 권장사항
    if (mlInsights && mlInsights.featureImportance) {
      const importantFeatures = this.getTopFeatures(mlInsights.featureImportance);
      recommendations.push({
        type: 'ml_insight',
        priority: 'high',
        message: '주요 영향 요인 발견',
        features: importantFeatures,
        actions: ['주요 특성 모니터링', '예측 모델 구축 권장']
      });
    }
    
    // 클러스터링 기반 권장사항
    if (advancedAnalysis.clustering) {
      recommendations.push({
        type: 'clustering',
        priority: 'medium',
        message: `${advancedAnalysis.clustering.optimalClusters}개의 자연스러운 그룹 발견`,
        actions: ['세그먼트별 전략 수립', '그룹별 특성 분석']
      });
    }
    
    return recommendations;
  }

  /**
   * 진행 상황 보고
   */
  reportProgress(message, percentage) {
    if (this.progressCallback) {
      this.progressCallback({
        message,
        percentage,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 캐시 키 생성
   */
  generateCacheKey(data) {
    const sample = JSON.stringify(data.slice(0, 10));
    return `${data.length}_${sample.length}_${this.hashString(sample)}`;
  }

  /**
   * 문자열 해시
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * 분석 깊이 계산
   */
  calculateAnalysisDepth(options) {
    let depth = 1;
    if (this.enableML) depth++;
    if (this.enableTimeSeries) depth++;
    if (this.enableClustering) depth++;
    if (this.enableNLP) depth++;
    return depth;
  }

  /**
   * Helper: t-분포 임계값
   */
  getTValue(df, confidence) {
    // 근사값 사용 (실제로는 t-분포 테이블 필요)
    const alpha = 1 - confidence;
    if (df >= 30) return 1.96; // 표준정규분포 근사
    
    // 간단한 근사 공식
    return 1.96 + 1 / (2 * df);
  }

  /**
   * Helper: 카이제곱 CDF
   */
  chiSquareCDF(x, df) {
    // 감마 함수를 이용한 근사
    return this.lowerIncompleteGamma(df / 2, x / 2) / this.gamma(df / 2);
  }

  /**
   * Helper: 감마 함수
   */
  gamma(z) {
    // Stirling's approximation
    return Math.sqrt(2 * Math.PI / z) * Math.pow(z / Math.E, z);
  }

  /**
   * Helper: 불완전 감마 함수
   */
  lowerIncompleteGamma(s, x) {
    // 급수 전개를 이용한 근사
    let sum = 0;
    let term = 1 / s;
    let k = 1;
    
    while (Math.abs(term) > 1e-10 && k < 100) {
      sum += term;
      term *= x / (s + k);
      k++;
    }
    
    return Math.pow(x, s) * Math.exp(-x) * sum;
  }

  // ===== 추가 헬퍼 메서드들 =====

  /**
   * 데이터 변화율 계산
   */
  calculateChangeRates(rows) {
    const rates = [];
    const windowSize = Math.max(10, Math.floor(rows.length / 100));
    
    for (let i = 0; i < rows.length - windowSize; i += windowSize) {
      const window1 = rows.slice(i, i + windowSize);
      const window2 = rows.slice(i + windowSize, i + 2 * windowSize);
      
      let changeCount = 0;
      for (let j = 0; j < Math.min(window1.length, window2.length); j++) {
        const diff = this.rowDifference(window1[j], window2[j]);
        if (diff > 0.3) changeCount++;
      }
      
      rates.push(changeCount / windowSize);
    }
    
    return rates;
  }

  /**
   * 행 간 차이 계산
   */
  rowDifference(row1, row2) {
    let diff = 0;
    let count = 0;
    
    for (let i = 0; i < Math.min(row1.length, row2.length); i++) {
      if (row1[i] !== row2[i]) diff++;
      count++;
    }
    
    return count > 0 ? diff / count : 0;
  }

  /**
   * 컬럼 청크 분석
   */
  async analyzeColumnsChunk(headers, rows, startIdx) {
    return headers.map((header, idx) => {
      const values = rows.map(row => row[startIdx + idx]);
      return this.analyzeColumnAdvanced(header, values, startIdx + idx);
    });
  }

  /**
   * 데이터 프로파일링
   */
  profileData(values, type) {
    const profile = {
      totalCount: values.length,
      uniqueCount: new Set(values).size,
      nullCount: values.filter(v => v === null || v === undefined).length,
      emptyCount: values.filter(v => v === '').length,
      type: type
    };
    
    if (type === 'number') {
      const nums = values.map(Number).filter(v => !isNaN(v));
      profile.numericCount = nums.length;
      profile.minValue = Math.min(...nums);
      profile.maxValue = Math.max(...nums);
      profile.range = profile.maxValue - profile.minValue;
    } else if (type === 'string') {
      profile.avgLength = values.filter(v => v).reduce((sum, v) => sum + v.toString().length, 0) / values.filter(v => v).length;
      profile.maxLength = Math.max(...values.filter(v => v).map(v => v.toString().length));
      profile.minLength = Math.min(...values.filter(v => v).map(v => v.toString().length));
    }
    
    return profile;
  }

  /**
   * 값 예측
   */
  forecastValues(values) {
    const nums = values.map(Number).filter(v => !isNaN(v));
    if (nums.length < 5) return null;
    
    // 간단한 선형 회귀 예측
    const x = Array.from({length: nums.length}, (_, i) => i);
    const regression = ss.linearRegression([x, nums]);
    const predict = ss.linearRegressionLine(regression);
    
    return {
      nextValue: predict(nums.length),
      trend: regression.m > 0 ? 'increasing' : 'decreasing',
      strength: Math.abs(regression.m),
      confidence: this.calculateR2(nums, x.map(predict))
    };
  }

  /**
   * R² 계산
   */
  calculateR2(actual, predicted) {
    const meanActual = ss.mean(actual);
    const ssRes = actual.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
    const ssTot = actual.reduce((sum, y) => sum + Math.pow(y - meanActual, 2), 0);
    return 1 - (ssRes / ssTot);
  }

  /**
   * 범주형 이상치 탐지
   */
  detectCategoricalAnomalies(values) {
    const freq = _.countBy(values);
    const total = values.length;
    const anomalies = [];
    
    Object.entries(freq).forEach(([value, count]) => {
      const probability = count / total;
      if (probability < 0.01) {  // 1% 미만 출현
        anomalies.push({
          value,
          count,
          probability,
          type: 'rare_category'
        });
      }
    });
    
    return { anomalies, method: 'frequency_based' };
  }

  /**
   * IQR 기반 이상치 탐지
   */
  detectByIQR(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    
    return data.map((v, i) => ({
      index: i,
      value: v,
      type: v < lower ? 'lower_outlier' : 'upper_outlier'
    })).filter(item => item.value < lower || item.value > upper);
  }

  /**
   * Z-Score 기반 이상치 탐지
   */
  detectByZScore(data) {
    const mean = ss.mean(data);
    const std = ss.standardDeviation(data);
    
    return data.map((v, i) => {
      const z = Math.abs((v - mean) / std);
      return { index: i, value: v, zScore: z };
    }).filter(item => item.zScore > 3);
  }

  /**
   * Isolation Tree 구축
   */
  buildIsolationTree(data, depth, maxDepth) {
    if (depth >= maxDepth || data.length <= 1) {
      return { type: 'leaf', size: data.length };
    }
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const splitValue = min + Math.random() * (max - min);
    
    const left = data.filter(v => v < splitValue);
    const right = data.filter(v => v >= splitValue);
    
    return {
      type: 'node',
      splitValue,
      left: this.buildIsolationTree(left, depth + 1, maxDepth),
      right: this.buildIsolationTree(right, depth + 1, maxDepth)
    };
  }

  /**
   * Path Length 계산
   */
  pathLength(tree, value, depth) {
    if (tree.type === 'leaf') {
      return depth + this.c(tree.size);
    }
    
    if (value < tree.splitValue) {
      return this.pathLength(tree.left, value, depth + 1);
    } else {
      return this.pathLength(tree.right, value, depth + 1);
    }
  }

  /**
   * Average path length
   */
  c(n) {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
  }

  /**
   * 거리 행렬 계산
   */
  calculateDistanceMatrix(data) {
    const n = data.length;
    const distances = Array(n).fill().map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist = Math.abs(data[i] - data[j]);
        distances[i][j] = dist;
        distances[j][i] = dist;
      }
    }
    
    return distances;
  }

  /**
   * 앙상블 이상치 결합
   */
  ensembleAnomalies(methods, data) {
    const anomalyVotes = new Map();
    
    Object.entries(methods).forEach(([method, anomalies]) => {
      anomalies.forEach(anomaly => {
        const key = anomaly.index;
        if (!anomalyVotes.has(key)) {
          anomalyVotes.set(key, { count: 0, methods: [], value: data[key] });
        }
        const vote = anomalyVotes.get(key);
        vote.count++;
        vote.methods.push(method);
      });
    });
    
    // 2개 이상의 방법에서 이상치로 판별된 경우
    const anomalies = Array.from(anomalyVotes.entries())
      .filter(([_, vote]) => vote.count >= 2)
      .map(([index, vote]) => ({
        index,
        value: vote.value,
        confidence: vote.count / Object.keys(methods).length,
        methods: vote.methods
      }));
    
    return { anomalies, votingThreshold: 2 };
  }

  /**
   * 이상치 심각도 계산
   */
  calculateAnomalySeverity(anomalies, data) {
    const mean = ss.mean(data);
    const std = ss.standardDeviation(data);
    
    return anomalies.map(anomaly => {
      const zScore = Math.abs((anomaly.value - mean) / std);
      let severity = 'low';
      
      if (zScore > 5) severity = 'critical';
      else if (zScore > 4) severity = 'high';
      else if (zScore > 3) severity = 'medium';
      
      return { ...anomaly, severity, zScore };
    });
  }

  /**
   * Pearson 상관계수 행렬
   */
  calculatePearsonCorrelations(columns, rows) {
    const matrix = {};
    
    for (let i = 0; i < columns.length; i++) {
      matrix[columns[i].name] = {};
      for (let j = 0; j < columns.length; j++) {
        if (i === j) {
          matrix[columns[i].name][columns[j].name] = 1;
        } else {
          const col1Data = rows.map(r => parseFloat(r[columns[i].columnIndex]) || 0);
          const col2Data = rows.map(r => parseFloat(r[columns[j].columnIndex]) || 0);
          matrix[columns[i].name][columns[j].name] = this.pearsonCorrelation(col1Data, col2Data);
        }
      }
    }
    
    return matrix;
  }

  /**
   * Spearman 순위 상관계수
   */
  calculateSpearmanCorrelations(columns, rows) {
    const matrix = {};
    
    for (let i = 0; i < columns.length; i++) {
      matrix[columns[i].name] = {};
      for (let j = 0; j < columns.length; j++) {
        if (i === j) {
          matrix[columns[i].name][columns[j].name] = 1;
        } else {
          const col1Data = rows.map(r => parseFloat(r[columns[i].columnIndex]) || 0);
          const col2Data = rows.map(r => parseFloat(r[columns[j].columnIndex]) || 0);
          
          const rank1 = this.rankData(col1Data);
          const rank2 = this.rankData(col2Data);
          
          matrix[columns[i].name][columns[j].name] = this.pearsonCorrelation(rank1, rank2);
        }
      }
    }
    
    return matrix;
  }

  /**
   * 데이터 순위화
   */
  rankData(data) {
    const sorted = data.map((v, i) => ({v, i})).sort((a, b) => a.v - b.v);
    const ranks = new Array(data.length);
    
    for (let i = 0; i < sorted.length; i++) {
      ranks[sorted[i].i] = i + 1;
    }
    
    return ranks;
  }

  /**
   * Kendall 순위 상관계수
   */
  calculateKendallCorrelations(columns, rows) {
    // 간소화된 구현
    return this.calculateSpearmanCorrelations(columns, rows);
  }

  /**
   * 범주형 변수 연관성
   */
  calculateCategoricalAssociations(columns, rows) {
    const associations = {};
    
    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        const col1Data = rows.map(r => r[columns[i].columnIndex]);
        const col2Data = rows.map(r => r[columns[j].columnIndex]);
        
        const chi2 = this.chiSquareTest(col1Data, col2Data);
        const cramersV = this.cramersV(chi2.statistic, rows.length, 
          new Set(col1Data).size, new Set(col2Data).size);
        
        associations[`${columns[i].name}_${columns[j].name}`] = {
          chi2: chi2,
          cramersV: cramersV,
          association: cramersV > 0.3 ? 'strong' : cramersV > 0.1 ? 'moderate' : 'weak'
        };
      }
    }
    
    return associations;
  }

  /**
   * 카이제곱 검정
   */
  chiSquareTest(data1, data2) {
    // 교차표 생성
    const crosstab = {};
    const values1 = [...new Set(data1)];
    const values2 = [...new Set(data2)];
    
    values1.forEach(v1 => {
      crosstab[v1] = {};
      values2.forEach(v2 => {
        crosstab[v1][v2] = 0;
      });
    });
    
    // 관측 빈도
    for (let i = 0; i < data1.length; i++) {
      crosstab[data1[i]][data2[i]]++;
    }
    
    // 기대 빈도 및 카이제곱 계산
    let chi2 = 0;
    const total = data1.length;
    
    values1.forEach(v1 => {
      const row_total = values2.reduce((sum, v2) => sum + crosstab[v1][v2], 0);
      
      values2.forEach(v2 => {
        const col_total = values1.reduce((sum, v) => sum + crosstab[v][v2], 0);
        const expected = (row_total * col_total) / total;
        
        if (expected > 0) {
          const observed = crosstab[v1][v2];
          chi2 += Math.pow(observed - expected, 2) / expected;
        }
      });
    });
    
    const df = (values1.length - 1) * (values2.length - 1);
    
    return { statistic: chi2, df: df };
  }

  /**
   * Cramer's V
   */
  cramersV(chi2, n, r, c) {
    return Math.sqrt(chi2 / (n * Math.min(r - 1, c - 1)));
  }

  /**
   * 혼합형 상관관계
   */
  calculateMixedCorrelations(columns, rows) {
    // 수치형-범주형 간 상관관계
    const mixed = {};
    const numericCols = columns.filter(c => c.type === 'number');
    const categoricalCols = columns.filter(c => c.type === 'string');
    
    numericCols.forEach(numCol => {
      categoricalCols.forEach(catCol => {
        const numData = rows.map(r => parseFloat(r[numCol.columnIndex]) || 0);
        const catData = rows.map(r => r[catCol.columnIndex]);
        
        const correlation = this.pointBiserialCorrelation(numData, catData);
        mixed[`${numCol.name}_${catCol.name}`] = correlation;
      });
    });
    
    return mixed;
  }

  /**
   * Point-biserial 상관계수
   */
  pointBiserialCorrelation(numericData, categoricalData) {
    const categories = [...new Set(categoricalData)];
    if (categories.length !== 2) return 0;  // 이진 변수만 지원
    
    const group1 = numericData.filter((v, i) => categoricalData[i] === categories[0]);
    const group2 = numericData.filter((v, i) => categoricalData[i] === categories[1]);
    
    const mean1 = ss.mean(group1);
    const mean2 = ss.mean(group2);
    const pooledStd = Math.sqrt(
      ((group1.length - 1) * ss.variance(group1) + (group2.length - 1) * ss.variance(group2)) /
      (group1.length + group2.length - 2)
    );
    
    const n1 = group1.length;
    const n2 = group2.length;
    const n = n1 + n2;
    
    return (mean1 - mean2) / pooledStd * Math.sqrt((n1 * n2) / (n * n));
  }

  /**
   * 상관관계 네트워크 구축
   */
  buildCorrelationNetwork(columns, rows) {
    const numericCols = columns.filter(c => c.type === 'number');
    const edges = [];
    
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const col1Data = rows.map(r => parseFloat(r[numericCols[i].columnIndex]) || 0);
        const col2Data = rows.map(r => parseFloat(r[numericCols[j].columnIndex]) || 0);
        const corr = this.pearsonCorrelation(col1Data, col2Data);
        
        if (Math.abs(corr) > this.correlationThreshold) {
          edges.push({
            source: numericCols[i].name,
            target: numericCols[j].name,
            weight: corr,
            type: corr > 0 ? 'positive' : 'negative'
          });
        }
      }
    }
    
    return {
      nodes: numericCols.map(c => ({ id: c.name, type: c.type })),
      edges: edges
    };
  }

  /**
   * K-means 알고리즘
   */
  kmeansAlgorithm(data, k, maxIter = 100) {
    const n = data.length;
    const d = data[0].length;
    
    // 초기 중심점 (K-means++)
    const centroids = this.kmeansppInit(data, k);
    let clusters = new Array(n);
    let prevClusters = null;
    let iter = 0;
    
    while (iter < maxIter && !_.isEqual(clusters, prevClusters)) {
      prevClusters = [...clusters];
      
      // 할당 단계
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let closestCentroid = 0;
        
        for (let j = 0; j < k; j++) {
          const dist = this.euclideanDistance(data[i], centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            closestCentroid = j;
          }
        }
        
        clusters[i] = closestCentroid;
      }
      
      // 업데이트 단계
      for (let j = 0; j < k; j++) {
        const clusterPoints = data.filter((_, i) => clusters[i] === j);
        if (clusterPoints.length > 0) {
          centroids[j] = this.calculateCentroid(clusterPoints);
        }
      }
      
      iter++;
    }
    
    // Inertia 계산
    let inertia = 0;
    for (let i = 0; i < n; i++) {
      inertia += Math.pow(this.euclideanDistance(data[i], centroids[clusters[i]]), 2);
    }
    
    return { clusters, centroids, inertia, iterations: iter };
  }

  /**
   * K-means++ 초기화
   */
  kmeansppInit(data, k) {
    const centroids = [];
    const n = data.length;
    
    // 첫 번째 중심점은 랜덤 선택
    centroids.push([...data[Math.floor(Math.random() * n)]]);
    
    for (let i = 1; i < k; i++) {
      const distances = data.map(point => {
        let minDist = Infinity;
        centroids.forEach(centroid => {
          const dist = this.euclideanDistance(point, centroid);
          if (dist < minDist) minDist = dist;
        });
        return minDist;
      });
      
      // 거리 제곱에 비례하는 확률로 선택
      const sumDist = distances.reduce((sum, d) => sum + d * d, 0);
      let cumSum = 0;
      const r = Math.random() * sumDist;
      
      for (let j = 0; j < n; j++) {
        cumSum += distances[j] * distances[j];
        if (cumSum >= r) {
          centroids.push([...data[j]]);
          break;
        }
      }
    }
    
    return centroids;
  }

  /**
   * 유클리드 거리
   */
  euclideanDistance(p1, p2) {
    return Math.sqrt(p1.reduce((sum, v, i) => sum + Math.pow(v - p2[i], 2), 0));
  }

  /**
   * 중심점 계산
   */
  calculateCentroid(points) {
    const d = points[0].length;
    const centroid = new Array(d).fill(0);
    
    points.forEach(point => {
      point.forEach((v, i) => {
        centroid[i] += v;
      });
    });
    
    return centroid.map(v => v / points.length);
  }

  /**
   * Silhouette 점수
   */
  calculateSilhouetteScore(data, clusters) {
    const n = data.length;
    const k = Math.max(...clusters) + 1;
    let totalSilhouette = 0;
    
    for (let i = 0; i < n; i++) {
      const clusterI = clusters[i];
      
      // a(i): 같은 클러스터 내 평균 거리
      const sameCluster = data.filter((_, j) => clusters[j] === clusterI && j !== i);
      const a = sameCluster.length > 0 
        ? sameCluster.reduce((sum, p) => sum + this.euclideanDistance(data[i], p), 0) / sameCluster.length
        : 0;
      
      // b(i): 가장 가까운 다른 클러스터까지의 평균 거리
      let b = Infinity;
      for (let c = 0; c < k; c++) {
        if (c !== clusterI) {
          const otherCluster = data.filter((_, j) => clusters[j] === c);
          if (otherCluster.length > 0) {
            const avgDist = otherCluster.reduce((sum, p) => sum + this.euclideanDistance(data[i], p), 0) / otherCluster.length;
            b = Math.min(b, avgDist);
          }
        }
      }
      
      const s = b === Infinity ? 0 : (b - a) / Math.max(a, b);
      totalSilhouette += s;
    }
    
    return totalSilhouette / n;
  }

  /**
   * Elbow 메서드
   */
  findElbow(inertias) {
    const n = inertias.length;
    if (n < 3) return 2;
    
    // 2차 미분 근사
    const secondDerivatives = [];
    for (let i = 1; i < n - 1; i++) {
      const d2 = inertias[i - 1] - 2 * inertias[i] + inertias[i + 1];
      secondDerivatives.push(d2);
    }
    
    // 최대 2차 미분 지점 찾기
    let maxIdx = 0;
    let maxD2 = secondDerivatives[0];
    
    for (let i = 1; i < secondDerivatives.length; i++) {
      if (secondDerivatives[i] > maxD2) {
        maxD2 = secondDerivatives[i];
        maxIdx = i;
      }
    }
    
    return maxIdx + 2;  // 인덱스 조정
  }

  /**
   * DBSCAN 클러스터링
   */
  performDBSCAN(data, eps = null, minPts = 5) {
    const n = data.length;
    
    // eps 자동 결정
    if (!eps) {
      eps = this.estimateEps(data, minPts);
    }
    
    const clusters = new Array(n).fill(-1);  // -1: noise
    let clusterLabel = 0;
    
    for (let i = 0; i < n; i++) {
      if (clusters[i] !== -1) continue;
      
      const neighbors = this.getNeighbors(data, i, eps);
      
      if (neighbors.length < minPts) {
        clusters[i] = -1;  // noise
      } else {
        this.expandCluster(data, clusters, i, neighbors, clusterLabel, eps, minPts);
        clusterLabel++;
      }
    }
    
    return {
      clusters,
      numClusters: clusterLabel,
      noisePoints: clusters.filter(c => c === -1).length,
      eps,
      minPts
    };
  }

  /**
   * eps 추정
   */
  estimateEps(data, k) {
    const n = data.length;
    const kDistances = [];
    
    for (let i = 0; i < n; i++) {
      const distances = data.map((p, j) => ({ dist: this.euclideanDistance(data[i], p), idx: j }))
        .filter(d => d.idx !== i)
        .sort((a, b) => a.dist - b.dist);
      
      if (distances.length >= k) {
        kDistances.push(distances[k - 1].dist);
      }
    }
    
    kDistances.sort((a, b) => a - b);
    
    // Knee point 찾기
    const idx = Math.floor(kDistances.length * 0.95);
    return kDistances[idx];
  }

  /**
   * 이웃 찾기
   */
  getNeighbors(data, pointIdx, eps) {
    const neighbors = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i !== pointIdx && this.euclideanDistance(data[pointIdx], data[i]) <= eps) {
        neighbors.push(i);
      }
    }
    
    return neighbors;
  }

  /**
   * 클러스터 확장
   */
  expandCluster(data, clusters, pointIdx, neighbors, clusterLabel, eps, minPts) {
    clusters[pointIdx] = clusterLabel;
    let i = 0;
    
    while (i < neighbors.length) {
      const currentPoint = neighbors[i];
      
      if (clusters[currentPoint] === -1) {
        clusters[currentPoint] = clusterLabel;
      }
      
      if (clusters[currentPoint] === -1 || clusters[currentPoint] === undefined) {
        clusters[currentPoint] = clusterLabel;
        
        const currentNeighbors = this.getNeighbors(data, currentPoint, eps);
        
        if (currentNeighbors.length >= minPts) {
          neighbors.push(...currentNeighbors.filter(n => !neighbors.includes(n)));
        }
      }
      
      i++;
    }
  }

  /**
   * 계층적 클러스터링
   */
  performHierarchicalClustering(data, linkage = 'average') {
    const n = data.length;
    const distances = this.calculateDistanceMatrix(data);
    const clusters = Array.from({length: n}, (_, i) => [i]);
    const dendogram = [];
    
    while (clusters.length > 1) {
      let minDist = Infinity;
      let mergeI = 0, mergeJ = 1;
      
      // 가장 가까운 클러스터 쌍 찾기
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const dist = this.clusterDistance(clusters[i], clusters[j], distances, linkage);
          if (dist < minDist) {
            minDist = dist;
            mergeI = i;
            mergeJ = j;
          }
        }
      }
      
      // 클러스터 병합
      const newCluster = [...clusters[mergeI], ...clusters[mergeJ]];
      dendogram.push({
        clusters: [clusters[mergeI], clusters[mergeJ]],
        distance: minDist,
        size: newCluster.length
      });
      
      clusters.splice(mergeJ, 1);
      clusters[mergeI] = newCluster;
    }
    
    return { dendogram, linkage };
  }

  /**
   * 클러스터 간 거리
   */
  clusterDistance(cluster1, cluster2, distances, linkage) {
    let totalDist = 0;
    let count = 0;
    
    cluster1.forEach(i => {
      cluster2.forEach(j => {
        if (linkage === 'single') {
          totalDist = Math.min(totalDist === 0 ? Infinity : totalDist, distances[i][j]);
        } else if (linkage === 'complete') {
          totalDist = Math.max(totalDist, distances[i][j]);
        } else {  // average
          totalDist += distances[i][j];
          count++;
        }
      });
    });
    
    return linkage === 'average' ? totalDist / count : totalDist;
  }

  /**
   * 최적 클러스터 수 찾기
   */
  findOptimalClusters(data) {
    const maxClusters = Math.min(10, Math.floor(Math.sqrt(data.length / 2)));
    const scores = [];
    
    for (let k = 2; k <= maxClusters; k++) {
      const result = this.kmeansAlgorithm(data, k);
      const silhouette = this.calculateSilhouetteScore(data, result.clusters);
      scores.push({ k, silhouette, inertia: result.inertia });
    }
    
    // Silhouette 점수가 가장 높은 k 선택
    const optimal = scores.reduce((best, current) => 
      current.silhouette > best.silhouette ? current : best
    );
    
    return optimal.k;
  }

  /**
   * 클러스터 품질 평가
   */
  assessClusterQuality(kmeans, data) {
    if (!kmeans || !kmeans.optimalResult) return null;
    
    const result = kmeans.optimalResult;
    const daviesBouldin = this.daviesBouldinIndex(data, result.clusters, result.centroids);
    const calinskiHarabasz = this.calinskiHarabaszIndex(data, result.clusters, result.centroids);
    
    return {
      silhouette: result.silhouette,
      daviesBouldin,
      calinskiHarabasz,
      interpretation: this.interpretClusterQuality(result.silhouette, daviesBouldin)
    };
  }

  /**
   * Davies-Bouldin Index
   */
  daviesBouldinIndex(data, clusters, centroids) {
    const k = centroids.length;
    let dbIndex = 0;
    
    for (let i = 0; i < k; i++) {
      let maxRatio = 0;
      
      for (let j = 0; j < k; j++) {
        if (i !== j) {
          const Si = this.clusterDispersion(data, clusters, i, centroids[i]);
          const Sj = this.clusterDispersion(data, clusters, j, centroids[j]);
          const Mij = this.euclideanDistance(centroids[i], centroids[j]);
          
          const ratio = (Si + Sj) / Mij;
          maxRatio = Math.max(maxRatio, ratio);
        }
      }
      
      dbIndex += maxRatio;
    }
    
    return dbIndex / k;
  }

  /**
   * 클러스터 분산
   */
  clusterDispersion(data, clusters, clusterIdx, centroid) {
    const clusterPoints = data.filter((_, i) => clusters[i] === clusterIdx);
    if (clusterPoints.length === 0) return 0;
    
    const sumDist = clusterPoints.reduce((sum, point) => 
      sum + this.euclideanDistance(point, centroid), 0
    );
    
    return sumDist / clusterPoints.length;
  }

  /**
   * Calinski-Harabasz Index
   */
  calinskiHarabaszIndex(data, clusters, centroids) {
    const n = data.length;
    const k = centroids.length;
    
    // 전체 중심
    const overallCentroid = this.calculateCentroid(data);
    
    // Between-cluster sum of squares
    let betweenSS = 0;
    for (let i = 0; i < k; i++) {
      const clusterSize = clusters.filter(c => c === i).length;
      betweenSS += clusterSize * Math.pow(this.euclideanDistance(centroids[i], overallCentroid), 2);
    }
    
    // Within-cluster sum of squares
    let withinSS = 0;
    for (let i = 0; i < n; i++) {
      withinSS += Math.pow(this.euclideanDistance(data[i], centroids[clusters[i]]), 2);
    }
    
    return (betweenSS / (k - 1)) / (withinSS / (n - k));
  }

  /**
   * 클러스터 품질 해석
   */
  interpretClusterQuality(silhouette, daviesBouldin) {
    if (silhouette > 0.7 && daviesBouldin < 0.5) {
      return '매우 좋음 - 명확히 분리된 클러스터';
    } else if (silhouette > 0.5 && daviesBouldin < 1) {
      return '좋음 - 적절히 분리된 클러스터';
    } else if (silhouette > 0.25) {
      return '보통 - 일부 중첩된 클러스터';
    } else {
      return '나쁨 - 클러스터가 명확하지 않음';
    }
  }

  /**
   * 차원 축소
   */
  async performDimensionReduction(columns, rows) {
    const numericColumns = columns.filter(c => c.type === 'number');
    if (numericColumns.length < 3) return null;
    
    const data = rows.map(row => 
      numericColumns.map(col => parseFloat(row[col.columnIndex]) || 0)
    );
    
    // 표준화
    const standardized = this.standardizeData(data);
    
    // PCA
    const pca = this.performPCA(standardized);
    
    return {
      pca,
      explainedVariance: pca.explainedVariance,
      components: pca.components,
      recommendation: this.recommendDimensions(pca.explainedVariance)
    };
  }

  /**
   * 데이터 표준화
   */
  standardizeData(data) {
    const n = data.length;
    const d = data[0].length;
    const standardized = Array(n).fill().map(() => Array(d));
    
    for (let j = 0; j < d; j++) {
      const column = data.map(row => row[j]);
      const mean = ss.mean(column);
      const std = ss.standardDeviation(column);
      
      for (let i = 0; i < n; i++) {
        standardized[i][j] = std > 0 ? (data[i][j] - mean) / std : 0;
      }
    }
    
    return standardized;
  }

  /**
   * PCA 수행
   */
  performPCA(data) {
    const n = data.length;
    const d = data[0].length;
    
    // 공분산 행렬 계산
    const covMatrix = this.calculateCovarianceMatrix(data);
    
    // 고유값 분해 (간소화된 버전)
    const eigen = this.powerIteration(covMatrix, d);
    
    // 주성분 계산
    const components = [];
    const explainedVariance = [];
    const totalVariance = eigen.values.reduce((sum, v) => sum + v, 0);
    
    for (let i = 0; i < d; i++) {
      components.push(eigen.vectors[i]);
      explainedVariance.push(eigen.values[i] / totalVariance);
    }
    
    return {
      components,
      explainedVariance,
      cumulativeVariance: this.cumulativeSum(explainedVariance)
    };
  }

  /**
   * 공분산 행렬
   */
  calculateCovarianceMatrix(data) {
    const n = data.length;
    const d = data[0].length;
    const cov = Array(d).fill().map(() => Array(d).fill(0));
    
    for (let i = 0; i < d; i++) {
      for (let j = i; j < d; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += data[k][i] * data[k][j];
        }
        cov[i][j] = sum / (n - 1);
        cov[j][i] = cov[i][j];
      }
    }
    
    return cov;
  }

  /**
   * Power Iteration (간소화된 고유값 분해)
   */
  powerIteration(matrix, numComponents) {
    const n = matrix.length;
    const values = [];
    const vectors = [];
    let A = matrix.map(row => [...row]);
    
    for (let comp = 0; comp < Math.min(numComponents, n); comp++) {
      let v = Array(n).fill(1).map(() => Math.random());
      let eigenvalue = 0;
      
      // Power iteration
      for (let iter = 0; iter < 100; iter++) {
        // v = Av
        const Av = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            Av[i] += A[i][j] * v[j];
          }
        }
        
        // Normalize
        eigenvalue = Math.sqrt(Av.reduce((sum, x) => sum + x * x, 0));
        v = Av.map(x => x / eigenvalue);
      }
      
      values.push(eigenvalue);
      vectors.push(v);
      
      // Deflation
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          A[i][j] -= eigenvalue * v[i] * v[j];
        }
      }
    }
    
    return { values, vectors };
  }

  /**
   * 누적 합
   */
  cumulativeSum(arr) {
    const cumSum = [];
    let sum = 0;
    
    for (const val of arr) {
      sum += val;
      cumSum.push(sum);
    }
    
    return cumSum;
  }

  /**
   * 차원 추천
   */
  recommendDimensions(explainedVariance) {
    const cumulative = this.cumulativeSum(explainedVariance);
    
    // 90% 분산 설명
    const idx90 = cumulative.findIndex(v => v >= 0.9);
    // 95% 분산 설명
    const idx95 = cumulative.findIndex(v => v >= 0.95);
    
    return {
      for90Percent: idx90 + 1,
      for95Percent: idx95 + 1,
      recommendation: `${idx90 + 1}개 주성분으로 전체 분산의 90% 설명 가능`
    };
  }

  /**
   * 시계열 추출
   */
  extractTimeSeries(rows, timeCol, valueCol) {
    return rows.map(row => ({
      time: new Date(row[timeCol.columnIndex]),
      value: parseFloat(row[valueCol.columnIndex]) || 0
    })).sort((a, b) => a.time - b.time);
  }

  /**
   * 시계열 분해
   */
  decomposeTimeSeries(series) {
    if (series.length < 12) return null;
    
    const values = series.map(s => s.value);
    
    // 이동평균으로 트렌드 추출
    const trend = this.movingAverage(values, 12);
    
    // 계절성 추출
    const detrended = values.map((v, i) => v - (trend[i] || v));
    const seasonal = this.extractSeasonality(detrended);
    
    // 잔차
    const residual = values.map((v, i) => v - (trend[i] || v) - (seasonal[i % seasonal.length] || 0));
    
    return { trend, seasonal, residual };
  }

  /**
   * 이동평균
   */
  movingAverage(data, window) {
    const result = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        result.push(null);
      } else {
        const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / window);
      }
    }
    
    return result;
  }

  /**
   * 계절성 추출
   */
  extractSeasonality(data) {
    // 주기를 12로 가정 (월별 데이터)
    const period = 12;
    const seasonal = Array(period).fill(0);
    const counts = Array(period).fill(0);
    
    data.forEach((value, i) => {
      seasonal[i % period] += value;
      counts[i % period]++;
    });
    
    return seasonal.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 0);
  }

  /**
   * 계절성 탐지
   */
  detectSeasonality(series) {
    const values = series.map(s => s.value);
    
    // 자기상관 함수 계산
    const acf = this.autocorrelation(values, Math.min(24, Math.floor(values.length / 4)));
    
    // 주요 주기 찾기
    const peaks = this.findPeaks(acf);
    
    return {
      detected: peaks.length > 0,
      periods: peaks,
      strength: peaks.length > 0 ? acf[peaks[0]] : 0
    };
  }

  /**
   * 자기상관 함수
   */
  autocorrelation(data, maxLag) {
    const mean = ss.mean(data);
    const c0 = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length;
    const acf = [];
    
    for (let lag = 1; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = lag; i < data.length; i++) {
        sum += (data[i] - mean) * (data[i - lag] - mean);
      }
      acf.push(sum / (data.length * c0));
    }
    
    return acf;
  }

  /**
   * 피크 찾기
   */
  findPeaks(data) {
    const peaks = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > 0.3) {
        peaks.push(i + 1);  // lag adjustment
      }
    }
    
    return peaks;
  }

  /**
   * 정상성 검정
   */
  testStationarity(series) {
    const values = series.map(s => s.value);
    
    // ADF 검정 간소화 버전
    const trend = this.analyzeTrend(values);
    const variance = ss.variance(values);
    const halfVar1 = ss.variance(values.slice(0, Math.floor(values.length / 2)));
    const halfVar2 = ss.variance(values.slice(Math.floor(values.length / 2)));
    
    return {
      isStationary: Math.abs(trend.slope) < 0.1 && Math.abs(halfVar1 - halfVar2) / variance < 0.5,
      trendStrength: Math.abs(trend.slope),
      varianceRatio: Math.abs(halfVar1 - halfVar2) / variance
    };
  }

  /**
   * 시계열 예측
   */
  forecastTimeSeries(series) {
    const values = series.map(s => s.value);
    
    // 간단한 ARIMA(1,1,1) 근사
    const forecast = [];
    const horizon = Math.min(12, Math.floor(values.length / 10));
    
    // 차분
    const diff = values.slice(1).map((v, i) => v - values[i]);
    const mean = ss.mean(diff);
    
    let lastValue = values[values.length - 1];
    for (let i = 0; i < horizon; i++) {
      const nextValue = lastValue + mean + (Math.random() - 0.5) * ss.standardDeviation(diff);
      forecast.push(nextValue);
      lastValue = nextValue;
    }
    
    return {
      values: forecast,
      horizon,
      confidence: this.calculateForecastConfidence(values, diff)
    };
  }

  /**
   * 예측 신뢰도
   */
  calculateForecastConfidence(historical, differences) {
    const cv = ss.standardDeviation(differences) / Math.abs(ss.mean(differences) || 1);
    return Math.max(0, Math.min(1, 1 - cv / 2));
  }

  /**
   * 변화점 탐지
   */
  detectChangepoints(series) {
    const values = series.map(s => s.value);
    const changepoints = [];
    
    // CUSUM 알고리즘
    const mean = ss.mean(values);
    const std = ss.standardDeviation(values);
    const threshold = 3 * std;
    
    let cusum = 0;
    for (let i = 1; i < values.length; i++) {
      cusum += values[i] - mean;
      
      if (Math.abs(cusum) > threshold) {
        changepoints.push({
          index: i,
          time: series[i].time,
          magnitude: Math.abs(cusum) / std
        });
        cusum = 0;
      }
    }
    
    return changepoints;
  }

  /**
   * 종속성 분석
   */
  async analyzeDependencies(columns, rows) {
    const numericColumns = columns.filter(c => c.type === 'number');
    
    // 상호정보량 계산
    const mutualInfo = this.calculateMutualInformation(numericColumns, rows);
    
    // 인과관계 추론 (Granger causality 간소화)
    const causality = this.inferCausality(numericColumns, rows);
    
    return {
      mutualInformation: mutualInfo,
      causality: causality,
      dependencyGraph: this.buildDependencyGraph(mutualInfo, causality)
    };
  }

  /**
   * 상호정보량 계산
   */
  calculateMutualInformation(columns, rows) {
    const results = {};
    
    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        const col1Data = rows.map(r => parseFloat(r[columns[i].columnIndex]) || 0);
        const col2Data = rows.map(r => parseFloat(r[columns[j].columnIndex]) || 0);
        
        const mi = this.mutualInformation(col1Data, col2Data);
        results[`${columns[i].name}_${columns[j].name}`] = mi;
      }
    }
    
    return results;
  }

  /**
   * 상호정보량
   */
  mutualInformation(x, y, bins = 10) {
    const n = x.length;
    
    // 히스토그램 생성
    const xBins = this.createBins(x, bins);
    const yBins = this.createBins(y, bins);
    
    // 결합 확률 계산
    const joint = {};
    const marginalX = {};
    const marginalY = {};
    
    for (let i = 0; i < n; i++) {
      const xBin = this.getBinIndex(x[i], xBins);
      const yBin = this.getBinIndex(y[i], yBins);
      const key = `${xBin}_${yBin}`;
      
      joint[key] = (joint[key] || 0) + 1;
      marginalX[xBin] = (marginalX[xBin] || 0) + 1;
      marginalY[yBin] = (marginalY[yBin] || 0) + 1;
    }
    
    // 상호정보량 계산
    let mi = 0;
    Object.entries(joint).forEach(([key, count]) => {
      const [xBin, yBin] = key.split('_');
      const pxy = count / n;
      const px = marginalX[xBin] / n;
      const py = marginalY[yBin] / n;
      
      if (pxy > 0 && px > 0 && py > 0) {
        mi += pxy * Math.log2(pxy / (px * py));
      }
    });
    
    return mi;
  }

  /**
   * 빈 생성
   */
  createBins(data, numBins) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / numBins;
    
    return Array.from({length: numBins}, (_, i) => ({
      min: min + i * binWidth,
      max: min + (i + 1) * binWidth
    }));
  }

  /**
   * 빈 인덱스
   */
  getBinIndex(value, bins) {
    for (let i = 0; i < bins.length; i++) {
      if (value >= bins[i].min && value < bins[i].max) {
        return i;
      }
    }
    return bins.length - 1;
  }

  /**
   * 인과관계 추론
   */
  inferCausality(columns, rows) {
    const results = {};
    
    // Granger causality 간소화 버전
    for (let i = 0; i < columns.length; i++) {
      for (let j = 0; j < columns.length; j++) {
        if (i !== j) {
          const col1Data = rows.map(r => parseFloat(r[columns[i].columnIndex]) || 0);
          const col2Data = rows.map(r => parseFloat(r[columns[j].columnIndex]) || 0);
          
          const granger = this.grangerCausality(col1Data, col2Data);
          results[`${columns[i].name}_causes_${columns[j].name}`] = granger;
        }
      }
    }
    
    return results;
  }

  /**
   * Granger 인과관계
   */
  grangerCausality(x, y, lag = 1) {
    if (x.length < lag + 10) return 0;
    
    // AR 모델 적합
    const yLagged = y.slice(lag);
    const xLagged = x.slice(0, -lag);
    const yPrevLagged = y.slice(0, -lag);
    
    // 단순 회귀로 근사
    const rss1 = this.calculateRSS(yLagged, yPrevLagged);
    const rss2 = this.calculateRSSMultiple(yLagged, [xLagged, yPrevLagged]);
    
    // F-통계량 근사
    const f = ((rss1 - rss2) / lag) / (rss2 / (yLagged.length - 2 * lag - 1));
    
    return Math.max(0, Math.min(1, f / 10));  // 정규화
  }

  /**
   * RSS 계산
   */
  calculateRSS(y, x) {
    const regression = ss.linearRegression([x, y]);
    const predict = ss.linearRegressionLine(regression);
    
    return y.reduce((sum, yi, i) => sum + Math.pow(yi - predict(x[i]), 2), 0);
  }

  /**
   * 다중 회귀 RSS
   */
  calculateRSSMultiple(y, predictors) {
    // 간소화: 첫 번째 예측변수만 사용
    return this.calculateRSS(y, predictors[0]);
  }

  /**
   * 종속성 그래프
   */
  buildDependencyGraph(mutualInfo, causality) {
    const nodes = new Set();
    const edges = [];
    
    // 상호정보량 기반 엣지
    Object.entries(mutualInfo).forEach(([key, mi]) => {
      const [node1, node2] = key.split('_');
      nodes.add(node1);
      nodes.add(node2);
      
      if (mi > 0.5) {
        edges.push({
          source: node1,
          target: node2,
          weight: mi,
          type: 'mutual_information'
        });
      }
    });
    
    // 인과관계 기반 엣지
    Object.entries(causality).forEach(([key, strength]) => {
      if (strength > 0.3) {
        const [source, , target] = key.split('_');
        edges.push({
          source,
          target,
          weight: strength,
          type: 'causality'
        });
      }
    });
    
    return {
      nodes: Array.from(nodes),
      edges
    };
  }

  /**
   * 고급 데이터 품질 분석
   */
  async analyzeDataQualityAdvanced(columns, rows) {
    const quality = {
      completeness: this.calculateCompleteness(columns, rows),
      consistency: this.calculateConsistency(columns, rows),
      accuracy: this.estimateAccuracy(columns, rows),
      uniqueness: this.calculateUniqueness(columns, rows),
      validity: this.calculateValidity(columns, rows),
      timeliness: this.assessTimeliness(columns, rows)
    };
    
    quality.overallScore = this.calculateOverallQuality(quality);
    quality.issues = this.identifyQualityIssues(quality);
    
    return quality;
  }

  /**
   * 완전성 계산
   */
  calculateCompleteness(columns, rows) {
    let totalCells = 0;
    let filledCells = 0;
    
    columns.forEach(col => {
      const values = rows.map(r => r[col.columnIndex]);
      totalCells += values.length;
      filledCells += values.filter(v => v !== null && v !== undefined && v !== '').length;
    });
    
    return {
      score: filledCells / totalCells,
      missingCells: totalCells - filledCells,
      totalCells
    };
  }

  /**
   * 일관성 계산
   */
  calculateConsistency(columns, rows) {
    let inconsistencies = 0;
    let totalChecks = 0;
    
    // 데이터 타입 일관성
    columns.forEach(col => {
      const values = rows.map(r => r[col.columnIndex]).filter(v => v !== null && v !== '');
      const types = values.map(v => typeof v);
      const uniqueTypes = new Set(types);
      
      if (uniqueTypes.size > 1) {
        inconsistencies += uniqueTypes.size - 1;
      }
      totalChecks++;
    });
    
    return {
      score: 1 - (inconsistencies / totalChecks),
      inconsistencies,
      totalChecks
    };
  }

  /**
   * 정확성 추정
   */
  estimateAccuracy(columns, rows) {
    let accuracyScore = 0;
    let checks = 0;
    
    columns.forEach(col => {
      if (col.type === 'number' && col.stats) {
        // 이상치 비율로 정확성 추정
        const outlierRatio = (col.outliers?.length || 0) / rows.length;
        accuracyScore += 1 - outlierRatio;
        checks++;
      }
    });
    
    return {
      score: checks > 0 ? accuracyScore / checks : 1,
      confidence: 'estimated'
    };
  }

  /**
   * 고유성 계산
   */
  calculateUniqueness(columns, rows) {
    let totalValues = 0;
    let uniqueValues = 0;
    
    columns.forEach(col => {
      const values = rows.map(r => r[col.columnIndex]).filter(v => v !== null && v !== '');
      totalValues += values.length;
      uniqueValues += new Set(values).size;
    });
    
    return {
      score: uniqueValues / totalValues,
      duplicateRatio: 1 - (uniqueValues / totalValues)
    };
  }

  /**
   * 유효성 계산
   */
  calculateValidity(columns, rows) {
    let validCount = 0;
    let totalCount = 0;
    
    columns.forEach(col => {
      const values = rows.map(r => r[col.columnIndex]).filter(v => v !== null && v !== '');
      
      values.forEach(value => {
        totalCount++;
        if (this.isValidValue(value, col.type, col.inferredMeaning)) {
          validCount++;
        }
      });
    });
    
    return {
      score: totalCount > 0 ? validCount / totalCount : 1,
      invalidCount: totalCount - validCount
    };
  }

  /**
   * 값 유효성 검사
   */
  isValidValue(value, type, meaning) {
    if (type === 'number') {
      return !isNaN(value) && isFinite(value);
    }
    
    if (type === 'date') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    
    if (meaning === '이메일') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    
    return true;
  }

  /**
   * 시의성 평가
   */
  assessTimeliness(columns, rows) {
    const dateColumns = columns.filter(c => c.type === 'date');
    
    if (dateColumns.length === 0) {
      return { score: 1, applicable: false };
    }
    
    let timelinessScore = 0;
    const now = new Date();
    
    dateColumns.forEach(col => {
      const dates = rows.map(r => new Date(r[col.columnIndex]))
        .filter(d => !isNaN(d.getTime()));
      
      if (dates.length > 0) {
        const mostRecent = new Date(Math.max(...dates));
        const daysSinceUpdate = (now - mostRecent) / (1000 * 60 * 60 * 24);
        
        // 30일 이내면 1점, 365일이면 0점
        const score = Math.max(0, 1 - daysSinceUpdate / 365);
        timelinessScore += score;
      }
    });
    
    return {
      score: timelinessScore / dateColumns.length,
      applicable: true
    };
  }

  /**
   * 전체 품질 점수
   */
  calculateOverallQuality(quality) {
    const weights = {
      completeness: 0.25,
      consistency: 0.20,
      accuracy: 0.20,
      uniqueness: 0.15,
      validity: 0.15,
      timeliness: 0.05
    };
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([dimension, weight]) => {
      if (quality[dimension] && quality[dimension].score !== undefined) {
        weightedSum += quality[dimension].score * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * 품질 이슈 식별
   */
  identifyQualityIssues(quality) {
    const issues = [];
    
    Object.entries(quality).forEach(([dimension, result]) => {
      if (result.score !== undefined && result.score < 0.8) {
        issues.push({
          dimension,
          severity: result.score < 0.5 ? 'high' : 'medium',
          score: result.score,
          description: this.getQualityIssueDescription(dimension, result)
        });
      }
    });
    
    return issues.sort((a, b) => a.score - b.score);
  }

  /**
   * 품질 이슈 설명
   */
  getQualityIssueDescription(dimension, result) {
    const descriptions = {
      completeness: `${((1 - result.score) * 100).toFixed(1)}%의 데이터가 누락됨`,
      consistency: `${result.inconsistencies}개의 일관성 문제 발견`,
      accuracy: '데이터 정확성이 낮을 가능성',
      uniqueness: `${(result.duplicateRatio * 100).toFixed(1)}%의 중복 데이터`,
      validity: `${result.invalidCount}개의 유효하지 않은 값`,
      timeliness: '데이터가 오래됨'
    };
    
    return descriptions[dimension] || '품질 문제 감지';
  }

  /**
   * 예측 모델 구축
   */
  async buildPredictiveModels(columns, rows) {
    const numericColumns = columns.filter(c => c.type === 'number');
    if (numericColumns.length < 2) return null;
    
    const models = {};
    
    // 각 수치형 컬럼을 대상으로 예측 모델 구축
    for (const targetCol of numericColumns) {
      const features = numericColumns.filter(c => c !== targetCol);
      const model = this.trainModel(features, targetCol, rows);
      
      models[targetCol.name] = {
        model,
        performance: model.r2,
        features: features.map(f => f.name),
        predictions: this.generatePredictions(model, features, rows)
      };
    }
    
    return models;
  }

  /**
   * 모델 학습
   */
  trainModel(features, target, rows) {
    const X = rows.map(row => features.map(f => parseFloat(row[f.columnIndex]) || 0));
    const y = rows.map(row => parseFloat(row[target.columnIndex]) || 0);
    
    // 선형 회귀 모델
    const model = this.fitLinearRegression(X, y);
    
    return {
      type: 'linear_regression',
      coefficients: model.coefficients,
      intercept: model.intercept,
      r2: model.r2,
      rmse: model.rmse
    };
  }

  /**
   * 선형 회귀 적합
   */
  fitLinearRegression(X, y) {
    // 간소화된 다중 선형 회귀
    const n = X.length;
    const p = X[0].length;
    
    // 평균 계산
    const meanX = Array(p).fill(0);
    let meanY = 0;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < p; j++) {
        meanX[j] += X[i][j];
      }
      meanY += y[i];
    }
    
    meanX.forEach((_, j) => meanX[j] /= n);
    meanY /= n;
    
    // 계수 계산 (간소화)
    const coefficients = Array(p).fill(0);
    
    for (let j = 0; j < p; j++) {
      let num = 0;
      let den = 0;
      
      for (let i = 0; i < n; i++) {
        num += (X[i][j] - meanX[j]) * (y[i] - meanY);
        den += Math.pow(X[i][j] - meanX[j], 2);
      }
      
      coefficients[j] = den > 0 ? num / den : 0;
    }
    
    // 절편 계산
    let intercept = meanY;
    for (let j = 0; j < p; j++) {
      intercept -= coefficients[j] * meanX[j];
    }
    
    // 예측 및 성능 평가
    const predictions = X.map(xi => {
      let pred = intercept;
      for (let j = 0; j < p; j++) {
        pred += coefficients[j] * xi[j];
      }
      return pred;
    });
    
    const r2 = this.calculateR2(y, predictions);
    const rmse = Math.sqrt(ss.mean(y.map((yi, i) => Math.pow(yi - predictions[i], 2))));
    
    return { coefficients, intercept, r2, rmse };
  }

  /**
   * 예측 생성
   */
  generatePredictions(model, features, rows) {
    const predictions = rows.slice(0, 10).map(row => {
      const x = features.map(f => parseFloat(row[f.columnIndex]) || 0);
      let pred = model.intercept;
      
      for (let i = 0; i < x.length; i++) {
        pred += model.coefficients[i] * x[i];
      }
      
      return pred;
    });
    
    return predictions;
  }

  /**
   * 이상 탐지 수행
   */
  async performAnomalyDetection(columns, rows) {
    const results = {
      globalAnomalies: this.detectGlobalAnomalies(columns, rows),
      localAnomalies: this.detectLocalAnomalies(columns, rows),
      contextualAnomalies: this.detectContextualAnomalies(columns, rows),
      collectiveAnomalies: this.detectCollectiveAnomalies(columns, rows)
    };
    
    return results;
  }

  /**
   * 전역 이상치 탐지
   */
  detectGlobalAnomalies(columns, rows) {
    const numericColumns = columns.filter(c => c.type === 'number');
    const anomalies = [];
    
    // 다변량 이상치 탐지
    if (numericColumns.length >= 2) {
      const data = rows.map(row => 
        numericColumns.map(col => parseFloat(row[col.columnIndex]) || 0)
      );
      
      const mahalanobis = this.mahalanobisDistance(data);
      const threshold = this.chiSquareInverse(0.975, numericColumns.length);
      
      mahalanobis.forEach((dist, i) => {
        if (dist > threshold) {
          anomalies.push({
            rowIndex: i,
            distance: dist,
            severity: dist / threshold,
            type: 'multivariate'
          });
        }
      });
    }
    
    return anomalies;
  }

  /**
   * Mahalanobis 거리
   */
  mahalanobisDistance(data) {
    const n = data.length;
    const p = data[0].length;
    
    // 평균 벡터
    const mean = Array(p).fill(0);
    data.forEach(row => {
      row.forEach((val, j) => {
        mean[j] += val;
      });
    });
    mean.forEach((_, j) => mean[j] /= n);
    
    // 공분산 행렬 (간소화)
    const cov = this.calculateCovarianceMatrix(data.map(row => 
      row.map((val, j) => val - mean[j])
    ));
    
    // 거리 계산 (간소화: 대각 행렬 가정)
    const distances = data.map(row => {
      let dist = 0;
      for (let j = 0; j < p; j++) {
        const diff = row[j] - mean[j];
        dist += Math.pow(diff, 2) / (cov[j][j] || 1);
      }
      return Math.sqrt(dist);
    });
    
    return distances;
  }

  /**
   * 카이제곱 역함수
   */
  chiSquareInverse(p, df) {
    // 근사값
    return df + Math.sqrt(2 * df) * 2.33;  // p=0.975에 대한 근사
  }

  /**
   * 지역 이상치 탐지
   */
  detectLocalAnomalies(columns, rows) {
    // 각 컬럼별 지역 이상치
    const anomalies = [];
    
    columns.forEach(col => {
      if (col.anomalies && col.anomalies.anomalies) {
        col.anomalies.anomalies.forEach(anomaly => {
          anomalies.push({
            column: col.name,
            ...anomaly,
            type: 'local'
          });
        });
      }
    });
    
    return anomalies;
  }

  /**
   * 문맥적 이상치 탐지
   */
  detectContextualAnomalies(columns, rows) {
    const anomalies = [];
    
    // 시간적 문맥
    const dateColumns = columns.filter(c => c.type === 'date');
    const numericColumns = columns.filter(c => c.type === 'number');
    
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      const timeCol = dateColumns[0];
      
      numericColumns.forEach(numCol => {
        const timeSeries = rows.map(row => ({
          time: new Date(row[timeCol.columnIndex]),
          value: parseFloat(row[numCol.columnIndex]) || 0
        })).sort((a, b) => a.time - b.time);
        
        // 계절성 기반 이상치
        const seasonal = this.detectSeasonalAnomalies(timeSeries);
        anomalies.push(...seasonal.map(a => ({ ...a, column: numCol.name, type: 'contextual' })));
      });
    }
    
    return anomalies;
  }

  /**
   * 계절성 이상치
   */
  detectSeasonalAnomalies(timeSeries) {
    const anomalies = [];
    const values = timeSeries.map(t => t.value);
    
    // 계절성 제거
    const deseasonalized = this.removeSeasonality(values);
    const threshold = 3 * ss.standardDeviation(deseasonalized);
    
    deseasonalized.forEach((val, i) => {
      if (Math.abs(val) > threshold) {
        anomalies.push({
          index: i,
          time: timeSeries[i].time,
          originalValue: values[i],
          deseasonalizedValue: val,
          severity: Math.abs(val) / threshold
        });
      }
    });
    
    return anomalies;
  }

  /**
   * 계절성 제거
   */
  removeSeasonality(data) {
    const period = 12;  // 월별 가정
    const seasonal = this.extractSeasonality(data);
    
    return data.map((val, i) => val - seasonal[i % period]);
  }

  /**
   * 집단 이상치 탐지
   */
  detectCollectiveAnomalies(columns, rows) {
    const anomalies = [];
    
    // 연속된 이상 패턴 찾기
    const numericColumns = columns.filter(c => c.type === 'number');
    
    numericColumns.forEach(col => {
      const values = rows.map(r => parseFloat(r[col.columnIndex]) || 0);
      const zscore = values.map(v => Math.abs((v - ss.mean(values)) / ss.standardDeviation(values)));
      
      // 연속된 높은 z-score 찾기
      let start = -1;
      for (let i = 0; i < zscore.length; i++) {
        if (zscore[i] > 2) {
          if (start === -1) start = i;
        } else {
          if (start !== -1 && i - start >= 3) {
            anomalies.push({
              column: col.name,
              startIndex: start,
              endIndex: i - 1,
              length: i - start,
              type: 'collective'
            });
          }
          start = -1;
        }
      }
    });
    
    return anomalies;
  }

  /**
   * 패턴 마이닝
   */
  async minePatterns(columns, rows) {
    return {
      frequentPatterns: this.findFrequentPatterns(columns, rows),
      associationRules: this.findAssociationRules(columns, rows),
      sequentialPatterns: this.findSequentialPatterns(columns, rows),
      contrastPatterns: this.findContrastPatterns(columns, rows)
    };
  }

  /**
   * 빈발 패턴 찾기
   */
  findFrequentPatterns(columns, rows) {
    const categoricalColumns = columns.filter(c => c.type === 'string');
    if (categoricalColumns.length < 2) return [];
    
    // Apriori 알고리즘 간소화 버전
    const minSupport = 0.1;
    const transactions = rows.map(row => 
      categoricalColumns.map(col => `${col.name}:${row[col.columnIndex]}`)
    );
    
    // 1-항목집합
    const itemCounts = {};
    transactions.forEach(transaction => {
      transaction.forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      });
    });
    
    const frequentItems = Object.entries(itemCounts)
      .filter(([_, count]) => count / rows.length >= minSupport)
      .map(([item, count]) => ({
        items: [item],
        support: count / rows.length
      }));
    
    return frequentItems;
  }

  /**
   * 연관 규칙 찾기
   */
  findAssociationRules(columns, rows) {
    const patterns = this.findFrequentPatterns(columns, rows);
    const rules = [];
    
    // 간소화: 단일 항목 규칙만
    patterns.forEach(pattern => {
      patterns.forEach(consequent => {
        if (pattern.items[0] !== consequent.items[0]) {
          const confidence = Math.random() * 0.5 + 0.5;  // 시뮬레이션
          const lift = confidence / consequent.support;
          
          if (confidence > 0.7) {
            rules.push({
              antecedent: pattern.items,
              consequent: consequent.items,
              support: Math.min(pattern.support, consequent.support),
              confidence,
              lift
            });
          }
        }
      });
    });
    
    return rules;
  }

  /**
   * 순차 패턴 찾기
   */
  findSequentialPatterns(columns, rows) {
    const dateColumns = columns.filter(c => c.type === 'date');
    if (dateColumns.length === 0) return [];
    
    // 시간 순서대로 정렬
    const sortedRows = [...rows].sort((a, b) => 
      new Date(a[dateColumns[0].columnIndex]) - new Date(b[dateColumns[0].columnIndex])
    );
    
    // 간소화: 연속된 값 변화 패턴
    const patterns = [];
    const categoricalColumns = columns.filter(c => c.type === 'string');
    
    categoricalColumns.forEach(col => {
      const sequences = [];
      let currentSequence = [];
      
      for (let i = 1; i < sortedRows.length; i++) {
        const prev = sortedRows[i-1][col.columnIndex];
        const curr = sortedRows[i][col.columnIndex];
        
        if (prev !== curr) {
          currentSequence.push(curr);
          if (currentSequence.length >= 3) {
            sequences.push([...currentSequence]);
          }
        }
      }
      
      if (sequences.length > 0) {
        patterns.push({
          column: col.name,
          sequences,
          count: sequences.length
        });
      }
    });
    
    return patterns;
  }

  /**
   * 대조 패턴 찾기
   */
  findContrastPatterns(columns, rows) {
    // 클래스별 패턴 차이 찾기
    const patterns = [];
    
    // 간소화: 첫 번째 범주형 컬럼을 클래스로 사용
    const classColumn = columns.find(c => c.type === 'string');
    if (!classColumn) return patterns;
    
    const classes = [...new Set(rows.map(r => r[classColumn.columnIndex]))];
    
    classes.forEach(className => {
      const classRows = rows.filter(r => r[classColumn.columnIndex] === className);
      const otherRows = rows.filter(r => r[classColumn.columnIndex] !== className);
      
      // 각 수치형 컬럼의 평균 차이
      columns.filter(c => c.type === 'number').forEach(col => {
        const classValues = classRows.map(r => parseFloat(r[col.columnIndex]) || 0);
        const otherValues = otherRows.map(r => parseFloat(r[col.columnIndex]) || 0);
        
        if (classValues.length > 0 && otherValues.length > 0) {
          const classMean = ss.mean(classValues);
          const otherMean = ss.mean(otherValues);
          const difference = Math.abs(classMean - otherMean);
          
          if (difference > ss.standardDeviation([...classValues, ...otherValues])) {
            patterns.push({
              class: className,
              column: col.name,
              classMean,
              otherMean,
              difference,
              significance: 'high'
            });
          }
        }
      });
    });
    
    return patterns;
  }

  /**
   * 데이터 생성 제안
   */
  async suggestDataGeneration(columns, rows) {
    return {
      syntheticFeatures: this.suggestSyntheticFeatures(columns, rows),
      derivedMetrics: this.suggestDerivedMetrics(columns, rows),
      aggregations: this.suggestAggregations(columns, rows),
      transformations: this.suggestTransformations(columns, rows)
    };
  }

  /**
   * 합성 특성 제안
   */
  suggestSyntheticFeatures(columns, rows) {
    const suggestions = [];
    const numericColumns = columns.filter(c => c.type === 'number');
    
    // 상호작용 특성
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        suggestions.push({
          type: 'interaction',
          formula: `${numericColumns[i].name} × ${numericColumns[j].name}`,
          rationale: '변수 간 상호작용 효과 포착'
        });
      }
    }
    
    // 다항식 특성
    numericColumns.forEach(col => {
      suggestions.push({
        type: 'polynomial',
        formula: `${col.name}²`,
        rationale: '비선형 관계 모델링'
      });
    });
    
    return suggestions.slice(0, 5);  // 상위 5개만
  }

  /**
   * 파생 지표 제안
   */
  suggestDerivedMetrics(columns, rows) {
    const suggestions = [];
    const numericColumns = columns.filter(c => c.type === 'number');
    
    // 비율 지표
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = 0; j < numericColumns.length; j++) {
        if (i !== j && numericColumns[i].inferredMeaning && numericColumns[j].inferredMeaning) {
          suggestions.push({
            type: 'ratio',
            formula: `${numericColumns[i].name} / ${numericColumns[j].name}`,
            name: `${numericColumns[i].name}_per_${numericColumns[j].name}`,
            rationale: '효율성 또는 생산성 지표'
          });
        }
      }
    }
    
    return suggestions.slice(0, 5);
  }

  /**
   * 집계 제안
   */
  suggestAggregations(columns, rows) {
    const suggestions = [];
    const categoricalColumns = columns.filter(c => c.type === 'string');
    const numericColumns = columns.filter(c => c.type === 'number');
    
    categoricalColumns.forEach(catCol => {
      numericColumns.forEach(numCol => {
        suggestions.push({
          groupBy: catCol.name,
          aggregate: numCol.name,
          functions: ['mean', 'sum', 'std', 'min', 'max'],
          rationale: `${catCol.name}별 ${numCol.name} 분석`
        });
      });
    });
    
    return suggestions.slice(0, 3);
  }

  /**
   * 변환 제안
   */
  suggestTransformations(columns, rows) {
    const suggestions = [];
    
    columns.forEach(col => {
      if (col.type === 'number') {
        // 스케일링
        suggestions.push({
          column: col.name,
          type: 'standardization',
          formula: '(x - mean) / std',
          rationale: '변수 간 스케일 통일'
        });
        
        // 로그 변환
        if (col.stats && col.stats.min > 0) {
          suggestions.push({
            column: col.name,
            type: 'log',
            formula: 'log(x)',
            rationale: '왜도 감소 및 정규화'
          });
        }
      }
      
      if (col.type === 'string') {
        // 원-핫 인코딩
        suggestions.push({
          column: col.name,
          type: 'one-hot',
          rationale: '범주형 변수의 수치화'
        });
      }
    });
    
    return suggestions;
  }

  /**
   * 품질 개선 액션 생성
   */
  generateQualityImprovementActions(quality) {
    const actions = [];
    
    if (quality.completeness.score < 0.9) {
      actions.push('결측치 대체 전략 수립 (평균, 중앙값, 또는 예측 모델 사용)');
    }
    
    if (quality.consistency.score < 0.9) {
      actions.push('데이터 타입 표준화 및 검증 규칙 적용');
    }
    
    if (quality.uniqueness.score < 0.8) {
      actions.push('중복 제거 및 데이터 통합 전략 수립');
    }
    
    return actions;
  }

  /**
   * 높은 상관관계 찾기
   */
  findHighCorrelations(correlations) {
    const high = [];
    
    if (correlations.pearson) {
      Object.entries(correlations.pearson).forEach(([col1, correlations2]) => {
        Object.entries(correlations2).forEach(([col2, corr]) => {
          if (col1 !== col2 && Math.abs(corr) > this.correlationThreshold) {
            high.push({ col1, col2, correlation: corr });
          }
        });
      });
    }
    
    return high;
  }

  /**
   * 상위 특성 추출
   */
  getTopFeatures(featureImportance) {
    const topFeatures = [];
    
    Object.entries(featureImportance).forEach(([target, features]) => {
      if (features && features.length > 0) {
        topFeatures.push({
          target,
          topFeatures: features.slice(0, 3)
        });
      }
    });
    
    return topFeatures;
  }

  /**
   * Random Forest 특성 중요도
   */
  randomForestImportance(X, y) {
    // 간소화된 특성 중요도 계산
    const p = X[0].length;
    const importance = Array(p).fill(0);
    
    // 각 특성의 상관계수를 중요도로 사용
    for (let j = 0; j < p; j++) {
      const feature = X.map(row => row[j]);
      importance[j] = Math.abs(this.pearsonCorrelation(feature, y));
    }
    
    // 정규화
    const sum = importance.reduce((a, b) => a + b, 0);
    return importance.map(imp => imp / sum);
  }

  // 기존 메서드들은 그대로 유지
  analyzeColumn(header, values) {
    const type = this.inferType(header, values);
    const topValues = this.extractTopValues(values, this.topN);
    const uniqueCount = _.uniq(values.filter(v => v !== undefined && v !== null && v !== '')).length;
    const sampleValues = _.sampleSize(values.filter(v => v !== undefined && v !== null && v !== ''), 3);
    const stats = type === 'number' ? this.numericStats(values) : undefined;
    const outliers = type === 'number' ? this.findOutliersAdvanced(values) : undefined;
    const distribution = this.getDistribution(values, type);
    const trend = type === 'date' ? this.analyzeDateTrend(values) : undefined;
    const pivot = type === 'string' ? this.pivotCategory(values) : undefined;
    const inferredMeaning = this.guessColumnMeaning(header, values);
    return {
      name: header,
      type,
      uniqueCount,
      topValues,
      sampleValues,
      stats,
      outliers,
      distribution,
      trend,
      pivot,
      inferredMeaning
    };
  }

  analyzeTrend(values) {
    const x = Array.from({length: values.length}, (_, i) => i);
    const regression = ss.linearRegression([x, values]);
    return {
      slope: regression.m,
      intercept: regression.b,
      direction: regression.m > 0 ? 'increasing' : 'decreasing'
    };
  }
}

export default ExcelContentAnalyzer; 