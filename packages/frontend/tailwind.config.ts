import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#F4A201',
        'gold-dim': '#F4A20120',
        green: {
          ci: '#009A44',
          dim: '#009A4415',
          border: '#009A4430',
        },
        bg: '#0A0A0A',
        surface: '#141414',
        surface2: '#1E1E1E',
        border: '#2A2A2A',
        muted: '#888888',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        pill: '999px',
      },
      keyframes: {
        'dot-pulse': {
          '0%, 80%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'dot-pulse': 'dot-pulse 1.4s ease-in-out infinite',
        'fade-up': 'fade-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
