/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0f172a',
        panel:   '#1e293b',
        border:  '#334155',
        muted:   '#94a3b8',
        accent:  '#f97316',
      },
    },
  },
  plugins: [],
};
