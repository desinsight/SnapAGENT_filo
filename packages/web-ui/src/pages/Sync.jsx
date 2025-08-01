import React from 'react';
import COLORS from '../constants/colors';

export default function Sync() {
  return (
    <div style={{ background: COLORS.BACKGROUND.PRIMARY, borderRadius: 16, boxShadow: COLORS.SHADOW.MD, padding: 32, minHeight: 400 }}>
      <h2 style={{ color: COLORS.BRAND.ACCENT, marginBottom: 16 }}>실시간 동기화</h2>
      <div style={{ color: COLORS.TEXT.PRIMARY, fontSize: 18, marginBottom: 24 }}>
        여러 디바이스 간 실시간 파일 동기화 기능을 제공합니다.<br/>
        (추후 실제 동기화 기능 연동 예정)
      </div>
    </div>
  );
} 