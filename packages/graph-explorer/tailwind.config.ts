import { type Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";
import tailwindAnimate from "tailwindcss-animate";
import tailwindContainerQueries from "@tailwindcss/container-queries";

export default {
  theme: {
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
