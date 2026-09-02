/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce8ff',
          200: '#b8d1ff',
          300: '#8ab3ff',
          400: '#5a8fff',
          500: '#2d69f5',
          600: '#1e4fd0',
          700: '#1a3fa8',
          800: '#173586',
          900: '#152d6b',
        },
        receita: {
          50: '#ecfdf3',
          100: '#d1fadf',
          500: '#16a34a',
          600: '#0f8a3d',
          700: '#0c6e31',
        },
        despesa: {
          50: '#fdf2f2',
          100: '#fbe1e1',
          500: '#b3413f',
          600: '#993634',
          700: '#7d2b2a',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
