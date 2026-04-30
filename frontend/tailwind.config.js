/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0d1117',
          card: '#161b22',
          lighter: '#21262d',
          border: '#30363d'
        },
        primary: {
          DEFAULT: '#2dd4bf', // Teal
          hover: '#14b8a6',
          translucent: 'rgba(45, 212, 191, 0.1)'
        },
        success: {
          DEFAULT: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)'
        },
        warning: {
          DEFAULT: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)'
        },
        danger: {
          DEFAULT: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)'
        },
        accent: {
          DEFAULT: '#c084fc', // Purple for OT
          bg: 'rgba(192, 132, 252, 0.1)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
