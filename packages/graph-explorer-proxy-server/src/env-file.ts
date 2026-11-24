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
