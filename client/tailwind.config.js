/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Redefine slate to Warm Ivory and Stone editorial shades
        slate: {
          950: '#FAF8F5', // Warm Ivory background
          900: '#F3F0E9', // Soft Stone secondary
          850: '#FAF8F5',
          800: '#E7E5E4', // stone-200 border
          700: '#D6D3D1', // stone-300
          600: '#A8A29E', // stone-400
          500: '#78716C', // stone-500 secondary text
          400: '#78716C', // stone-500 muted text
          300: '#57534E', // stone-600
          200: '#292524', // stone-800
          100: '#1C1917', // stone-900 (Almost Black)
          50: '#0F0E0D',
        },
        // Redefine indigo to luxury almost-black / sage accents
        indigo: {
          950: '#FAF8F5',
          900: '#F3F0E9',
          800: '#292524',
          700: '#1C1917',
          600: '#1C1917', // primary button Almost Black
          500: '#8F9779', // Sage Green primary brand
          400: '#8F9779', // Sage Green primary brand
          300: '#A3AB8C',
          200: '#E7E3D7',
          100: '#F3F0E9',
          50: '#FAF8F5',
        },
        // Redefine emerald to Sage Green
        emerald: {
          600: '#747C5E',
          500: '#8F9779',
          400: '#A3AB8C',
          100: '#F3F0E9',
          50: '#FAF8F5',
        },
        // Redefine amber to Soft Gold
        amber: {
          600: '#A88626',
          500: '#D4AF37',
          400: '#DFC260',
          100: '#F3F0E9',
          50: '#FAF8F5',
        },
        // Redefine rose to Warm Terracotta
        rose: {
          600: '#A15D39',
          500: '#C87A53',
          400: '#D59473',
          100: '#F3F0E9',
          50: '#FAF8F5',
        },
        // Redefine blue to Dusty Blue
        blue: {
          600: '#5A8289',
          500: '#7DA2A9',
          400: '#97B8BE',
          100: '#F3F0E9',
          50: '#FAF8F5',
        },
        // Redefine purple to Muted Lavender
        purple: {
          600: '#8561EB',
          500: '#A78BFA',
          400: '#BCA6FC',
          100: '#F3F0E9',
          50: '#FAF8F5',
        },
        // Core background tokens
        ivory: '#FAF8F5',
        stonebg: '#F3F0E9',
        sage: {
          light: '#A3AB8C',
          DEFAULT: '#8F9779',
          dark: '#747C5E',
        },
        gold: {
          light: '#DFC260',
          DEFAULT: '#D4AF37',
          dark: '#A88626',
        },
        terracotta: {
          light: '#D59473',
          DEFAULT: '#C87A53',
          dark: '#A15D39',
        },
        lavender: {
          light: '#BCA6FC',
          DEFAULT: '#A78BFA',
          dark: '#8561EB',
        },
        dustyblue: {
          light: '#97B8BE',
          DEFAULT: '#7DA2A9',
          dark: '#5A8289',
        },
        brand: {
          50: '#FAF8F5',
          100: '#F3F0E9',
          200: '#E7E3D7',
          300: '#D0CAAC',
          400: '#B4AC81',
          500: '#8F9779',
          600: '#747C5E',
          700: '#5A6248',
          800: '#434A34',
          900: '#2F3422',
        },
        emeraldCustom: {
          400: '#A3AB8C',
          500: '#8F9779',
          600: '#747C5E',
        },
        amberCustom: {
          400: '#DFC260',
          500: '#D4AF37',
        },
        roseCustom: {
          400: '#D59473',
          500: '#C87A53',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
