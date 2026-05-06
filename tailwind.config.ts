import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lirio: {
          primary: "#E5989B",
          aurora: "#FAD4D5",
          peach: "#F8C6C8",
          light: "#FFF1F2",
          text: "#4A3B3E",
          cream: "#F9F6F0",
          emerald: "#097969",
          amethyst: "#9966CC",
          gold: "#D4AF37",
          copper: "#B87333",
        },
        brand: {
          charcoal: '#1A1A1A',
          white: '#FFFFFF',
          rose: '#E5989B',
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", '"Cormorant Garamond"', "serif"],
        cursive: ["var(--font-alex-brush)", '"Alex Brush"', "cursive"],
        sans: ["var(--font-montserrat)", '"Montserrat"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
