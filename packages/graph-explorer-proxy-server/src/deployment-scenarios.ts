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
  "To run under the notebook preset, set PROXY_SERVER_HTTPS_CONNECTION to " +
  "false, or remove it, where it is set to true: an -e flag, .env.local, " +
  "or config.json. An -e flag overrides the other two. To run with TLS, " +
  "set NEPTUNE_NOTEBOOK to false, or remove it, where it is set to true: " +
  "an -e flag or config.json. An -e flag overrides config.json. See " +
  "https://aws.github.io/graph-explorer/references/configuration/#precedence";

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

/** Expects the stop for a config.json without settings. */
const configJsonEmpty: StartupOutcome = {
  failed: expect.stringContaining(
    "config.json is empty or holds only comments",
  ),
};

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
  "HTTPS is off, set by PROXY_SERVER_HTTPS_CONNECTION in the environment";

/** The notice for HTTPS turned off by `file`, which sits in a temp folder. */
function httpsOffIn(file: "config.json" | ".env" | ".env.local"): string {
  return expect.stringMatching(
    new RegExp(
      `^HTTPS is off, set by PROXY_SERVER_HTTPS_CONNECTION in /.+/${file.replaceAll(".", "\\.")}$`,
    ),
  );
}

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
    // #2504: one value decides HTTPS and the certificate, so TRUE generates
    // one. Before, only an exact "true" generated a certificate, and the
    // server failed on the missing certificates.
    expected: standardTls,
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
    // config.json turns HTTPS off, and the start says so.
    expected: served(http, { httpsNotice: httpsOffIn("config.json") }),
  },
  {
    name: "config.json HTTPS true and -e HTTPS false",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    // One precedence order: -e beats config.json for both the server and the
    // certificate, so it serves HTTP without generating one.
    expected: standardHttp,
  },
  {
    name: "config.json HTTPS false and -e HTTPS true",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    // One precedence order: -e beats config.json for both the server and the
    // certificate, so it generates one and serves TLS.
    expected: standardTls,
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
    // Notebook containers set both port variables while older images ignored
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
    // An empty -e value for a setting config.json can hold counts as unset,
    // so HTTPS defaults to on. Before, the server read the empty value and
    // its schema rejected it.
    expected: standardTls,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json HTTPS true and no NEPTUNE_NOTEBOOK key",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    // One precedence order: config.json fills only what -e leaves unset, so
    // -e applies the preset, which refuses config.json's HTTPS request.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and a config.json without the key",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {},
    // One precedence order: config.json fills only what -e leaves unset, so
    // -e applies the preset.
    expected: notebookPreset,
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
    // One precedence order: -e beats config.json, so it applies the preset.
    expected: notebookPreset,
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
    // A restart meets the same conflict.
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
    // The container records the certificate it generated, so a restart
    // reuses it and keeps serving TLS on the certificate generated at first
    // start. Before, the restart reached the same outcome by logging that SSL
    // was disabled and skipping generation.
    expected: [standardTls, served(https, { certificatesGenerated: false })],
  },
  {
    name: "a read-only configuration folder",
    readOnly: "configFolder",
    // The startup writes nothing to the configuration folder, so a read-only
    // mount starts. Earlier versions wrote .env at every start and refused.
    expected: standardTls,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with a read-only configuration folder",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    readOnly: "configFolder",
    // The startup writes nothing to the configuration folder, so a read-only
    // mount starts. Earlier versions wrote .env at every start and refused.
    expected: notebookPreset,
  },
  {
    name: "LOG_LEVEL=debug in a read-only .env",
    existingEnvFile: { LOG_LEVEL: "debug" },
    readOnly: ".env",
    // The startup writes nothing to the configuration folder, so a read-only
    // .env starts. Earlier versions wrote .env at every start and refused.
    expected: served(https, { environment: { LOG_LEVEL: "debug" } }),
  },
  {
    name: "-e PUBLIC_OR_PROXY_ENDPOINT with a read-only defaultConnection.json",
    dockerEnv: { PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182" },
    readOnly: "defaultConnection.json",
    // A legacy direct connection resolves to PUBLIC_OR_PROXY_ENDPOINT. The
    // startup serves it from memory, so a read-only defaultConnection.json
    // starts. Earlier versions wrote the file and refused.
    expected: servingConnection({
      GRAPH_EXP_CONNECTION_URL: "https://endpoint:8182",
      GRAPH_EXP_USING_PROXY_SERVER: false,
    }),
  },
  {
    name: "-e GRAPH_CONNECTION_URL with a read-only defaultConnection.json",
    dockerEnv: { GRAPH_CONNECTION_URL: "https://endpoint:8182" },
    readOnly: "defaultConnection.json",
    // The startup serves the Default Connection from memory, so a read-only
    // defaultConnection.json starts. Earlier versions wrote the file and
    // refused.
    expected: servingConnection(proxiedConnection({}, "https://endpoint:8182")),
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
    // #2504: the .env line takes effect, so it serves HTTP. Before, the "true"
    // default appended after it won in the server while the certificate was
    // skipped, and the server failed on the missing certificates.
    expected: served(http, { httpsNotice: httpsOffIn(".env") }),
  },
  {
    name: "PROXY_SERVER_HTTPS_CONNECTION=true in a mounted .env",
    existingEnvFile: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    // #2504: one value decides HTTPS and the certificate, so it generates one.
    // Before, the mounted and appended lines read back as "true\ntrue", which
    // skipped the certificate.
    expected: standardTls,
  },
  {
    name: "an operator .env with PROXY_SERVER_HTTPS_CONNECTION=false and all five certificate files present",
    existingEnvFile: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    existingCertificates: "all",
    // #2504: the .env line takes effect, so it serves HTTP. Before, the
    // server read the "true" that earlier versions appended and served TLS on
    // the files already in cert-info.
    expected: served(http, { httpsNotice: httpsOffIn(".env") }),
  },
  {
    name: "no HOST and no certificate files",
    host: false,
    // Generating a certificate needs HOST, and there are no files to reuse.
    expected: noCertificateFiles,
  },
  {
    name: "no HOST with all five certificate files in cert-info",
    host: false,
    existingCertificates: "all",
    // Without HOST, the start reuses the files it finds.
    expected: served(https, { certificatesGenerated: false }),
  },
  {
    name: "no HOST with only server.key and server.crt in cert-info",
    host: false,
    existingCertificates: "server-only",
    // Without HOST, the start reuses only a complete set of files.
    expected: noCertificateFiles,
  },
  {
    name: "a new container reusing the configuration folder",
    secondStart: "new-container",
    // The startup writes nothing to the configuration folder, so the first
    // container leaves no lines for the next, which generates its own
    // certificate. Earlier versions' first start left a block in .env, so the
    // next container read "true\ntrue" and skipped generation.
    expected: [standardTls, standardTls],
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
    // One precedence order: -e beats config.json for each setting.
    expected: servingConnection(
      proxiedConnection(
        { GRAPH_EXP_GRAPH_TYPE: "gremlin", GRAPH_EXP_AWS_REGION: "eu-west-1" },
        "https://from-env:8182",
      ),
    ),
  },
  {
    name: "-e GRAPH_CONNECTION_URL with config.json HTTPS true and no GRAPH_CONNECTION_URL",
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    // One precedence order: a setting config.json leaves out comes from -e.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "-e USING_PROXY_SERVER=false with config.json GRAPH_CONNECTION_URL",
    dockerEnv: { USING_PROXY_SERVER: "false" },
    configJson: { GRAPH_CONNECTION_URL: clusterUrl },
    // One precedence order: the settings merge one at a time, and
    // USING_PROXY_SERVER=false from -e makes the connection direct.
    expected: servingConnection({
      GRAPH_EXP_CONNECTION_URL: clusterUrl,
      GRAPH_EXP_USING_PROXY_SERVER: false,
    }),
  },
  {
    name: "-e GRAPH_EXP_FETCH_REQUEST_TIMEOUT and GRAPH_EXP_NODE_EXPANSION_LIMIT with GRAPH_CONNECTION_URL",
    dockerEnv: {
      GRAPH_CONNECTION_URL: clusterUrl,
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: "60000",
      GRAPH_EXP_NODE_EXPANSION_LIMIT: "500",
    },
    // Shape from #2291: earlier versions never wrote these two settings.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "config.json GRAPH_EXP_FETCH_REQUEST_TIMEOUT and GRAPH_EXP_NODE_EXPANSION_LIMIT with GRAPH_CONNECTION_URL",
    configJson: {
      GRAPH_CONNECTION_URL: clusterUrl,
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: 60000,
      GRAPH_EXP_NODE_EXPANSION_LIMIT: 500,
    },
    // Shape from #2291: earlier versions never wrote these two settings.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "-e IAM=True with GRAPH_CONNECTION_URL",
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl, IAM: "True" },
    // Earlier versions wrote the IAM value as it was, so anything but a JSON
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
    // The -e connection is served in place of the mounted file.
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
    // Earlier versions grepped the text rather than parsing it, so a comment
    // or a trailing comma didn't matter. They never wrote the two #2291
    // settings.
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
    // The carriage returns sit between the JSON's tokens, so config.json's
    // values apply, and the start says it turned HTTPS off.
    expected: servingConnection(proxiedConnection(), {
      ...http,
      httpsNotice: httpsOffIn("config.json"),
    }),
  },
  {
    name: 'config.json HTTPS "True"',
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: "True" },
    // #2504: one value decides HTTPS and the certificate, so "True" generates
    // one. Before, only an exact "true" generated a certificate.
    expected: standardTls,
  },
  {
    name: "config.json IAM null with GRAPH_CONNECTION_URL",
    configJson: { GRAPH_CONNECTION_URL: clusterUrl, IAM: null },
    // Earlier versions wrote the IAM value as it was.
    expected: servingConnection(proxiedConnection({ GRAPH_EXP_IAM: null })),
  },
  {
    name: "config.json with PROXY_SERVER_HTTPS_CONNECTION false commented out",
    configJson: `{
  // "PROXY_SERVER_HTTPS_CONNECTION": false,
}
`,
    // config.json is read as JSON, so a key in a comment is no setting and
    // HTTPS defaults to on. Earlier versions grepped the text, comments
    // included.
    expected: standardTls,
  },
  {
    name: "an .env from an HTTP container after three starts",
    existingEnvFile: legacyStartupBlock(httpContainerBlock).repeat(3),
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    // The blocks are ignored, and they only restated the environment, so
    // they change nothing.
    expected: standardHttp,
  },
  {
    name: "an .env from a notebook container after two starts with the 3.3.0 port line",
    existingEnvFile: legacyStartupBlock({
      ...notebookContainerBlock,
      port: "PROXY_SERVER_HTTP_PORT",
    }).repeat(2),
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    // #2504: the blocks are ignored, the old port line with them, and the
    // preset applies as the environment asks.
    expected: notebookPreset,
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
    // #2504: the blocks are ignored, so HTTPS defaults to on and HOST
    // generates the certificate. Before, the server read the "true" that
    // earlier versions appended with the blocks' port while the certificate was
    // skipped, and failed on the missing certificates.
    expected: standardTls,
  },
  {
    name: "a tidied .env from an HTTP container started without -e or HOST",
    existingEnvFile: withoutBlankLines(
      legacyStartupBlock(httpContainerBlock).repeat(2),
    ),
    host: false,
    existingCertificates: "all",
    // An operator tidied the blocks a container run with
    // -e PROXY_SERVER_HTTPS_CONNECTION=false left. They are ignored, so HTTPS
    // defaults to on and the existing certificates are reused, as before.
    expected: served(https, { certificatesGenerated: false }),
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
    // #2504: tidied blocks are ignored too, the old port line with them, and
    // the preset applies as the environment asks.
    expected: notebookPreset,
  },
  {
    name: "the #2504 .env: a user's PROXY_SERVER_HTTPS_CONNECTION=false followed by one block",
    existingEnvFile: `PROXY_SERVER_HTTPS_CONNECTION=false\n${legacyStartupBlock(httpsContainerBlock)}`,
    // #2504: the block is ignored, so the operator's false serves HTTP.
    // Before, the server read a "true" appended after it while the
    // certificate was skipped.
    expected: served(http, { httpsNotice: httpsOffIn(".env") }),
  },
  {
    name: "an .env with an HTTP block, an operator line, and two HTTPS blocks, without HOST",
    existingEnvFile: `LOG_STYLE=default\n${legacyStartupBlock(httpContainerBlock)}LOG_LEVEL=debug\n${legacyStartupBlock(httpsContainerBlock).repeat(2)}`,
    host: false,
    existingCertificates: "all",
    // The blocks are ignored and the operator's lines stay, so HTTPS defaults
    // to on and the existing certificates are reused, as before.
    expected: served(https, {
      environment: { LOG_LEVEL: "debug" },
      certificatesGenerated: false,
    }),
  },
  {
    name: "an .env with an HTTP block, a blank line, and two HTTPS blocks, without HOST",
    existingEnvFile: `LOG_STYLE=default\n${legacyStartupBlock(httpContainerBlock)}\n${legacyStartupBlock(httpsContainerBlock).repeat(2)}`,
    host: false,
    existingCertificates: "all",
    // The blocks are ignored, so HTTPS defaults to on and the existing
    // certificates are reused, as before.
    expected: served(https, { certificatesGenerated: false }),
  },
  {
    name: "an .env from an HTTPS container in a new container",
    existingEnvFile: legacyStartupBlock(httpsContainerBlock),
    // #2504: the block is ignored, and a new container generates its own
    // certificate. Before, the block and the appended line read back as
    // "true\ntrue", which skipped the certificate.
    expected: standardTls,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with PROXY_SERVER_PORT and LOG_STYLE in .env.local",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    existingEnvLocalFile: "PROXY_SERVER_PORT=8082\nLOG_STYLE=default\n",
    // .env.local beats the preset, as it did when the preset's lines sat in
    // .env.
    expected: served(notebook, {
      environment: { PROXY_SERVER_PORT: 8082, LOG_STYLE: "default" },
      listener: { protocol: "http", port: 8082 },
    }),
  },
  {
    name: "config.json HTTPS false with HTTPS true in .env.local",
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    existingEnvLocalFile: "PROXY_SERVER_HTTPS_CONNECTION=true\n",
    // #2504: the value the server reads, from .env.local, also decides the
    // certificate, so it generates one. Before, the certificate followed
    // config.json alone.
    expected: standardTls,
  },
  {
    name: "config.json HTTPS true with HTTPS false in .env.local",
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    existingEnvLocalFile: "PROXY_SERVER_HTTPS_CONNECTION=false\n",
    // #2504: the value the server reads, from .env.local, also decides the
    // certificate, so it serves HTTP without one. Before, the certificate
    // followed config.json alone.
    expected: served(http, { httpsNotice: httpsOffIn(".env.local") }),
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
    // Only one line can take effect, so startup stops and names both.
    expected: {
      failed: expect.stringMatching(
        /\/\.env sets LOG_STYLE more than once, on lines 1 and 2\. Keep one line for each key and remove the others\. Earlier versions used the last line\.$/,
      ),
    },
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
    // The server reads every setting from .env. HOST there doesn't decide
    // the certificate, so the existing files are reused.
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
    // As before, connection settings come from the environment and
    // config.json only.
    expected: standardTls,
  },
  {
    name: "Default Connection settings in .env.local",
    existingEnvLocalFile: connectionSettings,
    // As before, connection settings come from the environment and
    // config.json only.
    expected: standardTls,
  },
  {
    name: "GRAPH_CONNECTION_URL in .env and config.json",
    existingEnvFile: { GRAPH_CONNECTION_URL: "https://from-dotenv:8182" },
    configJson: { GRAPH_CONNECTION_URL: "https://from-config:8182" },
    // As before, connection settings come from config.json, never .env.
    expected: servingConnection(
      proxiedConnection({}, "https://from-config:8182"),
    ),
  },
  {
    name: "GRAPH_CONNECTION_URL in .env.local and config.json",
    existingEnvLocalFile: "GRAPH_CONNECTION_URL=https://from-local:8182\n",
    configJson: { GRAPH_CONNECTION_URL: "https://from-config:8182" },
    // As before, connection settings come from config.json, never
    // .env.local.
    expected: servingConnection(
      proxiedConnection({}, "https://from-config:8182"),
    ),
  },
  {
    name: "the image's own .env with -e GRAPH_CONNECTION_URL",
    existingEnvFile: imageEnvFile,
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl },
    // As before, connection settings in .env are ignored.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "-e GRAPH_CONNECTION_URL= with config.json GRAPH_CONNECTION_URL",
    dockerEnv: { GRAPH_CONNECTION_URL: "" },
    configJson: { GRAPH_CONNECTION_URL: clusterUrl },
    // An empty -e value counts as unset, so config.json's URL applies.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "-e GRAPH_CONNECTION_URL with an empty config.json GRAPH_CONNECTION_URL",
    dockerEnv: { GRAPH_CONNECTION_URL: clusterUrl },
    configJson: { GRAPH_CONNECTION_URL: "" },
    // -e beats config.json, so the -e URL applies.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION= with config.json HTTPS false",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    // An empty -e value for a setting config.json can hold counts as unset,
    // so config.json's false applies. Before, the server read the empty value
    // and its schema rejected it.
    expected: served(http, { httpsNotice: httpsOffIn("config.json") }),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=false with config.json NEPTUNE_NOTEBOOK true",
    dockerEnv: { NEPTUNE_NOTEBOOK: "false" },
    configJson: { NEPTUNE_NOTEBOOK: true },
    // One precedence order: -e beats config.json, so the preset is off and it
    // serves TLS.
    expected: standardTls,
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
    // As before, connection settings come from the environment and
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
    // Earlier versions wrote the IAM value as it was, so anything but a JSON
    // boolean makes the file invalid.
    expected: servingInvalidConnection(
      expect.stringContaining(`"GRAPH_EXP_IAM":${value},`),
    ),
  })),
  {
    name: "config.json IAM 1 with GRAPH_CONNECTION_URL",
    configJson: { GRAPH_CONNECTION_URL: clusterUrl, IAM: 1 },
    // Earlier versions wrote the IAM value as it was.
    expected: servingConnection(proxiedConnection({ GRAPH_EXP_IAM: 1 })),
  },
  {
    name: 'config.json IAM "true" with GRAPH_CONNECTION_URL',
    configJson: { GRAPH_CONNECTION_URL: clusterUrl, IAM: "true" },
    // A quoted "true" reads as the boolean, as it did when earlier versions
    // dropped the quotes.
    expected: servingConnection(proxiedConnection({ GRAPH_EXP_IAM: true })),
  },
  {
    name: "-e GRAPH_EXP_NODE_EXPANSION_LIMIT=-5 with GRAPH_CONNECTION_URL",
    dockerEnv: {
      GRAPH_CONNECTION_URL: clusterUrl,
      GRAPH_EXP_NODE_EXPANSION_LIMIT: "-5",
    },
    // Earlier versions never wrote the expansion limit.
    expected: servingConnection(proxiedConnection()),
  },
  {
    name: "a duplicated PROXY_SERVER_PORT in .env.local",
    existingEnvLocalFile: "PROXY_SERVER_PORT=8081\nPROXY_SERVER_PORT=8082\n",
    // Only one line can take effect, so startup stops and names both.
    expected: {
      failed: expect.stringMatching(
        /\/\.env\.local sets PROXY_SERVER_PORT more than once, on lines 1 and 2\. Keep one line for each key and remove the others\. Earlier versions used the last line\.$/,
      ),
    },
  },
  {
    name: "config.json with a byte-order mark",
    configJson: "﻿" + JSON.stringify({ PROXY_SERVER_HTTPS_CONNECTION: false }),
    // The parser skips the mark, so config.json's false applies, and the
    // start says so.
    expected: served(http, { httpsNotice: httpsOffIn("config.json") }),
  },
  {
    name: "config.json with a space before a key's colon",
    configJson: '{ "PROXY_SERVER_HTTPS_CONNECTION" : false }',
    // config.json is read as JSON, so the space doesn't hide the key. Earlier
    // versions grepped for the colon right after the key and missed it.
    expected: served(http, { httpsNotice: httpsOffIn("config.json") }),
  },
  {
    name: "an empty config.json",
    configJson: "",
    // config.json is read as JSON, so a file without settings stops startup
    // naming the file. Earlier versions found no keys and served TLS.
    expected: configJsonEmpty,
  },
  {
    name: "a config.json holding only a comment",
    configJson: "// nothing yet\n",
    // config.json is read as JSON, so a file without settings stops startup
    // naming the file. Earlier versions found no keys and served TLS.
    expected: configJsonEmpty,
  },
  {
    name: "a config.json that isn't JSON",
    configJson: '{ "PROXY_SERVER_HTTPS_CONNECTION": false',
    // config.json is read as JSON, so text that isn't JSON stops startup
    // naming the file. Earlier versions grepped the text and served HTTP.
    expected: {
      failed: expect.stringContaining("config.json isn't valid JSON"),
    },
  },
  {
    name: "config.json setting PROXY_SERVER_HTTPS_CONNECTION twice",
    configJson: `{
  "PROXY_SERVER_HTTPS_CONNECTION": false,
  "PROXY_SERVER_HTTPS_CONNECTION": true
}
`,
    // Only one value can take effect, so startup stops and names both lines.
    expected: {
      failed: expect.stringMatching(
        /config\.json sets PROXY_SERVER_HTTPS_CONNECTION more than once, on lines 2 and 3\. Keep one entry for each setting and remove the others\.$/,
      ),
    },
  },
  {
    name: "the #2504 .env with blank and whitespace-only lines between the block's keys",
    existingEnvFile:
      "PROXY_SERVER_HTTPS_CONNECTION=false\n" +
      "NEPTUNE_NOTEBOOK=false\n\n\n  \nPROXY_SERVER_HTTPS_CONNECTION=true\n\t\nGRAPH_EXP_HTTPS_CONNECTION=true\n",
    // #2504: the block is ignored with its blank lines, so the operator's
    // false serves HTTP.
    expected: served(http, { httpsNotice: httpsOffIn(".env") }),
  },
  {
    name: "a tidied .env from an HTTP container started without -e, with HOST",
    existingEnvFile: withoutBlankLines(
      legacyStartupBlock(httpContainerBlock).repeat(2),
    ),
    // #2504: the tidied blocks are ignored, so their stale false doesn't turn
    // TLS off, and HOST generates the certificate.
    expected: standardTls,
  },
];
