import { generateCssVariable, getCSSVariablesFromTheme } from "./lib";

describe("getCSSVariablesFromTheme", () => {
  it("should generate one color per theme colors", () => {
    const CUSTOM_THEME = {
      colors: {
        primary: "#36659c",
        secondary: "#d0021c",
        tertiary: "#f6a521",
        foreground: "#afafaf",
        background: "#f0f4f9",
      },
    };

    const result = getCSSVariablesFromTheme(CUSTOM_THEME);
    expect(result).toMatchObject({
      html: {
        "--colors-background": "#f0f4f9",
        "--colors-foreground": "#afafaf",
        "--colors-primary": "#36659c",
        "--colors-secondary": "#d0021c",
        "--colors-tertiary": "#f6a521",
      },
    });
  });

  it("should generate colors for nested objects", () => {
    const CUSTOM_THEME = {
      colors: {
        primary: "#36659c",
        secondary: "#d0021c",
        tertiary: "#f6a521",
        foreground: "#afafaf",
        background: "#f0f4f9",
        button: {
          background: "red",
          foreground: "orange",
          active: {
            background: "blue",
            foreground: "yellow",
          },
        },
      },
    };

    const result = getCSSVariablesFromTheme(CUSTOM_THEME);
    expect(result).toMatchObject({
      html: {
        "--colors-background": "#f0f4f9",
        "--colors-foreground": "#afafaf",
        "--colors-primary": "#36659c",
        "--colors-secondary": "#d0021c",
        "--colors-tertiary": "#f6a521",
        "--colors-button-background": "red",
        "--colors-button-foreground": "orange",
        "--colors-button-active-background": "blue",
        "--colors-button-active-foreground": "yellow",
      },
    });
  });

  it("should generate css vars properties other than colors", () => {
    const CUSTOM_THEME = {
      colors: {
        primary: "#36659c",
        secondary: "#d0021c",
        tertiary: "#f6a521",
        foreground: "#afafaf",
        background: "#f0f4f9",
        button: {
          background: "red",
          foreground: "orange",
          active: {
            background: "blue",
            foreground: "yellow",
          },
        },
      },
      fonts: {
        xs: "0.75rem",
        sm: "0.875rem",
        md: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
      },
    };

    const result = getCSSVariablesFromTheme(CUSTOM_THEME);
    expect(result).toMatchObject({
      html: {
        "--colors-background": "#f0f4f9",
        "--colors-foreground": "#afafaf",
        "--colors-primary": "#36659c",
        "--colors-secondary": "#d0021c",
        "--colors-tertiary": "#f6a521",
        "--colors-button-background": "red",
        "--colors-button-foreground": "orange",
        "--colors-button-active-background": "blue",
        "--colors-button-active-foreground": "yellow",
        "--fonts-xs": "0.75rem",
        "--fonts-sm": "0.875rem",
        "--fonts-md": "1rem",
        "--fonts-lg": "1.125rem",
        "--fonts-xl": "1.25rem",
        "--fonts-2xl": "1.5rem",
        "--fonts-3xl": "1.875rem",
        "--fonts-4xl": "2.25rem",
        "--fonts-5xl": "3rem",
      },
    });
  });

  it("should convert camelCase properties to lowercase when generate css vars", () => {
    const CUSTOM_THEME = {
      colors: {
        primary: "#36659c",
        secondary: "#d0021c",
        tertiary: "#f6a521",
        foreground: "#afafaf",
        background: "#f0f4f9",
        myCustomComponent: {
          background: "#f98a58",
        },
      },
    };

    const result = getCSSVariablesFromTheme(CUSTOM_THEME);
    expect(result).toMatchObject({
      html: {
        "--colors-background": "#f0f4f9",
        "--colors-foreground": "#afafaf",
        "--colors-primary": "#36659c",
        "--colors-secondary": "#d0021c",
        "--colors-tertiary": "#f6a521",
        "--colors-mycustomcomponent-background": "#f98a58",
      },
    });
  });

  it("should convert uppercase properties to lowercase when generate css vars", () => {
    const CUSTOM_THEME = {
      COLORS: {
        PRIMARY: "#36659c",
        SECONDARY: "#d0021c",
        TERTIARY: "#f6a521",
        FOREGROUND: "#afafaf",
        BACKGROUND: "#f0f4f9",
        BUTTON: {
          BACKGROUND: "#f98a58",
        },
      },
    };

    const result = getCSSVariablesFromTheme(CUSTOM_THEME);
    expect(result).toMatchObject({
      html: {
        "--colors-background": "#f0f4f9",
        "--colors-foreground": "#afafaf",
        "--colors-primary": "#36659c",
        "--colors-secondary": "#d0021c",
        "--colors-tertiary": "#f6a521",
        "--colors-button-background": "#f98a58",
      },
    });
  });
});

describe("generateCssVariable", () => {
  it("should generate a valid css string-value for empty parameters", () => {
    const result = generateCssVariable();
    expect(result).toEqual("");
  });

  it("should generate a valid css string-value for only one parameter", () => {
    const result = generateCssVariable("--colors-primary");
    expect(result).toEqual("var(--colors-primary)");
  });

  it("should generate a valid css string-value for two parameters", () => {
    const result = generateCssVariable("--colors-primary", "blue");
    expect(result).toEqual("var(--colors-primary, blue)");
  });

  it("should generate a valid css string-value for three or more parameters", () => {
    const result = generateCssVariable(
      "--toast-info-background",
      "--colors-primary-dark",
      "--colors-primary",
      "blue"
    );
    expect(result).toEqual(
      "var(--toast-info-background, var(--colors-primary-dark, var(--colors-primary, blue)))"
    );
  });
});
