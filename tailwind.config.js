/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '640px',
        'sm': '768px',
        'md': '1024px',
        'lg': '1366px',
        'xl': '1920px',
        '2xl': '2560px',
        // Custom utility breakpoints
        'sidebar-auto': '1024px',
        'compact': '1280px',
      },
      spacing: {
        'sidebar': 'clamp(240px, 20vw, 280px)',
        'sidebar-collapsed': '64px',
      },
      colors: {
        glass: {
          50: 'rgba(255, 255, 255, 0.05)',
          100: 'rgba(255, 255, 255, 0.1)',
          200: 'rgba(255, 255, 255, 0.2)',
          300: 'rgba(255, 255, 255, 0.3)',
        }
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontSize: {
        'responsive-sm': 'clamp(0.75rem, 1vw, 0.875rem)',
        'responsive-base': 'clamp(0.875rem, 1.2vw, 1rem)',
        'responsive-lg': 'clamp(1rem, 1.5vw, 1.125rem)',
      }
    },
  },
  plugins: [],
};
