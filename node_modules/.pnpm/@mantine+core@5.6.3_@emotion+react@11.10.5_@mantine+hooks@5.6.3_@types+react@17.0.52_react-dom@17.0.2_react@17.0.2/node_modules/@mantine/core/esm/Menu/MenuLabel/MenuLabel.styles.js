import { createStyles } from '@mantine/styles';

var useStyles = createStyles((theme) => ({
  label: {
    color: theme.colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6],
    fontWeight: 500,
    fontSize: theme.fontSizes.xs,
    padding: `calc(${theme.spacing.xs}px / 2) ${theme.spacing.sm}px`,
    cursor: "default"
  }
}));

export default useStyles;
//# sourceMappingURL=MenuLabel.styles.js.map
