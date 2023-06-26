'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var styles = require('@mantine/styles');

const THUMB_SIZES = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 22
};
var useStyles = styles.createStyles((theme, { size }) => {
  const _size = theme.fn.size({ size, sizes: THUMB_SIZES });
  return {
    thumb: {
      overflow: "hidden",
      boxSizing: "border-box",
      position: "absolute",
      boxShadow: "0 0 1px rgba(0, 0, 0, .6)",
      border: `2px solid ${theme.white}`,
      backgroundColor: "transparent",
      width: _size,
      height: _size,
      borderRadius: _size
    }
  };
});

exports.THUMB_SIZES = THUMB_SIZES;
exports.default = useStyles;
//# sourceMappingURL=Thumb.styles.js.map
