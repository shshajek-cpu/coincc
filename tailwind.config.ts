import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        card: {
          DEFAULT: '#141414',
          foreground: '#ffffff',
        },
        border: '#262626',
        primary: {
          DEFAULT: '#facc15',
          light: '#fef08a',
          foreground: '#0a0a0a',
        },
        secondary: {
          DEFAULT: '#262626',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#1a1a1a',
          foreground: '#a3a3a3',
        },
        accent: {
          DEFAULT: '#facc15',
          foreground: '#0a0a0a',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        ring: '#facc15',
        input: '#262626',
        foreground: '#ffffff',
        popover: {
          DEFAULT: '#141414',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'sans-serif'],
        mono: ['var(--font-space-grotesk)', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
