import { useContext } from "react";

import { ThemeContext } from "./ThemeProvider";
import type { ProcessedTheme, ThemeContextType } from "./types";

export const useTheme = <
  TThemeExtend extends Record<string, any> = { [key: string]: any }
>(): ThemeContextType<ProcessedTheme<TThemeExtend>> => {
  const theme = useContext(ThemeContext);

  return (theme || []) as ThemeContextType<ProcessedTheme<TThemeExtend>>;
};

export default useTheme;
