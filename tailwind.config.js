/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './article/**/*.html',
    './research/**/*.html',
    './about/**/*.html',
    './why/**/*.html',
    './word/**/*.html',
    './tracker/**/*.html',
    './_partials/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        'cp-teal': '#206795',
        'cp-cyan': '#38c1e0',
        'cp-dark': '#1a3347',
        'cp-muted': '#5a7a8f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
