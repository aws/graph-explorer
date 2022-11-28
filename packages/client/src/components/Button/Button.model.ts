type BaseButtonTheme = {
  background: string;
  color: string;
  border: {
    width: string;
    color: string;
    radius: string;
  };
  hover: {
    background: string;
    color: string;
    border: {
      width: string;
      color: string;
    };
  };
  active: {
    background: string;
    color: string;
    border: {
      width: string;
      color: string;
    };
  };
  disabled: {
    background: string;
    color: string;
    border: {
      width: string;
      color: string;
    };
  };
};

type ButtonThemeVariants = BaseButtonTheme & {
  variants: {
    filled: ButtonThemeVariants;
    text: ButtonThemeVariants;
  };
  sizes: {
    small: string;
    base: string;
    large: string;
  };
};

export type ButtonTheme = {
  button?: DeepPartial<ButtonThemeVariants>;
};
