import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary: '#6C63FF', // Vibrant Violet
  primaryDark: '#5A52D5',
  secondary: '#FF6584', // Soft Pink/Red for accents
  background: '#F8F9FA', // Off-white/Light Grey
  surface: '#FFFFFF',
  text: '#2D3436', // Dark Grey for text
  textLight: '#A0A0A0',
  success: '#00B894', // Teal Green
  error: '#FF7675', // Soft Red
  warning: '#FDCB6E', // Mustard Yellow
  border: '#DFE6E9',
  overlay: 'rgba(0,0,0,0.4)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONTS = {
  regular: 'System', // You can swap this for a custom font family if installed
  medium: 'System',
  bold: 'System',
  size: {
    caption: 12,
    body: 16,
    subhead: 14,
    title: 20,
    h1: 28,
    h2: 24,
  },
};

export const LAYOUT = {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
};

export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  fonts: FONTS,
  shadows: SHADOWS,
  layout: LAYOUT,
  borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      round: 9999
  }
};
