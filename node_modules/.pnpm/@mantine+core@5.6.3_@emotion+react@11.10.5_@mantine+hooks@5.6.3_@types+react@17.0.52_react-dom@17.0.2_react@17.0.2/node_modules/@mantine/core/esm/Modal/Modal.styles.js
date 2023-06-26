import { createStyles } from '@mantine/styles';

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
const sizes = {
  xs: 320,
  sm: 380,
  md: 440,
  lg: 620,
  xl: 780
};
function getFullScreenStyles(fullScreen) {
  if (!fullScreen) {
    return {};
  }
  return {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "100vh",
    overflowY: "auto"
  };
}
var useStyles = createStyles((theme, { overflow, size, centered, zIndex, fullScreen }) => ({
  close: {},
  overlay: {
    display: fullScreen ? "none" : void 0
  },
  root: {
    position: "fixed",
    zIndex,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  inner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: "auto",
    padding: fullScreen ? 0 : `${theme.spacing.xl * 2}px ${theme.spacing.md}px`,
    display: "flex",
    justifyContent: "center",
    alignItems: centered ? "center" : "flex-start"
  },
  title: {
    marginRight: theme.spacing.md,
    textOverflow: "ellipsis",
    display: "block",
    wordBreak: "break-word"
  },
  modal: __spreadValues({
    position: "relative",
    width: fullScreen ? "100vw" : theme.fn.size({ sizes, size }),
    borderRadius: fullScreen ? 0 : void 0,
    outline: 0,
    backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    marginTop: centered ? "auto" : void 0,
    marginBottom: centered ? "auto" : void 0,
    zIndex: 1
  }, getFullScreenStyles(fullScreen)),
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
    marginRight: -9
  },
  body: {
    maxHeight: overflow === "inside" ? "calc(100vh - 185px)" : null,
    overflowY: overflow === "inside" ? "auto" : null,
    wordBreak: "break-word"
  }
}));

export default useStyles;
//# sourceMappingURL=Modal.styles.js.map
