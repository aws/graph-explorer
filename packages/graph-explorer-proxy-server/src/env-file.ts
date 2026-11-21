import dotenv from "dotenv";

/** Zero or more blank or whitespace-only lines. */
const blankLines = String.raw`(?:[ \t]*\n)*`;

// The lines process-environment.sh appended on every start from v1.4.0 on,
// in their fixed order, with or without the blank lines between them. Their
// values restated the environment, config.json, or a default, which startup
// now reads directly. Each key starts a line, so the newline that ends the
// operator's last line stays theirs. A block takes the one blank line before
// it, as every appended block began with one.
const legacyStartupBlock = new RegExp(
  [
    String.raw`(?<=^|\n)(?:[ \t]*\n)?`,
    String.raw`NEPTUNE_NOTEBOOK=([^\n]+)\n`,
    String.raw`(?:${blankLines}(PROXY_SERVER(?:_HTTP)?_PORT=9250\n))?`,
    String.raw`(?:${blankLines}(LOG_STYLE=cloudwatch\n))?`,
    String.raw`${blankLines}PROXY_SERVER_HTTPS_CONNECTION=[^\n]+\n`,
    String.raw`${blankLines}GRAPH_EXP_HTTPS_CONNECTION=[^\n]+(?:\n|$)`,
  ].join(""),
  "g",
);

/**
 * Blanks the blocks of lines that earlier versions appended to `.env` at
 * every start, wherever they sit, and counts the lines ignored. Each block
 * becomes as many blank lines, so the lines that remain keep their numbers
 * in the file. Only whole blocks qualify, so a line the operator wrote
 * stays, even when it sets the same key. Line breaks come back as `\n`,
 * since dotenv reads CRLF and bare CR as line breaks too.
 */
export function stripLegacyStartupBlocks(text: string): {
  text: string;
  ignoredLineCount: number;
} {
  let ignoredLineCount = 0;
  const normalized = text.replace(/\r\n?/g, "\n");
  const blanked = normalized.replace(
    legacyStartupBlock,
    (
      block: string,
      notebook: string,
      port: string | undefined,
      logStyle: string | undefined,
    ) => {
      // The preset is the only reason for a port or log line, and it applies
      // only to an exact "true".
      const isPreset = port !== undefined || logStyle !== undefined;
      if (isPreset && notebook !== "true") {
        return block;
      }

      const newlines = block.split("\n").length - 1;
      ignoredLineCount += block.endsWith("\n") ? newlines : newlines + 1;
      return "\n".repeat(newlines);
    },
  );
  return { text: blanked, ignoredLineCount };
}

/** A `.env` file sets a key more than once. The message names the lines. */
export class EnvFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvFileError";
  }
}

// dotenv 18's own pattern for one assignment, so this check and `dotenv.parse`
// agree on which keys a file sets. A quoted value can span lines, and a key
// can sit a line break before its `=`. The first group holds what precedes
// the key, which gives the key's offset.
const assignment =
  /(?:^|^)(\s*(?:export\s+)?)([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

/**
 * Finds every key a `.env` file sets and the lines it sets it on, reading
 * the file the way `dotenv.parse` does.
 */
export function findAssignedKeyLines(text: string): Map<string, number[]> {
  const normalized = text.replace(/\r\n?/g, "\n");
  const linesByKey = new Map<string, number[]>();
  // Matches come in file order, so the line count only moves forward.
  let line = 1;
  let countedTo = 0;
  for (const match of normalized.matchAll(assignment)) {
    const [, beforeKey, key] = match;
    const keyStart = match.index + beforeKey.length;
    line += lineBreaksBetween(normalized, countedTo, keyStart);
    countedTo = keyStart;
    const lines = linesByKey.get(key);
    if (lines) {
      lines.push(line);
    } else {
      linesByKey.set(key, [line]);
    }
  }
  return linesByKey;
}

function lineBreaksBetween(text: string, start: number, end: number) {
  let count = 0;
  for (
    let index = text.indexOf("\n", start);
    index !== -1 && index < end;
    index = text.indexOf("\n", index + 1)
  ) {
    count++;
  }
  return count;
}

/**
 * Parses a `.env` file, and throws an {@link EnvFileError} naming the lines
 * of any key set on more than one of them, since only one can take effect.
 */
export function parseEnvFile(
  text: string,
  filePath: string,
): Record<string, string> {
  const linesByKey = findAssignedKeyLines(text);

  const duplicates = [...linesByKey]
    .filter(([, lines]) => lines.length > 1)
    .map(
      ([key, lines]) =>
        `${filePath} sets ${key} more than once, on lines ${new Intl.ListFormat("en").format(lines.map(String))}.`,
    );
  if (duplicates.length > 0) {
    throw new EnvFileError(
      `${duplicates.join(" ")} Keep one line for each key and remove the others. Earlier versions used the last line.`,
    );
  }
  return dotenv.parse(text);
}
