import type { PropsWithChildren } from "react";
import { createContext, useContext } from "react";
import DEFAULT_LIGHT_THEME from "./themes/light";

type Theme = typeof DEFAULT_LIGHT_THEME;

export type ThemeStyleFn = (theme: Theme) => string;
type ThemedStyle = (styles: ThemeStyleFn) => string;

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider(props: PropsWithChildren) {
  const theme = DEFAULT_LIGHT_THEME;

  return (
    <ThemeContext.Provider value={theme}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return theme;
}

export function useWithTheme(): ThemedStyle {
  const theme = useTheme();
  return styles => styles(theme);
}
