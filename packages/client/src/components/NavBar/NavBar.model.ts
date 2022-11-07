type BaseNavBarTheme = Partial<{
  background: string;
  hover: string;
  header: string;
  activeBackground: string;
  activeColor: string;
  iconColor: string;
  color: string;
  separator: string;
  scrollbar: string;
  closeButton?: {
    background?: string;
    color?: string;
  };
  animation?: {
    toggleMenuSpeed?: string;
  };
}>;

export type NavBarTheme = {
  navBar?: BaseNavBarTheme;
};
