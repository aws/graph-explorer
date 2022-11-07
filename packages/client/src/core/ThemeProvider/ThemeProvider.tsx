import { cx, injectGlobal as emotionInjectGlobal } from "@emotion/css";
import merge from "lodash/merge";
import type { CSSProperties, PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import defaultStyles from "./ThemeProvider.styles.css";
import DEFAULT_DARK_THEME from "./themes/dark";
import DEFAULT_LIGHT_THEME from "./themes/light";
import type {
  ActiveThemeType,
  ProcessedTheme,
  Theme,
  ThemeContextType,
} from "./types";

import { getCSSVariablesFromTheme } from "./utils/lib";

// This any should be replaced by a generic type that should detect the type of
// the current active theme. Need to do research to achieve it
export const ThemeContext = createContext<
  ThemeContextType<ProcessedTheme<any>>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
>(undefined!);

const getTheme = <
  TThemeExtend extends Record<string, any> = { [key: string]: any }
>(
  THEME?: Theme<TThemeExtend>,
  isDarkTheme?: boolean
): ProcessedTheme<TThemeExtend> => {
  if (THEME) {
    return isDarkTheme
      ? merge({}, DEFAULT_DARK_THEME as ProcessedTheme<TThemeExtend>, THEME)
      : merge({}, DEFAULT_LIGHT_THEME as ProcessedTheme<TThemeExtend>, THEME);
  }

  if (isDarkTheme) {
    return DEFAULT_DARK_THEME as ProcessedTheme<TThemeExtend>;
  }

  return DEFAULT_LIGHT_THEME as ProcessedTheme<TThemeExtend>;
};

export type ThemeProviderProps<
  TThemeExtend extends Record<string, any> = { [key: string]: any }
> = {
  className?: string;
  initialTheme?: string;
  customThemes?: Record<string, Theme<TThemeExtend>>; // the css variables are attached to the body instead of using a wrapper div, our main ThemeProvider should have
  // this prop set as true
  injectGlobal?: boolean;
};

const EMPTY_OBJECT = {};

const ThemeProvider = <
  TThemeExtend extends Record<string, any> = { [key: string]: any }
>({
  className,
  initialTheme,
  customThemes,
  children,
  injectGlobal,
}: PropsWithChildren<ThemeProviderProps<TThemeExtend>>) => {
  const actualCustomThemes: Record<string, Theme<TThemeExtend>> =
    customThemes || EMPTY_OBJECT;

  const [theme, setTheme] = useState<
    ActiveThemeType<ProcessedTheme<TThemeExtend>>
  >(() => {
    let THEME: Theme<TThemeExtend> | undefined;
    if (initialTheme && actualCustomThemes) {
      THEME = actualCustomThemes[initialTheme];
    }

    const composedTheme = getTheme(
      THEME,
      THEME?.mode === "dark" || initialTheme === "dark"
    );

    const themeWithDefaults = { ...composedTheme, "ft-palette-opacity": "1" };
    const cssVariables = getCSSVariablesFromTheme(themeWithDefaults);

    return {
      themeName: initialTheme ?? "light",
      theme: composedTheme,
      cssVariables,
      isDarkTheme: composedTheme.mode === "dark",
    };
  });

  useEffect(() => {
    if (injectGlobal) {
      if (theme.theme.mode === "dark") {
        emotionInjectGlobal(
          `body.ft-dark img{filter: brightness(.9) contrast(1.2);} body{color-scheme: dark;}`
        );
        document.body.classList.add("ft-dark");
        document.body.classList.remove("ft-light");
        return;
      }

      emotionInjectGlobal(`body.ft-light{color-scheme: light;}`);
      document.body.classList.add("ft-light");
      document.body.classList.remove("ft-dark");
    }
  }, [theme.theme.mode, injectGlobal]);

  const availableThemes = useMemo(() => {
    return ["light", "dark", ...Object.keys(actualCustomThemes)];
  }, [actualCustomThemes]);

  const availableThemesDefinitions = useMemo(() => {
    const customThemesDef: Record<string, ProcessedTheme<TThemeExtend>> = {};
    Object.keys(actualCustomThemes).forEach(customTheme => {
      customThemesDef[customTheme] = getTheme(
        actualCustomThemes[customTheme],
        actualCustomThemes[customTheme]?.mode === "dark"
      );
    });
    return {
      light: DEFAULT_LIGHT_THEME as ProcessedTheme<TThemeExtend>,
      dark: DEFAULT_DARK_THEME as ProcessedTheme<TThemeExtend>,
      ...customThemesDef,
    };
  }, [actualCustomThemes]);

  const handleSetTheme = useCallback(
    (selectedTheme: string) => {
      const composedTheme =
        availableThemesDefinitions[
          selectedTheme as keyof typeof availableThemesDefinitions
        ];
      const cssVariables = getCSSVariablesFromTheme(composedTheme);
      setTheme({
        themeName: selectedTheme,
        theme: composedTheme,
        cssVariables,
        isDarkTheme: composedTheme.mode === "dark",
      });
    },
    [availableThemesDefinitions, setTheme]
  );

  useEffect(() => {
    handleSetTheme(theme.themeName);
  }, [actualCustomThemes, handleSetTheme, theme.themeName]);

  useEffect(() => {
    if (injectGlobal) {
      let cssVarAsString = "";
      const cssVars = theme.cssVariables["html"] as CSSProperties;
      Object.keys(cssVars).forEach(cssVar => {
        cssVarAsString += `${cssVar}:${
          cssVars[cssVar as keyof CSSProperties]
        };`;
      });
      //Inject the css vars globally instead of using a wrapper div, this is useful for using the variables in portal
      // components
      document
        .getElementsByTagName("body")[0]
        .setAttribute("style", cssVarAsString);
    }
  }, [injectGlobal, theme.cssVariables]);

  const value: ThemeContextType<ProcessedTheme<TThemeExtend>> = useMemo(
    () => [theme, handleSetTheme, availableThemes, availableThemesDefinitions],
    [theme, handleSetTheme, availableThemes, availableThemesDefinitions]
  );

  const cssVariables = (theme.cssVariables as { html?: CSSProperties })?.html;
  return (
    <ThemeContext.Provider value={value}>
      {!injectGlobal && (
        <div
          className={cx(
            `${theme.themeName}-wrapper`,
            defaultStyles(),
            className
          )}
          style={{ ...cssVariables, height: "100%" }}
        >
          {children}
        </div>
      )}
      {injectGlobal && children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
