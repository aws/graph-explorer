import { describe, expect, it } from "vite-plus/test";

import {
  EnvFileError,
  parseEnvFile,
  stripLegacyStartupBlocks,
} from "./env-file.ts";
import { legacyStartupBlock, withoutBlankLines } from "./testing.ts";

const standardBlock = legacyStartupBlock({
  neptuneNotebook: "false",
  https: "true",
  graphExpHttps: "true",
});

/** The lines of a block that holds no port or log style: three lines and their blank lines. */
const standardBlockLines = 6;

/** A block an operator tidied by removing its blank lines. */
const tidiedBlock = withoutBlankLines(standardBlock);

/** The lines of a tidied block that holds no port or log style. */
const tidiedBlockLines = 3;

/** What an ignored block becomes, so every other line keeps its number in the file. */
function blankLines(count: number) {
  return "\n".repeat(count);
}

/**
 * BACKWARD COMPATIBILITY: LINES EARLIER VERSIONS APPENDED TO .env
 *
 * From v1.4.0 through v3.3.0, process-environment.sh appended a block of lines
 * to the mounted `.env` on every start: NEPTUNE_NOTEBOOK, then for the
 * notebook preset a port line (PROXY_SERVER_HTTP_PORT=9250 through v3.3.0,
 * PROXY_SERVER_PORT=9250 after) and LOG_STYLE=cloudwatch, then
 * PROXY_SERVER_HTTPS_CONNECTION, then GRAPH_EXP_HTTPS_CONNECTION. Anyone
 * upgrading from those versions has a configuration folder full of them,
 * sometimes tidied so the blank lines between them are gone.
 *
 * Do not delete while upgrades from 3.3.0 or earlier are supported.
 */
describe("backward compatibility: lines earlier versions appended to .env", () => {
  it("strips one block", () => {
    expect(stripLegacyStartupBlocks(standardBlock)).toStrictEqual({
      text: blankLines(standardBlockLines),
      ignoredLineCount: standardBlockLines,
    });
  });

  it("strips three repeated blocks", () => {
    expect(stripLegacyStartupBlocks(standardBlock.repeat(3))).toStrictEqual({
      text: blankLines(3 * standardBlockLines),
      ignoredLineCount: 3 * standardBlockLines,
    });
  });

  it("keeps the operator's lines before the blocks", () => {
    expect(
      stripLegacyStartupBlocks(`LOG_LEVEL=debug\n${standardBlock.repeat(2)}`),
    ).toStrictEqual({
      text: `LOG_LEVEL=debug\n${blankLines(2 * standardBlockLines)}`,
      ignoredLineCount: 2 * standardBlockLines,
    });
  });

  it.for([
    ["PROXY_SERVER_PORT", true],
    ["PROXY_SERVER_PORT", false],
    ["PROXY_SERVER_HTTP_PORT", true],
    ["PROXY_SERVER_HTTP_PORT", false],
    [undefined, true],
    [undefined, false],
  ] as const)(
    "strips a notebook block with port %s and log style %s",
    ([port, logStyle]) => {
      const block = legacyStartupBlock({
        neptuneNotebook: "true",
        port,
        logStyle: logStyle || undefined,
        https: "false",
        graphExpHttps: "false",
      });

      const ignoredLineCount =
        standardBlockLines + (port ? 2 : 0) + (logStyle ? 2 : 0);
      expect(stripLegacyStartupBlocks(block)).toStrictEqual({
        text: blankLines(ignoredLineCount),
        ignoredLineCount,
      });
    },
  );

  it("strips blocks with other values", () => {
    const block = legacyStartupBlock({
      neptuneNotebook: "TRUE",
      https: "TRUE",
      graphExpHttps: "yes",
    });

    expect(stripLegacyStartupBlocks(block).text).toBe(
      blankLines(standardBlockLines),
    );
  });

  it("keeps a lone PROXY_SERVER_HTTPS_CONNECTION=false the operator wrote", () => {
    const text = "PROXY_SERVER_HTTPS_CONNECTION=false\n";

    expect(stripLegacyStartupBlocks(text)).toStrictEqual({
      text,
      ignoredLineCount: 0,
    });
  });

  // The #2504 file: the operator's line, then what one start appended.
  it("keeps the operator's PROXY_SERVER_HTTPS_CONNECTION=false when a block follows it", () => {
    expect(
      stripLegacyStartupBlocks(
        `PROXY_SERVER_HTTPS_CONNECTION=false\n${standardBlock}`,
      ),
    ).toStrictEqual({
      text: `PROXY_SERVER_HTTPS_CONNECTION=false\n${blankLines(standardBlockLines)}`,
      ignoredLineCount: standardBlockLines,
    });
  });

  // The first block's leading newline ends the operator's last line, so it
  // adds one line fewer.
  it("counts a file without a trailing newline", () => {
    expect(
      stripLegacyStartupBlocks(`LOG_LEVEL=debug${standardBlock.repeat(2)}`),
    ).toStrictEqual({
      text: `LOG_LEVEL=debug${blankLines(2 * standardBlockLines)}`,
      ignoredLineCount: 2 * standardBlockLines - 1,
    });
  });

  it("keeps a port line in a block whose NEPTUNE_NOTEBOOK isn't true", () => {
    const text = legacyStartupBlock({
      neptuneNotebook: "false",
      port: "PROXY_SERVER_PORT",
      https: "false",
      graphExpHttps: "true",
    });

    expect(stripLegacyStartupBlocks(text)).toStrictEqual({
      text,
      ignoredLineCount: 0,
    });
  });

  it("strips a block followed by an operator line", () => {
    expect(
      stripLegacyStartupBlocks(`${standardBlock}LOG_LEVEL=debug\n`),
    ).toStrictEqual({
      text: `${blankLines(standardBlockLines)}LOG_LEVEL=debug\n`,
      ignoredLineCount: standardBlockLines,
    });
  });

  it("strips a block followed by a blank line", () => {
    expect(stripLegacyStartupBlocks(`${standardBlock}\n`)).toStrictEqual({
      text: blankLines(standardBlockLines + 1),
      ignoredLineCount: standardBlockLines,
    });
  });

  it("keeps the operator's own line between blocks", () => {
    expect(
      stripLegacyStartupBlocks(
        `${standardBlock}PROXY_SERVER_HTTPS_CONNECTION=false\n${standardBlock}`,
      ),
    ).toStrictEqual({
      text: `${blankLines(standardBlockLines)}PROXY_SERVER_HTTPS_CONNECTION=false\n${blankLines(standardBlockLines)}`,
      ignoredLineCount: 2 * standardBlockLines,
    });
  });

  it("keeps the operator's lines apart when a block sits between lines without a newline", () => {
    expect(stripLegacyStartupBlocks(`A=1${standardBlock}B=2\n`)).toStrictEqual({
      text: `A=1${blankLines(standardBlockLines)}B=2\n`,
      ignoredLineCount: standardBlockLines - 1,
    });
  });

  it("keeps a block that is missing a line", () => {
    const text =
      "\nNEPTUNE_NOTEBOOK=false\n\nPROXY_SERVER_HTTPS_CONNECTION=true\n";

    expect(stripLegacyStartupBlocks(text)).toStrictEqual({
      text,
      ignoredLineCount: 0,
    });
  });

  it("strips a block with every blank line removed", () => {
    expect(stripLegacyStartupBlocks(tidiedBlock)).toStrictEqual({
      text: blankLines(tidiedBlockLines),
      ignoredLineCount: tidiedBlockLines,
    });
  });

  it("strips three tidied blocks in a row", () => {
    expect(stripLegacyStartupBlocks(tidiedBlock.repeat(3))).toStrictEqual({
      text: blankLines(3 * tidiedBlockLines),
      ignoredLineCount: 3 * tidiedBlockLines,
    });
  });

  it("strips tidied and original blocks mixed", () => {
    expect(
      stripLegacyStartupBlocks(
        `LOG_LEVEL=debug\n${standardBlock}${tidiedBlock}${standardBlock}`,
      ),
    ).toStrictEqual({
      text: `LOG_LEVEL=debug\n${blankLines(2 * standardBlockLines + tidiedBlockLines)}`,
      ignoredLineCount: 2 * standardBlockLines + tidiedBlockLines,
    });
  });

  it("strips a tidied notebook block with its port and log style", () => {
    const block = withoutBlankLines(
      legacyStartupBlock({
        neptuneNotebook: "true",
        port: "PROXY_SERVER_HTTP_PORT",
        logStyle: true,
        https: "false",
        graphExpHttps: "false",
      }),
    );

    expect(stripLegacyStartupBlocks(block)).toStrictEqual({
      text: blankLines(5),
      ignoredLineCount: 5,
    });
  });

  it("strips a block whose blank lines hold whitespace", () => {
    expect(
      stripLegacyStartupBlocks(standardBlock.replaceAll("\n\n", "\n \t\n")),
    ).toStrictEqual({
      text: blankLines(standardBlockLines),
      ignoredLineCount: standardBlockLines,
    });
  });

  // Each appended block began with a blank line, so one blank line before a
  // tidied block is the block's, and the rest are the operator's.
  it("counts one blank line before a tidied block and none after it", () => {
    expect(
      stripLegacyStartupBlocks(`A=1\n\n\n${tidiedBlock}\n\nB=2\n`),
    ).toStrictEqual({
      text: `A=1\n${blankLines(2 + tidiedBlockLines + 2)}B=2\n`,
      ignoredLineCount: tidiedBlockLines + 1,
    });
  });

  it("strips a tidied block that ends the file without a newline", () => {
    expect(
      stripLegacyStartupBlocks(`LOG_LEVEL=debug\n${tidiedBlock.trimEnd()}`),
    ).toStrictEqual({
      text: `LOG_LEVEL=debug\n${blankLines(tidiedBlockLines - 1)}`,
      ignoredLineCount: tidiedBlockLines,
    });
  });

  it("keeps a tidied block with an operator line between two keys", () => {
    const text =
      "NEPTUNE_NOTEBOOK=false\nLOG_LEVEL=debug\nPROXY_SERVER_HTTPS_CONNECTION=false\nGRAPH_EXP_HTTPS_CONNECTION=true\n";

    expect(stripLegacyStartupBlocks(text)).toStrictEqual({
      text,
      ignoredLineCount: 0,
    });
  });

  it("keeps a tidied block whose first key is inside another line", () => {
    const text = `# ${tidiedBlock}`;

    expect(stripLegacyStartupBlocks(text)).toStrictEqual({
      text,
      ignoredLineCount: 0,
    });
  });

  it("keeps a block whose NEPTUNE_NOTEBOOK isn't true and strips the standard block after it", () => {
    const handEdited = legacyStartupBlock({
      neptuneNotebook: "false",
      port: "PROXY_SERVER_PORT",
      https: "false",
      graphExpHttps: "true",
    });

    expect(
      stripLegacyStartupBlocks(`${handEdited}${standardBlock}`),
    ).toStrictEqual({
      text: `${handEdited}${blankLines(standardBlockLines)}`,
      ignoredLineCount: standardBlockLines,
    });
  });

  it("keeps the on-disk line numbers of a key set on both sides of a block", () => {
    const { text } = stripLegacyStartupBlocks(
      `LOG_STYLE=default\n${standardBlock}LOG_STYLE=cloudwatch\n`,
    );

    expect(text.split("\n").slice(0, 8)).toStrictEqual([
      "LOG_STYLE=default",
      ...Array<string>(6).fill(""),
      "LOG_STYLE=cloudwatch",
    ]);
  });

  it("strips a tidied block with several blank lines between two of its keys", () => {
    expect(
      stripLegacyStartupBlocks(
        "NEPTUNE_NOTEBOOK=false\n\n\n\nPROXY_SERVER_HTTPS_CONNECTION=true\nGRAPH_EXP_HTTPS_CONNECTION=true\n",
      ),
    ).toStrictEqual({ text: blankLines(6), ignoredLineCount: 6 });
  });

  it("takes a whitespace-only line as the blank line before a block", () => {
    expect(
      stripLegacyStartupBlocks(`LOG_LEVEL=debug\n  \t\n${tidiedBlock}`),
    ).toStrictEqual({
      text: `LOG_LEVEL=debug\n${blankLines(tidiedBlockLines + 1)}`,
      ignoredLineCount: tidiedBlockLines + 1,
    });
  });

  it.for([
    ["CRLF", "\r\n"],
    ["bare CR", "\r"],
  ])("finds blocks written with %s line breaks", ([, lineBreak]) => {
    expect(
      stripLegacyStartupBlocks(
        `LOG_LEVEL=debug\n${standardBlock}${tidiedBlock}`.replaceAll(
          "\n",
          lineBreak,
        ),
      ),
    ).toStrictEqual({
      text: `LOG_LEVEL=debug\n${blankLines(standardBlockLines + tidiedBlockLines)}`,
      ignoredLineCount: standardBlockLines + tidiedBlockLines,
    });
  });

  it("leaves a file with no blocks as it was", () => {
    const text = "LOG_LEVEL=debug\nHOST=example.com\n";

    expect(stripLegacyStartupBlocks(text)).toStrictEqual({
      text,
      ignoredLineCount: 0,
    });
    expect(stripLegacyStartupBlocks("")).toStrictEqual({
      text: "",
      ignoredLineCount: 0,
    });
  });
});

describe("parseEnvFile", () => {
  const filePath = "/config/.env";

  it("reads the values", () => {
    expect(parseEnvFile("A=1\nB=two\n", filePath)).toStrictEqual({
      A: "1",
      B: "two",
    });
  });

  it("throws naming the file, the key, and its lines when a key is set more than once", () => {
    expect(() =>
      parseEnvFile(
        "LOG_STYLE=default\nHOST=x\nLOG_STYLE=cloudwatch\n",
        filePath,
      ),
    ).toThrow(
      new EnvFileError(
        "/config/.env sets LOG_STYLE more than once, on lines 1 and 3. Keep one line for each key and remove the others. Earlier versions used the last line.",
      ),
    );
  });

  it("names every key set more than once", () => {
    expect(() => parseEnvFile("A=1\nB=1\nA=2\nB=2\nA=3\n", filePath)).toThrow(
      new EnvFileError(
        "/config/.env sets A more than once, on lines 1, 3, and 5. /config/.env sets B more than once, on lines 2 and 4. Keep one line for each key and remove the others. Earlier versions used the last line.",
      ),
    );
  });

  it.for([
    ["a colon", "A=1\nA: 2\n", "1 and 2"],
    ["CRLF line breaks", "A=1\r\nA=2\r\n", "1 and 2"],
    ["bare CR line breaks", "A=1\rB=2\rA=3\r", "1 and 3"],
    ["the export prefix", "A=1\nexport A=2\n", "1 and 2"],
  ])("throws for a key set twice with %s", ([, text, lines]) => {
    expect(() => parseEnvFile(text, filePath)).toThrow(
      new EnvFileError(
        `/config/.env sets A more than once, on lines ${lines}. Keep one line for each key and remove the others. Earlier versions used the last line.`,
      ),
    );
  });

  it("doesn't count a colon without a space after it, as dotenv doesn't", () => {
    expect(parseEnvFile("A=1\nA:2\n", filePath)).toStrictEqual({ A: "1" });
  });

  it("accepts different keys, comments, and similar names", () => {
    expect(
      parseEnvFile("# A=1\nA=1\nGRAPH_A=2\nexport B=3\n", filePath),
    ).toStrictEqual({ A: "1", GRAPH_A: "2", B: "3" });
  });
});
