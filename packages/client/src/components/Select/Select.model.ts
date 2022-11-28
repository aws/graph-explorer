type SelectBaseTheme = {
  background: string;
  color: string;
  placeholderColor: string;
  border: string;
  borderRadius: string;
  padding: string;
  paddingSmall: string;
  disabledOpacity: string;
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
  list: {
    background: string;
    borderColor: string;
    borderRadius: string;
    boxShadow: string;
    search: {
      background: string;
    };
    header: {
      title: {
        color: string;
      };
      subtitle: {
        color: string;
      };
    };
    item: {
      background: string;
      color: string;
      selected: {
        background: string;
        color: string;
      };
      hover: {
        background: string;
        color: string;
      };
    };
  };
};

type SelectThemeWithVariants = SelectBaseTheme & {
  variants?: {
    text: SelectBaseTheme;
  };
  zIndex?: number;
};

export type SelectTheme = {
  select?: DeepPartial<SelectThemeWithVariants>;
};
