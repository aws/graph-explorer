/**
 * Assembles a query string, normalizing the whitespace of the literal template
 * scaffolding while preserving each interpolated value verbatim.
 *
 * The whitespace normalization — strip common indent, drop blank lines, trim
 * trailing whitespace — runs over the literal parts only. Values are held aside
 * as structural tokens and never spliced into a string the transforms inspect,
 * so a value with leading/trailing spaces, an embedded blank line, or one that
 * is entirely whitespace survives intact. A multi-line value's continuation
 * lines are still re-indented to the column where the value lands.
 */
export function query(
  literals: TemplateStringsArray,
  ...placeholders: unknown[]
): string {
  const values = placeholders.map(String);
  const lines = splitIntoLines(literals, values);
  const min = minCommonIndent(lines);
  return lines
    .filter(hasContent)
    .map(line => renderLine(line, values, min))
    .join("\n");
}

/**
 * Strips the smallest indentation shared by every non-blank line, then trims
 * surrounding whitespace. Replaces the `dedent` dependency, reproducing its
 * indentation behavior byte-for-byte. The minimum is computed over non-blank
 * lines only, so a blank line never forces the common indent to zero.
 */
export function stripCommonIndent(text: string): string {
  const lines = text.split("\n");
  let min: number | null = null;
  for (const line of lines) {
    const match = line.match(/^([ \t]+)\S/);
    if (match) {
      min = min === null ? match[1].length : Math.min(min, match[1].length);
    }
  }
  if (min === null) {
    return text.trim();
  }
  const width = min;
  return lines
    .map(line => (isIndented(line) ? line.slice(width) : line))
    .join("\n")
    .trim();
}

/** A part of a line: literal text, or a slot referencing a non-empty value. */
type LinePart = { text: string } | { valueIndex: number };
type Line = LinePart[];

/**
 * Interleaves literals and value slots into lines. A value slot is a structural
 * token, not text, so the whitespace normalization never touches a value's
 * bytes. An empty value contributes no token, so its line collapses exactly as
 * an empty scaffold line would.
 */
function splitIntoLines(
  literals: TemplateStringsArray,
  values: string[],
): Line[] {
  const lines: Line[] = [[]];
  function push(part: LinePart) {
    lines[lines.length - 1].push(part);
  }

  literals.forEach((literal, i) => {
    literal.split("\n").forEach((segment, segmentIndex) => {
      if (segmentIndex > 0) {
        lines.push([]);
      }
      if (segment !== "") {
        push({ text: segment });
      }
    });
    if (i < values.length && values[i] !== "") {
      push({ valueIndex: i });
    }
  });

  return lines;
}

/** Smallest leading-whitespace width across content lines, matching `stripCommonIndent`. */
function minCommonIndent(lines: Line[]): number {
  let min: number | null = null;
  for (const line of lines) {
    if (!hasContent(line)) {
      continue;
    }
    const width = leadingWhitespace(line).length;
    if (width > 0) {
      min = min === null ? width : Math.min(min, width);
    }
  }
  return min ?? 0;
}

function renderLine(line: Line, values: string[], min: number): string {
  let rendered = "";
  line.forEach((part, i) => {
    if ("valueIndex" in part) {
      rendered += indentContinuationLines(values[part.valueIndex], rendered);
      return;
    }
    const text =
      i === 0 && isIndented(part.text) ? part.text.slice(min) : part.text;
    rendered += i === line.length - 1 ? text.replace(/\s+$/, "") : text;
  });
  return rendered;
}

/** Re-indents every line after the first to the column reached on the current line. */
function indentContinuationLines(value: string, renderedSoFar: string): string {
  const valueLines = value.split("\n");
  if (valueLines.length === 1) {
    return value;
  }
  const column = renderedSoFar.length - (renderedSoFar.lastIndexOf("\n") + 1);
  const indent = " ".repeat(column);
  const [first, ...rest] = valueLines;
  return [first, ...rest.map(line => indent + line)].join("\n");
}

/** A line has content if it holds a value slot or any non-whitespace literal text. */
function hasContent(line: Line): boolean {
  return line.some(part =>
    "valueIndex" in part ? true : /\S/.test(part.text),
  );
}

/** Leading whitespace of a line — the spaces/tabs of its first literal part, if any. */
function leadingWhitespace(line: Line): string {
  const first = line[0];
  if (first === undefined || !("text" in first)) {
    return "";
  }
  return first.text.match(/^[ \t]*/)?.[0] ?? "";
}

function isIndented(line: string): boolean {
  return line[0] === " " || line[0] === "\t";
}
