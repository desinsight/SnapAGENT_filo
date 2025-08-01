import React from 'react';
import COLORS from '../constants/colors';

export default function Backup() {
  return (
    <div style={{ background: COLORS.BACKGROUND.PRIMARY, borderRadius: 16, boxShadow: COLORS.SHADOW.MD, padding: 32, minHeight: 400 }}>
      <h2 style={{ color: COLORS.BRAND.ACCENT, marginBottom: 16 }}>자동 백업</h2>
      <div style={{ color: COLORS.TEXT.PRIMARY, fontSize: 18, marginBottom: 24 }}>
        자동 백업으로 데이터 손실을 방지합니다.<br/>
        (추후 실제 백업 기능 연동 예정)
      </div>
    </div>
  );
} 