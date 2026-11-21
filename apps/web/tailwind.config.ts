import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5A4FE3",
          dark: "#4338CA",
          light: "#EEF2FF",
        },
      },
    },
  },
  plugins: [],
};
export default config;
