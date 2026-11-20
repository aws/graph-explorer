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

const assignment = /^\s*(?:export\s+)?([\w.-]+)(?:\s*=|:\s)/;

/**
 * Parses a `.env` file, and throws an {@link EnvFileError} naming the lines
 * of any key set on more than one of them, since only one can take effect.
 */
export function parseEnvFile(
  text: string,
  filePath: string,
): Record<string, string> {
  const linesByKey = new Map<string, number[]>();
  text.split(/\r\n?|\n/).forEach((line, index) => {
    const key = assignment.exec(line)?.[1];
    if (key !== undefined) {
      linesByKey.set(key, [...(linesByKey.get(key) ?? []), index + 1]);
    }
  });

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
