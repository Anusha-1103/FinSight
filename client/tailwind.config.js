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
        // Redefine slate to exact Premium Editorial theme hierarchy
        slate: {
          950: '#FAF8F5', // Background: Warm Ivory
          900: '#F3F0E9', // Secondary: Soft Stone
          850: '#FAF8F5',
          800: '#E7E3DB', // Borders: Luxury Warm Gray
          700: '#A8A29E', // Disabled: Light Grey
          600: '#A8A29E', // Disabled: Light Grey
          500: '#78716C', // Muted Text: Muted Brown
          400: '#78716C', // Muted Text: Muted Brown
          300: '#44403C', // Body: Medium Brown
          200: '#292524', // H2: Dark Brown
          100: '#1C1917', // H1: Almost Black
          50: '#0F0E0D',
        },
        // Redefine indigo to match editorial accents
        indigo: {
          950: '#FAF8F5',
          900: '#F3F0E9',
          800: '#1C1917',
          700: '#1C1917',
          600: '#1C1917', // Primary buttons: Almost Black
          500: '#8F9779', // Sage Green primary brand
          400: '#8F9779', // Sage Green
          300: '#A3AB8C',
          200: '#E7E3DB',
          100: '#F3F0E9',
          50: '#FAF8F5',
        },
        // Redefine emerald to Success
        emerald: {
          600: '#2E7D32', // Premium success green
          500: '#2E7D32',
          400: '#4CAF50',
          100: '#E8F5E9',
          50: '#F1F8F5',
        },
        // Redefine amber to Gold Accent
        amber: {
          600: '#9C7A46',
          500: '#B08D57', // Gold Accent
          400: '#C5A370',
          100: '#F9F6F0',
          50: '#FAF8F5',
        },
        // Redefine rose to Danger
        rose: {
          600: '#B54C3A',
          500: '#C65D4A', // Danger: Terracotta/Red
          400: '#D57C6C',
          100: '#FDF6F5',
          50: '#FAF8F5',
        },
        // Redefine blue to Dusty Blue / Sage
        blue: {
          600: '#758066',
          500: '#8F9779', // Sage Accent
          400: '#A3AB8C',
          100: '#F3F0E9',
          50: '#FAF8F5',
        },
        // Redefine purple to Muted Lavender
        purple: {
          600: '#7F729E',
          500: '#9588B8',
          400: '#B2A7D4',
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
          light: '#C5A370',
          DEFAULT: '#B08D57',
          dark: '#9C7A46',
        },
        terracotta: {
          light: '#D57C6C',
          DEFAULT: '#C65D4A',
          dark: '#B54C3A',
        },
        brand: {
          50: '#FAF8F5',
          100: '#F3F0E9',
          200: '#E7E3DB',
          300: '#D0CAAC',
          400: '#B4AC81',
          500: '#8F9779',
          600: '#747C5E',
          700: '#5A6248',
          800: '#434A34',
          900: '#2F3422',
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
