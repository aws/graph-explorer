import { cn } from "@/utils";
import type { PropsWithChildren } from "react";
import { createContext, useContext } from "react";
import DEFAULT_LIGHT_THEME from "./themes/light";

export type ActiveThemeType = {
  theme: typeof DEFAULT_LIGHT_THEME;
};

export type ThemeStyleFn = (theme: ActiveThemeType) => string;
export type ThemedStyle = (styles: ThemeStyleFn) => string;

// This any should be replaced by a generic type that should detect the type of
// the current active theme. Need to do research to achieve it
export const ThemeContext = createContext<ActiveThemeType>(undefined!);

export type ThemeProviderProps = {
  className?: string;
};

export function ThemeProvider({
  className,
  children,
}: PropsWithChildren<ThemeProviderProps>) {
  const theme = {
    theme: DEFAULT_LIGHT_THEME,
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div className={cn(`light-wrapper h-full`, className)}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useWithTheme(): ThemedStyle {
  const theme = useTheme();
  return styles => styles(theme);
}
