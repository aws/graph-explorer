import { createStyles } from '@mantine/styles';

var useStyles = createStyles((theme, { smallerThan, largerThan, query, styles }) => {
  const media = {};
  const minWidth = theme.fn.size({ size: largerThan, sizes: theme.breakpoints });
  const maxWidth = theme.fn.size({ size: smallerThan, sizes: theme.breakpoints });
  const _styles = typeof styles === "function" ? styles(theme) : styles;
  if (largerThan !== void 0 && smallerThan !== void 0) {
    media[`@media (min-width: ${minWidth}px) and (max-width: ${maxWidth - 1}px)`] = _styles;
  } else {
    if (largerThan !== void 0) {
      media[`@media (min-width: ${theme.fn.size({ size: largerThan, sizes: theme.breakpoints })}px)`] = _styles;
    }
    if (smallerThan !== void 0) {
      media[`@media (max-width: ${theme.fn.size({ size: smallerThan, sizes: theme.breakpoints }) - 1}px)`] = _styles;
    }
  }
  if (query) {
    media[`@media ${query}`] = _styles;
  }
  return { media };
});

export default useStyles;
//# sourceMappingURL=MediaQuery.styles.js.map
