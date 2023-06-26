import React, { forwardRef, useState } from 'react';
import useStyles from './Thumb.styles.js';
import { Box } from '../../Box/Box.js';
import { Transition } from '../../Transition/Transition.js';

const Thumb = forwardRef(({
  max,
  min,
  value,
  position,
  label,
  dragging,
  onMouseDown,
  color,
  classNames,
  styles,
  size,
  labelTransition,
  labelTransitionDuration,
  labelTransitionTimingFunction,
  labelAlwaysOn,
  thumbLabel,
  onFocus,
  onBlur,
  showLabelOnHover,
  children = null,
  disabled,
  unstyled,
  thumbSize
}, ref) => {
  const { classes, cx, theme } = useStyles({ color, size, disabled, thumbSize }, { classNames, styles, unstyled, name: "Slider" });
  const [focused, setFocused] = useState(false);
  const isVisible = labelAlwaysOn || dragging || focused || showLabelOnHover;
  return /* @__PURE__ */ React.createElement(Box, {
    tabIndex: 0,
    role: "slider",
    "aria-label": thumbLabel,
    "aria-valuemax": max,
    "aria-valuemin": min,
    "aria-valuenow": value,
    ref,
    className: cx(classes.thumb, { [classes.dragging]: dragging }),
    onFocus: () => {
      setFocused(true);
      typeof onFocus === "function" && onFocus();
    },
    onBlur: () => {
      setFocused(false);
      typeof onBlur === "function" && onBlur();
    },
    onTouchStart: onMouseDown,
    onMouseDown,
    onClick: (event) => event.stopPropagation(),
    style: { [theme.dir === "rtl" ? "right" : "left"]: `${position}%` }
  }, children, /* @__PURE__ */ React.createElement(Transition, {
    mounted: label != null && isVisible,
    duration: labelTransitionDuration,
    transition: labelTransition,
    timingFunction: labelTransitionTimingFunction || theme.transitionTimingFunction
  }, (transitionStyles) => /* @__PURE__ */ React.createElement("div", {
    style: transitionStyles,
    className: classes.label
  }, label)));
});
Thumb.displayName = "@mantine/core/SliderThumb";

export { Thumb };
//# sourceMappingURL=Thumb.js.map
