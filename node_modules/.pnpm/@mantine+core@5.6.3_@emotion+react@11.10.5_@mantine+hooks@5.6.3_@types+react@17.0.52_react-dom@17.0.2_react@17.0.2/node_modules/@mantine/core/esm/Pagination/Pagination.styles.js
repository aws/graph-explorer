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
  xs: 22,
  sm: 26,
  md: 32,
  lg: 38,
  xl: 44
};
var useStyles = createStyles((theme, { size, radius, color }) => {
  const colors = theme.fn.variant({ color, variant: "filled" });
  return {
    item: __spreadProps(__spreadValues(__spreadValues({}, theme.fn.fontStyles()), theme.fn.focusStyles()), {
      cursor: "pointer",
      userSelect: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: `1px solid ${theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[4]}`,
      color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
      height: theme.fn.size({ size, sizes }),
      minWidth: theme.fn.size({ size, sizes }),
      padding: `0 ${theme.fn.size({ size, sizes: theme.spacing }) / 2}px`,
      fontSize: theme.fn.size({ size, sizes: theme.fontSizes }),
      borderRadius: theme.fn.radius(radius),
      lineHeight: 1,
      backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
      "&:active:not(:disabled):not([data-dots])": theme.activeStyles,
      "&:disabled": {
        opacity: 0.6,
        cursor: "not-allowed",
        color: theme.colorScheme === "dark" ? theme.colors.dark[3] : theme.colors.gray[5]
      },
      "&[data-dots]": {
        cursor: "default",
        borderColor: "transparent",
        backgroundColor: "transparent"
      },
      "&[data-active]": {
        borderColor: "transparent",
        color: colors.color,
        backgroundColor: colors.background
      }
    })
  };
});

export default useStyles;
//# sourceMappingURL=Pagination.styles.js.map
