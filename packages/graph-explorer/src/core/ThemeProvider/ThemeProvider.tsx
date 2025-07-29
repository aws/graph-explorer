import { cn } from "@/utils";
import type { PropsWithChildren } from "react";
import { createContext } from "react";
import DEFAULT_LIGHT_THEME from "./themes/light";
import type { ThemeContextType } from "./types";

// This any should be replaced by a generic type that should detect the type of
// the current active theme. Need to do research to achieve it
export const ThemeContext = createContext<ThemeContextType>(undefined!);

export type ThemeProviderProps = {
  className?: string;
};

function ThemeProvider({
  className,
  children,
}: PropsWithChildren<ThemeProviderProps>) {
  const theme = (() => {
    return {
      theme: DEFAULT_LIGHT_THEME,
    } as ThemeContextType;
  })();

  return (
    <ThemeContext.Provider value={theme}>
      <div className={cn(`light-wrapper h-full`, className)}>{children}</div>
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
