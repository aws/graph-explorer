import type { ThemedStyle } from "./types";

import useTheme from "./useTheme";

function useWithTheme(): ThemedStyle {
  const theme = useTheme();
  return styles => styles(theme);
}

export default useWithTheme;
