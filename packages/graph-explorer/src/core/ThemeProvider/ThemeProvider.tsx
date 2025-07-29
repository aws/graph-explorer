import { cn } from "@/utils";
import type { PropsWithChildren } from "react";
import { createContext, useContext } from "react";
import DEFAULT_LIGHT_THEME from "./themes/light";

type Theme = typeof DEFAULT_LIGHT_THEME;

export type ThemeStyleFn = (theme: Theme) => string;
type ThemedStyle = (styles: ThemeStyleFn) => string;

// This any should be replaced by a generic type that should detect the type of
// the current active theme. Need to do research to achieve it
const ThemeContext = createContext<Theme | null>(null);

type ThemeProviderProps = {
  className?: string;
};

export function ThemeProvider({
  className,
  children,
}: PropsWithChildren<ThemeProviderProps>) {
  const theme = DEFAULT_LIGHT_THEME;

  return (
    <ThemeContext.Provider value={theme}>
      <div className={cn(`light-wrapper h-full`, className)}>{children}</div>
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
