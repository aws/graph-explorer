'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var styles = require('@mantine/styles');
var SliderRoot_styles = require('../SliderRoot/SliderRoot.styles.js');

var useStyles = styles.createStyles((theme, { size, color, disabled }) => ({
  markWrapper: {
    position: "absolute",
    top: 0,
    zIndex: 2
  },
  mark: {
    boxSizing: "border-box",
    border: `${theme.fn.size({ size, sizes: SliderRoot_styles.sizes }) >= 8 ? "2px" : "1px"} solid ${theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]}`,
    height: theme.fn.size({ sizes: SliderRoot_styles.sizes, size }),
    width: theme.fn.size({ sizes: SliderRoot_styles.sizes, size }),
    borderRadius: 1e3,
    transform: `translateX(-${theme.fn.size({ sizes: SliderRoot_styles.sizes, size }) / 2}px)`,
    backgroundColor: theme.white
  },
  markFilled: {
    borderColor: disabled ? theme.colorScheme === "dark" ? theme.colors.dark[3] : theme.colors.gray[4] : theme.fn.variant({ variant: "filled", color }).background
  },
  markLabel: {
    transform: "translate(-50%, 0)",
    fontSize: theme.fontSizes.sm,
    color: theme.colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6],
    marginTop: `calc(${theme.spacing.xs}px / 2)`,
    whiteSpace: "nowrap"
  }
}));

exports.default = useStyles;
//# sourceMappingURL=Marks.styles.js.map
