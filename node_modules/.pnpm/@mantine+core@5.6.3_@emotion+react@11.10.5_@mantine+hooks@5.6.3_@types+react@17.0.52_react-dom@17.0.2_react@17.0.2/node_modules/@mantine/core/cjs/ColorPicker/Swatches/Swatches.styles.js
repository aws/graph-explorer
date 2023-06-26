'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var styles = require('@mantine/styles');

var useStyles = styles.createStyles((_theme, { swatchesPerRow }) => ({
  swatch: {
    width: `calc(${100 / swatchesPerRow}% - 4px)`,
    height: 0,
    paddingBottom: `calc(${100 / swatchesPerRow}% - 4px)`,
    margin: 2,
    boxSizing: "content-box"
  },
  swatches: {
    boxSizing: "border-box",
    marginLeft: -2,
    marginRight: -2,
    display: "flex",
    flexWrap: "wrap"
  }
}));

exports.default = useStyles;
//# sourceMappingURL=Swatches.styles.js.map
