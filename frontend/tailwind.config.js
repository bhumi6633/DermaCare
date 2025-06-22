const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.sky,
        success: colors.green,
        danger: colors.red,
        'custom-pink': '#f48fb1',
        'custom-yellow': '#feeca4',
        'custom-blue': '#a7d8f9',
      },
      fontFamily: {
        'quicksand': ['"Quicksand"', 'sans-serif'],
        'gloria': ['"Gloria Hallelujah"', 'cursive'],
      },
      backgroundImage: {
        'profile-bg': "url('/src/assets/profile-bg.png')",
        'scanner-bg': "url('/src/assets/scanner-bg.png')",
        'login-bg': "url('/src/assets/login-bg.png')",
      }
    },
  },
  plugins: [],
} 