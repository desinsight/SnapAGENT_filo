import React from 'react';
import COLORS from '../constants/colors';

export default function Security() {
  return (
    <div style={{ background: COLORS.BACKGROUND.PRIMARY, borderRadius: 16, boxShadow: COLORS.SHADOW.MD, padding: 32, minHeight: 400 }}>
      <h2 style={{ color: COLORS.BRAND.ACCENT, marginBottom: 16 }}>보안 & 권한 관리</h2>
      <div style={{ color: COLORS.TEXT.PRIMARY, fontSize: 18, marginBottom: 24 }}>
        군사급 암호화와 세밀한 접근 제어로 데이터를 보호합니다.<br/>
        (추후 실제 보안/권한 기능 연동 예정)
      </div>
    </div>
  );
} 