export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        secondary: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Sans"', 'sans-serif'],
        serif: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        slate: {
          50: '#f8fafc',
          800: '#1e293b',
          900: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
