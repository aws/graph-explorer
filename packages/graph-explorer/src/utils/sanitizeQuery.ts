import dedent from "dedent";

/** Removes leading space evenly across all lines and removes empty lines. */
export function query(
  literals: TemplateStringsArray,
  ...placeholders: string[]
) {
  // Ensure any parameters are properly indented
  const indented = indentTemplate(literals, ...placeholders);
  return (
    // Remove leading space
    dedent(indented)
      // Remove empty lines
      .replace(/^\s*\n/gm, "")
      // Remove trailing whitespace
      .replace(/\s+$/gm, "")
  );
}

/** Ensures that all multi-line template values match the indentation of the line where they are used. */
function indentTemplate(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  return strings.reduce((result, str, i) => {
    // Coerce the current value to a string
    const value = i < values.length ? String(values[i]) : "";

    // Get the amount of indentation to add
    const lines = str.split("\n");
    const lastLine = lines[lines.length - 1];
    const match = lastLine.match(/^( *)/); // capture leading spaces
    const indent = match?.[1] ?? "";

    // Add indentation to any lines after the first
    const valueLines = value.split("\n");
    const indentedValue =
      valueLines.length > 1
        ? valueLines[0] +
          "\n" +
          valueLines
            .slice(1)
            .map(line => indent + line)
            .join("\n")
        : value;

    // Concatenate the result with the indented string
    return result + str + indentedValue;
  }, "");
}
