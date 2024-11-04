import { cn } from "@/utils";
import type { CSSProperties, PropsWithChildren } from "react";
import { createContext } from "react";
import defaultStyles from "./ThemeProvider.styles.css";
import DEFAULT_DARK_THEME from "./themes/dark";
import DEFAULT_LIGHT_THEME from "./themes/light";
import type { ProcessedTheme, ThemeContextType } from "./types";

import { getCSSVariablesFromTheme } from "./utils/lib";

// This any should be replaced by a generic type that should detect the type of
// the current active theme. Need to do research to achieve it
export const ThemeContext = createContext<
  ThemeContextType<ProcessedTheme<any>>
>(undefined!);

export type ThemeProviderProps = {
  className?: string;
  initialTheme?: string;
};

const ThemeProvider = <
  TThemeExtend extends Record<string, any> = { [key: string]: any },
>({
  className,
  initialTheme = "light",
  children,
}: PropsWithChildren<ThemeProviderProps>) => {
  const theme = (() => {
    const composedTheme =
      initialTheme === "dark" ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;

    const themeWithDefaults = { ...composedTheme, "palette-opacity": "1" };
    const cssVariables = getCSSVariablesFromTheme(themeWithDefaults);

    return {
      themeName: initialTheme,
      theme: composedTheme,
      cssVariables,
      isDarkTheme: composedTheme.mode === "dark",
    } as ThemeContextType<TThemeExtend>;
  })();

  const cssVariables = (theme.cssVariables as { html?: CSSProperties })?.html;
  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={cn(`${theme.themeName}-wrapper`, defaultStyles(), className)}
        style={{ ...cssVariables, height: "100%" }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
