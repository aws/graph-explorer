import { createStyles } from '@mantine/core';
import { sizes } from '../Month/Day/Day.styles.js';

var useStyles = createStyles((theme, { size, amountOfMonths, fullWidth }) => {
  const _maxWidth = theme.fn.size({ size, sizes: sizes }) * 7;
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

export default useStyles;
//# sourceMappingURL=CalendarBase.styles.js.map
