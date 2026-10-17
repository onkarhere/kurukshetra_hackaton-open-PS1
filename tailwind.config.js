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
        canvas: 'var(--canvas)',
        surface: {
          DEFAULT: 'var(--surface)',
          sunken: 'var(--surface-sunken)',
          strong: 'var(--surface-strong)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          fg: 'var(--accent-fg)',
          subtle: 'var(--accent-subtle)',
        },
        success: {
          DEFAULT: 'var(--success)',
          subtle: 'var(--success-subtle)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          subtle: 'var(--warning-subtle)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          subtle: 'var(--danger-subtle)',
        },
        info: {
          DEFAULT: 'var(--info)',
          subtle: 'var(--info-subtle)',
        },
        'ai-chip': {
          DEFAULT: 'var(--ai-chip)',
          bg: 'var(--ai-chip-bg)',
        },
        // Espresso & Peach warm palette
        espresso: {
          DEFAULT: '#4A3528',
          deep: '#33251F',
          ink: '#2A1C14',
          hover: '#5A4334',
        },
        peach: {
          DEFAULT: '#F6E3D1',
          strong: '#EBCDB1',
          soft: '#FFF8F1',
          hover: '#F1DCC8',
        },
        ink: {
          DEFAULT: '#1E140E',
          muted: '#5C4636',
        },
        ivory: {
          DEFAULT: '#F8F4EF',
          muted: '#E3D2C1',
          hover: '#EADBC8',
        },
        'pearl-gold': {
          DEFAULT: '#D6B48A',
          hover: '#B9926A',
        },
        'champagne-gold': '#B9926A',
        'border-peach': '#DDBF9F',
        'input-border': '#9A7655',
        'focus-light': '#7A5A3E',
        magenta: {
          DEFAULT: '#B21E63',
          hover: '#8F1650',
        },
        berry: '#8F1650',
        sidebar: {
          DEFAULT: '#33251F',
          fg: '#F3E9DE',
          muted: '#CDB9A6',
          border: '#4F3B2E',
          hover: '#4F3B2E',
          'active-bg': '#D6B48A',
          'active-fg': '#2A1C14',
        },
        pastel: {
          peach: '#F4C7A1',
          sage: '#C5D9B8',
          sky: '#BCD4E6',
          lavender: '#D7C7E8',
          mustard: '#EBD08F',
          rose: '#EEC0C8',
          teal: '#B4DCD6',
          sand: '#E2CDB0',
          coral: '#F2B5A0',
          mint: '#CDE8CF',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Source Sans 3', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        control: '6px',
        card: '8px',
        dialog: '12px',
        full: '9999px',
      },
      boxShadow: {
        card: 'var(--card-shadow, 0 8px 24px -12px rgba(74, 53, 40, 0.25))',
        popover: '0 8px 24px -12px rgba(74, 53, 40, 0.25)',
        dialog: '0 16px 48px -12px rgba(74, 53, 40, 0.35)',
      },
      transitionDuration: {
        DEFAULT: '120ms',
        sheet: '180ms',
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['13px', '18px'],
        'base': ['14px', '20px'],
        'lg': ['16px', '22px'],
        'xl': ['18px', '24px'],
        '2xl': ['24px', '30px'],
        '3xl': ['32px', '38px'],
      },
    },
  },
  plugins: [],
}
