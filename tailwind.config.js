/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./index.{js,ts}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary green from the app
        primary: {
          DEFAULT: "#90D4A3",
          dark: "#2E7D32",
        },
        // Action colors
        danger: "#FF3B30",
        warning: "#FF9500",
        // Neutral colors
        border: "#e0e0e0",
        "border-dark": "#ccc",
        "bg-muted": "#f5f5f5",
        "bg-input": "#fafafa",
      },
    },
  },
  plugins: [],
};

