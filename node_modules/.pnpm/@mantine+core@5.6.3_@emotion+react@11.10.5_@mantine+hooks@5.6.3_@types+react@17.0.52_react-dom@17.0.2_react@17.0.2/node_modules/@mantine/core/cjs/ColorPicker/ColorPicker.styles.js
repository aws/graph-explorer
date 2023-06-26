'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var styles = require('@mantine/styles');

const sizes = {
  xs: 180,
  sm: 200,
  md: 240,
  lg: 280,
  xl: 320
};
var useStyles = styles.createStyles((theme, { size, fullWidth }) => ({
  preview: {},
  wrapper: {
    boxSizing: "border-box",
    width: fullWidth ? "100%" : theme.fn.size({ size, sizes }),
    padding: 1
  },
  body: {
    display: "flex",
    boxSizing: "border-box",
    paddingTop: theme.fn.size({ size, sizes: theme.spacing }) / 2
  },
  sliders: {
    flex: 1,
    boxSizing: "border-box",
    "&:not(:only-child)": {
      marginRight: theme.spacing.xs
    }
  },
  slider: {
    boxSizing: "border-box",
    "& + &": {
      marginTop: 5
    }
  },
  swatch: {
    cursor: "pointer"
  }
}));

exports.default = useStyles;
exports.sizes = sizes;
//# sourceMappingURL=ColorPicker.styles.js.map
