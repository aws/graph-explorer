'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var styles = require('@mantine/styles');

var useStyles = styles.createStyles((theme, { size }) => ({
  error: {
    wordBreak: "break-word",
    color: theme.fn.variant({ variant: "filled", color: "red" }).background,
    fontSize: theme.fn.size({ size, sizes: theme.fontSizes }) - 2,
    lineHeight: 1.2,
    display: "block"
  }
}));

exports.default = useStyles;
//# sourceMappingURL=InputError.styles.js.map
