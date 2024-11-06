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
