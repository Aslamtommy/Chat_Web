/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1e3a8a',
          dark: '#1e3a8a',
          light: '#4f46e5',
        },
        secondary: {
          DEFAULT: '#d4af37',
          dark: '#b45309',
          light: '#f59e0b',
        },
        accent: {
          DEFAULT: '#f3f4f6',
          dark: '#e5e7eb',
        },
        text: {
          DEFAULT: '#1f2937',
          muted: '#6b7280',
        },
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'deep': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '1rem',
      },
    },
  },
  plugins: [],
};