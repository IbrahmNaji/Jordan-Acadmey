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
          DEFAULT: 'rgb(var(--surface-page) / <alpha-value>)',
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
          50: 'rgb(var(--brand-green-50) / <alpha-value>)',
          100: 'rgb(var(--brand-green-100) / <alpha-value>)',
          200: 'rgb(var(--brand-green-200) / <alpha-value>)',
          300: 'rgb(var(--brand-green-300) / <alpha-value>)',
          400: 'rgb(var(--brand-green-400) / <alpha-value>)',
          500: 'rgb(var(--brand-green-500) / <alpha-value>)',
          600: 'rgb(var(--brand-green-600) / <alpha-value>)',
          700: 'rgb(var(--brand-green-700) / <alpha-value>)',
          800: 'rgb(var(--brand-green-800) / <alpha-value>)',
          900: 'rgb(var(--brand-green-900) / <alpha-value>)',
        },
        primary: {
          50: 'rgb(var(--brand-green-50) / <alpha-value>)',
          100: 'rgb(var(--brand-green-100) / <alpha-value>)',
          200: 'rgb(var(--brand-green-200) / <alpha-value>)',
          300: 'rgb(var(--brand-green-300) / <alpha-value>)',
          400: 'rgb(var(--brand-green-400) / <alpha-value>)',
          500: 'rgb(var(--brand-green-500) / <alpha-value>)',
          600: 'rgb(var(--brand-green-600) / <alpha-value>)',
          700: 'rgb(var(--brand-green-700) / <alpha-value>)',
          800: 'rgb(var(--brand-green-800) / <alpha-value>)',
          900: 'rgb(var(--brand-green-900) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand-primary) / <alpha-value>)',
          primary: 'rgb(var(--brand-primary) / <alpha-value>)',
          deep: 'rgb(var(--brand-primary-deep) / <alpha-value>)',
          dark: 'rgb(var(--brand-primary-dark) / <alpha-value>)',
          soft: 'rgb(var(--brand-green-50) / <alpha-value>)',
        },
        surface: {
          page: 'rgb(var(--surface-page) / <alpha-value>)',
          card: 'rgb(var(--surface-card) / <alpha-value>)',
        },
        admin: {
          sidebar: 'rgb(var(--brand-sidebar) / <alpha-value>)',
          sidebarHover: 'rgb(var(--brand-sidebar-hover) / <alpha-value>)',
          bg: 'rgb(var(--surface-page) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 30px 70px -35px rgba(11, 13, 15, 0.45)',
        flame: '0 18px 45px -18px rgb(var(--brand-primary) / 0.28)',
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
