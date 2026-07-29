import type { Config } from "tailwindcss";

// Academy Report — Dark Blue theme.
// Page surfaces (backgrounds + borders) are navy; the gold / green / red
// accents and typography are unchanged from the original design.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0A1729",
          card: "#14243F",
          "card-hover": "#1C2E4A",
        },
        border: {
          DEFAULT: "#2A3E5C",
          hover: "#3E5580",
        },
        accent: {
          gold: "#F2A93B",
          green: "#4DA3FF", // "green" token repurposed as blue to match the navy theme
          red: "#D65A4E",
        },
        text: {
          primary: "#EEF1EC",
          secondary: "#B9C6BE",
          muted: "#8FA396",
          note: "#D8E0DA",
        },
      },
      fontFamily: {
        heading: ['"Barlow Condensed"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
} satisfies Config;
