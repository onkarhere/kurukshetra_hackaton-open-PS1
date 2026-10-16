/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        border: 'var(--border)',
        fg: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          surface: 'var(--primary-surface)',
        },
        ai: {
          DEFAULT: 'var(--ai)',
          surface: 'var(--ai-surface)',
          border: 'var(--ai-border)',
        },
        success: {
          DEFAULT: 'var(--success)',
          surface: 'var(--success-surface)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          surface: 'var(--warning-surface)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          surface: 'var(--danger-surface)',
        },
        info: {
          DEFAULT: 'var(--info)',
          surface: 'var(--info-surface)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      borderRadius: {
        btn: '6px',
        input: '6px',
        card: '10px',
        modal: '14px',
        full: '9999px',
      },
      boxShadow: {
        hover: '0 1px 2px rgb(16 24 40 / 0.06)',
        popover: '0 8px 24px rgb(16 24 40 / 0.12)',
        modal: '0 20px 48px rgb(16 24 40 / 0.18)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulse_subtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in-right': 'slide-in-right 200ms ease-out',
        'scale-in': 'scale-in 150ms ease-out',
        'pulse-subtle': 'pulse_subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
