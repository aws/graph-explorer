import { createStyles } from '@mantine/styles';

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
  xs: 8,
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20
};
var useStyles = createStyles((theme, {
  size,
  radius,
  color,
  transitionDuration,
  labelPosition,
  error,
  indeterminate
}, getRef) => {
  const _size = theme.fn.size({ size, sizes });
  const colors = theme.fn.variant({ variant: "filled", color });
  const errorColor = theme.fn.variant({ variant: "filled", color: "red" }).background;
  return {
    icon: {
      ref: getRef("icon"),
      color: indeterminate ? "inherit" : theme.white,
      transform: indeterminate ? "none" : "translateY(5px) scale(0.5)",
      opacity: indeterminate ? 1 : 0,
      transitionProperty: "opacity, transform",
      transitionTimingFunction: "ease",
      transitionDuration: `${transitionDuration}ms`,
      pointerEvents: "none",
      width: theme.fn.size({ size, sizes: iconSizes }),
      position: "absolute",
      zIndex: 1,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      margin: "auto",
      "@media (prefers-reduced-motion)": {
        transitionDuration: theme.respectReducedMotion ? "0ms" : void 0
      }
    },
    inner: {
      position: "relative",
      width: _size,
      height: _size,
      order: labelPosition === "left" ? 2 : 1
    },
    input: __spreadProps(__spreadValues({}, theme.fn.focusStyles()), {
      appearance: "none",
      backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
      border: `1px solid ${error ? errorColor : theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[4]}`,
      width: _size,
      height: _size,
      borderRadius: theme.fn.radius(radius),
      padding: 0,
      display: "block",
      margin: 0,
      transition: `border-color ${transitionDuration}ms ease, background-color ${transitionDuration}ms ease`,
      cursor: theme.cursorType,
      "&:checked": {
        backgroundColor: colors.background,
        borderColor: colors.background,
        [`& + .${getRef("icon")}`]: {
          opacity: 1,
          color: theme.white,
          transform: "translateY(0) scale(1)"
        }
      },
      "&:disabled": {
        backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2],
        borderColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[3],
        cursor: "not-allowed",
        [`& + .${getRef("icon")}`]: {
          color: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[5]
        }
      }
    })
  };
});

export default useStyles;
//# sourceMappingURL=Checkbox.styles.js.map
