export type ActiveThemeType<T> = {
  theme: T;
  themeName: string;
  cssVariables: Record<string, unknown>;
  isDarkTheme?: boolean;
};

export type ThemeContextType<
  TThemeExtend extends Record<string, any> = Record<string, any>
> = [
  ActiveThemeType<TThemeExtend>,
  (selectedTheme: string) => void,
  string[],
  Record<string, TThemeExtend>
];

export type ThemeStyleFn<
  TThemeExtend extends Record<string, any> = Record<string, any>
> = (theme: ActiveThemeType<ProcessedTheme<TThemeExtend>>) => string;

export type ThemedStyle<
  TThemeExtend extends Record<string, any> = Record<string, any>
> = (styles: ThemeStyleFn<TThemeExtend>) => string;

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
  apotheca?:string
};

export type ZIndex = {
  modal?: number;
  tooltip?: number;
  popover?: number;
  appBar?: number;
  panes?: number;
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

export type Shadows = {
  sm?: string;
  base?: string;
  md?: string;
  lg?: string;
  xl?: string;
  inner?: string;
  none?: string;
  left?: string;
  right?: string;
};

export type Theme<
  TThemeExtend extends Record<string, any> = Record<string, any>
> = TThemeExtend & {
  name?: string;
  mode?: "dark" | "light"; // Primary and Secondary colors are defined as fallback of other colors in order
  // to avoid duplication of colors everywhere.
  palette?: {
    common?: {
      white?: string;
      black?: string;
    };
    primary?: Palette;
    secondary?: Palette;
    apotheca?:Palette;
    info?: Palette;
    error?: Palette;
    warning?: Palette;
    success?: Palette;
    text?: TextPalette;
    background?: Background;
    divider?: string;
    border?: string;
    grey?: Grey;
  };
  zIndex?: ZIndex;
  typography?: Typography;
  shape?: Shape;
  spacing?: Spacing;
  shadow?: Shadows;
};

export type FormBaseTheme = {
  background: string;
  color: string;
  placeholderColor: string;
  border: string;
  borderRadius: string;
  disabledOpacity: string;
  startAdornment: {
    color: string;
  };
  endAdornment: {
    color: string;
  };
  focus: {
    outlineColor: string;
    background: string;
    color: string;
  };
  hover: {
    background: string;
    color: string;
  };
  label: {
    color: string;
  };
  error: {
    labelColor: string;
    errorColor: string;
    background: string;
    color: string;
    placeholderColor: string;
    border: string;
    focus: {
      outlineColor: string;
    };
  };
};

export type ProcessedTheme<
  TThemeExtend extends Record<string, any> = Record<string, any>
> = TThemeExtend & {
  name: string;
  mode: "dark" | "light"; // Primary and Secondary colors are defined as fallback of other colors in order
  // to avoid duplication of colors everywhere.
  palette: {
    common: {
      white: string;
      black: string;
    };
    primary: DeepRequired<Palette>;
    secondary: DeepRequired<Palette>;
    apotheca: DeepRequired<Palette>;
    info: DeepRequired<Palette>;
    error: DeepRequired<Palette>;
    warning: DeepRequired<Palette>;
    success: DeepRequired<Palette>;
    text: DeepRequired<TextPalette>;
    background: DeepRequired<Background>;
    divider: string;
    border: string;
    grey: DeepRequired<Grey>;
  };
  zIndex: DeepRequired<ZIndex>;
  typography: DeepRequired<Typography>;
  shape: DeepRequired<Shape>;
  spacing: DeepRequired<Spacing>;
  shadow: DeepRequired<Shadows>;
  forms?: FormBaseTheme;
  [key: string]: undefined | any;
};
