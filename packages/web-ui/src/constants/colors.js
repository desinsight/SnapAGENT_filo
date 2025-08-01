/**
 * Filo Enterprise SaaS 컬러 시스템
 * 컨셉: 모던하고 세련된 기업용 디자인
 */

export const COLORS = {
  // 기본 색상
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  
  // 브랜드 컬러 - 네이비 블루 기반
  BRAND: {
    PRIMARY: '#0F172A',      // 딥 네이비 (메인)
    SECONDARY: '#1E293B',    // 네이비 (보조)
    ACCENT: '#3B82F6',       // 블루 (액센트)
    LIGHT: '#E0F2FE',        // 라이트 블루 (배경)
  },
  
  // 그레이 스케일
  GRAY: {
    25: '#FCFCFD',           // 가장 밝은 그레이
    50: '#F9FAFB',           // 밝은 그레이 (배경)
    100: '#F2F4F7',          // 연한 그레이
    200: '#E4E7EC',          // 보더 그레이
    300: '#D0D5DD',          // 중간 그레이
    400: '#98A2B3',          // 텍스트 보조
    500: '#667085',          // 텍스트 중간
    600: '#475467',          // 텍스트 메인
    700: '#344054',          // 어두운 텍스트
    800: '#1D2939',          // 매우 어두운 텍스트
    900: '#101828',          // 가장 어두운 텍스트
  },
  
  // 상태 색상
  STATUS: {
    SUCCESS: '#17B26A',      // 성공 (그린)
    ERROR: '#F04438',        // 에러 (레드)
    WARNING: '#F79009',      // 경고 (오렌지)
    INFO: '#0BA5EC',         // 정보 (블루)
  },
  
  // 배경 색상
  BACKGROUND: {
    PRIMARY: '#FFFFFF',      // 메인 배경
    SECONDARY: '#F9FAFB',    // 보조 배경
    TERTIARY: '#F2F4F7',     // 3차 배경
    OVERLAY: 'rgba(15, 23, 42, 0.8)', // 오버레이
  },
  
  // 텍스트 색상
  TEXT: {
    PRIMARY: '#101828',      // 메인 텍스트
    SECONDARY: '#475467',    // 보조 텍스트
    TERTIARY: '#667085',     // 3차 텍스트
    DISABLED: '#98A2B3',     // 비활성화
    INVERSE: '#FFFFFF',      // 반전 텍스트
  },
  
  // 보더 색상
  BORDER: {
    PRIMARY: '#E4E7EC',      // 메인 보더
    SECONDARY: '#F2F4F7',    // 보조 보더
    FOCUS: '#3B82F6',        // 포커스 보더
    ERROR: '#FDA29B',        // 에러 보더
  },
  
  // 그림자 색상
  SHADOW: {
    XS: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
    SM: '0px 1px 3px 0px rgba(16, 24, 40, 0.1), 0px 1px 2px -1px rgba(16, 24, 40, 0.1)',
    MD: '0px 4px 6px -1px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.1)',
    LG: '0px 10px 15px -3px rgba(16, 24, 40, 0.1), 0px 4px 6px -4px rgba(16, 24, 40, 0.1)',
    XL: '0px 20px 25px -5px rgba(16, 24, 40, 0.1), 0px 8px 10px -6px rgba(16, 24, 40, 0.1)',
  },
  
  // 그라데이션
  GRADIENT: {
    PRIMARY: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    ACCENT: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    HERO: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #3B82F6 100%)',
  }
};

/**
 * 테마별 색상 매핑
 */
export const THEME = {
  // 브랜딩 색상
  BRAND: {
    PRIMARY: COLORS.BRAND.PRIMARY,
    SECONDARY: COLORS.BRAND.SECONDARY,
    ACCENT: COLORS.BRAND.ACCENT,
    LIGHT: COLORS.BRAND.LIGHT,
  },
  
  // 버튼 색상
  BUTTON: {
    PRIMARY: {
      BACKGROUND: COLORS.BRAND.PRIMARY,
      TEXT: COLORS.WHITE,
      HOVER: COLORS.BRAND.SECONDARY,
      SHADOW: COLORS.SHADOW.MD,
    },
    SECONDARY: {
      BACKGROUND: COLORS.WHITE,
      TEXT: COLORS.BRAND.PRIMARY,
      BORDER: COLORS.BORDER.PRIMARY,
      HOVER: COLORS.GRAY[50],
    },
    ACCENT: {
      BACKGROUND: COLORS.BRAND.ACCENT,
      TEXT: COLORS.WHITE,
      HOVER: '#2563EB',
      SHADOW: COLORS.SHADOW.MD,
    },
    GHOST: {
      BACKGROUND: 'transparent',
      TEXT: COLORS.TEXT.PRIMARY,
      HOVER: COLORS.GRAY[50],
    },
    DISABLED: {
      BACKGROUND: COLORS.GRAY[100],
      TEXT: COLORS.TEXT.DISABLED,
    },
  },
  
  // 입력 필드 색상
  INPUT: {
    BACKGROUND: COLORS.WHITE,
    BORDER: COLORS.BORDER.PRIMARY,
    FOCUS: COLORS.BORDER.FOCUS,
    ERROR: COLORS.BORDER.ERROR,
    TEXT: COLORS.TEXT.PRIMARY,
    PLACEHOLDER: COLORS.TEXT.TERTIARY,
  },
  
  // 카드 색상
  CARD: {
    BACKGROUND: COLORS.WHITE,
    BORDER: COLORS.BORDER.PRIMARY,
    SHADOW: COLORS.SHADOW.SM,
    HOVER: COLORS.SHADOW.MD,
  },
  
  // 페이지 배경
  PAGE: {
    BACKGROUND: COLORS.BACKGROUND.SECONDARY,
  },
  
  // 네비게이션
  NAV: {
    BACKGROUND: COLORS.WHITE,
    BORDER: COLORS.BORDER.PRIMARY,
    TEXT: COLORS.TEXT.PRIMARY,
    ACTIVE: COLORS.BRAND.PRIMARY,
  }
};

export default COLORS; 