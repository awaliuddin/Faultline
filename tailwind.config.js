/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.{ts,tsx}",
    "./index.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
