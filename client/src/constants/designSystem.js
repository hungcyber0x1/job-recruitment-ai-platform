/**
 * Design System Constants
 * Based on enterprise design specification for TrustMatch AI recruitment platform
 *
 * Color Palette (HEX values from unified green design system)
 * Primary: Green (#16A34A, #15803D, #065f46)
 * Accent: Teal / Mint (#14B8A6, #6EE7B7)
 * Semantics: Green, Orange, Red, Teal
 * Neutrals: Slate scale (#F8FAFC to #0F172A)
 */

export const DESIGN_COLORS = {
  // Primary Greens (Main CTA, Interactive)
  primary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#06503c',
    900: '#064e3b',
  },

  // Teal Accent (AI indicators, Explanations)
  accent: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0F766E',
    700: '#115E59',
    800: '#134E4A',
    900: '#042F2E',
  },

  // Semantic Colors
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  danger: '#EF4444',
  neutral: '#6B7280',
  info: '#10b981',

  // Neutral Slate
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Flower Theme (from existing design)
  flower: {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#14B8A6',
    blush: '#F3FDF6',
    lavender: '#ECFDF5',
    mint: '#D1FAE5',
    coral: '#A7F3D0',
  },
};

/**
 * Typography Scale
 * Font: Inter (body), Space Grotesk (headings)
 */
export const TYPOGRAPHY = {
  // Headings
  h1: {
    size: '30px',
    lineHeight: '38px',
    weight: 700,
    tracking: '0',
  },
  h2: {
    size: '24px',
    lineHeight: '32px',
    weight: 700,
    tracking: '0',
  },
  h3: {
    size: '20px',
    lineHeight: '28px',
    weight: 700,
    tracking: '0',
  },
  h4: {
    size: '18px',
    lineHeight: '28px',
    weight: 600,
  },
  h5: {
    size: '16px',
    lineHeight: '24px',
    weight: 600,
  },
  h6: {
    size: '14px',
    lineHeight: '20px',
    weight: 600,
  },

  // Body
  body: {
    base: {
      size: '16px',
      lineHeight: '24px',
      weight: 400,
    },
    small: {
      size: '14px',
      lineHeight: '22px',
      weight: 400,
    },
    large: {
      size: '18px',
      lineHeight: '28px',
      weight: 400,
    },
  },

  // Special
  caption: {
    size: '12px',
    lineHeight: '16px',
    weight: 500,
    letter: '0',
  },
  label: {
    size: '14px',
    lineHeight: '20px',
    weight: 600,
    letter: '0',
  },
};

/**
 * Spacing System
 * Base unit: 4px
 * Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96
 */
export const SPACING = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  18: '72px',
  20: '80px',
  24: '96px',
};

/**
 * Border Radius
 * Rounded, semi-rounded, fully rounded options
 */
export const BORDER_RADIUS = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '8px',
  '2xl': '8px',
  '3xl': '8px',
  full: '9999px', // Full circular
};

/**
 * Shadow System
 * Layered shadows for depth and hierarchy
 */
export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  base: '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
  md: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
  lg: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
  xl: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',

  // Color-specific shadows
  blue: '0 20px 25px -5px rgba(22, 163, 74, 0.15)',
  cyan: '0 20px 25px -5px rgba(20, 184, 166, 0.15)',
};

/**
 * Grid System
 * Responsive column layouts
 */
export const GRID = {
  desktop: {
    columns: 12,
    gutter: '24px',
    maxWidth: '1280px',
  },
  tablet: {
    columns: 8,
    gutter: '16px',
    maxWidth: '960px',
  },
  mobile: {
    columns: 4,
    gutter: '12px',
    maxWidth: '100%',
  },
};

/**
 * Component Variants
 * Predefined size and style combinations
 */
export const BUTTON_VARIANTS = {
  primary: {
    base: 'bg-primary text-primary-foreground hover:bg-primary/90',
    small: 'h-9 px-3 text-sm rounded-lg',
    medium: 'h-10 px-4 text-sm rounded-lg',
    large: 'h-11 px-5 text-sm rounded-lg',
  },
  secondary: {
    base: 'border border-border bg-card text-foreground hover:bg-muted/60',
    small: 'h-9 px-3 text-sm rounded-lg',
    medium: 'h-10 px-4 text-sm rounded-lg',
    large: 'h-11 px-5 text-sm rounded-lg',
  },
  ghost: {
    base: 'bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
    small: 'h-9 px-3 text-sm rounded-lg',
    medium: 'h-10 px-4 text-sm rounded-lg',
    large: 'h-11 px-5 text-sm rounded-lg',
  },
  destructive: {
    base: 'bg-danger text-white hover:bg-danger/90',
    small: 'h-9 px-3 text-sm rounded-lg',
    medium: 'h-10 px-4 text-sm rounded-lg',
    large: 'h-11 px-5 text-sm rounded-lg',
  },
};

/**
 * Breakpoints
 * Tailwind CSS responsive design
 */
export const BREAKPOINTS = {
  sm: '640px', // 40rem
  md: '768px', // 48rem
  lg: '1024px', // 64rem
  xl: '1280px', // 80rem
  '2xl': '1536px', // 96rem
};

/**
 * Z-Index Scale
 * Organized layering for stacking contexts
 */
export const Z_INDEX = {
  dropdown: 40,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 80,
};

export default {
  DESIGN_COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  GRID,
  BUTTON_VARIANTS,
  BREAKPOINTS,
  Z_INDEX,
};
