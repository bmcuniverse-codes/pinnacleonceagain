export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        ink: '#05050b',
        night: '#080816',
        midnight: '#0b0714',
        royal: '#7c3aed',
        neon: '#22d3ee',
        gold: '#f8c34a',
        champagne: '#fff1a8',
        danger: '#fb7185',
        success: '#22c55e',
      },
      boxShadow: {
        glow: '0 0 40px rgba(248,195,74,.2)',
        royal: '0 0 55px rgba(124,58,237,.22)',
        soft: '0 24px 80px rgba(0,0,0,.35)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}