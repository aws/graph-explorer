'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var styles = require('@mantine/styles');
var DotsIcon = require('../icons/DotsIcon.js');
var NextIcon = require('../icons/NextIcon.js');
var PrevIcon = require('../icons/PrevIcon.js');
var FirstIcon = require('../icons/FirstIcon.js');
var LastIcon = require('../icons/LastIcon.js');

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
const icons = {
  dots: DotsIcon.DotsIcon,
  next: NextIcon.NextIcon,
  prev: PrevIcon.PrevIcon,
  first: FirstIcon.FirstIcon,
  last: LastIcon.LastIcon
};
const rtlIcons = {
  dots: DotsIcon.DotsIcon,
  prev: NextIcon.NextIcon,
  next: PrevIcon.PrevIcon,
  last: FirstIcon.FirstIcon,
  first: LastIcon.LastIcon
};
function DefaultItem(_a) {
  var _b = _a, { page, active, onClick } = _b, others = __objRest(_b, ["page", "active", "onClick"]);
  const theme = styles.useMantineTheme();
  const Item = (theme.dir === "rtl" ? rtlIcons : icons)[page];
  const children = Item ? /* @__PURE__ */ React__default.createElement(Item, null) : page;
  return /* @__PURE__ */ React__default.createElement("button", __spreadValues({
    type: "button",
    onClick
  }, others), children);
}
DefaultItem.displayName = "@mantine/core/Pagination/DefaultItem";

exports.DefaultItem = DefaultItem;
//# sourceMappingURL=DefaultItem.js.map
