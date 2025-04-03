import dedent from "dedent";

/** Removes leading space evenly across all lines and removes empty lines. */
export function query(
  literals: TemplateStringsArray,
  ...placeholders: string[]
) {
  return dedent(literals, ...placeholders).replace(/^\s*\n/gm, "");
}

export function indentLinesBeyondFirst(str: string, indent: string) {
  return str
    .split("\n")
    .map((line, index) => (index > 0 ? indent + line : line))
    .join("\n");
}
