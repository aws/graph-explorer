import { type Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";
import tailwindAnimate from "tailwindcss-animate";
import tailwindContainerQueries from "@tailwindcss/container-queries";

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
      black: colors.black,
      white: colors.white,
      gray: colors.neutral,
      brand: blue,
      red: colors.red,
      input: {
        background: "rgb(var(--color-input-background) / <alpha-value>)",
      },
      primary: {
        light: "hsl(var(--color-primary-light) / <alpha-value>)",
        main: "hsl(var(--color-primary-main) / <alpha-value>)",
        dark: "hsl(var(--color-primary-dark) / <alpha-value>)",
        contrastText: colors.white,
      },
      secondary: {
        light: "rgb(var(--color-secondary-light) / <alpha-value>)",
        main: "rgb(var(--color-secondary-main) / <alpha-value>)",
        dark: "rgb(var(--color-secondary-dark) / <alpha-value>)",
        contrastText: colors.white,
      },
      info: {
        light: "rgb(var(--color-info-light) / <alpha-value>)",
        main: "rgb(var(--color-info-main) / <alpha-value>)",
        dark: "rgb(var(--color-info-dark) / <alpha-value>)",
        contrastText: colors.white,
      },
      error: {
        light: "rgb(var(--color-error-light) / <alpha-value>)",
        main: "rgb(var(--color-error-main) / <alpha-value>)",
        dark: "rgb(var(--color-error-dark) / <alpha-value>)",
        contrastText: colors.white,
      },
      success: {
        light: "rgb(var(--color-success-light) / <alpha-value>)",
        main: "rgb(var(--color-success-main) / <alpha-value>)",
        dark: "rgb(var(--color-success-dark) / <alpha-value>)",
        contrastText: colors.white,
      },
      warning: {
        light: "rgb(var(--color-warning-light) / <alpha-value>)",
        main: "rgb(var(--color-warning-main) / <alpha-value>)",
        dark: "rgb(var(--color-warning-dark) / <alpha-value>)",
        contrastText: colors.white,
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
      mono: defaultTheme.fontFamily.mono,
    },
    fontWeight: {
      light: "300",
      base: "400",
      medium: "500",
      bold: "600",
      extraBold: "700",
    },
    extend: {
      backgroundColor: {
        default: "rgb(var(--color-background-default) / <alpha-value>)",
        secondary: "rgb(var(--color-background-secondary) / <alpha-value>)",
        contrast: "rgb(var(--color-background-contrast) / <alpha-value>)",
        "contrast-secondary":
          "rgb(var(--color-background-contrast-secondary) / <alpha-value>)",
        brand: {
          DEFAULT: "hsl(var(--color-brand-500) / <alpha-value>)",
          hover: "hsl(var(--color-brand-600) / <alpha-value>)",
          subtle: "hsl(var(--color-brand-50) / <alpha-value>)",
          "subtle-hover": "hsl(var(--color-brand-100) / <alpha-value>)",
        },
        danger: {
          DEFAULT: colors.red[500],
          hover: colors.red[600],
          subtle: colors.red[50],
          "subtle-hover": colors.red[100],
        },
      },
      textColor: {
        // TODO: Need to rename primary-main, primary-light, etc. because this overwrites them.
        // primary: "rgb(var(--color-text-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        disabled: "rgb(var(--color-text-disabled) / <alpha-value>)",
        danger: colors.red[700],
        brand: "hsl(var(--color-brand-700) / <alpha-value>)",
      },
      aria: {
        invalid: 'invalid="true"',
      },
      data: {
        open: 'state="open"',
        closed: 'state="closed"',
      },
      transitionProperty: {
        width: "width",
      },
      backgroundImage: {
        "logo-gradient":
          "linear-gradient(225deg, #4d72f2 12.15%, #3334b9 87.02%)",
      },
      borderColor: {
        DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
        input: "rgb(var(--color-input-border) / <alpha-value>)",
      },
      maxWidth: {
        paragraph: "36rem",
      },
      zIndex: {
        appBar: "1000",
        panes: "1100",
        modal: "1200",
        popover: "1300",
        menu: "1400",
        tooltip: "1500",
      },
      keyframes: {
        expand: {
          from: {
            height: "0",
          },
          to: {
            height: "auto",
          },
        },
        collapse: {
          from: {
            height: "auto",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        expand: "expand 0.2s cubic-bezier(0.87, 0, 0.13, 1)",
        collapse: "collapse 0.2s cubic-bezier(0.87, 0, 0.13, 1)",
      },
    },
  },
  plugins: [
    tailwindAnimate,
    tailwindContainerQueries,
    plugin(({ addUtilities, matchUtilities, theme }) => {
      addUtilities({
        ".content-auto": {
          "content-visibility": "auto",
        },
        ".content-hidden": {
          "content-visibility": "hidden",
        },
        ".content-visible": {
          "content-visibility": "visible",
        },
      });
      matchUtilities(
        {
          "intrinsic-size": value => ({
            "contain-intrinsic-size": value,
          }),
        },
        { values: theme("spacing") }
      );
    }),
  ],
} satisfies Config;
