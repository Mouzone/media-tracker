const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Self-hosted via @fontsource-variable/inter (imported in src/styles.css)
        // rather than a render-blocking Google Fonts <link>.
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        gray: colors.slate,
        primary: colors.violet,
      },
      // A single easing vocabulary, so motion across the app feels like one system.
      transitionTimingFunction: {
        emphasis: 'cubic-bezier(0.32, 0.72, 0, 1)',
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        marquee: 'marquee var(--marquee-duration, 10s) linear infinite',
        shimmer: 'shimmer 1.8s infinite linear',
        'fade-in': 'fade-in 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scale-in 200ms cubic-bezier(0.32, 0.72, 0, 1)',
        'toast-in': 'toast-in 250ms cubic-bezier(0.32, 0.72, 0, 1)',
        'card-in': 'card-in 300ms cubic-bezier(0.32, 0.72, 0, 1) both',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-150%) skewX(-12deg)' },
          '100%': { transform: 'translateX(200%) skewX(-12deg)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(-12px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'card-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
