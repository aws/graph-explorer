import { createStyles } from '@mantine/styles';

var useStyles = createStyles((theme, { spacing, align, justify }) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: align,
    justifyContent: justify,
    gap: theme.fn.size({ size: spacing, sizes: theme.spacing })
  }
}));

export default useStyles;
//# sourceMappingURL=Stack.styles.js.map
