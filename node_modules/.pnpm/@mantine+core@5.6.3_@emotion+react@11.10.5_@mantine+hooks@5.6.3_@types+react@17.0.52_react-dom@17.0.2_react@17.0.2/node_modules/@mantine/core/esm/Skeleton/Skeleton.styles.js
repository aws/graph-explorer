import { createStyles, keyframes } from '@mantine/styles';

const fade = keyframes({
  "from, to": { opacity: 0.4 },
  "50%": { opacity: 1 }
});
var useStyles = createStyles((theme, { height, width, radius, circle, animate }) => ({
  root: {
    height,
    width: circle ? height : width,
    borderRadius: circle ? height : theme.fn.radius(radius),
    position: "relative",
    overflow: "hidden",
    WebkitTransform: "translateZ(0)"
  },
  visible: {
    "&::before": {
      content: '""',
      position: "absolute",
      background: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10
    },
    "&::after": {
      content: '""',
      position: "absolute",
      background: theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3],
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      animation: animate ? `${fade} 1500ms linear infinite` : "none",
      zIndex: 11
    }
  }
}));

export default useStyles;
export { fade };
//# sourceMappingURL=Skeleton.styles.js.map
