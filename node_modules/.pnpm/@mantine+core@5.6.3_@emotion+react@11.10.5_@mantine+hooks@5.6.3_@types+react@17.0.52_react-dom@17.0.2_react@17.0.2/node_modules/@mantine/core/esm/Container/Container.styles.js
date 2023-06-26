import { createStyles } from '@mantine/styles';

var useStyles = createStyles((theme, { fluid, size, sizes }) => ({
  root: {
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    maxWidth: fluid ? "100%" : theme.fn.size({ size, sizes }),
    marginLeft: "auto",
    marginRight: "auto"
  }
}));

export default useStyles;
//# sourceMappingURL=Container.styles.js.map
