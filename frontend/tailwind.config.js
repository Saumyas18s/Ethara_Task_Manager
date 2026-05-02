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
        accent: {
          DEFAULT: '#5B4FCF',
          hover: '#4A3FB5',
          light: '#EBE9FF',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
