import React from 'react';
import COLORS from '../constants/colors';

export default function Analysis() {
  return (
    <div style={{ background: COLORS.BACKGROUND.PRIMARY, borderRadius: 16, boxShadow: COLORS.SHADOW.MD, padding: 32, minHeight: 400 }}>
      <h2 style={{ color: COLORS.BRAND.ACCENT, marginBottom: 16 }}>AI 파일 분석 & 리포트</h2>
      <div style={{ color: COLORS.TEXT.PRIMARY, fontSize: 18, marginBottom: 24 }}>
        AI가 폴더 및 파일을 자동 분석하여 리포트와 인사이트를 제공합니다.<br/>
        (추후 실제 분석 기능 연동 예정)
      </div>
    </div>
  );
} 