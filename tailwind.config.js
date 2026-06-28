/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Oswald', 'Inter', 'sans-serif'],
      },
      colors: {
        // Fundo quente da marca
        cream: '#f4eee3',
        // Tons de carvão quente (texto / superfícies escuras)
        ink: {
          50: '#f7f6f4',
          100: '#eceae5',
          200: '#d8d3ca',
          300: '#b9b1a3',
          400: '#948b7b',
          500: '#756d5f',
          600: '#5d564b',
          700: '#46413a',
          800: '#2c2823',
          900: '#1c1915',
          950: '#100e0b',
        },
        // Dourado / âmbar da barbearia (acento)
        brand: {
          50: '#fbf7ee',
          100: '#f4e8cd',
          200: '#e9cf97',
          300: '#ddb162',
          400: '#d49b41',
          500: '#c07f2c',
          600: '#a36325',
          700: '#834a21',
          800: '#6d3c21',
          900: '#5d331f',
          950: '#34190d',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,25,21,0.04), 0 6px 20px -10px rgba(28,25,21,0.14)',
        card: '0 1px 3px rgba(28,25,21,0.06), 0 14px 34px -18px rgba(28,25,21,0.22)',
        glow: '0 8px 30px -8px rgba(212,155,65,0.45)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.21, 1, 0.4, 1)',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.21, 1, 0.4, 1)',
      },
    },
  },
  plugins: [],
}
