/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0D0F',
          900: '#101214',
          800: '#191C20',
          700: '#202429',
          600: '#2A2F35',
          500: '#343A40',
        },
        line: '#343A40',
        paper: {
          DEFAULT: '#F5F5F2',
          muted: '#ECECE7',
          dark: '#E2E1DA',
        },
        steel: {
          200: '#E3E6E8',
          300: '#C9CED3',
          400: '#A7ADB4',
          500: '#7C838B',
          600: '#626970',
        },
        flame: {
          50: '#FFF6E5',
          100: '#FCE9BD',
          200: '#F8D487',
          300: '#F2BE55',
          400: '#EBAA32',
          500: '#D98B1E',
          600: '#B96D14',
          700: '#955112',
          800: '#713D16',
          900: '#4E2B14',
        },
        primary: {
          50: '#FFF6E5',
          100: '#FCE9BD',
          200: '#F8D487',
          300: '#F2BE55',
          400: '#EBAA32',
          500: '#D98B1E',
          600: '#B96D14',
          700: '#955112',
          800: '#713D16',
          900: '#4E2B14',
        },
        admin: {
          sidebar: '#11171D',
          sidebarHover: '#1D252D',
          bg: '#F2F4F5',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 30px 70px -35px rgba(11, 13, 15, 0.45)',
        flame: '0 18px 45px -18px rgba(217, 139, 30, 0.4)',
        'admin-card': '0 10px 32px -24px rgba(16, 24, 32, 0.35)',
        panel: '0 1px 2px rgba(11, 13, 15, 0.04), 0 18px 40px -32px rgba(11, 13, 15, 0.3)',
      },
      backgroundImage: {
        'grid-dark':
          'linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slowZoom: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fadeIn 0.5s ease-out both',
        'slow-zoom': 'slowZoom 18s ease-out both',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
