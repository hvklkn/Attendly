import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./config/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        subtle: "0 10px 30px -18px rgb(15 23 42 / 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
