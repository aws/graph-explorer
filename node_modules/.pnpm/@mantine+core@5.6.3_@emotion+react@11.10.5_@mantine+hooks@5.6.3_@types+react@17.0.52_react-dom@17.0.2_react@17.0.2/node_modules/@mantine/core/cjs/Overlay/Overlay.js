'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var styles = require('@mantine/styles');
var utils = require('@mantine/utils');
var Overlay_styles = require('./Overlay.styles.js');
var Box = require('../Box/Box.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

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
  zIndex: styles.getDefaultZIndex("modal"),
  radius: 0,
  blur: 0
};
const _Overlay = React.forwardRef((props, ref) => {
  const _a = styles.useComponentDefaultProps("Overlay", defaultProps, props), { opacity, blur, color, gradient, zIndex, radius, sx, unstyled, className } = _a, others = __objRest(_a, ["opacity", "blur", "color", "gradient", "zIndex", "radius", "sx", "unstyled", "className"]);
  const { classes, cx } = Overlay_styles['default']({ zIndex }, { name: "Overlay", unstyled });
  const background = gradient ? { backgroundImage: gradient } : { backgroundColor: color };
  const innerOverlay = (otherProps) => /* @__PURE__ */ React__default.createElement(Box.Box, __spreadValues({
    ref,
    className: cx(classes.root, className),
    sx: [
      (theme) => __spreadProps(__spreadValues({}, background), {
        opacity,
        borderRadius: theme.fn.size({ size: radius, sizes: theme.radius })
      }),
      ...utils.packSx(sx)
    ]
  }, otherProps));
  if (blur) {
    return /* @__PURE__ */ React__default.createElement(Box.Box, __spreadValues({
      className: cx(classes.root, className),
      sx: [{ backdropFilter: `blur(${blur}px)` }, ...utils.packSx(sx)]
    }, others), innerOverlay());
  }
  return innerOverlay(others);
});
_Overlay.displayName = "@mantine/core/Overlay";
const Overlay = utils.createPolymorphicComponent(_Overlay);

exports.Overlay = Overlay;
exports._Overlay = _Overlay;
//# sourceMappingURL=Overlay.js.map
