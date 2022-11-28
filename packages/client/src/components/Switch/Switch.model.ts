type BaseSwitchTheme = {
  on: {
    background: string;
    handleBackground: string;
    iconColor: string;
  };
  off: {
    background: string;
    handleBackground: string;
    iconColor: string;
  };
  focus: {
    outlineColor: string;
  };
  disabledOpacity: string;
  sizes: {
    sm: {
      width: number;
      height: number;
    };
    md: {
      width: number;
      height: number;
    };
    lg: {
      width: number;
      height: number;
    };
  };
};

export type SwitchTheme = {
  switchTheme?: DeepPartial<BaseSwitchTheme>;
};
