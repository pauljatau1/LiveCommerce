/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        LexendDeca: ["LexendDeca", "sans-serif"],
        LexendDecaBold: ["LexendDeca-Bold", "sans-serif"],
        LexendDecaExtraBold: ["LexendDeca-ExtraBold", "sans-serif"],
        LexendDecaExtraLight: ["LexendDeca-ExtraLight", "sans-serif"],
        LexendDecaLight: ["LexendDeca-Light", "sans-serif"],
        LexendDecaMedium: ["LexendDeca-Medium", "sans-serif"],
        LexendDecaSemiBold: ["LexendDeca-SemiBold", "sans-serif"],
        LexendDecaBlack: ["LexendDeca-Black", "sans-serif"],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "4rem",
          xl: "5rem",
          "2xl": "6rem",
        },
      },
      colors: {
        primary: {
          100: "#00A353",
          200: "#16783A",
        },
        black: {
          DEFAULT: "#000",
          100: "#121212",
        },
        gray: {
          100: "#F2F2F2",
          200: "#CCCCCC",
        },
      },
    },
  },
  plugins: [],
};
