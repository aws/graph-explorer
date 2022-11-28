import { useCallback } from "react";
import type { ThemedStyle } from "./types";

import useTheme from "./useTheme";

const useWithTheme = <
  TThemeExtend extends Record<string, any> = { [key: string]: any }
>(): ThemedStyle<TThemeExtend> => {
  const [theme] = useTheme<TThemeExtend>();
  return useCallback(styles => styles(theme), [theme]);
};

export default useWithTheme;
