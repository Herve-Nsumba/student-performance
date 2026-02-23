/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'] },
      borderRadius: { xl: '16px', '2xl': '22px' },
      boxShadow: {
        soft: '0 10px 35px rgba(0,0,0,.06)',
      }
    },
  },
  plugins: [],
}
