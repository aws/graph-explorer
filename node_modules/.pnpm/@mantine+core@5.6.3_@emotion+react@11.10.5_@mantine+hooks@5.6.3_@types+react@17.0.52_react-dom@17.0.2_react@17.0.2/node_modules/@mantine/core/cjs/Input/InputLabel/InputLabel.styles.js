'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var styles = require('@mantine/styles');

var useStyles = styles.createStyles((theme, { size }) => ({
  label: {
    display: "inline-block",
    fontSize: theme.fn.size({ size, sizes: theme.fontSizes }),
    fontWeight: 500,
    color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.colors.gray[9],
    wordBreak: "break-word",
    cursor: "default",
    WebkitTapHighlightColor: "transparent"
  },
  required: {
    color: theme.fn.variant({ variant: "filled", color: "red" }).background
  }
}));

exports.default = useStyles;
//# sourceMappingURL=InputLabel.styles.js.map
