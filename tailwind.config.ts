import type { Config } from "tailwindcss";

// Brand tokens mirror the OPOS desktop app (lib/src/core/theme/app_theme.dart):
// teal primary #05696B + amber accent #F9B233. Keep the web store visually
// consistent with the desktop product.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#e6f2f2",
          100: "#c2dedf",
          500: "#05696B",
          600: "#045557",
          700: "#034041",
        },
        amber: {
          400: "#FBC15A",
          500: "#F9B233",
          600: "#E09820",
        },
        ink: "#0f2a2b",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,42,43,0.04), 0 4px 16px rgba(16,42,43,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
