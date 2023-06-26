import React, { forwardRef } from 'react';
import { getDefaultZIndex, useComponentDefaultProps } from '@mantine/styles';
import { packSx, createPolymorphicComponent } from '@mantine/utils';
import useStyles from './Overlay.styles.js';
import { Box } from '../Box/Box.js';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const defaultProps = {
  opacity: 0.6,
  color: "#fff",
  zIndex: getDefaultZIndex("modal"),
  radius: 0,
  blur: 0
};
const _Overlay = forwardRef((props, ref) => {
  const _a = useComponentDefaultProps("Overlay", defaultProps, props), { opacity, blur, color, gradient, zIndex, radius, sx, unstyled, className } = _a, others = __objRest(_a, ["opacity", "blur", "color", "gradient", "zIndex", "radius", "sx", "unstyled", "className"]);
  const { classes, cx } = useStyles({ zIndex }, { name: "Overlay", unstyled });
  const background = gradient ? { backgroundImage: gradient } : { backgroundColor: color };
  const innerOverlay = (otherProps) => /* @__PURE__ */ React.createElement(Box, __spreadValues({
    ref,
    className: cx(classes.root, className),
    sx: [
      (theme) => __spreadProps(__spreadValues({}, background), {
        opacity,
        borderRadius: theme.fn.size({ size: radius, sizes: theme.radius })
      }),
      ...packSx(sx)
    ]
  }, otherProps));
  if (blur) {
    return /* @__PURE__ */ React.createElement(Box, __spreadValues({
      className: cx(classes.root, className),
      sx: [{ backdropFilter: `blur(${blur}px)` }, ...packSx(sx)]
    }, others), innerOverlay());
  }
  return innerOverlay(others);
});
_Overlay.displayName = "@mantine/core/Overlay";
const Overlay = createPolymorphicComponent(_Overlay);

export { Overlay, _Overlay };
//# sourceMappingURL=Overlay.js.map
