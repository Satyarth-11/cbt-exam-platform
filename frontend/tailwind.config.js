/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jee: {
          blue: "#1E3A8A",
          cyan: "#0284C7",
          green: "#22C55E",
          orange: "#F97316",
          red: "#EF4444",
          purple: "#A855F7",
          dark: "#0F172A",
          slate: "#1E293B"
        }
      }
    },
  },
  plugins: [],
  important: '#root',
}
