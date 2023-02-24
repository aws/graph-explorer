import type { ProcessedTheme } from "../types";

const spacing = (scale: number) => `${scale * 4}px`;

const grey = {
  100: "hsl(0,0%,96%)",
  200: "hsl(0,0%,93%)",
  300: "hsl(0,0%,88%)",
  400: "hsl(0,0%,74%)",
  500: "hsl(0,0%,62%)",
  600: "hsl(0,0%,42%)",
  700: "hsl(0,0%,32%)",
  800: "hsl(0,0%,26%)",
  900: "hsl(0,0%,13%)",
};

const palette: DeepRequired<ProcessedTheme["palette"]> = {
  common: {
    white: "#f0f0f0",
    black: "#0f0f0f",
  },
  primary: {
    light: "#64c7ff",
    main: "#43abf4",
    dark: "#128ee5",
    contrastText: "#ffffff",
  },
  secondary: {
    light: "#ffb82e",
    main: "#fa8500",
    dark: "#e46000",
    contrastText: "#ffffff",
  },
  info: {
    light: "#64c7ff",
    main: "#128ee5",
    dark: "#17457b",
    contrastText: "#ffffff",
  },
  error: {
    main: "#eb4e4c",
    light: "#ff9077",
    dark: "#a41c1b",
    contrastText: "#ffffff",
  },
  success: {
    main: "#66bb6a",
    light: "#81c784",
    dark: "#388e3c",
    contrastText: "#ffffff",
  },
  warning: {
    light: "#ffb82e",
    main: "#fa8500",
    dark: "#e46000",
    contrastText: "#ffffff",
  },
  text: {
    primary: "#f0f0f0",
    secondary: "#d0d0d0",
    disabled: "#a0a0a0",
  },
  divider: grey["700"],
  border: grey["700"],
  background: {
    default: "#101010",
    secondary: "#262626",
    contrast: grey["700"],
    contrastSecondary: grey["600"],
  },
  grey: {
    100: "hsl(0,0%,96%)",
    200: "hsl(0,0%,93%)",
    300: "hsl(0,0%,88%)",
    400: "hsl(0,0%,74%)",
    500: "hsl(0,0%,62%)",
    600: "hsl(0,0%,46%)",
    700: "hsl(0,0%,38%)",
    800: "hsl(0,0%,22%)",
    900: "hsl(0,0%,13%)",
  },
};

const DARK_THEME: ProcessedTheme = {
  name: "DEFAULT",
  mode: "dark",
  spacing: {
    base: spacing(1),
    "2x": spacing(2),
    "3x": spacing(3),
    "4x": spacing(4),
    "5x": spacing(5),
    "6x": spacing(6),
  },
  shadow: {
    sm: "none",
    base: "none",
    md: "none",
    lg: "none",
    xl: "none",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    none: "none",
    left: "none",
    right: "none",
  },
  palette,
  zIndex: {
    appBar: 1000,
    panes: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
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

export default DARK_THEME;
