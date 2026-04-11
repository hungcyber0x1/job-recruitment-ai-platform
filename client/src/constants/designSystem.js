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
  success: '#10b981', // #10b981 green
  warning: '#F59E0B', // #F59E0B amber
  error: '#EF4444', // #EF4444 red
  info: '#14B8A6',

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
    size: '48px', // 3rem
    lineHeight: '56px', // 3.5rem
    weight: 900, // Black
    tracking: '-2px', // -0.05em
  },
  h2: {
    size: '36px', // 2.25rem
    lineHeight: '44px', // 2.75rem
    weight: 900,
    tracking: '-1.5px',
  },
  h3: {
    size: '28px', // 1.75rem
    lineHeight: '36px', // 2.25rem
    weight: 800, // ExtraBold
    tracking: '-1px',
  },
  h4: {
    size: '24px', // 1.5rem
    lineHeight: '32px', // 2rem
    weight: 700, // Bold
  },
  h5: {
    size: '20px', // 1.25rem
    lineHeight: '28px', // 1.75rem
    weight: 700,
  },
  h6: {
    size: '16px', // 1rem
    lineHeight: '24px', // 1.5rem
    weight: 600, // SemiBold
  },

  // Body
  body: {
    base: {
      size: '16px',
      lineHeight: '24px', // 1.5rem
      weight: 400,
    },
    small: {
      size: '14px', // 0.875rem
      lineHeight: '20px',
      weight: 400,
    },
    large: {
      size: '18px', // 1.125rem
      lineHeight: '28px',
      weight: 400,
    },
  },

  // Special
  caption: {
    size: '12px', // 0.75rem
    lineHeight: '16px', // 1rem
    weight: 500, // Medium
    letter: '0.02em', // Increased tracking
  },
  label: {
    size: '14px', // 0.875rem
    lineHeight: '20px',
    weight: 600, // SemiBold
    letter: '0.01em',
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
  sm: '4px', // 0.25rem
  md: '8px', // 0.5rem
  lg: '12px', // 0.75rem
  xl: '16px', // 1rem
  '2xl': '20px', // 1.25rem
  '3xl': '24px', // 1.5rem
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
    base: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white',
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-6 py-2.5 text-base',
    large: 'px-8 py-3.5 text-lg',
  },
  secondary: {
    base: 'bg-muted/60 hover:bg-muted/80 active:bg-muted text-foreground transition-colors duration-200 ease-out',
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-6 py-2.5 text-base',
    large: 'px-8 py-3.5 text-lg',
  },
  ghost: {
    base: 'bg-transparent hover:bg-muted/35 active:bg-muted/55 text-foreground transition-colors duration-200 ease-out',
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-6 py-2.5 text-base',
    large: 'px-8 py-3.5 text-lg',
  },
  destructive: {
    base: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-6 py-2.5 text-base',
    large: 'px-8 py-3.5 text-lg',
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
