/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dashboard-bg': '#0F172A',
        'card-bg': '#1E293B',
      }
    },
  },
  plugins: [],
}