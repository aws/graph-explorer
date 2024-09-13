import dedent from "dedent";

/** Removes leading space evenly across all lines and removes empty lines. */
export function query(
  literals: TemplateStringsArray,
  ...placeholders: string[]
) {
  return dedent(literals, ...placeholders).replace(/^\s*\n/gm, "");
}
