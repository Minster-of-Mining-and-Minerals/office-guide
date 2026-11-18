import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Admin panel day/night palette ("Petrol & Brass"). Values live in
        // globals.css as `R G B` channels so opacity modifiers work
        // (e.g. bg-admin-ok/15).
        admin: {
          bg: "rgb(var(--a-bg) / <alpha-value>)",
          surface: "rgb(var(--a-surface) / <alpha-value>)",
          surface2: "rgb(var(--a-surface2) / <alpha-value>)",
          raise: "rgb(var(--a-raise) / <alpha-value>)",
          chip: "rgb(var(--a-chip) / <alpha-value>)",
          input: "rgb(var(--a-input) / <alpha-value>)",
          border: "rgb(var(--a-border) / <alpha-value>)",
          "border-strong": "rgb(var(--a-border-strong) / <alpha-value>)",
          text: "rgb(var(--a-text) / <alpha-value>)",
          heading: "rgb(var(--a-heading) / <alpha-value>)",
          muted: "rgb(var(--a-muted) / <alpha-value>)",
          faint: "rgb(var(--a-faint) / <alpha-value>)",
          accent: "rgb(var(--a-accent) / <alpha-value>)",
          "accent-ink": "rgb(var(--a-accent-ink) / <alpha-value>)",
          "accent-text": "rgb(var(--a-accent-text) / <alpha-value>)",
          ok: "rgb(var(--a-ok) / <alpha-value>)",
          info: "rgb(var(--a-info) / <alpha-value>)",
          warn: "rgb(var(--a-warn) / <alpha-value>)",
          bad: "rgb(var(--a-bad) / <alpha-value>)",
          sidebar: "rgb(var(--a-sidebar) / <alpha-value>)",
          "sb-text": "rgb(var(--a-sb-text) / <alpha-value>)",
          "sb-muted": "rgb(var(--a-sb-muted) / <alpha-value>)",
          "sb-brand": "rgb(var(--a-sb-brand) / <alpha-value>)",
          "sb-active": "rgb(var(--a-sb-active) / <alpha-value>)",
          "sb-bar": "rgb(var(--a-sb-bar) / <alpha-value>)",
          active: "rgb(var(--a-active) / <alpha-value>)",
          "sb-border": "rgb(var(--a-sb-border) / <alpha-value>)",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        golden: {
          dark: "hsl(var(--golden-dark))",
          metallic: "hsl(var(--golden-metallic))",
          soft: "hsl(var(--golden-soft))",
          classic: "hsl(var(--golden-classic))",
          darkHover: "hsl(var(--golden-dark-hover))",
          darkLight: "hsl(var(--golden-dark-light))",
          dark10: "hsl(var(--golden-dark-10))",
          dark20: "hsl(var(--golden-dark-20))",
          dark30: "hsl(var(--golden-dark-30))",
          dark40: "hsl(var(--golden-dark-40))",
          dark50: "hsl(var(--golden-dark-50))",
          dark60: "hsl(var(--golden-dark-60))",
          dark70: "hsl(var(--golden-dark-70))",
          dark80: "hsl(var(--golden-dark-80))",
          dark90: "hsl(var(--golden-dark-90))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
