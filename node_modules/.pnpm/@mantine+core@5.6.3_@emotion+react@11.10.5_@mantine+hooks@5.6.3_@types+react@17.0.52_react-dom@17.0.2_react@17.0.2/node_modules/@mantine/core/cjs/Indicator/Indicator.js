'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var styles = require('@mantine/styles');
var Indicator_styles = require('./Indicator.styles.js');
var Machine = require('./Machine/Machine.js');
var Box = require('../Box/Box.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

var __defProp = Object.defineProperty;
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
  position: "top-end",
  offset: 0,
  inline: false,
  withBorder: false,
  disabled: false,
  showZero: true,
  processing: false,
  dot: true,
  size: 10,
  overflowCount: 99,
  radius: 1e3,
  zIndex: styles.getDefaultZIndex("app")
};
const Indicator = React.forwardRef((props, ref) => {
  const _a = styles.useComponentDefaultProps("Indicator", defaultProps, props), {
    children,
    position,
    offset,
    size,
    radius,
    inline,
    withBorder,
    className,
    color,
    dot,
    styles: styles$1,
    label,
    overflowCount,
    showZero,
    classNames,
    disabled,
    zIndex,
    unstyled,
    processing
  } = _a, others = __objRest(_a, [
    "children",
    "position",
    "offset",
    "size",
    "radius",
    "inline",
    "withBorder",
    "className",
    "color",
    "dot",
    "styles",
    "label",
    "overflowCount",
    "showZero",
    "classNames",
    "disabled",
    "zIndex",
    "unstyled",
    "processing"
  ]);
  const { classes, cx } = Indicator_styles['default']({ position, offset, size, radius, inline, color, withBorder, zIndex, withLabel: !!label }, { name: "Indicator", classNames, styles: styles$1, unstyled });
  const renderLabel = React.useMemo(() => {
    if (typeof label === "number") {
      return /* @__PURE__ */ React__default.createElement(Machine.Machine, {
        value: label,
        max: overflowCount
      });
    }
    return label;
  }, [label, overflowCount]);
  const isShowIndicator = React.useMemo(() => !disabled && (dot || label != null && !(label <= 0 && !showZero)), [disabled, label, showZero]);
  return /* @__PURE__ */ React__default.createElement(Box.Box, __spreadValues({
    ref,
    className: cx(classes.root, className)
  }, others), isShowIndicator && /* @__PURE__ */ React__default.createElement(React__default.Fragment, null, /* @__PURE__ */ React__default.createElement("div", {
    className: cx(classes.indicator, classes.common)
  }, renderLabel), processing && /* @__PURE__ */ React__default.createElement("div", {
    className: cx(classes.processing, classes.common)
  })), children);
});
Indicator.displayName = "@mantine/core/Indicator";

exports.Indicator = Indicator;
//# sourceMappingURL=Indicator.js.map
