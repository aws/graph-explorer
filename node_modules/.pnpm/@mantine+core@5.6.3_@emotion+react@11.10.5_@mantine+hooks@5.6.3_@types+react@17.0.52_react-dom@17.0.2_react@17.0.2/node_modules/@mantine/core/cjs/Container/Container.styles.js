'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var styles = require('@mantine/styles');

var useStyles = styles.createStyles((theme, { fluid, size, sizes }) => ({
  root: {
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    maxWidth: fluid ? "100%" : theme.fn.size({ size, sizes }),
    marginLeft: "auto",
    marginRight: "auto"
  }
}));

exports.default = useStyles;
//# sourceMappingURL=Container.styles.js.map
