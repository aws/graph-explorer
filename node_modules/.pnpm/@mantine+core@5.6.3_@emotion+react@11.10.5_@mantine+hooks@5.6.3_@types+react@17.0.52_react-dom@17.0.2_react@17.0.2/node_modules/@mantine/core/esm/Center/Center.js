import React, { forwardRef } from 'react';
import { useComponentDefaultProps } from '@mantine/styles';
import { packSx, createPolymorphicComponent } from '@mantine/utils';
import { Box } from '../Box/Box.js';

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
const _Center = forwardRef((props, ref) => {
  const _a = useComponentDefaultProps("Center", {}, props), { inline, sx } = _a, others = __objRest(_a, ["inline", "sx"]);
  return /* @__PURE__ */ React.createElement(Box, __spreadValues({
    ref,
    sx: [
      {
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      ...packSx(sx)
    ]
  }, others));
});
_Center.displayName = "@mantine/core/Center";
const Center = createPolymorphicComponent(_Center);

export { Center, _Center };
//# sourceMappingURL=Center.js.map
