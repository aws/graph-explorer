import type { ProcessedTheme } from "@/core/ThemeProvider/types";

const spacing = (scale: number) => `${scale * 4}px`;

const grey = {
  100: "rgb(var(--color-gray-100))",
  200: "rgb(var(--color-gray-200))",
  300: "rgb(var(--color-gray-300))",
  400: "rgb(var(--color-gray-400))",
  500: "rgb(var(--color-gray-500))",
  600: "rgb(var(--color-gray-600))",
  700: "rgb(var(--color-gray-700))",
  800: "rgb(var(--color-gray-800))",
  900: "rgb(var(--color-gray-900))",
};

const palette: DeepRequired<ProcessedTheme["palette"]> = {
  common: {
    white: "rgb(var(--color-white))",
    black: "rgb(var(--color-black))",
  },
  primary: {
    light: "hsl(var(--color-brand-300))",
    main: "hsl(var(--color-brand-500))",
    dark: "hsl(var(--color-brand-800))",
    contrastText: "#ffffff",
  },
  secondary: {
    light: "rgb(var(--color-secondary-light))",
    main: "rgb(var(--color-secondary-main))",
    dark: "rgb(var(--color-secondary-dark))",
    contrastText: "#ffffff",
  },
  info: {
    light: "rgb(var(--color-info-light))",
    main: "rgb(var(--color-info-main))",
    dark: "rgb(var(--color-info-dark))",
    contrastText: "#ffffff",
  },
  error: {
    light: "rgb(var(--color-error-light))",
    main: "rgb(var(--color-error-main))",
    dark: "rgb(var(--color-error-dark))",
    contrastText: "#ffffff",
  },
  success: {
    light: "rgb(var(--color-success-light))",
    main: "rgb(var(--color-success-main))",
    dark: "rgb(var(--color-success-dark))",
    contrastText: "#ffffff",
  },
  warning: {
    light: "rgb(var(--color-warning-light))",
    main: "rgb(var(--color-warning-main))",
    dark: "rgb(var(--color-warning-dark))",
    contrastText: "#ffffff",
  },
  text: {
    primary: "rgb(var(--color-text-primary))",
    secondary: "rgb(var(--color-text-secondary))",
    disabled: "rgb(var(--color-text-disabled))",
  },
  divider: grey["200"],
  border: grey["200"],
  background: {
    default: "rgb(var(--color-background-default))",
    secondary: "rgb(var(--color-background-secondary))",
    contrast: "rgb(var(--color-background-contrast))",
    contrastSecondary: "rgb(var(--color-background-contrast-secondary))",
  },
  grey,
};

const LIGHT_THEME: ProcessedTheme = {
  name: "DEFAULT",
  mode: "light",
  spacing: {
    base: spacing(1),
    "2x": spacing(2),
    "3x": spacing(3),
    "4x": spacing(4),
    "5x": spacing(5),
    "6x": spacing(6),
  },
  palette,
  zIndex: {
    appBar: 1000,
    panes: 1100,
    modal: 1200,
    popover: 1300,
    menu: 1400,
    tooltip: 1500,
  },
  typography: {
    fontSize: "14px",
    fontFamily: `"Nunito Sans", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans",
    "Helvetica Neue", sans-serif`,
    sizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
    },
    weight: {
      light: 400,
      base: 500,
      bold: 600,
      extraBold: 700,
    },
  },
  shape: {
    borderRadius: "5px",
  },
};

export default LIGHT_THEME;
