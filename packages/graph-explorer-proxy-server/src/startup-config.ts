import dotenv from "dotenv";
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

export type StartupConfig = {
  /** What the server parses as its environment. */
  serverEnv: Record<string, string | undefined>;
  /** The settings `.env` files hold, for libraries that read `process.env`. */
  envFileValues: Record<string, string>;
  /** The text served at `/defaultConnection`, when a connection is configured. */
  defaultConnectionJson: string | undefined;
  /** Whether the container sets up its certificate before the server starts. */
  setUpCertificates: boolean;
  /** The host to generate a certificate for, when one is set. */
  certificateHost: string | undefined;
  warnings: string[];
};

type StartupInputs = {
  processEnv: Record<string, string | undefined>;
  dotEnv: TextFile | undefined;
  dotEnvLocal: TextFile | undefined;
  configJson: ConfigJson | undefined;
  /** Whether this start of the container follows an earlier one. */
  startedBefore: boolean;
};

/**
 * Resolves everything the server starts with from its inputs, without
 * touching a file. A run from source reads the environment, then
 * `.env.local`, then `.env`. The image does what its startup scripts did,
 * which {@link resolveImageStart} describes.
 */
export function resolveStartupConfig({
  image,
  ...inputs
}: StartupInputs & { image: boolean }): StartupConfig {
  return image ? resolveImageStart(inputs) : resolveSourceRun(inputs);
}

function resolveSourceRun({
  processEnv,
  dotEnv,
  dotEnvLocal,
}: StartupInputs): StartupConfig {
  const envFileValues = {
    ...dotenv.parse(dotEnv?.text ?? ""),
    ...dotenv.parse(dotEnvLocal?.text ?? ""),
  };
  return {
    serverEnv: { ...envFileValues, ...definedValues(processEnv) },
    envFileValues,
    defaultConnectionJson: undefined,
    setUpCertificates: false,
    certificateHost: undefined,
    warnings: [],
  };
}

/**
 * Reproduces the image's startup scripts in memory. They appended a block of
 * settings to `.env` at every start, then read that file twice: the
 * entrypoint for the notebook preset and the certificate, and dotenv for the
 * server. This builds the text `.env` would have held and reads it the same
 * two ways, so every start comes out as it did, without writing the file.
 */
function resolveImageStart({
  processEnv,
  dotEnv,
  dotEnvLocal,
  configJson,
  startedBefore,
}: StartupInputs): StartupConfig {
  const environment = definedValues(processEnv);
  // config.json replaced every key it can hold, even the ones it leaves out.
  const settings: ConfigJson["values"] =
    configJson?.values ??
    Object.fromEntries(
      configJsonKeys
        .map(key => [key, environment[key]] as const)
        .filter(([, value]) => value),
    );

  const envText =
    (dotEnv?.text ?? "") + appendedSettingsBlock(settings, environment);
  const envLines = envText.split("\n");
  const notebook = valuesOf(envLines, "NEPTUNE_NOTEBOOK", "rest").at(-1) ?? "";
  const httpsLines = valuesOf(
    envLines,
    "PROXY_SERVER_HTTPS_CONNECTION",
    "field",
  );
  // A start before this one in the same container appended its own line, so
  // the entrypoint saw several lines and kept the certificate it had.
  const setUpCertificates =
    notebook !== "true" &&
    !startedBefore &&
    httpsLines.join("\n").replace(/\n+$/, "") === "true";

  const envFileValues = {
    ...dotenv.parse(envText),
    ...dotenv.parse(dotEnvLocal?.text ?? ""),
  };
  return {
    // The entrypoint passed the .env value of NEPTUNE_NOTEBOOK to the server.
    serverEnv: {
      ...envFileValues,
      ...environment,
      NEPTUNE_NOTEBOOK: notebook,
    },
    envFileValues,
    defaultConnectionJson: renderDefaultConnection(settings),
    setUpCertificates,
    certificateHost: environment.HOST || undefined,
    warnings: configJson?.warnings ?? [],
  };
}

/**
 * The lines process-environment.sh appended to `.env` at each start, from
 * the settings it read and the container's environment.
 */
export function appendedSettingsBlock(
  settings: ConfigJson["values"],
  environment: Record<string, string>,
): string {
  const neptuneNotebook = settings.NEPTUNE_NOTEBOOK ?? "false";
  let https = settings.PROXY_SERVER_HTTPS_CONNECTION;
  let graphExpHttps = settings.GRAPH_EXP_HTTPS_CONNECTION;
  const lines = [`NEPTUNE_NOTEBOOK=${neptuneNotebook}`];
  if (neptuneNotebook === "true") {
    // The preset serves HTTP, but keeps an HTTPS request the server would read
    // as true, so the server can reject the conflict.
    https = /^true$/i.test(https ?? "") ? https : "false";
    graphExpHttps = "false";
    if (!environment.PROXY_SERVER_PORT && !environment.PROXY_SERVER_HTTP_PORT) {
      lines.push("PROXY_SERVER_PORT=9250");
    }
    if (!environment.LOG_STYLE) {
      lines.push("LOG_STYLE=cloudwatch");
    }
  }
  lines.push(
    `PROXY_SERVER_HTTPS_CONNECTION=${https || "true"}`,
    `GRAPH_EXP_HTTPS_CONNECTION=${graphExpHttps || "true"}`,
  );
  return lines.map(line => `\n${line}\n`).join("");
}

/**
 * The values of the lines that start with `key=`, as `cut -d "=" -f 2-` reads
 * them (`rest`) or as `cut -d "=" -f 2` does (`field`).
 */
function valuesOf(lines: string[], key: string, part: "rest" | "field") {
  return lines
    .filter(line => line.startsWith(`${key}=`))
    .map(line => {
      const value = line.slice(key.length + 1);
      return part === "rest" ? value : value.split("=")[0];
    });
}

/**
 * Reads the files the startup configuration comes from and resolves it,
 * validating what the server will parse. Only the image reads `config.json`.
 * Never writes a file or changes `processEnv`.
 */
export function loadStartup({
  processEnv,
  configPath,
  configJsonPath,
  image,
  startedBefore,
}: {
  processEnv: Record<string, string | undefined>;
  configPath: string;
  configJsonPath: string;
  image: boolean;
  startedBefore: boolean;
}): { env: EnvironmentValues; startup: StartupConfig } {
  if (!isDirectory(configPath)) {
    const source = processEnv.CONFIGURATION_FOLDER_PATH
      ? `CONFIGURATION_FOLDER_PATH="${configPath}"`
      : `default config path "${configPath}"`;
    throw new StartupError(`Configuration folder does not exist: ${source}`);
  }

  const startup = resolveStartupConfig({
    processEnv,
    dotEnv: readTextFile(path.join(configPath, ".env")),
    dotEnvLocal: readTextFile(path.join(configPath, ".env.local")),
    configJson: image ? loadConfigJson(configJsonPath) : undefined,
    image,
    startedBefore,
  });

  const result = EnvironmentValuesSchema.safeParse(startup.serverEnv);
  if (!result.success) {
    throw new StartupError(formatEnvironmentError(result.error));
  }
  return { env: result.data, startup };
}

function loadConfigJson(configJsonPath: string) {
  try {
    return readConfigJson(configJsonPath);
  } catch (error) {
    if (error instanceof ConfigJsonError) {
      throw new StartupError(error.message);
    }
    throw error;
  }
}

/** `values` without the keys whose value is undefined. */
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
