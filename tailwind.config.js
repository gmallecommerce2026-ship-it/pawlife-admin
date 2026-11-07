// tailwind.config.js
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/modules/**/*.{js,ts,jsx,tsx}', // <-- Thêm dòng này
  ],
  theme: {
    extend: {
      colors: {
        // Màu cam chính (từ rgba(231,135,32,1))
        primary: '#E78720',
        'primary-light': 'rgba(231, 135, 32, 0.3)', // Dùng cho nền
        'primary-dark': '#D6791B', // Thêm màu hover
      },
      fontFamily: {
        // Thêm các font bạn đã dùng
        sans: ['"Be Vietnam Pro"', ...fontFamily.sans],
        'be-vietnam-pro': ['"Be Vietnam Pro"', ...fontFamily.sans],
        nunito: ['"Nunito"', ...fontFamily.sans],
        poppins: ['"Poppins"', ...fontFamily.sans],
        raleway: ['"Raleway"', ...fontFamily.sans],
        outfit: ['"Outfit"', ...fontFamily.sans],
      },
      // Thêm các giá trị tùy chỉnh (từ px)
      spacing: {
        '4.5': '1.125rem', // 18px
        'mt-4.5': '1.125rem',
        'mt-1.5': '0.375rem', // 6px
        'mt-7': '1.75rem', // 28px
      },
    },
  },
  plugins: [],
};