import { createStyles } from '@mantine/styles';

var useStyles = createStyles((theme, { color, radius, withTitle }, getRef) => {
  const _radius = theme.fn.radius(radius);
  const topBottom = Math.min(Math.max(_radius / 1.2, 4), 30);
  const colors = theme.fn.variant({ variant: "filled", color });
  return {
    closeButton: theme.fn.hover({
      backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0]
    }),
    icon: {
      ref: getRef("icon"),
      boxSizing: "border-box",
      marginRight: theme.spacing.md,
      width: 28,
      height: 28,
      borderRadius: 28,
      display: "flex",
      flex: "none",
      alignItems: "center",
      justifyContent: "center",
      color: theme.white
    },
    withIcon: {
      paddingLeft: theme.spacing.xs,
      "&::before": {
        display: "none"
      }
    },
    root: {
      boxSizing: "border-box",
      position: "relative",
      display: "flex",
      alignItems: "center",
      paddingLeft: 22,
      paddingRight: 5,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.xs,
      borderRadius: _radius,
      backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
      boxShadow: theme.shadows.lg,
      border: `1px solid ${theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[2]}`,
      "&::before": {
        content: '""',
        display: "block",
        position: "absolute",
        width: 6,
        top: topBottom,
        bottom: topBottom,
        left: 4,
        borderRadius: _radius,
        backgroundColor: colors.background
      },
      [`& .${getRef("icon")}`]: {
        backgroundColor: colors.background,
        color: theme.white
      }
    },
    body: {
      flex: 1,
      overflow: "hidden",
      marginRight: 10
    },
    loader: {
      marginRight: theme.spacing.md
    },
    title: {
      lineHeight: 1.4,
      marginBottom: 2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      color: theme.colorScheme === "dark" ? theme.white : theme.colors.gray[9]
    },
    description: {
      color: withTitle ? theme.colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6] : theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
      lineHeight: 1.4,
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  };
});

export default useStyles;
//# sourceMappingURL=Notification.styles.js.map
