// src/components/profile/tokens.ts
// Sofly Picnic 컬러 팔레트.

export const SOFLY_P = {
  primary: '#f5d15a',
  primaryHover: '#d4b23e',
  primarySoft: '#fef4cc',
  background: '#fcf9ef',
  backgroundDeep: '#f6efd9',
  secondary: '#a0c1d5',
  secondaryDark: '#6e9bb6',
  secondarySoft: '#e3eef5',
  mint: '#c6dccb',
  mintDeep: '#7fa890',
  pink: '#f0c2bf',
  pinkDeep: '#c97e7a',
  white: '#ffffff',
  gray100: '#fafafa',
  gray200: '#f2f2f2',
  gray300: '#e1e1e1',
  gray400: '#c4c4c4',
  gray500: '#9a9a9a',
  gray600: '#757575',
  gray700: '#5b5b5b',
  gray800: '#404040',
  gray900: '#2b2b2b',
} as const;

export type SoflyPalette = typeof SOFLY_P;
