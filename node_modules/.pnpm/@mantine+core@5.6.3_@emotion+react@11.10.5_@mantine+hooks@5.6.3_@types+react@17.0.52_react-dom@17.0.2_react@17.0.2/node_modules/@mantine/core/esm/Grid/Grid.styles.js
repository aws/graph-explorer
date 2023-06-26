import { createStyles } from '@mantine/styles';

var useStyles = createStyles((theme, { justify, align, gutter }) => ({
  root: {
    margin: -theme.fn.size({ size: gutter, sizes: theme.spacing }) / 2,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: justify,
    alignItems: align
  }
}));

export default useStyles;
//# sourceMappingURL=Grid.styles.js.map
