import type { ProcessedTheme } from "@/core/ThemeProvider/types";

const spacing = (scale: number) => `${scale * 4}px`;

const gray = {
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
    light: "hsl(var(--color-primary-light))",
    main: "hsl(var(--color-primary-main))",
    dark: "hsl(var(--color-primary-dark))",
    contrastText: "rgb(var(--color-white))",
  },
  text: {
    primary: "rgb(var(--color-text-primary))",
    secondary: "rgb(var(--color-text-secondary))",
    disabled: "rgb(var(--color-text-disabled))",
  },
  divider: "rgb(var(--color-divider))",
  border: "rgb(var(--color-border))",
  background: {
    default: "rgb(var(--color-background-default))",
    secondary: "rgb(var(--color-background-secondary))",
    contrast: "rgb(var(--color-background-contrast))",
    contrastSecondary: "rgb(var(--color-background-contrast-secondary))",
  },
  grey: gray,
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
