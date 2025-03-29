/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chat-bg': '#F4F4F6',              // Light gray background for chat pages
        'text-primary': '#1F2937',         // Dark charcoal for primary text
        'text-secondary': '#4B5563',       // Softer gray for secondary text
        'header-bg': '#FFFFFF',            // White for header and footer backgrounds
        'primary-light': '#93C5FD',        // Lighter blue for hover states
        'text-muted': '#9CA3AF',           // Muted gray for placeholder/timestamps
        'success': '#16A34A',              // Green for success badges
        'error': '#DC2626',                // Red for errors
        'warning': '#F59E0B',              // Orange for warnings
        'gray-50': '#F9FAFB',              // Ultra-light gray for subtle contrast
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',    // Soft shadow for subtle elevation
        'deep': '0 6px 18px rgba(0, 0, 0, 0.12)',   // Deeper shadow for modals and cards
        'message': '0 3px 10px rgba(0, 0, 0, 0.06)', // Shadow for chat bubbles
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
      },
      borderRadius: {
        'message': '1rem',
        'btn': '0.6rem',
        'card': '1.2rem',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'opacity': 'opacity',
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
