export { default as ThemeProvider } from "./ThemeProvider";
export { default as useTheme } from "./useTheme";
export { default as useWithTheme } from "./useWithTheme";
export { default as useIsDarkTheme } from "./useIsDarkTheme";

// Color utils
export { default as contrastColor } from "./utils/contrastColor";
export { default as darken } from "./utils/darken";
export { default as fade } from "./utils/fade";
export { default as lighten } from "./utils/lighten";
export { default as saturate } from "./utils/saturate";

export type {
  ActiveThemeType,
  Background,
  Grey,
  Palette,
  ProcessedTheme,
  Shadows,
  Shape,
  Spacing,
  TextPalette,
  ThemeContextType,
  ThemeStyleFn,
  ThemedStyle,
  Typography,
  ZIndex,
} from "./types";
