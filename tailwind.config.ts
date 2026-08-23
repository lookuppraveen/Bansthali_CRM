import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        divider: "var(--color-divider)",
        accent: {
          DEFAULT: "var(--color-accent)",
          100: "var(--color-accent-100)",
          200: "var(--color-accent-200)",
          300: "var(--color-accent-300)",
          400: "var(--color-accent-400)",
          500: "var(--color-accent-500)",
          600: "var(--color-accent-600)",
          700: "var(--color-accent-700)",
          800: "var(--color-accent-800)",
          900: "var(--color-accent-900)",
        },
        neutral: {
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
        },
        maroon: {
          DEFAULT: "#7b1e28",
          light: "#9a3341",
        },
        ink: {
          bg: "#231a17",
          soft: "#3a2b23",
          border: "#5a463a",
          text: "#f3ede3",
          mute: "#b9a98f",
          dim: "#8f8069",
          faint: "#c9bfae",
        },
        danger: "#b4442e",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Cormorant Garamond", "Georgia", "serif"],
        body: ["var(--font-body)", "Lora", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "4px",
        lg: "8px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(32,31,29,0.05)",
        md: "0 2px 6px rgba(32,31,29,0.06)",
        lg: "0 6px 14px rgba(32,31,29,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
