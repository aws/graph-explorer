import { createStyles } from '@mantine/styles';

const GROUP_POSITIONS = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
  apart: "space-between"
};
var useStyles = createStyles((theme, { spacing, position, noWrap, grow, align, count }) => ({
  root: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "row",
    alignItems: align || "center",
    flexWrap: noWrap ? "nowrap" : "wrap",
    justifyContent: GROUP_POSITIONS[position],
    gap: theme.fn.size({ size: spacing, sizes: theme.spacing }),
    "& > *": {
      boxSizing: "border-box",
      maxWidth: grow ? `calc(${100 / count}% - ${theme.fn.size({ size: spacing, sizes: theme.spacing }) - theme.fn.size({ size: spacing, sizes: theme.spacing }) / count}px)` : void 0,
      flexGrow: grow ? 1 : 0
    }
  }
}));

export default useStyles;
export { GROUP_POSITIONS };
//# sourceMappingURL=Group.styles.js.map
