import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1f2933',
        paper: '#f6f8f5',
        moss: '#4f6f52',
        rust: '#a75d3a',
        line: '#d1ddd5',
      },
      boxShadow: {
        panel: '0 18px 40px rgba(31, 41, 51, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
