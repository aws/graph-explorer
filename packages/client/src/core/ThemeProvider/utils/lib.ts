import Color from "color";

const isColor = (stringToTest: string) => {
  try {
    Color(stringToTest);
    return true;
  } catch (e) {
    return false;
  }
};

const isPaletteColor = (parentPropertyKey: string) => {
  return parentPropertyKey.includes("palette");
};

const colorAsRgb = (colorStr: string, parentPropertyKey: string) => {
  try {
    if (isPaletteColor(parentPropertyKey)) {
      return Color(colorStr).rgb().array().join(",");
    }
  } catch (e) {
    return colorStr;
  }

  return colorStr;
};

export const getCSSVariablesFromTheme = (
  theme: object
): Record<string, unknown> => {
  const generateVariables = (theme: object, key = ""): object =>
    Object.keys(theme).reduce((acc, value) => {
      const isString = typeof theme[value as keyof typeof theme] === "string";
      const isNumber = typeof theme[value as keyof typeof theme] === "number";
      const KEY = key.toLowerCase();
      const VALUE = value.toLowerCase();
      const themeValue = theme[value as keyof typeof theme];
      const colorRgb =
        isString && isColor(themeValue)
          ? { [`-${KEY}-${VALUE}-rgb`]: colorAsRgb(themeValue, KEY) }
          : {};
      return {
        ...acc,
        ...(isString || isNumber
          ? {
              [`-${KEY}-${VALUE}`]: themeValue,
              ...colorRgb,
            }
          : generateVariables(themeValue, `${KEY}-${VALUE}`)),
      };
    }, {});

  if (!theme) {
    return {
      html: {},
    };
  }

  const result = generateVariables(theme);
  return {
    html: result,
  };
};

export const generateCssVariable = (...vars: string[]): string => {
  if (vars.length === 0) {
    return "";
  }

  if (vars.length === 1) {
    return `var(${vars[0]})`;
  }

  const reversedVars = vars.reverse();
  let composedStr = `var(${reversedVars[1]}, ${reversedVars[0]})`;
  let index = 2;

  while (index < reversedVars.length) {
    composedStr = `var(${reversedVars[index]}, ${composedStr})`;
    index += 1;
  }

  return composedStr;
};

// This is a short alias
export const cssVar = generateCssVariable;
type Option = {
  [attributeValue: string]: string;
};

export const cssConditionalValue = (options: Option, defaultValue?: string) => (
  attributeValue?: string
) => {
  if (attributeValue) {
    return (
      options[attributeValue] ||
      defaultValue ||
      options[Object.keys(attributeValue)[0]]
    );
  }
  return defaultValue;
};

export const isDarkMode = () => document.body.classList.contains("ft-dark");
