/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./docs/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#000000',
          dark: '#1a1a1a',
          magenta: '#ff00ff',
          green: '#00ff00',
          cyan: '#00ffff',
          white: '#ffffff',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        mono: ['"Courier New"', 'monospace'],
        'pixel-ja': ['PixelMplus12', 'monospace'],
        'noto-sc': ['NotoSansSC', 'sans-serif'],
      },
      boxShadow: {
        'glow-magenta': '0 0 10px #ff00ff, inset 0 0 10px #ff00ff',
        'glow-green': '0 0 10px #00ff00, inset 0 0 10px #00ff00',
        'glow-cyan': '0 0 10px #00ffff, inset 0 0 10px #00ffff',
        'glow-magenta-lg': '0 0 20px #ff00ff, inset 0 0 20px #ff00ff',
        'glow-green-lg': '0 0 20px #00ff00, inset 0 0 20px #00ff00',
        'glow-cyan-lg': '0 0 20px #00ffff, inset 0 0 20px #00ffff',
      },
      textShadow: {
        'glow-magenta': '0 0 15px #ff00ff',
        'glow-green': '0 0 15px #00ff00',
        'glow-cyan': '0 0 15px #00ffff',
      },
      animation: {
        'glitch': 'glitch 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'scanline': 'scanline 8s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': {
            transform: 'translate(0)',
            opacity: '1',
          },
          '20%': {
            transform: 'translate(-2px, 2px)',
            opacity: '0.8',
          },
          '40%': {
            transform: 'translate(-2px, -2px)',
            opacity: '0.9',
          },
          '60%': {
            transform: 'translate(2px, 2px)',
            opacity: '0.8',
          },
          '80%': {
            transform: 'translate(2px, -2px)',
            opacity: '0.9',
          },
        },
        scanline: {
          '0%': {
            transform: 'translateY(-100%)',
          },
          '100%': {
            transform: 'translateY(100%)',
          },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-glow-magenta': {
          textShadow: '0 0 15px #ff00ff',
        },
        '.text-shadow-glow-green': {
          textShadow: '0 0 15px #00ff00',
        },
        '.text-shadow-glow-cyan': {
          textShadow: '0 0 15px #00ffff',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
