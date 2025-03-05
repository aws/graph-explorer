import { type Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import tailwindAnimate from "tailwindcss-animate";
import tailwindContainerQueries from "@tailwindcss/container-queries";

const black = "rgb(var(--color-black) / <alpha-value>)";
const white = "rgb(var(--color-white) / <alpha-value>)";

const blue = {
  50: "hsl(var(--color-brand-50) / <alpha-value>)",
  100: "hsl(var(--color-brand-100) / <alpha-value>)",
  200: "hsl(var(--color-brand-200) / <alpha-value>)",
  300: "hsl(var(--color-brand-300) / <alpha-value>)",
  400: "hsl(var(--color-brand-400) / <alpha-value>)",
  500: "hsl(var(--color-brand-500) / <alpha-value>)",
  600: "hsl(var(--color-brand-600) / <alpha-value>)",
  700: "hsl(var(--color-brand-700) / <alpha-value>)",
  800: "hsl(var(--color-brand-800) / <alpha-value>)",
  900: "hsl(var(--color-brand-900) / <alpha-value>)",
  950: "hsl(var(--color-brand-950) / <alpha-value>)",
};

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black,
      white,
      gray: colors.neutral,
      brand: blue,
      input: {
        background: "rgb(var(--color-input-background) / <alpha-value>)",
        hover: "rgb(var(--color-input-hover) / <alpha-value>)",
      },
      primary: {
        light: "hsl(var(--color-primary-light) / <alpha-value>)",
        main: "hsl(var(--color-primary-main) / <alpha-value>)",
        dark: "hsl(var(--color-primary-dark) / <alpha-value>)",
        contrastText: white,
      },
      secondary: {
        light: "rgb(var(--color-secondary-light) / <alpha-value>)",
        main: "rgb(var(--color-secondary-main) / <alpha-value>)",
        dark: "rgb(var(--color-secondary-dark) / <alpha-value>)",
        contrastText: white,
      },
      info: {
        light: "rgb(var(--color-info-light) / <alpha-value>)",
        main: "rgb(var(--color-info-main) / <alpha-value>)",
        dark: "rgb(var(--color-info-dark) / <alpha-value>)",
        contrastText: white,
      },
      error: {
        light: "rgb(var(--color-error-light) / <alpha-value>)",
        main: "rgb(var(--color-error-main) / <alpha-value>)",
        dark: "rgb(var(--color-error-dark) / <alpha-value>)",
        contrastText: white,
      },
      success: {
        light: "rgb(var(--color-success-light) / <alpha-value>)",
        main: "rgb(var(--color-success-main) / <alpha-value>)",
        dark: "rgb(var(--color-success-dark) / <alpha-value>)",
        contrastText: white,
      },
      warning: {
        light: "rgb(var(--color-warning-light) / <alpha-value>)",
        main: "rgb(var(--color-warning-main) / <alpha-value>)",
        dark: "rgb(var(--color-warning-dark) / <alpha-value>)",
        contrastText: white,
      },
      background: {
        default: "rgb(var(--color-background-default) / <alpha-value>)",
        secondary: "rgb(var(--color-background-secondary) / <alpha-value>)",
        contrast: "rgb(var(--color-background-contrast) / <alpha-value>)",
        "contrast-secondary":
          "rgb(var(--color-background-contrast-secondary) / <alpha-value>)",
      },
      text: {
        primary: "rgb(var(--color-text-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        disabled: "rgb(var(--color-text-disabled) / <alpha-value>)",
      },
      divider: "rgb(var(--color-divider) / <alpha-value>)",
      border: "rgb(var(--color-border) / <alpha-value>)",
      // gray: colors.slate,
      // green: colors.emerald,
      // purple: colors.violet,
      // yellow: colors.amber,
      // pink: colors.fuchsia,
    },
    fontFamily: {
      sans: [
        "Nunito Sans",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Oxygen",
        "Ubuntu",
        "Cantarell",
        "Fira Sans",
        "Droid Sans",
        "Helvetica Neue",
        "sans-serif",
      ],
    },
    fontWeight: {
      light: "300",
      base: "400",
      medium: "500",
      bold: "600",
      extraBold: "700",
    },
    extend: {
      transitionProperty: {
        width: "width",
      },
      backgroundImage: {
        "logo-gradient":
          "linear-gradient(225deg, #4d72f2 12.15%, #3334b9 87.02%)",
      },
      borderColor: {
        DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
      },
      maxWidth: {
        paragraph: "40rem",
      },
      zIndex: {
        appBar: "1000",
        panes: "1100",
        modal: "1200",
        popover: "1300",
        menu: "1400",
        tooltip: "1500",
      },
    },
  },
  plugins: [tailwindAnimate, tailwindContainerQueries],
} satisfies Config;
