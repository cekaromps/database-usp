/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        macos: {
          // Window & Panel Surfaces
          'base': '#1E1E1E',       // Main window background
          'secondary': '#252525',  // Sidebar / list background
          'tertiary': '#2D2D2D',   // Active elements / cards
          'popover': '#323232',    // Dropdowns / tooltips
          
          // Semantic Accents
          'blue': '#0A84FF',
          'green': '#32D74B',
          'red': '#FF453A',
          'yellow': '#FFD60A',
          'orange': '#FF9F0A',

          // Traffic Lights
          'close': '#FF605C',
          'minimize': '#FFBD44',
          'zoom': '#00CA4E',
        },
      },
      textColor: {
        macos: {
          'primary': '#FFFFFF',
          'secondary': 'rgba(235, 235, 245, 0.60)',
          'tertiary': 'rgba(235, 235, 245, 0.30)',
        }
      },
      borderColor: {
        macos: {
          'separator': 'rgba(235, 235, 245, 0.18)',
        }
      }
    },
  },
  plugins: [],
}
