import React from 'react';
import { useMantineTheme } from '@mantine/styles';
import { DotsIcon } from '../icons/DotsIcon.js';
import { NextIcon } from '../icons/NextIcon.js';
import { PrevIcon } from '../icons/PrevIcon.js';
import { FirstIcon } from '../icons/FirstIcon.js';
import { LastIcon } from '../icons/LastIcon.js';

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
  dots: DotsIcon,
  next: NextIcon,
  prev: PrevIcon,
  first: FirstIcon,
  last: LastIcon
};
const rtlIcons = {
  dots: DotsIcon,
  prev: NextIcon,
  next: PrevIcon,
  last: FirstIcon,
  first: LastIcon
};
function DefaultItem(_a) {
  var _b = _a, { page, active, onClick } = _b, others = __objRest(_b, ["page", "active", "onClick"]);
  const theme = useMantineTheme();
  const Item = (theme.dir === "rtl" ? rtlIcons : icons)[page];
  const children = Item ? /* @__PURE__ */ React.createElement(Item, null) : page;
  return /* @__PURE__ */ React.createElement("button", __spreadValues({
    type: "button",
    onClick
  }, others), children);
}
DefaultItem.displayName = "@mantine/core/Pagination/DefaultItem";

export { DefaultItem };
//# sourceMappingURL=DefaultItem.js.map
