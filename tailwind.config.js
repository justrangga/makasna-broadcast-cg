/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          950: '#090a0f',
          900: '#0e1117',
          850: '#131722',
          800: '#1b202e',
          700: '#262d40',
          600: '#343d56',
          500: '#485577',
        },
        tally: {
          pvw: '#00e676', // Broadcast Green (Preview)
          pgm: '#ff1744', // Broadcast Red (Program / Live On-Air)
          amber: '#ffab00', // Standby / Overlay
          cyan: '#00e5ff', // Accent
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
