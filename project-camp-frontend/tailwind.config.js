/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        camp: {
          bg: '#e8e4dc',
          card: '#ffffff',
          green: {
            DEFAULT: '#1f5f45',
            light: '#2d7a5a',
            pale: '#d4edda',
            muted: '#a8d5b5',
          },
          text: {
            primary: '#1a1a1a',
            secondary: '#6b7280',
            muted: '#9ca3af',
          },
          accent: {
            orange: '#c97316',
            red: '#dc2626',
            blue: '#2563eb',
          }
        }
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.1)',
        'green': '0 4px 20px rgba(31,95,69,0.2)',
      }
    }
  },
  plugins: []
}
