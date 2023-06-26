'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var styles = require('@mantine/styles');

var useStyles = styles.createStyles((theme) => ({
  divider: {
    margin: `calc(${theme.spacing.xs}px / 2) -5px`,
    borderTop: `1px solid ${theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]}`
  }
}));

exports.default = useStyles;
//# sourceMappingURL=MenuDivider.styles.js.map
