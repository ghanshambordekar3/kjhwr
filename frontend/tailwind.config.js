/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#0f172a',
          900: '#0a0f1d',
          950: '#05070e',
        },
        wind: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        actual: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        thermal: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        }
      }
    },
  },
  plugins: [],
}
