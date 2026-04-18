import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effdf4",
          100: "#d7fae4",
          500: "#16a34a",
          600: "#12803b",
          700: "#0f6b32"
        }
      },
      boxShadow: {
        card: "0 12px 30px -18px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
