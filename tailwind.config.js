/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'empire-black': '#050505',
        'empire-green': '#53FC18',
        'empire-gray': '#1A1A1A',
      },
      fontFamily: {
        sans: ['Exo 2', 'Rajdhani', 'sans-serif'],
        heading: ['Michroma', 'Syncopate', 'Orbitron', 'sans-serif'],
        arabic: ['Cairo', 'Changa', 'Kufam', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      }
    },
  },
  plugins: [],
}
