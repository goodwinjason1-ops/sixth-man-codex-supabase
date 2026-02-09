/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lakers: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#065f46',
          900: '#064e3b',
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'bounce-arrow': 'bounceArrow 1.5s ease-in-out infinite',
        'swipe-hint': 'swipeHint 3s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out forwards',
        'cursor-blink': 'cursorBlink 1.2s ease-in-out infinite',
        'typing-dot': 'typingDot 1.4s ease-in-out infinite',
        'highlight-glow': 'highlightGlow 2s ease-in-out infinite',
        'progress-fill': 'progressFill 1s ease-out forwards',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.5)', opacity: 0.6 },
        },
        bounceArrow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        swipeHint: {
          '0%, 100%': { opacity: 0.2 },
          '50%': { opacity: 0.5 },
        },
        ripple: {
          '0%': { transform: 'scale(0.5)', opacity: 1 },
          '100%': { transform: 'scale(2.5)', opacity: 0 },
        },
        cursorBlink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        typingDot: {
          '0%, 60%, 100%': { opacity: 0.3, transform: 'translateY(0)' },
          '30%': { opacity: 1, transform: 'translateY(-3px)' },
        },
        highlightGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(74, 222, 128, 0.3), inset 0 0 4px rgba(74, 222, 128, 0.05)' },
          '50%': { boxShadow: '0 0 16px rgba(74, 222, 128, 0.5), inset 0 0 10px rgba(74, 222, 128, 0.15)' },
        },
        progressFill: {
          from: { strokeDashoffset: 'inherit' },
          to: { strokeDashoffset: 'var(--target-offset, 0)' },
        },
      }
    },
  },
  plugins: [],
}
