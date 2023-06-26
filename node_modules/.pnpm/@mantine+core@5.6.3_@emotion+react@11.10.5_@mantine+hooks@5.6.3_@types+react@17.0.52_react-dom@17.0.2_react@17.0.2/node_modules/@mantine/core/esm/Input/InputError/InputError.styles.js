import { createStyles } from '@mantine/styles';

var useStyles = createStyles((theme, { size }) => ({
  error: {
    wordBreak: "break-word",
    color: theme.fn.variant({ variant: "filled", color: "red" }).background,
    fontSize: theme.fn.size({ size, sizes: theme.fontSizes }) - 2,
    lineHeight: 1.2,
    display: "block"
  }
}));

export default useStyles;
//# sourceMappingURL=InputError.styles.js.map
