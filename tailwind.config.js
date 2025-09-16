/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./public/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        '1950s-blue': '#4A87C3',
        '1950s-red': '#E55353',
        'primary-text': '#696969',
      },
      keyframes: {
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        'fade-in-scale': 'fadeInScale 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
}