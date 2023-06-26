import { createStyles } from '@mantine/styles';

const sizes = {
  xs: 14,
  sm: 18,
  md: 20,
  lg: 28,
  xl: 32
};
var useStyles = createStyles((theme, { size, type, color }) => {
  const emptyColor = theme.colorScheme === "light" ? theme.colors.gray[3] : theme.colors.gray[8];
  const fullColor = theme.fn.variant({ variant: "filled", color }).background;
  return {
    icon: {
      stroke: type === "empty" ? emptyColor : fullColor,
      fill: type === "empty" ? emptyColor : fullColor,
      width: theme.fn.size({ size, sizes }),
      height: theme.fn.size({ size, sizes })
    }
  };
});

export default useStyles;
//# sourceMappingURL=StarSymbol.styles.js.map
