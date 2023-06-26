'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var core = require('@mantine/core');

var useStyles = core.createStyles((theme, { size }) => ({
  timeField: {},
  disabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  inputWrapper: {
    display: "inline-flex",
    alignItems: "center",
    height: theme.fn.size({ size, sizes: core.INPUT_SIZES }) - 2
  },
  separator: {
    paddingLeft: theme.fn.size({ size, sizes: theme.spacing }) / 2,
    paddingRight: theme.fn.size({ size, sizes: theme.spacing }) / 2,
    lineHeight: 1
  }
}));

exports.default = useStyles;
//# sourceMappingURL=TimeRangeInput.styles.js.map
