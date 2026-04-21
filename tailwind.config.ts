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
        // Unified LMS palette: academic navy + teal + parchment
        brand: {
          50: "#EEF7F6",
          100: "#D7EFEC",
          200: "#B0DFD8",
          300: "#7DC9BF",
          400: "#4AAFA4",
          500: "#238F86",
          600: "#19766E",
          700: "#155F59",
          800: "#154D49",
          900: "#153F3D",
        },
        accent: {
          50: "#FBF8EE",
          100: "#F6EFD8",
          200: "#ECDEAE",
          300: "#E0C777",
          400: "#D5AE4D",
          500: "#C7932B",
          600: "#A77621",
          700: "#875B1E",
          800: "#704A20",
          900: "#5F3F1F",
        },
        ink: {
          50: "#F4F6F9",
          100: "#E8ECF2",
          200: "#CFD7E2",
          300: "#AEBBCC",
          400: "#7E8EA6",
          500: "#5D6C84",
          600: "#455269",
          700: "#334055",
          800: "#1F2A3D",
          900: "#111827",
        },
        paper: {
          50: "#FFFEFB",
          100: "#F7F3EA",
          200: "#EEE7D8",
          300: "#E2D8C3",
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
          50: "#EEF7F6",
          100: "#D7EFEC",
          200: "#B0DFD8",
          300: "#7DC9BF",
          400: "#4AAFA4",
          500: "#238F86",
          600: "#19766E",
          700: "#155F59",
          800: "#154D49",
          900: "#153F3D",
        },
        secondary: {
          50: "#FBF8EE",
          100: "#F6EFD8",
          200: "#ECDEAE",
          300: "#E0C777",
          400: "#D5AE4D",
          500: "#C7932B",
          600: "#A77621",
          700: "#875B1E",
          800: "#704A20",
          900: "#5F3F1F",
        },
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        DEFAULT: "16px",
        sm: "10px",
        lg: "20px",
        xl: "28px",
        "2xl": "36px",
        "3xl": "44px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(45, 45, 43, 0.04), 0 4px 24px rgba(45, 45, 43, 0.06)",
        hover: "0 8px 30px rgba(45, 45, 43, 0.08), 0 2px 8px rgba(45, 45, 43, 0.04)",
        lift: "0 12px 40px rgba(45, 45, 43, 0.12), 0 4px 12px rgba(45, 45, 43, 0.06)",
        inner: "inset 0 2px 4px rgba(45, 45, 43, 0.04)",
        panel: "0 18px 50px rgba(45, 45, 43, 0.08), 0 6px 18px rgba(45, 45, 43, 0.05)",
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
