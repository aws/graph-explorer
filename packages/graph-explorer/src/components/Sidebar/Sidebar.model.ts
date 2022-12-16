type BaseSidebarTheme = {
  button: {
    color: string;
    background: string;
    active: {
      color: string;
      background: string;
    };
  };
};

export type SidebarTheme = {
  sidebar?: DeepPartial<BaseSidebarTheme>;
};
