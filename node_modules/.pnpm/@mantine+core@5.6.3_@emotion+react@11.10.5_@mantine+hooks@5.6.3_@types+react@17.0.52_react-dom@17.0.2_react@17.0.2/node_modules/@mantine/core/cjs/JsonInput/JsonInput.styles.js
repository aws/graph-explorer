'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var styles = require('@mantine/styles');

var useStyles = styles.createStyles((theme, { size }) => ({
  input: {
    fontFamily: theme.fontFamilyMonospace,
    fontSize: theme.fn.size({ size, sizes: theme.fontSizes }) - 2
  }
}));

exports.default = useStyles;
//# sourceMappingURL=JsonInput.styles.js.map
