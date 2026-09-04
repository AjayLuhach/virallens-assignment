module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#23201f',
        'ink-soft': '#5c5457',
        muted: '#8d8388',
        line: '#efeaec',
        'line-strong': '#e2dade',
        paper: '#ffffff',
        canvas: '#faf8f9',
        blush: '#fdf2f6',
        'blush-deep': '#f9e4ec',
        rose: '#e8799f',
        'rose-deep': '#c9557f',
        'rose-ink': '#a33f66'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Segoe UI', 'Helvetica Neue', 'sans-serif']
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(35, 32, 31, 0.05)',
        lift: '0 10px 30px -14px rgba(35, 32, 31, 0.22)',
        focus: '0 0 0 3px rgba(232, 121, 159, 0.28)'
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        bounce_dot: {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.35' },
          '40%': { transform: 'translateY(-4px)', opacity: '1' }
        }
      },
      animation: {
        rise: 'rise 0.24s ease-out both'
      }
    }
  },
  plugins: []
};
