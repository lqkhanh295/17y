/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        csg: {
          // Brand palette
          ink: '#111111',
          black: '#111111',
          yellow: '#F5C400',
          'yellow-light': '#F8D879',
          'yellow-dark': '#D9A722',
          paper: '#F4F0E6',
          red: '#D94C2B',
          'red-light': '#E66547',
          white: '#FFFFFF',
          muted: '#DCD5C4',
          surface: '#EAE4D6',
          
          // Functional
          success: '#3D6B45',
          warning: '#D99B26',
          error: '#B7352A',
          info: '#315D91',

          // Admin dark workspace
          'admin-bg': '#111111',
          'admin-sidebar': '#181818',
          'admin-surface': '#222222',
          'admin-surface-2': '#292929',
          'admin-border': '#383838',
          'admin-muted': '#A8A8A8',
        }
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Space Grotesk"', '"Be Vietnam Pro"', 'sans-serif'],
        handwriting: ['"Caveat"', 'cursive'],
        editorial: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
      boxShadow: {
        'poster': '4px 4px 0px #111111',
        'poster-sm': '2px 2px 0px #111111',
        'poster-lg': '6px 6px 0px #111111',
        'paper-sm': '0 1px 3px rgba(17, 17, 17, 0.08), 0 1px 2px rgba(17, 17, 17, 0.05)',
        'paper-md': '0 4px 12px -2px rgba(17, 17, 17, 0.12), 0 2px 6px -1px rgba(17, 17, 17, 0.08)',
        'paper-lg': '0 12px 32px -4px rgba(17, 17, 17, 0.16), 0 4px 12px -2px rgba(17, 17, 17, 0.10)',
        'polaroid': '0 8px 24px -4px rgba(17, 17, 17, 0.15), 0 2px 6px -1px rgba(17, 17, 17, 0.08)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      animation: {
        'paper-unfold': 'paperUnfold 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'stamp-in': 'stampIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'float-gentle': 'floatGentle 4s ease-in-out infinite',
      },
      keyframes: {
        paperUnfold: {
          '0%': { transform: 'scaleY(0.85) translateY(12px)', opacity: '0' },
          '100%': { transform: 'scaleY(1) translateY(0)', opacity: '1' },
        },
        stampIn: {
          '0%': { transform: 'scale(1.4) rotate(-8deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(-3deg)', opacity: '1' },
        },
        floatGentle: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
