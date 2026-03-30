import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#5B6FE5",
          light: "#7B8FFF",
        },
        success: "#10B981",
        error: "#EF4444",
        text: {
          primary: "#1F2937",
          secondary: "#6B7280",
        },
        border: "#E5E7EB",
        card: "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.75rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 8px -2px rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
