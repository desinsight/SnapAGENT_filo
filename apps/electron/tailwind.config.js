/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./renderer/index.html",
    "./renderer/src/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        discord: {
          bg: '#36393f',
          sidebar: '#2f3136',
          accent: '#7289da',
          text: '#dcddde',
          muted: '#72767d'
        }
      }
    },
  },
  plugins: [],
} 