/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        macos: {
          // Window & Panel Surfaces
          base: "#F5F5F7", // Main window background
          secondary: "#FFFFFF", // Sidebar / list background
          tertiary: "#F2F2F7", // Cards / active elements
          popover: "#FFFFFF", // Dropdowns / tooltips

          // Semantic Accents
          blue: "#007AFF",
          green: "#34C759",
          red: "#FF3B30",
          yellow: "#FFCC00",
          orange: "#FF9500",

          // Traffic Lights
          close: "#FF5F57",
          minimize: "#FEBC2E",
          zoom: "#28C840",
        },
      },

      textColor: {
        macos: {
          primary: "#1D1D1F",
          secondary: "rgba(60, 60, 67, 0.75)",
          tertiary: "rgba(60, 60, 67, 0.45)",
        },
      },

      borderColor: {
        macos: {
          separator: "rgba(60, 60, 67, 0.18)",
        },
      },
    },
  },
  plugins: [],
};
