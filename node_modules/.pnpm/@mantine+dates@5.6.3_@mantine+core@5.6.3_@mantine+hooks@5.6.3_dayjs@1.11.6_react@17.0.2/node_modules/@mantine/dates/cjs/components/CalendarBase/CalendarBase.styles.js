'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var core = require('@mantine/core');
var Day_styles = require('../Month/Day/Day.styles.js');

var useStyles = core.createStyles((theme, { size, amountOfMonths, fullWidth }) => {
  const _maxWidth = theme.fn.size({ size, sizes: Day_styles.sizes }) * 7;
  const maxWidth = amountOfMonths > 1 ? _maxWidth * amountOfMonths + (amountOfMonths - 1) * theme.spacing.md : _maxWidth;
  return {
    calendarBase: {
      boxSizing: "border-box",
      display: "flex",
      gap: theme.spacing.md,
      maxWidth: fullWidth ? "100%" : maxWidth
    }
  };
});

exports.default = useStyles;
//# sourceMappingURL=CalendarBase.styles.js.map
