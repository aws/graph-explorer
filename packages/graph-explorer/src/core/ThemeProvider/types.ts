export type ActiveThemeType = {
  theme: ProcessedTheme;
};

export type ThemeContextType = ActiveThemeType;
export type ThemeStyleFn = (theme: ActiveThemeType) => string;
export type ThemedStyle = (styles: ThemeStyleFn) => string;

export type Palette = {
  main: string;
  light?: string;
  dark?: string;
  contrastText: string;
};

export type TextPalette = {
  primary?: string;
  secondary?: string;
  disabled?: string;
};

export type Typography = {
  fontSize?: string;
  fontFamily?: string;
  sizes?: {
    xs?: string;
    sm?: string;
    base?: string;
    lg?: string;
    xl?: string;
  };
  weight?: {
    light?: number;
    base?: number;
    bold?: number;
    extraBold?: number;
  };
};

export type Background = {
  default?: string;
  secondary?: string;
  contrast?: string;
  contrastSecondary?: string;
};

export type Grey = {
  100?: string;
  200?: string;
  300?: string;
  400?: string;
  500?: string;
  600?: string;
  700?: string;
  800?: string;
  900?: string;
};

export type Shape = {
  borderRadius?: string;
};

export type Spacing = {
  base?: string;
  "2x"?: string;
  "3x"?: string;
  "4x"?: string;
  "5x"?: string;
  "6x"?: string;
};

export type ProcessedTheme = {
  // to avoid duplication of colors everywhere.
  palette: {
    common: {
      white: string;
      black: string;
    };
    primary: DeepRequired<Palette>;
    text: DeepRequired<TextPalette>;
    background: DeepRequired<Background>;
    divider: string;
    border: string;
    grey: DeepRequired<Grey>;
  };
  typography: DeepRequired<Typography>;
  shape: DeepRequired<Shape>;
  spacing: DeepRequired<Spacing>;
};
