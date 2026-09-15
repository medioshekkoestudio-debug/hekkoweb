import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Hekko 2026 — mantener en sincronía con globals.css
        brand: {
          50: '#e8f4f6',
          100: '#c9e6ec',
          200: '#9acfda',
          300: '#5fb6c6',
          400: '#1a8196',
          500: '#0D667A',
          600: '#0a5264',
          700: '#083f4d',
          800: '#052d38',
          900: '#03212B',
          950: '#021820',
        },
        accent: '#F6A00C',
        turquoise: '#2BA1B7',
        'warm-gray': '#D8D4D3',
        ink: {
          50: '#f6f6f7',
          100: '#e2e2e6',
          200: '#c4c5cc',
          300: '#9fa0ab',
          400: '#7b7d8a',
          500: '#616370',
          600: '#4d4e59',
          700: '#3f4049',
          800: '#37383f',
          900: '#1b1c20',
          950: '#0e0e11',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
