'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var styles = require('@mantine/styles');

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
const sizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 30,
  xl: 36
};
const iconSizes = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 16
};
var useStyles = styles.createStyles((theme, { size, color, transitionDuration, labelPosition, error }, getRef) => {
  const colors = theme.fn.variant({ variant: "filled", color });
  const errorColor = theme.fn.variant({ variant: "filled", color: "red" }).background;
  return {
    inner: {
      order: labelPosition === "left" ? 2 : 1,
      position: "relative",
      alignSelf: "flex-start"
    },
    icon: {
      ref: getRef("icon"),
      color: theme.white,
      opacity: 0,
      transform: "scale(0.75) translateY(2px)",
      transition: `opacity ${transitionDuration}ms ${theme.transitionTimingFunction}`,
      pointerEvents: "none",
      width: theme.fn.size({ sizes: iconSizes, size }),
      height: theme.fn.size({ sizes: iconSizes, size }),
      position: "absolute",
      top: `calc(50% - ${theme.fn.size({ sizes: iconSizes, size }) / 2}px)`,
      left: `calc(50% - ${theme.fn.size({ sizes: iconSizes, size }) / 2}px)`
    },
    radio: __spreadProps(__spreadValues({}, theme.fn.focusStyles()), {
      backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
      border: `1px solid ${error ? errorColor : theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[4]}`,
      position: "relative",
      appearance: "none",
      width: theme.fn.size({ sizes, size }),
      height: theme.fn.size({ sizes, size }),
      borderRadius: theme.fn.size({ sizes, size }),
      margin: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transitionProperty: "background-color, border-color",
      transitionTimingFunction: theme.transitionTimingFunction,
      transitionDuration: `${transitionDuration}ms`,
      cursor: theme.cursorType,
      "&:checked": {
        background: colors.background,
        borderColor: colors.background,
        [`& + .${getRef("icon")}`]: {
          opacity: 1,
          transform: "scale(1)"
        }
      },
      "&:disabled": {
        borderColor: theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[4],
        backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[1],
        [`& + .${getRef("icon")}`]: {
          color: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[4]
        }
      }
    })
  };
});

exports.default = useStyles;
//# sourceMappingURL=Radio.styles.js.map
