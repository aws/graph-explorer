import { useContext } from "react";

import { ThemeContext } from "./ThemeProvider";
import type { ThemeContextType } from "./types";

export function useTheme(): ThemeContextType {
  const theme = useContext(ThemeContext);

  return theme;
}

export default useTheme;
