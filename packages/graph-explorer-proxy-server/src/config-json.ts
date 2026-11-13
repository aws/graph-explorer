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
 * comment holds is unset, and one set more than once throws, since only one
 * value can take effect.
 */
export function parseConfigJson(text: string, filePath: string): ConfigJson {
  const lenientText = lenientJsonText(text.replace(/^\uFEFF/, ""));
  if (lenientText.trim() === "") {
    throw new ConfigJsonError(
      `${filePath} is empty or holds only comments. Add settings to it, or remove the file to start without them.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(lenientText);
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

  const keyLines = topLevelKeyLines(lenientText);
  const duplicates = configJsonKeys.flatMap(key => {
    const lines = keyLines.get(key) ?? [];
    return lines.length > 1
      ? [
          `${filePath} sets ${key} more than once, on lines ${new Intl.ListFormat("en").format(lines.map(String))}.`,
        ]
      : [];
  });
  if (duplicates.length > 0) {
    throw new ConfigJsonError(
      `${duplicates.join(" ")} Keep one entry for each setting and remove the others.`,
    );
  }

  const warnings: string[] = [];
  const values: ConfigJson["values"] = {};
  for (const key of configJsonKeys) {
    const value = settings.data[key];
    if (value === undefined) {
      continue;
    }
    const setting = readSetting(settingKinds[key], value);
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

/** The setting as text, `""` for a value that counts as unset, or `undefined` for a value the setting can't hold. */
function readSetting(kind: SettingKind, value: JsonValue) {
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
      return typeof value === "string" ? value : "";
  }
}

/**
 * Blanks `//` and block comments, and any comma that only precedes a closing
 * brace or bracket, leaving strings untouched. Line breaks stay, so a syntax
 * error is reported at its place in the file. The result is JSON when the
 * input is JSON apart from those two allowances.
 */
function lenientJsonText(text: string) {
  let result = "";
  let inString = false;
  // Where the last comma outside a string sits in `result`, until something
  // other than whitespace follows it.
  let pendingComma = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      result += char;
      if (char === "\\") {
        result += text[++i] ?? "";
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === "/" && text[i + 1] === "/") {
      const end = text.indexOf("\n", i);
      const stop = end === -1 ? text.length : end;
      result += blanked(text.slice(i, stop));
      i = stop - 1;
    } else if (char === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? text.length : end + 2;
      result += blanked(text.slice(i, stop));
      i = stop - 1;
    } else if (/\s/.test(char)) {
      result += char;
    } else {
      if ((char === "}" || char === "]") && pendingComma !== -1) {
        result =
          result.slice(0, pendingComma) + " " + result.slice(pendingComma + 1);
      }
      pendingComma = char === "," ? result.length : -1;
      inString = char === '"';
      result += char;
    }
  }
  return result;
}

function blanked(span: string) {
  return span.replace(/[^\r\n]/g, " ");
}

/**
 * The lines on which each key of the top-level object appears, in order,
 * from JSON text whose top level is an object.
 */
function topLevelKeyLines(json: string): Map<string, number[]> {
  const keyLines = new Map<string, number[]>();
  let depth = 0;
  let line = 1;
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (char === "\n") {
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
        keyLines.set(key, [...(keyLines.get(key) ?? []), line]);
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
