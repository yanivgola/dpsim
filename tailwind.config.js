/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          '50': '#eff6ff',
          '100': '#dbeafe',
          '200': '#bfdbfe',
          '300': '#93c5fd',
          '400': '#60a5fa',
          '500': '#3b82f6',
          '600': '#2563eb',
          '700': '#1d4ed8',
          '800': '#1e40af',
          '900': '#1e3a8a',
          '950': '#172554',
        },
        neutral: {
          '50': '#f8fafc',
          '100': '#f1f5f9',
          '200': '#e2e8f0',
          '300': '#cbd5e1',
          '400': '#94a3b8',
          '500': '#64748b',
          '600': '#475569',
          '700': '#334155',
          '800': '#1e293b',
          '900': '#0f172a',
          '950': '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwindcss-themer')({
      defaultTheme: {
        extend: {
          colors: {
            primary: '#3b82f6',
            secondary: '#64748b',
            background: '#ffffff',
            text: '#0f172a',
            accent: '#10b981',
          },
        },
      },
      themes: [
        {
          name: 'futuristic',
          extend: {
            colors: {
              primary: '#0ea5e9',
              secondary: '#4f46e5',
              background: '#020617',
              text: '#e2e8f0',
              accent: '#f43f5e',
            },
          },
        },
        {
          name: 'minimalist',
          extend: {
            colors: {
              primary: '#1f2937',
              secondary: '#9ca3af',
              background: '#f9fafb',
              text: '#111827',
              accent: '#374151',
            },
          },
        },
      ],
    }),
  ],
}
