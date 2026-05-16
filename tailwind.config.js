/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#13131A',
        card: '#1C1C28',
        accent: '#6C5CE7',
        success: '#00B894',
        danger: '#FF6B6B',
        warning: '#FDCB6E',
        muted: '#8A8A9A',
      },
    },
  },
  plugins: [],
};
