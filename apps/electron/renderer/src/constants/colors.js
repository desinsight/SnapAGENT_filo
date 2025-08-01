// 서비스별 대표 컬러 상수
export const SERVICE_COLORS = {
  'home': {
    primary: '#F97316',      // orange-500
    secondary: '#EA580C',    // orange-600
    gradient: 'from-orange-400 to-amber-500',
    light: '#FED7AA',        // orange-100
    dark: '#C2410C',         // orange-700
  },
  
  'file-manager': {
    primary: '#3B82F6',      // blue-500
    secondary: '#2563EB',    // blue-600
    gradient: 'from-blue-500 to-blue-600',
    light: '#DBEAFE',        // blue-100
    dark: '#1E40AF',         // blue-800
  },
  
  'chatbot': {
    primary: '#06B6D4',      // cyan-500
    secondary: '#0891B2',    // cyan-600
    gradient: 'from-cyan-500 to-blue-400',
    light: '#CFFAFE',        // cyan-100
    dark: '#0E7490',         // cyan-700
  },
  
  'calendar': {
    primary: '#EC4899',      // pink-500
    secondary: '#DB2777',    // pink-600
    gradient: 'from-pink-500 to-rose-400',
    light: '#FCE7F3',        // pink-100
    dark: '#BE185D',         // pink-700
  },
  
  'notifications': {
    primary: '#F59E0B',      // amber-500
    secondary: '#D97706',    // amber-600
    gradient: 'from-amber-400 to-yellow-300',
    light: '#FEF3C7',        // amber-100
    dark: '#92400E',         // amber-700
  },
  
  'task-manager': {
    primary: '#10B981',      // emerald-500
    secondary: '#059669',    // emerald-600
    gradient: 'from-green-500 to-emerald-600',
    light: '#D1FAE5',        // emerald-100
    dark: '#047857',         // emerald-700
  },
  
  'note-taking': {
    primary: '#8B5CF6',      // violet-500
    secondary: '#7C3AED',    // violet-600
    gradient: 'from-purple-500 to-indigo-600',
    light: '#EDE9FE',        // violet-100
    dark: '#6D28D9',         // violet-700
  },
  
  'cloud-sync': {
    primary: '#F97316',      // orange-500
    secondary: '#EA580C',    // orange-600
    gradient: 'from-orange-500 to-red-600',
    light: '#FED7AA',        // orange-100
    dark: '#C2410C',         // orange-700
  },
  
  'messenger': {
    primary: '#14B8A6',      // teal-500
    secondary: '#0D9488',    // teal-600
    gradient: 'from-teal-500 to-cyan-600',
    light: '#CCFBF1',        // teal-100
    dark: '#0F766E',         // teal-700
  },
  
  'contacts': {
    primary: '#8B5CF6',      // violet-500
    secondary: '#7C3AED',    // violet-600
    gradient: 'from-violet-500 to-purple-600',
    light: '#EDE9FE',        // violet-100
    dark: '#6D28D9',         // violet-700
  },
  
  'documents': {
    primary: '#DC2626',      // red-600
    secondary: '#B91C1C',    // red-700
    gradient: 'from-red-500 to-rose-600',
    light: '#FEE2E2',        // red-100
    dark: '#991B1B',         // red-800
  },
  
  'settings': {
    primary: '#6B7280',      // gray-500
    secondary: '#4B5563',    // gray-600
    gradient: 'from-gray-500 to-gray-600',
    light: '#F3F4F6',        // gray-100
    dark: '#374151',         // gray-700
  }
};

// 기본 UI 컬러 상수
export const UI_COLORS = {
  sidebar: {
    bg: '#0F172A',           // slate-900
    bgDark: '#000000',       // black
    item: '#334155',         // slate-700
    itemHover: '#475569',    // slate-600
    text: '#F8FAFC',         // slate-50
    textMuted: '#CBD5E1',    // slate-300
  },
  
  main: {
    bg: '#FFFFFF',           // white
    bgDark: '#1E293B',       // slate-800
    border: '#E2E8F0',       // slate-200
    borderDark: '#334155',   // slate-700
    text: '#0F172A',         // slate-900
    textDark: '#F8FAFC',     // slate-50
    textMuted: '#64748B',    // slate-500
  },
  
  accent: {
    primary: '#6366F1',      // indigo-500
    secondary: '#8B5CF6',    // violet-500
    success: '#10B981',      // emerald-500
    warning: '#F59E0B',      // amber-500
    error: '#EF4444',        // red-500
    info: '#06B6D4',         // cyan-500
  }
};

// 서비스 컬러 가져오기 함수
export const getServiceColor = (serviceId, type = 'gradient') => {
  return SERVICE_COLORS[serviceId]?.[type] || SERVICE_COLORS['settings'][type];
};

// 컬러 유틸리티 함수들
export const getServiceGradient = (serviceId) => {
  return getServiceColor(serviceId, 'gradient');
};

export const getServicePrimary = (serviceId) => {
  return getServiceColor(serviceId, 'primary');
};

export const getServiceSecondary = (serviceId) => {
  return getServiceColor(serviceId, 'secondary');
};