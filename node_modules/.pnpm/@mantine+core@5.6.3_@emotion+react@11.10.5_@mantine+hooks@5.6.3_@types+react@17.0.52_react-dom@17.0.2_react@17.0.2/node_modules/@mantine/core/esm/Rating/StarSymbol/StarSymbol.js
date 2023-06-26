import React from 'react';
import { StarIcon } from './StarIcon.js';
import useStyles from './StarSymbol.styles.js';

function StarSymbol({ size, type, color }) {
  const { classes } = useStyles({ size, type, color });
  return /* @__PURE__ */ React.createElement(StarIcon, {
    className: classes.icon
  });
}
StarSymbol.displayName = "@mantine/core/StarSymbol";

export { StarSymbol };
//# sourceMappingURL=StarSymbol.js.map
