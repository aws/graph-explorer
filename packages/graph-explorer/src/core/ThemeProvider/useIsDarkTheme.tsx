import useTheme from "./useTheme";

export const useIsDarkTheme = (): boolean => {
  const [theme] = useTheme();

  return !!theme?.isDarkTheme;
};

export default useIsDarkTheme;
