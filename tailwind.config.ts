import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        diu: {
          green: '#16a34a',
          'green-dark': '#15803d',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          "'Segoe UI'",
          'Roboto',
          "'Helvetica Neue'",
          'Arial',
          'sans-serif',
        ],
      },
      minWidth: {
        tap: '44px',
      },
      minHeight: {
        tap: '44px',
      },
    },
  },
  plugins: [],
} satisfies Config;
