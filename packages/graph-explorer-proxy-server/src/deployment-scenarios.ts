import fs from "fs";
import path from "path";
import { expect } from "vite-plus/test";

import type { EnvironmentValues } from "./env.ts";

import { clientRoot } from "./paths.ts";
import { legacyStartupBlock, withoutBlankLines } from "./testing.ts";

/** What `GET /defaultConnection` returned. */
export type DefaultConnectionResponse =
  | { status: 404 }
  | { status: 200; body: unknown }
  /** The response was served but isn't JSON. Holds its text. */
  | { status: 200; invalidJson: string };

/** A server that started, with everything an operator can observe about it. */
export type ServerStart = {
  /** Every field of the parsed EnvironmentValues that isn't undefined. */
  environment: Partial<EnvironmentValues>;
  listener: { protocol: "http" | "https"; port: number };
  /** Whether this start generated the self-signed certificate. */
  certificatesGenerated: boolean;
  defaultConnection: DefaultConnectionResponse;
  /** Every warning the start logged, in order. */
  warnings: string[];
  /**
   * The line the start logged when it skipped certificate generation for the
   * notebook preset or because HTTPS is off.
   */
  httpsNotice: string | undefined;
};

/**
 * What one start of the container does. `failed` holds the text the start
 * printed or threw: stderr for a refusal before the server runs, the logged
 * parse failure, or the server configuration error.
 */
export type StartupOutcome = { started: ServerStart } | { failed: string };

type DeploymentInputs = {
  /** Describes the inputs only, so it stays true when the outcome changes. */
  name: string;
  /** Values passed with `docker run -e`. */
  dockerEnv?: Record<string, string>;
  /**
   * config.json is a hand-edited file, so a boolean field there can hold
   * null, a number, or an arbitrary string instead of a JSON boolean. A
   * string is written as is, for text a reader has to handle.
   */
  configJson?: Record<string, boolean | string | number | null> | string;
  /**
   * Content already in `.env` before the first start, as an operator might
   * mount. A string is written as is.
   */
  existingEnvFile?: Record<string, string> | string;
  /** Content already in `.env.local`, which the server reads before `.env`. */
  existingEnvLocalFile?: string;
  /** Certificate files already in `cert-info` before the first start. */
  existingCertificates?: "all" | "server-only";
  /** A `defaultConnection.json` already in the configuration folder. */
  mountedDefaultConnection?: Record<string, unknown>;
  /** Every row sets HOST=localhost unless this is false or `-e` sets it. */
  host?: false;
  /**
   * Makes the configuration folder, or a file in it, read-only before the
   * start, as a read-only mount does. A missing file is created empty first.
   */
  readOnly?: "configFolder" | ".env" | "defaultConnection.json";
};

/**
 * A way to run the image, and what it does. A second start is a
 * `docker restart`, which keeps the container's files, or a new container
 * that mounts the same configuration folder and config.json.
 */
export type Deployment = DeploymentInputs &
  (
    | { secondStart?: undefined; expected: StartupOutcome }
    | {
        secondStart: "restart" | "new-container";
        expected: [first: StartupOutcome, second: StartupOutcome];
      }
  );

export const conflictMessage =
  "NEPTUNE_NOTEBOOK and PROXY_SERVER_HTTPS_CONNECTION are both true. " +
  "The Neptune Notebook preset serves Graph Explorer over HTTP and does " +
  "not generate TLS certificates, so this combination cannot start. " +
  "Either set PROXY_SERVER_HTTPS_CONNECTION to false or remove it " +
  "(from -e flags or config.json) to run under the notebook preset, " +
  "or set NEPTUNE_NOTEBOOK to false to run with TLS.";

/** Expects a parse failure at `key`, logging `message` when it is given. */
export function parseFailureAt(key: string, message?: string): StartupOutcome {
  return {
    failed: expect.stringContaining(
      message === undefined ? `→ at ${key}` : `✖ ${message}\n  → at ${key}`,
    ),
  };
}

export const missingCertificates: StartupOutcome = {
  failed: expect.stringContaining(
    "PROXY_SERVER_HTTPS_CONNECTION is true but certificate files are missing",
  ),
};

/** Expects the refusal process-environment.sh prints when it can't write `file`. */
export function cannotWrite(file: string): StartupOutcome {
  return {
    failed: expect.stringContaining(
      `Graph Explorer can't start because it can't write ./packages/graph-explorer/${file}. ` +
        "The container writes its settings to the configuration folder at startup, " +
        "so ./packages/graph-explorer must be writable. " +
        "Check that it isn't mounted read-only.",
    ),
  };
}

export function deprecated(name: string) {
  return `${name} is deprecated. Use PROXY_SERVER_PORT instead.`;
}

export function ignored(name: string, value: number, port: number) {
  return `${name} (${value}) is ignored because PROXY_SERVER_PORT (${port}) is set. ${name} is deprecated, remove it.`;
}

/** `environment` without the fields whose value is undefined. */
export function definedFields(
  environment: Partial<EnvironmentValues>,
): Partial<EnvironmentValues> {
  return Object.fromEntries(
    Object.entries(environment).filter(([, value]) => value !== undefined),
  );
}

const presetNotice =
  "Neptune Notebook preset enabled. Skipping self-signed certificate generation.";
const httpsOffNotice =
  "SSL disabled. Skipping self-signed certificate generation.";

export const https: ServerStart = {
  environment: {
    HOST: "localhost",
    PROXY_SERVER_LISTEN_ADDRESS: "127.0.0.1",
    NEPTUNE_NOTEBOOK: false,
    PROXY_SERVER_HTTPS_CONNECTION: true,
    LOG_LEVEL: "info",
    LOG_STYLE: "default",
  },
  listener: { protocol: "https", port: 443 },
  certificatesGenerated: true,
  defaultConnection: { status: 404 },
  warnings: [],
  httpsNotice: undefined,
};
export const http: ServerStart = {
  environment: { ...https.environment, PROXY_SERVER_HTTPS_CONNECTION: false },
  listener: { protocol: "http", port: 80 },
  certificatesGenerated: false,
  defaultConnection: { status: 404 },
  warnings: [],
  httpsNotice: httpsOffNotice,
};
export const notebook: ServerStart = {
  environment: {
    ...http.environment,
    NEPTUNE_NOTEBOOK: true,
    PROXY_SERVER_PORT: 9250,
    LOG_STYLE: "cloudwatch",
  },
  listener: { protocol: "http", port: 9250 },
  certificatesGenerated: false,
  defaultConnection: { status: 404 },
  warnings: [],
  httpsNotice: presetNotice,
};

/**
 * A start that serves like `base`, apart from `changes`. Their `environment`
 * merges over the base's, and a field set to undefined is removed.
 */
export function served(
  base: ServerStart,
  {
    environment = {},
    ...changes
  }: Partial<Omit<ServerStart, "environment">> & {
    environment?: Partial<EnvironmentValues>;
  } = {},
): StartupOutcome {
  return {
    started: {
      ...base,
      ...changes,
      environment: definedFields({ ...base.environment, ...environment }),
    },
  };
}

export const standardTls = served(https);
export const standardHttp = served(http);
export const notebookPreset = served(notebook);
export const notebookConflict = parseFailureAt(
  "PROXY_SERVER_HTTPS_CONNECTION",
  conflictMessage,
);

/** What an HTTP container, an HTTPS container, and a notebook container each appended per start. */
const httpContainerBlock = {
  neptuneNotebook: "false",
  https: "false",
  graphExpHttps: "true",
};
const httpsContainerBlock = {
  neptuneNotebook: "false",
  https: "true",
  graphExpHttps: "true",
};
const notebookContainerBlock = {
  neptuneNotebook: "true",
  logStyle: true,
  https: "false",
  graphExpHttps: "false",
} as const;

/** The `.env` the image ships in its configuration folder. */
const imageEnvFile = fs.readFileSync(path.join(clientRoot, ".env"), "utf-8");

const clusterUrl = "https://my-cluster.us-west-2.neptune.amazonaws.com:8182";

/** Default Connection settings for a proxied Neptune database with IAM. */
const connectionSettings = [
  `GRAPH_CONNECTION_URL=${clusterUrl}`,
  "GRAPH_TYPE=gremlin",
  "SERVICE_TYPE=neptune-db",
  "IAM=true",
  "AWS_REGION=us-west-2",
  "GRAPH_EXP_FETCH_REQUEST_TIMEOUT=60000",
  "GRAPH_EXP_NODE_EXPANSION_LIMIT=500",
]
  .map(line => `${line}\n`)
  .join("");

/** The Default Connection of a proxied Neptune database with nothing else set. */
function proxiedConnection(
  extra: Record<string, unknown> = {},
  url = clusterUrl,
) {
  return {
    GRAPH_EXP_CONNECTION_URL: url,
    GRAPH_EXP_SERVICE_TYPE: "neptune-db",
    GRAPH_EXP_IAM: false,
    GRAPH_EXP_AWS_REGION: "",
    GRAPH_EXP_USING_PROXY_SERVER: true,
    ...extra,
  };
}

/** A start that serves `body` as the Default Connection, over `base`. */
function servingConnection(body: unknown, base: ServerStart = https) {
  return served(base, { defaultConnection: { status: 200, body } });
}

/** A start that serves `text`, which isn't JSON, as the Default Connection. */
function servingInvalidConnection(text: string, base: ServerStart = https) {
  return served(base, {
    defaultConnection: { status: 200, invalidJson: text },
  });
}

const noCertificateFiles: StartupOutcome = {
  failed: expect.stringContaining("Missing certificate files in"),
};

/**
 * Startup scenarios for the one image the Dockerfile builds. Its `ENV` lines
 * set nothing the startup reads, so the container's environment is `HOST`
 * plus the `-e` flags. The image's `PROXY_SERVER_LISTEN_ADDRESS=::` reaches
 * only the server, so the Docker build workflow checks it rather than this
 * table.
 */
export const deployments: Deployment[] = [
  {
    name: "nothing about HTTPS set",
    // HTTPS defaults to on, and HOST generates the certificate.
    expected: standardTls,
  },
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION=false",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    // HTTPS off serves HTTP on its default port, without a certificate.
    expected: standardHttp,
  },
  {
    name: "-e PROXY_SERVER_HTTP_PORT=8080 and HTTPS off",
    dockerEnv: {
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      PROXY_SERVER_HTTP_PORT: "8080",
    },
    // The deprecated variable still sets the HTTP port, with a warning.
    expected: served(http, {
      environment: { PROXY_SERVER_HTTP_PORT: 8080 },
      listener: { protocol: "http", port: 8080 },
      warnings: [deprecated("PROXY_SERVER_HTTP_PORT")],
    }),
  },
  {
    name: "-e PROXY_SERVER_HTTPS_PORT=8443",
    dockerEnv: { PROXY_SERVER_HTTPS_PORT: "8443" },
    // The deprecated variable still sets the TLS port, with a warning.
    expected: served(https, {
      environment: { PROXY_SERVER_HTTPS_PORT: 8443 },
      listener: { protocol: "https", port: 8443 },
      warnings: [deprecated("PROXY_SERVER_HTTPS_PORT")],
    }),
  },
  {
    name: "-e PROXY_SERVER_PORT=8080 and HTTPS off",
    dockerEnv: {
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      PROXY_SERVER_PORT: "8080",
    },
    // PROXY_SERVER_PORT sets the port for either protocol.
    expected: served(http, {
      environment: { PROXY_SERVER_PORT: 8080 },
      listener: { protocol: "http", port: 8080 },
    }),
  },
  {
    name: "-e PROXY_SERVER_PORT=8443",
    dockerEnv: { PROXY_SERVER_PORT: "8443" },
    // PROXY_SERVER_PORT sets the port for either protocol.
    expected: served(https, {
      environment: { PROXY_SERVER_PORT: 8443 },
      listener: { protocol: "https", port: 8443 },
    }),
  },
  {
    name: "-e PROXY_SERVER_PORT=9250 and -e PROXY_SERVER_HTTPS_PORT=8443",
    dockerEnv: {
      PROXY_SERVER_PORT: "9250",
      PROXY_SERVER_HTTPS_PORT: "8443",
    },
    // PROXY_SERVER_PORT beats the deprecated variable, which is ignored with a
    // warning.
    expected: served(https, {
      environment: { PROXY_SERVER_PORT: 9250, PROXY_SERVER_HTTPS_PORT: 8443 },
      listener: { protocol: "https", port: 9250 },
      warnings: [ignored("PROXY_SERVER_HTTPS_PORT", 8443, 9250)],
    }),
  },
  {
    name: "PROXY_SERVER_HTTP_PORT=8080 in .env with -e PROXY_SERVER_HTTPS_CONNECTION=false",
    existingEnvFile: { PROXY_SERVER_HTTP_PORT: "8080" },
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    // The server reads .env, so its deprecated port applies, with a warning.
    expected: served(http, {
      environment: { PROXY_SERVER_HTTP_PORT: 8080 },
      listener: { protocol: "http", port: 8080 },
      warnings: [deprecated("PROXY_SERVER_HTTP_PORT")],
    }),
  },
  {
    name: "PROXY_SERVER_PORT=8081 in .env with -e PROXY_SERVER_HTTPS_CONNECTION=false",
    existingEnvFile: { PROXY_SERVER_PORT: "8081" },
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    // The server reads .env, so its port applies.
    expected: served(http, {
      environment: { PROXY_SERVER_PORT: 8081 },
      listener: { protocol: "http", port: 8081 },
    }),
  },
  {
    name: "PROXY_SERVER_PORT=8081 in .env with -e PROXY_SERVER_HTTP_PORT=8080 and HTTPS off",
    existingEnvFile: { PROXY_SERVER_PORT: "8081" },
    dockerEnv: {
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      PROXY_SERVER_HTTP_PORT: "8080",
    },
    // PROXY_SERVER_PORT beats the deprecated variable even though -e beats
    // .env for the same name.
    expected: served(http, {
      environment: { PROXY_SERVER_PORT: 8081, PROXY_SERVER_HTTP_PORT: 8080 },
      listener: { protocol: "http", port: 8081 },
      warnings: [ignored("PROXY_SERVER_HTTP_PORT", 8080, 8081)],
    }),
  },
  {
    name: "LOG_STYLE=cloudwatch in .env",
    existingEnvFile: { LOG_STYLE: "cloudwatch" },
    // The server reads .env. Earlier images set LOG_STYLE in their ENV, which
    // beat a mounted .env.
    expected: served(https, { environment: { LOG_STYLE: "cloudwatch" } }),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with PROXY_SERVER_HTTP_PORT=8080 in .env",
    existingEnvFile: { PROXY_SERVER_HTTP_PORT: "8080" },
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    // The preset can't see the mounted line, so it still sets its port, and
    // PROXY_SERVER_PORT wins over the deprecated variable.
    expected: served(notebook, {
      environment: { PROXY_SERVER_HTTP_PORT: 8080 },
      warnings: [ignored("PROXY_SERVER_HTTP_PORT", 8080, 9250)],
    }),
  },
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION=true",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    // HTTPS on, and HOST generates the certificate.
    expected: standardTls,
  },
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION=TRUE",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "TRUE" },
    // The entrypoint generates certificates only for an exact "true", but the
    // server reads HTTPS without regard to case, so it fails on the missing
    // certificates.
    expected: missingCertificates,
  },
  {
    name: "config.json HTTPS true",
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    // config.json turns HTTPS on, and HOST generates the certificate.
    expected: standardTls,
  },
  {
    name: "config.json HTTPS false",
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    // config.json turns HTTPS off.
    expected: standardHttp,
  },
  {
    name: "config.json HTTPS true and -e HTTPS false",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    // config.json decides what the entrypoint reads, so it generates a
    // certificate, while the -e value wins in the server, which serves HTTP.
    expected: served(http, {
      certificatesGenerated: true,
      httpsNotice: undefined,
    }),
  },
  {
    name: "config.json HTTPS false and -e HTTPS true",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    // config.json decides what the entrypoint reads, so it skips the
    // certificate, while the -e value wins in the server, which wants TLS and
    // fails on the missing certificates.
    expected: missingCertificates,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    // The preset serves HTTP on 9250 with cloudwatch logs.
    expected: notebookPreset,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTP_PORT=8080",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true", PROXY_SERVER_HTTP_PORT: "8080" },
    // An explicit port keeps the preset from setting its own.
    expected: served(notebook, {
      environment: {
        PROXY_SERVER_PORT: undefined,
        PROXY_SERVER_HTTP_PORT: 8080,
      },
      listener: { protocol: "http", port: 8080 },
      warnings: [deprecated("PROXY_SERVER_HTTP_PORT")],
    }),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_PORT=8080",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true", PROXY_SERVER_PORT: "8080" },
    // An explicit port keeps the preset from setting its own.
    expected: served(notebook, {
      environment: { PROXY_SERVER_PORT: 8080 },
      listener: { protocol: "http", port: 8080 },
    }),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with HTTPS off, PROXY_SERVER_PORT=9250, and PROXY_SERVER_HTTP_PORT=9250",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      PROXY_SERVER_PORT: "9250",
      PROXY_SERVER_HTTP_PORT: "9250",
    },
    // Notebook scripts set both port variables while older images ignore
    // PROXY_SERVER_PORT, so matching values start without a warning.
    expected: served(notebook, {
      environment: { PROXY_SERVER_HTTP_PORT: 9250 },
    }),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=true",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
    },
    // The preset serves HTTP only, so it refuses an explicit HTTPS request.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=false",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
    },
    // The preset with HTTPS off, as the SageMaker lifecycle script runs it.
    expected: notebookPreset,
  },
  {
    name: "a sagemaker-* tag without NEPTUNE_NOTEBOOK",
    // The sagemaker-* tags are aliases of the standard image, which bakes no
    // preset, so it starts like the standard image with TLS.
    expected: standardTls,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=false",
    dockerEnv: { NEPTUNE_NOTEBOOK: "false" },
    // No preset, so HTTPS defaults to on.
    expected: standardTls,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=TRUE",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "TRUE",
    },
    // The server reads HTTPS without regard to case, so TRUE conflicts with
    // the preset.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=true without HOST",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
    },
    host: false,
    // The preset skips certificates, so the start reaches the conflict
    // instead of stopping on the missing HOST.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK and HTTPS true",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    // config.json's HTTPS request conflicts with the preset.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK true and HTTPS false",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {
      NEPTUNE_NOTEBOOK: true,
      PROXY_SERVER_HTTPS_CONNECTION: false,
    },
    // config.json's HTTPS off matches the preset.
    expected: notebookPreset,
  },
  ...[null, "yes", 0].map((value): Deployment => ({
    name: `-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK true and HTTPS ${JSON.stringify(value)}`,
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {
      NEPTUNE_NOTEBOOK: true,
      PROXY_SERVER_HTTPS_CONNECTION: value,
    },
    // The preset replaces an HTTPS value that doesn't read as true with
    // false.
    expected: notebookPreset,
  })),
  {
    name: '-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK true and HTTPS "TRUE"',
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {
      NEPTUNE_NOTEBOOK: true,
      PROXY_SERVER_HTTPS_CONNECTION: "TRUE",
    },
    // config.json can hold "TRUE" just as easily as the boolean true; both
    // read as a request for HTTPS under the preset.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=yes",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "yes",
    },
    // -e always wins over .env, since dotenv never overrides a variable
    // already in the environment, so the invalid value fails the parse.
    expected: parseFailureAt("PROXY_SERVER_HTTPS_CONNECTION"),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e GRAPH_EXP_HTTPS_CONNECTION=true",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true", GRAPH_EXP_HTTPS_CONNECTION: "true" },
    // GRAPH_EXP_HTTPS_CONNECTION doesn't change how the server listens.
    expected: notebookPreset,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK and GRAPH_EXP_HTTPS_CONNECTION true",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: true, GRAPH_EXP_HTTPS_CONNECTION: true },
    // GRAPH_EXP_HTTPS_CONNECTION doesn't change how the server listens.
    expected: notebookPreset,
  },
  ...["TRUE", "True", "1", "yes"].flatMap((value): Deployment[] => [
    {
      name: `-e NEPTUNE_NOTEBOOK=${value}`,
      dockerEnv: { NEPTUNE_NOTEBOOK: value },
      // Only an exact "true" applies the preset, so HTTPS defaults to on.
      expected: standardTls,
    },
    {
      name: `-e NEPTUNE_NOTEBOOK=${value} and -e PROXY_SERVER_HTTPS_CONNECTION=false`,
      dockerEnv: {
        NEPTUNE_NOTEBOOK: value,
        PROXY_SERVER_HTTPS_CONNECTION: "false",
      },
      // Only an exact "true" applies the preset, so it serves plain HTTP.
      expected: standardHttp,
    },
  ]),
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION=",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "" },
    // The script treats the empty value as unset and writes the TLS default,
    // but dotenv never overrides a variable already in the environment, so
    // the server reads the empty value directly and its schema rejects it.
    expected: parseFailureAt("PROXY_SERVER_HTTPS_CONNECTION"),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json HTTPS true and no NEPTUNE_NOTEBOOK key",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    // config.json replaces -e NEPTUNE_NOTEBOOK, and a missing key reads as
    // unset, so the preset is off and it serves TLS.
    expected: standardTls,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and a config.json without the key",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {},
    // config.json replaces -e NEPTUNE_NOTEBOOK even when it lacks the key, so
    // the preset is off and it serves TLS.
    expected: standardTls,
  },
  {
    name: "config.json NEPTUNE_NOTEBOOK and HTTPS true without HOST",
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    host: false,
    // The preset skips certificates, so the start reaches the conflict
    // instead of stopping on the missing HOST.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK and HTTPS true without HOST",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    host: false,
    // The preset skips certificates, so the start reaches the conflict
    // instead of stopping on the missing HOST.
    expected: notebookConflict,
  },
  {
    name: "config.json NEPTUNE_NOTEBOOK and HTTPS true",
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    // config.json's HTTPS request conflicts with its own preset.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK false",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: false },
    // config.json's false replaces -e NEPTUNE_NOTEBOOK, so it serves TLS.
    expected: standardTls,
  },
  {
    name: "config.json NEPTUNE_NOTEBOOK true",
    configJson: { NEPTUNE_NOTEBOOK: true },
    // config.json applies the preset.
    expected: notebookPreset,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=true, restarted",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
    },
    secondStart: "restart",
    // The lines the first start appended don't hide the conflict.
    expected: [notebookConflict, notebookConflict],
  },
  {
    name: "the SageMaker lifecycle script's -e flags, restarted",
    dockerEnv: {
      HOST: "127.0.0.1",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      NEPTUNE_NOTEBOOK: "true",
    },
    secondStart: "restart",
    // The preset applies on every start.
    expected: [
      served(notebook, { environment: { HOST: "127.0.0.1" } }),
      served(notebook, { environment: { HOST: "127.0.0.1" } }),
    ],
  },
  {
    name: "nothing about HTTPS set, restarted",
    secondStart: "restart",
    // The entrypoint reads PROXY_SERVER_HTTPS_CONNECTION by its first match,
    // not its last, so a restart's repeated "true" line doesn't re-trigger
    // setup-ssl.sh. The container keeps serving TLS on the certificate
    // generated at first start, though the entrypoint logs that SSL is
    // disabled.
    expected: [
      standardTls,
      served(https, {
        certificatesGenerated: false,
        httpsNotice: httpsOffNotice,
      }),
    ],
  },
  {
    name: "a read-only configuration folder",
    readOnly: "configFolder",
    // The script writes .env at every start, so it refuses.
    expected: cannotWrite(".env"),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with a read-only configuration folder",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    readOnly: "configFolder",
    // The script writes .env at every start, so it refuses.
    expected: cannotWrite(".env"),
  },
  {
    name: "LOG_LEVEL=debug in a read-only .env",
    existingEnvFile: { LOG_LEVEL: "debug" },
    readOnly: ".env",
    // The script writes .env at every start, so it refuses.
    expected: cannotWrite(".env"),
  },
  {
    name: "-e PUBLIC_OR_PROXY_ENDPOINT with a read-only defaultConnection.json",
    dockerEnv: { PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182" },
    readOnly: "defaultConnection.json",
    // A legacy direct connection resolves to PUBLIC_OR_PROXY_ENDPOINT, so the
    // script has a defaultConnection.json to write, and refuses before it
    // writes .env.
    expected: cannotWrite("defaultConnection.json"),
  },
  {
    name: "-e GRAPH_CONNECTION_URL with a read-only defaultConnection.json",
    dockerEnv: { GRAPH_CONNECTION_URL: "https://endpoint:8182" },
    readOnly: "defaultConnection.json",
    // The script has a defaultConnection.json to write, so it refuses before
    // it writes .env.
    expected: cannotWrite("defaultConnection.json"),
  },
  {
    name: "-e PUBLIC_OR_PROXY_ENDPOINT and -e USING_PROXY_SERVER=true with a read-only defaultConnection.json",
    dockerEnv: {
      PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      USING_PROXY_SERVER: "true",
    },
    readOnly: "defaultConnection.json",
    // A proxied legacy connection resolves to GRAPH_CONNECTION_URL, which is
    // empty here, so there is no defaultConnection.json to write. The empty
    // file the row makes read-only is what the route serves.
    expected: served(https, {
      defaultConnection: { status: 200, invalidJson: "" },
    }),
  },
  {
    name: "PROXY_SERVER_HTTPS_CONNECTION=false in a mounted .env",
    existingEnvFile: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    // The entrypoint reads the first PROXY_SERVER_HTTPS_CONNECTION line and
    // process-environment.sh appends its own "true" default after the mounted
    // one, so the entrypoint reads "false" while dotenv reads the last line,
    // "true". No certificates are generated, yet the server wants TLS.
    expected: missingCertificates,
  },
  {
    name: "PROXY_SERVER_HTTPS_CONNECTION=true in a mounted .env",
    existingEnvFile: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    // The mounted "true" and the appended "true" read back as "true\ntrue",
    // which isn't the exact "true" that triggers setup-ssl.sh.
    expected: missingCertificates,
  },
  {
    name: "an operator .env with PROXY_SERVER_HTTPS_CONNECTION=false and all five certificate files present",
    existingEnvFile: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    existingCertificates: "all",
    // The entrypoint reads the operator's "false" first and skips generation,
    // while the server reads the "true" the script appends and serves TLS on
    // the files already in cert-info.
    expected: served(https, {
      certificatesGenerated: false,
      httpsNotice: httpsOffNotice,
    }),
  },
  {
    name: "no HOST and no certificate files",
    host: false,
    // setup-ssl.sh needs HOST to generate a certificate, and finds none to
    // reuse.
    expected: noCertificateFiles,
  },
  {
    name: "no HOST with all five certificate files in cert-info",
    host: false,
    existingCertificates: "all",
    // setup-ssl.sh reuses the files it finds.
    expected: served(https, { certificatesGenerated: false }),
  },
  {
    name: "no HOST with only server.key and server.crt in cert-info",
    host: false,
    existingCertificates: "server-only",
    // setup-ssl.sh reuses only a complete set of files.
    expected: noCertificateFiles,
  },
  {
    name: "a new container reusing the configuration folder",
    secondStart: "new-container",
    // The first start leaves a block in .env, so the next container that
    // mounts the folder reads "true\ntrue" and skips generation.
    expected: [standardTls, missingCertificates],
  },
  {
    name: "-e GRAPH_CONNECTION_URL",
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl },
    // GRAPH_CONNECTION_URL alone makes a proxied connection.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "-e GRAPH_TYPE, GRAPH_CONNECTION_URL, and AWS_REGION with config.json setting all three",
    dockerEnv: {
      GRAPH_TYPE: "gremlin",
      GRAPH_CONNECTION_URL: "https://from-env:8182",
      AWS_REGION: "eu-west-1",
    },
    configJson: {
      GRAPH_TYPE: "sparql",
      GRAPH_CONNECTION_URL: "https://from-config:8182",
      AWS_REGION: "us-west-2",
    },
    // config.json replaces the environment for every key it can hold.
    expected: servingConnection(
      proxiedConnection(
        { GRAPH_EXP_GRAPH_TYPE: "sparql", GRAPH_EXP_AWS_REGION: "us-west-2" },
        "https://from-config:8182",
      ),
    ),
  },
  {
    name: "-e GRAPH_CONNECTION_URL with config.json HTTPS true and no GRAPH_CONNECTION_URL",
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    // config.json replaces the environment for every key it can hold, even
    // one it leaves out, so there is no Default Connection.
    expected: standardTls,
  },
  {
    name: "-e USING_PROXY_SERVER=false with config.json GRAPH_CONNECTION_URL",
    dockerEnv: { USING_PROXY_SERVER: "false" },
    configJson: { GRAPH_CONNECTION_URL: clusterUrl },
    // config.json replaces the environment, so USING_PROXY_SERVER is unset
    // and GRAPH_CONNECTION_URL alone makes a proxied connection.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "-e GRAPH_EXP_FETCH_REQUEST_TIMEOUT and GRAPH_EXP_NODE_EXPANSION_LIMIT with GRAPH_CONNECTION_URL",
    dockerEnv: {
      GRAPH_CONNECTION_URL: clusterUrl,
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: "60000",
      GRAPH_EXP_NODE_EXPANSION_LIMIT: "500",
    },
    // Shape from #2291: the script never writes these two settings.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "config.json GRAPH_EXP_FETCH_REQUEST_TIMEOUT and GRAPH_EXP_NODE_EXPANSION_LIMIT with GRAPH_CONNECTION_URL",
    configJson: {
      GRAPH_CONNECTION_URL: clusterUrl,
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: 60000,
      GRAPH_EXP_NODE_EXPANSION_LIMIT: 500,
    },
    // Shape from #2291: the script never writes these two settings.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "-e IAM=True with GRAPH_CONNECTION_URL",
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl, IAM: "True" },
    // The script writes the IAM value as it is, so anything but a JSON
    // boolean makes the file invalid.
    expected: servingInvalidConnection(
      expect.stringContaining('"GRAPH_EXP_IAM":True,'),
    ),
  },
  {
    name: "a mounted defaultConnection.json",
    mountedDefaultConnection: {
      GRAPH_EXP_CONNECTION_URL: "https://mounted:8182",
      GRAPH_EXP_USING_PROXY_SERVER: true,
    },
    // No connection settings, so the mounted file is served as it is.
    expected: servingConnection({
      GRAPH_EXP_CONNECTION_URL: "https://mounted:8182",
      GRAPH_EXP_USING_PROXY_SERVER: true,
    }),
  },
  {
    name: "a mounted defaultConnection.json with -e GRAPH_CONNECTION_URL",
    mountedDefaultConnection: {
      GRAPH_EXP_CONNECTION_URL: "https://mounted:8182",
      GRAPH_EXP_USING_PROXY_SERVER: true,
    },
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl },
    // The script replaces the mounted file with the -e connection.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "config.json with // comments and a trailing comma",
    configJson: `{
  // Connection to my cluster
  "GRAPH_CONNECTION_URL": "${clusterUrl}",
  "IAM": true, // sign requests
  "SERVICE_TYPE": "neptune-db",
  "AWS_REGION": "us-west-2",
  "GRAPH_TYPE": "gremlin",
  "PROXY_SERVER_HTTPS_CONNECTION": true,
  "GRAPH_EXP_FETCH_REQUEST_TIMEOUT": 240000,
  "GRAPH_EXP_NODE_EXPANSION_LIMIT": 500,
}
`,
    // process-environment.sh greps the text rather than parsing it, so a
    // comment or a trailing comma doesn't matter. It never writes the two
    // #2291 settings.
    expected: servingConnection(
      proxiedConnection({
        GRAPH_EXP_GRAPH_TYPE: "gremlin",
        GRAPH_EXP_IAM: true,
        GRAPH_EXP_AWS_REGION: "us-west-2",
      }),
    ),
  },
  {
    name: "config.json with CRLF line endings",
    configJson: JSON.stringify(
      {
        GRAPH_CONNECTION_URL: clusterUrl,
        PROXY_SERVER_HTTPS_CONNECTION: false,
      },
      null,
      2,
    ).replaceAll("\n", "\r\n"),
    // The carriage returns sit outside the values the script reads.
    expected: servingConnection(proxiedConnection(), http),
  },
  {
    name: 'config.json HTTPS "True"',
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: "True" },
    // Like -e PROXY_SERVER_HTTPS_CONNECTION=TRUE, only an exact "true" makes
    // the entrypoint generate certificates, so the server fails on the
    // missing certificates.
    expected: missingCertificates,
  },
  {
    name: "config.json IAM null with GRAPH_CONNECTION_URL",
    configJson: { GRAPH_CONNECTION_URL: clusterUrl, IAM: null },
    // The script writes the IAM value as it is.
    expected: servingConnection(proxiedConnection({ GRAPH_EXP_IAM: null })),
  },
  {
    name: "config.json with PROXY_SERVER_HTTPS_CONNECTION false commented out",
    configJson: `{
  // "PROXY_SERVER_HTTPS_CONNECTION": false,
}
`,
    // The script greps the text, comments included, so the key takes effect.
    expected: standardHttp,
  },
  {
    name: "an .env from an HTTP container after three starts",
    existingEnvFile: legacyStartupBlock(httpContainerBlock).repeat(3),
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    // The blocks only restate what the entrypoint reads from the environment,
    // so they change nothing.
    expected: standardHttp,
  },
  {
    name: "an .env from a notebook container after two starts with the 3.3.0 port line",
    existingEnvFile: legacyStartupBlock({
      ...notebookContainerBlock,
      port: "PROXY_SERVER_HTTP_PORT",
    }).repeat(2),
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    // The port line is what v3.3.0 wrote. It matches the PROXY_SERVER_PORT
    // line the script writes now, so the server starts without a warning.
    expected: served(notebook, {
      environment: { PROXY_SERVER_HTTP_PORT: 9250 },
    }),
  },
  {
    name: "an .env from a notebook container after two starts with the PROXY_SERVER_PORT line",
    existingEnvFile: legacyStartupBlock({
      ...notebookContainerBlock,
      port: "PROXY_SERVER_PORT",
    }).repeat(2),
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    // The blocks restate the preset.
    expected: notebookPreset,
  },
  {
    name: "an .env from a notebook container after two starts, started without -e",
    existingEnvFile: legacyStartupBlock({
      ...notebookContainerBlock,
      port: "PROXY_SERVER_PORT",
    }).repeat(2),
    // The script appends a block without the preset. The entrypoint reads the
    // blocks' "false" lines first and skips generation, while the server reads
    // the appended "true" with the blocks' port and fails on the missing
    // certificates.
    expected: missingCertificates,
  },
  {
    name: "a tidied .env from an HTTP container started without -e or HOST",
    existingEnvFile: withoutBlankLines(
      legacyStartupBlock(httpContainerBlock).repeat(2),
    ),
    host: false,
    existingCertificates: "all",
    // An operator tidied the blocks a container run with
    // -e PROXY_SERVER_HTTPS_CONNECTION=false left. The script appended a block
    // with the default, which the server read last, and the entrypoint, seeing
    // several lines, kept the certificates and logged that SSL is disabled.
    expected: served(https, {
      certificatesGenerated: false,
      httpsNotice: httpsOffNotice,
    }),
  },
  {
    name: "a tidied .env from a notebook container with the 3.3.0 port line",
    existingEnvFile: withoutBlankLines(
      legacyStartupBlock({
        ...notebookContainerBlock,
        port: "PROXY_SERVER_HTTP_PORT",
      }).repeat(2),
    ),
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    // The blocks restate the preset, and the old port line matches its port.
    expected: served(notebook, {
      environment: { PROXY_SERVER_HTTP_PORT: 9250 },
    }),
  },
  {
    name: "the #2504 .env: a user's PROXY_SERVER_HTTPS_CONNECTION=false followed by one block",
    existingEnvFile: `PROXY_SERVER_HTTPS_CONNECTION=false\n${legacyStartupBlock(httpsContainerBlock)}`,
    // The operator's line comes first, and the script appends a "true"
    // default after it, which the server reads while the entrypoint reads
    // "false".
    expected: missingCertificates,
  },
  {
    name: "an .env with an HTTP block, an operator line, and two HTTPS blocks, without HOST",
    existingEnvFile: `LOG_STYLE=default\n${legacyStartupBlock(httpContainerBlock)}LOG_LEVEL=debug\n${legacyStartupBlock(httpsContainerBlock).repeat(2)}`,
    host: false,
    existingCertificates: "all",
    // The script appended the current value after every earlier block, so the
    // server read the newest "true" while the entrypoint, seeing several
    // lines, left the existing certificates alone and logged that SSL is
    // disabled.
    expected: served(https, {
      environment: { LOG_LEVEL: "debug" },
      certificatesGenerated: false,
      httpsNotice: httpsOffNotice,
    }),
  },
  {
    name: "an .env with an HTTP block, a blank line, and two HTTPS blocks, without HOST",
    existingEnvFile: `LOG_STYLE=default\n${legacyStartupBlock(httpContainerBlock)}\n${legacyStartupBlock(httpsContainerBlock).repeat(2)}`,
    host: false,
    existingCertificates: "all",
    // The server reads the newest "true" while the entrypoint, seeing several
    // lines, leaves the existing certificates alone and logs that SSL is
    // disabled.
    expected: served(https, {
      certificatesGenerated: false,
      httpsNotice: httpsOffNotice,
    }),
  },
  {
    name: "an .env from an HTTPS container in a new container",
    existingEnvFile: legacyStartupBlock(httpsContainerBlock),
    // The block's "true" and the appended "true" read back as "true\ntrue",
    // so the entrypoint skips generation and the server fails on the missing
    // certificates.
    expected: missingCertificates,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with PROXY_SERVER_PORT and LOG_STYLE in .env.local",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    existingEnvLocalFile: "PROXY_SERVER_PORT=8082\nLOG_STYLE=default\n",
    // dotenv reads .env.local first and the preset's lines sit in .env, so
    // the operator's .env.local beats the preset.
    expected: served(notebook, {
      environment: { PROXY_SERVER_PORT: 8082, LOG_STYLE: "default" },
      listener: { protocol: "http", port: 8082 },
    }),
  },
  {
    name: "config.json HTTPS false with HTTPS true in .env.local",
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    existingEnvLocalFile: "PROXY_SERVER_HTTPS_CONNECTION=true\n",
    // The server reads .env.local before the config.json value the script
    // appends to .env, but the entrypoint decides certificates from .env
    // alone, so the server fails on the missing certificates.
    expected: missingCertificates,
  },
  {
    name: "config.json HTTPS true with HTTPS false in .env.local",
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    existingEnvLocalFile: "PROXY_SERVER_HTTPS_CONNECTION=false\n",
    // The entrypoint generates a certificate from the .env line and then the
    // server serves HTTP from the .env.local line.
    expected: served(http, {
      certificatesGenerated: true,
      httpsNotice: undefined,
    }),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with HTTPS true in .env.local",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    existingEnvLocalFile: "PROXY_SERVER_HTTPS_CONNECTION=true\n",
    // The server reads .env.local first and rejects the preset with HTTPS on.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with HTTPS false in .env.local",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    existingEnvLocalFile: "PROXY_SERVER_HTTPS_CONNECTION=false\n",
    // .env.local's HTTPS off matches the preset.
    expected: notebookPreset,
  },
  {
    name: "a duplicated LOG_STYLE in .env",
    existingEnvFile: "LOG_STYLE=default\nLOG_STYLE=cloudwatch\n",
    // dotenv keeps the last line.
    expected: served(https, { environment: { LOG_STYLE: "cloudwatch" } }),
  },
  {
    name: "a wide .env with every server setting",
    host: false,
    existingCertificates: "all",
    existingEnvFile: {
      HOST: "graph.example.com",
      PROXY_SERVER_LISTEN_ADDRESS: "::",
      PROXY_SERVER_PORT: "8443",
      LOG_LEVEL: "debug",
      LOG_STYLE: "cloudwatch",
      PROXY_SERVER_CORS_ORIGIN: "https://app.example.com",
      PROXY_SERVER_ALLOWED_DB_ORIGINS: "https://db.example.com:8182",
    },
    // The server reads every setting from .env. HOST there doesn't reach
    // setup-ssl.sh, which reuses the existing certificates.
    expected: served(https, {
      environment: {
        HOST: "graph.example.com",
        PROXY_SERVER_LISTEN_ADDRESS: "::",
        PROXY_SERVER_PORT: 8443,
        LOG_LEVEL: "debug",
        LOG_STYLE: "cloudwatch",
        PROXY_SERVER_CORS_ORIGIN: ["https://app.example.com"],
        PROXY_SERVER_ALLOWED_DB_ORIGINS: new Set([
          "https://db.example.com:8182",
        ]),
      },
      listener: { protocol: "https", port: 8443 },
      certificatesGenerated: false,
    }),
  },
  {
    name: "Default Connection settings in .env",
    existingEnvFile: connectionSettings,
    // The script reads connection settings from the environment and
    // config.json only.
    expected: standardTls,
  },
  {
    name: "Default Connection settings in .env.local",
    existingEnvLocalFile: connectionSettings,
    // The script reads connection settings from the environment and
    // config.json only.
    expected: standardTls,
  },
  {
    name: "GRAPH_CONNECTION_URL in .env and config.json",
    existingEnvFile: { GRAPH_CONNECTION_URL: "https://from-dotenv:8182" },
    configJson: { GRAPH_CONNECTION_URL: "https://from-config:8182" },
    // The script reads connection settings from config.json, never .env.
    expected: servingConnection(
      proxiedConnection({}, "https://from-config:8182"),
    ),
  },
  {
    name: "GRAPH_CONNECTION_URL in .env.local and config.json",
    existingEnvLocalFile: "GRAPH_CONNECTION_URL=https://from-local:8182\n",
    configJson: { GRAPH_CONNECTION_URL: "https://from-config:8182" },
    // The script reads connection settings from config.json, never
    // .env.local.
    expected: servingConnection(
      proxiedConnection({}, "https://from-config:8182"),
    ),
  },
  {
    name: "the image's own .env with -e GRAPH_CONNECTION_URL",
    existingEnvFile: imageEnvFile,
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl },
    // The script ignores the connection settings in .env.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "-e GRAPH_CONNECTION_URL= with config.json GRAPH_CONNECTION_URL",
    dockerEnv: { GRAPH_CONNECTION_URL: "" },
    configJson: { GRAPH_CONNECTION_URL: clusterUrl },
    // config.json replaces the environment.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "-e GRAPH_CONNECTION_URL with an empty config.json GRAPH_CONNECTION_URL",
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl },
    configJson: { GRAPH_CONNECTION_URL: "" },
    // config.json replaces the environment, and its empty URL makes no
    // Default Connection.
    expected: standardTls,
  },
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION= with config.json HTTPS false",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    // dotenv never overrides a variable already in the environment, so the
    // server reads the empty value and its schema rejects it.
    expected: parseFailureAt("PROXY_SERVER_HTTPS_CONNECTION"),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=false with config.json NEPTUNE_NOTEBOOK true",
    dockerEnv: { NEPTUNE_NOTEBOOK: "false" },
    configJson: { NEPTUNE_NOTEBOOK: true },
    // config.json replaces -e NEPTUNE_NOTEBOOK, and the entrypoint passes the
    // .env value to the server.
    expected: notebookPreset,
  },
  {
    name: "-e PUBLIC_OR_PROXY_ENDPOINT",
    dockerEnv: { PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182" },
    // Earlier versions treated an unset USING_PROXY_SERVER as false, so the
    // legacy endpoint alone makes a direct connection.
    expected: servingConnection({
      GRAPH_EXP_CONNECTION_URL: "https://endpoint:8182",
      GRAPH_EXP_USING_PROXY_SERVER: false,
    }),
  },
  {
    name: "-e GRAPH_CONNECTION_URL with a .env PUBLIC_OR_PROXY_ENDPOINT",
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl },
    existingEnvFile: { PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182" },
    // The script reads connection settings from the environment and
    // config.json only.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "-e PUBLIC_OR_PROXY_ENDPOINT and GRAPH_CONNECTION_URL with IAM, region, and service type",
    dockerEnv: {
      PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      GRAPH_CONNECTION_URL: clusterUrl,
      IAM: "true",
      AWS_REGION: "us-west-2",
      SERVICE_TYPE: "neptune-db",
    },
    // An unset USING_PROXY_SERVER with the legacy endpoint stays direct, and
    // a direct connection drops IAM, region, and service type because the
    // browser sends its requests and nothing would sign them.
    expected: servingConnection({
      GRAPH_EXP_CONNECTION_URL: "https://endpoint:8182",
      GRAPH_EXP_USING_PROXY_SERVER: false,
    }),
  },
  {
    name: "-e USING_PROXY_SERVER=TRUE with both URLs",
    dockerEnv: {
      USING_PROXY_SERVER: "TRUE",
      PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      GRAPH_CONNECTION_URL: clusterUrl,
    },
    // USING_PROXY_SERVER is read without regard to case, and a proxied
    // connection goes to GRAPH_CONNECTION_URL.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "the SageMaker lifecycle script's environment",
    dockerEnv: {
      LOG_LEVEL: "info",
      HOST: "127.0.0.1",
      PUBLIC_OR_PROXY_ENDPOINT: "https://notebook.sagemaker.aws/proxy/9250",
      GRAPH_CONNECTION_URL: "https://neptune-cluster:8182",
      PROXY_SERVER_ALLOWED_DB_ORIGINS: "https://neptune-cluster:8182",
      USING_PROXY_SERVER: "true",
      IAM: "true",
      AWS_REGION: "us-west-2",
      SERVICE_TYPE: "neptune-db",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      NEPTUNE_NOTEBOOK: "true",
    },
    // The variables install-graph-explorer-lc.sh passes to `docker run`: the
    // preset, and a proxied IAM connection to the cluster.
    expected: servingConnection(
      {
        GRAPH_EXP_CONNECTION_URL: "https://neptune-cluster:8182",
        GRAPH_EXP_SERVICE_TYPE: "neptune-db",
        GRAPH_EXP_IAM: true,
        GRAPH_EXP_AWS_REGION: "us-west-2",
        GRAPH_EXP_USING_PROXY_SERVER: true,
      },
      {
        ...notebook,
        environment: {
          ...notebook.environment,
          HOST: "127.0.0.1",
          PROXY_SERVER_ALLOWED_DB_ORIGINS: new Set([
            "https://neptune-cluster:8182",
          ]),
        },
      },
    ),
  },
  {
    name: "-e SERVICE_TYPE=neptune-graph with GRAPH_CONNECTION_URL",
    dockerEnv: {
      SERVICE_TYPE: "neptune-graph",
      GRAPH_CONNECTION_URL: clusterUrl,
    },
    // Neptune Analytics speaks openCypher, so it's the graph type when
    // GRAPH_TYPE is unset.
    expected: servingConnection(
      proxiedConnection({
        GRAPH_EXP_GRAPH_TYPE: "openCypher",
        GRAPH_EXP_SERVICE_TYPE: "neptune-graph",
      }),
    ),
  },
  ...["TRUE", "FALSE", "yes"].map((value): Deployment => ({
    name: `-e IAM=${value} with GRAPH_CONNECTION_URL`,
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl, IAM: value },
    // The script writes the IAM value as it is, so anything but a JSON
    // boolean makes the file invalid.
    expected: servingInvalidConnection(
      expect.stringContaining(`"GRAPH_EXP_IAM":${value},`),
    ),
  })),
  {
    name: "config.json IAM 1 with GRAPH_CONNECTION_URL",
    configJson: { GRAPH_CONNECTION_URL: clusterUrl, IAM: 1 },
    // The script writes the IAM value as it is.
    expected: servingConnection(proxiedConnection({ GRAPH_EXP_IAM: 1 })),
  },
  {
    name: 'config.json IAM "true" with GRAPH_CONNECTION_URL',
    configJson: { GRAPH_CONNECTION_URL: clusterUrl, IAM: "true" },
    // The script drops the quotes, so the string reads as the boolean.
    expected: servingConnection(proxiedConnection({ GRAPH_EXP_IAM: true })),
  },
  {
    name: "-e GRAPH_EXP_NODE_EXPANSION_LIMIT=-5 with GRAPH_CONNECTION_URL",
    dockerEnv: {
      GRAPH_CONNECTION_URL: clusterUrl,
      GRAPH_EXP_NODE_EXPANSION_LIMIT: "-5",
    },
    // The script never writes the expansion limit.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "a duplicated PROXY_SERVER_PORT in .env.local",
    existingEnvLocalFile: "PROXY_SERVER_PORT=8081\nPROXY_SERVER_PORT=8082\n",
    // dotenv keeps the last line.
    expected: served(https, {
      environment: { PROXY_SERVER_PORT: 8082 },
      listener: { protocol: "https", port: 8082 },
    }),
  },
  {
    name: "config.json with a byte-order mark",
    configJson: "﻿" + JSON.stringify({ PROXY_SERVER_HTTPS_CONNECTION: false }),
    // The script greps the text, so the mark before the brace doesn't matter.
    expected: standardHttp,
  },
  {
    name: "config.json with a space before a key's colon",
    configJson: '{ "PROXY_SERVER_HTTPS_CONNECTION" : false }',
    // The script's grep expects the colon right after the key, so it misses
    // the key and HTTPS defaults to on.
    expected: standardTls,
  },
  {
    name: "an empty config.json",
    configJson: "",
    // The script finds no keys, so HTTPS defaults to on.
    expected: standardTls,
  },
  {
    name: "a config.json holding only a comment",
    configJson: "// nothing yet\n",
    // The script finds no keys, so HTTPS defaults to on.
    expected: standardTls,
  },
  {
    name: "a config.json that isn't JSON",
    configJson: '{ "PROXY_SERVER_HTTPS_CONNECTION": false',
    // The script greps the text, so the missing brace doesn't matter.
    expected: standardHttp,
  },
  {
    name: "config.json setting PROXY_SERVER_HTTPS_CONNECTION twice",
    configJson: `{
  "PROXY_SERVER_HTTPS_CONNECTION": false,
  "PROXY_SERVER_HTTPS_CONNECTION": true
}
`,
    // The script greps both values and joins them into "falsetrue", which the
    // server's schema rejects.
    expected: parseFailureAt("PROXY_SERVER_HTTPS_CONNECTION"),
  },
  {
    name: "the #2504 .env with blank and whitespace-only lines between the block's keys",
    existingEnvFile:
      "PROXY_SERVER_HTTPS_CONNECTION=false\n" +
      "NEPTUNE_NOTEBOOK=false\n\n\n  \nPROXY_SERVER_HTTPS_CONNECTION=true\n\t\nGRAPH_EXP_HTTPS_CONNECTION=true\n",
    // The entrypoint reads the operator's "false" first while the server reads
    // the appended "true", so it fails on the missing certificates.
    expected: missingCertificates,
  },
  {
    name: "a tidied .env from an HTTP container started without -e, with HOST",
    existingEnvFile: withoutBlankLines(
      legacyStartupBlock(httpContainerBlock).repeat(2),
    ),
    // The entrypoint reads the tidied "false" lines first while the server
    // reads the appended "true", so it fails on the missing certificates.
    expected: missingCertificates,
  },
];
