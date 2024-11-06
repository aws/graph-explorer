import { useCallback } from "react";
import type { ThemedStyle } from "./types";

import useTheme from "./useTheme";

function useWithTheme(): ThemedStyle {
  const theme = useTheme();
  return useCallback(styles => styles(theme), [theme]);
}

export default useWithTheme;
