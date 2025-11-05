const spacing = (scale: number) => `${scale * 4}px`;

const gray = {
  100: "var(--color-gray-100)",
  200: "var(--color-gray-200)",
  300: "var(--color-gray-300)",
  400: "var(--color-gray-400)",
  500: "var(--color-gray-500)",
  600: "var(--color-gray-600)",
  700: "var(--color-gray-700)",
  800: "var(--color-gray-800)",
  900: "var(--color-gray-900)",
};

const palette = {
  common: {
    white: "var(--color-white)",
    black: "var(--color-black)",
  },
  primary: {
    light: "var(--color-primary-light)",
    main: "var(--color-primary-main)",
    dark: "var(--color-primary-dark)",
  },
  text: {
    primary: "var(--color-text-primary)",
    secondary: "var(--color-text-secondary)",
    disabled: "var(--color-text-disabled)",
  },
  divider: "var(--color-divider)",
  border: "var(--color-border)",
  background: {
    default: "var(--color-background-default)",
    secondary: "var(--color-background-secondary)",
    contrast: "var(--color-background-contrast)",
    contrastSecondary: "var(--color-background-contrast-secondary)",
  },
  grey: gray,
};

const LIGHT_THEME = {
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
