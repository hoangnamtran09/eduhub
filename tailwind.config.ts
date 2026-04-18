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
        // Warm, sophisticated palette - NOT typical AI blue/purple
        brand: {
          50: "#FEF7F0",
          100: "#FDEEE0",
          200: "#FBDCC0",
          300: "#F7C496",
          400: "#F2A86B",
          500: "#E07A5F", // Primary - Terracotta
          600: "#C96A50",
          700: "#A85640",
          800: "#864434",
          900: "#6B372A",
        },
        accent: {
          50: "#F8F6F2",
          100: "#F0EDE6",
          200: "#E1DBCB",
          300: "#D0C6AA",
          400: "#BCAD86",
          500: "#A89363", // Warm gold accent
          600: "#96855A",
          700: "#7D6B4D",
          800: "#665743",
          900: "#53483B",
        },
        ink: {
          50: "#F7F7F5",
          100: "#EDEDEA",
          200: "#D6D4CF",
          300: "#B8B5AE",
          400: "#8E8A82",
          500: "#6B6861",
          600: "#56544F",
          700: "#474643",
          800: "#3D3C39",
          900: "#2D2D2B", // Rich dark for text
        },
        paper: {
          50: "#FFFFFF",
          100: "#FAF9F6",
          200: "#F5F3EE",
          300: "#EDEAE3",
        },
        success: {
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        warning: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
        error: {
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
        },
        // Legacy aliases for compatibility
        primary: {
          50: "#FEF7F0",
          100: "#FDEEE0",
          200: "#FBDCC0",
          300: "#F7C496",
          400: "#F2A86B",
          500: "#E07A5F",
          600: "#C96A50",
          700: "#A85640",
          800: "#864434",
          900: "#6B372A",
        },
        secondary: {
          50: "#F8F6F2",
          100: "#F0EDE6",
          200: "#E1DBCB",
          300: "#D0C6AA",
          400: "#BCAD86",
          500: "#A89363",
          600: "#96855A",
          700: "#7D6B4D",
          800: "#665743",
          900: "#53483B",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(45, 45, 43, 0.04), 0 4px 24px rgba(45, 45, 43, 0.06)",
        hover: "0 8px 30px rgba(45, 45, 43, 0.08), 0 2px 8px rgba(45, 45, 43, 0.04)",
        lift: "0 12px 40px rgba(45, 45, 43, 0.12), 0 4px 12px rgba(45, 45, 43, 0.06)",
        inner: "inset 0 2px 4px rgba(45, 45, 43, 0.04)",
      },
      animation: {
        "fade-in": "fadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slideUp 400ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-down": "slideDown 400ms cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scaleIn 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-out": "scaleOut 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-left": "slideLeft 400ms cubic-bezier(0.4, 0, 0.2, 1)",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(16px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        scaleOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        noise: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
