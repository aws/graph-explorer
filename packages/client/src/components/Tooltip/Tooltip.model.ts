type BaseTooltipTheme = {
  background: string;
  color: string;
  padding: string;
  border: {
    color: string;
    width: string;
    radius: string;
  };
  shadow: string;
};

export type TooltipTheme = {
  tooltip?: DeepPartial<BaseTooltipTheme>;
};
