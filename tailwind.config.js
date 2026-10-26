/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Short landscape screens (laptops at ~560-720px tall): tighten vertical rhythm
      screens: {
        short: { raw: "(min-width: 768px) and (max-height: 720px)" },
      },
      // Palette taken from the beauty Warehouse Sale artwork
      colors: {
        brand: {
          50: "#FFF0F7",
          100: "#FFE1EF",
          200: "#FFC4E0",
          300: "#FF94C6",
          400: "#F95BA9",
          500: "#F0248F",
          600: "#D6157B",
          700: "#B00F64",
          800: "#8C0F52",
        },
        blush: {
          50: "#FFF7FB",
          100: "#FFEEF6",
          200: "#FFDCEC",
        },
        ink: {
          950: "#1C1016",
          900: "#2A1520",
          700: "#4A3540",
          500: "#7D6672",
          300: "#BFAEB7",
          100: "#F1E6EB",
        },
        sun: "#FCE400",
      },
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(140 15 82 / 0.06), 0 12px 32px -12px rgb(140 15 82 / 0.22)",
        lift: "0 2px 4px rgb(140 15 82 / 0.08), 0 28px 56px -20px rgb(140 15 82 / 0.38)",
        button: "0 1px 2px rgb(140 15 82 / 0.25), 0 8px 20px -8px rgb(240 36 143 / 0.6)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.2, 0, 0, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translate(var(--tx, 0), 0) rotate(var(--r, 0deg))" },
          "50%": { transform: "translate(var(--tx, 0), -10px) rotate(var(--r, 0deg))" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "40%": { opacity: "1", transform: "scale(1.06)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        flash: {
          from: { opacity: "0.9" },
          to: { opacity: "0" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "badge-in": {
          from: { opacity: "0", transform: "scale(0.25)", filter: "blur(4px)" },
          to: { opacity: "1", transform: "scale(1)", filter: "blur(0px)" },
        },
        sticker: {
          "0%, 100%": { transform: "translate(0, 0) rotate(-6deg)", opacity: "0.9" },
          "50%": { transform: "translate(6px, -12px) rotate(7deg)", opacity: "1" },
        },
      },
      animation: {
        rise: "rise 640ms cubic-bezier(0.16, 1, 0.3, 1) both",
        float: "float 7s ease-in-out infinite",
        pop: "pop 640ms cubic-bezier(0.2, 0, 0, 1) both",
        flash: "flash 420ms ease-out both",
        shimmer: "shimmer 1.8s linear infinite",
        "badge-in": "badge-in 240ms cubic-bezier(0.2, 0, 0, 1) both",
        sticker: "sticker 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
