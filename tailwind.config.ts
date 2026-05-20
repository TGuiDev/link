import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-rounded)",
          "Nunito Sans",
          "Avenir Next Rounded",
          "Arial Rounded MT Bold",
          "ui-rounded",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        glow: "0 18px 80px rgba(34, 197, 94, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
