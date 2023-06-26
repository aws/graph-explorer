import { createStyles, INPUT_SIZES } from '@mantine/core';

var useStyles = createStyles((theme, { size }) => ({
  timeField: {},
  disabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  inputWrapper: {
    display: "inline-flex",
    alignItems: "center",
    height: theme.fn.size({ size, sizes: INPUT_SIZES }) - 2
  },
  separator: {
    paddingLeft: theme.fn.size({ size, sizes: theme.spacing }) / 2,
    paddingRight: theme.fn.size({ size, sizes: theme.spacing }) / 2,
    lineHeight: 1
  }
}));

export default useStyles;
//# sourceMappingURL=TimeRangeInput.styles.js.map
