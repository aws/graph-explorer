import fs from "fs";
import { z } from "zod";

import { isMissingFileError } from "./paths.ts";

/** The `config.json` can't be read, which stops startup. The message names the file. */
export class ConfigJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigJsonError";
  }
}

/** The settings `config.json` can hold, in the order the docs list them. */
export const configJsonKeys = [
  "PUBLIC_OR_PROXY_ENDPOINT",
  "GRAPH_TYPE",
  "SERVICE_TYPE",
  "USING_PROXY_SERVER",
  "IAM",
  "GRAPH_CONNECTION_URL",
  "AWS_REGION",
  "PROXY_SERVER_HTTPS_CONNECTION",
  "GRAPH_EXP_HTTPS_CONNECTION",
  "NEPTUNE_NOTEBOOK",
  "GRAPH_EXP_FETCH_REQUEST_TIMEOUT",
  "GRAPH_EXP_NODE_EXPANSION_LIMIT",
] as const;

export type ConfigJsonKey = (typeof configJsonKeys)[number];

/** The settings that make up the Default Connection, which `.env` files can hold too. */
export const defaultConnectionKeys = configJsonKeys.filter(
  key =>
    key !== "PROXY_SERVER_HTTPS_CONNECTION" &&
    key !== "GRAPH_EXP_HTTPS_CONNECTION" &&
    key !== "NEPTUNE_NOTEBOOK",
);

/**
 * How a setting is read. A scalar takes any JSON scalar as its text, and a
 * text setting only takes a string.
 */
type SettingKind = "scalar" | "text";

const settingKinds: Record<ConfigJsonKey, SettingKind> = {
  PUBLIC_OR_PROXY_ENDPOINT: "text",
  GRAPH_TYPE: "text",
  SERVICE_TYPE: "text",
  USING_PROXY_SERVER: "scalar",
  IAM: "scalar",
  GRAPH_CONNECTION_URL: "text",
  AWS_REGION: "text",
  PROXY_SERVER_HTTPS_CONNECTION: "scalar",
  GRAPH_EXP_HTTPS_CONNECTION: "scalar",
  NEPTUNE_NOTEBOOK: "scalar",
  GRAPH_EXP_FETCH_REQUEST_TIMEOUT: "scalar",
  GRAPH_EXP_NODE_EXPANSION_LIMIT: "scalar",
};

/**
 * The settings in text form, as the environment holds them, so config.json
 * and the environment can be read alike. A setting that is unset or empty is
 * absent.
 */
export type ConfigJson = {
  values: Partial<Record<ConfigJsonKey, string>>;
  warnings: string[];
};

const SettingsSchema = z.record(z.string(), z.json());
type JsonValue = z.infer<typeof SettingsSchema>[string];

/**
 * Reads the settings from the text of a `config.json`. It accepts `//` and
 * block comments and trailing commas, and throws a {@link ConfigJsonError}
 * naming `filePath` for text that is empty, holds only comments, or isn't JSON
 * even then. A leading byte-order mark is skipped. A setting that only a
 * comment holds is unset, and a key set more than once, a setting or not,
 * throws, since only one value can take effect. A number too large for a
 * double reads as its text.
 */
export function parseConfigJson(text: string, filePath: string): ConfigJson {
  const lenientText = lenientJsonText(text.replace(/^\uFEFF/, ""), filePath);
  if (lenientText.trim() === "") {
    throw new ConfigJsonError(
      `${filePath} is empty or holds only comments. Add settings to it, or remove the file to start without them.`,
    );
  }

  // JSON.parse reads a number too large for a double as Infinity, which no
  // setting can hold, so such a number keeps its text, as the scripts read it.
  const oversizedNumbers: { holder: unknown; key: string }[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      lenientText,
      function keepOversizedNumbers(
        this: unknown,
        key: string,
        value: unknown,
        context?: { source: string },
      ) {
        if (typeof value === "number" && !Number.isFinite(value) && context) {
          oversizedNumbers.push({ holder: this, key });
          return context.source;
        }
        return value;
      },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ConfigJsonError(
        `${filePath} isn't valid JSON, so Graph Explorer can't read its settings: ${error.message}`,
      );
    }
    throw error;
  }

  const settings = SettingsSchema.safeParse(parsed);
  if (!settings.success) {
    throw new ConfigJsonError(
      `${filePath} must hold a JSON object of settings.`,
    );
  }

  const duplicates = [...topLevelKeyLines(lenientText)].flatMap(
    ([key, lines]) =>
      lines.length > 1
        ? [
            `${filePath} sets ${key} more than once, on lines ${new Intl.ListFormat("en").format(lines.map(String))}.`,
          ]
        : [],
  );
  if (duplicates.length > 0) {
    throw new ConfigJsonError(
      `${duplicates.join(" ")} Keep one entry for each setting and remove the others.`,
    );
  }

  const warnings: string[] = [];
  const values: ConfigJson["values"] = {};
  const oversizedSettings = new Set(
    oversizedNumbers
      .filter(({ holder }) => holder === parsed)
      .map(({ key }) => key),
  );
  for (const key of configJsonKeys) {
    const value = settings.data[key];
    if (value === undefined) {
      continue;
    }
    const setting = readSetting(
      settingKinds[key],
      value,
      oversizedSettings.has(key),
    );
    if (setting === undefined) {
      warnings.push(
        `${filePath}: ${key} can't be ${JSON.stringify(value)}, so it is ignored.`,
      );
    } else if (setting !== "") {
      values[key] = setting;
    }
  }
  return { values, warnings };
}

/**
 * The setting as text, `""` for a value that counts as unset, or `undefined`
 * for a value the setting can't hold. `oversizedNumber` says the value is the
 * text of a number too large for a double.
 */
function readSetting(
  kind: SettingKind,
  value: JsonValue,
  oversizedNumber: boolean,
) {
  if (typeof value === "object" && value !== null) {
    return undefined;
  }
  switch (kind) {
    case "scalar":
      return typeof value === "string"
        ? value.replace(/\s/g, "")
        : String(value);
    case "text":
      // A null, number, or boolean was never a string to read.
      return typeof value === "string" && !oversizedNumber ? value : "";
  }
}

/**
 * Blanks `//` and block comments, and any comma that only precedes a closing
 * brace or bracket, leaving strings untouched. Line breaks stay, so a syntax
 * error is reported at its place in the file. A `//` comment ends at a CR or
 * LF, and a block comment that never ends throws a {@link ConfigJsonError}
 * naming `filePath`. The result is JSON when the input is JSON apart from
 * those two allowances.
 */
function lenientJsonText(text: string, filePath: string) {
  // Built as chunks and joined once, so blanking a comma doesn't copy the text.
  const chunks: string[] = [];
  let inString = false;
  // Which chunk holds the last comma outside a string, until something other
  // than whitespace follows it.
  let pendingComma = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      chunks.push(char);
      if (char === "\\") {
        chunks.push(text[++i] ?? "");
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === "/" && text[i + 1] === "/") {
      let stop = i;
      while (stop < text.length && text[stop] !== "\n" && text[stop] !== "\r") {
        stop++;
      }
      chunks.push(blanked(text.slice(i, stop)));
      i = stop - 1;
    } else if (char === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      if (end === -1) {
        throw new ConfigJsonError(
          `${filePath} isn't valid JSON, so Graph Explorer can't read its settings: the /* comment on line ${lineOf(text, i)} never ends.`,
        );
      }
      const stop = end + 2;
      chunks.push(blanked(text.slice(i, stop)));
      i = stop - 1;
    } else if (/\s/.test(char)) {
      chunks.push(char);
    } else {
      if ((char === "}" || char === "]") && pendingComma !== -1) {
        chunks[pendingComma] = " ";
      }
      pendingComma = char === "," ? chunks.length : -1;
      inString = char === '"';
      chunks.push(char);
    }
  }
  return chunks.join("");
}

function blanked(span: string) {
  return span.replace(/[^\r\n]/g, " ");
}

/** The line of `text` that holds `index`, counting CRLF, CR, and LF as one line break each. */
function lineOf(text: string, index: number) {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (text[i] === "\n" || (text[i] === "\r" && text[i + 1] !== "\n")) {
      line++;
    }
  }
  return line;
}

/**
 * The lines on which each key of the top-level object appears, in order of
 * first appearance, from JSON text whose top level is an object. A line break
 * is a CRLF, a CR, or an LF.
 */
function topLevelKeyLines(json: string): Map<string, number[]> {
  const keyLines = new Map<string, number[]>();
  let depth = 0;
  let line = 1;
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (char === "\n" || (char === "\r" && json[i + 1] !== "\n")) {
      line++;
    } else if (char === "{" || char === "[") {
      depth++;
    } else if (char === "}" || char === "]") {
      depth--;
    } else if (char === '"') {
      const start = i;
      for (i++; json[i] !== '"'; i++) {
        if (json[i] === "\\") {
          i++;
        }
      }
      let next = i + 1;
      while (/\s/.test(json[next] ?? "")) {
        next++;
      }
      if (depth === 1 && json[next] === ":") {
        const key: string = JSON.parse(json.slice(start, i + 1));
        const lines = keyLines.get(key);
        if (lines) {
          lines.push(line);
        } else {
          keyLines.set(key, [line]);
        }
      }
    }
  }
  return keyLines;
}

/**
 * Reads the settings from the `config.json` at `filePath`. Returns
 * `undefined` when there is no such file. A directory is no file either,
 * which is what Docker leaves at a bind mount's missing source.
 */
export function readConfigJson(filePath: string): ConfigJson | undefined {
  try {
    if (!fs.statSync(filePath).isFile()) {
      return undefined;
    }
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }
    throw error;
  }
  return parseConfigJson(fs.readFileSync(filePath, "utf-8"), filePath);
}
