import type { ProcessedTheme } from "../types";

const spacing = (scale: number) => `${scale * 4}px`;

const grey = {
  100: "#f8f8f8",
  200: "#eeeeee",
  300: "#e0e0e0",
  400: "#bdbdbd",
  500: "#9e9e9e",
  600: "#757575",
  700: "#616161",
  800: "#424242",
  900: "#212121",
};

const palette: DeepRequired<ProcessedTheme["palette"]> = {
  common: {
    white: "#fff",
    black: "#000",
  },
  primary: {
    light: "#64c7ff",
    main: "#128ee5",
    dark: "#17457b",
    contrastText: "#ffffff",
  },
  secondary: {
    light: "#ffb82e",
    main: "#fa8500",
    dark: "#e46000",
    contrastText: "#ffffff",
  },
  apotheca: {
    light: "#04a7ff",
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
    main: "#27af8c",
    light: "#31deb2",
    dark: "#129271",
    contrastText: "#ffffff",
  },
  warning: {
    light: "#ffb82e",
    main: "#fa8500",
    dark: "#e46000",
    contrastText: "#ffffff",
  },
  text: {
    primary: "rgba(0,0,0,0.87)",
    secondary: "rgba(0,0,0,0.6)",
    disabled: "rgba(0,0,0,0.38)",
  },
  divider: grey["200"],
  border: grey["200"],
  background: {
    default: "#ffffff",
    secondary: "#E0E9F6",
    contrast: grey["200"],
    contrastSecondary: grey["300"],
    apotheca:'#04a7ff'
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
  shadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    none: "none",
    left: "-4px 1px 5px 0 rgba(0, 0, 0, 0.1)",
    right: "4px 1px 5px 0 rgba(0, 0, 0, 0.1)",
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

export default LIGHT_THEME;
