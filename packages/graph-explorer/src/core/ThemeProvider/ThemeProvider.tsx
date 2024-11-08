import { cn } from "@/utils";
import type { PropsWithChildren } from "react";
import { createContext } from "react";
import DEFAULT_DARK_THEME from "./themes/dark";
import DEFAULT_LIGHT_THEME from "./themes/light";
import type { ThemeContextType } from "./types";

// This any should be replaced by a generic type that should detect the type of
// the current active theme. Need to do research to achieve it
export const ThemeContext = createContext<ThemeContextType>(undefined!);

export type ThemeProviderProps = {
  className?: string;
  initialTheme?: string;
};

function ThemeProvider({
  className,
  initialTheme = "light",
  children,
}: PropsWithChildren<ThemeProviderProps>) {
  const theme = (() => {
    const composedTheme =
      initialTheme === "dark" ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;

    return {
      themeName: initialTheme,
      theme: composedTheme,
      isDarkTheme: composedTheme.mode === "dark",
    } as ThemeContextType;
  })();

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={cn(
          `${theme.themeName}-wrapper h-full`,
          theme.isDarkTheme && "dark",
          className
        )}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
