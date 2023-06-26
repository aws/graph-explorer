import { createStyles } from '@mantine/styles';

var useStyles = createStyles((theme, { size }) => ({
  input: {
    fontFamily: theme.fontFamilyMonospace,
    fontSize: theme.fn.size({ size, sizes: theme.fontSizes }) - 2
  }
}));

export default useStyles;
//# sourceMappingURL=JsonInput.styles.js.map
