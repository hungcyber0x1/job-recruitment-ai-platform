/**
 * Cấu hình Tailwind cho client.
 *
 * - `colors`: map tới biến HSL trong `src/index.css` (semantic: primary, card, …).
 * - `fontFamily.sans`: Be Vietnam Pro; `article`: serif cho nội dung blog.
 * - `extend`: shadow, animation — giữ `content` trỏ đủ file JSX/TSX để JIT không bỏ sót class.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        'foreground-soft': 'hsl(var(--foreground-soft))',
        'foreground-subtle': 'hsl(var(--foreground-subtle))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        'txt-main': 'hsl(var(--foreground))',
        'txt-muted': 'hsl(var(--muted-foreground))',
        'txt-light': 'hsl(215 20% 72%)',
        'state-success': 'hsl(var(--su))',
        'state-danger': 'hsl(var(--er))',
        success: {
          DEFAULT: 'hsl(var(--success))',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
        },
        error: {
          DEFAULT: 'hsl(var(--danger))',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
        },
        neutral: {
          DEFAULT: 'hsl(var(--neutral))',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
        },
        'primary-50': '#ecfdf5',
        'primary-100': '#d1fae5',
        'primary-200': '#a7f3d0',
        'primary-300': '#6ee7b7',
        'primary-400': '#34d399',
        'primary-500': '#10b981',
        'primary-600': '#059669',
        'primary-700': '#047857',
        'secondary-50': 'rgba(15, 23, 42, 0.45)',
        'secondary-100': 'rgba(255, 255, 255, 0.06)',
        'secondary-200': 'rgba(255, 255, 255, 0.1)',
        'secondary-300': 'rgba(255, 255, 255, 0.16)',
        'primary-foreground': 'hsl(var(--p-content))',
        secondaryShadow: 'rgba(2, 44, 34, 0.12)',
        ai: {
          blue: '#15803d',
          purple: '#2f855a',
          emerald: '#22c55e',
          cyan: '#14b8a6',
          indigo: '#166534',
          pink: '#65a30d',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        urgent: {
          DEFAULT: 'hsl(var(--urgent))',
          muted: 'hsl(var(--urgent-muted))',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      boxShadow: {
        premium: '0 14px 28px -18px rgba(15, 23, 42, 0.28)',
        super: '0 8px 24px -16px rgba(15, 23, 42, 0.16)',
        glow: '0 0 20px rgba(16, 185, 129, 0.24)',
        'blue-glow': '0 0 20px rgba(16, 185, 129, 0.20)',
        glass: '0 8px 28px -18px rgba(15, 23, 42, 0.18)',
        'ai-glow': '0 0 18px rgba(20, 184, 166, 0.22)',
        solid: '2px 2px 0px 0px currentColor',
        'solid-sm': '1px 1px 0px 0px currentColor',
      },
       fontFamily: {
        sans: ['"Be Vietnam Pro"', '"Roboto"', '"Nunito"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        /** Nội dung bài viết / phong cách báo in */
        article: ['"Source Serif 4"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      /** Unified product typography scale. Keep rem stable so shared utilities remain predictable. */
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.25rem' }],     // 14px -> 15.75px
        sm: ['1rem', { lineHeight: '1.5rem' }],            // 14px -> 15.75px
        base: ['1.125rem', { lineHeight: '1.75rem' }],    // 16px -> 18px
        lg: ['1.25rem', { lineHeight: '2rem' }],          // 18px -> 20.25px
        xl: ['1.375rem', { lineHeight: '2rem' }],         // 20px -> 22.5px
        '2xl': ['1.625rem', { lineHeight: '2.25rem' }],  // 24px -> 29.25px
        '3xl': ['2rem', { lineHeight: '2.5rem' }],       // 30px -> 36px
        '4xl': ['2.5rem', { lineHeight: '2.75rem' }],     // 36px -> 45px
        '5xl': ['3.25rem', { lineHeight: '1.15' }],      // 48px -> 58.5px
        '6xl': ['4rem', { lineHeight: '1.1' }],          // 60px -> 72px
      },
      borderRadius: {
        none: '0px',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.5rem',
        '2xl': '0.5rem',
        '3xl': '0.5rem',
        full: '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scanline': 'scanline 8s linear infinite',
        'glitch': 'glitch 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
      },
    },
  },
  plugins: [],
}
