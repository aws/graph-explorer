export type BaseTabularTheme = {
  background: string;
  color: string;
  border: string;
  header: {
    background: string;
    color: string;
    border: string;
    padding: string;
    minHeight: string;
    resizing: {
      background: string;
      color: string;
      border: string;
    };
    label: {
      fontWeight: string;
      minHeight: string;
      margin: string;
      padding: string;
    };
    filter: {
      minHeight: string;
      margin: string;
      padding: string;
    };
    sorter: {
      color: string;
      opacity: string;
      hover: {
        color: string;
        opacity: string;
      };
    };
    controls: {
      background: string;
      color: string;
      border: string;
      padding: string;
    };
  };
  row: {
    background: string;
    color: string;
    border: string;
    minHeight: string;
    hover: {
      background: string;
      color: string;
    };
    selectable: {
      background: string;
      color: string;
      hover: {
        background: string;
        color: string;
      };
    };
    selected: {
      background: string;
      color: string;
    };
    resizing: {
      background: string;
      color: string;
      border: string;
    };
  };
  footer: {
    controls: {
      background: string;
      color: string;
      border: string;
      padding: string;
    };
  };
};

export type TabularTheme = {
  tabular?: DeepPartial<BaseTabularTheme>;
};
