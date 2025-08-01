import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import COLORS from '../constants/colors';

const MENUS = [
  { label: '홈', path: '/' },
  { label: '파일 탐색', path: '/explorer' },
  { label: 'AI Copilot', path: '/copilot' },
  { label: '동기화', path: '/sync' },
  { label: '분석/리포트', path: '/analysis' },
  { label: '백업', path: '/backup' },
  { label: '보안/권한', path: '/security' },
  { label: '설정', path: '/settings' },
];

export default function NavBar() {
  const location = useLocation();
  return (
    <nav style={{
      background: COLORS.BRAND.PRIMARY,
      color: COLORS.WHITE,
      boxShadow: COLORS.SHADOW.MD,
      padding: '0 32px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: 1, color: COLORS.BRAND.ACCENT }}>
          <span style={{ color: COLORS.WHITE }}>Filo</span> Copilot
        </span>
        {MENUS.map(menu => (
          <Link
            key={menu.path}
            to={menu.path}
            style={{
              color: location.pathname === menu.path ? COLORS.BRAND.ACCENT : COLORS.WHITE,
              fontWeight: location.pathname === menu.path ? 700 : 400,
              fontSize: 16,
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 6,
              background: location.pathname === menu.path ? COLORS.BRAND.LIGHT : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            {menu.label}
          </Link>
        ))}
      </div>
      <div style={{ fontSize: 14, color: COLORS.GRAY[200] }}>
        Claude AI 기반 파일매니저
      </div>
    </nav>
  );
} 