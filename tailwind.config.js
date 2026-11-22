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
          // Brand Tactile Editorial Palette (DESIGN.md strict specification)
          yellow: '#F4C542',       // Primary accent / Cóc Yellow
          'yellow-light': '#F8D56A',
          'yellow-dark': '#E0B025',
          ink: '#20231F',          // Foreground / Ink Black (13.5:1 contrast)
          black: '#20231F',        // Alias for ink
          paper: '#F4EEDF',        // Background / Paper Cream
          red: '#B94D35',          // Secondary accent / Brick Red
          'red-light': '#D05A40',
          muted: '#DCD5C4',        // Muted Stone dividers and borders
          surface: '#EAE4D6',      // Warm Parchment cards and surfaces
          white: '#FFFFFF',

          // Functional system feedback
          success: '#3D6B45',
          warning: '#D99B26',
          error: '#B7352A',
          info: '#315D91',

          // Admin operational workspace
          'admin-bg': '#111111',
          'admin-sidebar': '#181818',
          'admin-surface': '#222222',
          'admin-surface-2': '#292929',
          'admin-border': '#383838',
          'admin-muted': '#A8A8A8',
        }
      },
      fontFamily: {
        // Vietnamese-optimized typography system
        sans: ['"Be Vietnam Pro"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Be Vietnam Pro"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        body: ['"Be Vietnam Pro"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', '"Lora"', 'Georgia', 'serif'],
        editorial: ['"Playfair Display"', '"Lora"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        handwriting: ['"Patrick Hand"', '"Dancing Script"', 'cursive'],
      },
      boxShadow: {
        'poster': '4px 4px 0px #20231F',
        'poster-sm': '2px 2px 0px #20231F',
        'poster-lg': '6px 6px 0px #20231F',
        'paper-sm': '0 1px 3px rgba(32, 35, 31, 0.08), 0 1px 2px rgba(32, 35, 31, 0.05)',
        'paper-md': '0 4px 12px -2px rgba(32, 35, 31, 0.12), 0 2px 6px -1px rgba(32, 35, 31, 0.08)',
        'paper-lg': '0 12px 32px -4px rgba(32, 35, 31, 0.16), 0 4px 12px -2px rgba(32, 35, 31, 0.10)',
        'polaroid': '0 8px 24px -4px rgba(32, 35, 31, 0.15), 0 2px 6px -1px rgba(32, 35, 31, 0.08)',
      },
      borderRadius: {
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
        'xl': '12px',
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
          '0%': { transform: 'scale(1.3) rotate(-8deg)', opacity: '0' },
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
