import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const COLORS = {
  // Brand
  primary: '#2563EB', // Royal Blue
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  primaryMuted: '#DBEAFE',

  // Secondary & Accents
  secondary: '#0F172A', // Deep Slate
  accent: '#10B981', // Emerald
  accentLight: '#ECFDF5',
  accentDark: '#047857',
  
  violet: '#7C3AED',
  violetLight: '#F5F3FF',
  
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  
  danger: '#EF4444',
  dangerLight: '#FEF2F2',

  // Surfaces & Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  
  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#2563EB',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryGlow: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
};

export const IS_SMALL_DEVICE = SCREEN_WIDTH < 375;
export { SCREEN_WIDTH, SCREEN_HEIGHT };
