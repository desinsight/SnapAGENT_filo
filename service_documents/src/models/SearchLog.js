/**
 * SearchLog Model - 검색 로그 데이터 모델
 * 사용자의 검색 쿼리, 결과, 클릭, 시간 등 기록
 *
 * @description
 * - 검색 쿼리, 필터, 정렬, 결과 수, 클릭, 시간 등 기록
 * - 사용자별, 세션별, IP별 구분 가능
 * - 추천/연관 문서, 통계 분석 등 확장 고려
 *
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const searchLogSchema = new mongoose.Schema({
  // 고유 식별자
  _id: {
    type: String,
    default: () => uuidv4(),
    required: true
  },
  // 사용자 정보
  userId: {
    type: String,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  ip: {
    type: String,
    index: true
  },
  // 검색 쿼리 및 파라미터
  query: {
    type: String,
    required: true
  },
  indices: [{
    type: String
  }],
  filters: {
    type: mongoose.Schema.Types.Mixed
  },
  sort: {
    type: mongoose.Schema.Types.Mixed
  },
  highlight: {
    type: mongoose.Schema.Types.Mixed
  },
  // 결과 정보
  resultCount: {
    type: Number,
    default: 0
  },
  results: [{
    id: String,
    index: String,
    score: Number
  }],
  // 클릭/상호작용 정보
  clickedIds: [{
    type: String
  }],
  // 검색 시간
  durationMs: {
    type: Number
  },
  // 메타데이터
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  // 생성/수정 정보
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스 최적화
searchLogSchema.index({ userId: 1, createdAt: -1 });
searchLogSchema.index({ query: 1 });
searchLogSchema.index({ indices: 1 });

const SearchLog = mongoose.model('SearchLog', searchLogSchema);
export default SearchLog; 