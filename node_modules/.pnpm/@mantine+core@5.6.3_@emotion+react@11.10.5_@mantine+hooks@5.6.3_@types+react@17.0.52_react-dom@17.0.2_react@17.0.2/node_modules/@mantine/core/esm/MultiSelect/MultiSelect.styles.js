import { createStyles } from '@mantine/styles';
import { sizes } from '../Input/Input.styles.js';

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
var useStyles = createStyles((theme, { size, invalid }) => ({
  wrapper: {
    position: "relative"
  },
  values: {
    minHeight: theme.fn.size({ size, sizes: sizes }) - 2,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    marginLeft: `calc(${-theme.spacing.xs}px / 2)`,
    boxSizing: "border-box"
  },
  value: {
    margin: `calc(${theme.spacing.xs}px / 2 - 2px) calc(${theme.spacing.xs}px / 2)`
  },
  searchInput: __spreadProps(__spreadValues({}, theme.fn.fontStyles()), {
    flex: 1,
    minWidth: 60,
    backgroundColor: "transparent",
    border: 0,
    outline: 0,
    fontSize: theme.fn.size({ size, sizes: theme.fontSizes }),
    padding: 0,
    marginLeft: `calc(${theme.spacing.xs}px / 2)`,
    appearance: "none",
    color: "inherit",
    lineHeight: `${theme.fn.size({ size, sizes: sizes }) - 2}px`,
    "&::placeholder": {
      opacity: 1,
      color: invalid ? theme.colors.red[theme.colorScheme === "dark" ? 6 : 7] : theme.colorScheme === "dark" ? theme.colors.dark[3] : theme.colors.gray[5]
    },
    "&:disabled": {
      cursor: "not-allowed"
    }
  }),
  searchInputEmpty: {
    width: "100%"
  },
  searchInputInputHidden: {
    width: 0,
    height: 0,
    margin: 0,
    overflow: "hidden"
  },
  searchInputPointer: {
    cursor: "pointer",
    "&:disabled": {
      cursor: "not-allowed"
    }
  },
  input: {
    cursor: "pointer",
    "&:disabled": {
      cursor: "not-allowed"
    }
  }
}));

export default useStyles;
//# sourceMappingURL=MultiSelect.styles.js.map
