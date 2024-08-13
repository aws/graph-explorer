import { type Config } from "tailwindcss";
import colors from "tailwindcss/colors";

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

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: colors.black,
      white: colors.white,
      gray: grey,
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
      background: {
        default: "#ffffff",
        secondary: "#E0E9F6",
        contrast: grey["200"],
        contrastSecondary: grey["300"],
      },
      text: {
        primary: "rgba(0,0,0,0.87)",
        secondary: "rgba(0,0,0,0.6)",
        disabled: "rgba(0,0,0,0.38)",
      },
      divider: grey["200"],
      border: grey["200"],
      // gray: colors.slate,
      // green: colors.emerald,
      // purple: colors.violet,
      // yellow: colors.amber,
      // pink: colors.fuchsia,
    },
    spacing: {
      "1": "4px",
      "2": "8px",
      "3": "12px",
      "4": "16px",
      "5": "20px",
      "6": "24px",
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
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.75rem",
      "4xl": "2rem",
      "5xl": "2.5rem",
    },
    fontWeight: {
      light: "400",
      base: "500",
      bold: "600",
      extraBold: "700",
    },
    boxShadow: {
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
      none: "none",
      left: "-4px 1px 5px 0 rgba(0, 0, 0, 0.1)",
      right: "4px 1px 5px 0 rgba(0, 0, 0, 0.1)",
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
        DEFAULT: grey["200"],
      },
    },
  },
  plugins: [],
} satisfies Config;
