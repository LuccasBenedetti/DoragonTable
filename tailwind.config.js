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
        doragon: {
          bg: '#0d0f12',
          surface: '#15181e',
          card: '#1c1f26',
          hover: '#252932',
          active: '#2d323e',
          border: '#2c313d',
          accent: '#e63946',
          gold: '#d4af37',
          emerald: '#10b981',
          flame: '#ff5a36',
          text: '#e2e8f0',
          muted: '#94a3b8',
        },
        discord: {
          darkest: '#0d0f12',
          sidebar: '#15181e',
          chat: '#1a1d24',
          hover: '#242832',
          active: '#2d3340',
          accent: '#e63946',
          'accent-hover': '#cc2936',
          text: '#e2e8f0',
          muted: '#94a3b8',
          danger: '#ef4444',
          success: '#10b981',
          warning: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
