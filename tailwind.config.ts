import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        md: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gaming: {
          bg: "#060A14",
          card: "#101827",
          "card-hover": "#111C2E",
          primary: "#2563EB",
          accent: "#38BDF8",
          cyan: "#22D3EE",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1.5rem",
        "2xl": "2rem",
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(37, 99, 235, 0.2)",
        "glow-md": "0 0 20px rgba(37, 99, 235, 0.35)",
        "glow-lg": "0 0 30px rgba(56, 189, 248, 0.3)",
        "glow-cyan": "0 0 15px rgba(34, 211, 238, 0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-subtle": "linear-gradient(to bottom, #101827, #060A14)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(37, 99, 235, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(56, 189, 248, 0.6)" },
        },
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        panImage: {
          "0%": { transform: "scale(1.15) translate(-2%, -1%) rotate(-0.5deg)" },
          "25%": { transform: "scale(1.17) translate(1%, 2%) rotate(0.5deg)" },
          "50%": { transform: "scale(1.14) translate(2%, -1%) rotate(-0.5deg)" },
          "75%": { transform: "scale(1.16) translate(-1%, 1%) rotate(0.5deg)" },
          "100%": { transform: "scale(1.15) translate(-2%, -1%) rotate(-0.5deg)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 6s ease-in-out infinite",
        "float-fast": "float 3s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s infinite",
        "pulse-glow-fast": "pulseGlow 1.5s infinite",
        "sweep": "sweep 4s linear infinite",
        "marquee": "marquee 25s linear infinite",
        "pan-image": "panImage 10s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
