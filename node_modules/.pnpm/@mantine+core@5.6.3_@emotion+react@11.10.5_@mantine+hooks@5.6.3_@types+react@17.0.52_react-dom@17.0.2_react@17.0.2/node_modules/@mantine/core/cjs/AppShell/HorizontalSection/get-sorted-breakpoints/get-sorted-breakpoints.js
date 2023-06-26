'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function getSortedBreakpoints(breakpoints, theme) {
  if (!breakpoints) {
    return [];
  }
  const values = Object.keys(breakpoints).filter((breakpoint) => breakpoint !== "base").map((breakpoint) => [
    theme.fn.size({ size: breakpoint, sizes: theme.breakpoints }),
    breakpoints[breakpoint]
  ]);
  values.sort((a, b) => a[0] - b[0]);
  return values;
}

exports.getSortedBreakpoints = getSortedBreakpoints;
//# sourceMappingURL=get-sorted-breakpoints.js.map
