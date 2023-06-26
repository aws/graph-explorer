import { createStyles } from '@mantine/styles';

var useStyles = createStyles((theme, { padding, withBorder, inheritPadding }) => {
  const spacing = theme.fn.size({ size: padding, sizes: theme.spacing });
  const offset = -1 * spacing;
  const borderColor = theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3];
  return {
    cardSection: {
      display: "block",
      marginLeft: offset,
      marginRight: offset,
      paddingLeft: inheritPadding ? spacing : void 0,
      paddingRight: inheritPadding ? spacing : void 0,
      borderTop: withBorder && `1px solid ${borderColor}`,
      borderBottom: withBorder && `1px solid ${borderColor}`,
      "& + &": {
        borderTop: 0
      },
      "&[data-first]": {
        marginTop: offset,
        borderTop: 0,
        borderBottom: withBorder && `1px solid ${borderColor}`
      },
      "&[data-last]": {
        marginBottom: offset,
        borderBottom: 0
      }
    }
  };
});

export default useStyles;
//# sourceMappingURL=CardSection.styles.js.map
