import fs from "fs";
import path from "path";

import {
  type ConfigJson,
  ConfigJsonError,
  configJsonKeys,
  readConfigJson,
} from "./config-json.ts";
import { renderDefaultConnection } from "./default-connection.ts";
import {
  EnvFileError,
  parseEnvFile,
  stripLegacyStartupBlocks,
} from "./env-file.ts";
import {
  type EnvironmentValues,
  EnvironmentValuesSchema,
  formatEnvironmentError,
} from "./env.ts";
import { isDirectory, isMissingFileError } from "./paths.ts";

/** Startup can't continue. The message says why. */
export class StartupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StartupError";
  }
}

export type TextFile = { path: string; text: string };

/** The settings of a `config.json`, with the path they were read from. */
export type ConfigJsonFile = ConfigJson & { path: string };

export type StartupConfig = {
  /** What the server parses as its environment. */
  serverEnv: Record<string, string | undefined>;
  /** The settings `.env` files hold, for libraries that read `process.env`. */
  envFileValues: Record<string, string>;
  /** The text served at `/defaultConnection`, when a connection is configured. */
  defaultConnectionJson: string | undefined;
  /** The host to generate a certificate for, when one is set. */
  certificateHost: string | undefined;
  /**
   * In the image, the line that says why it generates no certificate: the
   * notebook preset, or where HTTPS was turned off.
   */
  httpsNotice: string | undefined;
  info: string[];
  warnings: string[];
};

/**
 * Resolves everything the server starts with from its inputs, without
 * touching a file. Every setting comes from the process environment, then
 * `.env.local`, then `config.json` or the notebook preset, then `.env`, then
 * its default. An empty environment value for a setting `config.json` can
 * hold counts as unset. Under the preset, PROXY_SERVER_HTTPS_CONNECTION from
 * `config.json` keeps its value only when it reads as `true`, otherwise
 * `false`. Connection settings and NEPTUNE_NOTEBOOK come only from the
 * process environment and `config.json`, never from `.env` or `.env.local`.
 *
 * The notebook preset applies when NEPTUNE_NOTEBOOK is exactly `true`. HTTPS
 * defaults to on for the image and off otherwise.
 */
export function resolveStartupConfig({
  processEnv,
  dotEnv,
  dotEnvLocal,
  configJson,
  image,
}: {
  processEnv: Record<string, string | undefined>;
  dotEnv: TextFile | undefined;
  dotEnvLocal: TextFile | undefined;
  configJson: ConfigJsonFile | undefined;
  image: boolean;
}): StartupConfig {
  const info: string[] = [];
  const environment = withoutEmptyConfigJsonKeys(definedValues(processEnv));

  const ownDotEnv = dotEnv && stripLegacyStartupBlocks(dotEnv.text);
  if (dotEnv && ownDotEnv && ownDotEnv.ignoredLineCount > 0) {
    info.push(
      `Ignored ${ownDotEnv.ignoredLineCount} lines of ${dotEnv.path}, which earlier versions of Graph Explorer appended at each start. Startup now reads those settings directly, so you can delete the lines.`,
    );
  }
  // The appended blocks are blanked first, so their lines never count as a
  // key the operator set twice.
  const dotEnvValues =
    dotEnv && ownDotEnv ? parseEnvFile(ownDotEnv.text, dotEnv.path) : {};
  const dotEnvLocalValues = dotEnvLocal
    ? parseEnvFile(dotEnvLocal.text, dotEnvLocal.path)
    : {};

  const settings: ConfigJson["values"] = {
    ...configJson?.values,
    ...Object.fromEntries(
      configJsonKeys.flatMap(key =>
        environment[key] === undefined ? [] : [[key, environment[key]]],
      ),
    ),
  };

  const notebook = settings.NEPTUNE_NOTEBOOK === "true";
  const presetValues: Record<string, string> = {};
  if (notebook) {
    if (!environment.PROXY_SERVER_PORT && !environment.PROXY_SERVER_HTTP_PORT) {
      presetValues.PROXY_SERVER_PORT = "9250";
    }
    if (!environment.LOG_STYLE) {
      presetValues.LOG_STYLE = "cloudwatch";
    }
  }

  // Earlier versions appended the preset's lines to .env, so it beat the
  // operator's .env lines and yielded to .env.local.
  const serverEnv: StartupConfig["serverEnv"] = {
    ...dotEnvValues,
    ...presetValues,
    ...dotEnvLocalValues,
    ...environment,
  };

  // The notebook preset serves HTTP, but keeps an HTTPS request the server
  // would read as true, so it can reject the conflict. Anything else, such as
  // a config.json null or number, falls back to the preset.
  const httpsFromConfig = configJson?.values.PROXY_SERVER_HTTPS_CONNECTION;
  const httpsFromConfigOrPreset = notebook
    ? /^true$/i.test(httpsFromConfig ?? "")
      ? httpsFromConfig
      : "false"
    : httpsFromConfig;
  const https = firstSet([
    {
      value: environment.PROXY_SERVER_HTTPS_CONNECTION,
      source: "the environment",
    },
    dotEnvLocal && {
      value: dotEnvLocalValues.PROXY_SERVER_HTTPS_CONNECTION,
      source: dotEnvLocal.path,
    },
    notebook
      ? {
          value: httpsFromConfigOrPreset,
          source: "the Neptune Notebook preset",
        }
      : configJson && { value: httpsFromConfig, source: configJson.path },
    dotEnv && {
      value: dotEnvValues.PROXY_SERVER_HTTPS_CONNECTION,
      source: dotEnv.path,
    },
  ]);
  serverEnv.PROXY_SERVER_HTTPS_CONNECTION =
    https?.value ?? (image ? "true" : undefined);

  // A .env line never reaches the server, as before.
  serverEnv.NEPTUNE_NOTEBOOK = settings.NEPTUNE_NOTEBOOK;

  return {
    serverEnv,
    envFileValues: { ...dotEnvValues, ...dotEnvLocalValues },
    defaultConnectionJson: renderDefaultConnection(settings),
    // The process environment only, so a HOST in .env never replaces
    // certificates kept in a volume.
    certificateHost: environment.HOST || undefined,
    httpsNotice: image ? httpsNoticeFor(notebook, https) : undefined,
    info,
    warnings: configJson?.warnings ?? [],
  };
}

type Setting = { value: string; source: string };

/** The first of `candidates` that holds a value, in order. */
function firstSet(
  candidates: ({ value: string | undefined; source: string } | undefined)[],
): Setting | undefined {
  for (const candidate of candidates) {
    if (candidate?.value !== undefined) {
      return { value: candidate.value, source: candidate.source };
    }
  }
  return undefined;
}

/** Why the image generates no certificate, when it doesn't. */
function httpsNoticeFor(notebook: boolean, https: Setting | undefined) {
  if (notebook) {
    return "Neptune Notebook preset enabled. Skipping self-signed certificate generation.";
  }
  if (https && /^false$/i.test(https.value)) {
    return `HTTPS is off, set by PROXY_SERVER_HTTPS_CONNECTION in ${https.source}`;
  }
  return undefined;
}

/**
 * `environment` without the empty values of the settings config.json can
 * hold, which count as unset. Other settings keep theirs, so an empty
 * PROXY_SERVER_LISTEN_ADDRESS still fails with its own message.
 */
function withoutEmptyConfigJsonKeys(environment: Record<string, string>) {
  const keys: ReadonlySet<string> = new Set(configJsonKeys);
  return Object.fromEntries(
    Object.entries(environment).filter(
      ([key, value]) => value !== "" || !keys.has(key),
    ),
  );
}

/**
 * Reads the files the startup configuration comes from and resolves it,
 * validating what the server will parse. Never writes a file or changes
 * `processEnv`.
 */
export function loadStartup({
  processEnv,
  configPath,
  configJsonPath,
  image,
}: {
  processEnv: Record<string, string | undefined>;
  configPath: string;
  configJsonPath: string;
  image: boolean;
}): { env: EnvironmentValues; startup: StartupConfig } {
  if (!isDirectory(configPath)) {
    const source = processEnv.CONFIGURATION_FOLDER_PATH
      ? `CONFIGURATION_FOLDER_PATH="${configPath}"`
      : `default config path "${configPath}"`;
    throw new StartupError(`Configuration folder does not exist: ${source}`);
  }

  let startup;
  try {
    startup = resolveStartupConfig({
      processEnv,
      dotEnv: readTextFile(path.join(configPath, ".env")),
      dotEnvLocal: readTextFile(path.join(configPath, ".env.local")),
      configJson: loadConfigJson(configJsonPath),
      image,
    });
  } catch (error) {
    if (error instanceof EnvFileError) {
      throw new StartupError(error.message);
    }
    throw error;
  }

  const result = EnvironmentValuesSchema.safeParse(startup.serverEnv);
  if (!result.success) {
    throw new StartupError(formatEnvironmentError(result.error));
  }
  return { env: result.data, startup };
}

function loadConfigJson(configJsonPath: string): ConfigJsonFile | undefined {
  try {
    const configJson = readConfigJson(configJsonPath);
    return configJson && { path: configJsonPath, ...configJson };
  } catch (error) {
    if (error instanceof ConfigJsonError) {
      throw new StartupError(error.message);
    }
    throw error;
  }
}

function definedValues(values: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(values).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
}

/** The file's text, or `undefined` when it doesn't exist. */
function readTextFile(filePath: string): TextFile | undefined {
  try {
    return { path: filePath, text: fs.readFileSync(filePath, "utf-8") };
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }
    throw error;
  }
}
