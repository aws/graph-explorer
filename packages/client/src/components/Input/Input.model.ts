type BaseInputTheme = {
  background: string;
  color: string;
  placeholderColor: string;
  border: string;
  borderRadius: string;
  disabledOpacity: string;
  padding: string;
  paddingSmall: string;
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

export type InputTheme = {
  input?: DeepPartial<BaseInputTheme>;
};
