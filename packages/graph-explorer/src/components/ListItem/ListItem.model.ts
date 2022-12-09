type BgColorTheme = Partial<{
  text: string;
  background: string;
}>;

type BaseListItemTheme = {
  clickable?: BgColorTheme & {
    hover?: BgColorTheme;
    disabled?: BgColorTheme;
  };
  primary?: BgColorTheme;
  secondary?: BgColorTheme;
};

export type ListItemTheme = {
  listItem?: BaseListItemTheme;
};
